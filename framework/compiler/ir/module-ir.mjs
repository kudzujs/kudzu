export function createModuleIR(file) {
  return { version: 2, file, symbols: [], sharedStates: [], sharedActions: [], signals: [], handlers: [], bindings: [], derived: [], effects: [], keyedBlocks: [], imports: [], clientModules: [] }
}

export function assertModuleIRReferences(moduleIR, componentAnalysis) {
  if (moduleIR?.version !== 2) throw new Error(`Unsupported ModuleIR version: ${JSON.stringify(moduleIR?.version)}`)
  if (componentAnalysis && componentAnalysis.version !== 2) throw new Error(`Unsupported ComponentAnalysis version: ${JSON.stringify(componentAnalysis.version)}`)
  const slot = (records, value, label, kind) => {
    if (!Number.isInteger(value) || value < 0 || value >= records.length) throw new Error(`${label} references missing ${kind} slot ${JSON.stringify(value)}`)
    return records[value]
  }
  const indexed = (name, records) => {
    records.forEach((record, index) => {
      if (record.slot !== index) throw new Error(`${name} slot ${JSON.stringify(record.slot)} must equal its index ${index}`)
    })
  }
  indexed("SymbolRef", moduleIR.symbols)
  indexed("SharedStateIR", moduleIR.sharedStates)
  indexed("SharedActionIR", moduleIR.sharedActions)
  indexed("SignalIR", moduleIR.signals)
  indexed("HandlerIR", moduleIR.handlers)
  indexed("BindingIR", moduleIR.bindings)
  indexed("DerivedIR", moduleIR.derived)
  indexed("EffectIR", moduleIR.effects)
  indexed("KeyedBlockIR", moduleIR.keyedBlocks)
  indexed("ImportIR", moduleIR.imports)
  for (const action of moduleIR.sharedActions) slot(moduleIR.sharedStates, action.state, `SharedActionIR ${action.slot}`, "SharedStateIR")
  if (componentAnalysis) {
    indexed("Component owner", componentAnalysis.owners)
    indexed("Component specialization", componentAnalysis.specializations)
    for (const owner of componentAnalysis.owners) {
      indexed(`Component owner ${owner.slot} state`, owner.states)
      indexed(`Component owner ${owner.slot} ref`, owner.refs)
      indexed(`Component owner ${owner.slot} ID`, owner.ids)
      for (const setter of owner.setters) slot(owner.states, setter.signal, `Component owner ${owner.slot} setter ${JSON.stringify(setter.name)}`, "state")
      for (const state of owner.states) if (state.owner !== undefined) ownerRef(state.owner, `Component owner ${owner.slot} state ${state.slot} external owner`)
    }
    for (const specialization of componentAnalysis.specializations) {
      indexed(`Component specialization ${specialization.slot} state`, specialization.states)
      indexed(`Component specialization ${specialization.slot} ref`, specialization.refs)
      indexed(`Component specialization ${specialization.slot} ID`, specialization.ids)
      if (specialization.owner !== undefined) ownerRef(specialization.owner, `Component specialization ${specialization.slot} owner`)
      for (const prop of specialization.props ?? []) for (const signal of prop.signals ?? []) slot(moduleIR.signals, signal, `Component specialization ${specialization.slot} prop ${JSON.stringify(prop.name)}`, "SignalIR")
    }
  }
  function moduleSymbol(symbol, label) {
    if (!symbol || typeof symbol.id !== "string" || typeof symbol.module !== "string" || typeof symbol.site !== "string" || typeof symbol.name !== "string") throw new Error(`${label} must be a ModuleSymbol`)
  }
  function ownerRef(reference, label) {
    if (!reference || typeof reference !== "object") throw new Error(`${label} must be an OwnerRef`)
    if (reference.kind === "component") return slot(componentAnalysis?.owners ?? [], reference.slot, label, "component owner")
    if (reference.kind === "specialization") return slot(componentAnalysis?.specializations ?? [], reference.slot, label, "component specialization")
    if (reference.kind === "module-symbol") return moduleSymbol(reference.symbol, label)
    if (reference.kind !== "module") throw new Error(`${label} has invalid kind ${JSON.stringify(reference.kind)}`)
  }
  function stateRef(reference, label) {
    if (!reference || typeof reference !== "object") throw new Error(`${label} must be a StateRef`)
    if (reference.kind === "module-symbol") return moduleSymbol(reference.symbol, label)
    if (reference.kind === "symbol") return slot(moduleIR.symbols, reference.symbol, label, "SymbolRef")
    if (reference.kind === "shared-state") return slot(moduleIR.sharedStates, reference.sharedState, label, "SharedStateIR")
    if (reference.kind !== "state") throw new Error(`${label} has invalid kind ${JSON.stringify(reference.kind)}`)
    const owner = ownerRef(reference.owner, `${label} owner`)
    const states = reference.owner.kind === "component" || reference.owner.kind === "specialization" ? owner.states : []
    slot(states, reference.slot, label, "owner state")
  }
  const exports = new Map()
  const exported = (record, label) => {
    if (record.kind !== "module-export") return
    if (typeof record.exportName !== "string" || !record.exportName) throw new Error(`${label} requires an export name`)
    const previous = exports.get(record.exportName)
    if (previous) throw new Error(`ModuleIR export ${JSON.stringify(record.exportName)} is declared by both ${previous} and ${label}`)
    exports.set(record.exportName, label)
  }
  for (const signal of moduleIR.signals) stateRef(signal.reference, `SignalIR ${signal.slot}`)
  for (const handler of moduleIR.handlers) {
    exported(handler, `HandlerIR ${handler.slot}`)
    for (const [index, command] of (handler.commands ?? []).entries()) slot(moduleIR.signals, command.signal, `HandlerIR ${handler.slot} command ${index}`, "SignalIR")
    for (const [index, signal] of (handler.signals ?? []).entries()) slot(moduleIR.signals, signal.signal, `HandlerIR ${handler.slot} signal ${index}`, "SignalIR")
    for (const [index, imported] of (handler.imports ?? []).entries()) slot(moduleIR.imports, imported, `HandlerIR ${handler.slot} import ${index}`, "ImportIR")
    for (const [index, capture] of (handler.captures ?? []).entries()) if (capture.symbol !== undefined) slot(moduleIR.symbols, capture.symbol, `HandlerIR ${handler.slot} capture ${index}`, "SymbolRef")
    for (const [index, action] of (handler.actions ?? []).entries()) slot(moduleIR.sharedActions, action, `HandlerIR ${handler.slot} action ${index}`, "SharedActionIR")
    if (handler.keyedBlock !== undefined) slot(moduleIR.keyedBlocks, handler.keyedBlock, `HandlerIR ${handler.slot} keyed block`, "KeyedBlockIR")
  }
  for (const binding of moduleIR.bindings) {
    exported(binding, `BindingIR ${binding.slot}`)
    for (const [index, signal] of (binding.signals ?? []).entries()) slot(moduleIR.signals, signal, `BindingIR ${binding.slot} signal ${index}`, "SignalIR")
    for (const [index, imported] of (binding.imports ?? []).entries()) slot(moduleIR.imports, imported, `BindingIR ${binding.slot} import ${index}`, "ImportIR")
    for (const [index, capture] of (binding.captures ?? []).entries()) if (capture.symbol !== undefined) slot(moduleIR.symbols, capture.symbol, `BindingIR ${binding.slot} capture ${index}`, "SymbolRef")
    if (binding.keyedBlock !== undefined) slot(moduleIR.keyedBlocks, binding.keyedBlock, `BindingIR ${binding.slot} keyed block`, "KeyedBlockIR")
  }
  for (const derived of moduleIR.derived) for (const [index, signal] of (derived.signals ?? []).entries()) slot(moduleIR.signals, signal, `DerivedIR ${derived.slot} signal ${index}`, "SignalIR")
  for (const effect of moduleIR.effects) {
    const handler = slot(moduleIR.handlers, effect.setup?.handler, `EffectIR ${effect.slot} setup`, "HandlerIR")
    if (handler.kind !== "module-export" || handler.role !== "effect") throw new Error(`EffectIR ${effect.slot} setup HandlerIR ${handler.slot} must have role "effect"`)
    for (const [index, dependency] of (effect.dependencies ?? []).entries()) {
      if (dependency.kind === "signal") slot(moduleIR.signals, dependency.signal, `EffectIR ${effect.slot} dependency ${index}`, "SignalIR")
      else if (dependency.kind === "derived") {
        slot(moduleIR.derived, dependency.derived, `EffectIR ${effect.slot} dependency ${index}`, "DerivedIR")
        for (const [sourceIndex, signal] of (dependency.sources ?? []).entries()) slot(moduleIR.signals, signal, `EffectIR ${effect.slot} dependency ${index} source ${sourceIndex}`, "SignalIR")
      } else throw new Error(`EffectIR ${effect.slot} dependency ${index} has invalid kind ${JSON.stringify(dependency.kind)}`)
    }
    for (const [index, signal] of (effect.subscriptions ?? []).entries()) slot(moduleIR.signals, signal, `EffectIR ${effect.slot} subscription ${index}`, "SignalIR")
    for (const [index, signal] of (effect.dependencySignals ?? []).entries()) slot(moduleIR.signals, signal, `EffectIR ${effect.slot} dependency signal ${index}`, "SignalIR")
    if (effect.ownership?.owner) ownerRef(effect.ownership.owner, `EffectIR ${effect.slot} ownership`)
    if (effect.ownership?.keyedBlock !== undefined) {
      slot(moduleIR.keyedBlocks, effect.ownership.keyedBlock, `EffectIR ${effect.slot} ownership`, "KeyedBlockIR")
      if (handler.keyedBlock !== effect.ownership.keyedBlock) throw new Error(`EffectIR ${effect.slot} and HandlerIR ${handler.slot} must reference the same KeyedBlockIR`)
    }
  }
  for (const block of moduleIR.keyedBlocks) {
    if (block.collection?.kind === "signal") slot(moduleIR.signals, block.collection.signal, `KeyedBlockIR ${block.slot} collection`, "SignalIR")
    else if (block.collection?.kind === "binding") slot(moduleIR.bindings, block.collection.binding, `KeyedBlockIR ${block.slot} collection`, "BindingIR")
    else if (block.collection?.kind === "symbol") slot(moduleIR.symbols, block.collection.symbol, `KeyedBlockIR ${block.slot} collection`, "SymbolRef")
    else if (block.collection?.kind !== "static") throw new Error(`KeyedBlockIR ${block.slot} collection has invalid kind ${JSON.stringify(block.collection?.kind)}`)
    if (block.parent !== undefined) {
      const parent = slot(moduleIR.keyedBlocks, block.parent, `KeyedBlockIR ${block.slot} parent`, "KeyedBlockIR")
      if (!(parent.children ?? []).includes(block.slot)) throw new Error(`KeyedBlockIR ${block.slot} parent ${parent.slot} does not reciprocally list child ${block.slot}`)
    }
    for (const childSlot of block.children ?? []) {
      const child = slot(moduleIR.keyedBlocks, childSlot, `KeyedBlockIR ${block.slot} child`, "KeyedBlockIR")
      if (child.parent !== block.slot) throw new Error(`KeyedBlockIR ${block.slot} child ${child.slot} does not reciprocally reference parent ${block.slot}`)
    }
    if (new Set(block.children ?? []).size !== (block.children ?? []).length) throw new Error(`KeyedBlockIR ${block.slot} has duplicate children`)
    if (block.selector !== undefined) slot(moduleIR.derived, block.selector, `KeyedBlockIR ${block.slot} selector`, "DerivedIR")
    for (const [index, signal] of (block.selectorSignals ?? []).entries()) slot(moduleIR.signals, signal, `KeyedBlockIR ${block.slot} selector signal ${index}`, "SignalIR")
    for (const [index, specialization] of (block.specializations ?? []).entries()) slot(componentAnalysis?.specializations ?? [], specialization, `KeyedBlockIR ${block.slot} specialization ${index}`, "component specialization")
    for (const [index, row] of (block.rowStates ?? []).entries()) slot(moduleIR.signals, row.signal, `KeyedBlockIR ${block.slot} row state ${index}`, "SignalIR")
    for (const [index, row] of (block.rowRefs ?? []).entries()) {
      const specialization = slot(componentAnalysis?.specializations ?? [], row.specialization, `KeyedBlockIR ${block.slot} row ref ${index}`, "component specialization")
      slot(specialization.refs, row.ref, `KeyedBlockIR ${block.slot} row ref ${index}`, "specialization ref")
    }
  }
  const visiting = new Set()
  const visited = new Set()
  const visit = (block, trail) => {
    if (visiting.has(block.slot)) throw new Error(`KeyedBlockIR parent cycle: ${[...trail, block.slot].join(" -> ")}`)
    if (visited.has(block.slot)) return
    visiting.add(block.slot)
    if (block.parent !== undefined) visit(moduleIR.keyedBlocks[block.parent], [...trail, block.slot])
    visiting.delete(block.slot)
    visited.add(block.slot)
  }
  for (const block of moduleIR.keyedBlocks) visit(block, [])
  return moduleIR
}

export function registerSignal(moduleIR, reference, debugName) {
  const key = JSON.stringify(reference)
  let signal = moduleIR.signals.find(entry => JSON.stringify(entry.reference) === key)
  if (!signal) {
    signal = { slot: moduleIR.signals.length, reference, debugName }
    moduleIR.signals.push(signal)
  }
  return signal
}

export function registerSharedState(moduleIR, descriptor) {
  let state = moduleIR.sharedStates.find(entry => entry.identity === descriptor.identity && entry.field === descriptor.field)
  if (!state) {
    state = { ...descriptor, slot: moduleIR.sharedStates.length }
    moduleIR.sharedStates.push(state)
  }
  return state
}

export function registerSharedAction(moduleIR, descriptor) {
  let action = moduleIR.sharedActions.find(entry => entry.state === descriptor.state && entry.name === descriptor.name)
  if (!action) {
    action = { ...descriptor, slot: moduleIR.sharedActions.length }
    moduleIR.sharedActions.push(action)
  }
  return action
}

export function registerCommandHandler(moduleIR, commands, source) {
  const handler = {
    slot: moduleIR.handlers.length,
    kind: "commands",
    commands: commands.map(({ operation, reference, state, value, syntax }) => ({ operation, signal: registerSignal(moduleIR, reference, state).slot, value, ...(syntax ? { syntax } : {}) })),
    ...(source ? { source } : {})
  }
  moduleIR.handlers.push(handler)
  return handler
}

export function registerModuleHandler(moduleIR, descriptor) {
  const handler = { ...descriptor, slot: moduleIR.handlers.length, kind: "module-export" }
  moduleIR.handlers.push(handler)
  return handler
}

export function registerBinding(moduleIR, descriptor) {
  const binding = { ...descriptor, slot: moduleIR.bindings.length, kind: "module-export" }
  moduleIR.bindings.push(binding)
  return binding
}

export function registerDerived(moduleIR, descriptor) {
  const derived = { ...descriptor, slot: moduleIR.derived.length }
  moduleIR.derived.push(derived)
  return derived
}

export function registerEffect(moduleIR, descriptor) {
  const effect = { ...descriptor, slot: moduleIR.effects.length }
  moduleIR.effects.push(effect)
  return effect
}

export function registerKeyedBlock(moduleIR, descriptor) {
  const block = { ...descriptor, slot: moduleIR.keyedBlocks.length }
  moduleIR.keyedBlocks.push(block)
  return block
}
