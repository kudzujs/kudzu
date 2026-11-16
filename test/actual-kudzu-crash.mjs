import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
assert.ok(process.env.COORDINATION_ROOT, 'Set COORDINATION_ROOT to the extracted coordination fixture')
assert.ok(process.env.ACTUAL_ROOT, 'Set ACTUAL_ROOT to the installed pinned Actual workspace')
const root = resolve(process.env.COORDINATION_ROOT)
const require = createRequire(resolve(process.env.ACTUAL_ROOT, 'package.json'))
const { chromium, expect } = require('@playwright/test')
const output = resolve(process.env.RESULT_DIR || 'test-results/actual-kudzu-crash')
await mkdir(output, { recursive: true })
const dist = resolve(root, 'dist')
const server = createServer(async (req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (!extname(path)) path = path.replace(/\/$/, '') + '/index.html'
    const file = resolve(dist, '.' + path)
    if (!file.startsWith(dist + sep)) throw new Error('outside root')
    const body = await readFile(file)
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream')
    res.end(body)
  } catch { res.writeHead(404); res.end('Not found') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true,
})
const loss = process.env.LOSS || 'crash'
assert.ok(['close', 'crash'].includes(loss))
const hash = async path => createHash('sha256').update(await readFile(resolve(root, path))).digest('hex')
const receipt = {
  browser: browser.version(), node: process.version, platform: process.platform, loss,
  sourceSha256: await hash('src/pages/index.tsx'),
  coordinatorSha256: await hash('dist/coordinator.js'),
  cases: [], pass: false,
}
try {
  for (const mode of ['complete', 'request', 'reply']) {
    const result = { mode, steps: [], errors: [] }
    receipt.cases.push(result)
    const context = await browser.newContext()
    const lifecycle = []
    await context.exposeBinding('__recordLifecycle', ({ page }, type, url) => {
      if (url.startsWith(origin)) lifecycle.push({ tab: page === context.pages()[0] ? 'leader' : 'follower', type, url })
    })
    await context.addInitScript(() => {
      for (const type of ['beforeunload', 'pagehide', 'unload']) {
        window.addEventListener(type, () => void window.__recordLifecycle(type, location.href))
      }
      window.__workers = []
      window.__ports = []
      window.__held = null
      window.__holdMode = 'complete'
      const NativeWorker = window.Worker
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args)
          this.record = { url: String(args[0]), terminated: false, listeners: new Set() }
          this.mutations = new Set()
          window.__workers.push(this.record)
          super.addEventListener('message', event => {
            if (window.__holdMode === 'reply' && this.mutations.has(event.data?.id) && event.data.type === 'reply') {
              window.__held = event.data
              event.stopImmediatePropagation()
            }
          })
        }
        postMessage(message, ...args) {
          if (message?.name === 'account-create') {
            this.mutations.add(message.id)
            if (window.__holdMode === 'request') {
              window.__held = message
              return
            }
          }
          return super.postMessage(message, ...args)
        }
        addEventListener(type, callback, options) {
          this.record.listeners.add(callback)
          return super.addEventListener(type, callback, options)
        }
        removeEventListener(type, callback, options) {
          this.record.listeners.delete(callback)
          return super.removeEventListener(type, callback, options)
        }
        terminate() { this.record.terminated = true; return super.terminate() }
      }
      const NativeSharedWorker = window.SharedWorker
      window.SharedWorker = class extends NativeSharedWorker {
        constructor(...args) {
          super(...args)
          const record = { closed: false, listeners: new Set(), sent: [], received: [] }
          window.__ports.push(record)
          const port = this.port
          const add = port.addEventListener.bind(port)
          const remove = port.removeEventListener.bind(port)
          const close = port.close.bind(port)
          const post = port.postMessage.bind(port)
          add('message', event => record.received.push({ ...event.data, error: event.data.error?.message }))
          port.addEventListener = (type, callback, options) => { record.listeners.add(callback); add(type, callback, options) }
          port.removeEventListener = (type, callback, options) => { record.listeners.delete(callback); remove(type, callback, options) }
          port.close = () => { record.closed = true; close() }
          port.postMessage = (message, ...args) => {
            record.sent.push(message)
            if (message.type === 'tab-closing') void window.__recordLifecycle(message.type, location.href)
            return post(message, ...args)
          }
        }
      }
    })
    const tab = async () => {
      const page = await context.newPage()
      page.on('pageerror', error => result.errors.push(error.message))
      page.on('response', response => { if (response.status() >= 400) result.errors.push(`${response.status()} ${response.url()}`) })
      await page.goto(origin)
      return page
    }
    const leader = await tab()
    await expect(leader.getByRole('button', { name: 'Start budgeting' })).toBeEnabled({ timeout: 30000 })
    await leader.getByRole('button', { name: 'Start budgeting' }).click()
    await expect(leader.locator('[data-budget]')).not.toBeEmpty({ timeout: 30000 })
    await expect(leader.getByRole('status')).toHaveText('Saved data checked')
    const follower = await tab()
    await expect(follower.locator('[data-role]')).toHaveText('FOLLOWER', { timeout: 30000 })
    await expect(follower.getByRole('status')).toHaveText('Saved data checked')
    assert.equal(follower.workers().length, 0)
    assert.equal(leader.workers().filter(worker => /browser-server/.test(worker.url())).length, 1)
    await leader.evaluate(mode => { window.__holdMode = mode }, mode)
    result.steps.push('one-backend-and-real-follower')
    await follower.getByLabel('Account name').fill('Follower Checking')
    await follower.getByRole('button', { name: 'Create account', exact: true }).click()
    if (mode === 'complete') {
      await expect(follower.locator('[data-name]')).toHaveText('Follower Checking')
      await expect(follower.locator('[data-balance]')).toHaveText('1000')
      result.accountID = await follower.locator('[data-account-id]').getAttribute('data-account-id')
    } else {
      await expect.poll(() => leader.evaluate(() => window.__held), { timeout: 30000 }).not.toBeNull()
      result.held = await leader.evaluate(() => window.__held)
    }
    const request = await follower.evaluate(() => window.__ports[0].sent.find(message => message.name === 'account-create'))
    result.requestID = request.id
    if (mode !== 'complete') assert.equal(result.held.id, request.id)
    result.leaderRequestIDs = await leader.evaluate(() => window.__ports[0].sent.filter(message => message.id).map(message => message.id))
    result.followerRequestIDs = await follower.evaluate(() => window.__ports[0].sent.filter(message => message.id).map(message => message.id))
    const ids = [...result.leaderRequestIDs, ...result.followerRequestIDs]
    assert.equal(new Set(ids).size, ids.length)
    const lossStarted = Date.now()
    if (loss === 'crash') {
      const crashed = new Promise(resolve => leader.once('crash', resolve))
      const cdp = await context.newCDPSession(leader)
      void cdp.send('Page.crash').catch(() => {})
      let timer
      try {
        await Promise.race([crashed, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Leader did not crash')), 10000) })])
      } finally { clearTimeout(timer) }
    } else await leader.close({ runBeforeUnload: true })
    await expect(follower.locator('[data-role]')).toHaveText('LEADER', { timeout: 45000 })
    await expect.poll(() => follower.workers().filter(worker => /browser-server/.test(worker.url())).length, { timeout: 30000 }).toBe(1)
    result.promotionAfterLossMs = Date.now() - lossStarted
    result.lifecycleAtPromotion = [...lifecycle]
    if (loss === 'crash') {
      assert.deepEqual(lifecycle.filter(event => event.tab === 'leader'), [])
      assert.ok(await follower.evaluate(() => window.__ports[0].received.some(message => message.type === '__heartbeat-ping')))
    }
    result.steps.push(loss === 'crash' ? 'renderer-crash-and-natural-heartbeat-promotion' : 'graceful-close-promotion')
    if (mode !== 'complete') {
      await expect(follower.getByRole('alert')).toContainText('may have completed')
      await expect(follower.getByRole('button', { name: 'Create account', exact: true })).toBeDisabled()
      await follower.getByLabel('Account name').press('Enter')
      assert.equal(await follower.evaluate(() => window.__ports[0].sent.filter(message => message.name === 'account-create').length), 1)
      result.steps.push('uncertainty-visible-and-retry-disabled')
    }
    result.terminal = await follower.evaluate(id => window.__ports[0].received.filter(message => message.id === id), request.id)
    result.sentMutations = await follower.evaluate(() => window.__ports[0].sent.filter(message => message.name === 'account-create').length)
    assert.equal(result.sentMutations, 1)
    assert.equal(result.terminal.length, 1)
    assert.equal(result.terminal[0].type, mode === 'complete' ? 'reply' : 'error')
    await follower.getByRole('button', { name: 'Reload and check data' }).click()
    await expect(follower.getByRole('status')).toHaveText('Saved data checked', { timeout: 30000 })
    await expect(follower.getByRole('alert')).toBeEmpty()
    await expect(follower.locator('[data-account-id]')).toHaveCount(mode === 'request' ? 0 : 1)
    if (mode !== 'request') {
      await expect(follower.locator('[data-name]')).toHaveText('Follower Checking')
      await expect(follower.locator('[data-balance]')).toHaveText('1000')
      const id = await follower.locator('[data-account-id]').getAttribute('data-account-id')
      if (mode === 'complete') assert.equal(id, result.accountID)
      else assert.equal(id, result.held.result)
      result.accountID = id
    }
    await expect(follower.getByRole('button', { name: 'Create account', exact: true })).toBeEnabled()
    result.readback = { count: await follower.locator('[data-account-id]').count(), balances: await follower.locator('[data-balance]').allTextContents() }
    result.steps.push('reload-readback-reconciles-actual-outcome')
    await follower.getByRole('button', { name: 'Toggle budget owner' }).click()
    await expect(follower.locator('main')).toHaveCount(0)
    assert.ok(await follower.evaluate(() => window.__ports.every(port => port.closed && port.listeners.size === 0)))
    assert.ok(await follower.evaluate(() => window.__workers.every(worker => worker.terminated && worker.listeners.size === 0)))
    await follower.getByRole('button', { name: 'Toggle budget owner' }).click()
    await expect(follower.getByRole('status')).toHaveText('Saved data checked', { timeout: 30000 })
    await expect(follower.locator('[data-account-id]')).toHaveCount(mode === 'request' ? 0 : 1)
    await follower.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
    assert.ok(await follower.evaluate(() => window.__ports.every(port => port.closed && port.listeners.size === 0)))
    assert.ok(await follower.evaluate(() => window.__workers.every(worker => worker.terminated && worker.listeners.size === 0)))
    result.steps.push('conditional-and-pagehide-release-all-ports-workers-listeners')
    const staticPage = await context.newPage()
    const requests = []
    staticPage.on('request', request => requests.push(request.url()))
    await staticPage.goto(origin + '/static')
    await expect(staticPage.getByRole('heading')).toHaveText('Local budget information')
    assert.deepEqual(requests, [origin + '/static'])
    assert.equal(staticPage.workers().length, 0)
    assert.equal(await staticPage.evaluate(() => window.__ports.length), 0)
    result.steps.push('static-sibling-requests-only-html')
    assert.deepEqual(result.errors, [])
    result.pass = true
    await context.close()
  }
  receipt.pass = true
} catch (error) {
  receipt.error = error.stack
  throw error
} finally {
  await writeFile(resolve(output, `${loss}.json`), JSON.stringify(receipt, null, 2))
  await browser.close()
  server.close()
}
