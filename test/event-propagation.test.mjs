import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import { join, resolve } from "node:path"
import test from "node:test"
import { build } from "../framework/build.mjs"
import { CDP, evaluate, waitForPort } from "./browser-cdp.mjs"

test("compiled commands preserve native bubbling across runtime families and DOM remounts", { timeout: 60000 }, async t => {
  const root = await mkdtemp(resolve("test/fixtures/event-propagation-"))
  let server
  let browser
  let cdp
  t.after(async () => {
    cdp?.socket.close()
    if (browser && browser.exitCode === null && browser.signalCode === null) {
      const exited = new Promise(resolve => browser.once("exit", resolve))
      browser.kill("SIGKILL")
      await exited
    }
    if (server?.listening) {
      server.closeAllConnections()
      await new Promise(resolve => server.close(resolve))
    }
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  })
  await mkdir(join(root, "src/pages"), { recursive: true })
  for (const mode of ["core", "dependency", "shared"]) {
    await writeFile(join(root, `src/pages/${mode}.tsx`), `
import { useEffect, useState } from "@kudzujs/core"
${mode === "shared" ? `function Row({ item }: { item: { id: number } }) {
  const [visits, setVisits] = useState(0)
  return <li data-row={item.id}><button data-row-click onClick={() => setVisits(visits + 1)}>Visit</button><span data-row-count>{visits}</span></li>
}` : ""}
export default function Page() {
  const [outer, setOuter] = useState(0)
  const [inner, setInner] = useState(0)
  const [flag, setFlag] = useState(false)
  ${mode === "shared" ? 'const [rows, setRows] = useState([{ id: 1 }])' : ""}
  ${mode === "dependency" ? 'useEffect(() => { console.log(outer) }, [outer])' : ""}
  return <main ${mode === "shared" ? 'title={outer}' : ""}>
    <div id="outer" onClick={() => setOuter(outer + 1)}>
      <button id="inner" onClick={() => setInner(inner + 1)}><span id="target">Click</span></button>
      <button id="direct" onClick={() => setFlag(true)}>Set flag</button>
    </div>
    <p id="outer-count">{outer}</p><p id="inner-count">{inner}</p><p id="flag">{flag}</p>
    ${mode === "shared" ? `
    <div onClick={() => { document.body.dataset.seen = document.querySelector("#inner-count")?.textContent ?? "" }}>
      <button id="mixed" onClick={() => setInner(inner + 1)}>Mixed</button>
    </div>
    <div onClick={() => setOuter(outer + 1)}>
      <div onClick={event => { event.stopPropagation() }}><button id="stop" onClick={() => setInner(inner + 1)}>Stop</button></div>
    </div>
    <button id="toggle" onClick={() => setFlag(!flag)}>Toggle</button>
    {flag && <section onClick={() => setOuter(outer + 1)}><button id="conditional" onClick={() => setInner(inner + 1)}>Conditional</button></section>}
    <ul onClick={() => setOuter(outer + 1)}>{rows.map(item => <Row key={item.id} item={item} />)}</ul>
    <ol>{rows.map(item => <li key={item.id} data-parent-row={item.id}><button onClick={() => setFlag(true)}>Flag</button></li>)}</ol>
    <button id="add-row" onClick={() => setRows([{ id: 1 }, { id: 2 }])}>Add</button>
    <button id="clear-rows" onClick={() => setRows([])}>Clear</button>
    ` : ""}
  </main>
}
`)
  }
  await writeFile(join(root, "src/pages/static.tsx"), "export default function Static() { return <p>Static sibling</p> }")
  await build({ root, quiet: true })
  assert.doesNotMatch(await readFile(join(root, "dist/static/index.html"), "utf8"), /<script|modulepreload/)
  const chrome = !process.env.KUDZU_SKIP_BROWSER && [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(path => path && existsSync(path))
  if (!chrome) {
    if (process.env.KUDZU_REQUIRE_CHROME) throw new Error("Chrome is required for command propagation validation")
    t.skip("Chrome unavailable or browser tests explicitly skipped")
    return
  }
  server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, "http://localhost").pathname
      const file = join(root, "dist", path.endsWith(".js") ? path : `${path}/index.html`)
      const contents = await readFile(file)
      response.writeHead(200, { "content-type": path.endsWith(".js") ? "text/javascript" : "text/html" }).end(contents)
    } catch { response.writeHead(404).end() }
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const profile = await mkdtemp(join(root, "chrome-"))
  browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" })
  const { port, path } = await waitForPort(profile, browser)
  cdp = new CDP(`ws://127.0.0.1:${port}${path}`)
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
  cdp.sessionId = sessionId
  await cdp.send("Page.enable", {}, sessionId)
  for (const mode of ["core", "dependency", "shared"]) {
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
    await cdp.send("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/${mode}` }, sessionId)
    await loaded
    await evaluate(cdp, 'Promise.all([...document.querySelectorAll("script[type=module]")].map(script => import(script.src)))')
    assert.deepEqual(await evaluate(cdp, `(() => {
      document.querySelector("#target").click()
      document.querySelector("#direct").click()
      return ["outer-count", "inner-count", "flag"].map(id => document.getElementById(id).textContent)
    })()`), ["2", "1", "true"], mode)
    if (mode !== "shared") continue
    assert.deepEqual(await evaluate(cdp, `(() => {
      document.querySelector("#mixed").click()
      document.querySelector("#stop").click()
      return [document.body.dataset.seen, document.querySelector("#outer-count").textContent, document.querySelector("#inner-count").textContent]
    })()`), ["2", "2", "3"])
    assert.deepEqual(await evaluate(cdp, `(() => {
      const old = document.querySelector("#conditional")
      old.click()
      document.querySelector("#toggle").click()
      old.click()
      document.querySelector("#toggle").click()
      document.querySelector("#conditional").click()
      return [document.querySelector("#outer-count").textContent, document.querySelector("#inner-count").textContent]
    })()`), ["4", "5"])
    assert.deepEqual(await evaluate(cdp, `(async () => {
      const tick = () => new Promise(resolve => setTimeout(resolve, 0))
      const first = document.querySelector('[data-row="1"]')
      first.querySelector("button").click()
      document.querySelector("#toggle").click()
      document.querySelector("#add-row").click()
      await tick()
      document.querySelector('[data-row="2"] button').click()
      document.querySelector('[data-parent-row="2"] button').click()
      const retained = document.querySelector('[data-row="1"]') === first
      const counts = [...document.querySelectorAll("[data-row-count]")].map(node => node.textContent)
      document.querySelector("#clear-rows").click()
      await tick()
      first.querySelector("button").click()
      document.querySelector("#add-row").click()
      await tick()
      document.querySelector('[data-row="1"] button').click()
      return { retained, counts, fresh: document.querySelector('[data-row="1"] [data-row-count]').textContent, outer: document.querySelector("#outer-count").textContent, flag: document.querySelector("#flag").textContent }
    })()`), { retained: true, counts: ["1", "1"], fresh: "1", outer: "7", flag: "true" })
  }
})
