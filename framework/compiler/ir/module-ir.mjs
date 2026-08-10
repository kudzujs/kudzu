export function createModuleIR(file) {
  return { version: 1, file, signals: [], handlers: [], bindings: [], derived: [], effects: [], keyedBlocks: [], imports: [], clientModules: [] }
}

export function assertModuleIRReferences(moduleIR) {
  const slot = (records, value, label) => {
    if (!Number.isInteger(value) || value < 0 || value >= records.length) throw new Error(`ModuleIR ${label} references missing slot ${JSON.stringify(value)}`)
  }
  for (const [name, records] of [["signal", moduleIR.signals], ["handler", moduleIR.handlers], ["binding", moduleIR.bindings], ["derived", moduleIR.derived], ["effect", moduleIR.effects], ["keyed block", moduleIR.keyedBlocks]]) {
    records.forEach((record, index) => {
      if (record.slot !== index) throw new Error(`ModuleIR ${name} slot ${JSON.stringify(record.slot)} must equal its index ${index}`)
    })
  }
  for (const handler of moduleIR.handlers) {
    for (const command of handler.commands ?? []) slot(moduleIR.signals, command.signal, `handler ${handler.slot} command signal`)
    if (handler.keyedBlock !== undefined) slot(moduleIR.keyedBlocks, handler.keyedBlock, `handler ${handler.slot} keyed block`)
  }
  for (const binding of moduleIR.bindings) if (binding.keyedBlock !== undefined) slot(moduleIR.keyedBlocks, binding.keyedBlock, `binding ${binding.slot} keyed block`)
  for (const effect of moduleIR.effects) {
    slot(moduleIR.handlers, effect.setup?.handler, `effect ${effect.slot} setup handler`)
    for (const dependency of effect.dependencies ?? []) if (dependency.kind === "derived") slot(moduleIR.derived, dependency.derived, `effect ${effect.slot} derived dependency`)
    if (effect.ownership?.keyedBlock !== undefined) slot(moduleIR.keyedBlocks, effect.ownership.keyedBlock, `effect ${effect.slot} keyed block`)
  }
  for (const block of moduleIR.keyedBlocks) {
    if (block.parent !== undefined) slot(moduleIR.keyedBlocks, block.parent, `keyed block ${block.slot} parent`)
    for (const child of block.children ?? []) slot(moduleIR.keyedBlocks, child, `keyed block ${block.slot} child`)
    if (block.selector !== undefined) slot(moduleIR.derived, block.selector, `keyed block ${block.slot} selector`)
  }
  return moduleIR
}

export function registerCommandHandler(moduleIR, commands, source, scope = "module") {
  const slots = new Map(moduleIR.signals.map(signal => [signal.key, signal.slot]))
  for (const { state, owner = scope } of commands) {
    const key = `${owner}:${state}`
    if (slots.has(key)) continue
    const slot = moduleIR.signals.length
    slots.set(key, slot)
    moduleIR.signals.push({ slot, key, debugName: state })
  }
  const signal = command => slots.get(`${command.owner ?? scope}:${command.state}`)
  const handler = {
    slot: moduleIR.handlers.length,
    kind: "commands",
    commands: commands.map(({ operation, state, owner, value, syntax }) => ({ operation, signal: signal({ state, owner }), value, ...(syntax ? { syntax } : {}) })),
    ...(source ? { source } : {})
  }
  moduleIR.handlers.push(handler)
  return handler
}

export function registerModuleHandler(moduleIR, descriptor) {
  const handler = { slot: moduleIR.handlers.length, kind: "module-export", ...descriptor }
  moduleIR.handlers.push(handler)
  return handler
}

export function registerBinding(moduleIR, descriptor) {
  const binding = { slot: moduleIR.bindings.length, kind: "module-export", ...descriptor }
  moduleIR.bindings.push(binding)
  return binding
}

export function registerDerived(moduleIR, descriptor) {
  const derived = { slot: moduleIR.derived.length, ...descriptor }
  moduleIR.derived.push(derived)
  return derived
}

export function registerEffect(moduleIR, descriptor) {
  const effect = { slot: moduleIR.effects.length, ...descriptor }
  moduleIR.effects.push(effect)
  return effect
}

export function registerKeyedBlock(moduleIR, descriptor) {
  const block = { slot: moduleIR.keyedBlocks.length, ...descriptor }
  moduleIR.keyedBlocks.push(block)
  return block
}
