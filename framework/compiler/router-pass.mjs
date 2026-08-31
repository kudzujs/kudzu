import ts from "typescript"
import { bindingNames, functionVarDeclaresName, isFunctionLike, isLocalConst, isReferenceIdentifier, isShadowedIdentifier, loopDeclaresName, nearestFunction, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"
import { compatibilityPackages } from "./compatibility-registry.mjs"

export function createRouterPass({ withBase }) {
  return function normalizeReactRouterSyntax(sourceFile, factory, context, base, importedCollections = new Map()) {
    const links = new Set()
    const params = new Set()
    const matchHooks = new Set()
    const searchHooks = new Set()
    const navigateHooks = new Set()
    for (const statement of sourceFile.statements) {
      if ((ts.isExportDeclaration(statement) || ts.isImportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === compatibilityPackages.reactRouter) {
        if (ts.isExportDeclaration(statement)) throw sourceNodeError(statement, sourceFile, "React Router exports are not supported; import Link directly where it renders")
        const clause = statement.importClause
        if (clause?.isTypeOnly) continue
        if (!clause) throw sourceNodeError(statement, sourceFile, "Side-effect React Router imports are not supported")
        if (clause.name) throw sourceNodeError(clause.name, sourceFile, "React Router default imports are not supported; use named Link, useParams, useMatch, useSearchParams, or useNavigate imports")
        const bindings = clause.namedBindings
        if (!bindings || ts.isNamespaceImport(bindings)) throw sourceNodeError(bindings ?? statement, sourceFile, "React Router namespace imports are not supported; use named Link, useParams, useMatch, useSearchParams, or useNavigate imports")
        for (const entry of bindings.elements) {
          if (entry.isTypeOnly) continue
          const imported = (entry.propertyName ?? entry.name).text
          if (imported === "NavLink") throw sourceNodeError(entry, sourceFile, "React Router NavLink active-route semantics cannot be erased to a native anchor")
          if (imported === "Link") links.add(entry.name.text)
          else if (imported === "useParams") params.add(entry.name.text)
          else if (imported === "useMatch") matchHooks.add(entry.name.text)
          else if (imported === "useSearchParams") searchHooks.add(entry.name.text)
          else if (imported === "useNavigate") navigateHooks.add(entry.name.text)
          else throw sourceNodeError(entry, sourceFile, `React Router ${imported} is not supported; only named Link, useParams, useMatch, useSearchParams, and useNavigate imports can be lowered`)
        }
      }
    }
    if (!links.size && !params.size && !matchHooks.size && !searchHooks.size && !navigateHooks.size) return sourceFile

    let matchHelper = "__kUseRouteMatch"
    while (sourceFile.text.includes(matchHelper)) matchHelper += "_"
    const matchCalls = new Map()
    const topLevelFunction = owner => owner.parent === sourceFile || ts.isExportAssignment(owner.parent) && owner.parent.parent === sourceFile || (ts.isArrowFunction(owner) || ts.isFunctionExpression(owner)) && ts.isVariableDeclaration(owner.parent) && owner.parent.parent?.parent?.parent === sourceFile
    const componentFunction = owner => {
      if (!topLevelFunction(owner)) return false
      if (ts.isExportAssignment(owner.parent)) return true
      if (ts.isFunctionDeclaration(owner) && owner.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) return true
      const name = ts.isFunctionDeclaration(owner) ? owner.name?.text : ts.isVariableDeclaration(owner.parent) && ts.isIdentifier(owner.parent.name) ? owner.parent.name.text : undefined
      if (!name || !/^[A-Z]/.test(name)) return false
      let eventHandlerUse = false
      const inspect = node => {
        if (eventHandlerUse) return
        if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) {
          for (let current = node.parent; current && current !== sourceFile; current = current.parent) {
            if (ts.isJsxAttribute(current) && /^on[A-Z]/.test(current.name.text)) eventHandlerUse = true
          }
        }
        ts.forEachChild(node, inspect)
      }
      inspect(sourceFile)
      return !eventHandlerUse
    }
    const collectMatchHooks = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && matchHooks.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
        const declaration = node.parent
        const statement = declaration?.parent?.parent
        const owner = nearestFunction(node)
        if (node.questionDotToken || node.typeArguments?.length || node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0]) || !ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !ts.isIdentifier(declaration.name) || !isLocalConst(declaration) || !owner || !componentFunction(owner) || statement?.parent !== owner.body) {
          throw sourceNodeError(node, sourceFile, 'React Router useMatch must directly initialize one top-level const from one static root-relative pattern such as useMatch("/")')
        }
        const pattern = node.arguments[0].text
        if (!pattern.startsWith("/") || pattern.startsWith("//") || pattern !== "/" && pattern.endsWith("/") || /[:*?#\\\0]/.test(pattern)) throw sourceNodeError(node.arguments[0], sourceFile, 'React Router useMatch only supports an exact static root-relative pattern without params, wildcards, query, hash, or a trailing slash')
        matchCalls.set(node, pattern)
      }
      ts.forEachChild(node, collectMatchHooks)
    }
    collectMatchHooks(sourceFile)

    let searchHelper = "__kUseSearchParam"
    while (sourceFile.text.includes(searchHelper)) searchHelper += "_"
    let searchWriterHelper = "__kUseSearchParamsWriter"
    while (sourceFile.text.includes(searchWriterHelper)) searchWriterHelper += "_"
    const searchDeclarations = new Set()
    const searchReads = new Map()
    const searchFallbackValues = new Map()
    const composedSearchDeclarations = new Map()
    const composedSearchCalls = new Map()
    const searchWrites = new Map()
    const searchObjects = []
    let composedSearchIndex = 0
    const composedSearchName = () => {
      let name
      do name = `__kRouterSearchParam${composedSearchIndex++ || ""}`
      while (sourceFile.text.includes(name) || [...composedSearchCalls.values()].includes(name))
      return name
    }
    const collectSearchHooks = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && searchHooks.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
        const declaration = node.parent
        const statement = declaration?.parent?.parent
        const owner = nearestFunction(node)
        const first = ts.isVariableDeclaration(declaration) && ts.isArrayBindingPattern(declaration.name) ? declaration.name.elements[0] : undefined
        const second = ts.isVariableDeclaration(declaration) && ts.isArrayBindingPattern(declaration.name) ? declaration.name.elements[1] : undefined
        if (node.questionDotToken || node.arguments.length || node.typeArguments?.length || !ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !isLocalConst(declaration) || !owner || statement?.parent !== owner.body || !ts.isBindingElement(first) || !ts.isIdentifier(first.name) || declaration.name.elements.length > 2 || second && (!ts.isBindingElement(second) || !ts.isIdentifier(second.name))) {
          throw sourceNodeError(node, sourceFile, "React Router useSearchParams must initialize one top-level const [params] or [params, setParams] binding")
        }
        const entry = { name: first.name.text, setter: second?.name.text, declaration, statement, owner }
        searchDeclarations.add(declaration)
        searchObjects.push(entry)
      }
      ts.forEachChild(node, collectSearchHooks)
    }
    collectSearchHooks(sourceFile)
    const localBindingShadowed = (node, entry, name = entry.name) => {
      for (let current = node.parent; current && current !== entry.owner; current = current.parent) {
        if (isFunctionLike(current) && (current.parameters.some(parameter => bindingNames(parameter.name).includes(name)) || functionVarDeclaresName(current, name))) return true
        if (ts.isBlock(current) && current.statements.some(statement => statement !== entry.statement && statementDeclaresName(statement, name))) return true
        if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statement !== entry.statement && statementDeclaresName(statement, name)))) return true
        if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(name)) return true
        if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, name)) return true
      }
      return false
    }
    for (const entry of searchObjects) {
      const collectReads = node => {
        if (ts.isIdentifier(node) && node.text === entry.name && isReferenceIdentifier(node) && !localBindingShadowed(node, entry)) {
          if (entry.setter && ts.isCallExpression(node.parent) && node.parent.arguments.includes(node) && ts.isIdentifier(node.parent.expression) && node.parent.expression.text === entry.setter) return
          const property = node.parent
          const call = property?.parent
          const directDeclaration = call?.parent
          const numberCall = directDeclaration && ts.isCallExpression(directDeclaration) && ts.isIdentifier(directDeclaration.expression) && directDeclaration.expression.text === "Number" && !isShadowedIdentifier(directDeclaration.expression, sourceFile) && directDeclaration.arguments.length === 1 && directDeclaration.arguments[0] === call && !directDeclaration.questionDotToken && !directDeclaration.typeArguments?.length ? directDeclaration : undefined
          const binary = numberCall?.parent ?? directDeclaration
          const numericRight = binary?.right
          const numericValue = numericRight && ts.isNumericLiteral(numericRight) ? Number(numericRight.text) : numericRight && ts.isPrefixUnaryExpression(numericRight) && [ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken].includes(numericRight.operator) && ts.isNumericLiteral(numericRight.operand) ? Number(numericRight.getText(sourceFile)) : NaN
          const numericFallback = numberCall && ts.isBinaryExpression(binary) && binary.left === numberCall && binary.operatorToken.kind === ts.SyntaxKind.BarBarToken && Number.isFinite(numericValue) ? binary : undefined
          const importedValue = !numberCall && ts.isBinaryExpression(binary) && binary.left === call && binary.operatorToken.kind === ts.SyntaxKind.BarBarToken ? binary.right : undefined
          const importedCollection = importedValue && ts.isElementAccessExpression(importedValue) && !importedValue.questionDotToken && ts.isIdentifier(importedValue.expression) && ts.isNumericLiteral(importedValue.argumentExpression) ? importedCollections.get(importedValue.expression.text) : undefined
          const importedIndex = importedValue && ts.isElementAccessExpression(importedValue) && ts.isNumericLiteral(importedValue.argumentExpression) ? Number(importedValue.argumentExpression.text) : undefined
          const importedElement = importedCollection && Number.isSafeInteger(importedIndex) ? importedCollection.elements[importedIndex] : undefined
          const importedString = importedElement && unwrapExpression(importedElement)
          const importedFallback = importedString && (ts.isStringLiteral(importedString) || ts.isNoSubstitutionTemplateLiteral(importedString)) ? binary : undefined
          const fallback = numericFallback ?? importedFallback
          let composedInitializer = fallback
          while (composedInitializer?.parent && (ts.isParenthesizedExpression(composedInitializer.parent) || ts.isAsExpression(composedInitializer.parent) || ts.isTypeAssertionExpression(composedInitializer.parent) || ts.isSatisfiesExpression(composedInitializer.parent) || ts.isNonNullExpression(composedInitializer.parent)) && composedInitializer.parent.expression === composedInitializer) composedInitializer = composedInitializer.parent
          const composedDeclaration = composedInitializer?.parent
          const declaration = directDeclaration && ts.isVariableDeclaration(directDeclaration) ? directDeclaration : composedDeclaration && ts.isVariableDeclaration(composedDeclaration) ? composedDeclaration : undefined
          const statement = declaration?.parent?.parent
          if (!ts.isPropertyAccessExpression(property) || property.expression !== node || property.name.text !== "get" || !ts.isCallExpression(call) || call.expression !== property || call.questionDotToken || call.typeArguments?.length || call.arguments.length !== 1 || !ts.isStringLiteral(call.arguments[0])) {
            throw sourceNodeError(node, sourceFile, 'React Router search parameters only support direct get("static-name") reads')
          }
          if (!declaration || declaration.initializer !== call && declaration.initializer !== composedInitializer || !ts.isIdentifier(declaration.name) || !isLocalConst(declaration) || statement?.parent !== entry.owner.body) {
            throw sourceNodeError(call, sourceFile, 'React Router search parameter get() must directly initialize one top-level const, appear as Number(params.get("name")) || finiteNumber, or use params.get("name") || importedArray[staticIndex]')
          }
          if (fallback && declaration.parent.declarations.length !== 1) throw sourceNodeError(declaration, sourceFile, "React Router composed search parameter reads require their own top-level const statement")
          searchReads.set(call, call.arguments[0])
          if (importedValue && importedFallback) searchFallbackValues.set(importedValue, importedString.text)
          if (fallback) {
            const name = composedSearchName()
            composedSearchDeclarations.set(declaration, { call, name })
            composedSearchCalls.set(call, name)
          }
          return
        }
        ts.forEachChild(node, collectReads)
      }
      collectReads(entry.owner.body)
      if (!entry.setter) continue
      const collectWrites = node => {
        if (ts.isIdentifier(node) && node.text === entry.setter && isReferenceIdentifier(node) && !localBindingShadowed(node, entry, entry.setter)) {
          const call = node.parent
          if (!ts.isCallExpression(call) || call.expression !== node || call.questionDotToken || call.typeArguments?.length || nearestFunction(call) === entry.owner) throw sourceNodeError(node, sourceFile, "React Router search parameter setters may only be called directly from a nested browser callback")
          if (call.arguments.length < 1 || call.arguments.length > 2) throw sourceNodeError(call, sourceFile, "React Router search parameter setters require one inline updater and optional { replace: true }")
          const updater = unwrapExpression(call.arguments[0])
          if ((!ts.isArrowFunction(updater) && !ts.isFunctionExpression(updater)) || updater.asteriskToken || updater.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || updater.parameters.length !== 1 || !ts.isIdentifier(updater.parameters[0].name)) throw sourceNodeError(call.arguments[0], sourceFile, "React Router search parameter setters require one synchronous inline updater with one identifier parameter")
          let replace = false
          if (call.arguments.length === 2) {
            const options = unwrapExpression(call.arguments[1])
            const property = ts.isObjectLiteralExpression(options) && options.properties.length === 1 ? options.properties[0] : undefined
            const name = property && ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined
            if (name !== "replace" || property.initializer.kind !== ts.SyntaxKind.TrueKeyword) throw sourceNodeError(call.arguments[1], sourceFile, "React Router search parameter setters only support exactly { replace: true } as a second argument")
            replace = true
          }
          searchWrites.set(call, { updater, replace })
          return
        }
        ts.forEachChild(node, collectWrites)
      }
      collectWrites(entry.owner.body)
    }

    const navigateDeclarations = new Set()
    const navigateCalls = new Map()
    const navigateFunctions = []
    const collectNavigateHooks = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && navigateHooks.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
        const declaration = node.parent
        const statement = declaration?.parent?.parent
        const owner = nearestFunction(node)
        if (node.questionDotToken || node.arguments.length || node.typeArguments?.length || !ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !ts.isIdentifier(declaration.name) || !isLocalConst(declaration) || !owner || statement?.parent !== owner.body) {
          throw sourceNodeError(node, sourceFile, "React Router useNavigate must initialize one top-level const identifier in a component")
        }
        const entry = { name: declaration.name.text, declaration, statement, owner }
        navigateDeclarations.add(declaration)
        navigateFunctions.push(entry)
      }
      ts.forEachChild(node, collectNavigateHooks)
    }
    collectNavigateHooks(sourceFile)
    for (const entry of navigateFunctions) {
      const collectCalls = node => {
        if (ts.isIdentifier(node) && node.text === entry.name && isReferenceIdentifier(node) && !localBindingShadowed(node, entry)) {
          const call = node.parent
          if (!ts.isCallExpression(call) || call.expression !== node || call.questionDotToken || call.typeArguments?.length || nearestFunction(call) === entry.owner) {
            throw sourceNodeError(node, sourceFile, "React Router navigate bindings may only be called directly from a nested browser callback")
          }
          if (call.arguments.length < 1 || call.arguments.length > 2 || !ts.isStringLiteral(call.arguments[0])) {
            throw sourceNodeError(call, sourceFile, 'React Router useNavigate requires a static root-relative navigate("/path") destination')
          }
          const destination = call.arguments[0].text
          const pathname = destination.match(/^[^?#]*/)[0]
          let decoded
          try { decoded = decodeURIComponent(pathname) } catch { throw sourceNodeError(call.arguments[0], sourceFile, 'React Router useNavigate requires a safe static root-relative navigate("/path") destination') }
          if (!destination.startsWith("/") || destination.startsWith("//") || /%(?:2f|5c)/i.test(pathname) || /[\\\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw sourceNodeError(call.arguments[0], sourceFile, 'React Router useNavigate requires a safe static root-relative navigate("/path") destination')
          let method = "assign"
          if (call.arguments.length === 2) {
            const options = unwrapExpression(call.arguments[1])
            const property = ts.isObjectLiteralExpression(options) && options.properties.length === 1 ? options.properties[0] : undefined
            const name = property && ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined
            if (name !== "replace" || property.initializer.kind !== ts.SyntaxKind.TrueKeyword) throw sourceNodeError(call.arguments[1], sourceFile, 'React Router useNavigate only supports exactly { replace: true } as a second argument')
            method = "replace"
          }
          navigateCalls.set(call, { method, destination: withBase(base, destination) })
          return
        }
        ts.forEachChild(node, collectCalls)
      }
      collectCalls(entry.owner.body)
    }

    const routerProps = new Set(["discover", "end", "prefetch", "preventScrollReset", "relative", "reloadDocument", "replace", "state", "viewTransition"])
    const attributes = attributesNode => {
      const output = []
      let destination
      for (const property of attributesNode.properties) {
        if (ts.isJsxSpreadAttribute(property)) throw sourceNodeError(property, sourceFile, "React Router Link does not support spread attributes during native anchor lowering")
        const name = property.name.text
        if (name === "href") throw sourceNodeError(property, sourceFile, "React Router Link must not declare href; Kudzu derives it from to")
        if (routerProps.has(name)) throw sourceNodeError(property, sourceFile, `React Router Link prop ${JSON.stringify(name)} cannot be erased to a native anchor`)
        if (name !== "to") {
          output.push(ts.visitEachChild(property, visitor, context))
          continue
        }
        if (destination !== undefined) throw sourceNodeError(property, sourceFile, "React Router Link requires exactly one to attribute")
        if (!property.initializer || !ts.isStringLiteral(property.initializer)) throw sourceNodeError(property, sourceFile, 'React Router Link requires a static root-relative to="/path"')
        destination = property.initializer.text
        const pathname = destination.match(/^[^?#]*/)[0]
        let decoded
        try { decoded = decodeURIComponent(pathname) } catch { throw sourceNodeError(property.initializer, sourceFile, 'React Router Link requires a safe static root-relative to="/path"') }
        if (!destination.startsWith("/") || destination.startsWith("//") || /%(?:2f|5c)/i.test(pathname) || /[\\\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw sourceNodeError(property.initializer, sourceFile, 'React Router Link requires a safe static root-relative to="/path"')
        output.push(factory.createJsxAttribute(factory.createIdentifier("href"), factory.createStringLiteral(withBase(base, destination))))
      }
      if (destination === undefined) throw sourceNodeError(attributesNode.parent, sourceFile, "React Router Link requires exactly one static root-relative to attribute")
      return factory.updateJsxAttributes(attributesNode, output)
    }
    const importedLink = tag => ts.isIdentifier(tag) && links.has(tag.text) && !isShadowedIdentifier(tag, sourceFile)
    const visitor = node => {
      if (searchFallbackValues.has(node)) return factory.createStringLiteral(searchFallbackValues.get(node))
      if (ts.isVariableStatement(node) && node.declarationList.declarations.length === 1) {
        const declaration = node.declarationList.declarations[0]
        const composed = composedSearchDeclarations.get(declaration)
        if (composed) {
          const raw = factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
            factory.createVariableDeclaration(composed.name, undefined, undefined, factory.createCallExpression(factory.createIdentifier(searchHelper), undefined, [searchReads.get(composed.call)]))
          ], ts.NodeFlags.Const))
          return [raw, ts.visitEachChild(node, visitor, context)]
        }
      }
      if (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => searchDeclarations.has(declaration) || navigateDeclarations.has(declaration))) {
        const declarations = node.declarationList.declarations.flatMap(declaration => {
          if (navigateDeclarations.has(declaration)) return []
          if (!searchDeclarations.has(declaration)) return [ts.visitEachChild(declaration, visitor, context)]
          const entry = searchObjects.find(candidate => candidate.declaration === declaration)
          if (!entry?.setter) return []
          return [factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, factory.createCallExpression(factory.createIdentifier(searchWriterHelper), undefined, []))]
        })
        if (!declarations.length) return undefined
        return factory.updateVariableStatement(node, node.modifiers, factory.updateVariableDeclarationList(node.declarationList, declarations))
      }
      if (ts.isCallExpression(node) && searchReads.has(node)) return composedSearchCalls.has(node) ? factory.createIdentifier(composedSearchCalls.get(node)) : factory.createCallExpression(factory.createIdentifier(searchHelper), undefined, [searchReads.get(node)])
      if (ts.isCallExpression(node) && searchWrites.has(node)) {
        const { updater, replace } = searchWrites.get(node)
        return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("globalThis"), "__kSetSearchParams"), undefined, [ts.visitNode(updater, visitor), replace ? factory.createTrue() : factory.createFalse()])
      }
      if (ts.isCallExpression(node) && navigateCalls.has(node)) {
        const { method, destination } = navigateCalls.get(node)
        return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createPropertyAccessExpression(factory.createIdentifier("globalThis"), "location"), method), undefined, [factory.createStringLiteral(destination)])
      }
      if (ts.isCallExpression(node) && matchCalls.has(node)) return factory.createCallExpression(factory.createIdentifier(matchHelper), undefined, [factory.createStringLiteral(matchCalls.get(node))])
      if (ts.isJsxElement(node) && importedLink(node.openingElement.tagName)) {
        const opening = factory.updateJsxOpeningElement(node.openingElement, factory.createIdentifier("a"), node.openingElement.typeArguments, attributes(node.openingElement.attributes))
        const closing = factory.updateJsxClosingElement(node.closingElement, factory.createIdentifier("a"))
        return factory.updateJsxElement(node, opening, ts.visitNodes(node.children, visitor), closing)
      }
      if (ts.isJsxSelfClosingElement(node) && importedLink(node.tagName)) return factory.updateJsxSelfClosingElement(node, factory.createIdentifier("a"), node.typeArguments, attributes(node.attributes))
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && params.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
        if (node.questionDotToken || node.arguments.length || (node.typeArguments?.length ?? 0) > 1) throw sourceNodeError(node, sourceFile, "React Router useParams must be called directly without runtime arguments and with at most one type argument")
        return node
      }
      if (ts.isIdentifier(node) && links.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router Link imports may only be used as direct JSX elements")
      if (ts.isIdentifier(node) && params.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useParams imports may only be called directly")
      if (ts.isIdentifier(node) && matchHooks.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useMatch imports may only initialize the supported top-level const binding")
      if (ts.isIdentifier(node) && searchHooks.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useSearchParams imports may only initialize the supported top-level tuple binding")
      if (ts.isIdentifier(node) && navigateHooks.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useNavigate imports may only initialize the supported top-level navigate binding")
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === compatibilityPackages.reactRouter) {
        const clause = node.importClause
        if (!clause || clause.isTypeOnly) return node
        const bindings = clause.namedBindings
        if (!bindings || !ts.isNamedImports(bindings)) return node
        const elements = bindings.elements.filter(entry => entry.isTypeOnly || !["Link", "useParams", "useMatch", "useSearchParams", "useNavigate"].includes((entry.propertyName ?? entry.name).text))
        if (!elements.length) return undefined
        return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, clause.isTypeOnly, undefined, factory.updateNamedImports(bindings, elements)), node.moduleSpecifier, node.attributes)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    const normalized = ts.visitNode(sourceFile, visitor)
    if (!params.size && !matchHooks.size && !searchHooks.size) return normalized
    const imports = [
      ...[...params].map(name => factory.createImportSpecifier(false, name === "useParams" ? undefined : factory.createIdentifier("useParams"), factory.createIdentifier(name))),
      ...(matchHooks.size ? [factory.createImportSpecifier(false, matchHelper === "__kUseRouteMatch" ? undefined : factory.createIdentifier("__kUseRouteMatch"), factory.createIdentifier(matchHelper))] : []),
      ...(searchReads.size ? [factory.createImportSpecifier(false, factory.createIdentifier("useSearchParam"), factory.createIdentifier(searchHelper))] : []),
      ...(searchObjects.some(entry => entry.setter) ? [factory.createImportSpecifier(false, factory.createIdentifier("useSearchParamsWriter"), factory.createIdentifier(searchWriterHelper))] : [])
    ]
    const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(imports)), factory.createStringLiteral("@kudzujs/core"))
    const statements = [...normalized.statements]
    statements.splice(statements.findLastIndex(statement => ts.isImportDeclaration(statement)) + 1, 0, declaration)
    return factory.updateSourceFile(normalized, statements)
  }
}
