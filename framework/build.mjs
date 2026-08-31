import { createHash, randomUUID } from "node:crypto"
import { cp, mkdir, open, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { build as bundle, transform } from "esbuild"
import { createEffectCodegen } from "./compiler/effect-codegen.mjs"
import { createCompatibilityReport } from "./compiler/compatibility-registry.mjs"
import { normalizeDiagnosticError } from "./compiler/diagnostics.mjs"
import { generateListRuntime } from "./compiler/list-runtime-codegen.mjs"
import { assetPath, browserPath, relativeModulePath, withBase } from "./compiler/path-helpers.mjs"
import { createProjectSession } from "./compiler/project-session.mjs"
import { createRouteBuildRecord, planRouteArtifacts, releaseRouteBuildRecordPlan } from "./compiler/route-build-record.mjs"
import { createRouteArtifactReport } from "./compiler/route-artifact-report.mjs"
import { planRuntimeFamilies } from "./compiler/runtime-family-planner.mjs"
import { createSourceCompiler } from "./compiler/source-compiler.mjs"
import { createParamCodegen } from "./compiler/param-codegen.mjs"
import { usesRouteDependencyRuntime } from "./compiler/route-capability-planner.mjs"
import { generateBindingRuntime, generateCoreRuntime, generateEffectRuntime, generateNativeRuntime, generateNavigationRuntime, specializeRuntime } from "./compiler/runtime-codegen.mjs"
import { renderPage } from "./core.mjs"
import { parseDevHost, parseDevPort, startDevServer } from "./dev-server.mjs"

export { parseDevHost, parseDevPort }
export { specializeRuntime }

async function loadConfig(root) {
  for (const name of ["kudzu.config.mjs", "kudzu.config.js"]) {
    const file = join(root, name)
    if (!(await exists(file))) continue
    const config = (await import(`${pathToFileURL(file).href}?v=${Date.now()}-${randomUUID()}`)).default ?? {}
    if (!isPlainRecord(config)) throw new Error(`${name} must export a default object`)
    return config
  }
  return {}
}

export async function build({ quiet = false, minify = true, root: projectRoot = process.cwd() } = {}) {
  const project = createProjectSession(projectRoot)
  return buildWithSession(project, { quiet, minify, retainCache: false })
}

export async function buildWithSession(project, { changedFiles, quiet = false, minify = true, retainCache = true } = {}) {
  const { root, outputDirectory } = project
  const stagedOutput = join(root, ".kudzu-dist-staging")
  const backupOutput = join(root, ".kudzu-dist-backup")
  const lockPath = join(root, ".kudzu-build.lock")
  const lock = await acquireBuildLock(lockPath)
  try {
    await recoverOutput(outputDirectory, backupOutput)
    await rm(stagedOutput, { recursive: true, force: true })
    const { result, pageCount, behaviorCount, cache } = await buildInto(project, stagedOutput, { changedFiles, minify, quiet, retainCache })
    await promoteOutput(stagedOutput, outputDirectory, backupOutput)
    project.buildCache = retainCache ? cache : undefined
    if (!quiet) console.log(`Built ${pageCount} page(s), ${behaviorCount} interactive page(s) into dist/`)
    return result
  } catch (error) {
    throw normalizeDiagnosticError(error, root)
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

async function buildInto(project, outputDirectory, { changedFiles, minify, quiet, retainCache }) {
  const { root, sourceDirectory, pagesDirectory, workDirectory } = project
  const previous = retainCache ? project.buildCache : undefined
  project.buildGeneration = (project.buildGeneration ?? 0) + 1
  project.buildDirectory = project.buildGeneration > 1 ? join(workDirectory, "build", String(project.buildGeneration)) : workDirectory
  const { collectClientModules, compileClientModule, compiledPath, compileSourceAsync, layoutExportError, orderSourceStyles, reachableSourceFiles, safeStaticFiles } = createSourceCompiler(project)
  const config = await loadConfig(root)
  const base = normalizeBase(config.base)
  const configuredStyles = normalizeStyles(config.styles, base, project)
  const globalStyleUrls = [...new Set(configuredStyles.urls)]
  const globalStyleUrlSet = new Set(globalStyleUrls)
  const publicDirectory = normalizePublicDirectory(config.publicDir, project)
  const navigationGroups = normalizeNavigation(config.navigation)
  const navigationByRoute = new Map(navigationGroups.flatMap(group => group.routes.map(route => [route, group])))
  for (const group of navigationGroups) {
    group.assetPath = assetPath(base, `assets/${group.assetName}`)
    group.applicationId = `a-${group.id}`
    group.layoutId = `l-${group.id}`
    group.records = []
    group.routeRecords = []
    group.buildRecords = []
    group.hasEffects = false
    group.hasParams = false
  }
  await rm(workDirectory, { recursive: true, force: true })
  await mkdir(workDirectory, { recursive: true })
  await mkdir(outputDirectory, { recursive: true })

  const projectFiles = await walk(sourceDirectory)
  const allSourceFiles = projectFiles.filter(file => /\.(?:ts|tsx)$/.test(file) && !file.endsWith(".d.ts")).sort()
  const configuredStyleSources = new Set(configuredStyles.sources.map(style => style.source))
  if (!allSourceFiles.length) throw new Error("No TypeScript files found in src/")
  const allSourceFileSet = new Set(allSourceFiles)
  const sourceIndex = project.sourceIndex
  for (const file of sourceIndex.keys()) if (file.startsWith(`${sourceDirectory}${sep}`) && !allSourceFileSet.has(file)) sourceIndex.delete(file)
  for (const [file, source] of await Promise.all(allSourceFiles.map(async file => [file, await readFile(file, "utf8")]))) sourceIndex.set(file, source)
  const pageFiles = allSourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))
  if (!pageFiles.length) throw new Error("No pages found in src/pages/")
  const pageSources = new Map(pageFiles.map(file => [file, new Set(reachableSourceFiles([file], allSourceFileSet, sourceIndex))]))
  const sourceFiles = [...new Set([...pageSources.values()].flatMap(files => [...files]))].sort()
  await writePrettyJson(join(workDirectory, "kudzu-compatibility.json"), createCompatibilityReport(sourceFiles.map(file => ({ file: relative(root, file).replaceAll(sep, "/"), source: sourceIndex.get(file) }))))
  const sourceFileSet = project.sourceFiles
  sourceFileSet.clear()
  for (const file of sourceFiles) sourceFileSet.add(file)
  const staticFiles = await safeStaticFiles(projectFiles)
  const stylesByPage = new Map(pageFiles.map(file => [file, orderSourceStyles([file], sourceFiles, sourceIndex, staticFiles).filter(style => !configuredStyleSources.has(style))]))
  const explicitSourceStyles = new Set([...stylesByPage.values()].flat())
  const legacyStyles = configuredStyles.sources.length || configuredStyles.urls.length || explicitSourceStyles.size
    ? []
    : [...staticFiles].filter(file => file.toLowerCase().endsWith(".css")).sort()
  if (legacyStyles.length) {
    for (const file of pageFiles) stylesByPage.set(file, legacyStyles)
    if (!quiet) console.warn("Kudzu: no route imports CSS and kudzu.config styles is empty; applying the legacy global CSS fallback. Import CSS from reachable source or declare config.styles for route-aware output.")
  }
  const cssFiles = [...new Set([...stylesByPage.values()].flat())]
  const importedAssets = new Set()
  const { cssModules, cssOutputs } = await prepareSourceStyles(cssFiles, staticFiles, importedAssets, base, project)

  const affectedPages = affectedPageFiles({ changedFiles, pageFiles, pageSources, previous, sourceDirectory })
  expandAffectedNavigationGroups(affectedPages, previous?.pageRenders, navigationGroups)
  const affectedSources = new Set([...affectedPages].flatMap(file => [...pageSources.get(file)]))
  const sourceResults = []
  const sourceResultsByFile = new Map()
  let compiledModules = 0
  for (const file of sourceFiles) {
    if (file.endsWith(".worker.ts")) continue
    let result = !affectedSources.has(file) ? previous?.sourceResults.get(file) : undefined
    if (!result) {
      result = await compileSourceAsync(file, sourceFileSet, sourceIndex, staticFiles, cssModules, base)
      compiledModules++
    }
    result = { ...result, buildModule: { ...result.buildModule, path: relative(root, compiledPath(file)).replaceAll(sep, "/") } }
    for (const asset of result.importedAssets) importedAssets.add(resolve(root, asset))
    const output = resolve(root, result.buildModule.path)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, result.buildModule.code)
    sourceResults.push(result)
    sourceResultsByFile.set(file, result)
  }
  const handlerModules = sourceResults.flatMap(result => result.handlerModule ? [result.handlerModule] : [])
  const workerReferences = sourceResults.flatMap(result => result.moduleIR.effects.flatMap(effect => {
    const handler = result.moduleIR.handlers[effect.setup.handler]
    if (!handler || handler.kind !== "module-export" || handler.role !== "effect") throw new Error(`EffectIR ${effect.slot} has no effect HandlerIR`)
    return effect.workers.map(worker => ({ ...worker, module: assetPath(base, `assets/${result.handlerModule.path}`), handler: handler.exportName }))
  }))
  globalThis.gc?.()

  let routeRecords = []
  const routeDrafts = []
  const routeEntryTransforms = new Map()
  const routeEntrySources = new Map()
  const routeEntryPaths = new Map()
  const routePlanPools = Object.fromEntries(["states", "params", "searchParams", "effects", "conditions", "lists", "commands", "nativeStates", "nativeScope", "bindingStates", "bindingScope", "scopeStates", "scopeBindings"].map(name => [name, new Map()]))
  const rewrites = []
  const emittedRoutes = new Set()
  const emittedApplicationRoutes = new Set()
  const emittedNavigationRecords = []
  const navigationAssets = new Map()
  const placeholders = previous?.placeholders ?? {
    runtime: `/__kudzu_runtime_${randomUUID()}.js`,
    binding: `/__kudzu_binding_${randomUUID()}.js`,
    list: `/__kudzu_list_${randomUUID()}.js`
  }
  const runtimePlaceholder = placeholders.runtime
  const bindingPlaceholder = placeholders.binding
  const listPlaceholder = placeholders.list
  const pageRenders = new Map()
  let renderedPages = 0

  for (const pageFile of pageFiles) {
    const cached = !affectedPages.has(pageFile) ? previous?.pageRenders.get(pageFile) : undefined
    if (cached) {
      replayPageRender(cached, {
        emittedApplicationRoutes,
        emittedNavigationRecords,
        emittedRoutes,
        navigationAssets,
        navigationByRoute,
        routeDrafts,
        routeRecords,
        rewrites
      })
      pageRenders.set(pageFile, cached)
      continue
    }
    renderedPages++
    const draftOffset = routeDrafts.length
    const navigationOffset = emittedNavigationRecords.length
    const rewriteOffset = rewrites.length
    const sourceStyleUrls = stylesByPage.get(pageFile).map(file => assetPath(base, `assets/${relative(sourceDirectory, file).replaceAll(sep, "/")}`)).filter(url => !globalStyleUrlSet.has(url))
    const styleUrls = [...sourceStyleUrls, ...globalStyleUrls]
    const compiledFile = compiledPath(pageFile)
    const module = await import(`${pathToFileURL(compiledFile).href}?v=${Date.now()}`)
    if (typeof module.default !== "function") throw new Error(`${relative(root, pageFile)} must export a default component`)
    if (Object.hasOwn(module, "layout") && typeof module.layout !== "function") throw layoutExportError(pageFile, sourceIndex.get(pageFile))

    const runtimeSchema = runtimeRouteSchema(module, pageFile, project)
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
    const entries = runtimeSchema ? [{ params: {}, props: {} }] : await staticPathEntries(module, pageFile, root)
    for (const { params, props } of entries) {
      const route = runtimeSchema?.route ?? routeFromPage(pageFile, params, pagesDirectory)
      const applicationRoute = `/${route}`
      const routePath = withBase(base, `/${route}`)
      const metadataContext = { route: routePath, params, props }
      const configuredMetadata = await resolveDocumentMetadata(config.metadata, metadataContext, "kudzu.config metadata")
      const pageMetadata = await resolveDocumentMetadata(module.metadata, metadataContext, `${relative(root, pageFile)} metadata`)
      const navigationGroup = navigationByRoute.get(applicationRoute)
      const navigable = Boolean(navigationGroup)
      if (navigationGroup) navigationAssets.set(routePath, navigationGroup.assetPath)
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
        managedStyles: navigable ? sourceStyleUrls : [],
        base,
        applicationRoute,
        runtimeAsset: runtimePlaceholder,
        bindingAsset: bindingPlaceholder,
        listAsset: listPlaceholder,
        effectAsset: assetPath(base, `assets/${effectPath}`),
        nativeAsset: assetPath(base, `assets/${nativePath}`),
        paramAsset: assetPath(base, `assets/${paramPath}`),
        runtimeParams: runtimeSchema?.params,
        ...(navigable ? { navigationAsset: navigationGroup.assetPath, applicationId: navigationGroup.applicationId, layoutId: navigationGroup.layoutId, routeId: applicationRoute } : {})
      }, props, module.layout)
      if (navigationGroup) {
        navigationGroup.hasEffects ||= result.hasEffects
        navigationGroup.hasParams ||= result.hasParams
      }
      const plan = internRoutePlan({ route: routePath, ...result.plan }, routePlanPools)
      const usesDependencyRuntime = usesRouteDependencyRuntime({ plan, navigable, hasBindings: result.hasBindings, hasLists: result.hasLists }, false)
      const entries = {
        ...(result.hasParams ? { param: paramPath } : {}),
        ...(result.hasEffects ? { effect: effectPath } : {}),
        ...(plan.events.some(event => event.native) ? { native: nativePath } : {})
      }
      const record = createRouteBuildRecord({
        route: routePath,
        output: route,
        html: inlineQueryFormCarry(result.html, plan),
        plan,
        handlerReferences: result.handlerReferences,
        styles: styleUrls,
        capabilities: {
          navigable,
          usesDependencyRuntime,
          hasBehaviors: result.hasBehaviors,
          hasBindings: result.hasBindings,
          hasLists: result.hasLists,
          hasListStyles: result.hasListStyles,
          hasStateSeed: result.hasStateSeed,
          hasParams: result.hasParams,
          hasEffects: result.hasEffects
        },
        entries,
        runtimeSchema
      })
      routeRecords.push(record)
      if (navigationGroup) navigationGroup.buildRecords.push(record)
      routeDrafts.push({ record, runtimeSchema, navigationGroup, applicationRoute, effectPath, nativePath, paramPath })
      if (!retainCache && config.afterBuild === undefined) {
        const routeDirectory = join(outputDirectory, record.output)
        await mkdir(routeDirectory, { recursive: true })
        await writeFile(join(routeDirectory, "index.html"), record.html)
        record.html = ""
      }
    }
    pageRenders.set(pageFile, {
      drafts: routeDrafts.slice(draftOffset).map(({ navigationGroup: _, ...draft }) => draft),
      layout: module.layout,
      navigationRecords: emittedNavigationRecords.slice(navigationOffset).map(({ group: _, ...record }) => record),
      rewrites: rewrites.slice(rewriteOffset)
    })
  }

  for (const group of navigationGroups) for (const route of group.routes) if (!emittedApplicationRoutes.has(route)) throw new Error(`${group.label} route ${JSON.stringify(route)} is not an emitted route`)
  rejectNavigationOverlap(navigationGroups)
  for (const group of navigationGroups) {
    const runtimeRecords = group.routeRecords.filter(record => record.record.segments)
    for (const entry of emittedNavigationRecords) if (!entry.group && runtimeRecords.some(record => navigationDomainsOverlap(record, entry))) group.records.push({ ...entry.record, native: true })
    group.records.sort((left, right) => (right.segments?.filter(segment => segment !== null).length ?? 0) - (left.segments?.filter(segment => segment !== null).length ?? 0) || left.id.localeCompare(right.id))
  }

  const runtimePlan = planRuntimeFamilies(routeRecords, navigationGroups)
  for (const group of navigationGroups) {
    group.runtimeFamily = runtimePlan.familyByRecord.get(group.buildRecords[0])
    group.assetPath = assetPath(base, `assets/runtime/${group.runtimeFamily.id}/${group.assetName}`)
  }
  const runtimeFamilyByRecord = new Map()
  const finalizedRecords = []
  for (const draft of routeDrafts) {
    const { record, runtimeSchema, navigationGroup, effectPath, nativePath, paramPath } = draft
    const family = runtimePlan.familyByRecord.get(record)
    if (record.capabilities.hasBehaviors && !family) throw new Error(`Interactive route has no runtime family: ${record.route}`)
    const runtimeDirectory = family ? join(outputDirectory, "assets", "runtime", family.id) : undefined
    const routeRuntimeName = record.capabilities.usesDependencyRuntime ? "kudzu-deps.js" : "kudzu.js"
    const entries = {}
    const routeFile = join(outputDirectory, record.output, "index.html")
    let html = retainCache || config.afterBuild !== undefined ? record.html : await readFile(routeFile, "utf8")
    if (record.capabilities.hasParams) {
      const entry = retainRouteEntry(paramPath, output => printParamEntry(runtimeSchema, record.plan.params, record.plan.searchParams, record.plan.searchParamsWritable, output, runtimeDirectory, base, routeRuntimeName, record.capabilities.navigable), routeEntrySources, routeEntryPaths, outputDirectory)
      entries.param = entry.path
      html = html.replaceAll(assetPath(base, `assets/${paramPath}`), assetPath(base, `assets/${entry.path}`))
    }
    if (record.capabilities.hasEffects) {
      const entry = retainRouteEntry(effectPath, output => printEffectEntry(runtimeEffects(record.plan.effects, record.capabilities.navigable), output, handlerModules, join(outputDirectory, "assets"), base, entries.param, routeRuntimeName, record.capabilities.navigable, runtimeDirectory), routeEntrySources, routeEntryPaths, outputDirectory)
      entries.effect = entry.path
      html = html.replaceAll(assetPath(base, `assets/${effectPath}`), assetPath(base, `assets/${entry.path}`))
    }
    if (record.plan.events.some(event => event.native)) {
      const modules = [...new Set(record.plan.events.filter(event => event.native).map(event => event.native.module))]
      const nativeRuntime = assetPath(base, `assets/runtime/${family.id}/kudzu-native.js`)
      const entry = retainRouteEntry(nativePath, () => printNativeEntrySource(modules, nativeRuntime), routeEntrySources, routeEntryPaths, outputDirectory)
      entries.native = entry.path
      html = html.replaceAll(assetPath(base, `assets/${nativePath}`), assetPath(base, `assets/${entry.path}`))
    }
    if (family) {
      html = html.replaceAll(runtimePlaceholder, escapeAttribute(assetPath(base, `assets/runtime/${family.id}/${routeRuntimeName}`)))
      if (record.capabilities.hasBindings) html = html.replaceAll(bindingPlaceholder, escapeAttribute(assetPath(base, `assets/runtime/${family.id}/kudzu-binding.js`)))
      if (record.capabilities.hasLists) html = html.replaceAll(listPlaceholder, escapeAttribute(assetPath(base, `assets/runtime/${family.id}/kudzu-list.js`)))
    }
    if (navigationGroup) html = html.replaceAll(escapeAttribute(navigationAssets.get(record.route)), escapeAttribute(navigationGroup.assetPath))
    const finalRecord = retainCache ? createRouteBuildRecord({
      route: record.route,
      output: record.output,
      html,
      plan: record.plan,
      handlerReferences: record.artifacts.handlers,
      styles: record.artifacts.styles,
      capabilities: record.capabilities,
      entries,
      runtimeSchema
    }) : Object.assign(record, { html: "", entries })
    if (!retainCache) {
      if ([runtimePlaceholder, bindingPlaceholder, listPlaceholder].some(placeholder => html.includes(placeholder))) throw new Error(`Runtime family placeholder survived in ${record.route}`)
      await mkdir(dirname(routeFile), { recursive: true })
      await writeFile(routeFile, preloadModules(html))
    }
    if (family) runtimeFamilyByRecord.set(finalRecord, family)
    if (navigationGroup) navigationAssets.set(finalRecord.route, navigationGroup.assetPath)
    finalizedRecords.push(finalRecord)
  }
  routeRecords = finalizedRecords

  const assetsDirectory = join(outputDirectory, "assets")
  await mkdir(assetsDirectory, { recursive: true })
  const { handlerModules: emittedHandlerModules, workerReferences: renderedWorkerReferences, styles: renderedStyles } = planRouteArtifacts(routeRecords, handlerModules, workerReferences, module => assetPath(base, `assets/${module.path}`))
  const renderedStyleUrls = new Set(renderedStyles)
  if (renderedWorkerReferences.length && await exists(join(publicDirectory, "assets", "workers"))) throw new Error("public/assets/workers collides with Kudzu's generated Worker asset namespace")
  const { assets: workerAssets, outputs: workerOutputs } = await project.workerCompiler.emit(renderedWorkerReferences, sourceFileSet, assetsDirectory, base, minify)
  for (const module of emittedHandlerModules) {
    for (const reference of workerReferences) {
      if (reference.module !== assetPath(base, `assets/${module.path}`)) continue
      const url = workerAssets.get(reference.placeholder) ?? "about:blank"
      module.code = module.code.replaceAll(JSON.stringify(reference.placeholder), JSON.stringify(url))
    }
    if (module.code.includes("/__kudzu_worker_")) throw new Error(`Worker URL placeholder survived in ${module.path}`)
  }
  const sortedRewrites = rewrites.sort((left, right) => runtimeSpecificity(right) - runtimeSpecificity(left) || left.pattern.localeCompare(right.pattern))
  const releaseRoutePlans = !retainCache && config.afterBuild === undefined
  const plans = releaseRoutePlans ? undefined : routeRecords.map(record => record.plan)
  if (releaseRoutePlans) {
    await writeRoutePlans(join(workDirectory, "kudzu-plan.json"), routeRecords, sortedRewrites, runtimeFamilyByRecord, routeDrafts)
    globalThis.gc?.()
  }
  const behaviorCount = routeRecords.filter(record => record.capabilities.hasBehaviors).length
  for (let offset = 0; retainCache && offset < routeRecords.length; offset += 64) {
    await Promise.all(routeRecords.slice(offset, offset + 64).map(async record => {
      const routeDirectory = join(outputDirectory, record.output)
      await mkdir(routeDirectory, { recursive: true })
      if ([runtimePlaceholder, bindingPlaceholder, listPlaceholder].some(placeholder => record.html.includes(placeholder))) throw new Error(`Runtime family placeholder survived in ${record.route}`)
      await writeFile(join(routeDirectory, "index.html"), preloadModules(record.html))
    }))
  }
  for (const family of runtimePlan.families) {
    const capabilityIR = family.capability
    const { bindings, captures, effects, events, lists, routes, runtime } = capabilityIR
    const familyDirectory = join(assetsDirectory, "runtime", family.id)
    await mkdir(familyDirectory, { recursive: true })
    if (runtime.dependency) {
      const source = await readFile(new URL("./dependency-runtime.js", import.meta.url), "utf8")
      await writeJavaScript(join(familyDirectory, "kudzu-deps.js"), specializeRuntime(source, events.command, routes.dependencyStateSeeds > 0), minify)
    } else {
      const source = await readFile(new URL(runtime.shared ? "./shared-runtime.js" : "./runtime.js", import.meta.url), "utf8")
      await writeJavaScript(join(familyDirectory, "kudzu.js"), generateCoreRuntime(source, capabilityIR), minify)
    }
    if (bindings.count || events.hasNativeHandlers || effects.captures) await writeJavaScript(join(familyDirectory, "kudzu-serialization.js"), await readFile(new URL("./serialization.js", import.meta.url), "utf8"), minify, {
      "globalThis.__KUDZU_CAPTURE_STATE__": String(captures.nestedState),
      "globalThis.__KUDZU_CAPTURE_SETTER__": String(captures.setter)
    })
    if (effects.any) {
      const generated = generateEffectRuntime(await readFile(new URL("./effect-runtime.js", import.meta.url), "utf8"), capabilityIR)
      await writeBundledJavaScript(join(familyDirectory, "kudzu-effect.js"), generated.source, minify, generated.define)
    }
    if (bindings.count || lists.styleCount) await writeJavaScript(join(familyDirectory, "kudzu-style.js"), await readFile(new URL("./style.js", import.meta.url), "utf8"), minify)
    if (bindings.count) {
      const generated = generateBindingRuntime(await readFile(new URL("./binding-runtime.js", import.meta.url), "utf8"), capabilityIR, family.navigation)
      await writeBundledJavaScript(join(familyDirectory, "kudzu-binding.js"), generated.source, minify, generated.define)
    }
    if (effects.derivedDependencies || lists.selectors) await writeJavaScript(join(familyDirectory, "kudzu-collection-selector.js"), await readFile(new URL("./collection-selector.js", import.meta.url), "utf8"), minify)
    if (lists.count) {
      const generated = generateListRuntime(await readFile(new URL("./list-runtime.js", import.meta.url), "utf8"), capabilityIR)
      await writeBundledJavaScript(join(familyDirectory, "kudzu-list.js"), generated.source, minify, generated.define)
    }
    if (events.hasNativeHandlers) {
      const generated = generateNativeRuntime(await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"), capabilityIR)
      await writeJavaScript(join(familyDirectory, "kudzu-native.js"), generated.source, minify, generated.define)
    }
  }
  for (const [path, source] of routeEntrySources) if (path.startsWith("native/")) await writeRetainedRouteEntry(path, source, assetsDirectory, minify, routeEntryTransforms)
  if (navigationGroups.length) {
    const navigationSource = await readFile(new URL("./navigation-runtime.js", import.meta.url), "utf8")
    for (const group of navigationGroups) {
      await writeJavaScript(join(assetsDirectory, "runtime", group.runtimeFamily.id, group.assetName), generateNavigationRuntime(navigationSource, group), minify)
    }
  }
  for (const handlerModule of emittedHandlerModules) {
    const output = join(assetsDirectory, handlerModule.path)
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeJavaScript(output, handlerModule.code, minify)
  }
  for (const [path, source] of routeEntrySources) if (path.startsWith("params/") || path.startsWith("effects/")) await writeRetainedRouteEntry(path, source, assetsDirectory, minify, routeEntryTransforms)
  const clientModules = await collectClientModules(emittedHandlerModules.flatMap(module => module.clientImports).map(file => resolve(root, file)), sourceFileSet)
  for (const file of clientModules) {
    const module = await compileClientModule(file, sourceFileSet, staticFiles, cssModules, base)
    for (const asset of module.importedAssets) importedAssets.add(resolve(root, asset))
    const output = join(assetsDirectory, module.path)
    await mkdir(dirname(output), { recursive: true })
    await writeJavaScript(output, module.code, minify)
  }
  let handlerMetafile
  if (clientModules.length || emittedHandlerModules.some(module => module.hasPackageImports)) {
    const result = await bundle({
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
      metafile: true,
      logLevel: "silent"
    })
    handlerMetafile = result.metafile
    await rm(join(assetsDirectory, "modules"), { recursive: true, force: true })
  }
  if (!releaseRoutePlans) await writePrettyJson(join(workDirectory, "kudzu-plan.json"), { routes: plans, rewrites: sortedRewrites })
  const artifacts = createRouteArtifactReport(routeRecords, { base, handlerMetafile, outputDirectory, navigationAssets, runtimeFamilies: runtimePlan.families, runtimeFamilyByRecord, workerReferences: renderedWorkerReferences, workerOutputs })
  await writePrettyJson(join(workDirectory, "kudzu-artifacts.json"), artifacts)
  const emittedCssFiles = new Set()
  for (const file of cssFiles.filter(file => renderedStyleUrls.has(assetPath(base, `assets/${relative(sourceDirectory, file).replaceAll(sep, "/")}`)))) {
    const output = join(assetsDirectory, relative(sourceDirectory, file))
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, cssOutputs.get(file))
    emittedCssFiles.add(file)
  }
  for (const file of [...importedAssets].sort()) {
    const output = join(assetsDirectory, relative(sourceDirectory, file))
    await mkdir(dirname(output), { recursive: true })
    if (cssOutputs.has(file)) {
      if (!emittedCssFiles.has(file)) await writeFile(output, cssOutputs.get(file))
    } else await writeFile(output, await readFile(file))
  }
  for (const style of configuredStyles.sources.filter(style => renderedStyleUrls.has(withBase(base, style.output)))) {
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
    await copyPublic(publicDirectory, outputDirectory, outputDirectory, root)
  }
  if (config.afterBuild !== undefined) {
    if (typeof config.afterBuild !== "function") throw new Error("kudzu.config afterBuild must be a function")
    await config.afterBuild({ root, outDir: outputDirectory, sourceDir: sourceDirectory, base, routes: plans.map(plan => plan.route), plans, rewrites: sortedRewrites, artifacts })
  }

  const incremental = { compiledModules, renderedPages }
  return {
    result: { sourceResults, incremental },
    pageCount: routeRecords.length,
    behaviorCount,
    cache: { pageRenders, pageSources, placeholders, sourceResults: sourceResultsByFile }
  }
}

function affectedPageFiles({ changedFiles, pageFiles, pageSources, previous, sourceDirectory }) {
  if (!previous || changedFiles === undefined) return new Set(pageFiles)
  if (changedFiles.some(file => typeof file !== "string")) return new Set(pageFiles)
  const changes = new Set(changedFiles.map(file => isAbsolute(file) ? file : resolve(sourceDirectory, file)))
  if ([...changes].some(file => !/\.(?:ts|tsx)$/.test(file))) return new Set(pageFiles)
  const affected = new Set()
  for (const page of pageFiles) {
    const current = pageSources.get(page)
    const prior = previous.pageSources.get(page)
    if (!prior || [...changes].some(file => current.has(file) || prior.has(file))) affected.add(page)
  }
  return affected
}

function expandAffectedNavigationGroups(affected, pageRenders, groups) {
  if (!affected.size || !pageRenders || !groups.length) return
  const groupRoutes = groups.map(group => new Set(group.routes))
  const groupIndexes = new Set()
  for (const page of affected) {
    const render = pageRenders.get(page)
    if (!render) {
      for (let index = 0; index < groups.length; index++) groupIndexes.add(index)
      continue
    }
    for (const draft of render.drafts) for (let index = 0; index < groups.length; index++) if (groupRoutes[index].has(draft.applicationRoute)) groupIndexes.add(index)
  }
  for (const [page, render] of pageRenders) {
    if (render.drafts.some(draft => [...groupIndexes].some(index => groupRoutes[index].has(draft.applicationRoute)))) affected.add(page)
  }
}

function replayPageRender(cached, state) {
  for (const rewrite of cached.rewrites) {
    const conflicting = state.rewrites.find(entry => sameRuntimePrecedence(entry, rewrite))
    if (conflicting) throw new Error(`Ambiguous runtime routes: ${conflicting.route} and ${rewrite.route}`)
    state.rewrites.push(rewrite)
  }
  for (const entry of cached.navigationRecords) {
    const group = state.navigationByRoute.get(entry.route)
    const routeRecord = { ...entry, group }
    state.emittedNavigationRecords.push(routeRecord)
    state.emittedApplicationRoutes.add(entry.route)
    if (!group) continue
    if (typeof cached.layout !== "function") throw new Error(`${group.label} emitted route ${JSON.stringify(entry.record.path ?? entry.record.id)} must export a layout function so Kudzu can emit route markers`)
    if (group.layoutIdentity && group.layoutIdentity !== cached.layout) throw new Error(`${group.label} routes ${JSON.stringify(group.layoutRoute)} and ${JSON.stringify(entry.route)} must export the same layout function identity`)
    group.layoutIdentity = cached.layout
    group.layoutRoute ??= entry.route
    group.records.push(entry.record)
    group.routeRecords.push(routeRecord)
  }
  for (const draft of cached.drafts) {
    const navigationGroup = state.navigationByRoute.get(draft.applicationRoute)
    if (state.emittedRoutes.has(draft.record.route)) throw new Error(`Duplicate route: ${draft.record.route}`)
    state.emittedRoutes.add(draft.record.route)
    if (navigationGroup) {
      state.navigationAssets.set(draft.record.route, navigationGroup.assetPath)
      navigationGroup.buildRecords.push(draft.record)
      navigationGroup.hasEffects ||= draft.record.capabilities.hasEffects
      navigationGroup.hasParams ||= draft.record.capabilities.hasParams
    }
    state.routeRecords.push(draft.record)
    state.routeDrafts.push({ ...draft, navigationGroup })
  }
}

async function acquireBuildLock(lockPath, root = dirname(lockPath)) {
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

async function copyPublic(sourceDirectory, destinationDirectory, destinationRoot, root) {
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
      await copyPublic(source, destination, destinationRoot, root)
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

function inlineQueryFormCarry(html, plan) {
  if (plan.searchParamsWritable || !plan.searchParams.length || plan.events.length || plan.effects.length || plan.conditions.length || plan.lists.length || plan.bindings.length !== plan.searchParams.length * 2) return html
  const ids = new Map(plan.searchParams.map(param => [param.id, param.name]))
  const pairs = new Map(plan.searchParams.map(param => [param.name, new Set()]))
  for (const binding of plan.bindings) {
    const signalIds = Object.values(binding.scopeStates ?? {})
    const name = signalIds.length === 1 ? ids.get(signalIds[0]) : undefined
    if (!name || !["value", "disabled"].includes(binding.target) || Object.keys(binding.states ?? {}).length || Object.keys(binding.scopeBindings ?? {}).length) return html
    pairs.get(name).add(binding.target)
  }
  if ([...pairs].some(([name, targets]) => targets.size !== 2 || !html.includes(`type="hidden" name="${escapeAttribute(name)}"`))) return html
  const script = `<script>(()=>{const q=new URLSearchParams(location.search);for(const e of document.querySelectorAll('input[type="hidden"][data-k-query-carry]')){if(q.has(e.name)){e.value=q.get(e.name)??"";e.disabled=false}else{e.value="";e.disabled=true}}})()</script>`
  for (const name of pairs.keys()) html = html.replace(`type="hidden" name="${escapeAttribute(name)}"`, `type="hidden" data-k-query-carry name="${escapeAttribute(name)}"`)
  return html.replace("</body>", `${script}</body>`)
}

function printNativeEntrySource(modules, runtime) {
  const imports = modules.map((module, index) => `import * as __kNativeModule${index} from ${JSON.stringify(module)}`).join("\n")
  const registrations = modules.map((module, index) => `[${JSON.stringify(module)}, __kNativeModule${index}]`).join(",")
  return `import { registerNativeModules } from ${JSON.stringify(runtime)}\n${imports}\nregisterNativeModules([${registrations}])`
}

function retainRouteEntry(requestedPath, generate, sources, paths, outputDirectory) {
  const source = generate(join(outputDirectory, "assets", requestedPath))
  const path = paths.get(source) ?? requestedPath
  paths.set(source, path)
  sources.set(path, source)
  return { path, source }
}

async function writeRetainedRouteEntry(path, source, assetsDirectory, minify, transforms) {
  const output = join(assetsDirectory, path)
  await mkdir(dirname(output), { recursive: true })
  await writeRouteEntry(output, source, minify, transforms)
}

function runtimeEffects(effects, lifetimes = false) {
  return effects.map(effect => ({
    module: effect.module,
    handler: effect.handler,
    ...(effect.dependencies ? { dependencies: effect.dependencies } : {}),
    ...(effect.dependencyExpressions ? { dependencyExpressions: effect.dependencyExpressions, dependencyStates: effect.dependencyStates } : {}),
    ...(effect.dependencyEvaluators ? { dependencyEvaluators: effect.dependencyEvaluators } : {}),
    ...(effect.itemDependencies ? { itemDependencies: effect.itemDependencies, listState: effect.listState } : {}),
    ...(effect.cleanup ? { cleanup: true } : {}),
    ...(effect.owner ? { owner: effect.owner } : {}),
    ...(effect.list ? { list: true } : {}),
    ...(lifetimes && effect.lifetime ? { lifetime: effect.lifetime } : {}),
    states: effect.states,
    scope: effect.scope
  }))
}

function internRoutePlan(plan, pools) {
  for (const field of ["states", "params", "searchParams", "effects", "conditions", "lists"]) plan[field] = internJson(plan[field], pools[field])
  for (const event of plan.events) {
    if (event.commands) event.commands = internJson(event.commands, pools.commands)
    if (event.native) {
      event.native.states = internJson(event.native.states, pools.nativeStates)
      event.native.scope = internJson(event.native.scope, pools.nativeScope)
    }
  }
  for (const binding of plan.bindings) {
    if (binding.states) binding.states = internJson(binding.states, pools.bindingStates)
    if (binding.scope) binding.scope = internJson(binding.scope, pools.bindingScope)
    if (binding.scopeStates) binding.scopeStates = internJson(binding.scopeStates, pools.scopeStates)
    if (binding.scopeBindings) binding.scopeBindings = internJson(binding.scopeBindings, pools.scopeBindings)
  }
  return plan
}

function internJson(value, pool) {
  const encoded = JSON.stringify(value)
  const existing = pool.get(encoded)
  if (existing !== undefined) return existing
  pool.set(encoded, value)
  return value
}

async function writeJavaScript(file, source, minify, define) {
  const code = minify || define ? (await transform(source, { define, format: "esm", legalComments: "none", minify, target: "es2022" })).code : source
  await writeFile(file, code)
}

async function writePrettyJson(file, value) {
  const entries = Object.entries(value)
  if (!entries.some(([, entry]) => Array.isArray(entry) && entry.length > 2048)) {
    await writeFile(file, JSON.stringify(value, null, 2))
    return
  }
  const output = await open(file, "w")
  try {
    await output.write("{\n")
    for (let entryIndex = 0; entryIndex < entries.length; entryIndex++) {
      const [key, entry] = entries[entryIndex]
      const comma = entryIndex === entries.length - 1 ? "" : ","
      if (!Array.isArray(entry) || entry.length <= 2048) {
        await output.write(`  ${JSON.stringify(key)}: ${JSON.stringify(entry, null, 2).replaceAll("\n", "\n  ")}${comma}\n`)
        continue
      }
      await output.write(`  ${JSON.stringify(key)}: [\n`)
      for (let offset = 0; offset < entry.length; offset += 64) {
        const batch = entry.slice(offset, offset + 64).map((item, index) => {
          const separator = offset + index === entry.length - 1 ? "" : ","
          return `    ${JSON.stringify(item, null, 2).replaceAll("\n", "\n    ")}${separator}\n`
        }).join("")
        await output.write(batch)
      }
      await output.write(`  ]${comma}\n`)
    }
    await output.write("}")
  } finally {
    await output.close()
  }
}

async function writeRoutePlans(file, records, rewrites, familyByRecord, drafts) {
  const output = await open(file, "w")
  try {
    await output.write(records.length ? '{\n  "routes": [\n' : '{\n  "routes": []')
    for (let offset = 0; offset < records.length; offset += 64) {
      const batch = records.slice(offset, offset + 64).map((record, index) => {
        const recordIndex = offset + index
        const separator = recordIndex === records.length - 1 ? "" : ","
        const encoded = `    ${JSON.stringify(record.plan, null, 2).replaceAll("\n", "\n    ")}${separator}\n`
        const family = familyByRecord.get(record)
        if (family && !family.navigation) {
          releaseRouteBuildRecordPlan(record)
          if (drafts[recordIndex].record !== record) releaseRouteBuildRecordPlan(drafts[recordIndex].record)
        }
        return encoded
      }).join("")
      await output.write(batch)
      if ((offset + 64) % 512 === 0) globalThis.gc?.()
    }
    await output.write(`${records.length ? "  ]" : ""},\n  "rewrites": ${JSON.stringify(rewrites, null, 2).replaceAll("\n", "\n  ")}\n}`)
  } finally {
    await output.close()
  }
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
    external: ["./kudzu.js", "./kudzu-binding.js", "./kudzu-collection-selector.js", "./kudzu-serialization.js", "./kudzu-style.js"],
    define,
    format: "esm",
    target: "es2022",
    minify,
    legalComments: "none",
    logLevel: "silent"
  })
  await writeFile(file, result.outputFiles[0].contents)
}

export async function dev({ port = parseDevPort(process.env.PORT), host = parseDevHost(process.env.HOST), root: projectRoot = process.cwd() } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid dev server port: ${port}`)
  if (typeof host !== "string" || !host.trim()) throw new Error(`Invalid dev server host: ${host}`)
  const project = createProjectSession(projectRoot)
  const { root, sourceDirectory, workDirectory, outputDirectory } = project
  const base = normalizeBase((await loadConfig(root)).base)
  return startDevServer({ build: options => buildWithSession(project, options), port, host, base, sourceDirectory, workDirectory, outputDirectory })
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

async function prepareSourceStyles(cssFiles, staticFiles, importedAssets, base, { root, sourceDirectory }) {
  const cssModules = new Map()
  const cssOutputs = new Map()
  for (const file of cssFiles) {
    let css = rewriteCssUrls(await readFile(file, "utf8"), file, staticFiles, importedAssets, base, root, sourceDirectory)
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

function rewriteCssUrls(css, file, staticFiles, importedAssets, base, root, sourceDirectory) {
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
    const replacement = rewriteCssUrl(value, quote, file, staticFiles, importedAssets, base, root, sourceDirectory)
    output += css.slice(cursor, index) + (replacement ?? css.slice(index, close + 1))
    cursor = close + 1
    index = close + 1
  }
  return output + css.slice(cursor)
}

function rewriteCssUrl(value, quote, file, staticFiles, importedAssets, base, root, sourceDirectory) {
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

function normalizeStyles(value, base, { root }) {
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

function normalizePublicDirectory(value, { root, outputDirectory, workDirectory }) {
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

async function staticPathEntries(module, file, root) {
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

function runtimeRouteSchema(module, file, { root, pagesDirectory }) {
  if (!Object.hasOwn(module, "runtimeParams")) return undefined
  if (module.runtimeParams !== true) throw new Error(`${relative(root, file)} runtimeParams must be exactly true`)
  if (typeof module.getStaticPaths === "function") throw new Error(`${relative(root, file)} runtimeParams cannot be combined with getStaticPaths()`)
  const route = pageRoutePattern(file, pagesDirectory)
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

function pageRoutePattern(file, pagesDirectory) {
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

function routeFromPage(file, params = {}, pagesDirectory) {
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
