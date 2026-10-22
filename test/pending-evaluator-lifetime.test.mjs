import assert from "node:assert/strict"
import test from "node:test"
import { setImmediate } from "node:timers/promises"
import { browserState, commitDom, mountDom, releaseState, unmountDom } from "../framework/shared-runtime.js"

test("late evaluators cannot register an unmounted or replaced DOM owner", async t => {
  const gates = {}
  const reads = {}
  const descriptors = []
  for (const kind of ["attribute", "text", "condition"]) {
    for (const remount of [false, true]) {
      const id = `${kind}-${remount}`
      let resolve
      gates[id] = { promise: new Promise(done => { resolve = done }), resolve: () => resolve() }
      reads[id] = 0
      descriptors.push({
        id, kind, remount,
        module: "data:text/javascript," + encodeURIComponent(`await globalThis.__pendingGates[${JSON.stringify(id)}].promise; export function read(context) { globalThis.__pendingReads[${JSON.stringify(id)}]++; return context.get("value") }`),
        handler: "read", states: { value: id }, scope: {}, scopeStates: {}, scopeBindings: {}, initial: false
      })
    }
  }
  const document = { body: { dataset: { kTextBindings: JSON.stringify(descriptors) } }, querySelectorAll: () => [] }
  for (const [key, value] of Object.entries({ __KUDZU_CONDITIONS__: true, __KUDZU_TEXT_BINDINGS__: true, Node: { ELEMENT_NODE: 1 }, document, __pendingGates: gates, __pendingReads: reads })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    globalThis[key] = value
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key])
  }
  const { loadEvaluator } = await import("../framework/binding-runtime.js")
  for (const [index, descriptor] of descriptors.entries()) await t.test(descriptor.id, async () => {
    const { id, kind, remount } = descriptor
    const capability = kind === "condition" ? "conditions" : "bindings"
    const end = { nodeType: 1, matches: () => true, dataset: { kIfEnd: id }, parentNode: { insertBefore: () => {} } }
    const node = kind === "text"
      ? { nodeType: 8, data: `k-text:${index}`, nextSibling: { nodeType: 3, data: "initial", nextSibling: { nodeType: 8, data: "k-text-end" } } }
      : kind === "condition"
        ? { dataset: { kIf: JSON.stringify({ ...descriptor, kind: "ternary", owned: { false: [[`${id}-child`, 7]] } }) }, matches: () => true, nextSibling: end, closest: () => null, content: { querySelector: () => ({ content: { cloneNode: () => ({ childNodes: [] }) } }) } }
        : { dataset: { kBindAttrs: JSON.stringify([{ ...descriptor, target: "data-value" }]) }, matches: () => true, getAttribute: () => null, setAttribute: () => {} }
    node.isConnected = true
    node.ownerDocument = document
    browserState.set(id, true)
    mountDom(node, [capability])
    if (kind === "condition") assert.equal(browserState.get(`${id}-child`), 7)
    unmountDom(node, [capability])
    if (kind === "condition") assert.equal(browserState.has(`${id}-child`), false, "pending branch state is released before evaluator arrival")
    if (remount) mountDom(node, [capability])
    gates[id].resolve()
    await loadEvaluator(descriptor)
    await setImmediate()
    assert.equal(reads[id], remount ? 1 : 0, "only the current mounted owner may evaluate")
    browserState.set(id, false)
    commitDom(id, false)
    assert.equal(reads[id], remount ? 2 : 0, "stale owners leave no commit subscription")
    unmountDom(node, [capability])
    releaseState(id)
  })
})
