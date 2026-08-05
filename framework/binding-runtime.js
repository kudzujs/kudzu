import { browserState, mountDom, registerCommitter, registerMountHook, registerStateReleaseHook, registerUnmountHook, releaseState, unmountDom } from "./shared-runtime.js"
import { deserialize } from "./serialization.js"
import { serializeStyle } from "./style.js"

const imports = new Map()
const bindingTargets = new Map()
const conditionTargets = new Map()
const mountedBindings = new WeakSet()
const mountedConditions = new WeakSet()
const bindingRegistrations = new WeakMap()
const conditionRegistrations = new WeakMap()
const textDescriptors = globalThis.__KUDZU_TEXT_BINDINGS__ && typeof document !== "undefined" ? JSON.parse(document.body.dataset.kTextBindings ?? "[]") : []
const bindingTypes = ["class", "disabled", "value", "checked", "style"]
const bindingSelector = [...bindingTypes.map(target => `[data-k-bind-${target}]`), "[data-k-bind-attrs]"].join(",")

export function patchBinding(node, target, value) {
  if (globalThis.__KUDZU_TEXT_BINDINGS__ && target === "text") {
    patchText(node, value)
  } else if (target === "disabled") {
    node.toggleAttribute("disabled", Boolean(value))
  } else if (target === "checked") {
    node.checked = Boolean(value)
  } else if (target === "value") {
    const next = value == null ? "" : String(value)
    if (node.value !== next) node.value = next
  } else if (target === "style") {
    const style = serializeStyle(value)
    if (style) node.setAttribute("style", style)
    else node.removeAttribute("style")
  } else if (target === "class" && (value == null || value === false)) {
    node.removeAttribute("class")
  } else if (target === "class") {
    if (node.namespaceURI === "http://www.w3.org/1999/xhtml") node.className = String(value)
    else node.setAttribute("class", String(value))
  } else if (value == null || (value === false && !isStringBooleanAttribute(target))) {
    node.removeAttribute(target)
  } else {
    node.setAttribute(target, value === true && !isStringBooleanAttribute(target) ? "" : String(value))
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
registerMountHook(mountBindings)
registerMountHook(mountConditions)
registerUnmountHook(unmountBindings)
registerUnmountHook(unmountConditions)
registerStateReleaseHook(releaseBindings)

if (typeof document !== "undefined") mountDom(document)

function mountBindings(root) {
  for (const node of matching(root, bindingSelector)) {
    if (mountedBindings.has(node)) continue
    mountedBindings.add(node)
    const registrations = []
    bindingRegistrations.set(node, registrations)
    const descriptors = bindingTypes.flatMap(target => node.hasAttribute(`data-k-bind-${target}`)
      ? [[target, JSON.parse(node.dataset[`kBind${capitalize(target)}`])]]
      : [])
    if (node.dataset.kBindAttrs) descriptors.push(...JSON.parse(node.dataset.kBindAttrs).map(({ target, ...descriptor }) => [target, descriptor]))
    for (const [target, descriptor] of descriptors) {
      if (descriptor.state) {
        const binding = { node, target, read: Object.hasOwn(descriptor, "truthy") ? () => browserState.get(descriptor.state) ? descriptor.truthy : descriptor.falsy : () => browserState.get(descriptor.state) }
        register(bindingTargets, descriptor.state, binding)
        registrations.push([descriptor.state, binding])
        patchBinding(node, target, binding.read())
        continue
      }
      loadEvaluator(descriptor).then(evaluator => {
        if (!node.isConnected) return
        const binding = { node, target, read: evaluator.read }
        for (const id of evaluator.stateIds) {
          register(bindingTargets, id, binding)
          registrations.push([id, binding])
        }
        patchBinding(node, target, binding.read())
      }).catch(error => console.error(error))
    }
  }
  if (globalThis.__KUDZU_TEXT_BINDINGS__) {
    for (const node of textBindingStarts(root)) {
      if (mountedBindings.has(node)) continue
      const descriptor = textDescriptors[Number(node.data.slice("k-text:".length))]
      if (!descriptor) continue
      mountedBindings.add(node)
      const registrations = []
      bindingRegistrations.set(node, registrations)
      loadEvaluator(descriptor).then(evaluator => {
        if (!node.isConnected) return
        const binding = { node, target: "text", read: evaluator.read }
        for (const id of evaluator.stateIds) {
          register(bindingTargets, id, binding)
          registrations.push([id, binding])
        }
        patchBinding(node, "text", binding.read())
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
    const truthy = globalThis.__KUDZU_SVG_CONDITIONS__ && descriptor.svg ? start.dataset.kSvgTrue : start.content.querySelector("template[data-k-true]")
    const falsy = globalThis.__KUDZU_SVG_CONDITIONS__ && descriptor.svg ? start.dataset.kSvgFalse : start.content.querySelector("template[data-k-false]")
    if (!end || !truthy || !falsy) continue
    const condition = { start, end, truthy, falsy, svg: globalThis.__KUDZU_SVG_CONDITIONS__ && descriptor.svg, kind: descriptor.kind, current: conditionKey(descriptor.kind, descriptor.initial), mount: descriptor.mount, owned: descriptor.owned }
    mountConditionStates(condition, Boolean(descriptor.initial), false)
    const mount = evaluator => {
      if (!start.isConnected) return
      condition.read = evaluator.read
      const registrations = []
      for (const id of evaluator.stateIds) {
        register(conditionTargets, id, condition)
        registrations.push([id, condition])
      }
      conditionRegistrations.set(start, { condition, registrations })
      updateCondition(condition)
    }
    if (descriptor.state) mount({ read: () => browserState.get(descriptor.state), stateIds: [descriptor.state] })
    else loadEvaluator(descriptor).then(mount).catch(error => console.error(error))
  }
}

function updateCondition(condition) {
  const value = condition.read()
  const next = conditionKey(condition.kind, value)
  if (next === condition.current) return
  const previous = condition.current === "true"
  removeConditionRange(condition.start, condition.end, condition.mount)
  unmountConditionStates(condition, previous)
  const truthy = Boolean(value)
  const falseText = condition.kind === "and" && !truthy ? renderFalsy(value) : ""
  const fragment = falseText
    ? textFragment(condition.end.ownerDocument, falseText)
    : globalThis.__KUDZU_SVG_CONDITIONS__ && condition.svg
      ? svgFragment(condition.start, truthy ? condition.truthy : condition.falsy)
      : (truthy ? condition.truthy : condition.falsy).content.cloneNode(true)
  const nodes = condition.mount ? [...fragment.childNodes] : undefined
  mountConditionStates(condition, truthy, true)
  condition.end.parentNode.insertBefore(fragment, condition.end)
  condition.current = next
  if (condition.mount) for (const node of nodes) mountDom(node)
  const select = condition.start.closest("select[data-k-bind-value]")
  if (select) {
    for (const binding of new Set((bindingRegistrations.get(select) ?? []).map(([, entry]) => entry))) {
      patchBinding(binding.node, binding.target, binding.read())
    }
  }
}

function unmountBindings(root) {
  for (const node of matching(root, bindingSelector)) {
    for (const [id, binding] of bindingRegistrations.get(node) ?? []) bindingTargets.get(id)?.delete(binding)
    bindingRegistrations.delete(node)
    mountedBindings.delete(node)
  }
  if (globalThis.__KUDZU_TEXT_BINDINGS__) {
    for (const node of textBindingStarts(root)) {
      for (const [id, binding] of bindingRegistrations.get(node) ?? []) bindingTargets.get(id)?.delete(binding)
      bindingRegistrations.delete(node)
      mountedBindings.delete(node)
    }
  }
}

function unmountConditions(root) {
  for (const start of matching(root, "template[data-k-if]")) {
    const registration = conditionRegistrations.get(start)
    for (const [id, condition] of registration?.registrations ?? []) conditionTargets.get(id)?.delete(condition)
    if (registration?.condition) unmountConditionStates(registration.condition, registration.condition.current === "true")
    conditionRegistrations.delete(start)
    mountedConditions.delete(start)
  }
}

function releaseBindings(id) {
  for (const binding of bindingTargets.get(id) ?? []) {
    for (const [bindingId, entry] of bindingRegistrations.get(binding.node) ?? []) bindingTargets.get(bindingId)?.delete(entry)
    bindingRegistrations.delete(binding.node)
  }
  bindingTargets.delete(id)
  for (const condition of conditionTargets.get(id) ?? []) {
    const registration = conditionRegistrations.get(condition.start)
    for (const [conditionId, entry] of registration?.registrations ?? []) conditionTargets.get(conditionId)?.delete(entry)
    unmountConditionStates(condition, condition.current === "true")
    conditionRegistrations.delete(condition.start)
  }
  conditionTargets.delete(id)
}

function mountConditionStates(condition, truthy, replace) {
  for (const [id, initialValue] of condition.owned?.[truthy ? "true" : "false"] ?? []) {
    if (replace || !browserState.has(id)) browserState.set(id, initialValue !== null && typeof initialValue === "object" ? structuredClone(initialValue) : initialValue)
  }
}

function unmountConditionStates(condition, truthy) {
  for (const [id] of condition.owned?.[truthy ? "true" : "false"] ?? []) releaseState(id)
}

function removeConditionRange(start, end, mount) {
  if (start.nextSibling === end) return
  const range = start.ownerDocument.createRange()
  range.setStartAfter(start)
  range.setEndBefore(end)
  if (mount) {
    const root = range.commonAncestorContainer
    const nodes = matching(root, "*").filter(node => range.comparePoint(node, 0) === 0)
    for (const node of nodes) if (!nodes.some(parent => parent !== node && parent.contains(node))) unmountDom(node)
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

function svgFragment(marker, markup) {
  const range = marker.ownerDocument.createRange()
  range.selectNode(marker)
  return range.createContextualFragment(markup)
}

function findEnd(start, id) {
  for (let node = start.nextSibling; node; node = node.nextSibling) {
    if (node.nodeType === Node.ELEMENT_NODE && node.matches("template[data-k-if-end]") && node.dataset.kIfEnd === id) return node
  }
  return [...start.ownerDocument.querySelectorAll("template[data-k-if-end]")]
    .find(node => node.dataset.kIfEnd === id)
}

function register(targets, id, entry) {
  const entries = targets.get(id) ?? new Set()
  entries.add(entry)
  targets.set(id, entries)
}

export async function loadEvaluator(descriptor) {
  let modulePromise = imports.get(descriptor.module)
  if (!modulePromise) {
    modulePromise = import(descriptor.module)
    imports.set(descriptor.module, modulePromise)
  }
  const [module, context] = await Promise.all([modulePromise, createBindingContext(descriptor)])
  return { read: () => module[descriptor.handler](context), stateIds: bindingStateIds(descriptor) }
}

async function createBindingContext(descriptor) {
  const scope = Object.fromEntries(Object.entries(descriptor.scope).map(([name, value]) => [name, deserialize(value, id => browserState.get(id))]))
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
    ...(globalThis.__KUDZU_CAPTURE_STATE__ ? Object.values(descriptor.scope).flatMap(serializedStateIds) : []),
    ...Object.values(descriptor.scopeBindings).flatMap(binding => [...bindingStateIds(binding)])
  ])
}

function serializedStateIds(value) {
  if (!value || typeof value !== "object") return []
  if (value.type === "state") return [value.id]
  if (value.type === "array") return value.value.flatMap(serializedStateIds)
  if (value.type === "object") return value.value.flatMap(([, entry]) => serializedStateIds(entry))
  return []
}

function matching(root, selector) {
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}

function textBindingStarts(root) {
  const nodes = root.nodeType === 8 && root.data.startsWith("k-text:") ? [root] : []
  const walker = (root.ownerDocument ?? root).createTreeWalker?.(root, 128)
  while (walker?.nextNode()) if (walker.currentNode.data.startsWith("k-text:")) nodes.push(walker.currentNode)
  return nodes
}

function patchText(start, value) {
  const next = value == null ? "" : String(value)
  const current = start.nextSibling
  const text = current?.nodeType === 3 ? current : undefined
  const end = text ? text.nextSibling : current
  if (end?.nodeType !== 8 || end.data !== "k-text-end") throw new Error("Reactive text marker has no end")
  if (text) {
    if (next) {
      if (text.data !== next) text.data = next
    } else text.remove()
    return
  }
  if (next) end.before(start.ownerDocument.createTextNode(next))
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}

function isStringBooleanAttribute(name) {
  return name.startsWith("aria-") || name.startsWith("data-")
}
