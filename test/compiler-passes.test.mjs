import assert from "node:assert/strict"
import test from "node:test"
import ts from "typescript"
import { sourceNodeError } from "../framework/compiler/ast-helpers.mjs"
import { analyzeCollectionPipeline, collectionExpression } from "../framework/compiler/collection-analysis.mjs"
import { createDescriptorSession, createSemanticArtifact } from "../framework/compiler/descriptor-session.mjs"
import { createEventCommandCompiler } from "../framework/compiler/event-command-pass.mjs"
import { applyNormalizationPasses } from "../framework/compiler/normalization-pipeline.mjs"
import { normalizeRenderControlFlow } from "../framework/compiler/render-control-pass.mjs"
import { planRouteCapabilities, usesRouteDependencyRuntime } from "../framework/compiler/route-capability-planner.mjs"
import { createZustandPass } from "../framework/compiler/zustand-pass.mjs"

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

test("lowers direct setter arithmetic to a command descriptor", () => {
  const source = ts.createSourceFile("command.ts", "setCount(count + 1)", ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const expression = source.statements[0].expression
  const compile = createEventCommandCompiler({
    isPrimitiveLiteral: node => ts.isNumericLiteral(node),
    synthesizeSerializableStateLiteral: node => node
  })
  const command = compile(expression, new Map([["setCount", "count"]]), ts.factory)

  assert.equal(ts.createPrinter().printNode(ts.EmitHint.Expression, command, source), `["add", count, 1]`)
})

test("registers deterministic per-source handler, binding, and list descriptors", () => {
  const source = ts.createSourceFile("descriptors.ts", `
const binding = format(count + extra)
const handler = () => setCount(count + delta)
const row = item.label
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const semantic = createSemanticArtifact()
  const [binding, handler, row] = source.statements.map(statement => statement.declarationList.declarations[0].initializer)
  const result = ts.transform(source, [context => file => {
    const session = createDescriptorSession({
      semantic,
      handlerUrl: "/assets/handlers/descriptors.js",
      factory: context.factory,
      context,
      compileEventCommand: () => undefined,
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
    return file
  }])
  result.dispose()

  assert.deepEqual(semantic.reactiveBindings.map(entry => entry.exportName), ["binding0", "binding1"])
  assert.deepEqual([...semantic.reactiveBindings[0].states], ["count"])
  assert.deepEqual([...semantic.reactiveBindings[0].captures], ["extra"])
  assert.deepEqual([...semantic.clientImports], ["/src/format.ts"])
  assert.deepEqual(semantic.nativeHandlers.map(entry => entry.exportName), ["handler0"])
  assert.deepEqual(semantic.effectHandlers.map(entry => entry.exportName), ["effect0"])
  assert.deepEqual([...semantic.nativeHandlers[0].setters], [["setCount", "count"]])
  assert.deepEqual([...semantic.nativeHandlers[0].captures], ["delta"])
  assert.deepEqual(semantic.listExpressions.map(entry => entry.exportName), ["listExpression0"])
  assert.equal(semantic.listExpressions[0].item, "item")
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

function routeCapabilities(entries) {
  return new Map(entries.map((entry, index) => [index ? `/test-${index}` : "/test", entry]))
}
