import { browserState, commitDom, registerMountHook, registerUnmountHook } from "./shared-runtime.js"
import { deserialize } from "./serialization.js"

const registrations = new WeakMap()
const modules = new Map()

export function registerNativeModules(entries) {
  for (const [url, module] of entries) modules.set(url, module)
}

export function createNativeContext(state, stateIds, commit, serializedScope = {}, active = () => true) {
  const changed = new Set()
  let scheduled = false

  const flush = () => {
    scheduled = false
    if (!active()) return changed.clear()
    const ids = [...changed]
    changed.clear()
    for (const id of ids) commit(id, state.get(id))
  }

  const setId = globalThis.__KUDZU_CAPTURE_SETTER__ ? (id, value) => {
    if (!active()) return
    const current = state.get(id)
    state.set(id, typeof value === "function" ? value(current) : value)
    changed.add(id)
    if (!scheduled) {
      scheduled = true
      queueMicrotask(flush)
    }
  } : undefined

  const scope = Object.fromEntries(Object.entries(serializedScope).map(([name, value]) => [name, deserialize(value, id => state.get(id), globalThis.__KUDZU_CAPTURE_SETTER__ ? setId : undefined, active)]))

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
      if (!active()) return
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
  const selector = eventNames.map(eventName => `[data-k-native-${eventName}]`).join(",")
  const mount = root => mountNative(root, eventNames, selector, modules)
  const unmount = root => unmountNative(root, selector)
  registerMountHook(mount, "native")
  registerUnmountHook(unmount, "native")
  mount(document)
  addEventListener("pagehide", event => {
    if (!event.persisted) unmount(document)
  })
}

function mountNative(root, eventNames, selector, modules) {
  for (const node of matching(root, selector)) {
    for (const eventName of eventNames) {
      if (!node.hasAttribute(`data-k-native-${eventName}`)) continue
      const listeners = registrations.get(node) ?? new Map()
      if (listeners.has(eventName)) continue
      let encoded = node.dataset[`kNative${capitalize(eventName)}`]
      let native = JSON.parse(encoded)
      let handler
      const registration = { active: true }
      const active = () => registration.active
      let context = createNativeContext(browserState, native.states, commitDom, native.scope, active)
      const listener = event => {
        try {
          const current = node.dataset[`kNative${capitalize(eventName)}`]
          if (current !== encoded) {
            native = JSON.parse(current)
            encoded = current
            context = createNativeContext(browserState, native.states, commitDom, native.scope, active)
            handler = undefined
          }
          handler ??= modules.get(native.module)[native.handler]
          const result = handler(context, event)
          if (result && typeof result.then === "function") result.catch(error => console.error(error))
        } catch (error) {
          console.error(error)
        }
      }
      registration.listener = listener
      node.addEventListener(eventName, listener)
      listeners.set(eventName, registration)
      registrations.set(node, listeners)
    }
  }
}

function unmountNative(root, selector) {
  for (const node of matching(root, selector)) {
    for (const [eventName, registration] of registrations.get(node) ?? []) {
      registration.active = false
      node.removeEventListener(eventName, registration.listener)
    }
    registrations.delete(node)
  }
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
