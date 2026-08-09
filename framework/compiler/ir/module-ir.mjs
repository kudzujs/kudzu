export function createModuleIR(file) {
  return { version: 1, file, signals: [], handlers: [], bindings: [], derived: [], effects: [], keyedBlocks: [], imports: [], clientModules: [] }
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
