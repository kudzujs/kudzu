import { join } from "node:path"

export function createEffectCodegen({ assetPath, inlineJson, relativeModulePath }) {
function printEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base, paramPath, runtimeName) {
  const hasCleanup = effects.some(effect => effect.cleanup)
  const hasDependencies = effects.some(effect => effect.dependencies?.length || effect.itemDependencies?.length)
  const hasOwners = effects.some(effect => effect.owner)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const hasDependencyEvaluators = effects.some(effect => effect.dependencyEvaluators?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    hasCleanup || hasDependencies || hasOwners
      ? `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, runtimeName)))}\nconst { browserState, commitDom } = __kRuntime`
      : `import { browserState, commitDom } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, runtimeName)))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...(paramPath ? [`import ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, paramPath)))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  if (hasOwners) return printOwnedEffectEntry(imports, effects, entries)
  if (effects.length === 1 && effects[0].dependencies?.length === 1 && !hasDependencyExpressions) return printSingleDependencyEffect(imports, effects[0], hasCleanup)
  const disposal = hasCleanup ? `
let disposed = false
const dispose = root => {
  if (root !== document || disposed) return
  disposed = true
  active = false
  pending.clear()
  for (const record of records) invokeCleanup(record)
}

if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose, "effects")
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})` : ""
  if (hasDependencies) return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
const records = effects.map((effect, index) => ({ effect, index, values: undefined, cleanup: undefined, token: undefined }))
const dependencies = new Map()
const pending = new Set()
let scheduled = false
let flushing = false
let active = true
for (const record of records) {
  for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id) ?? new Set()
    subscribers.add(record)
    dependencies.set(id, subscribers)
  }
}
__kRuntime.registerCommitter(id => {
  if (!active) return
  for (const record of dependencies.get(id) ?? []) pending.add(record)
  schedule()
})
for (const record of records) {
  try {
    record.values = readDependencies(record)
    invoke(record)
  } catch (error) {
    console.error(error)
  }
}
function schedule() {
  if (!pending.size || scheduled || flushing) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return pending.clear()
  flushing = true
  try {
    const selected = [...pending].sort((left, right) => left.index - right.index)
    pending.clear()
    const changed = []
    for (const record of selected) {
      try {
        const values = readDependencies(record)
        if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) {
          record.values = values
          changed.push(record)
        }
      } catch (error) {
        console.error(error)
      }
    }
    for (const record of changed) await invokeCleanup(record)
    if (active) for (const record of changed) invoke(record)
  } finally {
    flushing = false
    if (active) schedule()
  }
}
function readDependencies(record) {
${hasDependencyExpressions || hasDependencyEvaluators ? printDerivedDependencyRead("browserState", hasDependencyExpressions, hasDependencyEvaluators) : ""}
  return (record.effect.dependencies ?? []).map(id => {
    const value = browserState.get(id)
    if (!Array.isArray(value) && value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive or array")
    return value
  })
}
function invoke(record) {
  try {
    const effect = record.effect
    const token = { active: true }
    record.token = token
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope, () => active && token.active && record.token === token))
    if (effect.cleanup && typeof result === "function") record.cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
async function invokeCleanup(record) {
  if (record.token) record.token.active = false
  record.token = undefined
  const cleanup = record.cleanup
  record.cleanup = undefined
  if (!cleanup) return
  try {
    await cleanup()
  } catch (error) {
    console.error(error)
  }
}${disposal}`
  if (!hasCleanup) return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
for (const effect of effects) {
  try {
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}`
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
const cleanups = []
for (const effect of effects) {
  try {
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (effect.cleanup && typeof result === "function") cleanups.push(result)
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
let cleaned = false
const dispose = root => {
  if (root !== document || cleaned) return
  cleaned = true
  for (const cleanup of cleanups) {
    try {
      const result = cleanup()
      if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  cleanups.length = 0
}
if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose, "effects")
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})`
}

function printNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base) {
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const hasDependencyEvaluators = effects.some(effect => effect.dependencyEvaluators?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
export const mountLayoutEffects = () => mount("layout")
export const mountRouteEffects = () => mount("route")
function mount(lifetime) {
  let active = true
  let flushing
  const records = effects.filter(effect => effect.lifetime === lifetime).map((effect, index) => ({ effect, index, values: undefined, cleanup: undefined, token: undefined }))
  const dependencies = new Map()
  const pending = new Set()
  let scheduled = false
  for (const record of records) for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id) ?? new Set()
    subscribers.add(record)
    dependencies.set(id, subscribers)
  }
  const unsubscribe = dependencies.size ? __kRuntime.registerCommitter(id => {
    if (!active) return
    for (const record of dependencies.get(id) ?? []) pending.add(record)
    if (pending.size && !scheduled && !flushing) {
      scheduled = true
      queueMicrotask(flush)
    }
  }) : undefined
  for (const record of records) {
    try {
      record.values = readDependencies(record)
      invoke(record)
    } catch (error) {
      console.error(error)
    }
  }
  async function flush() {
    scheduled = false
    if (!active) return pending.clear()
    const operation = (async () => {
      const selected = [...pending].sort((left, right) => left.index - right.index)
      pending.clear()
      const changed = []
      for (const record of selected) {
        try {
          const values = readDependencies(record)
          if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) {
            record.values = values
            changed.push(record)
          }
        } catch (error) {
          console.error(error)
        }
      }
      for (const record of changed) await cleanup(record)
      if (active) for (const record of changed) invoke(record)
    })()
    flushing = operation
    try { await operation } finally {
      if (flushing === operation) flushing = undefined
      if (active && pending.size && !scheduled) {
        scheduled = true
        queueMicrotask(flush)
      }
    }
  }
  function readDependencies(record) {
${hasDependencyExpressions || hasDependencyEvaluators ? printDerivedDependencyRead("__kRuntime.browserState", hasDependencyExpressions, hasDependencyEvaluators) : ""}
    return (record.effect.dependencies ?? []).map(id => {
      const value = __kRuntime.browserState.get(id)
      if (!Array.isArray(value) && value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive or array")
      return value
    })
  }
  function invoke(record) {
    const token = { active: true }
    record.token = token
    try {
      const effect = record.effect
      const result = modules.get(effect.module)[effect.handler](createEffectContext(__kRuntime.browserState, effect.states, __kRuntime.commitDom, effect.scope, () => active && token.active && record.token === token))
      if (effect.cleanup && typeof result === "function") record.cleanup = result
      else if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  async function cleanup(record) {
    if (record.token) record.token.active = false
    record.token = undefined
    const current = record.cleanup
    record.cleanup = undefined
    if (!current) return
    try { await current() } catch (error) { console.error(error) }
  }
  let disposal
  return async function dispose() {
    if (disposal) return disposal
    disposal = (async () => {
      active = false
      unsubscribe?.()
      pending.clear()
      for (const record of records) if (record.token) record.token.active = false
      if (flushing) await flushing
      for (const record of records) await cleanup(record)
    })()
    return disposal
  }
}`
}

function printOwnedNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base) {
  const hasItemDependencies = effects.some(effect => effect.itemDependencies?.length)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const hasDependencyEvaluators = effects.some(effect => effect.dependencyEvaluators?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(runtimeDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
export const mountLayoutEffects = () => mount("layout")
export const mountRouteEffects = () => mount("route")
function mount(lifetime) {
  let active = true
  let flushing
  let order = 0
  const selectedEffects = effects.map((effect, index) => ({ effect, index })).filter(entry => entry.effect.lifetime === lifetime)
  const records = new Set()
  const owners = new Map()
  const listTemplates = new Map()
  const registrations = new WeakMap()
  const dependencies = new Map()
  const pending = new Set()
  const startedCleanups = new Set()
  let scheduled = false
  for (const template of selectedEffects) {
    if (template.effect.list) listTemplates.set(template.effect.owner, template)
    else {
      const record = createRecord(template, !template.effect.owner)
      if (template.effect.owner) owners.set(template.effect.owner, record)
    }
  }
  const unsubscribeCommitter = selectedEffects.some(({ effect }) => effect.dependencies?.length) ? __kRuntime.registerCommitter(id => {
    if (!active) return
    for (const record of dependencies.get(id) ?? []) if (record.mounted) pending.add(record)
    schedule()
  }) : undefined
  const unsubscribeMount = __kRuntime.registerMountHook(mountOwned, "effects")
  const unsubscribeUnmount = __kRuntime.registerUnmountHook(unmountOwned, "effects")
  ${hasItemDependencies ? `const unsubscribeItems = [...new Set(selectedEffects.filter(({ effect }) => effect.itemDependencies?.length).map(({ effect }) => effect.listState))].map(listState => __kRuntime.registerListItemHook(listState, root => {
    if (!active) return
    for (const record of registrations.get(root) ?? []) if (record.mounted && record.effect.itemDependencies) pending.add(record)
    schedule()
  }))
  ` : ""}for (const record of records) if (record.mounted) start(record)
  mountOwned(document)
  function createRecord(template, mounted = true) {
    const record = { ...template, order: order++, mounted, marker: undefined, version: 0, values: undefined, cleanup: undefined, disposal: undefined, token: undefined }
    records.add(record)
    registerDependencies(record)
    return record
  }
  function registerDependencies(record) {
    for (const id of record.effect.dependencies ?? []) {
      const subscribers = dependencies.get(id) ?? new Set()
      subscribers.add(record)
      dependencies.set(id, subscribers)
    }
  }
  function unregisterDependencies(record) {
    for (const id of record.effect.dependencies ?? []) {
      const subscribers = dependencies.get(id)
      subscribers?.delete(record)
      if (!subscribers?.size) dependencies.delete(id)
    }
  }
  function mountOwned(root) {
    if (!active) return
    for (const marker of matching(root)) {
      if (!marker.isConnected) continue
      if (marker.dataset.kEffects) {
        if (registrations.has(marker)) continue
        const rowRecords = JSON.parse(marker.dataset.kEffects).flatMap(owner => {
          const template = listTemplates.get(owner)
          if (!template) return []
          const record = createRecord(template)
          record.marker = marker
          start(record)
          return [record]
        })
        if (rowRecords.length) registrations.set(marker, rowRecords)
        continue
      }
      const record = owners.get(marker.dataset.kEffect)
      if (record && !record.mounted) mountRecord(record, marker)
    }
  }
  function unmountOwned(root) {
    if (!active) return
    for (const marker of matching(root)) {
      const rowRecords = registrations.get(marker)
      if (rowRecords) {
        for (const record of rowRecords) unmountRecord(record, true)
        registrations.delete(marker)
        continue
      }
      const record = owners.get(marker.dataset.kEffect)
      if (record?.marker === marker) unmountRecord(record)
    }
  }
  function matching(root) {
    const selector = "template[data-k-effect],[data-k-effects]"
    return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
  }
  function mountRecord(record, marker) {
    record.mounted = true
    record.marker = marker
    const version = ++record.version
    const begin = () => {
      if (active && record.mounted && record.version === version && marker.isConnected) start(record)
    }
    if (record.disposal) record.disposal.then(begin)
    else begin()
  }
  function unmountRecord(record, dynamic = false) {
    if (!record.mounted) return
    record.mounted = false
    record.marker = undefined
    record.version++
    pending.delete(record)
    if (dynamic) {
      unregisterDependencies(record)
      records.delete(record)
    }
    void cleanup(record)
  }
  function start(record) {
    try {
      record.values = readDependencies(record)
      invoke(record)
    } catch (error) {
      console.error(error)
    }
  }
  function schedule() {
    if (!pending.size || scheduled || flushing) return
    scheduled = true
    queueMicrotask(flush)
  }
  async function flush() {
    scheduled = false
    if (!active) return pending.clear()
    const operation = (async () => {
      const changed = []
      const selected = [...pending].filter(record => record.mounted).sort((left, right) => left.index - right.index || left.order - right.order)
      pending.clear()
      for (const record of selected) {
        try {
          const values = readDependencies(record)
          if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) changed.push([record, record.version])
        } catch (error) {
          console.error(error)
        }
      }
      for (const [record] of changed) await cleanup(record)
      if (active) for (const [record, version] of changed) if (record.mounted && record.version === version) {
        try {
          record.values = readDependencies(record)
          invoke(record)
        } catch (error) {
          record.values = undefined
          console.error(error)
        }
      }
    })()
    flushing = operation
    try { await operation } finally {
      if (flushing === operation) flushing = undefined
      if (active) schedule()
    }
  }
  function readDependencies(record) {
${hasDependencyExpressions || hasDependencyEvaluators ? printDerivedDependencyRead("__kRuntime.browserState", hasDependencyExpressions, hasDependencyEvaluators) : ""}
    const values = (record.effect.dependencies ?? []).map(id => {
      const value = __kRuntime.browserState.get(id)
      if (!Array.isArray(value) && value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive or array")
      return value
    })
    ${hasItemDependencies ? `if (record.effect.itemDependencies) {
      const item = JSON.parse(record.marker.dataset.kEffectItem)
      for (const field of record.effect.itemDependencies) {
        const value = item[field]
        if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error(\`useEffect() keyed item dependency "\${field}" must remain a JSON-safe primitive\`)
        values.push(value)
      }
    }` : ""}
    return values
  }
  function invoke(record) {
    const token = { active: true }
    record.token = token
    try {
      const effect = record.effect
      const scope = effect.list
        ? Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, value?.type === "list-item" ? JSON.parse(record.marker.dataset.kEffectItem) : value]))
        : effect.scope
      const result = modules.get(effect.module)[effect.handler](createEffectContext(__kRuntime.browserState, effect.states, __kRuntime.commitDom, scope, () => active && token.active && record.token === token))
      if (effect.cleanup && typeof result === "function") record.cleanup = result
      else if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  function cleanup(record) {
    if (record.token) record.token.active = false
    record.token = undefined
    if (record.disposal) return record.disposal
    const current = record.cleanup
    record.cleanup = undefined
    if (!current) return Promise.resolve()
    const disposal = (async () => {
      try { await current() } catch (error) { console.error(error) }
    })()
    record.disposal = disposal
    startedCleanups.add(disposal)
    disposal.finally(() => {
      startedCleanups.delete(disposal)
      if (record.disposal === disposal) record.disposal = undefined
    })
    return disposal
  }
  let disposal
  return async function dispose() {
    if (disposal) return disposal
    disposal = (async () => {
      active = false
      unsubscribeCommitter?.()
      ${hasItemDependencies ? "for (const unsubscribe of unsubscribeItems) unsubscribe()\n      " : ""}unsubscribeMount()
      unsubscribeUnmount()
      pending.clear()
      for (const record of records) if (record.token) record.token.active = false
      if (flushing) await flushing
      const mounted = [...records].filter(record => record.mounted).sort((left, right) => left.index - right.index || left.order - right.order)
      for (const record of mounted) {
        record.mounted = false
        await cleanup(record)
      }
      await Promise.all([...startedCleanups])
      records.clear()
    })()
    return disposal
  }
}`
}

function printDerivedDependencyRead(state, hasExpressions, hasEvaluators) {
  return `${hasEvaluators ? `    if (record.effect.dependencyEvaluators) return record.effect.dependencyEvaluators.map(evaluator => {
      const result = modules.get(evaluator.module)[evaluator.handler](createEffectContext(${state}, evaluator.states, () => {}, evaluator.scope))
      const value = result[evaluator.field]
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() calculated dependency must remain a JSON-safe primitive")
      return value
    })
` : ""}${hasExpressions ? `    if (record.effect.dependencyExpressions) return record.effect.dependencyExpressions.map(expression => {
      const value = __kEvaluateDependency(expression, undefined, undefined, name => ${state}.get(record.effect.dependencyStates[name]))
      if (value !== null && !Array.isArray(value) && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() derived dependency must remain a JSON-safe primitive or array")
      return value
    })` : ""}`
}

function printOwnedEffectEntry(imports, effects, entries) {
  const hasItemDependencies = effects.some(effect => effect.itemDependencies?.length)
  const hasOrdinaryDependencies = effects.some(effect => effect.dependencies?.length)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const hasDependencyEvaluators = effects.some(effect => effect.dependencyEvaluators?.length)
  const hasRowState = effects.some(effect => JSON.stringify([effect.dependencies, effect.dependencyStates, effect.states]).includes("$k") || Object.values(effect.scope).some(hasRowStateCapture))
  const hasRowRef = effects.some(effect => Object.values(effect.scope).some(hasRowRefCapture))
  const initialDependencyCheck = [hasOrdinaryDependencies && "record.effect.dependencies?.length", hasItemDependencies && "record.effect.itemDependencies?.length", hasDependencyExpressions && "record.effect.dependencyExpressions?.length", hasDependencyEvaluators && "record.effect.dependencyEvaluators?.length"].filter(Boolean).join(" || ")
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
${hasItemDependencies ? "let order = 0\n" : ""}const records = effects.map((effect, index) => effect.list ? undefined : createRecord(effect, index)).filter(Boolean)
const listTemplates = new Map(effects.map((effect, index) => effect.list ? [effect.owner, { effect, index }] : undefined).filter(Boolean))
const owners = new Map(records.filter(record => record.effect.owner).map(record => [record.effect.owner, record]))
const listRegistrations = new WeakMap()
const listOwnerSets = new Map()
const mountedRecords = new Set(records.filter(record => record.mounted))
const dependencies = new Map()
const pending = new Set()
let scheduled = false
let flushing = false
let active = true
for (const record of records) registerDependencies(record)
function createRecord(effect, index${hasRowState ? ", marker" : ""}) {
  return { effect: ${hasRowState ? "marker ? specializeRowEffect(effect, marker) : effect" : "effect"}, index, ${hasItemDependencies ? "order: order++, " : ""}mounted: !effect.owner, marker: undefined, version: 0, values: undefined, cleanup: undefined, disposal: undefined, token: undefined }
}
${hasRowState ? `function specializeRowEffect(effect, marker) {
  const path = __kRuntime.listRowPaths.get(marker)
  const id = value => typeof value === "string" ? value.replace("$k", path) : value
  const capture = value => value?.type === "state" || value?.type === "setter" || value?.type === "ref" ? { ...value, id: id(value.id) } : value?.type === "array" ? { ...value, value: value.value.map(capture) } : value?.type === "object" ? { ...value, value: value.value.map(([key, entry]) => [key, capture(entry)]) } : value
  return { ...effect, dependencies: effect.dependencies?.map(id), dependencyStates: effect.dependencyStates && Object.fromEntries(Object.entries(effect.dependencyStates).map(([name, value]) => [name, id(value)])), states: Object.fromEntries(Object.entries(effect.states).map(([name, value]) => [name, id(value)])), scope: Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, capture(value)])) }
}
` : ""}
function registerDependencies(record) {
  for (const id of record.effect.dependencies ?? []) {
  const subscribers = dependencies.get(id) ?? new Set()
  subscribers.add(record)
  dependencies.set(id, subscribers)
  }
}
function unregisterDependencies(record) {
  for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id)
    subscribers?.delete(record)
    if (!subscribers?.size) dependencies.delete(id)
  }
}
${hasItemDependencies ? `if (${hasOrdinaryDependencies}) ` : ""}__kRuntime.registerCommitter(id => {
  if (!active) return
  for (const record of dependencies.get(id) ?? []) if (record.mounted) pending.add(record)
  schedule()
})
${hasItemDependencies ? `for (const listState of new Set(effects.filter(effect => effect.itemDependencies?.length).map(effect => effect.listState))) __kRuntime.registerListItemHook(listState, root => {
  if (!active) return
  for (const record of listRegistrations.get(root) ?? []) if (record.mounted && record.effect.itemDependencies) pending.add(record)
  schedule()
})
` : ""}__kRuntime.registerMountHook(root => {
  if (!active) return
  for (const marker of matching(root)) {
    if (marker.dataset.kEffects) {
      if (listRegistrations.has(marker)) continue
       const encoded = marker.dataset.kEffects
       let effectOwners = listOwnerSets.get(encoded)
       if (!effectOwners) {
         effectOwners = JSON.parse(encoded)
         listOwnerSets.set(encoded, effectOwners)
       }
       const rowRecords = effectOwners.map(owner => {
        const template = listTemplates.get(owner)
        if (!template) throw new Error("Keyed row effect template was not emitted")
        const record = createRecord(template.effect, template.index${hasRowState ? ", marker" : ""})
        if (record.effect.dependencies?.length) registerDependencies(record)
        mount(record, marker, true)
        return record
      })
      listRegistrations.set(marker, rowRecords)
      continue
    }
    const record = owners.get(marker.dataset.kEffect)
    if (!record?.mounted) mount(record, marker)
  }
}, "effects")
__kRuntime.registerUnmountHook(root => {
  if (root === document) {
    if (!active) return
    active = false
    pending.clear()
    for (const record of [...mountedRecords]) unmount(record, record.effect.list)
    return
  }
  for (const marker of matching(root)) {
    const rowRecords = listRegistrations.get(marker)
    if (rowRecords) {
      for (const record of rowRecords) unmount(record, true)
      listRegistrations.delete(marker)
      continue
    }
    const record = owners.get(marker.dataset.kEffect)
    if (record?.marker === marker) unmount(record)
  }
}, "effects")
for (const record of records) if (record.mounted) start(record)
__kRuntime.mountDom(document)
addEventListener("pagehide", event => {
  if (!event.persisted) __kRuntime.unmountDom(document)
})
function matching(root) {
  const selector = "template[data-k-effect],[data-k-effects]"
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}
function mount(record, marker, fresh = false) {
  record.mounted = true
  record.marker = marker
  mountedRecords.add(record)
  const version = ++record.version
  if (record.disposal) record.disposal.then(() => {
    if (!active || !record.mounted || record.version !== version || !marker.isConnected) return
    start(record)
  })
  else if (fresh || active && marker.isConnected) start(record)
}
function unmount(record, dynamic = false) {
  if (!record.mounted) return
  record.mounted = false
  record.marker = undefined
  mountedRecords.delete(record)
  if (dynamic) unregisterDependencies(record)
  record.version++
  pending.delete(record)
  invokeCleanup(record)
}
function start(record) {
  try {
    ${initialDependencyCheck ? `if (${initialDependencyCheck}) record.values = readDependencies(record)` : ""}
    invoke(record)
  } catch (error) {
    console.error(error)
  }
}
function schedule() {
  if (!pending.size || scheduled || flushing) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return pending.clear()
  flushing = true
  try {
    const selected = [...pending].filter(record => record.mounted).sort((left, right) => left.index - right.index${hasItemDependencies ? " || left.order - right.order" : ""})
    pending.clear()
    const changed = []
    for (const record of selected) {
      try {
        const values = readDependencies(record)
        if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) changed.push([record, record.version])
      } catch (error) {
        console.error(error)
      }
    }
    for (const [record] of changed) await invokeCleanup(record)
    if (active) for (const [record, version] of changed) if (record.mounted && record.version === version) {
      try {
        record.values = readDependencies(record)
        invoke(record)
      } catch (error) {
        record.values = undefined
        console.error(error)
      }
    }
  } finally {
    flushing = false
    if (active) schedule()
  }
}
function readDependencies(record) {
${hasDependencyExpressions || hasDependencyEvaluators ? printDerivedDependencyRead("browserState", hasDependencyExpressions, hasDependencyEvaluators) : ""}
  const values = (record.effect.dependencies ?? []).map(id => {
    const value = browserState.get(id)
    if (!Array.isArray(value) && value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive or array")
    return value
  })
  ${hasItemDependencies ? `if (record.effect.itemDependencies) {
    const item = JSON.parse(record.marker.dataset.kEffectItem)
    for (const field of record.effect.itemDependencies) {
      const value = item[field]
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error(\`useEffect() keyed item dependency "\${field}" must remain a JSON-safe primitive\`)
      values.push(value)
    }
  }` : ""}
  return values
}
function invoke(record) {
  const token = { active: true }
  record.token = token
  try {
    const effect = record.effect
    const scope = effect.list
      ? Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, value?.type === "list-item" ? __kRuntime.listItems.get(record.marker) : value]))
      : effect.scope
    const marker = record.marker
    ${hasRowRef ? "const rowPath = effect.list ? __kRuntime.listRowPaths.get(marker) : undefined" : ""}
    const resolveRef = id => {
      if (!marker?.isConnected) return null
      const resolved = ${hasRowRef ? 'id.replace("$k", rowPath)' : "id"}
      return marker.dataset.kRef === resolved ? marker : [...marker.querySelectorAll("[data-k-ref]")].find(node => node.dataset.kRef === resolved) ?? null
    }
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, scope, () => active && token.active && record.token === token, effect.list ? resolveRef : undefined))
    if (effect.cleanup && typeof result === "function") record.cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
function invokeCleanup(record) {
  if (record.token) record.token.active = false
  record.token = undefined
  if (record.disposal) return record.disposal
  const cleanup = record.cleanup
  record.cleanup = undefined
  if (!cleanup) return
  let result
  try {
    result = cleanup()
  } catch (error) {
    console.error(error)
    return
  }
  if (!result || typeof result.then !== "function") return
  const disposal = Promise.resolve(result).catch(error => console.error(error))
  record.disposal = disposal
  disposal.finally(() => {
    if (record.disposal === disposal) record.disposal = undefined
  })
  return disposal
}`
}

function hasRowStateCapture(value) {
  if (!value || typeof value !== "object") return false
  if ((value.type === "state" || value.type === "setter") && value.id.includes("$k")) return true
  if (value.type === "array") return value.value.some(hasRowStateCapture)
  if (value.type === "object") return value.value.some(([, entry]) => hasRowStateCapture(entry))
  return false
}

function hasRowRefCapture(value) {
  if (!value || typeof value !== "object") return false
  if (value.type === "ref" && value.id.includes("$k")) return true
  if (value.type === "array") return value.value.some(hasRowRefCapture)
  if (value.type === "object") return value.value.some(([, entry]) => hasRowRefCapture(entry))
  return false
}

function printSingleDependencyEffect(imports, effect, hasCleanup) {
  const disposal = hasCleanup ? `
const dispose = root => {
  if (root !== document || !active) return
  active = false
  pending = false
  invokeCleanup()
}
if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose, "effects")
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})` : ""
  return `${imports.join("\n")}
const effect = ${inlineJson(effect)}
const dependency = effect.dependencies[0]
let value
let cleanup
let token
let active = true
let pending = false
let scheduled = false
let running = false
__kRuntime.registerCommitter(id => {
  if (active && id === dependency) {
    pending = true
    schedule()
  }
})
try {
  value = readDependency()
  invoke()
} catch (error) {
  console.error(error)
}
function schedule() {
  if (!pending || scheduled || running) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return
  let next
  try {
    next = readDependency()
  } catch (error) {
    console.error(error)
    return
  }
  pending = false
  if (Object.is(next, value)) return
  value = next
  running = true
  try {
    await invokeCleanup()
    if (active) invoke()
  } finally {
    running = false
    if (active) schedule()
  }
}
function readDependency() {
  const next = browserState.get(dependency)
  if (!Array.isArray(next) && next !== null && typeof next !== "string" && typeof next !== "boolean" && !(typeof next === "number" && Number.isFinite(next) && !Object.is(next, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive or array")
  return next
}
function invoke() {
  try {
    const current = { active: true }
    token = current
    const result = __kEffectModule0[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope, () => active && current.active && token === current))
    if (effect.cleanup && typeof result === "function") cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
async function invokeCleanup() {
  if (token) token.active = false
  token = undefined
  const current = cleanup
  cleanup = undefined
  if (!current) return
  try {
    await current()
  } catch (error) {
    console.error(error)
  }
}${disposal}`
}

return (effects, output, handlerModules, assetsDirectory, base, paramPath, runtimeName, navigable, runtimeDirectory = assetsDirectory) => navigable
  ? effects.some(effect => effect.owner)
    ? printOwnedNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base)
    : printNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base)
  : printEffectEntry(effects, output, handlerModules, assetsDirectory, runtimeDirectory, base, paramPath, runtimeName)
}
