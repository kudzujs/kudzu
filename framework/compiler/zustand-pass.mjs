import { relative, sep } from "node:path"
import ts from "typescript"
import { isReferenceIdentifier, isShadowedIdentifier, nearestFunction, sourceNodeError, unwrapExpression } from "./ast-helpers.mjs"

export function createZustandPass({ isSerializableStateLiteral, nativeCaptureNames, sourceDirectory }) {
  function analyzeZustandStores(sourceFile) {
    const createNames = new Set()
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "zustand") continue
      const bindings = statement.importClause?.namedBindings
      if (statement.importClause?.name || !bindings || !ts.isNamedImports(bindings)) throw sourceNodeError(statement, sourceFile, "Zustand migration input requires a named create import")
      for (const entry of bindings.elements) {
        if (entry.isTypeOnly) continue
        if ((entry.propertyName ?? entry.name).text !== "create") throw sourceNodeError(entry, sourceFile, "Only Zustand create is supported")
        createNames.add(entry.name.text)
      }
    }
    const stores = new Map()
    if (!createNames.size) return stores
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !ts.isCallExpression(declaration.initializer) || !ts.isIdentifier(declaration.initializer.expression) || !createNames.has(declaration.initializer.expression.text)) continue
        const callback = declaration.initializer.arguments[0]
        if (declaration.initializer.arguments.length !== 1 || !callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) || callback.parameters.length !== 1 || !ts.isIdentifier(callback.parameters[0].name) || callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(declaration.initializer, sourceFile, "Zustand create() requires one synchronous initializer with one set parameter")
        const body = unwrapExpression(callback.body)
        if (!ts.isObjectLiteralExpression(body)) throw sourceNodeError(callback.body, sourceFile, "Zustand create() initializer must return one object literal")
        const data = []
        const actions = new Map()
        for (const property of body.properties) {
          if (!ts.isPropertyAssignment(property) || !property.name || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) throw sourceNodeError(property, sourceFile, "Zustand store entries must be ordinary properties")
          const name = property.name.text
          const value = unwrapExpression(property.initializer)
          if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) actions.set(name, value)
          else data.push({ name, value })
        }
        if (data.length !== 1 || !isSerializableStateLiteral(data[0].value)) throw sourceNodeError(body, sourceFile, "Zustand migration stores require exactly one directly serializable data property")
        if (!actions.size) throw sourceNodeError(body, sourceFile, "Zustand migration stores require at least one action")
        for (const [name, action] of actions) {
          if (action.asteriskToken || action.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(action, sourceFile, `Zustand action ${JSON.stringify(name)} must be synchronous`)
          const capture = [...nativeCaptureNames(action, new Map())].find(entry => entry !== callback.parameters[0].name.text)
          if (capture) throw sourceNodeError(action, sourceFile, `Zustand action ${JSON.stringify(name)} cannot capture ${JSON.stringify(capture)}`)
          const validateAction = node => {
            if (ts.isAwaitExpression(node) || ts.isYieldExpression(node) || ts.isNewExpression(node)) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} must be synchronous`)
            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["then", "catch", "finally"].includes(node.expression.name.text)) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} cannot schedule asynchronous updates`)
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === callback.parameters[0].name.text && !isShadowedIdentifier(node.expression, action)) {
              if (nearestFunction(node) !== action) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} must call set directly`)
              if (node.arguments.length !== 1) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} set() requires exactly one partial update`)
            }
            ts.forEachChild(node, validateAction)
          }
          validateAction(action.body)
        }
        stores.set(declaration.name.text, {
          name: declaration.name.text,
          identity: `${relative(sourceDirectory, sourceFile.fileName).replaceAll(sep, "/")}#${declaration.name.text}`,
          sourceKind: "Zustand",
          selectorExample: "state => state.quantities",
          setName: callback.parameters[0].name.text,
          field: data[0].name,
          initialValue: data[0].value,
          initialData: serializableLiteralValue(data[0].value),
          actions,
          declaration
        })
      }
    }
    const visit = node => {
      const recognized = ts.isIdentifier(node) && ts.isCallExpression(node.parent) && node.parent.expression === node && [...stores.values()].some(store => store.declaration.initializer === node.parent)
      if (ts.isIdentifier(node) && createNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !recognized) throw sourceNodeError(node, sourceFile, "Zustand create must directly initialize an exported const store")
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    return stores
  }

  function normalizeZustandMigrationSyntax(sourceFile, factory, context) {
    const stores = analyzeZustandStores(sourceFile)
    if (!stores.size) {
      const declaration = sourceFile.statements.find(statement => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "zustand" && !statement.importClause?.isTypeOnly)
      if (declaration) throw sourceNodeError(declaration, sourceFile, "Zustand create must directly initialize an exported const store")
      return sourceFile
    }
    const visitor = node => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && stores.has(node.name.text)) {
        const store = stores.get(node.name.text)
        return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, factory.createCallExpression(factory.createIdentifier("__kCreateSharedState"), undefined, [
          factory.createStringLiteral(store.identity),
          factory.createStringLiteral(store.field),
          store.initialValue,
          factory.createArrayLiteralExpression([...store.actions.keys()].map(name => factory.createStringLiteral(name))),
          factory.createStringLiteral(store.sourceKind)
        ]))
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "zustand") return undefined
      return ts.visitEachChild(node, visitor, context)
    }
    const normalized = ts.visitNode(sourceFile, visitor)
    const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier("__kCreateSharedState"))])), factory.createStringLiteral("@kudzujs/core"))
    const statements = [...normalized.statements]
    statements.splice(statements.findLastIndex(statement => ts.isImportDeclaration(statement)) + 1, 0, declaration)
    return factory.updateSourceFile(normalized, statements)
  }

  return { analyzeZustandStores, normalizeZustandMigrationSyntax }
}

function serializableLiteralValue(node) {
  const value = unwrapExpression(node)
  if (ts.isStringLiteral(value) || ts.isNumericLiteral(value)) return ts.isNumericLiteral(value) ? Number(value.text) : value.text
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false
  if (value.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isPrefixUnaryExpression(value)) return value.operator === ts.SyntaxKind.MinusToken ? -Number(value.operand.text) : Number(value.operand.text)
  if (ts.isArrayLiteralExpression(value)) return value.elements.map(serializableLiteralValue)
  return Object.fromEntries(value.properties.map(property => [property.name.text, serializableLiteralValue(property.initializer)]))
}
