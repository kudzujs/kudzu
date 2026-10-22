import assert from "node:assert/strict"
import test from "node:test"
import { setImmediate } from "node:timers/promises"
import { browserState, commitDom, mountDom, releaseState, unmountDom } from "../framework/shared-runtime.js"

test("pending evaluators respect DOM and state release before loading", async t => {
  const gates = {}
  const reads = {}
  const descriptors = []
  for (const kind of ["attribute", "text", "condition"]) {
    for (const action of ["unmount", "remount", "release", "release-remount", "commit"]) {
      const id = `${kind}-${action}`
      let resolve
      gates[id] = { promise: new Promise(done => { resolve = done }), resolve: () => resolve() }
      reads[id] = 0
      descriptors.push({
        id, kind, action,
        module: "data:text/javascript," + encodeURIComponent(`await globalThis.__pendingGates[${JSON.stringify(id)}].promise; export function read(context) { globalThis.__pendingReads[${JSON.stringify(id)}]++; return context.get("value") }`),
        handler: "read", states: { value: id, other: `${id}-other` }, scope: {}, scopeStates: {}, scopeBindings: {}, initial: false
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
    const { id, kind, action } = descriptor
    const active = action === "remount" || action === "release-remount" || action === "commit"
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
    browserState.set(`${id}-other`, 0)
    mountDom(node, [capability])
    if (kind === "condition") assert.equal(browserState.get(`${id}-child`), 7)
    if (action.startsWith("release")) {
      releaseState(`${id}-other`)
      if (kind === "condition") assert.equal(browserState.has(`${id}-child`), false, "state release cleans up the pending branch")
      browserState.set(`${id}-other`, 1)
      mountDom(node, [capability])
    }
    if (action !== "release" && action !== "commit") {
      unmountDom(node, [capability])
      if (kind === "condition") assert.equal(browserState.has(`${id}-child`), false, "pending branch state is released before evaluator arrival")
      if (active) mountDom(node, [capability])
    }
    commitDom(id, true)
    assert.equal(reads[id], 0, "commits wait for evaluator availability")
    if (kind === "attribute" && action === "commit") {
      const state = `${id}-condition`
      const marker = { isConnected: true, dataset: { kIf: JSON.stringify({ id, state, initial: false, kind: "ternary" }) }, nextSibling: end, matches: () => true, closest: () => node, content: { querySelector: () => ({ content: { cloneNode: () => ({ childNodes: [] }) } }) } }
      browserState.set(state, true)
      mountDom(marker, ["conditions"])
      assert.equal(reads[id], 0, "select synchronization also waits for pending bindings")
      unmountDom(marker, ["conditions"])
      releaseState(state)
    }
    gates[id].resolve()
    await loadEvaluator(descriptor)
    await setImmediate()
    assert.equal(reads[id], active ? 1 : 0, "only the current mounted owner may evaluate")
    browserState.set(id, false)
    commitDom(id, false)
    assert.equal(reads[id], active ? 2 : 0, "stale owners leave no commit subscription")
    unmountDom(node, [capability])
    releaseState(id)
    releaseState(`${id}-other`)
  })
})
