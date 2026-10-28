import assert from "node:assert/strict"
import test from "node:test"
import { nativeBehavior } from "../framework/core.mjs"
import { createNativeContext } from "../framework/native-runtime.js"
import { createEffectContext } from "../framework/effect-runtime.js"

const capture = value => nativeBehavior("/handler.js", "handler", [], [["value", value]]).scope

test("capture semantics preserve context isolation, prototypes, special values and diagnostics", t => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, "__KUDZU_EFFECT_CAPTURES__")
  globalThis.__KUDZU_EFFECT_CAPTURES__ = true
  t.after(() => prior ? Object.defineProperty(globalThis, "__KUDZU_EFFECT_CAPTURES__", prior) : delete globalThis.__KUDZU_EFFECT_CAPTURES__)
  const own = JSON.parse('{"__proto__":{"label":"own"},"constructor":"own"}')
  const input = [own, Object.assign(Object.create(null), { child: { label: "nested" } }), undefined, -0, NaN, Infinity, -Infinity]
  const scope = JSON.parse(JSON.stringify(capture(input)))
  for (const create of [createNativeContext, createEffectContext]) {
    const first = create(new Map(), {}, () => {}, scope).scope("value")
    const second = create(new Map(), {}, () => {}, scope).scope("value")
    assert.deepEqual(first, input)
    first[0].__proto__.label = "mutated"
    first[1].child.label = "mutated"
    assert.equal(second[0].__proto__.label, "own")
    assert.equal(second[1].child.label, "nested")
    assert.equal(Object.getPrototypeOf(second[0]), Object.prototype)
    assert.equal(Object.getPrototypeOf(second[1]), null)
    assert.equal(Object.getPrototypeOf(second[1].child), Object.prototype)
    assert.equal(second[0].constructor, "own")
  }
  const cycle = {}; cycle.self = cycle
  for (const [value, diagnostic] of [[cycle, /cycle/], [new Date(), /non-plain|Date/], [{ get field() { throw new Error("must not execute") } }, /accessor/], [{ [Symbol()]: 1 }, /symbol/]]) assert.throws(() => capture(value), diagnostic)
})
