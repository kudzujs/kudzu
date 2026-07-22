import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { readFile, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import test from "node:test"
import { build } from "../framework/build.mjs"
import { behavior, conditional, list, nativeBehavior, renderPage, useState } from "../framework/core.mjs"
import { jsx } from "../framework/jsx-runtime.mjs"
import { applyCommands } from "../framework/runtime.js"
import { patchBinding } from "../framework/binding-runtime.js"
import { createNativeContext } from "../framework/native-runtime.js"

test("builds TSX into HTML and behavior commands without React", async () => {
  await build({ quiet: true })
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("../dist/assets/kudzu.js", import.meta.url), "utf8")
  const docs = await readFile(new URL("../dist/docs/index.html", import.meta.url), "utf8")
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
  assert.match(runtime, /eventNames = \["click"\]/)
  assert.doesNotMatch(runtime, /patchBinding|data-k-bind|deserialize/)
  assert.doesNotMatch([html, docs, runtime].join("\n"), /sessionStorage|__kudzu_state|snapshotState|restoreState|__kudzu_dev/)
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.doesNotMatch(html, /data-k-state=/)
  assert.match(docs, /data-k-if=/)
  assert.match(docs, /kudzu-binding\.js/)
  assert.match(docs, /<script[^>]+kudzu-list\.js/)
  assert.match(docs, /LIVE KEYED LIST/)
  assert.match(docs, /Open menu/)
  assert.equal(home.states[0].name, "count")
  assert.deepEqual(home.events[0].commands, [["add", "s0", 1]])
  assert.deepEqual(home.events[1].commands, [["add", "s0", 1], ["add", "s0", 1]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runDocsListBrowserTest(chrome)
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

test("does not serialize unused state on static pages", async () => {
  const result = await renderPage(() => {
    useState(1n)
    return "static"
  }, { styles: false })
  assert.doesNotMatch(result.html, /data-k-state/)
  assert.equal(result.hasBehaviors, false)
})

test("escapes compact JSON attributes", async () => {
  const result = await renderPage(() => {
    const [value] = useState("it's <&")
    return jsx("button", { onClick: behavior([["set", value, "it's <&"]]), children: "Set" })
  }, { styles: false })
  assert.match(result.html, /data-k-on-click='\[\["set","s0","it&#39;s &lt;&amp;"\]\]'/)
})

test("rejects reactive conditionals in foreign namespaces", async () => {
  await assert.rejects(renderPage(() => {
    const [open] = useState(true)
    const branch = conditional("and", true, () => jsx("circle", {}), () => null, "/binding.js", "binding0", [["open", open]], [])
    return jsx("svg", { children: branch })
  }, { styles: false }), /Reactive conditional DOM is not supported inside svg/)
})

test("rejects unsafe or reserved reactive attributes", async () => {
  await assert.rejects(renderPage(() => jsx("button", { onclick: "alert(1)" }), { styles: false }), /onclick must use a camelCase event handler/)
  await assert.rejects(renderPage(() => jsx("div", { "data-k-bind-class": "user" }), { styles: false }), /reserved data-k-\* prefix/)
  await assert.rejects(renderPage(() => jsx("div", { "DATA-K-BIND-CLASS": "user" }), { styles: false }), /reserved data-k-\* prefix/)
  await assert.rejects(renderPage(() => {
    const [style] = useState("color:red")
    return jsx("div", { style })
  }, { styles: false }), /style must be an object/)
})

test("rejects non-serializable keyed list data", async () => {
  for (const [key, value, message] of [
    [NaN, "value", /finite number/],
    [1, undefined, /JSON-safe values/]
  ]) {
    await assert.rejects(renderPage(() => {
      const [items] = useState([{ id: key, name: value }])
      return list(items, "id", item => jsx("p", { children: item.name }))
    }, { styles: false }), message)
  }
  await assert.rejects(renderPage(() => {
    const item = []
    item.id = 1
    item.name = "array"
    const [items] = useState([item])
    return list(items, "id", entry => jsx("p", { children: entry.name }))
  }, { styles: false }), /must be ordinary plain objects/)
  await assert.rejects(renderPage(() => {
    const item = { name: "hidden key" }
    Object.defineProperty(item, "id", { value: 1 })
    const [items] = useState([item])
    return list(items, "id", entry => jsx("p", { children: entry.name }))
  }, { styles: false }), /non-enumerable properties/)
  await assert.rejects(renderPage(() => {
    const item = Object.assign(Object.create(null), { id: 1, name: "Oak" })
    const [items] = useState([item])
    return list(items, "id", entry => jsx("p", { children: entry.name }))
  }, { styles: false }), /ordinary plain objects/)
  await assert.rejects(renderPage(() => {
    const [items] = useState([{ id: 1, nested: Object.assign(Object.create(null), { name: "Oak" }) }])
    return list(items, "id", entry => jsx("p", { children: entry.id }))
  }, { styles: false }), /ordinary plain objects/)
})

test("seeds text state used only by an empty keyed list template", async () => {
  const result = await renderPage(() => {
    const [items] = useState([])
    const [count] = useState(7)
    return list(items, "id", () => jsx("p", { children: count }))
  }, { styles: false })
  assert.match(result.html, /data-k-state='\[\["s0",\[\]\],\["s1",7\]\]'/)
})

test("produces the same execution plan for the same input", async () => {
  await build({ quiet: true })
  const first = await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8")
  await build({ quiet: true })
  const second = await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8")
  assert.equal(second, first)
})

test("patches reactive attributes and form properties without a VDOM", async t => {
  const fixture = new URL("./fixtures/bindings", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/bindings/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/bindings/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: fixture,
    encoding: "utf8"
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/bindings/dist/index.html", import.meta.url), "utf8")
  const bindings = await readFile(new URL("./fixtures/bindings/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const commandRuntime = await readFile(new URL("./fixtures/bindings/dist/assets/kudzu.js", import.meta.url), "utf8")
  const bindingRuntime = await readFile(new URL("./fixtures/bindings/dist/assets/kudzu-binding.js", import.meta.url), "utf8")
  const serialization = await readFile(new URL("./fixtures/bindings/dist/assets/kudzu-serialization.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/bindings/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /class="idle" data-k-bind-class=/)
  assert.match(html, /disabled data-k-bind-disabled=/)
  assert.match(html, /value="Kudzu" data-k-bind-value=/)
  assert.match(html, /value="Kudzu!" data-k-bind-value=/)
  assert.match(html, /value="false" data-k-bind-value=/)
  assert.match(html, /type="checkbox" data-k-bind-checked=/)
  assert.match(html, /type="radio" checked data-k-bind-checked=/)
  assert.match(html, /<select data-k-bind-value=.*<option>Kudzu<\/option><option selected>Grown<\/option><\/select>/)
  assert.match(html, /class="waiting" data-k-bind-class=.*aria-checked="false" data-state="closed" hidden title="Inactive" data-k-bind-attrs=/)
  assert.match(html, /style="color:red;width:8px;opacity:0.5;--accent:1" data-k-bind-style=/)
  assert.match(html, /class="prop-active">Static prop/)
  assert.match(html, /class="prop-idle" data-k-bind-class=.*>Static prop/)
  assert.match(html, /class="nested-idle" data-k-bind-class=.*>Nested/)
  assert.match(html, /class="off">Shadowed/)
  assert.match(html, /<body data-k-state=/)
  assert.match(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.equal(existsSync(new URL("./fixtures/bindings/dist/assets/kudzu-list.js", import.meta.url)), false)
  assert.doesNotMatch(html, /kudzu-native\.js/)
  assert.doesNotMatch(commandRuntime, /patchBinding|data-k-bind/)
  assert.match(commandRuntime, /registerCommitter/)
  assert.match(commandRuntime, /eventNames = \["change","click"\]/)
  assert.match(bindingRuntime, /patchBinding|data-k-bind/)
  assert.match(bindingRuntime, /kudzu-style\.js/)
  assert.equal(existsSync(new URL("./fixtures/bindings/dist/assets/kudzu-style.js", import.meta.url)), true)
  assert.match(serialization, /export function deserialize/)
  assert.match(bindings, /export function binding0/)
  assert.match(bindings, /__k\.get\("active"\)/)
  assert.match(bindings, /__k\.scope\("activeClass"\)/)
  assert.doesNotMatch(bindings, /\beval\b|new Function/)
  assert.equal(plan.bindings.length, 19)
  assert.ok(plan.bindings.some(binding => Object.keys(binding.scopeBindings ?? {}).length > 0))

  const evaluators = await import(`${new URL("./fixtures/bindings/dist/assets/handlers/pages/index.js", import.meta.url).href}?v=${Date.now()}`)
  const context = {
    get: name => name === "active" ? true : name === "name" ? "Kudzu" : undefined,
    scope: name => name === "active" ? true : name === "activeClass" ? "is-active" : name === "item" ? 1 : name === "value" ? "Kudzu!" : undefined
  }
  assert.equal(evaluators.binding0(context), "prop-active")
  assert.equal(evaluators.binding1(context), "Kudzu!")
  assert.equal(evaluators.binding2(context), "is-active")
  assert.equal(evaluators.binding3(context), JSON.stringify({ active: true }))
  assert.equal(evaluators.binding4(context), "nested-1")
  assert.equal(evaluators.binding5(context), false)
  assert.equal(evaluators.binding6(context), "Kudzu!")

  const attributes = new Map()
  let value = "old"
  let checked = false
  const node = {
    get value() { return value },
    set value(next) { value = next },
    get checked() { return checked },
    set checked(next) { checked = next },
    setAttribute: (name, entry) => attributes.set(name, entry),
    removeAttribute: name => attributes.delete(name),
    toggleAttribute: (name, enabled) => enabled ? attributes.set(name, "") : attributes.delete(name)
  }
  patchBinding(node, "class", "ready")
  assert.equal(attributes.get("class"), "ready")
  patchBinding(node, "class", false)
  assert.equal(attributes.has("class"), false)
  patchBinding(node, "disabled", true)
  assert.equal(attributes.has("disabled"), true)
  patchBinding(node, "disabled", false)
  assert.equal(attributes.has("disabled"), false)
  patchBinding(node, "value", "next")
  assert.equal(node.value, "next")
  patchBinding(node, "value", false)
  assert.equal(node.value, "false")
  patchBinding(node, "checked", true)
  assert.equal(node.checked, true)
  patchBinding(node, "checked", 0)
  assert.equal(node.checked, false)
  patchBinding(node, "aria-expanded", false)
  assert.equal(attributes.get("aria-expanded"), "false")
  patchBinding(node, "data-state", false)
  assert.equal(attributes.get("data-state"), "false")
  patchBinding(node, "hidden", true)
  assert.equal(attributes.get("hidden"), "")
  patchBinding(node, "hidden", false)
  assert.equal(attributes.has("hidden"), false)
  patchBinding(node, "title", "Ready")
  assert.equal(attributes.get("title"), "Ready")
  patchBinding(node, "title", null)
  assert.equal(attributes.has("title"), false)
  patchBinding(node, "style", { marginTop: 12, opacity: 0.5, "--gap": 2 })
  assert.equal(attributes.get("style"), "margin-top:12px;opacity:0.5;--gap:2")
  patchBinding(node, "style", null)
  assert.equal(attributes.has("style"), false)
})

test("compiles conditional DOM branches with nested behavior", async t => {
  const fixture = new URL("./fixtures/conditionals", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/conditionals/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/conditionals/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: fixture,
    encoding: "utf8"
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/conditionals/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/conditionals/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const evaluators = await readFile(new URL("./fixtures/conditionals/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/conditionals/dist/assets/kudzu-binding.js", import.meta.url), "utf8")
  const commandRuntime = await readFile(new URL("./fixtures/conditionals/dist/assets/kudzu.js", import.meta.url), "utf8")
  const nativeRuntime = await readFile(new URL("./fixtures/conditionals/dist/assets/kudzu-native.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/conditionals/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]

  assert.match(component, /__kConditional/)
  assert.match(html, /data-k-if=/)
  assert.match(html, /data-k-if-end="c0"/)
  assert.match(html, /Closed state/)
  assert.match(html, /Static condition/)
  assert.match(html, /data-k-state=/)
  assert.match(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.match(html, /kudzu-native\.js/)
  assert.match(runtime, /mountConditions|updateCondition/)
  assert.match(commandRuntime, /eventNames = \["click"\]/)
  assert.match(nativeRuntime, /eventNames = \["click"\]/)
  assert.match(evaluators, /export function binding/)
  assert.doesNotMatch(evaluators, /\beval\b|new Function/)
  assert.equal(plan.conditions.length, 8)
  assert.ok(plan.events.some(event => event.native))
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runConditionalBrowserTest(fixture, chrome)
})

test("compiles and patches keyed reactive lists without remounting existing keys", async t => {
  const fixture = new URL("./fixtures/lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: fixture,
    encoding: "utf8"
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/lists/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const handlers = await readFile(new URL("./fixtures/lists/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(component, /__kList\(items, "id"/)
  assert.match(component, /__kListExpression/)
  assert.match(component, /__kListItem/)
  assert.match(html, /<li data-id="1".*>.*Oak/)
  assert.match(html, /<tr data-row="2"/)
  assert.doesNotMatch(html, /data-k-list-item/)
  assert.match(html, /data-k-list-text="name"/)
  assert.match(html, /data-k-list-attrs=/)
  assert.match(html, /class="active" aria-label="Oak item"/)
  assert.match(html, /OAK<template data-k-list-expression-end><\/template> tree/)
  assert.match(html, /data-k-list-expression=/)
  assert.match(html, /data-k-list-expression-attrs=/)
  assert.match(html, /data-k-list-events=/)
  assert.match(html, /data-k-native-click=/)
  assert.match(html, /kudzu-list\.js/)
  assert.match(html, /kudzu-native\.js/)
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-binding.js", import.meta.url)), false)
  assert.match(runtime, /updateList|fillListItem|evaluate/)
  assert.doesNotMatch(runtime, /\beval\b|new Function/)
  assert.match(handlers, /export function handler/)
  assert.match(handlers, /export function listExpression/)
  assert.match(handlers, /__k\.scope\("item"\)/)
  assert.doesNotMatch(handlers, /\beval\b|new Function/)
  assert.equal(plan.lists.length, 2)
  assert.equal(plan.lists[0].state, "s0")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runListBrowserTest(fixture, chrome)
})

test("emits only list capabilities for derived list expressions without handlers", async t => {
  const fixture = new URL("./fixtures/list-expressions", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/list-expressions/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/list-expressions/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/list-expressions/dist/index.html", import.meta.url), "utf8")
  const handlers = await readFile(new URL("./fixtures/list-expressions/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  assert.match(html, /kudzu-list\.js/)
  assert.doesNotMatch(html, /kudzu-binding\.js|kudzu-native\.js|kudzu-serialization\.js/)
  assert.equal(existsSync(new URL("./fixtures/list-expressions/dist/assets/kudzu-native.js", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/list-expressions/dist/assets/kudzu-serialization.js", import.meta.url)), false)
  assert.match(handlers, /export function listExpression/)
})

test("shares lifecycle cleanup between conditional and list capabilities", async t => {
  const fixture = new URL("./fixtures/list-bindings", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/list-bindings/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/list-bindings/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
    cwd: fixture,
    encoding: "utf8"
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/list-bindings/dist/index.html", import.meta.url), "utf8")
  const shared = await readFile(new URL("./fixtures/list-bindings/dist/assets/kudzu.js", import.meta.url), "utf8")
  assert.match(html, /kudzu-binding\.js/)
  assert.match(html, /kudzu-list\.js/)
  assert.match(shared, /registerMountHook|registerUnmountHook/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runListBindingsBrowserTest(fixture, chrome)
})

test("rejects unsupported keyed list expressions and duplicate initial keys", () => {
  for (const [fixture, message] of [
    ["list-invalid-shape", /must use intrinsic JSX elements/],
    ["list-invalid-condition", /Nested reactive conditions are not supported/],
    ["list-invalid-browser", /identifier "window" is not allowed/],
    ["list-invalid-capture", /identifier "suffix" is not allowed/],
    ["list-invalid-computed-key", /require a direct string or numeric literal key/],
    ["list-invalid-concatenated-key", /require a direct string or numeric literal key/],
    ["list-invalid-duplicate", /Duplicate keyed list key: same/],
    ["list-invalid-fragment", /Fragments are not supported/],
    ["list-invalid-nested", /Nested keyed lists are not supported/],
    ["list-invalid-mutation", /assignments and updates are not supported/],
    ["list-invalid-mutating-method", /mutating method "sort"/],
    ["list-invalid-promise", /arbitrary method "resolve"/],
    ["list-invalid-prototype", /property "constructor" is not supported|cannot read __proto__/],
    ["list-invalid-prototype-key", /property "__proto__" is not supported/],
    ["list-invalid-spread", /item spreads are not supported/],
    ["list-invalid-style", /item style is not supported/],
    ["list-invalid-table", /must be wrapped in <tbody>/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
      cwd: new URL(`./fixtures/${fixture}`, import.meta.url),
      encoding: "utf8"
    })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
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
  const serialization = await readFile(new URL("./fixtures/native/dist/assets/kudzu-serialization.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/native/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const native = plan.routes[0].events[0].native
  assert.match(html, /data-k-native-click/)
  assert.match(html, /kudzu-native\.js/)
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.match(handlerSource, /export async function handler0/)
  assert.match(handlerSource, /Math\.max/)
  assert.match(handlerSource, /Promise\.resolve/)
  assert.match(handlerSource, /__k\.get\("count"\)/)
  assert.match(handlerSource, /__k\.set\("count"/)
  assert.match(handlerSource, /__k\.scope\("step"\)/)
  assert.match(handlerSource, /__k\.scope\("increment"\)/)
  assert.doesNotMatch(commandRuntime, /createNativeContext|data-k-native/)
  assert.match(commandRuntime, /eventNames = \[\]/)
  assert.match(nativeRuntime, /createNativeContext/)
  assert.match(nativeRuntime, /eventNames = \["click"\]/)
  assert.match(serialization, /export function deserialize/)
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

test("mounts direct native handlers with browser event semantics", async t => {
  const fixture = new URL("./fixtures/native-bubbling", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/native-bubbling/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native-bubbling/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/native-bubbling/dist/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/native-bubbling/dist/assets/kudzu-native.js", import.meta.url), "utf8")
  assert.doesNotMatch(html, /"flags":/)
  assert.match(runtime, /registerMountHook\(mount\)/)
  assert.match(runtime, /registerUnmountHook\(unmountNative\)/)
  assert.match(runtime, /node\.addEventListener\(eventName, listener\)/)
  assert.match(runtime, /import \* as __kNativeModule0 from "\/assets\/handlers\/Parent\.js"/)
  assert.match(runtime, /import \* as __kNativeModule1 from "\/assets\/handlers\/pages\/index\.js"/)
  assert.doesNotMatch(runtime, /document\.addEventListener|new Proxy|dispatchNative|snapshotNativeTargets/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNativeBubblingBrowserTest(fixture, chrome)
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

async function runDocsListBrowserTest(chrome) {
  const output = new URL("../dist/", import.meta.url)
  const htmlUrl = new URL("docs/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/docs-test.js"></script></body>'))
  await writeFile(new URL("docs-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  const items = () => [...document.querySelectorAll(".list-demo li")]
  const action = label => [...document.querySelectorAll(".list-demo-actions button")].find(button => button.textContent === label)
  action("Add").click()
  await wait()
  if (items().map(item => item.dataset.id).join(",") !== "1,2,3" || !items()[2].textContent.includes("Vine 3")) throw new Error("add")
  action("Reverse").click()
  await wait()
  if (items().map(item => item.dataset.id).join(",") !== "3,2,1") throw new Error("reverse")
  items()[0].querySelector("button").click()
  await wait()
  if (items().map(item => item.dataset.id).join(",") !== "2,1") throw new Error("remove")
  action("Create").click()
  await wait()
  if (items().map(item => item.dataset.id).join(",") !== "1,2" || items().map(item => item.querySelector("span").textContent).join(",") !== "Oak,Pine") throw new Error("create")
  document.body.dataset.docsListTest = "pass"
} catch (error) {
  document.body.dataset.docsListTest = "fail-" + error.message
}
`)
  const port = 43000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url === "/docs/" ? "docs/index.html" : request.url.slice(1)
  const file = path.join(root, relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/docs/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-docs-list-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runConditionalBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const control = action => document.querySelector('[data-action="' + action + '"]')
  control("hidden").click()
  await wait()
  control("open").click()
  await wait()
  let section = document.querySelector("main > section")
  if (!section || section.className !== "new" || section.dataset.count !== "0" || section.getAttribute("aria-live") !== "off" || section.querySelector("input").value !== "0" || section.querySelector("select").value !== "zero" || section.querySelector("u").textContent !== "1" || !document.body.textContent.includes("Child open") || !document.body.textContent.includes("Visible text") || document.querySelector("td").textContent !== "Open row") throw new Error("open")
  section.querySelectorAll("button")[0].click()
  await wait()
  section = document.querySelector("main > section")
  if (section.className !== "grown" || section.dataset.count !== "1" || section.getAttribute("aria-live") !== "polite" || section.querySelector("span").textContent !== "1" || section.querySelector("select").value !== "positive" || !section.textContent.includes("Positive")) throw new Error("grow")
  if (!section.querySelector("mark")) throw new Error("and")
  section.querySelector("[data-uncontrolled]").value = "changed"
  control("close").click()
  await wait()
  if (document.querySelector("main > section") || !document.body.textContent.includes("Closed state")) throw new Error("close")
  control("open").click()
  await wait()
  section = document.querySelector("main > section")
  if (section.querySelector("span").textContent !== "1" || section.dataset.count !== "1" || section.querySelector("[data-uncontrolled]").value !== "") throw new Error("persist")
  section.querySelectorAll("button")[1].click()
  await wait()
  if (document.querySelector("main > section span").textContent !== "2") throw new Error("async")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}

`)

  const port = 39000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runListBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const click = action => document.querySelector('[data-action="' + action + '"]').click()
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  const initialOak = document.querySelector('[data-id="1"]')
  if (initialOak.querySelector("span").textContent !== "OAK tree" || initialOak.className !== "active" || initialOak.getAttribute("aria-label") !== "Oak item") throw new Error("initial-derived")
  click("add")
  await wait()
  if (document.querySelectorAll("[data-list] > li").length !== 3 || !document.body.textContent.includes("ELM tree") || document.querySelectorAll("tbody > tr").length !== 3) throw new Error("add")
  let movedOnUpdate = false
  const observer = new MutationObserver(() => { movedOnUpdate = true })
  observer.observe(document.querySelector("[data-list]"), { childList: true })
  click("rename")
  await wait()
  observer.disconnect()
  const oak = document.querySelector('[data-id="1"]')
  if (movedOnUpdate || oak.querySelector("span").textContent !== "RED OAK tree" || oak.querySelector("small").textContent !== "Red oak" || oak.className !== "done" || oak.getAttribute("aria-label") !== "Red oak item" || !oak.querySelector("[data-remove]").dataset.kNativeClick.includes("Red oak") || document.querySelector('[data-row="1"] td').textContent !== "Red oak") throw new Error("update")
  oak.querySelector("input").value = "preserved"
  click("reorder")
  await wait()
  const ordered = [...document.querySelectorAll("[data-list] > li")]
  if (ordered.map(node => node.dataset.id).join(",") !== "3,2,1" || ordered[2] !== oak || oak.querySelector("input").value !== "preserved") throw new Error("move")
  oak.querySelector("[data-remove]").click()
  await wait()
  if (document.querySelector('[data-id="1"]') || document.querySelector('[data-row="1"]') || document.querySelectorAll("[data-list] > li").length !== 2) throw new Error("item-remove")
  document.querySelector('[data-id="3"] [data-remove]').click()
  await wait()
  if (document.querySelector('[data-id="3"]') || document.querySelectorAll("[data-list] > li").length !== 1) throw new Error("new-item-handler")
  click("add")
  await wait()
  click("duplicate")
  await wait()
  const beforeDuplicate = [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",")
  if (!runtimeError.includes("Duplicate keyed list key: 1") || [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",") !== beforeDuplicate) throw new Error("duplicate")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}

`)
  const port = 40000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runListBindingsBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const click = action => document.querySelector('[data-action="' + action + '"]').click()
  click("toggle")
  await wait()
  if (document.querySelector("li")) throw new Error("remove")
  click("add")
  await wait()
  click("toggle")
  await wait()
  if ([...document.querySelectorAll("li")].map(node => node.textContent).join(",") !== "Oak,Pine") throw new Error("remount")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}

`)
  const port = 41000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNativeBubblingBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  let lateListenerCalled = false
  document.querySelector("#controls").addEventListener("click", () => { lateListenerCalled = true })
  document.querySelector("#controls").click()
  await wait()
  if (document.body.dataset.controls !== "controls" || document.body.dataset.order || location.hash || lateListenerCalled) throw new Error("event-controls")
  document.querySelector("#inner").click()
  await wait()
  if (document.body.dataset.order !== "inner,parent" || document.querySelector("#parent")) throw new Error("snapshot-order-currentTarget")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = 42000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}
