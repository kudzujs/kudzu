import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'

assert.ok(process.env.COORDINATION_ROOT && process.env.ACTUAL_ROOT, 'Set COORDINATION_ROOT and installed ACTUAL_ROOT')
const root = resolve(process.env.COORDINATION_ROOT)
const { chromium, expect } = createRequire(resolve(process.env.ACTUAL_ROOT, 'package.json'))('@playwright/test')
const output = resolve(process.env.RESULT_DIR || 'test-results/actual-kudzu-bfcache')
await mkdir(output, { recursive: true })
const dist = resolve(root, 'dist')
const server = createServer(async (req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (!extname(path)) path = path.replace(/\/$/, '') + '/index.html'
    const file = resolve(dist, '.' + path)
    assert.ok(file.startsWith(dist + sep))
    const body = await readFile(file)
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' })[extname(file)] ?? 'application/octet-stream')
    res.end(body)
  } catch { res.writeHead(404); res.end('Not found') }
})
const awayServer = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end('<!doctype html><title>Away</title><h1>Away from budget</h1>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
await new Promise(resolve => awayServer.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`
const awayURL = `http://127.0.0.1:${awayServer.address().port}/`
const cache = process.env.CACHE || 'native'
assert.ok(['native', 'disabled'].includes(cache))
const pending = process.env.PENDING === '1'
assert.ok(!pending || cache === 'native')
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true,
  ignoreDefaultArgs: cache === 'native' ? ['--disable-back-forward-cache'] : [],
})
const receipt = {
  core: JSON.parse(await readFile(resolve(root, 'node_modules/@kudzujs/core/package.json'))).version,
  browser: browser.version(), node: process.version, platform: process.platform, cache,
  sourceSha256: createHash('sha256').update(await readFile(resolve(root, 'src/pages/index.tsx'))).digest('hex'),
  coordinatorSha256: createHash('sha256').update(await readFile(resolve(dist, 'coordinator.js'))).digest('hex'),
  cases: [], pass: false,
}
const pings = page => page.evaluate(() => window.__ports.flatMap(port => port.received).filter(message => message.type === '__heartbeat-ping').length)
const released = page => page.evaluate(() => ({
  ports: window.__ports.every(port => port.closed && port.listeners.size === 0),
  workers: window.__workers.every(worker => worker.terminated && worker.listeners.size === 0),
  resumeListeners: window.__resumeListeners.size,
}))
try {
  for (const [departing, barrier] of pending ? [['follower', 'request'], ['follower', 'reply'], ['follower', 'completed']] : [['leader'], ['follower']]) {
    const result = { departing, barrier, errors: [], notRestored: [], pass: false }
    receipt.cases.push(result)
    const context = await browser.newContext()
    try {
      await context.addInitScript(barrier => {
        window.__token = crypto.randomUUID()
        window.__lifecycle = []
        for (const type of ['pagehide', 'pageshow']) window.addEventListener(type, event => {
          window.__lifecycle.push({ type, persisted: event.persisted })
        })
        window.__resumeListeners = new Set()
        const add = window.addEventListener.bind(window), remove = window.removeEventListener.bind(window)
        window.addEventListener = (type, callback, options) => {
          if (type === 'pageshow') window.__resumeListeners.add(callback)
          return add(type, callback, options)
        }
        window.removeEventListener = (type, callback, options) => {
          if (type === 'pageshow') window.__resumeListeners.delete(callback)
          return remove(type, callback, options)
        }
        window.__workers = []
        window.__ports = []
        const NativeWorker = window.Worker
        window.Worker = class extends NativeWorker {
          constructor(...args) {
            super(...args)
            this.record = { url: String(args[0]), terminated: false, listeners: new Set() }
            window.__workers.push(this.record)
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
          postMessage(message, ...args) {
            if (barrier && message?.name === 'account-create') {
              window.__mutationId = message.id
              if (barrier === 'request') {
                window.__release = () => super.postMessage(message, ...args)
                return
              }
            }
            return super.postMessage(message, ...args)
          }
        }
        const NativeSharedWorker = window.SharedWorker
        window.SharedWorker = class extends NativeSharedWorker {
          constructor(...args) {
            super(...args)
            const record = { closed: false, listeners: new Set(), sent: [], received: [] }
            window.__ports.push(record)
            const port = this.port
            const add = port.addEventListener.bind(port), remove = port.removeEventListener.bind(port)
            const close = port.close.bind(port), post = port.postMessage.bind(port)
            add('message', event => record.received.push({ type: event.data.type, role: event.data.role, id: event.data.id }))
            port.addEventListener = (type, callback, options) => { record.listeners.add(callback); add(type, callback, options) }
            port.removeEventListener = (type, callback, options) => { record.listeners.delete(callback); remove(type, callback, options) }
            port.close = () => { record.closed = true; close() }
            port.postMessage = (message, ...args) => {
              if (barrier === 'reply' && message.type === '__from-worker' && message.msg.type === 'reply' && message.msg.id === window.__mutationId) {
                window.__release = () => { record.sent.push(message); post(message, ...args) }
                return
              }
              record.sent.push(message)
              return post(message, ...args)
            }
          }
        }
      }, barrier ?? null)
      const tab = async () => {
        const page = await context.newPage()
        page.on('pageerror', error => result.errors.push(error.message))
        page.on('response', response => { if (response.status() >= 400) result.errors.push(`${response.status()} ${response.url()}`) })
        const cdp = await context.newCDPSession(page)
        await cdp.send('Page.enable')
        cdp.on('Page.backForwardCacheNotUsed', event => result.notRestored.push(event))
        await page.goto(origin)
        return page
      }
      const leader = await tab()
      await expect(leader.getByRole('button', { name: 'Start budgeting' })).toBeEnabled({ timeout: 30000 })
      await leader.getByRole('button', { name: 'Start budgeting' }).click()
      await expect(leader.getByRole('status')).toHaveText('Saved data checked', { timeout: 30000 })
      const follower = await tab()
      await expect(follower.locator('[data-role]')).toHaveText('FOLLOWER', { timeout: 30000 })
      await expect(follower.getByRole('status')).toHaveText('Saved data checked')
      assert.equal(follower.workers().length, 0)
      const leaving = departing === 'leader' ? leader : follower
      const survivor = departing === 'leader' ? follower : leader
      const token = await leaving.evaluate(() => window.__token)
      const budgetID = await leaving.locator('[data-budget]').textContent()
      const createAccount = async () => {
        await leaving.getByLabel('Account name').fill('Returned Checking')
        await leaving.getByRole('button', { name: 'Create account', exact: true }).click()
      }
      if (barrier) {
        await createAccount()
        if (barrier === 'completed') await expect(leaving.locator('[data-balance]')).toHaveText('1000')
        else await expect.poll(() => leader.evaluate(() => typeof window.__release)).toBe('function')
        result.requestID = await leaving.evaluate(() => window.__ports[0].sent.find(msg => msg.name === 'account-create').id)
      }
      const start = await pings(survivor)
      await leaving.goto(awayURL)
      await expect(leaving.getByRole('heading')).toHaveText('Away from budget')
      await expect.poll(() => pings(survivor), { timeout: 45000 }).toBeGreaterThanOrEqual(start + 3)
      await expect(survivor.locator('[data-role]')).toHaveText('LEADER', { timeout: 30000 })
      if (barrier) {
        if (barrier !== 'completed') await leader.evaluate(() => window.__release())
        await expect.poll(() => leader.evaluate(id => window.__ports[0].sent.some(msg => msg.type === '__from-worker' && msg.msg.type === 'reply' && msg.msg.id === id), result.requestID)).toBe(true)
        result.committedID = await leader.evaluate(id => window.__ports[0].sent.find(msg => msg.type === '__from-worker' && msg.msg.type === 'reply' && msg.msg.id === id).msg.result, result.requestID)
        assert.equal(typeof result.committedID, 'string')
      }
      await leaving.goBack({ waitUntil: 'commit' })
      await expect(leaving.getByRole('heading')).toHaveText('Shared local budget')
      result.restored = await leaving.evaluate(token => window.__token === token && window.__lifecycle.some(event => event.type === 'pageshow' && event.persisted), token)
      result.lifecycle = await leaving.evaluate(() => window.__lifecycle)
      if (cache === 'disabled') assert.equal(result.restored, false)
      await expect(leaving.locator('[data-role]')).toHaveText('FOLLOWER', { timeout: 10000 })
      await expect(leaving.getByRole('status')).toHaveText('Saved data checked')
      await expect(leaving.locator('[data-budget]')).toHaveText(budgetID)
      assert.equal(leaving.workers().filter(worker => /browser-server/.test(worker.url())).length, 0)
      assert.equal(survivor.workers().filter(worker => /browser-server/.test(worker.url())).length, 1)
      if (result.restored) {
        result.resume = await leaving.evaluate(() => window.__ports.flatMap(port => port.sent).find(message => message.type === '__resume-tab'))
        assert.equal(result.resume?.budgetId, budgetID)
        assert.equal(await leaving.evaluate(() => window.__ports.length), 1)
        assert.equal(await leaving.evaluate(() => window.__resumeListeners.size), 1)
        assert.ok(await leaving.evaluate(() => window.__workers.every(worker => worker.terminated && worker.listeners.size === 0)))
      }
      if (!barrier) await createAccount()
      else if (barrier === 'completed') {
        await expect(leaving.getByRole('alert')).toBeEmpty()
        await expect(leaving.getByRole('button', { name: 'Create account', exact: true })).toBeEnabled()
      } else {
        assert.equal(result.restored, true)
        await expect(leaving.getByRole('alert')).toContainText('may have completed')
        await expect(leaving.getByRole('button', { name: 'Create account', exact: true })).toBeDisabled()
        await leaving.getByLabel('Account name').press('Enter')
      }
      await expect(leaving.locator('[data-name]')).toHaveText('Returned Checking', { timeout: 15000 })
      await expect(leaving.locator('[data-balance]')).toHaveText('1000')
      result.accountID = await leaving.locator('[data-account-id]').getAttribute('data-account-id')
      if (barrier) assert.equal(result.accountID, result.committedID)
      result.mutations = await leaving.evaluate(() => window.__ports.flatMap(port => port.sent).filter(message => message.name === 'account-create').length)
      assert.equal(result.mutations, 1)
      await leaving.reload()
      await expect(leaving.getByRole('status')).toHaveText('Saved data checked', { timeout: 30000 })
      await expect(leaving.locator('[data-account-id]')).toHaveCount(1)
      await expect(leaving.locator('[data-account-id]')).toHaveAttribute('data-account-id', result.accountID)
      await expect(leaving.locator('[data-balance]')).toHaveText('1000')
      await expect(leaving.getByRole('alert')).toBeEmpty()
      await expect(leaving.getByRole('button', { name: 'Create account', exact: true })).toBeEnabled()
      result.persistedBalance = 1000
      await leaving.getByRole('button', { name: 'Toggle budget owner' }).click()
      await expect(leaving.locator('main')).toHaveCount(0)
      assert.deepEqual(await released(leaving), { ports: true, workers: true, resumeListeners: 0 })
      await leaving.getByRole('button', { name: 'Toggle budget owner' }).click()
      await expect(leaving.getByRole('status')).toHaveText('Saved data checked', { timeout: 30000 })
      await expect(leaving.locator('[data-account-id]')).toHaveAttribute('data-account-id', result.accountID)
      await leaving.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')))
      assert.deepEqual(await released(leaving), { ports: true, workers: true, resumeListeners: 0 })
      result.cleanup = true
      const staticPage = await context.newPage()
      const requests = []
      staticPage.on('request', request => requests.push(request.url()))
      await staticPage.goto(origin + '/static')
      await expect(staticPage.getByRole('heading')).toHaveText('Local budget information')
      assert.deepEqual(requests, [origin + '/static'])
      assert.equal(await staticPage.evaluate(() => window.__ports.length + window.__workers.length), 0)
      assert.deepEqual(result.errors, [])
      result.pass = true
    } catch (error) { result.error = error.stack }
    finally { await context.close() }
  }
  receipt.pass = receipt.cases.every(result => result.pass) && (cache === 'disabled' || receipt.cases.every(result => result.restored))
  if (!receipt.pass) process.exitCode = 1
} finally {
  await writeFile(resolve(output, `${pending ? 'pending' : cache}.json`), JSON.stringify(receipt, null, 2) + '\n')
  await browser.close()
  server.close()
  awayServer.close()
}
