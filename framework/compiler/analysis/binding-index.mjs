import ts from "typescript"

export const knownGlobalNames = new Set([
  "Array", "ArrayBuffer", "BigInt", "Blob", "Boolean", "Date", "Error", "Event", "FileReader", "FormData", "Infinity", "IntersectionObserver", "Intl", "JSON", "Map", "Math", "NaN", "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set", "String", "Symbol", "TypeError", "URL", "URLSearchParams", "WeakMap", "WeakSet", "WebSocket", "Worker", "alert", "atob", "btoa", "cancelAnimationFrame", "clearInterval", "clearTimeout", "console", "crypto", "document", "fetch", "globalThis", "history", "isFinite", "isNaN", "localStorage", "location", "navigator", "parseFloat", "parseInt", "performance", "queueMicrotask", "requestAnimationFrame", "setInterval", "setTimeout", "structuredClone", "undefined", "window"
])

export function createBindingIndex(sourceFile) {
  const scopeByNode = new WeakMap()
  const referenceBindings = new WeakMap()
  const originalReferenceBindings = new WeakMap()
  const bindings = []
  const rootScope = createScope(undefined, sourceFile, "module")
  const pseudoBindings = new Map()

  collect(sourceFile, rootScope)
  resolveReferences(sourceFile)

  function createScope(parent, node, kind) {
    return { parent, node, kind, bindings: new Map() }
  }

  function mark(node, scope) {
    scopeByNode.set(node, scope)
  }

  function declare(identifier, scope, declarationKind) {
    mark(identifier, scope)
    let binding = scope.bindings.get(identifier.text)
    if (!binding) {
      binding = { slot: bindings.length, debugName: identifier.text, declarationKind, declaration: identifier }
      bindings.push(binding)
      scope.bindings.set(identifier.text, binding)
    }
    return binding
  }

  function declareName(name, scope, declarationKind) {
    mark(name, scope)
    if (ts.isIdentifier(name)) {
      declare(name, scope, declarationKind)
      return
    }
    for (const element of name.elements) if (ts.isBindingElement(element)) declareName(element.name, scope, declarationKind)
  }

  function collectBindingExpressions(name, scope) {
    if (ts.isIdentifier(name)) return
    for (const element of name.elements) if (ts.isBindingElement(element)) {
      if (element.propertyName && ts.isComputedPropertyName(element.propertyName)) collect(element.propertyName.expression, scope)
      if (element.initializer) collect(element.initializer, scope)
      collectBindingExpressions(element.name, scope)
    }
  }

  function nearestVarScope(scope) {
    for (let current = scope; current; current = current.parent) if (["function", "module"].includes(current.kind)) return current
    return rootScope
  }

  function collectFunction(node, scope) {
    if (ts.isFunctionDeclaration(node) && node.name) declare(node.name, scope, "function")
    const parameterScope = createScope(scope, node, "parameters")
    const functionScope = createScope(parameterScope, node.body ?? node, "function")
    mark(node, parameterScope)
    if (ts.isFunctionExpression(node) && node.name) declare(node.name, parameterScope, "function-name")
    for (const parameter of node.parameters) {
      mark(parameter, parameterScope)
      declareName(parameter.name, parameterScope, "parameter")
      collectBindingExpressions(parameter.name, parameterScope)
      if (parameter.initializer) collect(parameter.initializer, parameterScope)
    }
    if (node.body) collect(node.body, functionScope)
  }

  function collectClass(node, scope) {
    if (ts.isClassDeclaration(node) && node.name) declare(node.name, scope, "class")
    const classScope = createScope(scope, node, "class")
    mark(node, classScope)
    if (ts.isClassExpression(node) && node.name) declare(node.name, classScope, "class-name")
    for (const heritage of node.heritageClauses ?? []) for (const type of heritage.types) collect(type.expression, classScope)
    for (const member of node.members) collect(member, classScope)
  }

  function collectLoop(node, scope) {
    const loopScope = createScope(scope, node, "block")
    mark(node, loopScope)
    if (node.initializer) collect(node.initializer, loopScope)
    if (ts.isForStatement(node)) {
      if (node.condition) collect(node.condition, loopScope)
      if (node.incrementor) collect(node.incrementor, loopScope)
    } else collect(node.expression, loopScope)
    collect(node.statement, loopScope)
  }

  function collect(node, scope) {
    mark(node, scope)
    if (ts.isTypeNode(node)) return
    if (ts.isSourceFile(node)) {
      for (const statement of node.statements) collect(statement, scope)
      return
    }
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause
      if (!clause || clause.isTypeOnly) return
      if (clause.name) declare(clause.name, scope, "import-default")
      if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) declare(clause.namedBindings.name, scope, "import-namespace")
      if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const element of clause.namedBindings.elements) if (!element.isTypeOnly) declare(element.name, scope, "import-named")
      return
    }
    if (ts.isImportEqualsDeclaration(node)) {
      if (!node.isTypeOnly) declare(node.name, scope, "import-equals")
      return
    }
    if (isFunctionLike(node)) {
      if (node.name && ts.isComputedPropertyName(node.name)) collect(node.name.expression, scope)
      collectFunction(node, scope)
      return
    }
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      collectClass(node, scope)
      return
    }
    if (ts.isBlock(node)) {
      const blockScope = createScope(scope, node, "block")
      mark(node, blockScope)
      for (const statement of node.statements) collect(statement, blockScope)
      return
    }
    if (ts.isCaseBlock(node)) {
      const caseScope = createScope(scope, node, "block")
      mark(node, caseScope)
      for (const clause of node.clauses) collect(clause, caseScope)
      return
    }
    if (ts.isCatchClause(node)) {
      const catchScope = createScope(scope, node, "block")
      mark(node, catchScope)
      if (node.variableDeclaration) {
        declareName(node.variableDeclaration.name, catchScope, "catch")
        collectBindingExpressions(node.variableDeclaration.name, catchScope)
      }
      collect(node.block, catchScope)
      return
    }
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
      collectLoop(node, scope)
      return
    }
    if (ts.isVariableDeclaration(node)) {
      const list = node.parent
      const declarationKind = ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) ? "const" : ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Let) ? "let" : "var"
      const declarationScope = declarationKind === "var" ? nearestVarScope(scope) : scope
      declareName(node.name, declarationScope, declarationKind)
      collectBindingExpressions(node.name, scope)
      if (node.initializer) collect(node.initializer, scope)
      return
    }
    if (ts.isEnumDeclaration(node)) declare(node.name, scope, "enum")
    if (ts.isModuleDeclaration(node) && ts.isIdentifier(node.name)) {
      declare(node.name, scope, "namespace")
      const moduleScope = createScope(scope, node, "module")
      if (node.body && ts.isModuleBlock(node.body)) {
        mark(node.body, moduleScope)
        for (const statement of node.body.statements) collect(statement, moduleScope)
      } else if (node.body) collect(node.body, moduleScope)
      return
    }
    ts.forEachChild(node, child => collect(child, scope))
  }

  function lexicalBinding(scope, name) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(name)
      if (binding) return binding
    }
  }

  function pseudoBinding(kind, name) {
    const key = `${kind}:${name}`
    let binding = pseudoBindings.get(key)
    if (!binding) {
      binding = { slot: bindings.length, debugName: name, declarationKind: kind }
      bindings.push(binding)
      pseudoBindings.set(key, binding)
    }
    return binding
  }

  function resolveReferences(node) {
    if (ts.isTypeNode(node)) return
    if (ts.isIdentifier(node) && isValueReference(node)) {
      const lexical = lexicalBinding(scopeByNode.get(node) ?? rootScope, node.text)
      const binding = lexical ?? pseudoBinding(knownGlobalNames.has(node.text) ? "global" : "unresolved", node.text)
      referenceBindings.set(node, binding)
      const original = ts.getOriginalNode(node)
      if (original !== node) originalReferenceBindings.set(original, binding)
    }
    ts.forEachChild(node, resolveReferences)
  }

  function resolveReference(identifier, boundary = sourceFile) {
    const original = ts.getOriginalNode(identifier)
    const binding = referenceBindings.get(identifier) ?? referenceBindings.get(original) ?? originalReferenceBindings.get(original)
    if (!binding) return undefined
    let kind
    if (binding.declarationKind.startsWith("import")) kind = "import"
    else if (binding.declarationKind === "global") kind = "global"
    else if (binding.declarationKind === "unresolved") kind = "unresolved"
    else if (inside(binding.declaration, ts.getOriginalNode(boundary))) kind = binding.declarationKind === "parameter" ? "parameter" : "local"
    else kind = "capture"
    return {
      kind,
      slot: binding.slot,
      debugName: binding.debugName,
      declarationKind: binding.declarationKind,
      ...(binding.declaration ? { declaration: binding.declaration, declarationRange: range(binding.declaration) } : {}),
      referenceRange: range(original)
    }
  }

  function references(root, boundary = root) {
    const found = []
    let complete = true
    const visit = node => {
      if (ts.isTypeNode(node)) return
      if (ts.isIdentifier(node) && isValueReference(node)) {
        const resolution = resolveReference(node, boundary)
        if (resolution) found.push(resolution)
        else complete = false
      }
      ts.forEachChild(node, visit)
    }
    visit(root)
    return complete ? found : undefined
  }

  return { bindings: () => bindings.map(({ declaration, ...binding }) => ({ ...binding, ...(declaration ? { declarationRange: range(declaration) } : {}) })), references, resolveReference }
}

function inside(node, boundary) {
  for (let current = node; current; current = current.parent) if (current === boundary) return true
  return false
}

function range(node) {
  return node.pos >= 0 && node.end >= 0 ? { start: node.getStart(), end: node.end } : undefined
}

function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) || ts.isConstructorDeclaration(node)
}

function isValueReference(node) {
  const parent = node.parent
  if (!parent) return true
  if (ts.isTypeNode(parent)) return false
  if ((ts.isPropertyAccessExpression(parent) && parent.name === node)
    || (ts.isPropertyAssignment(parent) && parent.name === node)
    || ((ts.isMethodDeclaration(parent) || ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent) || ts.isPropertyDeclaration(parent) || ts.isPropertySignature(parent) || ts.isMethodSignature(parent)) && parent.name === node)
    || (ts.isVariableDeclaration(parent) && parent.name === node)
    || (ts.isParameter(parent) && parent.name === node)
    || ((ts.isFunctionDeclaration(parent) || ts.isFunctionExpression(parent) || ts.isClassDeclaration(parent) || ts.isClassExpression(parent) || ts.isEnumDeclaration(parent) || ts.isModuleDeclaration(parent)) && parent.name === node)
    || (ts.isJsxAttribute(parent) && parent.name === node)
    || (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node))
    || ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isNamespaceImport(parent) || ts.isImportEqualsDeclaration(parent)
    || ts.isExportSpecifier(parent)
    || ts.isLabeledStatement(parent) || ts.isBreakStatement(parent) || ts.isContinueStatement(parent)
    || (ts.isEnumMember(parent) && parent.name === node)) return false
  if ((ts.isTypeAliasDeclaration(parent) || ts.isInterfaceDeclaration(parent)) && parent.name === node) return false
  if (ts.isJsxClosingElement(parent) && parent.tagName === node) return false
  if ((ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)) && parent.tagName === node) return node.text[0] === node.text[0].toUpperCase()
  return true
}
