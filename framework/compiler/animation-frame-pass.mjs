import ts from "typescript"
import { effectReturns, importDeclarationNames, isShadowedIdentifier, nearestFunction, referenceIdentifiers, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"

export function normalizeEffectAnimationFrameRefs(sourceFile, factory, context) {
    const frameCall = (node, name) => ts.isCallExpression(node) && (
      ts.isIdentifier(node.expression) && node.expression.text === name ||
      ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "window" && node.expression.name.text === name
    )
    const unshadowedFrameCall = (node, owner) => {
      const name = ts.isIdentifier(node.expression) ? node.expression : ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) ? node.expression.expression : undefined
      return name && !isShadowedIdentifier(name, owner) && !sourceFile.statements.some(statement => statementDeclaresName(statement, name.text) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name.text))
    }
    const currentAccess = (node, name) => ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name && node.name.text === "current"
    const inside = (node, root) => {
      for (let current = node; current; current = current.parent) if (current === root) return true
      return false
    }
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
    const hasUseRefImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useRef"))
    const hasUseEffectImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier) && ["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useEffect"))
    const replacements = new Set()
    const inspect = node => {
      if (!hasUseRefImport || !ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer || !ts.isCallExpression(node.initializer) || !ts.isIdentifier(node.initializer.expression) || node.initializer.expression.text !== "useRef" || isShadowedIdentifier(node.initializer.expression, sourceFile) || node.initializer.arguments.length !== 1 || !ts.isNumericLiteral(node.initializer.arguments[0]) || Number(node.initializer.arguments[0].text) !== 0) {
        ts.forEachChild(node, inspect)
        return
      }
      const owner = nearestFunction(node)
      if (!owner?.body || !ts.isBlock(owner.body)) return
      const accesses = []
      const collect = current => {
        if (currentAccess(current, node.name.text) && !isShadowedIdentifier(current.expression, owner.body)) accesses.push(current)
        ts.forEachChild(current, collect)
      }
      collect(owner.body)
      const frameAssignments = accesses.filter(access => ts.isBinaryExpression(access.parent) && unwrapExpression(access.parent.left) === access && access.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken && frameCall(unwrapExpression(access.parent.right), "requestAnimationFrame") && unshadowedFrameCall(unwrapExpression(access.parent.right), owner))
      if (!frameAssignments.length) return
      const invalidReference = referenceIdentifiers(owner.body, node.name.text).find(reference => !ts.isPropertyAccessExpression(reference.parent) || reference.parent.expression !== reference || reference.parent.name.text !== "current")
      if (invalidReference) throw sourceNodeError(invalidReference, sourceFile, "Animation frame refs may only use direct .current reads and assignments")
      const statement = node.parent?.parent
      const topLevelOwner = owner.parent === sourceFile || ts.isVariableDeclaration(owner.parent) && owner.parent.parent?.parent?.parent === sourceFile
      if (!topLevelOwner || !ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const) || statement.declarationList.declarations.length !== 1 || statement.parent !== owner.body) throw sourceNodeError(node, sourceFile, "Animation frame refs must be one top-level component const")
      if (frameAssignments.length !== 1) throw sourceNodeError(node, sourceFile, "Animation frame refs require one direct ref.current = requestAnimationFrame(callback) assignment")
      const frame = unwrapExpression(frameAssignments[0].parent.right)
      const frameCallback = frame.arguments.length === 1 && ts.isIdentifier(unwrapExpression(frame.arguments[0])) ? unwrapExpression(frame.arguments[0]) : undefined
      const effectCalls = owner.body.statements.flatMap(statement => hasUseEffectImport && ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && ts.isIdentifier(statement.expression.expression) && statement.expression.expression.text === "useEffect" && !isShadowedIdentifier(statement.expression.expression, sourceFile) ? [statement.expression] : [])
      const effects = effectCalls.filter(effect => effect.arguments[0] && inside(frameAssignments[0], effect.arguments[0]))
      if (effects.length !== 1) throw sourceNodeError(node, sourceFile, "Animation frame refs must belong to one inline component effect")
      const effect = effects[0]
      const callback = effect.arguments[0]
      if (!(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) || !ts.isBlock(callback.body)) throw sourceNodeError(callback, sourceFile, "Animation frame refs require one inline block-bodied effect")
      if (accesses.some(access => !inside(access, callback))) throw sourceNodeError(node, sourceFile, "Animation frame refs may only be used inside their owning effect")
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
      replacements.add(node)
    }
    inspect(sourceFile)
    if (!replacements.size) return sourceFile
    const visitor = node => {
      if (replacements.has(node)) return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, factory.createObjectLiteralExpression([
        factory.createPropertyAssignment("current", factory.createNumericLiteral(0))
      ]))
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(sourceFile, visitor)
}
