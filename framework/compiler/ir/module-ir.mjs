export function createModuleIR(file) {
  return { version: 1, file, signals: [], handlers: [] }
}

export function registerCommandHandler(moduleIR, commands, source, scope = "module") {
  const slots = new Map(moduleIR.signals.map(signal => [signal.key, signal.slot]))
  for (const { state } of commands) {
    const key = `${scope}:${state}`
    if (slots.has(key)) continue
    const slot = moduleIR.signals.length
    slots.set(key, slot)
    moduleIR.signals.push({ slot, key, debugName: state })
  }
  const signal = state => slots.get(`${scope}:${state}`) ?? slots.get(state)
  const handler = {
    slot: moduleIR.handlers.length,
    kind: "commands",
    commands: commands.map(({ operation, state, value, syntax }) => ({ operation, signal: signal(state), value, ...(syntax ? { syntax } : {}) })),
    ...(source ? { source } : {})
  }
  moduleIR.handlers.push(handler)
  return handler
}
