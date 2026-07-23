import { browserState, commitDom, registerMountHook, registerUnmountHook } from "./shared-runtime.js"
import { deserialize } from "./serialization.js"

const registrations = new WeakMap()

export function createNativeContext(state, stateIds, commit, serializedScope = {}) {
  const changed = new Set()
  let scheduled = false

  const flush = () => {
    scheduled = false
    const ids = [...changed]
    changed.clear()
    for (const id of ids) commit(id, state.get(id))
  }

  const setId = globalThis.__KUDZU_CAPTURE_SETTER__ ? (id, value) => {
    const current = state.get(id)
    state.set(id, typeof value === "function" ? value(current) : value)
    changed.add(id)
    if (!scheduled) {
      scheduled = true
      queueMicrotask(flush)
    }
  } : undefined

  const scope = Object.fromEntries(Object.entries(serializedScope).map(([name, value]) => [name, deserialize(value, id => state.get(id), globalThis.__KUDZU_CAPTURE_SETTER__ ? setId : undefined)]))

  return {
    get(name) {
      return state.get(stateIds[name])
    },
    scope(name) {
      return serializedScope[name]?.type === "state" ? state.get(serializedScope[name].id) : scope[name]
    },
    set(name, value) {
      if (globalThis.__KUDZU_CAPTURE_SETTER__) {
        setId(stateIds[name], value)
        return
      }
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
  const eventNames = ["click", "input", "change", "submit", "keydown", "keyup"]
  const modules = new Map([])
  const mount = root => mountNative(root, eventNames, modules)
  registerMountHook(mount)
  registerUnmountHook(unmountNative)
  mount(document)
}

function mountNative(root, eventNames, modules) {
  for (const eventName of eventNames) {
    for (const node of matching(root, `[data-k-native-${eventName}]`)) {
      const listeners = registrations.get(node) ?? new Map()
      if (listeners.has(eventName)) continue
      const listener = event => {
        try {
          const native = JSON.parse(node.dataset[`kNative${capitalize(eventName)}`])
          const result = modules.get(native.module)[native.handler](createNativeContext(browserState, native.states, commitDom, native.scope), event)
          if (result && typeof result.then === "function") result.catch(error => console.error(error))
        } catch (error) {
          console.error(error)
        }
      }
      node.addEventListener(eventName, listener)
      listeners.set(eventName, listener)
      registrations.set(node, listeners)
    }
  }
}

function unmountNative(root) {
  for (const node of matching(root, "*")) {
    for (const [eventName, listener] of registrations.get(node) ?? []) node.removeEventListener(eventName, listener)
    registrations.delete(node)
  }
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
