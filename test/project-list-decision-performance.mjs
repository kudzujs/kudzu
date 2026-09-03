import { spawn, spawnSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = join(root, "test/fixtures/project-list-decision")
const runs = Number(process.env.RUNS ?? 7)
const requestedStrategies = (process.env.STRATEGIES ?? "direct,pagination,windowing").split(",")
const diagnostic = Boolean(process.env.DIAGNOSTIC)
const acceptance = Boolean(process.env.ACCEPTANCE)
const trace = message => { if (diagnostic) console.error(message) }
const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
if (!chrome) throw new Error("Set CHROME_BIN to run the project list decision benchmark")
if (!Number.isInteger(runs) || runs < (process.env.DIAGNOSTIC ? 1 : 7)) throw new Error("RUNS must be at least 7 unless DIAGNOSTIC is set")
if (requestedStrategies.some(strategy => !["direct", "pagination", "windowing"].includes(strategy))) throw new Error("STRATEGIES must contain direct, pagination, or windowing")

class CDP {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.exceptions = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolveReady, reject) => { this.socket.onopen = resolveReady; this.socket.onerror = reject })
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
const summarize = values => {
  const sorted = [...values].sort((left, right) => left - right)
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1) }
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
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

async function browserRun(port, strategy) {
  trace(`${strategy}: launch`)
  const profile = await mkdtemp(join(tmpdir(), "kudzu-project-list-decision-"))
  const child = spawn(chrome, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync"], { stdio: "ignore" })
  let cdp
  try {
    let activePort
    for (let attempt = 0; attempt < 1000; attempt++) {
      if (child.exitCode !== null) throw new Error(`Chrome exited early with ${child.exitCode}`)
      try { activePort = await readFile(join(profile, "DevToolsActivePort"), "utf8"); break } catch {}
      await sleep(10)
    }
    if (!activePort) throw new Error("Chrome DevToolsActivePort did not appear")
    const [debugPort, browserPath] = activePort.trim().split("\n")
    cdp = new CDP(`ws://127.0.0.1:${debugPort}${browserPath}`)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Runtime.enable", {}, sessionId)
    await cdp.send("HeapProfiler.enable", {}, sessionId)
    const pathname = strategy === "direct" ? "/" : `/${strategy}/`
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}${pathname}` }, sessionId)
    const expectedRows = strategy === "direct" ? 10000 : 100
    await waitUntil(cdp, sessionId, `document.readyState === "complete" && document.querySelectorAll("[data-project]").length === ${expectedRows}`)
    trace(`${strategy}: ready`)
    const load = await evaluate(cdp, sessionId, 'performance.getEntriesByType("navigation")[0].domComplete')
    const identity = await evaluate(cdp, sessionId, `window.__row = document.querySelector('[data-project="50"]'); window.__input = window.__row.querySelector("input"); window.__input.value = "edited"; window.__input.focus(); true`)
    if (!identity) throw new Error("row selection setup failed")
    await waitUntil(cdp, sessionId, 'window.__input.value === "edited" && document.activeElement === window.__input')
    if (acceptance && strategy === "pagination") {
      const initial = await evaluate(cdp, sessionId, `document.querySelector("[data-range]").textContent === "1-100" && document.querySelector("[data-next]").textContent === "Next 100"`)
      if (!initial) throw new Error("pagination initial range or accessible control name is incorrect")
    }
    const advance = `new Promise(resolve => {
      const started = performance.now()
      const timeout = setTimeout(() => { observer.disconnect(); resolve(-1) }, 30000)
      const observer = new MutationObserver(() => {
        if (!document.querySelector('[data-project="150"]')) return
        observer.disconnect(); clearTimeout(timeout); requestAnimationFrame(() => resolve(performance.now() - started))
      })
      observer.observe(document.querySelector("[data-project-list]"), { childList: true })
      ${strategy === "windowing" ? 'const target = document.querySelector("[data-scroll-window]"); target.scrollTop = 4000; target.dispatchEvent(new Event("scroll"))' : acceptance ? "" : 'document.querySelector("[data-next]").click()'}
    })`
    let page = 0
    if (strategy !== "direct" && acceptance && strategy === "pagination") {
      await evaluate(cdp, sessionId, `window.__pageAdvance = ${advance}; document.querySelector("[data-next]").focus(); document.activeElement === document.querySelector("[data-next]")`)
      await cdp.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, sessionId)
      await cdp.send("Input.dispatchKeyEvent", { type: "char", key: "Enter", code: "Enter", text: "\r", unmodifiedText: "\r", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, sessionId)
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }, sessionId)
      page = await evaluate(cdp, sessionId, "window.__pageAdvance")
      const advanced = await evaluate(cdp, sessionId, `({ range: document.querySelector("[data-range]").textContent, focused: document.activeElement === document.querySelector("[data-next]") })`)
      if (advanced.range !== "101-200" || !advanced.focused) throw new Error(`keyboard pagination produced range ${advanced.range} and focus ${advanced.focused}`)
    } else if (strategy !== "direct") page = await evaluate(cdp, sessionId, advance)
    if (page < 0) throw new Error(`${strategy} page advance timed out; ${cdp.exceptions.join(", ")}`)
    trace(`${strategy}: advanced`)
    if (strategy !== "direct") {
      await evaluate(cdp, sessionId, strategy === "windowing" ? 'const target = document.querySelector("[data-scroll-window]"); target.scrollTop = 0; target.dispatchEvent(new Event("scroll")); true' : 'document.querySelector("[data-previous]").click(); true')
      await waitUntil(cdp, sessionId, "document.querySelector('[data-project=\"50\"]') && document.querySelectorAll('[data-project]').length === 100")
      if (acceptance && strategy === "pagination" && !await evaluate(cdp, sessionId, `document.querySelector("[data-range]").textContent === "1-100"`)) throw new Error("pagination did not restore the first range")
    }
    trace(`${strategy}: restored`)
    const retained = await evaluate(cdp, sessionId, `({ same: document.querySelector('[data-project="50"]') === window.__row, value: document.querySelector('[data-project="50"] input').value, rows: document.querySelectorAll("[data-project]").length, elements: document.querySelectorAll("*").length })`)
    await cdp.send("HeapProfiler.collectGarbage", {}, sessionId)
    const heap = await cdp.send("Runtime.getHeapUsage", {}, sessionId)
    const dom = await cdp.send("Memory.getDOMCounters", {}, sessionId)
    trace(`${strategy}: measured`)
    if (strategy === "direct" && (!retained.same || retained.value !== "edited")) throw new Error("direct strategy lost retained edit identity")
    if (strategy !== "direct" && (retained.same || retained.value !== "")) throw new Error(`${strategy} did not release and freshly restore off-range edit state`)
    if (cdp.exceptions.length) throw new Error(`browser exceptions: ${cdp.exceptions.join(", ")}`)
    return { loadMs: Number(Number(load).toFixed(3)), pageMs: Number(Number(page).toFixed(3)), rows: retained.rows, elements: retained.elements, domNodes: dom.nodes, documents: dom.documents, listeners: dom.jsEventListeners, heapBytes: heap.usedSize }
  } finally {
    cdp?.socket.close()
    if (child.exitCode === null) child.kill("SIGKILL")
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

let server
try {
  trace("build: start")
  const build = spawnSync(process.execPath, [join(root, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8", timeout: 120_000 })
  if (build.error || build.signal || build.status !== 0) throw build.error || new Error(build.stderr || build.stdout)
  const directHtml = await readFile(join(fixture, "dist/index.html"), "utf8")
  const staticExclusion = (directHtml.match(/data-project="/g) ?? []).length === 10000 && !/<script\b|data-k-(?:on|state|text|attr|list|condition)/.test(directHtml)
  if (!staticExclusion) throw new Error("direct 10,000-row static exclusion failed")
  trace("build: complete")
  const source = `const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),root=process.argv[1];http.createServer((request,response)=>{const pathname=new URL(request.url,"http://localhost").pathname,relative=pathname==="/"?"index.html":pathname.slice(1)+(pathname.endsWith("/")?"index.html":""),file=path.join(root,relative);response.setHeader("content-type",file.endsWith(".js")?"text/javascript":"text/html");fs.createReadStream(file).on("error",()=>response.writeHead(404).end()).pipe(response)}).listen(0,"127.0.0.1",function(){console.log(this.address().port)})`
  server = spawn(process.execPath, ["-e", source, join(fixture, "dist")], { stdio: ["ignore", "pipe", "inherit"] })
  const port = await new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("Benchmark server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Benchmark server exited ${code}`)) })
  })
  const samples = Object.fromEntries(requestedStrategies.map(strategy => [strategy, []]))
  const strategies = Object.keys(samples)
  for (let run = 0; run < runs; run++) for (let offset = 0; offset < strategies.length; offset++) {
    const strategy = strategies[(run + offset) % strategies.length]
    samples[strategy].push(await browserRun(port, strategy))
  }
  const medianBudgetMs = { directLoad: 2000, boundedLoad: 1000, boundedPage: 100 }
  for (const [strategy, values] of runs >= 7 ? Object.entries(samples) : []) {
    const load = summarize(values.map(value => value.loadMs)).median
    const page = summarize(values.map(value => value.pageMs)).median
    if (load > (strategy === "direct" ? medianBudgetMs.directLoad : medianBudgetMs.boundedLoad) || (strategy !== "direct" && page > medianBudgetMs.boundedPage)) throw new Error(`${strategy} median exceeded browser budget`)
  }
  console.log(JSON.stringify({
    fixture: "10,000 project direct DOM, pagination, and bounded-window decision",
    ...(acceptance ? { acceptance: { keyboard: true, focus: true, releasedState: true, staticExclusion } } : {}),
    environment: { node: process.version, platform: process.platform, arch: process.arch, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() },
    methodology: `${runs} rotating fresh Chrome profiles per strategy; forced GC before heap usage`,
    medianBudgetMs,
    strategies: Object.fromEntries(Object.entries(samples).map(([strategy, values]) => [strategy, {
      loadMs: summarize(values.map(value => value.loadMs)),
      pageMs: summarize(values.map(value => value.pageMs)),
      rows: summarize(values.map(value => value.rows)),
      elements: summarize(values.map(value => value.elements)),
      domNodes: summarize(values.map(value => value.domNodes)),
      documents: summarize(values.map(value => value.documents)),
      listeners: summarize(values.map(value => value.listeners)),
      heapBytes: summarize(values.map(value => value.heapBytes))
    }]))
  }, null, 2))
} finally {
  server?.kill()
  rmSync(join(fixture, "dist"), { recursive: true, force: true })
  rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
}
