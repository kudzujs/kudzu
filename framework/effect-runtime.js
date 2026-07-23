import { deserialize } from "./serialization.js"

export function createEffectContext(state, stateIds, commit, serializedScope = {}) {
  const changed = new Set()
  let scheduled = false

  const flush = () => {
    scheduled = false
    const ids = [...changed]
    changed.clear()
    for (const id of ids) commit(id, state.get(id))
  }

  const setId = (id, value) => {
    const current = state.get(id)
    state.set(id, typeof value === "function" ? value(current) : value)
    changed.add(id)
    if (!scheduled) {
      scheduled = true
      queueMicrotask(flush)
    }
  }

  const scope = globalThis.__KUDZU_EFFECT_CAPTURES__
    ? Object.fromEntries(Object.entries(serializedScope).map(([name, value]) => [name, deserialize(value, id => state.get(id), globalThis.__KUDZU_CAPTURE_SETTER__ ? setId : undefined)]))
    : undefined

  return {
    get(name) {
      return state.get(stateIds[name])
    },
    scope(name) {
      return globalThis.__KUDZU_EFFECT_CAPTURES__ ? serializedScope[name]?.type === "state" ? state.get(serializedScope[name].id) : scope[name] : undefined
    },
    set(name, value) {
      setId(stateIds[name], value)
    }
  }
}
