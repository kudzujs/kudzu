import { browserState, mountText, registerCommitter } from "./shared-runtime.js"
import { deserialize } from "./serialization.js"

const imports = new Map()
const bindingTargets = new Map()
const conditionTargets = new Map()
const mountedBindings = new WeakSet()
const mountedConditions = new WeakSet()
const bindingRegistrations = new WeakMap()
const conditionRegistrations = new WeakMap()
const bindingTypes = ["class", "disabled", "value", "checked"]
const bindingSelector = bindingTypes.map(target => `[data-k-bind-${target}]`).join(",")

export function patchBinding(node, target, value) {
  if (target === "disabled") {
    node.toggleAttribute("disabled", Boolean(value))
  } else if (target === "checked") {
    node.checked = Boolean(value)
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
  const bindings = bindingTargets.get(id)
  if (!bindings) return
  for (const binding of bindings) {
    if (!binding.node.isConnected) bindings.delete(binding)
    else patchBinding(binding.node, binding.target, binding.read())
  }
}

function commitConditions(id) {
  const conditions = conditionTargets.get(id)
  if (!conditions) return
  for (const condition of conditions) {
    if (!condition.start.isConnected) conditions.delete(condition)
    else updateCondition(condition)
  }
}

registerCommitter(commitBindings)
registerCommitter(commitConditions)

if (typeof document !== "undefined") mountDom(document)

function mountDom(root) {
  mountText(root)
  mountBindings(root)
  mountConditions(root)
}

function mountBindings(root) {
  for (const target of bindingTypes) {
    for (const node of matching(root, `[data-k-bind-${target}]`)) {
      if (mountedBindings.has(node)) continue
      mountedBindings.add(node)
      const descriptor = JSON.parse(node.dataset[`kBind${capitalize(target)}`])
      if (descriptor.state) {
        const binding = { node, target, read: () => browserState.get(descriptor.state) }
        register(bindingTargets, descriptor.state, binding)
        bindingRegistrations.set(node, [[descriptor.state, binding]])
        patchBinding(node, target, binding.read())
        continue
      }
      loadEvaluator(descriptor).then(evaluator => {
        if (!node.isConnected) return
        const binding = { node, target, read: evaluator.read }
        const registrations = []
        for (const id of evaluator.stateIds) {
          register(bindingTargets, id, binding)
          registrations.push([id, binding])
        }
        bindingRegistrations.set(node, registrations)
        patchBinding(node, target, binding.read())
      }).catch(error => console.error(error))
    }
  }
}

function mountConditions(root) {
  for (const start of matching(root, "template[data-k-if]")) {
    if (mountedConditions.has(start)) continue
    mountedConditions.add(start)
    const descriptor = JSON.parse(start.dataset.kIf)
    const end = findEnd(start, descriptor.id)
    const truthy = start.content.querySelector("template[data-k-true]")
    const falsy = start.content.querySelector("template[data-k-false]")
    if (!end || !truthy || !falsy) continue
    const condition = { start, end, truthy, falsy, kind: descriptor.kind, current: conditionKey(descriptor.kind, descriptor.initial) }
    loadEvaluator(descriptor).then(evaluator => {
      if (!start.isConnected) return
      condition.read = evaluator.read
      const registrations = []
      for (const id of evaluator.stateIds) {
        register(conditionTargets, id, condition)
        registrations.push([id, condition])
      }
      conditionRegistrations.set(start, { condition, registrations })
      updateCondition(condition)
    }).catch(error => console.error(error))
  }
}

function updateCondition(condition) {
  const value = condition.read()
  const next = conditionKey(condition.kind, value)
  if (next === condition.current) return
  removeConditionRange(condition.start, condition.end)
  const truthy = Boolean(value)
  const falseText = condition.kind === "and" && !truthy ? renderFalsy(value) : ""
  const fragment = falseText
    ? textFragment(condition.end.ownerDocument, falseText)
    : (truthy ? condition.truthy : condition.falsy).content.cloneNode(true)
  const nodes = [...fragment.childNodes]
  condition.end.parentNode.insertBefore(fragment, condition.end)
  condition.current = next
  for (const node of nodes) mountDom(node)
  const select = condition.start.closest("select[data-k-bind-value]")
  for (const binding of new Set((bindingRegistrations.get(select) ?? []).map(([, entry]) => entry))) {
    patchBinding(binding.node, binding.target, binding.read())
  }
}

function unmountDom(root) {
  for (const node of matching(root, bindingSelector)) {
    for (const [id, binding] of bindingRegistrations.get(node) ?? []) bindingTargets.get(id)?.delete(binding)
    bindingRegistrations.delete(node)
    mountedBindings.delete(node)
  }
  for (const start of matching(root, "template[data-k-if]")) {
    const registration = conditionRegistrations.get(start)
    for (const [id, condition] of registration?.registrations ?? []) conditionTargets.get(id)?.delete(condition)
    conditionRegistrations.delete(start)
    mountedConditions.delete(start)
  }
}

function removeConditionRange(start, end) {
  const range = start.ownerDocument.createRange()
  range.setStartAfter(start)
  range.setEndBefore(end)
  const root = range.commonAncestorContainer
  for (const node of matching(root, `${bindingSelector},template[data-k-if]`)) {
    if (range.comparePoint(node, 0) === 0) unmountDom(node)
  }
  range.deleteContents()
}

function conditionKey(kind, value) {
  return value ? "true" : kind === "and" ? `false:${renderFalsy(value)}` : "false"
}

function renderFalsy(value) {
  return value === false || value == null || value === true ? "" : String(value)
}

function textFragment(document, value) {
  const fragment = document.createDocumentFragment()
  fragment.append(document.createTextNode(value))
  return fragment
}

function findEnd(start, id) {
  return [...start.ownerDocument.querySelectorAll("template[data-k-if-end]")]
    .find(node => node.dataset.kIfEnd === id)
}

function register(targets, id, entry) {
  const entries = targets.get(id) ?? new Set()
  entries.add(entry)
  targets.set(id, entries)
}

async function loadEvaluator(descriptor) {
  let modulePromise = imports.get(descriptor.module)
  if (!modulePromise) {
    modulePromise = import(descriptor.module)
    imports.set(descriptor.module, modulePromise)
  }
  const [module, context] = await Promise.all([modulePromise, createBindingContext(descriptor)])
  return { read: () => module[descriptor.handler](context), stateIds: bindingStateIds(descriptor) }
}

async function createBindingContext(descriptor) {
  const scope = Object.fromEntries(Object.entries(descriptor.scope).map(([name, value]) => [name, deserialize(value)]))
  const nested = {}
  await Promise.all(Object.entries(descriptor.scopeBindings).map(async ([name, binding]) => {
    const evaluator = await loadEvaluator(binding)
    nested[name] = evaluator.read
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

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}
