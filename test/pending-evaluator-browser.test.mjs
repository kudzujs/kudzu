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
  assert.deepEqual(results, ["attribute", "mixed", "text", "condition"].flatMap(kind => ["unmount", "remount", "release", "release-remount", "commit"].map(action => `${kind}-${action}`)))
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
  const pendingFixture = new URL("./fixtures/pending-list-source/", import.meta.url)
  t.after(async () => {
    for (const path of ["dist", ".kudzu"]) await rm(new URL(path, pendingFixture), { recursive: true, force: true })
  })
  execFileSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: pendingFixture, timeout: 30000 })
  const pendingDist = new URL("dist/", pendingFixture)
  for (const path of await readdir(pendingDist, { recursive: true })) {
    if (!path.endsWith(".js") && !path.endsWith(".html")) continue
    let source = await readFile(new URL(path, pendingDist), "utf8")
    // Isolate list loading: the native handler entry eagerly imports the same module.
    if (path === "index.html") source = source.replace(/<script type="module" src="\/assets\/native\/index.js"><\/script>/, "")
    if (path === "assets/handlers/pages/index.js") source = "await new Promise(resolve => { globalThis.releaseListSource = resolve });\n" + source
    assets.set(path === "index.html" ? "/pending-list/" : `/${path}`, source)
  }
  assert.doesNotMatch(assets.get("/static/index.html"), /<script/)
  await navigate("/pending-list/")
  const pending = await evaluate(cdp, `(async () => {
    const runtime = await import(document.querySelector('script[src$="/kudzu.js"]').src)
    await Promise.all([...document.querySelectorAll("script[type=module]")].map(script => import(script.src)))
    const deadline = Date.now() + 5000
    while (!globalThis.releaseListSource) {
      if (Date.now() > deadline) throw new Error("List evaluator did not start loading")
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    const root = document.querySelector("ul")
    const descriptor = JSON.parse(root.querySelector("template[data-k-list]").dataset.kList)
    const rowState = descriptor.rowStates[0].id.replace("$k", encodeURIComponent("number:1"))
    root.querySelector("button").click()
    const before = runtime.browserState.get(rowState)
    runtime.unmountDom(root, ["lists"])
    const released = !runtime.browserState.has(rowState)
    runtime.mountDom(root, ["lists"])
    const remounted = runtime.browserState.get(rowState)
    const sourceState = descriptor.source.states.data
    runtime.browserState.set(sourceState, { items: [{ id: 1, label: "Latest" }] })
    runtime.commitDom(sourceState)
    globalThis.releaseListSource()
    await import(descriptor.source.module)
    await new Promise(resolve => setTimeout(resolve, 0))
    const latest = root.querySelector("li span").textContent
    runtime.unmountDom(root, ["lists"])
    return { before, released, remounted, latest, finallyReleased: !runtime.browserState.has(rowState) }
  })()`)
  assert.deepEqual(pending, { before: 1, released: true, remounted: 0, latest: "Latest", finallyReleased: true }, "pending list source releases row state before same-node remount")
  const directHtml = assets.get("/direct/index.html")
  const listScript = directHtml.match(/<script type="module" src="([^"]+\/kudzu-list.js)"><\/script>/)
  assert.ok(listScript)
  // Delay just the list capability while the real native buttons remain usable.
  assets.set("/direct/index.html", directHtml.replace(listScript[0], ""))
  const directListSource = assets.get(listScript[1])
  assets.set(listScript[1], "await new Promise(resolve => { globalThis.releaseDirectList = resolve });\n" + directListSource)
  await navigate("/direct/index.html")
  const direct = await evaluate(cdp, `(async () => {
    await Promise.all([...document.querySelectorAll("script[type=module]")].map(script => import(script.src)))
    const runtime = await import(document.querySelector('script[src$="/kudzu.js"]').src)
    const root = document.querySelector("li"), input = root.querySelector("input")
    input.value = "Keep my note"
    const descriptor = JSON.parse(document.querySelector("template[data-k-list]").dataset.kList)
    const loading = import(${JSON.stringify(listScript[1])})
    const wait = async predicate => {
      const deadline = Date.now() + 5000
      while (!predicate()) {
        if (Date.now() > deadline) throw new Error("Delayed list update timed out")
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    await wait(() => globalThis.releaseDirectList)
    document.querySelector("[data-first]").click()
    await wait(() => runtime.browserState.get(descriptor.state)[0].label === "First update")
    const before = root.querySelector("span").textContent
    globalThis.releaseDirectList()
    await loading
    const first = { text: root.querySelector("span").textContent, title: root.title }
    document.querySelector("[data-second]").click()
    await wait(() => root.querySelector("span").textContent === "Second update")
    return { before, first, second: root.title, retained: document.querySelector("li") === root, note: input.value }
  })()`)
  assert.deepEqual(direct, { before: "Initial", first: { text: "First update", title: "First update" }, second: "Second update", retained: true, note: "Keep my note" }, "array updates before list loading must reach retained rows")
  assets.set(listScript[1], directListSource)
  const ownedHtml = assets.get("/owned/index.html")
  const ownedList = ownedHtml.match(/<script type="module" src="([^"]+\/kudzu-list.js)"><\/script>/)
  assert.ok(ownedList)
  assets.set("/owned/index.html", ownedHtml.replace(ownedList[0], ""))
  assets.set(ownedList[1], "await new Promise(resolve => { globalThis.releaseOwnedList = resolve });\n" + assets.get(ownedList[1]))
  await navigate("/owned/index.html")
  const owned = await evaluate(cdp, `(async () => {
    const runtime = await import(document.querySelector('script[src$="/kudzu.js"]').src)
    const root = document.querySelector("li"), input = root.querySelector("input")
    const id = input.id
    input.value = "Keep owned note"
    const descriptor = JSON.parse(document.querySelector("template[data-k-list]").dataset.kList)
    const loading = import(${JSON.stringify(ownedList[1])})
    const wait = async predicate => {
      const deadline = Date.now() + 5000
      while (!predicate()) {
        if (Date.now() > deadline) throw new Error("Owned row did not settle: " + predicate.toString() + " " + root.outerHTML)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    await wait(() => globalThis.releaseOwnedList)
    document.querySelector("[data-update]").click()
    await wait(() => runtime.browserState.get(descriptor.state)[0].label === "Latest")
    const before = root.querySelector("[data-label]").textContent
    globalThis.releaseOwnedList()
    await loading
    await Promise.all([...document.querySelectorAll("script[type=module]")].map(script => import(script.src)))
    await wait(() => root.dataset.ready === "true" && root.title === "Latest")
    const initial = { before, retained: root === document.querySelector("li"), idRetained: input.id === id, label: root.querySelector("label").htmlFor === id, note: input.value, text: root.querySelector("[data-label]").textContent }
    root.querySelector("[data-count]").click()
    await wait(() => root.querySelector("[data-count]").textContent === "1")
    root.querySelector("[data-item-count]").click()
    await wait(() => root.querySelector("[data-count]").textContent === "7" && root.dataset.clicked === "Latest")
    document.querySelector("[data-update-again]").click()
    await wait(() => root.title === "Again")
    root.querySelector("[data-item-count]").click()
    await wait(() => root.querySelector("[data-count]").textContent === "12" && root.dataset.clicked === "Again")
    document.querySelector("[data-remove]").click()
    await wait(() => !document.querySelector("li") && document.querySelector("[data-cleanup]").textContent === "cleaned")
    document.querySelector("[data-add]").click()
    await wait(() => document.querySelector("li")?.dataset.ready === "true")
    const added = document.querySelector("li"), addedInput = added.querySelector("input")
    const clone = { fresh: added !== root, differentId: addedInput.id !== id, resolved: !addedInput.id.includes("$k"), label: added.querySelector("label").htmlFor === addedInput.id, count: added.querySelector("[data-count]").textContent, title: added.title }
    added.querySelector("[data-count]").click()
    await wait(() => added.querySelector("[data-count]").textContent === "1")
    added.querySelector("[data-item-count]").click()
    await wait(() => added.querySelector("[data-count]").textContent === "6" && added.dataset.clicked === "Added")
    return { initial, clone }
  })()`)
  assert.deepEqual(owned, { initial: { before: "Initial", retained: true, idRetained: true, label: true, note: "Keep owned note", text: "Latest" }, clone: { fresh: true, differentId: true, resolved: true, label: true, count: "0", title: "Added" } }, "pre-rendered IDs remain scoped while late values and cloned ownership update")
  assert.deepEqual(cdp.exceptions, [])
  assert.deepEqual(cdp.consoleErrors, [])
  assets.set(ownedList[1], assets.get(ownedList[1]).replace("await new Promise(resolve => { globalThis.releaseOwnedList = resolve });\n", ""))
  const resolvedHtml = assets.get("/resolved/index.html")
  const resolvedList = resolvedHtml.match(/<script type="module" src="([^"]+\/kudzu-list.js)"><\/script>/)
  assert.ok(resolvedList)
  assets.set("/resolved/index.html", resolvedHtml.replace(resolvedList[0], ""))
  assets.set(resolvedList[1], "await new Promise(resolve => { globalThis.releaseResolvedList = resolve });\n" + assets.get(resolvedList[1]))
  await navigate("/resolved/index.html")
  const resolved = await evaluate(cdp, `(async () => {
    const runtime = await import(document.querySelector('script[src$="/kudzu.js"]').src)
    const descriptor = selector => JSON.parse(document.querySelector(selector + " template[data-k-list]").dataset.kList)
    const safe = descriptor("[data-resolved]")
    const root = document.querySelector("[data-resolved] li"), input = root.querySelector("input"), id = input.id
    input.value = "Keep note"
    const wait = async predicate => {
      const deadline = Date.now() + 5000
      while (!predicate()) {
        if (Date.now() > deadline) throw new Error("Resolved row did not settle: " + predicate.toString())
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
    const loading = import(${JSON.stringify(resolvedList[1])})
    await wait(() => globalThis.releaseResolvedList)
    document.querySelector("[data-update]").click()
    await wait(() => runtime.browserState.get(safe.state)[0].label === "Latest")
    globalThis.releaseResolvedList()
    await loading
    await wait(() => root.dataset.ready === "true" && root.title === "Latest")
    const initial = { retained: root === document.querySelector("[data-resolved] li"), id: input.id === id, label: root.querySelector("label").htmlFor === id, note: input.value, text: root.querySelector("[data-label]").textContent }
    const fallback = { dynamicId: document.querySelector("[data-dynamic] input").id, dynamicLabel: document.querySelector("[data-dynamic] label").htmlFor, literalId: document.querySelector("[data-literal] li").id }
    root.querySelector("[data-count]").click()
    await wait(() => root.querySelector("[data-count]").textContent === "1")
    document.querySelector("[data-remove]").click()
    await wait(() => !document.querySelector("[data-resolved] li") && document.querySelector("[data-cleanup]").textContent === "cleaned")
    document.querySelector("[data-add]").click()
    await wait(() => document.querySelector("[data-resolved] li")?.dataset.ready === "true")
    const added = document.querySelector("[data-resolved] li"), addedId = added.querySelector("input").id
    const clone = { fresh: added !== root, id: addedId !== id && !addedId.includes("$k"), label: added.querySelector("label").htmlFor === addedId, count: added.querySelector("[data-count]").textContent }
    added.querySelector("[data-count]").click()
    await wait(() => added.querySelector("[data-count]").textContent === "1")
    return { initial, fallback, clone }
  })()`)
  assert.deepEqual(resolved, {
    initial: { retained: true, id: true, label: true, note: "Keep note", text: "Latest" },
    fallback: { dynamicId: "latest-number%3A1", dynamicLabel: "latest-number%3A1", literalId: "literal-number%3A1" },
    clone: { fresh: true, id: true, label: true, count: "0" }
  })
  assert.deepEqual(cdp.exceptions, [])
  assert.deepEqual(cdp.consoleErrors, [])
})
