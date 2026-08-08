export function usesRouteDependencyRuntime({ plan, navigable, hasBindings, hasLists }) {
  const hasDependencies = plan.effects.some(effect => effect.dependencies?.length)
  return !navigable && hasDependencies && !plan.effects.some(effect => effect.owner) && !hasBindings && !hasLists && !plan.events.some(event => event.native)
}

export function planRouteCapabilities(plans, { routes = new Map(), navigationRouteCount = 0 } = {}) {
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
    const route = routes.get(plan.route)
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

  const routeEntries = [...routes.values()]
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
