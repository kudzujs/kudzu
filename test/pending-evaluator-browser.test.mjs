import assert from "node:assert/strict"
import { execFileSync, spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { CDP, evaluate, waitForPort } from "./browser-cdp.mjs"

test("Chrome preserves evaluator ownership and keyed condition revisions", { timeout: 60000 }, async t => {
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find(existsSync)
  if (process.env.KUDZU_SKIP_BROWSER || !chrome) {
    if (process.env.KUDZU_REQUIRE_CHROME) throw new Error("Chrome is required for pending evaluator ownership validation")
    t.skip("Chrome not available or browser tests explicitly skipped")
    return
  }
  const assets = new Map([["/", "<!doctype html><html><head><title>Evaluator ownership</title></head><body></body></html>"]])
  for (const file of ["shared-runtime.js", "binding-runtime.js", "serialization.js", "style.js"]) assets.set(`/${file}`, await readFile(new URL(`../framework/${file}`, import.meta.url), "utf8"))
  assets.set("/journey.js", await readFile(new URL("./fixtures/pending-evaluator-browser/journey.js", import.meta.url), "utf8"))
  const fixture = new URL("./fixtures/list-condition-revision/", import.meta.url)
  t.after(async () => {
    for (const path of ["dist", ".kudzu"]) await rm(new URL(path, fixture), { recursive: true, force: true })
  })
  execFileSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, timeout: 30000 })
  const dist = new URL("dist/", fixture)
  for (const path of await readdir(dist, { recursive: true })) {
    if (path.endsWith(".js") || path.endsWith(".html")) assets.set(path === "index.html" ? "/list/" : `/${path}`, await readFile(new URL(path, dist), "utf8"))
  }
  assert.doesNotMatch(assets.get("/static/index.html"), /<script/)
  const server = createServer((request, response) => {
    if (request.url === "/favicon.ico") { response.writeHead(204).end(); return }
    const source = assets.get(request.url)
    response.writeHead(source === undefined ? 404 : 200, { "content-type": request.url.endsWith("/") || request.url.endsWith(".html") ? "text/html" : "text/javascript" })
    response.end(source ?? "Not found")
  })
  t.after(() => { server.closeAllConnections(); server.close() })
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve) })
  const profile = await mkdtemp(join(tmpdir(), "kudzu-pending-evaluator-"))
  let cdp
  const browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`], { stdio: "ignore" })
  t.after(async () => {
    cdp?.socket.close()
    if (browser.exitCode === null && browser.signalCode === null) {
      const exited = new Promise(resolve => browser.once("exit", resolve))
      browser.kill("SIGKILL")
      await exited
    }
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  })
  const { port, path } = await waitForPort(profile, browser)
  cdp = new CDP(`ws://127.0.0.1:${port}${path}`)
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
  cdp.sessionId = sessionId
  await cdp.send("Page.enable", {}, sessionId)
  await cdp.send("Runtime.enable", {}, sessionId)
  const navigate = async path => {
    const loaded = new Promise(resolve => {
      const listener = event => {
        const message = JSON.parse(event.data)
        if (message.sessionId === sessionId && message.method === "Page.loadEventFired") {
          cdp.socket.removeEventListener("message", listener)
          resolve()
        }
      }
      cdp.socket.addEventListener("message", listener)
    })
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}${path}` }, sessionId)
    await loaded
  }
  await navigate("/")
  const results = await evaluate(cdp, 'import("/journey.js").then(module => module.run()).catch(error => ({ error: error.message }))')
  assert.deepEqual(results, ["attribute", "text", "condition"].flatMap(kind => ["unmount", "remount", "release", "release-remount", "commit"].map(action => `${kind}-${action}`)))
  await navigate("/list/")
  await evaluate(cdp, 'Promise.all([...document.querySelectorAll("script[type=module]")].map(script => import(script.src)))')
  await evaluate(cdp, 'globalThis.retainedRow = document.querySelector("[data-row]"); true')
  for (const [action, selected, label, detail] of [["show", "true", "Updated", "Updated detail"], ["toggle", "false", "Updated", "Updated detail"], ["toggle", "true", "Updated", "Updated detail"], ["hide", "false", "Hidden", null], ["show", "true", "Updated", "Updated detail"]]) {
    const observation = await evaluate(cdp, `(async () => {
      const previousDetail = document.querySelector("[data-detail]")
      document.querySelector("[data-${action}]").click()
      const deadline = Date.now() + 5000
      while (document.querySelector("[data-row]").getAttribute("aria-selected") !== ${JSON.stringify(selected)}) {
        if (Date.now() > deadline) throw new Error("Selected row did not update")
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      await new Promise(resolve => setTimeout(resolve, 0))
      return { retained: document.querySelector("[data-row]") === globalThis.retainedRow, branchRetained: ${JSON.stringify(action)} !== "toggle" || document.querySelector("[data-detail]") === previousDetail, label: document.querySelector("[data-label]").textContent, detail: document.querySelector("[data-detail]")?.textContent ?? null }
    })()`)
    assert.deepEqual(observation, { retained: true, branchRetained: true, label, detail }, `same-turn list and parent-state update: ${action}`)
  }
  assert.deepEqual(cdp.exceptions, [])
  assert.deepEqual(cdp.consoleErrors, [])
})
