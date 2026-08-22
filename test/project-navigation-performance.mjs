import { spawn, spawnSync } from "node:child_process"
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = join(root, "test/fixtures/project-application")
const runs = Number(process.env.RUNS ?? 7)
const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
if (!chrome) throw new Error("Set CHROME_BIN to run the project navigation benchmark")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")

let server
async function main() {
  try {
    const build = spawnSync(process.execPath, [join(root, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8" })
    if (build.error || build.signal || build.status !== 0) throw build.error || new Error(build.stderr || build.stdout)
    const port = await serve()
    const navigationMs = []
    for (let run = 0; run < runs; run++) navigationMs.push(await browserRun(port))
    const artifacts = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-artifacts.json"), "utf8"))
    const plan = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-plan.json"), "utf8"))
    const paths = new Set()
    for (const route of ["/app/projects", "/app/projects/alpha"]) {
      const record = artifacts.routes.find(entry => entry.route === route)
      for (const path of [...record.runtime.entries, ...record.runtime.requirements, ...record.handlers.entries, ...record.handlers.chunks]) paths.add(path)
    }
    const javascript = [...paths].map(path => readFileSync(join(fixture, "dist", path.slice(1))))
    console.log(JSON.stringify({
      fixture: "project application shared-layout navigation",
      environment: { node: process.version, platform: process.platform, arch: process.arch, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() },
      methodology: `${runs} fresh Chrome profiles; initial project fetch and workspace update precede measured list-to-detail completion`,
      states: Object.fromEntries(plan.routes.filter(route => route.route.startsWith("/app/projects")).map(route => [route.route, route.states.map(state => ({ name: state.name, lifetime: state.lifetime }))])),
      sessionJavascript: { files: paths.size, rawBytes: javascript.reduce((total, bytes) => total + bytes.length, 0), aggregateGzipBytes: javascript.reduce((total, bytes) => total + gzipSync(bytes).length, 0) },
      navigationMs: summarize(navigationMs)
    }, null, 2))
  } finally {
    server?.kill()
    rmSync(join(fixture, "dist"), { recursive: true, force: true })
    rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
  }
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

async function browserRun(port) {
  const profile = await mkdtemp(join(tmpdir(), "kudzu-project-navigation-"))
  const child = spawn(chrome, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync"], { stdio: "ignore" })
  let cdp
  try {
    const [debugPort, browserPath] = (await waitForFile(join(profile, "DevToolsActivePort"), child)).trim().split("\n")
    cdp = new CDP(`ws://127.0.0.1:${debugPort}${browserPath}`)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Runtime.enable", {}, sessionId)
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/app/projects` }, sessionId)
    await waitUntil(cdp, sessionId, 'document.readyState === "complete" && document.querySelector("[data-project=alpha]") && document.querySelector("[role=status]")?.textContent === "Projects loaded"')
    await evaluate(cdp, sessionId, 'window.__layout = document.querySelector("[data-app-layout]"); document.querySelector("[data-switch-workspace]").click(); true')
    await waitUntil(cdp, sessionId, 'document.querySelector("[data-workspace]").textContent === "Secondary"')
    await waitUntil(cdp, sessionId, 'localStorage.getItem("kudzu-project-workspace") === JSON.stringify({ version: 1, workspace: "Secondary" })')
    const elapsed = await evaluate(cdp, sessionId, `new Promise((resolve, reject) => {
      let settled = false
      const timeout = setTimeout(() => { if (!settled) { settled = true; observer.disconnect(); reject(new Error("navigation timed out")) } }, 30000)
      const complete = () => {
        if (settled || !document.querySelector("[data-project-detail]") || document.querySelector("[data-app-layout]") !== window.__layout || document.querySelector("[data-route-workspace]").textContent !== "Secondary") return
        settled = true
        observer.disconnect()
        clearTimeout(timeout)
        resolve(performance.now() - started)
      }
      const observer = new MutationObserver(complete)
      observer.observe(document.body, { childList: true, subtree: true })
      const started = performance.now()
      document.querySelector('a[href="/app/projects/alpha"]').click()
      complete()
    })`)
    if (cdp.exceptions.length) throw new Error(`browser exceptions: ${cdp.exceptions.join(", ")}`)
    await cdp.send("Browser.close")
    return Number(elapsed.toFixed(3))
  } finally {
    cdp?.socket.close()
    if (child.exitCode === null) child.kill("SIGKILL")
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

async function waitForFile(file, child) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (child.exitCode !== null) throw new Error(`Chrome exited early with ${child.exitCode}`)
    try { return await readFile(file, "utf8") } catch {}
    await sleep(10)
  }
  throw new Error("Chrome DevToolsActivePort did not appear")
}

async function waitUntil(cdp, sessionId, expression) {
  const started = Date.now()
  while (Date.now() - started < 30_000) {
    if (await evaluate(cdp, sessionId, expression)) return
    await sleep(10)
  }
  throw new Error(`DOM predicate timed out: ${expression}`)
}

async function serve() {
  const source = `const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),root=process.argv[1];http.createServer((request,response)=>{const pathname=new URL(request.url,"http://localhost").pathname;if(pathname==="/api/projects"){response.setHeader("content-type","application/json");response.end(JSON.stringify([{id:"alpha",name:"Alpha",status:"active",issues:[{id:"a1",title:"Design schema"},{id:"a2",title:"Ship dashboard"}]},{id:"beta",name:"Beta",status:"archived",issues:[{id:"b1",title:"Archive notes"}]}]));return}const relative=pathname==="/"?"index.html":pathname.slice(1),file=path.join(root,relative.endsWith("/")||!path.extname(relative)?relative+(relative.endsWith("/")?"":"/")+"index.html":relative);response.setHeader("content-type",file.endsWith(".js")?"text/javascript":"text/html");fs.createReadStream(file).on("error",()=>response.writeHead(404).end()).pipe(response)}).listen(0,"127.0.0.1",function(){console.log(this.address().port)})`
  server = spawn(process.execPath, ["-e", source, join(fixture, "dist")], { stdio: ["ignore", "pipe", "inherit"] })
  return new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("Benchmark server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Benchmark server exited ${code}`)) })
  })
}

function sleep(milliseconds) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, milliseconds))
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1) }
}

await main()
