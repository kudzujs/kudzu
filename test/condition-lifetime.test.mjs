import assert from "node:assert/strict"
import test from "node:test"
import { setImmediate } from "node:timers/promises"
import { browserState, commitDom, mountDom, releaseState, unmountDom } from "../framework/shared-runtime.js"

test("conditions preserve mounted membership during evaluation and after state release", async t => {
  for (const [key, value] of [["__KUDZU_CONDITIONS__", true], ["Node", { ELEMENT_NODE: 1 }]]) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key)
    globalThis[key] = value
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key])
  }
  await import("../framework/binding-runtime.js")
  const fixture = descriptor => {
    const inserted = []
    const end = { nodeType: 1, matches: () => true, dataset: { kIfEnd: descriptor.id }, parentNode: { insertBefore: node => inserted.push(node.branch) } }
    const start = {
      isConnected: true,
      dataset: { kIf: JSON.stringify({ kind: "ternary", initial: false, ...descriptor }) },
      nextSibling: end,
      matches: () => true,
      closest: () => null,
      content: { querySelector: selector => ({ content: { cloneNode: () => ({ branch: selector, childNodes: [] }) } }) }
    }
    return { start, inserted }
  }
  const { start, inserted } = fixture({ id: "direct", state: "condition", owned: { true: [["child", 7]] } })
  browserState.set("condition", false)
  mountDom(start, ["conditions"])
  mountDom(start, ["conditions"])
  browserState.set("condition", true)
  commitDom("condition", true)
  assert.deepEqual(inserted, ["template[data-k-true]"], "duplicate mount creates only one subscription")
  assert.equal(browserState.get("child"), 7)
  releaseState("condition")
  assert.equal(browserState.has("child"), false, "release clears active branch state")
  browserState.set("condition", true)
  mountDom(start, ["conditions"])
  commitDom("condition", true)
  assert.equal(inserted.length, 1, "released owner cannot regain authority")
  unmountDom(start, ["conditions"])
  mountDom(start, ["conditions"])
  assert.equal(inserted.length, 2, "explicit remount creates fresh ownership")
  assert.equal(browserState.get("child"), 7)
  unmountDom(start, ["conditions"])
  releaseState("condition")

  let resolveEvaluation
  globalThis.__conditionEvaluation = new Promise(resolve => { resolveEvaluation = resolve })
  globalThis.__conditionReads = 0
  t.after(() => { delete globalThis.__conditionEvaluation; delete globalThis.__conditionReads })
  const module = "data:text/javascript," + encodeURIComponent('await globalThis.__conditionEvaluation; export function read(context) { globalThis.__conditionReads++; return context.get("value") }')
  const pending = fixture({ id: "pending", module, handler: "read", states: { value: "pending" }, scope: {}, scopeStates: {}, scopeBindings: {} })
  browserState.set("pending", true)
  mountDom(pending.start, ["conditions"])
  mountDom(pending.start, ["conditions"])
  assert.equal(globalThis.__conditionReads, 0)
  resolveEvaluation()
  for (let attempt = 0; attempt < 100 && !globalThis.__conditionReads; attempt++) await setImmediate()
  await setImmediate()
  assert.equal(globalThis.__conditionReads, 1, "pending evaluation reserves mounted membership")
  assert.equal(pending.inserted.length, 1)
  browserState.set("pending", false)
  commitDom("pending", false)
  assert.equal(globalThis.__conditionReads, 2)
  assert.equal(pending.inserted.length, 2)
  unmountDom(pending.start, ["conditions"])
  releaseState("pending")
})
