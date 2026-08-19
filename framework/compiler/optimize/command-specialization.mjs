import ts from "typescript"
import { isNodeWithin, sourceNodeError } from "../ast-helpers.mjs"

export function createCommandSpecializer({ isPrimitiveLiteral }) {
  const specialize = (expression, setters) => {
    if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && ts.isIdentifier(expression.expression.expression) && expression.expression.expression.text === "console" && expression.expression.name.text === "log" && expression.arguments.length === 2 && ts.isStringLiteral(expression.arguments[0]) && ts.isIdentifier(expression.arguments[1]) && [...setters.values()].includes(expression.arguments[1].text)) {
      return { operation: "log", state: expression.arguments[1].text, value: expression.arguments[0].text }
    }
    if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression) || expression.arguments.length !== 1) return undefined
    const state = setters.get(expression.expression.text)
    if (!state) return undefined
    const value = expression.arguments[0]
    if (ts.isBinaryExpression(value) && ts.isIdentifier(value.left) && value.left.text === state) return addCommand(state, value)
    if (ts.isArrowFunction(value) && value.parameters.length === 1 && ts.isIdentifier(value.parameters[0].name) && ts.isBinaryExpression(value.body) && ts.isIdentifier(value.body.left) && value.body.left.text === value.parameters[0].name.text) return addCommand(state, value.body)
    if (isPrimitiveLiteral(value)) {
      const literal = primitiveValue(value)
      return literal ? { operation: "set", state, ...literal } : undefined
    }
  }
  specialize.handler = (handler, setters, bindingIndex) => specializeHandler(handler, setters, bindingIndex, specialize)
  return specialize
}

function specializeHandler(handler, setters, bindingIndex, specialize) {
  const statements = ts.isBlock(handler.body) ? handler.body.statements.filter(statement => !ts.isEmptyStatement(statement)) : []
  if (statements.length === 2) {
    const command = aliasCommand(statements, handler, setters, bindingIndex) ?? helperCommand(statements, handler, setters, bindingIndex, specialize)
    if (command) return [command]
  }
  rejectUnsafe(statements, handler, setters, bindingIndex)
}

function aliasCommand([first, second], boundary, setters, bindingIndex) {
  const declaration = oneDeclaration(first)
  if (!declaration || !(first.declarationList.flags & ts.NodeFlags.Const) || !declaration.initializer || !ts.isExpressionStatement(second)) return undefined
  const value = stateAdd(declaration.initializer, boundary, setters, bindingIndex)
  const call = second.expression
  if (!value || !directCall(call) || call.arguments.length !== 1 || !ts.isIdentifier(call.arguments[0])) return undefined
  const state = setters.get(call.expression.text)
  if (state !== value.state || !captured(call.expression, boundary, call.expression.text, bindingIndex) || !declaredBy(call.arguments[0], declaration.name, boundary, bindingIndex) || refs(boundary, declaration.name, boundary, bindingIndex).length !== 1) return undefined
  return { operation: "add", state, ...value.operand }
}

function helperCommand([first, second], boundary, setters, bindingIndex, specialize) {
  if (!ts.isExpressionStatement(second) || !directCall(second.expression)) return undefined
  const call = second.expression
  let name
  let command
  const declaration = oneDeclaration(first)
  if (declaration && first.declarationList.flags & ts.NodeFlags.Const && declaration.initializer && ts.isArrowFunction(declaration.initializer) && !declaration.initializer.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) && !declaration.initializer.parameters.length && !ts.isBlock(declaration.initializer.body) && !call.arguments.length) {
    name = declaration.name
    command = safeDirect(declaration.initializer.body, boundary, setters, bindingIndex, specialize)
  } else if (ts.isFunctionDeclaration(first) && first.name && first.body && !first.asteriskToken && !first.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) && first.parameters.length === 1 && first.body.statements.length === 1 && ts.isExpressionStatement(first.body.statements[0]) && call.arguments.length === 1 && ts.isIdentifier(call.arguments[0])) {
    const parameter = first.parameters[0]
    if (!ts.isIdentifier(parameter.name) || parameter.initializer || parameter.dotDotDotToken) return undefined
    name = first.name
    command = parameterCommand(first.body.statements[0].expression, parameter.name, first, call.arguments[0], boundary, setters, bindingIndex)
  }
  if (!name || !command || call.expression.text !== name.text || !declaredBy(call.expression, name, boundary, bindingIndex) || refs(boundary, name, boundary, bindingIndex).length !== 1) return undefined
  return command
}

function safeDirect(expression, boundary, setters, bindingIndex, specialize) {
  const command = specialize(expression, setters)
  if (!command || command.operation === "log") return undefined
  if (!captured(expression.expression, boundary, expression.expression.text, bindingIndex)) return undefined
  const value = expression.arguments[0]
  return !ts.isBinaryExpression(value) || captured(value.left, boundary, command.state, bindingIndex) ? command : undefined
}

function parameterCommand(expression, parameter, helper, argument, boundary, setters, bindingIndex) {
  if (!directCall(expression) || expression.arguments.length !== 1 || !ts.isBinaryExpression(expression.arguments[0])) return undefined
  const state = setters.get(expression.expression.text)
  const value = expression.arguments[0]
  if (!state || !captured(expression.expression, boundary, expression.expression.text, bindingIndex) || !ts.isIdentifier(value.left) || !declaredBy(value.left, parameter, helper, bindingIndex) || !captured(argument, boundary, state, bindingIndex)) return undefined
  const operand = addOperand(value)
  return operand ? { operation: "add", state, ...operand } : undefined
}

function rejectUnsafe(statements, boundary, setters, bindingIndex) {
  if (!bindingIndex) return
  for (const statement of statements) {
    const declaration = oneDeclaration(statement)
    if (declaration?.initializer && ts.isObjectLiteralExpression(declaration.initializer) && containsSetter(declaration.initializer, boundary, setters, bindingIndex)) {
      const use = refs(boundary, declaration.name, boundary, bindingIndex).find(dynamic)
      if (use) fail(use, "Semantic state helpers do not support dynamic dispatch")
    }
    if (declaration?.initializer && stateAdd(declaration.initializer, boundary, setters, bindingIndex)) {
      const use = setterAliasUse(boundary, declaration.name, setters, bindingIndex)
      if (!use) continue
      const uses = refs(boundary, declaration.name, boundary, bindingIndex)
      if (!(statement.declarationList.flags & ts.NodeFlags.Const) || uses.some(mutated)) fail(declaration.name, "Semantic state aliases must remain immutable")
      fail(uses.find(reference => reference !== use) ?? use, "Semantic state aliases must be passed directly to one setter and cannot escape")
    }
    const helper = helperDeclaration(statement, boundary, setters, bindingIndex)
    if (!helper) continue
    const uses = refs(boundary, helper.name, boundary, bindingIndex)
    if (uses.some(reference => isNodeWithin(reference, helper.body))) fail(helper.name, "Semantic state helpers cannot be recursive")
    if (helper.mutable || uses.some(mutated)) fail(helper.name, "Semantic state helpers must remain immutable")
    if (uses.some(dynamic)) fail(uses.find(dynamic), "Semantic state helpers do not support dynamic dispatch")
    if (uses.length !== 1 || !directIdentifierCall(uses[0])) fail(uses.find(reference => !directIdentifierCall(reference)) ?? helper.name, "Semantic state helpers must be called exactly once and cannot escape")
    fail(helper.body, "Semantic state helpers must contain one synchronous state operation")
  }
}

function helperDeclaration(statement, boundary, setters, bindingIndex) {
  const declaration = oneDeclaration(statement)
  if (declaration?.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) && containsSetter(declaration.initializer, boundary, setters, bindingIndex)) return { name: declaration.name, body: declaration.initializer, mutable: !(statement.declarationList.flags & ts.NodeFlags.Const) }
  if (ts.isFunctionDeclaration(statement) && statement.name && statement.body && containsSetter(statement.body, boundary, setters, bindingIndex)) return { name: statement.name, body: statement.body, mutable: false }
}

function stateAdd(expression, boundary, setters, bindingIndex) {
  if (!ts.isBinaryExpression(expression) || !ts.isIdentifier(expression.left) || ![...setters.values()].includes(expression.left.text) || !captured(expression.left, boundary, expression.left.text, bindingIndex)) return undefined
  const operand = addOperand(expression)
  return operand ? { state: expression.left.text, operand } : undefined
}

function addCommand(state, expression) {
  const operand = addOperand(expression)
  return operand ? { operation: "add", state, ...operand } : undefined
}

function addOperand(expression) {
  if (!ts.isBinaryExpression(expression) || !ts.isNumericLiteral(expression.right) || ![ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(expression.operatorToken.kind)) return undefined
  return signedNumber(expression.right, expression.operatorToken.kind === ts.SyntaxKind.MinusToken ? "negative" : undefined)
}

function oneDeclaration(statement) {
  if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) return undefined
  const declaration = statement.declarationList.declarations[0]
  return ts.isIdentifier(declaration.name) ? declaration : undefined
}

function directCall(node) {
  return ts.isCallExpression(node) && !node.questionDotToken && ts.isIdentifier(node.expression)
}

function captured(identifier, boundary, name, bindingIndex) {
  if (!ts.isIdentifier(identifier)) return false
  const resolution = bindingIndex?.resolveReference(identifier, boundary)
  return !resolution ? identifier.text === name : resolution.debugName === name && ["capture", "unresolved"].includes(resolution.kind)
}

function declaredBy(identifier, declaration, boundary, bindingIndex) {
  const resolution = bindingIndex?.resolveReference(identifier, boundary)
  return bindingIndex ? resolution?.declaration === declaration : identifier.text === declaration.text
}

function refs(root, declaration, boundary, bindingIndex) {
  const found = []
  const visit = node => {
    if (ts.isIdentifier(node) && declaredBy(node, declaration, boundary, bindingIndex)) found.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function containsSetter(root, boundary, setters, bindingIndex) {
  let found = false
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && captured(node.expression, boundary, node.expression.text, bindingIndex)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function setterAliasUse(root, declaration, setters, bindingIndex) {
  let found
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && ts.isIdentifier(node.arguments[0]) && declaredBy(node.arguments[0], declaration, root, bindingIndex)) found = node.arguments[0]
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function directIdentifierCall(identifier) {
  return ts.isCallExpression(identifier.parent) && identifier.parent.expression === identifier && !identifier.parent.questionDotToken
}

function dynamic(identifier) {
  if (ts.isCallExpression(identifier.parent) && identifier.parent.expression === identifier) return Boolean(identifier.parent.questionDotToken)
  for (let current = identifier.parent; current && !ts.isStatement(current); current = current.parent) if (ts.isCallExpression(current)) return true
  return false
}

function mutated(identifier) {
  const parent = identifier.parent
  return ts.isPrefixUnaryExpression(parent) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(parent.operator) || ts.isPostfixUnaryExpression(parent) || ts.isBinaryExpression(parent) && parent.left === identifier && parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
}

function fail(node, message) {
  throw sourceNodeError(node, node.getSourceFile(), message)
}

function primitiveValue(node) {
  if (ts.isStringLiteral(node)) return { value: node.text }
  if (ts.isNumericLiteral(node)) return signedNumber(node)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true }
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false }
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null }
  return signedNumber(node.operand, node.operator === ts.SyntaxKind.MinusToken ? "negative" : "positive")
}

function signedNumber(node, syntax) {
  const number = Number(node.text)
  if (!Number.isFinite(number)) return undefined
  if (syntax === "negative") return number === 0 ? { value: 0, syntax } : { value: -number }
  return syntax ? { value: number, syntax } : { value: number }
}
