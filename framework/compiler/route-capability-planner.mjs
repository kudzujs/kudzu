export function usesRouteDependencyRuntime({ plan, navigable, hasBindings, hasLists }) {
  assertRouteIR(plan)
  const hasDependencies = plan.effects.some(effect => effect.dependencies?.length)
  return !navigable && hasDependencies && !plan.effects.some(effect => effect.owner) && !hasBindings && !hasLists && !plan.events.some(event => event.native)
}

export function planRouteCapabilities(records, { navigationRouteCount = 0 } = {}) {
  for (const record of records) assertRouteBuildRecord(record)
  const plans = records.map(record => record.plan)
  for (const plan of plans) assertRouteIR(plan)
  const commandEvents = new Set()
  const nativeEvents = new Set()
  const bindings = { count: 0, text: false, svgConditions: false }
  const lists = {
    count: 0,
    styleCount: 0,
    conditions: false,
    svg: false,
    deepConditions: false,
    textRanges: false,
    attributes: false,
    events: false,
    expressions: false,
    expressionAttributes: false,
    seeds: false,
    effects: false,
    rowHooks: false,
    rowRefs: false,
    complexRowState: false,
    nested: false,
    selectors: false,
    calculated: false,
    static: false,
    indexes: false,
    stableFastPaths: false,
    generalRowHooks: false,
    asyncParts: false,
    mounts: false
  }
  const effects = { any: false, derivedDependencies: false, itemDependencies: false, captures: false, navigable: false, navigableOwners: false }

  for (let index = 0; index < plans.length; index++) {
    const plan = plans[index]
    const route = records[index].capabilities
    for (const event of plan.events) {
      if (event.commands) commandEvents.add(event.event)
      if (event.native) nativeEvents.add(event.event)
    }
    bindings.text ||= plan.bindings.some(binding => binding.target === "text")
    bindings.svgConditions ||= plan.conditions.some(condition => condition.svg)
    effects.any ||= plan.effects.length > 0
    effects.derivedDependencies ||= plan.effects.some(effect => effect.dependencyExpressions?.length)
    effects.itemDependencies ||= plan.effects.some(effect => effect.itemDependencies?.length)
    effects.captures ||= plan.effects.some(effect => Object.keys(effect.scope).length)
    effects.navigable ||= Boolean(route?.navigable && plan.effects.length)
    effects.navigableOwners ||= Boolean(route?.navigable && plan.effects.some(effect => effect.owner))
    for (const list of plan.lists) {
      lists.conditions ||= Boolean(list.conditions)
      lists.svg ||= Boolean(list.svg)
      lists.deepConditions ||= Boolean(list.conditionHandlers)
      lists.textRanges ||= Boolean(list.textRanges)
      lists.attributes ||= Boolean(list.attributes)
      lists.events ||= Boolean(list.events)
      lists.expressions ||= Boolean(list.expressions)
      lists.expressionAttributes ||= Boolean(list.expressionAttributes)
      lists.seeds ||= Boolean(list.seed || list.valueSeed)
      lists.effects ||= Boolean(list.effects)
      lists.rowHooks ||= Boolean(list.rowStates?.length || list.rowRefs?.length)
      lists.rowRefs ||= Boolean(list.rowRefs?.length)
      lists.complexRowState ||= Boolean(list.rowStates?.some(state => state.initialValue !== null && typeof state.initialValue === "object"))
      lists.nested ||= Boolean(list.ownerField)
      lists.selectors ||= Boolean(list.selector)
      lists.calculated ||= Boolean(list.source)
      lists.static ||= Boolean(list.static)
      lists.indexes ||= Boolean(list.indexed)
      lists.stableFastPaths ||= !list.children && !list.ownerField && list.key !== null && !list.indexed && !list.reducer && !list.selector
      lists.generalRowHooks ||= Boolean(list.ownerField && (list.rowStates?.length || list.rowRefs?.length))
      lists.mounts ||= Boolean(list.mount)
    }
  }

  const routeEntries = records.map(record => record.capabilities)
  const routeCounts = {
    behaviors: routeEntries.filter(route => route.hasBehaviors).length,
    regularBehaviors: routeEntries.filter(route => route.hasBehaviors && !route.usesDependencyRuntime).length,
    regularStateSeeds: routeEntries.filter(route => route.hasStateSeed && !route.usesDependencyRuntime).length,
    dependencyStateSeeds: routeEntries.filter(route => route.hasStateSeed && route.usesDependencyRuntime).length
  }
  bindings.count = routeEntries.filter(route => route.hasBindings).length
  lists.count = routeEntries.filter(route => route.hasLists).length
  lists.styleCount = routeEntries.filter(route => route.hasListStyles).length
  lists.generalRowHooks ||= lists.rowRefs || lists.complexRowState
  lists.asyncParts = lists.expressions || lists.expressionAttributes || lists.conditions
  lists.mounts ||= lists.conditions || lists.nested

  return {
    version: 1,
    routes: routeCounts,
    events: { command: [...commandEvents].sort(), native: [...nativeEvents].sort(), hasNativeHandlers: nativeEvents.size > 0 },
    bindings,
    lists,
    effects,
    captures: { nestedState: hasNestedCaptureState(plans), setter: hasCaptureType(plans, "setter") },
    runtime: {
      shared: Boolean(bindings.count || lists.count || nativeEvents.size || navigationRouteCount),
      dependency: routeEntries.some(route => route.usesDependencyRuntime)
    }
  }
}

function assertRouteIR(plan) {
  if (plan?.version !== 1) throw new Error(`Unsupported RouteIR version: ${JSON.stringify(plan?.version)}`)
  if (!["states", "params", "searchParams", "events", "effects", "bindings", "conditions", "lists"].every(name => Array.isArray(plan[name])) || typeof plan.searchParamsWritable !== "boolean") throw new Error("Invalid RouteIR v1 structure")
  if (plan.states.some((state, slot) => state?.slot !== slot || typeof state.id !== "string" || typeof state.name !== "string" || !Object.hasOwn(state, "initialValue") || state.lifetime !== undefined && !["layout", "route"].includes(state.lifetime) || state.internal !== undefined && state.internal !== true)) throw new Error("Invalid RouteIR v1 state")
  if ([...plan.params, ...plan.searchParams].some(param => !isRecord(param) || typeof param.name !== "string" || typeof param.id !== "string")) throw new Error("Invalid RouteIR v1 parameter")
  if (plan.events.some(event => !isRecord(event) || typeof event.event !== "string" || event.commands !== undefined && (!Array.isArray(event.commands) || event.commands.some(command => !Array.isArray(command))) || event.native !== undefined && (!isRecord(event.native) || typeof event.native.module !== "string" || typeof event.native.handler !== "string" || !isRecord(event.native.states) || !isRecord(event.native.scope)))) throw new Error("Invalid RouteIR v1 event")
  if (plan.effects.some(effect => !isRecord(effect) || typeof effect.module !== "string" || typeof effect.handler !== "string" || !isRecord(effect.states) || !isRecord(effect.scope))) throw new Error("Invalid RouteIR v1 effect")
  if (plan.bindings.some(binding => !isRecord(binding) || typeof binding.target !== "string") || plan.conditions.some(condition => !isRecord(condition) || condition.svg !== undefined && typeof condition.svg !== "boolean") || plan.lists.some(list => !isRouteList(list))) throw new Error("Invalid RouteIR v1 binding, condition, or list")
}

export function assertCapabilityIR(capabilityIR) {
  if (capabilityIR?.version !== 1) throw new Error(`Unsupported CapabilityIR version: ${JSON.stringify(capabilityIR?.version)}`)
  const sections = ["routes", "events", "bindings", "lists", "effects", "captures", "runtime"]
  if (!sections.every(name => isRecord(capabilityIR[name]))) throw new Error("Invalid CapabilityIR v1 structure")
  if (!["behaviors", "regularBehaviors", "regularStateSeeds", "dependencyStateSeeds"].every(name => isCount(capabilityIR.routes[name]))) throw new Error("Invalid CapabilityIR v1 route counts")
  if (!["command", "native"].every(name => Array.isArray(capabilityIR.events[name]) && capabilityIR.events[name].every(event => typeof event === "string")) || typeof capabilityIR.events.hasNativeHandlers !== "boolean") throw new Error("Invalid CapabilityIR v1 events")
  if (!isCount(capabilityIR.bindings.count) || !["text", "svgConditions"].every(name => typeof capabilityIR.bindings[name] === "boolean")) throw new Error("Invalid CapabilityIR v1 bindings")
  const listFlags = ["conditions", "svg", "deepConditions", "textRanges", "attributes", "events", "expressions", "expressionAttributes", "seeds", "effects", "rowHooks", "rowRefs", "complexRowState", "nested", "selectors", "calculated", "static", "indexes", "stableFastPaths", "generalRowHooks", "asyncParts", "mounts"]
  if (!isCount(capabilityIR.lists.count) || !isCount(capabilityIR.lists.styleCount) || !listFlags.every(name => typeof capabilityIR.lists[name] === "boolean")) throw new Error("Invalid CapabilityIR v1 lists")
  if (!["any", "derivedDependencies", "itemDependencies", "captures", "navigable", "navigableOwners"].every(name => typeof capabilityIR.effects[name] === "boolean") || !["nestedState", "setter"].every(name => typeof capabilityIR.captures[name] === "boolean") || !["shared", "dependency"].every(name => typeof capabilityIR.runtime[name] === "boolean")) throw new Error("Invalid CapabilityIR v1 effect, capture, or runtime flags")
}

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value)
const isCount = value => Number.isSafeInteger(value) && value >= 0
const isRouteList = list => isRecord(list)
  && typeof list.id === "string"
  && typeof list.state === "string"
  && (typeof list.key === "string" || list.key === null)
  && Array.isArray(list.keys)
  && ["svg", "static", "indexed", "reducer", "mount", "nested", "effects", "conditions", "conditionHandlers", "textRanges", "attributes", "events", "expressions", "expressionAttributes", "fastRelease"].every(name => list[name] === undefined || list[name] === true)
  && ["selector", "children", "expressionStates", "rowStates", "rowConditions", "rowRefs"].every(name => list[name] === undefined || Array.isArray(list[name]))

function hasCaptureType(value, type) {
  if (!value || typeof value !== "object") return false
  if (value.type === type) return true
  return (Array.isArray(value) ? value : Object.values(value)).some(entry => hasCaptureType(entry, type))
}

function hasNestedCaptureState(value, insideCapture = false) {
  if (!value || typeof value !== "object") return false
  if (value.type === "state") return insideCapture
  if (value.type === "array") return value.value.some(entry => hasNestedCaptureState(entry, true))
  if (value.type === "object") return value.value.some(([, entry]) => hasNestedCaptureState(entry, true))
  return (Array.isArray(value) ? value : Object.values(value)).some(entry => hasNestedCaptureState(entry, false))
}
import { assertRouteBuildRecord } from "./route-build-record.mjs"
