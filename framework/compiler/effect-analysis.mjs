import ts from "typescript"
import { nearestFunction, referencesIdentifier, unwrapExpression } from "./ast-helpers.mjs"
import { collectionExpression } from "./collection-analysis.mjs"
import { referencedStateNames } from "./descriptor-session.mjs"

export function analyzeEffectDependencies({ dependencies, node, listEffect, keyedItem, setters, localDeclarations, factory, fail }) {
  const itemDependencies = []
  const ordinaryDependencies = []
  let dependencyItem = listEffect ? keyedItem : undefined
  for (const dependency of dependencies.elements) {
    const value = unwrapExpression(dependency)
    if (!dependencyItem && ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && isDestructuredParameter(value.expression, nearestFunction(node))) dependencyItem = value.expression.text
    const field = dependencyItem && directProperty(dependency, dependencyItem)
    if (field) {
      if (["__proto__", "constructor", "prototype"].includes(field)) fail(dependency, `useEffect() keyed item property "${field}" is not supported`)
      itemDependencies.push(field)
    } else if (dependencyItem && referencesIdentifier(dependency, dependencyItem)) {
      fail(dependency, "useEffect() keyed item dependencies must be direct item.<field> properties")
    } else {
      ordinaryDependencies.push(dependency)
    }
  }
  const invalidDependency = ordinaryDependencies.find(dependency => !ts.isIdentifier(dependency))
  if (invalidDependency) fail(invalidDependency, "useEffect() dependencies must be direct state or runtime parameter identifiers")

  const entries = []
  const dependencyStates = new Map()
  const substitutions = new Map()
  const subscriptions = []
  let hasDerived = false
  const stateNames = new Set(setters.values())
  for (const dependency of ordinaryDependencies) {
    const declarations = localDeclarations?.get(dependency.text)
    const initializer = declarations?.length === 1 ? declarations[0].initializer : undefined
    const directAlias = initializer && ts.isIdentifier(unwrapExpression(initializer)) && stateNames.has(unwrapExpression(initializer).text)
    const derivedStates = initializer && !directAlias ? referencedStateNames(initializer, setters) : new Set()
    if (derivedStates.size) {
      const usedStates = new Set()
      const expression = collectionExpression(initializer, { fail, stateNames, selectorStates: usedStates })
      if (!usedStates.size) fail(dependency, `useEffect() derived dependency "${dependency.text}" must read direct primitive state`)
      entries.push({ kind: "derived", name: dependency.text, expression, states: usedStates, source: initializer })
      for (const name of usedStates) {
        subscriptions.push(factory.createIdentifier(name))
        dependencyStates.set(name, factory.createIdentifier(name))
      }
      substitutions.set(dependency.text, initializer)
      hasDerived = true
    } else {
      subscriptions.push(dependency)
      entries.push({ kind: "signal", name: dependency.text })
      dependencyStates.set(dependency.text, dependency)
    }
  }
  if (!hasDerived) dependencyStates.clear()
  return { dependencyItem, itemDependencies, ordinaryDependencies, entries, dependencyStates, substitutions, subscriptions, hasDerived }
}

export function validateEffectOwnedBrowserResources(callback, returns, fail) {
  const observers = []
  const frameAssignments = []
  const cancellations = new Set()
  const disconnected = new Set()
  const insideCleanup = node => returns.cleanups.some(cleanup => {
    for (let current = node; current; current = current.parent) if (current === cleanup) return true
    return false
  })
  const visit = node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isNewExpression(unwrapExpression(node.initializer)) && ts.isIdentifier(unwrapExpression(node.initializer).expression) && unwrapExpression(node.initializer).expression.text === "IntersectionObserver") observers.push(node)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(unwrapExpression(node.left)) && ts.isCallExpression(unwrapExpression(node.right)) && ts.isIdentifier(unwrapExpression(node.right).expression) && unwrapExpression(node.right).expression.text === "requestAnimationFrame") frameAssignments.push(node)
    if (insideCleanup(node) && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "cancelAnimationFrame" && node.arguments.length === 1 && ts.isIdentifier(unwrapExpression(node.arguments[0]))) cancellations.add(unwrapExpression(node.arguments[0]).text)
    if (insideCleanup(node) && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.name.text === "disconnect" && node.arguments.length === 0) disconnected.add(node.expression.expression.text)
    ts.forEachChild(node, visit)
  }
  visit(callback.body)
  for (const observer of observers) if (!disconnected.has(observer.name.text)) fail(observer, `IntersectionObserver effects must disconnect ${JSON.stringify(observer.name.text)} in cleanup`)
  for (const assignment of frameAssignments) {
    const name = unwrapExpression(assignment.left).text
    if (!cancellations.has(name)) fail(assignment, `Animation loop effects must cancel ${JSON.stringify(name)} in cleanup`)
  }
}

function isDestructuredParameter(identifier, fn) {
  return fn?.parameters.some(parameter => ts.isObjectBindingPattern(parameter.name) && parameter.name.elements.some(element => ts.isIdentifier(element.name) && element.name.text === identifier.text)) ?? false
}

function directProperty(expression, objectName) {
  const value = unwrapExpression(expression)
  return ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && value.expression.text === objectName ? value.name.text : undefined
}
