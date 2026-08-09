import ts from "typescript"
import { createComponentAnalysis } from "./analysis/component-analysis.mjs"
import { bindingNames, isFunctionLike, isReferenceIdentifier, isShadowedByParameter, isShadowedIdentifier, unwrapExpression } from "./ast-helpers.mjs"
import { generateCommandBehavior } from "./codegen/command-codegen.mjs"
import { createModuleIR, registerBinding, registerCommandHandler, registerDerived, registerEffect, registerKeyedBlock, registerModuleHandler } from "./ir/module-ir.mjs"

export function createSemanticArtifact(file) {
  return { componentAnalysis: createComponentAnalysis(file), moduleIR: createModuleIR(file) }
}

export function createDescriptorSession({ semantic, handlerUrl, factory, context, compileEventCommand, handlerLowering, isPrimitiveLiteral, rejectWorkerConstructions, sourceName = source => source.fileName }) {
  const { moduleIR } = semantic
  const nativeHandlers = []
  const effectHandlers = []
  const reactiveBindings = []
  const listExpressions = []
  const clientModules = new Set()

  function compileListExpression(read, expression, item, index, states = new Set(), keyedBlock) {
    const exportName = `listExpression${listExpressions.length}`
    listExpressions.push({ exportName, expression, item, index, states, role: "list-expression", keyedBlock })
    const arguments_ = [read, factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)]
    if (states.size) arguments_.push(factory.createArrayLiteralExpression([...states].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))))
    return factory.createCallExpression(factory.createIdentifier("__kListExpression"), undefined, arguments_)
  }

  function compileListConditional(entry) {
    const exportName = `listExpression${listExpressions.length}`
    listExpressions.push({ exportName, expression: entry.condition, item: entry.item, index: entry.index, role: "list-conditional", keyedBlock: entry.keyedBlock })
    const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), entry.condition)
    const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
    return factory.createCallExpression(factory.createIdentifier("__kListConditional"), undefined, [
      factory.createStringLiteral(entry.kind), read, thunk(entry.truthy), thunk(entry.falsy), factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)
    ])
  }

  function compileListValue(expression, entry) {
    const rewrite = node => {
      if (ts.isShorthandPropertyAssignment(node) && entry.states?.has(node.name.text)) return factory.createPropertyAssignment(node.name, factory.createPropertyAccessExpression(node.name, "value"))
      if (ts.isIdentifier(node) && entry.states?.has(node.text) && isReferenceIdentifier(node)) return factory.createPropertyAccessExpression(node, "value")
      return ts.visitEachChild(node, rewrite, context)
    }
    const initial = entry.states?.size ? ts.visitNode(expression, rewrite) : expression
    const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), initial)
    return entry.field
      ? factory.createCallExpression(factory.createIdentifier("__kListField"), undefined, [read, factory.createStringLiteral(entry.field)])
      : compileListExpression(read, expression, entry.item, entry.index, entry.states, entry.keyedBlock)
  }

  function compileReactiveBinding(expression, { setters, importBindings = new Map(), keyedBlock }) {
    const parts = conditionalParts(expression)
    const state = parts && directStateIdentifier(parts.condition, setters)
    if (state && isPrimitiveLiteral(parts.truthy) && isPrimitiveLiteral(parts.falsy)) {
      return factory.createCallExpression(factory.createIdentifier("__kSelect"), undefined, [state, parts.truthy, parts.falsy])
    }
    return factory.createCallExpression(factory.createIdentifier("__kBinding"), undefined, compileReactiveExpression(expression, setters, importBindings, keyedBlock))
  }

  function compileConditional(kind, expression, truthy, falsy, setters) {
    const state = directStateIdentifier(expression, setters)
    const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
    if (state) return factory.createCallExpression(factory.createIdentifier("__kStateConditional"), undefined, [factory.createStringLiteral(kind), state, thunk(truthy), thunk(falsy)])
    const [initial, ...descriptor] = compileReactiveExpression(expression, setters)
    return factory.createCallExpression(factory.createIdentifier("__kConditional"), undefined, [factory.createStringLiteral(kind), initial, thunk(truthy), thunk(falsy), ...descriptor])
  }

  function compileReactiveExpression(expression, setters, importBindings = new Map(), keyedBlock) {
    const usedStates = referencedStateNames(expression, setters)
    const importedNames = referencedImportedBindings(expression, importBindings)
    const imports = [...importedNames].map(name => importBindings.get(name))
    registerClientImports(imports)
    const captures = new Set([...captureNames(expression, expression, setters)].filter(name => !importedNames.has(name)))
    const exportName = `binding${reactiveBindings.length}`
    reactiveBindings.push({ exportName, expression, captures, states: usedStates, imports, role: "binding", keyedBlock })
    const states = [...usedStates].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))
    const scope = [...captures].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))
    const stateNames = new Set(usedStates)
    const rewriteInitial = node => {
      if (ts.isShorthandPropertyAssignment(node) && stateNames.has(node.name.text)) return factory.createPropertyAssignment(node.name, factory.createPropertyAccessExpression(node.name, "value"))
      if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) return factory.createPropertyAccessExpression(node, "value")
      if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text)) return factory.createPropertyAssignment(node.name, factory.createCallExpression(factory.createIdentifier("__kBindingValue"), undefined, [node.name]))
      if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node)) return factory.createCallExpression(factory.createIdentifier("__kBindingValue"), undefined, [node])
      return ts.visitEachChild(node, rewriteInitial, context)
    }
    return [
      ts.visitNode(expression, rewriteInitial),
      factory.createStringLiteral(handlerUrl),
      factory.createStringLiteral(exportName),
      factory.createArrayLiteralExpression(states),
      factory.createArrayLiteralExpression(scope)
    ]
  }

  function compileEvent(expression, { owner = "module", stateOwners = new Map(), setters, reducers, functions, listItem, keyedBlock, importBindings }) {
    if (ts.isIdentifier(expression)) expression = functions.get(expression.text)
    if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression) && !ts.isFunctionDeclaration(expression))) return undefined
    const optimized = referencedReducerDispatches(expression.body, reducers, expression).size ? undefined : compileOptimizedEvent(expression, setters, stateOwners, owner, keyedBlock)
    if (optimized) return optimized
    rejectWorkerConstructions(expression)
    const descriptor = compileNativeCallback(expression, { setters, reducers, entries: nativeHandlers, importBindings, prefix: "handler", role: "native", listItem, keyedBlock })
    return factory.createCallExpression(factory.createIdentifier("__kNativeBehavior"), undefined, [
      factory.createStringLiteral(handlerUrl), factory.createStringLiteral(descriptor.exportName), descriptor.states, descriptor.scope
    ])
  }

  function compileEffectCallback(expression, options) {
    return compileNativeCallback(expression, { ...options, entries: effectHandlers, prefix: "effect", role: "effect" })
  }

  function compileNativeCallback(expression, { setters, reducers, entries, importBindings, prefix, role, listItem, keyedBlock, deferValues = false, snapshotNested = false, liveStates = new Set() }) {
    const allCaptures = nativeCaptureNames(expression, setters)
    const usedReducers = referencedReducerDispatches(expression.body, reducers, expression)
    const imports = [...referencedImportedBindings(expression, importBindings)].map(name => importBindings.get(name))
    imports.push(...[...usedReducers].map(name => reducers.get(name).import).filter(Boolean))
    const captures = new Set([...allCaptures].filter(name => !importBindings.has(name) && !usedReducers.has(name)))
    registerClientImports(imports)
    const usedStates = referencedStateNames(expression.body, setters, expression)
    for (const name of usedReducers) {
      const reducer = reducers.get(name)
      if (reducer.contextAction) for (const state of referencedStateNames(reducer.contextAction.body, reducer.states, reducer.contextAction)) usedStates.add(state)
    }
    const exportName = `${prefix}${entries.length}`
    entries.push({ exportName, expression, captures, deferValues, imports, listItem, keyedBlock, liveStates, role, setters: new Map([...setters].filter(([, state]) => usedStates.has(state))), reducers: new Map([...reducers].filter(([name]) => usedReducers.has(name))), snapshotNested, usedStates })
    const value = name => deferValues
      ? factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createIdentifier(name))
      : factory.createIdentifier(name)
    return {
      exportName,
      states: factory.createArrayLiteralExpression([...usedStates].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), value(name)]))),
      scope: factory.createArrayLiteralExpression([...captures].map(name => factory.createArrayLiteralExpression([
        factory.createStringLiteral(name),
        name === (typeof listItem === "string" ? listItem : listItem?.item)
          ? factory.createCallExpression(factory.createIdentifier("__kListItem"), undefined, [])
          : name === listItem?.index ? factory.createCallExpression(factory.createIdentifier("__kListIndex"), undefined, []) : value(name)
      ])))
    }
  }

  function compileOptimizedEvent(expression, setters, stateOwners, owner, keyedBlock) {
    const statements = ts.isBlock(expression.body) ? expression.body.statements : [factory.createExpressionStatement(expression.body)]
    const commands = statements.map(statement => ts.isExpressionStatement(statement) ? compileEventCommand(statement.expression, setters) : undefined)
    if (!commands.length || commands.some(command => !command)) return undefined
    const original = ts.getOriginalNode(expression)
    const source = original.pos >= 0 && original.end >= 0 ? { file: sourceName(original.getSourceFile()), start: original.getStart(), end: original.end } : undefined
    const handler = registerCommandHandler(moduleIR, commands.map(command => ({ ...command, owner: stateOwners.get(command.state) ?? owner })), source, owner)
    if (keyedBlock !== undefined) handler.keyedBlock = keyedBlock
    return generateCommandBehavior(moduleIR, handler, factory)
  }

  function registerClientImports(imports) {
    for (const entry of imports) if (!entry.package) clientModules.add(entry.target)
  }

  function registerDerivedResult(kind, value, states = [], node) {
    const normalized = JSON.parse(JSON.stringify(value))
    return registerDerived(moduleIR, { kind, [kind]: normalized, states: [...states], ...(source(node) ? { source: source(node) } : {}) })
  }

  function registerKeyedBlockResult(descriptor) {
    return registerKeyedBlock(moduleIR, descriptor)
  }

  function registerEffectResult(handler, descriptor) {
    return registerEffect(moduleIR, { ...descriptor, setup: { exportName: handler.exportName } })
  }

  function finalize() {
    const callbacks = [...nativeHandlers, ...effectHandlers]
    for (const entry of callbacks) {
      const lowered = handlerLowering.lowerNativeHandler(entry)
      const setters = Map.groupBy(entry.setters, ([, state]) => state)
      registerModuleHandler(moduleIR, {
        role: entry.role,
        ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
        exportName: entry.exportName,
        async: Boolean(entry.expression.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)),
        generator: Boolean(entry.expression.asteriskToken),
        signals: [...entry.usedStates].map(name => ({
          name,
          setters: (setters.get(name) ?? []).map(([setter]) => setter),
          value: entry.deferValues ? "deferred" : "direct",
          snapshot: lowered.stateSnapshots.includes(name)
        })),
        captures: [...entry.captures].map(name => ({
          name,
          source: name === (typeof entry.listItem === "string" ? entry.listItem : entry.listItem?.item) ? "list-item" : name === entry.listItem?.index ? "list-index" : "scope",
          value: entry.deferValues ? "deferred" : "direct",
          snapshot: lowered.captureSnapshots.includes(name)
        })),
        imports: entry.imports.map(importRecord),
        code: lowered.code,
        ...(source(entry.expression) ? { source: source(entry.expression) } : {})
      })
    }
    for (const entry of reactiveBindings) registerBinding(moduleIR, {
      role: entry.role,
      ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
      exportName: entry.exportName,
      parameters: ["__k"],
      states: [...entry.states],
      captures: [...entry.captures].map(name => ({ name, source: "scope" })),
      imports: entry.imports.map(importRecord),
      code: handlerLowering.lowerReactiveBinding(entry),
      ...(source(entry.expression) ? { source: source(entry.expression) } : {})
    })
    for (const entry of listExpressions) registerBinding(moduleIR, {
      role: entry.role,
      ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
      exportName: entry.exportName,
      parameters: [entry.item, entry.index ?? "__kIndex", "__k"],
      states: [...(entry.states ?? [])],
      captures: [],
      imports: [],
      code: handlerLowering.lowerListExpression(entry),
      ...(source(entry.expression) ? { source: source(entry.expression) } : {})
    })
    for (const effect of moduleIR.effects) {
      const handler = moduleIR.handlers.find(candidate => candidate.kind === "module-export" && candidate.role === "effect" && candidate.exportName === effect.setup.exportName)
      if (!handler) throw new Error(`Effect handler ${JSON.stringify(effect.setup.exportName)} was not finalized`)
      effect.setup = { handler: handler.slot }
    }
    const imports = [...callbacks, ...reactiveBindings].flatMap(entry => entry.imports ?? []).map(importRecord)
    moduleIR.imports = [...new Map(imports.map(entry => [`${entry.target}:${entry.kind}:${entry.imported ?? ""}:${entry.local}`, entry])).values()]
    moduleIR.clientModules = [...clientModules]
  }

  function source(node) {
    if (!node) return undefined
    const original = ts.getOriginalNode(node)
    return original.pos >= 0 && original.end >= 0 ? { file: sourceName(original.getSourceFile()), start: original.getStart(), end: original.end } : undefined
  }

  const importRecord = entry => ({ target: entry.target, kind: entry.kind, local: entry.local, ...(entry.imported ? { imported: entry.imported } : {}), package: Boolean(entry.package) })

  return { compileConditional, compileEffectCallback, compileEvent, compileListConditional, compileListValue, compileReactiveBinding, finalize, registerDerived: registerDerivedResult, registerEffect: registerEffectResult, registerKeyedBlock: registerKeyedBlockResult }
}

function directStateIdentifier(expression, setters) {
  const value = unwrapExpression(expression)
  return ts.isIdentifier(value) && new Set(setters.values()).has(value.text) ? value : undefined
}

function conditionalParts(expression) {
  const unwrap = node => ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node
  const value = unwrap(expression)
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return { condition: value.left, truthy: unwrap(value.right), falsy: ts.factory.createNull() }
  if (ts.isConditionalExpression(value)) return { condition: value.condition, truthy: unwrap(value.whenTrue), falsy: unwrap(value.whenFalse) }
  return undefined
}

export function referencedReducerDispatches(root, reducers, scopeRoot = root) {
  const used = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, scopeRoot)) used.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return used
}

export function referencedStateNames(root, setters, scopeRoot = root) {
  const stateNames = new Set(setters.values())
  const used = new Set()
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && !isShadowedIdentifier(node.expression, scopeRoot)) used.add(setters.get(node.expression.text))
    if (ts.isIdentifier(node) && setters.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, scopeRoot)) used.add(setters.get(node.text))
    if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, scopeRoot)) used.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return used
}

export function nativeCaptureNames(expression, setters) {
  return captureNames(expression, expression.body, setters)
}

function referencedImportedBindings(expression, imports) {
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && imports.has(node.text) && isReferenceIdentifier(node)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(expression.body ?? expression)
  return names
}

export function captureNames(declarationRoot, referenceRoot, setters) {
  const local = new Set()
  if (!isFunctionLike(declarationRoot)) {
    const collectDeclarations = node => {
      if (ts.isVariableDeclaration(node)) for (const name of bindingNames(node.name)) local.add(name)
      if (ts.isParameter(node)) for (const name of bindingNames(node.name)) local.add(name)
      if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) local.add(node.name.text)
      ts.forEachChild(node, collectDeclarations)
    }
    collectDeclarations(declarationRoot)
  }
  const stateNames = new Set(setters.values())
  const captures = new Set()
  const visit = node => {
    if (ts.isTypeNode(node)) return
    if (ts.isIdentifier(node)) {
      const declared = isFunctionLike(declarationRoot) ? isShadowedIdentifier(node, declarationRoot) : local.has(node.text)
      if (isReferenceIdentifier(node) && !declared && !setters.has(node.text) && !stateNames.has(node.text) && !nativeGlobals.has(node.text)) captures.add(node.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(referenceRoot)
  return captures
}

const nativeGlobals = new Set([
  "Array", "ArrayBuffer", "BigInt", "Blob", "Boolean", "Date", "Error", "Event", "FileReader", "FormData", "Infinity", "IntersectionObserver", "Intl", "JSON", "Map", "Math", "NaN", "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set", "String", "Symbol", "TypeError", "URL", "URLSearchParams", "WeakMap", "WeakSet", "WebSocket", "Worker", "alert", "atob", "btoa", "cancelAnimationFrame", "clearInterval", "clearTimeout", "console", "crypto", "document", "fetch", "globalThis", "history", "isFinite", "isNaN", "localStorage", "location", "navigator", "parseFloat", "parseInt", "performance", "queueMicrotask", "requestAnimationFrame", "setInterval", "setTimeout", "structuredClone", "undefined", "window"
])
