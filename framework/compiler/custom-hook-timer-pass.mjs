import { createHash } from "node:crypto"
import ts from "typescript"
import { effectReturns, nearestFunction, referencesIdentifier, sourceNodeError, unwrapExpression } from "./ast-helpers.mjs"

const customHookTimerStatePrefix = "__kTimerState_"
const customHookTimerSetterPrefix = "__kSetTimerState_"

export function normalizeCustomHookTimerRefs(sourceFile, factory, context) {
    const timerCall = (node, name) => ts.isCallExpression(node) && (
      ts.isIdentifier(node.expression) && node.expression.text === name ||
      ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "window" && node.expression.name.text === name
    )
    const currentAccess = (node, name) => ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name && node.name.text === "current"
    const clearStatement = (node, name) => {
      if (!ts.isIfStatement(node) || node.elseStatement || !currentAccess(unwrapExpression(node.expression), name)) return undefined
      const statement = ts.isBlock(node.thenStatement) && node.thenStatement.statements.length === 1 ? node.thenStatement.statements[0] : node.thenStatement
      if (!ts.isExpressionStatement(statement) || !timerCall(statement.expression, "clearTimeout") || statement.expression.arguments.length !== 1 || !currentAccess(unwrapExpression(statement.expression.arguments[0]), name)) return undefined
      return { condition: unwrapExpression(node.expression), argument: unwrapExpression(statement.expression.arguments[0]) }
    }
    const analyze = (hook, hookName) => {
      if (!/^use[A-Z]/.test(hookName) || hook.parameters.length || !hook.body || !ts.isBlock(hook.body)) return undefined
      const returnedStatement = hook.body.statements.at(-1)
      const returned = returnedStatement && ts.isReturnStatement(returnedStatement) && returnedStatement.expression ? unwrapExpression(returnedStatement.expression) : undefined
      if (!returned || !ts.isObjectLiteralExpression(returned)) return undefined
      const returnedNames = new Set(returned.properties.filter(ts.isShorthandPropertyAssignment).map(property => property.name.text))
      const callbacks = new Map()
      const refs = []
      for (const statement of hook.body.statements) {
        if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) callbacks.set(declaration.name.text, declaration.initializer)
          if (ts.isIdentifier(declaration.name) && declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useRef" && declaration.initializer.arguments.length === 1 && declaration.initializer.arguments[0].kind === ts.SyntaxKind.NullKeyword) refs.push({ declaration, name: declaration.name.text })
        }
      }
      const candidates = []
      for (const ref of refs) {
        const assignments = []
        const accesses = []
        const clearStatements = []
        const collect = node => {
          if (currentAccess(node, ref.name)) accesses.push(node)
          if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && currentAccess(unwrapExpression(node.left), ref.name)) assignments.push(node)
          const clear = clearStatement(node, ref.name)
          if (clear) clearStatements.push({ node, ...clear })
          ts.forEachChild(node, collect)
        }
        collect(hook.body)
        if (assignments.some(assignment => timerCall(unwrapExpression(assignment.right), "setTimeout"))) candidates.push({ ...ref, assignments, accesses, clearStatements })
      }
      if (!candidates.length) return undefined
      if (candidates.length !== 1) throw sourceNodeError(hook, sourceFile, "Relative custom hooks may own only one private timeout ref")
      const timer = candidates[0]
      if (timer.assignments.length !== 1) throw sourceNodeError(timer.declaration, sourceFile, "Private timeout refs require one direct timer.current = setTimeout(...) assignment")
      const assignment = timer.assignments[0]
      const timeout = unwrapExpression(assignment.right)
      const timeoutCallback = timeout.arguments[0]
      const delay = timeout.arguments[1]
      if (!timerCall(timeout, "setTimeout") || timeout.arguments.length !== 2 || !timeoutCallback || !(ts.isArrowFunction(timeoutCallback) || ts.isFunctionExpression(timeoutCallback)) || timeoutCallback.parameters.length || !delay || !ts.isNumericLiteral(unwrapExpression(delay))) throw sourceNodeError(assignment, sourceFile, "Private timeout refs require setTimeout() with one zero-argument callback and a numeric literal delay")
      const callback = nearestFunction(assignment)
      const callbackName = [...callbacks].find(([, value]) => value === callback)?.[0]
      if (!callbackName || !returnedNames.has(callbackName) || !ts.isBlock(callback.body) || !ts.isExpressionStatement(assignment.parent) || assignment.parent.parent !== callback.body) throw sourceNodeError(assignment, sourceFile, "Private timeout refs must be assigned directly inside one returned custom-hook callback")
      const callbackClear = timer.clearStatements.find(entry => nearestFunction(entry.node) === callback)
      if (!callbackClear || callbackClear.node.parent !== callback.body || callback.body.statements.indexOf(callbackClear.node) >= callback.body.statements.indexOf(assignment.parent)) throw sourceNodeError(callback, sourceFile, "Private timeout callbacks must directly clear the previous timer before assigning its replacement")
      const effectCalls = hook.body.statements.flatMap(statement => {
        if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression) || !ts.isIdentifier(statement.expression.expression) || statement.expression.expression.text !== "useEffect") return []
        return [statement.expression]
      })
      let cleanupClear
      for (const effect of effectCalls) {
        const [setup, dependencies] = effect.arguments
        if (!(ts.isArrowFunction(setup) || ts.isFunctionExpression(setup)) || !ts.isArrayLiteralExpression(dependencies) || dependencies.elements.length) continue
        const returns = effectReturns(setup)
        if (returns.cleanups.length !== 1) continue
        const cleanup = returns.cleanups[0]
        const entry = timer.clearStatements.find(candidate => nearestFunction(candidate.node) === cleanup)
        if (entry && ts.isBlock(cleanup.body) && cleanup.body.statements.length === 1 && cleanup.body.statements[0] === entry.node) cleanupClear = entry
      }
      if (!cleanupClear) throw sourceNodeError(timer.declaration, sourceFile, "Private timeout refs require one empty-dependency effect that directly clears the timer on cleanup")
      const accepted = new Set([assignment.left, callbackClear.condition, callbackClear.argument, cleanupClear.condition, cleanupClear.argument].map(unwrapExpression))
      const unsupported = timer.accesses.find(access => !accepted.has(access))
      if (unsupported) throw sourceNodeError(unsupported, sourceFile, "Private timeout refs may only be read by their direct replacement and cleanup guards")
      const identity = createHash("sha256").update(`${sourceFile.fileName}:${hook.pos}:${timer.name}`).digest("hex").slice(0, 10)
      const stateName = `${customHookTimerStatePrefix}${identity}`
      const setterName = `${customHookTimerSetterPrefix}${identity}`
      if (referencesIdentifier(hook.body, stateName) || referencesIdentifier(hook.body, setterName)) throw sourceNodeError(timer.declaration, sourceFile, "Private timeout ref conflicts with compiler-owned bindings")
      return { assignment, declaration: timer.declaration, refName: timer.name, returned, stateName, setterName }
    }
    const timerStates = new Set()
    const transform = (hook, hookName) => {
      const timer = analyze(hook, hookName)
      if (!timer) return undefined
      timerStates.add(timer.stateName)
      const timerVisitor = current => {
        if (current === timer.declaration) {
          const binding = factory.createArrayBindingPattern([
            factory.createBindingElement(undefined, undefined, timer.stateName),
            factory.createBindingElement(undefined, undefined, timer.setterName)
          ])
          const initializer = factory.updateCallExpression(current.initializer, factory.createIdentifier("useState"), current.initializer.typeArguments, current.initializer.arguments)
          return factory.updateVariableDeclaration(current, binding, current.exclamationToken, undefined, initializer)
        }
        if (current === timer.assignment) return factory.createCallExpression(factory.createIdentifier(timer.setterName), undefined, [ts.visitNode(current.right, timerVisitor)])
        if (currentAccess(current, timer.refName)) return factory.createIdentifier(timer.stateName)
        if (current === timer.returned) return factory.updateObjectLiteralExpression(current, [
          ...current.properties,
          factory.createShorthandPropertyAssignment(timer.stateName),
          factory.createShorthandPropertyAssignment(timer.setterName)
        ])
        return ts.visitEachChild(current, timerVisitor, context)
      }
      return ts.visitEachChild(hook, timerVisitor, context)
    }
    const visitor = node => {
      if (ts.isFunctionDeclaration(node)) {
        const hookName = node.name?.text ?? (node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) ? "useDefault" : "")
        const transformed = transform(node, hookName)
        if (transformed) return transformed
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        const transformed = transform(node.initializer, node.name.text)
        if (transformed) return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, transformed)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return { sourceFile: ts.visitNode(sourceFile, visitor), timerStates }
}
