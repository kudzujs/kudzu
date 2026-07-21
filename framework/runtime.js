export function applyCommands(state, commands, commit, log = console.log) {
  const changed = new Set()

  for (const [operation, id, operand] of commands) {
    const current = state.get(id)
    if (operation === "log") {
      log(operand, current)
      continue
    }
    state.set(id, operation === "add" ? current + operand : operand)
    changed.add(id)
  }

  for (const id of changed) commit(id, state.get(id))
}

export const browserState = new Map()
const bindingTargets = new Map()

export function commitDom(id, value) {
  for (const node of document.querySelectorAll(`[data-k-text="${id}"]`)) {
    node.textContent = value
    node.dataset.kValue = JSON.stringify(value)
  }
  for (const binding of bindingTargets.get(id) ?? []) {
    patchBinding(binding.node, binding.target, binding.read())
  }
}

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

if (typeof document !== "undefined") {
  if (document.body.dataset.kState) {
    for (const [id, value] of JSON.parse(document.body.dataset.kState)) browserState.set(id, value)
  }
  for (const node of document.querySelectorAll("[data-k-text]")) {
    browserState.set(node.dataset.kText, JSON.parse(node.dataset.kValue))
  }

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

  for (const eventName of ["click", "input", "change"]) {
    document.addEventListener(eventName, event => {
      const target = event.target.closest(`[data-k-on-${eventName}]`)
      if (!target) return
      const commands = target.dataset[`kOn${capitalize(eventName)}`]
      applyCommands(browserState, JSON.parse(commands), commitDom)
    })
  }
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
