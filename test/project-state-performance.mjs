import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const baseline = process.env.BASELINE_ROOT && resolve(process.env.BASELINE_ROOT)
const runs = Number(process.env.RUNS ?? 7)
const scales = [1, 8, 32]
const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
if (!chrome) throw new Error("Set CHROME_BIN to run the project state benchmark")
if (!baseline) throw new Error("Set BASELINE_ROOT to a Kudzu 0.10.0 checkout")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")

const fixture = mkdtempSync(join(tmpdir(), "kudzu-project-state-"))
let server
async function main() {
  try {
    generateFixture()
    const baselineOutput = build(baseline)
    const candidateOutput = build(root)
    if (baselineOutput.digest !== candidateOutput.digest) throw new Error("Candidate deploy output differs from 0.10.0")
    const port = await serve()
    const timings = Object.fromEntries(scales.map(scale => [scale, []]))
    for (let run = 0; run < runs; run++) for (const scale of scales) timings[scale].push(await browserRun(port, scale))
    const artifacts = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-artifacts.json"), "utf8"))
    const plan = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-plan.json"), "utf8"))
    console.log(JSON.stringify({
      fixture: "generated project state/dependency scale",
      environment: { node: process.version, platform: process.platform, arch: process.arch, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() },
      methodology: `${runs} fresh headless Chrome processes per scale; 0.10.0 and candidate deploy digests compared before timing`,
      deploy: candidateOutput,
      scales: Object.fromEntries(scales.map(scale => {
        const route = `/scale-${scale}`
        const routePlan = plan.routes.find(entry => entry.route === route)
        const routeArtifacts = artifacts.routes.find(entry => entry.route === route)
        return [scale, {
          states: routePlan.states.length,
          bindings: routePlan.bindings.length,
          dependencyEdges: routePlan.bindings.reduce((total, binding) => total + (Object.hasOwn(binding, "state") ? 1 : new Set(Object.values(binding.states ?? {})).size), 0),
          events: routePlan.events.length,
          runtimeEntries: routeArtifacts.runtime.entries,
          runtimeRequirements: routeArtifacts.runtime.requirements,
          javascript: routeBytes(routeArtifacts),
          commitMs: summarize(timings[scale])
        }]
      }))
    }, null, 2))
  } finally {
    server?.kill()
    rmSync(fixture, { recursive: true, force: true })
  }
}

function generateFixture() {
  mkdirSync(join(fixture, "src/pages"), { recursive: true })
  mkdirSync(join(fixture, "node_modules/@kudzujs"), { recursive: true })
  writeFileSync(join(fixture, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", jsx: "react-jsx", jsxImportSource: "@kudzujs/core", strict: true }, include: ["src"] }))
  for (const scale of scales) {
    const states = Array.from({ length: scale }, (_, index) => `  const [value${index}, setValue${index}] = useState(0)`)
    const setters = Array.from({ length: scale }, (_, index) => `      setValue${index}(value${index} + 1)`)
    const outputs = Array.from({ length: scale }, (_, index) => `      <span data-value="${index}">{value${index}}</span>`)
    writeFileSync(join(fixture, `src/pages/scale-${scale}.tsx`), `${[
      'import { useState } from "@kudzujs/core"',
      "",
      `export default function Scale${scale}Page() {`,
      ...states,
      `  const total = ${Array.from({ length: scale }, (_, index) => `value${index}`).join(" + ")}`,
      "  return <main>",
      "    <button id=\"commit\" onClick={() => {",
      ...setters,
      "    }}>Commit</button>",
      `    <output id="total">{total}</output>`,
      "    <div id=\"values\">",
      ...outputs,
      "    </div>",
      "  </main>",
      "}"
    ].join("\n")}\n`)
  }
}

function build(target) {
  rmSync(join(fixture, "node_modules/@kudzujs/core"), { recursive: true, force: true })
  symlinkSync(target, join(fixture, "node_modules/@kudzujs/core"), "dir")
  rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
  rmSync(join(fixture, "dist"), { recursive: true, force: true })
  const result = spawnSync(process.execPath, [join(target, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8" })
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout)
  const files = walk(join(fixture, "dist"))
  const hash = createHash("sha256")
  for (const file of files) hash.update(relative(join(fixture, "dist"), file)).update("\0").update(readFileSync(file))
  return { files: files.length, rawBytes: files.reduce((total, file) => total + readFileSync(file).length, 0), digest: hash.digest("hex") }
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

function sleep(milliseconds) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, milliseconds))
}

async function evaluate(cdp, sessionId, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

async function browserRun(port, scale) {
  const profile = await mkdtemp(join(tmpdir(), "kudzu-project-state-benchmark-"))
  const child = spawn(chrome, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync"], { stdio: "ignore" })
  let cdp
  try {
    const [debugPort, browserPath] = (await waitForFile(join(profile, "DevToolsActivePort"), child)).trim().split("\n")
    cdp = new CDP(`ws://127.0.0.1:${debugPort}${browserPath}`)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Runtime.enable", {}, sessionId)
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${port}/scale-${scale}/` }, sessionId)
    await waitUntil(cdp, sessionId, 'document.readyState === "complete" && document.querySelector("#commit")')
    const elapsed = await evaluate(cdp, sessionId, `new Promise((resolve, reject) => {
      const output = document.querySelector("#total")
      let settled = false
      const timeout = setTimeout(() => { if (!settled) { settled = true; observer.disconnect(); reject(new Error("commit timed out")) } }, 30000)
      const complete = () => {
        if (settled || output.textContent !== "${scale}") return
        settled = true
        observer.disconnect()
        clearTimeout(timeout)
        resolve(performance.now() - started)
      }
      const observer = new MutationObserver(complete)
      observer.observe(output, { characterData: true, childList: true, subtree: true })
      const started = performance.now()
      document.querySelector("#commit").click()
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
  const source = `const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),root=process.argv[1];http.createServer((request,response)=>{const pathname=new URL(request.url,"http://localhost").pathname,relative=pathname==="/"?"index.html":pathname.slice(1),file=path.join(root,relative.endsWith("/")?relative+"index.html":relative);response.setHeader("content-type",file.endsWith(".js")?"text/javascript":"text/html");fs.createReadStream(file).on("error",()=>response.writeHead(404).end()).pipe(response)}).listen(0,"127.0.0.1",function(){console.log(this.address().port)})`
  server = spawn(process.execPath, ["-e", source, join(fixture, "dist")], { stdio: ["ignore", "pipe", "inherit"] })
  return new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("Benchmark server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Benchmark server exited ${code}`)) })
  })
}

function routeBytes(route) {
  const root = join(fixture, "dist")
  const paths = [...route.runtime.entries, ...route.runtime.requirements, ...route.handlers.entries, ...route.handlers.chunks].map(path => join(root, path.slice(1)))
  return paths.reduce((total, file) => {
    const bytes = readFileSync(file)
    total.rawBytes += bytes.length
    total.aggregateGzipBytes += gzipSync(bytes).length
    return total
  }, { rawBytes: 0, aggregateGzipBytes: 0 })
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else files.push(file)
  }
  return files.sort()
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1) }
}

await main()
