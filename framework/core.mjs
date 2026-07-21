const signalMarker = Symbol("kudzu.signal")
const behaviorMarker = Symbol("kudzu.behavior")
const nativeBehaviorMarker = Symbol("kudzu.nativeBehavior")
const bindingMarker = Symbol("kudzu.binding")
const conditionalMarker = Symbol("kudzu.conditional")
const listMarker = Symbol("kudzu.list")
const listFieldMarker = Symbol("kudzu.listField")
const noSelectValue = Symbol("kudzu.no-select-value")

let renderContext

export function useState(initialValue, name) {
  if (!renderContext) {
    throw new Error("useState() can only run while rendering a Kudzu component")
  }

  const id = `s${renderContext.nextState++}`
  const signal = {
    [signalMarker]: true,
    id,
    value: initialValue,
    valueOf() {
      return this.value
    },
    toString() {
      return String(this.value)
    }
  }

  renderContext.states[id] = { name: name ?? id, initialValue }
  return [signal, () => {
    throw new Error("State setters are compiled into ordered browser behaviors")
  }]
}

export function behavior(commands) {
  return {
    [behaviorMarker]: true,
    commands: commands.map(([operation, signal, value]) => {
      if (!signal?.[signalMarker]) throw new Error("A compiled behavior must target framework state")
      return [operation, signal.id, value]
    })
  }
}

export function nativeBehavior(module, handler, states, scope) {
  return {
    [nativeBehaviorMarker]: true,
    module,
    handler,
    states: Object.fromEntries(states.map(([name, signal]) => {
      if (!signal?.[signalMarker]) throw new Error("A native behavior must target framework state")
      return [name, signal.id]
    })),
    scope: Object.fromEntries(scope.map(([name, value]) => [name, serializeCapture(name, value, new Set())]))
  }
}

export function binding(value, module, handler, states, scope) {
  return { [bindingMarker]: true, value, ...reactiveDescriptor(module, handler, states, scope) }
}

export function conditional(kind, value, truthy, falsy, module, handler, states, scope) {
  return { [conditionalMarker]: true, kind, value, truthy, falsy, ...reactiveDescriptor(module, handler, states, scope) }
}

export function list(items, keyField, render) {
  if (!items?.[signalMarker] || !Array.isArray(items.value)) throw new Error("A keyed list must use local array state")
  const keys = new Set()
  for (const item of items.value) {
    const key = item?.[keyField]
    if (!validListKey(key)) throw new Error(`Keyed list key "${keyField}" must be a string or finite number`)
    assertListItem(item)
    assertListValue(item, new Set())
    const token = `${typeof key}:${key}`
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
  }
  return { [listMarker]: true, items, keyField, render }
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
  if (!value || typeof value !== "object") throw new Error(`Keyed list items must contain only JSON-safe values`)
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

function reactiveDescriptor(module, handler, states, scope) {
  const scopeStates = {}
  const serializedScope = {}
  const scopeBindings = {}
  for (const [name, entry] of scope) {
    if (entry?.[signalMarker]) scopeStates[name] = entry.id
    else if (entry?.[bindingMarker]) scopeBindings[name] = bindingDescriptor(entry)
    else serializedScope[name] = serializeCapture(name, entry, new Set())
  }
  return {
    module,
    handler,
    states: Object.fromEntries(states.map(([name, signal]) => {
      if (!signal?.[signalMarker]) throw new Error("A reactive binding must target framework state")
      return [name, signal.id]
    })),
    scope: serializedScope,
    scopeStates,
    scopeBindings
  }
}

export function bindingValue(value) {
  return value?.[signalMarker] || value?.[bindingMarker] ? value.value : value
}

function bindingDescriptor(value) {
  return { module: value.module, handler: value.handler, states: value.states, scope: value.scope, scopeStates: value.scopeStates, scopeBindings: value.scopeBindings }
}

function serializeCapture(name, value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0) ? value : { type: "number", value: String(value) }
  }
  if (value === undefined) return { type: "undefined" }
  if (typeof value !== "object") throw new Error(`Native capture "${name}" is not serializable: ${typeof value}`)
  if (seen.has(value)) throw new Error(`Native capture "${name}" is not serializable: cycle`)

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      return { type: "array", value: Array.from(value, entry => serializeCapture(name, entry, seen)) }
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`Native capture "${name}" is not serializable: ${value.constructor?.name ?? "non-plain object"}`)
    }
    if (Object.getOwnPropertySymbols(value).length) throw new Error(`Native capture "${name}" is not serializable: symbol`)
    const entries = []
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable) continue
      if (!("value" in descriptor)) throw new Error(`Native capture "${name}" is not serializable: accessor`)
      entries.push([key, serializeCapture(name, descriptor.value, seen)])
    }
    return { type: "object", nullPrototype: prototype === null, value: entries }
  } finally {
    seen.delete(value)
  }
}

export async function renderPage(component, metadata = {}) {
  renderContext = { nextState: 0, nextCondition: 0, nextList: 0, conditionDepth: 0, listDepth: 0, listRoot: undefined, states: {}, textStates: new Set(), conditionStates: new Set(), events: [], bindings: [], conditions: [], lists: [], hasBehaviors: false, hasNativeBehaviors: false, hasBindings: false, hasLists: false }

  try {
    const body = await renderNode({ type: component, props: {} })
    const title = escapeHtml(metadata.title ?? "Kudzu")
    const head = renderMetadata(metadata)
    const styles = metadata.styles === false
      ? ""
      : '<link rel="stylesheet" href="/assets/style.css">'
    const runtime = renderContext.hasBehaviors
      ? '<script type="module" src="/assets/kudzu.js"></script>'
      : ""
    const nativeRuntime = renderContext.hasNativeBehaviors
      ? '<script type="module" src="/assets/kudzu-native.js"></script>'
      : ""
    const bindingRuntime = renderContext.hasBindings
      ? '<script type="module" src="/assets/kudzu-binding.js"></script>'
      : ""
    const listRuntime = renderContext.hasLists
      ? '<script type="module" src="/assets/kudzu-list.js"></script>'
      : ""
    const initialState = renderContext.hasBehaviors
      ? Object.entries(renderContext.states).filter(([id]) => !renderContext.textStates.has(id) || renderContext.conditionStates.has(id)).map(([id, entry]) => [id, entry.initialValue])
      : []
    const state = initialState.length
      ? ` data-k-state='${escapeJsonAttribute(initialState)}'`
      : ""

    return {
      html: `<!doctype html><html lang="${escapeAttribute(metadata.lang ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${head}${styles}</head><body${state}>${body}${runtime}${bindingRuntime}${listRuntime}${nativeRuntime}</body></html>`,
      hasBehaviors: renderContext.hasBehaviors,
      hasBindings: renderContext.hasBindings,
      hasLists: renderContext.hasLists,
      hasStateSeed: initialState.length > 0,
      plan: {
        states: Object.entries(renderContext.states).map(([id, state]) => ({ id, ...state })),
        events: renderContext.events,
        bindings: renderContext.bindings,
        conditions: renderContext.conditions,
        lists: renderContext.lists
      }
    }
  } finally {
    renderContext = undefined
  }
}

function renderMetadata(metadata) {
  const tags = []
  const meta = (name, content, property = false) => {
    if (content) tags.push(`<meta ${property ? "property" : "name"}="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`)
  }

  if (metadata.description) meta("description", metadata.description)
  if (metadata.themeColor) meta("theme-color", metadata.themeColor)
  if (metadata.url) tags.push(`<link rel="canonical" href="${escapeAttribute(metadata.url)}">`)
  if (metadata.icon) tags.push(`<link rel="icon" href="${escapeAttribute(metadata.icon)}">`)
  if (metadata.appleTouchIcon) tags.push(`<link rel="apple-touch-icon" href="${escapeAttribute(metadata.appleTouchIcon)}">`)
  if (metadata.manifest) tags.push(`<link rel="manifest" href="${escapeAttribute(metadata.manifest)}">`)

  meta("og:title", metadata.title, true)
  meta("og:description", metadata.description, true)
  if (metadata.type || metadata.title || metadata.description || metadata.url || metadata.image || metadata.siteName || metadata.locale) meta("og:type", metadata.type ?? "website", true)
  meta("og:url", metadata.url, true)
  meta("og:image", metadata.image, true)
  if (metadata.image) {
    meta("og:image:width", "1200", true)
    meta("og:image:height", "630", true)
    meta("og:image:alt", metadata.imageAlt ?? metadata.title, true)
  }
  meta("og:site_name", metadata.siteName, true)
  meta("og:locale", metadata.locale, true)
  meta("twitter:card", metadata.twitterCard ?? (metadata.image ? "summary_large_image" : undefined))
  meta("twitter:title", metadata.title)
  meta("twitter:description", metadata.description)
  meta("twitter:image", metadata.twitterImage ?? metadata.image)

  return tags.join("")
}

async function renderNode(node, namespace, selectValue = noSelectValue) {
  if (node == null || node === false || node === true) return ""
  if (Array.isArray(node)) {
    let html = ""
    for (const child of node) html += await renderNode(child, namespace, selectValue)
    return html
  }
  if (node?.[signalMarker]) {
    renderContext.textStates.add(node.id)
    if (renderContext.conditionDepth || renderContext.listDepth) renderContext.conditionStates.add(node.id)
    return `<span data-k-text="${node.id}" data-k-value='${escapeJsonAttribute(node.value)}'>${escapeHtml(node.value)}</span>`
  }
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") {
    return escapeHtml(node)
  }
  if (node instanceof Promise) return renderNode(await node, namespace, selectValue)
  if (node?.[conditionalMarker]) {
    const descriptor = bindingDescriptor(node)
    const stateIds = reactiveStateIds(descriptor)
    if (!stateIds.size) return renderNode(node.value ? node.truthy() : node.falsy(), namespace, selectValue)
    if (namespace) throw new Error(`Reactive conditional DOM is not supported inside ${namespace}`)

    const id = `c${renderContext.nextCondition++}`
    renderContext.conditionDepth++
    const truthy = await renderNode(node.truthy(), namespace, selectValue)
    const falsy = await renderNode(node.falsy(), namespace, selectValue)
    renderContext.conditionDepth--
    const metadata = { id, kind: node.kind, initial: node.value, ...descriptor }
    for (const stateId of stateIds) renderContext.conditionStates.add(stateId)
    renderContext.conditions.push(metadata)
    renderContext.hasBehaviors = true
    renderContext.hasBindings = true
    const encoded = escapeJsonAttribute(metadata)
    const current = node.value ? truthy : node.kind === "and" ? await renderNode(node.value, namespace, selectValue) : falsy
    return `<template data-k-if='${encoded}'><template data-k-true>${truthy}</template><template data-k-false>${falsy}</template></template>${current}<template data-k-if-end="${id}"></template>`
  }
  if (node?.[listMarker]) return renderList(node, namespace, selectValue)
  if (node?.[listFieldMarker]) {
    return `<template data-k-list-text="${escapeAttribute(node.field)}"></template>${escapeHtml(node.value ?? "")}<template data-k-list-text-end></template>`
  }
  if (!node || typeof node !== "object" || !("type" in node)) {
    throw new Error(`Cannot render ${String(node)}`)
  }

  if (node.type === Symbol.for("kudzu.fragment")) return renderNode(node.props.children, namespace, selectValue)
  if (typeof node.type === "function") return renderNode(await node.type(node.props), namespace, selectValue)

  const tag = node.type
  const props = node.props ?? {}
  const childSelectValue = tag === "select"
    ? Object.hasOwn(props, "value") ? bindingValue(props.value) : noSelectValue
    : selectValue
  const childNamespace = tag === "svg" || tag === "math"
    ? tag
    : namespace === "svg" && tag === "foreignObject" ? undefined : namespace
  let attributes = ""
  const attributeBindings = []
  const listAttributes = []

  if (renderContext.listRoot) {
    const root = renderContext.listRoot
    renderContext.listRoot = undefined
    attributes += root.template
      ? ` data-k-list-root="${root.id}"`
      : ` data-k-list-item='${escapeJsonAttribute([root.id, root.key])}'`
  }

  for (const [rawName, value] of Object.entries(props)) {
    if (rawName === "children" || rawName === "key") continue
    if (rawName === "selected" && selectValue !== noSelectValue) continue
    if (/^on/i.test(rawName) && !/^on[A-Z]/.test(rawName)) throw new Error(`${rawName} must use a camelCase event handler`)
    if (rawName.toLowerCase().startsWith("data-k-")) throw new Error(`${rawName} uses Kudzu's reserved data-k-* prefix`)
    if (["style", "ref", "dangerouslysetinnerhtml"].includes(rawName.toLowerCase()) && (value?.[signalMarker] || value?.[bindingMarker])) {
      throw new Error(`Reactive ${rawName} is not supported`)
    }

    if (/^on[A-Z]/.test(rawName)) {
      const event = rawName.slice(2).toLowerCase()
      if (value?.[behaviorMarker]) {
        const commands = JSON.stringify(value.commands)
        attributes += ` data-k-on-${event}='${escapeJsonAttribute(value.commands)}'`
        renderContext.events.push({ event, commands: value.commands })
      } else if (value?.[nativeBehaviorMarker]) {
        const native = { module: value.module, handler: value.handler, states: value.states, scope: value.scope }
        attributes += ` data-k-native-${event}='${escapeJsonAttribute(native)}'`
        renderContext.events.push({ event, native })
        renderContext.hasNativeBehaviors = true
      } else {
        throw new Error(`${rawName} must reference a compilable event handler`)
      }
      renderContext.hasBehaviors = true
      continue
    }

    const name = rawName === "className" ? "class" : rawName === "htmlFor" ? "for" : rawName
    const propertyTarget = name === "class" || name === "disabled" || name === "value" || name === "checked"
    if (value?.[listFieldMarker]) {
      attributes += renderAttribute(name, value.value)
      listAttributes.push([name, value.field])
      continue
    }
    if (value?.[signalMarker] || value?.[bindingMarker]) {
      const initialValue = value[signalMarker] ? value.value : value.value
      const reactive = value[signalMarker] || Object.keys(value.states).length > 0 || Object.keys(value.scopeStates).length > 0 || Object.keys(value.scopeBindings).length > 0
      if (!reactive) {
        if (tag !== "select" || name !== "value") attributes += renderAttribute(name, initialValue)
        continue
      }
      const descriptor = value[signalMarker]
        ? { state: value.id }
        : bindingDescriptor(value)
      if (tag !== "select" || name !== "value") attributes += renderAttribute(name, initialValue)
      if (propertyTarget) attributes += ` data-k-bind-${name}='${escapeJsonAttribute(descriptor)}'`
      else attributeBindings.push({ target: name, ...descriptor })
      renderContext.bindings.push({ target: name, ...descriptor })
      if (renderContext.conditionDepth || renderContext.listDepth) for (const stateId of reactiveStateIds(descriptor)) renderContext.conditionStates.add(stateId)
      renderContext.hasBehaviors = true
      renderContext.hasBindings = true
      continue
    }

    if (tag === "select" && name === "value") continue
    if (name === "style" && value && typeof value === "object") {
      const style = Object.entries(value).map(([property, entry]) => `${toKebabCase(property)}:${entry}`).join(";")
      attributes += ` style="${escapeAttribute(style)}"`
    } else {
      attributes += renderAttribute(name, value)
    }
  }

  if (attributeBindings.length) attributes += ` data-k-bind-attrs='${escapeJsonAttribute(attributeBindings)}'`
  if (listAttributes.length) attributes += ` data-k-list-attrs='${escapeJsonAttribute(listAttributes)}'`

  if (tag === "option" && selectValue !== noSelectValue && String(optionValue(props)) === (selectValue == null ? "" : String(selectValue))) attributes += " selected"

  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])
  if (voidElements.has(tag)) return `<${tag}${attributes}>`
  return `<${tag}${attributes}>${await renderNode(props.children, childNamespace, childSelectValue)}</${tag}>`
}

async function renderList(node, namespace, selectValue) {
  if (namespace) throw new Error(`Reactive keyed lists are not supported inside ${namespace}`)
  const id = `l${renderContext.nextList++}`
  const descriptor = { id, state: node.items.id, key: node.keyField }
  const itemProxy = value => new Proxy({}, {
    get: (_, field) => ({ [listFieldMarker]: true, field: String(field), value: value?.[field] })
  })
  renderContext.listDepth++
  try {
    renderContext.listRoot = { id, template: true }
    const template = await renderNode(node.render(itemProxy(undefined)), namespace, selectValue)
    let current = ""
    for (const item of node.items.value) {
      renderContext.listRoot = { id, key: item[node.keyField], template: false }
      current += await renderNode(node.render(itemProxy(item)), namespace, selectValue)
    }
    renderContext.lists.push(descriptor)
    renderContext.hasBehaviors = true
    renderContext.hasLists = true
    return `<template data-k-list='${escapeJsonAttribute(descriptor)}'>${template}</template>${current}<template data-k-list-end="${id}"></template>`
  } finally {
    renderContext.listRoot = undefined
    renderContext.listDepth--
  }
}

function optionValue(props) {
  if (props.value != null) return bindingValue(props.value)
  return Array.isArray(props.children) ? props.children.join("") : props.children ?? ""
}

function reactiveStateIds(descriptor) {
  if (descriptor.state) return new Set([descriptor.state])
  return new Set([
    ...Object.values(descriptor.states),
    ...Object.values(descriptor.scopeStates),
    ...Object.values(descriptor.scopeBindings).flatMap(entry => [...reactiveStateIds(entry)])
  ])
}

function renderAttribute(name, value) {
  if (name === "disabled" || name === "checked") return value ? ` ${name}` : ""
  if (name === "value") return value == null ? "" : ` value="${escapeAttribute(value)}"`
  if (value == null || (value === false && !isStringBooleanAttribute(name))) return ""
  if (value === true && !isStringBooleanAttribute(name)) return ` ${name}`
  return ` ${name}="${escapeAttribute(value)}"`
}

function isStringBooleanAttribute(name) {
  return name.startsWith("aria-") || name.startsWith("data-")
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", "&#39;")
}

function escapeJsonAttribute(value) {
  return JSON.stringify(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("'", "&#39;")
}

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)
}
