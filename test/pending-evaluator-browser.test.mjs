import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { createServer } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { CDP, evaluate, waitForPort } from "./browser-cdp.mjs"

test("Chrome preserves DOM and state authority while evaluators are pending", { timeout: 60000 }, async t => {
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find(existsSync)
  if (process.env.KUDZU_SKIP_BROWSER || !chrome) {
    if (process.env.KUDZU_REQUIRE_CHROME) throw new Error("Chrome is required for pending evaluator ownership validation")
    t.skip("Chrome not available or browser tests explicitly skipped")
    return
  }
  const assets = new Map([["/", "<!doctype html><html><head><title>Evaluator ownership</title></head><body></body></html>"]])
  for (const file of ["shared-runtime.js", "binding-runtime.js", "serialization.js", "style.js"]) assets.set(`/${file}`, await readFile(new URL(`../framework/${file}`, import.meta.url), "utf8"))
  assets.set("/journey.js", await readFile(new URL("./fixtures/pending-evaluator-browser/journey.js", import.meta.url), "utf8"))
  const server = createServer((request, response) => {
    if (request.url === "/favicon.ico") { response.writeHead(204).end(); return }
    const source = assets.get(request.url)
    response.writeHead(source === undefined ? 404 : 200, { "content-type": request.url === "/" ? "text/html" : "text/javascript" })
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
  await cdp.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/` }, sessionId)
  await loaded
  const results = await evaluate(cdp, 'import("/journey.js").then(module => module.run()).catch(error => ({ error: error.message }))')
  assert.deepEqual(results, ["attribute", "text", "condition"].flatMap(kind => ["unmount", "remount", "release", "release-remount", "commit"].map(action => `${kind}-${action}`)))
  assert.deepEqual(cdp.exceptions, [])
  assert.deepEqual(cdp.consoleErrors, [])
})
