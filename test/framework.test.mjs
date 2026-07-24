import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { readFile, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import test from "node:test"
import { build, specializeRuntime } from "../framework/build.mjs"
import { behavior, conditional, createContext, list, nativeBehavior, renderPage, useContext, useRef, useState } from "../framework/core.mjs"
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
  assert.match(html, /hero-code.*tok-keyword/s)
  assert.doesNotMatch(component, /from ["']react["']/)
  assert.match(component, /const \[count, setCount\] = useState\(0, "count"\)/)
  assert.match(component, /__kBehavior\(\[\["add", count, 1\]\]\)/)
  assert.match(runtime, /textContent=/)
  assert.match(runtime, /\["click"\]/)
  assert.equal(runtime.trim().split("\n").length, 1)
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

test("removes unused initial state bootstrapping from both runtimes", async () => {
  for (const file of ["runtime.js", "shared-runtime.js"]) {
    const source = await readFile(new URL(`../framework/${file}`, import.meta.url), "utf8")
    assert.doesNotMatch(specializeRuntime(source, [], false), /initialState/)
  }
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

test("escapes custom runtime asset URLs", async () => {
  const result = await renderPage(() => {
    const [value] = useState(false)
    return jsx("button", { onClick: behavior([["set", value, true]]), children: "Set" })
  }, { styles: false, runtimeAsset: '\"><script data-injected>' })
  assert.match(result.html, /src="&quot;&gt;&lt;script data-injected&gt;"/)
  assert.doesNotMatch(result.html, /<script data-injected>/)
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

test("renders object refs and rejects unsupported ref shapes", async () => {
  const result = await renderPage(() => {
    const inputRef = useRef(null)
    return jsx("input", { ref: inputRef })
  }, { styles: false })
  assert.match(result.html, /<input data-k-ref="r0">/)
  await assert.rejects(renderPage(() => jsx("input", { ref: { current: null } }), { styles: false }), /ref must be created by useRef/)
  await assert.rejects(renderPage(() => {
    const inputRef = useRef(null)
    const [items] = useState([{ id: 1 }])
    return list(items, "id", () => jsx("input", { ref: inputRef }))
  }, { styles: false }), /Refs are not supported in keyed lists/)
})

test("renders static raw HTML and rejects reactive or conflicting content", async () => {
  const result = await renderPage(() => jsx("article", { dangerouslySetInnerHTML: { __html: "<strong>Trusted</strong>" } }), { styles: false })
  assert.match(result.html, /<article><strong>Trusted<\/strong><\/article>/)
  await assert.rejects(renderPage(() => {
    const [html] = useState("<strong>Reactive</strong>")
    return jsx("article", { dangerouslySetInnerHTML: { __html: html } })
  }, { styles: false }), /Reactive dangerouslySetInnerHTML is not supported/)
  await assert.rejects(renderPage(() => jsx("article", { dangerouslySetInnerHTML: { __html: "<b>Raw</b>" }, children: "Text" }), { styles: false }), /cannot be used with children/)
})

test("renders context defaults and nested providers", async () => {
  const Theme = createContext("default")
  const Value = () => jsx("span", { children: useContext(Theme) })
  const result = await renderPage(() => jsx(Symbol.for("kudzu.fragment"), { children: [
    jsx(Value, {}),
    jsx(Theme.Provider, { value: "outer", children: [jsx(Value, {}), jsx(Theme.Provider, { value: "inner", children: jsx(Value, {}) })] })
  ] }), { styles: false })
  assert.match(result.html, /<span>default<\/span><span>outer<\/span><span>inner<\/span>/)
  await assert.rejects(renderPage(() => useContext({}), { styles: false }), /requires a Kudzu context/)
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

test("emits dynamic routes from getStaticPaths with page props", async t => {
  const fixture = new URL("./fixtures/dynamic", import.meta.url)
  const config = new URL("./fixtures/dynamic/kudzu.config.mjs", import.meta.url)
  await writeFile(config, `
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
export default {
  base: "/newsletter",
  async afterBuild({ outDir, routes }) {
    await writeFile(join(outDir, "routes.json"), JSON.stringify(routes))
  }
}
`)
  t.after(async () => {
    await rm(config, { force: true })
    await rm(new URL("./fixtures/dynamic/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/dynamic/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  assert.match(result.stdout, /Built 2 page\(s\), 2 interactive page\(s\)/)
  const oak = await readFile(new URL("./fixtures/dynamic/dist/posts/oak/index.html", import.meta.url), "utf8")
  const pine = await readFile(new URL("./fixtures/dynamic/dist/posts/pine/index.html", import.meta.url), "utf8")
  assert.match(oak, /href="\/newsletter\/assets\/newsletter\.css"/)
  assert.match(oak, /href="\/newsletter\/assets\/style\.css"/)
  assert.match(oak, /rel="icon" href="\/newsletter\/icon\.svg"/)
  assert.match(oak, /rel="manifest" href="\/newsletter\/manifest\.webmanifest"/)
  assert.match(oak, /src="\/newsletter\/assets\/kudzu(?:-native)?\.js"/)
  assert.match(oak, /src="\/newsletter\/assets\/effects\/posts\/oak\/index\.js"/)
  assert.match(oak, /data-title="Oak".*<h1>Oak<\/h1><p>Score: 7<\/p><p data-mounted="true">.*pending.*<\/p><section><article><strong>Oak body<\/strong><\/article><\/section>/)
  assert.match(pine, /data-title="Pine".*<h1>Pine<\/h1><p>Score: 9<\/p><p data-mounted="true">.*pending.*<\/p><section><article><strong>Pine body<\/strong><\/article><\/section>/)
  assert.equal(existsSync(new URL("./fixtures/dynamic/dist/assets/newsletter.css", import.meta.url)), true)
  assert.equal(existsSync(new URL("./fixtures/dynamic/dist/assets/style.css", import.meta.url)), true)
  assert.deepEqual(JSON.parse(await readFile(new URL("./fixtures/dynamic/dist/routes.json", import.meta.url), "utf8")), ["/newsletter/posts/oak", "/newsletter/posts/pine"])
  const plans = JSON.parse(await readFile(new URL("./fixtures/dynamic/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.deepEqual(plans.map(plan => plan.route), ["/newsletter/posts/oak", "/newsletter/posts/pine"])
  assert.deepEqual(plans.map(plan => plan.events[0].native.scope.title), ["Oak", "Pine"])
  assert.deepEqual(plans.map(plan => plan.effects[0].scope.title), ["Oak", "Pine"])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runDynamicBrowserTest(fixture, chrome)
})

test("rejects unsafe dynamic route params", async t => {
  const fixture = new URL("./fixtures/dynamic-invalid", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/dynamic-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/dynamic-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Invalid param "slug" for route \[slug\]/)
})

test("compiles runtime route params to a static fallback and route ESM", async t => {
  const fixture = new URL("./fixtures/runtime-params", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/runtime-params/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/runtime-params/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/runtime-params/dist/orgs/[org]/items/[id]/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/runtime-params/dist/orgs/acme/items/new/index.html", import.meta.url), "utf8")
  const params = await readFile(new URL("./fixtures/runtime-params/dist/assets/params/orgs/[org]/items/[id]/index.js", import.meta.url), "utf8")
  const effect = await readFile(new URL("./fixtures/runtime-params/dist/assets/effects/orgs/[org]/items/[id]/index.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/runtime-params/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const afterBuild = JSON.parse(await readFile(new URL("./fixtures/runtime-params/dist/rewrites.json", import.meta.url), "utf8"))
  assert.match(html, /data-k-text="p0"/)
  assert.match(html, /data-k-text="p1"/)
  assert.match(html, /kudzu\.js.*params\/orgs\/\[org\]\/items\/\[id\]\/index\.js.*kudzu-binding\.js.*effects\/orgs\/\[org\]\/items\/\[id\]\/index\.js/s)
  assert.match(staticHtml, /data-static-new/)
  assert.doesNotMatch(staticHtml, /<script|data-k-state/)
  assert.match(params, /location\.pathname/)
  assert.match(params, /decodeURIComponent/)
  assert.doesNotMatch(params, /pushState|popstate|preventDefault/)
  assert.match(effect, /params\/orgs\/\[org\]\/items\/\[id\]\/index\.js/)
  assert.deepEqual(plan.routes.find(route => route.route.includes("[org]")).params, [{ name: "org", id: "p0" }, { name: "id", id: "p1" }])
  assert.deepEqual(plan.routes.find(route => route.route.includes("[org]")).effects[0].dependencies, ["p0", "p1"])
  assert.equal(plan.routes.find(route => route.route.endsWith("/new")).params.length, 0)
  assert.deepEqual(plan.rewrites, afterBuild.rewrites)
  assert.equal(afterBuild.base, "/%ED%8F%AC%ED%84%B8")
  assert.deepEqual(plan.rewrites[0].pattern, "/%ED%8F%AC%ED%84%B8/orgs/[org]/items/[id]")
  assert.deepEqual(plan.rewrites[0].file, "orgs/[org]/items/[id]/index.html")
  const paramModule = new URL("./fixtures/runtime-params/dist/assets/params/orgs/[org]/items/[id]/index.js", import.meta.url).href
  const runParamModule = pathname => spawnSync(process.execPath, ["--input-type=module", "-e", `globalThis.location={pathname:${JSON.stringify(pathname)}};globalThis.document={body:{dataset:{}},querySelectorAll:()=>[]};await import(${JSON.stringify(`${paramModule}?path=${encodeURIComponent(pathname)}`)})`], { encoding: "utf8" })
  assert.equal(runParamModule("/%ED%8F%AC%ED%84%B8/orgs/acme/items/report.json").status, 0)
  assert.equal(runParamModule("/%ed%8f%ac%ed%84%b8/orgs/acme/items/report.json").status, 0)
  assert.equal(runParamModule("/%ED%8F%AC%ED%84%B8/orgs/acme/items/report%2Ejson").status, 0)
  for (const pathname of [
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/%2F",
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/%252f",
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/%252e%252e",
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/%C2%85",
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/%E0%A4%A",
    "/%ED%8F%AC%ED%84%B8/orgs/acme/items/../secret"
  ]) assert.notEqual(runParamModule(pathname).status, 0, pathname)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runRuntimeParamsBrowserTest(fixture, chrome)
})

test("rejects invalid runtime route declarations", () => {
  for (const [fixture, message] of [
    ["runtime-params-invalid-static", /runtimeParams requires a bracket page/],
    ["runtime-params-invalid-value", /runtimeParams must be exactly true/],
    ["runtime-params-invalid-paths", /cannot be combined with getStaticPaths/],
    ["runtime-params-invalid-partial", /must occupy a complete path segment/],
    ["runtime-params-invalid-hook", /useParams\(\) requires export const runtimeParams = true/],
    ["runtime-params-invalid-duplicate", /duplicate runtime parameter "id"/],
    ["runtime-params-invalid-name", /invalid runtime parameter name "bad-name"/],
    ["runtime-params-invalid-catchall", /Catch-all routes are not supported/],
    ["runtime-params-invalid-ambiguous", /Ambiguous runtime routes/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL(`./fixtures/${fixture}`, import.meta.url), encoding: "utf8" })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
})

test("orders overlapping runtime rewrites by specificity", async t => {
  const fixture = new URL("./fixtures/runtime-params-specificity", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/runtime-params-specificity/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/runtime-params-specificity/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const plan = JSON.parse(await readFile(new URL("./fixtures/runtime-params-specificity/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  assert.deepEqual(plan.rewrites.map(rewrite => rewrite.pattern), ["/items/new/[tab]", "/items/[id]/[tab]"])
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
  assert.match(commandRuntime, /\["change","click"\]/)
  assert.match(bindingRuntime, /patchBinding|data-k-bind/)
  assert.doesNotMatch(bindingRuntime, /Reactive text marker has no end|k-text:/)
  assert.match(bindingRuntime, /kudzu-style\.js/)
  assert.equal(existsSync(new URL("./fixtures/bindings/dist/assets/kudzu-style.js", import.meta.url)), true)
  assert.match(serialization, /as deserialize/)
  assert.match(bindings, /as binding0/)
  assert.match(bindings, /\.get\("active"\)/)
  assert.match(bindings, /\.scope\("activeClass"\)/)
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
  const serialization = await readFile(new URL("./fixtures/conditionals/dist/assets/kudzu-serialization.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/conditionals/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]

  assert.match(component, /__kConditional/)
  assert.match(component, /function EarlyReturn[\s\S]*return __kConditional/)
  assert.match(component, /function AssignedLocal[\s\S]*const view = __kConditional/)
  assert.doesNotMatch(component, /value: __kBinding\([^)]*setContextCount/)
  assert.match(html, /data-k-if=/)
  assert.match(html, /data-k-if-end="c0"/)
  assert.match(html, /Closed state/)
  assert.match(html, /Static condition/)
  assert.match(html, /Static local/)
  assert.match(html, /Local closed/)
  assert.match(html, /data-context="true" class="theme-light"/)
  assert.match(html, /data-theme="nested" class="theme-nested">nested/)
  assert.match(html, /data-theme="default" class="theme-default">default/)
  assert.match(html, /data-k-state=/)
  assert.match(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.match(html, /kudzu-native\.js/)
  assert.match(runtime, /template\[data-k-if\]/)
  assert.match(commandRuntime, /\["click"\]/)
  assert.match(nativeRuntime, /\["click"\]/)
  assert.match(serialization, /setter/)
  assert.match(evaluators, /as binding/)
  assert.doesNotMatch(evaluators, /\beval\b|new Function/)
  assert.equal(plan.conditions.length, 17)
  assert.ok(plan.events.some(event => event.native))
  assert.ok(plan.events.some(event => (JSON.stringify(event.native?.scope) ?? "").includes('"type":"setter"')))
  assert.ok(plan.bindings.some(binding => (JSON.stringify(binding.scope) ?? "").includes('"type":"state"')))
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runConditionalBrowserTest(fixture, chrome)
})

test("rejects effectful reactive render statements", () => {
  const fixture = new URL("./fixtures/conditional-invalid-statement", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /must use terminal returns or exhaustive adjacent JSX assignment/)
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
  assert.match(component, /const rows = undefined/)
  assert.match(component, /const unusedRows = undefined/)
  assert.match(component, /__kListExpression/)
  assert.match(component, /__kListConditional/)
  assert.match(component, /__kListItem/)
  assert.match(component, /function TableRow\(\{ item \}\)/)
  assert.match(component, /"data-row": __kListField/)
  assert.doesNotMatch(component.slice(component.indexOf("function ItemRow"), component.indexOf("function TableRow")), /__kList/)
  assert.match(html, /<li data-id="1".*>.*Oak/)
  assert.match(html, /<tr data-row="2"/)
  assert.match(html, /data-static.*Static/)
  assert.doesNotMatch(html, /data-k-list-item/)
  assert.match(html, /data-k-list-text="name"/)
  assert.match(html, /data-k-list-attrs=/)
  assert.match(html, /class="active" aria-label="Oak item"/)
  assert.match(html, /style="opacity:1;border-width:1px;--tone:warm"/)
  assert.match(html, /style="color:brown"/)
  assert.match(html, /OAK<template data-k-list-expression-end><\/template> tree/)
  assert.match(html, /data-k-list-expression=/)
  assert.match(html, /data-k-list-expression-attrs=/)
  assert.match(html, /data-k-list-condition=/)
  assert.match(html, /data-k-list-condition-end/)
  assert.match(html, /data-k-list-events=/)
  assert.match(html, /data-k-native-click=/)
  assert.match(html, /kudzu-list\.js/)
  assert.match(html, /kudzu-native\.js/)
  assert.match(runtime, /kudzu-style\.js/)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-style.js", import.meta.url)), true)
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-binding.js", import.meta.url)), false)
  assert.match(runtime, /Keyed list state must remain an array/)
  assert.match(runtime, /Keyed list condition marker has no end/)
  assert.doesNotMatch(runtime, /\beval\b|new Function/)
  assert.match(handlers, /as handler/)
  assert.match(handlers, /as listExpression/)
  assert.match(handlers, /\.scope\("item"\)/)
  assert.doesNotMatch(handlers, /\beval\b|new Function/)
  assert.equal(plan.lists.length, 3)
  assert.equal(plan.lists[0].state, "s0")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runListBrowserTest(fixture, chrome)
})

test("specializes relative imported keyed list components", async t => {
  const fixture = new URL("./fixtures/imported-lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/imported-lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/imported-lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/imported-lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/imported-lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const handlers = await readFile(new URL("./fixtures/imported-lists/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/imported-lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-default-list.*data-default="1".*OAK.*data-aliased-list.*data-named="1".*data-barrel-list.*data-named="1"/s)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 3)
  assert.match(handlers, /as handler/)
  assert.equal(plan.lists.length, 3)
})

test("rejects package imported and cyclic re-exported keyed list components", () => {
  for (const [fixture, message] of [
    ["imported-list-invalid-package", /must be declared locally or imported from a relative TypeScript module/],
    ["imported-list-invalid-cycle", /Imported keyed list component re-export cycle/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL(`./fixtures/${fixture}`, import.meta.url), encoding: "utf8" })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
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
  const runtime = await readFile(new URL("./fixtures/list-expressions/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  assert.match(html, /kudzu-list\.js/)
  assert.doesNotMatch(html, /kudzu-binding\.js|kudzu-native\.js|kudzu-serialization\.js/)
  assert.equal(existsSync(new URL("./fixtures/list-expressions/dist/assets/kudzu-native.js", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/list-expressions/dist/assets/kudzu-serialization.js", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/list-expressions/dist/assets/kudzu-style.js", import.meta.url)), false)
  assert.match(handlers, /as listExpression/)
  assert.doesNotMatch(runtime, /data-k-list-condition|Keyed list condition marker has no end/)
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
    ["list-invalid-shape", /cannot use rest, defaults, or nested destructuring/],
    ["list-invalid-condition", /Keyed list item conditions must read the item/],
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
    ["list-invalid-style", /style must be an object/],
    ["list-invalid-alias-reuse", /Keyed list local "rows" must be rendered exactly once/],
    ["list-invalid-alias-use", /Keyed list local "rows" may only be used as a JSX child/],
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

test("compiles mount effects to route-specific ESM", async t => {
  const fixture = new URL("./fixtures/effects", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effects/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effects/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/effects/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/effects/dist/static/index.html", import.meta.url), "utf8")
  const onlyHtml = await readFile(new URL("./fixtures/effects/dist/only/index.html", import.meta.url), "utf8")
  const entry = await readFile(new URL("./fixtures/effects/dist/assets/effects/index.js", import.meta.url), "utf8")
  const dynamicEntry = await readFile(new URL("./fixtures/effects/dist/assets/effects/oak/index.js", import.meta.url), "utf8")
  const handlers = await readFile(new URL("./fixtures/effects/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const plans = JSON.parse(await readFile(new URL("./fixtures/effects/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, />Loading<.*>pending</s)
  assert.doesNotMatch(html, />Loaded<|>Oak<|>Pine</)
  assert.match(html, /kudzu-binding\.js.*kudzu-list\.js.*assets\/effects\/index\.js/s)
  assert.doesNotMatch(html, /<script[^>]+kudzu-native\.js/)
  assert.doesNotMatch(staticHtml, /<script|data-k-state/)
  assert.match(onlyHtml, /kudzu\.js.*effects\/only\/index\.js/s)
  assert.doesNotMatch(onlyHtml, /kudzu-binding\.js|kudzu-list\.js|<script[^>]+kudzu-native\.js/)
  assert.match(entry, /kudzu-effect\.js/)
  assert.match(entry, /effect0/)
  assert.match(entry, /effect1/)
  assert.match(handlers, /fetch\("\/api\/items\.json"\)/)
  assert.match(handlers, /\.set\("second"/)
  assert.notEqual(dynamicEntry, entry)
  assert.match(dynamicEntry, /handlers\/pages\/\[slug\]\.js/)
  assert.equal(plans.find(plan => plan.route === "/").effects.length, 12)
  assert.equal(plans.find(plan => plan.route === "/static").effects.length, 0)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runEffectBrowserTest(fixture, chrome)
})

test("runs mount effect cleanup once on document disposal", async t => {
  const fixture = new URL("./fixtures/effect-cleanup", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effect-cleanup/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effect-cleanup/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const entryUrl = new URL("./fixtures/effect-cleanup/dist/assets/effects/index.js", import.meta.url)
  const entry = await readFile(entryUrl, "utf8")
  const runtime = await readFile(new URL("./fixtures/effect-cleanup/dist/assets/kudzu.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/effect-cleanup/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(entry, /registerUnmountHook.*pagehide/s)
  assert.doesNotMatch(runtime, /registerUnmountHook/)
  assert.deepEqual(plan.effects.map(effect => effect.cleanup), [true, true, true])

  const browser = spawnSync(process.execPath, ["--input-type=module", "-e", `
const listeners = new Map()
globalThis.document = { body: { dataset: { kState: JSON.stringify([["s0", "resize"]]) } }, querySelectorAll: () => [], addEventListener() {} }
globalThis.addEventListener = (name, listener) => listeners.set(name, listener)
await import(${JSON.stringify(entryUrl.href)})
if (document.body.dataset.mountedResource !== "local") throw new Error("mount")
listeners.get("pagehide")({ persisted: true })
if (document.body.dataset.cleanup) throw new Error("persisted")
listeners.get("pagehide")({ persisted: false })
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.cleanup !== "local:1" || document.body.dataset.cleanupEvent !== "resize" || document.body.dataset.cleanupAccessor !== "resize" || document.body.dataset.cleanupMethod !== "method" || document.body.dataset.laterCleanup !== "ran") throw new Error("cleanup")
listeners.get("pagehide")({ persisted: false })
if (document.body.dataset.cleanup !== "local:1") throw new Error("repeat")
`], { encoding: "utf8" })
  assert.equal(browser.status, 0, `${browser.stdout}\n${browser.stderr}`)
})

test("reruns primitive dependency effects after cleanup", async t => {
  const fixture = new URL("./fixtures/effect-dependencies", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effect-dependencies/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effect-dependencies/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const entryUrl = new URL("./fixtures/effect-dependencies/dist/assets/effects/index.js", import.meta.url)
  const runtimeUrl = new URL("./fixtures/effect-dependencies/dist/assets/kudzu-deps.js", import.meta.url)
  const entry = await readFile(entryUrl, "utf8")
  const runtime = await readFile(runtimeUrl, "utf8")
  const html = await readFile(new URL("./fixtures/effect-dependencies/dist/index.html", import.meta.url), "utf8")
  const commandHtml = await readFile(new URL("./fixtures/effect-dependencies/dist/command/index.html", import.meta.url), "utf8")
  const commandRuntime = await readFile(new URL("./fixtures/effect-dependencies/dist/assets/kudzu.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/effect-dependencies/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.effects.length)
  assert.match(entry, /registerCommitter/)
  assert.match(runtime, /registerCommitter/)
  assert.match(html, /kudzu-deps\.js/)
  assert.match(html, /\/docs&amp;notes\/assets\/kudzu-deps\.js/)
  assert.match(html, /data-runtime-link="\/assets\/kudzu\.js"/)
  assert.doesNotMatch(commandHtml, /kudzu-deps\.js/)
  assert.doesNotMatch(commandRuntime, /registerCommitter/)
  assert.doesNotMatch(commandRuntime, /kState/)
  assert.match(runtime, /kState/)
  assert.deepEqual(plan.effects.map(effect => effect.dependencies), [["s0", "s1"], ["s0"]])

  const browser = spawnSync(process.execPath, ["--input-type=module", "-e", `
const listeners = new Map()
const stateNodes = [{ dataset: { kText: "s0", kValue: "0" }, textContent: "0" }, { dataset: { kText: "s1", kValue: "1" }, textContent: "1" }]
globalThis.document = { body: { dataset: { kState: JSON.stringify([["s2", "dependency-only"]]) } }, querySelectorAll: selector => selector === "[data-k-text]" ? stateNodes : [], addEventListener() {} }
globalThis.addEventListener = (name, listener) => listeners.set(name, listener)
await import(${JSON.stringify(entryUrl.href)})
const runtime = await import(${JSON.stringify(runtimeUrl.href)})
const initial = "|setup 0:1|second setup 0"
if (document.body.dataset.effectLog !== initial) throw new Error("initial")
runtime.applyCommands(runtime.browserState, [["add", "s0", 1], ["add", "s1", 1]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
const rerun = initial + "|cleanup 0:1|second cleanup 0|setup 1:2|second setup 1"
if (document.body.dataset.effectLog !== rerun) throw new Error("rerun: " + document.body.dataset.effectLog)
runtime.applyCommands(runtime.browserState, [["add", "s0", 0]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.effectLog !== rerun) throw new Error("equal")
listeners.get("pagehide")({ persisted: false })
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.effectLog !== rerun + "|cleanup 1:2|second cleanup 1") throw new Error("dispose")
`], { encoding: "utf8" })
  assert.equal(browser.status, 0, `${browser.stdout}\n${browser.stderr}`)
})

test("specializes one primitive dependency effect", async t => {
  const fixture = new URL("./fixtures/effect-dependency-fast", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effect-dependency-fast/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effect-dependency-fast/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const entryUrl = new URL("./fixtures/effect-dependency-fast/dist/assets/effects/index.js", import.meta.url)
  const runtimeUrl = new URL("./fixtures/effect-dependency-fast/dist/assets/kudzu-deps.js", import.meta.url)
  const entry = await readFile(entryUrl, "utf8")
  assert.doesNotMatch(entry, /new Map|new Set|\.sort\(/)
  assert.equal(existsSync(new URL("./fixtures/effect-dependency-fast/dist/assets/kudzu.js", import.meta.url)), false)

  const browser = spawnSync(process.execPath, ["--input-type=module", "-e", `
const listeners = new Map()
globalThis.document = { body: { dataset: { kState: JSON.stringify([["s0", "resize"]]) } }, querySelectorAll: () => [], addEventListener() {} }
globalThis.addEventListener = (name, listener) => listeners.set(name, listener)
await import(${JSON.stringify(entryUrl.href)})
const runtime = await import(${JSON.stringify(runtimeUrl.href)})
if (document.body.dataset.fastLog !== "|setup resize") throw new Error("initial")
runtime.applyCommands(runtime.browserState, [["set", "s0", "scroll"]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.fastLog !== "|setup resize|cleanup resize|setup scroll") throw new Error("rerun")
runtime.applyCommands(runtime.browserState, [["set", "s0", "scroll"]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.fastLog !== "|setup resize|cleanup resize|setup scroll") throw new Error("equal")
runtime.applyCommands(runtime.browserState, [["set", "s0", { invalid: true }]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.fastLog !== "|setup resize|cleanup resize|setup scroll") throw new Error("invalid")
runtime.applyCommands(runtime.browserState, [["set", "s0", "resize"]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.fastLog !== "|setup resize|cleanup resize|setup scroll|cleanup scroll|setup resize") throw new Error("recovery")
`], { encoding: "utf8" })
  assert.equal(browser.status, 0, `${browser.stdout}\n${browser.stderr}`)
})

test("rejects unsupported mount effect forms", () => {
  for (const [fixture, message] of [
    ["effect-invalid-dependencies", /dependencies must be direct state or runtime parameter identifiers/],
    ["effect-invalid-dependency-array", /dependencies must be a literal array/],
    ["effect-invalid-dependency-local", /dependencies must be primitive Kudzu state or runtime parameter identifiers/],
    ["effect-invalid-dependency-object", /dependencies must be primitive Kudzu state or runtime parameter identifiers/],
    ["effect-invalid-cleanup", /async callbacks cannot return cleanup functions/],
    ["effect-invalid-cleanup-shape", /cleanup functions cannot declare parameters or be generators/],
    ["effect-invalid-cleanup-generator", /cleanup functions cannot declare parameters or be generators/],
    ["effect-invalid-generator", /callback cannot be a generator/],
    ["effect-invalid-return", /return values must be inline cleanup functions/],
    ["effect-invalid-named", /callback function must be anonymous/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL(`./fixtures/${fixture}`, import.meta.url), encoding: "utf8" })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
})

test("does not promote effect-only builds to the shared runtime", async t => {
  const fixture = new URL("./fixtures/effect-isolation", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effect-isolation/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effect-isolation/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const command = await readFile(new URL("./fixtures/effect-isolation/dist/command/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/effect-isolation/dist/assets/kudzu.js", import.meta.url), "utf8")
  const effectRuntime = await readFile(new URL("./fixtures/effect-isolation/dist/assets/kudzu-effect.js", import.meta.url), "utf8")
  assert.doesNotMatch(command, /effects\//)
  assert.doesNotMatch(runtime, /registerMountHook|registerCommitter/)
  assert.doesNotMatch(effectRuntime, /deserialize|kudzu-serialization/)
  assert.equal(existsSync(new URL("./fixtures/effect-isolation/dist/assets/kudzu-serialization.js", import.meta.url)), false)
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
  assert.match(handlerSource, /async function/)
  assert.match(handlerSource, /as handler0/)
  assert.match(handlerSource, /Math\.max/)
  assert.match(handlerSource, /Promise\.resolve/)
  assert.doesNotMatch(handlerSource, /modules\/helpers\.js/)
  assert.equal(existsSync(new URL("./fixtures/native/dist/assets/modules", import.meta.url)), false)
  assert.match(handlerSource, /\.get\("count"\)/)
  assert.match(handlerSource, /\.set\("count"/)
  assert.match(handlerSource, /\.scope\("step"\)/)
  assert.match(handlerSource, /\.scope\("increment"\)/)
  assert.doesNotMatch(commandRuntime, /createNativeContext|data-k-native/)
  assert.doesNotMatch(commandRuntime, /\["click"\]/)
  assert.match(nativeRuntime, /createNativeContext/)
  assert.match(nativeRuntime, /\["click"\]/)
  assert.match(serialization, /as deserialize/)
  assert.doesNotMatch(handlerSource, /\beval\b|new Function/)
  assert.equal(native.scope.step, 2)
  assert.equal(native.scope.increment, 1)
  assert.equal("offset" in native.scope || "Math" in native.scope || "helpers" in native.scope, false)

  const state = new Map([["s0", 0]])
  const commits = []
  const context = createNativeContext(state, { count: "s0" }, (id, value) => commits.push([id, value]), native.scope)
  const handlers = await import(`${new URL("./fixtures/native/dist/assets/handlers/pages/index.js", import.meta.url).href}?v=${Date.now()}`)
  await handlers.handler0(context, { currentTarget: { dataset: { enabled: "yes" } } })
  await Promise.resolve()
  assert.equal(state.get("s0"), 7)
  assert.deepEqual(commits, [["s0", 6], ["s0", 7]])
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
  const bindingRuntime = await readFile(new URL("./fixtures/native-bubbling/dist/assets/kudzu-binding.js", import.meta.url), "utf8")
  assert.doesNotMatch(html, /"flags":/)
  assert.match(runtime, /addEventListener/)
  assert.match(runtime, /removeEventListener/)
  assert.match(html, /data-k-text-bindings=/)
  assert.match(html, /id="object-state"><!--k-text:\d+-->28<!--k-text-end-->° <!--k-text:\d+-->Warm<!--k-text-end--><\/p>/)
  assert.doesNotMatch(html, /data-k-bind-text/)
  assert.match(bindingRuntime, /Reactive text marker has no end/)
  assert.match(runtime, /\/assets\/handlers\/Parent\.js/)
  assert.match(runtime, /\/assets\/handlers\/pages\/index\.js/)
  assert.equal(existsSync(new URL("./fixtures/native-bubbling/dist/assets/modules", import.meta.url)), false)
  assert.match(html, /id="focus-target" data-k-ref="r0"/)
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

test("rejects unsupported imports in client helpers", async t => {
  t.after(async () => {
    await rm(new URL("./fixtures/native-invalid-helper/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native-invalid-helper/dist", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native-invalid-require/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native-invalid-require/dist", import.meta.url), { recursive: true, force: true })
  })
  for (const [fixture, message] of [
    ["native-invalid-helper", /Imported client helpers may only use relative runtime imports/],
    ["native-invalid-require", /require\(\) is not supported in imported client helpers/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], {
      cwd: new URL(`./fixtures/${fixture}`, import.meta.url),
      encoding: "utf8"
    })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
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
  const port = 38000 + process.pid % 1000
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
  const context = document.querySelector("[data-context]")
  context.click()
  await wait()
  if (document.body.dataset.theme !== "light") throw new Error("context-handler-initial")
  control("theme").click()
  await wait()
  if (context.textContent !== "dark" || context.className !== "theme-dark" || document.querySelector('[data-theme="nested"]').textContent !== "nested" || document.querySelector('[data-theme="default"]').textContent !== "default") throw new Error("context-update")
  context.click()
  await wait()
  if (document.body.dataset.theme !== "dark") throw new Error("context-handler-update")
  const outerCounter = document.querySelector('[data-counter="outer"]')
  const nestedCounter = document.querySelector('[data-counter="nested"]')
  outerCounter.querySelector("[data-context-double]").click()
  await wait()
  if (outerCounter.querySelector("span").textContent !== "2" || outerCounter.dataset.value !== "2" || nestedCounter.querySelector("span").textContent !== "10") throw new Error("object-context-double")
  outerCounter.querySelector("[data-context-functional]").click()
  await wait()
  if (outerCounter.querySelector("span").textContent !== "3") throw new Error("object-context-functional")
  document.querySelector("[data-context-destructured]").click()
  await wait()
  if (outerCounter.querySelector("span").textContent !== "4" || document.querySelector("[data-context-destructured]").textContent !== "4") throw new Error("object-context-destructured")
  nestedCounter.querySelector("[data-context-double]").click()
  await wait()
  if (nestedCounter.querySelector("span").textContent !== "12" || outerCounter.querySelector("span").textContent !== "4") throw new Error("object-context-nested")
  if (document.querySelector("[data-block-local]").textContent !== "Block closed" || document.querySelector("[data-early]").textContent !== "Early closed" || document.querySelector("[data-assigned]").textContent !== "Assigned closed" || document.querySelector("[data-nested-early]").textContent !== "Nested closed") throw new Error("statement-conditions-initial")
  control("hidden").click()
  await wait()
  control("open").click()
  await wait()
  let section = document.querySelector("main > section")
  if (!section || section.className !== "new" || section.dataset.count !== "0" || section.getAttribute("aria-live") !== "off" || section.querySelector("input").value !== "0" || section.querySelector("select").value !== "zero" || section.querySelector("u").textContent !== "1" || !document.body.textContent.includes("Child open") || !document.body.textContent.includes("Visible text") || !document.body.textContent.includes("Local open") || document.querySelector("td").textContent !== "Open row") throw new Error("open")
  if (document.querySelector("[data-block-local]").textContent !== "Block open" || document.querySelector("[data-early]").textContent !== "Early open" || document.querySelector("[data-assigned]").textContent !== "Assigned open" || document.querySelector("[data-nested-early]").textContent !== "Nested zero") throw new Error("statement-conditions-open")
  section.querySelectorAll("button")[0].click()
  await wait()
  section = document.querySelector("main > section")
  if (section.className !== "grown" || section.dataset.count !== "1" || section.getAttribute("aria-live") !== "polite" || section.querySelector("span").textContent !== "1" || section.querySelector("select").value !== "positive" || !section.textContent.includes("Positive")) throw new Error("grow")
  if (document.querySelector("[data-nested-early]").textContent !== "Nested positive") throw new Error("statement-conditions-nested")
  if (!section.querySelector("mark")) throw new Error("and")
  section.querySelector("[data-uncontrolled]").value = "changed"
  control("close").click()
  await wait()
  if (document.querySelector("main > section") || !document.body.textContent.includes("Closed state") || document.body.textContent.includes("Local open")) throw new Error("close")
  if (document.querySelector("[data-block-local]").textContent !== "Block closed" || document.querySelector("[data-early]").textContent !== "Early closed" || document.querySelector("[data-assigned]").textContent !== "Assigned closed" || document.querySelector("[data-nested-early]").textContent !== "Nested closed") throw new Error("statement-conditions-close")
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
  document.querySelector("[data-static] [data-finish]").click()
  document.querySelector("[data-static] [data-remove]").click()
  await wait()
  if (document.body.dataset.staticFinish !== "yes" || document.body.dataset.staticRemove !== "yes") throw new Error("component-normal-callbacks")
  const initialOak = document.querySelector('[data-id="1"]')
  if (initialOak.querySelector("span").textContent !== "OAK tree" || initialOak.className !== "active" || initialOak.getAttribute("aria-label") !== "Oak item" || initialOak.style.opacity !== "1" || initialOak.style.borderWidth !== "1px" || initialOak.style.getPropertyValue("--tone") !== "warm" || initialOak.querySelector("small").style.color !== "brown") throw new Error("initial-derived")
  if (!initialOak.querySelector("[data-finish]") || initialOak.querySelector("[data-and]") || document.querySelector('[data-id="2"] [data-status]').textContent !== "Pine complete" || !document.querySelector('[data-id="2"] [data-and]')) throw new Error("initial-condition")
  click("add")
  await wait()
  if (document.querySelectorAll("[data-list] > li").length !== 3 || !document.body.textContent.includes("ELM tree") || document.querySelectorAll("tbody > tr").length !== 3) throw new Error("add")
  document.querySelector('[data-id="3"] [data-finish]').click()
  await wait()
  if (document.querySelector('[data-id="3"] [data-status]').textContent !== "Elm complete") throw new Error("new-condition-handler")
  let movedOnUpdate = false
  const observer = new MutationObserver(() => { movedOnUpdate = true })
  observer.observe(document.querySelector("[data-list]"), { childList: true })
  click("rename")
  await wait()
  observer.disconnect()
  const oak = document.querySelector('[data-id="1"]')
  if (movedOnUpdate) throw new Error("update-moved")
  if (oak.querySelector("span").textContent !== "RED OAK tree") throw new Error("update-text")
  if (oak.querySelector("small").textContent !== "Red oak" || oak.querySelector("[data-status]").textContent !== "Red oak complete" || !oak.querySelector("[data-and]")) throw new Error("update-branch")
  if (oak.className !== "done" || oak.getAttribute("aria-label") !== "Red oak item" || oak.style.opacity !== "0.5" || oak.style.borderWidth !== "2px" || oak.style.getPropertyValue("--tone") !== "hot" || oak.querySelector("small").style.color !== "brown") throw new Error("update-attributes")
  if (!oak.querySelector("[data-remove]").dataset.kNativeClick.includes("Red oak") || document.querySelector('[data-row="1"] td').textContent !== "Red oak") throw new Error("update-metadata")
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

async function runEffectBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 100))
try {
  await wait()
  const main = document.querySelector("main")
  if (main.dataset.label !== "Loaded" || main.querySelector("h1").textContent !== "Loaded") throw new Error("text-attribute")
  if (!main.querySelector("[data-ready]") || main.querySelector("[data-second]").textContent !== "complete") throw new Error("condition-setter-reference")
  if (main.querySelector("[data-after-failure]").textContent !== "continued") throw new Error("failure-isolation")
  if ([...main.querySelectorAll("[data-items] li")].map(node => node.textContent).join(",") !== "Oak,Pine") throw new Error("list")
  if (document.body.dataset.shadowedSetter !== "local") throw new Error("setter-shadow")
  if (document.body.dataset.shorthandState !== "shorthand") throw new Error("shorthand-state-setter")
  if (document.body.dataset.catchShadow !== "catch" || document.body.dataset.forShadow !== "for" || document.body.dataset.varShadow !== "var") throw new Error("lexical-shadow")
  if (document.body.dataset.switchShadow !== "switch") throw new Error("switch-shadow")
  if (document.body.dataset.outerCapture !== "outer" || document.body.dataset.innerShadow !== "inner") throw new Error("nested-capture-shadow")
  if (document.body.dataset.laterCapture !== "later" || main.querySelector("[data-later-state]").textContent !== "after") throw new Error("deferred-capture")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const onlyUrl = new URL("only/index.html", output)
  const onlyHtml = await readFile(onlyUrl, "utf8")
  await writeFile(onlyUrl, onlyHtml.replace("</body>", '<script type="module" src="/only-browser-test.js"></script></body>'))
  await writeFile(new URL("only-browser-test.js", output), `
await new Promise(resolve => setTimeout(resolve, 50))
document.body.dataset.browserTest = document.querySelector("[data-only]").textContent === "after" ? "pass" : "fail-effect-only"
`)
  const port = 45000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url === "/" ? "index.html" : request.url.slice(1)
  const file = path.join(root, relative.endsWith("/") ? relative + "index.html" : relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".json") ? "application/json" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
    const effectOnly = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/only/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(effectOnly.status, 0, effectOnly.stderr)
    assert.match(effectOnly.stdout, /data-browser-test="pass"/)
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
  document.querySelector("#focus-ref").click()
  await wait()
  if (document.activeElement?.id !== "focus-target" || document.body.dataset.ref !== "focus-target") throw new Error("object-ref")
  if (document.querySelector("#object-state").textContent !== "28° Warm" || document.querySelector("#object-state").children.length) throw new Error("object-state-initial")
  if (document.querySelector("#object-cell").textContent !== "WARM" || document.querySelector("#object-option").textContent !== "Warm" || document.querySelector("#object-svg").textContent !== "28" || document.querySelector("#object-condition").textContent !== "warm") throw new Error("object-context-initial")
  document.querySelector("#hide-object").click()
  await wait()
  if (document.querySelector("#object-condition") || document.querySelector("#object-state").textContent !== "0° Idle") throw new Error("object-condition-unmount")
  document.querySelector("#update-object").click()
  await wait()
  if (document.querySelector("#object-state").textContent !== "21° Cool" || document.querySelector("#object-state").children.length) throw new Error("object-state-update")
  if (document.querySelector("#object-cell").textContent !== "COOL" || document.querySelector("#object-option").textContent !== "Cool" || document.querySelector("#object-svg").textContent !== "21" || document.querySelector("#object-condition").textContent !== "cool") throw new Error("object-context-update")
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

async function runDynamicBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("posts/oak/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/newsletter/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  if (document.querySelector("article strong").textContent !== "Oak body") throw new Error("raw-html")
  if (document.querySelector("[data-mounted]").textContent !== "Oak") throw new Error("mount-effect-props")
  document.querySelector("button").click()
  await wait()
  if (document.querySelector("button").textContent !== "Saved" || document.body.dataset.saved !== "Oak") throw new Error("dynamic-props")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}

`)
  const port = 43000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url.replace(/^\\/newsletter\\/?/, "") || "index.html"
  const file = path.join(root, relative.endsWith("/") ? relative + "index.html" : relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/newsletter/posts/oak/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runRuntimeParamsBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const fallbackUrl = new URL("orgs/[org]/items/[id]/index.html", output)
  const html = await readFile(fallbackUrl, "utf8")
  await writeFile(fallbackUrl, html.replace("</body>", '<script type="module" src="/포털/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  const main = document.querySelector("main")
  const id = "550e8400-e29b-41d4-a716-446655440000"
  if (main.dataset.org !== "acme" || main.dataset.id !== id) throw new Error("attributes")
  if (main.querySelector("h1").textContent !== "acme" || main.querySelector("[data-child]").textContent !== id) throw new Error("direct-text")
  if (main.querySelector("[data-derived]").textContent !== "Item " + id + " in acme") throw new Error("derived-text")
  if (main.querySelector("[data-edit]").getAttribute("href") !== "/포털/orgs/acme/items/" + id + "/edit") throw new Error("href")
  if (main.querySelector("[data-status]").textContent !== "acme/" + id || document.body.dataset.effectParams !== "acme:" + id) throw new Error("effect")
  main.querySelector("button").click()
  await wait()
  if (document.body.dataset.eventParams !== "acme:" + id) throw new Error("event")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = 44000 + process.pid % 1000
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2]), fallback = path.join(root, "orgs/[org]/items/[id]/index.html")
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
  let relative = pathname.replace(/^\\/포털\\/?/, "") || "index.html"
  let file = path.join(root, relative.endsWith("/") ? relative + "index.html" : relative)
  if (!fs.existsSync(file) && /^orgs\\/[^/]+\\/items\\/[^/]+$/.test(relative)) file = fallback
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await new Promise(resolve => setTimeout(resolve, 200))
  try {
    const id = "550e8400-e29b-41d4-a716-446655440000"
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/포털/orgs/acme/items/${id}?view=full`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}
