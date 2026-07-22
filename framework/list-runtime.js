import { browserState, mountDom, registerCommitter, registerMountHook, registerUnmountHook, unmountDom } from "./shared-runtime.js"

const listTargets = new Map()
const listRegistrations = new WeakMap()
const mountedLists = new WeakSet()
const imports = new Map()
const revisions = new WeakMap()
const itemParts = new WeakMap()
const itemPartsSelector = "[data-k-list-text],[data-k-list-attrs],[data-k-list-events],[data-k-list-expression],[data-k-list-expression-attrs]"

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
    const end = findEnd(start, descriptor.id)
    const roots = listRoots(start, end)
    const templateRoot = start.content.firstElementChild
    const parts = listItemPartPlan(templateRoot)
    for (const root of roots) mapListItemParts(parts, root)
    if (descriptor.seed && !browserState.has(descriptor.state)) browserState.set(descriptor.state, roots.map((root, index) => seedListItem(root, descriptor, index)))
    const items = browserState.get(descriptor.state)
    const list = {
      start,
      descriptor,
      parts,
      seedFields: descriptor.seed && Object.keys(descriptor.seed),
      roots: new Map(roots.map((node, index) => [keyToken(descriptor.keys[index]), node])),
      values: new Map(),
      container: roots[0]?.parentNode,
      boundary: end
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
  const seen = new Set()
  for (const item of items) {
    const key = item?.[list.descriptor.key]
    if (!validListKey(key)) throw new Error(`Keyed list key "${list.descriptor.key}" must be a string or finite number`)
    assertListItem(item)
    const seededValue = list.seedFields && seededListValue(item, list.seedFields, list.descriptor.seed)
    if (seededValue === undefined) assertListValue(item, seen, true)
    const token = keyToken(key)
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
    entries.push({ item, key, token, value: seededValue ?? JSON.stringify(item) })
  }
  const next = []
  const values = new Map()
  const parent = list.container ?? list.start.parentNode
  const additions = parent.ownerDocument.createDocumentFragment()
  let added = false
  for (const { item, key, token, value } of entries) {
    let node = list.roots.get(token)
    if (!node) {
      node = list.start.content.firstElementChild?.cloneNode(true)
      if (node?.dataset.kListRoot !== list.descriptor.id) node = undefined
      if (!node) throw new Error("Keyed list template has no root element")
      node.removeAttribute("data-k-list-root")
      mapListItemParts(list.parts, node)
      fillListItem(node, item)
      additions.append(node)
      added = true
    } else if (list.values.get(token) !== value) {
      fillListItem(node, item)
    }
    next.push([token, node])
    values.set(token, value)
  }
  for (const [token, node] of list.roots) {
    if (keys.has(token)) continue
    if (list.descriptor.mount) {
      unmountDom(node)
      node.remove()
    } else node.remove()
  }
  if (added) {
    if (list.descriptor.mount) mountDom(additions)
    parent.insertBefore(additions, list.boundary)
    list.container ??= parent
  }
  let anchor = list.boundary
  let misplaced = 0
  for (let index = next.length - 1; index >= 0; index--) {
    const node = next[index][1]
    if (node.nextSibling !== anchor) misplaced++
    anchor = node
  }
  if (misplaced > next.length / 2) {
    const reordered = parent.ownerDocument.createDocumentFragment()
    reordered.append(...next.map(([, node]) => node))
    parent.insertBefore(reordered, list.boundary)
  } else if (misplaced) {
    anchor = list.boundary
    for (let index = next.length - 1; index >= 0; index--) {
      const node = next[index][1]
      if (node.nextSibling !== anchor) parent.insertBefore(node, anchor)
      anchor = node
    }
  }
  list.roots = new Map(next)
  list.values = values
}

function fillListItem(root, item) {
  const revision = (revisions.get(root) ?? 0) + 1
  revisions.set(root, revision)
  const parts = listItemParts(root)
  for (const [node, field] of parts.directTexts) {
    const text = item?.[field]
    const value = text == null ? "" : String(text)
    const current = node.firstChild
    if (current?.nodeType === Node.TEXT_NODE && !current.nextSibling) {
      if (current.data !== value) current.data = value
    } else {
      node.textContent = value
    }
  }
  for (const [marker, field] of parts.texts) {
    patchListText(marker, "template[data-k-list-text-end]", item?.[field])
  }
  for (const [node, attributes] of parts.attributes) {
    for (const [target, field] of attributes) patchBinding(node, target, item?.[field])
  }
  for (const [node, events] of parts.events) {
    for (const [event, native] of JSON.parse(events)) {
      native.scope = Object.fromEntries(Object.entries(native.scope).map(([name, value]) => [name, value?.type === "list-item" ? serializeItem(item) : value]))
      node.dataset[`kNative${capitalize(event)}`] = JSON.stringify(native)
    }
  }
  for (const [marker, descriptor] of parts.expressions) {
    evaluate(descriptor, item).then(value => {
      if (revisions.get(root) === revision && root.isConnected) patchListText(marker, "template[data-k-list-expression-end]", value)
    }).catch(error => console.error(error))
  }
  for (const [node, attributes] of parts.expressionAttributes) {
    for (const [target, module, handler] of attributes) {
      evaluate({ module, handler }, item).then(value => {
        if (revisions.get(root) === revision && root.isConnected) patchBinding(node, target, value)
      }).catch(error => console.error(error))
    }
  }
}

function listItemParts(root) {
  let parts = itemParts.get(root)
  if (parts) return parts
  parts = { directTexts: [], texts: [], attributes: [], events: [], expressions: [], expressionAttributes: [] }
  for (const node of matching(root, itemPartsSelector)) {
    if (node.hasAttribute("data-k-list-text")) (node.tagName === "TEMPLATE" ? parts.texts : parts.directTexts).push([node, node.dataset.kListText])
    if (node.hasAttribute("data-k-list-attrs")) parts.attributes.push([node, JSON.parse(node.dataset.kListAttrs)])
    if (node.hasAttribute("data-k-list-events")) parts.events.push([node, node.dataset.kListEvents])
    if (node.hasAttribute("data-k-list-expression")) parts.expressions.push([node, JSON.parse(node.dataset.kListExpression)])
    if (node.hasAttribute("data-k-list-expression-attrs")) parts.expressionAttributes.push([node, JSON.parse(node.dataset.kListExpressionAttrs)])
  }
  itemParts.set(root, parts)
  return parts
}

function listItemPartPlan(template) {
  const source = [template, ...template.querySelectorAll("*")]
  const indexes = new Map(source.map((node, index) => [node, index]))
  const parts = listItemParts(template)
  return {
    directTexts: parts.directTexts.map(([node, field]) => [indexes.get(node), field]),
    texts: parts.texts.map(([node, field]) => [indexes.get(node), field]),
    attributes: parts.attributes.map(([node, attributes]) => [indexes.get(node), attributes]),
    events: parts.events.map(([node, events]) => [indexes.get(node), events]),
    expressions: parts.expressions.map(([node, descriptor]) => [indexes.get(node), descriptor]),
    expressionAttributes: parts.expressionAttributes.map(([node, attributes]) => [indexes.get(node), attributes])
  }
}

function mapListItemParts(parts, root) {
  const target = [root, ...root.querySelectorAll("*")]
  itemParts.set(root, {
    directTexts: parts.directTexts.map(([index, field]) => [target[index], field]),
    texts: parts.texts.map(([index, field]) => [target[index], field]),
    attributes: parts.attributes.map(([index, attributes]) => [target[index], attributes]),
    events: parts.events.map(([index, events]) => [target[index], events]),
    expressions: parts.expressions.map(([index, descriptor]) => [target[index], descriptor]),
    expressionAttributes: parts.expressionAttributes.map(([index, attributes]) => [target[index], attributes])
  })
}

function listRoots(start, end) {
  const roots = []
  for (let node = start.nextSibling; node && node !== end; node = node.nextSibling) {
    if (node.nodeType === Node.ELEMENT_NODE) roots.push(node)
  }
  return roots
}

function seedListItem(root, descriptor, index) {
  const item = { [descriptor.key]: descriptor.keys[index] }
  const parts = itemParts.get(root)
  for (const [node, field] of parts.directTexts) item[field] = seedValue(node.textContent, descriptor.seed[field])
  for (const [marker, field] of parts.texts) item[field] = seedValue(rangeText(marker, "template[data-k-list-text-end]"), descriptor.seed[field])
  return item
}

function seedValue(value, type) {
  if (type === "number") return Number(value)
  if (type === "boolean") return value === "true"
  if (type === "null") return null
  return value
}

function rangeText(marker, endSelector) {
  let value = ""
  for (let node = marker.nextSibling; node && !(node.nodeType === Node.ELEMENT_NODE && node.matches(endSelector)); node = node.nextSibling) value += node.textContent
  return value
}

function patchListText(marker, endSelector, value) {
  let end = marker.nextSibling
  while (end && !(end.nodeType === Node.ELEMENT_NODE && end.matches(endSelector))) end = end.nextSibling
  if (!end) throw new Error("Keyed list text marker has no end")
  const text = value == null ? "" : String(value)
  const current = marker.nextSibling
  if (current?.nodeType === Node.TEXT_NODE && current.nextSibling === end) {
    if (current.data !== text) current.data = text
    return
  }
  const range = marker.ownerDocument.createRange()
  range.setStartAfter(marker)
  range.setEndBefore(end)
  range.deleteContents()
  end.before(marker.ownerDocument.createTextNode(text))
}

function evaluate(descriptor, item) {
  let module = imports.get(descriptor.module)
  if (!module) {
    module = import(descriptor.module)
    imports.set(descriptor.module, module)
  }
  return module.then(exports => {
    const value = exports[descriptor.handler](item)
    if (value && typeof value.then === "function") throw new Error("Derived keyed list item expressions must return synchronous values")
    return value
  })
}

function serializeItem(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value
  if (Array.isArray(value)) return { type: "array", value: value.map(serializeItem) }
  return { type: "object", nullPrototype: false, value: Object.entries(value).map(([key, entry]) => [key, serializeItem(entry)]) }
}

function patchBinding(node, target, value) {
  /* list-style */
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
  if (!item || Array.isArray(item) || prototype !== Object.prototype) throw new Error("Keyed list items must be ordinary plain objects")
}

function seededListValue(item, fields, seed) {
  const keys = Reflect.ownKeys(item)
  if (keys.length !== fields.length || keys.some(key => typeof key !== "string" || !fields.includes(key))) return undefined
  const values = []
  for (const field of fields) {
    const descriptor = Object.getOwnPropertyDescriptor(item, field)
    if (!descriptor.enumerable) throw new Error("Keyed list items must not contain non-enumerable properties")
    if (!("value" in descriptor)) throw new Error("Keyed list items must not contain accessors")
    const value = descriptor.value
    const type = value === null ? "null" : typeof value
    if (type !== seed[field] || type === "number" && (!Number.isFinite(value) || Object.is(value, -0))) return undefined
    values.push(value)
  }
  return JSON.stringify(values)
}

function assertListValue(value, seen, root = false) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return
  if (!value || typeof value !== "object") throw new Error("Keyed list items must contain only JSON-safe values")
  if (seen.has(value)) throw new Error("Keyed list items must not contain cycles")
  if (!root && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Keyed list items must contain only arrays and ordinary plain objects")
  seen.add(value)
  const keys = Reflect.ownKeys(value)
  if (keys.some(key => typeof key === "symbol")) throw new Error("Keyed list items must not contain symbols")
  if (Array.isArray(value) && keys.some(key => key !== "length" && !/^(0|[1-9]\d*)$/.test(key))) throw new Error("Keyed list arrays must not contain custom properties")
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw new Error("Keyed list arrays must not contain holes")
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") continue
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
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

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
