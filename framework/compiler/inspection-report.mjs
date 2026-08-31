const limits = Object.freeze({ modules: 100, routes: 100, packages: 100, compatibilitySites: 100, capabilities: 50, owners: 100, blockers: 50 })

export function createInspectionReport({ sourceFiles = [], sourceResults = [], compatibility, artifacts, diagnostics = [] } = {}) {
  const complete = diagnostics.length === 0
  const modules = complete ? moduleFacts(sourceFiles, sourceResults) : []
  const routes = complete ? routeFacts(artifacts?.routes ?? []) : []
  const packages = complete ? [...(compatibility?.packages ?? [])] : []
  const compatibilitySites = complete ? [...(compatibility?.sites ?? [])] : []
  const capabilities = complete ? capabilityFacts(artifacts?.runtimeFamilies ?? []) : []
  const owners = complete ? ownerFacts(sourceResults) : []
  const blockers = complete ? compatibilityBlockers(compatibilitySites) : diagnosticBlockers(diagnostics)
  const sections = { modules, routes, packages, compatibilitySites, capabilities, owners, blockers }

  return {
    version: 1,
    status: blockers.some(blocker => blocker.severity === "error") ? "blocked" : "ready",
    inventoryComplete: complete,
    limits,
    summary: Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, entries.length])),
    ...Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, entries.slice(0, limits[name])])),
    omitted: Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, Math.max(0, entries.length - limits[name])])),
  }
}

function moduleFacts(sourceFiles, sourceResults) {
  const results = new Map(sourceResults.map(result => [result.file, result]))
  return [...sourceFiles].sort(compareText).map(file => {
    const result = results.get(file)
    const moduleIR = result?.moduleIR
    return compact({
      file,
      kind: file.endsWith(".worker.ts") ? "worker" : file.startsWith("src/pages/") && file.endsWith(".tsx") ? "page" : "module",
      owners: result?.componentAnalysis.owners.length ?? 0,
      specializations: result?.componentAnalysis.specializations.length ?? 0,
      signals: moduleIR?.signals.length ?? 0,
      sharedStates: moduleIR?.sharedStates.length ?? 0,
      sharedActions: moduleIR?.sharedActions.length ?? 0,
      handlers: moduleIR?.handlers.length ?? 0,
      bindings: moduleIR?.bindings.length ?? 0,
      derived: moduleIR?.derived.length ?? 0,
      effects: moduleIR?.effects.length ?? 0,
      keyedBlocks: moduleIR?.keyedBlocks.length ?? 0,
      imports: moduleIR?.imports.length ?? 0,
    })
  })
}

function routeFacts(routes) {
  return [...routes].sort((left, right) => compareText(left.route, right.route)).map(route => ({
    route: route.route,
    runtimeFamily: route.runtime.family,
    static: route.runtime.family === null && route.runtime.entries.length === 0 && route.handlers.entries.length === 0 && route.handlers.chunks.length === 0 && route.handlers.lazyChunks.length === 0 && route.workers.length === 0,
    capabilities: enabledFacts(route.capability.manifest),
    artifacts: {
      runtimeEntries: route.runtime.entries.length,
      runtimeRequirements: route.runtime.requirements.length,
      handlerEntries: route.handlers.entries.length,
      chunks: route.handlers.chunks.length,
      lazyChunks: route.handlers.lazyChunks.length,
      workers: route.workers.length,
      styles: route.styles.length,
    },
  }))
}

function capabilityFacts(families) {
  return [...families].sort((left, right) => compareText(left.id, right.id)).map(family => ({
    id: family.id,
    navigation: family.navigation,
    routes: family.routes.length,
    facts: enabledFacts(family.manifest),
    requirements: family.requirements.length,
  }))
}

function ownerFacts(sourceResults) {
  const owners = []
  for (const result of sourceResults) {
    const effects = result.moduleIR.effects
    const blocks = result.moduleIR.keyedBlocks
    for (const owner of result.componentAnalysis.owners) owners.push(ownerFact(result.file, "component", owner, effects, blocks))
    for (const owner of result.componentAnalysis.specializations) owners.push(ownerFact(result.file, "specialization", owner, effects, blocks))
  }
  return owners.sort((left, right) => compareText(left.module, right.module) || compareText(left.kind, right.kind) || left.slot - right.slot)
}

function ownerFact(module, kind, owner, effects, blocks) {
  return {
    module,
    kind,
    slot: owner.slot,
    name: typeof owner.name === "string" ? owner.name : typeof owner.component === "string" ? owner.component : owner.component?.name ?? "anonymous",
    ...compact({
      stateCount: owner.states?.length ?? 0,
      refCount: owner.refs?.length ?? 0,
      idCount: owner.ids?.length ?? 0,
      effectCount: effects.filter(effect => effect.ownership?.owner?.kind === kind && effect.ownership.owner.slot === owner.slot).length,
      keyedBlockCount: kind === "specialization" ? blocks.filter(block => block.specializations?.includes(owner.slot)).length : 0,
    }),
  }
}

function compatibilityBlockers(sites) {
  return sites.filter(site => site.classification === "Unsupported" || site.classification === "Partial").map(site => ({
    kind: "compatibility",
    severity: site.classification === "Unsupported" ? "error" : "review",
    code: site.rule,
    file: site.file,
    location: site.location,
    package: site.package,
    imported: site.imported,
    classification: site.classification,
  })).sort(compareBlockers)
}

function diagnosticBlockers(diagnostics) {
  return diagnostics.map(diagnostic => ({
    kind: "diagnostic",
    severity: diagnostic.severity,
    code: diagnostic.code,
    stage: diagnostic.stage,
    message: diagnostic.message,
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
    compatibilityClass: diagnostic.compatibilityClass,
    suggestion: diagnostic.suggestion,
  })).sort(compareBlockers)
}

function enabledFacts(value, prefix = "") {
  const facts = []
  for (const [key, entry] of Object.entries(value ?? {}).sort(([left], [right]) => compareText(left, right))) {
    if (key === "version") continue
    const path = prefix ? `${prefix}.${key}` : key
    if (entry === true) facts.push(path)
    else if (typeof entry === "number" && entry > 0) facts.push(`${path}=${entry}`)
    else if (Array.isArray(entry)) for (const item of entry) facts.push(`${path}=${item}`)
    else if (entry && typeof entry === "object") facts.push(...enabledFacts(entry, path))
  }
  return facts
}

function compact(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== 0))
}

function compareBlockers(left, right) {
  const leftFile = left.file ?? left.source?.file ?? ""
  const rightFile = right.file ?? right.source?.file ?? ""
  const leftLocation = left.location ?? left.source?.start ?? {}
  const rightLocation = right.location ?? right.source?.start ?? {}
  return compareText(leftFile, rightFile) || (leftLocation.line ?? 0) - (rightLocation.line ?? 0) || (leftLocation.column ?? 0) - (rightLocation.column ?? 0) || compareText(left.code, right.code)
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
