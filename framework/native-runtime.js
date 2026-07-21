import { browserState, commitDom } from "./runtime.js"
import { deserialize } from "./serialization.js"

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

  const eventNames = ["click", "input", "change", "submit", "keydown", "keyup"]
  for (const eventName of eventNames) {
    document.addEventListener(eventName, event => {
      try {
        dispatchNative(event, snapshotNativeTargets(event, eventName), modules).catch(error => console.error(error))
      } catch (error) {
        console.error(error)
      }
    })
  }
}

function snapshotNativeTargets(event, eventName) {
  const selector = `[data-k-native-${eventName}]`
  const targets = []
  for (let target = event.target.closest(selector); target; target = target.parentElement?.closest(selector)) {
    targets.push({ target, native: JSON.parse(target.dataset[`kNative${capitalize(eventName)}`]) })
  }
  return targets
}

async function dispatchNative(event, targets, modules) {
  for (const { target, native } of targets) {
    let modulePromise = modules.get(native.module)
    if (!modulePromise) {
      modulePromise = import(native.module)
      modules.set(native.module, modulePromise)
    }
    try {
      const module = await modulePromise
      const result = module[native.handler](createNativeContext(browserState, native.states, commitDom, native.scope), delegatedEvent(event, target))
      if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
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
