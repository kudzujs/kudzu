import assert from "node:assert/strict"
import test from "node:test"
import { createEffectContext } from "../framework/effect-runtime.js"

test("effect captures preserve own names, live state, batching and released setter authority", async t => {
  for (const key of ["__KUDZU_EFFECT_CAPTURES__", "__KUDZU_CAPTURE_STATE__", "__KUDZU_CAPTURE_SETTER__"]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    globalThis[key] = true
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key])
  }
  const state = new Map([["s0", 1]])
  const commits = []
  let active = true
  const serialized = JSON.parse(`{
    "__proto__": {"type":"object","nullPrototype":true,"value":[["label","captured"]]},
    "constructor": "ordinary capture",
    "count": {"type":"state","id":"s0"},
    "setCount": {"type":"setter","id":"s0"},
    "nested": {"type":"object","value":[["count",{"type":"state","id":"s0"}]]}
  }`)
  const before = JSON.stringify(serialized)
  const context = createEffectContext(state, { count: "s0" }, (...args) => commits.push(args), serialized, () => active)
  assert.equal(context.scope("__proto__").label, "captured")
  assert.equal(Object.getPrototypeOf(context.scope("__proto__")), null)
  assert.equal(context.scope("constructor"), "ordinary capture")
  const nested = context.scope("nested")
  context.scope("setCount")(value => value + 1)
  context.set("count", value => value + 1)
  assert.equal(context.get("count"), 3)
  assert.equal(context.scope("count"), 3)
  assert.equal(nested.count, 3)
  assert.equal(context.scope("nested"), nested)
  assert.deepEqual(commits, [])
  await Promise.resolve()
  assert.deepEqual(commits, [["s0", 3]])
  context.set("count", 4)
  active = false
  context.scope("setCount")(99)
  await Promise.resolve()
  assert.equal(state.get("s0"), 4)
  assert.deepEqual(commits, [["s0", 3]], "release revokes queued commits and captured setters")
  assert.equal(JSON.stringify(serialized), before, "context construction does not mutate serialized captures")
})
