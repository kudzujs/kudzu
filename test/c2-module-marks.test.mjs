import assert from "node:assert/strict"
import test from "node:test"
import { markModule, moduleAttribution } from "./c2-module-marks.mjs"

test("module marks preserve native dependency-first execution and exclude later callbacks", async () => {
  const data = source => `data:text/javascript,${encodeURIComponent(source)}`
  const dependency = data(markModule("export const value = 42", "dependency.js"))
  const parent = data(markModule(`import { value } from ${JSON.stringify(dependency)}; export { value }; export const later = async () => { await 0; return value }`, "parent.js"))
  performance.clearMarks()
  const module = await import(parent)
  assert.equal(await module.later(), 42)
  assert.deepEqual(performance.getEntriesByType("mark").map(mark => mark.name), ["c2-module-start:dependency.js", "c2-module-end:dependency.js", "c2-module-start:parent.js", "c2-module-end:parent.js"])
  performance.clearMarks()
  assert.throws(() => markModule("await Promise.resolve()", "async.js"), /top-level await/)
  assert.throws(() => markModule("for await (const item of []) {}", "async.js"), /top-level await/)
  assert.throws(() => markModule("class Example { [await Promise.resolve('method')]() {} }", "async.js"), /top-level await/)
})

test("module attribution verifies paired marks and leaves later modules unobserved", () => {
  const mark = (name, ts) => ({ name, ts, pid: 1, tid: 2, args: { data: { navigationId: "page", startTime: ts / 1000 } } })
  const events = [mark("c2-initial-start", 0), mark("c2-module-start:one.js", 1000), mark("c2-module-end:one.js", 3000), mark("c2-initial-ready", 4000),
    { name: "v8.evaluateModule", ph: "X", ts: 1000, dur: 2000, pid: 1, tid: 2 }]
  const manifest = [{ path: "one.js" }, { path: "later.js" }]
  const result = moduleAttribution(events, 4, manifest)
  assert.equal(result.modules[0].bodyMilliseconds, 2)
  assert.deepEqual(result.modules[0].totalsMicroseconds, { "v8.evaluateModule": 2000 })
  assert.deepEqual(result.notObservedBeforeReadiness, ["later.js"])
  assert.throws(() => moduleAttribution(events.filter(event => event.name !== "c2-module-end:one.js"), 4, manifest))
})
