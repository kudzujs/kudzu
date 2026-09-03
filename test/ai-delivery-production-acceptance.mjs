import { spawn, spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

async function main() {
  const workspace = resolve(process.argv[2])
  const task = process.argv[3]
  const artifactRoot = join(workspace, "dist")
  const packageJson = JSON.parse(await readFile(join(workspace, "package.json"), "utf8"))
  const kudzu = packageJson.name.includes("kudzu")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (!chrome) throw new Error("Chrome is required for AI delivery acceptance")
  if (!["content", "forms", "crud", "commerce", "realtime"].includes(task)) throw new Error(`Unknown AI delivery task ${task}`)

  const serverSource = `const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),root=process.argv[1];let accounts=0;http.createServer((request,response)=>{const url=new URL(request.url,"http://localhost");if(url.pathname==="/__requests"){response.setHeader("content-type","application/json");return response.end(JSON.stringify({accounts}))}if(url.pathname==="/api/accounts"&&request.method==="POST"){accounts++;let body="";request.on("data",chunk=>body+=chunk);return request.on("end",()=>setTimeout(()=>{response.setHeader("content-type","application/json");if(body.includes("taken%40example.com")||body.includes("taken@example.com")){response.statusCode=422;response.end(JSON.stringify({errors:{email:"An account already exists for this email."}}))}else if(body.includes("unavailable%40example.com")||body.includes("unavailable@example.com")){response.statusCode=503;response.end(JSON.stringify({error:"Account service is temporarily unavailable."}))}else{response.statusCode=201;response.end(JSON.stringify({accountId:"acct_benchmark_001"}))}},75))}const pathname=url.pathname==="/"?"index.html":url.pathname.slice(1)+(url.pathname.endsWith("/")?"index.html":""),candidate=path.normalize(path.join(root,pathname));if(!candidate.startsWith(root+path.sep)&&candidate!==root)return response.writeHead(403).end();const file=fs.existsSync(candidate)&&fs.statSync(candidate).isFile()?candidate:path.join(root,"index.html"),types={".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".html":"text/html"};response.setHeader("content-type",types[path.extname(file)]||"application/octet-stream");fs.createReadStream(file).on("error",()=>response.writeHead(404).end()).pipe(response)}).listen(0,"127.0.0.1",function(){console.log(this.address().port)})`
  const server = spawn(process.execPath, ["-e", serverSource, artifactRoot], { stdio: ["ignore", "pipe", "inherit"] })
  const port = await new Promise((resolvePort, reject) => {
  const timeout = setTimeout(() => reject(new Error("Acceptance server did not start")), 5000)
  server.stdout.once("data", chunk => { clearTimeout(timeout); resolvePort(Number(chunk.toString().trim())) })
  server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Acceptance server exited ${code}`)) })
  })

  let browser
  let profile
  try {
    profile = await mkdtemp(join(tmpdir(), "kudzu-ai-delivery-browser-"))
    browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--disable-component-update", "--disable-default-apps", "--disable-extensions", "--disable-sync", `--user-data-dir=${profile}`, "--remote-debugging-port=0"], { stdio: "ignore" })
    const active = await waitForPort(profile, browser)
    const cdp = new CDP(`ws://127.0.0.1:${active.port}${active.path}`)
    const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
    await cdp.send("Runtime.enable", {}, sessionId)
    await cdp.send("Network.enable", {}, sessionId)
    cdp.sessionId = sessionId
    await navigate(cdp, `http://127.0.0.1:${port}${entryPath(task)}`)
    const behavior = await journeys[task](cdp, port)
    const output = await outputChecks(task, kudzu, artifactRoot, cdp)
    const accessibility = await evaluate(cdp, `({ h1: document.querySelectorAll("h1").length, positiveTabindex: document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length })`)
    const browserEvidence = { engine: spawnSync(chrome, ["--version"], { encoding: "utf8" }).stdout.trim(), exceptions: cdp.exceptions, failedRequests: cdp.failures, transferBytes: await evaluate(cdp, `performance.getEntriesByType("resource").reduce((total, entry) => total + (entry.transferSize || 0), 0)`) }
    const passed = behavior.passed && output.passed && accessibility.h1 === 1 && accessibility.positiveTabindex === 0 && browserEvidence.exceptions.length === 0 && browserEvidence.failedRequests.length === 0
    process.stdout.write(`${JSON.stringify({ schema: 1, passed, build: { passed: true }, behavior, accessibility: { passed: accessibility.h1 === 1 && accessibility.positiveTabindex === 0, ...accessibility }, browser: { passed: browserEvidence.exceptions.length === 0 && browserEvidence.failedRequests.length === 0, ...browserEvidence }, output })}\n`)
    if (!passed) process.exitCode = 1
    cdp.socket.close()
  } finally {
    server.kill()
    if (browser?.exitCode === null) browser.kill("SIGKILL")
    if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

const journeys = {
  async content(cdp) {
    await waitUntil(cdp, `document.querySelectorAll(".article-card").length === 6`)
    const initial = await evaluate(cdp, `({ label: document.querySelector('label')?.textContent.trim(), type: document.querySelector('input')?.type, count: document.querySelector('[aria-live="polite"]')?.textContent.trim() })`)
    const failure = await search(cdp, "failure")
    const performance = await search(cdp, "PERFORMANCE")
    const accessibility = await search(cdp, "  accessibility  ")
    const empty = await search(cdp, "no such note")
    const restored = await search(cdp, "")
    return { passed: initial.label === "Search articles" && initial.type === "search" && initial.count === "6 articles" && failure.count === "1 article" && failure.titles.join() === "Designing for failure" && performance.count === "3 articles" && performance.titles.join("|") === "Shipping less JavaScript|Measuring what matters|Calm release notes" && accessibility.titles.join() === "Accessible by default" && empty.count === "0 articles" && empty.text.includes("No articles match your search.") && restored.titles.length === 6, checks: { initial, failure, performance, accessibility, empty, restored } }
  },
  async forms(cdp, port) {
    const fields = await evaluate(cdp, `(() => { const form=document.querySelector("form"), confirmations=form.querySelectorAll('input[type="password"]'), values=[[form.elements.namedItem("email"),"person@example.com"],[form.elements.namedItem("password"),"northstar2026"],[confirmations[1],"different2026"],[form.elements.namedItem("fullName"),"Ada Lovelace"],[form.elements.namedItem("organization"),"Analytical Engines"],[form.elements.namedItem("role"),"founder"]], setValue=(field,value)=>{let prototype=field;while(prototype&&!Object.getOwnPropertyDescriptor(prototype,"value"))prototype=Object.getPrototypeOf(prototype);Object.getOwnPropertyDescriptor(prototype,"value").set.call(field,value);field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}))}; for(const [field,value] of values){if(field)setValue(field,value)} form.elements.namedItem("terms").click(); form.requestSubmit(); return confirmations.length === 2 })()`)
    if (!fields) return { passed: false, checks: { fields: false } }
    await waitUntil(cdp, `(() => { const field=document.querySelectorAll('input[type="password"]')[1];return field?.getAttribute("aria-invalid") === "true" && document.activeElement === field })()`)
    const mismatchRequests = await fetch(`http://127.0.0.1:${port}/__requests`).then(response => response.json())
    await evaluate(cdp, `(() => { const field=document.querySelectorAll('input[type="password"]')[1],prototype=HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,"value").set.call(field,"northstar2026");field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new Event("change",{bubbles:true}));document.querySelector("form").requestSubmit();return true })()`)
    await waitUntil(cdp, `document.querySelector('[role="status"]')?.textContent.includes("Account created")`)
    const final = await evaluate(cdp, `({ confirm: document.querySelectorAll('input[type="password"]')[1]?.outerHTML, alert: document.querySelector('[role="alert"]')?.textContent || "", status: document.querySelector('[role="status"]')?.textContent || "" })`)
    const finalRequests = await fetch(`http://127.0.0.1:${port}/__requests`).then(response => response.json())
    return { passed: mismatchRequests.accounts === 0 && finalRequests.accounts === 1 && /required/.test(final.confirm) && /minlength="12"/.test(final.confirm) && /maxlength="128"/.test(final.confirm) && /autocomplete="new-password"/.test(final.confirm) && final.status.includes("Account created"), checks: { mismatchRequests, finalRequests, final } }
  },
  async crud(cdp) {
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 3`)
    const initial = await evaluate(cdp, `(() => { window.__memoNodes=Object.fromEntries([...document.querySelectorAll("[data-memo-id]")].map(node=>[node.dataset.memoId,node]));const group=[...document.querySelectorAll('[role="group"],[aria-label="Filter memos"],fieldset')].find(node=>node.getAttribute("aria-label")==="Filter memos"||node.querySelector("legend")?.textContent.trim()==="Filter memos");return { group:Boolean(group), buttons:[...document.querySelectorAll('button')].filter(button=>["All","Active","Archived"].includes(button.textContent.trim())).map(button=>[button.textContent.trim(),button.getAttribute("aria-pressed")]), ids:[...document.querySelectorAll("[data-memo-id]")].map(node=>node.dataset.memoId), status:document.querySelector(".result-status")?.textContent.trim() } })()`)
    await clickText(cdp, "Active")
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 2`)
    const active = await evaluate(cdp, `({ ids:[...document.querySelectorAll("[data-memo-id]")].map(node=>node.dataset.memoId), retained:[...document.querySelectorAll("[data-memo-id]")].every(node=>node===window.__memoNodes[node.dataset.memoId]), status:document.querySelector(".result-status")?.textContent.trim(), focused:document.activeElement?.textContent.trim() })`)
    await clickText(cdp, "Archived")
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 1`)
    const archived = await evaluate(cdp, `({ ids:[...document.querySelectorAll("[data-memo-id]")].map(node=>node.dataset.memoId), status:document.querySelector(".result-status")?.textContent.trim() })`)
    await evaluate(cdp, `(() => { const field=document.querySelector('.composer textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(field,"New active memo");field.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector('.composer form').requestSubmit();return true })()`)
    await waitUntil(cdp, `document.querySelector(".result-status")?.textContent.includes("of 4 memos")`)
    const hiddenNew = await evaluate(cdp, `document.querySelectorAll("[data-memo-id]").length === 1`)
    await clickText(cdp, "Active")
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 3`)
    const created = await evaluate(cdp, `(() => { const node=[...document.querySelectorAll("[data-memo-id]")].find(item=>!["101","102","103"].includes(item.dataset.memoId));if(!node)return null;window.__newMemoId=node.dataset.memoId;return { id:node.dataset.memoId, value:node.querySelector("textarea")?.value, count:document.querySelector(".result-status")?.textContent.trim() } })()`)
    await evaluate(cdp, `(() => { const node=document.querySelector('[data-memo-id="101"]'),field=node.querySelector("textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(field,"Roadmap notes updated");field.dispatchEvent(new Event("input",{bubbles:true}));node.querySelector("form").requestSubmit();return true })()`)
    await waitUntil(cdp, `document.querySelector('[data-memo-id="101"] textarea')?.value === "Roadmap notes updated"`)
    const edited = await evaluate(cdp, `({ value:document.querySelector('[data-memo-id="101"] textarea')?.value, status:document.querySelector(".result-status")?.textContent.trim() })`)
    await evaluate(cdp, `(() => { const node=[...document.querySelectorAll("[data-memo-id]")].find(item=>item.dataset.memoId===window.__newMemoId);[...node.querySelectorAll("button")].find(button=>button.textContent.trim()==="Delete").click();return true })()`)
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 2`)
    const deleted = await evaluate(cdp, `document.querySelector(".result-status")?.textContent.trim()`)
    await clickText(cdp, "Archived")
    await evaluate(cdp, `(() => { const node=document.querySelector('[data-memo-id="102"]');[...node.querySelectorAll("button")].find(button=>button.textContent.trim()==="Delete").click();return true })()`)
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 0`)
    const empty = await evaluate(cdp, `({ status:document.querySelector(".result-status")?.textContent.trim(), text:document.body.textContent })`)
    return { passed: initial.group && initial.buttons.length === 3 && initial.buttons.filter(([,pressed])=>pressed === "true").length === 1 && initial.ids.join() === "101,102,103" && initial.status === "Showing 3 of 3 memos" && active.ids.join() === "101,103" && active.retained && active.status === "Showing 2 of 3 memos" && active.focused === "Active" && archived.ids.join() === "102" && archived.status === "Showing 1 of 3 memos" && hiddenNew && created?.value === "New active memo" && created.count === "Showing 3 of 4 memos" && edited.value === "Roadmap notes updated" && edited.status === "Showing 3 of 4 memos" && deleted === "Showing 2 of 3 memos" && empty.status === "Showing 0 of 2 memos" && empty.text.includes("No memos match this filter."), checks: { initial, active, archived, hiddenNew, created, edited, deleted, empty } }
  },
  async commerce(cdp) {
    await waitUntil(cdp, `document.querySelector(".subtotal")`)
    const empty = await evaluate(cdp, `document.querySelector(".checkout")?.textContent.includes("100,000원 더 담으면 무료 배송")`)
    await setCart(cdp, 89000)
    const below = await evaluate(cdp, `document.querySelector(".checkout")?.textContent.includes("11,000원 더 담으면 무료 배송")`)
    await setCart(cdp, 100000)
    const reached = await evaluate(cdp, `document.querySelector(".checkout")?.textContent.includes("무료 배송이 적용되었습니다.")`)
    const messages = await evaluate(cdp, `[...document.querySelectorAll(".checkout p")].filter(node=>node.textContent.includes("무료 배송")).length`)
    return { passed: empty && below && reached && messages === 1, checks: { empty, below, reached, messages } }
  },
  async realtime(cdp) {
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "connected"`)
    const before = await evaluate(cdp, `window.__nodes=[...document.querySelectorAll("[data-memo-id]")];({ id:__MEMOS_SOCKET__.latest().id, stats:__MEMOS_SOCKET__.stats() })`)
    await evaluate(cdp, `__MEMOS_SOCKET__.message(${before.id},{version:2,memos:[{id:"memo-103",author:"Nora",content:"Updated production memo",createdAt:"2026-09-03T09:30:00.000Z",tag:"release"},{id:"memo-102",author:"Ilya",content:"The ownership review is ready for comments.",createdAt:"2026-09-03T08:15:00.000Z",tag:"engineering"},{id:"memo-101",author:"Mina",content:"Support handoff notes are in the team workspace.",createdAt:"2026-09-02T16:45:00.000Z",tag:"operations"},{id:"memo-104",author:"Alex",content:"New memo",createdAt:"2026-09-03T10:00:00.000Z",tag:"product"}]});true`)
    await waitUntil(cdp, `document.querySelectorAll("[data-memo-id]").length === 4`)
    const versioned = await evaluate(cdp, `({ retained:[...document.querySelectorAll("[data-memo-id]")].slice(0,3).every((node,index)=>node===window.__nodes[index]), text:document.querySelector('[data-memo-id="memo-103"]')?.textContent })`)
    await evaluate(cdp, `__MEMOS_SOCKET__.message(${before.id},{version:2,memos:[]});__MEMOS_SOCKET__.message(${before.id},{version:1,memos:[]});true`)
    const stale = await evaluate(cdp, `document.querySelectorAll("[data-memo-id]").length === 4`)
    await evaluate(cdp, `__MEMOS_SOCKET__.drop(${before.id});true`)
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "reconnecting"`)
    await waitUntil(cdp, `__MEMOS_SOCKET__.sockets.length === 2 && document.querySelector("[data-connection]")?.textContent === "connected"`)
    const replacementId = await evaluate(cdp, `__MEMOS_SOCKET__.latest().id`)
    await evaluate(cdp, `__MEMOS_SOCKET__.message(${before.id},{version:99,memos:[]});__MEMOS_SOCKET__.message(${replacementId},{version:3,memos:[{id:"memo-105",author:"Sam",content:"Fresh replacement memo",createdAt:"2026-09-03T11:00:00.000Z",tag:"release"}]});true`)
    await waitUntil(cdp, `document.querySelector('[data-memo-id="memo-105"]')`)
    await clickText(cdp, "Pause live updates")
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "paused"`)
    const paused = await evaluate(cdp, `({ stats:__MEMOS_SOCKET__.stats(), count:__MEMOS_SOCKET__.sockets.length })`)
    await evaluate(cdp, `__MEMOS_SOCKET__.message(${replacementId},{version:99,memos:[]});true`)
    const ignored = await evaluate(cdp, `Boolean(document.querySelector('[data-memo-id="memo-105"]'))`)
    await clickText(cdp, "Resume live updates")
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "connected" && __MEMOS_SOCKET__.sockets.length === 3`)
    for (let cycle = 0; cycle < 4; cycle++) {
      await clickText(cdp, "Pause live updates")
      await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "paused"`)
      await clickText(cdp, "Resume live updates")
      await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "connected"`)
    }
    const cycleStats = await evaluate(cdp, `__MEMOS_SOCKET__.stats()`)
    const pendingId = await evaluate(cdp, `__MEMOS_SOCKET__.latest().id`)
    await evaluate(cdp, `__MEMOS_SOCKET__.drop(${pendingId});true`)
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "reconnecting"`)
    await clickText(cdp, "Pause live updates")
    await new Promise(resolveSleep => setTimeout(resolveSleep, 120))
    const pendingPaused = await evaluate(cdp, `({ count:__MEMOS_SOCKET__.sockets.length, status:document.querySelector("[data-connection]")?.textContent, active:__MEMOS_SOCKET__.stats().filter(item=>item.readyState!==3).length })`)
    await clickText(cdp, "Resume live updates")
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "connected"`)
    const finalId = await evaluate(cdp, `__MEMOS_SOCKET__.latest().id`)
    await clickText(cdp, "Close feed")
    await waitUntil(cdp, `document.querySelector("#feed") === null`)
    await evaluate(cdp, `__MEMOS_SOCKET__.message(${finalId},{version:100,memos:[]});true`)
    await new Promise(resolveSleep => setTimeout(resolveSleep, 120))
    const released = await evaluate(cdp, `({ active:__MEMOS_SOCKET__.stats().filter(item=>item.readyState!==3).length, listeners:__MEMOS_SOCKET__.stats().reduce((sum,item)=>sum+item.listenerCount,0), count:__MEMOS_SOCKET__.sockets.length })`)
    await clickText(cdp, "Open feed")
    await waitUntil(cdp, `document.querySelector("[data-connection]")?.textContent === "connected"`)
    const reopened = await evaluate(cdp, `({ ids:[...document.querySelectorAll("[data-memo-id]")].map(node=>node.dataset.memoId), active:__MEMOS_SOCKET__.stats().filter(item=>item.readyState!==3).length, listeners:__MEMOS_SOCKET__.latest().listenerCount, button:[...document.querySelectorAll("button")].find(node=>node.textContent.includes("Pause live updates"))?.textContent.trim() })`)
    return { passed: before.stats.length === 1 && before.stats[0].listenerCount === 3 && versioned.retained && versioned.text.includes("Updated production memo") && stale && paused.stats[1].closeCount === 1 && paused.stats[1].listenerCount === 0 && ignored && cycleStats.filter(item=>item.readyState!==3).length === 1 && cycleStats.at(-1).listenerCount === 3 && pendingPaused.count === cycleStats.length && pendingPaused.status === "paused" && pendingPaused.active === 0 && released.active === 0 && released.listeners === 0 && released.count === cycleStats.length + 1 && reopened.ids.join() === "memo-103,memo-102,memo-101" && reopened.active === 1 && reopened.listeners === 3 && reopened.button === "Pause live updates", checks: { before: before.stats, versioned, stale, paused, ignored, cycleStats, pendingPaused, released, reopened } }
  },
}

async function outputChecks(task, isKudzu, root, cdp) {
  const staticPaths = { content: "static/index.html", forms: "privacy/index.html", crud: "about/index.html", commerce: "shipping/index.html", realtime: "about/index.html" }
  const staticHtml = await readFile(join(root, isKudzu ? staticPaths[task] : "index.html"), "utf8")
  const staticZeroJavaScript = !isKudzu || !/<script\b|modulepreload|data-k-(?:on|state|text|attr|list|condition)/.test(staticHtml)
  const resources = await evaluate(cdp, `performance.getEntriesByType("resource").map(entry=>({name:entry.name.split("/").at(-1),transferSize:entry.transferSize||0}))`)
  return { passed: staticZeroJavaScript, staticZeroJavaScript, artifact: isKudzu ? staticPaths[task] : "index.html", resources }
}

function entryPath(task) {
  return task === "content" ? "/articles/" : task === "commerce" ? "/checkout/" : "/"
}

async function search(cdp, value) {
  await evaluate(cdp, `(() => { const input=document.querySelector('input[type="search"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));return true })()`)
  await new Promise(resolveSleep => setTimeout(resolveSleep, 25))
  return evaluate(cdp, `({ count:document.querySelector('[aria-live="polite"]')?.textContent.trim(), titles:[...document.querySelectorAll('.article-card h2')].map(node=>node.textContent.trim()), text:document.body.textContent })`)
}

async function clickText(cdp, text) {
  return evaluate(cdp, `(() => { const button=[...document.querySelectorAll("button")].find(node=>node.textContent.trim()===${JSON.stringify(text)});if(!button)return false;button.focus();button.click();return true })()`)
}

async function setCart(cdp, price) {
  await evaluate(cdp, `localStorage.setItem("otw-cart",JSON.stringify([{id:"fixture-${price}",title:"울 오버사이즈 재킷",color:"블랙",size:"M",quantity:1,price:${price},priceLabel:new Intl.NumberFormat("ko-KR").format(${price})+"원"}]));true`)
  await cdp.send("Page.reload", {}, cdp.sessionId)
  await waitUntil(cdp, `document.querySelector("[data-subtotal]")?.dataset.subtotal === "${price}"`)
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url }, cdp.sessionId)
  await waitUntil(cdp, `document.readyState === "complete"`)
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, cdp.sessionId)
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
  return response.result.value
}

async function waitUntil(cdp, expression) {
  const started = Date.now()
  while (Date.now() - started < 15_000) {
    if (await evaluate(cdp, `Boolean(${expression})`)) return
    await new Promise(resolveSleep => setTimeout(resolveSleep, 20))
  }
  throw new Error(`DOM predicate timed out: ${expression}`)
}

async function waitForPort(profileDirectory, child) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    if (child.exitCode !== null) throw new Error(`Chrome exited early with ${child.exitCode}`)
    try {
      const [port, path] = (await readFile(join(profileDirectory, "DevToolsActivePort"), "utf8")).trim().split("\n")
      return { port, path }
    } catch {}
    await new Promise(resolveSleep => setTimeout(resolveSleep, 10))
  }
  throw new Error("Chrome DevToolsActivePort did not appear")
}

class CDP {
  constructor(url) {
    this.id = 0
    this.pending = new Map()
    this.exceptions = []
    this.failures = []
    this.socket = new WebSocket(url)
    this.ready = new Promise((resolveReady, reject) => { this.socket.onopen = resolveReady; this.socket.onerror = reject })
    this.socket.onmessage = event => {
      const message = JSON.parse(event.data)
      if (message.method === "Runtime.exceptionThrown") this.exceptions.push(message.params.exceptionDetails.text)
      if (message.method === "Network.loadingFailed" && !message.params.canceled) this.failures.push(message.params.errorText)
      if (!message.id) return
      const callback = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) callback.reject(new Error(`${callback.method}: ${message.error.message}${callback.expression ? `: ${callback.expression}` : ""}`))
      else callback.resolve(message.result)
    }
  }
  async send(method, params = {}, sessionId) {
    await this.ready
    const id = ++this.id
    const response = new Promise((resolveResponse, reject) => this.pending.set(id, { resolve: resolveResponse, reject, method, expression: params.expression }))
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
    return response
  }
}

await main()
