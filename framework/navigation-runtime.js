import { browserState, mountDom, unmountDom } from "./shared-runtime.js"

const routes = __KUDZU_NAVIGATION_ROUTES__
const applicationId = __KUDZU_APPLICATION_ID__
const layoutId = __KUDZU_LAYOUT_ID__
const navigationAsset = new URL(import.meta.url).pathname
const status = document.createElement("div")
status.dataset.kNavigationStatus = ""
status.setAttribute("role", "status")
status.setAttribute("aria-live", "polite")
status.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;margin:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0"
document.body.append(status)

let request
let pendingStyleUpdate
let revision = 0
const documents = new Map()
let observer
let idle
let idleAnchors
const noDispose = async () => {}
let routeDispose = noDispose
let layoutDispose = noDispose
const ready = mountInitial()

document.addEventListener("click", event => {
  const anchor = event.target.closest?.("a[href]")
  if (!eligibleClick(event, anchor)) return
  const url = new URL(anchor.href)
  event.preventDefault()
  navigate(url, true)
})
document.addEventListener("pointerover", event => prefetchAnchor(event.target.closest?.("a[href]")))
document.addEventListener("focusin", event => prefetchAnchor(event.target.closest?.("a[href]")))

addEventListener("popstate", () => navigate(new URL(location.href), false))
addEventListener("pagehide", event => {
  if (event.persisted) return
  ++revision
  request?.abort()
  void (async () => {
    await routeDispose()
    await layoutDispose()
  })()
})
discover()

async function mountInitial() {
  try {
    const record = matchRoute(location.pathname)
    if (!record) throw new Error("Initial navigation route does not match")
    const capabilities = await loadCapabilities(validate(document, record))
    capabilities.params?.(location.pathname, location.search)
    layoutDispose = await capabilities.effects?.mountLayoutEffects?.() ?? noDispose
    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose
  } catch (error) {
    console.error(error)
  }
}

function eligibleClick(event, anchor) {
  if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  return eligibleAnchor(anchor)
}

function eligibleAnchor(anchor) {
  if (!anchor) return false
  if (anchor.hasAttribute("download") || anchor.hasAttribute("data-k-native") || !["", "_self"].includes(anchor.target)) return false
  if (anchor.relList?.contains("external")) return false
  const url = new URL(anchor.href)
  if (url.hash && url.pathname === location.pathname && url.search === location.search) return false
  return url.origin === location.origin && Boolean(matchRoute(url.pathname))
}

function discover() {
  const anchors = [...document.querySelectorAll("a[href]")].filter(eligibleAnchor)
  idleAnchors = anchors
  prune(anchors)
  observer?.disconnect()
  if ("IntersectionObserver" in globalThis) {
    observer ??= new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        observer.unobserve(entry.target)
        prefetchAnchor(entry.target)
      }
    }, { rootMargin: "200px" })
    for (const anchor of anchors) observer.observe(anchor)
  } else if (idle === undefined) {
    const schedule = globalThis.requestIdleCallback ?? (callback => setTimeout(callback, 0))
    idle = schedule(() => {
      idle = undefined
      for (const anchor of idleAnchors) prefetchAnchor(anchor)
    })
  }
}

function prefetchAnchor(anchor) {
  if (!eligibleAnchor(anchor)) return
  const url = new URL(anchor.href)
  prune([...document.querySelectorAll("a[href]")].filter(eligibleAnchor))
  if (documents.has(url.href)) return
  const pending = fetchDocument(url, matchRoute(url.pathname))
  documents.set(url.href, pending)
  pending.catch(() => {
    if (documents.get(url.href) === pending) documents.delete(url.href)
  })
}

function prune(anchors) {
  const retained = new Set([location.href, ...anchors.map(anchor => anchor.href)])
  for (const key of documents.keys()) if (!retained.has(key)) documents.delete(key)
}

async function navigate(url, push) {
  await ready
  const record = matchRoute(url.pathname)
  if (!record) return fallback(url, push)
  const current = ++revision
  pendingStyleUpdate?.rollback()
  pendingStyleUpdate = undefined
  request?.abort()
  request = new AbortController()
  let committed = false
  let styleUpdate
  try {
    let documentResult
    const cached = documents.get(url.href)
    if (cached) {
      try { documentResult = await cached }
      catch { documentResult = await fetchDocument(url, record, request.signal) }
    } else documentResult = await fetchDocument(url, record, request.signal)
    documents.set(url.href, Promise.resolve(documentResult))
    const { incoming, parsed, capabilities } = documentResult
    if (current !== revision) return
    styleUpdate = prepareStyles(parsed.styles)
    pendingStyleUpdate = styleUpdate
    await styleUpdate.ready
    if (current !== revision) {
      styleUpdate.rollback()
      return
    }
    await routeDispose()
    if (current !== revision) {
      styleUpdate.rollback()
      return
    }
    styleUpdate.commit()
    if (pendingStyleUpdate === styleUpdate) pendingStyleUpdate = undefined
    commit(incoming, parsed.nodes, capabilities.params, url.pathname, url.search)
    committed = true
    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose
    if (push) history.pushState(null, "", url)
    updateHead(incoming)
    focusAndScroll(url)
    status.textContent = `Navigated to ${document.title}`
    discover()
  } catch (error) {
    styleUpdate?.rollback()
    if (pendingStyleUpdate === styleUpdate) pendingStyleUpdate = undefined
    if (current !== revision || error.name === "AbortError") return
    fallback(url, push)
    if (committed) return
  }
}

async function loadCapabilities(parsed) {
  const modules = await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))
  const params = modules.filter(module => typeof module.initializeParams === "function")
  const effects = modules.filter(module => typeof module.mountRouteEffects === "function")
  if (params.length > 1 || effects.length > 1) throw new Error("Navigation document has duplicate route capabilities")
  return { params: params[0]?.initializeParams, effects: effects[0] }
}

async function fetchDocument(url, record, signal) {
  const response = await fetch(url, { signal, redirect: "manual", headers: { accept: "text/html" } })
  if (!response.ok || response.redirected || response.type === "opaqueredirect" || !response.headers.get("content-type")?.toLowerCase().includes("text/html")) throw new Error("Navigation response is not successful nonredirected HTML")
  const incoming = new DOMParser().parseFromString(await response.text(), "text/html")
  const parsed = validate(incoming, record)
  return { incoming, parsed, capabilities: await loadCapabilities(parsed), record }
}

function validate(incoming, record) {
  if (incoming.body.dataset.kApplication !== applicationId || incoming.body.dataset.kLayout !== layoutId || incoming.body.dataset.kRoute !== record.id) throw new Error("Navigation document identity does not match")
  const starts = incoming.querySelectorAll("template[data-k-route-start]")
  const ends = incoming.querySelectorAll("template[data-k-route-end]")
  if (starts.length !== 1 || ends.length !== 1) throw new Error("Navigation document must contain exactly one route marker pair")
  const nodes = between(starts[0], ends[0])
  const assets = [...incoming.querySelectorAll("script[data-k-capability][src]")].map(script => {
    const url = new URL(script.src)
    if (url.origin !== location.origin) throw new Error("Navigation capability asset must be same-origin")
    return url.pathname
  })
  if (!assets.includes(navigationAsset)) throw new Error("Navigation capability asset is missing")
  const styles = [...incoming.head.querySelectorAll('link[data-k-route-style][rel="stylesheet"][href]')]
  const styleUrls = styles.map(link => {
    const url = new URL(link.href)
    if (url.origin !== location.origin) throw new Error("Navigation stylesheet must be same-origin")
    return url.href
  })
  if (new Set(styleUrls).size !== styleUrls.length) throw new Error("Navigation document has duplicate route stylesheets")
  return { nodes, assets: [...new Set(assets)], styles }
}

function prepareStyles(incoming) {
  const anchor = document.head.querySelector("meta[data-k-style-anchor]")
  if (!anchor || document.head.querySelectorAll("meta[data-k-style-anchor]").length !== 1) throw new Error("Current navigation style anchor is invalid")
  const current = [...document.head.querySelectorAll('link[data-k-route-style][rel="stylesheet"][href]')]
  const place = links => {
    let previous = anchor
    for (const link of links) {
      if (link.previousSibling !== previous) previous.after(link)
      previous = link
    }
  }
  const byUrl = new Map(current.map(link => [new URL(link.href).href, link]))
  const next = []
  const created = []
  const loads = []
  for (const source of incoming) {
    const href = new URL(source.href).href
    let link = byUrl.get(href)
    if (link) byUrl.delete(href)
    else {
      link = document.importNode(source, true)
      created.push(link)
      loads.push(new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true })
        link.addEventListener("error", () => reject(new Error("Navigation stylesheet failed to load")), { once: true })
      }))
    }
    next.push(link)
  }
  let settled = false
  let cancel
  const update = {
    ready: Promise.race([
      Promise.all(loads),
      new Promise((resolve, reject) => {
        cancel = () => {
          const error = new Error("Navigation stylesheet load was cancelled")
          error.name = "AbortError"
          reject(error)
        }
      })
    ]),
    commit() {
      if (settled) return
      settled = true
      for (const link of byUrl.values()) link.remove()
    },
    rollback() {
      if (settled) return
      settled = true
      place(current)
      for (const link of created) link.remove()
      cancel()
    }
  }
  place(next)
  return update
}

function commit(incoming, incomingNodes, initializeParams, pathname, search) {
  const start = document.querySelector("template[data-k-route-start]")
  const end = document.querySelector("template[data-k-route-end]")
  if (!start || !end || document.querySelectorAll("template[data-k-route-start],template[data-k-route-end]").length !== 2) throw new Error("Current route markers are invalid")
  const outgoing = between(start, end)
  for (const node of outgoing) unmountDom(node)
  for (const node of outgoing) node.remove()
  for (const id of [...browserState.keys()]) if (id.startsWith("r")) browserState.delete(id)
  for (const [id, value, compact] of JSON.parse(incoming.body.dataset.kState ?? "[]")) if (id.startsWith("r")) browserState.set(id, compact ? value[1].map(row => Object.fromEntries(value[0].map((field, index) => [field, row[index]]))) : value)
  if (incoming.body.dataset.kTextBindings === undefined) delete document.body.dataset.kTextBindings
  else document.body.dataset.kTextBindings = incoming.body.dataset.kTextBindings
  document.body.dataset.kRoute = incoming.body.dataset.kRoute
  const nodes = incomingNodes.map(node => document.importNode(node, true))
  end.before(...nodes)
  initializeParams?.(pathname, search)
  for (const node of nodes) mountDom(node)
}

function matchRoute(pathname) {
  const exact = routes.find(record => record.path === pathname)
  if (exact) return exact.native ? undefined : exact
  for (const record of routes) {
    if (!record.segments) continue
    try {
      let path = pathname
      if (record.base) {
        const pathSegments = path.slice(1).split("/")
        const baseSegments = record.base.slice(1).split("/").map(segment => decodeURIComponent(segment))
        if (pathSegments.length < baseSegments.length || baseSegments.some((segment, index) => decodeSegment(pathSegments[index], false) !== segment)) continue
        path = `/${pathSegments.slice(baseSegments.length).join("/")}`
      }
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
      const segments = path.slice(1).split("/")
      if (segments.length !== record.segments.length) continue
      if (record.segments.every((literal, index) => {
        const value = decodeSegment(segments[index], literal === null)
        return literal === null || value === literal
      })) return record.native ? undefined : record
    } catch {}
  }
}

function decodeSegment(raw, param) {
  if (param && /%(?:2f|5c)/i.test(raw)) throw new Error("Encoded separator")
  const value = decodeURIComponent(raw)
  const decodedDots = value.replace(/%2e/gi, ".")
  if (param && (!value || value === "." || value === ".." || decodedDots === "." || decodedDots === ".." || /[\\/?#]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159) || /%(?:2f|5c)/i.test(value))) throw new Error("Invalid runtime parameter")
  return value
}

function fallback(url, push) {
  if (push) location.assign(url.href)
  else location.reload()
}

function between(start, end) {
  if (start.parentNode !== end.parentNode) throw new Error("Route markers must share a parent")
  const nodes = []
  for (let node = start.nextSibling; node && node !== end; node = node.nextSibling) nodes.push(node)
  if (!nodes.length && start.nextSibling !== end) throw new Error("Route marker pair is invalid")
  return nodes
}

function updateHead(incoming) {
  document.title = incoming.title
  document.head.querySelectorAll("[data-k-head]").forEach(node => node.remove())
  document.head.append(...[...incoming.head.querySelectorAll("[data-k-head]")].map(node => document.importNode(node, true)))
}

function focusAndScroll(url) {
  const hashTarget = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)))
  const target = hashTarget ?? routeElement("h1") ?? routeElement("main")
  if (target) {
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1")
    target.focus({ preventScroll: true })
  }
  if (hashTarget) hashTarget.scrollIntoView()
  else scrollTo(0, 0)
}

function routeElement(selector) {
  const start = document.querySelector("template[data-k-route-start]")
  const end = document.querySelector("template[data-k-route-end]")
  for (const node of between(start, end)) {
    if (node.matches?.(selector)) return node
    const match = node.querySelector?.(selector)
    if (match) return match
  }
}
