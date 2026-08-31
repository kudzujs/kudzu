import ts from "typescript"
import { createBindingIndex } from "./analysis/binding-index.mjs"
import { effectReturns, importDeclarationNames, isNodeWithin, isShadowedIdentifier, nearestFunction, referenceIdentifiers, referencesIdentifier, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"
import { ownedLazyPackageImport } from "./source-graph.mjs"

export function normalizeEffectPrivateRefs(sourceFile, factory, context) {
    const bindingIndex = createBindingIndex(sourceFile)
    const frameCall = (node, name) => ts.isCallExpression(node) && (
      ts.isIdentifier(node.expression) && node.expression.text === name ||
      ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "window" && node.expression.name.text === name
    )
    const unshadowedFrameCall = (node, owner) => {
      const name = ts.isIdentifier(node.expression) ? node.expression : ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) ? node.expression.expression : undefined
      return name && !isShadowedIdentifier(name, owner) && !sourceFile.statements.some(statement => statementDeclaresName(statement, name.text) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name.text))
    }
    const currentAccess = (node, name) => ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name && node.name.text === "current"
    const directOrGuarded = (statement, body, name, negated) => {
      if (statement.parent === body) return true
      let branch = statement
      if (ts.isBlock(statement.parent) && statement.parent.statements.length === 1) branch = statement.parent
      const conditional = branch.parent
      if (!ts.isIfStatement(conditional) || conditional.thenStatement !== branch || conditional.parent !== body || conditional.elseStatement) return false
      let condition = unwrapExpression(conditional.expression)
      const isNegated = ts.isPrefixUnaryExpression(condition) && condition.operator === ts.SyntaxKind.ExclamationToken
      if (isNegated) condition = unwrapExpression(condition.operand)
      return isNegated === negated && currentAccess(condition, name)
    }
    const containsLazyImport = node => {
      if (ownedLazyPackageImport(node, bindingIndex)) return true
      let found = false
      ts.forEachChild(node, child => { if (!found) found = containsLazyImport(child) })
      return found
    }
    const directLazyImportCallback = (callback, effectCallback) => {
      const call = callback?.parent
      return (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && ts.isCallExpression(call) && call.arguments[0] === callback && ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "then" && ownedLazyPackageImport(unwrapExpression(call.expression.expression), bindingIndex) && isNodeWithin(callback, effectCallback)
    }
    const hasUseRefImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useRef"))
    const hasUseEffectImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useEffect"))
    const hasUseStateImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useState"))
    const privateRefs = new Map()
    const effectRefs = new Map()
    const retainedRefs = new Map()
    const registerPrivateRef = (node, callback) => {
      const initializer = ts.isNumericLiteral(node.initializer.arguments[0]) ? factory.createNumericLiteral(0) : factory.createNull()
      privateRefs.set(node, callback)
      const refs = effectRefs.get(callback) ?? []
      refs.push({ name: node.name.text, initializer })
      effectRefs.set(callback, refs)
    }
    const inspect = node => {
      const refInitializer = ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer) ? node.initializer.arguments[0] : undefined
      if (!hasUseRefImport || !ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer || !ts.isCallExpression(node.initializer) || !ts.isIdentifier(node.initializer.expression) || node.initializer.expression.text !== "useRef" || isShadowedIdentifier(node.initializer.expression, sourceFile) || node.initializer.arguments.length !== 1 || !(refInitializer?.kind === ts.SyntaxKind.NullKeyword || ts.isNumericLiteral(refInitializer) && Number(refInitializer.text) === 0)) {
        ts.forEachChild(node, inspect)
        return
      }
      const owner = nearestFunction(node)
      if (!owner?.body || !ts.isBlock(owner.body)) return
      const references = referenceIdentifiers(owner.body, node.name.text)
      const attachedToJsx = references.some(reference => ts.isJsxExpression(reference.parent) && ts.isJsxAttribute(reference.parent.parent) && reference.parent.parent.name.text === "ref")
      const invalidReference = references.find(reference => !ts.isPropertyAccessExpression(reference.parent) || reference.parent.expression !== reference || reference.parent.name.text !== "current")
      const accesses = references.filter(reference => ts.isPropertyAccessExpression(reference.parent) && reference.parent.expression === reference && reference.parent.name.text === "current").map(reference => reference.parent)
      const mutations = accesses.filter(access =>
        (ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && access.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
        ((ts.isPrefixUnaryExpression(access.parent) || ts.isPostfixUnaryExpression(access.parent)) && access.parent.operand === access && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(access.parent.operator)) ||
        (ts.isDeleteExpression(access.parent) && access.parent.expression === access)
      )
      const frameAssignments = accesses.filter(access => ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && frameCall(unwrapExpression(access.parent.right), "requestAnimationFrame") && unshadowedFrameCall(unwrapExpression(access.parent.right), owner))
      const statement = node.parent?.parent
      const topLevelOwner = owner.parent === sourceFile || ts.isVariableDeclaration(owner.parent) && owner.parent.parent?.parent?.parent === sourceFile
      const topLevelConst = topLevelOwner && ts.isVariableStatement(statement) && (statement.declarationList.flags & ts.NodeFlags.Const) && statement.declarationList.declarations.length === 1 && statement.parent === owner.body
      if (frameAssignments.length && invalidReference) throw sourceNodeError(invalidReference, sourceFile, "Animation frame refs may only use direct .current reads and assignments")
      if (frameAssignments.length && !topLevelConst) throw sourceNodeError(node, sourceFile, "Animation frame refs must be one top-level component const")
      if (attachedToJsx && mutations.length) throw sourceNodeError(mutations[0], sourceFile, "JSX object refs may not assign to ref.current")
      if (!topLevelConst || invalidReference || !accesses.length) return
      const effectCalls = owner.body.statements.flatMap(statement => hasUseEffectImport && ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && ts.isIdentifier(statement.expression.expression) && statement.expression.expression.text === "useEffect" && !isShadowedIdentifier(statement.expression.expression, sourceFile) ? [statement.expression] : [])
      const effects = effectCalls.filter(effect => {
        const callback = effect.arguments[0]
        return callback && accesses.every(access => isNodeWithin(access, callback))
      })
      if (!frameAssignments.length && refInitializer?.kind === ts.SyntaxKind.NullKeyword && !invalidReference && !effects.length) {
        const owners = effectCalls.filter(effect => {
          const callback = effect.arguments[0]
          return callback && accesses.some(access => isNodeWithin(access, callback))
        })
        const callbacks = owners.map(effect => effect.arguments[0])
        const directCallbacks = callbacks.every(callback => (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && ts.isBlock(callback.body))
        const everyAccessOwned = accesses.every(access => callbacks.filter(callback => isNodeWithin(access, callback)).length === 1)
        const mountEffects = owners.filter(effect => ts.isArrayLiteralExpression(effect.arguments[1]) && (!effect.arguments[1].elements.length || containsLazyImport(effect.arguments[0])))
        const updateEffects = owners.filter(effect => !mountEffects.includes(effect))
        if (owners.length >= 2 && directCallbacks && everyAccessOwned && mountEffects.length === 1 && updateEffects.length === owners.length - 1 && owners[0] === mountEffects[0]) {
          const mount = mountEffects[0]
          const callback = mount.arguments[0]
          const returns = effectReturns(callback)
          const cleanup = returns.cleanups.length === 1 ? returns.cleanups[0] : undefined
          const writes = accesses.filter(access => ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken)
          const setupWrites = writes.filter(access => isNodeWithin(access, callback) && (!cleanup || !isNodeWithin(access, cleanup)))
          const cleanupWrites = cleanup ? writes.filter(access => isNodeWithin(access, cleanup)) : []
          const setupStatement = setupWrites[0]?.parent.parent
          const cleanupStatement = cleanupWrites[0]?.parent.parent
          const directSetup = setupWrites.length === 1 && ts.isExpressionStatement(setupStatement) && (setupStatement.parent === callback.body || directLazyImportCallback(nearestFunction(setupWrites[0]), callback)) && unwrapExpression(setupWrites[0].parent.right).kind !== ts.SyntaxKind.NullKeyword
          const directCleanup = cleanup && ts.isBlock(cleanup.body) && cleanupWrites.length === 1 && ts.isExpressionStatement(cleanupStatement) && cleanupStatement.parent === cleanup.body && unwrapExpression(cleanupWrites[0].parent.right).kind === ts.SyntaxKind.NullKeyword
          const updateWrites = mutations.some(access => updateEffects.some(effect => isNodeWithin(access, effect.arguments[0])))
          if (directSetup && directCleanup && !updateWrites) {
            if (!hasUseStateImport) throw sourceNodeError(node, sourceFile, "Retained instance refs require a named useState import")
            const setterName = `__kSetRetainedRef_${node.name.text}_${node.pos}`
            if (referencesIdentifier(owner.body, setterName)) throw sourceNodeError(node, sourceFile, "Retained instance ref conflicts with a compiler-owned binding")
            retainedRefs.set(node, setterName)
            return
          }
        }
        if (owners.length >= 2) throw sourceNodeError(node, sourceFile, "Retained instance refs require one empty-dependency mount effect or guarded lazy activation effect with one direct assignment and null-reset cleanup followed by read-only dependency effects")
      }
      if (!frameAssignments.length) {
        const callback = effects.length === 1 ? effects[0].arguments[0] : undefined
        if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) && ts.isBlock(callback.body)) {
          const cleanups = effectReturns(callback).cleanups
          const cleanupWrites = cleanups.length === 1 && accesses.some(access => isNodeWithin(access, cleanups[0]) && ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && access.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment)
          if (!cleanupWrites) throw sourceNodeError(node, sourceFile, "Effect-private refs require one cleanup that directly resets or invalidates ref.current")
          registerPrivateRef(node, callback)
        }
        return
      }
      if (frameAssignments.length !== 1) throw sourceNodeError(node, sourceFile, "Animation frame refs require one direct ref.current = requestAnimationFrame(callback) assignment")
      const frame = unwrapExpression(frameAssignments[0].parent.right)
      const frameCallback = frame.arguments.length === 1 && ts.isIdentifier(unwrapExpression(frame.arguments[0])) ? unwrapExpression(frame.arguments[0]) : undefined
      if (effects.length !== 1) throw sourceNodeError(node, sourceFile, "Animation frame refs must belong to one inline component effect")
      const effect = effects[0]
      const callback = effect.arguments[0]
      if (!(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) || !ts.isBlock(callback.body)) throw sourceNodeError(callback, sourceFile, "Animation frame refs require one inline block-bodied effect")
      if (accesses.some(access => !isNodeWithin(access, callback))) throw sourceNodeError(node, sourceFile, "Animation frame refs may only be used inside their owning effect")
      const callbacks = new Map()
      for (const statement of callback.body.statements) {
        if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) callbacks.set(declaration.name.text, declaration.initializer)
        }
        if (ts.isFunctionDeclaration(statement) && statement.name && statement.body) callbacks.set(statement.name.text, statement)
      }
      const frameOwner = nearestFunction(frameAssignments[0])
      const shadowedCallback = frameCallback && isShadowedIdentifier(frameCallback, callback.body)
      const update = frameCallback && !shadowedCallback && callbacks.get(frameCallback.text)
      if (!update) throw sourceNodeError(frame, sourceFile, "Animation frame refs require a direct local callback")
      const frameStatement = frameAssignments[0].parent.parent
      if (!frameOwner || ![...callbacks.values()].includes(frameOwner) || !ts.isBlock(frameOwner.body) || !ts.isExpressionStatement(frameStatement) || !directOrGuarded(frameStatement, frameOwner.body, node.name.text, true)) throw sourceNodeError(frameAssignments[0], sourceFile, "Animation frame requests must be assigned directly inside one local scheduler")
      const resetAssignments = accesses.filter(access => ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isNumericLiteral(unwrapExpression(access.parent.right)) && Number(unwrapExpression(access.parent.right).text) === 0)
      const resetStatement = resetAssignments[0]?.parent.parent
      if (resetAssignments.length !== 1 || nearestFunction(resetAssignments[0]) !== update || !ts.isBlock(update.body) || !ts.isExpressionStatement(resetStatement) || resetStatement.parent !== update.body) throw sourceNodeError(update, sourceFile, "Animation frame callbacks must directly reset their ref to 0")
      const writes = accesses.filter(access => ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && access.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment)
      if (writes.length !== 2) throw sourceNodeError(node, sourceFile, "Animation frame refs may only be assigned by their request and reset operations")
      const returns = effectReturns(callback)
      const cancellations = []
      const collectCancellations = current => {
        const argument = current.arguments?.[0] && unwrapExpression(current.arguments[0])
        if (frameCall(current, "cancelAnimationFrame") && unshadowedFrameCall(current, owner) && current.arguments.length === 1 && currentAccess(argument, node.name.text) && !isShadowedIdentifier(argument.expression, owner.body)) cancellations.push(current)
        ts.forEachChild(current, collectCancellations)
      }
      collectCancellations(callback.body)
      const cancellation = cancellations[0]
      const cleanup = cancellation && returns.cleanups.find(candidate => nearestFunction(cancellation) === candidate)
      const cancellationStatement = cancellation?.parent
      if (cancellations.length !== 1 || !cleanup || !ts.isBlock(cleanup.body) || !ts.isExpressionStatement(cancellationStatement) || !directOrGuarded(cancellationStatement, cleanup.body, node.name.text, false)) throw sourceNodeError(node, sourceFile, "Animation frame refs require direct cancellation in effect cleanup")
      registerPrivateRef(node, callback)
    }
    inspect(sourceFile)
    const retainedByOwner = new Map()
    for (const declaration of retainedRefs.keys()) {
      const owner = nearestFunction(declaration)
      const refs = retainedByOwner.get(owner) ?? []
      refs.push(declaration)
      retainedByOwner.set(owner, refs)
    }
    for (const refs of retainedByOwner.values()) if (refs.length > 1) throw sourceNodeError(refs[1], sourceFile, "Components may own only one retained instance ref")
    if (!privateRefs.size && !retainedRefs.size) return sourceFile
    const visitor = node => {
      if (ts.isVariableStatement(node) && node.declarationList.declarations.length === 1 && privateRefs.has(node.declarationList.declarations[0])) return undefined
      if (ts.isVariableDeclaration(node) && retainedRefs.has(node)) {
        const binding = factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, node.name),
          factory.createBindingElement(undefined, undefined, retainedRefs.get(node))
        ])
        const initializer = factory.createCallExpression(factory.createIdentifier("useState"), undefined, [
          factory.createObjectLiteralExpression([factory.createPropertyAssignment("current", factory.createNull())])
        ])
        return factory.updateVariableDeclaration(node, binding, node.exclamationToken, undefined, initializer)
      }
      const refs = effectRefs.get(node)
      if (refs && (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isBlock(node.body)) {
        const body = ts.visitEachChild(node.body, visitor, context)
        const declarations = refs.map(ref => factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
          factory.createVariableDeclaration(ref.name, undefined, undefined, factory.createObjectLiteralExpression([
            factory.createPropertyAssignment("current", ref.initializer)
          ]))
        ], ts.NodeFlags.Const)))
        const nextBody = factory.updateBlock(body, [...declarations, ...body.statements])
        if (ts.isArrowFunction(node)) return factory.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, nextBody)
        return factory.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, nextBody)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(sourceFile, visitor)
}
