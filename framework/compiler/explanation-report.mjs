import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { gzipSync } from "node:zlib"

const limits = Object.freeze({ sources: 100, normalization: 100, owners: 100, effects: 100, artifacts: 100 })

export async function createExplanationReport({ route, record, artifact, entrySource, sourceFiles, sourceResults, compatibility, outputDirectory, base }) {
  const sources = [...sourceFiles].sort(compareText)
  const sourceSet = new Set(sources)
  const results = sourceResults.filter(result => sourceSet.has(result.file))
  const normalization = compatibility.sites.filter(site => sourceSet.has(site.file)).map(site => ({ ...site, provenance: "reachable-source" }))
  const owners = results.flatMap(result => [
    ...result.componentAnalysis.owners.map(owner => ownerFact(result.file, "component", owner)),
    ...result.componentAnalysis.specializations.map(owner => ownerFact(result.file, "specialization", owner)),
  ]).sort((left, right) => compareText(left.module, right.module) || compareText(left.kind, right.kind) || left.slot - right.slot)
  const effects = effectFacts(record, results, sources)
  const artifacts = await artifactFacts(artifact, outputDirectory, base)
  const eager = artifacts.filter(entry => !entry.reasons.includes("lazy-handler-chunk") && !entry.external)
  const lazy = artifacts.filter(entry => entry.reasons.includes("lazy-handler-chunk") && !entry.external)
  const javascript = artifacts.filter(entry => entry.path.endsWith(".js") && !entry.external)
  const zeroJavaScript = artifact.runtime.family === null && javascript.length === 0
  const sections = { sources, normalization, owners, effects, artifacts }
  return {
    version: 1,
    status: "ready",
    route,
    entrySource,
    runtimeRoute: Boolean(record.runtimeSchema),
    capability: { signature: artifact.capability.signature, family: artifact.runtime.family, facts: enabledFacts(artifact.capability.manifest) },
    ...Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, entries.slice(0, limits[name])])),
    bytes: {
      eagerRawBytes: sum(eager, "rawBytes"),
      eagerGzipBytes: sum(eager, "gzipBytes"),
      lazyRawBytes: sum(lazy, "rawBytes"),
      lazyGzipBytes: sum(lazy, "gzipBytes"),
      javascriptRawBytes: sum(javascript, "rawBytes"),
      javascriptGzipBytes: sum(javascript, "gzipBytes"),
    },
    zeroJavaScript: {
      value: zeroJavaScript,
      scope: "compiler-selected-capability-artifacts",
      reasons: zeroJavaScript
        ? ["no behavior runtime family", "no runtime or handler entry", "no Worker graph"]
        : ["route selects one or more browser capability artifacts"],
    },
    limits,
    summary: Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, entries.length])),
    omitted: Object.fromEntries(Object.entries(sections).map(([name, entries]) => [name, Math.max(0, entries.length - limits[name])])),
  }
}

function effectFacts(record, results, sources) {
  const facts = []
  for (const reference of record.artifacts.effects) {
    const result = results.find(entry => entry.handlerModule && reference.module.endsWith(`/assets/${entry.handlerModule.path}`))
    if (!result) continue
    const handler = result.moduleIR.handlers.find(entry => entry.exportName === reference.handler)
    const effect = result.moduleIR.effects.find(entry => entry.setup?.handler === handler?.slot)
    if (!handler || !effect) continue
    const owner = effect.ownership?.owner
    const descriptor = owner?.kind === "component" ? result.componentAnalysis.owners[owner.slot] : owner?.kind === "specialization" ? result.componentAnalysis.specializations[owner.slot] : undefined
    facts.push({
      module: result.file,
      handler: reference.handler,
      ...(handler.source ? { source: handler.source } : {}),
      owner: descriptor?.name ?? descriptor?.component?.name ?? owner?.kind ?? "module",
      cleanup: Boolean(effect.cleanup),
      dependencies: effect.dependencies?.length ?? 0,
      workers: effect.workers.map(worker => {
        const matches = sources.filter(file => file === worker.root || file.endsWith(`/${worker.root}`))
        return matches.length === 1 ? matches[0] : worker.root
      }).sort(compareText),
    })
  }
  return facts.sort((left, right) => compareText(left.module, right.module) || compareText(left.handler, right.handler))
}

async function artifactFacts(route, outputDirectory, base) {
  const edges = [
    ...route.runtime.entries.map(path => [path, "runtime-entry"]),
    ...route.runtime.requirements.map(path => [path, "runtime-requirement"]),
    ...route.handlers.entries.map(path => [path, "handler-entry"]),
    ...route.handlers.chunks.map(path => [path, "handler-chunk"]),
    ...route.handlers.lazyChunks.map(path => [path, "lazy-handler-chunk"]),
    ...route.workers.flatMap(worker => [[worker.entry, `worker:${worker.source}`], ...worker.chunks.map(path => [path, `worker-chunk:${worker.source}`])]),
    ...route.styles.map(path => [path, "style"]),
  ]
  const selected = new Map()
  for (const [url, reason] of edges) {
    const reasons = selected.get(url) ?? new Set()
    reasons.add(reason)
    selected.set(url, reasons)
  }
  return Promise.all([...selected].sort(([left], [right]) => compareText(left, right)).map(async ([url, reasons]) => {
    if (/^https?:\/\//.test(url)) return { path: url, reasons: [...reasons].sort(compareText), external: true }
    const pathname = new URL(url, "https://kudzu.invalid").pathname
    const deployed = base && pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1) : pathname.slice(1)
    const contents = await readFile(join(outputDirectory, deployed))
    return {
      path: deployed,
      reasons: [...reasons].sort(compareText),
      rawBytes: contents.byteLength,
      gzipBytes: gzipSync(contents).byteLength,
      sha256: createHash("sha256").update(contents).digest("hex"),
    }
  }))
}

function ownerFact(module, kind, owner) {
  return {
    module,
    kind,
    slot: owner.slot,
    name: owner.name ?? owner.component?.name ?? "anonymous",
    states: owner.states?.length ?? 0,
    refs: owner.refs?.length ?? 0,
    ids: owner.ids?.length ?? 0,
    provenance: "reachable-source",
  }
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

const sum = (entries, field) => entries.reduce((total, entry) => total + entry[field], 0)
const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0
