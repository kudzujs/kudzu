import assert from "node:assert/strict"
import { existsSync as fileExistsSync } from "node:fs"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { spawn, spawnSync } from "node:child_process"
import { gzipSync } from "node:zlib"
import { createConnection } from "node:net"
import test from "node:test"
import { build, normalizeNavigation, specializeRuntime, writeRouteEntry } from "../framework/build.mjs"
import { behavior, conditional, createContext, list, listConditional, nativeBehavior, renderPage, useContext, useEffect, useId, useParams, useRef, useState } from "../framework/core.mjs"
import { jsx } from "../framework/jsx-runtime.mjs"
import { applyCommands } from "../framework/runtime.js"
import { patchBinding } from "../framework/binding-runtime.js"
import { createNativeContext } from "../framework/native-runtime.js"

const chromePaths = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean)
const existsSync = path => process.env.KUDZU_SKIP_BROWSER && chromePaths.includes(path) ? false : fileExistsSync(path)

if (process.env.KUDZU_REQUIRE_CHROME && !chromePaths.some(fileExistsSync)) throw new Error("Chrome is required for framework browser tests; set CHROME_BIN to an executable Chrome or Chromium binary")

// Keep fixture listeners outside the ephemeral range used by headless Chrome.
let browserPort = 10000 + process.pid % 10000
const nextBrowserPort = () => browserPort++

test("reuses only exact route-entry transforms within one build", async () => {
  const transforms = new Map()
  const writes = []
  let calls = 0
  const transform = async source => ({ code: `compiled:${source}:${++calls}` })
  const write = async (file, code) => writes.push([file, code])

  await writeRouteEntry("first.js", "same", true, transforms, transform, write)
  await writeRouteEntry("second.js", "same", true, transforms, transform, write)
  await writeRouteEntry("third.js", "different", true, transforms, transform, write)
  await writeRouteEntry("next-build.js", "same", true, new Map(), transform, write)

  assert.equal(calls, 3)
  assert.deepEqual(writes, [
    ["first.js", "compiled:same:1"],
    ["second.js", "compiled:same:1"],
    ["third.js", "compiled:different:2"],
    ["next-build.js", "compiled:same:3"]
  ])
})

const inspectSourceResult = (fixture, file) => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `
const { build } = await import(${JSON.stringify(new URL("../framework/build.mjs", import.meta.url).href)})
const result = await build({ quiet: true })
process.stdout.write(JSON.stringify(result.sourceResults.find(source => source.file === ${JSON.stringify(file)})))
`], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  return JSON.parse(result.stdout)
}

test("builds TSX into HTML and behavior commands without React", async () => {
  const buildResult = await build({ quiet: true })
  const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("../dist/assets/kudzu.js", import.meta.url), "utf8")
  const docs = await readFile(new URL("../dist/docs/index.html", import.meta.url), "utf8")
  const release = await readFile(new URL("../dist/releases/0.8.39/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("../.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("../.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const home = plan.routes.find(route => route.route === "/")
  const homeSource = buildResult.sourceResults.find(result => result.file === "src/pages/index.tsx")
  const homeAnalysis = homeSource.componentAnalysis

  assert.match(html, /React-shaped input.*Static-first output/s)
  assert.match(html, /property="og:image"/)
  assert.match(html, /rel="icon" href="\/favicon\.ico"/)
  assert.match(html, /data-k-on-click/)
  assert.match(html, /data-k-text="s0"/)
  assert.match(html, /<head>.*<script type="module"[^>]+kudzu\.js.*<\/head><body/s)
  assert.doesNotMatch(html.split("</head>")[1], /<script type="module"/)
  assert.match(html, /hero-code.*tok-keyword/s)
  assert.match(docs, /Zustand stores.*shared layout.*Values survive enhanced navigation.*persist\/devtools wrappers/s)
  assert.match(docs, /Compiler architecture.*ordered normalization passes.*route-specific capability ESM/s)
  assert.match(html, /class="release-banner" href="\/releases\/0\.8\.39"/)
  assert.match(release, /Kudzu 0\.8\.39.*Invalid graphs stop.*Before browsers start/s)
  assert.match(release, /PROVE · REFERENCE · GENERATE.*FAIL-CLOSED CONTRACTS.*npm install @kudzujs\/core@\^0\.8\.39/s)
  assert.match(release, /<title>Kudzu 0\.8\.39 - Fail-closed route contracts<\/title>/)
  assert.match(release, /rel="canonical" href="https:\/\/kudzujs\.cloud\/releases\/0\.8\.39"/)
  assert.match(release, /Commands target real identity.*Follow object properties/s)
  assert.doesNotMatch(release, /<script/)
  assert.doesNotMatch(component, /from ["']react["']/)
  assert.match(component, /const \[count, setCount\] = useState\(0, "count"\)/)
  assert.match(component, /__kBehavior\(\[\["add", count, 1\]\]\)/)
  assert.match(runtime, /textContent=/)
  assert.match(runtime, /\["click"\]/)
  assert.equal(runtime.trim().split("\n").length, 1)
  assert.doesNotMatch(runtime, /patchBinding|data-k-bind|deserialize/)
  assert.doesNotMatch([html, docs, runtime].join("\n"), /sessionStorage|__kudzu_state|snapshotState|restoreState|__kudzu_dev/)
  assert.deepEqual(homeAnalysis.owners.find(owner => owner.name === "HomePage").states.map(state => state.name), ["count"])
  assert.deepEqual(JSON.parse(JSON.stringify(homeAnalysis)), homeAnalysis)
  assert.equal(homeSource.handlerModule, undefined)
  assert.deepEqual(homeSource.moduleIR.handlers.map(handler => handler.kind), ["commands", "commands"])
  assert.deepEqual(homeSource.moduleIR.bindings, [])
  assert.deepEqual(JSON.parse(JSON.stringify(homeSource.moduleIR)), homeSource.moduleIR)
  assert.equal(homeSource.buildModule.path, ".kudzu/pages/index.mjs")
  assert.equal(homeSource.buildModule.code, component)
  assert.deepEqual(homeSource.importedAssets, [])
  for (const source of buildResult.sourceResults) assert.deepEqual(JSON.parse(JSON.stringify(source)), source)
  assert.ok(buildResult.sourceResults.some(source => source.moduleIR.handlers.some(handler => handler.kind === "module-export")))
  assert.ok(buildResult.sourceResults.some(source => source.moduleIR.bindings.length))
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.doesNotMatch(html, /data-k-state=/)
  assert.match(docs, /data-k-if=/)
  assert.match(docs, /kudzu-binding\.js/)
  assert.match(docs, /<script[^>]+kudzu-list\.js/)
  assert.match(docs, /LIVE KEYED LIST/)
  assert.match(docs, /Open menu/)
  assert.equal(home.version, 1)
  assert.deepEqual(home.states[0], { slot: 0, id: "s0", name: "count", initialValue: 0 })
  assert.ok(plan.routes.every(route => route.version === 1 && route.states.every((state, slot) => state.slot === slot)))
  assert.deepEqual(home.events[0].commands, [["add", "s0", 1]])
  assert.deepEqual(home.events[1].commands, [["add", "s0", 1], ["add", "s0", 1]])
  const chrome = chromePaths.find(existsSync)
  if (chrome) {
    await runReleaseNotesBrowserTest(chrome)
    await runDocsListBrowserTest(chrome)
  }
})

test("reports ordinary source graph failures before generated module loading", () => {
  const cases = [
    ["graph-invalid-page-import", /src\/pages\/index\.tsx:2:\d+ Relative runtime import "\.\/missing"/],
    ["graph-invalid-helper-import", /src\/helper\.ts:2:\d+ Relative runtime import "\.\/missing"/],
    ["graph-invalid-reexport", /src\/barrel\.ts:2:\d+ Relative runtime re-export "\.\/missing"/],
    ["graph-invalid-dynamic-import", /src\/pages\/index\.tsx:2:\d+ Dynamic import "\.\.\/helper" is not supported in ordinary source modules/]
  ]
  for (const [name, expected] of cases) {
    const fixture = new URL(`./fixtures/${name}`, import.meta.url)
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
    const output = `${result.stdout}\n${result.stderr}`
    assert.notEqual(result.status, 0)
    assert.match(output, expected)
    assert.doesNotMatch(output, /\.kudzu/)
  }
})

test("emits configured global styles in every document head", async t => {
  const fixture = new URL("./fixtures/global-styles", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/global-styles/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/global-styles/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  for (const route of ["", "about/"]) {
    const html = await readFile(new URL(`./fixtures/global-styles/dist/${route}index.html`, import.meta.url), "utf8")
    assert.match(html, /<head>.*href="\/guide\/assets\/base\.css".*href="\/guide\/assets\/generated\.css".*href="HTTPS:\/\/cdn\.example\.test\/theme\.css".*<\/head><body>/)
    assert.doesNotMatch(html.split("<body>")[1], /rel="stylesheet"/)
    assert.doesNotMatch(html, /<script/)
  }
  assert.equal(await readFile(new URL("./fixtures/global-styles/dist/assets/generated.css", import.meta.url), "utf8"), "main { color: rebeccapurple; }")
})

test("builds declarative document metadata, source styles, and public assets", async t => {
  const fixture = new URL("./fixtures/config-authoring", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/config-authoring/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/config-authoring/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const ko = await readFile(new URL("./fixtures/config-authoring/dist/ko/index.html", import.meta.url), "utf8")
  const en = await readFile(new URL("./fixtures/config-authoring/dist/en/index.html", import.meta.url), "utf8")
  assert.match(ko, /^<!doctype html><html lang="ko"><head>.*<link rel="manifest" href="\/manifest\.json">.*<link rel="stylesheet" href="\/assets\/app\.css">/)
  assert.match(ko, /<title>KO page<\/title>/)
  assert.doesNotMatch(ko, /<script/)
  assert.match(en, /^<!doctype html><html lang="en">/)
  assert.equal(await readFile(new URL("./fixtures/config-authoring/dist/assets/app.css", import.meta.url), "utf8"), "main { color: rebeccapurple; }\n")
  assert.deepEqual(JSON.parse(await readFile(new URL("./fixtures/config-authoring/dist/manifest.json", import.meta.url), "utf8")), { name: "Config fixture" })
})

test("renders page layouts with collision-free layout and route scopes", async t => {
  const fixture = new URL("./fixtures/layout-scopes", import.meta.url)
  const invalidPage = new URL("./fixtures/layout-scopes/src/pages/invalid.tsx", import.meta.url)
  t.after(async () => {
    await rm(invalidPage, { force: true })
    await rm(new URL("./fixtures/layout-scopes/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/layout-scopes/dist", import.meta.url), { recursive: true, force: true })
  })

  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/layout-scopes/dist/items/[id]/index.html", import.meta.url), "utf8")
  const plain = await readFile(new URL("./fixtures/layout-scopes/dist/plain/index.html", import.meta.url), "utf8")
  const effects = await readFile(new URL("./fixtures/layout-scopes/dist/assets/effects/items/[id]/index.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/layout-scopes/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  const scoped = plan.find(route => route.route === "/items/[id]")

  assert.match(html, /^<!doctype html><html[^>]*><head>.*<\/head><body[^>]*><div data-shell="true">/s)
  assert.match(html, /<div data-shell="true">.*<template data-k-route-start><\/template><main.*<\/main><template data-k-route-end><\/template><footer>Layout footer<\/footer><\/div><\/body><\/html>$/s)
  assert.match(html, /data-k-ref="lr0".*data-k-ref="rr0"/s)
  assert.equal(scoped.version, 1)
  assert.deepEqual(scoped.states.map(state => [state.slot, state.id, state.lifetime]), [[0, "ls0", "layout"], [1, "ls1", "layout"], [2, "rs0", "route"], [3, "rs1", "route"]])
  assert.deepEqual(scoped.params, [{ name: "id", id: "rp0" }])
  assert.deepEqual(scoped.conditions.map(condition => condition.id), ["lc0", "rc0"])
  assert.deepEqual(scoped.lists.map(list => list.id), ["ll0", "rl0"])
  assert.deepEqual(scoped.effects.map(effect => effect.lifetime), ["layout", "layout", "route", "route"])
  assert.deepEqual(scoped.effects.filter(effect => effect.owner).map(effect => effect.owner), ["le0", "re0"])
  assert.ok(scoped.effects.every(effect => Object.hasOwn(effect, "scope") && !Object.hasOwn(effect, "captures")))
  assert.doesNotMatch(effects, /"lifetime":"(?:layout|route)"/)
  assert.match(plain, /data-k-text="s0"/)
  assert.doesNotMatch(plain, /data-k-route-(?:start|end)|data-k-text="rs0"/)

  const legacy = await renderPage(() => {
    const [count] = useState(1)
    return jsx("p", { children: count })
  }, { styles: false })
  assert.equal(legacy.html, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kudzu</title></head><body><p><span data-k-text="s0" data-k-value='1'>1</span></p></body></html>`)
  assert.deepEqual(legacy.plan.states, [{ slot: 0, id: "s0", name: "s0", initialValue: 1 }])
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.plan)), legacy.plan)
  const ids = await renderPage(() => jsx("main", { id: useId() }), { styles: false }, {}, ({ children }) => jsx("div", { id: useId(), children }))
  assert.match(ids.html, /<div id="k-li0">.*<main id="k-ri0"><\/main>.*<\/div>/)
  await assert.rejects(renderPage(() => null, { styles: false, runtimeParams: ["id"] }, {}, () => useParams()), /useParams\(\) is only supported in route scope/)

  await writeFile(invalidPage, "export const layout = 1\nexport default function Page() { return <main /> }\n")
  const invalid = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(invalid.status, 0)
  assert.match(`${invalid.stdout}\n${invalid.stderr}`, /src\/pages\/invalid\.tsx:1:\d+ layout export must be a function/)
})

test("enhances configured emitted routes sharing one layout", async t => {
  const fixture = new URL("./fixtures/navigation", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/navigation/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/navigation/dist", import.meta.url), { recursive: true, force: true })
  })

  assert.throws(() => normalizeNavigation([]), /plain object/)
  assert.throws(() => normalizeNavigation({ routes: [] }), /nonempty array/)
  assert.throws(() => normalizeNavigation({ routes: ["/product", "/product"] }), /unique paths/)
  for (const path of ["product", "/product?x=1", "/product#x", "/a/../product", "/%2e%2e/product"]) assert.throws(() => normalizeNavigation({ routes: [path] }), /root-relative path/)

  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const product = await readFile(new URL("./fixtures/navigation/dist/product/index.html", import.meta.url), "utf8")
  const cart = await readFile(new URL("./fixtures/navigation/dist/cart/index.html", import.meta.url), "utf8")
  const chart = await readFile(new URL("./fixtures/navigation/dist/chart/index.html", import.meta.url), "utf8")
  const broken = await readFile(new URL("./fixtures/navigation/dist/broken/index.html", import.meta.url), "utf8")
  const item = await readFile(new URL("./fixtures/navigation/dist/items/[id]/index.html", import.meta.url), "utf8")
  const newItem = await readFile(new URL("./fixtures/navigation/dist/items/new/index.html", import.meta.url), "utf8")
  const genericItem = await readFile(new URL("./fixtures/navigation/dist/[section]/[id]/index.html", import.meta.url), "utf8")
  const itemParams = await readFile(new URL("./fixtures/navigation/dist/assets/params/items/[id]/index.js", import.meta.url), "utf8")
  const productEffects = await readFile(new URL("./fixtures/navigation/dist/assets/effects/product/index.js", import.meta.url), "utf8")
  const outside = await readFile(new URL("./fixtures/navigation/dist/outside/index.html", import.meta.url), "utf8")
  const navigation = await readFile(new URL("./fixtures/navigation/dist/assets/kudzu-navigation.js", import.meta.url), "utf8")

  const second = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`)
  assert.equal(await readFile(new URL("./fixtures/navigation/dist/product/index.html", import.meta.url), "utf8"), product)
  assert.equal(await readFile(new URL("./fixtures/navigation/dist/cart/index.html", import.meta.url), "utf8"), cart)
  assert.equal(await readFile(new URL("./fixtures/navigation/dist/assets/kudzu-navigation.js", import.meta.url), "utf8"), navigation)

  for (const html of [product, cart, chart, broken, item, newItem, genericItem]) {
    assert.match(html, /^<!doctype html>.*<body[^>]+data-k-application="a-a8d4d2fb8e9e69eb"[^>]+data-k-layout="l-a8d4d2fb8e9e69eb".*data-k-route-start.*data-k-route-end.*<\/body><\/html>$/s)
    assert.match(html, /data-k-route="\/(?:product|cart|chart|broken|items\/(?:\[id\]|new)|\[section\]\/\[id\])"/)
    assert.equal((html.match(/<script[^>]+kudzu-navigation\.js/g) ?? []).length, 1)
  }
  assert.doesNotMatch(outside, /data-k-(?:application|layout)|kudzu-navigation\.js|data-k-capability/)
  assert.match(navigation, /popstate/)
  assert.match(navigation, /\/shop\/product/)
  assert.match(navigation, /\/items\/\[id\]/)
  assert.match(navigation, /path:"\/shop\/items\/new"/)
  assert.match(navigation, /base:"\/shop",segments:\["items",null\]/)
  assert.ok(navigation.indexOf('segments:["items",null]') < navigation.indexOf("segments:[null,null]"))
  assert.match(itemParams, /export\s*\{[^}]*initializeParams|export function initializeParams/)
  assert.match(itemParams, /decodeURIComponent/)
  assert.doesNotMatch(itemParams, /location\.pathname/)
  assert.doesNotMatch(productEffects, /registerMountHook|registerUnmountHook|data-k-effect/)
  assert.doesNotMatch(navigation, /[?&](?:v|t)=|Date\.now|Math\.random/)
  assert.ok(gzipSync(navigation).length > 0)

  const chrome = chromePaths.find(existsSync)
  assert.match(chart, /data-chart="true" data-sample="0"/)
  if (chrome) await runNavigationBrowserTest(fixture, chrome)
})

test("specializes effect-free exact navigation", async t => {
  const fixture = new URL("./fixtures/navigation-static", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/navigation-static/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/navigation-static/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, result.stderr)
  const navigation = await readFile(new URL("./fixtures/navigation-static/dist/assets/kudzu-navigation.js", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/navigation-static/dist/assets/kudzu.js", import.meta.url), "utf8")
  assert.doesNotMatch(navigation, /capabilities|mountInitial|mountRouteEffects|initializeParams|pagehide|decodeSegment/)
  assert.doesNotMatch(runtime, /indexOf/)
})

test("emits independent shared-layout navigation groups", async t => {
  const fixture = new URL("./fixtures/navigation-groups", import.meta.url)
  const config = new URL("kudzu.config.mjs", `${fixture.href}/`)
  const originalConfig = await readFile(config, "utf8")
  const exactDiagnostic = new URL("src/pages/items/new.tsx", `${fixture.href}/`)
  const runtimeDiagnostic = new URL("src/pages/[section]/[slug].tsx", `${fixture.href}/`)
  t.after(async () => {
    await writeFile(config, originalConfig)
    await rm(exactDiagnostic, { force: true })
    await rm(runtimeDiagnostic, { force: true })
    await rm(new URL("./fixtures/navigation-groups/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/navigation-groups/dist", import.meta.url), { recursive: true, force: true })
  })

  assert.throws(() => normalizeNavigation({ routes: ["/a"], groups: [{ routes: ["/b"] }] }), /exactly one/)
  assert.throws(() => normalizeNavigation({ groups: [] }), /nonempty array/)
  assert.throws(() => normalizeNavigation({ groups: [null] }), /groups\[0\] must be a plain object/)
  assert.throws(() => normalizeNavigation({ groups: [{ routes: ["/a"], name: "a" }] }), /groups\[0\] only supports routes/)
  assert.throws(() => normalizeNavigation({ groups: [{ routes: ["/a"] }, { routes: ["/a"] }] }), /duplicates kudzu\.config navigation\.groups\[0\]/)

  const groups = normalizeNavigation({ groups: [{ routes: ["/alpha", "/items/[id]"] }, { routes: ["/beta", "/gamma"] }] })
  const buildFixture = () => spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  const first = buildFixture()
  assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`)
  const assetA = groups[0].assetName
  const assetB = groups[1].assetName
  const alpha = await readFile(new URL("dist/alpha/index.html", `${fixture.href}/`), "utf8")
  const beta = await readFile(new URL("dist/beta/index.html", `${fixture.href}/`), "utf8")
  const outside = await readFile(new URL("dist/outside/index.html", `${fixture.href}/`), "utf8")
  const nativeItem = await readFile(new URL("dist/items/native/index.html", `${fixture.href}/`), "utf8")
  const sourceA = await readFile(new URL(`dist/assets/${assetA}`, `${fixture.href}/`), "utf8")
  const sourceB = await readFile(new URL(`dist/assets/${assetB}`, `${fixture.href}/`), "utf8")
  assert.match(alpha, new RegExp(assetA.replace(".", "\\.")))
  assert.doesNotMatch(alpha, new RegExp(assetB.replace(".", "\\.")))
  assert.match(beta, new RegExp(assetB.replace(".", "\\.")))
  assert.doesNotMatch(beta, new RegExp(assetA.replace(".", "\\.")))
  assert.match(sourceA, /\/app\/alpha/)
  assert.match(sourceA, /\/items\/\[id\]/)
  assert.match(sourceA, /id:"\/items\/native",path:"\/app\/items\/native",native:!0/)
  assert.doesNotMatch(sourceA, /\/app\/(?:beta|gamma)/)
  assert.match(sourceB, /\/app\/beta/)
  assert.match(sourceB, /\/app\/gamma/)
  assert.doesNotMatch(sourceB, /\/app\/alpha|\/items\/\[id\]/)
  assert.doesNotMatch(sourceB, /capabilities|mountInitial|mountRouteEffects|initializeParams|pagehide|decodeSegment/)
  assert.doesNotMatch(outside, /data-k-(?:application|layout|route)|kudzu-navigation|data-k-capability/)
  assert.doesNotMatch(nativeItem, /data-k-(?:application|layout|route)|kudzu-navigation|data-k-capability/)

  await writeFile(config, `export default { base: "/app", navigation: { groups: [{ routes: ["/beta", "/gamma"] }, { routes: ["/alpha", "/items/[id]"] }] } }\n`)
  const reordered = buildFixture()
  assert.equal(reordered.status, 0, `${reordered.stdout}\n${reordered.stderr}`)
  assert.equal(await readFile(new URL(`dist/assets/${assetA}`, `${fixture.href}/`), "utf8"), sourceA)
  assert.equal(await readFile(new URL(`dist/assets/${assetB}`, `${fixture.href}/`), "utf8"), sourceB)
  assert.equal(await readFile(new URL("dist/alpha/index.html", `${fixture.href}/`), "utf8"), alpha)
  assert.deepEqual((await readdir(new URL("dist/assets", `${fixture.href}/`))).filter(name => name.startsWith("kudzu-navigation-")).sort(), [assetA, assetB].sort())

  await writeFile(config, originalConfig)
  const rebuilt = buildFixture()
  assert.equal(rebuilt.status, 0, `${rebuilt.stdout}\n${rebuilt.stderr}`)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNavigationGroupsBrowserTest(fixture, chrome)

  const invalidBuild = async (navigation, pattern) => {
    await writeFile(config, `export default { base: "/app", navigation: ${JSON.stringify(navigation)} }\n`)
    const result = buildFixture()
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, pattern)
  }
  await invalidBuild({ groups: [{ routes: ["/missing"] }] }, /navigation\.groups\[0\] route "\/missing" is not an emitted route/)
  await invalidBuild({ groups: [{ routes: ["/outside"] }] }, /navigation\.groups\[0\] emitted route "\/app\/outside" must export a layout function/)
  await invalidBuild({ groups: [{ routes: ["/alpha", "/beta"] }] }, /routes "\/alpha" and "\/beta" must export the same layout function identity/)
  await mkdir(new URL("src/pages/items", `${fixture.href}/`), { recursive: true })
  await writeFile(exactDiagnostic, 'import { ShellB } from "../../ShellB"\nexport const layout = ShellB\nexport default function Page() { return <main>New</main> }\n')
  await invalidBuild({ groups: [{ routes: ["/items/[id]"] }, { routes: ["/items/new"] }] }, /overlap.*groups\[0\] route "\/items\/\[id\]".*groups\[1\] route "\/items\/new"/)
  await mkdir(new URL("src/pages/[section]", `${fixture.href}/`), { recursive: true })
  await writeFile(runtimeDiagnostic, 'import { ShellB } from "../../ShellB"\nexport const layout = ShellB\nexport const runtimeParams = true\nexport default function Page() { return <main>Generic</main> }\n')
  await invalidBuild({ groups: [{ routes: ["/items/[id]"] }, { routes: ["/[section]/[slug]"] }] }, /overlap.*groups\[0\] route "\/items\/\[id\]".*groups\[1\] route "\/\[section\]\/\[slug\]"/)
})

test("plans DOM-owned effects in navigation groups", async () => {
  function OwnedEffect() {
    useEffect(() => {}, [], "/effect.js", "effect0", [], [], "fixture.tsx:4:5", false)
    return jsx("span", { children: "owned" })
  }
  function Page() {
    const [shown] = useState(true)
    return conditional("and", shown, () => jsx(OwnedEffect, {}), () => null, "/condition.js", "condition0", [["shown", shown]], [])
  }
  const result = await renderPage(Page, { styles: false, navigationAsset: "/navigation.js" })
  assert.equal(result.plan.effects[0].owner, "e0")
  assert.match(result.html, /data-k-effect="e0"/)
})

test("owns conditional and keyed effects across navigation lifetimes", async t => {
  const fixture = new URL("./fixtures/navigation-owned-effects", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/navigation-owned-effects/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/navigation-owned-effects/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const entry = await readFile(new URL("./fixtures/navigation-owned-effects/dist/assets/effects/index.js", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/navigation-owned-effects/dist/assets/kudzu.js", import.meta.url), "utf8")
  const listRuntime = await readFile(new URL("./fixtures/navigation-owned-effects/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/navigation-owned-effects/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(entry, /registerMountHook|registerUnmountHook/)
  assert.match(entry, /registerListItemHook/)
  assert.doesNotMatch(entry, /dependencyIds/)
  assert.match(runtime, /registerListItemHook|notifyListItem/)
  assert.match(listRuntime, /notifyListItem/)
  assert.match(entry, /mountLayoutEffects|mountRouteEffects/)
  assert.match(runtime, /indexOf/)
  assert.deepEqual(plan.effects.map(effect => [effect.lifetime, effect.owner, effect.list, effect.itemDependencies, effect.listState]), [
    ["layout", "le0", undefined, undefined, undefined],
    ["route", "re0", undefined, undefined, undefined],
    ["route", "re1", true, ["id"], "rs4"],
    ["route", "re2", true, ["name"], "rs4"]
  ])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runOwnedNavigationEffectBrowserTest(fixture, chrome)
})

test("rejects stylesheets rendered in the document body", async t => {
  const fixture = new URL("./fixtures/body-stylesheet", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/body-stylesheet/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/body-stylesheet/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:2:\d+ Stylesheets must be placed under src\/ or declared in kudzu\.config styles so Kudzu can emit them in <head>/)
  await assert.rejects(
    renderPage(() => jsx("link", { rel: "stylesheet", href: "/late.css" }), { styles: false }),
    /Stylesheets must be placed under src\/ or declared in kudzu\.config styles/
  )
  await assert.rejects(
    renderPage(() => jsx("lInK", { REL: "stylesheet", href: "/late.css" }), { styles: false }),
    /Stylesheets must be placed under src\/ or declared in kudzu\.config styles/
  )
})

test("rejects ambiguous global stylesheet URLs", async t => {
  const fixture = new URL("./fixtures/global-styles-invalid", import.meta.url)
  const dist = new URL("./fixtures/global-styles-invalid/dist/", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/global-styles-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/global-styles-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  await mkdir(dist, { recursive: true })
  await writeFile(new URL("last-good.txt", dist), "keep")
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /kudzu\.config styles\[0\] must be root-relative or an absolute HTTP URL/)
  assert.equal(await readFile(new URL("last-good.txt", dist), "utf8"), "keep")
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

test("renders reactive SVG structures and rejects reactive MathML structures", async () => {
  const conditionalResult = await renderPage(() => {
    const [open] = useState(true)
    const branch = conditional("and", true, () => jsx("circle", {}), () => null, "/binding.js", "binding0", [["open", open]], [])
    return jsx("svg", { children: branch })
  }, { styles: false })
  assert.match(conditionalResult.html, /data-k-svg-true="&lt;circle&gt;&lt;\/circle&gt;"/)

  const listResult = await renderPage(() => {
    const [items] = useState([{ id: 1 }])
    return jsx("svg", { children: list(items, "id", item => jsx("circle", { "data-id": item.id })) })
  }, { styles: false })
  assert.match(listResult.html, /data-k-svg-template="&lt;circle data-k-list-root=/)

  await assert.rejects(renderPage(() => {
    const [open] = useState(true)
    const branch = conditional("and", true, () => jsx("mi", {}), () => null, "/binding.js", "binding0", [["open", open]], [])
    return jsx("math", { children: branch })
  }, { styles: false }), /Reactive conditional DOM is not supported inside math/)

  await assert.rejects(renderPage(() => {
    const [items] = useState([{ id: 1 }])
    return jsx("math", { children: list(items, "id", item => jsx("mi", { children: item.id })) })
  }, { styles: false }), /Reactive keyed lists are not supported inside math/)

  await assert.rejects(renderPage(() => {
    const [items] = useState([{ id: 1, children: [{ id: 2 }] }])
    return jsx("svg", { children: list(items, "id", () => jsx("g", { children: list(items, "id", child => jsx("circle", { "data-id": child.id }), "children") })) })
  }, { styles: false }), /Nested reactive keyed lists are not supported inside svg/)

  await assert.rejects(renderPage(() => {
    const [items] = useState([{ id: 1, visible: true }])
    return jsx("svg", { children: list(items, "id", item => jsx("g", { children: listConditional("and", () => item.visible, () => jsx("circle", {}), () => null, "/list.js", "condition0") })) })
  }, { styles: false }), /Keyed row conditions are not supported inside svg/)
})

test("normalizes React-shaped SVG presentation attributes", async () => {
  const result = await renderPage(() => jsx("svg", {
    viewBox: "0 0 24 24",
    children: jsx("path", { fillRule: "evenodd", clipRule: "evenodd", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" })
  }), { styles: false })
  assert.match(result.html, /<svg viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><\/path><\/svg>/)
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
  }, { styles: false }), /Refs in keyed lists must be declared by the keyed row component/)
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
  const component = await readFile(new URL("./fixtures/runtime-params/.kudzu/pages/orgs/[org]/items/[id].mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/runtime-params/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const afterBuild = JSON.parse(await readFile(new URL("./fixtures/runtime-params/dist/rewrites.json", import.meta.url), "utf8"))
  assert.match(html, /data-k-text="p0"/)
  assert.match(html, /data-k-text="p1"/)
  assert.match(html, /<a data-help="true" href="\/%ED%8F%AC%ED%84%B8\/help">Help<\/a>/)
  assert.match(html, /kudzu\.js.*params\/orgs\/\[org\]\/items\/\[id\]\/index\.js.*kudzu-binding\.js.*effects\/orgs\/\[org\]\/items\/\[id\]\/index\.js/s)
  assert.match(staticHtml, /data-static-new/)
  assert.doesNotMatch(staticHtml, /<script|data-k-state/)
  assert.match(params, /location\.pathname/)
  assert.match(params, /decodeURIComponent/)
  assert.doesNotMatch(params, /pushState|popstate|preventDefault/)
  assert.match(effect, /params\/orgs\/\[org\]\/items\/\[id\]\/index\.js/)
  assert.match(component, /useParams as useRouteParams.*@kudzujs\/core/)
  assert.doesNotMatch(component, /react-router-dom/)
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
  assert.match(html, /data-derived="true" title="Kudzu!:idle" data-k-bind-attrs=.*Kudzu!:idle/)
  assert.match(html, /disabled data-k-bind-disabled=/)
  assert.match(html, /value="Kudzu" data-k-bind-value=/)
  assert.match(html, /value="Kudzu!" data-k-bind-value=/)
  assert.match(html, /value="false" data-k-bind-value=/)
  assert.match(html, /type="checkbox" data-k-bind-checked=/)
  assert.match(html, /type="radio" checked data-k-bind-checked=/)
  assert.match(html, /<select data-k-bind-value=.*<option>Kudzu<\/option><option selected>Grown<\/option><\/select>/)
  assert.match(html, /class="waiting" data-k-bind-class=.*aria-checked="false" data-state="closed" hidden title="Inactive" data-k-bind-attrs=/)
  assert.match(html, /style="color:red;width:8px;opacity:0.5;--accent:1" data-k-bind-style=/)
  assert.match(html, /<output data-formatted="true" title="12" data-k-bind-attrs=.*>.*12.*<\/output>/)
  assert.match(html, /class="prop-active">Static prop/)
  assert.match(html, /class="prop-idle" data-k-bind-class=.*>Static prop/)
  assert.match(html, /class="nested-idle" data-k-bind-class=.*>Nested/)
  assert.match(html, /class="off">Shadowed/)
  assert.match(html, /data-shadowed="true">.*Kudzu:document\|location\|history\|navigator\|console.*<\/div>/)
  assert.match(html, /<body data-k-state=/)
  assert.match(html, /kudzu-binding\.js/)
  assert.doesNotMatch(html, /kudzu-list\.js/)
  assert.equal(existsSync(new URL("./fixtures/bindings/dist/assets/kudzu-list.js", import.meta.url)), false)
  assert.doesNotMatch(html, /kudzu-native\.js/)
  assert.doesNotMatch(commandRuntime, /patchBinding|data-k-bind/)
  assert.match(commandRuntime, /registerCommitter/)
  assert.match(commandRuntime, /\["change","click"\]/)
  assert.match(bindingRuntime, /patchBinding|data-k-bind/)
  assert.match(bindingRuntime, /Reactive text marker has no end|k-text:/)
  assert.match(bindingRuntime, /kudzu-style\.js/)
  assert.equal(existsSync(new URL("./fixtures/bindings/dist/assets/kudzu-style.js", import.meta.url)), true)
  assert.match(serialization, /as deserialize/)
  assert.match(bindings, /as binding0/)
  assert.match(bindings, /\.get\("active"\)/)
  assert.doesNotMatch(bindings, /activeClass|decoratedName|derivedStatus/)
  assert.match(bindings, /new Intl\.NumberFormat\("en-US"\)\.format\(Math\.round/)
  assert.doesNotMatch(bindings, /displayValue|formattedValue/)
  assert.doesNotMatch(bindings, /\beval\b|new Function/)
  assert.equal(plan.bindings.length, 24)
  assert.ok(plan.bindings.some(binding => Object.keys(binding.scopeBindings ?? {}).length > 0))

  const evaluators = await import(`${new URL("./fixtures/bindings/dist/assets/handlers/pages/index.js", import.meta.url).href}?v=${Date.now()}`)
  const context = {
    get: name => name === "active" ? true : name === "name" ? "Kudzu" : undefined,
    scope: name => name === "active" ? true : name === "activeClass" ? "is-active" : name === "item" ? 1 : name === "value" ? "Kudzu!" : ["document", "location", "history", "navigator", "console"].includes(name) ? name : undefined
  }
  assert.equal(evaluators.binding0(context), "prop-active")
  assert.equal(evaluators.binding1(context), "Kudzu!")
  assert.equal(evaluators.binding2(context), "Kudzu!:active")
  assert.equal(evaluators.binding3(context), "Kudzu!:active")
  assert.equal(evaluators.binding4(context), JSON.stringify({ active: true }))
  assert.equal(evaluators.binding5(context), "nested-1")
  assert.equal(evaluators.binding7(context), false)
  assert.equal(evaluators.binding8(context), "Kudzu!")
  assert.ok(Object.values(evaluators).some(evaluate => evaluate(context) === "Kudzu!:active"))
  assert.ok(Object.values(evaluators).some(evaluate => evaluate(context) === "1,235"))
  assert.ok(Object.values(evaluators).some(evaluate => evaluate(context) === "Kudzu:document|location|history|navigator|console"))

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

test("rejects impure reactive JSX locals", () => {
  const fixture = new URL("./fixtures/reactive-local-invalid-call", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Reactive JSX local expressions cannot call arbitrary functions/)
})

test("rejects asynchronous imported reactive calculations", () => {
  const fixture = new URL("./fixtures/reactive-imported-calculation-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Reactive imported calculations must be synchronous functions/)
})

test("rejects imported reactive calculations without object results", () => {
  const fixture = new URL("./fixtures/reactive-imported-calculation-shape-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Reactive imported calculations must return a plain object/)
})

test("rejects imported reactive calculations with fallthrough paths", () => {
  const fixture = new URL("./fixtures/reactive-imported-calculation-fallthrough-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Reactive imported calculations must return a plain object/)
})

test("rejects dynamic reactive Intl locales", () => {
  const fixture = new URL("./fixtures/reactive-local-invalid-intl", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Reactive JSX Intl\.NumberFormat requires exactly one static string locale/)
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
  assert.match(html, /assets\/native\/index\.js/)
  assert.match(runtime, /template\[data-k-if\]/)
  assert.doesNotMatch(runtime, /createContextualFragment/)
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
  const browserFiles = (await readdir(new URL("./fixtures/lists/dist", import.meta.url), { recursive: true })).filter(file => file.endsWith(".js"))
  const browserOutput = (await Promise.all(browserFiles.map(file => readFile(new URL(`./fixtures/lists/dist/${file}`, import.meta.url), "utf8")))).join("\n")
  assert.match(component, /export function ItemRow/)
  assert.match(component, /export const TableRow/)
  assert.doesNotMatch(component, /_(?:jsx|jsxs)\((?:ItemRow|TableRow)/)
  assert.doesNotMatch(browserOutput, /\b(?:ItemRow|TableRow)\b/)
  assert.match(component, /__kList\(items, "id"/)
  assert.match(component, /const rows = undefined/)
  assert.match(component, /const unusedRows = undefined/)
  assert.match(component, /__kListExpression/)
  assert.match(component, /__kListConditional/)
  assert.match(component, /__kListItem/)
  assert.match(component, /const TableRow = \(\{ item \}\) =>/)
  assert.match(component, /"data-row": __kListField/)
  assert.doesNotMatch(component.slice(component.indexOf("function ItemRow"), component.indexOf("export const TableRow")), /__kList/)
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
  assert.match(html, /assets\/native\/index\.js/)
  assert.match(runtime, /kudzu-style\.js/)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-style.js", import.meta.url)), true)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-collection-selector.js", import.meta.url)), false)
  assert.doesNotMatch(runtime, /collection-selector|selectCollection|Rendered collection/)
  assert.doesNotMatch(runtime, /list-index|\.indexed|\.selector|kListConditionHandler|no matching template/)
  assert.doesNotMatch(html, /kudzu-binding\.js/)
  assert.equal(existsSync(new URL("./fixtures/lists/dist/assets/kudzu-binding.js", import.meta.url)), false)
  assert.match(runtime, /Keyed list state must remain an array/)
  assert.match(runtime, /Keyed list condition marker has no end/)
  assert.doesNotMatch(runtime, /createContextualFragment/)
  assert.match(runtime, /\.children\[/)
  assert.doesNotMatch(html, /data-k-effects|data-k-effect-item/)
  assert.doesNotMatch(runtime, /data-k-effects|kEffectItem/)
  assert.doesNotMatch(runtime, /\beval\b|new Function/)
  assert.match(handlers, /as handler/)
  assert.match(handlers, /as listExpression/)
  assert.match(handlers, /\.scope\("item"\)/)
  assert.doesNotMatch(handlers, /\beval\b|new Function/)
  assert.equal(plan.lists.length, 4)
  assert.equal(plan.lists[0].state, "s0")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runListBrowserTest(fixture, chrome)
})

test("patches conditional and keyed SVG ranges in their namespace", async t => {
  const fixture = new URL("./fixtures/svg-structures", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/svg-structures/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/svg-structures/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/svg-structures/dist/index.html", import.meta.url), "utf8")
  const bindingRuntime = await readFile(new URL("./fixtures/svg-structures/dist/assets/kudzu-binding.js", import.meta.url), "utf8")
  const listRuntime = await readFile(new URL("./fixtures/svg-structures/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/svg-structures/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-k-svg-true=/)
  assert.match(html, /data-k-svg-template=/)
  assert.match(bindingRuntime, /createContextualFragment/)
  assert.match(listRuntime, /createContextualFragment/)
  assert.equal(plan.conditions[0].svg, true)
  assert.equal(plan.lists[0].svg, true)

  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runSvgStructureBrowserTest(fixture, chrome)
})

test("reevaluates calculated collection fields through keyed SVG lists", async t => {
  const fixture = new URL("./fixtures/calculated-collections", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/calculated-collections/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/calculated-collections/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const sourceResult = inspectSourceResult(fixture, "src/pages/index.tsx")
  const calculatedBlock = sourceResult.moduleIR.keyedBlocks.find(block => block.collection.kind === "binding")
  assert.ok(calculatedBlock)
  assert.equal(sourceResult.moduleIR.bindings[calculatedBlock.collection.binding].keyedBlock, calculatedBlock.slot)

  const html = await readFile(new URL("./fixtures/calculated-collections/dist/index.html", import.meta.url), "utf8")
  const ordinaryHtml = await readFile(new URL("./fixtures/calculated-collections/dist/ordinary/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/calculated-collections/dist/static/index.html", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/calculated-collections/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/calculated-collections/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  const route = plan.find(entry => entry.route === "/")

  assert.match(html, /<svg[^>]+data-chart.*<circle[^>]+data-point="a"[^>]+class="point "[^>]+cx="10"[^>]+role="button"[^>]+aria-label="Alpha"[^>]+aria-describedby="point-tooltip"[^>]+aria-current="false".*<circle[^>]+data-point="b"/s)
  assert.match(html, /"expressionStates":\["s\d+"\]/)
  assert.match(html, /data-k-list-expression-attrs=&#39;[^>]*selectedId/)
  assert.match(html, /id="point-tooltip" role="tooltip" aria-live="polite" hidden(?:="true")?[^>]*>.*No point selected/s)
  assert.match(html, /data-k-list='[^']+"source":\{"module":"\/assets\/handlers\/pages\/index\.js","handler":"binding\d+"/)
  assert.equal(route.lists[0].source.handler, "binding1")
  assert.equal(route.lists[0].selector, undefined)
  assert.doesNotMatch(runtime, /selectCollection/)
  assert.match(runtime, /import\("\.\/kudzu-binding\.js"\)/)
  assert.doesNotMatch(runtime, /kTextBindings/)
  assert.equal(existsSync(new URL("./fixtures/calculated-collections/dist/assets/kudzu-collection-selector.js", import.meta.url)), false)
  assert.match(ordinaryHtml, /kudzu-list\.js/)
  assert.doesNotMatch(ordinaryHtml, /kudzu-binding\.js/)
  assert.doesNotMatch(staticHtml, /<script/)

  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runCalculatedCollectionsBrowserTest(fixture, chrome)
})

test("compiles synchronous rendered collection selectors and React positional keys", async t => {
  const fixture = new URL("./fixtures/rendered-collections", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/rendered-collections/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/rendered-collections/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const derived = inspectSourceResult(fixture, "src/pages/index.tsx").moduleIR.derived
  assert.ok(derived.some(entry => entry.kind === "selector" && entry.selector.some(step => step[0] === "filter")))
  const html = await readFile(new URL("./fixtures/rendered-collections/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/rendered-collections/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/rendered-collections/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/rendered-collections/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-stable[\s\S]*"keys":\["a","c"\]/)
  assert.match(html, /data-reused[\s\S]*"keys":\["a","c"\]/)
  assert.match(html, /data-imported[\s\S]*"keys":\["a","c"\]/)
  assert.match(html, /data-page[\s\S]*"keys":\["a","b"\]/)
  assert.match(html, /data-search[\s\S]*"keys":\["a","b","c"\]/)
  assert.match(html, /data-sorted[\s\S]*"keys":\["a","b","c"\]/)
  assert.match(html, /data-from-map[\s\S]*0-Alpha[\s\S]*2-Gamma/)
  assert.match(html, /data-flat[\s\S]*Xray/)
  assert.match(html, /data-undefined[^>]*>[\s\S]*Alpha/)
  assert.doesNotMatch(html.match(/<div data-undefined>[\s\S]*?<\/div>/)?.[0] ?? "", /Beta/)
  assert.match(html, /data-conditional-and[\s\S]*"keys":\["a"\][\s\S]*Alpha/)
  assert.match(html, /data-conditional-ternary[\s\S]*"keys":\["a","c"\]/)
  assert.match(component, /JSON\.parse\("\[\[\\"filter\\"/)
  assert.match(component, /__kList\(items, null/)
  assert.doesNotMatch(component, /selectVisible\(items\)/)
  assert.ok(plan.lists.some(list => list.key === null && list.indexed))
  assert.ok(plan.lists.some(list => list.selector?.some(operation => operation[0] === "flatMap")))
  assert.ok(plan.lists.some(list => list.ownerField === "children" && list.selector?.some(operation => operation[0] === "filter")))
  assert.ok(plan.lists.some(list => list.selector?.some(operation => operation[0] === "slice") && Object.values(list.selectorStates ?? {}).includes("s2")))
  assert.ok(plan.lists.some(list => list.selector?.some(operation => operation[0] === "filter") && Object.values(list.selectorStates ?? {}).includes("s3")))
  assert.ok(plan.lists.some(list => list.selector?.some(operation => operation[0] === "sort")))
  assert.ok(new Set(plan.lists.flatMap(list => Object.values(list.selectorStates ?? {}))).size >= 3)
  assert.doesNotMatch(runtime, /\beval\b|new Function|Promise|async /)
  assert.equal(existsSync(new URL("./fixtures/rendered-collections/dist/assets/kudzu-collection-selector.js", import.meta.url)), false)
  const invalid = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/rendered-collections-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalid.status, 0)
  assert.match(`${invalid.stdout}\n${invalid.stderr}`, /rendered-collections-invalid\/src\/pages\/index\.tsx:\d+:\d+ Rendered collection filter\(\) callback must be a synchronous arrow function/)
  const invalidAlias = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/rendered-collection-alias-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalidAlias.status, 0)
  assert.match(`${invalidAlias.stdout}\n${invalidAlias.stderr}`, /rendered-collection-alias-invalid\/src\/pages\/index\.tsx:\d+:\d+ Rendered collection alias "visible" may only be used as a rendered collection source/)
  const invalidChild = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/computed-child-collection-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalidChild.status, 0)
  assert.match(`${invalidChild.stdout}\n${invalidChild.stderr}`, /computed-child-collection-invalid\/src\/pages\/index\.tsx:\d+:\d+ Computed child collection alias "visibleChildren" must be used exactly once/)
  const invalidImported = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/imported-collection-transform-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalidImported.status, 0)
  assert.match(`${invalidImported.stdout}\n${invalidImported.stderr}`, /imported-collection-transform-invalid\/src\/selectVisible\.ts:\d+:\d+ Rendered collection expression identifier "includeVisible" is not allowed/)
  const invalidSlice = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/slice-collection-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalidSlice.status, 0)
  assert.match(`${invalidSlice.stdout}\n${invalidSlice.stderr}`, /slice-collection-invalid\/src\/pages\/index\.tsx:\d+:\d+ Rendered collection expressions cannot call arbitrary functions/)
  const invalidSort = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/sorted-collection-invalid", import.meta.url), encoding: "utf8" })
  assert.notEqual(invalidSort.status, 0)
  assert.match(`${invalidSort.stdout}\n${invalidSort.stderr}`, /sorted-collection-invalid\/src\/pages\/index\.tsx:\d+:\d+ Rendered collections cannot use mutating sort\(\); use toSorted\(\)/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runRenderedCollectionBrowserTest(fixture, chrome)
})

test("compiles arbitrarily deep keyed lists owned by immediate parent rows", async t => {
  const fixture = new URL("./fixtures/nested-lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/nested-lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/nested-lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const keyedBlocks = inspectSourceResult(fixture, "src/pages/index.tsx").moduleIR.keyedBlocks
  assert.deepEqual(keyedBlocks.map(block => [block.slot, block.parent, block.children, block.ownerField]), [
    [0, undefined, [1], undefined],
    [1, 0, [2, 4, 5], "items"],
    [2, 1, [3], "groups"],
    [3, 2, [], "options"],
    [4, 1, [], "badges"],
    [5, 1, [], "badges"]
  ])
  assert.deepEqual(JSON.parse(JSON.stringify(keyedBlocks)), keyedBlocks)
  const html = await readFile(new URL("./fixtures/nested-lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/nested-lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/nested-lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-category="c1"[\s\S]*Spa[\s\S]*data-item="a1"[\s\S]*Sauna[\s\S]*data-item="a2"[\s\S]*Massage/)
  assert.doesNotMatch(html, /data-category="c2"|data-item="b1"/)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 6)
  assert.match(component, /__kList\(categories, "id", item =>[\s\S]*, "items", JSON\.parse\("\[\]"\), false\)/)
  assert.match(component, /__kList\(categories, "id", item =>[\s\S]*, "groups", JSON\.parse\("\[\]"\), false\)/)
  assert.match(component, /__kList\(categories, "id", item =>[\s\S]*, "options", JSON\.parse\("\[\]"\), false\)/)
  assert.equal((component.match(/, "badges", JSON\.parse\("\[\]"\), false\)/g) ?? []).length, 2)
  assert.equal(plan.lists.length, 6)
  assert.deepEqual(plan.lists.map(list => list.state), ["s0", "s0", "s0", "s0", "s0", "s0"])
  assert.deepEqual(plan.lists.filter(list => list.ownerField).map(list => list.ownerField), ["options", "groups", "badges", "badges", "items"])
  assert.deepEqual(plan.lists.filter(list => list.children).map(list => list.children.map(child => child.field)), [["options"], ["groups", "badges", "badges"], ["items"]])
  assert.equal(new Set(plan.lists.flatMap(list => list.children ?? []).map(child => child.id)).size, 5)
  assert.equal((html.match(/data-k-list-root="l1"/g) ?? []).length, 1)
  assert.equal((html.match(/data-k-list-root="l2"/g) ?? []).length, 1)
  assert.equal((html.match(/data-k-list-root="l3"/g) ?? []).length, 1)
  assert.doesNotMatch(html, /data-k-list-condition-handler/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNestedListBrowserTest(fixture, chrome)
})

test("refreshes indexed nested rows and treats optional direct properties as empty", async t => {
  const fixture = new URL("./fixtures/nested-indexed-optional", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/nested-indexed-optional/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/nested-indexed-optional/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const runtime = await readFile(new URL("./fixtures/nested-indexed-optional/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/nested-indexed-optional/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.ok(plan.lists.some(list => list.ownerField === "children" && list.indexed && !list.selector))
  assert.ok(plan.lists.some(list => list.ownerField === "optional" && !list.selector))
  assert.equal(existsSync(new URL("./fixtures/nested-indexed-optional/dist/assets/kudzu-collection-selector.js", import.meta.url)), false)
  assert.doesNotMatch(runtime, /collection-selector|selectCollection/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNestedIndexedOptionalBrowserTest(fixture, chrome)
})

test("specializes local and imported nested keyed row components", async t => {
  const fixture = new URL("./fixtures/nested-component-lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/nested-component-lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/nested-component-lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const sourceResult = inspectSourceResult(fixture, "src/pages/index.tsx")
  const repeatedKeyedBlocks = inspectSourceResult(fixture, "src/pages/index.tsx").moduleIR.keyedBlocks
  assert.deepEqual(repeatedKeyedBlocks, sourceResult.moduleIR.keyedBlocks)
  const recursiveBlock = sourceResult.moduleIR.keyedBlocks.find(block => block.rowStates.length)
  assert.deepEqual(recursiveBlock.specializations, [3, 4, 5])
  assert.deepEqual(sourceResult.moduleIR.signals[recursiveBlock.rowStates[0].signal].reference.owner, { kind: "specialization", slot: 5 })
  assert.equal(recursiveBlock.rowRefs[0].specialization, 5)
  assert.ok(sourceResult.moduleIR.handlers.some(handler => handler.role === "effect" && handler.keyedBlock === recursiveBlock.slot))
  assert.ok(sourceResult.moduleIR.bindings.some(binding => binding.role === "list-expression" && binding.keyedBlock === recursiveBlock.slot))
  const html = await readFile(new URL("./fixtures/nested-component-lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/nested-component-lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/nested-component-lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-local-item="a1"[\s\S]*SAUNA[\s\S]*data-imported-item="a1"[\s\S]*SAUNA/)
  assert.doesNotMatch(component, /<LocalItem|<LocalShell|<LocalStatus|<ImportedItem|<ImportedShell|<ImportedStatus/)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 4)
  assert.equal(plan.lists.length, 4)
  assert.equal(plan.lists.filter(list => list.ownerField === "items").length, 2)
  assert.ok(plan.lists.some(list => list.rowStates?.length === 1 && list.rowRefs?.length === 1))
  assert.ok(plan.effects.some(effect => effect.itemDependencies?.includes("title")))
  assert.equal(plan.lists.filter(list => list.ownerField === "items" && list.conditions).length, 1)
  assert.equal(plan.lists.filter(list => list.children).some(list => list.conditions), false)
  assert.equal((html.match(/data-k-list-condition(?=[ =>])/g) ?? []).length, 7)
  assert.equal((html.match(/data-k-list-condition='/g) ?? []).length, 3)
  assert.equal((html.match(/data-k-list-true/g) ?? []).length, 3)
  assert.equal((html.match(/data-k-list-root="l1"/g) ?? []).length, 1)
  assert.equal((html.match(/data-k-list-root="l3"/g) ?? []).length, 1)
  assert.match(html, /data-local-item="a1"[^>]*title="Sauna"[^>]*data-k-list-attrs(?=[ >])/)
  assert.match(html, /data-direct[^>]*data-k-list-text(?=[ >])>Sauna/)
  assert.match(html, /data-deep[^>]*data-k-list-text="title"/)
  assert.match(html, /data-deep[^>]*>Sauna/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNestedComponentListBrowserTest(fixture, chrome)
})

test("owns ordinary keyed-row hooks by structural site and ancestor key path", async t => {
  const fixture = new URL("./fixtures/keyed-row-hooks", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-row-hooks/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-row-hooks/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const keyedBlocks = inspectSourceResult(fixture, "src/pages/index.tsx").moduleIR.keyedBlocks
  assert.equal(keyedBlocks.length, 3)
  assert.deepEqual(keyedBlocks.map(block => [block.specializations, block.rowStates.length, block.rowRefs.length]), [[[0], 2, 0], [[1], 3, 1], [[2], 3, 1]])
  const sourceResult = inspectSourceResult(fixture, "src/pages/index.tsx")
  assert.deepEqual(keyedBlocks[0].selectorSignals.map(slot => sourceResult.moduleIR.signals[slot].debugName), ["showSecond"])
  const html = await readFile(new URL("./fixtures/keyed-row-hooks/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/keyed-row-hooks/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/keyed-row-hooks/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/keyed-row-hooks/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /l0%3Dstring%3Ap1%2Fl1%3Dstring%3Ashared/)
  assert.match(html, /data-k-ref=/)
  assert.match(component, /__kRowUseState\(\{ updates: 0 \}/)
  assert.match(component, /__kRowUseState\(\[\]/)
  assert.match(component, /__kRowUseRef/)
  assert.match(runtime, /structuredClone|structuredClone\w*/)
  assert.match(runtime, /kRowPath/)
  assert.equal(plan.lists.filter(list => list.rowStates).length, 3)
  assert.equal(plan.lists.filter(list => list.rowRefs).length, 2)
  assert.ok(plan.lists.some(list => list.selector?.some(operation => operation[0] === "filter") && Object.values(list.selectorStates ?? {}).includes("s1")))
  assert.ok(plan.effects.some(effect => effect.dependencies?.some(id => id.includes("$k")) && effect.itemDependencies?.includes("label")))
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runKeyedRowHooksBrowserTest(fixture, chrome)
})

test("owns flat keyed-row hooks without the nested-list capability", async t => {
  const fixture = new URL("./fixtures/keyed-row-hooks-flat", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-row-hooks-flat/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-row-hooks-flat/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const runtime = await readFile(new URL("./fixtures/keyed-row-hooks-flat/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/keyed-row-hooks-flat/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.equal(plan.lists.length, 1)
  assert.equal(plan.lists[0].ownerField, undefined)
  assert.ok(plan.lists[0].rowStates?.length)
  assert.equal(plan.lists[0].fastRelease, true)
  assert.doesNotMatch(runtime, /Nested keyed list has no parent row|ownedLists|childPrototypes/)
  assert.doesNotMatch(runtime, /structuredClone|listIndexes|ownershipPaths|rowReplacements|kRowPath/)
  const html = await readFile(new URL("./fixtures/keyed-row-hooks-flat/dist/index.html", import.meta.url), "utf8")
  assert.doesNotMatch(html, /l0%3D/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runFlatKeyedRowHooksBrowserTest(fixture, chrome)
})

test("lowers directly serializable lazy keyed-row state", async t => {
  const fixture = new URL("./fixtures/keyed-row-hooks-invalid-lazy", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-row-hooks-invalid-lazy/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-row-hooks-invalid-lazy/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const plan = JSON.parse(await readFile(new URL("./fixtures/keyed-row-hooks-invalid-lazy/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.deepEqual(plan.lists[0].rowStates.map(state => state.initialValue), [0])
})

test("rejects invalid keyed-row refs with source locations", async t => {
  const fixture = new URL("./fixtures/keyed-row-hooks-invalid-ref", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-row-hooks-invalid-ref/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-row-hooks-invalid-ref/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:4:\d+ Keyed row useRef\(\) must use the direct initial value null/)
})

test("integrates ordinary React-shaped collection, component, condition, and keyed-row hook authoring", async t => {
  const fixture = new URL("./fixtures/react-shaped-integration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-shaped-integration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-shaped-integration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/react-shaped-integration/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/react-shaped-integration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/react-shaped-integration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-stable[\s\S]*data-projection="a"[\s\S]*Alpha[\s\S]*data-projection="c"[\s\S]*Gamma/)
  assert.match(html, /data-primary[\s\S]*data-secondary/)
  assert.match(component, /const visible = undefined/)
  assert.ok(plan.lists.some(list => list.selector?.map(operation => operation[0]).join(",") === "flatMap,filter"))
  assert.ok(plan.lists.some(list => list.key === null && list.indexed))
  assert.ok(plan.lists.some(list => list.children?.map(child => child.field).join(",") === "primary,secondary"))
  assert.ok(plan.lists.some(list => list.rowStates?.length === 2 && list.rowRefs?.length === 1))
  assert.ok(plan.effects.some(effect => effect.itemDependencies?.includes("label")))
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runReactShapedIntegrationBrowserTest(fixture, chrome)
})

test("builds React-imported landing pages without the React runtime", async t => {
  const fixture = new URL("./fixtures/landing-page-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/landing-page-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/landing-page-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/landing-page-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/landing-page-migration/dist/static/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/landing-page-migration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const sections = await readFile(new URL("./fixtures/landing-page-migration/.kudzu/LandingSections.mjs", import.meta.url), "utf8")
  const landingCss = await readFile(new URL("./fixtures/landing-page-migration/dist/assets/styles/landing.css", import.meta.url), "utf8")
  const moduleCss = await readFile(new URL("./fixtures/landing-page-migration/dist/assets/styles/Hero.module.css", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/landing-page-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, /Ship a faster landing page.*Static first.*Small runtime.*Built for the web/s)
  assert.match(html, /href="\/preview\/assets\/styles\/landing\.css".*href="\/preview\/assets\/styles\/Hero\.module\.css"/)
  assert.match(html, /src="\/preview\/assets\/assets\/hero\.svg"/)
  assert.match(html, /src="\/preview\/assets\/assets\/preview\.webp"/)
  assert.match(html, /src="\/preview\/assets\/assets\/badge\.png"/)
  assert.match(html, /class="k[0-9a-f]{8}_hero"/)
  assert.match(staticHtml, /class="k[0-9a-f]{8}_hero"/)
  assert.match(landingCss, /url\("\/preview\/assets\/assets\/landing\.woff2"\)/)
  assert.match(landingCss, /url\("\.\.\/assets\/not-a-file\.png"\).*"url\(\.\.\/assets\/not-a-file\.png\)"/s)
  assert.match(moduleCss, /\.k[0-9a-f]{8}_hero/)
  assert.match(moduleCss, /url\("?\/preview\/assets\/assets\/module-mark\.svg\?v=1#leaf"?\)/)
  assert.match(html, /aria-expanded="false"[^>]*data-k-bind-attrs/)
  assert.match(html, /data-k-if=/)
  assert.match(component, /import React, \{ useState \} from "@kudzujs\/core"/)
  assert.match(component, /useState\(false, "menuOpen"\)/)
  assert.doesNotMatch(sections, /(?:\.module\.css|\.webp\?url)/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.equal(plan.find(route => route.route === "/preview/static").states.length, 0)
  for (const file of ["hero.svg", "preview.webp", "badge.png", "landing.woff2", "module-mark.svg"]) {
    assert.deepEqual(
      await readFile(new URL(`./fixtures/landing-page-migration/dist/assets/assets/${file}`, import.meta.url)),
      await readFile(new URL(`./fixtures/landing-page-migration/src/assets/${file}`, import.meta.url))
    )
  }
  for (const directory of [new URL("./fixtures/landing-page-migration/.kudzu/", import.meta.url), new URL("./fixtures/landing-page-migration/dist/", import.meta.url)]) {
    const files = (await readdir(directory, { recursive: true })).filter(file => /\.(?:html|js|mjs|json)$/.test(file))
    const output = (await Promise.all(files.map(file => readFile(new URL(file, directory), "utf8")))).join("\n")
    assert.doesNotMatch(output, /(?:\bfrom\s*|\bimport\s*\(\s*)["']react["']/)
  }
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runLandingPageMigrationBrowserTest(fixture, chrome)
})

test("specializes conventional component spreads and forwarded children", async t => {
  const fixture = new URL("./fixtures/component-composition", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/component-composition/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/component-composition/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/component-composition/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/component-composition/dist/static/index.html", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/component-composition/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, /landing-shell.*Compose an ordinary landing page.*Kudzu capabilities.*Static first.*Complete HTML at first load.* Compiled <small>directly<\/small>/s)
  assert.match(html, /data-feature="1".*data-feature="2"/s)
  assert.match(staticHtml, /class="static-card" data-kind="static".*Static composition/s)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.equal(plan.find(route => route.route === "/static").states.length, 0)
})

test("rejects dynamic specialized component prop spreads with a source diagnostic", () => {
  const fixture = new URL("./fixtures/component-composition-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Keyed list component prop spreads must use an inline object literal or one direct const object literal declared in the calling component/)
})

test("erases React forwardRef across ordinary component boundaries", async t => {
  const fixture = new URL("./fixtures/react-forward-ref", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-forward-ref/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-forward-ref/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/react-forward-ref/dist/index.html", import.meta.url), "utf8")
  assert.match(html, /<input aria-label="Local input" name="local" data-local="true" data-k-ref="r0">/)
  assert.match(html, /<input name="imported" aria-label="Imported input" data-imported="true" data-k-ref="r1">/)
  assert.match(html, /<input aria-label="Optional ref" name="optional" data-local="true">/)
  assert.doesNotMatch(html, /<script|\sref=/)
  for (const file of ["ImportedInput.mjs", "pages/index.mjs"]) {
    const output = await readFile(new URL(`./fixtures/react-forward-ref/.kudzu/${file}`, import.meta.url), "utf8")
    assert.doesNotMatch(output, /["']react["']|forwardRef/)
  }
})

test("migrates a React-shaped dialog to the native dialog element", async t => {
  const fixture = new URL("./fixtures/native-dialog-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/native-dialog-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/native-dialog-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/native-dialog-migration/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/native-dialog-migration/.kudzu/DialogContent.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/native-dialog-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  assert.match(html, /<dialog aria-labelledby="dialog-title" aria-describedby="dialog-description"[^>]*data-k-native-cancel=[^>]*data-k-ref="r0">.*Edit profile.*Update your public profile.*Save changes.*Cancel<\/button>/s)
  assert.match(html, /id="dialog-trigger" data-k-ref="r1" data-k-native-click=/)
  assert.doesNotMatch(`${html}\n${component}`, /["']react["']|@radix-ui|forwardRef/)
  assert.deepEqual([...new Set(plan.routes[0].events.map(event => event.event))].sort(), ["cancel", "click"])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNativeDialogMigrationBrowserTest(fixture, chrome)
})

test("migrates a react-hook-form-shaped signup to native form semantics", async t => {
  const fixture = new URL("./fixtures/react-hook-form-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-hook-form-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-hook-form-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/react-hook-form-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/react-hook-form-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/react-hook-form-migration/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/react-hook-form-migration/.kudzu/SignupField.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/react-hook-form-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  assert.match(html, /<form id="signup-form" data-k-native-submit=/)
  assert.match(html, /<input id="email" name="email" type="email" required aria-invalid="false"/)
  assert.match(html, /<input id="password" name="password" type="password" required minLength="8"/)
  assert.match(handler, /new FormData\([^)]*currentTarget\)/)
  assert.doesNotMatch(`${html}\n${staticHtml}\n${handler}\n${component}`, /react-hook-form|["']react["']/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.deepEqual(plan.routes.map(route => [route.route, route.events.map(event => event.event)]), [["/", ["submit"]], ["/static", []]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runReactHookFormMigrationBrowserTest(fixture, chrome)
})

test("migrates TanStack Query-shaped data by availability time", async t => {
  const fixture = new URL("./fixtures/tanstack-query-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/tanstack-query-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/tanstack-query-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const buildHtml = await readFile(new URL("./fixtures/tanstack-query-migration/dist/index.html", import.meta.url), "utf8")
  const browserHtml = await readFile(new URL("./fixtures/tanstack-query-migration/dist/browser/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/tanstack-query-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/tanstack-query-migration/dist/assets/handlers/pages/browser.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/tanstack-query-migration/.kudzu/pages/browser.mjs", import.meta.url), "utf8")
  const plans = JSON.parse(await readFile(new URL("./fixtures/tanstack-query-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(buildHtml, /Build-known products.*Build oak.*Build pine/s)
  assert.doesNotMatch(`${buildHtml}\n${staticHtml}`, /<script|data-k-state/)
  assert.match(browserHtml, /Browser-only products.*role="status">Loading products/s)
  assert.doesNotMatch(browserHtml, /Old oak|Fresh pine|Recovered cedar/)
  assert.match(handler, /fetch\(`\/api\/products\?request=/)
  assert.match(handler, /queryCleanup/)
  assert.doesNotMatch(`${buildHtml}\n${browserHtml}\n${staticHtml}\n${handler}\n${component}`, /@tanstack\/react-query|QueryClient|QueryClientProvider|["']react["']/)
  assert.deepEqual(plans.map(plan => [plan.route, plan.events.map(event => event.event), plan.effects.length]), [["/browser", ["click"], 1], ["/", [], 0], ["/static", [], 0]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runTanStackQueryMigrationBrowserTest(fixture, chrome)
})

test("migrates used Lucide icons to source-owned static SVG", async t => {
  const fixture = new URL("./fixtures/lucide-source-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/lucide-source-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/lucide-source-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/lucide-source-migration/dist/index.html", import.meta.url), "utf8")
  const icons = await readFile(new URL("./fixtures/lucide-source-migration/.kudzu/icons.mjs", import.meta.url), "utf8")
  const page = await readFile(new URL("./fixtures/lucide-source-migration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const assets = await readdir(new URL("./fixtures/lucide-source-migration/dist/assets", import.meta.url), { recursive: true })
  assert.match(html, /<svg viewBox="0 0 24 24" width="28" height="20" fill="none" stroke="currentColor" stroke-width="1\.5" stroke-linecap="round" stroke-linejoin="round" data-icon="search" class="catalog-icon" role="img"><title>Search catalog<\/title>/)
  assert.match(html, /<svg viewBox="0 0 24 24" width="16" height="18" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-icon="check" class="status-icon" aria-hidden="true"><path/)
  assert.doesNotMatch(html, /data-icon="check"[^>]*><title>/)
  assert.doesNotMatch(html, /<script/)
  assert.deepEqual(assets.filter(file => /\.(?:js|mjs)$/.test(file)), [])
  assert.equal(existsSync(new URL("./fixtures/lucide-source-migration/.kudzu/UnusedIcon.mjs", import.meta.url)), false)
  assert.doesNotMatch(`${html}\n${icons}\n${page}`, /lucide-react|data-icon["']?: ["']unused|Unused icon|["']react["']/)
})

test("migrates Memos outline tracking with an effect-owned animation frame", async t => {
  const fixture = new URL("./fixtures/memos-outline-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/memos-outline-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/memos-outline-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/memos-outline-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/memos-outline-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/memos-outline-migration/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/memos-outline-migration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/memos-outline-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, /<nav aria-label="Memo outline">.*href="#overview".*href="#decisions".*href="#follow-up"/s)
  assert.match(handler, /requestAnimationFrame/)
  assert.match(handler, /cancelAnimationFrame/)
  assert.match(component, /const rafRef = \{ current: 0 \}/)
  assert.doesNotMatch(`${html}\n${handler}\n${component}`, /["']react["']/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.deepEqual(plan.map(route => [route.route, route.events.map(event => event.event), route.effects.map(effect => effect.cleanup)]), [["/", ["click", "click", "click"], [true]], ["/static", [], []]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runMemosOutlineMigrationBrowserTest(fixture, chrome)
})

test("rejects effect-owned animation frames without cleanup cancellation", () => {
  const fixture = new URL("./fixtures/effect-animation-frame-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Animation frame refs require direct cancellation in effect cleanup/)
})

test("characterizes E2B terminal ownership as unsupported Goal C research", async t => {
  const fixture = new URL("./fixtures/goal-c-e2b-terminal", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/goal-c-e2b-terminal/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/goal-c-e2b-terminal/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })

  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:7:\d+ Mutable value useRef\(\) is unsupported except for an effect-owned useRef\(0\) animation-frame handle; otherwise keep resource-private mutable values inside the owning effect/)
})

test("migrates locale routing, interactive MDX, and an effect-owned canvas", async t => {
  const fixture = new URL("./fixtures/colonni-blog-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/colonni-blog-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/colonni-blog-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const koHtml = await readFile(new URL("./fixtures/colonni-blog-migration/dist/ko/index.html", import.meta.url), "utf8")
  const enHtml = await readFile(new URL("./fixtures/colonni-blog-migration/dist/en/index.html", import.meta.url), "utf8")
  const entryHtml = await readFile(new URL("./fixtures/colonni-blog-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/colonni-blog-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/colonni-blog-migration/dist/assets/handlers/pages/[locale]/index.js", import.meta.url), "utf8")
  const entryHandler = await readFile(new URL("./fixtures/colonni-blog-migration/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const mdxHandler = await readFile(new URL("./fixtures/colonni-blog-migration/dist/assets/handlers/components/MdxComponents.js", import.meta.url), "utf8")
  const plans = JSON.parse(await readFile(new URL("./fixtures/colonni-blog-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(koHtml, /<html lang="ko">.*href="\/ko">Home.*href="\/ko\/posts\?tag=JavaScript">Posts.*href="\/en\/posts\/math-for-development">Switch language.*<article lang="ko"><h1>Math for development<\/h1>.*Build-known MDX becomes static HTML.*role="tablist".*<canvas data-k-ref="r0"/s)
  assert.match(enHtml, /<html lang="en">.*href="\/en">Home.*href="\/en\/posts\?tag=JavaScript">Posts.*href="\/ko\/posts\/math-for-development">Switch language.*<article lang="en">/s)
  assert.match(entryHtml, /Choosing your language/)
  assert.match(entryHandler, /localStorage\.getItem\("locale"\)/)
  assert.match(entryHandler, /navigator\.languages/)
  assert.match(entryHandler, /location\.replace/)
  assert.match(mdxHandler, /navigator\.clipboard\.writeText/)
  assert.match(handler, /new IntersectionObserver/)
  assert.match(handler, /requestAnimationFrame/)
  assert.match(handler, /cancelAnimationFrame/)
  assert.match(handler, /performance\.now/)
  assert.doesNotMatch(`${entryHtml}\n${koHtml}\n${enHtml}\n${entryHandler}\n${mdxHandler}\n${handler}`, /new Function|\beval\(|["']react["']|next-intl/)
  assert.doesNotMatch(staticHtml, /<script|data-k-/)
  assert.deepEqual(plans.map(plan => [plan.route, plan.states.length, plan.events.length, plan.effects.length]), [["/ko", 2, 3, 1], ["/en", 2, 3, 1], ["/", 0, 0, 1], ["/static", 0, 0, 0]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) {
    await runColonniBlogMigrationBrowserTest(fixture, chrome)
    await runColonniLocaleDetectionBrowserTest(fixture, chrome)
  }
})

test("rejects canvas observers without owned cleanup", () => {
  const fixture = new URL("./fixtures/canvas-effect-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ IntersectionObserver effects must disconnect "observer" in cleanup/)
})

test("migrates Excalidraw room sharing with a browser capability condition", async t => {
  const fixture = new URL("./fixtures/excalidraw-share-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/excalidraw-share-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/excalidraw-share-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/excalidraw-share-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/excalidraw-share-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/excalidraw-share-migration/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/excalidraw-share-migration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/excalidraw-share-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, /id="room-link" value="https:\/\/draw\.example\.test\/#room=oak,cedar" readOnly/)
  assert.match(html, /data-k-if='\{"id":"c0","kind":"and","initial":false,"state":"s1","mount":true\}'/)
  assert.match(handler, /navigator\.share/)
  assert.match(handler, /navigator\.clipboard\.writeText/)
  assert.match(handler, /"share"in navigator/)
  assert.match(component, /useState\(false, "isShareSupported"\)/)
  assert.doesNotMatch(`${html}\n${handler}\n${component}`, /["']react["']/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.deepEqual(plan.map(route => [route.route, route.states.map(state => state.initialValue), route.effects.length, route.conditions.length]), [["/", ["idle", false], 1, 2], ["/static", [], 0, 0]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runExcalidrawShareMigrationBrowserTest(fixture, chrome)
})

test("rejects escaped navigator capability values", () => {
  const fixture = new URL("./fixtures/navigator-capability-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Navigator capability values may only control one direct JSX && branch/)
})

test("migrates Cal.com responsive booking with static media query stores", async t => {
  const fixture = new URL("./fixtures/calcom-media-query-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/calcom-media-query-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/calcom-media-query-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/calcom-media-query-migration/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/calcom-media-query-migration/dist/static/index.html", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/calcom-media-query-migration/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/calcom-media-query-migration/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/calcom-media-query-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  assert.match(html, /data-layout="column".*id="layout"[^>]*>.*column.*id="visible-days"[^>]*>.*7.* visible days/s)
  assert.match(handler, /matchMedia\("\(max-width: 768px\)"\)/)
  assert.match(handler, /matchMedia\("\(max-width: 1024px\)"\)/)
  assert.match(handler, /addEventListener\("change"/)
  assert.match(handler, /removeEventListener\("change"/)
  assert.doesNotMatch(`${html}\n${handler}\n${component}`, /useSyncExternalStore|["']react["']/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.deepEqual(plan.map(route => [route.route, route.states.map(state => state.initialValue), route.effects.map(effect => effect.cleanup)]), [["/", [false, false], [true, true]], ["/static", [], []]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runCalcomMediaQueryMigrationBrowserTest(fixture, chrome)
})

test("rejects media query stores without matching cleanup", () => {
  const fixture = new URL("./fixtures/media-query-external-store-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Media query subscriptions must add and remove one matching change listener/)
})

test("owns setter callbacks and object refs across one component boundary", async t => {
  const fixture = new URL("./fixtures/callback-ref-ownership", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/callback-ref-ownership/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/callback-ref-ownership/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/callback-ref-ownership/dist/index.html", import.meta.url), "utf8")
  assert.match(html, /id="local-button" data-k-ref="r0" data-generated-id="[^"]+" data-k-native-click=/)
  assert.match(html, /id="imported-button" data-k-ref="r1" data-generated-id="[^"]+" data-k-native-click=/)
  assert.match(html, /id="imported-search" data-k-native-input=/)
  assert.match(html, /role="tooltip"[^>]*>Current age help<\/span>/)
  assert.equal(html.match(/role="tooltip"/g)?.length, 2)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runCallbackRefOwnershipBrowserTest(fixture, chrome)
})

test("rejects repeated setter adapter callback use", () => {
  const fixture = new URL("./fixtures/setter-adapter-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/Adapter\.tsx:\d+:\d+ Setter-callback prop "onValueChange" must be used exactly once in the component/)
})

test("rejects non-null setter-child refs", () => {
  const fixture = new URL("./fixtures/setter-child-invalid-ref", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/InvalidInput\.tsx:\d+:\d+ Setter-callback component useRef\(\) must use the direct initial value null/)
})

test("rejects unsupported setter-child state initializers", () => {
  const fixture = new URL("./fixtures/setter-child-invalid-initializer", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/InvalidInput\.tsx:\d+:\d+ Setter-callback component useState\(\) must use one directly serializable primitive, plain object, or array initial value or direct primitive state prop\.toString\(\); other dynamic initializers are not supported/)
})

test("rejects hookful nested setter children on dynamic paths", () => {
  const fixture = new URL("./fixtures/setter-child-nested-hook-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/Adapter\.tsx:\d+:\d+ Hookful nested setter-callback components require an unconditional or statically truthy render path/)
})

test("rejects forwardRef without direct intrinsic ref forwarding", () => {
  const fixture = new URL("./fixtures/react-forward-ref-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React forwardRef\(\) ref must be forwarded exactly once as ref=\{ref\} on the direct intrinsic root/)
})

test("rejects indirect React forwardRef render functions", () => {
  const fixture = new URL("./fixtures/react-forward-ref-indirect-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React forwardRef\(\) requires exactly one inline render function/)
})

test("owns repeated non-keyed child state across ordinary component boundaries", async t => {
  const fixture = new URL("./fixtures/non-keyed-child-state", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/non-keyed-child-state/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/non-keyed-child-state/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/non-keyed-child-state/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/non-keyed-child-state/dist/static/index.html", import.meta.url), "utf8")
  const plans = JSON.parse(await readFile(new URL("./fixtures/non-keyed-child-state/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes
  const plan = plans.find(route => route.route === "/")
  const initialPlan = plans.find(route => route.route === "/initial")
  const initialHtml = await readFile(new URL("./fixtures/non-keyed-child-state/dist/initial/index.html", import.meta.url), "utf8")
  const pageModule = await readFile(new URL("./fixtures/non-keyed-child-state/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const importedModule = await readFile(new URL("./fixtures/non-keyed-child-state/.kudzu/ImportedToggle.mjs", import.meta.url), "utf8")
  assert.deepEqual(plan.states.map(state => state.id), ["s0", "s1", "s2", "s3", "s4", "s5"])
  assert.deepEqual(plan.conditions.find(condition => condition.owned)?.owned, { true: [["s5", { value: 0 }]], false: [] })
  assert.deepEqual(JSON.parse(html.match(/data-k-state='([^']+)'/)[1]).map(([id]) => id), ["s0", "s1", "s2", "s3", "s4"])
  assert.deepEqual(initialPlan.states.map(state => state.id), ["s0", "s1"])
  assert.deepEqual(initialPlan.conditions[0].owned, { true: [["s1", 0]], false: [] })
  assert.equal(initialHtml.match(/data-k-text="s1"/g)?.length, 2)
  assert.doesNotMatch(initialHtml, /data-k-text="s2"/)
  assert.doesNotMatch(staticHtml, /<script/)
  assert.doesNotMatch(`${pageModule}\n${importedModule}`, /useState\(\(\)\s*=>/)
  const assets = new URL("./fixtures/non-keyed-child-state/dist/assets/", import.meta.url)
  const browserOutput = (await Promise.all((await readdir(assets, { recursive: true })).filter(file => file.endsWith(".js")).map(file => readFile(new URL(file, assets), "utf8")))).join("\n")
  assert.doesNotMatch(browserOutput, /function (?:Toggle|ImportedToggle|OwnedCounter)\b|["']react["']/)
  const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNonKeyedChildStateBrowserTest(fixture, chrome)
})

test("preserves direct primitive state props in child bindings and effects", async t => {
  const fixture = new URL("./fixtures/primitive-prop-dependencies", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/primitive-prop-dependencies/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/primitive-prop-dependencies/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/primitive-prop-dependencies/dist/index.html", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/primitive-prop-dependencies/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-status="Local">Local: <span data-k-text="s0"/)
  assert.match(html, /data-status="Imported">Imported: <span data-k-text="s0"/)
  assert.deepEqual(plan.effects.map(effect => effect.dependencies), [["s0"], ["s0"], ["s0"]])
  assert.match(plan.effects[2].owner, /^e\d+$/)
  assert.equal(plan.conditions[0].mount, true)
  const assets = new URL("./fixtures/primitive-prop-dependencies/dist/assets/", import.meta.url)
  const browserOutput = (await Promise.all((await readdir(assets, { recursive: true })).filter(file => file.endsWith(".js")).map(file => readFile(new URL(file, assets), "utf8")))).join("\n")
  assert.doesNotMatch(browserOutput, /function (?:LocalStatus|ImportedStatus)\b|["']react["']/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runPrimitivePropDependencyBrowserTest(fixture, chrome)
})

test("rejects dynamic lazy useState initializers", () => {
  const fixture = new URL("./fixtures/lazy-state-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Lazy useState\(\) initializer must return one directly serializable primitive, plain-object, or array literal/)
})

test("renders deterministic React useId values without browser JavaScript", async t => {
  const fixture = new URL("./fixtures/react-use-id", import.meta.url)
  const generated = [new URL("./fixtures/react-use-id/.kudzu", import.meta.url), new URL("./fixtures/react-use-id/dist", import.meta.url)]
  t.after(async () => Promise.all(generated.map(directory => rm(directory, { recursive: true, force: true }))))

  const build = () => spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  const first = build()
  assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`)
  const firstHtml = await readFile(new URL("./fixtures/react-use-id/dist/index.html", import.meta.url), "utf8")
  assert.match(firstHtml, /<label for="k-i0">First name<\/label><input id="k-i0" aria-describedby="k-i0-hint"><small id="k-i0-hint">Required<\/small>/)
  assert.match(firstHtml, /<label for="k-i1">Last name<\/label><input id="k-i1" aria-describedby="k-i1-hint"><small id="k-i1-hint">Required<\/small>/)
  assert.match(firstHtml, /<label for="k-i2">Email<\/label><input id="k-i2">/)
  assert.doesNotMatch(firstHtml, /<script|data-k-/)

  await Promise.all(generated.map(directory => rm(directory, { recursive: true, force: true })))
  const second = build()
  assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`)
  assert.equal(await readFile(new URL("./fixtures/react-use-id/dist/index.html", import.meta.url), "utf8"), firstHtml)
  for (const file of ["Field.mjs", "pages/index.mjs"]) {
    const output = await readFile(new URL(`./fixtures/react-use-id/.kudzu/${file}`, import.meta.url), "utf8")
    assert.doesNotMatch(output, /["']react["']|React\.useId|makeId/)
  }
})

test("rejects useId in keyed row components", () => {
  const fixture = new URL("./fixtures/react-use-id-keyed-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ useId\(\) is not supported in keyed row components/)
})

test("rejects non-top-level React useId calls", () => {
  const fixture = new URL("./fixtures/react-use-id-shape-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ useId\(\) must be assigned to one top-level const identifier in a component/)
})

test("migrates aliased and member React hooks from a Vite-shaped app", async t => {
  const fixture = new URL("./fixtures/react-vite-app", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-vite-app/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-vite-app/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/react-vite-app/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/react-vite-app/dist/static/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/react-vite-app/.kudzu/App.mjs", import.meta.url), "utf8")
  const hook = await readFile(new URL("./fixtures/react-vite-app/.kudzu/useCounter.mjs", import.meta.url), "utf8")
  const timerHook = await readFile(new URL("./fixtures/react-vite-app/.kudzu/useErrorFlash.mjs", import.meta.url), "utf8")
  const pulseHook = await readFile(new URL("./fixtures/react-vite-app/.kudzu/usePulse.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/react-vite-app/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.route === "/app/")
  assert.match(html, /href="\/app\/assets\/app\.css"/)
  assert.match(html, /src="\/app\/assets\/logo\.svg"/)
  assert.match(html, /aria-expanded="false"[^>]*data-k-bind-attrs/)
  assert.match(html, /Count.*0/s)
  assert.match(html, /id="reset" data-k-on-click='\[\["set","s\d+",0\],\["set","s\d+","ready"\],\["set","s\d+",-1\],\["set","s\d+",null\]\]'/)
  assert.match(html, /Compiler-grown UI.*Double.*0/s)
  assert.doesNotMatch(component, /\b(?:ReactNode|useCallback|useMemo|useMenuState|runEffect|preserve|derive)\b|React\.useState/)
  assert.match(component, /useState\(false, "menuOpen"\)/)
  assert.match(component, /useCounter\(\)/)
  assert.match(hook, /useState\(0, "count"\)/)
  assert.match(timerHook, /useState\(null, "__kTimerState_/)
  assert.match(pulseHook, /useState\(null, "__kTimerState_/)
  assert.notEqual(timerHook.match(/__kTimerState_[a-f\d]+/)?.[0], pulseHook.match(/__kTimerState_[a-f\d]+/)?.[0])
  assert.equal(existsSync(new URL("./fixtures/react-vite-app/.kudzu/Unused.mjs", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/react-vite-app/.kudzu/TypeOnly.mjs", import.meta.url)), false)
  assert.doesNotMatch(component, /const visibleItems\b/)
  assert.match(html, /id="memo-items".*data-item="a".*Alpha/s)
  assert.match(html, /id="memo-items" class="items "/)
  assert.doesNotMatch(component, /from "clsx"/)
  assert.doesNotMatch(html, /data-item="b"/)
  assert.match(staticHtml, /<a href="\/app\/about\?tab=all#top" class="about-link">About<\/a>/)
  assert.doesNotMatch(await readFile(new URL("./fixtures/react-vite-app/.kudzu/pages/static.mjs", import.meta.url), "utf8"), /RouterLink|react-router-dom/)
  assert.ok(plan.lists.some(list => list.selector?.map(operation => operation[0]).join(",") === "filter,from"))
  assert.doesNotMatch(staticHtml, /<script/)
  const deployFiles = await readdir(new URL("./fixtures/react-vite-app/dist/assets/", import.meta.url), { recursive: true })
  const deployModules = (await Promise.all(deployFiles.filter(file => file.endsWith(".js")).map(file => readFile(new URL(`./fixtures/react-vite-app/dist/assets/${file}`, import.meta.url), "utf8")))).join("\n")
  assert.match(deployModules, /navigator\.clipboard\.writeText/)
  assert.match(deployModules, /setTimeout/)
  assert.match(deployModules, /clearTimeout/)
  assert.ok(!deployFiles.some(file => /kudzu-(?:clipboard|timer)/.test(file)))
  for (const directory of [new URL("./fixtures/react-vite-app/.kudzu/", import.meta.url), new URL("./fixtures/react-vite-app/dist/", import.meta.url)]) {
    const files = (await readdir(directory, { recursive: true })).filter(file => /\.(?:html|js|mjs|json)$/.test(file))
    const output = (await Promise.all(files.map(file => readFile(new URL(file, directory), "utf8")))).join("\n")
    assert.doesNotMatch(output, /(?:\bfrom\s*|\bimport\s*\(\s*)["'](?:react|react-router-dom)["']/)
  }
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runReactViteAppBrowserTest(fixture, chrome)
})

test("rejects aliased relative custom hook results", () => {
  const fixture = new URL("./fixtures/custom-hook-alias-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Relative custom hook results must use direct identifier shorthand without aliases, defaults, or rest/)
})

test("rejects dynamic private custom-hook timer delays", () => {
  const fixture = new URL("./fixtures/custom-hook-timer-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/hooks\/useFlash\.ts:\d+:\d+ Private timeout refs require setTimeout\(\) with one zero-argument callback and a numeric literal delay/)
})

test("rejects dynamic React Router Link destinations", () => {
  const fixture = new URL("./fixtures/react-router-link-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router Link requires a static root-relative to="\/path"/)
})

test("rejects React Router NavLink active-route semantics", () => {
  const fixture = new URL("./fixtures/react-router-nav-link-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router NavLink active-route semantics cannot be erased to a native anchor/)
})

test("rejects React Router Link traversal outside base", () => {
  const fixture = new URL("./fixtures/react-router-link-traversal-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router Link requires a safe static root-relative to="\/path"/)
})

test("lowers React Router imperative navigation to native document navigation", async t => {
  const fixture = new URL("./fixtures/react-router-navigate", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-router-navigate/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-router-navigate/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const component = await readFile(new URL("./fixtures/react-router-navigate/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/react-router-navigate/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const item = await readFile(new URL("./fixtures/react-router-navigate/dist/items/oak/index.html", import.meta.url), "utf8")
  const login = await readFile(new URL("./fixtures/react-router-navigate/dist/login/index.html", import.meta.url), "utf8")
  assert.match(handler, /globalThis\.location\.assign\("\/app\/items\/oak\?view=full#details"\)/)
  assert.match(handler, /globalThis\.location\.replace\("\/app\/login"\)/)
  assert.doesNotMatch(component, /useRouteNavigation|useNavigate|react-router-dom/)
  assert.doesNotMatch(item, /<script/)
  assert.doesNotMatch(login, /<script/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runNavigateBrowserTest(fixture, chrome)
})

test("rejects dynamic React Router imperative navigation destinations", () => {
  const fixture = new URL("./fixtures/react-router-navigate-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router useNavigate requires a static root-relative navigate\("\/path"\) destination/)
})

test("rejects indirect React Router useParams references", () => {
  const fixture = new URL("./fixtures/react-router-params-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router useParams imports may only be called directly/)
})

test("lowers writable React Router search parameters to URL signals", async t => {
  const fixture = new URL("./fixtures/react-router-search-params", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-router-search-params/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-router-search-params/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/react-router-search-params/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/react-router-search-params/dist/about/index.html", import.meta.url), "utf8")
  const params = await readFile(new URL("./fixtures/react-router-search-params/dist/assets/params/index.js", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/react-router-search-params/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/react-router-search-params/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.route === "/")
  assert.match(html, /assets\/params\/index\.js/)
  assert.doesNotMatch(html, />null</)
  assert.doesNotMatch(staticHtml, /<script|data-k-/)
  assert.match(params, /location\.search.*new URLSearchParams/)
  assert.match(params, /replaceState.*pushState/)
  assert.match(params, /__kSetSearchParams/)
  assert.doesNotMatch(params, /location\.pathname|Runtime route|decodeSegment/)
  assert.match(component, /useSearchParam as __kUseSearchParam/)
  assert.doesNotMatch(component, /useQuery|react-router-dom|\buseSearchParams\(/)
  assert.deepEqual(plan.params, [])
  assert.deepEqual(plan.searchParams, [
    { name: "q", id: "p0" },
    { name: "empty", id: "p1" },
    { name: "missing", id: "p2" },
    { name: "dup", id: "p3" },
    { name: "encoded", id: "p4" }
  ])
  assert.equal(plan.searchParamsWritable, true)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runSearchParamBrowserTest(fixture, chrome)
})

test("rejects indirect React Router search parameter updaters", () => {
  const fixture = new URL("./fixtures/react-router-search-params-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router search parameter setters require one synchronous inline updater with one identifier parameter/)
})

test("rejects dynamic React Router search parameter names", () => {
  const fixture = new URL("./fixtures/react-router-search-read-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ React Router search parameters only support direct get\("static-name"\) reads/)
})

test("filters imported static collections with memoized state selectors", async t => {
  const fixture = new URL("./fixtures/imported-memo-collection", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/imported-memo-collection/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/imported-memo-collection/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const component = await readFile(new URL("./fixtures/imported-memo-collection/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/imported-memo-collection/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.route === "/")
  const staticHtml = await readFile(new URL("./fixtures/imported-memo-collection/dist/static/index.html", import.meta.url), "utf8")
  assert.doesNotMatch(component, /\b(?:useMemo|visible)\b/)
  assert.equal(plan.states[1].internal, true)
  assert.equal(plan.lists[0].static, true)
  assert.deepEqual(plan.lists[0].selectorStates, { category: "s0" })
  assert.deepEqual(plan.lists[0].selector[0][1][2][2], ["state", "category"])
  assert.doesNotMatch(staticHtml, /<script/)
  assert.equal(existsSync(new URL("./fixtures/imported-memo-collection/dist/assets/modules/catalog.js", import.meta.url)), false)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runImportedMemoCollectionBrowserTest(fixture, chrome)
})

test("folds directly mapped imported static collections without JavaScript", async t => {
  const fixture = new URL("./fixtures/imported-static-fold", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/imported-static-fold/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/imported-static-fold/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/imported-static-fold/dist/index.html", import.meta.url), "utf8")
  assert.match(html, /<ul><li>Alpha<\/li><\/ul>/)
  assert.doesNotMatch(html, /Beta/)
  assert.doesNotMatch(html, /<script|data-k-/)
  assert.match(await readFile(new URL("./fixtures/imported-static-fold/dist/shadow/index.html", import.meta.url), "utf8"), /<li>Gamma<\/li>/)
})

test("rejects missing imported collection memo dependencies", async t => {
  const fixture = new URL("./fixtures/imported-memo-invalid", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/imported-memo-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/imported-memo-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /React useMemo\(\) must list captured state "category" as a dependency/)
})

test("compiles a Zustand-shaped store into shared layout state", async t => {
  const fixture = new URL("./fixtures/zustand-migration", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/zustand-migration/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/zustand-migration/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const output = new URL("./fixtures/zustand-migration/dist/", import.meta.url)
  const store = await readFile(new URL("./fixtures/zustand-migration/.kudzu/store.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/zustand-migration/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const emitted = (await Promise.all((await readdir(output, { recursive: true })).filter(file => /\.(?:html|js)$/.test(file)).map(file => readFile(new URL(file, output), "utf8")))).join("\n")
  assert.match(store, /__kCreateStore\("store\.ts#useCart", "quantities", \{\}, \["add", "remove"\]\)/)
  assert.doesNotMatch(emitted, /(?:from\s*|import\s*\()["'](?:react|zustand)["']/)
  for (const route of plan.routes) assert.deepEqual(route.states, [{ slot: 0, id: "ls0", name: "store.ts#useCart.quantities", initialValue: {}, lifetime: "layout" }])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runZustandMigrationBrowserTest(fixture, chrome)
})

test("compiles actions returned through a relative Context hook", async t => {
  const fixture = new URL("./fixtures/context-actions", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/context-actions/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/context-actions/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/context-actions/dist/index.html", import.meta.url), "utf8")
  const staticHtml = await readFile(new URL("./fixtures/context-actions/dist/static/index.html", import.meta.url), "utf8")
  const handlers = await readFile(new URL("./fixtures/context-actions/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  assert.match(html, /data-note="1"/)
  assert.match(handlers, /"New"/)
  assert.doesNotMatch(handlers, /createContext|useContext|NotesContext/)
  assert.doesNotMatch(staticHtml, /<script|data-k-/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runContextActionsBrowserTest(fixture, chrome)
})

test("rejects private captures in Context actions", () => {
  const fixture = new URL("./fixtures/context-actions-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/context\.tsx:\d+:\d+ Context action "increment" cannot capture private binding "incrementBy"/)
})

test("rejects Context actions whose state pair is not exposed", () => {
  const fixture = new URL("./fixtures/context-actions-hidden-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/context\.tsx:\d+:\d+ Context action "increment" requires exposed state and setter fields for "count"/)
})

test("rejects indirect Context action references", () => {
  const fixture = new URL("./fixtures/context-actions-reference-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Context actions must be called directly inside an event handler/)
})

test("rejects Context action state collisions in consumers", () => {
  const fixture = new URL("./fixtures/context-actions-collision-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Context action state field "setCount" conflicts with a consumer binding/)
})

test("rejects derived Zustand selectors", async t => {
  const fixture = new URL("./fixtures/zustand-invalid", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/zustand-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/zustand-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:4:\d+ Zustand selectors must be direct arrows such as state => state\.quantities/)
})

test("rejects captured Zustand action helpers", async t => {
  const fixture = new URL("./fixtures/zustand-invalid-action", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/zustand-invalid-action/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/zustand-invalid-action/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Zustand action "add" cannot capture "increment"/)
})

test("rejects side-effect React imports", async t => {
  const fixture = new URL("./fixtures/landing-page-invalid-react", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/landing-page-invalid-react/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/landing-page-invalid-react/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:1:\d+ Side-effect React imports are not supported because Kudzu does not load the React runtime/)
})

test("rejects effectful React useCallback dependencies", async t => {
  const fixture = new URL("./fixtures/react-hook-invalid", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-hook-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-hook-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:4:\d+ React useCallback\(\) dependencies must be identifiers or primitive literals/)
})

test("rejects impure React useMemo expressions", async t => {
  const fixture = new URL("./fixtures/react-memo-invalid", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-memo-invalid/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-memo-invalid/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:4:\d+ React useMemo\(\) callback must return one pure expression/)
})

test("rejects asynchronous React useMemo collection callbacks", async t => {
  const fixture = new URL("./fixtures/react-memo-invalid-callback", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/react-memo-invalid-callback/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/react-memo-invalid-callback/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Rendered Array\.from\(\) mapper callback must be a synchronous arrow function with \(item\) or \(item, index\) identifier parameters/)
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
  assert.match(html, /data-default-list.*class="k[0-9a-f]{8}_row" data-default="1" data-icon="\/assets\/components\/row\.svg".*OAK.*data-aliased-list.*data-named="1".*data-barrel-list.*data-named="1"/s)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 3)
  assert.match(handlers, /as handler/)
  assert.match(handlers, /row-icon.*\/assets\/components\/row\.svg/s)
  assert.equal(plan.lists.length, 3)
})

test("specializes state-backed list components", async t => {
  const fixture = new URL("./fixtures/component-lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/component-lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/component-lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/component-lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/component-lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/component-lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-component-list.*data-item="1">Oak.*data-item="2">Pine/s)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 1)
  assert.match(component, /function ItemList\(\{ items \}\)/)
  assert.equal(plan.lists.length, 1)
  assert.equal(plan.lists[0].state, "s0")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runComponentListBrowserTest(fixture, chrome)
})

test("specializes relative imported state-backed list components", async t => {
  const fixture = new URL("./fixtures/imported-component-lists", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/imported-component-lists/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/imported-component-lists/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/imported-component-lists/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/imported-component-lists/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const nativeRuntime = await readFile(new URL("./fixtures/imported-component-lists/dist/assets/kudzu-native.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/imported-component-lists/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-default-list.*data-named-list.*data-barrel-list/s)
  assert.equal((component.match(/__kList\(/g) ?? []).length, 3)
  assert.deepEqual(plan.lists.map(list => list.state), ["s0", "s0", "s0"])
  assert.equal(existsSync(new URL("./fixtures/imported-component-lists/dist/assets/handlers/components", import.meta.url)), false)
  assert.doesNotMatch(nativeRuntime, /handlers\/components/)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runImportedComponentListBrowserTest(fixture, chrome)
})

test("rejects package imported and cyclic re-exported keyed list components", () => {
  for (const [fixture, message] of [
    ["imported-list-invalid-package", /Package import "Row" may only be referenced directly inside JSX event handlers/],
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
    ["list-invalid-shape", /rest props must be forwarded exactly once to the direct intrinsic root/],
    ["list-invalid-condition", /Keyed list item conditions must read the item/],
    ["list-invalid-browser", /identifier "window" is not allowed/],
    ["list-invalid-capture", /identifier "suffix" is not allowed/],
    ["list-invalid-expression-state", /expression state "selected" must be primitive Kudzu state/],
    ["conditional-map-index-invalid", /Conditional keyed map callbacks cannot use a map index because filtering changes index semantics/],
    ["conditional-map-fallback-invalid", /Conditional keyed map callbacks require condition \? <Element> : null/],
    ["list-invalid-computed-key", /require a direct string or numeric literal key/],
    ["list-invalid-concatenated-key", /require a direct string or numeric literal key/],
    ["list-invalid-duplicate", /Duplicate keyed list key: same/],
    ["list-invalid-fragment", /Fragments are not supported/],
    ["list-invalid-nested", /Nested keyed list collections must be a direct property of the parent item/],
    ["list-invalid-nested-computed", /Nested keyed list collections must be a direct property of the parent item/],
    ["list-invalid-nested-parent-capture", /Nested keyed list rows cannot capture the parent item/],
    ["list-invalid-nested-prototype", /owner property "constructor" is not supported/],
    ["list-invalid-component-cycle", /Keyed list component cycle: First -> Second -> First/],
    ["list-invalid-component-reference", /Keyed list component Row may only be referenced as JSX/],
    ["list-invalid-mutation", /assignments and updates are not supported/],
    ["list-invalid-mutating-method", /mutating method "sort"/],
    ["list-invalid-promise", /arbitrary method "resolve"/],
    ["list-invalid-prototype", /property "constructor" is not supported|cannot read __proto__/],
    ["list-invalid-prototype-key", /property "__proto__" is not supported/],
    ["list-invalid-spread", /item spreads are not supported/],
    ["component-rest-invalid-prototype", /component rest prop "constructor" is not supported/],
    ["list-invalid-style", /style must be an object/],
    ["component-list-invalid-mixed", /State-backed list component ItemList must receive its mapped prop from local state at every call/],
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

test("specializes analyzable prop defaults and rest props in keyed rows", async t => {
  const fixture = new URL("./fixtures/keyed-component-default", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-component-default/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-component-default/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/keyed-component-default/dist/index.html", import.meta.url), "utf8")
  const component = await readFile(new URL("./fixtures/keyed-component-default/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  assert.match(html, /<li data-id="1" class="tree" data-kind="default" aria-label="Tree row" data-k-(?:on|native)-click[^>]*data-tone="quiet" title="row" style="color:forestgreen;opacity:0\.8">/)
  assert.match(html, />Oak<template data-k-list-text-end/)
  assert.match(html, /<small>static \/ typed<\/small>/)
  assert.doesNotMatch(component, /_jsx\(Row|from ["']react["']/)
  assert.match(component, /__kList\(.*className: "tree".*"data-kind": "default".*"aria-label": "Tree row".*"data-tone": "quiet"/s)
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

test("bundles relative TypeScript Workers for inline effects", async t => {
  const fixture = new URL("./fixtures/worker-effects/", import.meta.url)
  const pageUrl = new URL("src/pages/dashboard.tsx", fixture)
  const workerUrl = new URL("src/telemetry.worker.ts", fixture)
  const chartUrl = new URL("src/chart.ts", fixture)
  const ringUrl = new URL("src/telemetry/ring.ts", fixture)
  const plainUrl = new URL("src/pages/plain.tsx", fixture)
  const configUrl = new URL("kudzu.config.mjs", fixture)
  const pageSource = await readFile(pageUrl, "utf8")
  const workerSource = await readFile(workerUrl, "utf8")
  const chartSource = await readFile(chartUrl, "utf8")
  const ringSource = await readFile(ringUrl, "utf8")
  const plainSource = await readFile(plainUrl, "utf8")
  const configSource = await readFile(configUrl, "utf8")
  const buildFixture = () => spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  const workerFiles = async () => (await readdir(new URL("dist/assets/workers/", fixture), { recursive: true })).filter(file => file.endsWith(".js")).sort()
  t.after(async () => {
    await writeFile(pageUrl, pageSource)
    await writeFile(workerUrl, workerSource)
    await writeFile(chartUrl, chartSource)
    await writeFile(ringUrl, ringSource)
    await writeFile(plainUrl, plainSource)
    await writeFile(configUrl, configSource)
    await rm(new URL(".kudzu", fixture), { recursive: true, force: true })
    await rm(new URL("dist", fixture), { recursive: true, force: true })
    await rm(new URL("public", fixture), { recursive: true, force: true })
  })

  try {
    const first = buildFixture()
    assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`)
    const sourceResult = inspectSourceResult(fixture, "src/pages/dashboard.tsx")
    assert.equal(sourceResult.moduleIR.effects.length, 1)
    assert.equal(sourceResult.moduleIR.handlers[sourceResult.moduleIR.effects[0].setup.handler].role, "effect")
    assert.deepEqual(sourceResult.moduleIR.effects[0].workers.map(worker => [worker.root, worker.source.file]), [["telemetry.worker.ts", "src/pages/dashboard.tsx"]])
    assert.equal("workerReferences" in sourceResult, false)
    const firstFiles = await workerFiles()
    assert.equal(firstFiles.length, 1)
    assert.match(firstFiles[0], /^telemetry\.worker-[A-Z0-9]+\.js$/)
    const firstWorker = await readFile(new URL(`dist/assets/workers/${firstFiles[0]}`, fixture))
    const dashboard = await readFile(new URL("dist/dashboard/index.html", fixture), "utf8")
    const plain = await readFile(new URL("dist/plain/index.html", fixture), "utf8")
    const staticHtml = await readFile(new URL("dist/static/index.html", fixture), "utf8")
    const handler = await readFile(new URL("dist/assets/handlers/pages/dashboard.js", fixture), "utf8")
    const capabilityPaths = ["kudzu.js", "kudzu-effect.js", "kudzu-navigation.js", "effects/dashboard/index.js"]
    const capabilities = await Promise.all(capabilityPaths.map(path => readFile(new URL(`dist/assets/${path}`, fixture))))
    assert.doesNotMatch([dashboard, plain, staticHtml].join("\n"), /assets\/workers|\.worker-/)
    assert.match(handler, new RegExp(`/dash/assets/workers/${firstFiles[0].replace(".", "\\.")}`))
    assert.doesNotMatch(handler, /__kudzu_worker_|import\.meta|telemetry\.worker\.ts/)
    assert.doesNotMatch(plain, /effects\/|kudzu-effect|handlers\/pages\/dashboard/)
    assert.doesNotMatch(staticHtml, /<script|data-k-state|data-k-capability/)

    const second = buildFixture()
    assert.equal(second.status, 0, `${second.stdout}\n${second.stderr}`)
    assert.deepEqual(await workerFiles(), firstFiles)
    assert.deepEqual(await readFile(new URL(`dist/assets/workers/${firstFiles[0]}`, fixture)), firstWorker)

    const effectStart = pageSource.indexOf("  useEffect(() => {")
    const effectEnd = pageSource.indexOf("\n\n  return <main", effectStart)
    const noWorkerPage = pageSource.slice(0, effectStart) + `  useEffect(() => {
    const canvas = document.querySelector<HTMLCanvasElement>("[data-chart]")!
    const chart = createChart(canvas)
    chart.render({ batchSize: 10, buffered: 128, generated: 130, elapsed: 0, points: [0, 1] })
    return () => chart.dispose()
  }, [])` + pageSource.slice(effectEnd)
    await writeFile(pageUrl, noWorkerPage)
    const noWorker = buildFixture()
    assert.equal(noWorker.status, 0, `${noWorker.stdout}\n${noWorker.stderr}`)
    assert.equal(existsSync(new URL("dist/assets/workers", fixture)), false)
    assert.deepEqual(await Promise.all(capabilityPaths.map(path => readFile(new URL(`dist/assets/${path}`, fixture)))), capabilities)

    const unusedWorkerPage = `${noWorkerPage}\nfunction UnusedWorker() {\n${pageSource.slice(effectStart, effectEnd)}\n  return null\n}\n`
    await writeFile(pageUrl, unusedWorkerPage)
    const unusedWorker = buildFixture()
    assert.equal(unusedWorker.status, 0, `${unusedWorker.stdout}\n${unusedWorker.stderr}`)
    assert.equal(inspectSourceResult(fixture, "src/pages/dashboard.tsx").moduleIR.effects.length, 2)
    assert.equal(existsSync(new URL("dist/assets/workers", fixture)), false)
    const unusedWorkerHandler = await readFile(new URL("dist/assets/handlers/pages/dashboard.js", fixture), "utf8")
    assert.match(unusedWorkerHandler, /about:blank/)
    assert.doesNotMatch(unusedWorkerHandler, /__kudzu_worker_/)
    await writeFile(pageUrl, pageSource)

    await writeFile(configUrl, configSource.replace('base: "/dash"', 'base: "/dash\\\"quoted!()[]"'))
    const quotedBase = buildFixture()
    assert.equal(quotedBase.status, 0, `${quotedBase.stdout}\n${quotedBase.stderr}`)
    const quotedHandlerUrl = new URL("dist/assets/handlers/pages/dashboard.js", fixture)
    const quotedHandler = await readFile(quotedHandlerUrl, "utf8")
    assert.ok(quotedHandler.includes(`new Worker('/dash"quoted!()[]/assets/workers/`) || quotedHandler.includes(`new Worker("/dash\\"quoted!()[]/assets/workers/`))
    const parsedHandler = spawnSync(process.execPath, ["--check", quotedHandlerUrl.pathname], { encoding: "utf8" })
    assert.equal(parsedHandler.status, 0, parsedHandler.stderr)
    await writeFile(configUrl, configSource)

    await writeFile(workerUrl, workerSource.replace("downsample(ring.snapshot(), 24)", "downsample(ring.snapshot(), 23)"))
    const changed = buildFixture()
    assert.equal(changed.status, 0, `${changed.stdout}\n${changed.stderr}`)
    assert.notDeepEqual(await workerFiles(), firstFiles)
    await writeFile(workerUrl, workerSource)

    for (const [source, message] of [
      [pageSource.replace('"../telemetry.worker.ts"', "workerPath"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Worker paths must be relative string literals/],
      [pageSource.replace("telemetry.worker.ts", "telemetry.ts"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Worker paths must end in \.worker\.ts/],
      [pageSource.replace("telemetry.worker.ts", "missing.worker.ts"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Worker .* must resolve to an existing \.worker\.ts/],
      [pageSource.replace("../telemetry.worker.ts", "../../outside.worker.ts"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Worker source must remain under src/],
      [pageSource.replace('{ type: "module" }', '{}'), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require exactly/],
      [pageSource.replace('{ type: "module" }', '{ type: "module", name: "telemetry" }'), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require exactly/],
      [pageSource.replace('{ type: "module" }', '{ ...workerOptions, type: "module" }'), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require exactly/],
      [pageSource.replace("  useEffect(() => {", "  const Worker = class {} as any\n  useEffect(() => {"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require the unshadowed global Worker/],
      [pageSource.replace("export default function Dashboard() {", "export default function Dashboard() {\n  enum Worker { Shadowed }"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require the unshadowed global Worker/],
      [`namespace URL { export const shadowed = true }\n${pageSource}`, /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require the unshadowed global URL/],
      [`import Worker = require("../chart")\n${pageSource}`, /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require the unshadowed global Worker/],
      [pageSource.replace("import.meta.url", "location.href"), /dashboard\.tsx:\d+:\d+ Relative TypeScript Workers require new URL/]
    ]) {
      await writeFile(pageUrl, source)
      const invalid = buildFixture()
      assert.notEqual(invalid.status, 0)
      assert.match(`${invalid.stdout}\n${invalid.stderr}`, message)
    }
    await writeFile(pageUrl, pageSource)
    for (const source of [
      `import "../telemetry.worker.ts"\n${pageSource}`,
      `export * from "../telemetry.worker.ts"\n${pageSource}`
    ]) {
      await writeFile(pageUrl, source)
      const runtimeImport = buildFixture()
      assert.notEqual(runtimeImport.status, 0)
      assert.match(`${runtimeImport.stdout}\n${runtimeImport.stderr}`, /dashboard\.tsx:\d+:\d+ Worker source modules cannot be imported or re-exported as ordinary runtime modules.*use new Worker/)
    }
    await writeFile(pageUrl, pageSource)
    const eventSource = pageSource
      .replace("  useEffect(() => {", "  const start = () => {")
      .replace("  }, [])\n\n  return <main", "  }\n\n  return <main onClick={start}")
    await writeFile(pageUrl, eventSource)
    const eventWorker = buildFixture()
    assert.notEqual(eventWorker.status, 0)
    assert.match(`${eventWorker.stdout}\n${eventWorker.stderr}`, /dashboard\.tsx:\d+:\d+ Relative TypeScript Worker construction is only supported directly inside an inline useEffect/)
    await writeFile(pageUrl, pageSource)
    await writeFile(chartUrl, `${chartSource}\nexport function unsupportedWorkerHelper() {\n  return new Worker(new URL("./telemetry.worker.ts", import.meta.url), { type: "module" })\n}\n`)
    const helperWorker = buildFixture()
    assert.notEqual(helperWorker.status, 0)
    assert.match(`${helperWorker.stdout}\n${helperWorker.stderr}`, /chart\.ts:\d+:\d+ Relative TypeScript Worker construction is only supported directly inside an inline useEffect.*imported client helpers/)
    await writeFile(chartUrl, chartSource)
    await writeFile(plainUrl, `import { useState } from "@kudzujs/core"
import UnusedWorkerRow from "../UnusedWorkerRow"
import { Shell } from "../Shell"
export const layout = Shell
export default function Plain() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <main><ul>{items.map(item => <UnusedWorkerRow key={item.id} item={item} />)}</ul></main>
}
`)
    const importedRow = buildFixture()
    assert.notEqual(importedRow.status, 0)
    assert.match(`${importedRow.stdout}\n${importedRow.stderr}`, /UnusedWorkerRow\.tsx:\d+:\d+ Relative TypeScript Worker construction in imported keyed-row effects is not supported/)
    await writeFile(plainUrl, plainSource)
    for (const [source, message] of [
      ['import "example-package"\n' + workerSource, /telemetry\.worker\.ts:\d+:\d+ Worker modules may only use relative runtime imports/],
      ['import "./Shell"\n' + workerSource, /Shell\.tsx:\d+:\d+ Worker modules must not contain JSX/],
      ['void import(".\/telemetry\/ring")\n' + workerSource, /telemetry\.worker\.ts:\d+:\d+ Dynamic imports are not supported in Worker modules/],
      ['import { missing } from "..\/outside"\n' + workerSource, /telemetry\.worker\.ts:\d+:\d+ Relative import "\.\.\/outside" must resolve to one TypeScript file in src/]
    ]) {
      await writeFile(workerUrl, source)
      const invalid = buildFixture()
      assert.notEqual(invalid.status, 0)
      assert.match(`${invalid.stdout}\n${invalid.stderr}`, message)
    }
    await writeFile(workerUrl, workerSource)
    for (const specifier of ["./downsample", "legacy-worker-package"]) {
      await writeFile(ringUrl, `import Legacy = require(${JSON.stringify(specifier)})\n${ringSource}`)
      const importEquals = buildFixture()
      assert.notEqual(importEquals.status, 0)
      assert.match(`${importEquals.stdout}\n${importEquals.stderr}`, /telemetry\/ring\.ts:\d+:\d+ TypeScript import-equals declarations are not supported in Worker modules/)
    }
    await writeFile(ringUrl, ringSource)
    await mkdir(new URL("public/assets/workers", fixture), { recursive: true })
    const collision = buildFixture()
    assert.notEqual(collision.status, 0)
    assert.match(`${collision.stdout}\n${collision.stderr}`, /public\/assets\/workers collides/)
    await rm(new URL("public", fixture), { recursive: true, force: true })

    const finalBuild = buildFixture()
    assert.equal(finalBuild.status, 0, `${finalBuild.stdout}\n${finalBuild.stderr}`)
    const finalWorker = (await workerFiles())[0]
    const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
    if (chrome) await runWorkerEffectBrowserTest(fixture, chrome, `/dash/assets/workers/${finalWorker}`)
  } finally {
    await writeFile(pageUrl, pageSource)
    await writeFile(workerUrl, workerSource)
    await writeFile(chartUrl, chartSource)
    await writeFile(ringUrl, ringSource)
    await writeFile(plainUrl, plainSource)
    await writeFile(configUrl, configSource)
  }
})

test("owns effects rendered inside conditional DOM", async t => {
  const fixture = new URL("./fixtures/conditional-effects", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/conditional-effects/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/conditional-effects/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const html = await readFile(new URL("./fixtures/conditional-effects/dist/index.html", import.meta.url), "utf8")
  const entry = await readFile(new URL("./fixtures/conditional-effects/dist/assets/effects/index.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/conditional-effects/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes[0]
  assert.match(html, /data-k-effect=/)
  assert.match(entry, /registerMountHook/)
  assert.equal(plan.effects[0].owner, "e0")
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runConditionalEffectBrowserTest(fixture, chrome)
})

test("owns effects rendered by imported keyed row components", async t => {
  const fixture = new URL("./fixtures/keyed-effects", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-effects/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-effects/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const sourceResult = inspectSourceResult(fixture, "src/pages/index.tsx")
  assert.deepEqual(sourceResult.moduleIR.effects.map(effect => [effect.ownership.kind, effect.ownership.keyedBlock, effect.itemDependencies, effect.dependencies]), [
    ["keyed", 0, ["id"], []],
    ["keyed", 0, ["name"], [{ kind: "signal", signal: 0 }]]
  ])
  assert.ok(sourceResult.moduleIR.effects.every(effect => effect.source.file === "src/EffectRow.tsx" && effect.ownership.component.name === "EffectRow" && effect.ownership.component.source.file === "src/EffectRow.tsx"))
  assert.ok(sourceResult.moduleIR.effects.every(effect => sourceResult.moduleIR.handlers[effect.setup.handler].keyedBlock === effect.ownership.keyedBlock))
  const html = await readFile(new URL("./fixtures/keyed-effects/dist/index.html", import.meta.url), "utf8")
  const entry = await readFile(new URL("./fixtures/keyed-effects/dist/assets/effects/index.js", import.meta.url), "utf8")
  const itemOnlyEntry = await readFile(new URL("./fixtures/keyed-effects/dist/assets/effects/item-only/index.js", import.meta.url), "utf8")
  const stateOnlyEntry = await readFile(new URL("./fixtures/keyed-effects/dist/assets/effects/state-only/index.js", import.meta.url), "utf8")
  const listRuntime = await readFile(new URL("./fixtures/keyed-effects/dist/assets/kudzu-list.js", import.meta.url), "utf8")
  const runtime = await readFile(new URL("./fixtures/keyed-effects/dist/assets/kudzu.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/keyed-effects/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.route === "/")
  assert.match(html, /data-k-effects=/)
  assert.match(entry, /kEffectItem/)
  assert.match(entry, /registerListItemHook/)
  assert.match(itemOnlyEntry, /registerListItemHook/)
  assert.doesNotMatch(itemOnlyEntry, /registerCommitter|dependencyIds/)
  assert.match(listRuntime, /notifyListItem/)
  assert.match(runtime, /registerListItemHook|notifyListItem/)
  assert.match(listRuntime, /\.length<\w+\.length/)
  assert.doesNotMatch(stateOnlyEntry, /itemDependencies|listState|dependencyIds|keyed item dependency|registerListItemHook|notifyListItem/)
  assert.doesNotMatch(entry, /kRowPath|specializeRowEffect|\$k/)
  assert.doesNotMatch(listRuntime, /list-index|\.indexed|\.selector|ownershipPaths|rowReplacements|kRowPath/)
  assert.deepEqual(plan.effects.map(effect => [effect.owner, effect.list, effect.dependencies, effect.itemDependencies, effect.listState]), [["e0", true, undefined, ["id"], "s2"], ["e1", true, ["s1"], ["name"], "s2"]])
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runKeyedEffectBrowserTest(fixture, chrome)
})

test("omits keyed item notifications from state-only effect builds", async t => {
  const fixture = new URL("./fixtures/keyed-effects-state-only", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/keyed-effects-state-only/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/keyed-effects-state-only/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const output = await Promise.all([
    "dist/assets/effects/index.js",
    "dist/assets/kudzu-list.js",
    "dist/assets/kudzu.js"
  ].map(path => readFile(new URL(path, `${fixture.href}/`), "utf8")))
  assert.doesNotMatch(output.join("\n"), /itemDependencies|listState|registerListItemHook|notifyListItem|keyed item dependency/)
  assert.doesNotMatch(output.join("\n"), /\.length!==\w+\.items\.length/)
  assert.match(output[0], /registerCommitter/)
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

test("reruns multiple primitive dependency effects after cleanup", async t => {
  const fixture = new URL("./fixtures/effect-dependencies", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/effect-dependencies/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/effect-dependencies/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const sourceResult = inspectSourceResult(fixture, "src/pages/index.tsx")
  const { derived, effects } = sourceResult.moduleIR
  assert.deepEqual(derived.map(entry => [entry.kind, entry.signals.map(slot => sourceResult.moduleIR.signals[slot].debugName), entry.expression]), [["expression", ["count"], ["conditional", ["binary", "===", ["binary", "%", ["state", "count"], ["value", 2]], ["value", 0]], ["value", "even"], ["value", "odd"]]]])
  const signalNames = slots => slots.map(slot => sourceResult.moduleIR.signals[slot].debugName)
  assert.deepEqual(effects.map(effect => [effect.cleanup, effect.dependencies, effect.subscriptions]), [
    [true, [{ kind: "signal", signal: 0 }, { kind: "signal", signal: 1 }], [0, 1]],
    [true, [{ kind: "signal", signal: 2 }], [2]],
    [true, [{ kind: "derived", derived: 0, sources: [0] }], [0]],
    [true, [{ kind: "signal", signal: 0 }], [0]]
  ])
  assert.deepEqual(effects.map(effect => signalNames(effect.subscriptions)), [["count", "page"], ["countAlias"], ["count"], ["count"]])
  assert.deepEqual(JSON.parse(JSON.stringify(effects)), effects)
  const entryUrl = new URL("./fixtures/effect-dependencies/dist/assets/effects/index.js", import.meta.url)
  const runtimeUrl = new URL("./fixtures/effect-dependencies/dist/assets/kudzu-deps.js", import.meta.url)
  const entry = await readFile(entryUrl, "utf8")
  const runtime = await readFile(runtimeUrl, "utf8")
  const expressionRuntime = await readFile(new URL("./fixtures/effect-dependencies/dist/assets/kudzu-collection-selector.js", import.meta.url), "utf8")
  const html = await readFile(new URL("./fixtures/effect-dependencies/dist/index.html", import.meta.url), "utf8")
  const commandHtml = await readFile(new URL("./fixtures/effect-dependencies/dist/command/index.html", import.meta.url), "utf8")
  const commandRuntime = await readFile(new URL("./fixtures/effect-dependencies/dist/assets/kudzu.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/effect-dependencies/.kudzu/kudzu-plan.json", import.meta.url), "utf8")).routes.find(route => route.effects.length)
  assert.match(entry, /registerCommitter/)
  assert.match(entry, /kudzu-collection-selector/)
  assert.match(expressionRuntime, /evaluateCollectionExpression/)
  assert.match(runtime, /registerCommitter/)
  assert.match(html, /kudzu-deps\.js/)
  assert.match(html, /\/docs&amp;notes\/assets\/kudzu-deps\.js/)
  assert.match(html, /data-runtime-link="\/assets\/kudzu\.js"/)
  assert.doesNotMatch(commandHtml, /kudzu-deps\.js/)
  assert.doesNotMatch(commandRuntime, /registerCommitter/)
  assert.doesNotMatch(commandRuntime, /kState/)
  assert.match(runtime, /kState/)
  assert.deepEqual(plan.effects.map(effect => effect.dependencies), [["s0", "s1"], ["s0"], ["s0"], ["s0"]])
  assert.equal(plan.effects[2].dependencyExpressions.length, 1)

  const browser = spawnSync(process.execPath, ["--input-type=module", "-e", `
const listeners = new Map()
const stateNodes = [{ dataset: { kText: "s0", kValue: "0" }, textContent: "0" }, { dataset: { kText: "s1", kValue: "1" }, textContent: "1" }]
globalThis.document = { body: { dataset: { kState: JSON.stringify([["s2", "dependency-only"]]) } }, querySelectorAll: selector => selector === "[data-k-text]" ? stateNodes : [], addEventListener() {} }
globalThis.addEventListener = (name, listener) => listeners.set(name, listener)
await import(${JSON.stringify(entryUrl.href)})
const runtime = await import(${JSON.stringify(runtimeUrl.href)})
const initial = "|setup 0:1|second setup 0|parity setup even|named setup 0"
if (document.body.dataset.effectLog !== initial) throw new Error("initial")
runtime.applyCommands(runtime.browserState, [["add", "s1", 1]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
const pageRerun = initial + "|cleanup 0:1|setup 0:2"
if (document.body.dataset.effectLog !== pageRerun) throw new Error("second-dependency: " + document.body.dataset.effectLog)
runtime.applyCommands(runtime.browserState, [["add", "s0", 1], ["add", "s1", 1]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
const rerun = pageRerun + "|cleanup 0:2|second cleanup 0|parity cleanup even|named cleanup 0|setup 1:3|second setup 1|parity setup odd|named setup 1"
if (document.body.dataset.effectLog !== rerun) throw new Error("rerun: " + document.body.dataset.effectLog)
runtime.applyCommands(runtime.browserState, [["add", "s0", 2]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
const sameParity = rerun + "|cleanup 1:3|second cleanup 1|named cleanup 1|setup 3:3|second setup 3|named setup 3"
if (document.body.dataset.effectLog !== sameParity) throw new Error("equal-derived: " + document.body.dataset.effectLog)
runtime.applyCommands(runtime.browserState, [["set", "s1", 3]], runtime.commitDom)
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.effectLog !== sameParity) throw new Error("equal-direct: " + document.body.dataset.effectLog)
listeners.get("pagehide")({ persisted: false })
await new Promise(resolve => setTimeout(resolve, 0))
if (document.body.dataset.effectLog !== sameParity + "|cleanup 3:3|parity cleanup odd|named cleanup 3|second cleanup 3") throw new Error("dispose: " + document.body.dataset.effectLog)
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

test("rejects unsupported mount effect forms", async () => {
  for (const [fixture, message] of [
    ["effect-invalid-dependencies", /dependencies must be direct state or runtime parameter identifiers/],
    ["effect-invalid-dependency-array", /dependencies must be a literal array/],
    ["effect-invalid-dependency-local", /dependencies must be primitive Kudzu state or runtime parameter identifiers/],
    ["effect-invalid-dependency-derived", /Rendered collection expressions cannot call arbitrary functions/],
    ["effect-invalid-callback-local", /callback must be inline or one top-level const function/],
    ["effect-invalid-dependency-object", /dependencies must be primitive Kudzu state or runtime parameter identifiers/],
    ["effect-invalid-cleanup", /async callbacks cannot return cleanup functions/],
    ["effect-invalid-cleanup-shape", /cleanup functions cannot declare parameters or be generators/],
    ["effect-invalid-cleanup-generator", /cleanup functions cannot declare parameters or be generators/],
    ["effect-invalid-generator", /callback cannot be a generator/],
    ["effect-invalid-named", /callback function must be anonymous/],
    ["effect-invalid-list-dependency", /src\/pages\/index\.tsx:\d+:\d+ useEffect\(\) keyed item dependencies must be direct item\.<field> properties/]
  ]) {
    const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL(`./fixtures/${fixture}`, import.meta.url), encoding: "utf8" })
    assert.notEqual(result.status, 0)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
  }
  const fixture = new URL("./fixtures/effect-invalid-list-dependency/", import.meta.url)
  const sourceUrl = new URL("src/pages/index.tsx", fixture)
  const source = await readFile(sourceUrl, "utf8")
  try {
    for (const [dependency, message] of [
      ["item", /keyed item dependencies must be direct item\.<field> properties/],
      ['item["name"]', /keyed item dependencies must be direct item\.<field> properties/],
      ["item.__proto__", /keyed item property "__proto__" is not supported/]
    ]) {
      await writeFile(sourceUrl, source.replace("item.name.length", dependency))
      const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
      assert.notEqual(result.status, 0)
      assert.match(`${result.stdout}\n${result.stderr}`, message)
    }
  } finally {
    await writeFile(sourceUrl, source)
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
  const commandModule = await readFile(new URL("./fixtures/effect-isolation/.kudzu/pages/command.mjs", import.meta.url), "utf8")
  const commandSource = inspectSourceResult(fixture, "src/pages/command.tsx")
  const runtime = await readFile(new URL("./fixtures/effect-isolation/dist/assets/kudzu.js", import.meta.url), "utf8")
  const effectRuntime = await readFile(new URL("./fixtures/effect-isolation/dist/assets/kudzu-effect.js", import.meta.url), "utf8")
  assert.equal(commandSource.handlerModule, undefined)
  assert.deepEqual(commandSource.moduleIR.handlers.map(handler => handler.commands), Array.from({ length: 4 }, () => [{ operation: "add", signal: 0, value: 1 }]))
  assert.equal((command.match(/data-k-on-click=/g) ?? []).length, 4)
  assert.doesNotMatch(command, /data-k-native/)
  assert.equal((commandModule.match(/__kBehavior\(/g) ?? []).length, 4)
  assert.doesNotMatch(commandModule, /__kNativeBehavior/)
  assert.equal(existsSync(new URL("./fixtures/effect-isolation/dist/assets/handlers/pages/command.js", import.meta.url)), false)
  assert.doesNotMatch(command, /effects\//)
  assert.doesNotMatch(runtime, /registerMountHook|registerCommitter/)
  assert.doesNotMatch(effectRuntime, /deserialize|kudzu-serialization/)
  assert.equal(existsSync(new URL("./fixtures/effect-isolation/dist/assets/kudzu-serialization.js", import.meta.url)), false)
})

test("bundles package imports used only by direct event handlers", async t => {
  const fixture = new URL("./fixtures/event-package", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/event-package/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/event-package/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const component = await readFile(new URL("./fixtures/event-package/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const handler = await readFile(new URL("./fixtures/event-package/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  assert.doesNotMatch(component, /typescript|\bts\b/)
  assert.match(handler, /5\.9\./)
})

test("rejects package imports used during rendering", () => {
  const fixture = new URL("./fixtures/event-package-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Package import "ts" may only be referenced directly inside JSX event handlers/)
})

test("rejects side-effect package imports", () => {
  const fixture = new URL("./fixtures/event-package-side-effect-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Side-effect package import "typescript" is not supported/)
})

test("rejects dynamic package imports", () => {
  const fixture = new URL("./fixtures/event-package-dynamic-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Dynamic import "typescript" is not supported in ordinary source modules/)
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
  const nativeEntry = await readFile(new URL("./fixtures/native/dist/assets/native/index.js", import.meta.url), "utf8")
  const otherNativeEntry = await readFile(new URL("./fixtures/native/dist/assets/native/other/index.js", import.meta.url), "utf8")
  const serialization = await readFile(new URL("./fixtures/native/dist/assets/kudzu-serialization.js", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/native/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  const native = plan.routes[0].events[0].native
  assert.match(html, /data-k-native-click/)
  assert.match(html, /assets\/native\/index\.js/)
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
  assert.doesNotMatch(nativeRuntime, /handlers\/pages/)
  assert.match(nativeEntry, /handlers\/pages\/index\.js/)
  assert.doesNotMatch(nativeEntry, /handlers\/pages\/other\/index\.js/)
  assert.match(otherNativeEntry, /handlers\/pages\/other\/index\.js/)
  assert.doesNotMatch(otherNativeEntry, /handlers\/pages\/index\.js/)
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

  let active = true
  const releasedState = new Map([["s0", 0]])
  const releasedCommits = []
  const releasedContext = createNativeContext(releasedState, { count: "s0" }, (id, value) => releasedCommits.push([id, value]), native.scope, () => active)
  const pending = handlers.handler0(releasedContext, { currentTarget: { dataset: { enabled: "yes" } } })
  active = false
  releasedState.delete("s0")
  await pending
  await Promise.resolve()
  assert.equal(releasedState.has("s0"), false)
  assert.deepEqual(releasedCommits, [])

  globalThis.__KUDZU_CAPTURE_SETTER__ = true
  try {
    let captureActive = true
    const capturedState = new Map([["s0", 0]])
    const capturedContext = createNativeContext(capturedState, {}, () => assert.fail("inactive captured setter committed"), { update: { type: "setter", id: "s0" } }, () => captureActive)
    captureActive = false
    capturedContext.scope("update")(1)
    await Promise.resolve()
    assert.equal(capturedState.get("s0"), 0)
  } finally {
    delete globalThis.__KUDZU_CAPTURE_SETTER__
  }
})

test("compiles imported reducers to functional state updates", async t => {
  const fixture = new URL("./fixtures/reducer", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/reducer/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/reducer/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)

  const html = await readFile(new URL("./fixtures/reducer/dist/index.html", import.meta.url), "utf8")
  const lazyHtml = await readFile(new URL("./fixtures/reducer/dist/lazy/index.html", import.meta.url), "utf8")
  const handlerSource = await readFile(new URL("./fixtures/reducer/dist/assets/handlers/pages/index.js", import.meta.url), "utf8")
  const compiled = await readFile(new URL("./fixtures/reducer/.kudzu/pages/index.mjs", import.meta.url), "utf8")
  const lazyCompiled = await readFile(new URL("./fixtures/reducer/.kudzu/pages/lazy.mjs", import.meta.url), "utf8")
  const plan = JSON.parse(await readFile(new URL("./fixtures/reducer/.kudzu/kudzu-plan.json", import.meta.url), "utf8"))
  assert.match(html, /data-k-native-click/)
  assert.match(html, /data-k-list=/)
  assert.match(html, /data-k-list-events=/)
  assert.match(compiled, /useReducer\(todoReducer, \[\], "todos"\)/)
  assert.match(lazyHtml, /<main>.*Prepared.*<\/main>/)
  assert.match(lazyCompiled, /useReducer\(todoReducer, \[\{\s*id: 1,\s*title: "Prepared",\s*edits: 0\s*\}\], "todos"\)/)
  assert.doesNotMatch(lazyCompiled, /from "react"/)
  assert.doesNotMatch(handlerSource, /initializeTodos/)
  assert.equal(handlerSource.match(/\.set\("todos",/g)?.length, 12)
  assert.match(handlerSource, /return \w\+1/)
  assert.match(handlerSource, /Imported/)
  assert.match(handlerSource, /\.scope\("todo"\)/)
  assert.match(html, /class="edit-toggle" data-k-set-true-click=/)
  assert.match(html, /id="imported-input" class="new-todo" data-priority="-1"/)
  assert.doesNotMatch(html, /data-item=/)
  assert.equal(existsSync(new URL("./fixtures/reducer/dist/assets/handlers/ImportedControls.js", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/reducer/dist/assets/handlers/ImportedInput.js", import.meta.url)), false)
  assert.equal(existsSync(new URL("./fixtures/reducer/dist/assets/handlers/ImportedItem.js", import.meta.url)), false)
  assert.ok(plan.routes[0].events.some(event => event.native?.scope.todo?.type === "list-item"))
  for (const event of plan.routes[0].events.filter(event => event.native && "todos" in event.native.states)) {
    assert.equal(event.native.states.todos, "s0")
    assert.equal("dispatch" in event.native.scope || "send" in event.native.scope, false)
  }
  const editEvents = plan.routes[0].events.filter(event => ["blur", "keydown"].includes(event.event) && event.native?.scope.todo?.type === "list-item")
  assert.equal(editEvents.length, 2)
  for (const event of editEvents) assert.ok(Object.values(event.native.states).some(id => id === "s1:$k"))
  assert.equal(plan.routes[0].lists[0].rowStates[0].id.endsWith(":$k"), true)

  const state = new Map([["s0", []]])
  const commits = []
  const context = createNativeContext(state, { todos: "s0" }, (id, value) => commits.push([id, value]), plan.routes[0].events[0].native.scope)
  const handlers = await import(`${new URL("./fixtures/reducer/dist/assets/handlers/pages/index.js", import.meta.url).href}?v=${Date.now()}`)
  handlers.handler0(context)
  assert.deepEqual(state.get("s0"), [{ id: 1, title: "Read", edits: 0 }, { id: 2, title: "Ship", edits: 0 }])
  await Promise.resolve()
  assert.equal(commits.length, 1)
  const chrome = [process.env.CHROME_BIN, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))
  if (chrome) await runReducerBrowserTest(fixture, chrome)
})

test("rejects dynamic lazy reducer initializers", () => {
  const fixture = new URL("./fixtures/lazy-reducer-invalid", import.meta.url)
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /src\/pages\/index\.tsx:\d+:\d+ Lazy useReducer\(\) initializer must directly return a serializable primitive, plain-object, or array literal derived only from its initial argument/)
})

test("rejects reducers that are not relative imports", async t => {
  t.after(async () => {
    await rm(new URL("./fixtures/invalid-reducer/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/invalid-reducer/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: new URL("./fixtures/invalid-reducer", import.meta.url), encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /useReducer\(\) reducers must be default or named imports from relative TypeScript modules/)
})

test("rejects package imports in reducer-dispatch child handlers", async t => {
  const fixture = new URL("./fixtures/invalid-reducer-child-import", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/invalid-reducer-child-import/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/invalid-reducer-child-import/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Imported specialized component handlers may only use relative TypeScript runtime imports/)
})

test("rejects non-literal specialized component prop defaults", async t => {
  const fixture = new URL("./fixtures/invalid-component-default", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/invalid-component-default/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/invalid-component-default/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Reducer-dispatch component prop defaults must be directly serializable primitive, plain-object, or array literals/)
})

test("rejects reducer component local state outside direct keyed rows", async t => {
  const fixture = new URL("./fixtures/invalid-reducer-row-state", import.meta.url)
  t.after(async () => {
    await rm(new URL("./fixtures/invalid-reducer-row-state/.kudzu", import.meta.url), { recursive: true, force: true })
    await rm(new URL("./fixtures/invalid-reducer-row-state/dist", import.meta.url), { recursive: true, force: true })
  })
  const result = spawnSync(process.execPath, [new URL("../bin/kudzu.mjs", import.meta.url).pathname, "build"], { cwd: fixture, encoding: "utf8" })
  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Keyed row hooks are only supported in direct keyed map rows/)
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
  const nativeEntry = await readFile(new URL("./fixtures/native-bubbling/dist/assets/native/index.js", import.meta.url), "utf8")
  const bindingRuntime = await readFile(new URL("./fixtures/native-bubbling/dist/assets/kudzu-binding.js", import.meta.url), "utf8")
  assert.doesNotMatch(html, /"flags":/)
  assert.match(runtime, /addEventListener/)
  assert.match(runtime, /removeEventListener/)
  assert.match(html, /data-k-text-bindings=/)
  assert.match(html, /id="object-state"><!--k-text:\d+-->28<!--k-text-end-->° <!--k-text:\d+-->Warm<!--k-text-end--><\/p>/)
  assert.doesNotMatch(html, /data-k-bind-text/)
  assert.match(bindingRuntime, /Reactive text marker has no end/)
  assert.match(nativeEntry, /\/assets\/handlers\/Parent\.js/)
  assert.match(nativeEntry, /\/assets\/handlers\/pages\/index\.js/)
  assert.doesNotMatch(html, /\[\[&quot;(?:localStorage|FileReader|alert)&quot;/)
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
    ["native-invalid-helper", /Package import "ts" may only be referenced directly inside JSX event handlers/],
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

async function runReducerBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  document.querySelector("#add").click()
  document.querySelector("#local-add").click()
  document.querySelector("#imported-add").click()
  const input = document.querySelector("#imported-input")
  input.value = " Nested "
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  await wait()
  const titles = () => [...document.querySelectorAll("li span")].map(row => row.textContent).join(",")
  if (document.querySelector("#count").textContent !== "5 todos" || titles() !== "Read,Ship,Local,Imported,Nested" || document.querySelector("#parent-title").textContent !== "Parent") throw new Error("reducer-dom")
  const editingRow = document.querySelector('[data-id="2"]')
  editingRow.querySelector(".edit-toggle").click()
  await wait()
  let editInput = editingRow.querySelector("input.edit")
  if (document.querySelectorAll("li.editing").length !== 1 || document.querySelectorAll("input.edit").length !== 1 || !editingRow.classList.contains("editing") || !editInput || editInput.value !== "Ship" || editingRow.outerHTML.includes("$k")) throw new Error("row-editing")
  editInput.value = "Updated Ship"
  editInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  editInput.dispatchEvent(new FocusEvent("blur"))
  await wait()
  if (editingRow.classList.contains("editing") || editingRow.querySelector("input.edit") || editingRow.querySelector("span").textContent !== "Updated Ship" || editingRow.dataset.edits !== "1") throw new Error("row-edit-submit")
  editingRow.querySelector(".edit-toggle").click()
  await wait()
  editInput = editingRow.querySelector("input.edit")
  editInput.value = "Blurred Ship"
  editInput.dispatchEvent(new FocusEvent("blur"))
  await wait()
  if (editingRow.classList.contains("editing") || editingRow.querySelector("input.edit") || editingRow.querySelector("span").textContent !== "Blurred Ship" || editingRow.dataset.edits !== "2") throw new Error("row-edit-blur")
  editingRow.querySelector(".edit-toggle").click()
  await wait()
  editInput = editingRow.querySelector("input.edit")
  editInput.value = "Draft Ship"
  document.querySelector("#reverse").click()
  await wait()
  if (document.querySelector('[data-id="2"]') !== editingRow || !editingRow.classList.contains("editing") || editingRow.querySelector("input.edit") !== editInput || editInput.value !== "Draft Ship" || titles() !== "Nested,Imported,Local,Blurred Ship,Read") throw new Error("row-reorder")
  editInput.value = ""
  editInput.dispatchEvent(new FocusEvent("blur"))
  await wait()
  if (document.querySelector("#count").textContent !== "4 todos" || document.querySelector('[data-id="2"]') || titles() !== "Nested,Imported,Local,Read") throw new Error("row-edit-empty-remove")
  document.querySelector("#restore").click()
  await wait()
  const restored = document.querySelector('[data-id="2"]')
  if (!restored || restored === editingRow || restored.classList.contains("editing") || restored.querySelector("input.edit") || document.querySelector("#count").textContent !== "5 todos") throw new Error("row-state-cleanup")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runCallbackRefOwnershipBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const search = document.querySelector("#imported-search")
  search.value = "cedar"
  search.dispatchEvent(new InputEvent("input", { bubbles: true }))
  await wait()
  if (document.querySelector("#query").textContent !== "cedar") throw new Error("adapted-callback")
  const age = document.querySelector("#age-input")
  age.value = "31"
  age.dispatchEvent(new Event("change", { bubbles: true }))
  await wait()
  if (document.querySelector("#age").textContent !== "31" || age.value !== "31") throw new Error("prop-derived-initializer")
  const tooltip = document.querySelector('[role="tooltip"]')
  document.querySelector("#tooltip-trigger").dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }))
  await wait()
  if (tooltip.dataset.visible !== "true") throw new Error("nested-tooltip")
  document.querySelector("#local-button").click()
  await wait()
  document.querySelector("#imported-button").click()
  await wait()
  if (document.querySelector("#count").textContent !== "2") throw new Error("callbacks")
  if (!document.querySelector("#local-button").textContent.includes("on") || !document.querySelector("#imported-button").textContent.includes("on")) throw new Error("local-state")
  if (document.body.dataset.localEffects !== "|setup:false:local-inner|cleanup:false:local-inner|setup:true:local-inner") throw new Error("local-effects")
  if (document.body.dataset.importedEffects !== "|setup:false:imported-inner|cleanup:false:imported-inner|setup:true:imported-inner") throw new Error("imported-effects")
  if (document.querySelector("#local-button").dataset.generatedId === document.querySelector("#imported-button").dataset.generatedId) throw new Error("generated-ids")
  document.querySelector("#record-refs").click()
  await wait()
  if (document.body.dataset.refs !== "local-button,imported-button") throw new Error("mounted-refs")
  const previousLocal = document.querySelector("#local-button")
  document.querySelector("#toggle").click()
  await wait()
  document.querySelector("#record-refs").click()
  await wait()
  if (document.querySelector("#controls") || document.body.dataset.refs !== "none,none") throw new Error("removed-refs")
  if (!document.body.dataset.localEffects.endsWith("|cleanup:true:local-inner") || !document.body.dataset.importedEffects.endsWith("|cleanup:true:imported-inner")) throw new Error("removed-effects")
  document.querySelector("#set-age").click()
  await wait()
  document.querySelector("#toggle").click()
  await wait()
  document.querySelector("#record-refs").click()
  await wait()
  if (document.querySelector("#local-button") === previousLocal || document.body.dataset.refs !== "local-button,imported-button") throw new Error("remounted-refs")
  if (!document.querySelector("#local-button").textContent.includes("off") || !document.querySelector("#imported-button").textContent.includes("off")) throw new Error("remounted-state")
  if (!document.body.dataset.localEffects.endsWith("|setup:false:local-inner") || !document.body.dataset.importedEffects.endsWith("|setup:false:imported-inner")) throw new Error("remounted-effects")
  if (document.querySelector("#age-input").value !== "42") throw new Error("remounted-prop-sync")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNativeDialogMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  const dialog = document.querySelector("dialog")
  const trigger = document.querySelector("#dialog-trigger")
  const confirm = document.querySelector("#dialog-confirm")
  trigger.click()
  await wait()
  if (!dialog.open || !dialog.matches(":modal")) throw new Error("open")
  if (document.activeElement !== confirm) throw new Error("initial-focus")
  confirm.click()
  await wait()
  if (dialog.open || dialog.returnValue !== "confirmed" || document.body.dataset.dialogAction !== "confirmed") throw new Error("confirm")
  if (document.activeElement !== trigger) throw new Error("restore-focus")
  trigger.click()
  await wait()
  dialog.requestClose()
  await wait()
  if (dialog.open || document.activeElement !== trigger) throw new Error("close-request")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runReactHookFormMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
try {
  await wait(50)
  const form = document.querySelector("#signup-form")
  const email = document.querySelector("#email")
  const password = document.querySelector("#password")
  const submit = document.querySelector("#signup-submit")

  form.requestSubmit()
  await wait(50)
  if (!email.validity.valueMissing || document.querySelector("#signup-error, #signup-success")) throw new Error("required-validation")

  email.value = "not-an-email"
  password.value = "long-enough"
  form.requestSubmit()
  await wait(50)
  if (!email.validity.typeMismatch || document.querySelector("#signup-error, #signup-success")) throw new Error("email-validation")

  email.value = "taken@example.com"
  form.requestSubmit()
  await Promise.resolve()
  await Promise.resolve()
  if (!submit.disabled || submit.textContent.trim() !== "Creating account") throw new Error("submitting")
  await wait(50)
  if (submit.disabled || !document.querySelector('#signup-error[role="alert"]')) throw new Error("server-error")
  if (email.getAttribute("aria-invalid") !== "true" || email.getAttribute("aria-describedby") !== "signup-error") throw new Error("error-accessibility")

  email.value = "new@example.com"
  form.requestSubmit()
  await wait(50)
  if (!document.querySelector('#signup-success[role="status"]') || document.querySelector("#signup-error")) throw new Error("success")
  if (email.getAttribute("aria-invalid") !== "false" || email.hasAttribute("aria-describedby")) throw new Error("success-accessibility")
  if (email.value !== "new@example.com" || password.value !== "long-enough" || password.minLength !== 8) throw new Error("uncontrolled-values")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runTanStackQueryMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("browser/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await wait(10)
  }
  throw new Error(label)
}
const productNames = () => [...document.querySelectorAll("#products li")].map(node => node.textContent).join(",")
try {
  if (!document.querySelector('[role="status"]')) throw new Error("initial-loading")

  document.querySelector("#refetch").click()
  await waitFor(() => productNames() === "Fresh pine", "fresh-response")
  await wait(200)
  if (productNames() !== "Fresh pine" || document.body.dataset.queryCleanup !== "|0") throw new Error("stale-response")

  document.querySelector("#refetch").click()
  await waitFor(() => document.querySelector('[role="alert"]')?.textContent === "HTTP 500", "error-response")
  if (document.body.dataset.queryCleanup !== "|0|1") throw new Error("error-cleanup")

  document.querySelector("#refetch").click()
  await waitFor(() => productNames() === "Recovered cedar", "recovered-response")
  if (document.querySelector('[role="alert"]') || document.body.dataset.queryCleanup !== "|0|1|2") throw new Error("recovery-cleanup")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  if (url.pathname === "/api/products") {
    const query = Number(url.searchParams.get("request"))
    return setTimeout(() => {
      if (query === 2) {
        response.statusCode = 500
        return response.end("failed")
      }
      const products = query === 0 ? [{ id: 1, name: "Old oak" }] : query === 1 ? [{ id: 2, name: "Fresh pine" }] : [{ id: 3, name: "Recovered cedar" }]
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify(products))
    }, query === 0 ? 180 : 20)
  }
  const relative = url.pathname === "/browser/" ? "browser/index.html" : url.pathname.slice(1)
  const file = path.join(root, relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/browser/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runMemosOutlineMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  const instrumentation = `<script>
globalThis.__frames = 0
globalThis.__cancellations = 0
let nextFrame = 1
const pendingFrames = new Map()
globalThis.requestAnimationFrame = callback => { const frame = nextFrame++; globalThis.__frames++; pendingFrames.set(frame, callback); return frame }
globalThis.cancelAnimationFrame = frame => { globalThis.__cancellations++; pendingFrames.delete(frame) }
globalThis.__flushFrames = () => { const callbacks = [...pendingFrames.values()]; pendingFrames.clear(); for (const callback of callbacks) callback(performance.now()) }
</script>`
  await writeFile(htmlUrl, html.replace("<head>", `<head>${instrumentation}`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await wait(10)
  }
  throw new Error(label)
}
try {
  await wait(50)
  const tops = { overview: -20, decisions: 50, "follow-up": 150 }
  for (const [id, top] of Object.entries(tops)) Object.defineProperty(document.getElementById(id), "getBoundingClientRect", { value: () => ({ top }) })
  window.dispatchEvent(new Event("scroll"))
  globalThis.__flushFrames()
  await waitFor(() => document.querySelector('[aria-current="location"]')?.getAttribute("href") === "#decisions", "initial-frame")

  const frames = globalThis.__frames
  window.dispatchEvent(new Event("scroll"))
  window.dispatchEvent(new Event("scroll"))
  window.dispatchEvent(new Event("scroll"))
  if (globalThis.__frames !== frames + 1) throw new Error("frame-coalescing")
  globalThis.__flushFrames()
  await wait(10)

  document.querySelector('a[href="#follow-up"]').click()
  await waitFor(() => document.querySelector('[aria-current="location"]')?.getAttribute("href") === "#follow-up", "outline-click")
  if (location.hash !== "#follow-up") throw new Error("outline-hash")

  const cancellations = globalThis.__cancellations
  window.dispatchEvent(new Event("resize"))
  window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }))
  await wait(50)
  if (globalThis.__cancellations !== cancellations + 1) throw new Error("frame-cleanup")
  const disposedFrames = globalThis.__frames
  window.dispatchEvent(new Event("resize"))
  await wait(50)
  if (globalThis.__frames !== disposedFrames) throw new Error("listener-cleanup")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runColonniBlogMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("ko/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  const instrumentation = `<script>
globalThis.__draws = []
globalThis.__frames = 0
globalThis.__cancellations = 0
globalThis.__observes = 0
globalThis.__disconnects = 0
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { document.body.dataset.copied = value } } })
let nextFrame = 1
const pendingFrames = new Map()
globalThis.requestAnimationFrame = callback => { const frame = nextFrame++; globalThis.__frames++; pendingFrames.set(frame, callback); return frame }
globalThis.cancelAnimationFrame = frame => { globalThis.__cancellations++; pendingFrames.delete(frame) }
globalThis.__flushFrame = () => { const callbacks = [...pendingFrames.values()]; pendingFrames.clear(); for (const callback of callbacks) callback(performance.now()) }
globalThis.IntersectionObserver = class {
  constructor(callback) { globalThis.__observerCallback = callback }
  observe() { globalThis.__observes++; globalThis.__observerCallback([{ isIntersecting: true }]) }
  disconnect() { globalThis.__disconnects++ }
}
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect() {},
  fillRect(x, y, width, height) { globalThis.__draws.push([x, y, width, height]) },
  fillText() {}
})
HTMLCanvasElement.prototype.getBoundingClientRect = () => ({ left: 5, width: 640 })
</script>`
  await writeFile(htmlUrl, html.replace("<head>", `<head>${instrumentation}`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await wait(10)
  }
  throw new Error(label)
}
try {
  await waitFor(() => globalThis.__frames === 1 && globalThis.__observes === 1, "effect-mount")
  globalThis.__flushFrame()
  if (globalThis.__draws.at(-1)?.[0] !== 20) throw new Error("initial-draw")

  const visibleDraws = globalThis.__draws.length
  globalThis.__observerCallback([{ isIntersecting: false }])
  globalThis.__flushFrame()
  if (globalThis.__draws.length !== visibleDraws) throw new Error("hidden-draw")

  globalThis.__observerCallback([{ isIntersecting: true }])
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
  globalThis.__flushFrame()
  if (globalThis.__draws.at(-1)?.[0] !== 28) throw new Error("keyboard-move")

  document.querySelector("canvas").dispatchEvent(new MouseEvent("click", { clientX: 55 }))
  globalThis.__flushFrame()
  if (globalThis.__draws.at(-1)?.[0] !== 50) throw new Error("click-move")

  const copy = [...document.querySelectorAll("button")].find(button => button.textContent === "Copy")
  copy.click()
  await waitFor(() => copy.textContent === "Copied", "mdx-copy")
  if (!document.body.dataset.copied?.includes("Math.sqrt")) throw new Error("clipboard-payload")

  const resultTab = [...document.querySelectorAll('[role="tab"]')].find(button => button.textContent === "Result")
  resultTab.click()
  await waitFor(() => document.body.textContent.includes("The result is five."), "mdx-tabs")
  if (resultTab.getAttribute("aria-selected") !== "true") throw new Error("tab-selection")

  const cancellations = globalThis.__cancellations
  window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }))
  await wait(20)
  if (globalThis.__cancellations !== cancellations + 1 || globalThis.__disconnects !== 1) throw new Error("cleanup")
  const draws = globalThis.__draws.length
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))
  document.querySelector("canvas").dispatchEvent(new MouseEvent("click", { clientX: 80 }))
  globalThis.__flushFrame()
  if (globalThis.__draws.length !== draws) throw new Error("disposed-listeners")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url === "/ko/" ? "ko/index.html" : request.url.slice(1)
  const file = path.join(root, relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/ko/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runColonniLocaleDetectionBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const entryUrl = new URL("index.html", output)
  const enUrl = new URL("en/index.html", output)
  const entryHtml = await readFile(entryUrl, "utf8")
  const enHtml = await readFile(enUrl, "utf8")
  await writeFile(entryUrl, entryHtml.replace("<head>", '<head><script>localStorage.removeItem("locale");Object.defineProperty(navigator,"languages",{configurable:true,value:["en-US"]})</script>'))
  await writeFile(enUrl, enHtml.replace("</body>", '<script type="module" src="/locale-browser-test.js"></script></body>'))
  await writeFile(new URL("locale-browser-test.js", output), `
if (location.pathname === "/en" && location.search === "?from=root" && location.hash === "#section" && document.documentElement.lang === "en") document.body.dataset.localeBrowserTest = "pass"
else document.body.dataset.localeBrowserTest = "fail"
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname
  const relative = pathname === "/" ? "index.html" : pathname === "/en" || pathname === "/en/" ? "en/index.html" : pathname.slice(1)
  const file = path.join(root, relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/?from=root#section`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /<html lang="en"/)
    assert.match(browser.stdout, /data-locale-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runExcalidrawShareMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  const instrumentation = `<script>
const mode = new URLSearchParams(location.search).get("mode")
try { delete Navigator.prototype.share } catch {}
try { delete navigator.share } catch {}
if (mode === "supported") {
  Object.defineProperty(navigator, "share", { configurable: true, value: async payload => { document.body.dataset.shared = payload.url } })
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { document.body.dataset.copied = value } } })
}
</script>`
  await writeFile(htmlUrl, html.replace("<head>", `<head>${instrumentation}`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await wait(10)
  }
  throw new Error(label)
}
const mode = new URLSearchParams(location.search).get("mode")
try {
  if (mode === "unsupported") {
    await wait(100)
    if (document.querySelector("#share-room")) throw new Error("unsupported-share-button")
    document.body.dataset.browserTest = "pass-unsupported"
  } else {
    await waitFor(() => document.querySelector("#share-room"), "supported-share-button")
    document.querySelector("#share-room").click()
    await waitFor(() => document.querySelector('[role="status"]')?.textContent === "shared", "share-status")
    if (document.body.dataset.shared !== "https://draw.example.test/#room=oak,cedar") throw new Error("share-payload")
    document.querySelector("#copy-room").click()
    await waitFor(() => document.querySelector('[role="status"]')?.textContent === "copied", "copy-status")
    if (document.body.dataset.copied !== "https://draw.example.test/#room=oak,cedar") throw new Error("copy-payload")
    document.body.dataset.browserTest = "pass-supported"
  }
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  const file = path.join(root, url.pathname === "/" ? "index.html" : url.pathname.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    for (const mode of ["unsupported", "supported"]) {
      const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/?mode=${mode}`], { encoding: "utf8", timeout: 30000 })
      assert.ifError(browser.error)
      assert.equal(browser.status, 0, browser.stderr)
      assert.match(browser.stdout, new RegExp(`data-browser-test="pass-${mode}"`))
    }
  } finally {
    server.kill()
  }
}

async function runCalcomMediaQueryMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  const instrumentation = `<script>
const queries = new Map()
globalThis.__mediaAdds = 0
globalThis.__mediaRemoves = 0
window.matchMedia = query => {
  if (!queries.has(query)) {
    const listeners = new Set()
    queries.set(query, {
      matches: false,
      addEventListener(type, listener) { if (type === "change") { globalThis.__mediaAdds++; listeners.add(listener) } },
      removeEventListener(type, listener) { if (type === "change" && listeners.delete(listener)) globalThis.__mediaRemoves++ },
      dispatch(value) { this.matches = value; for (const listener of [...listeners]) listener({ matches: value, media: query }) }
    })
  }
  return queries.get(query)
}
globalThis.__setMedia = (query, value) => window.matchMedia(query).dispatch(value)
</script>`
  await writeFile(htmlUrl, html.replace("<head>", `<head>${instrumentation}`).replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
await import("/assets/kudzu-binding.js")
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await wait(10)
  }
  throw new Error(label)
}
try {
  await waitFor(() => globalThis.__mediaAdds === 2, "subscriptions")
  if (document.querySelector("main").dataset.layout !== "column" || document.querySelector("#visible-days").textContent.trim() !== "7 visible days") throw new Error("fallback")

  globalThis.__setMedia("(max-width: 1024px)", true)
  await waitFor(() => document.querySelector("#visible-days").textContent.trim() === "4 visible days", "tablet")
  if (document.querySelector("main").dataset.layout !== "column") throw new Error("tablet-layout")

  globalThis.__setMedia("(max-width: 768px)", true)
  await waitFor(() => document.querySelector("main").dataset.layout === "mobile", "mobile")
  globalThis.__setMedia("(max-width: 768px)", false)
  await waitFor(() => document.querySelector("main").dataset.layout === "column", "desktop")

  window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }))
  await waitFor(() => globalThis.__mediaRemoves === 2, "cleanup")
  globalThis.__setMedia("(max-width: 768px)", true)
  globalThis.__setMedia("(max-width: 1024px)", false)
  await wait(50)
  if (document.querySelector("main").dataset.layout !== "column" || document.querySelector("#visible-days").textContent.trim() !== "4 visible days") throw new Error("disposed-update")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runReleaseNotesBrowserTest(chrome) {
  const output = new URL("../dist/", import.meta.url)
  const homeUrl = new URL("index.html", output)
  const htmlUrl = new URL("releases/0.7.0/index.html", output)
  const homeHtml = await readFile(homeUrl, "utf8")
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(homeUrl, homeHtml.replace("</body>", '<script type="module" src="/home-mobile-test.js"></script></body>'))
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/release-browser-test.js"></script></body>'))
  await writeFile(new URL("home-mobile-test.js", output), `
try {
  const copy = document.querySelector(".hero-copy")
  const code = document.querySelector(".hero-code")
  if (!copy || !code || copy.getBoundingClientRect().top >= code.getBoundingClientRect().top) throw new Error("hero-order")
  document.body.dataset.homeMobileTest = "pass"
} catch (error) {
  document.body.dataset.homeMobileTest = "fail-" + error.message
}
`)
  await writeFile(new URL("release-browser-test.js", output), `
try {
  const mode = new URL(location.href).searchParams.get("mode")
  const page = document.querySelector(".release-notes")
  const hero = document.querySelector(".release-hero")
  const story = document.querySelector(".release-story")
  const features = document.querySelector(".release-feature-grid")
  if (!page || !hero || !story || features?.children.length !== 6 || !document.querySelector('a[href="#start"]')) throw new Error("content")
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth || page.getBoundingClientRect().right > innerWidth) throw new Error("overflow")
  if (mode === "mobile") {
    if (getComputedStyle(story).gridTemplateColumns.split(" ").length !== 1 || getComputedStyle(features).gridTemplateColumns.split(" ").length !== 1) throw new Error("mobile-layout")
  } else {
    if (getComputedStyle(story).gridTemplateColumns.split(" ").length !== 2 || getComputedStyle(features).gridTemplateColumns.split(" ").length !== 3) throw new Error("desktop-layout")
  }
  document.body.dataset.releaseNotesTest = "pass-" + mode
} catch (error) {
  document.body.dataset.releaseNotesTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname
  const file = path.join(root, pathname === "/" ? "index.html" : pathname.endsWith("/") ? pathname.slice(1) + "index.html" : pathname.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    for (const [mode, size] of [["desktop", "1440,1000"], ["mobile", "390,844"]]) {
      const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--window-size=${size}`, "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/releases/0.7.0/?mode=${mode}`], { encoding: "utf8", timeout: 60000 })
      assert.ifError(browser.error)
      assert.equal(browser.status, 0, browser.stderr)
      assert.match(browser.stdout, new RegExp(`data-release-notes-test="pass-${mode}"`))
    }
    const home = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=390,844", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(home.status, 0, home.stderr)
    assert.match(home.stdout, /data-home-mobile-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runDocsListBrowserTest(chrome) {
  const output = new URL("../dist/", import.meta.url)
  const htmlUrl = new URL("docs/index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/docs-test.js"></script></body>'))
  await writeFile(new URL("docs-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  const layout = document.querySelector(".docs-layout")
  const content = document.querySelector(".docs-content")
  const intro = document.querySelector(".docs-intro")
  const columns = document.querySelector(".docs-columns")
  if (Math.round(layout.getBoundingClientRect().width) !== document.documentElement.clientWidth || content.getBoundingClientRect().right > document.documentElement.clientWidth || document.documentElement.scrollWidth > document.documentElement.clientWidth) throw new Error("mobile-width")
  if (intro.getBoundingClientRect().right > innerWidth || getComputedStyle(columns).gridTemplateColumns.split(" ").length !== 1) throw new Error("mobile-layout")
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
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url === "/docs/" ? "docs/index.html" : request.url.slice(1)
  const file = path.join(root, relative)
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1", () => console.log("ready"))
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: ["ignore", "pipe", "pipe"] })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("navigation group server did not start")), 5000)
    server.stdout.once("data", () => { clearTimeout(timeout); resolve() })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`navigation group server exited ${code}`)) })
  })
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--window-size=390,844", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/docs/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-docs-list-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNavigationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  for (const route of ["product", "cart", "chart", "broken", "items/[id]", "items/new"]) {
    const htmlUrl = new URL(`${route}/index.html`, output)
    const html = await readFile(htmlUrl, "utf8")
    await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  }
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
const counts = new Map()
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  if (url.pathname === "/request-count") {
    response.setHeader("content-type", "application/json")
    return response.end(JSON.stringify(counts.get(url.searchParams.get("url")) || 0))
  }
  if (url.pathname === "/reset-counts") {
    counts.clear()
    return response.end("ok")
  }
  const key = url.pathname + url.search
  counts.set(key, (counts.get(key) || 0) + 1)
  if (url.pathname === "/shop/broken" && request.headers["sec-fetch-mode"] !== "navigate") {
    response.setHeader("content-type", "text/html")
    const html = fs.readFileSync(path.join(root, "product/index.html"), "utf8").replace(/data-k-application="[^"]+"/, 'data-k-application="wrong"')
    return response.end(html)
  }
  const relative = url.pathname.replace(/^\\/shop\\/?/, "")
  let file = path.join(root, !relative || relative.endsWith("/") ? relative + "index.html" : path.extname(relative) ? relative : relative + "/index.html")
  if (!fs.existsSync(file) && /^\\/shop\\/items\\/[^/]+\\/?$/.test(url.pathname)) file = path.join(root, "items/[id]/index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=7000", "--dump-dom", `http://127.0.0.1:${port}/shop/product?initial=1`], { encoding: "utf8", timeout: 30000 })
    assert.ifError(browser.error)
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
    await fetch(`http://127.0.0.1:${port}/reset-counts`)
    const runtimeBrowser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/shop/items/oak?direct=1`], { encoding: "utf8", timeout: 20000 })
    assert.equal(runtimeBrowser.status, 0, runtimeBrowser.stderr)
    assert.match(runtimeBrowser.stdout, /data-runtime-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNavigationGroupsBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  for (const route of ["alpha", "items/[id]", "beta", "gamma", "outside"]) {
    const htmlUrl = new URL(`${route}/index.html`, output)
    const html = await readFile(htmlUrl, "utf8")
    await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  }
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2]), counts = new Map()
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  if (url.pathname === "/request-count") {
    response.setHeader("content-type", "application/json")
    return response.end(JSON.stringify(counts.get(url.searchParams.get("path")) || 0))
  }
  counts.set(url.pathname, (counts.get(url.pathname) || 0) + 1)
  const relative = url.pathname.replace(/^\\/app\\/?/, "")
  let file = path.join(root, !relative || relative.endsWith("/") ? relative + "index.html" : path.extname(relative) ? relative : relative + "/index.html")
  if (!fs.existsSync(file) && /^\\/app\\/items\\/[^/]+\\/?$/.test(url.pathname)) file = path.join(root, "items/[id]/index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    for (const route of ["alpha", "beta", "outside"]) {
      const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/${route}`], { encoding: "utf8", timeout: 20000 })
      assert.equal(browser.status, 0, browser.stderr)
      assert.match(browser.stdout, /data-navigation-groups-test="pass"/)
    }
  } finally {
    server.kill()
  }
}

async function runOwnedNavigationEffectBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  for (const route of ["", "other/"]) {
    const htmlUrl = new URL(`${route}index.html`, output)
    const html = await readFile(htmlUrl, "utf8")
    await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  }
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(label)
}
const click = selector => document.querySelector(selector).click()
const count = (log, value) => log.split(value).length - 1
const pagehide = persisted => {
  const event = new Event("pagehide")
  Object.defineProperty(event, "persisted", { value: persisted })
  dispatchEvent(event)
}
try {
  const originalLayout = document.querySelector("[data-layout]")
  await waitFor(() => document.body.dataset.layoutLog === "|setup 0" && document.body.dataset.rowLog === "|mount Oak|dep Oak:0|mount Pine|dep Pine:0", "initial")
  if (document.body.dataset.routeLog || document.querySelector("[data-resource]")) throw new Error("hidden-initial")
  click("[data-count]")
  await new Promise(resolve => setTimeout(resolve, 50))
  if (document.body.dataset.routeLog) throw new Error("hidden-dependency")
  click("[data-open]")
  await waitFor(() => document.body.dataset.routeLog === "|setup 1:true", "open")
  click("[data-count]")
  await waitFor(() => document.body.dataset.routeLog === "|setup 1:true|cleanup 1:true|setup 2:true", "dependency")
  document.body.ownedResolvers[0]("stale-dependency")
  await new Promise(resolve => setTimeout(resolve, 0))
  if (document.querySelector("[data-result]").textContent !== "pending") throw new Error("dependency-stale-setter")
  click("[data-close]")
  await waitFor(() => document.body.dataset.routeLog.endsWith("|cleanup 2:true"), "close")
  click("[data-count]")
  await new Promise(resolve => setTimeout(resolve, 50))
  if (!document.body.dataset.routeLog.endsWith("|cleanup 2:true")) throw new Error("closed-dependency")
  click("[data-open]")
  await waitFor(() => document.body.dataset.routeLog.endsWith("|setup 3:true"), "reopen")
  const beforeRows = document.body.dataset.rowLog
  click("[data-add]")
  await waitFor(() => document.body.dataset.rowLog === beforeRows + "|mount Elm|dep Elm:0", "row-add")
  click("[data-reorder]")
  await new Promise(resolve => setTimeout(resolve, 50))
  if (document.body.dataset.rowLog !== beforeRows + "|mount Elm|dep Elm:0") throw new Error("row-reorder")
  click("[data-update]")
  await waitFor(() => document.body.dataset.rowLog.endsWith("|dep-clean Oak:0|dep Red oak:0"), "row-update")
  click("[data-remove]")
  await waitFor(() => document.body.dataset.rowLog.endsWith("|unmount Pine:true|dep-clean Pine:0"), "row-remove")
  click('a[href="/other"]')
  await waitFor(() => document.querySelector('[data-route="other"]'), "other")
  if (document.querySelector("[data-layout]") !== originalLayout || !document.body.dataset.routeLog.endsWith("|cleanup 3:true")) throw new Error("route-departure")
  if (!document.body.dataset.routeCleanup.endsWith("|done 3")) throw new Error("route-cleanup-await")
  if (!document.body.dataset.rowLog.includes("|unmount Oak:true") || !document.body.dataset.rowLog.includes("|unmount Elm:true") || count(document.body.dataset.rowLog, "|unmount Pine:true") !== 1) throw new Error("row-departure")
  click("[data-layout-version]")
  await waitFor(() => document.body.dataset.layoutLog === "|setup 0|cleanup 0|setup 1", "layout-transition")
  history.back()
  await waitFor(() => document.querySelector('[data-route="home"]') && count(document.body.dataset.rowLog, "|mount Oak") === 2, "back")
  if (document.querySelector("[data-layout]") !== originalLayout || document.body.dataset.routeLog.includes("|setup 0")) throw new Error("back-lifetimes")
  document.body.ownedResolvers[2]("stale-route")
  await new Promise(resolve => setTimeout(resolve, 0))
  if (document.querySelector("[data-result]").textContent !== "pending") throw new Error("route-stale-setter")
  click("[data-open]")
  await waitFor(() => document.body.ownedResolvers.length === 4, "fresh-open")
  document.body.ownedResolvers[3]("fresh")
  await waitFor(() => document.querySelector("[data-result]").textContent === "fresh", "fresh-setter")
  history.forward()
  await waitFor(() => document.querySelector('[data-route="other"]'), "forward")
  history.back()
  await waitFor(() => document.querySelector('[data-route="home"]') && count(document.body.dataset.rowLog, "|mount Oak") === 3, "cached-revisit")
  if (count(document.body.dataset.rowLog, "|mount Pine") !== 3) throw new Error("fresh-row-records")
  const beforeRevisitUpdate = count(document.body.dataset.rowLog, "|dep-clean Oak:0")
  click("[data-update]")
  await waitFor(() => count(document.body.dataset.rowLog, "|dep-clean Oak:0") === beforeRevisitUpdate + 1, "revisit-row-update")
  if (count(document.body.dataset.rowLog, "|dep Red oak:0") !== 2) throw new Error("accumulated-row-hooks")
  const beforePersisted = [document.body.dataset.layoutLog, document.body.dataset.routeLog, document.body.dataset.rowLog, document.body.dataset.disposeOrder].join(";")
  pagehide(true)
  await new Promise(resolve => setTimeout(resolve, 0))
  if ([document.body.dataset.layoutLog, document.body.dataset.routeLog, document.body.dataset.rowLog, document.body.dataset.disposeOrder].join(";") !== beforePersisted) throw new Error("persisted")
  click("[data-open]")
  await waitFor(() => document.querySelector("[data-resource]"), "final-open")
  pagehide(false)
  await waitFor(() => document.body.dataset.disposeOrder.endsWith("|route|layout"), "pagehide-order")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const relative = request.url.split("?")[0].replace(/^\\//, "")
  const file = path.join(root, !relative ? "index.html" : path.extname(relative) ? relative : relative + "/index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1", () => console.log("ready"))
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: ["ignore", "pipe", "pipe"] })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("owned navigation effect server did not start")), 5000)
    server.stdout.once("data", () => { clearTimeout(timeout); resolve() })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`owned navigation effect server exited ${code}`)) })
  })
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=7000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 20000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runWorkerEffectBrowserTest(fixture, chrome, workerPath) {
  const output = new URL("dist/", fixture)
  const dashboardUrl = new URL("dashboard/index.html", output)
  const plainUrl = new URL("plain/index.html", output)
  const dashboardHtml = await readFile(dashboardUrl, "utf8")
  const plainHtml = await readFile(plainUrl, "utf8")
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2]), counts = new Map()
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  if (url.pathname === "/request-count") {
    response.setHeader("content-type", "application/json")
    return response.end(JSON.stringify(counts.get(url.searchParams.get("path")) || 0))
  }
  counts.set(url.pathname, (counts.get(url.pathname) || 0) + 1)
  const relative = url.pathname.replace(/^\\/dash\\/?/, "")
  const file = path.join(root, !relative || relative.endsWith("/") ? relative + "index.html" : path.extname(relative) ? relative : relative + "/index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1", () => console.log("ready"))
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: ["ignore", "pipe", "pipe"] })
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Worker effect server did not start")), 5000)
    server.stdout.once("data", () => { clearTimeout(timeout); resolve() })
    server.once("exit", code => { clearTimeout(timeout); reject(new Error(`Worker effect server exited ${code}`)) })
  })
  try {
    const real = await evaluateInChrome(chrome, `http://127.0.0.1:${port}/dash/dashboard`, `
      (async () => {
        let canvas
        for (let index = 0; index < 100 && !canvas; index++) {
          canvas = document.querySelector("[data-chart]")
          if (!canvas) await new Promise(resolve => setTimeout(resolve, 20))
        }
        if (!canvas) throw new Error("chart did not load")
        for (let index = 0; index < 300 && Number(canvas.dataset.generated) < 1130 && !canvas.dataset.workerError; index++) await new Promise(resolve => setTimeout(resolve, 20))
        return { ...canvas.dataset }
      })()
    `, port + 1, new URL(".chrome-worker-profile", output))
    assert.notEqual(real.workerError, "true")
    assert.ok(Number(real.generated) >= 1130, `generated ${real.generated ?? "missing"}, elapsed ${real.elapsed ?? "missing"}, worker error ${real.workerError ?? "none"}`)
    assert.equal(real.batchSize, "10")
    assert.equal(real.buffered, "128")
    assert.equal(real.points, "24")
    const elapsed = Number(real.elapsed), generated = Number(real.generated), renders = Number(real.renders)
    const rate = (generated - 130) * 1000 / elapsed
    assert.ok(rate >= 700 && rate <= 1300, `logical rate ${rate}`)
    assert.ok(renders >= 2 && renders <= elapsed / 40 + 2, `render cadence ${renders}`)
    assert.equal(await fetch(`http://127.0.0.1:${port}/request-count?path=${encodeURIComponent(workerPath)}`).then(response => response.json()), 1)

    const fakeWorker = `<script>
globalThis.workerStats = { starts: 0, terminations: 0, listeners: 0, listenerAdds: 0, listenerRemoves: 0, messages: 0, maxBuffered: 0, batchSize: 0, urls: [], removedMessages: [] }
globalThis.Worker = class {
  constructor(url, options) {
    this.listeners = new Map([["message", new Set()], ["error", new Set()]])
    this.generated = 0
    this.ticks = 0
    workerStats.starts++
    workerStats.urls.push([String(url), options && options.type])
    this.timer = setInterval(() => {
      this.generated += 10
      if (++this.ticks % 5) return
      const data = { batchSize: 10, buffered: Math.min(128, this.generated), generated: this.generated, elapsed: this.generated, points: new Array(24).fill(0) }
      workerStats.messages++
      workerStats.maxBuffered = Math.max(workerStats.maxBuffered, data.buffered)
      workerStats.batchSize = data.batchSize
      for (const listener of this.listeners.get("message")) listener({ data })
    }, 10)
  }
  addEventListener(name, listener) {
    const listeners = this.listeners.get(name)
    if (listeners && !listeners.has(listener)) {
      listeners.add(listener)
      workerStats.listeners++
      workerStats.listenerAdds++
    }
  }
  removeEventListener(name, listener) {
    const listeners = this.listeners.get(name)
    if (listeners?.delete(listener)) {
      workerStats.listeners--
      workerStats.listenerRemoves++
      if (name === "message") workerStats.removedMessages.push(listener)
    }
  }
  terminate() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = 0
    workerStats.terminations++
  }
}
document.documentElement.dataset.workerStartsBeforeMount = String(workerStats.starts)
</script>`
    await writeFile(dashboardUrl, dashboardHtml.replace('<script type="module"', `${fakeWorker}<script type="module"`).replace("</body>", '<script type="module" src="/fake-worker-test.js"></script></body>'))
    await writeFile(plainUrl, plainHtml)
    await writeFile(new URL("fake-worker-test.js", output), `
const waitFor = async (test, label) => {
  for (let index = 0; index < 200; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error(label)
}
const click = selector => document.querySelector(selector).click()
const route = name => document.querySelector('[data-route="' + name + '"]')
try {
  await waitFor(() => workerStats.starts === 1 && Number(document.querySelector("[data-chart]").dataset.renders) > 0, "initial mount")
  if (document.documentElement.dataset.workerStartsBeforeMount !== "0") throw new Error("started before mount")
  if (workerStats.urls[0][0] !== ${JSON.stringify(workerPath)} || workerStats.urls[0][1] !== "module") throw new Error("base URL")
  const oldCanvas = document.querySelector("[data-chart]")
  click("[data-plain-link]")
  await waitFor(() => route("plain") && workerStats.terminations === 1 && workerStats.listeners === 0, "first cleanup")
  const renders = oldCanvas.dataset.renders
  workerStats.removedMessages.at(-1)({ data: { batchSize: 10, buffered: 128, generated: 999, elapsed: 999, points: [] } })
  if (oldCanvas.dataset.renders !== renders || oldCanvas.dataset.disposed !== "true") throw new Error("stale/disposed render")
  history.back()
  await waitFor(() => route("dashboard") && workerStats.starts === 2, "back ownership")
  const backCanvas = document.querySelector("[data-chart]")
  history.forward()
  await waitFor(() => route("plain") && workerStats.terminations === 2, "forward cleanup")
  if (backCanvas.dataset.disposed !== "true") throw new Error("back chart disposal")
  history.back()
  await waitFor(() => route("dashboard") && workerStats.starts === 3, "cached ownership")
  const cachedCanvas = document.querySelector("[data-chart]")
  click("[data-plain-link]")
  await waitFor(() => route("plain") && workerStats.terminations === 3, "cached cleanup")
  if (cachedCanvas.dataset.disposed !== "true") throw new Error("cached chart disposal")
  Object.assign(workerStats, { starts: 0, terminations: 0, listeners: 0, listenerAdds: 0, listenerRemoves: 0, messages: 0, maxBuffered: 0, batchSize: 0, urls: [], removedMessages: [] })
  let renderTotal = 0
  const oldCanvases = []
  for (let cycle = 1; cycle <= 30; cycle++) {
    click("[data-dashboard-link]")
    await waitFor(() => route("dashboard") && workerStats.starts === cycle && Number(document.querySelector("[data-chart]").dataset.renders) > 0, "cycle mount " + cycle)
    const canvas = document.querySelector("[data-chart]")
    oldCanvases.push(canvas)
    click("[data-plain-link]")
    await waitFor(() => route("plain") && workerStats.terminations === cycle && workerStats.listeners === 0, "cycle cleanup " + cycle)
    renderTotal += Number(canvas.dataset.renders)
    if (canvas.dataset.disposed !== "true") throw new Error("cycle chart disposal " + cycle)
  }
  if (workerStats.starts !== 30 || workerStats.terminations !== 30 || workerStats.messages < 30) throw new Error("cycle totals")
  if (workerStats.listenerAdds !== 60 || workerStats.listenerRemoves !== 60 || workerStats.messages !== renderTotal || oldCanvases.some(canvas => canvas.dataset.disposed !== "true")) throw new Error("listener/render/disposal totals")
  if (workerStats.maxBuffered > 128 || workerStats.batchSize !== 10) throw new Error("bounded batches")
  document.body.dataset.workerBrowserTest = "pass"
} catch (error) {
  document.body.dataset.workerBrowserTest = "fail-" + error.message
}
`)
    const fake = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=12000", "--dump-dom", `http://127.0.0.1:${port}/dash/dashboard`], { encoding: "utf8", timeout: 30000 })
    assert.equal(fake.status, 0, fake.stderr)
    assert.match(fake.stdout, /data-worker-browser-test="pass"/)
  } finally {
    await writeFile(dashboardUrl, dashboardHtml)
    await writeFile(plainUrl, plainHtml)
    server.kill()
  }
}

async function evaluateInChrome(chrome, url, expression, port, profile) {
  await mkdir(profile, { recursive: true })
  const browser = spawn(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${profile.pathname}`, `--remote-debugging-port=${port}`, url], { stdio: "ignore" })
  try {
    let target
    for (let index = 0; index < 100 && !target; index++) {
      try {
        const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json())
        target = targets.find(entry => entry.type === "page" && entry.url === url)
      } catch {}
      if (!target) await new Promise(resolve => setTimeout(resolve, 50))
    }
    if (!target) throw new Error("Chrome DevTools target did not start")
    await new Promise(resolve => setTimeout(resolve, 500))
    const socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true })
      socket.addEventListener("error", reject, { once: true })
    })
    try {
      const result = await new Promise((resolve, reject) => {
        socket.addEventListener("message", event => {
          const message = JSON.parse(event.data)
          if (message.id !== 1) return
          if (message.error || message.result?.exceptionDetails) reject(new Error(JSON.stringify(message.error ?? message.result.exceptionDetails)))
          else resolve(message.result.result.value)
        })
        socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }))
      })
      return result
    } finally {
      socket.close()
    }
  } finally {
    browser.kill()
    if (browser.exitCode === null) await Promise.race([
      new Promise(resolve => browser.once("exit", resolve)),
      new Promise(resolve => setTimeout(resolve, 2000))
    ])
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
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

  const port = nextBrowserPort()
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
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runContextActionsBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  document.querySelector("[data-create]").click()
  await wait()
  let rows = document.querySelectorAll("[data-note]")
  if (rows.length !== 2 || document.querySelector("[data-active]").textContent !== "2") throw new Error("create")
  rows[1].querySelector("[data-rename]").click()
  await wait()
  rows = document.querySelectorAll("[data-note]")
  if (rows[1].querySelector("[data-select]").textContent !== "New!") throw new Error("rename")
  rows[0].querySelector("[data-select]").click()
  await wait()
  if (document.querySelector("[data-active]").textContent !== "1") throw new Error("select")
  rows[0].querySelector("[data-delete]").click()
  await wait()
  rows = document.querySelectorAll("[data-note]")
  if (rows.length !== 1 || rows[0].dataset.note !== "2" || document.querySelector("[data-active]").textContent !== "0") throw new Error("delete")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)

  const port = nextBrowserPort()
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
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runSvgStructureBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error(label)
}
const click = selector => document.querySelector(selector).click()
const SVG = "http://www.w3.org/2000/svg"
try {
  const dots = () => [...document.querySelectorAll("[data-dot]")]
  await waitFor(() => dots().length === 2 && document.querySelector("[data-visible]"), "initial")
  if ([document.querySelector("[data-visible]"), ...dots(), ...dots().flatMap(dot => [...dot.children])].some(node => node.namespaceURI !== SVG)) throw new Error("initial-namespace")
  const oak = document.querySelector('[data-dot="1"]')
  click("[data-toggle]")
  await waitFor(() => document.querySelector("[data-hidden]"), "hidden")
  if (document.querySelector("[data-hidden]").namespaceURI !== SVG || document.querySelector("[data-visible]")) throw new Error("conditional-namespace")
  click("[data-toggle]")
  await waitFor(() => document.querySelector("[data-visible]"), "visible")
  click("[data-add]")
  await waitFor(() => dots().length === 3, "add")
  if (document.querySelector('[data-dot="3"]').namespaceURI !== SVG) throw new Error("added-namespace")
  click("[data-rename]")
  await waitFor(() => document.querySelector('[data-dot="1"] text').textContent === "Red oak", "rename")
  if (document.querySelector('[data-dot="1"] circle').getAttribute("fill") !== "crimson") throw new Error("attribute")
  click("[data-reorder]")
  await waitFor(() => dots().map(dot => dot.dataset.dot).join(",") === "3,2,1", "reorder")
  if (dots().at(-1) !== oak) throw new Error("identity")
  click("[data-remove]")
  await waitFor(() => dots().map(dot => dot.dataset.dot).join(",") === "3,1", "remove")
  document.body.dataset.svgStructureTest = "pass"
} catch (error) {
  document.body.dataset.svgStructureTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-svg-structure-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runCalculatedCollectionsBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error(label)
}
const points = () => [...document.querySelectorAll("[data-point]")]
const ids = () => points().map(point => point.dataset.point).join(",")
const click = phase => document.querySelector('[data-phase="' + phase + '"]').click()
try {
  await waitFor(() => ids() === "a,b", "initial")
  const alpha = document.querySelector('[data-point="a"]')
  const tooltip = document.querySelector("#point-tooltip")
  if (alpha.namespaceURI !== "http://www.w3.org/2000/svg") throw new Error("namespace")
  await waitFor(() => {
    alpha.dispatchEvent(new FocusEvent("focus"))
    return tooltip.textContent === "Alpha" && !tooltip.hidden && alpha.getAttribute("aria-current") === "true" && alpha.getAttribute("class") === "point selected" && document.querySelector('[data-point="b"]').getAttribute("aria-current") === "false"
  }, "focus-tooltip")
  click(1)
  await waitFor(() => ids() === "a,c,b" && alpha.getAttribute("cx") === "15", "insert")
  if (document.querySelector('[data-point="a"]') !== alpha || alpha.getAttribute("cy") !== "25" || alpha.getAttribute("aria-label") !== "Alpha moved" || document.querySelector("[data-total]").textContent !== "11") throw new Error("first-update")
  if (document.querySelector('[data-point="c"]').namespaceURI !== "http://www.w3.org/2000/svg") throw new Error("insert-namespace")
  const gamma = document.querySelector('[data-point="c"]')
  gamma.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }))
  await waitFor(() => tooltip.textContent === "Gamma" && gamma.getAttribute("aria-current") === "true" && gamma.getAttribute("class") === "point selected" && alpha.getAttribute("aria-current") === "false" && alpha.getAttribute("class") === "point ", "keyboard-tooltip")
  click(2)
  await waitFor(() => ids() === "c,a", "reorder")
  if (points().at(-1) !== alpha || alpha.getAttribute("cx") !== "20" || alpha.getAttribute("aria-label") !== "Alpha reordered" || gamma.getAttribute("aria-current") !== "true" || document.querySelector('[data-point="b"]')) throw new Error("reorder-update")
  alpha.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  await waitFor(() => document.body.dataset.selected === "Alpha reordered" && tooltip.textContent === "Alpha reordered" && alpha.getAttribute("aria-current") === "true" && gamma.getAttribute("aria-current") === "false", "latest-handler")
  click(3)
  await waitFor(() => ids() === "a", "remove")
  if (points()[0] !== alpha || alpha.getAttribute("cy") !== "35" || alpha.getAttribute("aria-label") !== "Alpha final" || document.querySelector("[data-total]").textContent !== "13") throw new Error("final-update")
  alpha.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
  await waitFor(() => tooltip.textContent === "Alpha final", "final-keyboard-tooltip")
  document.body.dataset.calculatedCollectionsTest = "pass"
} catch (error) {
  document.body.dataset.calculatedCollectionsTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-calculated-collections-test="pass"/)
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
  const pineTable = document.querySelector('[data-row="2"]')
  if (movedOnUpdate) throw new Error("update-moved")
  if (oak.querySelector("span").textContent !== "RED OAK tree") throw new Error("update-text")
  if (oak.querySelector("small").textContent !== "Red oak" || oak.querySelector("[data-status]").textContent !== "Red oak complete" || !oak.querySelector("[data-and]")) throw new Error("update-branch")
  if (oak.className !== "done" || oak.getAttribute("aria-label") !== "Red oak item" || oak.style.opacity !== "0.5" || oak.style.borderWidth !== "2px" || oak.style.getPropertyValue("--tone") !== "hot" || oak.querySelector("small").style.color !== "brown") throw new Error("update-attributes")
  if (!oak.querySelector("[data-remove]").dataset.kNativeClick.includes("Red oak") || document.querySelector('[data-row="1"] td').textContent !== "Red oak") throw new Error("update-metadata")
  oak.querySelector("input").value = "preserved"
  click("reorder")
  await Promise.resolve()
  let ordered = [...document.querySelectorAll("[data-list] > li")]
  if (ordered.map(node => node.dataset.id).join(",") !== "3,2,1" || ordered[2] !== oak || oak.querySelector("input").value !== "preserved") throw new Error("move")
  if ([...document.querySelectorAll("tbody > tr")].map(node => node.dataset.row).join(",") !== "3,2,1") throw new Error("simple-move")
  click("reorder")
  await Promise.resolve()
  ordered = [...document.querySelectorAll("[data-list] > li")]
  if (ordered.map(node => node.dataset.id).join(",") !== "1,2,3" || ordered[0] !== oak || oak.querySelector("input").value !== "preserved") throw new Error("rapid-move-restore")
  click("reorder")
  await Promise.resolve()
  ordered = [...document.querySelectorAll("[data-list] > li")]
  if (ordered.map(node => node.dataset.id).join(",") !== "3,2,1" || ordered[2] !== oak) throw new Error("rapid-move-repeat")
  oak.querySelector("[data-remove]").click()
  await wait()
  if (document.querySelector('[data-id="1"]') || document.querySelector('[data-row="1"]') || document.querySelectorAll("[data-list] > li").length !== 2) throw new Error("item-remove")
  document.querySelector('[data-id="3"] [data-remove]').click()
  await wait()
  if (document.querySelector('[data-id="3"]') || document.querySelectorAll("[data-list] > li").length !== 1) throw new Error("new-item-handler")
  click("add")
  await wait()
  click("append-many")
  await wait()
  const appended = [...document.querySelectorAll("[data-list] > li")]
  if (appended.map(node => node.dataset.id).join(",") !== "2,3,4,5") throw new Error("bulk-append")
  const hostileRow = document.querySelector('[data-row="5"]')
  if ([...document.querySelectorAll("tbody > tr")].map(node => node.dataset.row).join(",") !== "2,3,4,5" || document.querySelector('[data-row="2"]') !== pineTable || hostileRow.querySelector("td").textContent !== "<img src=x onerror=alert(1)>&" || hostileRow.title !== '\" onmouseover=\"alert(1)' || hostileRow.querySelector("img")) throw new Error("simple-bulk-append")
  const appendedTableRow = document.querySelector('[data-row="4"]')
  click("update-appended")
  await wait()
  if (document.querySelector('[data-row="4"]') !== appendedTableRow || appendedTableRow.querySelector("td").textContent !== "White ash" || appendedTableRow.title !== "bright") throw new Error("simple-bulk-lazy-update")
  click("reorder")
  await wait()
  if ([...document.querySelectorAll("tbody > tr")].map(node => node.dataset.row).join(",") !== "5,4,3,2" || document.querySelector('[data-row="4"]') !== appendedTableRow) throw new Error("simple-bulk-lazy-reorder")
  click("remove-appended")
  await wait()
  if (appendedTableRow.isConnected || [...document.querySelectorAll("tbody > tr")].map(node => node.dataset.row).join(",") !== "5,3,2") throw new Error("simple-bulk-lazy-remove")
  click("reorder")
  await wait()
  appended.at(-1).querySelector("[data-remove]").click()
  await wait()
  if (document.querySelector('[data-id="5"]')) throw new Error("bulk-latest-handler")
  runtimeError = ""
  const beforeInvalid = [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",")
  click("invalidate-retained")
  await wait()
  if (!runtimeError.includes("JSON-safe values") || [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",") !== beforeInvalid) throw new Error("invalid-retained")
  click("repair-retained")
  await wait()
  runtimeError = ""
  click("duplicate")
  await wait()
  const beforeDuplicate = [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",")
  if (!runtimeError.includes("Duplicate keyed list key: 2") || [...document.querySelectorAll("[data-list] > li")].map(node => node.dataset.id).join(",") !== beforeDuplicate) throw new Error("duplicate")
  const mixed = document.querySelector("[data-mixed-list]")
  const mixedText = () => [...mixed.querySelectorAll(":scope > li")].map(node => node.textContent).join(",")
  if (mixedText() !== "Numeric,String") throw new Error("mixed-key-initial")
  click("update-mixed")
  await wait()
  if (mixedText() !== "Numeric updated,String updated") throw new Error("mixed-key-update")
  runtimeError = ""
  let mixedWrites = 0
  const mixedObserver = new MutationObserver(records => { mixedWrites += records.length })
  mixedObserver.observe(mixed, { childList: true, characterData: true, subtree: true })
  click("invalidate-mixed-late")
  await wait()
  mixedObserver.disconnect()
  if (!runtimeError.includes("JSON-safe values") || mixedWrites || mixedText() !== "Numeric updated,String updated") throw new Error("invalid-late-partial-write")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}

`)
  const port = nextBrowserPort()
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
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runRenderedCollectionBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const rows = selector => [...document.querySelectorAll(selector + " > li")]
try {
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  const stable = rows("[data-stable]")
  const reused = rows("[data-reused]")
  const imported = rows("[data-imported]")
  const sorted = rows("[data-sorted]")
  const positional = rows("[data-positional]")
  const conditionalAlpha = rows("[data-conditional-and]")[0]
  const conditionalTernary = rows("[data-conditional-ternary]")
  if (stable.map(node => node.dataset.id).join(",") !== "a,c" || reused.map(node => node.dataset.id).join(",") !== "a,c" || imported.map(node => node.dataset.id).join(",") !== "a,c" || positional.map(node => node.dataset.id).join(",") !== "a,c" || conditionalAlpha?.dataset.id !== "a" || conditionalTernary.map(node => node.dataset.id).join(",") !== "a,c") throw new Error("initial")
  click("select-c")
  await wait()
  const conditionalGamma = rows("[data-conditional-and]")[0]
  if (conditionalGamma?.dataset.id !== "c" || conditionalGamma === conditionalAlpha) throw new Error("conditional-and-switch")
  click("select-a")
  await wait()
  const conditionalAlphaAgain = rows("[data-conditional-and]")[0]
  if (conditionalAlphaAgain?.dataset.id !== "a" || conditionalAlphaAgain === conditionalAlpha) throw new Error("conditional-and-remount")
  if (rows("[data-page]").map(node => node.dataset.id).join(",") !== "a,b") throw new Error("page-initial")
  click("page-next")
  await wait()
  if (rows("[data-page]").map(node => node.dataset.id).join(",") !== "c") throw new Error("page-next")
  click("page-previous")
  await wait()
  if (rows("[data-page]").map(node => node.dataset.id).join(",") !== "a,b") throw new Error("page-previous")
  click("search")
  await wait()
  if (rows("[data-search]").map(node => node.dataset.id).join(",") !== "c") throw new Error("search")
  click("search-clear")
  await wait()
  if (rows("[data-search]").map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("search-clear")
  stable[1].querySelector("[data-pick]").click()
  await wait()
  if (document.body.dataset.pick !== "1:Gamma") throw new Error("initial-index-handler")
  click("show")
  await wait()
  const shownStable = rows("[data-stable]")
  const shownReused = rows("[data-reused]")
  const shownImported = rows("[data-imported]")
  const shownPositional = rows("[data-positional]")
  if (shownStable[0] !== stable[0] || shownStable[2] !== stable[1] || shownStable.map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("stable-insert")
  if (shownReused[0] !== reused[0] || shownReused[2] !== reused[1] || shownReused.map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("reused-insert")
  if (shownImported[0] !== imported[0] || shownImported[2] !== imported[1] || shownImported.map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("imported-insert")
  if (shownPositional[0] !== positional[0] || shownPositional[1] !== positional[1] || shownPositional.map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("positional-insert")
  const shownConditionalTernary = rows("[data-conditional-ternary]")
  if (shownConditionalTernary[0] !== conditionalTernary[0] || shownConditionalTernary[2] !== conditionalTernary[1] || shownConditionalTernary.map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("conditional-ternary-insert")
  if (shownStable[2].querySelector("span").textContent !== "2:Gamma" || shownPositional[1].querySelector("span").textContent !== "1:Beta") throw new Error("index-content")
  const shownBranch = shownStable[2].querySelector("[data-index-branch]")
  shownBranch?.click()
  await wait()
  if (!shownBranch || shownBranch.textContent !== "2:Gamma" || document.body.dataset.branch !== "2:Gamma") throw new Error("index-condition-entry")
  shownStable[2].querySelector("[data-pick]").click()
  shownPositional[1].querySelector("[data-pick]").click()
  await wait()
  if (document.body.dataset.pick !== "2:Gamma" || document.body.dataset.position !== "1:Beta") throw new Error("latest-index-handler")
  click("reverse")
  await wait()
  const reversedStable = rows("[data-stable]")
  const reversedReused = rows("[data-reused]")
  const reversedImported = rows("[data-imported]")
  const reversedPositional = rows("[data-positional]")
  if (reversedStable[0] !== stable[1] || reversedStable[2] !== stable[0] || reversedStable.map(node => node.dataset.id).join(",") !== "c,b,a") throw new Error("stable-reorder")
  if (reversedReused[0] !== reused[1] || reversedReused[2] !== reused[0] || reversedReused.map(node => node.dataset.id).join(",") !== "c,b,a") throw new Error("reused-reorder")
  if (reversedImported[0] !== imported[1] || reversedImported[2] !== imported[0] || reversedImported.map(node => node.dataset.id).join(",") !== "c,b,a") throw new Error("imported-reorder")
  if (rows("[data-sorted]").some((node, index) => node !== sorted[index]) || rows("[data-sorted]").map(node => node.dataset.id).join(",") !== "a,b,c") throw new Error("sorted-reorder")
  if (reversedPositional[0] !== positional[0] || reversedPositional[1] !== positional[1] || reversedPositional.map(node => node.dataset.id).join(",") !== "c,b,a") throw new Error("positional-reorder")
  const reversedConditionalTernary = rows("[data-conditional-ternary]")
  if (reversedConditionalTernary[0] !== conditionalTernary[1] || reversedConditionalTernary[2] !== conditionalTernary[0] || reversedConditionalTernary.map(node => node.dataset.id).join(",") !== "c,b,a") throw new Error("conditional-ternary-reorder")
  const reenteredBranch = reversedStable[2].querySelector("[data-index-branch]")
  reenteredBranch?.click()
  await wait()
  if (!reenteredBranch || reenteredBranch.textContent !== "2:Alpha" || document.body.dataset.branch !== "2:Alpha") throw new Error("index-condition-reentry")
  click("remove")
  await wait()
  if (rows("[data-stable]").map(node => node.dataset.id).join(",") !== "c,a" || rows("[data-reused]").map(node => node.dataset.id).join(",") !== "c,a" || rows("[data-imported]").map(node => node.dataset.id).join(",") !== "c,a" || rows("[data-sorted]").map(node => node.dataset.id).join(",") !== "a,c" || rows("[data-positional]").map(node => node.dataset.id).join(",") !== "c,a") throw new Error("remove")
  click("add-child")
  await wait()
  if (document.querySelector('[data-group="empty"] span')?.textContent !== "0:Zulu" || document.querySelector('[data-group="empty"] [data-conditional-children] i')?.dataset.id !== "z" || [...document.querySelectorAll("[data-flat] > i")].map(node => node.dataset.id).join(",") !== "z,x") throw new Error("optional-add")
  const flatBefore = document.querySelector("[data-flat]").textContent
  click("duplicate")
  await wait()
  if (!runtimeError.includes("Duplicate keyed list key: same") || document.querySelector("[data-flat]").textContent !== flatBefore) throw new Error("duplicate-flat-key")
  document.body.dataset.renderedCollectionTest = "pass"
} catch (error) {
  document.body.dataset.renderedCollectionTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-rendered-collection-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNestedListBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const categories = () => [...document.querySelectorAll("[data-categories] > [data-category]")]
const items = category => [...category.querySelectorAll(":scope > [data-items] > [data-item]")]
const groups = item => [...item.querySelectorAll(":scope > [data-groups] > [data-group]")]
const options = group => [...group.querySelectorAll(":scope > [data-options] > [data-option]")]
const badges = item => [...item.querySelectorAll(":scope > [data-badges] > [data-badge]")]
const badgeCopies = item => [...item.querySelectorAll(":scope > [data-badge-copy] > [data-badge-copy]")]
try {
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  await wait()
  const spa = document.querySelector('[data-category="c1"]')
  const dining = document.querySelector('[data-category="c2"]')
  const sauna = spa.querySelector('[data-item="a1"]')
  const massage = spa.querySelector('[data-item="a2"]')
  const morning = sauna.querySelector('[data-group="g1"]')
  const tea = morning.querySelector('[data-option="o1"]')
  if (categories().map(node => node.dataset.category).join(",") !== "c1,c2" || items(spa).map(node => node.dataset.item).join(",") !== "a1,a2") throw new Error("initial")
  if (groups(sauna).map(node => node.dataset.group).join(",") !== "g1" || morning.querySelector("[data-group-title]").textContent !== "Morning") throw new Error("deep-initial")
  if (options(morning).map(node => node.dataset.option).join(",") !== "o1" || tea.textContent !== "Tea") throw new Error("recursive-initial")
  const hot = sauna.querySelector('[data-badge="b1"]')
  const hotCopy = sauna.querySelector('[data-badge-copy="b1"]')
  if (badges(sauna).map(node => node.dataset.badge).join(",") !== "b1,b2" || badgeCopies(sauna).map(node => node.dataset.badgeCopy).join(",") !== "b1,b2") throw new Error("sibling-initial")
  sauna.querySelector("[data-uncontrolled]").value = "preserved"
  click("update")
  await wait()
  if (document.querySelector('[data-category="c1"]') !== spa || spa.querySelector('[data-item="a1"]') !== sauna) throw new Error("update-remounted")
  if (spa.querySelector("h2").textContent !== "Wellness" || spa.querySelector("footer").textContent !== "Wellness" || spa.querySelector("[data-kind]").textContent !== "Other kind") throw new Error("outer-update")
  if (sauna.querySelector("[data-title]").textContent !== "Sauna Plus" || sauna.querySelector("[data-price]").textContent !== "25") throw new Error("child-update")
  if (sauna.querySelector('[data-group="g1"]') !== morning || morning.querySelector("[data-group-title]").textContent !== "Late Morning") throw new Error("deep-update")
  if (morning.querySelector('[data-option="o1"]') !== tea || tea.textContent !== "Green Tea") throw new Error("recursive-update")
  if (massage.querySelector("[data-title]").textContent !== "Massage" || massage.querySelector("[data-price]").textContent !== "30") throw new Error("unchanged-child-update")
  click("parent-reorder")
  await wait()
  if (categories()[0] !== dining || categories()[1] !== spa || spa.querySelector('[data-item="a1"]') !== sauna) throw new Error("parent-reorder")
  click("child-reorder")
  await wait()
  if (items(spa)[0] !== massage || items(spa)[1] !== sauna || sauna.querySelector("[data-uncontrolled]").value !== "preserved") throw new Error("child-reorder")
  sauna.querySelector("[data-select]").click()
  await wait()
  if (document.body.dataset.selected !== "Sauna Plus|25") throw new Error("latest-event")
  click("group-add")
  await wait()
  const weekend = sauna.querySelector('[data-group="g4"]')
  if (!weekend || groups(sauna).map(node => node.dataset.group).join(",") !== "g1,g4") throw new Error("deep-add")
  weekend.querySelector("[data-group-select]").click()
  await wait()
  if (document.body.dataset.group !== "Weekend") throw new Error("deep-latest-event")
  click("group-reorder")
  await wait()
  if (groups(sauna)[0] !== weekend || groups(sauna)[1] !== morning) throw new Error("deep-reorder")
  click("option-add")
  await wait()
  const water = morning.querySelector('[data-option="o5"]')
  if (!water || options(morning).map(node => node.dataset.option).join(",") !== "o1,o5") throw new Error("recursive-add")
  water.click()
  await wait()
  if (document.body.dataset.option !== "Water") throw new Error("recursive-latest-event")
  click("option-reorder")
  await wait()
  if (options(morning)[0] !== water || options(morning)[1] !== tea) throw new Error("recursive-reorder")
  click("badge-update")
  await wait()
  if (sauna.querySelector('[data-badge="b1"]') !== hot || hot.textContent !== "Very Hot" || sauna.querySelector('[data-badge-copy="b1"]') !== hotCopy || hotCopy.textContent !== "Very Hot") throw new Error("sibling-update")
  click("badge-add")
  await wait()
  const dry = sauna.querySelector('[data-badge="b5"]')
  const dryCopy = sauna.querySelector('[data-badge-copy="b5"]')
  if (!dry || !dryCopy || badges(sauna).map(node => node.dataset.badge).join(",") !== "b1,b2,b5" || badgeCopies(sauna).map(node => node.dataset.badgeCopy).join(",") !== "b1,b2,b5") throw new Error("sibling-add")
  click("badge-reorder")
  await wait()
  if (badges(sauna)[0] !== dry || badges(sauna)[2] !== hot || badgeCopies(sauna)[0] !== dryCopy || badgeCopies(sauna)[2] !== hotCopy) throw new Error("sibling-reorder")
  click("child-remove")
  await wait()
  if (spa.querySelector('[data-item="a2"]') || spa.querySelector('[data-item="a1"]') !== sauna) throw new Error("child-remove")
  click("child-readd")
  await wait()
  const readded = spa.querySelector('[data-item="a2"]')
  if (!readded || readded === massage || readded.querySelector("[data-title]").textContent !== "Massage Re-added") throw new Error("child-readd")
  readded.querySelector("[data-select]").click()
  await wait()
  if (document.body.dataset.selected !== "Massage Re-added|35") throw new Error("readded-event")
  click("parent-remove")
  await wait()
  if (spa.isConnected || sauna.isConnected || document.querySelector('[data-category="c1"]')) throw new Error("parent-remove")
  click("parent-readd")
  await wait()
  const restored = document.querySelector('[data-category="c1"]')
  if (!restored || restored === spa || restored.querySelector('[data-item="a3"] [data-title]')?.textContent !== "Facial" || restored.querySelector('[data-group="g5"] [data-group-title]')?.textContent !== "Anytime" || restored.querySelector('[data-option="o6"]')?.textContent !== "Mask") throw new Error("parent-readd")
  const childStarts = [...document.querySelectorAll("template[data-k-list]")].filter(start => JSON.parse(start.dataset.kList).ownerField)
  if (!childStarts.length || childStarts.some(start => start.content.firstElementChild)) throw new Error("shared-child-prototype")
  if (runtimeError) throw new Error("runtime-" + runtimeError)
  document.body.dataset.nestedListTest = "pass"
} catch (error) {
  document.body.dataset.nestedListTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-nested-list-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNestedIndexedOptionalBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const rows = () => [...document.querySelectorAll("[data-children] > [data-child]")]
try {
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  await wait()
  const alpha = document.querySelector('[data-child="a"]')
  const beta = document.querySelector('[data-child="b"]')
  if (runtimeError || document.querySelector("[data-optional-child]") || !alpha || !beta || alpha.querySelector("span").textContent !== "0:Alpha" || !alpha.querySelector("[data-first]") || beta.querySelector("span").textContent !== "1:Beta") throw new Error(runtimeError ? "runtime-" + runtimeError : "initial")
  click("reverse")
  await wait()
  if (runtimeError || rows()[0] !== beta || rows()[1] !== alpha || beta.querySelector("span").textContent !== "0:Beta" || !beta.querySelector("[data-first]") || alpha.querySelector("span").textContent !== "1:Alpha" || alpha.querySelector("[data-first]")) throw new Error(runtimeError ? "runtime-" + runtimeError : "reorder")
  alpha.click()
  await wait()
  if (document.body.dataset.selected !== "1:Alpha") throw new Error("reorder-handler")
  click("update")
  await wait()
  if (rows()[1] !== alpha || alpha.querySelector("span").textContent !== "1:Alpha updated") throw new Error("update")
  alpha.click()
  await wait()
  if (document.body.dataset.selected !== "1:Alpha updated") throw new Error("update-handler")
  document.body.dataset.nestedIndexedOptionalTest = "pass"
} catch (error) {
  document.body.dataset.nestedIndexedOptionalTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-nested-indexed-optional-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNestedComponentListBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const local = id => document.querySelector('[data-local-item="' + id + '"]')
const imported = id => document.querySelector('[data-imported-item="' + id + '"]')
const localItems = () => [...document.querySelectorAll("[data-local-item]")]
const importedItems = () => [...document.querySelectorAll("[data-imported-item]")]
try {
  await import("/assets/kudzu-list.js")
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  window.addEventListener("unhandledrejection", event => { runtimeError = event.reason?.message || String(event.reason) })
  const localSauna = local("a1")
  const importedSauna = imported("a1")
  const localMassage = local("a2")
  const importedMassage = imported("a2")
  if (localSauna?.title !== "Sauna" || localSauna?.querySelector("[data-direct]")?.textContent !== "Sauna" || localSauna?.querySelector("[data-range]")?.textContent !== "a1: Sauna") throw new Error("initial-local-markers")
  if (importedSauna?.title !== "Sauna" || importedSauna?.querySelector("[data-direct]")?.textContent !== "Sauna" || importedSauna?.querySelector("[data-range]")?.textContent !== "a1: Sauna") throw new Error("initial-imported-markers")
  const initialDeep = localSauna?.querySelector("[data-deep]")
  if (!initialDeep || initialDeep.textContent !== "Sauna" || localSauna.querySelector("[data-featured]")?.textContent !== "SaunaFeatured" || importedSauna?.querySelector("[data-status]")?.textContent !== "Sauna0Available") throw new Error("initial-available")
  if (localMassage?.querySelector("[data-status]") || importedMassage?.querySelector("[data-status]")?.textContent !== "Massage0Unavailable") throw new Error("initial-unavailable")
  await wait()
  if (importedSauna.querySelector("[data-status]").dataset.effect !== "status:Sauna:0") throw new Error("nested-hook-effect")
  document.querySelector('[data-action="update"]').click()
  await wait()
  if (local("a1") !== localSauna || imported("a1") !== importedSauna) throw new Error("update-remounted")
  if (localSauna.querySelector("[data-label]").textContent !== "SAUNA PLUS" || localSauna.querySelector("[data-status]")) throw new Error("local-update")
  if (localSauna.title !== "Sauna Plus" || localSauna.querySelector("[data-direct]").textContent !== "Sauna Plus" || localSauna.querySelector("[data-range]").textContent !== "a1: Sauna Plus") throw new Error("local-marker-update")
  if (importedSauna.title !== "Sauna Plus" || importedSauna.querySelector("[data-direct]").textContent !== "Sauna Plus" || importedSauna.querySelector("[data-range]").textContent !== "a1: Sauna Plus") throw new Error("imported-marker-update")
  if (importedSauna.querySelector("[data-label]").textContent !== "SAUNA PLUS" || importedSauna.querySelector("[data-status]")?.textContent !== "Sauna Plus0Unavailable" || importedSauna.querySelector("[data-status]")?.title !== "Sauna Plus") throw new Error("imported-update")
  localSauna.querySelector("[data-select]").click()
  importedSauna.querySelector("[data-select]").click()
  importedSauna.querySelector("[data-status]").click()
  await wait()
  if (document.body.dataset.localSelected !== "Sauna Plus" || document.body.dataset.importedSelected !== "Sauna Plus" || document.body.dataset.importedStatus !== "status:Sauna Plus" || importedSauna.querySelector("[data-status]").dataset.effect !== "status:Sauna Plus:1") throw new Error("latest-handler")
  document.querySelector('[data-action="restore"]').click()
  await wait()
  const restoredDeep = localSauna.querySelector("[data-deep]")
  if (local("a1") !== localSauna || imported("a1") !== importedSauna || localSauna.title !== "Sauna Restored" || localSauna.querySelector("[data-range]").textContent !== "a1: Sauna Restored" || !restoredDeep || restoredDeep === initialDeep || restoredDeep.textContent !== "Sauna Restored" || importedSauna.querySelector("[data-status]")?.textContent !== "Sauna Restored1Available" || importedSauna.querySelector("[data-status]")?.title !== "Sauna Restored") throw new Error("condition-reentry")
  importedSauna.querySelector("[data-status]").click()
  await wait()
  if (document.body.dataset.importedStatus !== "status:Sauna Restored") throw new Error("reentered-handler")
  document.querySelector('[data-action="reverse"]').click()
  await wait()
  if (localItems()[0] !== localMassage || localItems()[1] !== localSauna || importedItems()[0] !== importedMassage || importedItems()[1] !== importedSauna) throw new Error("reverse")
  document.querySelector('[data-action="add"]').click()
  await wait()
  const localFacial = local("a3")
  const importedFacial = imported("a3")
  if (localFacial?.title !== "Facial" || localFacial?.querySelector("[data-range]")?.textContent !== "a3: Facial" || !localFacial?.querySelector("strong[data-status]") || importedFacial?.querySelector("[data-status]")?.textContent !== "Facial0Available") throw new Error("added-condition")
  document.querySelector('[data-action="hide-added"]').click()
  await wait()
  if (local("a3") !== localFacial || imported("a3") !== importedFacial || localFacial.querySelector("[data-status]") || importedFacial.querySelector("[data-status]")?.textContent !== "Facial0Unavailable" || importedFacial.querySelector("[data-range]")?.textContent !== "a3: Facial") throw new Error("added-condition-update")
  if (runtimeError) throw new Error("runtime-" + runtimeError)
  document.body.dataset.nestedComponentListTest = "pass"
} catch (error) {
  document.body.dataset.nestedComponentListTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-nested-component-list-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runFlatKeyedRowHooksBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  window.addEventListener("unhandledrejection", event => { runtimeError = event.reason?.message || String(event.reason) })
  const row = document.querySelector('[data-row="b"]')
  row.querySelector("[data-toggle]").click()
  await wait()
  if (row.querySelector("[data-toggle]").getAttribute("aria-pressed") !== "true" || row.querySelector("[data-status]").textContent !== "Saved" || runtimeError) throw new Error(runtimeError || "state")
  document.querySelector("[data-remove]").click()
  await wait()
  if (document.querySelector("li")) throw new Error("remove")
  document.querySelector("[data-readd]").click()
  await wait()
  const readded = document.querySelector('[data-row="c"]')
  if (!readded || readded === row || readded.querySelector("[data-toggle]").getAttribute("aria-pressed") !== "false" || readded.querySelector("[data-status]").textContent !== "Save") throw new Error("readd-reset")
  readded.querySelector("[data-toggle]").click()
  await wait()
  if (readded.querySelector("[data-status]").textContent !== "Saved" || runtimeError) throw new Error(runtimeError || "readd-state")
  document.body.dataset.flatKeyedRowHooksTest = "pass"
} catch (error) {
  document.body.dataset.flatKeyedRowHooksTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-flat-keyed-row-hooks-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runKeyedRowHooksBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 60))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const parent = id => document.querySelector('[data-parent="' + id + '"]')
const row = (parentId, site, itemId) => parent(parentId).querySelector('[data-site="' + site + '"] [data-row="' + site + ':' + parentId + ':' + itemId + '"]')
const count = node => node.querySelector("[data-count]").textContent
try {
  await wait()
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  window.addEventListener("unhandledrejection", event => { runtimeError = event.reason?.message || String(event.reason) })
  const p1 = parent("p1")
  let p2 = parent("p2")
  const one = row("p1", "primary", "shared")
  const two = row("p2", "primary", "shared")
  const positionalFirst = parent("p1").querySelector('[data-site="positional"] li')
  if (!one || !two || one === two || one.querySelector("input").dataset.effectCount !== "0") throw new Error("initial")
  one.querySelector("[data-increment]").click()
  two.querySelector("[data-increment]").click()
  two.querySelector("[data-increment]").click()
  positionalFirst.querySelector("[data-increment]").click()
  p1.querySelector("[data-parent-increment]").click()
  await wait()
  if (count(one) !== "1" || one.querySelector("[data-meta]").textContent !== "1" || one.querySelector("[data-label-count]").textContent !== "1" || count(two) !== "2") throw new Error("isolated-state-" + [count(one), one.querySelector("[data-meta]").textContent, one.querySelector("[data-label-count]").textContent, count(two)].join("-"))
  if (p1.querySelector("[data-parent-visits]").textContent !== "1" || p1.querySelector("[data-parent-active]").textContent !== "inactive") throw new Error("parent-state")
  const secondRef = two.querySelector("input").getAttribute("data-k-ref")
  const beforeHideSecond = document.body.dataset.effectLog
  click("hide-second")
  await wait()
  if (p2.isConnected || document.querySelector('[data-k-ref="' + secondRef + '"]') || !document.body.dataset.effectLog.slice(beforeHideSecond.length).includes("cleanup:primary:p2:shared:Two shared:2")) throw new Error("conditional-parent-unmount")
  click("show-second")
  await wait()
  const remountedP2 = parent("p2")
  const remountedTwo = row("p2", "primary", "shared")
  if (!remountedP2 || remountedP2 === p2 || !remountedTwo || remountedTwo === two || count(remountedTwo) !== "0" || remountedTwo.querySelector("input").dataset.effectCount !== "0") throw new Error("conditional-parent-remount")
  p2 = remountedP2
  one.querySelector("[data-focus]").click()
  await wait()
  if (document.activeElement !== one.querySelector("input") || document.body.dataset.refRead !== "primary:p1:shared") throw new Error("ref")
  click("parent-reorder")
  await wait()
  if (parent("p1") !== p1 || parent("p2") !== p2 || row("p1", "primary", "shared") !== one || count(one) !== "1") throw new Error("parent-reorder")
  click("child-reorder")
  await wait()
  if (row("p1", "primary", "shared") !== one || count(one) !== "1" || [...parent("p1").querySelectorAll('[data-site="primary"] li')].at(-1) !== one) throw new Error("child-reorder")
  click("positional-reorder")
  await wait()
  const positionalAfter = parent("p1").querySelector('[data-site="positional"] li')
  if (positionalAfter !== positionalFirst || count(positionalAfter) !== "1" || positionalAfter.dataset.row !== "positional:p1:last") throw new Error("positional-ownership")
  const beforeRename = document.body.dataset.effectLog
  click("rename")
  await wait()
  const renameLog = document.body.dataset.effectLog.slice(beforeRename.length)
  if (!renameLog.includes("cleanup:primary:p1:shared:One shared:1") || !renameLog.includes("mount:primary:p1:shared:One renamed:1") || renameLog.includes("primary:p2")) throw new Error("effect-rerun")
  const removedInputRef = one.querySelector("input").getAttribute("data-k-ref")
  const beforeRemove = document.body.dataset.effectLog
  click("remove")
  await wait()
  if (one.isConnected || document.querySelector('[data-k-ref="' + removedInputRef + '"]') || !document.body.dataset.effectLog.slice(beforeRemove.length).includes("cleanup:primary:p1:shared:One renamed:1")) throw new Error("remove")
  click("readd")
  await wait()
  const readded = row("p1", "primary", "shared")
  if (!readded || readded === one || count(readded) !== "0" || readded.querySelector("[data-meta]").textContent !== "0" || readded.querySelector("[data-label-count]").textContent !== "0" || readded.querySelector("input").dataset.effectCount !== "0") throw new Error("readd-reset")
  if (runtimeError) throw new Error("runtime-" + runtimeError)
  document.body.dataset.keyedRowHooksTest = "pass"
} catch (error) {
  document.body.dataset.keyedRowHooksTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-keyed-row-hooks-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNonKeyedChildStateBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const toggle = id => document.querySelector('[data-toggle="' + id + '"]')
try {
  const { browserState } = await import("/assets/kudzu.js")
  await wait()
  const localA = toggle("local-a")
  const localB = toggle("local-b")
  const importedA = toggle("imported-a")
  const importedB = toggle("imported-b")
  localA.click()
  await wait()
  if (!localA.textContent.includes("on") || !localB.textContent.includes("off")) throw new Error("local-state-coupled")
  importedB.click()
  await wait()
  if (!importedA.textContent.includes("off") || !importedB.textContent.includes("on")) throw new Error("imported-state-coupled")
  document.querySelector('[data-action="show"]').click()
  await wait()
  const first = document.querySelector("[data-owned]")
  const descriptor = [...document.querySelectorAll("template[data-k-if]")].map(node => JSON.parse(node.dataset.kIf)).find(entry => entry.owned)
  const ownedId = descriptor.owned.true[0][0]
  if (!first || first.textContent !== "Owned: 0" || browserState.get(ownedId)?.value !== 0) throw new Error("initial-owned-state")
  first.click()
  await wait()
  if (first.textContent !== "Owned: 1" || browserState.get(ownedId)?.value !== 1) throw new Error("owned-update")
  document.querySelector('[data-action="hide"]').click()
  await wait()
  if (document.querySelector("[data-owned]") || browserState.has(ownedId)) throw new Error("owned-unmount")
  document.querySelector('[data-action="show"]').click()
  await wait()
  const second = document.querySelector("[data-owned]")
  if (!second || second === first || second.textContent !== "Owned: 0" || browserState.get(ownedId)?.value !== 0) throw new Error("owned-remount")
  document.body.dataset.nonKeyedChildStateTest = "pass"
} catch (error) {
  document.body.dataset.nonKeyedChildStateTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=4000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-non-keyed-child-state-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runPrimitivePropDependencyBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  if (document.body.dataset.propLog !== "|mount Local:1|mount Imported:1") throw new Error("initial-effects:" + document.body.dataset.propLog)
  document.querySelector('[data-action="show"]').click()
  await wait()
  if (document.body.dataset.propLog !== "|mount Local:1|mount Imported:1|mount Conditional:1") throw new Error("conditional-mount:" + document.body.dataset.propLog)
  document.querySelector('[data-action="increment"]').click()
  await wait()
  const statuses = [...document.querySelectorAll("[data-status]")].map(node => node.textContent).join("|")
  if (statuses !== "Local: 2|Imported: 2|Conditional: 2") throw new Error("bindings:" + statuses)
  const expected = "|mount Local:1|mount Imported:1|mount Conditional:1|cleanup Local:1|cleanup Imported:1|cleanup Conditional:1|mount Local:2|mount Imported:2|mount Conditional:2"
  if (document.body.dataset.propLog !== expected) throw new Error("dependency-effects:" + document.body.dataset.propLog)
  document.querySelector('[data-action="hide"]').click()
  await wait()
  if (document.querySelector('[data-status="Conditional"]') || document.body.dataset.propLog !== expected + "|cleanup Conditional:2") throw new Error("conditional-cleanup:" + document.body.dataset.propLog)
  document.body.dataset.primitivePropDependencyTest = "pass"
} catch (error) {
  document.body.dataset.primitivePropDependencyTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-primitive-prop-dependency-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runReactShapedIntegrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 60))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const projections = selector => [...document.querySelectorAll(selector + " > li")]
const item = id => document.querySelector('[data-primary] [data-item="' + id + '"]')
try {
  let runtimeError = ""
  window.addEventListener("error", event => { runtimeError = event.error?.message || event.message })
  window.addEventListener("unhandledrejection", event => { runtimeError = event.reason?.message || String(event.reason) })
  await wait()
  const stable = projections("[data-stable]")
  const positional = projections("[data-positional]")
  const alpha = item("a")
  const secondary = projections("[data-secondary]")
  if (stable.map(node => node.dataset.projection).join(",") !== "a,c" || positional.map(node => node.dataset.projection).join(",") !== "a,c") throw new Error("initial-projections")
  if (!alpha?.querySelector("[data-featured] [data-latest]") || secondary.map(node => node.dataset.secondaryItem).join(",") !== "x,y") throw new Error("initial-nested")
  click("show")
  await wait()
  const shownStable = projections("[data-stable]")
  const shownPositional = projections("[data-positional]")
  if (shownStable[0] !== stable[0] || shownStable[2] !== stable[1] || shownStable.map(node => node.dataset.projection).join(",") !== "a,b,c") throw new Error("stable-filter")
  if (shownPositional[0] !== positional[0] || shownPositional[1] !== positional[1] || shownPositional[1].dataset.projection !== "b") throw new Error("positional-filter")
  alpha.querySelector("[data-increment]").click()
  alpha.querySelector("[data-focus]").click()
  await wait()
  if (alpha.querySelector("[data-count]").textContent !== "1" || alpha.querySelector("[data-changes]").textContent !== "1" || document.activeElement !== alpha.querySelector("input") || document.body.dataset.ref !== "a") throw new Error("row-hooks")
  click("reverse")
  await wait()
  const reversedStable = projections("[data-stable]")
  const reversedPositional = projections("[data-positional]")
  if (reversedStable[0] !== stable[1] || reversedStable[2] !== stable[0] || reversedStable.map(node => node.dataset.projection).join(",") !== "c,b,a") throw new Error("stable-reorder")
  if (reversedPositional[0] !== positional[0] || reversedPositional[1] !== positional[1] || reversedPositional.map(node => node.dataset.projection).join(",") !== "c,b,a") throw new Error("positional-reorder")
  if (item("a") !== alpha || alpha.querySelector("[data-count]").textContent !== "1" || projections("[data-secondary]").some((node, index) => node !== secondary[index])) throw new Error("independent-siblings")
  click("branch")
  await wait()
  if (alpha.querySelector("[data-featured]") || alpha.querySelector("[data-status]")?.textContent !== "Standard") throw new Error("branch-exit")
  const beforeRename = document.body.dataset.effects
  click("rename")
  await wait()
  const renameEffects = document.body.dataset.effects.slice(beforeRename.length)
  if (!renameEffects.includes("cleanup:a:Alpha:1") || !renameEffects.includes("mount:a:Alpha latest:1")) throw new Error("effect-dependency")
  click("branch")
  await wait()
  const latest = alpha.querySelector("[data-latest]")
  latest?.click()
  await wait()
  if (!latest || latest.textContent !== "Alpha latest" || document.body.dataset.latest !== "Alpha latest") throw new Error("branch-reentry")
  const ref = alpha.querySelector("input").getAttribute("data-k-ref")
  const beforeRemove = document.body.dataset.effects
  click("remove")
  await wait()
  if (alpha.isConnected || document.querySelector('[data-k-ref="' + ref + '"]') || !document.body.dataset.effects.slice(beforeRemove.length).includes("cleanup:a:Alpha latest:1")) throw new Error("row-removal")
  click("readd")
  await wait()
  const readded = item("a")
  if (!readded || readded === alpha || readded.querySelector("[data-count]").textContent !== "0" || readded.querySelector("[data-changes]").textContent !== "0" || readded.querySelector("input").dataset.effectCount !== "0") throw new Error("row-readd")
  if (projections("[data-secondary]").some((node, index) => node !== secondary[index]) || runtimeError) throw new Error(runtimeError ? "runtime-" + runtimeError : "sibling-lifecycle")
  document.body.dataset.reactShapedIntegrationTest = "pass"
} catch (error) {
  document.body.dataset.reactShapedIntegrationTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=6000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-react-shaped-integration-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runLandingPageMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/preview/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const toggle = document.querySelector("#menu-toggle")
  if (!document.querySelector("[data-hero]") || document.querySelectorAll("[data-features] article").length !== 2 || toggle.getAttribute("aria-expanded") !== "false" || document.querySelector("#mobile-menu")) throw new Error("initial")
  toggle.click()
  await wait()
  if (toggle.textContent.trim() !== "Close menu" || toggle.getAttribute("aria-expanded") !== "true" || !document.querySelector("#mobile-menu")) throw new Error("open")
  toggle.click()
  await wait()
  if (toggle.textContent.trim() !== "Open menu" || toggle.getAttribute("aria-expanded") !== "false" || document.querySelector("#mobile-menu")) throw new Error("close")
  document.body.dataset.landingMigrationTest = "pass"
} catch (error) {
  document.body.dataset.landingMigrationTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = request.url.startsWith("/preview") ? request.url.slice("/preview".length) : request.url
  const file = path.join(root, pathname === "/" ? "index.html" : pathname.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/preview/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-landing-migration-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runReactViteAppBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("<head>", '<head><script>localStorage.setItem("kudzu-counter", "4")</script>').replace("</body>", '<script type="module" src="/app/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  const counter = document.querySelector("#counter")
  const secondary = document.querySelector("#secondary")
  const reset = document.querySelector("#reset")
  const copy = document.querySelector("#copy")
  const menu = document.querySelector("#menu")
  await wait()
  if (counter.textContent.trim() !== "Count 4") throw new Error("storage-restore")
  counter.click()
  await wait()
  if (counter.textContent.trim() !== "Count 5" || document.querySelector("#doubled").textContent.trim() !== "Double 10" || document.querySelector("#summary").textContent.trim() !== "Summary 15 / 15" || location.search !== "?count=5" || localStorage.getItem("kudzu-counter") !== "5") throw new Error("member-state")
  counter.click()
  await wait()
  if (counter.textContent.trim() !== "Count 6" || document.querySelector("#doubled").textContent.trim() !== "Double 12" || document.querySelector("#summary").textContent.trim() !== "Summary 18 / 14" || document.querySelector("#status").textContent !== "changed" || location.search !== "?count=6" || localStorage.getItem("kudzu-counter") !== "6") throw new Error("callback-state")
  secondary.click()
  await wait()
  if (secondary.textContent.trim() !== "Secondary 12" || counter.textContent.trim() !== "Count 6") throw new Error("callback-owner")
  reset.click()
  await wait()
  if (counter.textContent.trim() !== "Count 0" || document.querySelector("#doubled").textContent.trim() !== "Double 0" || document.querySelector("#summary").textContent.trim() !== "Summary 0 / 20" || document.querySelector("#status").textContent !== "ready" || document.querySelector("#offset").textContent !== "-1" || document.querySelector("#selection").textContent !== "" || location.search !== "?count=6" || localStorage.getItem("kudzu-counter") !== "0") throw new Error("custom-hook-reset")
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { document.body.dataset.clipboardText = value } } })
  copy.click()
  await wait()
  if (document.body.dataset.clipboardText !== "0" || document.querySelector("#status").textContent !== "copied") throw new Error("clipboard-success")
  navigator.clipboard.writeText = async () => { throw new Error("denied") }
  copy.click()
  await wait()
  if (document.querySelector("#status").textContent !== "copy failed") throw new Error("clipboard-failure")
  const input = document.querySelector("#draft")
  input.value = "first"
  input.dispatchEvent(new Event("input", { bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 20))
  input.value = "second"
  input.dispatchEvent(new Event("input", { bubbles: true }))
  await new Promise(resolve => setTimeout(resolve, 120))
  if (document.querySelector("#debounced").textContent !== "second" || document.body.dataset.debounceCommit !== "second") throw new Error("debounce-latest")
  input.value = "cancelled"
  input.dispatchEvent(new Event("input", { bubbles: true }))
  document.querySelector("#editor-toggle").click()
  await new Promise(resolve => setTimeout(resolve, 120))
  if (document.querySelector("#debounced-editor") || document.body.dataset.debounceCommit !== "second") throw new Error("debounce-cleanup")
  document.querySelector("#editor-toggle").click()
  await wait()
  if (document.querySelector("#debounced").textContent !== "") throw new Error("debounce-remount")
  let flash = document.querySelector("#error-flash")
  flash.click()
  await new Promise(resolve => setTimeout(resolve, 30))
  flash.click()
  await new Promise(resolve => setTimeout(resolve, 80))
  if (flash.textContent !== "Error" || document.body.dataset.errorFlashCount) throw new Error("timer-replacement")
  await new Promise(resolve => setTimeout(resolve, 60))
  if (flash.textContent !== "Ready" || document.body.dataset.errorFlashCount !== "1") throw new Error("timer-latest")
  flash.click()
  document.querySelector("#flash-toggle").click()
  await new Promise(resolve => setTimeout(resolve, 140))
  if (document.querySelector("#error-flash") || document.body.dataset.errorFlashCount !== "1") throw new Error("timer-cleanup")
  document.querySelector("#flash-toggle").click()
  await wait()
  flash = document.querySelector("#error-flash")
  if (flash.textContent !== "Ready") throw new Error("timer-remount")
  flash.click()
  await new Promise(resolve => setTimeout(resolve, 140))
  if (flash.textContent !== "Ready" || document.body.dataset.errorFlashCount !== "2") throw new Error("timer-remount-fire")
  const pulse = document.querySelector("#pulse")
  pulse.click()
  await wait()
  if (pulse.textContent !== "Ready") throw new Error("timer-default-arrow")
  const firstItem = document.querySelector('#memo-items [data-item="a"]')
  document.querySelector("#show-items").click()
  await wait()
  const items = [...document.querySelectorAll("#memo-items [data-item]")]
  if (items.map(item => item.dataset.item).join(",") !== "a,b" || items[0] !== firstItem) throw new Error("memo-collection")
  menu.click()
  await wait()
  if (menu.textContent.trim() !== "Close" || menu.getAttribute("aria-expanded") !== "true" || !document.querySelector("nav") || !document.querySelector("#memo-items").classList.contains("open")) throw new Error("aliased-state")
  document.body.dataset.reactViteAppTest = "pass"
} catch (error) {
  document.body.dataset.reactViteAppTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = request.url.startsWith("/app") ? request.url.slice("/app".length) : request.url
  const file = path.join(root, pathname === "/" ? "index.html" : pathname.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/app/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-react-vite-app-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runZustandMigrationBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error("timeout")
}
try {
  const header = document.querySelector("[data-cart-header]")
  document.querySelector("[data-add]").click()
  await waitFor(() => document.querySelector("[data-cart-count]").textContent === "2")
  document.querySelector('a[href="/cart"]').click()
  await waitFor(() => document.querySelector('[data-route="cart"]') && document.querySelector("[data-oak-quantity]").textContent === "2")
  if (document.querySelector("[data-cart-header]") !== header) throw new Error("shared-state")
  document.querySelector("[data-remove]").click()
  await waitFor(() => document.querySelector("[data-cart-count]").textContent === "0" && document.querySelector("[data-oak-quantity]").textContent === "0")
  document.querySelector('a[href="/"]').click()
  await waitFor(() => document.querySelector('[data-route="product"]'))
  if (document.querySelector("[data-cart-header]") !== header || document.querySelector("[data-cart-count]").textContent !== "0") throw new Error("layout-lifetime")
  document.body.dataset.zustandMigrationTest = "pass"
} catch (error) {
  document.body.dataset.zustandMigrationTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname
  const file = path.join(root, pathname === "/" ? "index.html" : path.extname(pathname) ? pathname.slice(1) : pathname.slice(1) + "/index.html")
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-zustand-migration-test="pass"/, browser.stdout.match(/<div class="error-code">([^<]+)/)?.[1] ?? browser.stderr)
  } finally {
    server.kill()
  }
}

async function runImportedMemoCollectionBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async predicate => {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (predicate()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error("timeout")
}
try {
  const rows = () => [...document.querySelectorAll("[data-product]")]
  const oak = rows()[0]
  const lamp = rows()[1]
  document.querySelector('[data-category="field"]').click()
  await waitFor(() => rows().length === 1)
  if (rows()[0] !== oak || lamp.isConnected) throw new Error("filter-identity")
  document.querySelector('[data-category="all"]').click()
  await waitFor(() => rows().length === 2)
  if (rows()[0] !== oak || rows()[1] === lamp || rows().map(row => row.dataset.product).join(",") !== "oak,lamp") throw new Error("restore-identity")
  document.body.dataset.importedMemoCollectionTest = "pass"
} catch (error) {
  document.body.dataset.importedMemoCollectionTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-imported-memo-collection-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runComponentListBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
try {
  const list = () => [...document.querySelectorAll("[data-component-list] > li")]
  if (list().map(node => node.dataset.item).join(",") !== "1,2") throw new Error("initial")
  click("add")
  await wait()
  if (list().map(node => node.textContent).join(",") !== "Oak,Pine,Elm") throw new Error("add")
  const oak = list()[0]
  click("rename")
  await wait()
  if (list()[0] !== oak || oak.textContent !== "Red oak") throw new Error("update")
  click("reorder")
  await wait()
  if (list().map(node => node.dataset.item).join(",") !== "3,2,1" || list()[2] !== oak) throw new Error("reorder")
  click("remove")
  await wait()
  if (list().map(node => node.dataset.item).join(",") !== "3,1") throw new Error("remove")
  document.body.dataset.componentListTest = "pass"
} catch (error) {
  document.body.dataset.componentListTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-component-list-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runImportedComponentListBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const click = action => document.querySelector('[data-action="' + action + '"]').click()
const selectors = ["[data-default-list]", "[data-named-list]", "[data-barrel-list]"]
const rows = selector => [...document.querySelectorAll(selector + " > [data-item]")]
try {
  if (selectors.some(selector => rows(selector).map(node => node.dataset.item).join(",") !== "1,2")) throw new Error("initial")
  if (rows("[data-default-list]")[0].getAttribute("aria-label") !== "OAK") throw new Error("specialized-expression")
  const oaks = selectors.map(selector => rows(selector)[0])
  click("add")
  await wait()
  if (selectors.some(selector => rows(selector).map(node => node.textContent).join(",") !== "Oak,Pine,Elm")) throw new Error("add")
  click("rename")
  await wait()
  if (selectors.some((selector, index) => rows(selector)[0] !== oaks[index] || oaks[index].textContent !== "Red oak") || oaks[0].getAttribute("aria-label") !== "RED OAK") throw new Error("update")
  click("reorder")
  await wait()
  if (selectors.some((selector, index) => rows(selector).map(node => node.dataset.item).join(",") !== "3,2,1" || rows(selector)[2] !== oaks[index])) throw new Error("reorder")
  click("remove")
  await wait()
  if (selectors.some(selector => rows(selector).map(node => node.dataset.item).join(",") !== "3,1")) throw new Error("remove")
  document.body.dataset.importedComponentListTest = "pass"
} catch (error) {
  document.body.dataset.importedComponentListTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=2000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-imported-component-list-test="pass"/)
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
  const port = nextBrowserPort()
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
  await waitForServer(port)
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
  const port = nextBrowserPort()
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
  await waitForServer(port)
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

async function runConditionalEffectBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
try {
  await wait()
  const control = action => document.querySelector('[data-action="' + action + '"]')
  if (document.body.dataset.effectLog || document.querySelector("[data-resource]")) throw new Error("hidden-mounted")
  control("count").click()
  await wait()
  if (document.body.dataset.effectLog) throw new Error("hidden-rerun")
  control("open").click()
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1") throw new Error("open")
  control("count").click()
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1|cleanup 1|setup 2") throw new Error("mounted-rerun")
  document.body.effectResolvers[0]("stale")
  await wait()
  if (document.querySelector("[data-result]").textContent !== "pending") throw new Error("stale-setter")
  control("close").click()
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1|cleanup 1|setup 2|cleanup 2") throw new Error("close")
  control("count").click()
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1|cleanup 1|setup 2|cleanup 2") throw new Error("closed-rerun")
  control("open").click()
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1|cleanup 1|setup 2|cleanup 2|setup 3") throw new Error("reopen")
  const runtime = await import("/assets/kudzu.js")
  runtime.unmountDom(document)
  runtime.unmountDom(document)
  await wait()
  if (document.body.dataset.effectLog !== "|setup 1|cleanup 1|setup 2|cleanup 2|setup 3|cleanup 3") throw new Error("dispose")
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runKeyedEffectBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const wait = () => new Promise(resolve => setTimeout(resolve, 50))
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  throw new Error(label)
}
try {
  const control = action => document.querySelector('[data-action="' + action + '"]')
  const runtime = await import("/assets/kudzu.js")
  const notifications = []
  runtime.registerListItemHook("s2", root => notifications.push(root.dataset.row))
  const errors = []
  const originalError = console.error
  console.error = error => { errors.push(String(error)); originalError(error) }
  await wait()
  let expected = "|mount OAK:true|dep Oak:old:0|mount PINE:true|dep Pine:old:0"
  if (document.body.dataset.effectLog !== expected) throw new Error("initial:" + document.body.dataset.effectLog)
  control("add").click()
  await wait()
  expected += "|mount ELM:true|dep Elm:old:0"
  if (document.body.dataset.effectLog !== expected) throw new Error("add")
  if (notifications.length) throw new Error("add-notification")
  control("reorder").click()
  await wait()
  if (document.body.dataset.effectLog !== expected) throw new Error("reorder")
  if (notifications.length) throw new Error("reorder-notification")
  control("unrelated").click()
  await wait()
  if (document.body.dataset.effectLog !== expected) throw new Error("unrelated")
  if (notifications.join() !== "1") throw new Error("changed-root-notification:" + notifications)
  const stale = document.body.rowResolvers[1]
  control("invalid").click()
  await wait()
  if (document.body.dataset.effectLog !== expected || !errors.some(error => error.includes('keyed item dependency "name" must remain a JSON-safe primitive'))) throw new Error("invalid-dependency")
  control("update").click()
  expected += "|dep-clean Oak:0"
  await waitFor(() => document.body.dataset.effectLog === expected, "async-cleanup-start")
  control("invalid").click()
  await wait()
  if (document.body.dataset.effectLog !== expected) throw new Error("invalid-during-cleanup")
  control("update").click()
  await wait()
  expected += "|dep Red oak:latest:0"
  if (document.body.dataset.effectLog !== expected) throw new Error("update:" + document.body.dataset.effectLog)
  stale("stale")
  await wait()
  if (document.querySelector("[data-result]").textContent !== "pending") throw new Error("stale-setter")
  document.body.rowResolvers[1]("fresh")
  await wait()
  if (document.querySelector("[data-result]").textContent !== "fresh") throw new Error("fresh-setter")
  control("mixed").click()
  expected += "|dep-clean Red oak:0|dep-clean Pine:0|dep-clean Elm:0|dep Red oak:latest:1|dep White pine:old:1|dep Elm:old:1"
  await waitFor(() => document.body.dataset.effectLog === expected, "mixed-dependency-complete")
  if (document.body.dataset.effectLog !== expected) throw new Error("mixed-dependency")
  control("remove-two").click()
  await wait()
  expected += "|unmount PINE|dep-clean White pine:1"
  if (document.body.dataset.effectLog !== expected) throw new Error("remove")
  control("close").click()
  await wait()
  expected += "|unmount ELM|dep-clean Elm:1|unmount OAK|dep-clean Red oak:1"
  if (document.body.dataset.effectLog !== expected) throw new Error("conditional-close:" + document.body.dataset.effectLog)
  control("open").click()
  await wait()
  expected += "|mount ELM:true|dep Elm:old:1|mount RED OAK:true|dep Red oak:latest:1"
  if (document.body.dataset.effectLog !== expected) throw new Error("conditional-open")
  control("remove-three").click()
  await wait()
  expected += "|unmount ELM|dep-clean Elm:1"
  runtime.unmountDom(document)
  runtime.unmountDom(document)
  await wait()
  expected += "|unmount RED OAK|dep-clean Red oak:1"
  if (document.body.dataset.effectLog !== expected) throw new Error("dispose:" + document.body.dataset.effectLog)
  document.body.dataset.browserTest = "pass"
} catch (error) {
  document.body.dataset.browserTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const file = path.join(root, request.url === "/" ? "index.html" : request.url.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
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
  document.querySelector("#focus-ref").click()
  await wait()
  if (document.activeElement?.id !== "focus-target" || document.body.dataset.ref !== "focus-target") throw new Error("object-ref")
  document.querySelector("#browser-globals").click()
  await wait()
  if (localStorage.getItem("native-global") !== "ready" || document.body.dataset.browserGlobals !== "0:function") throw new Error("browser-globals")
  if (document.querySelector("#object-state").textContent !== "28° Warm" || document.querySelector("#object-state").children.length) throw new Error("object-state-initial")
  if (document.querySelector("#object-cell").textContent !== "WARM" || document.querySelector("#object-option").textContent !== "Warm" || document.querySelector("#object-svg").textContent !== "28" || document.querySelector("#object-svg-path").getAttribute("stroke-width") !== "2" || document.querySelector("#object-svg-path").getAttribute("fill-rule") !== "evenodd" || document.querySelector("#object-condition").textContent !== "warm") throw new Error("object-context-initial")
  document.querySelector("#hide-object").click()
  await wait()
  if (document.querySelector("#object-condition") || document.querySelector("#object-state").textContent !== "0° Idle") throw new Error("object-condition-unmount")
  document.querySelector("#update-object").click()
  await wait()
  if (document.querySelector("#object-state").textContent !== "21° Cool" || document.querySelector("#object-state").children.length) throw new Error("object-state-update")
  if (document.querySelector("#object-cell").textContent !== "COOL" || document.querySelector("#object-option").textContent !== "Cool" || document.querySelector("#object-svg").textContent !== "21" || document.querySelector("#object-svg-path").getAttribute("stroke-width") !== "1.5" || document.querySelector("#object-condition").textContent !== "cool") throw new Error("object-context-update")
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
  const port = nextBrowserPort()
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
  await waitForServer(port)
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
  const port = nextBrowserPort()
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
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/newsletter/posts/oak/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runSearchParamBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const htmlUrl = new URL("index.html", output)
  const html = await readFile(htmlUrl, "utf8")
  await writeFile(htmlUrl, html.replace("</body>", '<script type="module" src="/browser-test.js"></script></body>'))
  await writeFile(new URL("browser-test.js", output), `
const waitFor = async (test, label) => {
  for (let index = 0; index < 100; index++) {
    if (test()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error(label)
}
try {
  const expected = "vine leaf||null|first|/oak"
  await waitFor(() => document.body.dataset.effectQuery === expected, "effect")
  const main = document.querySelector("main")
  if (main.dataset.query !== "vine leaf" || main.dataset.empty !== "" || main.hasAttribute("data-missing") || main.dataset.encoded !== "/oak") throw new Error("attributes")
  if (document.querySelector("[data-query-text]").textContent !== "vine leaf" || document.querySelector("[data-empty-text]").textContent !== "" || document.querySelector("[data-missing-text]").textContent !== "" || document.querySelector("[data-duplicate-text]").textContent !== "first" || document.querySelector("[data-encoded-text]").textContent !== "/oak") throw new Error("text")
  if (document.querySelector("[data-next]").getAttribute("href") !== "/?q=next") throw new Error("link")
  document.querySelector("button").click()
  await waitFor(() => document.body.dataset.eventQuery === expected, "event")
  const initialHistory = history.length
  document.querySelector("[data-push]").click()
  await waitFor(() => document.querySelector("[data-query-text]").textContent === "pushed", "push")
  if (location.search !== "?q=pushed&empty=&dup=first&dup=second&encoded=%2Foak" || history.length !== initialHistory + 1) throw new Error("push-history")
  document.querySelector("[data-replace]").click()
  await waitFor(() => document.querySelector("[data-query-text]").textContent === "replaced", "replace")
  if (location.search !== "?q=replaced&dup=first&dup=second&encoded=%2Foak" || history.length !== initialHistory + 1 || document.querySelector("[data-empty-text]").textContent !== "") throw new Error("replace-history")
  history.back()
  await waitFor(() => document.querySelector("[data-query-text]").textContent === "vine leaf", "popstate")
  document.body.dataset.searchParamTest = "pass"
} catch (error) {
  document.body.dataset.searchParamTest = "fail-" + error.message
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  const file = path.join(root, url.pathname === "/" ? "index.html" : url.pathname.slice(1))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const query = "?q=vine+leaf&empty=&dup=first&dup=second&encoded=%2Foak"
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/${query}`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-search-param-test="pass"/)
  } finally {
    server.kill()
  }
}

async function runNavigateBrowserTest(fixture, chrome) {
  const output = new URL("./dist/", `${fixture.href}/`)
  const script = '<script type="module" src="/app/browser-test.js"></script>'
  for (const path of ["index.html", "items/oak/index.html"]) {
    const url = new URL(path, output)
    await writeFile(url, (await readFile(url, "utf8")).replace("</body>", `${script}</body>`))
  }
  await writeFile(new URL("browser-test.js", output), `
if (location.pathname === "/app/items/oak") {
  if (location.search === "?view=full" && location.hash === "#details") document.body.dataset.navigateTest = "pass"
} else {
  document.querySelector("[data-open]").click()
}
`)
  const port = nextBrowserPort()
  const serverSource = `
const http = require("node:http"), fs = require("node:fs"), path = require("node:path")
const root = process.argv[1], port = Number(process.argv[2])
http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost")
  const relative = url.pathname.replace(/^\\/app\\/?/, "")
  const file = path.join(root, relative && path.extname(relative) ? relative : path.join(relative, "index.html"))
  response.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : "text/html")
  fs.createReadStream(file).on("error", () => { response.statusCode = 404; response.end() }).pipe(response)
}).listen(port, "127.0.0.1")
`
  const server = spawn(process.execPath, ["-e", serverSource, output.pathname, String(port)], { stdio: "ignore" })
  await waitForServer(port)
  try {
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=5000", "--dump-dom", `http://127.0.0.1:${port}/app/`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-navigate-test="pass"/)
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
  const port = nextBrowserPort()
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
  await waitForServer(port)
  try {
    const id = "550e8400-e29b-41d4-a716-446655440000"
    const browser = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--virtual-time-budget=3000", "--dump-dom", `http://127.0.0.1:${port}/포털/orgs/acme/items/${id}?view=full`], { encoding: "utf8", timeout: 15000 })
    assert.equal(browser.status, 0, browser.stderr)
    assert.match(browser.stdout, /data-browser-test="pass"/)
  } finally {
    server.kill()
  }
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const ready = await new Promise(resolve => {
      const socket = createConnection({ host: "127.0.0.1", port })
      socket.once("connect", () => { socket.destroy(); resolve(true) })
      socket.once("error", () => { socket.destroy(); resolve(false) })
    })
    if (ready) return
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  throw new Error(`Browser fixture server did not start on port ${port}`)
}
