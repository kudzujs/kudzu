import { browserState, commitDom } from "./runtime.js"

export function createNativeContext(state, stateIds, commit, serializedScope = {}) {
  const changed = new Set()
  let scheduled = false
  const scope = Object.fromEntries(Object.entries(serializedScope).map(([name, value]) => [name, deserialize(value)]))

  const flush = () => {
    scheduled = false
    const ids = [...changed]
    changed.clear()
    for (const id of ids) commit(id, state.get(id))
  }

  return {
    get(name) {
      return state.get(stateIds[name])
    },
    scope(name) {
      return scope[name]
    },
    set(name, value) {
      const id = stateIds[name]
      const current = state.get(id)
      state.set(id, typeof value === "function" ? value(current) : value)
      changed.add(id)
      if (!scheduled) {
        scheduled = true
        queueMicrotask(flush)
      }
    }
  }
}

if (typeof document !== "undefined") {
  const modules = new Map()

  for (const eventName of ["click", "input", "change", "submit", "keydown", "keyup"]) {
    document.addEventListener(eventName, event => {
      const target = event.target.closest(`[data-k-native-${eventName}]`)
      if (!target) return

      const native = JSON.parse(target.dataset[`kNative${capitalize(eventName)}`])
      let modulePromise = modules.get(native.module)
      if (!modulePromise) {
        modulePromise = import(native.module)
        modules.set(native.module, modulePromise)
      }
      modulePromise
        .then(module => module[native.handler](createNativeContext(browserState, native.states, commitDom, native.scope), delegatedEvent(event, target)))
        .catch(error => console.error(error))
    }, true)
  }
}

function deserialize(value) {
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

function delegatedEvent(event, currentTarget) {
  return new Proxy(event, {
    get(source, property) {
      if (property === "currentTarget") return currentTarget
      const value = Reflect.get(source, property, source)
      return typeof value === "function" ? value.bind(source) : value
    }
  })
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
