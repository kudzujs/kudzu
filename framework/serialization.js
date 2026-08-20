export function deserialize(value, getState, setState, active, resolveRef) {
  if (!value || typeof value !== "object") return value
  if (value.type === "undefined") return undefined
  if (value.type === "number") return value.value === "NaN" ? NaN : value.value === "Infinity" ? Infinity : value.value === "-Infinity" ? -Infinity : -0
  if (value.type === "ref") {
    let current
    return { get current() {
      if (typeof document === "undefined" || active?.() === false) return null
      if (!current?.isConnected) current = resolveRef ? resolveRef(value.id) : document.querySelector(`[data-k-ref="${value.id}"]`)
      return current
    } }
  }
  if (globalThis.__KUDZU_CAPTURE_STATE__ && value.type === "state") return getState?.(value.id)
  if (globalThis.__KUDZU_CAPTURE_SETTER__ && value.type === "setter") return next => {
    if (!setState) throw new Error("Captured state setter is not available in this context")
    setState(value.id, next)
  }
  if (value.type === "array") {
    const array = []
    for (const [index, entry] of value.value.entries()) defineCapture(array, String(index), entry, getState, setState, active, resolveRef)
    return array
  }
  if (value.type === "object") {
    const object = value.nullPrototype ? Object.create(null) : {}
    for (const [key, entry] of value.value) defineCapture(object, key, entry, getState, setState, active, resolveRef)
    return object
  }
  return value
}

function defineCapture(target, key, entry, getState, setState, active, resolveRef) {
  const descriptor = globalThis.__KUDZU_CAPTURE_STATE__ && entry?.type === "state" && getState
    ? { get: () => getState(entry.id) }
    : { value: deserialize(entry, getState, setState, active, resolveRef), writable: true }
  Object.defineProperty(target, key, { ...descriptor, enumerable: true, configurable: true })
}
