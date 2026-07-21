import { browserState, mountDom, registerCommitter, registerMountHook, registerUnmountHook, unmountDom } from "./shared-runtime.js"

const listTargets = new Map()
const listRegistrations = new WeakMap()
const mountedLists = new WeakSet()

function commitLists(id) {
  const lists = listTargets.get(id)
  if (!lists) return
  for (const list of lists) {
    if (!list.start.isConnected) unregisterList(list.start)
    else updateList(list)
  }
}

registerCommitter(commitLists)
registerMountHook(mountLists)
registerUnmountHook(unmountLists)

if (typeof document !== "undefined") mountDom(document)

function mountLists(root) {
  for (const start of matching(root, "template[data-k-list]")) {
    if (mountedLists.has(start)) continue
    mountedLists.add(start)
    const descriptor = JSON.parse(start.dataset.kList)
    const roots = [...start.ownerDocument.querySelectorAll("[data-k-list-item]")].filter(node => JSON.parse(node.dataset.kListItem)[0] === descriptor.id)
    const list = {
      start,
      descriptor,
      roots: new Map(roots.map(node => [keyToken(JSON.parse(node.dataset.kListItem)[1]), node])),
      container: roots[0]?.parentNode,
      boundary: roots.length ? roots.at(-1).nextSibling : findEnd(start, descriptor.id)
    }
    register(listTargets, descriptor.state, list)
    listRegistrations.set(start, { state: descriptor.state, list })
    updateList(list)
  }
}

function unmountLists(root) {
  for (const start of matching(root, "template[data-k-list]")) unregisterList(start)
}

function unregisterList(start) {
  const registration = listRegistrations.get(start)
  if (registration) {
    const lists = listTargets.get(registration.state)
    lists?.delete(registration.list)
    if (!lists?.size) listTargets.delete(registration.state)
  }
  listRegistrations.delete(start)
  mountedLists.delete(start)
}

function updateList(list) {
  const items = browserState.get(list.descriptor.state)
  if (!Array.isArray(items)) throw new Error("Keyed list state must remain an array")
  const entries = []
  const keys = new Set()
  for (const item of items) {
    const key = item?.[list.descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
    assertListItem(item)
    assertListValue(item, new Set())
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    entries.push({ item, key, token })
  }
  const next = []
  for (const { item, key, token } of entries) {
    let node = list.roots.get(token)
    if (!node) {
      const fragment = list.start.content.cloneNode(true)
      node = fragment.querySelector(`[data-k-list-root="${list.descriptor.id}"]`)
      if (!node) throw new Error("Keyed list template has no root element")
      node.removeAttribute("data-k-list-root")
      node.dataset.kListItem = JSON.stringify([list.descriptor.id, key])
      fillListItem(node, item)
      ;(list.container ?? list.start.parentNode).insertBefore(fragment, list.boundary)
      list.container ??= node.parentNode
      mountDom(node)
    } else {
      fillListItem(node, item)
    }
    next.push([token, node])
  }
  for (const [token, node] of list.roots) {
    if (keys.has(token)) continue
    unmountDom(node)
    node.remove()
  }
  const parent = list.container ?? list.start.parentNode
  for (const [, node] of next) parent.insertBefore(node, list.boundary)
  list.roots = new Map(next)
}

function fillListItem(root, item) {
  for (const marker of matching(root, "template[data-k-list-text]")) {
    const value = item?.[marker.dataset.kListText]
    let end = marker.nextSibling
    while (end && !(end.nodeType === Node.ELEMENT_NODE && end.matches("template[data-k-list-text-end]"))) end = end.nextSibling
    if (!end) throw new Error("Keyed list text marker has no end")
    const range = marker.ownerDocument.createRange()
    range.setStartAfter(marker)
    range.setEndBefore(end)
    range.deleteContents()
    end.before(marker.ownerDocument.createTextNode(value == null ? "" : String(value)))
  }
  for (const node of matching(root, "[data-k-list-attrs]")) {
    for (const [target, field] of JSON.parse(node.dataset.kListAttrs)) patchBinding(node, target, item?.[field])
  }
}

function patchBinding(node, target, value) {
  if (target === "disabled") {
    node.toggleAttribute("disabled", Boolean(value))
  } else if (target === "checked") {
    node.checked = Boolean(value)
  } else if (target === "value") {
    const next = value == null ? "" : String(value)
    if (node.value !== next) node.value = next
  } else if (target === "class" && (value == null || value === false)) {
    node.removeAttribute("class")
  } else if (target === "class") {
    node.setAttribute("class", String(value))
  } else if (value == null || (value === false && !isStringBooleanAttribute(target))) {
    node.removeAttribute(target)
  } else {
    node.setAttribute(target, value === true && !isStringBooleanAttribute(target) ? "" : String(value))
  }
}

function keyToken(key) {
  return `${typeof key}:${key}`
}

function validListKey(key) {
  return typeof key === "string" || typeof key === "number" && Number.isFinite(key)
}

function assertListItem(item) {
  const prototype = item && typeof item === "object" ? Object.getPrototypeOf(item) : undefined
  if (!item || Array.isArray(item) || prototype !== Object.prototype && prototype !== null) throw new Error("Keyed list items must be plain objects")
}

function assertListValue(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return
  if (!value || typeof value !== "object") throw new Error("Keyed list items must contain only JSON-safe values")
  if (seen.has(value)) throw new Error("Keyed list items must not contain cycles")
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) throw new Error("Keyed list items must contain only arrays and plain objects")
  if (Object.getOwnPropertySymbols(value).length) throw new Error("Keyed list items must not contain symbols")
  seen.add(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (Array.isArray(value) && Object.keys(descriptors).some(key => key !== "length" && !/^(0|[1-9]\d*)$/.test(key))) throw new Error("Keyed list arrays must not contain custom properties")
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw new Error("Keyed list arrays must not contain holes")
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    assertListValue(descriptor.value, seen)
  }
  seen.delete(value)
}

function findEnd(start, id) {
  return [...start.ownerDocument.querySelectorAll("template[data-k-list-end]")]
    .find(node => node.dataset.kListEnd === id)
}

function register(targets, id, entry) {
  const entries = targets.get(id) ?? new Set()
  entries.add(entry)
  targets.set(id, entries)
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function isStringBooleanAttribute(name) {
  return name.startsWith("aria-") || name.startsWith("data-")
}
