const markerFields = new Set(["cleanup", "list", "svg", "mount", "static", "indexed", "reducer", "nested", "effects", "conditions", "conditionHandlers", "textRanges", "attributes", "events", "expressions", "expressionAttributes", "fastRelease"])
const validated = new WeakSet()
const jsonSafe = new WeakSet()

export function assertRouteIR(plan, { concrete = false } = {}) {
  if (validated.has(plan) && (!concrete || typeof plan.route === "string")) return plan
  if (plan?.version !== 1) throw new Error(`Unsupported RouteIR version: ${JSON.stringify(plan?.version)}`)
  if (concrete && typeof plan.route !== "string" || !["states", "params", "searchParams", "events", "effects", "bindings", "conditions", "lists"].every(name => Array.isArray(plan[name])) || typeof plan.searchParamsWritable !== "boolean") throw new Error("Invalid RouteIR v1 structure")
  const stateIds = new Set()
  for (const [slot, state] of plan.states.entries()) {
    if (!isRecord(state) || state.slot !== slot || !nonempty(state.id) || !nonempty(state.name) || !Object.hasOwn(state, "initialValue") || state.lifetime !== undefined && !["layout", "route"].includes(state.lifetime) || state.internal !== undefined && state.internal !== true) throw new Error(`Invalid RouteIR v1 state at slot ${slot}`)
    if (stateIds.has(state.id)) throw new Error(`RouteIR has duplicate state ID ${JSON.stringify(state.id)}`)
    stateIds.add(state.id)
  }
  const ids = new Set(stateIds)
  for (const [kind, parameters] of [["parameter", plan.params], ["search parameter", plan.searchParams]]) for (const parameter of parameters) {
    if (!isRecord(parameter) || !nonempty(parameter.name) || !nonempty(parameter.id)) throw new Error(`Invalid RouteIR v1 ${kind}`)
    if (ids.has(parameter.id)) throw new Error(`RouteIR has duplicate state or parameter ID ${JSON.stringify(parameter.id)}`)
    ids.add(parameter.id)
  }
  const listIds = new Set()
  const parentByChild = new Map()
  for (const [index, list] of plan.lists.entries()) assertList(list, index, ids, stateIds, listIds, parentByChild)
  for (const list of plan.lists) {
    if (list.ownerField && !parentByChild.has(list.id)) throw new Error(`RouteIR nested list ${JSON.stringify(list.id)} has no parent`)
    for (const child of list.children ?? []) {
      if (!listIds.has(child.id)) throw new Error(`RouteIR list ${JSON.stringify(list.id)} references missing child ${JSON.stringify(child.id)}`)
      const target = plan.lists.find(entry => entry.id === child.id)
      if (target.ownerField !== child.field) throw new Error(`RouteIR list ${JSON.stringify(child.id)} does not reciprocally reference parent field ${JSON.stringify(child.field)}`)
      if (target.key !== child.key) throw new Error(`RouteIR list ${JSON.stringify(child.id)} does not match parent key metadata`)
    }
  }
  const listsById = new Map(plan.lists.map(list => [list.id, list]))
  const visiting = new Set()
  const visited = new Set()
  const visitList = list => {
    if (visiting.has(list.id)) throw new Error(`RouteIR nested list ownership cycle at ${JSON.stringify(list.id)}`)
    if (visited.has(list.id)) return
    visiting.add(list.id)
    for (const child of list.children ?? []) visitList(listsById.get(child.id))
    visiting.delete(list.id)
    visited.add(list.id)
  }
  for (const list of plan.lists) visitList(list)
  for (const [index, event] of plan.events.entries()) assertEvent(event, index, ids)
  for (const [index, effect] of plan.effects.entries()) assertEffect(effect, index, ids, plan.lists)
  for (const [index, binding] of plan.bindings.entries()) assertReactiveDescriptor(binding, `RouteIR binding ${index}`, ids)
  const conditionIds = new Set()
  for (const [index, condition] of plan.conditions.entries()) {
    if (!isRecord(condition) || !nonempty(condition.id) || !["and", "ternary"].includes(condition.kind) || !Object.hasOwn(condition, "initial")) throw new Error(`RouteIR condition has invalid kind ${JSON.stringify(condition?.kind)}`)
    if (conditionIds.has(condition.id)) throw new Error(`RouteIR has duplicate condition ID ${JSON.stringify(condition.id)}`)
    conditionIds.add(condition.id)
    assertReactiveDescriptor(condition, `RouteIR condition ${index}`, ids)
    for (const branch of Object.values(condition.owned ?? {})) for (const entry of branch) {
      if (!Array.isArray(entry) || entry.length !== 2 || !ids.has(entry[0])) throw new Error(`RouteIR condition ${index} owns missing state ${JSON.stringify(entry?.[0])}`)
    }
  }
  assertJsonSafe(plan, `RouteIR${plan.route === undefined ? "" : ` ${JSON.stringify(plan.route)}`}`)
  validated.add(plan)
  return plan
}

function assertEvent(event, index, ids) {
  if (!isRecord(event) || !nonempty(event.event) || event.commands === undefined && event.native === undefined) throw new Error(`Invalid RouteIR v1 event at index ${index}`)
  for (const command of event.commands ?? []) {
    if (!Array.isArray(command) || command.length !== 3 || !["set", "add", "log"].includes(command[0])) throw new Error(`RouteIR event ${index} command has unsupported operation ${JSON.stringify(command?.[0])}`)
    if (!ids.has(command[1]) && !rowTemplate(command[1])) throw new Error(`RouteIR event ${index} command references missing state ${JSON.stringify(command[1])}`)
    if (command[0] === "add" && (typeof command[2] !== "number" || !Number.isFinite(command[2]))) throw new Error(`RouteIR event ${index} add command requires a finite number`)
  }
  if (event.native !== undefined) assertHandlerDescriptor(event.native, `RouteIR event ${index} native handler`, ids)
}

function assertEffect(effect, index, ids, lists) {
  const label = `RouteIR effect ${index}`
  assertHandlerDescriptor(effect, label, ids)
  for (const dependency of effect.dependencies ?? []) if (!ids.has(dependency) && !rowTemplate(dependency)) throw new Error(`${label} dependency references missing state ${JSON.stringify(dependency)}`)
  if (new Set(effect.dependencies ?? []).size !== (effect.dependencies ?? []).length) throw new Error(`${label} has duplicate dependencies`)
  for (const state of Object.values(effect.dependencyStates ?? {})) if (!ids.has(state) && !rowTemplate(state)) throw new Error(`${label} derived dependency references missing state ${JSON.stringify(state)}`)
  if (effect.dependencyExpressions !== undefined && !Array.isArray(effect.dependencyExpressions) || effect.itemDependencies !== undefined && (!Array.isArray(effect.itemDependencies) || effect.itemDependencies.some(field => !nonempty(field)))) throw new Error(`${label} has invalid dependencies`)
  if (effect.dependencyEvaluators !== undefined) {
    if (!Array.isArray(effect.dependencyEvaluators) || !effect.dependencyEvaluators.length) throw new Error(`${label} has invalid calculation dependency evaluators`)
    for (const [dependencyIndex, evaluator] of effect.dependencyEvaluators.entries()) {
      assertReactiveDescriptor(evaluator, `${label} calculation dependency ${dependencyIndex}`, ids)
      if (!nonempty(evaluator.field) || ["__proto__", "constructor", "prototype"].includes(evaluator.field)) throw new Error(`${label} calculation dependency ${dependencyIndex} has invalid field`)
    }
  }
  if (effect.itemDependencies?.length) {
    if (!nonempty(effect.listState) || !lists.some(list => list.state === effect.listState) || !effect.owner) throw new Error(`${label} item dependencies require a matching owned list`)
  }
  if (effect.list && !effect.owner) throw new Error(`${label} list ownership requires an owner`)
  if (effect.lifetime !== undefined && !["layout", "route"].includes(effect.lifetime)) throw new Error(`${label} has invalid lifetime`)
  for (const field of ["cleanup", "list"]) if (effect[field] !== undefined && effect[field] !== true) throw new Error(`${label} ${field} must be true when present`)
}

function assertReactiveDescriptor(descriptor, label, ids, seen = new Set()) {
  if (!isRecord(descriptor)) throw new Error(`${label} must be a descriptor`)
  if (seen.has(descriptor)) throw new Error(`${label} contains a descriptor cycle`)
  const direct = Object.hasOwn(descriptor, "state")
  const evaluated = Object.hasOwn(descriptor, "module") || Object.hasOwn(descriptor, "handler")
  if (direct === evaluated) throw new Error(`${label} must use exactly one direct state or evaluator`)
  if (direct) {
    if (!ids.has(descriptor.state) && !rowTemplate(descriptor.state)) throw new Error(`${label} references missing state ${JSON.stringify(descriptor.state)}`)
    return
  }
  assertHandlerDescriptor(descriptor, label, ids)
  if (!isRecord(descriptor.scopeStates) || !isRecord(descriptor.scopeBindings)) throw new Error(`${label} evaluator requires scopeStates and scopeBindings records`)
  for (const state of Object.values(descriptor.scopeStates)) if (!ids.has(state) && !rowTemplate(state)) throw new Error(`${label} references missing state ${JSON.stringify(state)}`)
  seen.add(descriptor)
  for (const nested of Object.values(descriptor.scopeBindings)) assertReactiveDescriptor(nested, `${label} nested binding`, ids, seen)
  seen.delete(descriptor)
}

function assertHandlerDescriptor(descriptor, label, ids) {
  if (!isRecord(descriptor) || !nonempty(descriptor.module) || !nonempty(descriptor.handler) || !isRecord(descriptor.states) || !isRecord(descriptor.scope)) throw new Error(`${label} must contain module, handler, states, and scope`)
  for (const state of Object.values(descriptor.states)) if (!ids.has(state) && !rowTemplate(state)) throw new Error(`${label} references missing state ${JSON.stringify(state)}`)
  for (const capture of Object.values(descriptor.scope)) assertCapture(capture, label, ids)
}

function assertCapture(value, label, ids, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return
  if (!isRecord(value) || seen.has(value)) throw new Error(`${label} has invalid capture`)
  seen.add(value)
  if (["undefined", "list-item", "list-index"].includes(value.type)) return seen.delete(value)
  if (value.type === "number") {
    if (!["NaN", "Infinity", "-Infinity", "-0"].includes(value.value)) throw new Error(`${label} capture number is invalid`)
  } else if (["state", "setter"].includes(value.type)) {
    if (!ids.has(value.id) && !rowTemplate(value.id)) throw new Error(`${label} capture ${value.type} references missing state ${JSON.stringify(value.id)}`)
  } else if (value.type === "ref") {
    if (!nonempty(value.id)) throw new Error(`${label} capture ref requires an ID`)
  } else if (value.type === "array") {
    if (!Array.isArray(value.value)) throw new Error(`${label} capture array requires an array value`)
    for (const entry of value.value) assertCapture(entry, label, ids, seen)
  } else if (value.type === "object") {
    if (!Array.isArray(value.value)) throw new Error(`${label} capture object requires entries`)
    const keys = new Set()
    for (const entry of value.value) {
      if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string" || keys.has(entry[0])) throw new Error(`${label} capture object has invalid entries`)
      keys.add(entry[0])
      assertCapture(entry[1], label, ids, seen)
    }
  } else throw new Error(`${label} capture has unsupported type ${JSON.stringify(value.type)}`)
  seen.delete(value)
}

function assertList(list, index, ids, stateIds, listIds, parentByChild) {
  const label = `RouteIR list ${index}`
  if (!isRecord(list) || !nonempty(list.id) || !nonempty(list.state) || typeof list.key !== "string" && list.key !== null || !Array.isArray(list.keys)) throw new Error(`${label} is invalid`)
  if (listIds.has(list.id)) throw new Error(`RouteIR has duplicate list ID ${JSON.stringify(list.id)}`)
  listIds.add(list.id)
  if (!stateIds.has(list.state)) throw new Error(`${label} references missing state ${JSON.stringify(list.state)}`)
  const keys = new Set()
  for (const key of list.keys) {
    if (typeof key !== "string" && !(typeof key === "number" && Number.isFinite(key))) throw new Error(`${label} has invalid key`)
    const token = `${typeof key}:${key}`
    if (keys.has(token)) throw new Error(`${label} has duplicate key ${JSON.stringify(key)}`)
    keys.add(token)
  }
  for (const field of markerFields) if (list[field] !== undefined && list[field] !== true) throw new Error(`${label} ${field} must be true when present`)
  for (const state of Object.values(list.selectorStates ?? {})) if (!ids.has(state)) throw new Error(`${label} selector references missing state ${JSON.stringify(state)}`)
  for (const state of list.expressionStates ?? []) if (!ids.has(state) && !rowTemplate(state)) throw new Error(`${label} expression references missing state ${JSON.stringify(state)}`)
  if (list.source) assertReactiveDescriptor(list.source, `${label} source`, ids)
  for (const child of list.children ?? []) {
    if (!isRecord(child) || !nonempty(child.id) || !nonempty(child.field) || typeof child.key !== "string" && child.key !== null || parentByChild.has(child.id)) throw new Error(`${label} has invalid or duplicate child ${JSON.stringify(child?.id)}`)
    parentByChild.set(child.id, list.id)
  }
  for (const row of list.rowStates ?? []) if (!isRecord(row) || !rowTemplate(row.id) || !Object.hasOwn(row, "initialValue") || row.initializer !== undefined && row.initializer !== "list-item") throw new Error(`${label} has invalid row state`)
  for (const row of [...(list.rowRefs ?? []), ...(list.rowConditions ?? [])]) if (!rowTemplate(row)) throw new Error(`${label} has invalid row ownership ID`)
  if (list.seed && list.valueSeed || list.seed !== undefined && !validSeed(list.seed) || list.valueSeed !== undefined && !validSeed(list.valueSeed)) throw new Error(`${label} has invalid seed`)
}

function validSeed(seed) {
  return isRecord(seed) && Object.values(seed).every(value => ["string", "number", "boolean", "null"].includes(value))
}

export function assertJsonSafe(value, label = "Value") {
  const invalid = invalidJsonPath(value, new Set(), jsonSafe, [])
  if (invalid) throw new Error(`${label} is not JSON-safe at ${invalid}`)
  return value
}

function invalidJsonPath(value, seen, safe, path) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return undefined
  if (typeof value === "number") return Number.isFinite(value) && !Object.is(value, -0) ? undefined : jsonPath(path)
  if (!value || typeof value !== "object" || seen.has(value)) return jsonPath(path)
  if (safe.has(value)) return undefined
  const prototype = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return jsonPath(path)
  const keys = Reflect.ownKeys(value)
  if (keys.some(key => typeof key !== "string")) return jsonPath(path)
  if (Array.isArray(value) && (keys.some(key => key !== "length" && !/^(0|[1-9]\d*)$/.test(key)) || keys.length - 1 !== value.length)) return jsonPath(path)
  seen.add(value)
  for (const key of keys) {
    if (Array.isArray(value) && key === "length") continue
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    path.push(key)
    if (!descriptor.enumerable || !("value" in descriptor)) return jsonPath(path)
    const invalid = invalidJsonPath(descriptor.value, seen, safe, path)
    if (invalid) return invalid
    path.pop()
  }
  seen.delete(value)
  safe.add(value)
  return undefined
}

const jsonPath = path => `$${path.map(key => `.${key}`).join("")}`

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value)
const nonempty = value => typeof value === "string" && value.length > 0
const rowTemplate = value => nonempty(value) && value.includes("$k")
