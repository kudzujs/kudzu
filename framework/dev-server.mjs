import { randomUUID } from "node:crypto"
import { readFile, stat, watch } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join, resolve, sep } from "node:path"
import { browserPath, withBase } from "./compiler/path-helpers.mjs"
import { stateSchema } from "./dev-state.js"

const devClient = (session, revision, schema) => `<script>(()=>{const show=event=>{let box=document.getElementById("__kudzu_error");if(!box){box=document.createElement("div");box.id="__kudzu_error";box.setAttribute("role","alert");box.setAttribute("aria-live","assertive");box.style.cssText="position:fixed;inset:0;z-index:2147483647;overflow:auto;padding:2rem;background:#200;color:#fff;font:16px/1.5 ui-monospace,monospace";const title=document.createElement("strong"),text=document.createElement("pre");title.textContent="Kudzu build error";text.style.whiteSpace="pre-wrap";box.append(title,text);document.body.append(box)}box.querySelector("pre").textContent=event.data};const schema=${inlineJson(schema)},route=location.pathname+location.search+location.hash,urls=[...document.querySelectorAll('script[type="module"][src]')].map(node=>node.src).filter(url=>/\/assets\/kudzu(?:-(?:binding|list|native))?\.js$/.test(new URL(url).pathname));const devImport=import("/__kudzu_dev.js"),runtimeImports=Promise.allSettled(urls.map(url=>import(url)));const ready=(async()=>{const dev=await devImport,modules=await runtimeImports,runtime=modules.find(result=>result.status==="fulfilled"&&result.value.browserState instanceof Map&&typeof result.value.commitDom==="function")?.value;try{dev.restoreState(sessionStorage,route,runtime?.browserState,schema,runtime?.commitDom)}catch{}return{dev,runtime}})().catch(()=>({}));const events=new EventSource("/__kudzu_reload?session=${session}&revision=${revision}");let reloading=false;events.addEventListener("reload",async()=>{if(reloading)return;reloading=true;try{const{dev,runtime}=await ready;dev?.snapshotState(sessionStorage,route,runtime?.browserState,schema)}catch{}location.reload()});events.addEventListener("build-error",show)})()</script>`

export function parseDevPort(value) {
  if (value === undefined || value.trim() === "") return 3000
  if (!/^\d+$/.test(value)) throw new Error(`Invalid dev server port: ${value}`)
  const port = Number(value)
  if (port > 65535) throw new Error(`Invalid dev server port: ${value}`)
  return port
}

export function parseDevHost(value) {
  return value?.trim() || "127.0.0.1"
}

export async function startDevServer({ build, port, host, base, sourceDirectory, workDirectory, outputDirectory }) {
  let buildError
  let revision = 0
  const session = randomUUID()
  try {
    await build({ minify: false })
    revision++
  } catch (error) {
    buildError = errorText(error)
    console.error(error)
  }

  const clients = new Set()
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost")
      const rawPathname = url.pathname
      const pathname = decodeURIComponent(rawPathname)
      if (pathname === "/__kudzu_reload") {
        response.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" })
        response.write(": connected\n\n")
        clients.add(response)
        request.on("close", () => clients.delete(response))
        if (buildError) sendEvent(response, "build-error", buildError)
        else if (url.searchParams.get("session") !== session || url.searchParams.get("revision") !== String(revision)) sendEvent(response, "reload")
        return
      }
      if (pathname === "/__kudzu_dev.js") {
        response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" })
        response.end(await readFile(new URL("./dev-state.js", import.meta.url)))
        return
      }

      const relativePath = stripBaseStrict(pathname, decodeURIComponent(base)).replace(/^\/+/, "")
      let file = resolve(outputDirectory, relativePath)
      if (!file.startsWith(`${outputDirectory}${sep}`) && file !== outputDirectory) throw new Error("Invalid path")
      if ((await exists(file)) && (await stat(file)).isDirectory()) file = join(file, "index.html")
      if (!(await exists(file)) && !extname(file)) file = join(file, "index.html")
      let matchedRoute
      if (!(await exists(file)) && !buildError) {
        const plan = JSON.parse(await readFile(join(workDirectory, "kudzu-plan.json"), "utf8"))
        const rewrite = plan.rewrites?.find(entry => runtimePathValues(rawPathname, entry, browserPath(base)))
        if (rewrite) {
          file = resolve(outputDirectory, rewrite.file)
          matchedRoute = rewrite.pattern
        }
      }
      const isHtml = extname(file) === ".html"
      const content = isHtml
        ? injectDevClient(buildError ? errorPage(buildError) : await readFile(file, "utf8"), session, revision, buildError ? [] : await devSchema(workDirectory, withBase(base, stripBaseStrict(pathname, decodeURIComponent(base))), matchedRoute))
        : await readFile(file)
      response.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" })
      response.end(content)
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" })
      response.end("Not found")
    }
  })

  const listeningPort = await listenDevServer(server, port, host)
  console.log(`Kudzu dev server: http://${host}:${listeningPort}`)

  let timer
  let rebuilding = false
  let pending = false
  let changedFile
  const rebuild = async () => {
    if (rebuilding) {
      pending = true
      return
    }
    rebuilding = true
    do {
      pending = false
      try {
        await build({ quiet: true, minify: false })
        buildError = undefined
        revision++
        console.log(`Rebuilt after ${changedFile ?? "source change"}`)
        for (const client of clients) sendEvent(client, "reload")
      } catch (error) {
        buildError = errorText(error)
        console.error(error)
        for (const client of clients) sendEvent(client, "build-error", buildError)
      }
    } while (pending)
    rebuilding = false
  }
  const watcher = watch(sourceDirectory, { recursive: true })
  for await (const event of watcher) {
    changedFile = event.filename
    clearTimeout(timer)
    timer = setTimeout(rebuild, 80)
  }
}

async function listenDevServer(server, port, host) {
  let candidate = port
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const onError = error => {
          server.off("listening", onListening)
          reject(error)
        }
        const onListening = () => {
          server.off("error", onError)
          resolve()
        }
        server.once("error", onError)
        server.once("listening", onListening)
        server.listen(candidate, host)
      })
      return server.address().port
    } catch (error) {
      if (error.code !== "EADDRINUSE" || candidate === 0 || candidate === 65535) throw error
      console.log(`Port ${candidate} is in use, trying ${candidate + 1}`)
      candidate++
    }
  }
}

function injectDevClient(html, session, revision, schema) {
  return `${html}${devClient(session, revision, schema).replace("binding|list|native", "binding|deps|list|native")}`
}

function stripBaseStrict(path, base) {
  if (!base) return path
  if (path === base) return "/"
  if (path.startsWith(`${base}/`)) return path.slice(base.length)
  throw new Error("Path is outside the configured base")
}

async function devSchema(workDirectory, pathname, matchedRoute) {
  try {
    const plan = JSON.parse(await readFile(join(workDirectory, "kudzu-plan.json"), "utf8"))
    const route = matchedRoute ?? (pathname.replace(/\/(?:index\.html)?$/, "") || "/")
    return stateSchema(plan.routes.find(entry => entry.route === route)?.states ?? [])
  } catch {
    return []
  }
}

function runtimePathValues(pathname, rewrite, base) {
  try {
    let path = stripBrowserBase(pathname, base)
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
    const rawSegments = path.slice(1).split("/")
    if (rawSegments.length !== rewrite.segments.length) return undefined
    const values = Object.create(null)
    for (let index = 0; index < rewrite.segments.length; index++) {
      const segment = rewrite.segments[index]
      const value = decodeRuntimeSegment(rawSegments[index], Boolean(segment.param))
      if (segment.literal !== undefined && value !== segment.literal) return undefined
      if (segment.param) values[segment.param] = value
    }
    return values
  } catch {
    return undefined
  }
}

function stripBrowserBase(path, base) {
  if (!base) return path
  const pathSegments = path.slice(1).split("/")
  const baseSegments = base.slice(1).split("/").map(segment => decodeURIComponent(segment))
  if (pathSegments.length < baseSegments.length || baseSegments.some((segment, index) => decodeRuntimeSegment(pathSegments[index], false) !== segment)) throw new Error("Path is outside the configured base")
  return `/${pathSegments.slice(baseSegments.length).join("/")}`
}

function decodeRuntimeSegment(raw, param) {
  if (param && /%(?:2f|5c)/i.test(raw)) throw new Error("Encoded separator")
  const value = decodeURIComponent(raw)
  const decodedDots = value.replace(/%2e/gi, ".")
  if (param && (!value || value === "." || value === ".." || decodedDots === "." || decodedDots === ".." || /[\\/?#]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159) || /%(?:2f|5c)/i.test(value))) throw new Error("Invalid runtime parameter")
  return value
}

function inlineJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029")
}

function errorPage(error) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kudzu build error</title></head><body><div id="__kudzu_error" role="alert" aria-live="assertive" style="position:fixed;inset:0;overflow:auto;padding:2rem;background:#200;color:#fff;font:16px/1.5 ui-monospace,monospace"><strong>Kudzu build error</strong><pre style="white-space:pre-wrap">${escapeHtml(error)}</pre></div></body></html>`
}

function errorText(error) {
  return String(error?.message ?? error)
}

function sendEvent(response, event, data = "") {
  response.write(`event: ${event}\n${String(data).replaceAll("\r", "").split("\n").map(line => `data: ${line}\n`).join("")}\n`)
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function contentType(file) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  }[extname(file)] ?? "application/octet-stream"
}
