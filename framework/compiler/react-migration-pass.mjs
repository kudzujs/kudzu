import ts from "typescript"
import { bindingNames, importDeclarationNames, isFunctionLike, isLocalConst, isReferenceIdentifier, isShadowedByParameter, isShadowedIdentifier, loopDeclaresName, nearestFunction, nearestFunctionLike, referenceIdentifiers, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"
import { analyzeCollectionPipeline, isArrayFromCall } from "./collection-analysis.mjs"

export function createReactMigrationPass({ cloneAst, jsxTagName }) {
  function normalizeReactMigrationSyntax(sourceFile, factory, context, importedCollections = new Set()) {
    const supported = new Set(["createContext", "useContext", "useEffect", "useId", "useReducer", "useRef", "useState"])
    const erased = new Set(["forwardRef", "memo", "useCallback", "useMemo"])
    const aliases = new Map()
    const reactObjects = new Set()
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "react") continue
      if (statement.importClause?.name) reactObjects.add(statement.importClause.name.text)
      const bindings = statement.importClause?.namedBindings
      if (bindings && ts.isNamespaceImport(bindings)) reactObjects.add(bindings.name.text)
      if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) {
        const imported = (entry.propertyName ?? entry.name).text
        if (!entry.isTypeOnly && (supported.has(imported) || erased.has(imported))) aliases.set(entry.name.text, imported)
        else if (!entry.isTypeOnly && /^use[A-Z]/.test(imported)) throw sourceNodeError(entry, sourceFile, `React ${imported} is not supported by Kudzu migration input`)
      }
    }
    if (!aliases.size && !reactObjects.size) return sourceFile

    const migrationCallName = call => {
      if (ts.isIdentifier(call.expression) && aliases.has(call.expression.text) && !isShadowedIdentifier(call.expression, sourceFile)) return aliases.get(call.expression.text)
      if (ts.isPropertyAccessExpression(call.expression) && ts.isIdentifier(call.expression.expression) && reactObjects.has(call.expression.expression.text) && !isShadowedIdentifier(call.expression.expression, sourceFile)) return call.expression.name.text
      return undefined
    }
    const ownerStateNames = owner => {
      const names = new Set()
      const collect = node => {
        if (node !== owner && isFunctionLike(node)) return
        if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ["useReducer", "useState"].includes(migrationCallName(node.initializer))) {
          const state = node.name.elements[0]
          if (state && ts.isBindingElement(state) && ts.isIdentifier(state.name)) names.add(state.name.text)
        }
        ts.forEachChild(node, collect)
      }
      collect(owner)
      return names
    }

    const validate = node => {
      if (ts.isTypeNode(node)) return
      if (ts.isIdentifier(node) && aliases.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) throw sourceNodeError(node, sourceFile, `Aliased React ${aliases.get(node.text)} must be called directly`)
      if (ts.isIdentifier(node) && reactObjects.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node)) throw sourceNodeError(node, sourceFile, "React default or namespace imports may only be used for direct supported members or React.Fragment")
      if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && reactObjects.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
        const name = node.name.text
        if (name !== "Fragment" && !(ts.isCallExpression(node.parent) && node.parent.expression === node && (supported.has(name) || erased.has(name)))) throw sourceNodeError(node, sourceFile, `React.${name} is not supported; use a directly supported hook call or React.Fragment`)
      }
      ts.forEachChild(node, validate)
    }
    validate(sourceFile)

    const memoLocals = new Map()
    const collectMemoLocals = node => {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && migrationCallName(node.initializer) === "useMemo") {
        if (!isLocalConst(node)) throw sourceNodeError(node, sourceFile, "React useMemo() local values must use const declarations")
        const callback = node.initializer.arguments[0]
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
          const expression = lowerReactMemoCollectionExpression(reactMemoExpression(callback), factory)
          const owner = nearestFunction(node)
          if (owner && expression) {
            const entries = memoLocals.get(owner) ?? new Map()
            if (entries.has(node.name.text)) throw sourceNodeError(node.name, sourceFile, `React useMemo() local ${JSON.stringify(node.name.text)} must be unique within its component`)
            entries.set(node.name.text, { declaration: node, expression })
            memoLocals.set(owner, entries)
          }
        }
      }
      ts.forEachChild(node, collectMemoLocals)
    }
    collectMemoLocals(sourceFile)
    const memoLocalIsShadowed = (node, owner, entry) => {
      if (isShadowedByParameter(node, owner)) return true
      const declarationStatement = entry.declaration.parent?.parent
      for (let current = node.parent; current && current !== owner; current = current.parent) {
        if (ts.isFunctionExpression(current) && current.name?.text === node.text) return true
        if (ts.isBlock(current) && current.statements.some(statement => statement !== declarationStatement && statementDeclaresName(statement, node.text))) return true
        if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statement !== declarationStatement && statementDeclaresName(statement, node.text)))) return true
        if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(node.text)) return true
        if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, node.text)) return true
      }
      return false
    }
    for (const [owner, entries] of memoLocals) for (const [name, entry] of entries) {
      const visit = node => {
        if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && nearestFunctionLike(node) !== owner && !memoLocalIsShadowed(node, owner, entry)) throw sourceNodeError(node, sourceFile, `React useMemo() local ${JSON.stringify(name)} cannot be captured by a nested function`)
        ts.forEachChild(node, visit)
      }
      visit(owner.body)
    }

    const required = new Set()
    const imported = new Set()
    const visitor = node => {
      if (ts.isVariableStatement(node)) {
        const entries = memoLocals.get(nearestFunction(node))
        if (entries) {
          for (const declaration of node.declarationList.declarations) if (ts.isIdentifier(declaration.name) && entries.has(declaration.name.text) && declaration.initializer) ts.visitNode(declaration.initializer, visitor)
          const declarations = node.declarationList.declarations.filter(declaration => !ts.isIdentifier(declaration.name) || !entries.has(declaration.name.text))
          if (!declarations.length) return undefined
          if (declarations.length !== node.declarationList.declarations.length) return factory.updateVariableStatement(node, node.modifiers, factory.updateVariableDeclarationList(node.declarationList, declarations.map(declaration => ts.visitEachChild(declaration, visitor, context))))
        }
      }
      if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
        const owner = nearestFunctionLike(node)
        const entry = memoLocals.get(owner)?.get(node.text)
        if (entry && !memoLocalIsShadowed(node, owner, entry)) return ts.visitNode(cloneAst(entry.expression, factory, context), visitor)
      }
      if (ts.isCallExpression(node)) {
        const name = migrationCallName(node)
        if (name === "forwardRef") return ts.visitNode(lowerReactForwardRef(node, sourceFile, factory), visitor)
        if (name === "memo") {
          if (node.arguments.length !== 1 || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]) || ts.isIdentifier(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React memo() requires exactly one function component or component identifier")
          if (ts.isIdentifier(node.arguments[0]) && isShadowedIdentifier(node.arguments[0], sourceFile)) throw sourceNodeError(node.arguments[0], sourceFile, "React memo() component identifiers must resolve to an unshadowed same-file top-level function")
          const component = ts.isIdentifier(node.arguments[0]) ? reactMemoComponentExpression(node.arguments[0], sourceFile, factory, context) : node.arguments[0]
          if (!component) throw sourceNodeError(node.arguments[0], sourceFile, "React memo() identifiers must name a same-file top-level function component")
          return ts.visitNode(component, visitor)
        }
        if (name === "useCallback") {
          if (node.arguments.length !== 2 || !ts.isArrayLiteralExpression(node.arguments[1]) || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React useCallback() requires an inline function and a literal dependency array")
          const dependency = node.arguments[1].elements.find(entry => !isReactCallbackDependency(entry))
          if (dependency) throw sourceNodeError(dependency, sourceFile, "React useCallback() dependencies must be identifiers or primitive literals")
          const dependencies = new Set(node.arguments[1].elements.map(unwrapExpression).filter(ts.isIdentifier).map(entry => entry.text))
          const owner = nearestFunction(node)
          const stale = owner && [...ownerStateNames(owner)].find(state => referenceIdentifiers(node.arguments[0], state).length && !dependencies.has(state))
          if (stale) throw sourceNodeError(node.arguments[1], sourceFile, `React useCallback() must list captured state ${JSON.stringify(stale)} as a dependency`)
          return ts.visitNode(node.arguments[0], visitor)
        }
        if (name === "useMemo") {
          if (node.arguments.length !== 2 || !ts.isArrayLiteralExpression(node.arguments[1]) || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React useMemo() requires an inline function and a literal dependency array")
          const callback = node.arguments[0]
          if (callback.parameters.length || callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(callback, sourceFile, "React useMemo() callback must be synchronous and parameterless")
          const dependency = node.arguments[1].elements.find(entry => !isReactCallbackDependency(entry))
          if (dependency) throw sourceNodeError(dependency, sourceFile, "React useMemo() dependencies must be identifiers or primitive literals")
          const expression = lowerReactMemoCollectionExpression(reactMemoExpression(callback), factory)
          const dependencies = new Set(node.arguments[1].elements.map(unwrapExpression).filter(ts.isIdentifier).map(entry => entry.text))
          const owner = nearestFunction(node)
          const states = owner ? ownerStateNames(owner) : new Set()
          const collection = expression && reactMemoCollection(expression, states, importedCollections, sourceFile)
          if (!expression || !collection && !isPureReactMemoExpression(expression)) throw sourceNodeError(callback.body, sourceFile, "React useMemo() callback must return one pure expression or analyzable collection pipeline")
          if (!collection) {
            const unsupported = [...reactMemoReferenceNames(expression)].find(reference => !states.has(reference))
            if (unsupported) throw sourceNodeError(expression, sourceFile, `React useMemo() pure expressions may only reference direct local state; found ${JSON.stringify(unsupported)}`)
          }
          const collectionDependencies = collection ? new Set([...collection.selectorStates, ...(collection.static ? [] : [collection.state.text])]) : undefined
          const stale = collection
            ? [...collectionDependencies].find(state => !dependencies.has(state))
            : [...states].find(state => referenceIdentifiers(expression, state).length && !dependencies.has(state))
          if (stale) throw sourceNodeError(node.arguments[1], sourceFile, `React useMemo() must list captured state ${JSON.stringify(stale)} as a dependency`)
          return ts.visitNode(expression, visitor)
        }
        if (name && supported.has(name)) {
          required.add(name)
          return factory.updateCallExpression(node, factory.createIdentifier(name), node.typeArguments, ts.visitNodes(node.arguments, visitor))
        }
      }
      if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "react") {
        const clause = node.importClause
        if (!clause) return node
        let bindings = clause.namedBindings
        if (bindings && ts.isNamedImports(bindings)) {
          const entries = []
          for (const entry of bindings.elements) {
            const name = (entry.propertyName ?? entry.name).text
            if (entry.isTypeOnly) continue
            if (!entry.isTypeOnly && erased.has(name)) continue
            if (!entry.isTypeOnly && supported.has(name)) {
              if (imported.has(name)) continue
              imported.add(name)
              required.add(name)
              entries.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
            } else {
              entries.push(entry)
            }
          }
          bindings = entries.length ? factory.updateNamedImports(bindings, entries) : undefined
        }
        if (!clause.name && !bindings) return undefined
        return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, clause.isTypeOnly, clause.name, bindings), node.moduleSpecifier, node.attributes)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    let normalized = ts.visitNode(sourceFile, visitor)
    const missing = [...required].filter(name => !imported.has(name)).sort()
    if (!missing.length) return normalized
    for (const name of missing) {
      const collision = sourceFile.statements.some(statement => statementDeclaresName(statement, name) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name) && statement.moduleSpecifier.text !== "react")
      if (collision) throw sourceNodeError(sourceFile, sourceFile, `React.${name} cannot be normalized because ${JSON.stringify(name)} is already declared`)
    }
    const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(missing.map(name => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name))))), factory.createStringLiteral("react"))
    const statements = [...normalized.statements]
    const lastImport = statements.findLastIndex(statement => ts.isImportDeclaration(statement))
    statements.splice(lastImport + 1, 0, declaration)
    normalized = factory.updateSourceFile(normalized, statements)
    return normalized
  }

  function lowerReactForwardRef(call, sourceFile, factory) {
    const declaration = call.parent
    const statement = declaration?.parent?.parent
    if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== call || !ts.isIdentifier(declaration.name) || !statement || !ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || statement.parent !== sourceFile) {
      throw sourceNodeError(call, sourceFile, "React forwardRef() must directly initialize one top-level const component")
    }
    if (call.arguments.length !== 1 || !ts.isArrowFunction(call.arguments[0]) && !ts.isFunctionExpression(call.arguments[0])) throw sourceNodeError(call, sourceFile, "React forwardRef() requires exactly one inline render function")
    const callback = call.arguments[0]
    if (callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(callback, sourceFile, "React forwardRef() render function must be synchronous and cannot be a generator")
    if (callback.parameters.length !== 2) throw sourceNodeError(callback, sourceFile, "React forwardRef() render function must declare exactly (props, ref)")
    const [props, ref] = callback.parameters
    if (props.dotDotDotToken || props.initializer || !ts.isIdentifier(props.name) && !ts.isObjectBindingPattern(props.name)) throw sourceNodeError(props, sourceFile, "React forwardRef() props must use one identifier or a flat object binding")
    if (ref.dotDotDotToken || ref.initializer || !ts.isIdentifier(ref.name)) throw sourceNodeError(ref, sourceFile, "React forwardRef() ref parameter must be one identifier")

    let elements
    if (ts.isIdentifier(props.name)) {
      elements = [
        factory.createBindingElement(undefined, factory.createIdentifier("ref"), factory.createIdentifier(ref.name.text)),
        factory.createBindingElement(factory.createToken(ts.SyntaxKind.DotDotDotToken), undefined, factory.createIdentifier(props.name.text))
      ]
    } else {
      for (const element of props.name.elements) {
        const property = (element.propertyName ?? element.name)
        if (!ts.isIdentifier(element.name) || property.text === "ref") throw sourceNodeError(element, sourceFile, property.text === "ref" ? "React forwardRef() props must not declare ref; Kudzu supplies ref through the second parameter" : "React forwardRef() props must use one identifier or a flat object binding")
      }
      const rest = props.name.elements.findIndex(element => Boolean(element.dotDotDotToken))
      elements = [...props.name.elements]
      elements.splice(rest < 0 ? elements.length : rest, 0, factory.createBindingElement(undefined, factory.createIdentifier("ref"), factory.createIdentifier(ref.name.text)))
    }

    const last = ts.isBlock(callback.body) ? callback.body.statements.at(-1) : undefined
    let returnCount = 0
    const countReturns = node => {
      if (node !== callback.body && isFunctionLike(node)) return
      if (ts.isReturnStatement(node)) returnCount++
      ts.forEachChild(node, countReturns)
    }
    countReturns(callback.body)
    const returned = ts.isBlock(callback.body)
      ? last && ts.isReturnStatement(last) ? last.expression : undefined
      : callback.body
    const root = returned && unwrapExpression(returned)
    const tag = root && jsxTagName(root)
    if ((ts.isBlock(callback.body) && returnCount !== 1) || !root || !ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root) || !ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) throw sourceNodeError(callback.body, sourceFile, "React forwardRef() render function must directly return one intrinsic JSX element")
    const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
    const forwarded = attributes.properties.filter(attribute => ts.isJsxAttribute(attribute) && attribute.name.text === "ref" && ts.isJsxExpression(attribute.initializer) && ts.isIdentifier(attribute.initializer.expression) && attribute.initializer.expression.text === ref.name.text)
    if (forwarded.length !== 1 || referenceIdentifiers(callback.body, ref.name.text).length !== 1) throw sourceNodeError(ref, sourceFile, "React forwardRef() ref must be forwarded exactly once as ref={ref} on the direct intrinsic root")

    const parameter = factory.updateParameterDeclaration(props, props.modifiers, undefined, factory.createObjectBindingPattern(elements), props.questionToken, props.type, undefined)
    return ts.isArrowFunction(callback)
      ? factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, [parameter], callback.type, callback.equalsGreaterThanToken, callback.body)
      : factory.updateFunctionExpression(callback, callback.modifiers, undefined, callback.name, callback.typeParameters, [parameter], callback.type, callback.body)
  }

  function validateUseIdSyntax(sourceFile) {
    const imported = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && ["@kudzujs/core", "react"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useId"))
    if (!imported) return
    const visit = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useId" && !isShadowedIdentifier(node.expression, sourceFile)) {
        if (node.arguments.length) throw sourceNodeError(node, sourceFile, "useId() does not accept arguments")
        const declaration = node.parent
        const statement = declaration?.parent?.parent
        const owner = nearestFunction(node)
        if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !ts.isIdentifier(declaration.name) || !statement || !ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || !owner || !ts.isBlock(owner.body) || statement.parent !== owner.body) {
          throw sourceNodeError(node, sourceFile, "useId() must be assigned to one top-level const identifier in a component")
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  function isReactCallbackDependency(node) {
    node = unwrapExpression(node)
    return ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword
  }

  function lowerReactMemoCollectionExpression(expression, factory) {
    if (!expression) return undefined
    const visit = node => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && node.arguments.length === 1) {
        return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("Array"), "from"), undefined, [visit(node.expression.expression), node.arguments[0]])
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["filter", "flatMap", "slice", "toSorted"].includes(node.expression.name.text)) {
        return factory.updateCallExpression(node, factory.updatePropertyAccessExpression(node.expression, visit(node.expression.expression), node.expression.name), node.typeArguments, node.arguments)
      }
      if (isArrayFromCall(node)) return factory.updateCallExpression(node, node.expression, node.typeArguments, [visit(node.arguments[0]), ...node.arguments.slice(1)])
      return node
    }
    return visit(expression)
  }

  function reactMemoCollection(expression, states, importedCollections, sourceFile) {
    const setters = new Map([...states].map(state => [state, state]))
    const fail = (node, message) => { throw sourceNodeError(node, sourceFile, message) }
    return analyzeCollectionPipeline(expression, { setters, fail, importedCollections, stateNames: states })
  }

  function reactMemoComponentExpression(identifier, sourceFile, factory, context) {
    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name?.text === identifier.text && statement.body) {
        const clone = cloneAst(statement, factory, context)
        return factory.createFunctionExpression(clone.modifiers?.filter(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword), clone.asteriskToken, clone.name, clone.typeParameters, clone.parameters, clone.type, clone.body)
      }
      if (!ts.isVariableStatement(statement)) continue
      const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === identifier.text)
      if (declaration?.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) return cloneAst(declaration.initializer, factory, context)
    }
    return undefined
  }

  function isPureReactMemoExpression(node) {
    node = unwrapExpression(node)
    if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) return true
    if (ts.isParenthesizedExpression(node)) return isPureReactMemoExpression(node.expression)
    if (ts.isPrefixUnaryExpression(node)) return ![ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) && isPureReactMemoExpression(node.operand)
    if (ts.isBinaryExpression(node)) return node.operatorToken.kind < ts.SyntaxKind.FirstAssignment && isPureReactMemoExpression(node.left) && isPureReactMemoExpression(node.right)
    if (ts.isConditionalExpression(node)) return isPureReactMemoExpression(node.condition) && isPureReactMemoExpression(node.whenTrue) && isPureReactMemoExpression(node.whenFalse)
    if (ts.isTemplateExpression(node)) return node.templateSpans.every(span => isPureReactMemoExpression(span.expression))
    return false
  }

  function reactMemoReferenceNames(root) {
    const names = new Set()
    const visit = node => {
      if (ts.isIdentifier(node) && isReferenceIdentifier(node)) names.add(node.text)
      ts.forEachChild(node, visit)
    }
    visit(root)
    return names
  }

  return { normalizeReactMigrationSyntax, validateUseIdSyntax }
}

export function reactMemoExpression(callback) {
  if (!ts.isBlock(callback.body)) return callback.body
  if (callback.body.statements.length !== 1 || !ts.isReturnStatement(callback.body.statements[0])) return undefined
  return callback.body.statements[0].expression
}
