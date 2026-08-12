export function createRouteBuildRecord(input) {
  const record = {
    version: input.version ?? 1,
    route: input.route,
    output: input.output,
    html: input.html,
    plan: input.plan,
    capabilities: input.capabilities,
    artifacts: {
      handlers: input.handlerReferences ?? [],
      effects: (input.plan?.effects ?? []).map(({ module, handler }) => ({ module, handler })),
      styles: [...new Set(input.styles ?? [])]
    },
    entries: input.entries ?? {},
    ...(input.runtimeSchema ? { runtimeSchema: input.runtimeSchema } : {})
  }
  return assertRouteBuildRecord(record)
}

export function assertRouteBuildRecord(record) {
  if (record?.version !== 1) throw new Error(`Unsupported RouteBuildRecord version: ${JSON.stringify(record?.version)}`)
  if (typeof record.route !== "string" || typeof record.output !== "string" || typeof record.html !== "string" || !isRecord(record.plan)) throw new Error("Invalid RouteBuildRecord v1 structure")
  if (record.plan.route !== record.route) throw new Error(`RouteBuildRecord route ${JSON.stringify(record.route)} does not match RouteIR route ${JSON.stringify(record.plan.route)}`)
  const capabilityNames = ["navigable", "usesDependencyRuntime", "hasBehaviors", "hasBindings", "hasLists", "hasListStyles", "hasStateSeed", "hasParams", "hasEffects"]
  if (!isRecord(record.capabilities) || !capabilityNames.every(name => typeof record.capabilities[name] === "boolean")) throw new Error("Invalid RouteBuildRecord v1 capabilities")
  if (!isRecord(record.artifacts) || !Array.isArray(record.artifacts.handlers) || !Array.isArray(record.artifacts.effects) || !Array.isArray(record.artifacts.styles) || !isRecord(record.entries)) throw new Error("Invalid RouteBuildRecord v1 artifacts")
  const handlers = new Set()
  for (const reference of record.artifacts.handlers) {
    assertHandlerReference(reference)
    const key = referenceKey(reference)
    if (handlers.has(key)) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} has duplicate handler reference ${key}`)
    handlers.add(key)
  }
  for (const effect of record.artifacts.effects) {
    assertHandlerReference(effect)
    if (!handlers.has(referenceKey(effect))) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} effect references an unretained handler ${referenceKey(effect)}`)
  }
  for (const event of record.plan.events ?? []) if (event.native && !handlers.has(referenceKey(event.native))) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} event references an unretained handler ${referenceKey(event.native)}`)
  for (const descriptor of [...(record.plan.bindings ?? []), ...(record.plan.conditions ?? []), ...(record.plan.lists ?? []).map(list => list.source).filter(Boolean)]) {
    if (descriptor.module && !handlers.has(referenceKey(descriptor))) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} descriptor references an unretained handler ${referenceKey(descriptor)}`)
  }
  if (record.artifacts.styles.some(style => typeof style !== "string")) throw new Error("RouteBuildRecord styles must be strings")
  for (const [kind, path] of Object.entries(record.entries)) if (!["effect", "native", "param"].includes(kind) || typeof path !== "string") throw new Error(`Invalid RouteBuildRecord entry ${JSON.stringify(kind)}`)
  if (record.runtimeSchema !== undefined && !isRecord(record.runtimeSchema)) throw new Error("Invalid RouteBuildRecord runtime schema")
  const hasNative = (record.plan.events ?? []).some(event => event.native)
  if (Boolean(record.entries.effect) !== record.capabilities.hasEffects || record.capabilities.hasEffects !== Boolean(record.plan.effects?.length)) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} has inconsistent effect artifacts`)
  if (Boolean(record.entries.native) !== hasNative) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} has inconsistent native artifacts`)
  if (Boolean(record.entries.param) !== record.capabilities.hasParams) throw new Error(`RouteBuildRecord ${JSON.stringify(record.route)} has inconsistent parameter artifacts`)
  return record
}

export function planRouteArtifacts(records, handlerModules, workerReferences, moduleUrl) {
  for (const record of records) assertRouteBuildRecord(record)
  const modules = new Map()
  for (const module of handlerModules) {
    const url = moduleUrl(module)
    if (modules.has(url)) throw new Error(`Duplicate compiled handler module: ${url}`)
    modules.set(url, module)
  }
  const retainedUrls = new Set(records.flatMap(record => record.artifacts.handlers.map(reference => reference.module)))
  for (const url of retainedUrls) if (!modules.has(url)) throw new Error(`Handler module was not compiled: ${url}`)
  const effects = new Map()
  for (const reference of records.flatMap(record => record.artifacts.effects)) {
    const handlers = effects.get(reference.module) ?? new Set()
    handlers.add(reference.handler)
    effects.set(reference.module, handlers)
  }
  return {
    handlerModules: handlerModules.filter(module => retainedUrls.has(moduleUrl(module))),
    workerReferences: workerReferences.filter(reference => effects.get(reference.module)?.has(reference.handler)),
    styles: [...new Set(records.flatMap(record => record.artifacts.styles))]
  }
}

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value)

function assertHandlerReference(reference) {
  if (!isRecord(reference) || typeof reference.module !== "string" || !reference.module || typeof reference.handler !== "string" || !reference.handler) throw new Error("RouteBuildRecord handler references require module and handler strings")
}

const referenceKey = reference => `${JSON.stringify(reference.module)}#${JSON.stringify(reference.handler)}`
