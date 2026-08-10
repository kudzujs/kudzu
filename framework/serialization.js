export function deserialize(value, getState, setState, active) {
  if (!value || typeof value !== "object") return value
  if (value.type === "undefined") return undefined
  if (value.type === "number") return value.value === "NaN" ? NaN : value.value === "Infinity" ? Infinity : value.value === "-Infinity" ? -Infinity : -0
  if (value.type === "ref") return { get current() { return typeof document === "undefined" || active?.() === false ? null : document.querySelector(`[data-k-ref="${value.id}"]`) } }
  if (globalThis.__KUDZU_CAPTURE_STATE__ && value.type === "state") return getState?.(value.id)
  if (globalThis.__KUDZU_CAPTURE_SETTER__ && value.type === "setter") return next => {
    if (!setState) throw new Error("Captured state setter is not available in this context")
    setState(value.id, next)
  }
  if (value.type === "array") {
    const array = []
    for (const [index, entry] of value.value.entries()) defineCapture(array, String(index), entry, getState, setState, active)
    return array
  }
  if (value.type === "object") {
    const object = value.nullPrototype ? Object.create(null) : {}
    for (const [key, entry] of value.value) defineCapture(object, key, entry, getState, setState, active)
    return object
  }
  return value
}

function defineCapture(target, key, entry, getState, setState, active) {
  const descriptor = globalThis.__KUDZU_CAPTURE_STATE__ && entry?.type === "state" && getState
    ? { get: () => getState(entry.id) }
    : { value: deserialize(entry, getState, setState, active), writable: true }
  Object.defineProperty(target, key, { ...descriptor, enumerable: true, configurable: true })
}
