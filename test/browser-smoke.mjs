import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { lstat, mkdtemp, readFile, realpath, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { extname, join, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { CDP, evaluate, waitForPort } from "./browser-cdp.mjs"

// Repository-only smoke observations, not a build check or acceptance oracle.
export async function browserSmoke(directory, commands, emit = console.log, timeoutMs = 30_000) {
  if (!Array.isArray(commands) || commands.length > 20 || JSON.stringify(commands).length > 16_384) throw new Error("Expected at most 20 commands / 16384 characters")
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30_000) throw new Error("Timeout must be 1..30000 ms")
  if (process.platform !== "linux") throw new Error("This smoke utility currently supports Linux Chrome only")
  const root = await realpath(directory)
  const managed = process.env.KUDZU_AI_DELIVERY_GROUP === "1"
  let browser, cdp, profile, timer, abort, startup, stopped = false, authoredFavicon = false
  const requests = []
  const server = createServer(async (request, response) => {
    // Reject proxy traffic, including Chrome background requests; never forward it.
    if (!request.url.startsWith("/") || request.url.startsWith("//")) { request.socket.destroy(); return }
    try {
      if (!["GET", "HEAD"].includes(request.method)) throw new Error("Read only")
      const url = new URL(request.url, "http://localhost")
      let file = resolve(root, `.${decodeURIComponent(url.pathname)}`)
      if (!file.startsWith(root + sep) && file !== root) throw new Error("Outside root")
      if (request.url === "/favicon.ico" && request.headers["sec-fetch-dest"] === "image") {
        const absent = await lstat(file).then(() => false, error => { if (error.code === "ENOENT") return true; throw error })
        // Chrome probes this optional file even without an authored icon. Never mask an explicit resource or a filesystem error.
        if (absent && cdp && await evaluate(cdp, `location.origin === ${JSON.stringify(`http://127.0.0.1:${server.address().port}`)} && !Array.from(document.querySelectorAll('[href], [src]')).some(node => node.href === location.origin + '/favicon.ico' || node.src === location.origin + '/favicon.ico')`) && !authoredFavicon) {
          response.writeHead(204).end()
          return
        }
      }
      if ((await stat(file)).isDirectory()) file = join(file, "index.html")
      file = await realpath(file)
      if (!file.startsWith(root + sep)) throw new Error("Outside root")
      const body = await readFile(file)
      response.setHeader("Content-Type", ({ ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" })[extname(file)] ?? "application/octet-stream")
      response.end(request.method === "HEAD" ? undefined : body)
    } catch {
      if (requests.length < 20) requests.push({ path: request.url.slice(0, 256), status: 404 })
      response.writeHead(404).end()
    }
  })
  const deadline = new Promise((_, reject) => {
    abort = () => reject(new Error("Browser smoke interrupted"))
    timer = setTimeout(() => reject(new Error("Browser smoke timed out")), timeoutMs)
    process.once("SIGTERM", abort)
    process.once("SIGINT", abort)
  })
  try {
    await Promise.race([deadline, (async () => {
      startup = (async () => {
        await new Promise((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done) })
        profile = await mkdtemp(join(tmpdir(), "browser-smoke-"))
        browser = spawn(process.env.CHROME_BIN ?? "/usr/bin/google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--disable-component-update", "--disable-extensions", "--disable-sync", "--no-first-run", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, `--proxy-server=http://127.0.0.1:${server.address().port}`, `--proxy-bypass-list=<-loopback>;127.0.0.1:${server.address().port}`, "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"], { stdio: "ignore", detached: !managed })
        browser.on("error", abort)
      })()
      await startup
      if (stopped) return
      const origin = `http://127.0.0.1:${server.address().port}`
      const active = await waitForPort(profile, browser)
      if (stopped) return
      cdp = new CDP(`ws://127.0.0.1:${active.port}${active.path}`)
      const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" })
      const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true })
      cdp.sessionId = sessionId
      cdp.socket.addEventListener("message", event => {
        const message = JSON.parse(event.data)
        // CSS and srcset images need not appear in document href/src attributes.
        if (message.sessionId === sessionId && message.method === "Network.requestWillBeSent" && message.params.request.url === `${origin}/favicon.ico` && (message.params.type !== "Other" || message.params.initiator.type !== "other")) authoredFavicon = true
      })
      const send = (method, params = {}) => cdp.send(method, params, sessionId)
      await send("Runtime.enable")
      await send("Network.enable")
      await send("Accessibility.enable")
      await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
      const observations = new Map()
      for (const [index, command] of commands.entries()) {
        const started = performance.now()
        try {
          if (command.op === "open") {
            const url = new URL(command.path, origin)
            if (typeof command.path !== "string" || !command.path.startsWith("/") || url.origin !== origin) throw new Error("open requires a local root-relative path")
            const result = await send("Page.navigate", { url: url.href })
            if (result.errorText) throw new Error(result.errorText)
          } else if (["click", "fill"].includes(command.op)) {
            const named = Object.hasOwn(command, "name")
            if (typeof command.role !== "string" || !command.role || (named && typeof command.name !== "string")) throw new Error("Action requires exact role and optional string accessible name")
            if (command.op === "fill" && (!["textbox", "searchbox"].includes(command.role) || typeof command.value !== "string")) throw new Error("fill requires textbox/searchbox and string value")
            if (command.op === "click" && !["button", "link", "checkbox", "radio", "switch", "tab", "menuitem", "menuitemcheckbox", "menuitemradio"].includes(command.role)) throw new Error("Unsupported click role")
            const { nodes } = await send("Accessibility.getFullAXTree")
            const candidates = nodes.filter(node => !node.ignored && node.role?.value === command.role && node.backendDOMNodeId)
            const matches = named ? candidates.filter(node => node.name?.value === command.name) : candidates
            if (matches.length !== 1) {
              const alternatives = matches.length ? matches : candidates
              const shown = alternatives.slice(0, 5).map(node => ({ role: node.role.value, name: String(node.name?.value ?? "").slice(0, 160), nameTruncated: String(node.name?.value ?? "").length > 160 }))
              throw new Error(`Expected one accessible target; found ${matches.length}. ${named ? "Exact role/name required." : "Role-only query must be unique."} AX candidates (${alternatives.length} total, at most 5 shown): ${JSON.stringify(shown)}`)
            }
            if (matches[0].properties?.some(p => p.name === "disabled" && p.value.value)) throw new Error("Target is disabled")
            const { object } = await send("DOM.resolveNode", { backendNodeId: matches[0].backendDOMNodeId })
            const { result: actionable } = await send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: `function(){return this.checkVisibility() && !this.closest('[inert]') && !this.matches(':disabled') && ${command.op === "fill" ? "!this.readOnly && (this instanceof HTMLTextAreaElement || (this instanceof HTMLInputElement && ['text','search','email','url','tel','password'].includes(this.type)))" : "true"}}`, returnByValue: true })
            if (!actionable.value) throw new Error("Target is not visible or does not support this action")
            const focused = await send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function(){this.scrollIntoView({block:'center'});this.focus();return document.activeElement===this}", returnByValue: true })
            if (!focused.result.value) throw new Error("Target cannot receive focus")
            if (command.op === "fill") {
              await send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65 })
              await send("Input.dispatchKeyEvent", { type: "keyUp", key: "a", code: "KeyA", modifiers: 2, windowsVirtualKeyCode: 65 })
              await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", windowsVirtualKeyCode: 8 })
              await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", windowsVirtualKeyCode: 8 })
              await send("Input.insertText", { text: command.value })
            } else {
              const { model } = await send("DOM.getBoxModel", { backendNodeId: matches[0].backendDOMNodeId })
              const x = (model.content[0] + model.content[4]) / 2, y = (model.content[1] + model.content[5]) / 2
              const { result: hit } = await send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: "function(x,y){return this.contains(document.elementFromPoint(x,y))}", arguments: [{ value: x }, { value: y }], returnByValue: true })
              if (!hit.value) throw new Error("Target is obscured")
              await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 })
              await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 })
            }
            await send("Runtime.releaseObject", { objectId: object.objectId })
          } else if (!["snapshot", "expect-text"].includes(command.op)) throw new Error("Unknown operation")
          // A bounded settling window, not an assertion that all application work is idle.
          await new Promise(done => setTimeout(done, 150))
          const snapshot = await evaluate(cdp, "(() => {const text=document.body?.innerText ?? '';return {text:text.slice(0,4000),textTruncated:text.length>4000}})()")
          if (command.op === "expect-text" && (typeof command.text !== "string" || !await evaluate(cdp, `(document.body?.innerText ?? '').includes(${JSON.stringify(command.text)})`))) throw new Error("Caller-supplied rendered text was not found")
          const { nodes } = await send("Accessibility.getFullAXTree")
          const namedNodes = nodes.filter(node => !node.ignored && node.name?.value)
          const distinct = namedNodes.filter(node => !(["StaticText", "InlineTextBox"].includes(node.role?.value) && snapshot.text.includes(String(node.name.value))))
          const exposed = distinct.map(node => ({ role: node.role?.value, name: String(node.name.value).slice(0, 160) }))
          const observation = { ...snapshot, accessibility: exposed.slice(0, 60), accessibilityTruncated: exposed.length > 60, duplicateTextEntriesOmitted: namedNodes.length - distinct.length }
          const serialized = JSON.stringify(observation)
          const observationIndex = observations.get(serialized)
          const unchanged = !["open", "snapshot"].includes(command.op) && observationIndex !== undefined
          emit(JSON.stringify({ index, command, ok: true, elapsedMs: Math.round(performance.now() - started), ...(unchanged ? { observationFrom: observationIndex } : observation) }))
          if (!unchanged) observations.set(serialized, index)
        } catch (error) {
          emit(JSON.stringify({ index, command, ok: false, elapsedMs: Math.round(performance.now() - started), error: error.message }))
          throw error
        }
      }
      emit(JSON.stringify({ completed: true, ok: !cdp.exceptions.length && !cdp.failures.length && !requests.length, exceptions: cdp.exceptions.slice(0, 20), failedRequests: cdp.failures.slice(0, 20), httpErrors: requests }))
      if (cdp.exceptions.length || cdp.failures.length || requests.length) throw new Error("Browser errors observed")
    })()])
  } finally {
    stopped = true
    await startup?.catch(() => {})
    clearTimeout(timer)
    process.removeListener("SIGTERM", abort)
    process.removeListener("SIGINT", abort)
    cdp?.socket.close()
    if (browser?.pid) {
      const exited = new Promise(done => browser.exitCode !== null || browser.signalCode !== null ? done() : browser.once("exit", done))
      // Managed children must stay in the outer runner's deadline process group.
      try { process.kill(managed ? browser.pid : -browser.pid, "SIGKILL") } catch (error) { if (error.code !== "ESRCH") throw error }
      await exited
    }
    server.closeAllConnections()
    await new Promise(done => server.close(done))
    if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await browserSmoke(process.argv[2], JSON.parse(process.argv[3] ?? '[{"op":"open","path":"/"}]')) }
  catch (error) { console.error(JSON.stringify({ ok: false, error: error.message })); process.exitCode = 1 }
}
