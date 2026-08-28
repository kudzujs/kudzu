import assert from "node:assert/strict"
import { performance } from "node:perf_hooks"
import test from "node:test"
import ts from "typescript"
import { createBindingIndex } from "../framework/compiler/analysis/binding-index.mjs"

const parse = source => ts.createSourceFile("bindings.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

const variableInitializer = (source, name) => source.statements.flatMap(statement => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : []).find(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === name)?.initializer

test("classifies imports, locals, parameters, captures, globals, and unresolved references", () => {
  const source = parse(`
import { format } from "./format"
const moduleValue = 1
function Page(prop) {
  const localValue = 2
  return () => format(moduleValue + localValue + prop + document + missing)
}
`)
  const index = createBindingIndex(source)
  const page = source.statements[2]
  const callback = page.body.statements[1].expression
  const references = index.references(callback.body, callback)
  const byName = new Map(references.map(reference => [reference.debugName, reference]))

  assert.equal(byName.get("format").kind, "import")
  assert.equal(byName.get("moduleValue").kind, "capture")
  assert.equal(byName.get("localValue").kind, "capture")
  assert.equal(byName.get("prop").kind, "capture")
  assert.equal(byName.get("document").kind, "global")
  assert.equal(byName.get("missing").kind, "unresolved")
  assert.ok(byName.get("localValue").declarationRange)
  assert.ok(byName.get("localValue").referenceRange)
})

test("distinguishes shadowed browser globals from real globals", () => {
  const names = ["document", "location", "history", "navigator", "console", "HTMLElement"]
  const declarations = names.map(name => `const ${name} = ${JSON.stringify(name)}`).join("\n")
  const source = parse(`${declarations}
const captured = () => [${names.join(", ")}]
const bare = (${names.join(", ")}) => [${names.join(", ")}]
`)
  const index = createBindingIndex(source)
  const captured = variableInitializer(source, "captured")
  const bare = variableInitializer(source, "bare")

  assert.deepEqual(index.references(captured.body, captured).map(reference => [reference.debugName, reference.kind]), names.map(name => [name, "capture"]))
  assert.deepEqual(index.references(bare.body, bare).map(reference => [reference.debugName, reference.kind]), names.map(name => [name, "parameter"]))

  const globals = parse(`const read = () => [${names.join(", ")}]`)
  const globalCallback = variableInitializer(globals, "read")
  assert.deepEqual(createBindingIndex(globals).references(globalCallback.body, globalCallback).map(reference => [reference.debugName, reference.kind]), names.map(name => [name, "global"]))
})

test("does not confuse shadowed imports with imported references", () => {
  const source = parse(`
import { format } from "./format"
const actual = () => format(1)
const parameter = format => format(1)
const local = () => { const format = value => value; return format(1) }
`)
  const index = createBindingIndex(source)
  const actual = variableInitializer(source, "actual")
  const parameter = variableInitializer(source, "parameter")
  const local = variableInitializer(source, "local")

  assert.deepEqual(index.references(actual.body, actual).filter(reference => reference.debugName === "format").map(reference => reference.kind), ["import"])
  assert.deepEqual(index.references(parameter.body, parameter).filter(reference => reference.debugName === "format").map(reference => reference.kind), ["parameter"])
  assert.deepEqual(index.references(local.body, local).filter(reference => reference.debugName === "format").map(reference => reference.kind), ["local"])
})

test("assigns same-named state bindings to distinct component slots", () => {
  const source = parse(`
function First() { const [count, setCount] = useState(0); return () => [count, setCount] }
function Second() { const [count, setCount] = useState(0); return () => [count, setCount] }
`)
  const index = createBindingIndex(source)
  const callbacks = source.statements.map(statement => statement.body.statements[1].expression)
  const slots = callbacks.map(callback => index.references(callback.body, callback).filter(reference => ["count", "setCount"].includes(reference.debugName)).map(reference => reference.slot))

  assert.notDeepEqual(slots[0], slots[1])
  assert.equal(new Set(slots.flat()).size, 4)
})

test("keeps parameter initializers outside the function body var scope", () => {
  const source = parse(`const outer = 1; function read(value = body) { var body = outer; return value }`)
  const index = createBindingIndex(source)
  const fn = source.statements[1]
  const initializer = fn.parameters[0].initializer
  const bodyReference = index.references(initializer, fn.parameters[0])[0]

  assert.equal(bodyReference.debugName, "body")
  assert.equal(bodyReference.kind, "unresolved")
})

test("resolves computed method names from their enclosing scope", () => {
  const source = parse(`function outer() { const key = "run"; return class { [key]() {} } }`)
  const index = createBindingIndex(source)
  const fn = source.statements[0]
  const classExpression = fn.body.statements[1].expression
  const computed = classExpression.members[0].name.expression

  assert.equal(index.resolveReference(computed, classExpression).kind, "capture")
})

test("keeps namespace declarations out of their containing scope", () => {
  const source = parse(`namespace Values { const document = "local" } const read = () => document`)
  const callback = variableInitializer(source, "read")

  assert.equal(createBindingIndex(source).references(callback.body, callback)[0].kind, "global")
})

test("indexes one thousand references with constant-time lookups", t => {
  const source = parse(`const value = 1\nfunction read() {\n${Array.from({ length: 1000 }, (_, index) => `const value${index} = value`).join("\n")}\n}`)
  const started = performance.now()
  const index = createBindingIndex(source)
  const constructionMs = performance.now() - started
  const lookupStarted = performance.now()
  const references = index.references(source, source).filter(reference => reference.debugName === "value")
  const lookupMs = performance.now() - lookupStarted

  assert.equal(references.length, 1000)
  assert.equal(new Set(references.map(reference => reference.slot)).size, 1)
  assert.ok(constructionMs < 5000 && lookupMs < 5000)
  t.diagnostic(JSON.stringify({ references: references.length, constructionMs, lookupMs }))
})
