const maxAge = 10000

export function stateSchema(states) {
  const occurrences = new Map()
  for (const { name } of states) if (typeof name === "string") occurrences.set(name, (occurrences.get(name) ?? 0) + 1)
  return states.flatMap(({ id, name }) => {
    return typeof id === "string" && occurrences.get(name) === 1 ? [[id, name]] : []
  })
}

export function snapshotState(storage, route, state, schema, now = Date.now()) {
  try {
    storage.removeItem(storageKey(route))
  } catch {
    return false
  }
  try {
    const identities = new Map(schema)
    const values = [...state].flatMap(([id, value]) => {
      const identity = identities.get(id)
      return typeof identity === "string" && jsonSafe(value) ? [[identity, value]] : []
    })
    if (values.length) storage.setItem(storageKey(route), JSON.stringify({ time: now, values }))
    return values.length > 0
  } catch {
    return false
  }
}

export function restoreState(storage, route, state, schema, commit, now = Date.now()) {
  let snapshot
  try {
    const raw = storage.getItem(storageKey(route))
    if (raw === null) return []
    storage.removeItem(storageKey(route))
    snapshot = JSON.parse(raw)
  } catch {
    return []
  }

  if (!(state instanceof Map) || !Array.isArray(schema) || typeof commit !== "function") return []
  if (!snapshot || !Number.isFinite(snapshot.time) || now < snapshot.time || now - snapshot.time > maxAge || !Array.isArray(snapshot.values)) return []
  const ids = new Map(schema.flatMap(entry => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === "string" && typeof entry[1] === "string" ? [[entry[1], entry[0]]] : []))
  const changes = []
  const seen = new Set()
  for (const entry of snapshot.values) {
    if (!Array.isArray(entry) || entry.length !== 2) continue
    const [identity, value] = entry
    const id = ids.get(identity)
    if (typeof identity !== "string" || seen.has(identity) || !state.has(id) || !jsonSafe(value) || shape(value) !== shape(state.get(id))) continue
    seen.add(identity)
    changes.push({ id, value, original: state.get(id) })
  }
  for (const { id, value } of changes) state.set(id, value)
  try {
    for (const { id } of changes) commit(id, state.get(id))
  } catch {
    for (const { id, original } of changes) state.set(id, original)
    for (const { id } of changes) {
      try { commit(id, state.get(id)) } catch {}
    }
    return []
  }
  return changes.map(({ id }) => id)
}

function storageKey(route) {
  return `__kudzu_state:${route}`
}

function shape(value) {
  if (Array.isArray(value)) return "array"
  if (value === null) return "null"
  return typeof value === "object" ? "object" : typeof value
}

function jsonSafe(value, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true
  if (typeof value === "number") return Number.isFinite(value) && !Object.is(value, -0)
  if (!value || typeof value !== "object" || seen.has(value) || Object.getOwnPropertySymbols(value).length) return false
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return false

  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (Array.isArray(value)) {
    if (Object.keys(descriptors).some(key => key !== "length" && !/^(0|[1-9]\d*)$/.test(key))) return false
    if (Object.keys(value).length !== value.length) return false
  }
  seen.add(value)
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(value) && key === "length") continue
    if (!descriptor.enumerable || !("value" in descriptor) || !jsonSafe(descriptor.value, seen)) {
      seen.delete(value)
      return false
    }
  }
  seen.delete(value)
  return true
}
