import ts from "typescript"
import { isNodeWithin, nearestFunction, referencesIdentifier, unwrapExpression } from "./ast-helpers.mjs"
import { collectionExpression } from "./collection-analysis.mjs"
import { referencedStateNames } from "./descriptor-session.mjs"

export function analyzeEffectDependencies({ dependencies, node, listEffect, keyedItem, setters, localDeclarations, factory, fail, bindingIndex, resolveCalculation }) {
  const itemDependencies = []
  const ordinaryDependencies = []
  let dependencyItem = listEffect ? keyedItem : undefined
  for (const dependency of dependencies.elements) {
    const value = unwrapExpression(dependency)
    if (ts.isElementAccessExpression(value) && ts.isIdentifier(unwrapExpression(value.expression)) && isDestructuredParameter(unwrapExpression(value.expression), nearestFunction(node)) && !ts.isStringLiteral(value.argumentExpression) && !ts.isNumericLiteral(value.argumentExpression)) fail(dependency, "useEffect() object property dependencies require a direct static property path")
    if (!dependencyItem && ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && isDestructuredParameter(value.expression, nearestFunction(node))) dependencyItem = value.expression.text
    const field = dependencyItem && directProperty(dependency, dependencyItem)
    if (field) {
      if (["__proto__", "constructor", "prototype"].includes(field)) fail(dependency, `useEffect() keyed item property "${field}" is not supported`)
      itemDependencies.push(field)
    } else if (dependencyItem && referencesIdentifier(dependency, dependencyItem)) {
      fail(dependency, "useEffect() keyed item dependencies must be direct item.<field> properties")
    } else if (ts.isIdentifier(value) && setters.has(value.text)) {
      continue
    } else {
      ordinaryDependencies.push(dependency)
    }
  }
  const entries = []
  const dependencyStates = new Map()
  const substitutions = new Map()
  const subscriptions = []
  let hasDerived = false
  const stateNames = new Set(setters.values())
  for (const dependency of ordinaryDependencies) {
    const calculation = resolveCalculation?.(dependency)
    if (calculation) {
      entries.push({ kind: "calculation", ...calculation })
      for (const name of calculation.states) {
        subscriptions.push(factory.createIdentifier(name))
        dependencyStates.set(name, factory.createIdentifier(name))
      }
      substitutions.set(calculation.name, calculation.call)
      hasDerived = true
      continue
    }
    const direct = ts.isIdentifier(dependency)
    if (!direct && dynamicStatePropertyDependency(dependency, stateNames)) fail(dependency, "useEffect() object property dependencies require a direct static property path")
    if (!direct && !statePropertyDependency(dependency, stateNames)) fail(dependency, "useEffect() dependencies must be direct state or runtime parameter identifiers or property reads")
    const declarations = direct ? localDeclarations?.get(dependency.text) : undefined
    const initializer = declarations?.length === 1 ? declarations[0].initializer : undefined
    const indexedInitializer = initializer && bindingIndex?.hasNode(initializer) ? bindingIndex : undefined
    const directAlias = initializer && ts.isIdentifier(unwrapExpression(initializer)) && stateNames.has(unwrapExpression(initializer).text) && (!indexedInitializer || ["capture", "unresolved"].includes(indexedInitializer.resolveReference(unwrapExpression(initializer), initializer)?.kind))
    const expressionSource = initializer && !directAlias ? initializer : direct ? undefined : dependency
    let derivedStates = expressionSource ? referencedStateNames(expressionSource, setters, expressionSource, bindingIndex) : new Set()
    if (!derivedStates.size && expressionSource) derivedStates = referencedStateNames(expressionSource, setters, expressionSource)
    if (derivedStates.size) {
      const usedStates = new Set()
      const expression = collectionExpression(expressionSource, { fail, stateNames, selectorStates: usedStates })
      if (!usedStates.size) fail(dependency, `useEffect() derived dependency must read direct state`)
      entries.push({ kind: "derived", name: direct ? dependency.text : "derived", expression, states: usedStates, source: expressionSource })
      for (const name of usedStates) {
        subscriptions.push(factory.createIdentifier(name))
        dependencyStates.set(name, factory.createIdentifier(name))
      }
      if (initializer) substitutions.set(dependency.text, initializer)
      hasDerived = true
    } else {
      if (!direct) fail(dependency, "useEffect() dependencies must be direct state or runtime parameter identifiers or property reads")
      subscriptions.push(dependency)
      entries.push({ kind: "signal", name: dependency.text })
      dependencyStates.set(dependency.text, dependency)
    }
  }
  const derivedSourceNames = new Set(entries.filter(entry => entry.kind !== "signal").flatMap(entry => [...entry.states]))
  const ambiguous = entries.find(entry => entry.kind === "signal" && derivedSourceNames.has(entry.name))
  if (ambiguous) fail(ordinaryDependencies[entries.indexOf(ambiguous)], `useEffect() cannot mix whole-object and property dependencies for state ${JSON.stringify(ambiguous.name)}`)
  if (!hasDerived) dependencyStates.clear()
  return { dependencyItem, itemDependencies, ordinaryDependencies, entries, dependencyStates, substitutions, subscriptions, hasDerived }
}

export function validateEffectOwnedBrowserResources(callback, returns, fail, bindingIndex) {
  bindingIndex = bindingIndex?.hasNode(callback) ? bindingIndex : undefined
  const observers = []
  const frameAssignments = []
  const cancellations = new Set()
  const disconnected = new Set()
  const insideCleanup = node => returns.cleanups.some(cleanup => isNodeWithin(node, cleanup))
  const isGlobal = (identifier, name) => identifier.text === name && (!bindingIndex || bindingIndex.resolveReference(identifier, callback)?.kind === "global")
  const resource = identifier => bindingIndex?.resolveReference(identifier, callback)?.declaration ?? identifier.text
  const visit = node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isNewExpression(unwrapExpression(node.initializer)) && ts.isIdentifier(unwrapExpression(node.initializer).expression) && isGlobal(unwrapExpression(node.initializer).expression, "IntersectionObserver")) observers.push(node)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(unwrapExpression(node.left)) && ts.isCallExpression(unwrapExpression(node.right)) && ts.isIdentifier(unwrapExpression(node.right).expression) && isGlobal(unwrapExpression(node.right).expression, "requestAnimationFrame")) frameAssignments.push(node)
    if (insideCleanup(node) && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && isGlobal(node.expression, "cancelAnimationFrame") && node.arguments.length === 1 && ts.isIdentifier(unwrapExpression(node.arguments[0]))) cancellations.add(resource(unwrapExpression(node.arguments[0])))
    if (insideCleanup(node) && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.name.text === "disconnect" && node.arguments.length === 0) disconnected.add(resource(node.expression.expression))
    ts.forEachChild(node, visit)
  }
  visit(callback.body)
  for (const observer of observers) if (!disconnected.has(bindingIndex ? observer.name : observer.name.text)) fail(observer, `IntersectionObserver effects must disconnect ${JSON.stringify(observer.name.text)} in cleanup`)
  for (const assignment of frameAssignments) {
    const left = unwrapExpression(assignment.left)
    if (!cancellations.has(resource(left))) fail(assignment, `Animation loop effects must cancel ${JSON.stringify(left.text)} in cleanup`)
  }
}

function isDestructuredParameter(identifier, fn) {
  return fn?.parameters.some(parameter => ts.isObjectBindingPattern(parameter.name) && parameter.name.elements.some(element => ts.isIdentifier(element.name) && element.name.text === identifier.text)) ?? false
}

function directProperty(expression, objectName) {
  const value = unwrapExpression(expression)
  return ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && value.expression.text === objectName ? value.name.text : undefined
}

function statePropertyDependency(expression, stateNames) {
  let value = unwrapExpression(expression)
  let property = false
  while (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
    if (ts.isElementAccessExpression(value) && !ts.isStringLiteral(value.argumentExpression) && !ts.isNumericLiteral(value.argumentExpression)) return false
    property = true
    value = unwrapExpression(value.expression)
  }
  return property && ts.isIdentifier(value) && stateNames.has(value.text)
}

function dynamicStatePropertyDependency(expression, stateNames) {
  let value = unwrapExpression(expression)
  let dynamic = false
  while (ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value)) {
    if (ts.isElementAccessExpression(value) && !ts.isStringLiteral(value.argumentExpression) && !ts.isNumericLiteral(value.argumentExpression)) dynamic = true
    value = unwrapExpression(value.expression)
  }
  return dynamic && ts.isIdentifier(value) && stateNames.has(value.text)
}
