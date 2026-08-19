import ts from "typescript"
import { bindingNames, containsJsx, functionVarDeclaresName, importDeclarationNames, isNodeWithin, isShadowedIdentifier, isUnshadowedGlobal, nearestFunction, referenceIdentifiers, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"

export function normalizeMediaQueryExternalStores(sourceFile, factory, context) {
    const imports = sourceFile.statements.filter(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "react" && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings))
    const externalStoreImport = imports.flatMap(statement => statement.importClause.namedBindings.elements.map(entry => ({ entry, statement }))).find(({ entry }) => !entry.isTypeOnly && !entry.propertyName && entry.name.text === "useSyncExternalStore")
    if (!externalStoreImport) return sourceFile
    const returnedExpression = callback => {
      if (!(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) || callback.parameters.length) return undefined
      if (!ts.isBlock(callback.body)) return unwrapExpression(callback.body)
      if (callback.body.statements.length !== 1 || !ts.isReturnStatement(callback.body.statements[0]) || !callback.body.statements[0].expression) return undefined
      return unwrapExpression(callback.body.statements[0].expression)
    }
    const matchMediaQuery = expression => {
      expression = unwrapExpression(expression)
      if (!ts.isCallExpression(expression) || expression.arguments.length !== 1 || !ts.isStringLiteral(unwrapExpression(expression.arguments[0])) || !ts.isPropertyAccessExpression(expression.expression) || !ts.isIdentifier(expression.expression.expression) || expression.expression.expression.text !== "window" || expression.expression.name.text !== "matchMedia" || !isUnshadowedGlobal(expression.expression.expression, sourceFile)) return undefined
      return unwrapExpression(expression.arguments[0]).text
    }
    const mediaListener = (statement, method, media, callback) => ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.arguments.length === 2 && ts.isPropertyAccessExpression(statement.expression.expression) && ts.isIdentifier(statement.expression.expression.expression) && statement.expression.expression.expression.text === media && statement.expression.expression.name.text === method && ts.isStringLiteral(unwrapExpression(statement.expression.arguments[0])) && unwrapExpression(statement.expression.arguments[0]).text === "change" && ts.isIdentifier(unwrapExpression(statement.expression.arguments[1])) && unwrapExpression(statement.expression.arguments[1]).text === callback
    const candidates = new Map()
    let index = 0
    const inspect = node => {
      if (!ts.isVariableStatement(node) || !(node.declarationList.flags & ts.NodeFlags.Const) || node.declarationList.declarations.length !== 1) {
        ts.forEachChild(node, inspect)
        return
      }
      const declaration = node.declarationList.declarations[0]
      const call = declaration.initializer && unwrapExpression(declaration.initializer)
      if (!ts.isIdentifier(declaration.name) || !call || !ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || call.expression.text !== "useSyncExternalStore" || isShadowedIdentifier(call.expression, sourceFile)) {
        ts.forEachChild(node, inspect)
        return
      }
      if (call.arguments.length !== 3) throw sourceNodeError(call, sourceFile, "Media query useSyncExternalStore() requires subscribe, browser snapshot, and false server snapshot callbacks")
      const [subscribe, snapshot, serverSnapshot] = call.arguments.map(unwrapExpression)
      if (!(ts.isArrowFunction(subscribe) || ts.isFunctionExpression(subscribe)) || subscribe.parameters.length !== 1 || !ts.isIdentifier(subscribe.parameters[0].name) || !ts.isBlock(subscribe.body)) throw sourceNodeError(subscribe, sourceFile, "Media query subscriptions require one inline callback parameter and block body")
      if (subscribe.body.statements.length !== 3) throw sourceNodeError(subscribe, sourceFile, "Media query subscriptions must add and remove one matching change listener")
      const callback = subscribe.parameters[0].name.text
      const [mediaStatement, addStatement, returnStatement] = subscribe.body.statements
      const mediaDeclaration = ts.isVariableStatement(mediaStatement) && (mediaStatement.declarationList.flags & ts.NodeFlags.Const) && mediaStatement.declarationList.declarations.length === 1 ? mediaStatement.declarationList.declarations[0] : undefined
      const media = mediaDeclaration && ts.isIdentifier(mediaDeclaration.name) ? mediaDeclaration.name.text : undefined
      const query = mediaDeclaration?.initializer && matchMediaQuery(mediaDeclaration.initializer)
      const cleanup = ts.isReturnStatement(returnStatement) && returnStatement.expression ? unwrapExpression(returnStatement.expression) : undefined
      const cleanupStatement = cleanup && (ts.isArrowFunction(cleanup) || ts.isFunctionExpression(cleanup)) && !cleanup.parameters.length
        ? ts.isBlock(cleanup.body) ? cleanup.body.statements.length === 1 ? cleanup.body.statements[0] : undefined : factory.createExpressionStatement(cleanup.body)
        : undefined
      if (!media || !query || !mediaListener(addStatement, "addEventListener", media, callback) || !cleanupStatement || !mediaListener(cleanupStatement, "removeEventListener", media, callback)) throw sourceNodeError(subscribe, sourceFile, "Media query subscriptions must add and remove one matching change listener")
      const snapshotValue = returnedExpression(snapshot)
      const snapshotQuery = snapshotValue && ts.isPropertyAccessExpression(snapshotValue) && snapshotValue.name.text === "matches" ? matchMediaQuery(snapshotValue.expression) : undefined
      const serverValue = returnedExpression(serverSnapshot)
      if (snapshotQuery !== query || !serverValue || serverValue.kind !== ts.SyntaxKind.FalseKeyword) throw sourceNodeError(call, sourceFile, "Media query external stores require matching static snapshots and a false server fallback")
      const owner = nearestFunction(node)
      const topLevelOwner = owner && (owner.parent === sourceFile || ts.isVariableDeclaration(owner.parent) && owner.parent.parent?.parent?.parent === sourceFile)
      if (!topLevelOwner || !owner.body || !ts.isBlock(owner.body) || node.parent !== owner.body) throw sourceNodeError(declaration, sourceFile, "Media query external stores must initialize one top-level component const")
      for (const name of ["useEffect", "useState"]) if (owner.parameters.some(parameter => bindingNames(parameter.name).includes(name)) || functionVarDeclaresName(owner, name) || owner.body.statements.some(statement => statementDeclaresName(statement, name))) throw sourceNodeError(declaration, sourceFile, `Media query external stores conflict with component-local ${name}`)
      let setter = `__kSetMediaQuery${index++}`
      while (sourceFile.text.includes(setter)) setter = `__kSetMediaQuery${index++}`
      candidates.set(node, { declaration, query, setter })
    }
    inspect(sourceFile)
    const references = referenceIdentifiers(sourceFile, "useSyncExternalStore")
    if (references.length !== candidates.size) throw sourceNodeError(references.find(reference => ![...candidates.values()].some(candidate => isNodeWithin(reference, candidate.declaration.initializer))) ?? externalStoreImport.entry, sourceFile, "useSyncExternalStore is supported only for direct static media query declarations")
    const directHooks = new Set(imports.flatMap(statement => statement.importClause.namedBindings.elements.filter(entry => !entry.propertyName).map(entry => entry.name.text)))
    const missingHooks = ["useEffect", "useState"].filter(name => !directHooks.has(name))
    for (const name of missingHooks) {
      const collision = sourceFile.statements.some(statement => statementDeclaresName(statement, name) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name))
      if (collision) throw sourceNodeError([...candidates.values()][0].declaration, sourceFile, `Media query external stores conflict with local ${name}`)
    }

    const visitor = node => {
      const candidate = ts.isVariableStatement(node) ? candidates.get(node) : undefined
      if (candidate) {
        const state = factory.createVariableStatement(node.modifiers, factory.createVariableDeclarationList([
          factory.createVariableDeclaration(factory.createArrayBindingPattern([
            factory.createBindingElement(undefined, undefined, candidate.declaration.name),
            factory.createBindingElement(undefined, undefined, candidate.setter)
          ]), undefined, undefined, factory.createCallExpression(factory.createIdentifier("useState"), undefined, [factory.createFalse()]))
        ], ts.NodeFlags.Const))
        const media = factory.createIdentifier("media")
        const update = factory.createIdentifier("update")
        const mediaCall = factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("window"), "matchMedia"), undefined, [factory.createStringLiteral(candidate.query)])
        const updateCallback = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createCallExpression(factory.createIdentifier(candidate.setter), undefined, [factory.createPropertyAccessExpression(media, "matches")]))
        const listener = method => factory.createCallExpression(factory.createPropertyAccessExpression(media, method), undefined, [factory.createStringLiteral("change"), update])
        const cleanup = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), listener("removeEventListener"))
        const setup = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createBlock([
          factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(media, undefined, undefined, mediaCall)], ts.NodeFlags.Const)),
          factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(update, undefined, undefined, updateCallback)], ts.NodeFlags.Const)),
          factory.createExpressionStatement(factory.createCallExpression(update, undefined, [])),
          factory.createExpressionStatement(listener("addEventListener")),
          factory.createReturnStatement(cleanup)
        ], true))
        const effectCall = factory.createCallExpression(factory.createIdentifier("useEffect"), undefined, [setup, factory.createArrayLiteralExpression()])
        ts.setOriginalNode(effectCall, candidate.declaration.initializer)
        ts.setTextRange(effectCall, candidate.declaration.initializer)
        return [state, factory.createExpressionStatement(effectCall)]
      }
      if (node === externalStoreImport.statement) {
        const clause = node.importClause
        const bindings = clause.namedBindings
        const elements = bindings.elements.filter(entry => entry !== externalStoreImport.entry)
        for (const name of missingHooks) elements.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
        return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, false, clause.name, factory.updateNamedImports(bindings, elements)), node.moduleSpecifier, node.attributes)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(sourceFile, visitor)
  }

export function normalizeNavigatorCapabilityConditions(sourceFile, factory, context) {
    const candidates = new Map()
    let index = 0
    const inspect = node => {
      if (!ts.isVariableStatement(node) || !(node.declarationList.flags & ts.NodeFlags.Const) || node.declarationList.declarations.length !== 1) {
        ts.forEachChild(node, inspect)
        return
      }
      const declaration = node.declarationList.declarations[0]
      const value = declaration.initializer && unwrapExpression(declaration.initializer)
      if (!ts.isIdentifier(declaration.name) || !value || !ts.isBinaryExpression(value) || value.operatorToken.kind !== ts.SyntaxKind.InKeyword || !ts.isStringLiteral(unwrapExpression(value.left)) || !ts.isIdentifier(unwrapExpression(value.right)) || unwrapExpression(value.right).text !== "navigator" || !isUnshadowedGlobal(unwrapExpression(value.right), sourceFile)) {
        ts.forEachChild(node, inspect)
        return
      }
      const owner = nearestFunction(node)
      const topLevelOwner = owner && (owner.parent === sourceFile || ts.isVariableDeclaration(owner.parent) && owner.parent.parent?.parent?.parent === sourceFile)
      if (!topLevelOwner || !owner.body || !ts.isBlock(owner.body) || node.parent !== owner.body) throw sourceNodeError(declaration, sourceFile, "Navigator capability conditions must be top-level component const declarations")
      const references = referenceIdentifiers(owner.body, declaration.name.text)
      const condition = references.length === 1 ? references[0] : undefined
      const structural = condition && ts.isBinaryExpression(condition.parent) && condition.parent.left === condition && condition.parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && containsJsx(condition.parent.right) && ts.isJsxExpression(condition.parent.parent) && condition.parent.parent.expression === condition.parent
      if (!structural) throw sourceNodeError(declaration, sourceFile, "Navigator capability values may only control one direct JSX && branch")
      for (const name of ["useEffect", "useState"]) if (owner.parameters.some(parameter => bindingNames(parameter.name).includes(name)) || functionVarDeclaresName(owner, name) || owner.body.statements.some(statement => statementDeclaresName(statement, name))) throw sourceNodeError(declaration, sourceFile, `Navigator capability conditions conflict with component-local ${name}`)
      let setter = `__kSetNavigatorCapability${index++}`
      while (sourceFile.text.includes(setter)) setter = `__kSetNavigatorCapability${index++}`
      candidates.set(node, { declaration, property: unwrapExpression(value.left).text, setter })
    }
    inspect(sourceFile)
    if (!candidates.size) return sourceFile

    const visitor = node => {
      const candidate = ts.isVariableStatement(node) ? candidates.get(node) : undefined
      if (candidate) {
        const state = factory.createVariableStatement(node.modifiers, factory.createVariableDeclarationList([
          factory.createVariableDeclaration(factory.createArrayBindingPattern([
            factory.createBindingElement(undefined, undefined, candidate.declaration.name),
            factory.createBindingElement(undefined, undefined, candidate.setter)
          ]), undefined, undefined, factory.createCallExpression(factory.createIdentifier("useState"), undefined, [factory.createFalse()]))
        ], ts.NodeFlags.Const))
        const capability = factory.createBinaryExpression(factory.createStringLiteral(candidate.property), factory.createToken(ts.SyntaxKind.InKeyword), factory.createIdentifier("navigator"))
        const setup = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createBlock([
          factory.createExpressionStatement(factory.createCallExpression(factory.createIdentifier(candidate.setter), undefined, [capability]))
        ], true))
        const effectCall = factory.createCallExpression(factory.createIdentifier("useEffect"), undefined, [setup, factory.createArrayLiteralExpression()])
        ts.setOriginalNode(effectCall, candidate.declaration.initializer)
        ts.setTextRange(effectCall, candidate.declaration.initializer)
        const effect = factory.createExpressionStatement(effectCall)
        return [state, effect]
      }
      return ts.visitEachChild(node, visitor, context)
    }
    let normalized = ts.visitNode(sourceFile, visitor)
    const hookImports = normalized.statements.filter(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings))
    const hookImport = hookImports[0]
    const bindings = hookImport?.importClause.namedBindings
    const imported = new Set(hookImports.flatMap(statement => statement.importClause.namedBindings.elements.map(entry => entry.name.text)))
    const missing = ["useEffect", "useState"].filter(name => !imported.has(name))
    if (!missing.length) return normalized
    for (const name of missing) if (normalized.statements.some(statement => !hookImports.includes(statement) && (statementDeclaresName(statement, name) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name)))) throw sourceNodeError([...candidates.values()][0].declaration, sourceFile, `Navigator capability conditions conflict with local ${name}`)
    if (hookImport && bindings && ts.isNamedImports(bindings)) {
      const statements = normalized.statements.map(statement => statement === hookImport ? factory.updateImportDeclaration(statement, statement.modifiers, factory.updateImportClause(statement.importClause, false, statement.importClause.name, factory.updateNamedImports(bindings, [
        ...bindings.elements,
        ...missing.map(name => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
      ])), statement.moduleSpecifier, statement.attributes) : statement)
      return factory.updateSourceFile(normalized, statements)
    }
    const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(missing.map(name => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name))))), factory.createStringLiteral("@kudzujs/core"))
    const statements = [...normalized.statements]
    statements.splice(statements.findLastIndex(statement => ts.isImportDeclaration(statement)) + 1, 0, declaration)
    return factory.updateSourceFile(normalized, statements)
  }
