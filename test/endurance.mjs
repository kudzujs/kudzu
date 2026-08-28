import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { appendFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { cpus, freemem, tmpdir, totalmem } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = join(root, "test/fixtures/endurance-ownership")
const cycles = Number(process.env.CYCLES ?? 30)
const warmups = Number(process.env.WARMUP_CYCLES ?? 5)
const sampleEvery = Number(process.env.SAMPLE_EVERY ?? 5)
const prefetchRaceCycles = Number(process.env.PREFETCH_RACE_CYCLES ?? 10)
const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
const chromeFlags = ["--headless=new", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync"]

if (!chrome) throw new Error("Set CHROME_BIN to run the endurance harness")
if (![cycles, warmups, sampleEvery, prefetchRaceCycles].every(Number.isInteger) || cycles < 1 || warmups < 0 || sampleEvery < 1 || prefetchRaceCycles < 1) throw new Error("CYCLES, WARMUP_CYCLES, SAMPLE_EVERY, and PREFETCH_RACE_CYCLES must be positive integers")

const runId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")
const output = join(root, "test-results/endurance", runId)
const samplesFile = join(output, "samples.jsonl")
const sleep = milliseconds => new Promise(resolveSleep => setTimeout(resolveSleep, milliseconds))

class CDP {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.exceptions = []
    this.failedRequests = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolveReady, reject) => { this.socket.onopen = resolveReady; this.socket.onerror = reject })
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.method === "Runtime.exceptionThrown") this.exceptions.push(message.params.exceptionDetails.text)
      if (message.method === "Network.loadingFailed" && !message.params.canceled) this.failedRequests.push(message.params.errorText)
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

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
  return response.result.value
}

async function waitUntil(cdp, sessionId, expression) {
  const started = Date.now()
  while (Date.now() - started < 30_000) {
    if (await evaluate(cdp, sessionId, expression)) return
    await sleep(10)
  }
  throw new Error(`DOM predicate timed out: ${expression}`)
}

async function sample(cdp, sessionId, cycle, phase, navigations, owner = "route:/plain") {
  await cdp.send("HeapProfiler.collectGarbage", {}, sessionId)
  const heap = await cdp.send("Runtime.getHeapUsage", {}, sessionId)
  const dom = await cdp.send("Memory.getDOMCounters", {}, sessionId)
  const deterministic = await evaluate(cdp, sessionId, `({
    route: document.body.dataset.kRoute,
    editorMounts: Number(document.body.dataset.editorMounts || "0"),
    editorDisposals: Number(document.body.dataset.editorDisposals || "0"),
    editors: document.querySelectorAll(".cm-editor,[data-editor]").length,
    dialogs: document.querySelectorAll("dialog:modal").length,
    rows: document.querySelectorAll("[data-row]").length,
    elements: document.querySelectorAll("*").length
  })`)
  deterministic.browserStateSize = await evaluate(cdp, sessionId, `(async () => {
    const script = [...document.querySelectorAll("script[data-k-capability][src]")].find(node => new URL(node.src).pathname.endsWith("/kudzu.js"))
    return (await import(script.src)).browserState.size
  })()`)
  deterministic.activeEditors = deterministic.editorMounts - deterministic.editorDisposals
  const record = {
    schema: 1,
    fixture: "endurance-ownership",
    cycle,
    phase,
    owner,
    deterministic: { ...deterministic, navigations },
    browser: { heap: { usedSize: heap.usedSize, totalSize: heap.totalSize }, dom },
    exceptions: [...cdp.exceptions],
    failedRequests: [...cdp.failedRequests],
  }
  await appendFile(samplesFile, `${JSON.stringify(record)}\n`)
  if (deterministic.route !== "/plain" || deterministic.activeEditors !== 0 || deterministic.editors || deterministic.dialogs || deterministic.rows) throw new Error(JSON.stringify({ owner: record.owner, cycle, expected: "released canonical route", actual: record.deterministic }))
  if (cdp.exceptions.length || cdp.failedRequests.length) throw new Error(JSON.stringify({ owner: record.owner, cycle, exceptions: cdp.exceptions, failedRequests: cdp.failedRequests }))
  return record
}

async function cycle(cdp, sessionId, index) {
  await evaluate(cdp, sessionId, 'document.querySelector("[data-home-link]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-route=harness]") && document.querySelector(".cm-editor")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-open-dialog]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-dialog]").matches(":modal")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-close-dialog]").click(); true')
  await waitUntil(cdp, sessionId, '!document.querySelector("[data-dialog]").matches(":modal")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-add-row]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-row=temporary]")')
  await evaluate(cdp, sessionId, `(() => { const input = document.querySelector("[data-row-draft=temporary]"); input.value = "cycle-${index}"; input.dispatchEvent(new InputEvent("input", { bubbles: true })); return true })()`)
  await waitUntil(cdp, sessionId, `document.querySelector("[data-row-draft=temporary]").value === "cycle-${index}"`)
  await evaluate(cdp, sessionId, 'document.querySelector("[data-remove-row]").click(); true')
  await waitUntil(cdp, sessionId, '!document.querySelector("[data-row=temporary]")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-add-row]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-row-draft=temporary]").value === "temporary"')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-remove-row]").click(); document.querySelector("[data-toggle-editor]").click(); true')
  await waitUntil(cdp, sessionId, '!document.querySelector("[data-editor]")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-toggle-editor]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector(".cm-editor")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-plain-link]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-route=plain]")')
}

async function prefetchRace(cdp, sessionId, index) {
  await evaluate(cdp, sessionId, `(async () => {
    const home = document.querySelector("[data-home-link]")
    home.href = "/?prefetch=${index}"
    home.dispatchEvent(new Event("pointerover", { bubbles: true }))
    await Promise.resolve()
    home.click()
    await new Promise(resolve => setTimeout(resolve, 0))
    document.querySelector("[data-release-link]").click()
    return true
  })()`)
  await waitUntil(cdp, sessionId, 'document.body.dataset.kRoute === "/release"')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-plain-link]").click(); true')
  await waitUntil(cdp, sessionId, 'document.body.dataset.kRoute === "/plain"')
}

let server
let browser
let cdp
let profile
await mkdir(output, { recursive: true })
await writeFile(join(output, "environment.json"), `${JSON.stringify({ schema: 1, revision: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(), dirty: Boolean(spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout.trim()), node: process.version, platform: process.platform, arch: process.arch, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, totalMemory: totalmem(), freeMemory: freemem(), flags: chromeFlags, methodology: "one long-lived Chrome profile; forced GC before canonical heap and DOM samples; exact authored ownership balances are primary" }, null, 2)}\n`)
try {
  const build = spawnSync(process.execPath, [join(root, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8", timeout: 120_000 })
  if (build.error || build.signal || build.status !== 0) throw build.error || new Error(build.stderr || build.stdout)

  const serverSource = `const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),root=process.argv[1],pending=[];http.createServer((request,response)=>{const url=new URL(request.url,"http://localhost"),pathname=url.pathname;if(pathname==="/__release-prefetch"){const releases=pending.splice(0);for(const release of releases)release();response.end(String(releases.length));return}const relative=pathname==="/"?"index.html":path.extname(pathname)?pathname.slice(1):pathname.slice(1)+"/index.html",file=path.join(root,relative),send=()=>{response.setHeader("content-type",file.endsWith(".js")?"text/javascript":"text/html");fs.createReadStream(file).on("error",()=>response.writeHead(404).end()).pipe(response)};if(url.searchParams.has("prefetch"))pending.push(send);else send()}).listen(0,"127.0.0.1",function(){console.log(this.address().port)})`
  server = spawn(process.execPath, ["-e", serverSource, join(fixture, "dist")], { stdio: ["ignore", "pipe", "inherit"] })
  const port = await new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("Endurance server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Endurance server exited ${code}`)) })
  })

  profile = await mkdtemp(join(tmpdir(), "kudzu-endurance-"))
  browser = spawn(chrome, [...chromeFlags, `--user-data-dir=${profile}`], { stdio: "ignore" })
  let activePort
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (browser.exitCode !== null) throw new Error(`Chrome exited early with ${browser.exitCode}`)
    try { activePort = await readFile(join(profile, "DevToolsActivePort"), "utf8"); break } catch {}
    await sleep(10)
  }
  if (!activePort) throw new Error("Chrome DevToolsActivePort did not appear")
  const [debugPort, browserPath] = activePort.trim().split("\n")
  cdp = new CDP(`ws://127.0.0.1:${debugPort}${browserPath}`)
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
  await cdp.send("Runtime.enable", {}, sessionId)
  await cdp.send("Network.enable", {}, sessionId)
  await cdp.send("HeapProfiler.enable", {}, sessionId)
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/` }, sessionId)
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-route=harness]") && document.querySelector(".cm-editor")')
  await evaluate(cdp, sessionId, 'document.querySelector("[data-plain-link]").click(); true')
  await waitUntil(cdp, sessionId, 'document.querySelector("[data-route=plain]")')

  let navigations = 1
  for (let index = 1; index <= warmups; index++) { await cycle(cdp, sessionId, -index); navigations += 2 }
  const baseline = await sample(cdp, sessionId, 0, "post-warmup", navigations)
  for (let index = 1; index <= prefetchRaceCycles; index++) {
    await prefetchRace(cdp, sessionId, index)
    navigations += 3
    if (index % 5 === 0 || index === prefetchRaceCycles) {
      await evaluate(cdp, sessionId, 'fetch("/__release-prefetch").then(response => response.text())')
      await sleep(100)
    }
  }
  await sleep(300)
  const race = await sample(cdp, sessionId, 0, "prefetch-race", navigations, "navigation:documents")
  if (race.browser.dom.documents !== baseline.browser.dom.documents || race.deterministic.browserStateSize !== baseline.deterministic.browserStateSize) throw new Error(JSON.stringify({ owner: race.owner, expected: { documents: baseline.browser.dom.documents, browserStateSize: baseline.deterministic.browserStateSize }, actual: { documents: race.browser.dom.documents, browserStateSize: race.deterministic.browserStateSize } }))
  const samples = [baseline, race]
  for (let index = 1; index <= cycles; index++) {
    await cycle(cdp, sessionId, index)
    navigations += 2
    if (index % sampleEvery === 0 || index === cycles) samples.push(await sample(cdp, sessionId, index, "canonical-checkpoint", navigations))
  }

  const final = samples.at(-1)
  const heapAllowance = Math.max(2 * 1024 * 1024, baseline.browser.heap.usedSize * 0.15)
  const nodeAllowance = Math.max(50, baseline.browser.dom.nodes * 0.05)
  const thresholds = { heapAllowanceBytes: heapAllowance, nodeAllowance, listenerAllowance: 2, documentAllowance: 0 }
  const deltas = { heapBytes: final.browser.heap.usedSize - baseline.browser.heap.usedSize, documents: final.browser.dom.documents - baseline.browser.dom.documents, nodes: final.browser.dom.nodes - baseline.browser.dom.nodes, listeners: final.browser.dom.jsEventListeners - baseline.browser.dom.jsEventListeners }
  const observations = {
    heapWithinAlarm: final.browser.heap.usedSize <= baseline.browser.heap.usedSize + heapAllowance,
    documentsWithinAlarm: final.browser.dom.documents === baseline.browser.dom.documents,
    nodesWithinAlarm: final.browser.dom.nodes <= baseline.browser.dom.nodes + nodeAllowance,
    listenersWithinAlarm: final.browser.dom.jsEventListeners <= baseline.browser.dom.jsEventListeners + 2,
  }
  const summary = { schema: 1, status: Object.values(observations).every(Boolean) ? "pass" : "observation-alarm", cycles, warmups, sampleEvery, prefetchRaceCycles, baseline, final, thresholds, deltas, observations, samples: samples.length }
  await writeFile(join(output, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`)
  if (summary.status !== "pass") throw new Error(`Endurance observation alarm: ${JSON.stringify(observations)}`)
  console.log(JSON.stringify({ output, ...summary }, null, 2))
  await cdp.send("Browser.close")
} catch (error) {
  await writeFile(join(output, "failure.json"), `${JSON.stringify({ schema: 1, status: "fail", message: error.message, stack: error.stack }, null, 2)}\n`)
  throw error
} finally {
  cdp?.socket.close()
  if (browser?.exitCode === null) {
    browser.kill("SIGKILL")
    await Promise.race([new Promise(resolveExit => browser.once("exit", resolveExit)), sleep(5000)])
  }
  server?.kill()
  await rm(join(fixture, "dist"), { recursive: true, force: true })
  await rm(join(fixture, ".kudzu"), { recursive: true, force: true })
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
