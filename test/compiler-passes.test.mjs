import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import test from "node:test"
import ts from "typescript"
import { createBindingIndex } from "../framework/compiler/analysis/binding-index.mjs"
import { createComponentAnalysis, createComponentAnalysisSession } from "../framework/compiler/analysis/component-analysis.mjs"
import { sourceNodeError } from "../framework/compiler/ast-helpers.mjs"
import { analyzeCollectionPipeline, collectionExpression } from "../framework/compiler/collection-analysis.mjs"
import { generateCommandBehavior } from "../framework/compiler/codegen/command-codegen.mjs"
import { classifyCompatibility, createCompatibilityReport } from "../framework/compiler/compatibility-registry.mjs"
import { createDescriptorSession, createSemanticArtifact } from "../framework/compiler/descriptor-session.mjs"
import { analyzeEffectDependencies, validateEffectOwnedBrowserResources } from "../framework/compiler/effect-analysis.mjs"
import { createHandlerLowering } from "../framework/compiler/handler-lowering.mjs"
import { createInspectionReport } from "../framework/compiler/inspection-report.mjs"
import { assertModuleIRReferences, createModuleIR, registerCommandHandler, registerEffect, registerKeyedBlock, registerSharedAction, registerSharedState } from "../framework/compiler/ir/module-ir.mjs"
import { generateListRuntime } from "../framework/compiler/list-runtime-codegen.mjs"
import { applyNormalizationPasses } from "../framework/compiler/normalization-pipeline.mjs"
import { createCommandSpecializer } from "../framework/compiler/optimize/command-specialization.mjs"
import { createParamCodegen } from "../framework/compiler/param-codegen.mjs"
import { createProjectSession } from "../framework/compiler/project-session.mjs"
import { normalizeRenderControlFlow } from "../framework/compiler/render-control-pass.mjs"
import { assertRouteBuildRecord, createRouteBuildRecord, planRouteArtifacts, releaseRouteBuildRecordPlan } from "../framework/compiler/route-build-record.mjs"
import { createRouteArtifactReport } from "../framework/compiler/route-artifact-report.mjs"
import { assertCapabilityIR, planRouteCapabilities, usesRouteDependencyRuntime } from "../framework/compiler/route-capability-planner.mjs"
import { planRuntimeFamilies } from "../framework/compiler/runtime-family-planner.mjs"
import { assertRouteIR } from "../framework/compiler/route-ir.mjs"
import { generateBindingRuntime, generateCoreRuntime, generateEffectRuntime, generateNativeRuntime, generateNavigationRuntime } from "../framework/compiler/runtime-codegen.mjs"
import { compileSource, createSourceCompiler, reachableSourceFiles } from "../framework/compiler/source-compiler.mjs"
import { createZustandPass } from "../framework/compiler/zustand-pass.mjs"

const handlerLowering = createHandlerLowering({ cloneAst: node => node, synthesizeTree: node => node })

test("bounds inspection sections after deterministic blocker ordering", () => {
  const ready = createInspectionReport({
    sourceFiles: Array.from({ length: 101 }, (_, index) => `src/module-${String(100 - index).padStart(3, "0")}.ts`),
    compatibility: { packages: [], sites: [] },
    artifacts: { routes: [], runtimeFamilies: [] },
  })
  assert.equal(ready.summary.modules, 101)
  assert.equal(ready.modules.length, 100)
  assert.equal(ready.modules[0].file, "src/module-000.ts")
  assert.equal(ready.modules.at(-1).file, "src/module-099.ts")
  assert.equal(ready.omitted.modules, 1)

  const blocked = createInspectionReport({ diagnostics: Array.from({ length: 51 }, (_, index) => ({
    code: `source.blocker.${String(50 - index).padStart(2, "0")}`,
    stage: "analyze",
    severity: "error",
    message: "Blocked",
    compatibilityClass: null,
    suggestion: null,
    source: { file: `src/${String(50 - index).padStart(2, "0")}.tsx`, start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 2, offset: 1 } },
  })) })
  assert.equal(blocked.blockers.length, 50)
  assert.equal(blocked.blockers[0].source.file, "src/00.tsx")
  assert.equal(blocked.omitted.blockers, 1)
})

test("classifies compatibility sites deterministically from authored source", () => {
  const sources = [{ file: "src/pages/index.tsx", source: [
    'import { Link as RouterLink } from "react-router-dom"',
    'import { useState, useTransition } from "react"',
    'import clsx from "clsx"',
    'import { create } from "zustand"',
    'import { Chart } from "chart.js/auto"',
    'import { useTranslation } from "react-i18next"',
    'import type { ReactNode } from "react"',
    'import { useEffect } from "@kudzujs/core"',
    'import { local } from "../local"'
  ].join("\n") }, { file: "src/z.ts", source: 'import { Row } from "react-bootstrap"' }]
  const report = createCompatibilityReport(sources)

  assert.deepEqual(report.summary, {
    Native: 1,
    Compiled: 1,
    Normalized: 2,
    Adapter: 1,
    "Owned External UI": 1,
    Partial: 1,
    Unsupported: 1
  })
  assert.deepEqual(report.sites.map(site => [site.package, site.imported, site.local, site.classification, site.rule, site.location.line]), [
    ["react-router-dom", "Link", "RouterLink", "Native", "react-router-dom.native", 1],
    ["react", "useState", undefined, "Compiled", "react.compiled", 2],
    ["react", "useTransition", undefined, "Partial", "react.partial", 2],
    ["clsx", "default", "clsx", "Normalized", "clsx.normalized", 3],
    ["zustand", "create", undefined, "Adapter", "zustand.adapter", 4],
    ["chart.js/auto", "Chart", undefined, "Owned External UI", "owned-external-ui", 5],
    ["react-i18next", "useTranslation", undefined, "Unsupported", "react-i18next.unsupported", 6],
    ["react-bootstrap", "Row", undefined, "Normalized", "react-bootstrap.normalized", 1]
  ])
  assert.deepEqual(report.sites[0].location, { line: 1, column: 10, endLine: 1, endColumn: 28 })
  assert.deepEqual(classifyCompatibility("react-i18next", "useTranslation", "import"), { id: "react-i18next.unsupported", classification: "Unsupported" })
  assert.deepEqual(createCompatibilityReport([...sources].reverse()), report)
})

test("keeps package subpaths and import forms inside their actual boundary", () => {
  const report = createCompatibilityReport([{ file: "src/forms.ts", source: [
    'import "chart.js"',
    'import { Link } from "react-router-dom/server"',
    'import { helper } from "unknown-package"',
    'const owned = () => import("typed.js")',
    'const contextual = () => import("another-package")',
    'const invalid = () => import("react")'
  ].join("\n") }])

  assert.deepEqual(report.sites.map(site => [site.package, site.kind, site.classification, site.rule]), [
    ["chart.js", "side-effect-import", "Unsupported", "package.side-effect.unsupported"],
    ["react-router-dom/server", "import", "Partial", "package.contextual"],
    ["unknown-package", "import", "Partial", "package.contextual"],
    ["typed.js", "dynamic-import", "Partial", "package.dynamic.partial"],
    ["another-package", "dynamic-import", "Partial", "package.dynamic.partial"],
    ["react", "dynamic-import", "Partial", "package.dynamic.partial"]
  ])
})

test("repairs parents before the next normalization pass", () => {
  const source = ts.createSourceFile("pass.ts", "", ts.ScriptTarget.Latest, true)
  const result = ts.transform(source, [context => file => applyNormalizationPasses(file, [
    current => context.factory.updateSourceFile(current, [context.factory.createExpressionStatement(context.factory.createIdentifier("value"))]),
    current => {
      assert.equal(current.statements[0].parent, current)
      assert.equal(current.statements[0].expression.parent, current.statements[0])
      return current
    }
  ])])
  result.dispose()
})

test("rejects normalization passes that do not return a SourceFile", () => {
  const source = ts.createSourceFile("pass.ts", "", ts.ScriptTarget.Latest, true)
  assert.throws(() => applyNormalizationPasses(source, [() => source.statements]), /Normalization pass 1 must return a TypeScript SourceFile/)
})

test("returns an explicit JSON-safe source result without writing files", () => {
  const file = resolve("src/pages/source-boundary.tsx")
  const helper = resolve("src/source-boundary-helper.ts")
  const output = resolve(".kudzu/pages/source-boundary.mjs")
  const source = `
import { useState } from "@kudzujs/core"
import { format } from "../source-boundary-helper"
export default function Page() {
  const [count, setCount] = useState(0)
  return <button onClick={async () => { await Promise.resolve(); document.title = format(count); setCount(count + 1) }}>{count}</button>
}
`
  assert.equal(existsSync(output), false)
  const result = compileSource(file, new Set([file, helper]), new Map([[file, source], [helper, "export const format = value => String(value)"]]), new Set(), new Map(), "")

  assert.equal(result.file, "src/pages/source-boundary.tsx")
  assert.equal(result.buildModule.path, ".kudzu/pages/source-boundary.mjs")
  assert.match(result.buildModule.code, /useState\(0, "count"\)/)
  assert.equal(result.handlerModule.path, "handlers/pages/source-boundary.js")
  assert.deepEqual(result.moduleIR.clientModules, ["src/source-boundary-helper.ts"])
  assert.deepEqual(result.handlerModule.clientImports, ["src/source-boundary-helper.ts"])
  assert.deepEqual(result.importedAssets, [])
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result)
  assert.equal(existsSync(output), false)
  assert.match(result.componentAnalysis.owners[0].site, /^owner:\d+:\d+$/)
  assert.match(result.componentAnalysis.owners[0].states[0].site, /^hook:\d+:\d+$/)
  assert.deepEqual(compileSource(file, new Set([file, helper]), new Map([[file, source], [helper, "export const format = value => String(value)"]]), new Set(), new Map(), "").componentAnalysis, result.componentAnalysis)
})

test("preserves TypeScript syntax errors as structured diagnostics", () => {
  const file = resolve("src/pages/syntax.tsx")
  const source = "export default function Page() { return <main> }"
  assert.throws(() => compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), ""), error => {
    assert.equal(error.diagnostics[0].code, "source.syntax.invalid")
    assert.equal(error.diagnostics[0].stage, "analyze")
    assert.equal(error.diagnostics[0].severity, "error")
    assert.equal(error.diagnostics[0].source.file, file)
    assert.match(error.message, /corresponding closing tag/)
    return true
  })
})

test("reports ordinary graph failures at the importer source", () => {
  const page = resolve("src/pages/graph.tsx")
  const helper = resolve("src/graph-helper.ts")
  const sourceFiles = new Set([page, helper])
  const failure = (pageSource, helperSource = "export const value = 1") => {
    try {
      reachableSourceFiles([page], sourceFiles, new Map([[page, pageSource], [helper, helperSource]]))
      assert.fail("Expected graph validation to fail")
    } catch (error) {
      assert.doesNotMatch(error.message, /\.kudzu/)
      return error.message
    }
  }

  assert.match(failure('import "./missing"\nexport default function Page() {}'), /src\/pages\/graph\.tsx:1:\d+ Relative runtime import "\.\/missing" must resolve to one TypeScript file in src\//)
  assert.match(failure('import { value } from "..\/graph-helper"\nexport default function Page() {}', 'import "./missing"\nexport const value = 1'), /src\/graph-helper\.ts:1:\d+ Relative runtime import "\.\/missing" must resolve to one TypeScript file in src\//)
  for (const declaration of ['export { value } from "./missing"', 'export * from "./missing"', 'export { default } from "./missing"']) {
    assert.match(failure('import { value } from "..\/graph-helper"\nexport default function Page() {}', declaration), /src\/graph-helper\.ts:1:\d+ Relative runtime re-export "\.\/missing" must resolve to one TypeScript file in src\//)
  }
  for (const expression of ['import("./graph-helper")', 'import("typescript")', 'import(`./graph-helper`)', "import(path)"]) {
    assert.match(failure(`export default function Page() { return ${expression} }`), /src\/pages\/graph\.tsx:1:\d+ Dynamic import .* is not supported in ordinary source modules/)
  }

  assert.throws(() => reachableSourceFiles([page], sourceFiles, new Map([
    [page, 'import "./missing"\nexport default function Page() {}'],
    [helper, "export const value = 1"],
  ])), error => {
    assert.equal(error.diagnostics[0].code, "source.import.unresolved")
    assert.equal(error.diagnostics[0].stage, "graph")
    assert.equal(error.diagnostics[0].severity, "error")
    assert.equal(error.diagnostics[0].compatibilityClass, null)
    assert.match(error.diagnostics[0].suggestion, /exactly one/)
    assert.equal(error.diagnostics[0].source.start.line, 1)
    return true
  })

  assert.deepEqual(reachableSourceFiles([page], sourceFiles, new Map([
    [page, 'import type { Missing } from "./missing"\nexport default function Page() {}'],
    [helper, 'import "./missing"']
  ])), [page])
})

test("caches canonical modules and clones mutable transformer input", () => {
  const file = resolve("src/cache.tsx")
  const sourceIndex = new Map([[file, "function Row() { return <li /> }\nexport { Row as Item }"]])
  const counters = {}
  const project = createProjectSession(process.cwd(), { counters, sourceIndex })
  const first = project.modules.read(file)

  assert.equal(project.modules.read(file), first)
  assert.equal(first.exports.get("Item").local, "Row")
  assert.deepEqual(counters, { parsedModules: 1, exportSummaries: 1 })

  let left
  let right
  const transformed = ts.transform(ts.createSourceFile("clone.ts", "", ts.ScriptTarget.Latest, true), [context => sourceFile => {
    left = project.modules.clone(file, context.factory, context)
    right = project.modules.clone(file, context.factory, context)
    return sourceFile
  }])
  transformed.dispose()

  assert.notEqual(left, right)
  assert.notEqual(left.statements[0], right.statements[0])
  assert.notEqual(left.statements[0], first.sourceFile.statements[0])
  assert.equal(left.statements[0].parent, left)
  assert.equal(right.statements[0].parent, right)
  assert.equal(first.sourceFile.statements[0].parent, first.sourceFile)
  assert.equal(counters.clonedModules, 2)

  sourceIndex.set(file, "export function Next() { return <li /> }")
  const changed = project.modules.read(file)
  assert.notEqual(changed, first)
  assert.equal(changed.exports.has("Item"), false)
  assert.equal(changed.exports.get("Next").local, "Next")
  assert.deepEqual(counters, { parsedModules: 2, exportSummaries: 2, clonedModules: 2 })

  const isolatedCounters = {}
  const isolated = createProjectSession(process.cwd(), { counters: isolatedCounters, sourceIndex })
  assert.notEqual(isolated.modules.read(file), changed)
  assert.deepEqual(isolatedCounters, { parsedModules: 1, exportSummaries: 1 })
})

test("bounds canonical module records without changing stable symbols", () => {
  const files = Array.from({ length: 1025 }, (_, index) => resolve("src/cache", `module-${index}.ts`))
  const sourceIndex = new Map(files.map((file, index) => [file, `export const Value${index} = ${index}`]))
  const counters = {}
  const project = createProjectSession(process.cwd(), { counters, sourceIndex })
  const first = project.modules.read(files[0])
  const symbol = first.exports.get("Value0").symbol

  for (const file of files.slice(1)) project.modules.read(file)
  const reparsed = project.modules.read(files[0])

  assert.notEqual(reparsed, first)
  assert.deepEqual(reparsed.exports.get("Value0").symbol, symbol)
  assert.equal(ts.isVariableDeclaration(project.modules.declaration(symbol)), true)
  assert.deepEqual(counters, { parsedModules: 1026, exportSummaries: 1026 })
})

test("resolves stable module symbols through aliases, barrels, and export stars", () => {
  const files = {
    component: resolve("src/symbols/Component.tsx"),
    alias: resolve("src/symbols/alias.ts"),
    barrel: resolve("src/symbols/index.ts"),
    page: resolve("src/pages/symbols.tsx")
  }
  const sourceIndex = new Map([
    [files.component, "export default function Row() { return <li /> }\nexport const Label = () => <span />"],
    [files.alias, 'export { default as Item } from "./Component"'],
    [files.barrel, 'export * from "./alias"\nexport { Label as Text } from "./Component"'],
    [files.page, 'import { Item as Row, Text } from "../symbols"\nexport default function Page() { return <><Row /><Text /></> }']
  ])
  const sourceFiles = new Set(sourceIndex.keys())
  const first = createProjectSession(process.cwd(), { sourceIndex })
  const item = first.modules.resolveExport(files.barrel, "Item", sourceFiles)
  const text = first.modules.resolveExport(files.barrel, "Text", sourceFiles)
  const pageImport = first.modules.read(files.page).imports.get("Row")

  assert.deepEqual(item, {
    id: `src/symbols/Component.tsx#${item.site}`,
    module: "src/symbols/Component.tsx",
    site: item.site,
    name: "Row"
  })
  assert.equal(text.name, "Label")
  assert.equal(first.modules.resolveExport(files.component, "Row", sourceFiles), undefined)
  assert.match(item.site, /^declaration:\d+:\d+$/)
  assert.deepEqual(pageImport, { kind: "named", imported: "Item", specifier: "../symbols", site: pageImport.site })
  assert.match(pageImport.site, /^import:\d+:\d+$/)
  assert.equal(ts.isFunctionDeclaration(first.modules.declaration(item)), true)

  const second = createProjectSession(process.cwd(), { sourceIndex })
  assert.deepEqual(second.modules.resolveExport(files.barrel, "Item", sourceFiles), item)
  assert.deepEqual(second.modules.read(files.page).imports.get("Row"), pageImport)

  sourceIndex.set(files.component, `\n${sourceIndex.get(files.component)}`)
  assert.notEqual(first.modules.resolveExport(files.barrel, "Item", sourceFiles).id, item.id)
})

test("reports deterministic export-star ambiguity and re-export cycles", () => {
  const left = resolve("src/symbol-errors/left.ts")
  const right = resolve("src/symbol-errors/right.ts")
  const barrel = resolve("src/symbol-errors/index.ts")
  const cycleA = resolve("src/symbol-errors/cycle-a.ts")
  const cycleB = resolve("src/symbol-errors/cycle-b.ts")
  const sourceIndex = new Map([
    [left, "export const Item = () => null"],
    [right, "export const Item = () => null"],
    [barrel, 'export * from "./left"\nexport * from "./right"'],
    [cycleA, 'export { Item } from "./cycle-b"'],
    [cycleB, 'export { Item } from "./cycle-a"']
  ])
  const sourceFiles = new Set(sourceIndex.keys())
  const project = createProjectSession(process.cwd(), { sourceIndex })

  assert.throws(() => project.modules.resolveExport(barrel, "Item", sourceFiles), /src\/symbol-errors\/index\.ts has an ambiguous export named "Item"/)
  assert.throws(() => project.modules.resolveExport(cycleA, "Item", sourceFiles), /Imported keyed list component re-export cycle: src\/symbol-errors\/cycle-a\.ts -> src\/symbol-errors\/cycle-b\.ts -> src\/symbol-errors\/cycle-a\.ts/)
})

test("parses shared modules once for one hundred importers", () => {
  const sourceDirectory = resolve("src")
  const pages = Array.from({ length: 100 }, (_, index) => resolve(sourceDirectory, "pages", `cache-${index}.tsx`))
  const barrel = resolve(sourceDirectory, "components", "index.tsx")
  const shared = resolve(sourceDirectory, "components", "Shared.tsx")
  const helper = resolve(sourceDirectory, "helper.ts")
  const sourceIndex = new Map([
    [barrel, 'export * from "./Shared"'],
    [shared, `
import { format } from "../helper"
export function Shared({ item }) {
  return <li><button onClick={() => { document.title = format(item.id) }}>{item.id}</button></li>
}
`],
    [helper, "export const format = value => String(value)"]
  ])
  for (const [index, page] of pages.entries()) sourceIndex.set(page, `
import { Shared } from "../components"
import { useState } from "@kudzujs/core"
export default function Page() {
  const [items, setItems] = useState([{ id: ${index} }])
  return <><button onClick={() => setItems([...items])}>Refresh</button><ul>{items.map(item => <Shared key={item.id} item={item} />)}</ul></>
}
`)
  const counters = {}
  const project = createProjectSession(process.cwd(), { counters, sourceIndex })
  const compiler = createSourceCompiler(project)
  const allFiles = new Set(sourceIndex.keys())
  const reachable = compiler.reachableSourceFiles(pages, allFiles, sourceIndex)
  for (const file of reachable) compiler.compileSource(file, new Set(reachable), sourceIndex, new Set(), new Map(), "")

  assert.equal(reachable.length, 103)
  assert.deepEqual(counters, { parsedModules: 103, exportSummaries: 103, plainModules: 1, clonedModules: 100 })
})

test("normalizes render control flow without changing lowercase helpers", () => {
  const source = ts.createSourceFile("pass.tsx", `
function Component(ready) {
  if (!ready) return <p>wait</p>
  return <main>ready</main>
}
const Assigned = ready => {
  let view
  if (ready) view = <main />
  else view = <p />
  return view
}
function helper(ready) {
  if (!ready) return "wait"
  return "ready"
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const result = ts.transform(source, [context => file => applyNormalizationPasses(file, [
    current => normalizeRenderControlFlow(current, context.factory, context)
  ])])
  const output = ts.createPrinter().printFile(result.transformed[0])
  const assertParentPointers = node => ts.forEachChild(node, child => {
    assert.equal(child.parent, node)
    assertParentPointers(child)
  })
  assertParentPointers(result.transformed[0])
  result.dispose()

  assert.match(output, /function Component\(ready\) \{\s*return !ready \? <p>wait<\/p> : <main>ready<\/main>;\s*\}/)
  assert.match(output, /const Assigned = ready => \{\s*const view = ready \? <main \/> : <p \/>;\s*return view;\s*\}/)
  assert.match(output, /function helper\(ready\) \{\s*if \(!ready\)\s*return "wait";\s*return "ready";\s*\}/)
})

test("analyzes and normalizes Zustand stores through one compiler pass", () => {
  const source = ts.createSourceFile("/project/src/store.ts", `
import { create } from "zustand"
export const useCount = create(set => ({ count: 0, increment: () => set({ count: 1 }) }))
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const pass = createZustandPass({
    isSerializableStateLiteral: ts.isNumericLiteral,
    nativeCaptureNames: () => new Set(),
    sourceDirectory: "/project/src"
  })
  const result = ts.transform(source, [context => file => normalize(context, file)])
  const output = ts.createPrinter().printFile(result.transformed[0])
  result.dispose()

  const shared = pass.analyzeZustandStores(source).get("useCount")
  assert.deepEqual({ identity: shared.identity, field: shared.field, initialValue: shared.initialData, actions: [...shared.actions.keys()], sourceKind: shared.sourceKind }, {
    identity: "store.ts#useCount",
    field: "count",
    initialValue: 0,
    actions: ["increment"],
    sourceKind: "Zustand"
  })
  assert.doesNotMatch(output, /from "zustand"/)
  assert.match(output, /__kCreateSharedState\("store.ts#useCount", "count", 0, \["increment"\], "Zustand"\)/)

  function normalize(context, file) {
    return pass.normalizeZustandMigrationSyntax(file, context.factory, context)
  }
})

test("specializes exact command forms to plain data", () => {
  const specialize = createCommandSpecializer({
    isPrimitiveLiteral: node => ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isPrefixUnaryExpression(node) || [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind)
  })
  const setters = new Map([["setCount", "count"]])
  const command = source => specialize(ts.createSourceFile("command.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS).statements[0].expression, setters)

  assert.deepEqual(command("setCount(count + 1)"), { operation: "add", state: "count", value: 1 })
  assert.deepEqual(command("setCount(count - 2)"), { operation: "add", state: "count", value: -2 })
  assert.deepEqual(command("setCount(value => value + 3)"), { operation: "add", state: "count", value: 3 })
  assert.deepEqual(command("setCount(-4)"), { operation: "set", state: "count", value: -4 })
  assert.deepEqual(command("setCount(+5)"), { operation: "set", state: "count", value: 5, syntax: "positive" })
  assert.deepEqual(command("setCount(-0)"), { operation: "set", state: "count", value: 0, syntax: "negative" })
  assert.deepEqual(command("setCount(count - 0)"), { operation: "add", state: "count", value: 0, syntax: "negative" })
  assert.deepEqual(command("setCount(value => value - 0)"), { operation: "add", state: "count", value: 0, syntax: "negative" })
  assert.deepEqual(command("setCount(!count)"), { operation: "toggle", state: "count", value: false })
  assert.deepEqual(command("setCount(value => !value)"), { operation: "toggle", state: "count", value: false })
  assert.deepEqual(command("setCount(\"ready\")"), { operation: "set", state: "count", value: "ready" })
  assert.deepEqual(command("console.log(\"count\", count)"), { operation: "log", state: "count", value: "count" })
  assert.equal(command("setCount(count * 2)"), undefined)
  assert.equal(command("setCount(1e309)"), undefined)
  assertJsonData(command("setCount(count + 1)"))
})

test("lowers equivalent state operations to identical command semantics", () => {
  const file = resolve("src/pages/semantic-state.tsx")
  const source = `
import { useState } from "@kudzujs/core"
export default function Page() {
  const [count, setCount] = useState(0)
  return <>
    <button onClick={() => setCount(count + 1)}>Direct</button>
    <button onClick={() => { const next = count + 1; setCount(next) }}>Alias</button>
    <button onClick={() => { const increment = () => setCount(count + 1); increment() }}>Arrow</button>
    <button onClick={() => { function increment(value) { setCount(value + 1) }; increment(count) }}>Function</button>
  </>
}
`
  const result = compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), "")

  assert.equal(result.handlerModule, undefined)
  assert.equal(result.moduleIR.handlers.length, 4)
  assert.deepEqual(result.moduleIR.handlers.map(handler => handler.kind), ["commands", "commands", "commands", "commands"])
  assert.deepEqual(result.moduleIR.handlers.map(handler => handler.commands), Array.from({ length: 4 }, () => [{ operation: "add", signal: 0, value: 1 }]))
  assert.deepEqual(result.moduleIR.signals, [{ slot: 0, reference: { kind: "state", owner: { kind: "component", slot: 0 }, slot: 0 }, debugName: "count" }])
  assert.equal((result.buildModule.code.match(/__kBehavior\(/g) ?? []).length, 4)
  assert.doesNotMatch(result.buildModule.code, /__kNativeBehavior/)
  assert.deepEqual(JSON.parse(JSON.stringify(result.moduleIR)), result.moduleIR)
})

test("rejects unsafe semantic state operation helpers with source diagnostics", () => {
  const file = resolve("src/pages/semantic-state-invalid.tsx")
  const failure = handler => {
    const source = `
import { useState } from "@kudzujs/core"
export default function Page() {
  const [count, setCount] = useState(0)
  return <button onClick={() => { ${handler} }}>Update</button>
}
`
    try {
      compileSource(file, new Set([file]), new Map([[file, source]]), new Set(), new Map(), "")
      assert.fail("Expected semantic state operation compilation to fail")
    } catch (error) {
      assert.match(error.message, /src\/pages\/semantic-state-invalid\.tsx:\d+:\d+/)
      assert.doesNotMatch(error.message, /\.kudzu/)
      return error.message
    }
  }

  assert.match(failure("function increment(value) { setCount(value + 1); increment(value) }; increment(count)"), /cannot be recursive/)
  assert.match(failure("const increment = () => setCount(count + 1); const escaped = increment; escaped()"), /cannot escape/)
  assert.match(failure("let next = count + 1; next++; setCount(next)"), /must remain immutable/)
  assert.match(failure("const increment = () => setCount(count + 1); increment?.()"), /do not support dynamic dispatch/)
  assert.match(failure("const actions = { increment: () => setCount(count + 1) }; actions[name]()"), /do not support dynamic dispatch/)
})

test("registers JSON-safe command ModuleIR with deterministic slots", () => {
  const moduleIR = createModuleIR("src/pages/counter.tsx")
  const reference = (owner, slot) => ({ kind: "state", owner: { kind: "component", slot: owner }, slot })
  registerCommandHandler(moduleIR, [{ operation: "add", state: "total", reference: reference(0, 0), value: 1 }], { file: "src/pages/counter.tsx", start: 20, end: 45 })
  registerCommandHandler(moduleIR, [{ operation: "set", state: "count", reference: reference(0, 1), value: -2 }], { file: "src/pages/counter.tsx", start: 50, end: 74 })
  registerCommandHandler(moduleIR, [{ operation: "set", state: "count", reference: reference(1, 0), value: 3 }])

  assert.deepEqual(moduleIR, {
    version: 2,
    file: "src/pages/counter.tsx",
    symbols: [],
    sharedStates: [],
    sharedActions: [],
    signals: [
      { slot: 0, reference: reference(0, 0), debugName: "total" },
      { slot: 1, reference: reference(0, 1), debugName: "count" },
      { slot: 2, reference: reference(1, 0), debugName: "count" }
    ],
    handlers: [
      { slot: 0, kind: "commands", commands: [{ operation: "add", signal: 0, value: 1 }], source: { file: "src/pages/counter.tsx", start: 20, end: 45 } },
      { slot: 1, kind: "commands", commands: [{ operation: "set", signal: 1, value: -2 }], source: { file: "src/pages/counter.tsx", start: 50, end: 74 } },
      { slot: 2, kind: "commands", commands: [{ operation: "set", signal: 2, value: 3 }] }
    ],
    bindings: [],
    derived: [],
    effects: [],
    keyedBlocks: [],
    imports: [],
    clientModules: []
  })
  assertJsonData(moduleIR)
  assert.deepEqual(JSON.parse(JSON.stringify(moduleIR)), moduleIR)
})

test("registers JSON-safe keyed ownership with deterministic parent slots", () => {
  const moduleIR = createModuleIR("src/pages/list.tsx")
  const parent = registerKeyedBlock(moduleIR, { children: [], collection: { kind: "signal", name: "items" }, key: "id", item: "item", indexed: false, static: false, selectorStates: [], rowStates: [], rowRefs: [] })
  const child = registerKeyedBlock(moduleIR, { parent: parent.slot, children: [], collection: { kind: "signal", name: "items" }, key: null, ownerField: "children", item: "child", index: "index", indexed: true, static: false, selectorStates: [], rowStates: [{ name: "open", setter: "setOpen", owner: "specialization:0" }], rowRefs: [{ name: "button" }] })
  parent.children.push(child.slot)

  assert.deepEqual(moduleIR.keyedBlocks, [
    { slot: 0, children: [1], collection: { kind: "signal", name: "items" }, key: "id", item: "item", indexed: false, static: false, selectorStates: [], rowStates: [], rowRefs: [] },
    { slot: 1, parent: 0, children: [], collection: { kind: "signal", name: "items" }, key: null, ownerField: "children", item: "child", index: "index", indexed: true, static: false, selectorStates: [], rowStates: [{ name: "open", setter: "setOpen", owner: "specialization:0" }], rowRefs: [{ name: "button" }] }
  ])
  assertJsonData(moduleIR)
  assert.deepEqual(JSON.parse(JSON.stringify(moduleIR)), moduleIR)
})

test("registers JSON-safe effect ownership with handler and Worker edges", () => {
  const moduleIR = createModuleIR("src/pages/effect.tsx")
  registerEffect(moduleIR, {
    setup: { handler: 2 },
    cleanup: true,
    dependencies: [{ kind: "signal", name: "count" }, { kind: "derived", derived: 0, sources: ["count"] }],
    subscriptions: ["count", "count"],
    dependencyStates: ["count"],
    itemDependencies: ["label"],
    ownership: { kind: "keyed", keyedBlock: 1, component: { name: "Row", source: { file: "src/Row.tsx", start: 10, end: 80 } } },
    workers: [{ root: "workers/task.worker.ts", placeholder: "/__kudzu_worker_0123456789abcdef__.js", source: { file: "src/pages/effect.tsx", start: 90, end: 140 } }],
    source: { file: "src/pages/effect.tsx", start: 40, end: 160 }
  })

  assert.equal(moduleIR.effects[0].slot, 0)
  assert.equal(moduleIR.effects[0].setup.handler, 2)
  assert.equal(moduleIR.effects[0].ownership.keyedBlock, 1)
  assert.equal(moduleIR.effects[0].workers[0].root, "workers/task.worker.ts")
  assertJsonData(moduleIR)
  assert.deepEqual(JSON.parse(JSON.stringify(moduleIR)), moduleIR)
})

test("rejects dangling ModuleIR slot references", () => {
  const moduleIR = createModuleIR("src/pages/broken.tsx")
  moduleIR.handlers.push({ slot: 0, kind: "commands", commands: [{ operation: "set", signal: 0, value: 1 }] })
  assert.throws(() => assertModuleIRReferences(moduleIR), /HandlerIR 0 command 0 references missing SignalIR slot 0/)
})

test("registers package-neutral shared state and action IR", () => {
  const moduleIR = createModuleIR("src/pages/shared.tsx")
  const state = registerSharedState(moduleIR, { identity: "store.ts#useCart", field: "quantities", initialValue: {} })
  const action = registerSharedAction(moduleIR, { state: state.slot, name: "add" })
  moduleIR.signals.push({ slot: 0, reference: { kind: "shared-state", sharedState: state.slot }, debugName: "quantities" })
  moduleIR.handlers.push({ slot: 0, kind: "module-export", role: "native", exportName: "handler0", signals: [{ signal: 0 }], actions: [action.slot], captures: [], imports: [], code: "" })

  assert.deepEqual(assertModuleIRReferences(JSON.parse(JSON.stringify(moduleIR))), moduleIR)
  assert.doesNotMatch(JSON.stringify({ sharedStates: moduleIR.sharedStates, sharedActions: moduleIR.sharedActions }), /zustand|store-action|__kCreateStore/i)
  const broken = JSON.parse(JSON.stringify(moduleIR))
  broken.sharedActions[0].state = 1
  assert.throws(() => assertModuleIRReferences(broken), /SharedActionIR 0 references missing SharedStateIR slot 1/)
  const brokenHandler = JSON.parse(JSON.stringify(moduleIR))
  brokenHandler.handlers[0].actions[0] = 1
  assert.throws(() => assertModuleIRReferences(brokenHandler), /HandlerIR 0 action 0 references missing SharedActionIR slot 1/)
})

test("validates ModuleIR v2 structural references after JSON round-tripping", () => {
  const analysis = createComponentAnalysis("src/pages/valid.tsx")
  const components = createComponentAnalysisSession(analysis)
  const page = {}
  components.registerOwner(page, { name: "Page" })
  components.registerState(page, { name: "count", setter: "setCount", kind: "state" })
  components.registerSpecialization({ kind: "Keyed list", owner: { kind: "component", slot: 0 }, props: [{ name: "value", local: "value", provided: true, signals: [0], properties: [{ signal: 0, path: ["items"], consumers: ["effect", "list"], equality: "object-is" }] }], refs: [{ name: "button", kind: "row" }] })
  const valid = () => ({
    version: 2,
    file: "src/pages/valid.tsx",
    symbols: [{ slot: 0, debugName: "items", declarationKind: "const" }],
    sharedStates: [],
    sharedActions: [],
    signals: [{ slot: 0, reference: { kind: "state", owner: { kind: "component", slot: 0 }, slot: 0 }, debugName: "count" }],
    handlers: [{ slot: 0, kind: "module-export", role: "effect", exportName: "effect0", signals: [{ signal: 0 }], captures: [{ symbol: 0 }], imports: [], code: "" }],
    bindings: [{ slot: 0, kind: "module-export", role: "binding", exportName: "binding0", signals: [0], captures: [{ symbol: 0 }], imports: [], code: "" }],
    derived: [{ slot: 0, kind: "expression", expression: ["state", "count"], signals: [0] }],
    effects: [{ slot: 0, setup: { handler: 0 }, dependencies: [{ kind: "derived", derived: 0, sources: [0] }], subscriptions: [0], dependencySignals: [0], ownership: { owner: { kind: "component", slot: 0 } } }],
    keyedBlocks: [
      { slot: 0, children: [1], collection: { kind: "static" }, selectorSignals: [], specializations: [], rowStates: [], rowRefs: [] },
      { slot: 1, parent: 0, children: [], collection: { kind: "symbol", symbol: 0 }, selector: 0, selectorSignals: [0], specializations: [0], rowStates: [{ signal: 0 }], rowRefs: [{ specialization: 0, ref: 0 }] }
    ],
    imports: [],
    clientModules: []
  })

  assert.deepEqual(assertModuleIRReferences(JSON.parse(JSON.stringify(valid())), analysis), valid())
  const dynamic = valid()
  dynamic.imports.push({ slot: 0, target: "@codemirror/view", kind: "dynamic", local: "@codemirror/view", package: true })
  dynamic.handlers[0].imports.push(0)
  assert.deepEqual(assertModuleIRReferences(JSON.parse(JSON.stringify(dynamic)), analysis), dynamic)
  const dynamicBinding = JSON.parse(JSON.stringify(dynamic))
  dynamicBinding.bindings[0].imports.push(0)
  assert.throws(() => assertModuleIRReferences(dynamicBinding, analysis), /BindingIR 0 cannot reference a dynamic import/)
  const invalidDynamicTarget = JSON.parse(JSON.stringify(dynamic))
  invalidDynamicTarget.imports[0].target = "../editor"
  assert.throws(() => assertModuleIRReferences(invalidDynamicTarget, analysis), /ImportIR 0 has an invalid dynamic package target/)
  assert.throws(() => assertModuleIRReferences({ ...valid(), version: 1 }, analysis), /Unsupported ModuleIR version/)
  const invalidPropertySignal = JSON.parse(JSON.stringify(analysis))
  invalidPropertySignal.specializations[0].props[0].properties[0].signal = 1
  assert.throws(() => assertModuleIRReferences(valid(), invalidPropertySignal), /property references missing SignalIR slot 1/)
  const invalidPropertyPath = JSON.parse(JSON.stringify(analysis))
  invalidPropertyPath.specializations[0].props[0].properties[0].path = ["__proto__"]
  assert.throws(() => assertModuleIRReferences(valid(), invalidPropertyPath), /invalid property link/)
  const missingSignal = valid()
  missingSignal.bindings[0].signals[0] = 4
  assert.throws(() => assertModuleIRReferences(missingSignal, analysis), /BindingIR 0 signal 0 references missing SignalIR slot 4/)
  const duplicateExport = valid()
  duplicateExport.bindings[0].exportName = "effect0"
  assert.throws(() => assertModuleIRReferences(duplicateExport, analysis), /export "effect0" is declared by both/)
  const calculation = valid()
  calculation.derived[0] = { slot: 0, kind: "calculation", calculation: { binding: 0, fields: ["id"] }, signals: [0] }
  calculation.effects[0].dependencies[0] = { kind: "derived", derived: 0, sources: [0], field: "id", evaluator: 0 }
  assert.deepEqual(assertModuleIRReferences(JSON.parse(JSON.stringify(calculation)), analysis), calculation)
  const brokenEvaluator = JSON.parse(JSON.stringify(calculation))
  brokenEvaluator.effects[0].dependencies[0].evaluator = 1
  assert.throws(() => assertModuleIRReferences(brokenEvaluator, analysis), /must use its calculation evaluator/)
  const brokenField = JSON.parse(JSON.stringify(calculation))
  brokenField.effects[0].dependencies[0].field = "price"
  assert.throws(() => assertModuleIRReferences(brokenField, analysis), /unknown calculation field "price"/)
  const brokenParent = valid()
  brokenParent.keyedBlocks[0].children = []
  assert.throws(() => assertModuleIRReferences(brokenParent, analysis), /does not reciprocally list child 1/)
  const cycle = valid()
  cycle.keyedBlocks[0].parent = 1
  cycle.keyedBlocks[1].children = [0]
  assert.throws(() => assertModuleIRReferences(cycle, analysis), /parent cycle/)
})

test("classifies mixed signal and derived effect dependencies without deriving signals", () => {
  const source = ts.createSourceFile("effect.tsx", `
function Page() {
  const parity = count % 2 ? "odd" : "even"
  useEffect(() => {}, [page, parity])
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const component = source.statements[0]
  const declaration = component.body.statements[0].declarationList.declarations[0]
  const call = component.body.statements[1].expression
  const result = analyzeEffectDependencies({
    dependencies: call.arguments[1],
    node: call,
    listEffect: false,
    setters: new Map([["setCount", "count"], ["setPage", "page"]]),
    localDeclarations: new Map([["parity", [{ initializer: declaration.initializer }]]]),
    factory: ts.factory,
    fail(node, message) { throw new Error(message) }
  })

  assert.equal(result.hasDerived, true)
  assert.deepEqual(result.entries.map(entry => [entry.kind, entry.name]), [["signal", "page"], ["derived", "parity"]])
  assert.equal(Object.hasOwn(result.entries[0], "expression"), false)
  assert.deepEqual(result.subscriptions.map(entry => entry.text), ["page", "count"])
})

test("classifies ordinary object property effect dependencies as derived", () => {
  const source = ts.createSourceFile("effect.tsx", `
function Page() {
  useEffect(() => {}, [profile.name])
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const call = source.statements[0].body.statements[0].expression
  const result = analyzeEffectDependencies({
    dependencies: call.arguments[1],
    node: call,
    listEffect: false,
    setters: new Map([["setProfile", "profile"]]),
    factory: ts.factory,
    fail(node, message) { throw new Error(message) }
  })

  assert.equal(result.hasDerived, true)
  assert.deepEqual(result.entries.map(entry => [entry.kind, entry.expression, [...entry.states]]), [["derived", ["get", ["state", "profile"], "name", false], ["profile"]]])
  assert.deepEqual(result.subscriptions.map(entry => entry.text), ["profile"])
})

test("rejects mixed whole-object and property effect dependencies", () => {
  const source = ts.createSourceFile("effect.tsx", "function Page() { useEffect(() => {}, [profile, profile.name]) }", ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const call = source.statements[0].body.statements[0].expression
  assert.throws(() => analyzeEffectDependencies({
    dependencies: call.arguments[1],
    node: call,
    listEffect: false,
    setters: new Map([["setProfile", "profile"]]),
    factory: ts.factory,
    fail(node, message) { throw new Error(message) }
  }), /cannot mix whole-object and property dependencies for state "profile"/)
})

test("rejects unsafe selected imported calculation effect dependencies", () => {
  const page = resolve("test/fixtures/derived-effect-boundary/src/pages/index.tsx")
  const derive = resolve("test/fixtures/derived-effect-boundary/src/derive.ts")
  const catalog = resolve("test/fixtures/derived-effect-boundary/src/catalog.ts")
  const baseHelper = `
import { variants } from "./catalog"
export function derive(color: string, size: string) {
  const selected = variants.find(variant => variant.color === color && variant.size === size)
  return { id: selected?.id ?? "", price: selected?.price ?? "", available: selected?.available ?? false }
}`
  const baseCatalog = `export const variants = [{ id: "black-m", color: "Black", size: "M", price: "20", available: true }] as const`
  const failure = ({ helper = baseHelper, dependency = "selected.id", call = "derive(color, size)", catalogSource = baseCatalog }) => {
    const pageSource = `
import { useEffect, useState } from "react"
import { derive } from "../derive"
export default function Page() {
  const [color, setColor] = useState("Black")
  const [size, setSize] = useState("M")
  const selected = ${call}
  const field = "id"
  useEffect(() => { document.body.dataset.selected = selected.id }, [${dependency}])
  return <button onClick={() => { setColor("Black"); setSize("M") }}>{selected.price}</button>
    }`
    const sourceIndex = new Map([[page, pageSource], [derive, helper], [catalog, catalogSource]])
    try {
      compileSource(page, new Set(sourceIndex.keys()), sourceIndex, new Set(), new Map(), "")
    } catch (error) {
      assert.match(error.message, /src\/(?:pages\/index\.tsx|derive\.ts)/)
      return error.message
    }
    assert.fail("Expected selected calculation compilation to fail")
  }

  assert.match(failure({ dependency: "selected[field]" }), /computed result properties are not supported/)
  assert.match(failure({ dependency: "selected" }), /cannot depend on the whole imported calculation result "selected"/)
  assert.match(failure({ call: "derive(color.toLowerCase(), size)" }), /arguments must be direct primitive state identifiers/)
  assert.match(failure({ helper: baseHelper.replace("const selected =", "variants.sort(); const selected =") }), /mutating method "sort" is not supported/)
  assert.match(failure({ helper: baseHelper.replace("const selected =", "const first = second; const second = first; const selected =") }), /derived-local cycle: first -> second -> first/)
  assert.match(failure({ helper: baseHelper.replace('selected?.id ?? ""', 'String(Math.random())') }), /must be deterministic; call "Math.random" is not supported/)
  assert.match(failure({ helper: baseHelper.replace('import { variants } from "./catalog"', 'import { variants, metadata } from "./catalog"').replace('selected?.id ?? ""', "metadata.id"), catalogSource: `${baseCatalog}\nexport const metadata = { id: "opaque" } as const` }), /capture "metadata" is opaque or nonserializable/)
  assert.match(failure({ helper: `import { pick } from "example-package"\nexport function derive(color: string, size: string) { return { id: pick(color), price: size, available: true } }` }), /cannot reference package import "pick" from "example-package"/)
  assert.match(failure({ helper: `export function derive(color: string, size: string) { if (color) return { id: color, price: size, available: true }; return { id: size, available: false } }` }), /same direct plain-object fields on every path/)
  assert.match(failure({ helper: `export function derive(color: string, size: string) { if (color) return { id: color, price: size, available: true } }` }), /must end with an unconditional return/)
  assert.match(failure({ helper: `export async function derive(color: string, size: string) { return { id: color, price: size, available: true } }` }), /must be synchronous functions/)
})

test("generates the existing command behavior AST from HandlerIR", () => {
  const source = ts.createSourceFile("counter.tsx", "setCount(count + 1)", ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const specialize = createCommandSpecializer({ isPrimitiveLiteral: () => false })
  const moduleIR = createModuleIR("src/pages/counter.tsx")
  const command = specialize(source.statements[0].expression, new Map([["setCount", "count"]]))
  const handler = registerCommandHandler(moduleIR, [command], { file: "src/pages/counter.tsx", start: 0, end: 19 }, "component:0")
  const output = ts.createPrinter().printNode(ts.EmitHint.Expression, generateCommandBehavior(moduleIR, handler), source)

  assert.equal(output, `__kBehavior([["add", count, 1]])`)

  const signed = registerCommandHandler(moduleIR, [
    { operation: "set", state: "count", value: 5, syntax: "positive" },
    { operation: "add", state: "count", value: 0, syntax: "negative" }
  ], undefined, "component:0")
  assert.equal(ts.createPrinter().printNode(ts.EmitHint.Expression, generateCommandBehavior(moduleIR, signed), source), `__kBehavior([["set", count, +5], ["add", count, -0]])`)
})

test("keys command signals by explicit state owner", () => {
  const source = ts.createSourceFile("owners.ts", `
const first = () => setCount(count + 1)
const second = () => setCount(count + 1)
const independent = () => setCount(count + 1)
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact("owners.ts")
  const handlers = source.statements.map(statement => statement.declarationList.declarations[0].initializer)
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/handlers.js",
      factory: context.factory,
      context,
      bindingIndex: createBindingIndex(file),
      compileEventCommand: createCommandSpecializer({ isPrimitiveLiteral: () => false }),
      isPrimitiveLiteral: () => false,
      rejectWorkerConstructions: () => {}
    })
    const shared = new Map([["setCount", "count"]])
    const first = new Map([["count", { kind: "module-symbol", symbol: { id: "owners.ts#first", module: "owners.ts", site: "first", name: "count" } }]])
    const second = new Map([["count", { kind: "module-symbol", symbol: { id: "owners.ts#second", module: "owners.ts", site: "second", name: "count" } }]])
    session.compileEvent(handlers[0], { setters: shared, stateOwners: first, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    session.compileEvent(handlers[1], { setters: shared, stateOwners: first, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    session.compileEvent(handlers[2], { setters: new Map(shared), stateOwners: second, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    return file
  }])
  result.dispose()

  assert.deepEqual(semantic.moduleIR.signals, [
    { slot: 0, reference: { kind: "module-symbol", symbol: { id: "owners.ts#first", module: "owners.ts", site: "first", name: "count" } }, debugName: "count" },
    { slot: 1, reference: { kind: "module-symbol", symbol: { id: "owners.ts#second", module: "owners.ts", site: "second", name: "count" } }, debugName: "count" }
  ])
  assert.deepEqual(semantic.moduleIR.handlers.map(handler => handler.commands[0].signal), [0, 0, 1])
})

test("records JSON-safe component ownership and specialization results", () => {
  const analysis = createComponentAnalysis("src/pages/index.tsx")
  const session = createComponentAnalysisSession(analysis)
  const page = {}
  const child = {}
  session.registerOwner(page, { kind: "component", name: "Page", props: [], source: { file: "src/pages/index.tsx", start: 10, end: 100 } })
  session.registerState(page, { name: "count", setter: "setCount", kind: "state", source: { file: "src/pages/index.tsx", start: 25, end: 55 } })
  session.registerState(page, { name: "count", setter: "dispatch", kind: "reducer" })
  session.registerRef(page, { name: "buttonRef" })
  session.registerId(page, { name: "labelId" })
  session.registerOwner(child, { kind: "specialized", name: "KSetterComponent50", props: [] })
  session.registerState(child, { name: "value", setter: "setValue", kind: "component" })
  session.registerSpecialization({ kind: "Setter-callback", owner: { kind: "component", slot: 0 }, props: [{ name: "onChange", local: "onChange", provided: true }], states: [{ name: "value", setter: "setValue", kind: "component" }], refs: [{ name: "inputRef", kind: "component" }], ids: [{ name: "inputId" }] })

  assert.deepEqual(analysis.owners.map(owner => [owner.slot, owner.name, owner.states.map(state => state.name), owner.setters.map(setter => [setter.name, setter.signal]), owner.refs.map(ref => ref.name), owner.ids.map(id => id.name)]), [
    [0, "Page", ["count"], [["setCount", 0], ["dispatch", 0]], ["buttonRef"], ["labelId"]],
    [1, "KSetterComponent50", ["value"], [["setValue", 0]], [], []]
  ])
  assert.deepEqual(analysis.specializations[0].owner, { kind: "component", slot: 0 })
  assertJsonData(analysis)
  assert.deepEqual(JSON.parse(JSON.stringify(analysis)), analysis)
})

test("registers deterministic per-source handler, binding, and list descriptors", () => {
  const source = ts.createSourceFile("descriptors.ts", `
import { format } from "./format"
const binding = format(count + extra)
const handler = () => setCount(count + delta)
const row = item.label
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact("descriptors.ts")
  const [binding, handler, row] = source.statements.slice(1).map(statement => statement.declarationList.declarations[0].initializer)
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/assets/handlers/descriptors.js",
      factory: context.factory,
      context,
      bindingIndex: createBindingIndex(file),
      compileEventCommand: () => undefined,
      handlerLowering,
      isPrimitiveLiteral: node => ts.isStringLiteral(node) || ts.isNumericLiteral(node),
      stateReferences: () => new Map([["count", { kind: "module-symbol", symbol: { id: "descriptors.ts#count", module: "descriptors.ts", site: "count", name: "count" } }]]),
      rejectWorkerConstructions: () => {}
    })
    const setters = new Map([["setCount", "count"]])
    session.compileReactiveBinding(binding, {
      setters,
      importBindings: new Map([["format", { kind: "named", imported: "format", local: "format", target: "/src/format.ts" }]])
    })
    session.compileReactiveBinding(binding, { setters })
    session.compileEvent(handler, { setters, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    session.compileEffectCallback(handler, { setters, reducers: new Map(), importBindings: new Map() })
    session.compileListValue(row, { item: "item" })
    session.registerDerived("expression", ["binary", "+", ["state", "count"], ["value", 1]], ["count"], binding)
    session.registerDerived("selector", [["slice", ["value", 0], undefined]], ["count"], row)
    session.finalize()
    return file
  }])
  result.dispose()

  assert.deepEqual(semantic.moduleIR.handlers.map(({ exportName, role }) => [exportName, role]), [["handler0", "native"], ["effect0", "effect"]])
  assert.deepEqual(semantic.moduleIR.bindings.map(({ exportName, role }) => [exportName, role]), [["binding0", "binding"], ["binding1", "binding"], ["listExpression0", "list-expression"]])
  assert.deepEqual(semantic.moduleIR.bindings[0].signals, [0])
  assert.deepEqual(semantic.moduleIR.bindings[0].captures, [{ symbol: 5, name: "extra", source: "scope" }])
  assert.deepEqual(semantic.moduleIR.clientModules, ["/src/format.ts"])
  assert.deepEqual(semantic.moduleIR.handlers[0].signals, [{ signal: 0, name: "count", setters: ["setCount"], value: "direct", snapshot: false }])
  assert.deepEqual(semantic.moduleIR.handlers[0].captures, [{ symbol: 7, name: "delta", source: "scope", value: "direct", snapshot: false }])
  assert.deepEqual(semantic.moduleIR.imports, [{ slot: 0, target: "/src/format.ts", kind: "named", local: "format", imported: "format", package: false }])
  assert.deepEqual(semantic.moduleIR.derived.map(({ slot, kind, signals, expression, selector }) => ({ slot, kind, signals, expression, selector })), [
    { slot: 0, kind: "expression", signals: [0], expression: ["binary", "+", ["state", "count"], ["value", 1]], selector: undefined },
    { slot: 1, kind: "selector", signals: [0], expression: undefined, selector: [["slice", ["value", 0], null]] }
  ])
  assert.equal("nativeHandlers" in semantic || "reactiveBindings" in semantic || "clientImports" in semantic, false)
  assertJsonData(semantic.moduleIR)
  assert.deepEqual(JSON.parse(JSON.stringify(semantic.moduleIR)), semantic.moduleIR)
})

test("uses lexical bindings for reactive capture and import discovery", () => {
  const source = ts.createSourceFile("binding-shadow.ts", `
import { format } from "./format"
const document = "local"
const binding = count ? document + [1].map(document => document + 1).join("") + [1].map(format => format + 1).join("") + console : ""
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact("binding-shadow.ts")
  const binding = source.statements[2].declarationList.declarations[0].initializer
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/assets/handlers/binding-shadow.js",
      factory: context.factory,
      context,
      bindingIndex: createBindingIndex(file),
      compileEventCommand: () => undefined,
      handlerLowering,
      isPrimitiveLiteral: () => false,
      rejectWorkerConstructions: () => {}
    })
    session.compileReactiveBinding(binding, {
      setters: new Map([["setCount", "count"]]),
      importBindings: new Map([["format", { kind: "named", imported: "format", local: "format", target: "/src/format.ts" }]])
    })
    session.finalize()
    return file
  }])
  result.dispose()

  assert.deepEqual(semantic.moduleIR.bindings[0].signals, [0])
  assert.deepEqual(semantic.moduleIR.bindings[0].captures, [{ symbol: 1, name: "document", source: "scope" }])
  assert.deepEqual(semantic.moduleIR.bindings[0].imports, [])
  assert.deepEqual(semantic.moduleIR.clientModules, [])
  assert.match(semantic.moduleIR.bindings[0].code, /__k\.scope\("document"\).+document => document \+ 1/s)
  assert.doesNotMatch(semantic.moduleIR.bindings[0].code, /document => __k\.scope\("document"\)/)
})

test("uses lexical bindings for native, effect, and list descriptor discovery", () => {
  const source = ts.createSourceFile("descriptor-shadow.ts", `
import { format } from "./format"
const document = "outer"
const count = 0
const setCount = value => value
const callback = () => {
  format(count)
  document.toString()
  ;[1].forEach(format => format)
  ;[1].forEach(document => document)
  ;[1].forEach(count => count)
  ;[1].forEach(setCount => setCount(1))
  setCount(count + 1)
}
const row = count + [1].map(count => count)[0] + item.value
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact("descriptor-shadow.ts")
  const callback = source.statements[4].declarationList.declarations[0].initializer
  const row = source.statements[5].declarationList.declarations[0].initializer
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/assets/handlers/descriptor-shadow.js",
      factory: context.factory,
      context,
      bindingIndex: createBindingIndex(file),
      compileEventCommand: () => undefined,
      handlerLowering,
      isPrimitiveLiteral: () => false,
      rejectWorkerConstructions: () => {}
    })
    const setters = new Map([["setCount", "count"]])
    const importBindings = new Map([["format", { kind: "named", imported: "format", local: "format", target: "/src/format.ts" }]])
    session.compileEvent(callback, { setters, reducers: new Map(), functions: new Map(), importBindings })
    session.compileEffectCallback(callback, { setters, reducers: new Map(), importBindings })
    session.compileListValue(row, { item: "item", states: new Set(["count"]) })
    session.finalize()
    return file
  }])
  result.dispose()

  for (const handler of semantic.moduleIR.handlers) {
    assert.deepEqual(handler.signals, [{ signal: 0, name: "count", setters: ["setCount"], value: "direct", snapshot: false }])
    assert.deepEqual(handler.captures, [{ symbol: 1, name: "document", source: "scope", value: "direct", snapshot: false }])
    assert.deepEqual(handler.imports, [0])
    assert.match(handler.code, /format\(__k\.get\("count"\)\)/)
    assert.match(handler.code, /__k\.scope\("document"\)\.toString\(\)/)
    assert.match(handler.code, /format => format/)
    assert.match(handler.code, /document => document/)
    assert.match(handler.code, /count => count/)
    assert.match(handler.code, /setCount => setCount\(1\)/)
  }
  assert.match(semantic.moduleIR.bindings[0].code, /__k\.get\("count"\) \+ \[1\]\.map\(count => count\)/)
  assertJsonData(semantic.moduleIR)
  assert.deepEqual(JSON.parse(JSON.stringify(semantic.moduleIR)), semantic.moduleIR)
})

test("matches effect resource cleanup by lexical binding", () => {
  const source = ts.createSourceFile("resource-shadow.ts", `
const callback = () => {
  const observer = new IntersectionObserver(() => {})
  return () => {
    const observer = { disconnect() {} }
    observer.disconnect()
  }
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const callback = source.statements[0].declarationList.declarations[0].initializer
  const cleanup = callback.body.statements[1].expression

  assert.throws(() => validateEffectOwnedBrowserResources(callback, { cleanups: [cleanup] }, (_, message) => { throw new Error(message) }, createBindingIndex(source)), /IntersectionObserver effects must disconnect "observer" in cleanup/)

  const shadowedSource = ts.createSourceFile("global-shadow.ts", `
const callback = () => {
  const IntersectionObserver = class {}
  const observer = new IntersectionObserver(() => {})
}
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const shadowedCallback = shadowedSource.statements[0].declarationList.declarations[0].initializer
  assert.doesNotThrow(() => validateEffectOwnedBrowserResources(shadowedCallback, { cleanups: [] }, (_, message) => { throw new Error(message) }, createBindingIndex(shadowedSource)))
})

test("encodes collection expressions with item, index, and state reads", () => {
  const source = ts.createSourceFile("expression.ts", "const value = item.price * quantity + index", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const expression = source.statements[0].declarationList.declarations[0].initializer
  const selectorStates = new Set()
  const encoded = collectionExpression(expression, {
    parameters: { item: "item", index: "index" },
    fail: (node, message) => { throw sourceNodeError(node, source, message) },
    stateNames: new Set(["quantity"]),
    selectorStates
  })

  assert.deepEqual(encoded, ["binary", "+", ["binary", "*", ["get", ["item"], "price", false], ["state", "quantity"]], ["index"]])
  assert.deepEqual([...selectorStates], ["quantity"])
})

test("recognizes a composed collection selector pipeline", () => {
  const source = ts.createSourceFile("pipeline.ts", "const value = items.filter(item => item.name.includes(query)).slice(0, limit).toSorted((left, right) => left.rank - right.rank)", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const expression = source.statements[0].declarationList.declarations[0].initializer
  const pipeline = analyzeCollectionPipeline(expression, {
    setters: new Map([["setItems", "items"]]),
    fail: (node, message) => { throw sourceNodeError(node, source, message) },
    stateNames: new Set(["items", "query", "limit"])
  })

  assert.equal(pipeline.state.text, "items")
  assert.deepEqual(pipeline.selector, [
    ["filter", ["call", ["get", ["item"], "name", false], "includes", ["state", "query"]]],
    ["slice", ["value", 0], ["state", "limit"]],
    ["sort", ["binary", "-", ["get", ["item"], "rank", false], ["get", ["index"], "rank", false]]]
  ])
  assert.deepEqual([...pipeline.selectorStates], ["query", "limit"])
})

test("preserves source diagnostics for mutating collection sort", () => {
  const source = ts.createSourceFile("invalid.ts", "const value = items.sort((left, right) => left.rank - right.rank)", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const expression = source.statements[0].declarationList.declarations[0].initializer

  assert.throws(() => analyzeCollectionPipeline(expression, {
    setters: new Map([["setItems", "items"]]),
    fail: (node, message) => { throw sourceNodeError(node, source, message) },
    stateNames: new Set(["items"])
  }), /^Error: invalid\.ts:1:15 Rendered collections cannot use mutating sort\(\); use toSorted\(\)$/)
})

test("plans a static route with no browser capabilities", () => {
  const record = routeRecord(routePlan())
  const manifest = planRouteCapabilities([record])

  assert.equal(manifest.version, 1)
  assert.deepEqual(manifest.events, { command: [], native: [], hasNativeHandlers: false })
  assert.equal(manifest.routes.behaviors, 0)
  assert.equal(manifest.bindings.count, 0)
  assert.equal(manifest.lists.count, 0)
  assert.equal(manifest.effects.any, false)
  assert.deepEqual(manifest.runtime, { shared: false, dependency: false })
  assertJsonData(manifest)
  assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest)
  assert.throws(() => planRouteCapabilities([{ ...record, plan: { ...record.plan, version: 2 } }]), /Unsupported RouteIR version: 2/)
  assert.throws(() => usesRouteDependencyRuntime({ plan: { ...routePlan(), version: undefined } }), /Unsupported RouteIR version: undefined/)
  assert.throws(() => planRouteCapabilities([{ ...record, plan: { version: 1, route: "/test", events: [], effects: [] } }]), /Invalid RouteIR v1 structure/)
  assert.throws(() => planRouteCapabilities([{ ...record, plan: { ...record.plan, events: [{}] } }]), /Invalid RouteIR v1 event/)
  assert.throws(() => generateListRuntime("", { ...manifest, version: 2 }), /Unsupported CapabilityIR version: 2/)
  assert.throws(() => generateListRuntime("", { version: 1 }), /Invalid CapabilityIR v1 structure/)
  assert.throws(() => generateListRuntime("", { ...manifest, effects: {} }), /Invalid CapabilityIR v1 effect, capture, or runtime flags/)
  assert.throws(() => generateListRuntime("", manifest), /shared runtime import specialization did not match list-runtime\.js/)
  assert.throws(() => generateCoreRuntime("", manifest), /event names specialization did not match runtime source/)
  assert.throws(() => generateEffectRuntime("", manifest), /serialization import specialization did not match effect-runtime\.js/)
  assert.throws(() => generateBindingRuntime("", manifest, false), /shared runtime import specialization did not match binding-runtime\.js/)
  assert.throws(() => generateNativeRuntime("", manifest), /shared runtime import specialization did not match native-runtime\.js/)
  assert.throws(() => generateNavigationRuntime("", { records: [], applicationId: "a", layoutId: "l" }), /route records specialization did not match navigation-runtime\.js/)
  const printParamEntry = createParamCodegen({ browserPath: value => value, inlineJson: JSON.stringify, relativeModulePath: () => "./kudzu.js" })
  assert.equal(printParamEntry(undefined, [], [], false, "/out.js", "/assets", "", "kudzu.js", false), 'import { browserState, commitDom } from "./kudzu.js"\n')
})

test("rejects invalid concrete RouteIR references before artifact planning", () => {
  const state = { slot: 0, id: "s0", name: "count", initialValue: 0 }
  const plan = routePlan({ states: [state] })
  assert.throws(() => assertRouteIR({ ...plan, states: [state, { ...state, slot: 1, name: "other" }] }), /duplicate state ID "s0"/)
  assert.throws(() => assertRouteIR({ ...plan, params: [{ name: "id", id: "s0" }] }), /duplicate state or parameter ID "s0"/)
  assert.throws(() => assertRouteIR({ ...plan, events: [{ event: "click", commands: [["add", "missing", 1]] }] }), /command references missing state "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, events: [{ event: "click", commands: [["explode", "s0", 1]] }] }), /unsupported operation "explode"/)
  assert.throws(() => assertRouteIR({ ...plan, effects: [{ module: "/handler.js", handler: "effect0", states: {}, scope: {}, dependencies: ["missing"] }] }), /effect 0 dependency references missing state "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, bindings: [{ target: "text", state: "missing" }] }), /binding 0 references missing state "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, conditions: [{ id: "c0", kind: "invalid", initial: false, state: "s0" }] }), /condition has invalid kind "invalid"/)
  assert.throws(() => assertRouteIR({ ...plan, lists: [{ id: "l0", state: "missing", key: "id", keys: [] }] }), /list 0 references missing state "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, lists: [{ id: "l0", state: "s0", key: "id", keys: [1, 1] }] }), /duplicate key 1/)
  assert.throws(() => assertRouteIR({ ...plan, states: [{ ...state, initialValue: 1n }] }), /RouteIR .* is not JSON-safe/)
  const accessor = {}
  Object.defineProperty(accessor, "value", { enumerable: true, get: () => { throw new Error("must not execute") } })
  assert.throws(() => assertRouteIR({ ...plan, states: [{ ...state, initialValue: accessor }] }), /not JSON-safe at \$\.states\.0\.initialValue\.value/)
  const symbolic = {}
  symbolic[Symbol("hidden")] = true
  assert.throws(() => assertRouteIR({ ...plan, states: [{ ...state, initialValue: symbolic }] }), /not JSON-safe at \$\.states\.0\.initialValue/)
})

test("rejects broken nested list ownership and malformed captures", () => {
  const state = { slot: 0, id: "s0", name: "items", initialValue: [] }
  const plan = routePlan({ states: [state] })
  assert.throws(() => assertRouteIR({ ...plan, lists: [{ id: "child", state: "s0", key: "id", keys: [], ownerField: "children" }] }), /nested list "child" has no parent/)
  assert.throws(() => assertRouteIR({ ...plan, lists: [{ id: "parent", state: "s0", key: "id", keys: [], children: [{ id: "missing", field: "children", key: "id" }] }] }), /references missing child "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, events: [{ event: "click", native: { module: "/handler.js", handler: "handler0", states: {}, scope: { update: { type: "setter", id: "missing" } } } }] }), /capture setter references missing state "missing"/)
  assert.throws(() => assertRouteIR({ ...plan, events: [{ event: "click", native: { module: "/handler.js", handler: "handler0", states: {}, scope: { values: { type: "array", value: "bad" } } } }] }), /capture array requires an array value/)
})

test("validates CapabilityIR consistency and projection", () => {
  const record = routeRecord(routePlan())
  const capability = planRouteCapabilities([record])
  assert.equal(assertCapabilityIR(capability, [record]), capability)
  assert.throws(() => assertCapabilityIR({ ...capability, events: { ...capability.events, hasNativeHandlers: true } }), /native handler flag does not match native events/)
  assert.throws(() => assertCapabilityIR({ ...capability, lists: { ...capability.lists, count: 0, rowRefs: true } }), /list features require at least one list/)
  assert.throws(() => assertCapabilityIR({ ...capability, runtime: { ...capability.runtime, shared: true } }, [record]), /does not match RouteBuildRecord projection/)
})

test("plans route artifacts from structural handler and effect edges", () => {
  const live = "/assets/handlers/live.js"
  const dead = "/assets/handlers/dead.js"
  const record = createRouteBuildRecord({
    route: "/test",
    output: "test",
    html: `<p>${JSON.stringify(dead)}</p>`,
    plan: routePlan({ effects: [{ module: live, handler: "effect0", states: {}, scope: {} }] }),
    handlerReferences: [{ module: live, handler: "effect0" }],
    styles: ["/assets/style.css"],
    capabilities: routeCapability({ hasBehaviors: true, hasEffects: true }),
    entries: { effect: "effects/test.js" }
  })
  const modules = [{ path: "handlers/live.js" }, { path: "handlers/dead.js" }]
  const workers = [
    { module: live, handler: "effect0", placeholder: "live" },
    { module: live, handler: "effect1", placeholder: "dead" }
  ]
  const artifacts = planRouteArtifacts([record], modules, workers, module => `/assets/${module.path}`)

  assert.deepEqual(artifacts.handlerModules, [modules[0]])
  assert.deepEqual(artifacts.workerReferences, [workers[0]])
  assert.deepEqual(artifacts.styles, ["/assets/style.css"])
  assertJsonData(record)
  assert.deepEqual(JSON.parse(JSON.stringify(record)), record)
})

test("marks serialized route plans as explicitly released", () => {
  const record = routeRecord(routePlan())
  releaseRouteBuildRecordPlan(record)
  assert.equal(assertRouteBuildRecord(record), record)
  record.plan = routePlan()
  assert.throws(() => assertRouteBuildRecord(record), /Released RouteBuildRecord plan was restored/)
})

test("reports exact route capability and bundled chunk closure", () => {
  const root = resolve("test/fixtures/artifact-report")
  const output = resolve(root, "dist")
  const a = routeRecord({ ...routePlan({ events: [{ event: "click", native: { module: "/assets/handlers/a.js", handler: "run", states: {}, scope: {} } }] }), route: "/a" }, { hasBehaviors: true })
  const b = routeRecord({ ...routePlan({ events: [{ event: "input", native: { module: "/assets/handlers/b.js", handler: "run", states: {}, scope: {} } }] }), route: "/b" }, { hasBehaviors: true })
  const file = path => resolve(output, path)
  const metafile = { outputs: {
    [file("assets/handlers/a.js")]: { imports: [{ path: "chunks/a.js", kind: "import-statement" }, { path: "chunks/shared.js", kind: "import-statement" }, { path: "chunks/lazy.js", kind: "dynamic-import" }] },
    [file("assets/handlers/b.js")]: { imports: [{ path: "chunks/b.js", kind: "import-statement" }, { path: "chunks/shared.js", kind: "import-statement" }] },
    [file("assets/handlers/chunks/a.js")]: { imports: [] },
    [file("assets/handlers/chunks/b.js")]: { imports: [] },
    [file("assets/handlers/chunks/lazy.js")]: { imports: [] },
    [file("assets/handlers/chunks/shared.js")]: { imports: [{ path: "external.js", external: true }] }
  } }
  const report = createRouteArtifactReport([b, a], { handlerMetafile: metafile, outputDirectory: output })

  assert.deepEqual(report.routes.map(route => route.route), ["/a", "/b"])
  assert.deepEqual(report.routes[0].handlers, { entries: ["/assets/handlers/a.js"], chunks: ["/assets/handlers/chunks/a.js", "/assets/handlers/chunks/shared.js"], lazyChunks: ["/assets/handlers/chunks/lazy.js"] })
  assert.deepEqual(report.routes[1].handlers, { entries: ["/assets/handlers/b.js"], chunks: ["/assets/handlers/chunks/b.js", "/assets/handlers/chunks/shared.js"], lazyChunks: [] })
  assert.deepEqual(report.sharedChunks, [{ path: "/assets/handlers/chunks/shared.js", routes: ["/a", "/b"] }])
  const family = report.runtimeFamilies.find(entry => entry.routes.includes("/a"))
  assert.deepEqual(report.routes[0].runtime.requirements, ["kudzu.js", "kudzu-native.js", "kudzu-serialization.js"].map(name => `/assets/runtime/${family.id}/${name}`).sort())
  assert.notEqual(report.routes[0].capability.signature, report.routes[1].capability.signature)
  assert.deepEqual(report.routes[0].capability.manifest.events.native, ["click"])
  assert.deepEqual(report.routes[1].capability.manifest.events.native, ["input"])
  assertJsonData(report)
})

test("plans deterministic runtime families around navigation singleton boundaries", () => {
  const commandPlan = routePlan({ events: [{ event: "click", commands: [["set", "count", 1]] }], states: [{ slot: 0, id: "count", name: "count", initialValue: 0 }] })
  const first = routeRecord({ ...commandPlan, route: "/first" }, { hasBehaviors: true })
  const second = routeRecord({ ...commandPlan, route: "/second" }, { hasBehaviors: true })
  const native = routeRecord({ ...routePlan({ events: [{ event: "input", native: { module: "/handler.js", handler: "run", states: {}, scope: {} } }] }), route: "/native" }, { hasBehaviors: true })
  const standalone = planRuntimeFamilies([native, second, first])
  assert.equal(standalone.families.length, 2)
  assert.equal(standalone.familyByRecord.get(first).id, standalone.familyByRecord.get(second).id)
  assert.notEqual(standalone.familyByRecord.get(first).id, standalone.familyByRecord.get(native).id)
  assert.deepEqual(standalone.families.map(family => family.id), [...standalone.families.map(family => family.id)].sort())

  const navigableFirst = routeRecord({ ...commandPlan, route: "/first" }, { hasBehaviors: true, navigable: true })
  const navigableNative = routeRecord({ ...routePlan({ events: [{ event: "input", native: { module: "/handler.js", handler: "run", states: {}, scope: {} } }] }), route: "/native" }, { hasBehaviors: true, navigable: true })
  const grouped = planRuntimeFamilies([navigableFirst, navigableNative], [{ buildRecords: [navigableFirst, navigableNative] }])
  assert.equal(grouped.families.length, 1)
  assert.equal(grouped.familyByRecord.get(navigableFirst), grouped.familyByRecord.get(navigableNative))
  assert.deepEqual(grouped.families[0].capability.events.command, ["click"])
  assert.deepEqual(grouped.families[0].capability.events.native, ["input"])
  assert.equal(grouped.families[0].navigation, true)
})

test("rejects malformed route artifact references", () => {
  const base = {
    route: "/test",
    output: "test",
    html: "",
    plan: routePlan(),
    styles: [],
    capabilities: routeCapability(),
    entries: {}
  }
  assert.throws(() => createRouteBuildRecord({ ...base, version: 2 }), /Unsupported RouteBuildRecord version: 2/)
  assert.throws(() => createRouteBuildRecord({ ...base, handlerReferences: [{ module: "/handler.js", handler: "run" }, { module: "/handler.js", handler: "run" }] }), /duplicate handler reference/)
  const dangling = createRouteBuildRecord({ ...base, handlerReferences: [{ module: "/missing.js", handler: "run" }] })
  assert.throws(() => planRouteArtifacts([dangling], [], [], module => module.path), /Handler module was not compiled: \/missing\.js/)
})

test("plans command-only runtime specialization and state seeds", () => {
  const plan = routePlan({ states: [{ slot: 0, id: "count", name: "count", initialValue: 0 }], events: [{ event: "click", commands: [["add", "count", 1]] }] })
  const manifest = planRouteCapabilities([routeRecord(plan, { hasBehaviors: true, hasStateSeed: true })])

  assert.deepEqual(manifest.events.command, ["click"])
  assert.equal(manifest.events.hasNativeHandlers, false)
  assert.deepEqual(manifest.routes, { behaviors: 1, regularBehaviors: 1, regularStateSeeds: 1, dependencyStateSeeds: 0 })
  assert.equal(manifest.runtime.shared, false)
})

test("plans binding and list runtime specializations", () => {
  const plan = routePlan({
    states: [{ slot: 0, id: "s0", name: "items", initialValue: [] }],
    bindings: [{ target: "text", state: "s0" }],
    conditions: [{ id: "c0", kind: "and", initial: true, state: "s0", svg: true }],
    lists: [{ id: "l0", state: "s0", key: "id", keys: [], selector: [["filter"]], expressions: true, conditions: true, rowRefs: ["r0:$k"], static: true, svg: true }]
  })
  const manifest = planRouteCapabilities([routeRecord(plan, { hasBehaviors: true, hasBindings: true, hasLists: true, hasListStyles: true })])

  assert.deepEqual(manifest.bindings, { count: 1, text: true, svgConditions: true })
  assert.equal(manifest.lists.count, 1)
  assert.equal(manifest.lists.styleCount, 1)
  assert.equal(manifest.lists.selectors, true)
  assert.equal(manifest.lists.asyncParts, true)
  assert.equal(manifest.lists.rowHooks, true)
  assert.equal(manifest.lists.generalRowHooks, true)
  assert.equal(manifest.lists.svg, true)
  assert.equal(manifest.runtime.shared, true)
  const generated = generateListRuntime(readFileSync(new URL("../framework/list-runtime.js", import.meta.url), "utf8"), manifest)
  const runtime = generated.source
  assert.equal(generated.define.__KUDZU_LIST_EFFECTS__, "false")
  assert.match(runtime, /addedNodes\?\.length > 32 && addedNodes\.length \* 2 > next\.length && addedNodes\.length \* 2 > parent\.children\.length && !list\.descriptor\.children && !list\.descriptor\.ownerField\) mountDom\(parent, list\.lifecycle\)/)
  assert.match(runtime, /else if \(addedNodes\) for \(const node of addedNodes\) mountDom\(node, list\.lifecycle\)/)
})

test("plans native, effect, capture, and dependency runtime capabilities", () => {
  const native = { module: "/handler.js", handler: "handler0", states: {}, scope: { nested: { type: "array", value: [{ type: "state", id: "count" }] }, update: { type: "setter", id: "count" } } }
  const effect = { module: "/handler.js", handler: "effect0", states: {}, scope: { label: "ready" }, dependencyExpressions: [["state", "count"]], itemDependencies: ["id"], listState: "items", owner: "row" }
  const plan = routePlan({ states: [{ slot: 0, id: "count", name: "count", initialValue: 0 }, { slot: 1, id: "items", name: "items", initialValue: [] }], events: [{ event: "submit", native }], effects: [effect], lists: [{ id: "l0", state: "items", key: "id", keys: [] }] })
  const manifest = planRouteCapabilities([routeRecord(plan, { navigable: true, hasBehaviors: true, hasEffects: true, hasLists: true })])

  assert.deepEqual(manifest.events.native, ["submit"])
  assert.equal(manifest.events.hasNativeHandlers, true)
  assert.deepEqual(manifest.effects, { any: true, derivedDependencies: true, itemDependencies: true, captures: true, navigable: true, navigableOwners: true })
  assert.equal(generateListRuntime(readFileSync(new URL("../framework/list-runtime.js", import.meta.url), "utf8"), manifest).define.__KUDZU_LIST_EFFECTS__, "true")
  assert.deepEqual(manifest.captures, { nestedState: true, setter: true })
  assert.equal(manifest.runtime.shared, true)
  assert.equal(usesRouteDependencyRuntime({ plan: routePlan({ states: [{ slot: 0, id: "count", name: "count", initialValue: 0 }], effects: [{ module: "/handler.js", handler: "effect1", states: {}, scope: {}, dependencies: ["count"] }] }), navigable: false, hasBindings: false, hasLists: false }), true)
  assert.equal(usesRouteDependencyRuntime({ plan, navigable: false, hasBindings: false, hasLists: false }), false)
})

function routePlan(overrides = {}) {
  return { version: 1, route: "/test", states: [], params: [], searchParams: [], searchParamsWritable: false, events: [], effects: [], bindings: [], conditions: [], lists: [], ...overrides }
}

function routeCapability(overrides = {}) {
  return { navigable: false, usesDependencyRuntime: false, hasBehaviors: false, hasBindings: false, hasLists: false, hasListStyles: false, hasStateSeed: false, hasParams: false, hasEffects: false, ...overrides }
}

function routeRecord(plan, capabilities = {}) {
  const references = [
    ...plan.effects,
    ...plan.events.map(event => event.native).filter(Boolean),
    ...plan.bindings,
    ...plan.conditions,
    ...plan.lists.map(list => list.source).filter(Boolean)
  ].filter(reference => reference.module && reference.handler)
  const unique = [...new Map(references.map(reference => [JSON.stringify([reference.module, reference.handler]), { module: reference.module, handler: reference.handler }])).values()]
  return createRouteBuildRecord({
    route: plan.route,
    output: "test",
    html: "",
    plan,
    handlerReferences: unique,
    styles: [],
    capabilities: routeCapability(capabilities),
    entries: {
      ...(plan.effects.length ? { effect: "effects/test.js" } : {}),
      ...(plan.events.some(event => event.native) ? { native: "native/test.js" } : {})
    }
  })
}

function assertJsonData(value) {
  if (typeof value === "number") {
    assert.equal(Number.isFinite(value) && !Object.is(value, -0), true)
    return
  }
  if (value === null || ["string", "boolean"].includes(typeof value)) return
  assert.equal(["function", "symbol", "undefined"].includes(typeof value), false)
  assert.equal(value instanceof Map || value instanceof Set, false)
  assert.equal(typeof value.kind === "number" && typeof value.pos === "number" && typeof value.end === "number", false)
  assert.ok(Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  for (const entry of Array.isArray(value) ? value : Object.values(value)) assertJsonData(entry)
}
