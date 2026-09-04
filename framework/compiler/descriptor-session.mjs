import ts from "typescript"
import { createComponentAnalysis } from "./analysis/component-analysis.mjs"
import { knownGlobalNames } from "./analysis/binding-index.mjs"
import { bindingNames, isFunctionLike, isReferenceIdentifier, isShadowedByParameter, isShadowedIdentifier, unwrapExpression } from "./ast-helpers.mjs"
import { generateCommandBehavior } from "./codegen/command-codegen.mjs"
import { assertModuleIRReferences, createModuleIR, registerBinding, registerCommandHandler, registerDerived, registerEffect, registerKeyedBlock, registerModuleHandler, registerSignal } from "./ir/module-ir.mjs"
import { ownedLazyPackageImport } from "./source-graph.mjs"

export function createSemanticArtifact(file) {
  return { componentAnalysis: createComponentAnalysis(file), moduleIR: createModuleIR(file) }
}

export function createDescriptorSession({ semantic, handlerUrl, factory, context, bindingIndex, compileEventCommand, handlerLowering, isPrimitiveLiteral, rejectWorkerConstructions, stateReferences = () => new Map(), symbolReference, sourceName = source => source.fileName }) {
  const { moduleIR } = semantic
  moduleIR.symbols = bindingIndex.bindings()
  const nativeHandlers = []
  const effectHandlers = []
  const reactiveBindings = []
  const listExpressions = []
  const pendingEffects = []
  const clientModules = new Set()

  const signal = (name, node, references, aliases = []) => {
    let reference = references?.get(name) ?? stateReferences(node).get(name)
    if (!reference && bindingIndex) {
      const original = ts.getOriginalNode(node)
      const names = new Set([name, ...aliases])
      let symbol = bindingIndex.references(original, original)?.find(entry => names.has(entry.debugName))?.slot
      if (symbol === undefined) {
        for (let current = node; current && symbol === undefined; current = current.parent) if (isFunctionLike(current)) {
          const parameter = current.parameters.map(parameter => bindingIdentifier(parameter.name, names)).find(Boolean)
          symbol = parameter && bindingIndex.resolveBinding(parameter)?.slot
          break
        }
      }
      if (symbol !== undefined) reference = { kind: "symbol", symbol }
    }
    reference ??= symbolReference?.(name, node, aliases)
    if (!reference) throw new Error(`ModuleIR state ${JSON.stringify(name)} has no resolved StateRef`)
    return registerSignal(moduleIR, reference, name).slot
  }

  function compileListExpression(read, expression, item, index, states = new Set(), keyedBlock, indexedBindingIndex) {
    const exportName = `listExpression${listExpressions.length}`
    listExpressions.push({ exportName, expression, item, index, states, signalRefs: new Map([...states].map(name => [name, signal(name, expression)])), role: "list-expression", keyedBlock, bindingIndex: indexedBindingIndex })
    const arguments_ = [read, factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)]
    if (states.size) arguments_.push(factory.createArrayLiteralExpression([...states].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))))
    return factory.createCallExpression(factory.createIdentifier("__kListExpression"), undefined, arguments_)
  }

  function compileListConditional(entry) {
    const exportName = `listExpression${listExpressions.length}`
    const indexed = indexedReferences(bindingIndex, entry.condition, entry.condition)
    listExpressions.push({ exportName, expression: entry.condition, item: entry.item, index: entry.index, states: new Set(), signalRefs: new Map(), role: "list-conditional", keyedBlock: entry.keyedBlock, bindingIndex: indexed ? bindingIndex : undefined })
    const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), entry.condition)
    const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
    return factory.createCallExpression(factory.createIdentifier("__kListConditional"), undefined, [
      factory.createStringLiteral(entry.kind), read, thunk(entry.truthy), thunk(entry.falsy), factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)
    ])
  }

  function compileListValue(expression, entry) {
    const indexed = indexedReferences(bindingIndex, expression, expression)
    const rewrite = node => {
      const reference = ts.isShorthandPropertyAssignment(node) ? node.name : ts.isIdentifier(node) ? node : undefined
      const resolution = reference && indexed ? bindingIndex.resolveReference(reference, expression) : undefined
      const state = ["capture", "unresolved"].includes(resolution?.kind) && entry.states?.has(resolution.debugName)
      if (ts.isShorthandPropertyAssignment(node) && entry.states?.has(node.name.text) && (!indexed || state)) return factory.createPropertyAssignment(node.name, factory.createPropertyAccessExpression(node.name, "value"))
      if (ts.isIdentifier(node) && entry.states?.has(node.text) && isReferenceIdentifier(node) && (!indexed || state)) return factory.createPropertyAccessExpression(node, "value")
      return ts.visitEachChild(node, rewrite, context)
    }
    const initial = entry.states?.size ? ts.visitNode(expression, rewrite) : expression
    const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), initial)
    return entry.field
      ? factory.createCallExpression(factory.createIdentifier("__kListField"), undefined, [read, factory.createStringLiteral(entry.field)])
      : compileListExpression(read, expression, entry.item, entry.index, entry.states, entry.keyedBlock, indexed ? bindingIndex : undefined)
  }

  function compileReactiveBinding(expression, { setters, importBindings = new Map(), keyedBlock, derived }) {
    const parts = conditionalParts(expression)
    const state = parts && directStateIdentifier(parts.condition, setters, bindingIndex)
    if (state && isPrimitiveLiteral(parts.truthy) && isPrimitiveLiteral(parts.falsy)) {
      return { node: factory.createCallExpression(factory.createIdentifier("__kSelect"), undefined, [state, parts.truthy, parts.falsy]) }
    }
    const binding = reactiveBindings.length
    const node = factory.createCallExpression(factory.createIdentifier("__kBinding"), undefined, compileReactiveExpression(expression, setters, importBindings, keyedBlock))
    if (derived) reactiveBindings[binding].derived = derived
    return { node, binding }
  }

  function compileDerivedEvaluator(expression, { setters, importBindings = new Map() }) {
    const binding = reactiveBindings.length
    const [, module, handler, states, scope] = compileReactiveExpression(expression, setters, importBindings)
    return {
      binding,
      descriptor: factory.createObjectLiteralExpression([
        factory.createPropertyAssignment("module", module),
        factory.createPropertyAssignment("handler", handler),
        factory.createPropertyAssignment("states", states),
        factory.createPropertyAssignment("scope", scope)
      ])
    }
  }

  function compileConditional(kind, expression, truthy, falsy, setters, importBindings = new Map()) {
    const state = directStateIdentifier(expression, setters, bindingIndex)
    const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
    if (state) return factory.createCallExpression(factory.createIdentifier("__kStateConditional"), undefined, [factory.createStringLiteral(kind), state, thunk(truthy), thunk(falsy)])
    const [initial, ...descriptor] = compileReactiveExpression(expression, setters, importBindings)
    return factory.createCallExpression(factory.createIdentifier("__kConditional"), undefined, [factory.createStringLiteral(kind), initial, thunk(truthy), thunk(falsy), ...descriptor])
  }

  function compileReactiveExpression(expression, setters, importBindings = new Map(), keyedBlock) {
    const usedStates = referencedStateNames(expression, setters, expression, bindingIndex)
    const indexed = indexedReferences(bindingIndex, expression, expression)
    const importedNames = indexed ? new Set(indexed.filter(reference => reference.kind === "import" && importBindings.has(reference.debugName)).map(reference => reference.debugName)) : referencedImportedBindings(expression, importBindings)
    const imports = [...importedNames].map(name => importBindings.get(name))
    registerClientImports(imports)
    const allStateNames = new Set(setters.values())
    const captures = indexed
      ? new Set(indexed.filter(reference => ["capture", "unresolved"].includes(reference.kind) && !setters.has(reference.debugName) && !allStateNames.has(reference.debugName) && !importedNames.has(reference.debugName)).map(reference => reference.debugName))
      : new Set([...captureNames(expression, expression, setters)].filter(name => !importedNames.has(name)))
    const exportName = `binding${reactiveBindings.length}`
    reactiveBindings.push({ slot: reactiveBindings.length, exportName, expression, captures, states: usedStates, signalRefs: new Map([...usedStates].map(name => [name, signal(name, expression)])), imports, role: "binding", keyedBlock, ...(indexed ? { bindingIndex } : {}) })
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
    const directFunction = ts.isIdentifier(expression) ? functions.get(expression.text) : undefined
    const directReducer = ts.isIdentifier(expression) ? reducers.get(expression.text) : undefined
    const directImplementation = directReducer?.sharedAction?.directImplementation
    const directSource = directFunction && ts.getOriginalNode(directFunction)
    const actionSource = directImplementation && ts.getOriginalNode(directImplementation)
    const directAction = directSource?.pos >= 0 && directSource.pos === actionSource?.pos && directSource.end === actionSource.end && directSource.getSourceFile().fileName === actionSource.getSourceFile().fileName ? directReducer.sharedAction : undefined
    if (ts.isIdentifier(expression)) expression = directFunction
    if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression) && !ts.isFunctionDeclaration(expression))) return undefined
    const optimized = referencedReducerDispatches(expression.body, reducers, expression).size ? undefined : compileOptimizedEvent(expression, setters, stateOwners, owner, keyedBlock, directAction ? [directAction.slot] : [])
    if (optimized) return optimized
    rejectWorkerConstructions(expression)
    const descriptor = compileNativeCallback(expression, { setters, reducers, entries: nativeHandlers, importBindings, prefix: "handler", role: "native", listItem, keyedBlock, stateOwners, actionSlots: directAction ? [directAction.slot] : [] })
    return factory.createCallExpression(factory.createIdentifier("__kNativeBehavior"), undefined, [
      factory.createStringLiteral(handlerUrl), factory.createStringLiteral(descriptor.exportName), descriptor.states, descriptor.scope
    ])
  }

  function compileEffectCallback(expression, options) {
    return compileNativeCallback(expression, { ...options, entries: effectHandlers, prefix: "effect", role: "effect" })
  }

  function compileNativeCallback(expression, { setters, reducers, entries, importBindings, prefix, role, listItem, keyedBlock, stateOwners, actionSlots = [], deferValues = false, snapshotNested = false, liveStates = new Set() }) {
    const indexedBindingIndex = indexedReferences(bindingIndex, expression, expression) ? bindingIndex : undefined
    const allCaptures = nativeCaptureNames(expression, setters, indexedBindingIndex)
    const usedReducers = referencedReducerDispatches(expression.body, reducers, expression, indexedBindingIndex)
    const imports = [...referencedImportedBindings(expression, importBindings, indexedBindingIndex)].map(name => importBindings.get(name))
    imports.push(...[...usedReducers].map(name => reducers.get(name).import).filter(Boolean))
    const dynamicImports = []
    const visitDynamicImports = node => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        if (role !== "effect" || !ownedLazyPackageImport(node, bindingIndex)) throw new Error("Dynamic package imports require one literal import() directly inside an inline owned effect")
        dynamicImports.push({ kind: "dynamic", local: node.arguments[0].text, target: node.arguments[0].text, package: true })
      }
      ts.forEachChild(node, visitDynamicImports)
    }
    visitDynamicImports(expression)
    if (dynamicImports.length > 1) throw new Error("An owned effect may contain only one dynamic package import")
    imports.push(...dynamicImports)
    const captures = new Set([...allCaptures].filter(name => !importBindings.has(name) && !usedReducers.has(name)))
    registerClientImports(imports)
    const usedStates = referencedStateNames(expression.body, setters, expression, indexedBindingIndex)
    for (const name of usedReducers) {
      const reducer = reducers.get(name)
      const direct = reducer.directImplementation ?? reducer.sharedAction?.directImplementation
      if (direct) for (const state of referencedStateNames(direct.body, reducer.states ?? reducer.sharedAction.states, direct, bindingIndex)) usedStates.add(state)
    }
    const exportName = `${prefix}${entries.length}`
    const entry = { actionSlots, exportName, expression, captures, deferValues, imports, listItem, keyedBlock, liveStates, role, setters: new Map([...setters].filter(([, state]) => usedStates.has(state))), reducers: new Map([...reducers].filter(([name]) => usedReducers.has(name))), snapshotNested, usedStates, signalRefs: new Map([...usedStates].map(name => [name, signal(name, expression, stateOwners, [...setters].filter(([, state]) => state === name).map(([setter]) => setter))])), bindingIndex: indexedBindingIndex }
    entries.push(entry)
    const value = name => deferValues
      ? factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createIdentifier(name))
      : factory.createIdentifier(name)
    return {
      entry,
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

  function compileOptimizedEvent(expression, setters, stateOwners, owner, keyedBlock, actions = []) {
    const statements = ts.isBlock(expression.body) ? expression.body.statements : [factory.createExpressionStatement(expression.body)]
    let commands = statements.map(statement => ts.isExpressionStatement(statement) && canSpecializeCommand(statement.expression, expression, setters) ? compileEventCommand(statement.expression, setters) : undefined)
    if ((!commands.length || commands.some(command => !command)) && compileEventCommand.handler) commands = compileEventCommand.handler(expression, setters, bindingIndex)
    if (!commands?.length || commands.some(command => !command)) return undefined
    const original = ts.getOriginalNode(expression)
    const source = original.pos >= 0 && original.end >= 0 ? { file: sourceName(original.getSourceFile()), start: original.getStart(), end: original.end } : undefined
    const handler = registerCommandHandler(moduleIR, commands.map(command => ({ ...command, reference: stateOwners.get(command.state) ?? stateReferences(expression).get(command.state) })), source, actions)
    if (keyedBlock !== undefined) handler.keyedBlock = keyedBlock
    return generateCommandBehavior(moduleIR, handler, factory)
  }

  function canSpecializeCommand(command, expression, setters) {
    const references = indexedReferences(bindingIndex, command, expression)
    if (!references) return true
    const stateNames = new Set(setters.values())
    return references.every(reference => {
      if (setters.has(reference.debugName) || stateNames.has(reference.debugName)) return ["capture", "unresolved"].includes(reference.kind)
      if (reference.debugName === "console") return reference.kind === "global"
      return true
    })
  }

  function registerClientImports(imports) {
    for (const entry of imports) if (!entry.package) clientModules.add(entry.target)
  }

  function registerDerivedResult(kind, value, states = [], node) {
    const normalized = JSON.parse(JSON.stringify(value))
    return registerDerived(moduleIR, { kind, [kind]: normalized, signals: [...states].map(name => signal(name, node)), ...(source(node) ? { source: source(node) } : {}) })
  }

  function registerKeyedBlockResult(descriptor) {
    return registerKeyedBlock(moduleIR, descriptor)
  }

  function registerEffectResult(handler, descriptor) {
    const effect = { ...descriptor, setup: handler }
    pendingEffects.push(effect)
    return effect
  }

  function finalize() {
    const callbacks = [...nativeHandlers, ...effectHandlers]
    const imports = [...callbacks, ...reactiveBindings].flatMap(entry => entry.imports ?? []).map(importRecord)
    moduleIR.imports = [...new Map(imports.map(entry => [`${entry.target}:${entry.kind}:${entry.imported ?? ""}:${entry.local}`, entry])).values()].map((entry, slot) => ({ slot, ...entry }))
    const importSlots = new Map(moduleIR.imports.map(entry => [`${entry.target}:${entry.kind}:${entry.imported ?? ""}:${entry.local}`, entry.slot]))
    const importSlot = entry => importSlots.get(`${entry.target}:${entry.kind}:${entry.imported ?? ""}:${entry.local}`)
    for (const entry of callbacks) {
      const lowered = handlerLowering.lowerNativeHandler(entry)
      const setters = Map.groupBy(entry.setters, ([, state]) => state)
      entry.handler = registerModuleHandler(moduleIR, {
        role: entry.role,
        ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
        exportName: entry.exportName,
        async: Boolean(entry.expression.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)),
        generator: Boolean(entry.expression.asteriskToken),
        signals: [...entry.usedStates].map(name => ({
          signal: entry.signalRefs.get(name),
          name,
          setters: (setters.get(name) ?? []).map(([setter]) => setter),
          value: entry.deferValues ? "deferred" : "direct",
          snapshot: lowered.stateSnapshots.includes(name)
        })),
        captures: [...entry.captures].map(name => ({
          ...(symbolSlot(entry, name) !== undefined ? { symbol: symbolSlot(entry, name) } : {}),
          name,
          source: name === (typeof entry.listItem === "string" ? entry.listItem : entry.listItem?.item) ? "list-item" : name === entry.listItem?.index ? "list-index" : "scope",
          value: entry.deferValues ? "deferred" : "direct",
          snapshot: lowered.captureSnapshots.includes(name)
        })),
        imports: entry.imports.map(entry => importSlot(importRecord(entry))),
        actions: [...new Set([...entry.actionSlots, ...[...entry.reducers.values()].flatMap(reducer => reducer.sharedAction ? [reducer.sharedAction.slot] : [])])],
        code: lowered.code,
        ...(source(entry.expression) ? { source: source(entry.expression) } : {})
      })
    }
    for (const entry of reactiveBindings) registerBinding(moduleIR, {
      slot: entry.slot,
      role: entry.role,
      ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
      exportName: entry.exportName,
      parameters: ["__k"],
      signals: [...entry.states].map(name => entry.signalRefs.get(name)),
      captures: [...entry.captures].map(name => ({ ...(symbolSlot(entry, name) !== undefined ? { symbol: symbolSlot(entry, name) } : {}), name, source: "scope" })),
      imports: entry.imports.map(entry => importSlot(importRecord(entry))),
      ...(entry.derived ? { derived: entry.derived } : {}),
      code: handlerLowering.lowerReactiveBinding(entry),
      ...(source(entry.expression) ? { source: source(entry.expression) } : {})
    })
    for (const [index, entry] of listExpressions.entries()) registerBinding(moduleIR, {
      slot: reactiveBindings.length + index,
      role: entry.role,
      ...(entry.keyedBlock !== undefined ? { keyedBlock: entry.keyedBlock } : {}),
      exportName: entry.exportName,
      parameters: [entry.item, entry.index ?? "__kIndex", "__k"],
      signals: [...(entry.states ?? [])].map(name => entry.signalRefs.get(name)),
      captures: [],
      imports: [],
      code: handlerLowering.lowerListExpression(entry),
      ...(source(entry.expression) ? { source: source(entry.expression) } : {})
    })
    for (const effect of pendingEffects) {
      if (!effect.setup.entry.handler) throw new Error(`Effect handler ${JSON.stringify(effect.setup.exportName)} was not finalized`)
      registerEffect(moduleIR, { ...effect, setup: { handler: effect.setup.entry.handler.slot } })
    }
    moduleIR.clientModules = [...clientModules]
    assertModuleIRReferences(moduleIR, semantic.componentAnalysis)
  }

  function symbolSlot(entry, name) {
    return entry.bindingIndex?.references(entry.expression, entry.expression)?.find(reference => reference.debugName === name)?.slot
  }

  function source(node) {
    if (!node) return undefined
    const original = ts.getOriginalNode(node)
    return original.pos >= 0 && original.end >= 0 ? { file: sourceName(original.getSourceFile()), start: original.getStart(), end: original.end } : undefined
  }

  const importRecord = entry => ({ target: entry.target, kind: entry.kind, local: entry.local, ...(entry.imported ? { imported: entry.imported } : {}), package: Boolean(entry.package) })

  return { compileConditional, compileDerivedEvaluator, compileEffectCallback, compileEvent, compileListConditional, compileListValue, compileReactiveBinding, finalize, registerDerived: registerDerivedResult, registerEffect: registerEffectResult, registerKeyedBlock: registerKeyedBlockResult, signal }
}

function bindingIdentifier(name, names) {
  if (ts.isIdentifier(name)) return names.has(name.text) ? name : undefined
  for (const element of name.elements) if (ts.isBindingElement(element)) {
    const identifier = bindingIdentifier(element.name, names)
    if (identifier) return identifier
  }
}

function directStateIdentifier(expression, setters, bindingIndex) {
  const value = unwrapExpression(expression)
  if (!ts.isIdentifier(value) || !new Set(setters.values()).has(value.text)) return undefined
  const indexed = bindingIndex?.hasNode(expression) ? bindingIndex : undefined
  const resolution = indexed?.resolveReference(value, expression)
  return !indexed || ["capture", "unresolved"].includes(resolution?.kind) ? value : undefined
}

function conditionalParts(expression) {
  const unwrap = node => ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node
  const value = unwrap(expression)
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return { condition: value.left, truthy: unwrap(value.right), falsy: ts.factory.createNull() }
  if (ts.isConditionalExpression(value)) return { condition: value.condition, truthy: unwrap(value.whenTrue), falsy: unwrap(value.whenFalse) }
  return undefined
}

export function referencedReducerDispatches(root, reducers, scopeRoot = root, bindingIndex) {
  const indexed = indexedReferences(bindingIndex, root, scopeRoot)
  if (indexed) return new Set(indexed.filter(reference => ["capture", "unresolved"].includes(reference.kind) && reducers.has(reference.debugName)).map(reference => reference.debugName))
  const used = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, scopeRoot)) used.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return used
}

export function referencedStateNames(root, setters, scopeRoot = root, bindingIndex) {
  const stateNames = new Set(setters.values())
  const indexed = indexedReferences(bindingIndex, root, scopeRoot)
  if (indexed) return new Set(indexed.filter(reference => ["capture", "unresolved"].includes(reference.kind) && (setters.has(reference.debugName) || stateNames.has(reference.debugName))).map(reference => setters.get(reference.debugName) ?? reference.debugName))
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

export function nativeCaptureNames(expression, setters, bindingIndex) {
  return captureNames(expression, expression.body, setters, bindingIndex)
}

function referencedImportedBindings(expression, imports, bindingIndex) {
  const indexed = indexedReferences(bindingIndex, expression.body ?? expression, expression)
  if (indexed) return new Set(indexed.filter(reference => reference.kind === "import" && imports.has(reference.debugName)).map(reference => reference.debugName))
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && imports.has(node.text) && isReferenceIdentifier(node)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(expression.body ?? expression)
  return names
}

export function captureNames(declarationRoot, referenceRoot, setters, bindingIndex) {
  const indexed = indexedReferences(bindingIndex, referenceRoot, declarationRoot)
  if (indexed) {
    const stateNames = new Set(setters.values())
    return new Set(indexed.filter(reference => ["capture", "unresolved"].includes(reference.kind) && !setters.has(reference.debugName) && !stateNames.has(reference.debugName)).map(reference => reference.debugName))
  }
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
      if (isReferenceIdentifier(node) && !declared && !setters.has(node.text) && !stateNames.has(node.text) && !knownGlobalNames.has(node.text)) captures.add(node.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(referenceRoot)
  return captures
}

function indexedReferences(bindingIndex, root, boundary) {
  return bindingIndex?.hasNode(root) && bindingIndex.hasNode(boundary) ? bindingIndex.references(root, boundary) : undefined
}
