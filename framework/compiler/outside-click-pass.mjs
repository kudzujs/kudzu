import ts from "typescript"
import { isUnshadowedGlobal, unwrapExpression } from "./ast-helpers.mjs"

const valueName = "__kOutsideClickValue"

export function analyzeOutsideClickHook(hook) {
  if (!hook || hook.asteriskToken || hook.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(hook.body) || hook.body.statements.length !== 1) return undefined
  if (!frameworkImport(hook.getSourceFile(), "useEffect")) return undefined
  const normalized = hook.parameters.length === 3 && ts.isIdentifier(hook.parameters[2].name) && hook.parameters[2].name.text === valueName
  if (!normalized && hook.parameters.length !== 2) return undefined
  const [refParameter, callbackParameter] = hook.parameters
  if (!ts.isIdentifier(refParameter?.name) || refParameter.initializer || refParameter.dotDotDotToken || !ts.isIdentifier(callbackParameter?.name) || callbackParameter.initializer || callbackParameter.dotDotDotToken) return undefined
  const statement = hook.body.statements[0]
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression) || !ts.isIdentifier(statement.expression.expression) || statement.expression.expression.text !== "useEffect" || statement.expression.arguments.length !== 2) return undefined
  const [setup, dependencies] = statement.expression.arguments
  if ((!ts.isArrowFunction(setup) && !ts.isFunctionExpression(setup)) || setup.parameters.length || setup.asteriskToken || setup.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(setup.body) || setup.body.statements.length !== 3 || !ts.isArrayLiteralExpression(dependencies)) return undefined
  const sourceDependencies = dependencies.elements.length === 2 && ts.isIdentifier(dependencies.elements[0]) && dependencies.elements[0].text === refParameter.name.text && ts.isIdentifier(dependencies.elements[1]) && dependencies.elements[1].text === callbackParameter.name.text
  if (normalized ? dependencies.elements.length !== 0 : !sourceDependencies) return undefined
  const [handlerStatement, addStatement, cleanupStatement] = setup.body.statements
  if (!ts.isFunctionDeclaration(handlerStatement) || handlerStatement.asteriskToken || handlerStatement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !handlerStatement.name || handlerStatement.parameters.length !== 1 || !ts.isIdentifier(handlerStatement.parameters[0].name) || !handlerStatement.body || handlerStatement.body.statements.length !== 1) return undefined
  const event = handlerStatement.parameters[0].name.text
  const condition = handlerStatement.body.statements[0]
  if (!ts.isIfStatement(condition) || condition.elseStatement || !ts.isBlock(condition.thenStatement) || condition.thenStatement.statements.length !== 1 || !outsideCondition(condition.expression, refParameter.name.text, event)) return undefined
  const callbackStatement = condition.thenStatement.statements[0]
  if (!ts.isExpressionStatement(callbackStatement) || !ts.isCallExpression(callbackStatement.expression) || !ts.isIdentifier(callbackStatement.expression.expression) || callbackStatement.expression.expression.text !== callbackParameter.name.text) return undefined
  if (normalized ? callbackStatement.expression.arguments.length !== 1 || !ts.isIdentifier(callbackStatement.expression.arguments[0]) || callbackStatement.expression.arguments[0].text !== valueName : callbackStatement.expression.arguments.length) return undefined
  if (!listenerStatement(addStatement, "addEventListener", handlerStatement.name.text, hook.getSourceFile())) return undefined
  const cleanup = ts.isReturnStatement(cleanupStatement) && cleanupStatement.expression && (ts.isArrowFunction(cleanupStatement.expression) || ts.isFunctionExpression(cleanupStatement.expression)) ? cleanupStatement.expression : undefined
  const cleanupBody = cleanup && ts.isBlock(cleanup.body) && cleanup.body.statements.length === 1 ? cleanup.body.statements[0] : undefined
  if (!cleanup || cleanup.parameters.length || cleanup.asteriskToken || cleanup.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !listenerStatement(cleanupBody, "removeEventListener", handlerStatement.name.text, hook.getSourceFile())) return undefined
  return { callbackCall: callbackStatement.expression, dependencies, normalized, valueName }
}

export function normalizeOutsideClickHooks(sourceFile, factory, context) {
  const visitor = node => {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const hook = analyzeOutsideClickHook(node)
      if (hook && !hook.normalized) {
        const rewrite = current => {
          if (current === hook.callbackCall) return factory.updateCallExpression(current, current.expression, current.typeArguments, [factory.createIdentifier(valueName)])
          if (current === hook.dependencies) return factory.updateArrayLiteralExpression(current, [])
          return ts.visitEachChild(current, rewrite, context)
        }
        return updateFunction(node, [...node.parameters, factory.createParameterDeclaration(undefined, undefined, valueName)], ts.visitEachChild(node.body, rewrite, context), factory)
      }
    }
    return ts.visitEachChild(node, visitor, context)
  }
  return ts.visitNode(sourceFile, visitor)
}

function updateFunction(node, parameters, body, factory) {
  if (ts.isFunctionDeclaration(node)) return factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, parameters, node.type, body)
  if (ts.isFunctionExpression(node)) return factory.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, parameters, node.type, body)
  return factory.updateArrowFunction(node, node.modifiers, node.typeParameters, parameters, node.type, node.equalsGreaterThanToken, body)
}

function outsideCondition(node, ref, event) {
  node = unwrapExpression(node)
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken || !currentAccess(unwrapExpression(node.left), ref)) return false
  const right = unwrapExpression(node.right)
  if (!ts.isPrefixUnaryExpression(right) || right.operator !== ts.SyntaxKind.ExclamationToken) return false
  const contains = unwrapExpression(right.operand)
  return ts.isCallExpression(contains) && contains.arguments.length === 1 && ts.isPropertyAccessExpression(contains.expression) && contains.expression.name.text === "contains" && currentAccess(unwrapExpression(contains.expression.expression), ref) && ts.isPropertyAccessExpression(unwrapExpression(contains.arguments[0])) && ts.isIdentifier(unwrapExpression(contains.arguments[0]).expression) && unwrapExpression(contains.arguments[0]).expression.text === event && unwrapExpression(contains.arguments[0]).name.text === "target"
}

function currentAccess(node, ref) {
  return ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === ref && node.name.text === "current"
}

function listenerStatement(statement, method, handler, sourceFile) {
  if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression) || statement.expression.arguments.length !== 2 || !ts.isStringLiteral(statement.expression.arguments[0]) || statement.expression.arguments[0].text !== "mousedown" || !ts.isIdentifier(statement.expression.arguments[1]) || statement.expression.arguments[1].text !== handler || !ts.isPropertyAccessExpression(statement.expression.expression)) return false
  const target = statement.expression.expression.expression
  return ts.isIdentifier(target) && target.text === "document" && isUnshadowedGlobal(target, sourceFile) && statement.expression.expression.name.text === method
}

function frameworkImport(sourceFile, name) {
  return sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.isTypeOnly && !entry.propertyName && entry.name.text === name))
}
