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
import { createDescriptorSession, createSemanticArtifact } from "../framework/compiler/descriptor-session.mjs"
import { analyzeEffectDependencies, validateEffectOwnedBrowserResources } from "../framework/compiler/effect-analysis.mjs"
import { createHandlerLowering } from "../framework/compiler/handler-lowering.mjs"
import { assertModuleIRReferences, createModuleIR, registerCommandHandler, registerEffect, registerKeyedBlock } from "../framework/compiler/ir/module-ir.mjs"
import { generateListRuntime } from "../framework/compiler/list-runtime-codegen.mjs"
import { applyNormalizationPasses } from "../framework/compiler/normalization-pipeline.mjs"
import { createCommandSpecializer } from "../framework/compiler/optimize/command-specialization.mjs"
import { createParamCodegen } from "../framework/compiler/param-codegen.mjs"
import { normalizeRenderControlFlow } from "../framework/compiler/render-control-pass.mjs"
import { planRouteCapabilities, usesRouteDependencyRuntime } from "../framework/compiler/route-capability-planner.mjs"
import { generateBindingRuntime, generateCoreRuntime, generateEffectRuntime, generateNativeRuntime, generateNavigationRuntime } from "../framework/compiler/runtime-codegen.mjs"
import { compileSource, reachableSourceFiles } from "../framework/compiler/source-compiler.mjs"
import { createZustandPass } from "../framework/compiler/zustand-pass.mjs"

const handlerLowering = createHandlerLowering({ cloneAst: node => node, synthesizeTree: node => node })

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

  assert.deepEqual(reachableSourceFiles([page], sourceFiles, new Map([
    [page, 'import type { Missing } from "./missing"\nexport default function Page() {}'],
    [helper, 'import "./missing"']
  ])), [page])
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

  assert.equal(pass.analyzeZustandStores(source).get("useCount").field, "count")
  assert.doesNotMatch(output, /from "zustand"/)
  assert.match(output, /__kCreateStore\("store.ts#useCount", "count", 0, \["increment"\]\)/)

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
  assert.deepEqual(command("setCount(\"ready\")"), { operation: "set", state: "count", value: "ready" })
  assert.deepEqual(command("console.log(\"count\", count)"), { operation: "log", state: "count", value: "count" })
  assert.equal(command("setCount(count * 2)"), undefined)
  assert.equal(command("setCount(1e309)"), undefined)
  assertJsonData(command("setCount(count + 1)"))
})

test("registers JSON-safe command ModuleIR with deterministic slots", () => {
  const moduleIR = createModuleIR("src/pages/counter.tsx")
  registerCommandHandler(moduleIR, [{ operation: "add", state: "total", value: 1 }], { file: "src/pages/counter.tsx", start: 20, end: 45 }, "component:0")
  registerCommandHandler(moduleIR, [{ operation: "set", state: "count", value: -2 }], { file: "src/pages/counter.tsx", start: 50, end: 74 }, "component:0")
  registerCommandHandler(moduleIR, [{ operation: "set", state: "count", owner: "component:1", value: 3 }], undefined, "component:0")

  assert.deepEqual(moduleIR, {
    version: 1,
    file: "src/pages/counter.tsx",
    signals: [
      { slot: 0, key: "component:0:total", debugName: "total" },
      { slot: 1, key: "component:0:count", debugName: "count" },
      { slot: 2, key: "component:1:count", debugName: "count" }
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
  assert.throws(() => assertModuleIRReferences(moduleIR), /handler 0 command signal references missing slot 0/)
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
      compileEventCommand: createCommandSpecializer({ isPrimitiveLiteral: () => false }),
      isPrimitiveLiteral: () => false,
      rejectWorkerConstructions: () => {}
    })
    const shared = new Map([["setCount", "count"]])
    session.compileEvent(handlers[0], { owner: "owner:0", setters: shared, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    session.compileEvent(handlers[1], { owner: "owner:0", setters: shared, reducers: new Map(), functions: new Map(), importBindings: new Map() })
    session.compileEvent(handlers[2], { owner: "owner:1", setters: new Map(shared), reducers: new Map(), functions: new Map(), importBindings: new Map() })
    return file
  }])
  result.dispose()

  assert.deepEqual(semantic.moduleIR.signals, [
    { slot: 0, key: "owner:0:count", debugName: "count" },
    { slot: 1, key: "owner:1:count", debugName: "count" }
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
  session.registerSpecialization({ kind: "Setter-callback", owner: 0, props: [{ name: "onChange", local: "onChange", provided: true }], states: [{ name: "value", setter: "setValue", kind: "component" }], refs: [{ name: "inputRef", kind: "component" }], ids: [{ name: "inputId" }] })

  assert.deepEqual(analysis.owners.map(owner => [owner.slot, owner.name, owner.states.map(state => state.name), owner.setters.map(setter => [setter.name, setter.signal]), owner.refs.map(ref => ref.name), owner.ids.map(id => id.name)]), [
    [0, "Page", ["count"], [["setCount", 0], ["dispatch", 0]], ["buttonRef"], ["labelId"]],
    [1, "KSetterComponent50", ["value"], [["setValue", 0]], [], []]
  ])
  assert.equal(analysis.specializations[0].owner, 0)
  assertJsonData(analysis)
  assert.deepEqual(JSON.parse(JSON.stringify(analysis)), analysis)
})

test("registers deterministic per-source handler, binding, and list descriptors", () => {
  const source = ts.createSourceFile("descriptors.ts", `
const binding = format(count + extra)
const handler = () => setCount(count + delta)
const row = item.label
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact("descriptors.ts")
  const [binding, handler, row] = source.statements.map(statement => statement.declarationList.declarations[0].initializer)
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/assets/handlers/descriptors.js",
      factory: context.factory,
      context,
      compileEventCommand: () => undefined,
      handlerLowering,
      isPrimitiveLiteral: node => ts.isStringLiteral(node) || ts.isNumericLiteral(node),
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
  assert.deepEqual(semantic.moduleIR.bindings[0].states, ["count"])
  assert.deepEqual(semantic.moduleIR.bindings[0].captures, [{ name: "extra", source: "scope" }])
  assert.deepEqual(semantic.moduleIR.clientModules, ["/src/format.ts"])
  assert.deepEqual(semantic.moduleIR.handlers[0].signals, [{ name: "count", setters: ["setCount"], value: "direct", snapshot: false }])
  assert.deepEqual(semantic.moduleIR.handlers[0].captures, [{ name: "delta", source: "scope", value: "direct", snapshot: false }])
  assert.deepEqual(semantic.moduleIR.imports, [{ target: "/src/format.ts", kind: "named", local: "format", imported: "format", package: false }])
  assert.deepEqual(semantic.moduleIR.derived.map(({ slot, kind, states, expression, selector }) => ({ slot, kind, states, expression, selector })), [
    { slot: 0, kind: "expression", states: ["count"], expression: ["binary", "+", ["state", "count"], ["value", 1]], selector: undefined },
    { slot: 1, kind: "selector", states: ["count"], expression: undefined, selector: [["slice", ["value", 0], null]] }
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

  assert.deepEqual(semantic.moduleIR.bindings[0].states, ["count"])
  assert.deepEqual(semantic.moduleIR.bindings[0].captures, [{ name: "document", source: "scope" }])
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
    assert.deepEqual(handler.signals, [{ name: "count", setters: ["setCount"], value: "direct", snapshot: false }])
    assert.deepEqual(handler.captures, [{ name: "document", source: "scope", value: "direct", snapshot: false }])
    assert.deepEqual(handler.imports, [{ target: "/src/format.ts", kind: "named", local: "format", imported: "format", package: false }])
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
  const manifest = planRouteCapabilities([routePlan()], { routes: routeCapabilities([{}]) })

  assert.equal(manifest.version, 1)
  assert.deepEqual(manifest.events, { command: [], native: [], hasNativeHandlers: false })
  assert.equal(manifest.routes.behaviors, 0)
  assert.equal(manifest.bindings.count, 0)
  assert.equal(manifest.lists.count, 0)
  assert.equal(manifest.effects.any, false)
  assert.deepEqual(manifest.runtime, { shared: false, dependency: false })
  assertJsonData(manifest)
  assert.deepEqual(JSON.parse(JSON.stringify(manifest)), manifest)
  assert.throws(() => planRouteCapabilities([{ ...routePlan(), version: 2 }]), /Unsupported RouteIR version: 2/)
  assert.throws(() => usesRouteDependencyRuntime({ plan: { ...routePlan(), version: undefined } }), /Unsupported RouteIR version: undefined/)
  assert.throws(() => planRouteCapabilities([{ version: 1 }]), /Invalid RouteIR v1 structure/)
  assert.throws(() => planRouteCapabilities([{ ...routePlan(), events: [{}] }]), /Invalid RouteIR v1 event/)
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

test("plans command-only runtime specialization and state seeds", () => {
  const plan = routePlan({ events: [{ event: "click", commands: [["add", "count", 1]] }] })
  const manifest = planRouteCapabilities([plan], {
    routes: routeCapabilities([{ hasBehaviors: true, hasStateSeed: true, usesDependencyRuntime: false }])
  })

  assert.deepEqual(manifest.events.command, ["click"])
  assert.equal(manifest.events.hasNativeHandlers, false)
  assert.deepEqual(manifest.routes, { behaviors: 1, regularBehaviors: 1, regularStateSeeds: 1, dependencyStateSeeds: 0 })
  assert.equal(manifest.runtime.shared, false)
})

test("plans binding and list runtime specializations", () => {
  const plan = routePlan({
    bindings: [{ target: "text" }],
    conditions: [{ svg: true }],
    lists: [{ id: "l0", state: "s0", key: "id", keys: [], selector: [["filter"]], expressions: true, conditions: true, rowRefs: [{}], static: true, svg: true }]
  })
  const manifest = planRouteCapabilities([plan], {
    routes: routeCapabilities([{ hasBindings: true, hasLists: true, hasListStyles: true }])
  })

  assert.deepEqual(manifest.bindings, { count: 1, text: true, svgConditions: true })
  assert.equal(manifest.lists.count, 1)
  assert.equal(manifest.lists.styleCount, 1)
  assert.equal(manifest.lists.selectors, true)
  assert.equal(manifest.lists.asyncParts, true)
  assert.equal(manifest.lists.rowHooks, true)
  assert.equal(manifest.lists.generalRowHooks, true)
  assert.equal(manifest.lists.svg, true)
  assert.equal(manifest.runtime.shared, true)
  const runtime = generateListRuntime(readFileSync(new URL("../framework/list-runtime.js", import.meta.url), "utf8"), manifest).source
  assert.match(runtime, /addedNodes\?\.length > 32 && addedNodes\.length \* 2 > next\.length && addedNodes\.length \* 2 > parent\.children\.length && !list\.descriptor\.children && !list\.descriptor\.ownerField\) mountDom\(parent\)/)
  assert.match(runtime, /else if \(addedNodes\) for \(const node of addedNodes\) mountDom\(node\)/)
})

test("plans native, effect, capture, and dependency runtime capabilities", () => {
  const native = { module: "/handler.js", handler: "handler0", states: {}, scope: { nested: { type: "array", value: [{ type: "state", id: "count" }] }, update: { type: "setter", id: "count" } } }
  const effect = { module: "/handler.js", handler: "effect0", states: {}, scope: { label: "ready" }, dependencyExpressions: [["state", "count"]], itemDependencies: ["id"], owner: "row" }
  const plan = routePlan({ events: [{ event: "submit", native }], effects: [effect] })
  const manifest = planRouteCapabilities([plan], { routes: routeCapabilities([{ navigable: true }]) })

  assert.deepEqual(manifest.events.native, ["submit"])
  assert.equal(manifest.events.hasNativeHandlers, true)
  assert.deepEqual(manifest.effects, { any: true, derivedDependencies: true, itemDependencies: true, captures: true, navigable: true, navigableOwners: true })
  assert.deepEqual(manifest.captures, { nestedState: true, setter: true })
  assert.equal(manifest.runtime.shared, true)
  assert.equal(usesRouteDependencyRuntime({ plan: routePlan({ effects: [{ module: "/handler.js", handler: "effect1", states: {}, scope: {}, dependencies: ["count"] }] }), navigable: false, hasBindings: false, hasLists: false }), true)
  assert.equal(usesRouteDependencyRuntime({ plan, navigable: false, hasBindings: false, hasLists: false }), false)
})

function routePlan(overrides = {}) {
  return { version: 1, route: "/test", states: [], params: [], searchParams: [], searchParamsWritable: false, events: [], effects: [], bindings: [], conditions: [], lists: [], ...overrides }
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

function routeCapabilities(entries) {
  return new Map(entries.map((entry, index) => [index ? `/test-${index}` : "/test", entry]))
}
