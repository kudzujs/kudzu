import ts from "typescript"
import { isFunctionLike } from "./ast-helpers.mjs"

export function normalizeRenderControlFlow(sourceFile, factory, context) {
  const normalizeStatements = statements => {
    const nested = statements.map(statement => ts.visitEachChild(statement, visitNested, context))
    const assigned = []
    for (let index = 0; index < nested.length; index++) {
      const statement = nested[index]
      const next = nested[index + 1]
      const declaration = singleUninitializedLet(statement)
      const assignment = declaration && next && assignmentConditional(next, declaration.name.text, factory)
      if (declaration && assignment) {
        const updated = factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, assignment)
        const list = factory.createVariableDeclarationList([updated], ts.NodeFlags.Const)
        assigned.push(factory.updateVariableStatement(statement, statement.modifiers, list))
        index++
      } else {
        assigned.push(statement)
      }
    }

    if (!assigned.length) return assigned
    const finalIf = returnConditional(assigned.at(-1), factory)
    if (finalIf) return [...assigned.slice(0, -1), factory.createReturnStatement(finalIf)]
    if (!ts.isReturnStatement(assigned.at(-1)) || !assigned.at(-1).expression) return assigned
    let expression = assigned.at(-1).expression
    let start = assigned.length - 1
    while (start > 0) {
      const previous = assigned[start - 1]
      if (!ts.isIfStatement(previous) || previous.elseStatement) break
      const truthy = returnOnlyExpression(previous.thenStatement)
      if (!truthy) break
      expression = factory.createConditionalExpression(previous.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), expression)
      start--
    }
    return start === assigned.length - 1 ? assigned : [...assigned.slice(0, start), factory.createReturnStatement(expression)]
  }

  const visitNested = node => {
    if (ts.isBlock(node)) return factory.updateBlock(node, normalizeStatements([...node.statements]))
    if (isFunctionLike(node) && ts.isBlock(node.body)) {
      if (!isRenderFunction(node)) return node
      const body = factory.updateBlock(node.body, normalizeStatements([...node.body.statements]))
      if (ts.isFunctionDeclaration(node)) return factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body)
      if (ts.isFunctionExpression(node)) return factory.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body)
      if (ts.isArrowFunction(node)) return factory.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, body)
    }
    return ts.visitEachChild(node, visitNested, context)
  }

  return ts.visitEachChild(sourceFile, visitNested, context)
}

function isRenderFunction(node) {
  if (ts.isFunctionDeclaration(node)) return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) || Boolean(node.name && /^[A-Z]/.test(node.name.text))
  const declaration = node.parent
  return ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name) && /^[A-Z]/.test(declaration.name.text)
}

function singleUninitializedLet(statement) {
  if (!ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Let) === 0 || statement.declarationList.declarations.length !== 1) return undefined
  const declaration = statement.declarationList.declarations[0]
  return ts.isIdentifier(declaration.name) && !declaration.initializer ? declaration : undefined
}

function assignmentConditional(statement, name, factory) {
  if (!ts.isIfStatement(statement) || !statement.elseStatement) return undefined
  const truthy = assignmentOnlyExpression(statement.thenStatement, name)
  const falsy = ts.isIfStatement(statement.elseStatement)
    ? assignmentConditional(statement.elseStatement, name, factory)
    : assignmentOnlyExpression(statement.elseStatement, name)
  if (!truthy || !falsy) return undefined
  return factory.createConditionalExpression(statement.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), falsy)
}

function assignmentOnlyExpression(statement, name) {
  const candidate = ts.isBlock(statement) && statement.statements.length === 1 ? statement.statements[0] : statement
  if (!ts.isExpressionStatement(candidate) || !ts.isBinaryExpression(candidate.expression) || candidate.expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !ts.isIdentifier(candidate.expression.left) || candidate.expression.left.text !== name) return undefined
  return candidate.expression.right
}

function returnConditional(statement, factory) {
  if (!ts.isIfStatement(statement) || !statement.elseStatement) return undefined
  const truthy = returnOnlyExpression(statement.thenStatement)
  const falsy = ts.isIfStatement(statement.elseStatement)
    ? returnConditional(statement.elseStatement, factory)
    : returnOnlyExpression(statement.elseStatement)
  if (!truthy || !falsy) return undefined
  return factory.createConditionalExpression(statement.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), falsy)
}

function returnOnlyExpression(statement) {
  const candidate = ts.isBlock(statement) && statement.statements.length === 1 ? statement.statements[0] : statement
  return ts.isReturnStatement(candidate) && candidate.expression ? candidate.expression : undefined
}
