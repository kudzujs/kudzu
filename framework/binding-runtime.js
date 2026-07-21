import { browserState, registerCommitter } from "./shared-runtime.js"
import { deserialize } from "./serialization.js"

const bindingTargets = new Map()

export function patchBinding(node, target, value) {
  if (target === "disabled") {
    node.toggleAttribute("disabled", Boolean(value))
  } else if (target === "value") {
    const next = value == null ? "" : String(value)
    if (node.value !== next) node.value = next
  } else if (value == null || value === false) {
    node.removeAttribute("class")
  } else {
    node.setAttribute("class", String(value))
  }
}

function commitBindings(id) {
  for (const binding of bindingTargets.get(id) ?? []) patchBinding(binding.node, binding.target, binding.read())
}

registerCommitter(commitBindings)

if (typeof document !== "undefined") {
  const imports = new Map()
  const registrations = []
  for (const target of ["class", "disabled", "value"]) {
    for (const node of document.querySelectorAll(`[data-k-bind-${target}]`)) {
      const descriptor = JSON.parse(node.dataset[`kBind${capitalize(target)}`])
      if (descriptor.state) {
        registerBinding(descriptor.state, { node, target, read: () => browserState.get(descriptor.state) })
        continue
      }
      let modulePromise = imports.get(descriptor.module)
      if (!modulePromise) {
        modulePromise = import(descriptor.module)
        imports.set(descriptor.module, modulePromise)
      }
      registrations.push(modulePromise.then(async module => {
        const context = await createBindingContext(descriptor, imports)
        const binding = { node, target, read: () => module[descriptor.handler](context) }
        for (const id of bindingStateIds(descriptor)) registerBinding(id, binding)
        patchBinding(node, target, binding.read())
      }))
    }
  }
  Promise.all(registrations).catch(error => console.error(error))
}

function registerBinding(id, binding) {
  const bindings = bindingTargets.get(id) ?? []
  bindings.push(binding)
  bindingTargets.set(id, bindings)
}

async function createBindingContext(descriptor, imports) {
  const scope = Object.fromEntries(Object.entries(descriptor.scope).map(([name, value]) => [name, deserialize(value)]))
  const nested = {}
  await Promise.all(Object.entries(descriptor.scopeBindings).map(async ([name, binding]) => {
    let modulePromise = imports.get(binding.module)
    if (!modulePromise) {
      modulePromise = import(binding.module)
      imports.set(binding.module, modulePromise)
    }
    const [module, context] = await Promise.all([modulePromise, createBindingContext(binding, imports)])
    nested[name] = () => module[binding.handler](context)
  }))
  return {
    get: name => browserState.get(descriptor.states[name]),
    scope: name => name in descriptor.scopeStates ? browserState.get(descriptor.scopeStates[name]) : name in nested ? nested[name]() : scope[name]
  }
}

function bindingStateIds(descriptor) {
  return new Set([
    ...Object.values(descriptor.states),
    ...Object.values(descriptor.scopeStates),
    ...Object.values(descriptor.scopeBindings).flatMap(binding => [...bindingStateIds(binding)])
  ])
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
