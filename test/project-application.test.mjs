import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import { createServer } from "node:http"
import { createConnection } from "node:net"
import test from "node:test"
import { gzipSync } from "node:zlib"

const fixture = new URL("./fixtures/project-application/", import.meta.url)
const cli = new URL("../bin/kudzu.mjs", import.meta.url)
const chromePaths = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)

test("establishes the 0.10.1 application state contract", { timeout: 120_000 }, async t => {
  t.after(async () => {
    await rm(new URL(".kudzu", fixture), { recursive: true, force: true })
    await rm(new URL("dist", fixture), { recursive: true, force: true })
  })

  const result = spawnSync(process.execPath, [cli.pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const contract = JSON.parse(await readFile(new URL("capabilities.json", fixture), "utf8"))
  const plan = JSON.parse(await readFile(new URL(".kudzu/kudzu-plan.json", fixture), "utf8"))
  const artifacts = JSON.parse(await readFile(new URL(".kudzu/kudzu-artifacts.json", fixture), "utf8"))
  const routes = plan.routes.map(route => route.route).sort()
  assert.deepEqual(routes, contract.routes)
  assert.equal(contract.milestone, "0.10.1")

  const projects = plan.routes.find(route => route.route === "/app/projects")
  const projectArtifacts = artifacts.routes.find(route => route.route === "/app/projects")
  assert.deepEqual(projects.states.filter(state => !state.internal && !state.name.startsWith("__kRowState")).map(state => state.name), ["workspace", "projects", "filter", "showSummary", "savedFilters"])
  assert.equal(projects.bindings.length, 6)
  assert.equal(projects.lists.length, 3)
  assert.equal(projects.lists.some(list => list.ownerField === "issues"), true)
  assert.equal(projects.lists.some(list => Object.values(list.selectorStates ?? {}).includes(projects.states.find(state => state.name === "filter").id) && list.rowStates?.length === 1), true)
  assert.equal(projects.conditions.some(condition => condition.state === projects.states.find(state => state.name === "showSummary").id), true)
  assert.deepEqual(projectArtifacts.capability.manifest.events.command, ["click"])
  assert.deepEqual(projectArtifacts.capability.manifest.events.native, ["click"])
  assert.equal(projectArtifacts.capability.manifest.bindings.text, true)
  assert.equal(projectArtifacts.capability.manifest.lists.nested, true)
  assert.equal(projectArtifacts.capability.manifest.lists.rowHooks, true)
  assert.equal(projectArtifacts.capability.manifest.lists.selectors, true)
  assert.equal(projectArtifacts.handlers.entries.length, 1)
  assert.equal(projectArtifacts.runtime.entries.length, 1)
  assert.equal(projectArtifacts.runtime.requirements.some(path => path.endsWith("/kudzu-list.js")), true)

  const helpHtml = await readFile(new URL("dist/help/index.html", fixture), "utf8")
  const helpArtifacts = artifacts.routes.find(route => route.route === "/help")
  assert.match(helpHtml, /<h1>Project help<\/h1>/)
  assert.doesNotMatch(helpHtml, /<script|data-k-/)
  assert.deepEqual(helpArtifacts.runtime, { family: null, entries: [], requirements: [] })
  assert.deepEqual(helpArtifacts.handlers, { entries: [], chunks: [] })
  const output = await outputBaseline(artifacts)
  const stableOutput = structuredClone(output)
  const stableBaseline = structuredClone(contract.baseline)
  delete stableOutput.deploy.aggregateGzipBytes
  delete stableBaseline.deploy.aggregateGzipBytes
  delete stableOutput.routes["/app/projects"].javascriptAggregateGzipBytes
  delete stableBaseline.routes["/app/projects"].javascriptAggregateGzipBytes
  assert.deepEqual(stableOutput, stableBaseline)
  // gzip output varies slightly across zlib versions; raw bytes and hashes stay exact.
  assert.ok(Math.abs(output.deploy.aggregateGzipBytes - contract.baseline.deploy.aggregateGzipBytes) <= 32)
  assert.ok(Math.abs(output.routes["/app/projects"].javascriptAggregateGzipBytes - contract.baseline.routes["/app/projects"].javascriptAggregateGzipBytes) <= 24)

  const chrome = process.env.KUDZU_SKIP_BROWSER ? undefined : chromePaths.find(existsSync)
  if (process.env.KUDZU_REQUIRE_CHROME && !chrome) throw new Error("Chrome is required for the project application test; set CHROME_BIN to an executable Chrome or Chromium binary")
  if (chrome) await runBrowserJourney(chrome)
})

async function runBrowserJourney(chrome) {
  const output = new URL("dist/", fixture)
  const htmlUrl = new URL("app/projects/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (predicate, label) => {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error(label)
}
const browserErrors = []
addEventListener("error", event => browserErrors.push(event.error?.message ?? event.message))
addEventListener("unhandledrejection", event => browserErrors.push(event.reason?.message ?? String(event.reason)))
const originalConsoleError = console.error
console.error = (...values) => {
  browserErrors.push(values.map(String).join(" "))
  originalConsoleError(...values)
}
try {
  await waitFor(() => document.querySelector('[data-project="alpha"]'), "initial-projects")
  await new Promise(resolve => setTimeout(resolve, 100))
  const output = document.querySelector("#project-filter")
  if (output.textContent !== "All projects") throw new Error("initial-state")
  if (document.querySelector("#project-count").textContent !== "2") throw new Error("initial-summary")
  const unrelated = document.querySelector("#unrelated-control")
  let unrelatedMutations = 0
  new MutationObserver(records => { unrelatedMutations += records.length }).observe(unrelated, { attributes: true, childList: true, characterData: true, subtree: true })
  const alpha = document.querySelector('[data-project="alpha"]')
  const beta = document.querySelector('[data-project="beta"]')
  const savedAll = document.querySelector('[data-saved-filter="all"]')

  document.querySelector("#show-active").click()
  await waitFor(() => !document.querySelector('[data-project="beta"]'), "filter-remove")
  if (output.textContent !== "Active projects") throw new Error("state-command")
  if (document.querySelector('[data-project="alpha"]') !== alpha || beta.isConnected) throw new Error("filter-identity")

  document.querySelector("#show-all").click()
  await waitFor(() => document.querySelector('[data-project="beta"]'), "filter-restore")
  const issue = document.querySelector('[data-issue="a1"]')
  document.querySelector('[data-expand="alpha"]').click()
  await waitFor(() => document.querySelector('[data-expand="alpha"]').getAttribute("aria-expanded") === "true", "expand")
  document.querySelector("#replace-workspace").click()
  await waitFor(() => document.querySelector('[data-issue="a3"]'), "object-replace")
  if (document.querySelector('[data-project="alpha"]') !== alpha || document.querySelector('[data-issue="a1"]') !== issue) throw new Error("nested-identity")
  if (alpha.querySelector("[data-project-name]").textContent !== "Alpha updated" || alpha.querySelector("[data-issue-count]").textContent !== "3") throw new Error("object-bindings")
  if (document.querySelector("#total-issues").textContent !== "4") throw new Error("derived-count")

  document.querySelector("#save-active").click()
  await waitFor(() => document.querySelector('[data-saved-filter="active"]'), "array-state")
  if (document.querySelector('[data-saved-filter="all"]') !== savedAll) throw new Error("array-identity")

  const summary = document.querySelector("#project-summary")
  document.querySelector("#toggle-summary").click()
  await waitFor(() => !document.querySelector("#project-summary"), "summary-remove")
  if (summary.isConnected) throw new Error("summary-release")
  document.querySelector("#toggle-summary").click()
  await waitFor(() => document.querySelector("#project-summary"), "summary-restore")
  if (document.querySelector("#project-summary") === summary) throw new Error("summary-identity")

  document.querySelector("#remove-alpha").click()
  await waitFor(() => !document.querySelector('[data-project="alpha"]'), "row-remove")
  if (alpha.isConnected || issue.isConnected) throw new Error("row-release")
  document.querySelector("#restore-alpha").click()
  await waitFor(() => document.querySelector('[data-project="alpha"]'), "row-restore")
  const restored = document.querySelector('[data-project="alpha"]')
  if (restored === alpha || restored.querySelector('[data-expand="alpha"]').getAttribute("aria-expanded") !== "false") throw new Error("row-state-reset")
  if (document.querySelector("#unrelated-control") !== unrelated || unrelatedMutations) throw new Error("unrelated-dom")
  if (browserErrors.length) throw new Error("browser-errors-" + browserErrors.join("-"))
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message + (browserErrors.length ? "-" + browserErrors.join("-") : "")
}
`)

  const port = await availablePort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname
  const relative = pathname === "/" ? "index.html" : pathname.slice(1)
  const file = path.join(root, relative.endsWith("/") ? relative + "index.html" : relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--enable-logging=stderr", "--virtual-time-budget=10000", "--dump-dom", `http://127.0.0.1:${port}/app/projects/`], { encoding: "utf8", timeout: 30_000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/, browser.stderr)
  } finally {
    server.kill()
  }
}

async function availablePort() {
  const server = createServer()
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve))
  const { port } = server.address()
  await new Promise(resolve => server.close(resolve))
  return port
}

async function outputBaseline(artifacts) {
  const files = []
  const walk = async (directory, prefix = "") => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`
      const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory)
      if (entry.isDirectory()) await walk(url, `${path}/`)
      else {
        const contents = await readFile(url)
        files.push({ path, contents, hash: createHash("sha256").update(contents).digest("hex") })
      }
    }
  }
  await walk(new URL("dist/", fixture))
  files.sort((left, right) => left.path.localeCompare(right.path))
  const routeBytes = route => {
    const record = artifacts.routes.find(entry => entry.route === route)
    const assets = new Set([...record.runtime.entries, ...record.runtime.requirements, ...record.handlers.entries, ...record.handlers.chunks, ...record.workers.flatMap(worker => [worker.entry, ...worker.chunks])].map(path => path.slice(1)))
    const selected = files.filter(file => assets.has(file.path))
    return {
      javascriptRawBytes: selected.reduce((total, file) => total + file.contents.length, 0),
      javascriptAggregateGzipBytes: selected.reduce((total, file) => total + gzipSync(file.contents).length, 0)
    }
  }
  return {
    deploy: {
      files: files.length,
      rawBytes: files.reduce((total, file) => total + file.contents.length, 0),
      aggregateGzipBytes: files.reduce((total, file) => total + gzipSync(file.contents).length, 0),
      sha256: createHash("sha256").update(files.map(file => `${file.path}:${file.hash}`).join("\n")).digest("hex")
    },
    routes: {
      "/app/projects": routeBytes("/app/projects"),
      "/help": routeBytes("/help")
    }
  }
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const ready = await new Promise(resolve => {
      const socket = createConnection({ host: "127.0.0.1", port })
      socket.once("connect", () => { socket.destroy(); resolve(true) })
      socket.once("error", () => { socket.destroy(); resolve(false) })
    })
    if (ready) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`Project application server did not start on port ${port}`)
}
