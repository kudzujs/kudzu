import { createHash } from "node:crypto"
import { dirname, relative, resolve, sep } from "node:path"
import { assetPath } from "./path-helpers.mjs"
import { assertRouteBuildRecord } from "./route-build-record.mjs"
import { planRouteCapabilities } from "./route-capability-planner.mjs"

export function createRouteArtifactReport(records, {
  base = "",
  handlerMetafile,
  outputDirectory,
  navigationAssets = new Map(),
  workerReferences = [],
  workerOutputs = new Map()
} = {}) {
  for (const record of records) assertRouteBuildRecord(record)
  const handlerGraph = handlerMetafile ? outputGraph(handlerMetafile, outputDirectory, base) : new Map()
  const routes = records.map(record => {
    const capability = planRouteCapabilities([record], { navigationRouteCount: Number(record.capabilities.navigable) })
    const handlerEntries = [...new Set(record.artifacts.handlers.map(reference => reference.module))].sort()
    const handlerOutputs = closure(handlerEntries, handlerGraph, Boolean(handlerMetafile))
    const workers = workerReferences
      .filter(reference => record.artifacts.effects.some(effect => effect.module === reference.module && effect.handler === reference.handler))
      .map(reference => {
        const output = workerOutputs.get(reference.placeholder)
        if (!output) throw new Error(`Worker output was not recorded: ${reference.root}`)
        return { source: reference.root, entry: output.entry, chunks: [...output.chunks].sort() }
      })
      .sort((left, right) => left.source.localeCompare(right.source) || left.entry.localeCompare(right.entry))
    return {
      route: record.route,
      capability: {
        signature: createHash("sha256").update(JSON.stringify(capability)).digest("hex"),
        manifest: capability
      },
      runtime: routeRuntimeEdges(record, capability, base, navigationAssets.get(record.route)),
      handlers: {
        entries: handlerEntries,
        chunks: handlerOutputs.filter(output => !handlerEntries.includes(output))
      },
      workers,
      styles: [...record.artifacts.styles].sort()
    }
  }).sort((left, right) => left.route.localeCompare(right.route))
  const owners = new Map()
  for (const route of routes) {
    for (const path of [...route.handlers.chunks, ...route.workers.flatMap(worker => worker.chunks)]) {
      const paths = owners.get(path) ?? new Set()
      paths.add(route.route)
      owners.set(path, paths)
    }
  }
  return {
    version: 1,
    routes,
    sharedChunks: [...owners].filter(([, routes]) => routes.size > 1).map(([path, routes]) => ({ path, routes: [...routes].sort() })).sort((left, right) => left.path.localeCompare(right.path))
  }
}

function routeRuntimeEdges(record, capability, base, navigationAsset) {
  const entries = Object.values(record.entries).map(path => assetPath(base, `assets/${path}`))
  if (navigationAsset) entries.push(navigationAsset)
  const modules = []
  const add = name => modules.push(assetPath(base, `assets/${name}`))
  if (record.capabilities.hasBehaviors) add(record.capabilities.usesDependencyRuntime ? "kudzu-deps.js" : "kudzu.js")
  if (record.capabilities.hasBindings) add("kudzu-binding.js")
  if (record.capabilities.hasLists) add("kudzu-list.js")
  if (record.capabilities.hasBindings || record.capabilities.hasListStyles) add("kudzu-style.js")
  if (capability.effects.derivedDependencies || capability.lists.selectors) add("kudzu-collection-selector.js")
  if (record.capabilities.hasBindings || capability.events.hasNativeHandlers || capability.effects.captures) add("kudzu-serialization.js")
  if (record.capabilities.hasEffects) add("kudzu-effect.js")
  if (capability.events.hasNativeHandlers) add("kudzu-native.js")
  return { entries: [...new Set(entries)].sort(), requirements: [...new Set(modules)].sort() }
}

function outputGraph(metafile, outputDirectory, base) {
  if (!metafile || typeof metafile !== "object" || !metafile.outputs || typeof metafile.outputs !== "object") throw new Error("Invalid esbuild metafile")
  if (typeof outputDirectory !== "string") throw new Error("Route artifact reporting requires an output directory")
  const paths = new Map()
  for (const output of Object.keys(metafile.outputs)) paths.set(resolve(output), outputUrl(resolve(output), outputDirectory, base))
  const graph = new Map()
  for (const [output, metadata] of Object.entries(metafile.outputs)) {
    const absolute = resolve(output)
    const url = paths.get(absolute)
    const imports = (metadata.imports ?? []).filter(entry => !entry.external).map(entry => paths.get(resolve(entry.path)) ?? paths.get(resolve(dirname(absolute), entry.path))).filter(Boolean)
    graph.set(url, [...new Set(imports)].sort())
  }
  return graph
}

function outputUrl(output, outputDirectory, base) {
  const path = relative(outputDirectory, output)
  if (!path || path === ".." || path.startsWith(`..${sep}`)) throw new Error(`Bundled output is outside the build directory: ${output}`)
  return assetPath(base, path.replaceAll(sep, "/"))
}

function closure(entries, graph, requireEntries) {
  const visited = new Set()
  const visit = output => {
    if (visited.has(output)) return
    if (requireEntries && !graph.has(output)) throw new Error(`Bundled handler entry was not emitted: ${output}`)
    visited.add(output)
    for (const imported of graph.get(output) ?? []) visit(imported)
  }
  for (const entry of entries) visit(entry)
  return [...visited].sort()
}
