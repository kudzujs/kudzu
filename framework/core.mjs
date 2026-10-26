import { serializeStyle } from "./style.js"
import { selectCollection } from "./collection-selector.js"

const signalMarker = Symbol("kudzu.signal")
const internalStateMarker = Symbol("kudzu.internal-state")
const setterMarker = Symbol("kudzu.setter")
const reducerDispatchMarker = Symbol("kudzu.reducerDispatch")
const reducerStateMarker = Symbol("kudzu.reducerState")
const behaviorMarker = Symbol("kudzu.behavior")
const nativeBehaviorMarker = Symbol("kudzu.nativeBehavior")
const bindingMarker = Symbol("kudzu.binding")
const conditionalMarker = Symbol("kudzu.conditional")
const listMarker = Symbol("kudzu.list")
const listFieldMarker = Symbol("kudzu.listField")
const listExpressionMarker = Symbol("kudzu.listExpression")
const listItemMarker = Symbol("kudzu.listItem")
const listIndexMarker = Symbol("kudzu.listIndex")
const listConditionalMarker = Symbol("kudzu.listConditional")
const refMarker = Symbol("kudzu.ref")
const contextMarker = Symbol("kudzu.context")
const contextProviderMarker = Symbol("kudzu.contextProvider")
const routeScopeMarker = Symbol("kudzu.routeScope")
const noSelectValue = Symbol("kudzu.no-select-value")
export const Fragment = Symbol.for("kudzu.fragment")
const svgAttributeAliases = {
  clipRule: "clip-rule",
  colorInterpolation: "color-interpolation",
  colorInterpolationFilters: "color-interpolation-filters",
  dominantBaseline: "dominant-baseline",
  fillOpacity: "fill-opacity",
  fillRule: "fill-rule",
  floodColor: "flood-color",
  floodOpacity: "flood-opacity",
  shapeRendering: "shape-rendering",
  stopColor: "stop-color",
  stopOpacity: "stop-opacity",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  strokeOpacity: "stroke-opacity",
  strokeWidth: "stroke-width",
  textAnchor: "text-anchor",
  vectorEffect: "vector-effect"
}

let renderContext

export function useId() {
  if (!renderContext) throw new Error("useId() can only run while rendering a Kudzu component")
  return `k-${renderContext.listRoot || renderContext.listRowRoot ? nextRowRenderId("i") : nextRenderId("i")}`
}

export function useState(initialValue, name, initializer) {
  if (!renderContext) {
    throw new Error("useState() can only run while rendering a Kudzu component")
  }

  const id = renderContext.listRoot || renderContext.listRowRoot ? nextRowRenderId("s", initialValue, initializer) : nextRenderId("s")
  const signal = createSignal(id, initialValue)

  const setter = () => {
    throw new Error("State setters are compiled into ordered browser behaviors")
  }
  Object.defineProperty(setter, setterMarker, { value: id })
  if (!renderContext.listTemplate) renderContext.states[id] = { name: name ?? id, initialValue, ...(renderContext.scoped ? { lifetime: renderContext.renderScope } : {}) }
  return [signal, setter]
}

export function useReducer(reducer, initialValue, name) {
  if (typeof reducer !== "function") throw new Error("useReducer() requires a reducer function")
  const [state] = useState(initialValue, name)
  Object.defineProperty(state, reducerStateMarker, { value: true })
  const dispatch = () => {
    throw new Error("Reducer dispatches are compiled into browser handlers")
  }
  Object.defineProperty(dispatch, reducerDispatchMarker, { value: state.id })
  return [state, dispatch]
}

export function __kCreateSharedState(name, field, initialValue, actions, sourceKind = "Shared state") {
  return selector => {
    if (!renderContext) throw new Error(`${sourceKind} stores can only be read while rendering a Kudzu component`)
    let store = renderContext.sharedStates.get(name)
    if (!store) {
      if (renderContext.scoped && renderContext.renderScope !== "layout") throw new Error(`${sourceKind} store ${JSON.stringify(name)} must be initialized by the shared layout before route components use it`)
      if (renderContext.listRoot || renderContext.listRowRoot || renderContext.listTemplate) throw new Error(`${sourceKind} store ${JSON.stringify(name)} cannot be initialized inside a keyed row`)
      const [state] = useState(initialValue, `${name}.${field}`)
      store = { [field]: state }
      for (const action of actions) {
        const marker = () => {
          throw new Error(`${sourceKind} actions are compiled into browser handlers`)
        }
        Object.defineProperties(marker, {
          [signalMarker]: { value: true },
          id: { value: state.id },
          value: { get: () => state.value }
        })
        store[action] = marker
      }
      renderContext.sharedStates.set(name, store)
    }
    return selector(store)
  }
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

export function __kUseRouteMatch(pattern) {
  if (!renderContext) throw new Error("React Router useMatch can only run while rendering a Kudzu component")
  if (renderContext.renderScope === "layout") throw new Error("React Router useMatch is only supported in route scope")
  if (renderContext.runtimeParamNames?.length) throw new Error("React Router useMatch requires a build-known route and cannot run on a runtimeParams bracket page")
  const pathname = renderContext.applicationRoute
  let decodedPathname = pathname
  try {
    decodedPathname = pathname.split("/").map(segment => decodeURIComponent(segment).replaceAll("/", "%2F")).join("/")
  } catch {}
  const matches = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i").test(decodedPathname)
  return matches ? { params: {}, pathname: decodedPathname, pathnameBase: decodedPathname, pattern: { path: pattern, caseSensitive: false, end: true } } : null
}

export function useSearchParam(name) {
  if (!renderContext) throw new Error("useSearchParam() can only run while rendering a Kudzu component")
  if (renderContext?.renderScope === "layout") throw new Error("useSearchParam() is only supported in route scope")
  if (typeof name !== "string") throw new Error("useSearchParam() requires a string name")
  let signal = renderContext.searchParams.get(name)
  if (!signal) {
    const id = nextRenderId("p")
    signal = createSignal(id, null)
    renderContext.searchParams.set(name, signal)
    renderContext.searchParamEntries.push({ name, id })
  }
  renderContext.hasBehaviors = true
  renderContext.hasParams = true
  return signal
}

export function useSearchParamsWriter() {
  if (!renderContext) throw new Error("useSearchParamsWriter() can only run while rendering a Kudzu component")
  if (renderContext.renderScope === "layout") throw new Error("useSearchParamsWriter() is only supported in route scope")
  renderContext.searchParamsWritable = true
  renderContext.hasBehaviors = true
  renderContext.hasParams = true
  return [undefined, undefined]
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

function createInternalState(initialValue) {
  const id = nextRenderId("s")
  const signal = createSignal(id, initialValue)
  signal[internalStateMarker] = true
  renderContext.states[id] = { name: id, initialValue, internal: true, ...(renderContext.scoped ? { lifetime: renderContext.renderScope } : {}) }
  return signal
}

export function useEffect(callback, dependencies, module, handler, states, scope, source, cleanup, itemDependencies = [], dependencyExpressions = [], dependencyStates = [], dependencyEvaluators = []) {
  if (!renderContext) throw new Error("useEffect() can only run while rendering a Kudzu component")
  if (typeof callback !== "function" || !Array.isArray(dependencies) || !module || !handler) throw new Error("useEffect() must be compiled with a literal dependency array")
  if (itemDependencies.length && !renderContext.listDepth) throw new Error(`${source} useEffect() item-property dependencies are only supported in direct keyed row components`)
  const derivedSources = new Set(dependencyStates.map(([, dependency]) => dependency))
  const dependencyIds = [...new Set(dependencies.map(dependency => {
    if (!dependency?.[signalMarker] || !derivedSources.has(dependency) && !validEffectDependency(dependency.value) && !Array.isArray(dependency.value)) throw new Error(`${source} useEffect() dependencies must be primitive or array Kudzu state or runtime parameter identifiers`)
    return dependency.id
  }))]
  const dependencyStateIds = Object.fromEntries(dependencyStates.map(([name, dependency]) => {
    if (!dependency?.[signalMarker]) throw new Error(`${source} useEffect() derived dependency state ${JSON.stringify(name)} must be Kudzu state`)
    return [name, dependency.id]
  }))
  const evaluators = dependencyEvaluators.map(evaluator => {
    if (!evaluator || typeof evaluator.field !== "string" || ["__proto__", "constructor", "prototype"].includes(evaluator.field)) throw new Error(`${source} useEffect() calculation dependency requires a static safe field`)
    const descriptor = reactiveDescriptor(evaluator.module, evaluator.handler, evaluator.states, evaluator.scope)
    retainHandlerReference(descriptor.module, descriptor.handler)
    return { ...descriptor, field: evaluator.field }
  })
  let owner
  let list = false
  if (renderContext.listDepth) {
    const effects = renderContext.listRoot?.effects
    if (!effects) throw new Error(`${source} useEffect() inside keyed lists must belong to the direct row component`)
    const index = effects.length
    if (renderContext.listTemplate) {
      const existing = renderContext.listEffectOwners[index]
      owner = existing ?? nextRenderId("e")
      renderContext.listEffectOwners[index] = owner
      list = !existing
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
  if (!renderContext.listDepth || list) {
    renderContext.effects.push({ module, handler, states, scope, source, renderScope: renderContext.renderScope, ...(dependencyIds.length ? { dependencies: dependencyIds } : {}), ...(dependencyExpressions.length ? { dependencyExpressions, dependencyStates: dependencyStateIds } : {}), ...(evaluators.length ? { dependencyEvaluators: evaluators } : {}), ...(itemDependencies.length ? { itemDependencies, listState: renderContext.listRoot.state } : {}), ...(cleanup ? { cleanup: true } : {}), ...(owner ? { owner } : {}), ...(list ? { list: true } : {}) })
    retainHandlerReference(module, handler)
  }
  renderContext.hasBehaviors = true
  renderContext.hasEffects = true
}

function validEffectDependency(value) {
  return value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)
}

export function useRef(initialValue) {
  if (!renderContext) throw new Error("useRef() can only run while rendering a Kudzu component")
  if (initialValue !== null) throw new Error("Kudzu DOM refs must initialize with null")
  const row = Boolean(renderContext.listRoot || renderContext.listRowRoot)
  return { [refMarker]: true, id: row ? nextRowRenderId("r") : nextRenderId("r"), current: null, row }
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

export default { Fragment }

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

export function select(state, truthy, falsy) {
  if (!state?.[signalMarker]) throw new Error("A reactive selection must target framework state")
  return { [bindingMarker]: true, value: state.value ? truthy : falsy, state: state.id, truthy, falsy }
}

export function conditional(kind, value, truthy, falsy, module, handler, states, scope) {
  return { [conditionalMarker]: true, kind, value, truthy, falsy, ...reactiveDescriptor(module, handler, states, scope) }
}

export function stateConditional(kind, state, truthy, falsy) {
  if (!state?.[signalMarker]) throw new Error("A reactive conditional must target framework state")
  return { [conditionalMarker]: true, kind, value: state.value, truthy, falsy, state: state.id }
}

export function list(items, keyField, render, ownerField, selector = [], indexed = false, selectorStates = [], staticCollection = false) {
  const source = items?.[bindingMarker] ? bindingDescriptor(items) : undefined
  if (source) items = createInternalState(items.value)
  if (Array.isArray(items)) items = createInternalState(items)
  if (!items?.[signalMarker] || (!ownerField && !Array.isArray(items.value))) throw new Error("A keyed list must use local array state or a supported imported static array")
  const selectorStateMap = new Map(selectorStates)
  for (const [name, state] of selectorStateMap) if (!state?.[signalMarker]) throw new Error(`Rendered collection selector state ${JSON.stringify(name)} must be framework state`)
  let values = items.value
  if (ownerField) {
    const owner = renderContext?.listRoot ?? renderContext?.listRowRoot
    if (!owner) throw new Error("A nested keyed list must be rendered inside a keyed row")
    renderContext.listFields?.add(ownerField)
    values = renderContext.listTemplate ? [] : owner.item?.[ownerField]
    if (!Array.isArray(values) && values != null) throw new Error(`Nested keyed list property "${ownerField}" must remain an array`)
  }
  values = selectCollection(values, selector, name => selectorStateMap.get(name)?.value)
  const keys = new Set()
  for (const [index, item] of values.entries()) {
    const key = keyField === null ? index : item?.[keyField]
    if (!validListKey(key)) throw new Error(`Keyed list key "${keyField}" must be a string or finite number`)
    assertListItem(item, keyField === null)
    assertListValue(item, new Set())
    const token = `${typeof key}:${key}`
    if (keys.has(token)) throw new Error(`Duplicate keyed list key: ${String(key)}`)
    keys.add(token)
  }
  return { [listMarker]: true, items, values, keyField, render, ownerField, selector, indexed, static: staticCollection, selectorStates, source }
}

export function listField(read, field) {
  return { [listFieldMarker]: true, field, value: renderContext?.listTemplate ? undefined : read() }
}

export function listExpression(read, module, handler, states = []) {
  const stateMap = Object.fromEntries(states.map(([name, state]) => {
    if (!state?.[signalMarker] || !validEffectDependency(state.value)) throw new Error(`Derived keyed list item expression state ${JSON.stringify(name)} must be primitive Kudzu state`)
    return [name, state.id]
  }))
  const owner = renderContext?.listRoot ?? renderContext?.listRowRoot
  if (owner && states.length) owner.descriptor.expressionStates = [...new Set([...(owner.descriptor.expressionStates ?? []), ...Object.values(stateMap)])]
  const value = renderContext?.listTemplate ? undefined : read()
  if (value && typeof value.then === "function") throw new Error("Derived keyed list item expressions must return synchronous values")
  return { [listExpressionMarker]: true, module, handler, states: stateMap, value }
}

export function listItem() {
  return { [listItemMarker]: true }
}

export function listIndex() {
  return { [listIndexMarker]: true }
}

export function listConditional(kind, read, truthy, falsy, module, handler) {
  return { [listConditionalMarker]: true, kind, value: renderContext?.listTemplate ? undefined : read(), truthy, falsy, module, handler }
}

function validListKey(key) {
  return typeof key === "string" || typeof key === "number" && Number.isFinite(key)
}

function assertListItem(item, allowPrimitive = false) {
  if (allowPrimitive && (item === null || typeof item !== "object")) return
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

function retainHandlerReference(module, handler) {
  const reference = { module, handler }
  renderContext?.handlerReferences.set(JSON.stringify([module, handler]), reference)
}

function retainDescriptorHandlers(descriptor) {
  if (descriptor?.module && descriptor.handler) retainHandlerReference(descriptor.module, descriptor.handler)
  for (const nested of Object.values(descriptor?.scopeBindings ?? {})) retainDescriptorHandlers(nested)
}

export function bindingValue(value) {
  return value?.[signalMarker] || value?.[bindingMarker] ? value.value : value
}

function bindingDescriptor(value) {
  if (value.state) return { state: value.state, ...(Object.hasOwn(value, "truthy") ? { truthy: value.truthy, falsy: value.falsy } : {}) }
  return { module: value.module, handler: value.handler, states: value.states, scope: value.scope, scopeStates: value.scopeStates, scopeBindings: value.scopeBindings }
}

function serializeCapture(name, value, seen) {
  if (value?.[listItemMarker]) return { type: "list-item" }
  if (value?.[listIndexMarker]) return { type: "list-index" }
  if (value?.[refMarker]) return { type: "ref", id: value.id }
  if (value?.[signalMarker]) return { type: "state", id: value.id }
  if (typeof value === "function" && value[reducerDispatchMarker]) throw new Error(`Native capture "${name}" cannot contain a reducer dispatch`)
  if (typeof value === "function" && value[setterMarker]) return { type: "setter", id: value[setterMarker] }
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0) ? value : { type: "number", value: String(value) }
  }
  if (value === undefined) return { type: "undefined" }
  if (typeof value !== "object") throw new Error(`Native capture "${name}" is not serializable: ${typeof value}`)
  if (seen.has(value)) throw new Error(`Native capture "${name}" is not serializable: cycle`)
  const cached = renderContext?.captureCache.get(value)
  if (cached) return cached

  seen.add(value)
  try {
    if (Array.isArray(value)) {
      const serialized = { type: "array", value: Array.from(value, entry => serializeCapture(name, entry, seen)) }
      renderContext?.captureCache.set(value, serialized)
      return serialized
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
    const serialized = { type: "object", nullPrototype: prototype === null, value: entries }
    renderContext?.captureCache.set(value, serialized)
    return serialized
  } finally {
    seen.delete(value)
  }
}

export async function renderPage(component, metadata = {}, props = {}, layout) {
  renderContext = { scoped: Boolean(layout), renderScope: layout ? "layout" : "route", applicationRoute: metadata.applicationRoute, counters: { layout: { s: 0, r: 0, c: 0, l: 0, e: 0, p: 0, i: 0 }, route: { s: 0, r: 0, c: 0, l: 0, e: 0, p: 0, i: 0 } }, nextState: 0, nextRef: 0, nextCondition: 0, nextList: 0, nextEffect: 0, nextParam: 0, nextId: 0, conditionDepth: 0, listDepth: 0, listRoot: undefined, listRowRoot: undefined, listTemplate: false, listInitialMarkers: false, listConditionalBranch: false, listFields: undefined, listEffectOwners: [], listRowStates: [], listRowRefs: [], listRowIds: [], listRowConditions: [], listRowLists: [], effectOwners: [], contexts: [], captureCache: new WeakMap(), sharedStates: new Map(), states: {}, textStates: new Set(), conditionStates: new Set(), conditionOwnedStates: new Set(), events: [], effects: [], bindings: [], textBindings: [], conditions: [], lists: [], handlerReferences: new Map(), runtimeParamNames: metadata.runtimeParams, paramEntries: [], params: undefined, searchParams: new Map(), searchParamEntries: [], searchParamsWritable: false, hasBehaviors: false, hasNativeBehaviors: false, hasEffects: false, hasParams: false, hasBindings: false, hasLists: false, hasListStyles: false }

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
          ...(effect.dependencyExpressions ? { dependencyExpressions: effect.dependencyExpressions, dependencyStates: effect.dependencyStates } : {}),
          ...(effect.dependencyEvaluators ? { dependencyEvaluators: effect.dependencyEvaluators } : {}),
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
    const managedStyles = new Set(metadata.managedStyles ?? [])
    const styleAnchor = metadata.navigationAsset ? "<meta data-k-style-anchor>" : ""
    const styles = metadata.styles === false
      ? ""
      : (Array.isArray(metadata.styles) ? metadata.styles : [assetPath(metadata.base, "assets/style.css")]).map(href => `<link rel="stylesheet" href="${escapeAttribute(href)}"${managedStyles.has(href) ? " data-k-route-style" : ""}>`).join("")
    const runtime = renderContext.hasBehaviors
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.runtimeAsset ?? assetPath(metadata.base, "assets/kudzu.js"))}"></script>`
      : ""
    const nativeRuntime = renderContext.hasNativeBehaviors
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.nativeAsset ?? assetPath(metadata.base, "assets/kudzu-native.js"))}"></script>`
      : ""
    const paramRuntime = renderContext.hasParams
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.paramAsset)}"></script>`
      : ""
    const bindingRuntime = renderContext.hasBindings
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.bindingAsset ?? assetPath(metadata.base, "assets/kudzu-binding.js"))}"></script>`
      : ""
    const listRuntime = renderContext.hasLists
      ? `<script type="module"${capability} src="${escapeAttribute(metadata.listAsset ?? assetPath(metadata.base, "assets/kudzu-list.js"))}"></script>`
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
      ? Object.entries(renderContext.states).filter(([id]) => !renderContext.conditionOwnedStates.has(id) && (!renderContext.textStates.has(id) || renderContext.conditionStates.has(id)) && !seededListStates.has(id)).map(([id, entry]) => {
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
      html: `<!doctype html><html lang="${escapeAttribute(metadata.lang ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${head}${styleAnchor}${styles}${runtime}${paramRuntime}${bindingRuntime}${listRuntime}${nativeRuntime}${effectRuntime}${navigationRuntime}</head><body${state}${textBindings}${metadata.applicationId ? ` data-k-application="${escapeAttribute(metadata.applicationId)}" data-k-layout="${escapeAttribute(metadata.layoutId)}" data-k-route="${escapeAttribute(metadata.routeId)}"` : ""}>${body}</body></html>`,
      hasBehaviors: renderContext.hasBehaviors,
      hasEffects: renderContext.hasEffects,
      hasParams: renderContext.hasParams,
      hasBindings: renderContext.hasBindings,
      hasLists: renderContext.hasLists,
      hasListStyles: renderContext.hasListStyles,
      hasStateSeed: initialState.length > 0,
      handlerReferences: [...renderContext.handlerReferences.values()],
      plan: {
        version: 1,
        states: Object.entries(renderContext.states).map(([id, state], slot) => ({ slot, id, ...state })),
        params: renderContext.paramEntries,
        searchParams: renderContext.searchParamEntries,
        searchParamsWritable: renderContext.searchParamsWritable,
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
    return `<span data-k-text="${node.id}" data-k-value='${escapeJsonAttribute(node.value)}'>${escapeHtml(node.value ?? "")}</span>`
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
    const descriptor = node.state ? { state: node.state } : bindingDescriptor(node)
    const stateIds = reactiveStateIds(descriptor)
    if (!stateIds.size) return renderNode(node.value ? node.truthy() : node.falsy(), namespace, selectValue)
    if (namespace === "math") throw new Error("Reactive conditional DOM is not supported inside math")

    const id = renderContext.listRoot || renderContext.listRowRoot ? nextRowRenderId("c") : nextRenderId("c")
    const renderBranch = async branch => {
      const before = new Set(Object.keys(renderContext.states))
      const html = await renderNode(branch(), namespace, selectValue)
      const states = Object.keys(renderContext.states).filter(stateId => !before.has(stateId) && !renderContext.conditionOwnedStates.has(stateId))
      for (const stateId of states) renderContext.conditionOwnedStates.add(stateId)
      return { html, states: states.map(stateId => [stateId, renderContext.states[stateId].initialValue]) }
    }
    renderContext.conditionDepth++
    let truthy
    let falsy
    try {
      truthy = await renderBranch(node.truthy)
      falsy = await renderBranch(node.falsy)
    } finally {
      renderContext.conditionDepth--
    }
    const owned = truthy.states.length || falsy.states.length ? { true: truthy.states, false: falsy.states } : undefined
    const mount = Boolean(owned) || truthy.html.includes("data-k-") || falsy.html.includes("data-k-") || truthy.html.includes("<!--k-text:") || falsy.html.includes("<!--k-text:")
    const metadata = { id, kind: node.kind, initial: node.value, ...descriptor, ...(namespace === "svg" ? { svg: true } : {}), ...(owned ? { owned } : {}), ...(mount ? { mount: true } : {}) }
    for (const stateId of stateIds) renderContext.conditionStates.add(stateId)
    renderContext.conditions.push(metadata)
    retainDescriptorHandlers(metadata)
    renderContext.hasBehaviors = true
    renderContext.hasBindings = true
    const encoded = escapeJsonAttribute(metadata)
    const current = node.value ? truthy.html : node.kind === "and" ? await renderNode(node.value, namespace, selectValue) : falsy.html
    const branches = namespace === "svg"
      ? ` data-k-svg-true="${escapeAttribute(truthy.html)}" data-k-svg-false="${escapeAttribute(falsy.html)}"></template>`
      : `><template data-k-true>${truthy.html}</template><template data-k-false>${falsy.html}</template></template>`
    return `<template data-k-if='${encoded}'${branches}${current}<template data-k-if-end="${id}"></template>`
  }
  if (node?.[listMarker]) return renderList(node, namespace, selectValue)
  if (node?.[listFieldMarker]) {
    if (renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) renderContext.listFields?.add(node.field)
    const marker = renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch
      ? sharedInitialListMarker() ? " data-k-list-text" : ` data-k-list-text="${escapeAttribute(node.field)}"`
      : ""
    return `<template${marker}></template>${escapeHtml(node.value ?? "")}<template data-k-list-text-end></template>`
  }
  if (node?.[listExpressionMarker]) {
    const descriptor = { module: node.module, handler: node.handler, ...(Object.keys(node.states).length ? { states: node.states } : {}) }
    const retained = renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch
    if (retained) retainDescriptorHandlers(descriptor)
    const marker = retained ? ` data-k-list-expression='${escapeJsonAttribute(descriptor)}'` : ""
    return `<template${marker}></template>${escapeHtml(node.value ?? "")}<template data-k-list-expression-end></template>`
  }
  if (node?.[bindingMarker]) {
    const descriptor = bindingDescriptor(node)
    const reactive = reactiveStateIds(descriptor).size > 0
    if (!reactive) return renderNode(node.value, namespace, selectValue)
    renderContext.bindings.push({ target: "text", ...descriptor })
    retainDescriptorHandlers(descriptor)
    if (renderContext.conditionDepth || renderContext.listDepth) for (const stateId of reactiveStateIds(descriptor)) renderContext.conditionStates.add(stateId)
    renderContext.hasBehaviors = true
    renderContext.hasBindings = true
    const id = renderContext.textBindings.length
    renderContext.textBindings.push(descriptor)
    return `<!--k-text:${id}-->${escapeHtml(node.value ?? "")}<!--k-text-end-->`
  }
  if (node?.[listConditionalMarker]) {
    if (namespace === "svg") throw new Error("Keyed row conditions are not supported inside svg")
    const descriptor = { kind: node.kind, module: node.module, handler: node.handler }
    retainDescriptorHandlers(descriptor)
    const owner = renderContext.listRoot ?? renderContext.listRowRoot
    if (owner) owner.conditions = true
    const previousBranch = renderContext.listConditionalBranch
    if (owner && previousBranch) owner.nestedConditions = true
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
    const shared = renderContext.listInitialMarkers && !renderContext.listTemplate
    const condition = shared
      ? ` data-k-list-condition${owner.descriptor.conditionHandlers ? ` data-k-list-condition-handler="${escapeAttribute(node.handler)}"` : ""}`
      : ` data-k-list-condition='${escapeJsonAttribute(descriptor)}'`
    const branches = shared ? "" : `<template data-k-list-true>${truthy}</template><template data-k-list-false>${falsy}</template>`
    return `<template${condition}${initial}>${branches}</template>${current}<template data-k-list-condition-end></template>`
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
  const svg = tag === "svg" || namespace === "svg"
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
      if (value == null) continue
      if (!value?.[refMarker]) throw new Error("ref must be created by useRef(null)")
      if (renderContext.listDepth && !value.row) throw new Error("Refs in keyed lists must be declared by the keyed row component")
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
        const command = value.commands.length === 1 ? value.commands[0] : undefined
        attributes += command?.[0] === "set" && command[2] === true
          ? ` data-k-set-true-${event}="${escapeAttribute(command[1])}"`
          : ` data-k-on-${event}='${escapeJsonAttribute(value.commands)}'`
        renderContext.events.push({ event, commands: value.commands })
      } else if (value?.[nativeBehaviorMarker]) {
        const template = { module: value.module, handler: value.handler, states: value.states, scope: value.scope }
        const native = template
        attributes += ` data-k-native-${event}='${escapeJsonAttribute(native)}'`
        renderContext.events.push({ event, native })
        retainDescriptorHandlers(native)
        if (renderContext.listDepth && Object.values(template.scope).some(entry => entry?.type === "list-item" || entry?.type === "list-index")) listEvents.push([event, template])
        renderContext.hasNativeBehaviors = true
      } else {
        throw new Error(`${rawName} must reference a compilable event handler`)
      }
      renderContext.hasBehaviors = true
      continue
    }

    const name = rawName === "className" ? "class" : rawName === "htmlFor" ? "for" : rawName === "defaultValue" && tag === "input" ? "value" : svg ? svgAttributeAliases[rawName] ?? rawName : rawName
    const propertyTarget = name === "class" || name === "disabled" || name === "value" || name === "checked" || name === "style"
    if (value?.[listFieldMarker]) {
      attributes += renderAttribute(name, value.value)
      listAttributes.push([name, value.field])
      if (name === "style") renderContext.hasListStyles = true
      continue
    }
      if (value?.[listExpressionMarker]) {
      attributes += renderAttribute(name, value.value)
        listExpressionAttributes.push([name, value.module, value.handler, ...(Object.keys(value.states).length ? [value.states] : [])])
        if (renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) retainHandlerReference(value.module, value.handler)
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
      retainDescriptorHandlers(descriptor)
      if (renderContext.conditionDepth || renderContext.listDepth) for (const stateId of reactiveStateIds(descriptor)) renderContext.conditionStates.add(stateId)
      renderContext.hasBehaviors = true
      renderContext.hasBindings = true
      continue
    }

    if (tag === "select" && name === "value") continue
    attributes += renderAttribute(name, value)
  }

  if (attributeBindings.length) attributes += ` data-k-bind-attrs='${escapeJsonAttribute(attributeBindings)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listAttributes.length) attributes += sharedInitialListMarker() ? " data-k-list-attrs" : ` data-k-list-attrs='${escapeJsonAttribute(listAttributes)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listExpressionAttributes.length) attributes += ` data-k-list-expression-attrs='${escapeJsonAttribute(listExpressionAttributes)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && listEvents.length) attributes += ` data-k-list-events='${escapeJsonAttribute(listEvents)}'`
  if ((renderContext.listTemplate || renderContext.listInitialMarkers || renderContext.listConditionalBranch) && directListText) {
    renderContext.listFields?.add(directListText.field)
    attributes += sharedInitialListMarker() ? " data-k-list-text" : ` data-k-list-text="${escapeAttribute(directListText.field)}"`
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

function sharedInitialListMarker() {
  const owner = renderContext.listRoot ?? renderContext.listRowRoot
  return renderContext.listInitialMarkers && !renderContext.listTemplate && !renderContext.listConditionalBranch && owner?.descriptor.ownerField
}

async function renderList(node, namespace, selectValue) {
  if (namespace === "math") throw new Error("Reactive keyed lists are not supported inside math")
  if (namespace === "svg" && node.ownerField) throw new Error("Nested reactive keyed lists are not supported inside svg")
  const ownerRoot = node.ownerField ? renderContext.listRoot ?? renderContext.listRowRoot : undefined
  const ownerTemplate = Boolean(node.ownerField && renderContext.listTemplate)
  const rowList = node.ownerField ? nextRowList() : undefined
  const id = rowList?.id ?? nextRenderId("l")
  const descriptor = { id, state: node.items.id, key: node.keyField, keys: node.values.map((item, index) => node.keyField === null ? index : item[node.keyField]), ...(namespace === "svg" ? { svg: true } : {}), ...(node.static || node.items[internalStateMarker] && !node.source ? { static: true } : {}), ...(node.source ? { source: node.source } : {}), ...(node.ownerField ? { ownerField: node.ownerField } : {}), ...(node.selector.length ? { selector: node.selector } : {}), ...(node.selectorStates.length ? { selectorStates: Object.fromEntries(node.selectorStates.map(([name, state]) => [name, state.id])) } : {}), ...(node.indexed ? { indexed: true } : {}), ...(!node.selector.length && node.keyField !== null && node.items[reducerStateMarker] ? { reducer: true } : {}) }
  if (node.source) renderContext.hasBindings = true
  if (ownerTemplate) {
    ownerRoot.descriptor.children ??= []
    ownerRoot.descriptor.children.push({ id, field: node.ownerField, key: node.keyField, ...(node.selector.length ? { selector: node.selector } : {}) })
    Object.assign(ownerRoot.descriptor, { mount: true, nested: true })
  }
  renderContext.listDepth++
  const previousListRoot = renderContext.listRoot
  const previousListRowRoot = renderContext.listRowRoot
  const previousListTemplate = renderContext.listTemplate
  const previousListInitialMarkers = renderContext.listInitialMarkers
  const previousListFields = renderContext.listFields
  const previousListEffectOwners = renderContext.listEffectOwners
  const previousListRowStates = renderContext.listRowStates
  const previousListRowRefs = renderContext.listRowRefs
  const previousListRowIds = renderContext.listRowIds
  const previousListRowConditions = renderContext.listRowConditions
  const previousListRowLists = renderContext.listRowLists
  try {
    renderContext.listTemplate = true
    renderContext.listEffectOwners = rowList?.effectOwners ?? []
    renderContext.listRowStates = rowList?.rowStates ?? []
    renderContext.listRowRefs = rowList?.rowRefs ?? []
    renderContext.listRowIds = rowList?.rowIds ?? []
    renderContext.listRowConditions = rowList?.rowConditions ?? []
    renderContext.listRowLists = rowList?.rowLists ?? []
    renderContext.listFields = new Set([node.keyField])
    const templateRoot = { id, state: node.items.id, descriptor, template: true, effects: [], item: {}, path: ownerRoot?.path ?? [], rowIndexes: { s: 0, r: 0, i: 0, c: 0, l: 0 } }
    renderContext.listRoot = templateRoot
    renderContext.listRowRoot = templateRoot
    const template = await renderNode(node.render({}, 0), namespace, selectValue)
    if (template.includes("data-k-native-") || template.includes("data-k-effects=") || template.includes("data-k-list=")) descriptor.mount = true
    if (template.includes("data-k-list=")) descriptor.nested = true
    if (template.includes("data-k-effects=")) descriptor.effects = true
    if (templateRoot.conditions) descriptor.conditions = true
    if (templateRoot.nestedConditions) descriptor.conditionHandlers = true
    if (template.includes("data-k-list-text-end")) descriptor.textRanges = true
    if (template.includes("data-k-list-attrs")) descriptor.attributes = true
    if (template.includes("data-k-list-events")) descriptor.events = true
    if (template.includes("data-k-list-expression=")) descriptor.expressions = true
    if (template.includes("data-k-list-expression-attrs")) descriptor.expressionAttributes = true
    if (renderContext.listRowStates.length) {
      descriptor.rowStates = renderContext.listRowStates
      if (renderContext.listRowConditions.length) descriptor.rowConditions = renderContext.listRowConditions.map(({ id }) => id)
      descriptor.mount = true
    }
    if (renderContext.listRowRefs.length) {
      descriptor.rowRefs = renderContext.listRowRefs.map(({ id }) => id)
      descriptor.mount = true
    }
    if (renderContext.listRowIds.length) descriptor.rowIds = renderContext.listRowIds.map(({ id }) => id)
    if (descriptor.rowStates && !descriptor.effects && !descriptor.nested && !template.includes("data-k-text")) descriptor.fastRelease = true
    const valueSeed = node.ownerField || node.keyField === null ? undefined : listSeed(node.values, renderContext.listFields)
    const seed = node.selector.length ? undefined : valueSeed
    if (seed) descriptor.seed = seed
    else if (valueSeed) descriptor.valueSeed = valueSeed
    let current = ""
    renderContext.listTemplate = false
    renderContext.listInitialMarkers = Boolean(descriptor.conditions)
    for (const [index, item] of node.values.entries()) {
      const key = node.keyField === null ? index : item[node.keyField]
      renderContext.listRoot = { id, state: node.items.id, descriptor, key, template: false, effects: [], item, path: [...(ownerRoot?.path ?? []), `${id}=${typeof key}:${key}`], rowIndexes: { s: 0, r: 0, i: 0, c: 0, l: 0 } }
      renderContext.listRowRoot = renderContext.listRoot
      current += await renderNode(node.render(item, index), namespace, selectValue)
    }
    if (!node.ownerField || ownerTemplate && !rowList.planned) {
      renderContext.lists.push(descriptor)
      retainDescriptorHandlers(descriptor.source)
      if (rowList) rowList.planned = true
    }
    renderContext.hasBehaviors = true
    renderContext.hasLists = true
    const prototype = node.ownerField && !ownerTemplate ? "" : template
    const svgTemplate = namespace === "svg" ? ` data-k-svg-template="${escapeAttribute(prototype)}"` : ""
    return `<template data-k-list='${escapeJsonAttribute(descriptor)}'${svgTemplate}>${namespace === "svg" ? "" : prototype}</template>${current}<template data-k-list-end="${id}"></template>`
  } finally {
    renderContext.listRoot = previousListRoot
    renderContext.listRowRoot = previousListRowRoot
    renderContext.listTemplate = previousListTemplate
    renderContext.listInitialMarkers = previousListInitialMarkers
    renderContext.listFields = previousListFields
    renderContext.listEffectOwners = previousListEffectOwners
    renderContext.listRowStates = previousListRowStates
    renderContext.listRowRefs = previousListRowRefs
    renderContext.listRowIds = previousListRowIds
    renderContext.listRowConditions = previousListRowConditions
    renderContext.listRowLists = previousListRowLists
    renderContext.listDepth--
  }
}

function nextRowList() {
  const root = renderContext.listRoot ?? renderContext.listRowRoot
  const index = root.rowIndexes.l++
  if (renderContext.listTemplate) {
    const entry = renderContext.listRowLists[index] ?? { id: nextRenderId("l"), rowLists: [], rowStates: [], rowRefs: [], rowIds: [], rowConditions: [], effectOwners: [], planned: false }
    renderContext.listRowLists[index] = entry
    return entry
  }
  const entry = renderContext.listRowLists[index]
  if (!entry) throw new Error("Nested keyed lists must have the same order for every parent item")
  return entry
}

function nextRenderId(kind) {
  if (renderContext.scoped) return `${renderContext.renderScope === "layout" ? "l" : "r"}${kind}${renderContext.counters[renderContext.renderScope][kind]++}`
  const counters = { s: "nextState", r: "nextRef", c: "nextCondition", l: "nextList", e: "nextEffect", p: "nextParam", i: "nextId" }
  return `${kind}${renderContext[counters[kind]]++}`
}

function nextRowRenderId(kind, initialValue, initializer) {
  const root = renderContext.listRoot ?? renderContext.listRowRoot
  const index = root.rowIndexes[kind]++
  const entries = kind === "s" ? renderContext.listRowStates : kind === "r" ? renderContext.listRowRefs : kind === "i" ? renderContext.listRowIds : renderContext.listRowConditions
  if (renderContext.listTemplate) {
    const entry = entries[index]
    if (entry) return entry.id
    const id = `${nextRenderId(kind)}:$k`
    entries[index] = kind === "s" ? { id, initialValue, ...(initializer ? { initializer } : {}) } : { id }
    return id
  }
  const entry = entries[index]
  if (!entry) throw new Error(`Keyed row ${kind === "s" ? "state hooks" : kind === "r" ? "ref hooks" : kind === "i" ? "ID hooks" : "conditionals"} must have the same order for every item`)
  return rowRenderId(entry.id, root.descriptor.ownerField ? root.path : [`${typeof root.key}:${root.key}`])
}

function rowRenderId(id, path) {
  return id.replace("$k", encodeURIComponent(path.join("/")))
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
  if (!value[0] || typeof value[0] !== "object" || Array.isArray(value[0]) || Object.getPrototypeOf(value[0]) !== Object.prototype) return undefined
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
