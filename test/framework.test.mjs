import assert from "node:assert/strict"
import { readFile, rm } from "node:fs/promises"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { build } from "../framework/build.mjs"
import { nativeBehavior } from "../framework/core.mjs"
import { applyCommands } from "../framework/runtime.js"
import { createNativeContext } from "../framework/native-runtime.js"

test("builds TSX into HTML and behavior commands without React", async () => {
  await build({ quiet: true })
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("../dist/assets/kudzu.js", import.meta.url), "utf8")
  const component = await readFile(new URL("../.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const home = plan.routes.find(route => route.route === "/")

  assert.match(html, /Build like React/)
  assert.match(html, /property="og:image"/)
  assert.match(html, /rel="icon" href="\/favicon\.ico"/)
  assert.match(html, /data-k-on-click/)
  assert.match(html, /data-k-text="s0"/)
  assert.doesNotMatch(component, /from ["']react["']/)
  assert.match(component, /const \[count, setCount\] = useState\(0, "count"\)/)
  assert.match(component, /__kBehavior\(\[\["add", count, 1\]\]\)/)
  assert.match(runtime, /textContent = value/)
  assert.equal(home.states[0].name, "count")
  assert.deepEqual(home.events[0].commands, [["add", "s0", 1]])
  assert.deepEqual(home.events[1].commands, [["add", "s0", 1], ["add", "s0", 1]])
})

test("applies setters immediately in source order and commits once", () => {
  const state = new Map([["s0", 7]])
  const commits = []
  const logs = []

  applyCommands(state, [
    ["set", "s0", 10],
    ["log", "s0", "first"],
    ["add", "s0", 1],
    ["log", "s0", "second"],
    ["add", "s0", -2]
  ], (id, value) => {
    commits.push([id, value])
  }, (...values) => {
    logs.push(values)
  })

  assert.equal(state.get("s0"), 9)
  assert.deepEqual(logs, [["first", 10], ["second", 11]])
  assert.deepEqual(commits, [["s0", 9]])
})

test("produces the same execution plan for the same input", async () => {
  await build({ quiet: true })
  const first = await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8")
  await build({ quiet: true })
  const second = await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8")
  assert.equal(second, first)
})

test("compiles normal async JavaScript handlers to external ESM", async t => {
  const fixture = new URL("./fixtures/native", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/native/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: fixture,
    encoding: "utf8"
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/native/dist/index.html", import.meta.url), "utf8")
  const handlerSource = await readFile(new URL("./fixtures/native/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const commandRuntime = await readFile(new URL("./fixtures/native/dist/assets/kudzu.js", import.meta.url), "utf8")
  const nativeRuntime = await readFile(new URL("./fixtures/native/dist/assets/kudzu-native.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/native/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const native = plan.routes[0].events[0].native
  assert.match(html, /data-k-native-click/)
  assert.match(html, /kudzu-native\.js/)
  assert.match(handlerSource, /export async function handler0/)
  assert.match(handlerSource, /Math\.max/)
  assert.match(handlerSource, /Promise\.resolve/)
  assert.match(handlerSource, /__k\.get\("count"\)/)
  assert.match(handlerSource, /__k\.set\("count"/)
  assert.match(handlerSource, /__k\.scope\("step"\)/)
  assert.match(handlerSource, /__k\.scope\("increment"\)/)
  assert.doesNotMatch(commandRuntime, /createNativeContext|data-k-native/)
  assert.match(nativeRuntime, /createNativeContext/)
  assert.doesNotMatch(handlerSource, /\beval\b|new Function/)
  assert.equal(native.scope.step, 2)
  assert.equal(native.scope.increment, 1)

  const state = new Map([["s0", 0]])
  const commits = []
  const context = createNativeContext(state, { count: "s0" }, (id, value) => commits.push([id, value]), native.scope)
  const handlers = await import(`${new URL("./fixtures/native/dist/assets/handlers/pages/index.js", import.meta.url).href}?v=${Date.now()}`)
  await handlers.handler0(context, { currentTarget: { dataset: { enabled: "yes" } } })
  await Promise.resolve()
  assert.equal(state.get("s0"), 5)
  assert.deepEqual(commits, [["s0", 4], ["s0", 5]])
})

test("rejects non-serializable component-scope captures by name", () => {
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: new URL("./fixtures/invalid", import.meta.url),
    encoding: "utf8"
  })

  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Native capture "helper" is not serializable: function/)
})

test("rejects every unsupported native capture shape", () => {
  const cycle = {}
  cycle.self = cycle
  for (const [value, reason] of [
    [() => {}, "function"],
    [Symbol("value"), "symbol"],
    [1n, "bigint"],
    [cycle, "cycle"],
    [new Date(), "Date"]
  ]) {
    assert.throws(() => nativeBehavior("module", "handler", [], [["capture", value]]), new RegExp(`Native capture "capture" is not serializable: ${reason}`))
  }
})
