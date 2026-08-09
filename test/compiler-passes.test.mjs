import assert from "node:assert/strict"
import test from "node:test"
import ts from "typescript"
import { createComponentAnalysis, createComponentAnalysisSession } from "../framework/compiler/analysis/component-analysis.mjs"
import { sourceNodeError } from "../framework/compiler/ast-helpers.mjs"
import { analyzeCollectionPipeline, collectionExpression } from "../framework/compiler/collection-analysis.mjs"
import { generateCommandBehavior } from "../framework/compiler/codegen/command-codegen.mjs"
import { createDescriptorSession, createSemanticArtifact } from "../framework/compiler/descriptor-session.mjs"
import { createHandlerLowering } from "../framework/compiler/handler-lowering.mjs"
import { createModuleIR, registerCommandHandler, registerKeyedBlock } from "../framework/compiler/ir/module-ir.mjs"
import { applyNormalizationPasses } from "../framework/compiler/normalization-pipeline.mjs"
import { createCommandSpecializer } from "../framework/compiler/optimize/command-specialization.mjs"
import { normalizeRenderControlFlow } from "../framework/compiler/render-control-pass.mjs"
import { planRouteCapabilities, usesRouteDependencyRuntime } from "../framework/compiler/route-capability-planner.mjs"
import { createZustandPass } from "../framework/compiler/zustand-pass.mjs"

const handlerLowering = createHandlerLowering({ cloneAst: node => node, synthesizeTree: node => node })

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

  assert.deepEqual(manifest.events, { command: [], native: [], hasNativeHandlers: false })
  assert.equal(manifest.routes.behaviors, 0)
  assert.equal(manifest.bindings.count, 0)
  assert.equal(manifest.lists.count, 0)
  assert.equal(manifest.effects.any, false)
  assert.deepEqual(manifest.runtime, { shared: false, dependency: false })
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
    lists: [{ key: "id", selector: [["filter"]], expressions: true, conditions: true, rowRefs: [{}], static: true, svg: true }]
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
})

test("plans native, effect, capture, and dependency runtime capabilities", () => {
  const native = { module: "/handler.js", handler: "handler0", scope: { nested: { type: "array", value: [{ type: "state", id: "count" }] }, update: { type: "setter", id: "count" } } }
  const effect = { module: "/handler.js", handler: "effect0", scope: { label: "ready" }, dependencyExpressions: [["state", "count"]], itemDependencies: ["id"], owner: "row" }
  const plan = routePlan({ events: [{ event: "submit", native }], effects: [effect] })
  const manifest = planRouteCapabilities([plan], { routes: routeCapabilities([{ navigable: true }]) })

  assert.deepEqual(manifest.events.native, ["submit"])
  assert.equal(manifest.events.hasNativeHandlers, true)
  assert.deepEqual(manifest.effects, { any: true, derivedDependencies: true, itemDependencies: true, captures: true, navigable: true, navigableOwners: true })
  assert.deepEqual(manifest.captures, { nestedState: true, setter: true })
  assert.equal(manifest.runtime.shared, true)
  assert.equal(usesRouteDependencyRuntime({ plan: routePlan({ effects: [{ dependencies: ["count"] }] }), navigable: false, hasBindings: false, hasLists: false }), true)
  assert.equal(usesRouteDependencyRuntime({ plan, navigable: false, hasBindings: false, hasLists: false }), false)
})

function routePlan(overrides = {}) {
  return { route: "/test", events: [], effects: [], bindings: [], conditions: [], lists: [], ...overrides }
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
