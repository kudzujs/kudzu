import assert from "node:assert/strict"
import test from "node:test"
import ts from "typescript"
import { bindingNames, effectReturns, isNodeWithin, isUnshadowedGlobal, nearestFunction, nearestFunctionLike, referenceIdentifiers, sourceLocation, sourceNodeError, unwrapExpression } from "../framework/compiler/ast-helpers.mjs"

test("shares AST traversal, scope, return, and source-location helpers", () => {
  const source = ts.createSourceFile("original.tsx", `
const { a, nested: [b, { c }] } = value
globalCall()
function shadow(globalCall) { globalCall() }
class Example { method() { target() } }
const wrapped = (((value as string) satisfies string)!)
const effect = () => { const nested = () => { return 1 }; return () => cleanup() }
`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = source.statements.filter(ts.isVariableStatement).flatMap(statement => [...statement.declarationList.declarations])
  assert.deepEqual(bindingNames(declarations[0].name), ["a", "b", "c"])

  const globals = referenceIdentifiers(source, "globalCall")
  const shadowed = source.statements.find(ts.isFunctionDeclaration).body.statements[0].expression.expression
  assert.equal(globals.length, 1)
  assert.equal(isUnshadowedGlobal(globals[0], source), true)
  assert.equal(isUnshadowedGlobal(shadowed, source), false)

  const target = source.statements.find(ts.isClassDeclaration).members[0].body.statements[0].expression.expression
  assert.equal(isNodeWithin(target, source.statements.find(ts.isClassDeclaration)), true)
  assert.equal(isNodeWithin(target, target), true)
  assert.equal(isNodeWithin(source.statements.find(ts.isClassDeclaration), target), false)
  assert.equal(nearestFunction(target), undefined)
  assert.equal(nearestFunctionLike(target), source.statements.find(ts.isClassDeclaration).members[0])
  assert.equal(unwrapExpression(declarations.find(declaration => declaration.name.getText(source) === "wrapped").initializer).text, "value")

  const callback = declarations.find(declaration => declaration.name.getText(source) === "effect").initializer
  const returns = effectReturns(callback)
  assert.equal(returns.cleanup, true)
  assert.equal(returns.cleanups.length, 1)
  assert.equal(returns.invalid, undefined)

  const originalNode = ts.setOriginalNode(ts.factory.createIdentifier("copy"), target)
  assert.match(sourceNodeError(originalNode, ts.createSourceFile("unused.ts", "", ts.ScriptTarget.Latest), "broken").message, /^original\.tsx:5:28 broken$/)
  const fallback = ts.createSourceFile("fallback.ts", "\nvalue", ts.ScriptTarget.Latest, true)
  const fallbackNode = ts.setTextRange(ts.factory.createIdentifier("value"), fallback.statements[0].expression)
  assert.equal(sourceLocation(fallbackNode, fallback), "fallback.ts:2:1")
  assert.match(sourceNodeError(fallbackNode, fallback, "broken").message, /^fallback\.ts:2:1 broken$/)
})
