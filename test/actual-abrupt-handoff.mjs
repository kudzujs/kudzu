import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import http from 'node:http'
import { createRequire } from 'node:module'
import { once } from 'node:events'
import { join } from 'node:path'

assert.ok(process.env.ACTUAL_ROOT, 'Set ACTUAL_ROOT to the pinned, installed production workspace')
assert.ok(process.env.ACTUAL_HANDOFF_EVIDENCE, 'Set ACTUAL_HANDOFF_EVIDENCE to the extracted pending-request archive')
const root = process.env.ACTUAL_ROOT
const revision = '87e33e49eb4d666c33e0c0f172faf340d1b7aa0a'
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), revision)
const require = createRequire(`${root}/package.json`)
const { chromium, expect } = require('@playwright/test')
const mode = process.env.HOLD || 'reply'
assert.ok(['request', 'reply'].includes(mode))
const fixed = process.env.FIXED === '1'
const spreadsheetFixed = process.env.SPREADSHEET_FIXED === '1'
const candidate = await readFile(join(process.env.ACTUAL_HANDOFF_EVIDENCE, fixed ? 'actual-pending-candidate.js' : 'actual-coordinator-candidate.js'))
const spreadsheetSource = await readFile(join(root, 'packages/desktop-client/src/hooks/useSpreadsheet.tsx'))
const receipt = { revision, mode, fixed, spreadsheetFixed, spreadsheetSourceSha256: createHash('sha256').update(spreadsheetSource).digest('hex'), loss: 'CDP Page.crash', node: process.version, platform: process.platform, arch: process.arch, candidateSha256: createHash('sha256').update(candidate).digest('hex'), candidateRequests: [], protocol: [], events: [], steps: [], pass: false }
const server = spawn(process.execPath, ['packages/desktop-client/bin/serve-build.mjs'], {
  cwd: root, env: { ...process.env, PORT: '3147' }, stdio: ['ignore', 'pipe', 'inherit'],
})
let browser
const proxy = http.createServer((request, response) => {
  if (/^\/static\/shared-browser-server-[\w-]+\.js$/.test(request.url)) {
    receipt.candidateRequests.push(request.url)
    response.writeHead(200, { 'content-type': 'text/javascript', 'cross-origin-resource-policy': 'same-origin' })
    response.end(candidate)
    return
  }
  const upstream = http.request(`http://localhost:3147${request.url}`, { method: request.method }, incoming => {
    response.writeHead(incoming.statusCode, incoming.headers)
    incoming.pipe(response)
  })
  upstream.on('error', error => { response.writeHead(502); response.end(error.message) })
  request.pipe(upstream)
})
try {
  await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw new Error(`Server exited: ${code}`) }),
  ])
  proxy.listen(3148, '127.0.0.1')
  await once(proxy, 'listening')
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
    headless: true,
  })
  receipt.browser = browser.version()
  const context = await browser.newContext()
  const tab = async name => {
    const page = await context.newPage()
    await page.addInitScript(() => {
      const NativeSharedWorker = window.SharedWorker
      window.SharedWorker = class extends NativeSharedWorker {
        constructor(...args) {
          super(...args)
          const post = this.port.postMessage.bind(this.port)
          this.port.postMessage = (message, ...args) => {
            if (['tab-closing', '__heartbeat-pong'].includes(message?.type)) console.log('ABRUPT_PROTOCOL ' + JSON.stringify({ direction: 'out', type: message.type }))
            return post(message, ...args)
          }
          this.port.addEventListener('message', event => {
            if (['__heartbeat-ping', '__role-change', '__become-leader'].includes(event.data?.type)) console.log('ABRUPT_PROTOCOL ' + JSON.stringify({ direction: 'in', type: event.data.type, role: event.data.role }))
          })
        }
      }
      for (const type of ['beforeunload', 'pagehide', 'unload']) window.addEventListener(type, () => console.log('ABRUPT_PROTOCOL ' + JSON.stringify({ direction: 'event', type })))
    })
    if (name === 'leader') await page.addInitScript(mode => {
      const NativeWorker = window.Worker
      window.__heldMutation = null
      window.__heldReads = []
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args)
          this.mutationIds = new Set()
          this.addEventListener('message', event => {
            if (mode === 'reply' && this.mutationIds.has(event.data?.id) && event.data.type === 'reply') {
              window.__heldMutation = event.data
              event.stopImmediatePropagation()
            }
          })
        }
        postMessage(message, ...args) {
          // Keep the observed spreadsheet requests pending regardless of backend speed.
          if (mode === 'reply' && this.mutationIds.size && ['create-query', 'get-cell'].includes(message?.name)) {
            window.__heldReads.push({ id: message.id, name: message.name })
            return
          }
          if (message?.name === 'account-create') {
            this.mutationIds.add(message.id)
            if (mode === 'request') {
              window.__heldMutation = message
              return
            }
          }
          super.postMessage(message, ...args)
        }
      }
    }, mode)
    if (name === 'follower') await page.addInitScript(() => {
      const NativeSharedWorker = window.SharedWorker
      window.__mutation = { id: null, sent: 0, replies: [], terminalErrors: [] }
      const requests = new Map()
      window.SharedWorker = class extends NativeSharedWorker {
        constructor(...args) {
          super(...args)
          const postMessage = this.port.postMessage.bind(this.port)
          this.port.postMessage = (message, ...args) => {
            if (message?.id && message.name) requests.set(message.id, message.name)
            if (message?.name === 'account-create') {
              window.__mutation.id = message.id
              window.__mutation.sent++
            }
            postMessage(message, ...args)
          }
          this.port.addEventListener('message', event => {
            if (event.data?.type === 'error') window.__mutation.terminalErrors.push({ id: event.data.id, name: requests.get(event.data.id), error: event.data.error?.message })
            if (window.__mutation.id && event.data?.id === window.__mutation.id) {
              window.__mutation.replies.push({ ...event.data, error: event.data.error?.message })
            }
          })
        }
      }
    })
    page.on('console', msg => {
      if (msg.text().startsWith('ABRUPT_PROTOCOL ')) receipt.protocol.push({ tab: name, at: Date.now(), ...JSON.parse(msg.text().slice('ABRUPT_PROTOCOL '.length)) })
      if (/SharedWorker|WorkerBridge/.test(msg.text())) receipt.events.push({ tab: name, text: msg.text() })
    })
    page.on('pageerror', error => receipt.events.push({ tab: name, error: error.message }))
    await page.goto('http://127.0.0.1:3148')
    return page
  }
  const workers = page => page.workers().filter(worker => /browser-server/.test(worker.url()))
  const leader = await tab('leader')
  await leader.getByRole('button', { name: 'Start budgeting' }).click()
  await expect(leader.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
  const follower = await tab('follower')
  await expect(follower.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
  assert.ok(receipt.events.some(event => event.tab === 'follower' && event.text?.includes('Role: FOLLOWER')))
  assert.equal(workers(leader).length, 1)
  assert.equal(workers(follower).length, 0)
  receipt.steps.push('new-budget-follower-without-dedicated-backend')
  await follower.getByTestId('table').getByRole('button', { name: 'Add account' }).click()
  await expect(follower.getByRole('heading', { name: 'Add account' })).toBeVisible()
  // Match upstream's controlled-input helper to avoid React Aria focus remounts.
  for (const [label, value] of [['Name', 'Follower Checking'], ['Balance', '10']]) {
    await follower.getByLabel(label).evaluate((input, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }, value)
  }
  await follower.getByRole('button', { name: 'Create', exact: true }).evaluate(button => button.click())
  await expect.poll(() => leader.evaluate(() => window.__heldMutation), { timeout: 30000 }).not.toBeNull()
  receipt.held = await leader.evaluate(() => window.__heldMutation)
  if (mode === 'reply') {
    await expect.poll(() => leader.evaluate(() => ['create-query', 'get-cell'].every(name => window.__heldReads.some(read => read.name === name))), { timeout: 10000 }).toBe(true)
    receipt.heldReads = await leader.evaluate(() => window.__heldReads)
  }
  receipt.beforeClose = await follower.evaluate(() => window.__mutation)
  assert.equal(receipt.held.id, receipt.beforeClose.id)
  assert.deepEqual(receipt.beforeClose.replies, [])
  assert.equal(workers(follower).length, 0)
  receipt.steps.push(`follower-mutation-${mode}-held-at-leader`)
  const crashed = new Promise(resolve => leader.once('crash', resolve))
  const cdp = await context.newCDPSession(leader)
  const lossStarted = Date.now()
  void cdp.send('Page.crash').catch(() => {})
  let crashTimer
  try {
    await Promise.race([crashed, new Promise((_, reject) => { crashTimer = setTimeout(() => reject(new Error('Leader did not crash')), 10000) })])
  } finally { clearTimeout(crashTimer) }
  receipt.steps.push('leader-renderer-crashed-without-graceful-close')
  await expect.poll(() => workers(follower).length, { timeout: 45000 }).toBe(1)
  await expect.poll(() => receipt.events.some(event => event.tab === 'follower' && event.text?.includes('Role: LEADER')), { timeout: 45000 }).toBe(true)
  await expect.poll(() => receipt.events.some(event => event.tab === 'follower' && event.text?.includes('ready — 1 tab')), { timeout: 45000 }).toBe(true)
  receipt.promotionAfterCrashMs = Date.now() - lossStarted
  assert.equal(receipt.protocol.some(event => event.tab === 'leader' && ['tab-closing', 'beforeunload', 'pagehide', 'unload'].includes(event.type)), false)
  assert.ok(receipt.protocol.some(event => event.tab === 'follower' && event.type === '__heartbeat-ping'))
  receipt.steps.push('natural-heartbeat-promotes-surviving-follower')
  if (fixed) {
    await expect.poll(() => follower.evaluate(() => window.__mutation.replies.length)).toBe(1)
    await expect(follower.getByText('The backend leader changed. This operation may have completed. Reload and check your data before trying again.', { exact: true }).first()).toBeVisible()
    if (spreadsheetFixed && mode === 'reply') {
      const warning = follower.getByText('Unable to refresh balances. Reload and check your data before making changes.', { exact: true })
      await expect(warning).toBeVisible()
      await expect(warning).toHaveCount(1)
      receipt.steps.push('one-visible-spreadsheet-error-notification')
    }
  }
  receipt.afterPromotion = await follower.evaluate(() => window.__mutation)
  assert.equal(receipt.afterPromotion.sent, 1, 'Never replay an uncertain mutation')
  receipt.visibleAfterPromotion = await follower.locator('body').innerText()
  if (fixed) {
    assert.equal(receipt.afterPromotion.replies.length, 1)
    assert.equal(receipt.afterPromotion.replies[0].type, 'error')
    assert.match(receipt.afterPromotion.replies[0].error, /may have completed/)
  } else assert.deepEqual(receipt.afterPromotion.replies, [])
  await expect(follower.getByRole('heading', { name: 'Add account' })).toBeVisible()
  receipt.steps.push(fixed ? 'uncertain-outcome-error-delivered-and-visible' : 'restored-backend-but-mutation-has-no-terminal-response')
  await follower.reload()
  await expect(follower.getByTestId('account-name')).toHaveText('All Accounts', { timeout: 30000 })
  await expect(follower.getByTestId('account-balance')).toHaveText(mode === 'reply' ? '10.00' : '0.00')
  await expect(follower.getByRole('link', { name: /^Follower Checking/ })).toHaveCount(mode === 'reply' ? 1 : 0)
  receipt.readback = {
    balance: await follower.getByTestId('account-balance').textContent(),
    accountCount: await follower.getByRole('link', { name: /^Follower Checking/ }).count()
  }
  if (mode === 'reply') {
    receipt.readback.accountHref = await follower.getByRole('link', { name: /^Follower Checking/ }).getAttribute('href')
    assert.ok(receipt.readback.accountHref.endsWith(`/${receipt.held.result}`), 'Read back the same committed account')
  }
  receipt.steps.push(mode === 'reply' ? 'committed-account-survives-with-lost-reply' : 'undelivered-account-is-absent')
  assert.deepEqual(receipt.events.filter(event => event.error), [])
  assert.ok(receipt.candidateRequests.length > 0)
  receipt.pass = true
} catch (error) {
  receipt.error = error.stack
  if (browser) {
    receipt.pages = await Promise.all(browser.contexts().flatMap(context => context.pages()).map(async page => ({
      url: page.url(), text: await page.locator('body').innerText().catch(() => ''),
    })))
  }
  throw error
} finally {
  const output = process.env.RESULT_DIR || new URL('../test-results/actual-abrupt-handoff/', import.meta.url).pathname
  await mkdir(output, { recursive: true })
  await writeFile(join(output, `abrupt-write-${mode}${fixed ? '-fixed' : ''}${spreadsheetFixed ? '-spreadsheet' : ''}.json`), JSON.stringify(receipt, null, 2))
  await browser?.close()
  proxy.close()
  server.kill()
}
