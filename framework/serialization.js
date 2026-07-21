export function deserialize(value) {
  if (!value || typeof value !== "object") return value
  if (value.type === "undefined") return undefined
  if (value.type === "number") return value.value === "NaN" ? NaN : value.value === "Infinity" ? Infinity : value.value === "-Infinity" ? -Infinity : -0
  if (value.type === "array") return value.value.map(deserialize)
  if (value.type === "object") {
    const object = value.nullPrototype ? Object.create(null) : {}
    for (const [key, entry] of value.value) Object.defineProperty(object, key, { value: deserialize(entry), enumerable: true, writable: true, configurable: true })
    return object
  }
  return value
}
