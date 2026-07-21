import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { readFile, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import test from "node:test"
import { build } from "../framework/build.mjs"
import { behavior, conditional, nativeBehavior, renderPage, useState } from "../framework/core.mjs"
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
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /data-k-state=/)
  assert.match(docs, /data-k-if=/)
  assert.match(docs, /kudzu-binding\.js/)
  assert.match(docs, /Open menu/)
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
  assert.match(html, /class="prop-active">Static prop/)
  assert.match(html, /class="prop-idle" data-k-bind-class=.*>Static prop/)
  assert.match(html, /class="nested-idle" data-k-bind-class=.*>Nested/)
  assert.match(html, /class="off">Shadowed/)
  assert.match(html, /<body data-k-state=/)
  assert.match(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-native\.js/)
  assert.doesNotMatch(commandRuntime, /patchBinding|data-k-bind/)
  assert.match(commandRuntime, /registerCommitter/)
  assert.match(commandRuntime, /eventNames = \["change","click"\]/)
  assert.match(bindingRuntime, /patchBinding|data-k-bind/)
  assert.match(serialization, /export function deserialize/)
  assert.match(bindings, /export function binding0/)
  assert.match(bindings, /__k\.get\("active"\)/)
  assert.match(bindings, /__k\.scope\("activeClass"\)/)
  assert.doesNotMatch(bindings, /\beval\b|new Function/)
  assert.equal(plan.bindings.length, 12)
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
  if (!section || section.className !== "new" || section.querySelector("input").value !== "0" || section.querySelector("select").value !== "zero" || section.querySelector("u").textContent !== "1" || !document.body.textContent.includes("Child open") || !document.body.textContent.includes("Visible text") || document.querySelector("td").textContent !== "Open row") throw new Error("open")
  section.querySelectorAll("button")[0].click()
  await wait()
  section = document.querySelector("main > section")
  if (section.className !== "grown" || section.querySelector("span").textContent !== "1" || section.querySelector("select").value !== "positive" || !section.textContent.includes("Positive")) throw new Error("grow")
  if (!section.querySelector("mark")) throw new Error("and")
  section.querySelector("[data-uncontrolled]").value = "changed"
  control("close").click()
  await wait()
  if (document.querySelector("main > section") || !document.body.textContent.includes("Closed state")) throw new Error("close")
  control("open").click()
  await wait()
  section = document.querySelector("main > section")
  if (section.querySelector("span").textContent !== "1" || section.querySelector("[data-uncontrolled]").value !== "") throw new Error("persist")
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
