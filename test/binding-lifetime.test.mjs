import assert from "node:assert/strict"
import test from "node:test"
import "../framework/binding-runtime.js"
import { browserState, commitDom, mountDom, releaseState, unmountDom } from "../framework/shared-runtime.js"

test("binding release blocks remount until DOM ownership is unmounted", () => {
  let writes = 0
  let value
  const node = {
    isConnected: true,
    dataset: { kBindAttrs: JSON.stringify([{ target: "data-value", state: "lifetime" }]) },
    matches: () => true,
    getAttribute: () => null,
    setAttribute: (_, next) => { writes++; value = next }
  }
  browserState.set("lifetime", 1)
  mountDom(node, ["bindings"])
  mountDom(node, ["bindings"])
  assert.equal(writes, 1, "repeated mount does not register twice")
  releaseState("lifetime")
  browserState.set("lifetime", 2)
  mountDom(node, ["bindings"])
  commitDom("lifetime", 2)
  assert.equal(value, "1", "released binding cannot regain authority by mounting again")
  assert.equal(writes, 1)
  unmountDom(node, ["bindings"])
  mountDom(node, ["bindings"])
  assert.equal(value, "2", "explicit DOM remount creates fresh ownership")
  browserState.set("lifetime", 3)
  commitDom("lifetime", 3)
  assert.equal(value, "3")
  assert.equal(writes, 3)
  unmountDom(node, ["bindings"])
  releaseState("lifetime")
})
