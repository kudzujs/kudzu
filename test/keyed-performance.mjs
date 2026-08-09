import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"
import { performance } from "node:perf_hooks"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = resolve(root, "test/fixtures/keyed-performance")
const build = resolve(root, "bin/kudzu.mjs")
const runs = Number(process.env.RUNS || 7)
const chrome = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].find(path => path && existsSync(path))

if (!chrome) throw new Error("Set CHROME_BIN to run the keyed browser benchmark")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")

const buildTimes = []
const browserTimes = { append: [], filter: [], restore: [], reverse: [] }
const clean = () => {
  rmSync(resolve(fixture, "dist"), { recursive: true, force: true })
  rmSync(resolve(fixture, ".kudzu"), { recursive: true, force: true })
}

function buildFixture(measured) {
  clean()
  const start = performance.now()
  const result = spawnSync(process.execPath, [build, "build"], { cwd: fixture, encoding: "utf8" })
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout || `build exited with ${result.signal || result.status}`)
  if (measured) buildTimes.push(Number((performance.now() - start).toFixed(1)))
}

function filesUnder(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) filesUnder(path, output)
    else output.push(path)
  }
  return output
}

class CDP {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.exceptions = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolveReady, reject) => {
      this.socket.onopen = resolveReady
      this.socket.onerror = reject
    })
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.method === "Runtime.exceptionThrown") this.exceptions.push(message.params.exceptionDetails.text)
      if (!message.id) return
      const callback = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) callback.reject(new Error(message.error.message))
      else callback.resolve(message.result)
    }
  }
  async send(method, params = {}, sessionId) {
    await this.ready
    const id = ++this.id
    const response = new Promise((resolveResponse, reject) => this.pending.set(id, { resolve: resolveResponse, reject }))
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    return response
  }
}

const sleep = milliseconds => new Promise(resolveSleep => setTimeout(resolveSleep, milliseconds))

async function waitForFile(file, child) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (child.exitCode !== null) throw new Error(`Chrome exited early with ${child.exitCode}`)
    try { return await readFile(file, "utf8") } catch {}
    await sleep(10)
  }
  throw new Error("Chrome DevToolsActivePort did not appear")
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

async function waitUntil(cdp, sessionId, expression) {
  const start = Date.now()
  while (Date.now() - start < 30000) {
    if (await evaluate(cdp, sessionId, expression)) return
    await sleep(10)
  }
  throw new Error(`DOM predicate timed out: ${expression}`)
}

async function timedClick(cdp, sessionId, selector, predicate) {
  const elapsed = await evaluate(cdp, sessionId, `new Promise((resolve, reject) => {
    const target = document.querySelector(${JSON.stringify(selector)})
    if (!target) return reject(new Error("click target not found"))
    let settled = false
    const timeout = setTimeout(() => { if (!settled) { settled = true; observer.disconnect(); reject(new Error("operation timed out")) } }, 30000)
    const complete = () => {
      if (settled || !(${predicate})) return
      settled = true
      observer.disconnect()
      clearTimeout(timeout)
      resolve(performance.now() - start)
    }
    const observer = new MutationObserver(complete)
    observer.observe(document.querySelector("[data-list]"), { subtree: true, childList: true, attributes: true })
    const start = performance.now()
    target.click()
    complete()
  })`)
  return Number(elapsed.toFixed(3))
}

async function browserRun(port) {
  const profile = await mkdtemp(join(tmpdir(), "kudzu-keyed-benchmark-"))
  const child = spawn(chrome, [
    "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
    "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync"
  ], { stdio: "ignore" })
  let cdp
  try {
    const [debugPort, browserPath] = (await waitForFile(join(profile, "DevToolsActivePort"), child)).trim().split("\n")
    cdp = new CDP(`ws://127.0.0.1:${debugPort}${browserPath}`)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Runtime.enable", {}, sessionId)
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` }, sessionId)
    await waitUntil(cdp, sessionId, 'document.readyState === "complete" && document.querySelectorAll("[data-row]").length === 2000')
    await evaluate(cdp, sessionId, `window.__retained = document.querySelector('[data-row="1000"]'); window.__removed = document.querySelector('[data-row="1"]'); window.__retained.querySelector("[data-select]").click(); true`)
    await waitUntil(cdp, sessionId, 'window.__retained.dataset.selected === "true"')
    await evaluate(cdp, sessionId, `document.querySelector('[data-action="trim"]').click(); true`)
    await waitUntil(cdp, sessionId, 'document.querySelectorAll("[data-row]").length === 1967')
    const append = await timedClick(cdp, sessionId, '[data-action="append"]', 'document.querySelectorAll("[data-row]").length === 2000 && document.querySelector(\'[data-row="1000"]\') === window.__retained')
    const filter = await timedClick(cdp, sessionId, '[data-action="filter"]', 'document.querySelectorAll("[data-row]").length === 1 && document.querySelector("[data-row]") === window.__retained && window.__retained.dataset.selected === "true"')
    if (await evaluate(cdp, sessionId, "window.__removed.isConnected")) throw new Error("removed row remained connected")
    const restore = await timedClick(cdp, sessionId, '[data-action="restore"]', 'document.querySelectorAll("[data-row]").length === 2000 && document.querySelector(\'[data-row="1000"]\') === window.__retained')
    const fresh = await evaluate(cdp, sessionId, `document.querySelector('[data-row="1"]') !== window.__removed && document.querySelector('[data-row="1"]').dataset.selected === "false"`)
    if (!fresh) throw new Error("restored row did not receive fresh identity and state")
    await evaluate(cdp, sessionId, `document.querySelector('[data-row="1"] [data-select]').click(); true`)
    await waitUntil(cdp, sessionId, `document.querySelector('[data-row="1"]').dataset.selected === "true"`)
    const reverse = await timedClick(cdp, sessionId, '[data-action="reverse"]', 'document.querySelector("[data-row]")?.dataset.row === "2000" && document.querySelector(\'[data-row="1000"]\') === window.__retained')
    if (cdp.exceptions.length) throw new Error(`browser exceptions: ${cdp.exceptions.join(", ")}`)
    await cdp.send("Browser.close")
    return { append, filter, restore, reverse }
  } finally {
    cdp?.socket.close()
    if (child.exitCode === null) child.kill("SIGKILL")
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

let server
try {
  buildFixture(false)
  for (let index = 0; index < runs; index++) buildFixture(true)

  const output = resolve(fixture, "dist")

  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1]
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
  const file = pathname === "/" ? path.join(root, "index.html") : path.resolve(root, "." + pathname)
  if (file !== root && !file.startsWith(root + path.sep)) return response.writeHead(404).end()
  response.setHeader("content-type", path.extname(file) === ".js" ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(0, "127.0.0.1", function () { console.log(this.address().port) })
`
  server = spawn(process.execPath, ["-e", serverSource, output], { stdio: ["ignore", "pipe", "pipe"] })
  const port = await new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("benchmark server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`benchmark server exited ${code}`)) })
  })

  for (let index = 0; index < runs; index++) {
    const sample = await browserRun(port)
    for (const operation of Object.keys(browserTimes)) browserTimes[operation].push(sample[operation])
  }

  const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
  const jsFiles = filesUnder(output).filter(file => file.endsWith(".js")).sort()
  const artifacts = jsFiles.reduce((result, file) => {
    const bytes = readFileSync(file)
    result.raw += bytes.length
    result.gzip += gzipSync(bytes).length
    return result
  }, { raw: 0, gzip: 0 })
  console.log(JSON.stringify({
    fixture: "2,000 keyed rows with local state and reactive search",
    environment: { node: process.version, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() },
    methodology: `one build warm-up, ${runs} clean builds, ${runs} fresh Chrome profiles`,
    buildMs: { runs: buildTimes, median: median(buildTimes) },
    browserMs: Object.fromEntries(Object.entries(browserTimes).map(([name, values]) => [name, { runs: values, median: median(values) }])),
    javascript: { ...artifacts, files: jsFiles.map(file => file.slice(output.length + 1)) }
  }, null, 2))
} finally {
  server?.kill()
  await rm(resolve(fixture, "dist"), { recursive: true, force: true })
  await rm(resolve(fixture, ".kudzu"), { recursive: true, force: true })
}
