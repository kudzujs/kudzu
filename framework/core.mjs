import { serializeStyle } from "./style.js"

const signalMarker = Symbol("kudzu.signal")
const setterMarker = Symbol("kudzu.setter")
const behaviorMarker = Symbol("kudzu.behavior")
const nativeBehaviorMarker = Symbol("kudzu.nativeBehavior")
const bindingMarker = Symbol("kudzu.binding")
const conditionalMarker = Symbol("kudzu.conditional")
const listMarker = Symbol("kudzu.list")
const listFieldMarker = Symbol("kudzu.listField")
const listExpressionMarker = Symbol("kudzu.listExpression")
const listItemMarker = Symbol("kudzu.listItem")
const listConditionalMarker = Symbol("kudzu.listConditional")
const refMarker = Symbol("kudzu.ref")
const contextMarker = Symbol("kudzu.context")
const contextProviderMarker = Symbol("kudzu.contextProvider")
const routeScopeMarker = Symbol("kudzu.routeScope")
const noSelectValue = Symbol("kudzu.no-select-value")

let renderContext

export function useState(initialValue, name) {
  if (!renderContext) {
    throw new Error("useState() can only run while rendering a Kudzu component")
  }

  const id = nextRenderId("s")
  const signal = createSignal(id, initialValue)

  const setter = () => {
    throw new Error("State setters are compiled into ordered browser behaviors")
  }
  Object.defineProperty(setter, setterMarker, { value: id })
  renderContext.states[id] = { name: name ?? id, initialValue, ...(renderContext.scoped ? { lifetime: renderContext.renderScope } : {}) }
  return [signal, setter]
}

export function useParams() {
  if (renderContext?.renderScope === "layout") throw new Error("useParams() is only supported in route scope")
  if (!renderContext?.runtimeParamNames?.length) throw new Error("useParams() requires export const runtimeParams = true on a bracket page")
  if (!renderContext.params) {
    const params = Object.create(null)
    renderContext.paramEntries = renderContext.runtimeParamNames.map(name => {
      const id = nextRenderId("p")
      params[name] = createSignal(id, "")
      return { name, id }
    })
    renderContext.params = Object.freeze(params)
    renderContext.hasBehaviors = true
    renderContext.hasParams = true
  }
  return renderContext.params
}

function createSignal(id, value) {
  return {
    [signalMarker]: true,
    id,
    value,
    valueOf() {
      return this.value
    },
    toString() {
      return String(this.value)
    }
  }
}

export function useEffect(callback, dependencies, module, handler, states, scope, source, cleanup, itemDependencies = []) {
  if (!renderContext) throw new Error("useEffect() can only run while rendering a Kudzu component")
  if (typeof callback !== "function" || !Array.isArray(dependencies) || !module || !handler) throw new Error("useEffect() must be compiled with a literal dependency array")
  if (itemDependencies.length && !renderContext.listDepth) throw new Error(`${source} useEffect() item-property dependencies are only supported in direct keyed row components`)
  const dependencyIds = dependencies.map(dependency => {
    if (!dependency?.[signalMarker] || !validEffectDependency(dependency.value)) throw new Error(`${source} useEffect() dependencies must be primitive Kudzu state or runtime parameter identifiers`)
    return dependency.id
  })
  let owner
  let list = false
  if (renderContext.listDepth) {
    const effects = renderContext.listRoot?.effects
    if (!effects) throw new Error(`${source} useEffect() inside keyed lists must belong to the direct row component`)
    const index = effects.length
    if (renderContext.listTemplate) {
      owner = nextRenderId("e")
      renderContext.listEffectOwners.push(owner)
      list = true
    } else {
      owner = renderContext.listEffectOwners[index]
      if (!owner) throw new Error(`${source} Keyed row effects must have the same hook order for every item`)
    }
    effects.push(owner)
    if (!renderContext.listRoot.template) for (const field of itemDependencies) {
      if (!validEffectDependency(renderContext.listRoot.item[field])) throw new Error(`${source} useEffect() keyed item dependency "${field}" must be a JSON-safe primitive`)
    }
  } else if (renderContext.conditionDepth) {
    const owners = renderContext.effectOwners.at(-1)
    if (!owners) throw new Error(`${source} useEffect() inside conditional DOM must belong to a rendered function component`)
    owner = nextRenderId("e")
    owners.push(owner)
  }
  if (!renderContext.listDepth || list) renderContext.effects.push({ module, handler, states, scope, source, renderScope: renderContext.renderScope, ...(dependencyIds.length ? { dependencies: dependencyIds } : {}), ...(itemDependencies.length ? { itemDependencies, listState: renderContext.listRoot.state } : {}), ...(cleanup ? { cleanup: true } : {}), ...(owner ? { owner } : {}), ...(list ? { list: true } : {}) })
  renderContext.hasBehaviors = true
  renderContext.hasEffects = true
}

function validEffectDependency(value) {
  return value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)
}

export function useRef(initialValue) {
  if (!renderContext) throw new Error("useRef() can only run while rendering a Kudzu component")
  if (initialValue !== null) throw new Error("Kudzu DOM refs must initialize with null")
  return { [refMarker]: true, id: nextRenderId("r"), current: null }
}

export function createContext(defaultValue) {
  const context = { [contextMarker]: true, defaultValue }
  context.Provider = function Provider({ value, children }) {
    return { [contextProviderMarker]: true, context, value, children }
  }
  return context
}

export function useContext(context) {
  if (!renderContext) throw new Error("useContext() can only run while rendering a Kudzu component")
  if (!context?.[contextMarker]) throw new Error("useContext() requires a Kudzu context")
  for (let index = renderContext.contexts.length - 1; index >= 0; index--) {
    if (renderContext.contexts[index][0] === context) return renderContext.contexts[index][1]
  }
  return context.defaultValue
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
    ...nativeDescriptor(states, scope)
  }
}

function nativeDescriptor(states, scope) {
  return {
    states: Object.fromEntries(states.map(([name, signal]) => {
      if (!signal?.[signalMarker]) throw new Error("A native callback must target framework state")
      return [name, signal.id]
    })),
    scope: Object.fromEntries(scope.map(([name, value]) => [name, value?.[signalMarker] ? { type: "state", id: value.id } : serializeCapture(name, value, new Set())]))
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

export function listField(read, field) {
  return { [listFieldMarker]: true, field, value: renderContext?.listTemplate ? undefined : read() }
}

export function listExpression(read, module, handler) {
  const value = renderContext?.listTemplate ? undefined : read()
  if (value && typeof value.then === "function") throw new Error("Derived keyed list item expressions must return synchronous values")
  return { [listExpressionMarker]: true, module, handler, value }
}

export function listItem() {
  return { [listItemMarker]: true }
}

export function listConditional(kind, read, truthy, falsy, module, handler) {
  return { [listConditionalMarker]: true, kind, value: renderContext?.listTemplate ? undefined : read(), truthy, falsy, module, handler }
}

function validListKey(key) {
  return typeof key === "string" || typeof key === "number" && Number.isFinite(key)
}

function assertListItem(item) {
  const prototype = item && typeof item === "object" ? Object.getPrototypeOf(item) : undefined
  if (!item || Array.isArray(item) || prototype !== Object.prototype) throw new Error("Keyed list items must be ordinary plain objects")
}

function assertListValue(value, seen) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return
  if (!value || typeof value !== "object") throw new Error(`Keyed list items must contain only JSON-safe values`)
  if (seen.has(value)) throw new Error("Keyed list items must not contain cycles")
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype) throw new Error("Keyed list items must contain only arrays and ordinary plain objects")
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
  if (value?.[listItemMarker]) return { type: "list-item" }
  if (value?.[refMarker]) return { type: "ref", id: value.id }
  if (value?.[signalMarker]) return { type: "state", id: value.id }
  if (typeof value === "function" && value[setterMarker]) return { type: "setter", id: value[setterMarker] }
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

export async function renderPage(component, metadata = {}, props = {}, layout) {
  renderContext = { scoped: Boolean(layout), renderScope: layout ? "layout" : "route", counters: { layout: { s: 0, r: 0, c: 0, l: 0, e: 0, p: 0 }, route: { s: 0, r: 0, c: 0, l: 0, e: 0, p: 0 } }, nextState: 0, nextRef: 0, nextCondition: 0, nextList: 0, nextEffect: 0, nextParam: 0, conditionDepth: 0, listDepth: 0, listRoot: undefined, listTemplate: false, listInitialMarkers: false, listConditionalBranch: false, listFields: undefined, listEffectOwners: [], effectOwners: [], contexts: [], states: {}, textStates: new Set(), conditionStates: new Set(), events: [], effects: [], bindings: [], textBindings: [], conditions: [], lists: [], runtimeParamNames: metadata.runtimeParams, paramEntries: [], params: undefined, hasBehaviors: false, hasNativeBehaviors: false, hasEffects: false, hasParams: false, hasBindings: false, hasLists: false, hasListStyles: false }

  try {
    const page = { [routeScopeMarker]: true, component, props }
    const body = await renderNode(layout ? { type: layout, props: { children: page } } : { type: component, props })
    renderContext.effects = renderContext.effects.map(effect => {
      try {
        const descriptor = nativeDescriptor(effect.states.map(([name, read]) => [name, read()]), effect.scope.map(([name, read]) => [name, typeof read === "function" ? read() : read]))
        return {
          module: effect.module,
          handler: effect.handler,
          ...(effect.dependencies ? { dependencies: effect.dependencies } : {}),
          ...(effect.itemDependencies ? { itemDependencies: effect.itemDependencies, listState: effect.listState } : {}),
          ...(effect.cleanup ? { cleanup: true } : {}),
          ...(effect.owner ? { owner: effect.owner } : {}),
          ...(effect.list ? { list: true } : {}),
          ...(renderContext.scoped ? { lifetime: effect.renderScope } : {}),
          states: descriptor.states,
          scope: descriptor.scope
        }
      } catch (error) {
        throw new Error(`${effect.source} ${error.message}`)
      }
    })
    const title = escapeHtml(metadata.title ?? "Kudzu")
    const head = renderMetadata(metadata)
    const capability = metadata.navigationAsset ? " data-k-capability" : ""
    const styles = metadata.styles === false
      ? ""
      : (Array.isArray(metadata.styles) ? metadata.styles : [assetPath(metadata.base, "assets/style.css")]).map(href => `<link rel="stylesheet" href="${escapeAttribute(href)}">`).join("")
    const runtime = renderContext.hasBehaviors
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.runtimeAsset ?? assetPath(metadata.base, "assets/kudzu.js"))}"></script>`
      : ""
    const nativeRuntime = renderContext.hasNativeBehaviors
      ? `<script type="module"${capability} src="${assetPath(metadata.base, "assets/kudzu-native.js")}"></script>`
      : ""
    const paramRuntime = renderContext.hasParams
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.paramAsset)}"></script>`
      : ""
    const bindingRuntime = renderContext.hasBindings
      ? `<script type="module"${capability} src="${assetPath(metadata.base, "assets/kudzu-binding.js")}"></script>`
      : ""
    const listRuntime = renderContext.hasLists
      ? `<script type="module"${capability} src="${assetPath(metadata.base, "assets/kudzu-list.js")}"></script>`
      : ""
    const effectRuntime = renderContext.hasEffects
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.effectAsset)}"></script>`
      : ""
    const navigationRuntime = metadata.navigationAsset
      ? `<script type="module" data-k-capability src="${escapeAttribute(metadata.navigationAsset)}"></script>`
      : ""
    const listStates = new Set(renderContext.lists.map(list => list.state))
    const seededListStates = new Set(renderContext.lists.filter(list => list.seed && !renderContext.textStates.has(list.state) && !renderContext.conditionStates.has(list.state)).map(list => list.state))
    const initialState = renderContext.hasBehaviors
      ? Object.entries(renderContext.states).filter(([id]) => (!renderContext.textStates.has(id) || renderContext.conditionStates.has(id)) && !seededListStates.has(id)).map(([id, entry]) => {
        const compact = listStates.has(id) && compactListState(entry.initialValue)
        return compact ? [id, compact, 1] : [id, entry.initialValue]
      })
      : []
    const state = initialState.length
      ? ` data-k-state='${escapeJsonAttribute(initialState)}'`
      : ""
    const textBindings = renderContext.textBindings.length
      ? ` data-k-text-bindings='${escapeJsonAttribute(renderContext.textBindings)}'`
      : ""

    return {
      html: `<!doctype html><html lang="${escapeAttribute(metadata.lang ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${head}${styles}${runtime}${paramRuntime}${bindingRuntime}${listRuntime}${nativeRuntime}${effectRuntime}${navigationRuntime}</head><body${state}${textBindings}${metadata.applicationId ? ` data-k-application="${escapeAttribute(metadata.applicationId)}" data-k-layout="${escapeAttribute(metadata.layoutId)}" data-k-route="${escapeAttribute(metadata.routeId)}"` : ""}>${body}</body></html>`,
      hasBehaviors: renderContext.hasBehaviors,
      hasEffects: renderContext.hasEffects,
      hasParams: renderContext.hasParams,
      hasBindings: renderContext.hasBindings,
      hasLists: renderContext.hasLists,
      hasListStyles: renderContext.hasListStyles,
      hasStateSeed: initialState.length > 0,
      plan: {
        states: Object.entries(renderContext.states).map(([id, state]) => ({ id, ...state })),
        params: renderContext.paramEntries,
        events: renderContext.events,
        effects: renderContext.effects,
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
  const owned = metadata.navigationAsset ? " data-k-head" : ""
  const meta = (name, content, property = false) => {
    if (content) tags.push(`<meta${owned} ${property ? "property" : "name"}="${escapeAttribute(name)}" content="${escapeAttribute(content)}">`)
  }

  if (metadata.description) meta("description", metadata.description)
  if (metadata.themeColor) meta("theme-color", metadata.themeColor)
  if (metadata.url) tags.push(`<link${owned} rel="canonical" href="${escapeAttribute(metadata.url)}">`)
  if (metadata.icon) tags.push(`<link${owned} rel="icon" href="${escapeAttribute(baseUrl(metadata.base, metadata.icon))}">`)
  if (metadata.appleTouchIcon) tags.push(`<link${owned} rel="apple-touch-icon" href="${escapeAttribute(baseUrl(metadata.base, metadata.appleTouchIcon))}">`)
  if (metadata.manifest) tags.push(`<link${owned} rel="manifest" href="${escapeAttribute(baseUrl(metadata.base, metadata.manifest))}">`)

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

function assetPath(base, path) {
  return `${base ?? ""}/${path}`
}

function baseUrl(base, value) {
  return value.startsWith("/") ? `${base ?? ""}${value}` : value
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
  if (node?.[routeScopeMarker]) {
    const previousScope = renderContext.renderScope
    renderContext.renderScope = "route"
    try {
      const html = await renderNode({ type: node.component, props: node.props }, namespace, selectValue)
      return `<template data-k-route-start></template>${html}<template data-k-route-end></template>`
    } finally {
      renderContext.renderScope = previousScope
    }
  }
  if (node?.[contextProviderMarker]) {
    renderContext.contexts.push([node.context, node.value])
    try {
      return await renderNode(node.children, namespace, selectValue)
    } finally {
      renderContext.contexts.pop()
    }
  }
  if (node?.[conditionalMarker]) {
    const descriptor = bindingDescriptor(node)
    const stateIds = reactiveStateIds(descriptor)
    if (!stateIds.size) return renderNode(node.value ? node.truthy() : node.falsy(), namespace, selectValue)
    if (namespace) throw new Error(`Reactive conditional DOM is not supported inside ${namespace}`)

    const id = nextRenderId("c")
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
    if (renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) renderContext.listFields?.add(node.field)
    const marker = renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch ? ` data-k-list-text="${escapeAttribute(node.field)}"` : ""
    return `<template${marker}></template>${escapeHtml(node.value ?? "")}<template data-k-list-text-end></template>`
  }
  if (node?.[listExpressionMarker]) {
    const descriptor = { module: node.module, handler: node.handler }
    const marker = renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch ? ` data-k-list-expression='${escapeJsonAttribute(descriptor)}'` : ""
    return `<template${marker}></template>${escapeHtml(node.value ?? "")}<template data-k-list-expression-end></template>`
  }
  if (node?.[bindingMarker]) {
    const descriptor = bindingDescriptor(node)
    const reactive = reactiveStateIds(descriptor).size > 0
    if (!reactive) return renderNode(node.value, namespace, selectValue)
    renderContext.bindings.push({ target: "text", ...descriptor })
    if (renderContext.conditionDepth || renderContext.listDepth) for (const stateId of reactiveStateIds(descriptor)) renderContext.conditionStates.add(stateId)
    renderContext.hasBehaviors = true
    renderContext.hasBindings = true
    const id = renderContext.textBindings.length
    renderContext.textBindings.push(descriptor)
    return `<!--k-text:${id}-->${escapeHtml(node.value ?? "")}<!--k-text-end-->`
  }
  if (node?.[listConditionalMarker]) {
    const descriptor = { kind: node.kind, module: node.module, handler: node.handler }
    const previousBranch = renderContext.listConditionalBranch
    renderContext.listConditionalBranch = true
    let truthy
    let falsy
    try {
      truthy = await renderNode(node.truthy(), namespace, selectValue)
      falsy = await renderNode(node.falsy(), namespace, selectValue)
    } finally {
      renderContext.listConditionalBranch = previousBranch
    }
    const key = conditionKey(node.kind, node.value)
    const current = renderContext.listTemplate
      ? ""
      : node.kind === "and" && !node.value ? escapeHtml(renderFalsy(node.value)) : node.value ? truthy : falsy
    const initial = renderContext.listTemplate ? "" : ` data-k-list-current="${escapeAttribute(key)}"`
    return `<template data-k-list-condition='${escapeJsonAttribute(descriptor)}'${initial}><template data-k-list-true>${truthy}</template><template data-k-list-false>${falsy}</template></template>${current}<template data-k-list-condition-end></template>`
  }
  if (!node || typeof node !== "object" || !("type" in node)) {
    throw new Error(`Cannot render ${String(node)}`)
  }

  if (node.type === Symbol.for("kudzu.fragment")) return renderNode(node.props.children, namespace, selectValue)
  if (typeof node.type === "function") {
    if (!renderContext.conditionDepth) return renderNode(await node.type(node.props), namespace, selectValue)
    const owners = []
    renderContext.effectOwners.push(owners)
    let result
    try {
      result = await node.type(node.props)
    } finally {
      renderContext.effectOwners.pop()
    }
    const html = await renderNode(result, namespace, selectValue)
    return owners.map(owner => `<template data-k-effect="${owner}"></template>`).join("") + html
  }

  const tag = node.type
  const props = node.props ?? {}
  if (typeof tag === "string" && tag.toLowerCase() === "link") {
    const rel = Object.entries(props).find(([name]) => name.toLowerCase() === "rel")?.[1]
    const value = rel?.[signalMarker] || rel?.[bindingMarker] ? rel.value : rel
    if (typeof value === "string" && value.toLowerCase().split(/\s+/).includes("stylesheet")) {
      throw new Error("Stylesheets must be placed under src/ or declared in kudzu.config styles so Kudzu can emit them in <head>")
    }
  }
  const directListText = props.children?.[listFieldMarker] ? props.children : undefined
  const childSelectValue = tag === "select"
    ? Object.hasOwn(props, "value") ? bindingValue(props.value) : noSelectValue
    : selectValue
  const childNamespace = tag === "svg" || tag === "math"
    ? tag
    : namespace === "svg" && tag === "foreignObject" ? undefined : namespace
  let attributes = ""
  const attributeBindings = []
  const listAttributes = []
  const listExpressionAttributes = []
  const listEvents = []
  let rawHtml

  if (renderContext.listRoot) {
    const root = renderContext.listRoot
    renderContext.listRoot = undefined
    if (root.template) attributes += ` data-k-list-root="${root.id}"`
    if (root.effects.length) {
      attributes += ` data-k-effects='${escapeJsonAttribute(root.effects)}'`
      if (!root.template) attributes += ` data-k-effect-item='${escapeJsonAttribute(root.item)}'`
    }
  }

  for (const [rawName, value] of Object.entries(props)) {
    if (rawName === "children" || rawName === "key") continue
    if (rawName === "ref") {
      if (!value?.[refMarker]) throw new Error("ref must be created by useRef(null)")
      if (renderContext.listDepth) throw new Error("Refs are not supported in keyed lists")
      attributes += ` data-k-ref="${value.id}"`
      continue
    }
    if (rawName === "selected" && selectValue !== noSelectValue) continue
    if (/^on/i.test(rawName) && !/^on[A-Z]/.test(rawName)) throw new Error(`${rawName} must use a camelCase event handler`)
    if (rawName.toLowerCase().startsWith("data-k-") && rawName.toLowerCase() !== "data-k-native") throw new Error(`${rawName} uses Kudzu's reserved data-k-* prefix`)
    if (["ref", "dangerouslysetinnerhtml"].includes(rawName.toLowerCase()) && (value?.[signalMarker] || value?.[bindingMarker])) {
      throw new Error(`Reactive ${rawName} is not supported`)
    }
    if (rawName === "dangerouslySetInnerHTML") {
      if (renderContext.listDepth) throw new Error("dangerouslySetInnerHTML is not supported in keyed lists")
      if (!value || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, "__html")) throw new Error("dangerouslySetInnerHTML requires { __html }")
      if (value.__html?.[signalMarker] || value.__html?.[bindingMarker]) throw new Error("Reactive dangerouslySetInnerHTML is not supported")
      if (props.children != null) throw new Error("dangerouslySetInnerHTML cannot be used with children")
      rawHtml = value.__html == null ? "" : String(value.__html)
      continue
    }

    if (/^on[A-Z]/.test(rawName)) {
        const event = rawName.slice(2).toLowerCase()
      if (value?.[behaviorMarker]) {
        const commands = JSON.stringify(value.commands)
        attributes += ` data-k-on-${event}='${escapeJsonAttribute(value.commands)}'`
        renderContext.events.push({ event, commands: value.commands })
      } else if (value?.[nativeBehaviorMarker]) {
        const template = { module: value.module, handler: value.handler, states: value.states, scope: value.scope }
        const native = template
        attributes += ` data-k-native-${event}='${escapeJsonAttribute(native)}'`
        renderContext.events.push({ event, native })
        if (renderContext.listDepth && Object.values(template.scope).some(entry => entry?.type === "list-item")) listEvents.push([event, template])
        renderContext.hasNativeBehaviors = true
      } else {
        throw new Error(`${rawName} must reference a compilable event handler`)
      }
      renderContext.hasBehaviors = true
      continue
    }

    const name = rawName === "className" ? "class" : rawName === "htmlFor" ? "for" : rawName
    const propertyTarget = name === "class" || name === "disabled" || name === "value" || name === "checked" || name === "style"
    if (value?.[listFieldMarker]) {
      attributes += renderAttribute(name, value.value)
      listAttributes.push([name, value.field])
      if (name === "style") renderContext.hasListStyles = true
      continue
    }
    if (value?.[listExpressionMarker]) {
      attributes += renderAttribute(name, value.value)
      listExpressionAttributes.push([name, value.module, value.handler])
      if (name === "style") renderContext.hasListStyles = true
      continue
    }
    if (value?.[signalMarker] || value?.[bindingMarker]) {
      const initialValue = value[signalMarker] ? value.value : value.value
      const descriptor = value[signalMarker]
        ? { state: value.id }
        : bindingDescriptor(value)
      const reactive = reactiveStateIds(descriptor).size > 0
      if (!reactive) {
        if (tag !== "select" || name !== "value") attributes += renderAttribute(name, initialValue)
        continue
      }
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
    attributes += renderAttribute(name, value)
  }

  if (attributeBindings.length) attributes += ` data-k-bind-attrs='${escapeJsonAttribute(attributeBindings)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listAttributes.length) attributes += ` data-k-list-attrs='${escapeJsonAttribute(listAttributes)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listExpressionAttributes.length) attributes += ` data-k-list-expression-attrs='${escapeJsonAttribute(listExpressionAttributes)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listEvents.length) attributes += ` data-k-list-events='${escapeJsonAttribute(listEvents)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && directListText) {
    renderContext.listFields?.add(directListText.field)
    attributes += ` data-k-list-text="${escapeAttribute(directListText.field)}"`
  }

  if (tag === "option" && selectValue !== noSelectValue && String(optionValue(props)) === (selectValue == null ? "" : String(selectValue))) attributes += " selected"

  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])
  if (voidElements.has(tag)) {
    if (rawHtml !== undefined) throw new Error(`dangerouslySetInnerHTML cannot be used on <${tag}>`)
    return `<${tag}${attributes}>`
  }
  const children = rawHtml ?? (directListText ? escapeHtml(directListText.value ?? "") : await renderNode(props.children, childNamespace, childSelectValue))
  return `<${tag}${attributes}>${children}</${tag}>`
}

async function renderList(node, namespace, selectValue) {
  if (namespace) throw new Error(`Reactive keyed lists are not supported inside ${namespace}`)
  const id = nextRenderId("l")
  const descriptor = { id, state: node.items.id, key: node.keyField, keys: node.items.value.map(item => item[node.keyField]) }
  renderContext.listDepth++
  const previousListFields = renderContext.listFields
  const previousListEffectOwners = renderContext.listEffectOwners
  try {
    renderContext.listTemplate = true
    renderContext.listEffectOwners = []
    renderContext.listFields = new Set([node.keyField])
    renderContext.listRoot = { id, state: node.items.id, template: true, effects: [], item: {} }
    const template = await renderNode(node.render({}), namespace, selectValue)
    if (template.includes("data-k-native-") || template.includes("data-k-effects=")) descriptor.mount = true
    if (template.includes("data-k-effects=")) descriptor.effects = true
    if (template.includes("data-k-list-condition")) descriptor.conditions = true
    if (template.includes("data-k-list-text-end")) descriptor.textRanges = true
    if (template.includes("data-k-list-attrs")) descriptor.attributes = true
    if (template.includes("data-k-list-events")) descriptor.events = true
    if (template.includes("data-k-list-expression=")) descriptor.expressions = true
    if (template.includes("data-k-list-expression-attrs")) descriptor.expressionAttributes = true
    const seed = listSeed(node.items.value, renderContext.listFields)
    if (seed) descriptor.seed = seed
    let current = ""
    renderContext.listTemplate = false
    renderContext.listInitialMarkers = Boolean(descriptor.conditions)
    for (const item of node.items.value) {
      renderContext.listRoot = { id, state: node.items.id, key: item[node.keyField], template: false, effects: [], item }
      current += await renderNode(node.render(item), namespace, selectValue)
    }
    renderContext.lists.push(descriptor)
    renderContext.hasBehaviors = true
    renderContext.hasLists = true
    return `<template data-k-list='${escapeJsonAttribute(descriptor)}'>${template}</template>${current}<template data-k-list-end="${id}"></template>`
  } finally {
    renderContext.listRoot = undefined
    renderContext.listTemplate = false
    renderContext.listInitialMarkers = false
    renderContext.listFields = previousListFields
    renderContext.listEffectOwners = previousListEffectOwners
    renderContext.listDepth--
  }
}

function nextRenderId(kind) {
  if (renderContext.scoped) return `${renderContext.renderScope === "layout" ? "l" : "r"}${kind}${renderContext.counters[renderContext.renderScope][kind]++}`
  const counters = { s: "nextState", r: "nextRef", c: "nextCondition", l: "nextList", e: "nextEffect", p: "nextParam" }
  return `${kind}${renderContext[counters[kind]]++}`
}

function optionValue(props) {
  if (props.value != null) return bindingValue(props.value)
  return Array.isArray(props.children) ? props.children.join("") : props.children ?? ""
}

function conditionKey(kind, value) {
  return value ? "true" : kind === "and" ? `false:${renderFalsy(value)}` : "false"
}

function renderFalsy(value) {
  return value === false || value == null || value === true ? "" : String(value)
}

function reactiveStateIds(descriptor) {
  if (descriptor.state) return new Set([descriptor.state])
  return new Set([
    ...Object.values(descriptor.states),
    ...Object.values(descriptor.scopeStates),
    ...Object.values(descriptor.scope).flatMap(serializedStateIds),
    ...Object.values(descriptor.scopeBindings).flatMap(entry => [...reactiveStateIds(entry)])
  ])
}

function serializedStateIds(value) {
  if (!value || typeof value !== "object") return []
  if (value.type === "state") return [value.id]
  if (value.type === "array") return value.value.flatMap(serializedStateIds)
  if (value.type === "object") return value.value.flatMap(([, entry]) => serializedStateIds(entry))
  return []
}

function renderAttribute(name, value) {
  if (name === "style") {
    const style = serializeStyle(value)
    return style ? ` style="${escapeAttribute(style)}"` : ""
  }
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

function compactListState(value) {
  if (!Array.isArray(value) || !value.length) return undefined
  const fields = Object.keys(value[0])
  if (!fields.length || !value.every(item => Object.keys(item).length === fields.length && fields.every(field => Object.hasOwn(item, field)))) return undefined
  return [fields, value.map(item => fields.map(field => item[field]))]
}

function listSeed(items, fields) {
  if (!items.length || !items.every(item => Object.keys(item).length === fields.size && Object.keys(item).every(field => fields.has(field)))) return undefined
  const seed = {}
  for (const field of fields) {
    const types = new Set(items.map(item => item[field] === null ? "null" : typeof item[field]))
    if (types.size !== 1 || !["string", "number", "boolean", "null"].includes([...types][0])) return undefined
    seed[field] = [...types][0]
  }
  return seed
}
