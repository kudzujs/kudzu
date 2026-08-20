import { assertCapabilityIR } from "./route-capability-planner.mjs"

export function generateCoreRuntime(source, capabilityIR) {
  assertCapabilityIR(capabilityIR)
  const { effects, events, routes } = capabilityIR
  let runtime = specializeRuntime(source, events.command, routes.regularStateSeeds > 0)
  if (!effects.itemDependencies && capabilityIR.runtime.shared) runtime = replaceRequired(runtime, /\/\* list-item-hooks \*\/[\s\S]*?\/\* list-item-hooks-end \*\/\n/, "", "list item hooks", "shared-runtime.js")
  if (effects.navigable) runtime = replaceRequired(runtime, "export function registerCommitter(commit) {\n  committers.push(commit)\n}", "export function registerCommitter(commit) {\n  committers.push(commit)\n  return () => {\n    const index = committers.indexOf(commit)\n    if (index !== -1) committers.splice(index, 1)\n  }\n}", "navigable committer", "shared-runtime.js")
  if (effects.navigableOwners) runtime = replaceSequenceRequired(runtime, [
    ["export function registerMountHook(mount, capability) {\n  mountHooks.push({ mount, capability })\n}", "export function registerMountHook(mount, capability) {\n  const entry = { mount, capability }\n  mountHooks.push(entry)\n  return () => {\n    const index = mountHooks.indexOf(entry)\n    if (index !== -1) mountHooks.splice(index, 1)\n  }\n}", "navigable mount hook"],
    ["export function registerUnmountHook(unmount, capability) {\n  unmountHooks.push({ unmount, capability })\n}", "export function registerUnmountHook(unmount, capability) {\n  const entry = { unmount, capability }\n  unmountHooks.push(entry)\n  return () => {\n    const index = unmountHooks.indexOf(entry)\n    if (index !== -1) unmountHooks.splice(index, 1)\n  }\n}", "navigable unmount hook"]
  ], "shared-runtime.js")
  return runtime
}

export function generateEffectRuntime(source, capabilityIR) {
  assertCapabilityIR(capabilityIR)
  const { captures, effects } = capabilityIR
  return {
    source: effects.captures ? replaceRequired(source, '"./serialization.js"', '"./kudzu-serialization.js"', "serialization import", "effect-runtime.js") : replaceRequired(source, /^import[^\n]+\n/, "", "serialization import", "effect-runtime.js"),
    define: {
      "globalThis.__KUDZU_CAPTURE_SETTER__": String(captures.setter),
      "globalThis.__KUDZU_EFFECT_CAPTURES__": String(effects.captures)
    }
  }
}

export function generateBindingRuntime(source, capabilityIR, navigable) {
  assertCapabilityIR(capabilityIR)
  let runtime = replaceRequired(source, '"./shared-runtime.js"', '"./kudzu.js"', "shared runtime import", "binding-runtime.js")
  runtime = replaceRequired(runtime, '"./serialization.js"', '"./kudzu-serialization.js"', "serialization import", "binding-runtime.js")
  runtime = replaceRequired(runtime, '"./style.js"', '"./kudzu-style.js"', "style import", "binding-runtime.js")
  if (navigable) runtime = specializeNavigationTextDescriptors(runtime)
  return {
    source: runtime,
    define: {
      "globalThis.__KUDZU_TEXT_BINDINGS__": String(capabilityIR.bindings.text),
      "globalThis.__KUDZU_SVG_CONDITIONS__": String(capabilityIR.bindings.svgConditions),
      "globalThis.__KUDZU_CAPTURE_STATE__": String(capabilityIR.captures.nestedState)
    }
  }
}

export function generateNativeRuntime(source, capabilityIR) {
  assertCapabilityIR(capabilityIR)
  return {
    source: specializeEvents(replaceRequired(replaceRequired(source, '"./shared-runtime.js"', '"./kudzu.js"', "shared runtime import", "native-runtime.js"), '"./serialization.js"', '"./kudzu-serialization.js"', "serialization import", "native-runtime.js"), capabilityIR.events.native),
    define: { "globalThis.__KUDZU_CAPTURE_SETTER__": String(capabilityIR.captures.setter) }
  }
}

export function generateNavigationRuntime(source, group) {
  let runtime = replaceSequenceRequired(source, [
    ["__KUDZU_NAVIGATION_ROUTES__", JSON.stringify(group.records).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029"), "route records"],
    ["__KUDZU_APPLICATION_ID__", JSON.stringify(group.applicationId), "application ID"],
    ["__KUDZU_LAYOUT_ID__", JSON.stringify(group.layoutId), "layout ID"],
    ['"./shared-runtime.js"', '"./kudzu.js"', "shared runtime import"]
  ], "navigation-runtime.js")
  runtime = specializeNavigationPatterns(runtime, group.records.some(record => record.segments))
  return specializeNavigationEffects(runtime, group.hasEffects || group.hasParams)
}

export function specializeRuntime(source, events, hasStateSeed) {
  const specialized = specializeEvents(source, events)
  if (hasStateSeed) return specialized
  return replaceSequenceRequired(specialized, [
    ["  const initialState = document.body.dataset.kState\n", "", "initial state read"],
    [/^  if \(initialState\).*\n/m, "", "initial state parse"]
  ], "runtime source")
}

function specializeEvents(source, events) {
  return replaceRequired(source, /const eventNames = \[[^\n]+\]/, `const eventNames = ${JSON.stringify(events)}`, "event names", "runtime source")
}

function replaceRequired(source, search, replacement, label, file) {
  const output = source.replace(search, replacement)
  if (output === source) throw new Error(`${label} specialization did not match ${file}`)
  return output
}

function replaceSequenceRequired(source, replacements, file) {
  return replacements.reduce((output, [search, replacement, label]) => replaceRequired(output, search, replacement, label, file), source)
}

function specializeNavigationEffects(source, enabled) {
  if (enabled) return source
  return replaceSequenceRequired(source, [
    ["const noDispose = async () => {}\nlet routeDispose = noDispose\nlet layoutDispose = noDispose\nconst ready = mountInitial()\n", "", "initial effect lifecycle"],
    [`addEventListener("pagehide", event => {
  if (event.persisted) return
  ++revision
  request?.abort()
  void (async () => {
    await routeDispose()
    await layoutDispose()
  })()
})
`, "", "pagehide effect lifecycle"],
    [`
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
`, "", "initial effect mount"],
    ["  await ready\n", "", "initial effect readiness"],
    ["    const { incoming, parsed, capabilities } = documentResult\n", "    const { incoming, parsed } = documentResult\n", "navigation capability result"],
    ["    await routeDispose()\n    if (current !== revision) {\n      styleUpdate.rollback()\n      return\n    }\n", "", "route effect disposal"],
    ["    commit(incoming, parsed.nodes, capabilities.params, url.pathname, url.search)\n", "    commit(incoming, parsed.nodes)\n", "navigation capability commit"],
    ["    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose\n", "", "route effect mount"],
    ["  return { incoming, parsed, capabilities: await loadCapabilities(parsed), record }\n", "  await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))\n  return { incoming, parsed, record }\n", "navigation capability load"],
    [`
async function loadCapabilities(parsed) {
  const modules = await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))
  const params = modules.filter(module => typeof module.initializeParams === "function")
  const effects = modules.filter(module => typeof module.mountRouteEffects === "function")
  if (params.length > 1 || effects.length > 1) throw new Error("Navigation document has duplicate route capabilities")
  return { params: params[0]?.initializeParams, effects: effects[0] }
}
`, "", "capability loader"]
  ], "navigation-runtime.js")
}

function specializeNavigationPatterns(source, enabled) {
  if (enabled) return source
  return replaceRequired(source, /function matchRoute\(pathname\) \{[\s\S]+?\n\}\n\nfunction fallback/, `function matchRoute(pathname) {
  return routes.find(record => record.path === pathname)
}

function fallback`, "exact route matcher", "navigation-runtime.js")
}

function specializeNavigationTextDescriptors(source) {
  return replaceSequenceRequired(source, [
    ["const textDescriptors = globalThis.__KUDZU_TEXT_BINDINGS__ && typeof document !== \"undefined\" ? JSON.parse(document.body.dataset.kTextBindings ?? \"[]\") : []", "const textDescriptors = () => globalThis.__KUDZU_TEXT_BINDINGS__ ? JSON.parse(document.body.dataset.kTextBindings ?? \"[]\") : []", "text descriptor reader"],
    ["const descriptor = textDescriptors[Number(node.data.slice(\"k-text:\".length))]", "const descriptor = textDescriptors()[Number(node.data.slice(\"k-text:\".length))]", "text descriptor lookup"]
  ], "binding-runtime.js")
}
