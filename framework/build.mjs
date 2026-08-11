import { createHash, randomUUID } from "node:crypto"
import { cp, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { build as bundle, transform } from "esbuild"
import { createEffectCodegen } from "./compiler/effect-codegen.mjs"
import { generateListRuntime } from "./compiler/list-runtime-codegen.mjs"
import { assetPath, browserPath, relativeModulePath, withBase } from "./compiler/path-helpers.mjs"
import { collectClientModules, compileClientModule, compiledPath, compileSource, layoutExportError, orderSourceStyles, reachableSourceFiles, safeStaticFiles } from "./compiler/source-compiler.mjs"
import { createParamCodegen } from "./compiler/param-codegen.mjs"
import { planRouteCapabilities, usesRouteDependencyRuntime } from "./compiler/route-capability-planner.mjs"
import { generateBindingRuntime, generateCoreRuntime, generateEffectRuntime, generateNativeRuntime, generateNavigationRuntime, specializeRuntime } from "./compiler/runtime-codegen.mjs"
import { emitWorkers } from "./compiler/worker-compiler.mjs"
import { renderPage } from "./core.mjs"
import { parseDevHost, parseDevPort, startDevServer } from "./dev-server.mjs"

export { parseDevHost, parseDevPort }
export { specializeRuntime }

const root = process.cwd()
const sourceDirectory = join(root, "src")
const pagesDirectory = join(sourceDirectory, "pages")
const workDirectory = join(root, ".kudzu")
const outputDirectory = join(root, "dist")

async function loadConfig() {
  for (const name of ["kudzu.config.mjs", "kudzu.config.js"]) {
    const file = join(root, name)
    if (!(await exists(file))) continue
    const config = (await import(`${pathToFileURL(file).href}?v=${Date.now()}-${randomUUID()}`)).default ?? {}
    if (!isPlainRecord(config)) throw new Error(`${name} must export a default object`)
    return config
  }
  return {}
}

export async function build({ quiet = false, minify = true } = {}) {
  const stagedOutput = join(root, ".kudzu-dist-staging")
  const backupOutput = join(root, ".kudzu-dist-backup")
  const lockPath = join(root, ".kudzu-build.lock")
  const lock = await acquireBuildLock(lockPath)
  try {
    await recoverOutput(outputDirectory, backupOutput)
    await rm(stagedOutput, { recursive: true, force: true })
    const { result, pageCount, behaviorCount } = await buildInto(stagedOutput, { minify })
    await promoteOutput(stagedOutput, outputDirectory, backupOutput)
    if (!quiet) console.log(`Built ${pageCount} page(s), ${behaviorCount} interactive page(s) into dist/`)
    return result
  } finally {
    try {
      await rm(stagedOutput, { recursive: true, force: true })
    } finally {
      try {
        await lock.close()
      } finally {
        await rm(lockPath, { force: true })
      }
    }
  }
}

async function buildInto(outputDirectory, { minify }) {
  const config = await loadConfig()
  const base = normalizeBase(config.base)
  const configuredStyles = normalizeStyles(config.styles, base)
  const publicDirectory = normalizePublicDirectory(config.publicDir)
  const navigationGroups = normalizeNavigation(config.navigation)
  const navigationRoutes = navigationGroups.flatMap(group => group.routes)
  const navigationByRoute = new Map(navigationGroups.flatMap(group => group.routes.map(route => [route, group])))
  for (const group of navigationGroups) {
    group.assetPath = assetPath(base, `assets/${group.assetName}`)
    group.applicationId = `a-${group.id}`
    group.layoutId = `l-${group.id}`
    group.records = []
    group.routeRecords = []
    group.hasEffects = false
    group.hasParams = false
  }
  await rm(workDirectory, { recursive: true, force: true })
  await mkdir(workDirectory, { recursive: true })
  await mkdir(outputDirectory, { recursive: true })

  const projectFiles = await walk(sourceDirectory)
  const allSourceFiles = projectFiles.filter(file => /\.(?:ts|tsx)$/.test(file) && !file.endsWith(".d.ts")).sort()
  const configuredStyleSources = new Set(configuredStyles.sources.map(style => style.source))
  const discoveredCssFiles = projectFiles.filter(file => file.toLowerCase().endsWith(".css") && !configuredStyleSources.has(file)).sort()
  if (!allSourceFiles.length) throw new Error("No TypeScript files found in src/")
  const allSourceFileSet = new Set(allSourceFiles)
  const sourceIndex = new Map(await Promise.all(allSourceFiles.map(async file => [file, await readFile(file, "utf8")])))
  const pageFiles = allSourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))
  if (!pageFiles.length) throw new Error("No pages found in src/pages/")
  const sourceFiles = reachableSourceFiles(pageFiles, allSourceFileSet, sourceIndex)
  const sourceFileSet = new Set(sourceFiles)
  const staticFiles = await safeStaticFiles(projectFiles)
  const cssFiles = orderSourceStyles(discoveredCssFiles, sourceFiles, sourceIndex, staticFiles)
  const importedAssets = new Set()
  const { cssModules, cssOutputs } = await prepareSourceStyles(cssFiles, staticFiles, importedAssets, base)

  const sourceResults = []
  for (const file of sourceFiles) {
    if (file.endsWith(".worker.ts")) continue
    const result = compileSource(file, sourceFileSet, sourceIndex, staticFiles, cssModules, base)
    for (const asset of result.importedAssets) importedAssets.add(resolve(root, asset))
    const output = resolve(root, result.buildModule.path)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, result.buildModule.code)
    sourceResults.push(result)
  }
  const handlerModules = sourceResults.flatMap(result => result.handlerModule ? [result.handlerModule] : [])
  const workerReferences = sourceResults.flatMap(result => result.moduleIR.effects.flatMap(effect => {
    const handler = result.moduleIR.handlers[effect.setup.handler]
    if (!handler || handler.kind !== "module-export" || handler.role !== "effect") throw new Error(`EffectIR ${effect.slot} has no effect HandlerIR`)
    return effect.workers.map(worker => ({ ...worker, module: assetPath(base, `assets/${result.handlerModule.path}`), handler: handler.exportName }))
  }))

  const plans = []
  const routeCapabilities = new Map()
  const pageEntries = []
  const effectEntries = []
  const nativeEntries = []
  const paramEntries = []
  const routeEntryTransforms = new Map()
  const rewrites = []
  const emittedRoutes = new Set()
  const emittedApplicationRoutes = new Set()
  const emittedNavigationRecords = []
  const renderedHandlerUrls = new Set()
  const styleUrls = [...new Set([
    ...cssFiles.map(file => assetPath(base, `assets/${relative(sourceDirectory, file).replaceAll(sep, "/")}`)),
    ...configuredStyles.urls
  ])]
  const runtimePlaceholder = `/__kudzu_runtime_${randomUUID()}.js`

  for (const pageFile of pageFiles) {
    const compiledFile = compiledPath(pageFile)
    const module = await import(`${pathToFileURL(compiledFile).href}?v=${Date.now()}`)
    if (typeof module.default !== "function") throw new Error(`${relative(root, pageFile)} must export a default component`)
    if (Object.hasOwn(module, "layout") && typeof module.layout !== "function") throw layoutExportError(pageFile, sourceIndex.get(pageFile))

    const runtimeSchema = runtimeRouteSchema(module, pageFile)
    if (runtimeSchema) {
      const conflicting = rewrites.find(rewrite => sameRuntimePrecedence(rewrite, runtimeSchema))
      if (conflicting) throw new Error(`Ambiguous runtime routes: ${conflicting.route} and ${runtimeSchema.route}`)
      rewrites.push({
        route: runtimeSchema.route,
        pattern: withBase(base, `/${runtimeSchema.route}`),
        file: `${runtimeSchema.route}/index.html`,
        params: runtimeSchema.params,
        segments: runtimeSchema.segments
      })
    }
    const entries = runtimeSchema ? [{ params: {}, props: {} }] : await staticPathEntries(module, pageFile)
    for (const { params, props } of entries) {
      const route = runtimeSchema?.route ?? routeFromPage(pageFile, params)
      const applicationRoute = `/${route}`
      const routePath = withBase(base, `/${route}`)
      const metadataContext = { route: routePath, params, props }
      const configuredMetadata = await resolveDocumentMetadata(config.metadata, metadataContext, "kudzu.config metadata")
      const pageMetadata = await resolveDocumentMetadata(module.metadata, metadataContext, `${relative(root, pageFile)} metadata`)
      const navigationGroup = navigationByRoute.get(applicationRoute)
      const navigable = Boolean(navigationGroup)
      const effectPath = `effects/${route ? `${route}/index` : "index"}.js`
      const nativePath = `native/${route ? `${route}/index` : "index"}.js`
      const paramPath = `params/${route ? `${route}/index` : "index"}.js`
      if (emittedRoutes.has(routePath)) throw new Error(`Duplicate route: ${routePath}`)
      emittedRoutes.add(routePath)
      emittedApplicationRoutes.add(applicationRoute)
      const navigationRecord = runtimeSchema
        ? { id: applicationRoute, base: browserPath(base), segments: runtimeSchema.segments.map(segment => segment.literal ?? null) }
        : { id: applicationRoute, path: routePath }
      const routeRecord = { route: applicationRoute, segments: runtimeSchema ? navigationRecord.segments : exactRouteSegments(applicationRoute), record: navigationRecord, group: navigationGroup }
      emittedNavigationRecords.push(routeRecord)
      if (navigable) {
        if (typeof module.layout !== "function") throw new Error(`${navigationGroup.label} emitted route ${JSON.stringify(routePath)} must export a layout function so Kudzu can emit route markers`)
        if (navigationGroup.layoutIdentity && navigationGroup.layoutIdentity !== module.layout) throw new Error(`${navigationGroup.label} routes ${JSON.stringify(navigationGroup.layoutRoute)} and ${JSON.stringify(applicationRoute)} must export the same layout function identity`)
        navigationGroup.layoutIdentity = module.layout
        navigationGroup.layoutRoute ??= applicationRoute
        navigationGroup.records.push(navigationRecord)
        navigationGroup.routeRecords.push(routeRecord)
      }
      const result = await renderPage(module.default, {
        ...configuredMetadata,
        ...pageMetadata,
        styles: styleUrls.length ? styleUrls : false,
        base,
        runtimeAsset: runtimePlaceholder,
        effectAsset: assetPath(base, `assets/${effectPath}`),
        nativeAsset: assetPath(base, `assets/${nativePath}`),
        paramAsset: assetPath(base, `assets/${paramPath}`),
        runtimeParams: runtimeSchema?.params,
        ...(navigable ? { navigationAsset: navigationGroup.assetPath, applicationId: navigationGroup.applicationId, layoutId: navigationGroup.layoutId, routeId: applicationRoute } : {})
      }, props, module.layout)
      const renderedOutput = `${JSON.stringify(result.plan)}\n${result.html}`
      for (const url of result.handlerModules) if (renderedOutput.includes(JSON.stringify(url))) renderedHandlerUrls.add(url)
      if (navigationGroup) {
        navigationGroup.hasEffects ||= result.hasEffects
        navigationGroup.hasParams ||= result.hasParams
      }
      const usesDependencyRuntime = usesRouteDependencyRuntime({ plan: result.plan, navigable, hasBindings: result.hasBindings, hasLists: result.hasLists })
      pageEntries.push({ route, html: result.html, usesDependencyRuntime })
      plans.push({ route: routePath, ...result.plan })
      routeCapabilities.set(routePath, {
        navigable,
        usesDependencyRuntime,
        hasBehaviors: result.hasBehaviors,
        hasBindings: result.hasBindings,
        hasLists: result.hasLists,
        hasListStyles: result.hasListStyles,
        hasStateSeed: result.hasStateSeed
      })
      if (result.hasParams) paramEntries.push({ path: paramPath, schema: runtimeSchema, params: result.plan.params, searchParams: result.plan.searchParams, searchParamsWritable: result.plan.searchParamsWritable, usesDependencyRuntime, navigable })
      if (result.hasEffects) effectEntries.push({ path: effectPath, effects: runtimeEffects(result.plan.effects, navigable), paramPath: result.hasParams ? paramPath : undefined, usesDependencyRuntime, navigable })
      if (result.plan.events.some(event => event.native)) nativeEntries.push({
        path: nativePath,
        modules: [...new Set(result.plan.events.filter(event => event.native).map(event => event.native.module))]
      })
    }
  }

  for (const group of navigationGroups) for (const route of group.routes) if (!emittedApplicationRoutes.has(route)) throw new Error(`${group.label} route ${JSON.stringify(route)} is not an emitted route`)
  rejectNavigationOverlap(navigationGroups)
  for (const group of navigationGroups) {
    const runtimeRecords = group.routeRecords.filter(record => record.record.segments)
    for (const entry of emittedNavigationRecords) if (!entry.group && runtimeRecords.some(record => navigationDomainsOverlap(record, entry))) group.records.push({ ...entry.record, native: true })
    group.records.sort((left, right) => (right.segments?.filter(segment => segment !== null).length ?? 0) - (left.segments?.filter(segment => segment !== null).length ?? 0) || left.id.localeCompare(right.id))
  }

  const assetsDirectory = join(outputDirectory, "assets")
  await mkdir(assetsDirectory, { recursive: true })
  const emittedHandlerModules = handlerModules.filter(module => renderedHandlerUrls.has(assetPath(base, `assets/${module.path}`)))
  const renderedEffects = new Set(plans.flatMap(plan => plan.effects.map(effect => `${effect.module}:${effect.handler}`)))
  const renderedWorkerReferences = workerReferences.filter(reference => renderedEffects.has(`${reference.module}:${reference.handler}`))
  if (renderedWorkerReferences.length && await exists(join(publicDirectory, "assets", "workers"))) throw new Error("public/assets/workers collides with Kudzu's generated Worker asset namespace")
  const workerAssets = await emitWorkers(renderedWorkerReferences, sourceFileSet, assetsDirectory, base, minify)
  for (const module of emittedHandlerModules) {
    for (const reference of workerReferences) {
      if (reference.module !== assetPath(base, `assets/${module.path}`)) continue
      const url = workerAssets.get(reference.placeholder) ?? "about:blank"
      module.code = module.code.replaceAll(JSON.stringify(reference.placeholder), JSON.stringify(url))
    }
    if (module.code.includes("/__kudzu_worker_")) throw new Error(`Worker URL placeholder survived in ${module.path}`)
  }
  const capabilityIR = planRouteCapabilities(plans, { routes: routeCapabilities, navigationRouteCount: navigationRoutes.length })
  const {
    routes: { behaviors: behaviorCount, regularBehaviors: regularBehaviorCount, dependencyStateSeeds: dependencyStateSeedCount },
    events: { command: commandEvents, hasNativeHandlers },
    bindings: { count: bindingCount },
    lists,
    effects: { any: hasEffects, derivedDependencies: hasDerivedEffectDependencies, captures: hasEffectCaptures },
    captures: { nestedState: hasNestedStateCaptures, setter: hasSetterCaptures },
    runtime: { shared: hasSharedRuntime, dependency: hasDependencyRuntime }
  } = capabilityIR
  const runtimeName = usesDependencyRuntime => usesDependencyRuntime ? "kudzu-deps.js" : "kudzu.js"
  for (let offset = 0; offset < pageEntries.length; offset += 64) {
    await Promise.all(pageEntries.slice(offset, offset + 64).map(async entry => {
      const routeDirectory = join(outputDirectory, entry.route)
      await mkdir(routeDirectory, { recursive: true })
      const html = preloadModules(entry.html.replace(runtimePlaceholder, escapeAttribute(assetPath(base, `assets/${runtimeName(entry.usesDependencyRuntime)}`))))
      await writeFile(join(routeDirectory, "index.html"), html)
    }))
  }
  if (navigationRoutes.length || behaviorCount && (hasSharedRuntime || regularBehaviorCount)) {
    const runtimeFile = hasSharedRuntime ? "./shared-runtime.js" : "./runtime.js"
    const runtime = generateCoreRuntime(await readFile(new URL(runtimeFile, import.meta.url), "utf8"), capabilityIR)
    await writeJavaScript(join(assetsDirectory, "kudzu.js"), runtime, minify)
  }
  if (hasDependencyRuntime) {
    const runtime = specializeRuntime(await readFile(new URL("./dependency-runtime.js", import.meta.url), "utf8"), commandEvents, dependencyStateSeedCount > 0)
    await writeJavaScript(join(assetsDirectory, "kudzu-deps.js"), runtime, minify)
  }
  if (bindingCount || hasNativeHandlers || hasEffectCaptures) await writeJavaScript(join(assetsDirectory, "kudzu-serialization.js"), await readFile(new URL("./serialization.js", import.meta.url), "utf8"), minify, {
    "globalThis.__KUDZU_CAPTURE_STATE__": String(hasNestedStateCaptures),
    "globalThis.__KUDZU_CAPTURE_SETTER__": String(hasSetterCaptures)
  })
  if (hasEffects) {
    const generated = generateEffectRuntime(await readFile(new URL("./effect-runtime.js", import.meta.url), "utf8"), capabilityIR)
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-effect.js"), generated.source, minify, generated.define)
  }
  if (bindingCount || lists.styleCount) await writeJavaScript(join(assetsDirectory, "kudzu-style.js"), await readFile(new URL("./style.js", import.meta.url), "utf8"), minify)
  if (bindingCount) {
    const generated = generateBindingRuntime(await readFile(new URL("./binding-runtime.js", import.meta.url), "utf8"), capabilityIR, navigationRoutes.length > 0)
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-binding.js"), generated.source, minify, generated.define)
  }
  if (hasDerivedEffectDependencies) await writeJavaScript(join(assetsDirectory, "kudzu-collection-selector.js"), await readFile(new URL("./collection-selector.js", import.meta.url), "utf8"), minify)
  if (lists.count) {
    if (lists.selectors && !hasDerivedEffectDependencies) await writeJavaScript(join(assetsDirectory, "kudzu-collection-selector.js"), await readFile(new URL("./collection-selector.js", import.meta.url), "utf8"), minify)
    const generated = generateListRuntime(await readFile(new URL("./list-runtime.js", import.meta.url), "utf8"), capabilityIR)
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-list.js"), generated.source, minify, generated.define)
    if (lists.selectors && !hasDerivedEffectDependencies) await rm(join(assetsDirectory, "kudzu-collection-selector.js"))
  }
  if (hasNativeHandlers) {
    const generated = generateNativeRuntime(await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"), capabilityIR)
    await writeJavaScript(join(assetsDirectory, "kudzu-native.js"), generated.source, minify, generated.define)
    for (const entry of nativeEntries) await printNativeEntry(entry, assetsDirectory, base, minify, routeEntryTransforms)
  }
  if (navigationGroups.length) {
    const navigationSource = await readFile(new URL("./navigation-runtime.js", import.meta.url), "utf8")
    for (const group of navigationGroups) {
      await writeJavaScript(join(assetsDirectory, group.assetName), generateNavigationRuntime(navigationSource, group), minify)
    }
  }
  for (const handlerModule of emittedHandlerModules) {
    const output = join(assetsDirectory, handlerModule.path)
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeJavaScript(output, handlerModule.code, minify)
  }
  for (const entry of paramEntries) {
    const output = join(assetsDirectory, entry.path)
    await mkdir(dirname(output), { recursive: true })
    await writeRouteEntry(output, printParamEntry(entry.schema, entry.params, entry.searchParams, entry.searchParamsWritable, output, assetsDirectory, base, runtimeName(entry.usesDependencyRuntime), entry.navigable), minify, routeEntryTransforms)
  }
  for (const entry of effectEntries) {
    const output = join(assetsDirectory, entry.path)
    await mkdir(dirname(output), { recursive: true })
    await writeRouteEntry(output, printEffectEntry(entry.effects, output, emittedHandlerModules, assetsDirectory, base, entry.paramPath, runtimeName(entry.usesDependencyRuntime), entry.navigable), minify, routeEntryTransforms)
  }
  const clientModules = await collectClientModules(emittedHandlerModules.flatMap(module => module.clientImports).map(file => resolve(root, file)), sourceFileSet)
  for (const file of clientModules) {
    const module = await compileClientModule(file, sourceFileSet, staticFiles, cssModules, base)
    for (const asset of module.importedAssets) importedAssets.add(resolve(root, asset))
    const output = join(assetsDirectory, module.path)
    await mkdir(dirname(output), { recursive: true })
    await writeJavaScript(output, module.code, minify)
  }
  if (clientModules.length || emittedHandlerModules.some(module => module.hasPackageImports)) {
    await bundle({
      entryPoints: emittedHandlerModules.map(module => join(assetsDirectory, module.path)),
      outbase: join(assetsDirectory, "handlers"),
      outdir: join(assetsDirectory, "handlers"),
      entryNames: "[dir]/[name]",
      chunkNames: "chunks/[name]-[hash]",
      allowOverwrite: true,
      bundle: true,
      splitting: true,
      format: "esm",
      target: "es2022",
      minify,
      legalComments: "none",
      logLevel: "silent"
    })
    await rm(join(assetsDirectory, "modules"), { recursive: true, force: true })
  }
  const sortedRewrites = rewrites.sort((left, right) => runtimeSpecificity(right) - runtimeSpecificity(left) || left.pattern.localeCompare(right.pattern))
  await writeFile(join(workDirectory, "kudzu-plan.json"), JSON.stringify({ routes: plans, rewrites: sortedRewrites }, null, 2))
  for (const file of cssFiles) {
    const output = join(assetsDirectory, relative(sourceDirectory, file))
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, cssOutputs.get(file))
  }
  for (const file of [...importedAssets].sort()) {
    if (cssOutputs.has(file)) continue
    const output = join(assetsDirectory, relative(sourceDirectory, file))
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, await readFile(file))
  }
  for (const style of configuredStyles.sources) {
    let css = await readFile(style.source, "utf8")
    if (style.transform) {
      const result = await style.transform(css, { source: style.source, output: style.output })
      css = typeof result === "string" ? result : result?.css
      if (typeof css !== "string") throw new Error(`${style.label}.transform must return CSS text or an object with a css string`)
    }
    const output = join(outputDirectory, style.output.slice(1))
    if (await exists(output)) throw new Error(`${style.label}.output ${JSON.stringify(style.output)} collides with a generated artifact`)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, css)
  }
  if (await exists(publicDirectory)) {
    await copyPublic(publicDirectory, outputDirectory)
  }
  if (config.afterBuild !== undefined) {
    if (typeof config.afterBuild !== "function") throw new Error("kudzu.config afterBuild must be a function")
    await config.afterBuild({ root, outDir: outputDirectory, sourceDir: sourceDirectory, base, routes: plans.map(plan => plan.route), plans, rewrites: sortedRewrites })
  }

  return { result: { sourceResults }, pageCount: plans.length, behaviorCount }
}

async function acquireBuildLock(lockPath) {
  let lock
  try {
    lock = await open(lockPath, "wx")
  } catch (error) {
    if (error?.code !== "EEXIST") throw error
  }
  if (lock) {
    try {
      await lock.writeFile(String(process.pid))
      return lock
    } catch (error) {
      await lock.close()
      await rm(lockPath, { force: true })
      throw error
    }
  }
  const owner = Number(await readFile(lockPath, "utf8").catch(() => ""))
  if (Number.isInteger(owner) && owner > 0) {
    let active = true
    try {
      process.kill(owner, 0)
    } catch (error) {
      if (error?.code === "ESRCH") active = false
      else throw error
    }
    if (active) throw new Error(`Another Kudzu build is already running for ${root} (PID ${owner})`)
    throw new Error(`A stale Kudzu build lock for PID ${owner} exists at ${lockPath}; remove it before building`)
  }
  throw new Error(`An invalid Kudzu build lock exists at ${lockPath}; remove it before building`)
}

async function recoverOutput(finalOutput, backupOutput) {
  if (!await exists(backupOutput)) return
  if (await exists(finalOutput)) await rm(backupOutput, { recursive: true, force: true })
  else await rename(backupOutput, finalOutput)
}

async function promoteOutput(stagedOutput, finalOutput, backup) {
  const previous = await exists(finalOutput)
  if (previous) await rename(finalOutput, backup)
  try {
    await rename(stagedOutput, finalOutput)
  } catch (error) {
    if (previous) {
      try {
        await rename(backup, finalOutput)
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], "Kudzu output promotion and rollback both failed")
      }
    }
    throw error
  }
  if (previous) await rm(backup, { recursive: true, force: true }).catch(error => console.warn(`Built output was promoted, but ${backup} could not be removed and will be retried on the next build: ${error.message}`))
}

async function copyPublic(sourceDirectory, destinationDirectory, destinationRoot = destinationDirectory) {
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const source = join(sourceDirectory, entry.name)
    const destination = join(destinationDirectory, entry.name)
    let generated
    try {
      generated = await stat(destination)
    } catch (error) {
      if (error?.code !== "ENOENT") throw error
    }
    if (!generated) {
      await cp(source, destination, { recursive: entry.isDirectory(), force: false, errorOnExist: true })
    } else if (entry.isDirectory() && generated.isDirectory()) {
      await copyPublic(source, destination, destinationRoot)
    } else {
      throw new Error(`${relative(root, source)} collides with generated output ${relative(destinationRoot, destination).replaceAll(sep, "/")}`)
    }
  }
}

function preloadModules(html) {
  const scripts = [...html.matchAll(/<script type="module"[^>]* src="([^"]+)"[^>]*><\/script>/g)]
  if (!scripts.length) return html
  const links = [...new Set(scripts.map(match => match[1]))].map(href => `<link rel="modulepreload" href="${href}">`).join("")
  return html.replace(scripts[0][0], `${links}${scripts[0][0]}`)
}

async function printNativeEntry(entry, assetsDirectory, base, minify, transforms) {
  const output = join(assetsDirectory, entry.path)
  await mkdir(dirname(output), { recursive: true })
  const imports = entry.modules.map((module, index) => `import * as __kNativeModule${index} from ${JSON.stringify(module)}`).join("\n")
  const registrations = entry.modules.map((module, index) => `[${JSON.stringify(module)}, __kNativeModule${index}]`).join(",")
  const runtime = assetPath(base, "assets/kudzu-native.js")
  await writeRouteEntry(output, `import { registerNativeModules } from ${JSON.stringify(runtime)}\n${imports}\nregisterNativeModules([${registrations}])`, minify, transforms)
}

function runtimeEffects(effects, lifetimes = false) {
  return effects.map(effect => ({
    module: effect.module,
    handler: effect.handler,
    ...(effect.dependencies ? { dependencies: effect.dependencies } : {}),
    ...(effect.dependencyExpressions ? { dependencyExpressions: effect.dependencyExpressions, dependencyStates: effect.dependencyStates } : {}),
    ...(effect.itemDependencies ? { itemDependencies: effect.itemDependencies, listState: effect.listState } : {}),
    ...(effect.cleanup ? { cleanup: true } : {}),
    ...(effect.owner ? { owner: effect.owner } : {}),
    ...(effect.list ? { list: true } : {}),
    ...(lifetimes && effect.lifetime ? { lifetime: effect.lifetime } : {}),
    states: effect.states,
    scope: effect.scope
  }))
}

async function writeJavaScript(file, source, minify, define) {
  const code = minify || define ? (await transform(source, { define, format: "esm", legalComments: "none", minify, target: "es2022" })).code : source
  await writeFile(file, code)
}

export async function writeRouteEntry(file, source, minify, transforms, transformSource = transform, write = writeFile) {
  let code = transforms.get(source)
  if (code === undefined) {
    code = minify ? (await transformSource(source, { format: "esm", legalComments: "none", minify, target: "es2022" })).code : source
    transforms.set(source, code)
  }
  await write(file, code)
}

async function writeBundledJavaScript(file, source, minify, define) {
  const result = await bundle({
    stdin: { contents: source, resolveDir: dirname(file), sourcefile: file },
    bundle: true,
    write: false,
    external: ["./kudzu.js", "./kudzu-binding.js", "./kudzu-serialization.js", "./kudzu-style.js"],
    define,
    format: "esm",
    target: "es2022",
    minify,
    legalComments: "none",
    logLevel: "silent"
  })
  await writeFile(file, result.outputFiles[0].contents)
}

export async function dev({ port = parseDevPort(process.env.PORT), host = parseDevHost(process.env.HOST) } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid dev server port: ${port}`)
  if (typeof host !== "string" || !host.trim()) throw new Error(`Invalid dev server host: ${host}`)
  const base = normalizeBase((await loadConfig()).base)
  return startDevServer({ build, port, host, base, sourceDirectory, workDirectory, outputDirectory })
}

function inlineJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029")
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;")
}

async function prepareSourceStyles(cssFiles, staticFiles, importedAssets, base) {
  const cssModules = new Map()
  const cssOutputs = new Map()
  for (const file of cssFiles) {
    let css = rewriteCssUrls(await readFile(file, "utf8"), file, staticFiles, importedAssets, base)
    if (file.toLowerCase().endsWith(".module.css")) {
      if (/\bcomposes\s*:/i.test(maskCssCommentsAndStrings(css))) throw new Error(`${relative(root, file)} CSS Modules composes is not supported`)
      const prefix = `k${createHash("sha256").update(relative(sourceDirectory, file).replaceAll(sep, "/")).digest("hex").slice(0, 8)}`
      css = (await transform(css, { loader: "local-css", sourcefile: `${prefix}.css`, target: "es2022" })).code
      const classes = {}
      for (const match of css.matchAll(new RegExp(`\\.${prefix}_([_a-zA-Z][_a-zA-Z0-9-]*)`, "g"))) classes[match[1]] = match[0].slice(1)
      cssModules.set(file, classes)
    }
    cssOutputs.set(file, css)
  }
  return { cssModules, cssOutputs }
}

function rewriteCssUrls(css, file, staticFiles, importedAssets, base) {
  let output = ""
  let cursor = 0
  let index = 0
  while (index < css.length) {
    if (css.startsWith("/*", index)) {
      index = css.indexOf("*/", index + 2)
      index = index === -1 ? css.length : index + 2
      continue
    }
    if (css[index] === '"' || css[index] === "'") {
      index = cssStringEnd(css, index)
      continue
    }
    if (css.slice(index, index + 3).toLowerCase() !== "url" || /[-_a-z\d]/i.test(css[index - 1] ?? "")) {
      index++
      continue
    }
    let open = index + 3
    while (/\s/.test(css[open] ?? "")) open++
    if (css[open] !== "(") {
      index++
      continue
    }
    let start = open + 1
    while (/\s/.test(css[start] ?? "")) start++
    const quote = css[start] === '"' || css[start] === "'" ? css[start] : ""
    const valueStart = quote ? start + 1 : start
    let end = valueStart
    if (quote) {
      end = cssStringEnd(css, start) - 1
      if (css[end] !== quote) {
        index = open + 1
        continue
      }
    } else {
      while (end < css.length && css[end] !== ")") end += css[end] === "\\" ? 2 : 1
    }
    let close = quote ? end + 1 : end
    while (/\s/.test(css[close] ?? "")) close++
    if (css[close] !== ")") {
      index = open + 1
      continue
    }
    const value = css.slice(valueStart, end).trim()
    const replacement = rewriteCssUrl(value, quote, file, staticFiles, importedAssets, base)
    output += css.slice(cursor, index) + (replacement ?? css.slice(index, close + 1))
    cursor = close + 1
    index = close + 1
  }
  return output + css.slice(cursor)
}

function rewriteCssUrl(value, quote, file, staticFiles, importedAssets, base) {
  if (!value || value.startsWith("/") || value.startsWith("#") || value.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(value)) return undefined
  const split = value.search(/[?#]/)
  const pathname = split === -1 ? value : value.slice(0, split)
  const suffix = split === -1 ? "" : value.slice(split)
  const target = resolve(dirname(file), pathname)
  if (!staticFiles.has(target)) throw new Error(`${relative(root, file)} CSS URL ${JSON.stringify(value)} must resolve to an existing regular file under src/`)
  importedAssets.add(target)
  const url = assetPath(base, `assets/${relative(sourceDirectory, target).replaceAll(sep, "/")}`)
  return `url(${quote || '"'}${url}${suffix}${quote || '"'})`
}

function cssStringEnd(css, start) {
  const quote = css[start]
  let index = start + 1
  while (index < css.length) {
    if (css[index] === "\\") index += 2
    else if (css[index++] === quote) break
    else if (css[index - 1] === "\n") break
  }
  return index
}

function maskCssCommentsAndStrings(css) {
  const masked = [...css]
  let index = 0
  while (index < css.length) {
    let end
    if (css.startsWith("/*", index)) {
      const close = css.indexOf("*/", index + 2)
      end = close === -1 ? css.length : close + 2
    } else if (css[index] === '"' || css[index] === "'") {
      end = cssStringEnd(css, index)
    } else {
      index++
      continue
    }
    for (; index < end; index++) if (masked[index] !== "\n") masked[index] = " "
  }
  return masked.join("")
}

function normalizeStyles(value, base) {
  if (value === undefined) return { urls: [], sources: [] }
  if (!Array.isArray(value)) throw new Error("kudzu.config styles must be an array")
  const urls = []
  const sources = []
  const outputs = new Set()
  for (let index = 0; index < value.length; index++) {
    const style = value[index]
    const label = `kudzu.config styles[${index}]`
    if (typeof style === "string") {
      if (!style) throw new Error(`${label} must be a non-empty URL`)
      if (style.startsWith("//")) throw new Error(`${label} must be root-relative or an absolute HTTP URL`)
      if (style.startsWith("/")) {
        urls.push(withBase(base, style))
        continue
      }
      if (!/^https?:\/\//i.test(style)) throw new Error(`${label} must be root-relative or an absolute HTTP URL`)
      try { new URL(style) } catch { throw new Error(`${label} must be root-relative or an absolute HTTP URL`) }
      urls.push(style)
      continue
    }
    if (!isPlainRecord(style) || Object.keys(style).some(key => !["source", "output", "transform"].includes(key))) throw new Error(`${label} must be a URL or a source style object`)
    if (typeof style.source !== "string" || !style.source) throw new Error(`${label}.source must be a non-empty file path`)
    if (typeof style.output !== "string" || !style.output.startsWith("/") || style.output.startsWith("//") || /[%?#\\\0]/.test(style.output) || style.output.split("/").includes("..") || !style.output.endsWith(".css")) throw new Error(`${label}.output must be a root-relative .css path without query, hash, or traversal`)
    if (style.transform !== undefined && typeof style.transform !== "function") throw new Error(`${label}.transform must be a function`)
    if (outputs.has(style.output)) throw new Error(`${label}.output duplicates another configured style output ${JSON.stringify(style.output)}`)
    outputs.add(style.output)
    const entry = { label, source: resolve(root, style.source), output: style.output, transform: style.transform }
    sources.push(entry)
    urls.push(withBase(base, style.output))
  }
  return { urls, sources }
}

function normalizePublicDirectory(value) {
  if (value === undefined) return join(root, "public")
  if (typeof value !== "string" || !value) throw new Error("kudzu.config publicDir must be a non-empty directory path")
  const directory = resolve(root, value)
  if (directory === outputDirectory || directory === workDirectory) throw new Error("kudzu.config publicDir cannot be dist or .kudzu")
  return directory
}

async function resolveDocumentMetadata(value, context, label) {
  if (value === undefined) return {}
  const metadata = typeof value === "function" ? await value(context) : value
  if (!isPlainRecord(metadata)) throw new Error(`${label} must be a plain object or a function returning one`)
  return metadata
}

export function normalizeNavigation(value) {
  if (value === undefined) return []
  if (!isPlainRecord(value)) throw new Error("kudzu.config navigation must be a plain object")
  if (Object.keys(value).some(key => !["routes", "groups"].includes(key))) throw new Error("kudzu.config navigation only supports routes or groups")
  if ((value.routes === undefined) === (value.groups === undefined)) throw new Error("kudzu.config navigation must define exactly one of routes or groups")
  const inputs = value.routes === undefined ? value.groups : [{ routes: value.routes }]
  if (!Array.isArray(inputs) || !inputs.length) throw new Error("kudzu.config navigation.groups must be a nonempty array")
  const groups = inputs.map((group, groupIndex) => {
    const label = value.routes === undefined ? `kudzu.config navigation.groups[${groupIndex}]` : "kudzu.config navigation"
    if (!isPlainRecord(group)) throw new Error(`${label} must be a plain object`)
    if (Object.keys(group).some(key => key !== "routes")) throw new Error(`${label} only supports routes`)
    if (!Array.isArray(group.routes) || !group.routes.length) throw new Error(`${label}.routes must be a nonempty array`)
    const routes = normalizeNavigationRoutes(group.routes, `${label}.routes`)
    const id = createHash("sha256").update(JSON.stringify([...routes].sort())).digest("hex").slice(0, 16)
    return { label, index: groupIndex, routes, routeSet: new Set(routes), id, assetName: value.routes === undefined ? `kudzu-navigation-${id}.js` : "kudzu-navigation.js" }
  })
  const identities = groups.flatMap(group => group.routes.map(route => [route, group.label]))
  const seenRoutes = new Map()
  for (const [route, label] of identities) {
    if (seenRoutes.has(route)) throw new Error(`${label} route ${JSON.stringify(route)} duplicates ${seenRoutes.get(route)}`)
    seenRoutes.set(route, label)
  }
  const seenAssets = new Map()
  for (const group of groups) {
    if (seenAssets.has(group.assetName)) throw new Error(`${group.label} navigation hash/asset collision with ${seenAssets.get(group.assetName)}`)
    seenAssets.set(group.assetName, group.label)
  }
  return groups
}

function normalizeNavigationRoutes(values, label) {
  const routes = values.map((route, index) => {
    if (typeof route !== "string" || !route.startsWith("/") || route.startsWith("//") || /[?#\\\0]/.test(route) || /%(?:2f|5c)/i.test(route)) throw new Error(`${label}[${index}] must be a root-relative path without query, hash, or traversal`)
    let decoded
    try { decoded = decodeURIComponent(route) } catch { throw new Error(`${label}[${index}] must be a root-relative path without query, hash, or traversal`) }
    if (decoded.split("/").includes("..") || /[?#\\\0]/.test(decoded)) throw new Error(`${label}[${index}] must be a root-relative path without query, hash, or traversal`)
    return route
  })
  if (new Set(routes).size !== routes.length) throw new Error(`${label} must contain unique paths`)
  return routes
}

function exactRouteSegments(route) {
  return route.slice(1).split("/").map(segment => decodeURIComponent(segment))
}

function rejectNavigationOverlap(groups) {
  for (let leftIndex = 0; leftIndex < groups.length; leftIndex++) for (let rightIndex = leftIndex + 1; rightIndex < groups.length; rightIndex++) {
    const leftGroup = groups[leftIndex]
    const rightGroup = groups[rightIndex]
    for (const left of leftGroup.routeRecords) for (const right of rightGroup.routeRecords) {
      if (!navigationDomainsOverlap(left, right)) continue
      throw new Error(`Navigation path domains overlap between ${leftGroup.label} route ${JSON.stringify(left.route)} and ${rightGroup.label} route ${JSON.stringify(right.route)}`)
    }
  }
}

function navigationDomainsOverlap(left, right) {
  return left.segments.length === right.segments.length && left.segments.every((segment, index) => segment === null || right.segments[index] === null || segment === right.segments[index])
}

function normalizeBase(value) {
  if (value == null || value === "" || value === "/") return ""
  if (typeof value !== "string" || !value.startsWith("/") || /[?#\0]/.test(value) || /%(?:2f|5c)/i.test(value)) throw new Error("kudzu.config base must be a root-relative path")
  let decoded
  try { decoded = decodeURIComponent(value) } catch { throw new Error("kudzu.config base must be a root-relative path") }
  if (/[\\?#\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw new Error("kudzu.config base must be a root-relative path")
  return value.replace(/\/+$/, "")
}




const printEffectEntry = createEffectCodegen({ assetPath, inlineJson, relativeModulePath })
const printParamEntry = createParamCodegen({ browserPath, inlineJson, relativeModulePath })

async function staticPathEntries(module, file) {
  if (typeof module.getStaticPaths !== "function") return [{ params: {}, props: {} }]
  const entries = await module.getStaticPaths()
  if (!Array.isArray(entries)) throw new Error(`${relative(root, file)} getStaticPaths() must return an array`)
  return entries.map((entry, index) => {
    if (!isPlainRecord(entry)) throw new Error(`${relative(root, file)} getStaticPaths()[${index}] must be an object`)
    const params = entry.params ?? {}
    const props = entry.props ?? {}
    if (!isPlainRecord(params)) throw new Error(`${relative(root, file)} getStaticPaths()[${index}].params must be an object`)
    if (!isPlainRecord(props)) throw new Error(`${relative(root, file)} getStaticPaths()[${index}].props must be an object`)
    return { params, props }
  })
}

function runtimeRouteSchema(module, file) {
  if (!Object.hasOwn(module, "runtimeParams")) return undefined
  if (module.runtimeParams !== true) throw new Error(`${relative(root, file)} runtimeParams must be exactly true`)
  if (typeof module.getStaticPaths === "function") throw new Error(`${relative(root, file)} runtimeParams cannot be combined with getStaticPaths()`)
  const route = pageRoutePattern(file)
  if (route.includes("[...")) throw new Error(`Catch-all routes are not supported: ${route}`)
  const names = new Set()
  const segments = route.split("/").map(segment => {
    const match = segment.match(/^\[([^\]]+)\]$/)
    if (!match) {
      if (/[\[\]]/.test(segment)) throw new Error(`${relative(root, file)} runtime parameters must occupy a complete path segment`)
      return { literal: segment }
    }
    const name = match[1]
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) || ["__proto__", "constructor", "prototype"].includes(name)) throw new Error(`${relative(root, file)} invalid runtime parameter name ${JSON.stringify(name)}`)
    if (names.has(name)) throw new Error(`${relative(root, file)} duplicate runtime parameter ${JSON.stringify(name)}`)
    names.add(name)
    return { param: name }
  })
  if (!names.size) throw new Error(`${relative(root, file)} runtimeParams requires a bracket page`)
  return { route, segments, params: [...names] }
}

function pageRoutePattern(file) {
  const page = relative(pagesDirectory, file).replace(/\\/g, "/").replace(/\.tsx$/, "")
  return page === "index" ? "" : page.replace(/\/index$/, "")
}

function runtimeSpecificity(schema) {
  return schema.segments.filter(segment => segment.literal !== undefined).length
}

function sameRuntimePrecedence(left, right) {
  if (left.segments.length !== right.segments.length || runtimeSpecificity(left) !== runtimeSpecificity(right)) return false
  return left.segments.every((segment, index) => segment.literal === undefined || right.segments[index].literal === undefined || segment.literal === right.segments[index].literal)
}

function routeFromPage(file, params = {}) {
  const page = relative(pagesDirectory, file).replace(/\\/g, "/").replace(/\.tsx$/, "")
  if (page.includes("[...")) throw new Error(`Catch-all routes are not supported: ${page}`)
  const filled = page.replace(/\[([^\]]+)\]/g, (_, name) => {
    if (!Object.hasOwn(params, name)) throw new Error(`Missing param "${name}" for route ${page}`)
    const value = String(params[name])
    if (!value || value === "." || value === ".." || /[\\/\0?#]/.test(value)) throw new Error(`Invalid param "${name}" for route ${page}`)
    return value
  })
  return filled === "index" ? "" : filled.replace(/\/index$/, "")
}

function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

async function walk(directory) {
  const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))
  const files = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : path
  }))
  return files.flat()
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
