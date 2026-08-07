import ts from "typescript"

export function importDeclarationNames(statement) {
  const names = []
  if (statement.importClause?.name) names.push(statement.importClause.name.text)
  const bindings = statement.importClause?.namedBindings
  if (bindings && ts.isNamespaceImport(bindings)) names.push(bindings.name.text)
  if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) names.push(entry.name.text)
  return names
}

export function referenceIdentifiers(root, name) {
  const references = []
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && !isShadowedIdentifier(node, root)) references.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return references
}

export function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) || ts.isConstructorDeclaration(node)
}

export function containsJsx(root) {
  let found = false
  const visit = node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

export function referencesIdentifier(root, name) {
  let found = false
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

export function unwrapExpression(node) {
  return ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node) ? unwrapExpression(node.expression) : node
}

export function isLocalConst(node) {
  const list = node.parent
  const statement = list?.parent
  return ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0 && ts.isVariableStatement(statement)
}

export function isUnshadowedGlobal(identifier, sourceFile) {
  if (isShadowedIdentifier(identifier, sourceFile)) return false
  return !sourceFile.statements.some(statement => {
    if (statementDeclaresName(statement, identifier.text)) return true
    if (!ts.isImportDeclaration(statement) || !statement.importClause) return false
    const clause = statement.importClause
    if (clause.name?.text === identifier.text) return true
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) return clause.namedBindings.name.text === identifier.text
    return clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.some(entry => entry.name.text === identifier.text) : false
  })
}

export function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text]
  return name.elements.flatMap(element => ts.isBindingElement(element) ? bindingNames(element.name) : [])
}

export function isReferenceIdentifier(node) {
  const parent = node.parent
  if (!parent) return true
  if ((ts.isPropertyAccessExpression(parent) && parent.name === node) ||
      (ts.isPropertyAssignment(parent) && parent.name === node) ||
      (ts.isMethodDeclaration(parent) && parent.name === node) ||
      ((ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent)) && parent.name === node) ||
      (ts.isVariableDeclaration(parent) && parent.name === node) ||
      (ts.isParameter(parent) && parent.name === node) ||
      (ts.isFunctionDeclaration(parent) && parent.name === node) ||
      (ts.isJsxAttribute(parent) && parent.name === node) ||
      (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) ||
      ts.isImportSpecifier(parent) || ts.isImportClause(parent)) return false
  return true
}

export function nearestFunction(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current) || ts.isArrowFunction(current)) return current
  }
  return undefined
}

export function nearestFunctionLike(node) {
  for (let current = node.parent; current; current = current.parent) if (isFunctionLike(current)) return current
  return undefined
}

export function isShadowedByParameter(node, scopeRoot) {
  for (let current = node.parent; current; current = current.parent) {
    if (isFunctionLike(current) && current.parameters.some(parameter => bindingNames(parameter.name).includes(node.text))) return true
    if (current === scopeRoot) break
  }
  return false
}

export function isShadowedIdentifier(node, scopeRoot) {
  if (isShadowedByParameter(node, scopeRoot)) return true
  if (node === scopeRoot) return false
  if (isFunctionLike(scopeRoot) && scopeRoot.name?.text === node.text) return true
  if (isFunctionLike(scopeRoot) && functionVarDeclaresName(scopeRoot, node.text)) return true
  for (let current = node.parent; current; current = current.parent) {
    if (current === scopeRoot) break
    if (ts.isFunctionExpression(current) && current.name?.text === node.text) return true
    if (ts.isBlock(current) && current.statements.some(statement => statementDeclaresName(statement, node.text))) return true
    if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statementDeclaresName(statement, node.text)))) return true
    if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(node.text)) return true
    if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, node.text)) return true
    if (isFunctionLike(current) && functionVarDeclaresName(current, node.text)) return true
  }
  return false
}

export function statementDeclaresName(statement, name) {
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.some(declaration => bindingNames(declaration.name).includes(name))
  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) return statement.name?.text === name
  if ((ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) && !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword)) return ts.isIdentifier(statement.name) && statement.name.text === name
  return false
}

export function loopDeclaresName(loop, name) {
  const declaration = ts.isForStatement(loop) ? loop.initializer : loop.initializer
  return declaration && ts.isVariableDeclarationList(declaration) && declaration.declarations.some(entry => bindingNames(entry.name).includes(name))
}

export function functionVarDeclaresName(fn, name) {
  let found = false
  const visit = node => {
    if (found || node !== fn.body && isFunctionLike(node)) return
    if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0 && node.declarations.some(entry => bindingNames(entry.name).includes(name))) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  if (fn.body) visit(fn.body)
  return found
}

export function sourceNodeError(node, fallbackSource, message) {
  const original = ts.getOriginalNode(node)
  const sourceFile = original.getSourceFile?.()?.fileName ? original.getSourceFile() : fallbackSource
  const position = sourceFile.getLineAndCharacterOfPosition(original.getStart(sourceFile))
  return new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${message}`)
}

export function sourceLocation(node, fallbackSource) {
  const original = ts.getOriginalNode(node)
  const sourceFile = original.getSourceFile?.()?.fileName ? original.getSourceFile() : fallbackSource
  const position = sourceFile.getLineAndCharacterOfPosition(original.getStart(sourceFile))
  return `${sourceFile.fileName}:${position.line + 1}:${position.character + 1}`
}

export function effectReturns(callback) {
  let cleanup = false
  let invalid
  const cleanups = []
  const visit = node => {
    if (invalid || node !== callback.body && isFunctionLike(node)) return
    if (ts.isReturnStatement(node) && node.expression) {
      const expression = unwrapExpression(node.expression)
      if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
        cleanup = true
        cleanups.push(expression)
      }
      else invalid = node
    }
    if (!invalid) ts.forEachChild(node, visit)
  }
  visit(callback.body)
  return { cleanup, cleanups, invalid }
}
