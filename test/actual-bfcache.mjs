import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'
import { createRequire } from 'node:module'
import { once } from 'node:events'
import { join } from 'node:path'

assert.ok(process.env.ACTUAL_ROOT, 'Set ACTUAL_ROOT to the unchanged pinned production workspace')
const root = process.env.ACTUAL_ROOT
const revision = '87e33e49eb4d666c33e0c0f172faf340d1b7aa0a'
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), revision)
assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'packages/loot-core/src/platform/client', 'packages/desktop-client/src'], { cwd: root, encoding: 'utf8' }), '')
const { chromium, expect } = createRequire(join(root, 'package.json'))('@playwright/test')
const output = process.env.RESULT_DIR || 'test-results/actual-bfcache'
await mkdir(output, { recursive: true })
const receipt = { revision, node: process.version, platform: process.platform, cases: [], pass: false }
receipt.startSourceSha256 = createHash('sha256').update(await readFile(join(root, 'packages/loot-core/src/platform/client/browser-preload/start.ts'))).digest('hex')
const server = spawn(process.execPath, ['packages/desktop-client/bin/serve-build.mjs'], {
  cwd: root, env: { ...process.env, PORT: '3157' }, stdio: ['ignore', 'pipe', 'inherit'],
})
const proxy = createServer((request, response) => {
  if (['/__bfcache-control', '/__bfcache-away'].includes(request.url)) {
    response.writeHead(200, {
      'content-type': 'text/html',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-embedder-policy': 'require-corp',
    })
    response.end('<!doctype html><title>Navigation control</title><h1>Navigation control</h1>')
    return
  }
  const upstream = httpRequest(`http://localhost:3157${request.url}`, { method: request.method }, incoming => {
    response.writeHead(incoming.statusCode, incoming.headers)
    incoming.pipe(response)
  })
  upstream.on('error', error => { response.writeHead(502); response.end(error.message) })
  request.pipe(upstream)
})
// A different origin keeps Actual's service worker from serving its app shell.
const awayServer = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' })
  response.end('<!doctype html><title>Away</title><h1>Away from Actual</h1>')
})
let browser
const snapshot = page => page.evaluate(() => ({
  ...window.__bf,
  navigation: performance.getEntriesByType('navigation').map(entry => ({
    type: entry.type, notRestoredReasons: entry.notRestoredReasons?.toJSON(),
  })),
}))
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw new Error(`Server exited: ${code}`) }),
  ])
  proxy.listen(3158, '127.0.0.1')
  await once(proxy, 'listening')
  awayServer.listen(0, '127.0.0.1')
  await once(awayServer, 'listening')
  const awayURL = `http://127.0.0.1:${awayServer.address().port}/`
  const origin = 'http://127.0.0.1:3158'
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true,
    // Playwright disables BFCache by default; test native eligibility instead.
    ignoreDefaultArgs: ['--disable-back-forward-cache'],
  })
  receipt.browser = browser.version()
  for (const departing of ['control', 'leader', 'follower']) {
    const result = { departing, errors: [], lifecycle: [], notRestored: [], pass: false }
    receipt.cases.push(result)
    const context = await browser.newContext()
    try {
      await context.addInitScript(() => {
        window.__bf = { token: crypto.randomUUID(), events: [], protocol: [], role: null, pings: 0 }
        for (const type of ['pageshow', 'pagehide']) window.addEventListener(type, event => {
          const record = { type, persisted: event.persisted, url: location.href, token: window.__bf.token }
          window.__bf.events.push(record)
          console.log('BFCACHE_EVENT ' + JSON.stringify(record))
        })
        const NativeSharedWorker = window.SharedWorker
        window.SharedWorker = class extends NativeSharedWorker {
          constructor(...args) {
            super(...args)
            const post = this.port.postMessage.bind(this.port)
            this.port.postMessage = (message, ...args) => {
              if (['tab-closing', '__resume-tab'].includes(message.type)) {
                const record = { type: message.type, budgetId: message.budgetId, url: location.href, token: window.__bf.token }
                window.__bf.protocol.push(record)
                console.log('BFCACHE_EVENT ' + JSON.stringify(record))
              }
              return post(message, ...args)
            }
            this.port.addEventListener('message', event => {
              if (event.data.type === '__role-change') window.__bf.role = event.data.role
              if (event.data.type === '__heartbeat-ping') window.__bf.pings++
            })
          }
        }
      })
      const tab = async url => {
        const page = await context.newPage()
        page.on('pageerror', error => result.errors.push(error.message))
        page.on('console', message => {
          if (message.text().startsWith('BFCACHE_EVENT ')) result.lifecycle.push({
            tab: context.pages().indexOf(page), ...JSON.parse(message.text().slice('BFCACHE_EVENT '.length)),
          })
        })
        page.on('response', response => { if (response.status() >= 400) result.errors.push(`${response.status()} ${response.url()}`) })
        const cdp = await context.newCDPSession(page)
        await cdp.send('Page.enable')
        cdp.on('Page.backForwardCacheNotUsed', event => result.notRestored.push(event))
        await page.goto(url)
        return page
      }
      const leader = await tab(origin + (departing === 'control' ? '/__bfcache-control' : ''))
      let follower
      if (departing !== 'control') {
        await leader.getByRole('button', { name: 'Start budgeting' }).click()
        await expect(leader.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
        // The untouched upstream requires reopen before joining a new budget.
        await leader.reload()
        await expect(leader.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
        follower = await tab(origin)
        await expect(follower.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
        await expect.poll(() => follower.evaluate(() => window.__bf.role)).toBe('FOLLOWER')
        assert.equal(follower.workers().filter(worker => /browser-server/.test(worker.url())).length, 0)
        assert.equal(leader.workers().filter(worker => /browser-server/.test(worker.url())).length, 1)
      }
      const leaving = departing === 'follower' ? follower : leader
      const survivor = departing === 'follower' ? leader : follower
      result.before = await snapshot(leaving)
      const pingStart = survivor ? await survivor.evaluate(() => window.__bf.pings) : 0
      await leaving.goto(awayURL)
      await expect(leaving.getByRole('heading')).toHaveText('Away from Actual')
      assert.equal(await leaving.evaluate(() => window.__bf.role), null)
      if (survivor) {
        await expect.poll(() => survivor.evaluate(() => window.__bf.role), { timeout: 30000 }).toBe('LEADER')
        // Observe two real heartbeat rounds while the other document is away.
        await expect.poll(() => survivor.evaluate(() => window.__bf.pings), { timeout: 35000 }).toBeGreaterThanOrEqual(pingStart + 2)
      }
      await leaving.goBack({ waitUntil: 'commit' })
      await expect.poll(() => leaving.evaluate(() => window.__bf.events.some(event => event.type === 'pageshow'))).toBe(true)
      result.after = await snapshot(leaving)
      result.restored = result.after.token === result.before.token && result.after.events.some(event => event.type === 'pageshow' && event.persisted)
      if (departing !== 'control') {
        await expect(leaving.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
        await expect(leaving.getByTestId('account-balance')).toHaveText('0.00')
        await expect.poll(() => leaving.evaluate(() => window.__bf.role)).toBe('FOLLOWER')
        assert.equal(leaving.workers().filter(worker => /browser-server/.test(worker.url())).length, 0)
        assert.equal(survivor.workers().filter(worker => /browser-server/.test(worker.url())).length, 1)
        result.returnedRole = await leaving.evaluate(() => window.__bf.role)
        result.readback = await leaving.getByTestId('account-balance').textContent()
        if (result.restored) {
          result.resume = await leaving.evaluate(() => window.__bf.protocol.find(event => event.type === '__resume-tab'))
          assert.ok(result.resume?.budgetId)
        }
        // Prove the returned page can use the backend, not merely display old DOM.
        await leaving.getByTestId('table').getByRole('button', { name: 'Add account' }).click()
        await expect(leaving.getByRole('heading', { name: 'Add account' })).toBeVisible()
        for (const [label, value] of [['Name', 'BFCache Checking'], ['Balance', '10']]) {
          await leaving.getByLabel(label).evaluate((input, value) => {
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
            input.dispatchEvent(new Event('input', { bubbles: true }))
          }, value)
        }
        await leaving.getByRole('button', { name: 'Create', exact: true }).evaluate(button => button.click())
        const account = leaving.getByRole('link', { name: /^BFCache Checking/ })
        await expect(account).toHaveCount(1)
        await expect(leaving.getByTestId('account-balance')).toHaveText('10.00')
        result.createdAccountHref = await account.getAttribute('href')
        await leaving.reload()
        await expect(leaving.getByTestId('account-balance')).toHaveText('10.00', { timeout: 30000 })
        await expect(account).toHaveCount(1)
        assert.equal(await account.getAttribute('href'), result.createdAccountHref)
        result.postReturnMutation = { persisted: true, count: 1, balance: '10.00' }
      }
      assert.deepEqual(result.errors, [])
      assert.equal(result.restored, true, 'Real BFCache restoration requires the same document and pageshow.persisted')
      result.pass = true
    } catch (error) {
      result.error = error.stack
    } finally { await context.close() }
  }
  receipt.pass = receipt.cases.every(result => result.pass)
  if (!receipt.pass) process.exitCode = 1
} catch (error) {
  receipt.error = error.stack
  throw error
} finally {
  await writeFile(join(output, 'browser.json'), JSON.stringify(receipt, null, 2) + '\n')
  await browser?.close()
  proxy.close()
  awayServer.close()
  server.kill('SIGTERM')
}
