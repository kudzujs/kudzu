import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { readFile, rm, writeFile } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
import { gzipSync } from "node:zlib"

const roots = {
  baseline: resolve(process.env.BASELINE_ROOT || ""),
  candidate: resolve(process.env.CANDIDATE_ROOT || ".")
}
const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
const runs = Number(process.env.RUNS || 21)
const iterations = Number(process.env.ITERATIONS || 5000)
const timings = { baseline: [], candidate: [] }
const servers = []

if (!process.env.BASELINE_ROOT) throw new Error("BASELINE_ROOT is required")
if (!chrome) throw new Error("Set CHROME_BIN to run the native browser benchmark")
if (![roots.baseline, roots.candidate].every(root => existsSync(resolve(root, "framework/native-runtime.js")))) throw new Error("Baseline or candidate root is missing native-runtime.js")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")
if (!Number.isInteger(iterations) || iterations < 1) throw new Error("ITERATIONS must be a positive integer")

async function buildFixture(name) {
  const root = roots[name]
  const fixture = resolve(root, "test/fixtures/native-bubbling")
  await rm(resolve(fixture, "dist"), { recursive: true, force: true })
  await rm(resolve(fixture, ".kudzu"), { recursive: true, force: true })
  const result = spawnSync(process.execPath, [resolve(root, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8" })
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout || `build exited with ${result.signal || result.status}`)
  const output = resolve(fixture, "dist")
  const html = resolve(output, "index.html")
  await writeFile(html, (await readFile(html, "utf8")).replace("</body>", '<script type="module" src="./native-benchmark.js"></script></body>'))
  await writeFile(resolve(output, "native-benchmark.js"), `
const button = document.querySelector("#update-object")
for (let index = 0; index < 500; index++) button.click()
const start = performance.now()
for (let index = 0; index < ${iterations}; index++) button.click()
document.body.dataset.nativeBenchmark = (performance.now() - start).toFixed(3)
`)
  return output
}

async function browserRun(name, port) {
  const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 30000 })
  if (browser.error || browser.signal || browser.status !== 0) throw browser.error || new Error(browser.stderr || `Chrome exited with ${browser.signal || browser.status}`)
  const value = browser.stdout.match(/data-native-benchmark="([\d.]+)"/)?.[1]
  if (!value) throw new Error(`Native benchmark did not finish: ${browser.stdout.slice(-500)}`)
  return Number(value)
}

function javascriptArtifacts(directory, root = directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) javascriptArtifacts(path, root, files)
    else if (path.endsWith(".js") && entry.name !== "native-benchmark.js") {
      const bytes = readFileSync(path)
      files.push({ file: relative(root, path), raw: bytes.length, gzip: gzipSync(bytes).length, hash: createHash("sha256").update(bytes).digest("hex") })
    }
  }
  return files
}

const outputs = { baseline: await buildFixture("baseline"), candidate: await buildFixture("candidate") }
const artifacts = Object.fromEntries(Object.entries(outputs).map(([name, output]) => [name, javascriptArtifacts(output).sort((left, right) => left.file.localeCompare(right.file))]))
if (artifacts.baseline.map(entry => entry.file).join("\n") !== artifacts.candidate.map(entry => entry.file).join("\n")) throw new Error("Native benchmark emitted different JavaScript paths")
const changed = artifacts.candidate.filter((entry, index) => entry.hash !== artifacts.baseline[index].hash).map(entry => entry.file)
if (changed.length !== 2 || !changed.some(file => file.endsWith("/kudzu-native.js")) || !changed.some(file => file.endsWith("/kudzu-serialization.js"))) throw new Error(`Unexpected native benchmark artifact changes: ${JSON.stringify(changed)}`)
const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1]
http.createServer((request, response) => {
  const relative = new URL(request.url, "http://localhost").pathname.slice(1)
  const file = path.join(root, relative || "index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(0, "127.0.0.1", function () { console.log(this.address().port) })
`

async function startServer(output) {
  const server = spawn(process.execPath, ["-e", serverSource, output], { stdio: ["ignore", "pipe", "pipe"] })
  servers.push(server)
  let serverError = ""
  server.stderr.on("data", chunk => { serverError += chunk })
  return await new Promise((resolvePort, reject) => {
    const timeout = setTimeout(() => reject(new Error("benchmark server did not start")), 5000)
    server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`benchmark server exited ${code}: ${serverError}`)) })
  })
}

try {
  const ports = { baseline: await startServer(outputs.baseline), candidate: await startServer(outputs.candidate) }
  await browserRun("baseline", ports.baseline)
  await browserRun("candidate", ports.candidate)
  for (let round = 0; round < runs; round++) {
    for (const name of round % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"]) timings[name].push(await browserRun(name, ports[name]))
  }
  const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
  const totals = entries => entries.reduce((result, entry) => ({ raw: result.raw + entry.raw, gzip: result.gzip + entry.gzip }), { raw: 0, gzip: 0 })
  console.log(JSON.stringify({ iterations, environment: { node: process.version, chrome: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim() }, methodology: `one warm-up and ${runs} alternating headless Chrome processes`, timings, medians: { baseline: median(timings.baseline), candidate: median(timings.candidate) }, javascript: { baseline: totals(artifacts.baseline), candidate: totals(artifacts.candidate), changed, files: artifacts.candidate.map(entry => entry.file) } }, null, 2))
} finally {
  for (const server of servers) server.kill()
  for (const root of Object.values(roots)) {
    await rm(resolve(root, "test/fixtures/native-bubbling/dist"), { recursive: true, force: true })
    await rm(resolve(root, "test/fixtures/native-bubbling/.kudzu"), { recursive: true, force: true })
  }
}
