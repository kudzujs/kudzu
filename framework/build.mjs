import { createServer } from "node:http"
import { createHash, randomUUID } from "node:crypto"
import { cp, mkdir, readFile, readdir, realpath, rm, stat, watch, writeFile } from "node:fs/promises"
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { build as bundle, transform } from "esbuild"
import ts from "typescript"
import { renderPage } from "./core.mjs"
import { stateSchema } from "./dev-state.js"

const root = process.cwd()
const sourceDirectory = join(root, "src")
const pagesDirectory = join(sourceDirectory, "pages")
const workDirectory = join(root, ".kudzu")
const outputDirectory = join(root, "dist")
const staticAssetExtensions = new Set([".avif", ".gif", ".ico", ".jpeg", ".jpg", ".otf", ".png", ".svg", ".ttf", ".webp", ".woff", ".woff2"])

const devClient = (session, revision, schema) => `<script>(()=>{const show=event=>{let box=document.getElementById("__kudzu_error");if(!box){box=document.createElement("div");box.id="__kudzu_error";box.setAttribute("role","alert");box.setAttribute("aria-live","assertive");box.style.cssText="position:fixed;inset:0;z-index:2147483647;overflow:auto;padding:2rem;background:#200;color:#fff;font:16px/1.5 ui-monospace,monospace";const title=document.createElement("strong"),text=document.createElement("pre");title.textContent="Kudzu build error";text.style.whiteSpace="pre-wrap";box.append(title,text);document.body.append(box)}box.querySelector("pre").textContent=event.data};const schema=${inlineJson(schema)},route=location.pathname+location.search+location.hash,urls=[...document.querySelectorAll('script[type="module"][src]')].map(node=>node.src).filter(url=>/\\/assets\\/kudzu(?:-(?:binding|list|native))?\\.js$/.test(new URL(url).pathname));const devImport=import("/__kudzu_dev.js"),runtimeImports=Promise.allSettled(urls.map(url=>import(url)));const ready=(async()=>{const dev=await devImport,modules=await runtimeImports,runtime=modules.find(result=>result.status==="fulfilled"&&result.value.browserState instanceof Map&&typeof result.value.commitDom==="function")?.value;try{dev.restoreState(sessionStorage,route,runtime?.browserState,schema,runtime?.commitDom)}catch{}return{dev,runtime}})().catch(()=>({}));const events=new EventSource("/__kudzu_reload?session=${session}&revision=${revision}");let reloading=false;events.addEventListener("reload",async()=>{if(reloading)return;reloading=true;try{const{dev,runtime}=await ready;dev?.snapshotState(sessionStorage,route,runtime?.browserState,schema)}catch{}location.reload()});events.addEventListener("build-error",show)})()</script>`

export async function build({ quiet = false, minify = true } = {}) {
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
  await rm(outputDirectory, { recursive: true, force: true })
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

  const handlerModules = []
  const workerReferences = []
  for (const file of sourceFiles) {
    if (file.endsWith(".worker.ts")) continue
    const handlerModule = await compile(file, sourceFileSet, sourceIndex, staticFiles, importedAssets, cssModules, base, workerReferences)
    if (handlerModule) handlerModules.push(handlerModule)
  }

  let behaviorCount = 0
  let regularBehaviorCount = 0
  let bindingCount = 0
  let listCount = 0
  let listStyleCount = 0
  let regularStateSeedCount = 0
  let dependencyStateSeedCount = 0
  const plans = []
  const pageEntries = []
  const effectEntries = []
  const nativeEntries = []
  const paramEntries = []
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
      for (const url of result.handlerModules) renderedHandlerUrls.add(url)
      if (navigationGroup) {
        navigationGroup.hasEffects ||= result.hasEffects
        navigationGroup.hasParams ||= result.hasParams
      }
      const hasDependencies = result.plan.effects.some(effect => effect.dependencies?.length)
      const usesDependencyRuntime = !navigable && hasDependencies && !result.plan.effects.some(effect => effect.owner) && !result.hasBindings && !result.hasLists && !result.plan.events.some(event => event.native)
      pageEntries.push({ route, html: result.html, usesDependencyRuntime })
      plans.push({ route: routePath, ...result.plan })
      if (result.hasParams) paramEntries.push({ path: paramPath, schema: runtimeSchema, params: result.plan.params, searchParams: result.plan.searchParams, searchParamsWritable: result.plan.searchParamsWritable, usesDependencyRuntime, navigable })
      if (result.hasEffects) effectEntries.push({ path: effectPath, effects: runtimeEffects(result.plan.effects, navigable), paramPath: result.hasParams ? paramPath : undefined, usesDependencyRuntime, navigable })
      if (result.plan.events.some(event => event.native)) nativeEntries.push({
        path: nativePath,
        modules: [...new Set(result.plan.events.filter(event => event.native).map(event => event.native.module))]
      })
      if (result.hasBehaviors) {
        behaviorCount++
        if (!usesDependencyRuntime) regularBehaviorCount++
      }
      if (result.hasBindings) bindingCount++
      if (result.hasLists) listCount++
      if (result.hasListStyles) listStyleCount++
      if (result.hasStateSeed) {
        if (usesDependencyRuntime) dependencyStateSeedCount++
        else regularStateSeedCount++
      }
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
  const commandEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.commands).map(event => event.event)))].sort()
  const nativeEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.native).map(event => event.event)))].sort()
  const hasTextBindings = plans.some(plan => plan.bindings.some(binding => binding.target === "text"))
  const hasSvgConditions = plans.some(plan => plan.conditions.some(condition => condition.svg))
  const hasListConditions = plans.some(plan => plan.lists.some(list => list.conditions))
  const hasSvgLists = plans.some(plan => plan.lists.some(list => list.svg))
  const hasDeepListConditions = plans.some(plan => plan.lists.some(list => list.conditionHandlers))
  const hasListTextRanges = plans.some(plan => plan.lists.some(list => list.textRanges))
  const hasListAttributes = plans.some(plan => plan.lists.some(list => list.attributes))
  const hasListEvents = plans.some(plan => plan.lists.some(list => list.events))
  const hasListExpressions = plans.some(plan => plan.lists.some(list => list.expressions))
  const hasListExpressionAttributes = plans.some(plan => plan.lists.some(list => list.expressionAttributes))
  const hasListSeeds = plans.some(plan => plan.lists.some(list => list.seed || list.valueSeed))
  const hasListEffects = plans.some(plan => plan.lists.some(list => list.effects))
  const hasListRowHooks = plans.some(plan => plan.lists.some(list => list.rowStates?.length || list.rowRefs?.length))
  const hasListRowRefs = plans.some(plan => plan.lists.some(list => list.rowRefs?.length))
  const hasComplexListRowState = plans.some(plan => plan.lists.some(list => list.rowStates?.some(state => state.initialValue !== null && typeof state.initialValue === "object")))
  const hasNestedLists = plans.some(plan => plan.lists.some(list => list.ownerField))
  const hasCollectionSelectors = plans.some(plan => plan.lists.some(list => list.selector))
  const hasCalculatedCollections = plans.some(plan => plan.lists.some(list => list.source))
  const hasDerivedEffectDependencies = plans.some(plan => plan.effects.some(effect => effect.dependencyExpressions?.length))
  const hasStaticCollections = plans.some(plan => plan.lists.some(list => list.static))
  const hasListIndexes = plans.some(plan => plan.lists.some(list => list.indexed))
  const hasListStableFastPaths = plans.some(plan => plan.lists.some(list => !list.children && !list.ownerField && list.key !== null && !list.indexed && !list.reducer && !list.selector))
  const hasGeneralListRowHooks = hasListRowRefs || hasComplexListRowState || plans.some(plan => plan.lists.some(list => list.ownerField && (list.rowStates?.length || list.rowRefs?.length)))
  const hasItemDependencies = plans.some(plan => plan.effects.some(effect => effect.itemDependencies?.length))
  const hasListAsyncParts = hasListExpressions || hasListExpressionAttributes || hasListConditions
  const hasListMounts = hasListConditions || hasNestedLists || plans.some(plan => plan.lists.some(list => list.mount))
  const hasNestedStateCaptures = hasNestedCaptureState(plans)
  const hasSetterCaptures = hasCaptureType(plans, "setter")
  const hasEffectCaptures = plans.some(plan => plan.effects.some(effect => Object.keys(effect.scope).length))
  const hasNativeHandlers = nativeEntries.length > 0
  const hasEffects = effectEntries.length > 0
  const hasNavigableEffects = effectEntries.some(entry => entry.navigable)
  const hasNavigableOwners = effectEntries.some(entry => entry.navigable && entry.effects.some(effect => effect.owner))
  const hasSharedRuntime = bindingCount || listCount || hasNativeHandlers || navigationRoutes.length
  const hasDependencyRuntime = pageEntries.some(entry => entry.usesDependencyRuntime)
  const runtimeName = usesDependencyRuntime => usesDependencyRuntime ? "kudzu-deps.js" : "kudzu.js"
  for (const entry of pageEntries) {
    const routeDirectory = join(outputDirectory, entry.route)
    await mkdir(routeDirectory, { recursive: true })
    const html = preloadModules(entry.html.replace(runtimePlaceholder, escapeAttribute(assetPath(base, `assets/${runtimeName(entry.usesDependencyRuntime)}`))))
    await writeFile(join(routeDirectory, "index.html"), html)
  }
  if (navigationRoutes.length || behaviorCount && (hasSharedRuntime || regularBehaviorCount)) {
    const runtimeFile = hasSharedRuntime ? "./shared-runtime.js" : "./runtime.js"
    let runtime = specializeRuntime(await readFile(new URL(runtimeFile, import.meta.url), "utf8"), commandEvents, regularStateSeedCount > 0)
    if (!hasItemDependencies) runtime = runtime.replace(/\/\* list-item-hooks \*\/[\s\S]*?\/\* list-item-hooks-end \*\/\n/, "")
    if (hasNavigableEffects) runtime = runtime.replace("export function registerCommitter(commit) {\n  committers.push(commit)\n}", "export function registerCommitter(commit) {\n  committers.push(commit)\n  return () => {\n    const index = committers.indexOf(commit)\n    if (index !== -1) committers.splice(index, 1)\n  }\n}")
    if (hasNavigableOwners) runtime = runtime
      .replace("export function registerMountHook(mount) {\n  mountHooks.push(mount)\n}", "export function registerMountHook(mount) {\n  mountHooks.push(mount)\n  return () => {\n    const index = mountHooks.indexOf(mount)\n    if (index !== -1) mountHooks.splice(index, 1)\n  }\n}")
      .replace("export function registerUnmountHook(unmount) {\n  unmountHooks.push(unmount)\n}", "export function registerUnmountHook(unmount) {\n  unmountHooks.push(unmount)\n  return () => {\n    const index = unmountHooks.indexOf(unmount)\n    if (index !== -1) unmountHooks.splice(index, 1)\n  }\n}")
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
    let effectRuntime = await readFile(new URL("./effect-runtime.js", import.meta.url), "utf8")
    effectRuntime = hasEffectCaptures ? effectRuntime.replace('"./serialization.js"', '"./kudzu-serialization.js"') : effectRuntime.replace(/^import[^\n]+\n/, "")
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-effect.js"), effectRuntime, minify, {
      "globalThis.__KUDZU_CAPTURE_SETTER__": String(hasSetterCaptures),
      "globalThis.__KUDZU_EFFECT_CAPTURES__": String(hasEffectCaptures)
    })
  }
  if (bindingCount || listStyleCount) await writeJavaScript(join(assetsDirectory, "kudzu-style.js"), await readFile(new URL("./style.js", import.meta.url), "utf8"), minify)
  if (bindingCount) {
    let bindingRuntime = (await readFile(new URL("./binding-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
      .replace('"./style.js"', '"./kudzu-style.js"')
    if (navigationRoutes.length) bindingRuntime = specializeNavigationTextDescriptors(bindingRuntime)
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-binding.js"), bindingRuntime, minify, {
      "globalThis.__KUDZU_TEXT_BINDINGS__": String(hasTextBindings),
      "globalThis.__KUDZU_SVG_CONDITIONS__": String(hasSvgConditions),
      "globalThis.__KUDZU_CAPTURE_STATE__": String(hasNestedStateCaptures)
    })
  }
  if (hasDerivedEffectDependencies) await writeJavaScript(join(assetsDirectory, "kudzu-collection-selector.js"), await readFile(new URL("./collection-selector.js", import.meta.url), "utf8"), minify)
  if (listCount) {
    if (hasCollectionSelectors && !hasDerivedEffectDependencies) await writeJavaScript(join(assetsDirectory, "kudzu-collection-selector.js"), await readFile(new URL("./collection-selector.js", import.meta.url), "utf8"), minify)
    let listRuntime = (await readFile(new URL("./list-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
    listRuntime = hasCalculatedCollections
      ? listRuntime.replace('"./binding-runtime.js"', '"./kudzu-binding.js"')
      : listRuntime.replace(/^const loadListEvaluator[^\n]+\n/m, "")
    listRuntime = hasCollectionSelectors
      ? listRuntime.replace('"./collection-selector.js"', '"./kudzu-collection-selector.js"')
      : listRuntime.replace(/^import \{ selectCollection \}[^\n]+\n/m, "")
    if (!hasListIndexes) listRuntime = listRuntime
      .replace("for (const [index, item] of items.entries()) {", "for (const item of items) {")
      .replace("const key = list.descriptor.key === null ? index : item?.[list.descriptor.key]", "const key = item?.[list.descriptor.key]")
      .replace("entries.push({ item, index, key, token, value:", "entries.push({ item, key, token, value:")
      .replace("for (const { item, index, key, token, value } of entries) {", "for (const { item, key, token, value } of entries) {")
      .replaceAll("fillListItem(node, item, list.descriptor.nested, index)", "fillListItem(node, item, list.descriptor.nested)")
      .replace("fillListItem(node, item, list.descriptor.nested, index, mapListItemParts", "fillListItem(node, item, list.descriptor.nested, 0, mapListItemParts")
      .replace("function addListRoot(list, { item, index = list.roots.size, key, token, value })", "function addListRoot(list, { item, key, token, value })")
      .replace("fillListParts(root, listItemParts(root), listItems.get(owner), 0, __KUDZU_LIST_INDEXES__ ? listIndexes.get(owner) ?? 0 : 0)", "fillListParts(root, listItemParts(root), listItems.get(owner), 0)")
      .replace("function fillListItem(root, item, nested = false, index = 0)", "function fillListItem(root, item, nested = false)")
      .replace("fillListParts(root, parts, item, revision, index, previous)", "fillListParts(root, parts, item, revision, previous)")
      .replace("function fillListParts(root, parts, item, revision, index = 0, previous)", "function fillListParts(root, parts, item, revision, previous)")
      .replaceAll('value?.type === "list-item" ? serializeItem(item) : value?.type === "list-index" ? index : value', 'value?.type === "list-item" ? serializeItem(item) : value')
      .replaceAll("evaluate(descriptor, item, index)", "evaluate(descriptor, item)")
      .replaceAll("evaluate({ module, handler }, item, index)", "evaluate({ module, handler }, item)")
      .replace("updateListCondition(marker, descriptor.kind, value, item, index)", "updateListCondition(marker, descriptor.kind, value, item)")
      .replace("function updateListCondition(marker, kind, value, item, index)", "function updateListCondition(marker, kind, value, item)")
      .replace("fillListParts(marker, listItemParts(fragment), item, revision, index)", "fillListParts(marker, listItemParts(fragment), item, revision)")
      .replace("function evaluate(descriptor, item, index)", "function evaluate(descriptor, item)")
      .replace("exports[descriptor.handler](item, index)", "exports[descriptor.handler](item)")
    if (!hasCollectionSelectors) listRuntime = listRuntime.replaceAll(" && !list.descriptor.selector", "")
    if (!hasListIndexes) listRuntime = listRuntime
      .replaceAll(" && !list.descriptor.indexed", "")
      .replaceAll(" && list.descriptor.key !== null", "")
      .replaceAll("list.descriptor.key !== null && !list.descriptor.indexed && ", "")
      .replace("list.descriptor.key !== null && !list.descriptor.indexed && !list.descriptor.selector && list.values.size", "list.values.size")
      .replace("(referenceOnly ? listItems.get(node) !== item : list.values.get(token) !== value) || list.descriptor.indexed || list.descriptor.key === null", "referenceOnly ? listItems.get(node) !== item : list.values.get(token) !== value")
    if (hasListRowHooks && !hasGeneralListRowHooks) listRuntime = listRuntime
      .replace(/\/\* general-row-hooks \*\/[\s\S]*?\/\* general-row-hooks-end \*\/\n/, "")
      .replaceAll("initializeGeneralRowHooks", "initializeRowStates")
      .replace("if (__KUDZU_LIST_ROW_HOOKS__) for (let index = 0; index < roots.length; index++) initializeRowStates(descriptor, descriptor.keys[index], roots[index], nested?.owner)", "if (__KUDZU_LIST_ROW_HOOKS__ && descriptor.rowStates) for (let index = 0; index < roots.length; index++) initializeRowStates(descriptor, descriptor.keys[index])")
      .replaceAll("if (__KUDZU_LIST_ROW_HOOKS__) initializeRowStates(list.descriptor, key, node, list.owner)", "if (__KUDZU_LIST_ROW_HOOKS__ && list.descriptor.rowStates) initializeRowStates(list.descriptor, key, node)")
      .replace("for (const node of registration.list.roots.values()) deleteRowStates(registration.list.descriptor, ownershipPaths.get(node))", "for (const token of registration.list.roots.keys()) deleteFlatRowStates(registration.list.descriptor, token)")
      .replaceAll("deleteRowStates(list.descriptor, ownershipPaths.get(node))", "deleteFlatRowStates(list.descriptor, token)")
      .replace("  if (__KUDZU_LIST_ROW_HOOKS__) replaceRowIds(root, rowReplacements.get(root))\n", "")
      .replace("  if (!replacements) return\n", "")
    if (!hasItemDependencies) listRuntime = listRuntime.replace(", notifyListItem", "")
    if (!hasListStableFastPaths) listRuntime = listRuntime.replace(/\/\* stable-list-fast-path \*\/[\s\S]*?\/\* stable-list-fast-path-end \*\/\n/, "")
    const stylePatch = `  if (target === "style") {
    const style = serializeStyle(value)
    if (style) node.setAttribute("style", style)
    else node.removeAttribute("style")
    return
  }`
    listRuntime = listRuntime.replace("  /* list-style */", listStyleCount ? stylePatch : "")
    if (listStyleCount) listRuntime = `import { serializeStyle } from "./kudzu-style.js"\n${listRuntime}`
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-list.js"), listRuntime, minify, {
      __KUDZU_LIST_CONDITIONS__: String(hasListConditions),
      __KUDZU_DEEP_LIST_CONDITIONS__: String(hasDeepListConditions),
      __KUDZU_LIST_TEXT_RANGES__: String(hasListTextRanges),
      __KUDZU_LIST_ATTRIBUTES__: String(hasListAttributes),
      __KUDZU_LIST_EVENTS__: String(hasListEvents),
      __KUDZU_LIST_EXPRESSIONS__: String(hasListExpressions),
      __KUDZU_LIST_EXPRESSION_ATTRIBUTES__: String(hasListExpressionAttributes),
      __KUDZU_LIST_SEEDS__: String(hasListSeeds),
      __KUDZU_LIST_EFFECTS__: String(hasListEffects),
      __KUDZU_LIST_ASYNC_PARTS__: String(hasListAsyncParts),
      __KUDZU_LIST_MOUNTS__: String(hasListMounts),
      __KUDZU_LIST_ITEM_HOOKS__: String(hasItemDependencies),
      __KUDZU_LIST_ROW_HOOKS__: String(hasListRowHooks),
      __KUDZU_LIST_ROW_REFS__: String(hasListRowRefs),
      __KUDZU_COMPLEX_LIST_ROW_STATE__: String(hasComplexListRowState),
      __KUDZU_NESTED_LISTS__: String(hasNestedLists),
      __KUDZU_COLLECTION_SELECTORS__: String(hasCollectionSelectors),
      __KUDZU_STATIC_COLLECTIONS__: String(hasStaticCollections),
      __KUDZU_LIST_INDEXES__: String(hasListIndexes),
      __KUDZU_LIST_STABLE_FAST_PATHS__: String(hasListStableFastPaths),
      __KUDZU_SVG_LISTS__: String(hasSvgLists)
    })
    if (hasCollectionSelectors && !hasDerivedEffectDependencies) await rm(join(assetsDirectory, "kudzu-collection-selector.js"))
  }
  if (hasNativeHandlers) {
    const nativeRuntime = (await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
    await writeJavaScript(join(assetsDirectory, "kudzu-native.js"), specializeEvents(nativeRuntime, nativeEvents), minify, {
      "globalThis.__KUDZU_CAPTURE_SETTER__": String(hasSetterCaptures)
    })
    for (const entry of nativeEntries) await printNativeEntry(entry, assetsDirectory, base, minify)
  }
  if (navigationGroups.length) {
    const navigationSource = await readFile(new URL("./navigation-runtime.js", import.meta.url), "utf8")
    for (const group of navigationGroups) {
      let navigationRuntime = navigationSource
        .replace("__KUDZU_NAVIGATION_ROUTES__", inlineJson(group.records))
        .replace("__KUDZU_APPLICATION_ID__", JSON.stringify(group.applicationId))
        .replace("__KUDZU_LAYOUT_ID__", JSON.stringify(group.layoutId))
        .replace('"./shared-runtime.js"', '"./kudzu.js"')
      navigationRuntime = specializeNavigationPatterns(navigationRuntime, group.records.some(record => record.segments))
      await writeJavaScript(join(assetsDirectory, group.assetName), specializeNavigationEffects(navigationRuntime, group.hasEffects || group.hasParams), minify)
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
    await writeJavaScript(output, printParamEntry(entry.schema, entry.params, entry.searchParams, entry.searchParamsWritable, output, assetsDirectory, base, runtimeName(entry.usesDependencyRuntime), entry.navigable), minify)
  }
  for (const entry of effectEntries) {
    const output = join(assetsDirectory, entry.path)
    await mkdir(dirname(output), { recursive: true })
    await writeJavaScript(output, entry.navigable
      ? entry.effects.some(effect => effect.owner)
        ? printOwnedNavigableEffectEntry(entry.effects, output, emittedHandlerModules, assetsDirectory, base)
        : printNavigableEffectEntry(entry.effects, output, emittedHandlerModules, assetsDirectory, base)
      : printEffectEntry(entry.effects, output, emittedHandlerModules, assetsDirectory, base, entry.paramPath, runtimeName(entry.usesDependencyRuntime)), minify)
  }
  const clientModules = await collectClientModules(emittedHandlerModules.flatMap(module => module.clientImports), sourceFileSet)
  for (const file of clientModules) {
    const output = join(assetsDirectory, clientModulePath(file))
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeJavaScript(output, await compileClientModule(file, sourceFileSet, staticFiles, importedAssets, cssModules, base), minify)
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
  for (const file of new Set([...cssFiles, ...importedAssets])) {
    const collision = join(publicDirectory, "assets", relative(sourceDirectory, file))
    if (await exists(collision)) throw new Error(`${relative(root, collision)} collides with emitted source asset ${relative(root, file)}`)
  }
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
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, css)
  }
  if (await exists(publicDirectory)) await cp(publicDirectory, outputDirectory, { recursive: true })
  if (config.afterBuild !== undefined) {
    if (typeof config.afterBuild !== "function") throw new Error("kudzu.config afterBuild must be a function")
    await config.afterBuild({ root, outDir: outputDirectory, sourceDir: sourceDirectory, base, routes: plans.map(plan => plan.route), plans, rewrites: sortedRewrites })
  }

  if (!quiet) console.log(`Built ${plans.length} page(s), ${behaviorCount} interactive page(s) into dist/`)
}

function preloadModules(html) {
  const scripts = [...html.matchAll(/<script type="module"[^>]* src="([^"]+)"[^>]*><\/script>/g)]
  if (!scripts.length) return html
  const links = [...new Set(scripts.map(match => match[1]))].map(href => `<link rel="modulepreload" href="${href}">`).join("")
  return html.replace(scripts[0][0], `${links}${scripts[0][0]}`)
}

function specializeEvents(source, events) {
  return source.replace(/const eventNames = \[[^\n]+\]/, `const eventNames = ${JSON.stringify(events)}`)
}

function specializeNavigationEffects(source, enabled) {
  if (enabled) return source
  return source
    .replace("const noDispose = async () => {}\nlet routeDispose = noDispose\nlet layoutDispose = noDispose\nconst ready = mountInitial()\n", "")
    .replace(`addEventListener("pagehide", event => {
  if (event.persisted) return
  ++revision
  request?.abort()
  void (async () => {
    await routeDispose()
    await layoutDispose()
  })()
})
`, "")
    .replace(`
async function mountInitial() {
  try {
    const record = matchRoute(location.pathname)
    if (!record) throw new Error("Initial navigation route does not match")
    const capabilities = await loadCapabilities(validate(document, record))
    capabilities.params?.(location.pathname, location.search)
    layoutDispose = await capabilities.effects?.mountLayoutEffects?.() ?? noDispose
    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose
  } catch (error) {
    console.error(error)
  }
}
`, "")
    .replace("  await ready\n", "")
    .replace("    const { incoming, parsed, capabilities } = documentResult\n", "    const { incoming, parsed } = documentResult\n")
    .replace("    await routeDispose()\n    if (current !== revision) return\n", "")
    .replace("    commit(incoming, parsed.nodes, capabilities.params, url.pathname, url.search)\n", "    commit(incoming, parsed.nodes)\n")
    .replace("    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose\n", "")
    .replace("  return { incoming, parsed, capabilities: await loadCapabilities(parsed), record }\n", "  await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))\n  return { incoming, parsed, record }\n")
    .replace(`
async function loadCapabilities(parsed) {
  const modules = await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))
  const params = modules.filter(module => typeof module.initializeParams === "function")
  const effects = modules.filter(module => typeof module.mountRouteEffects === "function")
  if (params.length > 1 || effects.length > 1) throw new Error("Navigation document has duplicate route capabilities")
  return { params: params[0]?.initializeParams, effects: effects[0] }
}
`, "")
}

function specializeNavigationPatterns(source, enabled) {
  if (enabled) return source
  return source.replace(/function matchRoute\(pathname\) \{[\s\S]+?\n\}\n\nfunction fallback/, `function matchRoute(pathname) {
  return routes.find(record => record.path === pathname)
}

function fallback`)
}

async function printNativeEntry(entry, assetsDirectory, base, minify) {
  const output = join(assetsDirectory, entry.path)
  await mkdir(dirname(output), { recursive: true })
  const imports = entry.modules.map((module, index) => `import * as __kNativeModule${index} from ${JSON.stringify(module)}`).join("\n")
  const registrations = entry.modules.map((module, index) => `[${JSON.stringify(module)}, __kNativeModule${index}]`).join(",")
  const runtime = assetPath(base, "assets/kudzu-native.js")
  await writeJavaScript(output, `import { registerNativeModules } from ${JSON.stringify(runtime)}\n${imports}\nregisterNativeModules([${registrations}])`, minify)
}

function printEffectEntry(effects, output, handlerModules, assetsDirectory, base, paramPath, runtimeName) {
  const hasCleanup = effects.some(effect => effect.cleanup)
  const hasDependencies = effects.some(effect => effect.dependencies?.length || effect.itemDependencies?.length)
  const hasOwners = effects.some(effect => effect.owner)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    hasCleanup || hasDependencies || hasOwners
      ? `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, runtimeName)))}\nconst { browserState, commitDom } = __kRuntime`
      : `import { browserState, commitDom } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, runtimeName)))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...(paramPath ? [`import ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, paramPath)))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  if (hasOwners) return printOwnedEffectEntry(imports, effects, entries)
  if (effects.length === 1 && effects[0].dependencies?.length === 1 && !hasDependencyExpressions) return printSingleDependencyEffect(imports, effects[0], hasCleanup)
  const disposal = hasCleanup ? `
let disposed = false
const dispose = root => {
  if (root !== document || disposed) return
  disposed = true
  active = false
  pending.clear()
  for (const record of records) invokeCleanup(record)
}

if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose)
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})` : ""
  if (hasDependencies) return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
const records = effects.map((effect, index) => ({ effect, index, values: undefined, cleanup: undefined }))
const dependencies = new Map()
const pending = new Set()
let scheduled = false
let flushing = false
let active = true
for (const record of records) {
  for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id) ?? new Set()
    subscribers.add(record)
    dependencies.set(id, subscribers)
  }
}
__kRuntime.registerCommitter(id => {
  if (!active) return
  for (const record of dependencies.get(id) ?? []) pending.add(record)
  schedule()
})
for (const record of records) {
  try {
    record.values = readDependencies(record)
    invoke(record)
  } catch (error) {
    console.error(error)
  }
}
function schedule() {
  if (!pending.size || scheduled || flushing) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return pending.clear()
  flushing = true
  try {
    const selected = [...pending].sort((left, right) => left.index - right.index)
    pending.clear()
    const changed = []
    for (const record of selected) {
      try {
        const values = readDependencies(record)
        if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) {
          record.values = values
          changed.push(record)
        }
      } catch (error) {
        console.error(error)
      }
    }
    for (const record of changed) await invokeCleanup(record)
    if (active) for (const record of changed) invoke(record)
  } finally {
    flushing = false
    if (active) schedule()
  }
}
function readDependencies(record) {
${hasDependencyExpressions ? printDerivedDependencyRead("browserState") : ""}
  return (record.effect.dependencies ?? []).map(id => {
    const value = browserState.get(id)
    if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive")
    return value
  })
}
function invoke(record) {
  try {
    const effect = record.effect
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (effect.cleanup && typeof result === "function") record.cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
async function invokeCleanup(record) {
  const cleanup = record.cleanup
  record.cleanup = undefined
  if (!cleanup) return
  try {
    await cleanup()
  } catch (error) {
    console.error(error)
  }
}${disposal}`
  if (!hasCleanup) return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
for (const effect of effects) {
  try {
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}`
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
const cleanups = []
for (const effect of effects) {
  try {
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (effect.cleanup && typeof result === "function") cleanups.push(result)
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
let cleaned = false
const dispose = root => {
  if (root !== document || cleaned) return
  cleaned = true
  for (const cleanup of cleanups) {
    try {
      const result = cleanup()
      if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  cleanups.length = 0
}
if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose)
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})`
}

function printNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, base) {
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
export const mountLayoutEffects = () => mount("layout")
export const mountRouteEffects = () => mount("route")
function mount(lifetime) {
  let active = true
  let flushing
  const records = effects.filter(effect => effect.lifetime === lifetime).map((effect, index) => ({ effect, index, values: undefined, cleanup: undefined, token: undefined }))
  const dependencies = new Map()
  const pending = new Set()
  let scheduled = false
  for (const record of records) for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id) ?? new Set()
    subscribers.add(record)
    dependencies.set(id, subscribers)
  }
  const unsubscribe = dependencies.size ? __kRuntime.registerCommitter(id => {
    if (!active) return
    for (const record of dependencies.get(id) ?? []) pending.add(record)
    if (pending.size && !scheduled && !flushing) {
      scheduled = true
      queueMicrotask(flush)
    }
  }) : undefined
  for (const record of records) {
    try {
      record.values = readDependencies(record)
      invoke(record)
    } catch (error) {
      console.error(error)
    }
  }
  async function flush() {
    scheduled = false
    if (!active) return pending.clear()
    const operation = (async () => {
      const selected = [...pending].sort((left, right) => left.index - right.index)
      pending.clear()
      const changed = []
      for (const record of selected) {
        try {
          const values = readDependencies(record)
          if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) {
            record.values = values
            changed.push(record)
          }
        } catch (error) {
          console.error(error)
        }
      }
      for (const record of changed) await cleanup(record)
      if (active) for (const record of changed) invoke(record)
    })()
    flushing = operation
    try { await operation } finally {
      if (flushing === operation) flushing = undefined
      if (active && pending.size && !scheduled) {
        scheduled = true
        queueMicrotask(flush)
      }
    }
  }
  function readDependencies(record) {
${hasDependencyExpressions ? printDerivedDependencyRead("__kRuntime.browserState") : ""}
    return (record.effect.dependencies ?? []).map(id => {
      const value = __kRuntime.browserState.get(id)
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive")
      return value
    })
  }
  function invoke(record) {
    const token = { active: true }
    record.token = token
    try {
      const effect = record.effect
      const result = modules.get(effect.module)[effect.handler](createEffectContext(__kRuntime.browserState, effect.states, __kRuntime.commitDom, effect.scope, () => active && token.active && record.token === token))
      if (effect.cleanup && typeof result === "function") record.cleanup = result
      else if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  async function cleanup(record) {
    if (record.token) record.token.active = false
    record.token = undefined
    const current = record.cleanup
    record.cleanup = undefined
    if (!current) return
    try { await current() } catch (error) { console.error(error) }
  }
  let disposal
  return async function dispose() {
    if (disposal) return disposal
    disposal = (async () => {
      active = false
      unsubscribe?.()
      pending.clear()
      for (const record of records) if (record.token) record.token.active = false
      if (flushing) await flushing
      for (const record of records) await cleanup(record)
    })()
    return disposal
  }
}`
}

function printOwnedNavigableEffectEntry(effects, output, handlerModules, assetsDirectory, base) {
  const hasItemDependencies = effects.some(effect => effect.itemDependencies?.length)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-effect.js")))}`,
    ...(hasDependencyExpressions ? [`import { evaluateCollectionExpression as __kEvaluateDependency } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-collection-selector.js")))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
export const mountLayoutEffects = () => mount("layout")
export const mountRouteEffects = () => mount("route")
function mount(lifetime) {
  let active = true
  let flushing
  let order = 0
  const selectedEffects = effects.map((effect, index) => ({ effect, index })).filter(entry => entry.effect.lifetime === lifetime)
  const records = new Set()
  const owners = new Map()
  const listTemplates = new Map()
  const registrations = new WeakMap()
  const dependencies = new Map()
  const pending = new Set()
  const startedCleanups = new Set()
  let scheduled = false
  for (const template of selectedEffects) {
    if (template.effect.list) listTemplates.set(template.effect.owner, template)
    else {
      const record = createRecord(template, !template.effect.owner)
      if (template.effect.owner) owners.set(template.effect.owner, record)
    }
  }
  const unsubscribeCommitter = selectedEffects.some(({ effect }) => effect.dependencies?.length) ? __kRuntime.registerCommitter(id => {
    if (!active) return
    for (const record of dependencies.get(id) ?? []) if (record.mounted) pending.add(record)
    schedule()
  }) : undefined
  const unsubscribeMount = __kRuntime.registerMountHook(mountOwned)
  const unsubscribeUnmount = __kRuntime.registerUnmountHook(unmountOwned)
  ${hasItemDependencies ? `const unsubscribeItems = [...new Set(selectedEffects.filter(({ effect }) => effect.itemDependencies?.length).map(({ effect }) => effect.listState))].map(listState => __kRuntime.registerListItemHook(listState, root => {
    if (!active) return
    for (const record of registrations.get(root) ?? []) if (record.mounted && record.effect.itemDependencies) pending.add(record)
    schedule()
  }))
  ` : ""}for (const record of records) if (record.mounted) start(record)
  mountOwned(document)
  function createRecord(template, mounted = true) {
    const record = { ...template, order: order++, mounted, marker: undefined, version: 0, values: undefined, cleanup: undefined, disposal: undefined, token: undefined }
    records.add(record)
    registerDependencies(record)
    return record
  }
  function registerDependencies(record) {
    for (const id of record.effect.dependencies ?? []) {
      const subscribers = dependencies.get(id) ?? new Set()
      subscribers.add(record)
      dependencies.set(id, subscribers)
    }
  }
  function unregisterDependencies(record) {
    for (const id of record.effect.dependencies ?? []) {
      const subscribers = dependencies.get(id)
      subscribers?.delete(record)
      if (!subscribers?.size) dependencies.delete(id)
    }
  }
  function mountOwned(root) {
    if (!active) return
    for (const marker of matching(root)) {
      if (!marker.isConnected) continue
      if (marker.dataset.kEffects) {
        if (registrations.has(marker)) continue
        const rowRecords = JSON.parse(marker.dataset.kEffects).flatMap(owner => {
          const template = listTemplates.get(owner)
          if (!template) return []
          const record = createRecord(template)
          record.marker = marker
          start(record)
          return [record]
        })
        if (rowRecords.length) registrations.set(marker, rowRecords)
        continue
      }
      const record = owners.get(marker.dataset.kEffect)
      if (record && !record.mounted) mountRecord(record, marker)
    }
  }
  function unmountOwned(root) {
    if (!active) return
    for (const marker of matching(root)) {
      const rowRecords = registrations.get(marker)
      if (rowRecords) {
        for (const record of rowRecords) unmountRecord(record, true)
        registrations.delete(marker)
        continue
      }
      const record = owners.get(marker.dataset.kEffect)
      if (record?.marker === marker) unmountRecord(record)
    }
  }
  function matching(root) {
    const selector = "template[data-k-effect],[data-k-effects]"
    return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
  }
  function mountRecord(record, marker) {
    record.mounted = true
    record.marker = marker
    const version = ++record.version
    const begin = () => {
      if (active && record.mounted && record.version === version && marker.isConnected) start(record)
    }
    if (record.disposal) record.disposal.then(begin)
    else begin()
  }
  function unmountRecord(record, dynamic = false) {
    if (!record.mounted) return
    record.mounted = false
    record.marker = undefined
    record.version++
    pending.delete(record)
    if (dynamic) {
      unregisterDependencies(record)
      records.delete(record)
    }
    void cleanup(record)
  }
  function start(record) {
    try {
      record.values = readDependencies(record)
      invoke(record)
    } catch (error) {
      console.error(error)
    }
  }
  function schedule() {
    if (!pending.size || scheduled || flushing) return
    scheduled = true
    queueMicrotask(flush)
  }
  async function flush() {
    scheduled = false
    if (!active) return pending.clear()
    const operation = (async () => {
      const changed = []
      const selected = [...pending].filter(record => record.mounted).sort((left, right) => left.index - right.index || left.order - right.order)
      pending.clear()
      for (const record of selected) {
        try {
          const values = readDependencies(record)
          if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) changed.push([record, record.version])
        } catch (error) {
          console.error(error)
        }
      }
      for (const [record] of changed) await cleanup(record)
      if (active) for (const [record, version] of changed) if (record.mounted && record.version === version) {
        try {
          record.values = readDependencies(record)
          invoke(record)
        } catch (error) {
          record.values = undefined
          console.error(error)
        }
      }
    })()
    flushing = operation
    try { await operation } finally {
      if (flushing === operation) flushing = undefined
      if (active) schedule()
    }
  }
  function readDependencies(record) {
${hasDependencyExpressions ? printDerivedDependencyRead("__kRuntime.browserState") : ""}
    const values = (record.effect.dependencies ?? []).map(id => {
      const value = __kRuntime.browserState.get(id)
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive")
      return value
    })
    ${hasItemDependencies ? `if (record.effect.itemDependencies) {
      const item = JSON.parse(record.marker.dataset.kEffectItem)
      for (const field of record.effect.itemDependencies) {
        const value = item[field]
        if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error(\`useEffect() keyed item dependency "\${field}" must remain a JSON-safe primitive\`)
        values.push(value)
      }
    }` : ""}
    return values
  }
  function invoke(record) {
    const token = { active: true }
    record.token = token
    try {
      const effect = record.effect
      const scope = effect.list
        ? Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, value?.type === "list-item" ? JSON.parse(record.marker.dataset.kEffectItem) : value]))
        : effect.scope
      const result = modules.get(effect.module)[effect.handler](createEffectContext(__kRuntime.browserState, effect.states, __kRuntime.commitDom, scope, () => active && token.active && record.token === token))
      if (effect.cleanup && typeof result === "function") record.cleanup = result
      else if (result && typeof result.then === "function") result.catch(error => console.error(error))
    } catch (error) {
      console.error(error)
    }
  }
  function cleanup(record) {
    if (record.token) record.token.active = false
    record.token = undefined
    if (record.disposal) return record.disposal
    const current = record.cleanup
    record.cleanup = undefined
    if (!current) return Promise.resolve()
    const disposal = (async () => {
      try { await current() } catch (error) { console.error(error) }
    })()
    record.disposal = disposal
    startedCleanups.add(disposal)
    disposal.finally(() => {
      startedCleanups.delete(disposal)
      if (record.disposal === disposal) record.disposal = undefined
    })
    return disposal
  }
  let disposal
  return async function dispose() {
    if (disposal) return disposal
    disposal = (async () => {
      active = false
      unsubscribeCommitter?.()
      ${hasItemDependencies ? "for (const unsubscribe of unsubscribeItems) unsubscribe()\n      " : ""}unsubscribeMount()
      unsubscribeUnmount()
      pending.clear()
      for (const record of records) if (record.token) record.token.active = false
      if (flushing) await flushing
      const mounted = [...records].filter(record => record.mounted).sort((left, right) => left.index - right.index || left.order - right.order)
      for (const record of mounted) {
        record.mounted = false
        await cleanup(record)
      }
      await Promise.all([...startedCleanups])
      records.clear()
    })()
    return disposal
  }
}`
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

function printDerivedDependencyRead(state) {
  return `    if (record.effect.dependencyExpressions) return record.effect.dependencyExpressions.map(expression => {
      const value = __kEvaluateDependency(expression, undefined, undefined, name => ${state}.get(record.effect.dependencyStates[name]))
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() derived dependency must remain a JSON-safe primitive")
      return value
    })`
}

function printOwnedEffectEntry(imports, effects, entries) {
  const hasItemDependencies = effects.some(effect => effect.itemDependencies?.length)
  const hasOrdinaryDependencies = effects.some(effect => effect.dependencies?.length)
  const hasDependencyExpressions = effects.some(effect => effect.dependencyExpressions?.length)
  const hasRowState = effects.some(effect => JSON.stringify([effect.dependencies, effect.dependencyStates, effect.states, effect.scope]).includes("$k"))
  return `${imports.join("\n")}
const effects = ${inlineJson(effects)}
const modules = new Map([${entries}])
${hasItemDependencies ? "let order = 0\n" : ""}const records = effects.map((effect, index) => effect.list ? undefined : createRecord(effect, index)).filter(Boolean)
const listTemplates = new Map(effects.map((effect, index) => effect.list ? [effect.owner, { effect, index }] : undefined).filter(Boolean))
const owners = new Map(records.filter(record => record.effect.owner).map(record => [record.effect.owner, record]))
const listRegistrations = new WeakMap()
const mountedRecords = new Set(records.filter(record => record.mounted))
const dependencies = new Map()
const pending = new Set()
let scheduled = false
let flushing = false
let active = true
for (const record of records) registerDependencies(record)
function createRecord(effect, index${hasRowState ? ", marker" : ""}) {
  return { effect: ${hasRowState ? "marker ? specializeRowEffect(effect, marker) : effect" : "effect"}, index, ${hasItemDependencies ? "order: order++, " : ""}mounted: !effect.owner, marker: undefined, version: 0, values: undefined, cleanup: undefined, disposal: undefined, token: undefined }
}
${hasRowState ? `function specializeRowEffect(effect, marker) {
  const path = marker.dataset.kRowPath
  const id = value => typeof value === "string" ? value.replace("$k", path) : value
  const capture = value => value?.type === "state" || value?.type === "setter" || value?.type === "ref" ? { ...value, id: id(value.id) } : value?.type === "array" ? { ...value, value: value.value.map(capture) } : value?.type === "object" ? { ...value, value: value.value.map(([key, entry]) => [key, capture(entry)]) } : value
  return { ...effect, dependencies: effect.dependencies?.map(id), dependencyStates: effect.dependencyStates && Object.fromEntries(Object.entries(effect.dependencyStates).map(([name, value]) => [name, id(value)])), states: Object.fromEntries(Object.entries(effect.states).map(([name, value]) => [name, id(value)])), scope: Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, capture(value)])) }
}
` : ""}
function registerDependencies(record) {
  for (const id of record.effect.dependencies ?? []) {
  const subscribers = dependencies.get(id) ?? new Set()
  subscribers.add(record)
  dependencies.set(id, subscribers)
  }
}
function unregisterDependencies(record) {
  for (const id of record.effect.dependencies ?? []) {
    const subscribers = dependencies.get(id)
    subscribers?.delete(record)
    if (!subscribers?.size) dependencies.delete(id)
  }
}
${hasItemDependencies ? `if (${hasOrdinaryDependencies}) ` : ""}__kRuntime.registerCommitter(id => {
  if (!active) return
  for (const record of dependencies.get(id) ?? []) if (record.mounted) pending.add(record)
  schedule()
})
${hasItemDependencies ? `for (const listState of new Set(effects.filter(effect => effect.itemDependencies?.length).map(effect => effect.listState))) __kRuntime.registerListItemHook(listState, root => {
  if (!active) return
  for (const record of listRegistrations.get(root) ?? []) if (record.mounted && record.effect.itemDependencies) pending.add(record)
  schedule()
})
` : ""}__kRuntime.registerMountHook(root => {
  if (!active) return
  for (const marker of matching(root)) {
    if (marker.dataset.kEffects) {
      if (listRegistrations.has(marker)) continue
      const rowRecords = JSON.parse(marker.dataset.kEffects).map(owner => {
        const template = listTemplates.get(owner)
        if (!template) throw new Error("Keyed row effect template was not emitted")
        const record = createRecord(template.effect, template.index${hasRowState ? ", marker" : ""})
        registerDependencies(record)
        mount(record, marker)
        return record
      })
      listRegistrations.set(marker, rowRecords)
      continue
    }
    const record = owners.get(marker.dataset.kEffect)
    if (!record?.mounted) mount(record, marker)
  }
})
__kRuntime.registerUnmountHook(root => {
  if (root === document) {
    if (!active) return
    active = false
    pending.clear()
    for (const record of [...mountedRecords]) unmount(record, record.effect.list)
    return
  }
  for (const marker of matching(root)) {
    const rowRecords = listRegistrations.get(marker)
    if (rowRecords) {
      for (const record of rowRecords) unmount(record, true)
      listRegistrations.delete(marker)
      continue
    }
    const record = owners.get(marker.dataset.kEffect)
    if (record?.marker === marker) unmount(record)
  }
})
for (const record of records) if (record.mounted) start(record)
__kRuntime.mountDom(document)
addEventListener("pagehide", event => {
  if (!event.persisted) __kRuntime.unmountDom(document)
})
function matching(root) {
  const selector = "template[data-k-effect],[data-k-effects]"
  return [...(root.matches?.(selector) ? [root] : []), ...(root.querySelectorAll?.(selector) ?? [])]
}
function mount(record, marker) {
  record.mounted = true
  record.marker = marker
  mountedRecords.add(record)
  const version = ++record.version
  const begin = () => {
    if (!active || !record.mounted || record.version !== version || !marker.isConnected) return
    start(record)
  }
  if (record.disposal) record.disposal.then(begin)
  else begin()
}
function unmount(record, dynamic = false) {
  if (!record.mounted) return
  record.mounted = false
  record.marker = undefined
  mountedRecords.delete(record)
  if (dynamic) unregisterDependencies(record)
  record.version++
  pending.delete(record)
  invokeCleanup(record)
}
function start(record) {
  try {
    record.values = readDependencies(record)
    invoke(record)
  } catch (error) {
    console.error(error)
  }
}
function schedule() {
  if (!pending.size || scheduled || flushing) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return pending.clear()
  flushing = true
  try {
    const selected = [...pending].filter(record => record.mounted).sort((left, right) => left.index - right.index${hasItemDependencies ? " || left.order - right.order" : ""})
    pending.clear()
    const changed = []
    for (const record of selected) {
      try {
        const values = readDependencies(record)
        if (!record.values || values.some((value, index) => !Object.is(value, record.values[index]))) changed.push([record, record.version])
      } catch (error) {
        console.error(error)
      }
    }
    for (const [record] of changed) await invokeCleanup(record)
    if (active) for (const [record, version] of changed) if (record.mounted && record.version === version) {
      try {
        record.values = readDependencies(record)
        invoke(record)
      } catch (error) {
        record.values = undefined
        console.error(error)
      }
    }
  } finally {
    flushing = false
    if (active) schedule()
  }
}
function readDependencies(record) {
${hasDependencyExpressions ? printDerivedDependencyRead("browserState") : ""}
  const values = (record.effect.dependencies ?? []).map(id => {
    const value = browserState.get(id)
    if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive")
    return value
  })
  ${hasItemDependencies ? `if (record.effect.itemDependencies) {
    const item = JSON.parse(record.marker.dataset.kEffectItem)
    for (const field of record.effect.itemDependencies) {
      const value = item[field]
      if (value !== null && typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0))) throw new Error(\`useEffect() keyed item dependency "\${field}" must remain a JSON-safe primitive\`)
      values.push(value)
    }
  }` : ""}
  return values
}
function invoke(record) {
  const token = { active: true }
  record.token = token
  try {
    const effect = record.effect
    const scope = effect.list
      ? Object.fromEntries(Object.entries(effect.scope).map(([name, value]) => [name, value?.type === "list-item" ? JSON.parse(record.marker.dataset.kEffectItem) : value]))
      : effect.scope
    const result = modules.get(effect.module)[effect.handler](createEffectContext(browserState, effect.states, commitDom, scope, () => active && token.active && record.token === token))
    if (effect.cleanup && typeof result === "function") record.cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
function invokeCleanup(record) {
  if (record.token) record.token.active = false
  record.token = undefined
  if (record.disposal) return record.disposal
  const cleanup = record.cleanup
  record.cleanup = undefined
  if (!cleanup) return Promise.resolve()
  const disposal = (async () => {
    try {
      await cleanup()
    } catch (error) {
      console.error(error)
    }
  })()
  record.disposal = disposal
  disposal.finally(() => {
    if (record.disposal === disposal) record.disposal = undefined
  })
  return disposal
}`
}

function printSingleDependencyEffect(imports, effect, hasCleanup) {
  const disposal = hasCleanup ? `
const dispose = root => {
  if (root !== document || !active) return
  active = false
  pending = false
  invokeCleanup()
}
if (__kRuntime.registerUnmountHook) __kRuntime.registerUnmountHook(dispose)
addEventListener("pagehide", event => {
  if (event.persisted) return
  if (__kRuntime.unmountDom) __kRuntime.unmountDom(document)
  else dispose(document)
})` : ""
  return `${imports.join("\n")}
const effect = ${inlineJson(effect)}
const dependency = effect.dependencies[0]
let value
let cleanup
let active = true
let pending = false
let scheduled = false
let running = false
__kRuntime.registerCommitter(id => {
  if (active && id === dependency) {
    pending = true
    schedule()
  }
})
try {
  value = readDependency()
  invoke()
} catch (error) {
  console.error(error)
}
function schedule() {
  if (!pending || scheduled || running) return
  scheduled = true
  queueMicrotask(flush)
}
async function flush() {
  scheduled = false
  if (!active) return
  let next
  try {
    next = readDependency()
  } catch (error) {
    console.error(error)
    return
  }
  pending = false
  if (Object.is(next, value)) return
  value = next
  running = true
  try {
    await invokeCleanup()
    if (active) invoke()
  } finally {
    running = false
    if (active) schedule()
  }
}
function readDependency() {
  const next = browserState.get(dependency)
  if (next !== null && typeof next !== "string" && typeof next !== "boolean" && !(typeof next === "number" && Number.isFinite(next) && !Object.is(next, -0))) throw new Error("useEffect() dependency state must remain a JSON-safe primitive")
  return next
}
function invoke() {
  try {
    const result = __kEffectModule0[effect.handler](createEffectContext(browserState, effect.states, commitDom, effect.scope))
    if (effect.cleanup && typeof result === "function") cleanup = result
    else if (result && typeof result.then === "function") result.catch(error => console.error(error))
  } catch (error) {
    console.error(error)
  }
}
async function invokeCleanup() {
  const current = cleanup
  cleanup = undefined
  if (!current) return
  try {
    await current()
  } catch (error) {
    console.error(error)
  }
}${disposal}`
}

function printParamEntry(schema, params, searchParams, searchParamsWritable, output, assetsDirectory, base, runtimeName, navigable) {
  const hasSearch = searchParams.length || searchParamsWritable
  const signature = hasSearch ? "pathname, search" : "pathname"
  const prefix = navigable ? `export function initializeParams(${signature}) {\n${searchParamsWritable ? "globalThis.__kSetSearchParams = setSearchParams\n" : ""}` : `${schema ? "let pathname = location.pathname\n" : ""}${hasSearch ? "let search = location.search\n" : ""}`
  const suffix = navigable ? "\n}" : ""
  const pathname = schema ? `const base = ${inlineJson(browserPath(base).slice(1).split("/").filter(Boolean).map(segment => decodeURIComponent(segment)))}
const schema = ${inlineJson(schema.segments)}
const params = ${inlineJson(params)}
let path = pathname
if (base.length) {
  const pathSegments = path.slice(1).split("/")
  if (pathSegments.length < base.length || base.some((segment, index) => decodeSegment(pathSegments[index], false) !== segment)) throw new Error("Runtime route is outside the configured base")
  path = "/" + pathSegments.slice(base.length).join("/")
}
if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
const segments = path.slice(1).split("/")
if (segments.length !== schema.length) throw new Error("Runtime route does not match its fallback pattern")
const values = Object.create(null)
for (let index = 0; index < schema.length; index++) {
  const segment = schema[index]
  const value = decodeSegment(segments[index], Boolean(segment.param))
  if (segment.literal !== undefined && value !== segment.literal) throw new Error("Runtime route literal does not match")
  if (segment.param) values[segment.param] = value
}
for (const param of params) {
  const value = values[param.name]
  browserState.set(param.id, value)
  commitDom(param.id, value)
}
function decodeSegment(raw, param) {
  if (param && /%(?:2f|5c)/i.test(raw)) throw new Error("Runtime route parameter contains an encoded separator")
  let value
  try { value = decodeURIComponent(raw) } catch { throw new Error("Runtime route parameter has malformed encoding") }
  const decodedDots = value.replace(/%2e/gi, ".")
  if (param && (!value || value === "." || value === ".." || decodedDots === "." || decodedDots === ".." || /[\\/?#]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159) || /%(?:2f|5c)/i.test(value))) throw new Error("Runtime route parameter is invalid")
  return value
}
` : ""
  const searchInitializer = searchParamsWritable && searchParams.length ? `function initializeSearch(search) {
const query = new URLSearchParams(search)
for (const param of ${inlineJson(searchParams)}) {
  const value = query.get(param.name)
  browserState.set(param.id, value)
  commitDom(param.id, value)
}
}
` : ""
  const query = searchParams.length ? searchParamsWritable ? "initializeSearch(search)\n" : `const query = new URLSearchParams(search)
for (const param of ${inlineJson(searchParams)}) {
  const value = query.get(param.name)
  browserState.set(param.id, value)
  commitDom(param.id, value)
}
` : ""
  const writer = searchParamsWritable ? `
function setSearchParams(update, replace) {
  const next = update(new URLSearchParams(location.search))
  if (!(next instanceof URLSearchParams)) throw new Error("React Router search parameter updater must return URLSearchParams")
  const url = new URL(location.href)
  url.search = next.toString()
  history[replace ? "replaceState" : "pushState"](null, "", url)
  ${searchParams.length ? "initializeSearch(location.search)" : ""}
}
${navigable ? "" : `globalThis.__kSetSearchParams = setSearchParams
addEventListener("popstate", () => ${searchParams.length ? "initializeSearch(location.search)" : "undefined"})`}` : ""
  return `import { browserState, commitDom } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, runtimeName)))}
${searchInitializer}${prefix}${pathname}${query}${suffix}${writer}`
}

function hasCaptureType(value, type) {
  if (!value || typeof value !== "object") return false
  if (value.type === type) return true
  return (Array.isArray(value) ? value : Object.values(value)).some(entry => hasCaptureType(entry, type))
}

function hasNestedCaptureState(value, insideCapture = false) {
  if (!value || typeof value !== "object") return false
  if (value.type === "state") return insideCapture
  if (value.type === "array") return value.value.some(entry => hasNestedCaptureState(entry, true))
  if (value.type === "object") return value.value.some(([, entry]) => hasNestedCaptureState(entry, true))
  return (Array.isArray(value) ? value : Object.values(value)).some(entry => hasNestedCaptureState(entry, false))
}

export function specializeRuntime(source, events, hasStateSeed) {
  const specialized = specializeEvents(source, events)
  if (hasStateSeed) return specialized
  return specialized
    .replace("  const initialState = document.body.dataset.kState\n", "")
    .replace(/^  if \(initialState\).*\n/m, "")
}

async function writeJavaScript(file, source, minify, define) {
  const code = minify || define ? (await transform(source, { define, format: "esm", legalComments: "none", minify, target: "es2022" })).code : source
  await writeFile(file, code)
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

export function parseDevPort(value) {
  if (value === undefined || value.trim() === "") return 3000
  if (!/^\d+$/.test(value)) throw new Error(`Invalid dev server port: ${value}`)
  const port = Number(value)
  if (port > 65535) throw new Error(`Invalid dev server port: ${value}`)
  return port
}

export function parseDevHost(value) {
  return value?.trim() || "127.0.0.1"
}

export async function dev({ port = parseDevPort(process.env.PORT), host = parseDevHost(process.env.HOST) } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid dev server port: ${port}`)
  if (typeof host !== "string" || !host.trim()) throw new Error(`Invalid dev server host: ${host}`)
  const base = normalizeBase((await loadConfig()).base)

  let buildError
  let revision = 0
  const session = randomUUID()
  try {
    await build({ minify: false })
    revision++
  } catch (error) {
    buildError = errorText(error)
    console.error(error)
  }

  const clients = new Set()

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost")
      const rawPathname = url.pathname
      const pathname = decodeURIComponent(rawPathname)
      if (pathname === "/__kudzu_reload") {
        response.writeHead(200, {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive"
        })
        response.write(": connected\n\n")
        clients.add(response)
        request.on("close", () => clients.delete(response))
        if (buildError) sendEvent(response, "build-error", buildError)
        else if (url.searchParams.get("session") !== session || url.searchParams.get("revision") !== String(revision)) sendEvent(response, "reload")
        return
      }
      if (pathname === "/__kudzu_dev.js") {
        response.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" })
        response.end(await readFile(new URL("./dev-state.js", import.meta.url)))
        return
      }

      const relativePath = stripBaseStrict(pathname, decodeURIComponent(base)).replace(/^\/+/, "")
      let file = resolve(outputDirectory, relativePath)
      if (!file.startsWith(`${outputDirectory}${sep}`) && file !== outputDirectory) throw new Error("Invalid path")

      if ((await exists(file)) && (await stat(file)).isDirectory()) file = join(file, "index.html")
      if (!(await exists(file)) && !extname(file)) file = join(file, "index.html")
      let matchedRoute
      if (!(await exists(file)) && !buildError) {
        const plan = JSON.parse(await readFile(join(workDirectory, "kudzu-plan.json"), "utf8"))
        const rewrite = plan.rewrites?.find(entry => runtimePathValues(rawPathname, entry, browserPath(base)))
        if (rewrite) {
          file = resolve(outputDirectory, rewrite.file)
          matchedRoute = rewrite.pattern
        }
      }
      const isHtml = extname(file) === ".html"
      const content = isHtml
        ? injectDevClient(buildError ? errorPage(buildError) : await readFile(file, "utf8"), session, revision, buildError ? [] : await devSchema(withBase(base, stripBaseStrict(pathname, decodeURIComponent(base))), matchedRoute))
        : await readFile(file)
      response.writeHead(200, {
        "content-type": contentType(file),
        "cache-control": "no-store"
      })
      response.end(content)
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" })
      response.end("Not found")
    }
  })

  const listeningPort = await listenDevServer(server, port, host)
  console.log(`Kudzu dev server: http://${host}:${listeningPort}`)

  let timer
  let rebuilding = false
  let pending = false
  let changedFile
  const rebuild = async () => {
    if (rebuilding) {
      pending = true
      return
    }
    rebuilding = true
    do {
      pending = false
      try {
        await build({ quiet: true, minify: false })
        buildError = undefined
        revision++
        console.log(`Rebuilt after ${changedFile ?? "source change"}`)
        for (const client of clients) sendEvent(client, "reload")
      } catch (error) {
        buildError = errorText(error)
        console.error(error)
        for (const client of clients) sendEvent(client, "build-error", buildError)
      }
    } while (pending)
    rebuilding = false
  }
  const watcher = watch(sourceDirectory, { recursive: true })
  for await (const event of watcher) {
    changedFile = event.filename
    clearTimeout(timer)
    timer = setTimeout(rebuild, 80)
  }
}

async function listenDevServer(server, port, host) {
  let candidate = port
  while (true) {
    try {
      await new Promise((resolve, reject) => {
        const onError = error => {
          server.off("listening", onListening)
          reject(error)
        }
        const onListening = () => {
          server.off("error", onError)
          resolve()
        }
        server.once("error", onError)
        server.once("listening", onListening)
        server.listen(candidate, host)
      })
      return server.address().port
    } catch (error) {
      if (error.code !== "EADDRINUSE" || candidate === 0 || candidate === 65535) throw error
      console.log(`Port ${candidate} is in use, trying ${candidate + 1}`)
      candidate++
    }
  }
}

function injectDevClient(html, session, revision, schema) {
  return `${html}${devClient(session, revision, schema).replace("binding|list|native", "binding|deps|list|native")}`
}

function stripBaseStrict(path, base) {
  if (!base) return path
  if (path === base) return "/"
  if (path.startsWith(`${base}/`)) return path.slice(base.length)
  throw new Error("Path is outside the configured base")
}

async function devSchema(pathname, matchedRoute) {
  try {
    const plan = JSON.parse(await readFile(join(workDirectory, "kudzu-plan.json"), "utf8"))
    const route = matchedRoute ?? (pathname.replace(/\/(?:index\.html)?$/, "") || "/")
    return stateSchema(plan.routes.find(entry => entry.route === route)?.states ?? [])
  } catch {
    return []
  }
}

function runtimePathValues(pathname, rewrite, base) {
  try {
    let path = stripBrowserBase(pathname, base)
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1)
    const rawSegments = path.slice(1).split("/")
    if (rawSegments.length !== rewrite.segments.length) return undefined
    const values = Object.create(null)
    for (let index = 0; index < rewrite.segments.length; index++) {
      const segment = rewrite.segments[index]
      const value = decodeRuntimeSegment(rawSegments[index], Boolean(segment.param))
      if (segment.literal !== undefined && value !== segment.literal) return undefined
      if (segment.param) values[segment.param] = value
    }
    return values
  } catch {
    return undefined
  }
}

function stripBrowserBase(path, base) {
  if (!base) return path
  const pathSegments = path.slice(1).split("/")
  const baseSegments = base.slice(1).split("/").map(segment => decodeURIComponent(segment))
  if (pathSegments.length < baseSegments.length || baseSegments.some((segment, index) => decodeRuntimeSegment(pathSegments[index], false) !== segment)) throw new Error("Path is outside the configured base")
  return `/${pathSegments.slice(baseSegments.length).join("/")}`
}

function decodeRuntimeSegment(raw, param) {
  if (param && /%(?:2f|5c)/i.test(raw)) throw new Error("Encoded separator")
  const value = decodeURIComponent(raw)
  const decodedDots = value.replace(/%2e/gi, ".")
  if (param && (!value || value === "." || value === ".." || decodedDots === "." || decodedDots === ".." || /[\\/?#]/.test(value) || [...value].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159) || /%(?:2f|5c)/i.test(value))) throw new Error("Invalid runtime parameter")
  return value
}

function inlineJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029")
}

function errorPage(error) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kudzu build error</title></head><body><div id="__kudzu_error" role="alert" aria-live="assertive" style="position:fixed;inset:0;overflow:auto;padding:2rem;background:#200;color:#fff;font:16px/1.5 ui-monospace,monospace"><strong>Kudzu build error</strong><pre style="white-space:pre-wrap">${escapeHtml(error)}</pre></div></body></html>`
}

function errorText(error) {
  return String(error?.message ?? error)
}

function sendEvent(response, event, data = "") {
  response.write(`event: ${event}\n${String(data).replaceAll("\r", "").split("\n").map(line => `data: ${line}\n`).join("")}\n`)
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;").replaceAll("'", "&#39;")
}

async function compile(file, sourceFiles, sourceIndex, staticFiles, importedAssets, cssModules, base, workerReferences) {
  const source = sourceIndex.get(file)
  const nativeHandlers = []
  const effectHandlers = []
  const reactiveBindings = []
  const listExpressions = []
  const clientImports = new Set()
  const handlerPath = `handlers/${relative(sourceDirectory, file).replaceAll(sep, "/").replace(/\.(?:ts|tsx)$/, ".js")}`
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "@kudzujs/core"
    },
    transformers: { before: [createKudzuTransformer(nativeHandlers, effectHandlers, reactiveBindings, listExpressions, assetPath(base, `assets/${handlerPath}`), file, sourceFiles, sourceIndex, staticFiles, importedAssets, cssModules, base, clientImports, workerReferences)] },
    reportDiagnostics: true
  })

  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) {
    throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  }
  const packageReference = emittedPackageReference(result.outputText, file, new Set(["react", "react-router-dom"]))
  if (packageReference) throw new Error(`${relative(root, file)} Runtime ${packageReference} module references are not supported`)

  const output = compiledPath(file)
  await mkdir(resolve(output, ".."), { recursive: true })
  await writeFile(output, result.outputText)

  if (!nativeHandlers.length && !effectHandlers.length && !reactiveBindings.length && !listExpressions.length) return undefined
  const callbacks = [...nativeHandlers, ...effectHandlers]
  const moduleSource = [
    printClientImports([...callbacks, ...reactiveBindings].flatMap(handler => handler.imports ?? []), handlerPath),
    ...callbacks.map(handler => printNativeHandler(handler)),
    ...reactiveBindings.map(entry => printReactiveBinding(entry)),
    ...listExpressions.map(entry => printListExpression(entry))
  ].join("\n")
  const moduleResult = ts.transpileModule(moduleSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true
  })
  const moduleErrors = moduleResult.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (moduleErrors.length) throw new Error(moduleErrors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  return { path: handlerPath, code: moduleResult.outputText, hasNativeHandlers: nativeHandlers.length > 0, hasEffects: effectHandlers.length > 0, clientImports: [...clientImports], hasPackageImports: [...callbacks, ...reactiveBindings].some(entry => entry.imports?.some(import_ => import_.package)) }
}

function emittedPackageReference(source, file, packages) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS)
  let found
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && packages.has(node.moduleSpecifier.text)) found = node.moduleSpecifier.text
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require") && ts.isStringLiteral(node.arguments[0]) && packages.has(node.arguments[0].text)) found = node.arguments[0].text
    if (!found) ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

function reachableSourceFiles(entries, sourceFiles, sourceIndex) {
  const reachable = new Set()
  const queue = [...entries]
  while (queue.length) {
    const file = queue.pop()
    if (reachable.has(file)) continue
    reachable.add(file)
    const sourceFile = parseSourceFile(file, sourceIndex.get(file))
    const visit = node => {
      const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && runtimeModuleReference(node) && node.moduleSpecifier
      if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith(".") && !isStaticImport(specifier.text)) {
        try { queue.push(resolveSourceImport(file, specifier.text, sourceFiles)) } catch {}
      }
      const worker = relativeWorkerCandidate(node, sourceFile)
      if (worker && ts.isStringLiteral(worker.url.arguments[0]) && worker.url.arguments[0].text.endsWith(".worker.ts")) {
        try { queue.push(resolveSourceImport(file, worker.url.arguments[0].text, sourceFiles)) } catch {}
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return [...reachable].sort()
}

function normalizeReactRouterSyntax(sourceFile, factory, context, base) {
  const links = new Set()
  const params = new Set()
  const searchHooks = new Set()
  const navigateHooks = new Set()
  for (const statement of sourceFile.statements) {
    if ((ts.isExportDeclaration(statement) || ts.isImportDeclaration(statement)) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "react-router-dom") {
      if (ts.isExportDeclaration(statement)) throw sourceNodeError(statement, sourceFile, "React Router exports are not supported; import Link directly where it renders")
      const clause = statement.importClause
      if (clause?.isTypeOnly) continue
      if (!clause) throw sourceNodeError(statement, sourceFile, "Side-effect React Router imports are not supported")
      if (clause.name) throw sourceNodeError(clause.name, sourceFile, "React Router default imports are not supported; use named Link, useParams, useSearchParams, or useNavigate imports")
      const bindings = clause.namedBindings
      if (!bindings || ts.isNamespaceImport(bindings)) throw sourceNodeError(bindings ?? statement, sourceFile, "React Router namespace imports are not supported; use named Link, useParams, useSearchParams, or useNavigate imports")
      for (const entry of bindings.elements) {
        if (entry.isTypeOnly) continue
        const imported = (entry.propertyName ?? entry.name).text
        if (imported === "NavLink") throw sourceNodeError(entry, sourceFile, "React Router NavLink active-route semantics cannot be erased to a native anchor")
        if (imported === "Link") links.add(entry.name.text)
        else if (imported === "useParams") params.add(entry.name.text)
        else if (imported === "useSearchParams") searchHooks.add(entry.name.text)
        else if (imported === "useNavigate") navigateHooks.add(entry.name.text)
        else throw sourceNodeError(entry, sourceFile, `React Router ${imported} is not supported; only named Link, useParams, useSearchParams, and useNavigate imports can be lowered`)
      }
    }
  }
  if (!links.size && !params.size && !searchHooks.size && !navigateHooks.size) return sourceFile

  let searchHelper = "__kUseSearchParam"
  while (sourceFile.text.includes(searchHelper)) searchHelper += "_"
  let searchWriterHelper = "__kUseSearchParamsWriter"
  while (sourceFile.text.includes(searchWriterHelper)) searchWriterHelper += "_"
  const searchDeclarations = new Set()
  const searchReads = new Map()
  const searchWrites = new Map()
  const searchObjects = []
  const collectSearchHooks = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && searchHooks.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
      const declaration = node.parent
      const statement = declaration?.parent?.parent
      const owner = nearestFunction(node)
      const first = ts.isVariableDeclaration(declaration) && ts.isArrayBindingPattern(declaration.name) ? declaration.name.elements[0] : undefined
      const second = ts.isVariableDeclaration(declaration) && ts.isArrayBindingPattern(declaration.name) ? declaration.name.elements[1] : undefined
      if (node.questionDotToken || node.arguments.length || node.typeArguments?.length || !ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !isLocalConst(declaration) || !owner || statement?.parent !== owner.body || !ts.isBindingElement(first) || !ts.isIdentifier(first.name) || declaration.name.elements.length > 2 || second && (!ts.isBindingElement(second) || !ts.isIdentifier(second.name))) {
        throw sourceNodeError(node, sourceFile, "React Router useSearchParams must initialize one top-level const [params] or [params, setParams] binding")
      }
      const entry = { name: first.name.text, setter: second?.name.text, declaration, statement, owner }
      searchDeclarations.add(declaration)
      searchObjects.push(entry)
    }
    ts.forEachChild(node, collectSearchHooks)
  }
  collectSearchHooks(sourceFile)
  const localBindingShadowed = (node, entry, name = entry.name) => {
    for (let current = node.parent; current && current !== entry.owner; current = current.parent) {
      if (isFunctionLike(current) && (current.parameters.some(parameter => bindingNames(parameter.name).includes(name)) || functionVarDeclaresName(current, name))) return true
      if (ts.isBlock(current) && current.statements.some(statement => statement !== entry.statement && statementDeclaresName(statement, name))) return true
      if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statement !== entry.statement && statementDeclaresName(statement, name)))) return true
      if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(name)) return true
      if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, name)) return true
    }
    return false
  }
  for (const entry of searchObjects) {
    const collectReads = node => {
      if (ts.isIdentifier(node) && node.text === entry.name && isReferenceIdentifier(node) && !localBindingShadowed(node, entry)) {
        if (entry.setter && ts.isCallExpression(node.parent) && node.parent.arguments.includes(node) && ts.isIdentifier(node.parent.expression) && node.parent.expression.text === entry.setter) return
        const property = node.parent
        const call = property?.parent
        const declaration = call?.parent
        const statement = declaration?.parent?.parent
        if (!ts.isPropertyAccessExpression(property) || property.expression !== node || property.name.text !== "get" || !ts.isCallExpression(call) || call.expression !== property || call.questionDotToken || call.typeArguments?.length || call.arguments.length !== 1 || !ts.isStringLiteral(call.arguments[0])) {
          throw sourceNodeError(node, sourceFile, 'React Router search parameters only support direct get("static-name") reads')
        }
        if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== call || !ts.isIdentifier(declaration.name) || !isLocalConst(declaration) || statement?.parent !== entry.owner.body) {
          throw sourceNodeError(call, sourceFile, "React Router search parameter get() must directly initialize one top-level const identifier")
        }
        searchReads.set(call, call.arguments[0])
        return
      }
      ts.forEachChild(node, collectReads)
    }
    collectReads(entry.owner.body)
    if (!entry.setter) continue
    const collectWrites = node => {
      if (ts.isIdentifier(node) && node.text === entry.setter && isReferenceIdentifier(node) && !localBindingShadowed(node, entry, entry.setter)) {
        const call = node.parent
        if (!ts.isCallExpression(call) || call.expression !== node || call.questionDotToken || call.typeArguments?.length || nearestFunction(call) === entry.owner) throw sourceNodeError(node, sourceFile, "React Router search parameter setters may only be called directly from a nested browser callback")
        if (call.arguments.length < 1 || call.arguments.length > 2) throw sourceNodeError(call, sourceFile, "React Router search parameter setters require one inline updater and optional { replace: true }")
        const updater = unwrapExpression(call.arguments[0])
        if ((!ts.isArrowFunction(updater) && !ts.isFunctionExpression(updater)) || updater.asteriskToken || updater.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || updater.parameters.length !== 1 || !ts.isIdentifier(updater.parameters[0].name)) throw sourceNodeError(call.arguments[0], sourceFile, "React Router search parameter setters require one synchronous inline updater with one identifier parameter")
        let replace = false
        if (call.arguments.length === 2) {
          const options = unwrapExpression(call.arguments[1])
          const property = ts.isObjectLiteralExpression(options) && options.properties.length === 1 ? options.properties[0] : undefined
          const name = property && ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined
          if (name !== "replace" || property.initializer.kind !== ts.SyntaxKind.TrueKeyword) throw sourceNodeError(call.arguments[1], sourceFile, "React Router search parameter setters only support exactly { replace: true } as a second argument")
          replace = true
        }
        searchWrites.set(call, { updater, replace })
        return
      }
      ts.forEachChild(node, collectWrites)
    }
    collectWrites(entry.owner.body)
  }

  const navigateDeclarations = new Set()
  const navigateCalls = new Map()
  const navigateFunctions = []
  const collectNavigateHooks = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && navigateHooks.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
      const declaration = node.parent
      const statement = declaration?.parent?.parent
      const owner = nearestFunction(node)
      if (node.questionDotToken || node.arguments.length || node.typeArguments?.length || !ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !ts.isIdentifier(declaration.name) || !isLocalConst(declaration) || !owner || statement?.parent !== owner.body) {
        throw sourceNodeError(node, sourceFile, "React Router useNavigate must initialize one top-level const identifier in a component")
      }
      const entry = { name: declaration.name.text, declaration, statement, owner }
      navigateDeclarations.add(declaration)
      navigateFunctions.push(entry)
    }
    ts.forEachChild(node, collectNavigateHooks)
  }
  collectNavigateHooks(sourceFile)
  for (const entry of navigateFunctions) {
    const collectCalls = node => {
      if (ts.isIdentifier(node) && node.text === entry.name && isReferenceIdentifier(node) && !localBindingShadowed(node, entry)) {
        const call = node.parent
        if (!ts.isCallExpression(call) || call.expression !== node || call.questionDotToken || call.typeArguments?.length || nearestFunction(call) === entry.owner) {
          throw sourceNodeError(node, sourceFile, "React Router navigate bindings may only be called directly from a nested browser callback")
        }
        if (call.arguments.length < 1 || call.arguments.length > 2 || !ts.isStringLiteral(call.arguments[0])) {
          throw sourceNodeError(call, sourceFile, 'React Router useNavigate requires a static root-relative navigate("/path") destination')
        }
        const destination = call.arguments[0].text
        const pathname = destination.match(/^[^?#]*/)[0]
        let decoded
        try { decoded = decodeURIComponent(pathname) } catch { throw sourceNodeError(call.arguments[0], sourceFile, 'React Router useNavigate requires a safe static root-relative navigate("/path") destination') }
        if (!destination.startsWith("/") || destination.startsWith("//") || /%(?:2f|5c)/i.test(pathname) || /[\\\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw sourceNodeError(call.arguments[0], sourceFile, 'React Router useNavigate requires a safe static root-relative navigate("/path") destination')
        let method = "assign"
        if (call.arguments.length === 2) {
          const options = unwrapExpression(call.arguments[1])
          const property = ts.isObjectLiteralExpression(options) && options.properties.length === 1 ? options.properties[0] : undefined
          const name = property && ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined
          if (name !== "replace" || property.initializer.kind !== ts.SyntaxKind.TrueKeyword) throw sourceNodeError(call.arguments[1], sourceFile, 'React Router useNavigate only supports exactly { replace: true } as a second argument')
          method = "replace"
        }
        navigateCalls.set(call, { method, destination: withBase(base, destination) })
        return
      }
      ts.forEachChild(node, collectCalls)
    }
    collectCalls(entry.owner.body)
  }

  const routerProps = new Set(["discover", "end", "prefetch", "preventScrollReset", "relative", "reloadDocument", "replace", "state", "viewTransition"])
  const attributes = attributesNode => {
    const output = []
    let destination
    for (const property of attributesNode.properties) {
      if (ts.isJsxSpreadAttribute(property)) throw sourceNodeError(property, sourceFile, "React Router Link does not support spread attributes during native anchor lowering")
      const name = property.name.text
      if (name === "href") throw sourceNodeError(property, sourceFile, "React Router Link must not declare href; Kudzu derives it from to")
      if (routerProps.has(name)) throw sourceNodeError(property, sourceFile, `React Router Link prop ${JSON.stringify(name)} cannot be erased to a native anchor`)
      if (name !== "to") {
        output.push(ts.visitEachChild(property, visitor, context))
        continue
      }
      if (destination !== undefined) throw sourceNodeError(property, sourceFile, "React Router Link requires exactly one to attribute")
      if (!property.initializer || !ts.isStringLiteral(property.initializer)) throw sourceNodeError(property, sourceFile, 'React Router Link requires a static root-relative to="/path"')
      destination = property.initializer.text
      const pathname = destination.match(/^[^?#]*/)[0]
      let decoded
      try { decoded = decodeURIComponent(pathname) } catch { throw sourceNodeError(property.initializer, sourceFile, 'React Router Link requires a safe static root-relative to="/path"') }
      if (!destination.startsWith("/") || destination.startsWith("//") || /%(?:2f|5c)/i.test(pathname) || /[\\\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw sourceNodeError(property.initializer, sourceFile, 'React Router Link requires a safe static root-relative to="/path"')
      output.push(factory.createJsxAttribute(factory.createIdentifier("href"), factory.createStringLiteral(withBase(base, destination))))
    }
    if (destination === undefined) throw sourceNodeError(attributesNode.parent, sourceFile, "React Router Link requires exactly one static root-relative to attribute")
    return factory.updateJsxAttributes(attributesNode, output)
  }
  const importedLink = tag => ts.isIdentifier(tag) && links.has(tag.text) && !isShadowedIdentifier(tag, sourceFile)
  const visitor = node => {
    if (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => searchDeclarations.has(declaration) || navigateDeclarations.has(declaration))) {
      const declarations = node.declarationList.declarations.flatMap(declaration => {
        if (navigateDeclarations.has(declaration)) return []
        if (!searchDeclarations.has(declaration)) return [ts.visitEachChild(declaration, visitor, context)]
        const entry = searchObjects.find(candidate => candidate.declaration === declaration)
        if (!entry?.setter) return []
        return [factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, factory.createCallExpression(factory.createIdentifier(searchWriterHelper), undefined, []))]
      })
      if (!declarations.length) return undefined
      return factory.updateVariableStatement(node, node.modifiers, factory.updateVariableDeclarationList(node.declarationList, declarations))
    }
    if (ts.isCallExpression(node) && searchReads.has(node)) return factory.createCallExpression(factory.createIdentifier(searchHelper), undefined, [searchReads.get(node)])
    if (ts.isCallExpression(node) && searchWrites.has(node)) {
      const { updater, replace } = searchWrites.get(node)
      return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("globalThis"), "__kSetSearchParams"), undefined, [ts.visitNode(updater, visitor), replace ? factory.createTrue() : factory.createFalse()])
    }
    if (ts.isCallExpression(node) && navigateCalls.has(node)) {
      const { method, destination } = navigateCalls.get(node)
      return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createPropertyAccessExpression(factory.createIdentifier("globalThis"), "location"), method), undefined, [factory.createStringLiteral(destination)])
    }
    if (ts.isJsxElement(node) && importedLink(node.openingElement.tagName)) {
      const opening = factory.updateJsxOpeningElement(node.openingElement, factory.createIdentifier("a"), node.openingElement.typeArguments, attributes(node.openingElement.attributes))
      const closing = factory.updateJsxClosingElement(node.closingElement, factory.createIdentifier("a"))
      return factory.updateJsxElement(node, opening, ts.visitNodes(node.children, visitor), closing)
    }
    if (ts.isJsxSelfClosingElement(node) && importedLink(node.tagName)) return factory.updateJsxSelfClosingElement(node, factory.createIdentifier("a"), node.typeArguments, attributes(node.attributes))
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && params.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
      if (node.questionDotToken || node.arguments.length || (node.typeArguments?.length ?? 0) > 1) throw sourceNodeError(node, sourceFile, "React Router useParams must be called directly without runtime arguments and with at most one type argument")
      return node
    }
    if (ts.isIdentifier(node) && links.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router Link imports may only be used as direct JSX elements")
    if (ts.isIdentifier(node) && params.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useParams imports may only be called directly")
    if (ts.isIdentifier(node) && searchHooks.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useSearchParams imports may only initialize the supported top-level tuple binding")
    if (ts.isIdentifier(node) && navigateHooks.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile)) throw sourceNodeError(node, sourceFile, "React Router useNavigate imports may only initialize the supported top-level navigate binding")
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "react-router-dom") {
      const clause = node.importClause
      if (!clause || clause.isTypeOnly) return node
      const bindings = clause.namedBindings
      if (!bindings || !ts.isNamedImports(bindings)) return node
      const elements = bindings.elements.filter(entry => entry.isTypeOnly || !["Link", "useParams", "useSearchParams", "useNavigate"].includes((entry.propertyName ?? entry.name).text))
      if (!elements.length) return undefined
      return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, clause.isTypeOnly, undefined, factory.updateNamedImports(bindings, elements)), node.moduleSpecifier, node.attributes)
    }
    return ts.visitEachChild(node, visitor, context)
  }
  const normalized = ts.visitNode(sourceFile, visitor)
  if (!params.size && !searchHooks.size) return normalized
  const imports = [
    ...[...params].map(name => factory.createImportSpecifier(false, name === "useParams" ? undefined : factory.createIdentifier("useParams"), factory.createIdentifier(name))),
    ...(searchReads.size ? [factory.createImportSpecifier(false, factory.createIdentifier("useSearchParam"), factory.createIdentifier(searchHelper))] : []),
    ...(searchObjects.some(entry => entry.setter) ? [factory.createImportSpecifier(false, factory.createIdentifier("useSearchParamsWriter"), factory.createIdentifier(searchWriterHelper))] : [])
  ]
  const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(imports)), factory.createStringLiteral("@kudzujs/core"))
  const statements = [...normalized.statements]
  statements.splice(statements.findLastIndex(statement => ts.isImportDeclaration(statement)) + 1, 0, declaration)
  return factory.updateSourceFile(normalized, statements)
}

function normalizeClsxSyntax(sourceFile, factory, context) {
  const names = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "clsx") continue
    if (statement.importClause?.name) names.add(statement.importClause.name.text)
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) if (!entry.isTypeOnly && (entry.propertyName ?? entry.name).text === "clsx") names.add(entry.name.text)
  }
  if (!names.size) return sourceFile

  const lower = node => {
    node = unwrapExpression(node)
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node)) return node
    if (node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) return factory.createStringLiteral("")
    if (ts.isConditionalExpression(node)) return factory.updateConditionalExpression(node, node.condition, node.questionToken, lower(node.whenTrue), node.colonToken, lower(node.whenFalse))
    if (ts.isArrayLiteralExpression(node)) return combine(node.elements.map(lower))
    if (ts.isObjectLiteralExpression(node)) return combine(node.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || property.name && ts.isComputedPropertyName(property.name)) throw sourceNodeError(property, sourceFile, "clsx() object arguments require ordinary key/value properties")
      const name = property.name
      const value = name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) ? name.text : undefined
      if (value === undefined) throw sourceNodeError(property, sourceFile, "clsx() object keys must be identifiers or literals")
      return factory.createConditionalExpression(property.initializer, undefined, factory.createStringLiteral(value), undefined, factory.createStringLiteral(""))
    }))
    throw sourceNodeError(node, sourceFile, "clsx() arguments must be string/number literals, literal arrays, literal objects, or conditionals")
  }
  const combine = entries => entries.length ? entries.reduce((result, entry) => factory.createBinaryExpression(factory.createBinaryExpression(result, factory.createToken(ts.SyntaxKind.PlusToken), factory.createStringLiteral(" ")), factory.createToken(ts.SyntaxKind.PlusToken), entry)) : factory.createStringLiteral("")

  const visitor = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && names.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) return combine(node.arguments.map(lower))
    if (ts.isIdentifier(node) && names.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) throw sourceNodeError(node, sourceFile, "clsx imports may only be called directly")
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "clsx") {
      const clause = node.importClause
      if (!clause || clause.isTypeOnly) return node
      let bindings = clause.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        const elements = bindings.elements.filter(entry => entry.isTypeOnly || (entry.propertyName ?? entry.name).text !== "clsx")
        bindings = elements.length ? factory.updateNamedImports(bindings, elements) : undefined
      }
      const defaultName = clause.name && names.has(clause.name.text) ? undefined : clause.name
      if (!defaultName && !bindings) return undefined
      return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, clause.isTypeOnly, defaultName, bindings), node.moduleSpecifier, node.attributes)
    }
    return ts.visitEachChild(node, visitor, context)
  }
  return ts.visitNode(sourceFile, visitor)
}

function analyzeZustandStores(sourceFile) {
  const createNames = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "zustand") continue
    const bindings = statement.importClause?.namedBindings
    if (statement.importClause?.name || !bindings || !ts.isNamedImports(bindings)) throw sourceNodeError(statement, sourceFile, "Zustand migration input requires a named create import")
    for (const entry of bindings.elements) {
      if (entry.isTypeOnly) continue
      if ((entry.propertyName ?? entry.name).text !== "create") throw sourceNodeError(entry, sourceFile, "Only Zustand create is supported")
      createNames.add(entry.name.text)
    }
  }
  const stores = new Map()
  if (!createNames.size) return stores
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !ts.isCallExpression(declaration.initializer) || !ts.isIdentifier(declaration.initializer.expression) || !createNames.has(declaration.initializer.expression.text)) continue
      const callback = declaration.initializer.arguments[0]
      if (declaration.initializer.arguments.length !== 1 || !callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) || callback.parameters.length !== 1 || !ts.isIdentifier(callback.parameters[0].name) || callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(declaration.initializer, sourceFile, "Zustand create() requires one synchronous initializer with one set parameter")
      const body = unwrapExpression(callback.body)
      if (!ts.isObjectLiteralExpression(body)) throw sourceNodeError(callback.body, sourceFile, "Zustand create() initializer must return one object literal")
      const data = []
      const actions = new Map()
      for (const property of body.properties) {
        if (!ts.isPropertyAssignment(property) || !property.name || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) throw sourceNodeError(property, sourceFile, "Zustand store entries must be ordinary properties")
        const name = property.name.text
        const value = unwrapExpression(property.initializer)
        if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) actions.set(name, value)
        else data.push({ name, value })
      }
      if (data.length !== 1 || !isSerializableStateLiteral(data[0].value)) throw sourceNodeError(body, sourceFile, "Zustand migration stores require exactly one directly serializable data property")
      if (!actions.size) throw sourceNodeError(body, sourceFile, "Zustand migration stores require at least one action")
      for (const [name, action] of actions) {
        if (action.asteriskToken || action.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(action, sourceFile, `Zustand action ${JSON.stringify(name)} must be synchronous`)
        const capture = [...nativeCaptureNames(action, new Map())].find(entry => entry !== callback.parameters[0].name.text)
        if (capture) throw sourceNodeError(action, sourceFile, `Zustand action ${JSON.stringify(name)} cannot capture ${JSON.stringify(capture)}`)
        const validateAction = node => {
          if (ts.isAwaitExpression(node) || ts.isYieldExpression(node) || ts.isNewExpression(node)) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} must be synchronous`)
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["then", "catch", "finally"].includes(node.expression.name.text)) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} cannot schedule asynchronous updates`)
          if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === callback.parameters[0].name.text && !isShadowedIdentifier(node.expression, action)) {
            if (nearestFunction(node) !== action) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} must call set directly`)
            if (node.arguments.length !== 1) throw sourceNodeError(node, sourceFile, `Zustand action ${JSON.stringify(name)} set() requires exactly one partial update`)
          }
          ts.forEachChild(node, validateAction)
        }
        validateAction(action.body)
      }
      stores.set(declaration.name.text, { name: declaration.name.text, setName: callback.parameters[0].name.text, field: data[0].name, initialValue: data[0].value, actions, declaration })
    }
  }
  const visit = node => {
    const recognized = ts.isIdentifier(node) && ts.isCallExpression(node.parent) && node.parent.expression === node && [...stores.values()].some(store => store.declaration.initializer === node.parent)
    if (ts.isIdentifier(node) && createNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !recognized) throw sourceNodeError(node, sourceFile, "Zustand create must directly initialize an exported const store")
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return stores
}

function normalizeZustandMigrationSyntax(sourceFile, factory, context) {
  const stores = analyzeZustandStores(sourceFile)
  if (!stores.size) {
    const declaration = sourceFile.statements.find(statement => ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier) && statement.moduleSpecifier.text === "zustand" && !statement.importClause?.isTypeOnly)
    if (declaration) throw sourceNodeError(declaration, sourceFile, "Zustand create must directly initialize an exported const store")
    return sourceFile
  }
  const identity = name => `${relative(sourceDirectory, sourceFile.fileName).replaceAll(sep, "/")}#${name}`
  const visitor = node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && stores.has(node.name.text)) {
      const store = stores.get(node.name.text)
      return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, factory.createCallExpression(factory.createIdentifier("__kCreateStore"), undefined, [
        factory.createStringLiteral(identity(store.name)),
        factory.createStringLiteral(store.field),
        store.initialValue,
        factory.createArrayLiteralExpression([...store.actions.keys()].map(name => factory.createStringLiteral(name)))
      ]))
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "zustand") return undefined
    return ts.visitEachChild(node, visitor, context)
  }
  const normalized = ts.visitNode(sourceFile, visitor)
  const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier("__kCreateStore"))])), factory.createStringLiteral("@kudzujs/core"))
  const statements = [...normalized.statements]
  statements.splice(statements.findLastIndex(statement => ts.isImportDeclaration(statement)) + 1, 0, declaration)
  return factory.updateSourceFile(normalized, statements)
}

function normalizeReactMigrationSyntax(sourceFile, factory, context, importedCollections = new Set()) {
  const supported = new Set(["createContext", "useContext", "useEffect", "useId", "useReducer", "useRef", "useState"])
  const erased = new Set(["forwardRef", "memo", "useCallback", "useMemo"])
  const aliases = new Map()
  const reactObjects = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text !== "react") continue
    if (statement.importClause?.name) reactObjects.add(statement.importClause.name.text)
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamespaceImport(bindings)) reactObjects.add(bindings.name.text)
    if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) {
      const imported = (entry.propertyName ?? entry.name).text
      if (!entry.isTypeOnly && (supported.has(imported) || erased.has(imported))) aliases.set(entry.name.text, imported)
      else if (!entry.isTypeOnly && /^use[A-Z]/.test(imported)) throw sourceNodeError(entry, sourceFile, `React ${imported} is not supported by Kudzu migration input`)
    }
  }
  if (!aliases.size && !reactObjects.size) return sourceFile

  const migrationCallName = call => {
    if (ts.isIdentifier(call.expression) && aliases.has(call.expression.text) && !isShadowedIdentifier(call.expression, sourceFile)) return aliases.get(call.expression.text)
    if (ts.isPropertyAccessExpression(call.expression) && ts.isIdentifier(call.expression.expression) && reactObjects.has(call.expression.expression.text) && !isShadowedIdentifier(call.expression.expression, sourceFile)) return call.expression.name.text
    return undefined
  }
  const ownerStateNames = owner => {
    const names = new Set()
    const collect = node => {
      if (node !== owner && isFunctionLike(node)) return
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ["useReducer", "useState"].includes(migrationCallName(node.initializer))) {
        const state = node.name.elements[0]
        if (state && ts.isBindingElement(state) && ts.isIdentifier(state.name)) names.add(state.name.text)
      }
      ts.forEachChild(node, collect)
    }
    collect(owner)
    return names
  }

  const validate = node => {
    if (ts.isTypeNode(node)) return
    if (ts.isIdentifier(node) && aliases.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !(ts.isCallExpression(node.parent) && node.parent.expression === node)) throw sourceNodeError(node, sourceFile, `Aliased React ${aliases.get(node.text)} must be called directly`)
    if (ts.isIdentifier(node) && reactObjects.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, sourceFile) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node)) throw sourceNodeError(node, sourceFile, "React default or namespace imports may only be used for direct supported members or React.Fragment")
    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && reactObjects.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
      const name = node.name.text
      if (name !== "Fragment" && !(ts.isCallExpression(node.parent) && node.parent.expression === node && (supported.has(name) || erased.has(name)))) throw sourceNodeError(node, sourceFile, `React.${name} is not supported; use a directly supported hook call or React.Fragment`)
    }
    ts.forEachChild(node, validate)
  }
  validate(sourceFile)

  const memoLocals = new Map()
  const collectMemoLocals = node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && migrationCallName(node.initializer) === "useMemo") {
      if (!isLocalConst(node)) throw sourceNodeError(node, sourceFile, "React useMemo() local values must use const declarations")
      const callback = node.initializer.arguments[0]
      if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
        const expression = lowerReactMemoCollectionExpression(reactMemoExpression(callback), factory)
        const owner = nearestFunction(node)
        if (owner && expression) {
          const entries = memoLocals.get(owner) ?? new Map()
          if (entries.has(node.name.text)) throw sourceNodeError(node.name, sourceFile, `React useMemo() local ${JSON.stringify(node.name.text)} must be unique within its component`)
          entries.set(node.name.text, { declaration: node, expression })
          memoLocals.set(owner, entries)
        }
      }
    }
    ts.forEachChild(node, collectMemoLocals)
  }
  collectMemoLocals(sourceFile)
  const memoLocalIsShadowed = (node, owner, entry) => {
    if (isShadowedByParameter(node, owner)) return true
    const declarationStatement = entry.declaration.parent?.parent
    for (let current = node.parent; current && current !== owner; current = current.parent) {
      if (ts.isFunctionExpression(current) && current.name?.text === node.text) return true
      if (ts.isBlock(current) && current.statements.some(statement => statement !== declarationStatement && statementDeclaresName(statement, node.text))) return true
      if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statement !== declarationStatement && statementDeclaresName(statement, node.text)))) return true
      if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(node.text)) return true
      if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, node.text)) return true
    }
    return false
  }
  for (const [owner, entries] of memoLocals) for (const [name, entry] of entries) {
    const visit = node => {
      if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && nearestFunctionLike(node) !== owner && !memoLocalIsShadowed(node, owner, entry)) throw sourceNodeError(node, sourceFile, `React useMemo() local ${JSON.stringify(name)} cannot be captured by a nested function`)
      ts.forEachChild(node, visit)
    }
    visit(owner.body)
  }

  const required = new Set()
  const imported = new Set()
  const visitor = node => {
    if (ts.isVariableStatement(node)) {
      const entries = memoLocals.get(nearestFunction(node))
      if (entries) {
        for (const declaration of node.declarationList.declarations) if (ts.isIdentifier(declaration.name) && entries.has(declaration.name.text) && declaration.initializer) ts.visitNode(declaration.initializer, visitor)
        const declarations = node.declarationList.declarations.filter(declaration => !ts.isIdentifier(declaration.name) || !entries.has(declaration.name.text))
        if (!declarations.length) return undefined
        if (declarations.length !== node.declarationList.declarations.length) return factory.updateVariableStatement(node, node.modifiers, factory.updateVariableDeclarationList(node.declarationList, declarations.map(declaration => ts.visitEachChild(declaration, visitor, context))))
      }
    }
    if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
      const owner = nearestFunctionLike(node)
      const entry = memoLocals.get(owner)?.get(node.text)
      if (entry && !memoLocalIsShadowed(node, owner, entry)) return ts.visitNode(cloneAst(entry.expression, factory, context), visitor)
    }
    if (ts.isCallExpression(node)) {
      const name = migrationCallName(node)
      if (name === "forwardRef") return ts.visitNode(lowerReactForwardRef(node, sourceFile, factory), visitor)
      if (name === "memo") {
        if (node.arguments.length !== 1 || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]) || ts.isIdentifier(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React memo() requires exactly one function component or component identifier")
        if (ts.isIdentifier(node.arguments[0]) && isShadowedIdentifier(node.arguments[0], sourceFile)) throw sourceNodeError(node.arguments[0], sourceFile, "React memo() component identifiers must resolve to an unshadowed same-file top-level function")
        const component = ts.isIdentifier(node.arguments[0]) ? reactMemoComponentExpression(node.arguments[0], sourceFile, factory, context) : node.arguments[0]
        if (!component) throw sourceNodeError(node.arguments[0], sourceFile, "React memo() identifiers must name a same-file top-level function component")
        return ts.visitNode(component, visitor)
      }
      if (name === "useCallback") {
        if (node.arguments.length !== 2 || !ts.isArrayLiteralExpression(node.arguments[1]) || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React useCallback() requires an inline function and a literal dependency array")
        const dependency = node.arguments[1].elements.find(entry => !isReactCallbackDependency(entry))
        if (dependency) throw sourceNodeError(dependency, sourceFile, "React useCallback() dependencies must be identifiers or primitive literals")
        const dependencies = new Set(node.arguments[1].elements.map(unwrapExpression).filter(ts.isIdentifier).map(entry => entry.text))
        const owner = nearestFunction(node)
        const stale = owner && [...ownerStateNames(owner)].find(state => referenceIdentifiers(node.arguments[0], state).length && !dependencies.has(state))
        if (stale) throw sourceNodeError(node.arguments[1], sourceFile, `React useCallback() must list captured state ${JSON.stringify(stale)} as a dependency`)
        return ts.visitNode(node.arguments[0], visitor)
      }
      if (name === "useMemo") {
        if (node.arguments.length !== 2 || !ts.isArrayLiteralExpression(node.arguments[1]) || !(ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))) throw sourceNodeError(node, sourceFile, "React useMemo() requires an inline function and a literal dependency array")
        const callback = node.arguments[0]
        if (callback.parameters.length || callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(callback, sourceFile, "React useMemo() callback must be synchronous and parameterless")
        const dependency = node.arguments[1].elements.find(entry => !isReactCallbackDependency(entry))
        if (dependency) throw sourceNodeError(dependency, sourceFile, "React useMemo() dependencies must be identifiers or primitive literals")
        const expression = lowerReactMemoCollectionExpression(reactMemoExpression(callback), factory)
        const dependencies = new Set(node.arguments[1].elements.map(unwrapExpression).filter(ts.isIdentifier).map(entry => entry.text))
        const owner = nearestFunction(node)
        const states = owner ? ownerStateNames(owner) : new Set()
        const collection = expression && reactMemoCollection(expression, states, importedCollections, sourceFile)
        if (!expression || !collection && !isPureReactMemoExpression(expression)) throw sourceNodeError(callback.body, sourceFile, "React useMemo() callback must return one pure expression or analyzable collection pipeline")
        if (!collection) {
          const unsupported = [...reactMemoReferenceNames(expression)].find(reference => !states.has(reference))
          if (unsupported) throw sourceNodeError(expression, sourceFile, `React useMemo() pure expressions may only reference direct local state; found ${JSON.stringify(unsupported)}`)
        }
        const collectionDependencies = collection ? new Set([...collection.selectorStates, ...(collection.static ? [] : [collection.state.text])]) : undefined
        const stale = collection
          ? [...collectionDependencies].find(state => !dependencies.has(state))
          : [...states].find(state => referenceIdentifiers(expression, state).length && !dependencies.has(state))
        if (stale) throw sourceNodeError(node.arguments[1], sourceFile, `React useMemo() must list captured state ${JSON.stringify(stale)} as a dependency`)
        return ts.visitNode(expression, visitor)
      }
      if (name && supported.has(name)) {
        required.add(name)
        return factory.updateCallExpression(node, factory.createIdentifier(name), node.typeArguments, ts.visitNodes(node.arguments, visitor))
      }
    }
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "react") {
      const clause = node.importClause
      if (!clause) return node
      let bindings = clause.namedBindings
      if (bindings && ts.isNamedImports(bindings)) {
        const entries = []
        for (const entry of bindings.elements) {
          const name = (entry.propertyName ?? entry.name).text
          if (entry.isTypeOnly) continue
          if (!entry.isTypeOnly && erased.has(name)) continue
          if (!entry.isTypeOnly && supported.has(name)) {
            if (imported.has(name)) continue
            imported.add(name)
            required.add(name)
            entries.push(factory.createImportSpecifier(false, undefined, factory.createIdentifier(name)))
          } else {
            entries.push(entry)
          }
        }
        bindings = entries.length ? factory.updateNamedImports(bindings, entries) : undefined
      }
      if (!clause.name && !bindings) return undefined
      return factory.updateImportDeclaration(node, node.modifiers, factory.updateImportClause(clause, clause.isTypeOnly, clause.name, bindings), node.moduleSpecifier, node.attributes)
    }
    return ts.visitEachChild(node, visitor, context)
  }
  let normalized = ts.visitNode(sourceFile, visitor)
  const missing = [...required].filter(name => !imported.has(name)).sort()
  if (!missing.length) return normalized
  for (const name of missing) {
    const collision = sourceFile.statements.some(statement => statementDeclaresName(statement, name) || ts.isImportDeclaration(statement) && importDeclarationNames(statement).includes(name) && statement.moduleSpecifier.text !== "react")
    if (collision) throw sourceNodeError(sourceFile, sourceFile, `React.${name} cannot be normalized because ${JSON.stringify(name)} is already declared`)
  }
  const declaration = factory.createImportDeclaration(undefined, factory.createImportClause(false, undefined, factory.createNamedImports(missing.map(name => factory.createImportSpecifier(false, undefined, factory.createIdentifier(name))))), factory.createStringLiteral("react"))
  const statements = [...normalized.statements]
  const lastImport = statements.findLastIndex(statement => ts.isImportDeclaration(statement))
  statements.splice(lastImport + 1, 0, declaration)
  normalized = factory.updateSourceFile(normalized, statements)
  return normalized
}

function lowerReactForwardRef(call, sourceFile, factory) {
  const declaration = call.parent
  const statement = declaration?.parent?.parent
  if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== call || !ts.isIdentifier(declaration.name) || !statement || !ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || statement.parent !== sourceFile) {
    throw sourceNodeError(call, sourceFile, "React forwardRef() must directly initialize one top-level const component")
  }
  if (call.arguments.length !== 1 || !ts.isArrowFunction(call.arguments[0]) && !ts.isFunctionExpression(call.arguments[0])) throw sourceNodeError(call, sourceFile, "React forwardRef() requires exactly one inline render function")
  const callback = call.arguments[0]
  if (callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(callback, sourceFile, "React forwardRef() render function must be synchronous and cannot be a generator")
  if (callback.parameters.length !== 2) throw sourceNodeError(callback, sourceFile, "React forwardRef() render function must declare exactly (props, ref)")
  const [props, ref] = callback.parameters
  if (props.dotDotDotToken || props.initializer || !ts.isIdentifier(props.name) && !ts.isObjectBindingPattern(props.name)) throw sourceNodeError(props, sourceFile, "React forwardRef() props must use one identifier or a flat object binding")
  if (ref.dotDotDotToken || ref.initializer || !ts.isIdentifier(ref.name)) throw sourceNodeError(ref, sourceFile, "React forwardRef() ref parameter must be one identifier")

  let elements
  if (ts.isIdentifier(props.name)) {
    elements = [
      factory.createBindingElement(undefined, factory.createIdentifier("ref"), factory.createIdentifier(ref.name.text)),
      factory.createBindingElement(factory.createToken(ts.SyntaxKind.DotDotDotToken), undefined, factory.createIdentifier(props.name.text))
    ]
  } else {
    for (const element of props.name.elements) {
      const property = (element.propertyName ?? element.name)
      if (!ts.isIdentifier(element.name) || property.text === "ref") throw sourceNodeError(element, sourceFile, property.text === "ref" ? "React forwardRef() props must not declare ref; Kudzu supplies ref through the second parameter" : "React forwardRef() props must use one identifier or a flat object binding")
    }
    const rest = props.name.elements.findIndex(element => Boolean(element.dotDotDotToken))
    elements = [...props.name.elements]
    elements.splice(rest < 0 ? elements.length : rest, 0, factory.createBindingElement(undefined, factory.createIdentifier("ref"), factory.createIdentifier(ref.name.text)))
  }

  const last = ts.isBlock(callback.body) ? callback.body.statements.at(-1) : undefined
  let returnCount = 0
  const countReturns = node => {
    if (node !== callback.body && isFunctionLike(node)) return
    if (ts.isReturnStatement(node)) returnCount++
    ts.forEachChild(node, countReturns)
  }
  countReturns(callback.body)
  const returned = ts.isBlock(callback.body)
    ? last && ts.isReturnStatement(last) ? last.expression : undefined
    : callback.body
  const root = returned && unwrapExpression(returned)
  const tag = root && jsxTagName(root)
  if ((ts.isBlock(callback.body) && returnCount !== 1) || !root || !ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root) || !ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) throw sourceNodeError(callback.body, sourceFile, "React forwardRef() render function must directly return one intrinsic JSX element")
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const forwarded = attributes.properties.filter(attribute => ts.isJsxAttribute(attribute) && attribute.name.text === "ref" && ts.isJsxExpression(attribute.initializer) && ts.isIdentifier(attribute.initializer.expression) && attribute.initializer.expression.text === ref.name.text)
  if (forwarded.length !== 1 || referenceIdentifiers(callback.body, ref.name.text).length !== 1) throw sourceNodeError(ref, sourceFile, "React forwardRef() ref must be forwarded exactly once as ref={ref} on the direct intrinsic root")

  const parameter = factory.updateParameterDeclaration(props, props.modifiers, undefined, factory.createObjectBindingPattern(elements), props.questionToken, props.type, undefined)
  return ts.isArrowFunction(callback)
    ? factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, [parameter], callback.type, callback.equalsGreaterThanToken, callback.body)
    : factory.updateFunctionExpression(callback, callback.modifiers, undefined, callback.name, callback.typeParameters, [parameter], callback.type, callback.body)
}

function validateUseIdSyntax(sourceFile) {
  const imported = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && ["@kudzujs/core", "react"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useId"))
  if (!imported) return
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useId" && !isShadowedIdentifier(node.expression, sourceFile)) {
      if (node.arguments.length) throw sourceNodeError(node, sourceFile, "useId() does not accept arguments")
      const declaration = node.parent
      const statement = declaration?.parent?.parent
      const owner = nearestFunction(node)
      if (!ts.isVariableDeclaration(declaration) || declaration.initializer !== node || !ts.isIdentifier(declaration.name) || !statement || !ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || !owner || !ts.isBlock(owner.body) || statement.parent !== owner.body) {
        throw sourceNodeError(node, sourceFile, "useId() must be assigned to one top-level const identifier in a component")
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

function normalizeLazyStateInitializers(sourceFile, factory, context, file, sourceFiles, sourceIndex) {
  const bindings = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || !["react", "@kudzujs/core"].includes(statement.moduleSpecifier.text)) continue
    const named = statement.importClause?.namedBindings
    if (named && ts.isNamedImports(named)) for (const entry of named.elements) {
      const imported = (entry.propertyName ?? entry.name).text
      if (!entry.isTypeOnly && ["useReducer", "useState"].includes(imported) && entry.name.text === imported) bindings.add(imported)
    }
  }
  if (!bindings.size) return sourceFile
  const imports = clientImportBindings(sourceFile, file, sourceFiles)
  const visitor = node => {
    if (bindings.has("useReducer") && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useReducer" && !isShadowedIdentifier(node.expression, sourceFile) && node.arguments.length === 3) {
      const initialArg = node.arguments[1]
      const initializer = node.arguments[2]
      let declaration
      if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) declaration = initializer
      else if (ts.isIdentifier(initializer)) {
        declaration = localComponentDeclaration(sourceFile, initializer.text)
        const binding = imports.get(initializer.text)
        if (!declaration && binding && binding.kind !== "namespace") {
          try {
            declaration = resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, target => parseSourceFile(target, sourceIndex.get(target)), sourceFiles)
          } catch {}
        }
      }
      if (!declaration || declaration.parameters.length !== 1 || !ts.isIdentifier(declaration.parameters[0].name) || declaration.parameters[0].initializer || declaration.parameters[0].dotDotDotToken || declaration.asteriskToken || declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || ts.isFunctionExpression(initializer) && initializer.name) throw sourceNodeError(initializer, sourceFile, "Lazy useReducer() requires one inline, same-file, or relative-imported synchronous one-parameter initializer")
      if (!isSerializableStateLiteral(initialArg)) throw sourceNodeError(initialArg, sourceFile, "Lazy useReducer() initial argument must be directly serializable")
      const expression = reactMemoExpression(declaration)
      const lowered = expression && substituteClone(expression, new Map([[declaration.parameters[0].name.text, initialArg]]), factory, context)
      if (!lowered || !isSerializableStateLiteral(lowered)) throw sourceNodeError(initializer, sourceFile, "Lazy useReducer() initializer must directly return a serializable primitive, plain-object, or array literal derived only from its initial argument")
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [node.arguments[0], synthesizeSerializableStateLiteral(lowered, factory)])
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && bindings.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile) && node.arguments[0] && (ts.isArrowFunction(node.arguments[0]) || ts.isFunctionExpression(node.arguments[0]))) {
      const initializer = node.arguments[0]
      if (node.arguments.length !== 1 || initializer.parameters.length || initializer.asteriskToken || initializer.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || ts.isFunctionExpression(initializer) && initializer.name) throw sourceNodeError(initializer, sourceFile, "Lazy useState() requires one anonymous synchronous zero-parameter initializer")
      const expression = ts.isBlock(initializer.body)
        ? initializer.body.statements.length === 1 && ts.isReturnStatement(initializer.body.statements[0]) ? initializer.body.statements[0].expression : undefined
        : initializer.body
      if (!expression || !isSerializableStateLiteral(expression)) throw sourceNodeError(initializer.body, sourceFile, "Lazy useState() initializer must return one directly serializable primitive, plain-object, or array literal")
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [cloneAst(expression, factory, context)])
    }
    return ts.visitEachChild(node, visitor, context)
  }
  return ts.visitNode(sourceFile, visitor)
}

function importDeclarationNames(statement) {
  const names = []
  if (statement.importClause?.name) names.push(statement.importClause.name.text)
  const bindings = statement.importClause?.namedBindings
  if (bindings && ts.isNamespaceImport(bindings)) names.push(bindings.name.text)
  if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) names.push(entry.name.text)
  return names
}

function isReactCallbackDependency(node) {
  node = unwrapExpression(node)
  return ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword
}

function reactMemoExpression(callback) {
  if (!ts.isBlock(callback.body)) return callback.body
  if (callback.body.statements.length !== 1 || !ts.isReturnStatement(callback.body.statements[0])) return undefined
  return callback.body.statements[0].expression
}

function lowerReactMemoCollectionExpression(expression, factory) {
  if (!expression) return undefined
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && node.arguments.length === 1) {
      return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("Array"), "from"), undefined, [visit(node.expression.expression), node.arguments[0]])
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && ["filter", "flatMap", "slice", "toSorted"].includes(node.expression.name.text)) {
      return factory.updateCallExpression(node, factory.updatePropertyAccessExpression(node.expression, visit(node.expression.expression), node.expression.name), node.typeArguments, node.arguments)
    }
    if (isArrayFromCall(node)) return factory.updateCallExpression(node, node.expression, node.typeArguments, [visit(node.arguments[0]), ...node.arguments.slice(1)])
    return node
  }
  return visit(expression)
}

function reactMemoCollection(expression, states, importedCollections, sourceFile) {
  const setters = new Map([...states].map(state => [state, state]))
  const fail = (node, message) => { throw sourceNodeError(node, sourceFile, message) }
  return renderedCollectionSource(expression, setters, undefined, fail, new Set(), importedCollections, states)
}

function reactMemoComponentExpression(identifier, sourceFile, factory, context) {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === identifier.text && statement.body) {
      const clone = cloneAst(statement, factory, context)
      return factory.createFunctionExpression(clone.modifiers?.filter(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword), clone.asteriskToken, clone.name, clone.typeParameters, clone.parameters, clone.type, clone.body)
    }
    if (!ts.isVariableStatement(statement)) continue
    const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === identifier.text)
    if (declaration?.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) return cloneAst(declaration.initializer, factory, context)
  }
  return undefined
}

function isPureReactMemoExpression(node) {
  node = unwrapExpression(node)
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) return true
  if (ts.isParenthesizedExpression(node)) return isPureReactMemoExpression(node.expression)
  if (ts.isPrefixUnaryExpression(node)) return ![ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) && isPureReactMemoExpression(node.operand)
  if (ts.isBinaryExpression(node)) return node.operatorToken.kind < ts.SyntaxKind.FirstAssignment && isPureReactMemoExpression(node.left) && isPureReactMemoExpression(node.right)
  if (ts.isConditionalExpression(node)) return isPureReactMemoExpression(node.condition) && isPureReactMemoExpression(node.whenTrue) && isPureReactMemoExpression(node.whenFalse)
  if (ts.isTemplateExpression(node)) return node.templateSpans.every(span => isPureReactMemoExpression(span.expression))
  return false
}

function reactMemoReferenceNames(root) {
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && isReferenceIdentifier(node)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return names
}

function createKudzuTransformer(nativeHandlers, effectHandlers, reactiveBindings, listExpressions, handlerUrl, file, sourceFiles, sourceIndex, staticFiles, importedAssets, cssModules, base, clientImports, workerReferences) {
  return context => sourceFile => {
    const factory = context.factory
    const hasLinkElements = /<link/i.test(sourceFile.text)
    const importedStaticCollections = importedSerializableCollections(sourceFile, file, sourceFiles, sourceIndex)
    const importedCollections = new Set(importedStaticCollections.keys())
    sourceFile = normalizeImportedStaticCollections(sourceFile, importedStaticCollections, factory, context)
    ts.setParentRecursive(sourceFile, false)
    sourceFile = normalizeReactRouterSyntax(sourceFile, factory, context, base)
    ts.setParentRecursive(sourceFile, false)
    sourceFile = normalizeClsxSyntax(sourceFile, factory, context)
    ts.setParentRecursive(sourceFile, false)
    sourceFile = normalizeReactMigrationSyntax(sourceFile, factory, context, importedCollections)
    ts.setParentRecursive(sourceFile, false)
    validateUseIdSyntax(sourceFile)
    sourceFile = normalizeLazyStateInitializers(sourceFile, factory, context, file, sourceFiles, sourceIndex)
    ts.setParentRecursive(sourceFile, false)
    sourceFile = normalizeZustandMigrationSyntax(sourceFile, factory, context)
    ts.setParentRecursive(sourceFile, false)
    sourceFile = normalizeRenderControlFlow(sourceFile, factory, context)
    ts.setParentRecursive(sourceFile, false)
    rejectOrdinaryWorkerImports(sourceFile, file, sourceFiles)
    const importBindings = clientImportBindings(sourceFile, file, sourceFiles)
    const packageBindings = packageImportBindings(sourceFile)
    for (const [name] of packageBindings) {
      const references = referenceIdentifiers(sourceFile, name)
      const invalid = references.find(reference => !insideJsxEventHandler(reference, sourceFile))
      if (invalid) throw sourceNodeError(invalid, sourceFile, `Package import ${JSON.stringify(name)} may only be referenced directly inside JSX event handlers`)
    }
    const hasUseEffectImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && ["@kudzujs/core", "react"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useEffect"))
    const importedSources = new Map()
    const importedSource = target => {
      let imported = importedSources.get(target)
      if (!imported) {
        imported = normalizeReactRouterSyntax(parseSourceFile(target, sourceIndex.get(target)), factory, context, base)
        ts.setParentRecursive(imported, false)
        imported = normalizeClsxSyntax(imported, factory, context)
        ts.setParentRecursive(imported, false)
        imported = normalizeReactMigrationSyntax(imported, factory, context, importedSerializableCollectionNames(imported, target, sourceFiles, sourceIndex))
        ts.setParentRecursive(imported, false)
        validateUseIdSyntax(imported)
        imported = normalizeLazyStateInitializers(imported, factory, context, target, sourceFiles, sourceIndex)
        ts.setParentRecursive(imported, false)
        imported = normalizeZustandMigrationSyntax(imported, factory, context)
        ts.setParentRecursive(imported, false)
        imported = normalizeRenderControlFlow(imported, factory, context)
        ts.setParentRecursive(imported, false)
        importedSources.set(target, imported)
      }
      return imported
    }
    const importedCollectionTransforms = new Map()
    const importedCalculationFunctions = new Map()
    for (const [name, binding] of importBindings) {
      if (binding.kind === "namespace") continue
      try {
        importedCollectionTransforms.set(name, resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, target => parseSourceFile(target, sourceIndex.get(target)), sourceFiles))
      } catch {}
    }
    const settersByFunction = new Map()
    const localStateSettersByFunction = new Map()
    const reducersByFunction = new Map()
    const zustandStores = new Map()
    const resolvedZustandStore = entry => {
      const exportName = entry.kind === "default" ? "default" : entry.imported
      const key = `${entry.target}:${exportName}`
      if (zustandStores.has(key)) return zustandStores.get(key)
      const targetSource = parseSourceFile(entry.target, sourceIndex.get(entry.target))
      const store = analyzeZustandStores(targetSource).get(exportName)
      zustandStores.set(key, store)
      return store
    }
    const functions = new Map()
    const customHookFunctionsByOwner = new Map()
    const components = new Map()
    const contexts = new Set()
    const customHooks = new Map()
    const jsxLocalDeclarations = new Map()
    const jsxLocalsByFunction = new Map()
    const listLocalDeclarations = new WeakSet()
    const listLocalUses = new WeakMap()
    const listValues = new WeakMap()
    const listEventItems = new WeakMap()
    const listConditions = new WeakMap()
    const nestedLists = new WeakMap()
    const listEffectEntries = new WeakMap()
    const componentEffectEntries = new WeakMap()
    let usesBehavior = false
    let usesBinding = false
    let usesConditional = false
    let usesList = false
    let usesListEffects = false
    let usesListItem = false
    let usesRowState = false
    let usesRowRef = false
    let usesComponentState = false
    let usesComponentId = false
    let usesComponentRef = false
    let usesComponentEffects = false

    const resolveCustomHook = (binding, call) => {
      const exportName = binding.kind === "default" ? "default" : binding.imported
      const key = `${binding.target}:${exportName}`
      if (customHooks.has(key)) return customHooks.get(key)
      const hook = resolveComponentExport(binding.target, exportName, importedSource, sourceFiles)
      const hookSource = hook.getSourceFile()
      if (hook.parameters.length || hook.asteriskToken || hook.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(hook.body)) throw sourceNodeError(hook, hookSource, "Relative custom hooks must be synchronous zero-argument functions with a block body")
      const returns = hook.body.statements.filter(ts.isReturnStatement)
      const returned = returns.length === 1 && returns[0] === hook.body.statements.at(-1) && returns[0].expression ? unwrapExpression(returns[0].expression) : undefined
      if (!returned || !ts.isObjectLiteralExpression(returned)) throw sourceNodeError(hook.body, hookSource, "Relative custom hooks must end with one direct object return")

      const states = new Map()
      const callbacks = new Map()
      for (const statement of hook.body.statements) {
        if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const)) continue
        for (const declaration of statement.declarationList.declarations) {
          if (ts.isArrayBindingPattern(declaration.name) && declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useState") {
            const [state, setter] = declaration.name.elements
            if (declaration.name.elements.length === 2 && state && setter && ts.isBindingElement(state) && ts.isBindingElement(setter) && ts.isIdentifier(state.name) && ts.isIdentifier(setter.name)) states.set(setter.name.text, state.name.text)
          }
          if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) callbacks.set(declaration.name.text, declaration.initializer)
        }
      }
      const fields = new Set()
      for (const property of returned.properties) {
        if (!ts.isShorthandPropertyAssignment(property)) throw sourceNodeError(property, hookSource, "Relative custom hooks must return direct shorthand bindings")
        fields.add(property.name.text)
      }
      for (const [name, callback] of callbacks) {
        const capture = nativeCaptureNames(callback, states).values().next().value
        if (capture) throw sourceNodeError(callback, hookSource, `Relative custom hook callback ${JSON.stringify(name)} cannot capture private binding ${JSON.stringify(capture)}`)
      }
      const analysis = { callbacks, fields, states }
      customHooks.set(key, analysis)
      return analysis
    }

    const collect = node => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callName = ts.isIdentifier(node.initializer.expression) ? node.initializer.expression.text : ""
        if (callName && /^use[A-Z]/.test(callName) && importBindings.has(callName) && importBindings.get(callName).kind !== "namespace" && !resolvedZustandStore(importBindings.get(callName))) {
          if (!isLocalConst(node) || !ts.isObjectBindingPattern(node.name) || node.initializer.arguments.length) throw sourceNodeError(node, sourceFile, "Relative custom hooks must initialize one top-level const object destructuring with no arguments")
          const hook = resolveCustomHook(importBindings.get(callName), node.initializer)
          const names = new Set()
          for (const element of node.name.elements) {
            if (element.dotDotDotToken || element.propertyName || element.initializer || !ts.isIdentifier(element.name)) throw sourceNodeError(element, sourceFile, "Relative custom hook results must use direct identifier shorthand without aliases, defaults, or rest")
            const name = element.name.text
            if (!hook.fields.has(name)) throw sourceNodeError(element, sourceFile, `Relative custom hook does not directly return ${JSON.stringify(name)}`)
            names.add(name)
          }
          const owner = nearestFunction(node)
          if (!owner) throw sourceNodeError(node, sourceFile, "Relative custom hooks cannot be used outside a Kudzu component")
          const setters = settersByFunction.get(owner) ?? new Map()
          for (const [setter, state] of hook.states) {
            if (names.has(setter) !== names.has(state)) throw sourceNodeError(node.name, sourceFile, `Relative custom hook state ${JSON.stringify(state)} and setter ${JSON.stringify(setter)} must be destructured together`)
            if (names.has(setter)) setters.set(setter, state)
          }
          settersByFunction.set(owner, setters)
          for (const name of names) {
            if (hook.callbacks.has(name)) {
              const callbacks = customHookFunctionsByOwner.get(owner) ?? new Map()
              callbacks.set(name, hook.callbacks.get(name))
              customHookFunctionsByOwner.set(owner, callbacks)
            }
            else if (![...hook.states].some(([setter, state]) => name === setter || name === state)) throw sourceNodeError(node.name, sourceFile, `Relative custom hook result ${JSON.stringify(name)} must be a direct useState value, setter, or callback`)
          }
        }
        if (ts.isIdentifier(node.name) && callName && importBindings.has(callName) && importBindings.get(callName).kind !== "namespace") {
          const storeImport = importBindings.get(callName)
          const store = resolvedZustandStore(storeImport)
          if (store) {
            const selector = node.initializer.arguments[0]
            if (node.initializer.arguments.length !== 1 || !selector || !ts.isArrowFunction(selector) || selector.parameters.length !== 1 || !ts.isIdentifier(selector.parameters[0].name) || !ts.isPropertyAccessExpression(unwrapExpression(selector.body)) || !ts.isIdentifier(unwrapExpression(selector.body).expression) || unwrapExpression(selector.body).expression.text !== selector.parameters[0].name.text) throw sourceNodeError(node.initializer, sourceFile, "Zustand selectors must be direct arrows such as state => state.quantities")
            const selected = unwrapExpression(selector.body).name.text
            const owner = nearestFunction(node)
            if (!owner) throw sourceNodeError(node, sourceFile, "Zustand stores cannot be used outside a Kudzu component")
            const setters = settersByFunction.get(owner) ?? new Map()
            if (selected === store.field) setters.set(`__kStoreState_${node.name.text}`, node.name.text)
            else if (store.actions.has(selected)) {
              setters.set(node.name.text, node.name.text)
              const reducers = reducersByFunction.get(owner) ?? new Map()
              reducers.set(node.name.text, { state: node.name.text, store, action: selected })
              reducersByFunction.set(owner, reducers)
            } else throw sourceNodeError(unwrapExpression(selector.body).name, sourceFile, `Zustand store ${JSON.stringify(store.name)} has no supported property ${JSON.stringify(selected)}`)
            settersByFunction.set(owner, setters)
          }
        }
        if (callName === "useReducer") {
          if (!ts.isArrayBindingPattern(node.name)) throw sourceNodeError(node.name, sourceFile, "useReducer() must use [state, dispatch] identifier destructuring")
          const [stateElement, dispatchElement] = node.name.elements
          if (node.name.elements.length !== 2 || !stateElement || !dispatchElement || !ts.isBindingElement(stateElement) || !ts.isBindingElement(dispatchElement) || !ts.isIdentifier(stateElement.name) || !ts.isIdentifier(dispatchElement.name)) throw sourceNodeError(node.name, sourceFile, "useReducer() must use [state, dispatch] identifier destructuring")
          if (node.initializer.arguments.length !== 2) throw sourceNodeError(node.initializer, sourceFile, "useReducer() requires exactly a reducer and initial value")
          const reducer = node.initializer.arguments[0]
          if (!ts.isIdentifier(reducer) || !importBindings.has(reducer.text) || importBindings.get(reducer.text).kind === "namespace") throw sourceNodeError(reducer, sourceFile, "useReducer() reducers must be default or named imports from relative TypeScript modules")
          const reducerImport = importBindings.get(reducer.text)
          let reducerDeclaration
          try {
            reducerDeclaration = resolveComponentExport(reducerImport.target, reducerImport.kind === "default" ? "default" : reducerImport.imported, importedSource, sourceFiles)
          } catch {
            throw sourceNodeError(reducer, sourceFile, "useReducer() imports must resolve to a statically analyzable reducer function")
          }
          if (reducerDeclaration.parameters.length !== 2 || reducerDeclaration.asteriskToken || reducerDeclaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(reducer, sourceFile, "useReducer() reducers must be synchronous functions with exactly state and action parameters")
          const owner = nearestFunction(node)
          if (!owner) throw sourceNodeError(node, sourceFile, "useReducer() cannot be used outside a Kudzu component")
          const setters = settersByFunction.get(owner) ?? new Map()
          setters.set(dispatchElement.name.text, stateElement.name.text)
          settersByFunction.set(owner, setters)
          const reducers = reducersByFunction.get(owner) ?? new Map()
          reducers.set(dispatchElement.name.text, { state: stateElement.name.text, reducer: reducer.text, import: reducerImport })
          reducersByFunction.set(owner, reducers)
        }
        if (ts.isArrayBindingPattern(node.name)) {
          const [stateElement, setterElement] = node.name.elements
          if (callName === "useState" && stateElement && setterElement && ts.isBindingElement(stateElement) && ts.isBindingElement(setterElement) && ts.isIdentifier(stateElement.name) && ts.isIdentifier(setterElement.name)) {
            const owner = nearestFunction(node)
            if (owner) {
              const setters = settersByFunction.get(owner) ?? new Map()
              setters.set(setterElement.name.text, stateElement.name.text)
              settersByFunction.set(owner, setters)
              const localSetters = localStateSettersByFunction.get(owner) ?? new Set()
              localSetters.add(setterElement.name.text)
              localStateSettersByFunction.set(owner, localSetters)
            }
          }
        }
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        functions.set(node.name.text, node)
        if (node.parent === sourceFile) components.set(node.name.text, { function: node, declaration: node })
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        functions.set(node.name.text, node.initializer)
        if (node.parent?.parent?.parent === sourceFile) components.set(node.name.text, { function: node.initializer, declaration: node })
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "createContext") contexts.add(node.name.text)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && isLocalConst(node)) {
        const owner = nearestFunction(node)
        const declarations = jsxLocalDeclarations.get(owner) ?? new Map()
        const entries = declarations.get(node.name.text) ?? []
        entries.push({ node, initializer: node.initializer })
        declarations.set(node.name.text, entries)
        jsxLocalDeclarations.set(owner, declarations)
      }
      ts.forEachChild(node, collect)
    }
    collect(sourceFile)
    const functionsForNode = node => {
      const callbacks = customHookFunctionsByOwner.get(nearestFunction(node))
      return callbacks ? new Map([...functions, ...callbacks]) : functions
    }
    for (const [owner, declarations] of jsxLocalDeclarations) {
      const names = new Set()
      let changed = true
      while (changed) {
        changed = false
        for (const [name, entries] of declarations) {
          if (!names.has(name) && entries.some(({ initializer }) => isJsxLocalValue(initializer, names))) {
            names.add(name)
            changed = true
          }
        }
      }
      for (const name of names) {
        const entries = declarations.get(name)
        if (entries.length > 1) {
          const position = sourceFile.getLineAndCharacterOfPosition(entries[1].node.getStart(sourceFile))
          throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} Block-scoped JSX local "${name}" must not shadow another local`)
        }
      }
      jsxLocalsByFunction.set(owner, names)
    }
    for (const [owner, declarations] of jsxLocalDeclarations) {
      const setters = settersByFunction.get(owner) ?? new Map()
      for (const [name, entries] of declarations) {
        for (const declaration of entries) {
          const parts = keyedListParts(declaration.initializer, setters, declarations, (target, message) => { throw sourceNodeError(target, sourceFile, message) }, new Set(), importedCollections, factory, context, importedCollectionTransforms)
          if (!parts) continue
          const uses = []
          const collectUses = node => {
            if (ts.isJsxExpression(node) && node.initializer === undefined && ts.isIdentifier(node.expression) && node.expression.text === name && nearestFunction(node) === owner) uses.push(node)
            ts.forEachChild(node, collectUses)
          }
          collectUses(owner.body)
          const references = identifierReferenceCount(owner.body, name)
          const position = sourceFile.getLineAndCharacterOfPosition(declaration.node.getStart(sourceFile))
          if (uses.length > 1) throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} Keyed list local "${name}" must be rendered exactly once`)
          if (references !== uses.length) throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} Keyed list local "${name}" may only be used as a JSX child`)
          listLocalDeclarations.add(declaration.node)
          if (uses.length) listLocalUses.set(uses[0], parts)
        }
      }
    }
    const fail = (node, message) => {
      throw sourceNodeError(node, sourceFile, message)
    }
    const validateImportedCalculation = (call, field) => {
      const name = call.expression.text
      let calculation = importedCalculationFunctions.get(name)
      if (!calculation) {
        const binding = importBindings.get(name)
        try {
          calculation = resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, importedSource, sourceFiles)
        } catch {
          fail(call.expression, "Reactive imported calculations must resolve to a directly exported relative TypeScript function")
        }
        importedCalculationFunctions.set(name, calculation)
      }
      if (calculation.asteriskToken || calculation.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) fail(call.expression, "Reactive imported calculations must be synchronous functions")
      if (calculation.parameters.length !== call.arguments.length) fail(call, "Reactive imported calculations require one direct argument for each declared parameter")
      const returns = ts.isBlock(calculation.body) ? [] : [unwrapExpression(calculation.body)]
      const collectReturns = node => {
        if (node !== calculation.body && isFunctionLike(node)) return
        if (ts.isReturnStatement(node)) returns.push(node.expression ? unwrapExpression(node.expression) : null)
        ts.forEachChild(node, collectReturns)
      }
      if (ts.isBlock(calculation.body)) collectReturns(calculation.body)
      if (ts.isBlock(calculation.body) && !ts.isReturnStatement(calculation.body.statements.at(-1))) fail(call.expression, "Reactive imported calculations must end with an unconditional return")
      if (!returns.length || returns.some(returned => !returned || !ts.isObjectLiteralExpression(returned))) fail(call.expression, "Reactive imported calculations must return a plain object")
      const fieldExists = returns.every(returned => returned.properties.some(property => ts.isSpreadAssignment(property) || !ts.isComputedPropertyName(property.name) && property.name.text === field))
      if (!fieldExists) fail(call.parent, `Reactive imported calculation does not return field ${JSON.stringify(field)}`)
    }
    const validateReactiveJsxExpression = (expression, allowedNames) => {
      const value = unwrapExpression(expression)
      const formatAccess = ts.isCallExpression(value) && !value.questionDotToken && ts.isPropertyAccessExpression(value.expression) && !value.expression.questionDotToken && value.expression.name.text === "format" ? value.expression : undefined
      const formatter = formatAccess && unwrapExpression(formatAccess.expression)
      const constructor = formatter && ts.isNewExpression(formatter) && ts.isPropertyAccessExpression(formatter.expression) && formatter.expression.name.text === "NumberFormat" && ts.isIdentifier(formatter.expression.expression) && formatter.expression.expression.text === "Intl" ? formatter : undefined
      if (!constructor) {
        const validate = node => {
          const current = unwrapExpression(node)
          if (ts.isPropertyAccessExpression(current) && ts.isCallExpression(unwrapExpression(current.expression))) {
            const call = unwrapExpression(current.expression)
            if (ts.isIdentifier(call.expression) && importBindings.has(call.expression.text) && importBindings.get(call.expression.text).kind !== "namespace") {
              validateImportedCalculation(call, current.name.text)
              for (const argument of call.arguments) collectionExpression(argument, {}, (target, message) => fail(target, message.replace("Rendered collection", "Reactive imported calculation")), allowedNames)
              return factory.createNumericLiteral(0)
            }
          }
          return ts.visitEachChild(current, validate, context)
        }
        const normalized = ts.visitNode(value, validate)
        collectionExpression(normalized, {}, (node, message) => fail(node, message.replace("Rendered collection", "Reactive JSX local")), allowedNames)
        return
      }
      const intl = constructor.expression.expression
      if (!isUnshadowedGlobal(intl, sourceFile)) fail(intl, "Reactive JSX Intl.NumberFormat requires the unshadowed global Intl object")
      if (constructor.arguments?.length !== 1 || !ts.isStringLiteral(constructor.arguments[0])) fail(constructor, "Reactive JSX Intl.NumberFormat requires exactly one static string locale")
      const rounded = value.arguments.length === 1 ? unwrapExpression(value.arguments[0]) : undefined
      const roundAccess = rounded && ts.isCallExpression(rounded) && !rounded.questionDotToken && rounded.arguments.length === 1 && ts.isPropertyAccessExpression(rounded.expression) && !rounded.expression.questionDotToken && rounded.expression.name.text === "round" && ts.isIdentifier(rounded.expression.expression) && rounded.expression.expression.text === "Math" ? rounded.expression : undefined
      if (!roundAccess) fail(value, "Reactive JSX Intl.NumberFormat format() requires exactly Math.round(expression)")
      if (!isUnshadowedGlobal(roundAccess.expression, sourceFile)) fail(roundAccess.expression, "Reactive JSX Intl.NumberFormat requires the unshadowed global Math object")
      collectionExpression(rounded.arguments[0], {}, (node, message) => fail(node, message.replace("Rendered collection", "Reactive JSX local")), allowedNames)
    }
    const resolveReactiveJsxExpression = (expression, owner, setters) => {
      const declarations = jsxLocalDeclarations.get(owner)
      if (!declarations) return expression
      const substitutions = new Map()
      const resolving = []
      const resolve = (name, reference) => {
        if (substitutions.has(name)) return
        const entries = declarations.get(name)
        if (!entries?.length) return
        if (jsxLocalsByFunction.get(owner)?.has(name)) return
        if (entries.length !== 1 || entries[0].node.parent?.parent?.parent !== owner?.body) return
        const cycle = resolving.indexOf(name)
        if (cycle >= 0) fail(reference, `Reactive JSX local cycle: ${[...resolving.slice(cycle), name].join(" -> ")}`)
        resolving.push(name)
        const initializer = entries[0].initializer
        const visit = node => {
          if (ts.isIdentifier(node) && isReferenceIdentifier(node) && !isShadowedByParameter(node, initializer) && declarations.has(node.text)) resolve(node.text, node)
          ts.forEachChild(node, visit)
        }
        visit(initializer)
        substitutions.set(name, substituteClone(initializer, substitutions, factory, context))
        resolving.pop()
      }
      const visit = node => {
        if (ts.isIdentifier(node) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression) && declarations.has(node.text)) resolve(node.text, node)
        ts.forEachChild(node, visit)
      }
      visit(expression)
      if (!substitutions.size) return expression
      const expanded = substituteClone(expression, substitutions, factory, context)
      ts.setParentRecursive(expanded, false)
      expanded.parent = expression.parent
      const usedStates = referencedStateNames(expanded, setters)
      if (!usedStates.size) return expression
      const captures = captureNames(expanded, expanded, setters)
      const allowedNames = new Set([...setters.values(), ...captures])
      validateReactiveJsxExpression(expanded, allowedNames)
      return expanded
    }
    const componentSpecializations = new WeakMap()
    const setterHookHelpers = new WeakMap()
    const expandedRowSpecializations = new WeakMap()
    const nestedRowSpecializations = new Map()
    const reducerComponentCalls = new WeakSet()
    const rowHookCalls = []
    const specializedDeclarations = new WeakSet()
    const stateBackedComponentFunctions = new WeakSet()
    const stateBackedComponentRoots = []
    let specializedImportIndex = 0
    const registerRowHooks = (call, specialization) => {
      if (!specialization.rowStates.length && !specialization.rowRefs.length) return
      let owner
      for (let current = call.parent; current; current = current.parent) {
        if (isFunctionLike(current) && settersByFunction.has(current)) {
          owner = current
          break
        }
      }
      if (!owner) owner = nearestFunction(call)
      const setters = new Map(settersByFunction.get(owner))
      for (const state of specialization.rowStates) setters.set(state.setter, state.state)
      settersByFunction.set(owner, setters)
      rowHookCalls.push(call)
      usesRowState ||= specialization.rowStates.length > 0
      usesRowRef ||= specialization.rowRefs.length > 0
    }
    const mergeSpecializedImports = (root, componentSource, call, effects = []) => {
      const componentImports = clientImportBindings(componentSource, componentSource.fileName, sourceFiles)
      for (const name of runtimeImportNames(componentSource, false)) if (referenceIdentifiers(root, name).length) fail(call, "Imported specialized component handlers may only use relative TypeScript runtime imports")
      const substitutions = new Map()
      for (const statement of componentSource.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !isStaticImport(statement.moduleSpecifier.text)) continue
        const entry = staticImportEntry(statement, componentSource, componentSource.fileName, staticFiles, importedAssets, cssModules, base, factory)
        if (!entry?.name) continue
        if (referenceIdentifiers(root, entry.name).length) substitutions.set(entry.name, entry.value)
        for (const effect of effects) {
          if (effect.source.getSourceFile() !== componentSource) continue
          if (!referenceIdentifiers(effect.call, entry.name).length) continue
          ts.setParentRecursive(effect.call, false)
          effect.call = substituteClone(effect.call, new Map([[entry.name, entry.value]]), factory, context)
          synthesizeTree(effect.call)
        }
      }
      for (const [name, entry] of componentImports) {
        const references = referenceIdentifiers(root, name)
        if (!references.length) continue
        if (references.some(reference => !insideJsxEventHandler(reference, root))) fail(call, `Imported specialized component runtime import "${name}" may only be used inside event handlers`)
        let local
        do local = `__kDispatchImport${specializedImportIndex++}`
        while (importBindings.has(local))
        substitutions.set(name, factory.createIdentifier(local))
        importBindings.set(local, { ...entry, local })
      }
      if (!substitutions.size) return root
      const merged = substituteClone(root, substitutions, factory, context)
      ts.setParentRecursive(merged, false)
      merged.parent = root.parent
      return merged
    }
    const expandReducerCallbacks = (root, componentSource, call) => {
      const componentImports = clientImportBindings(componentSource, componentSource.fileName, sourceFiles)
      const replacements = new WeakMap()
      let count = 0
      for (const [name, entry] of componentImports) {
        if (entry.kind === "namespace") continue
        const nestedCalls = jsxTagUses(root, name).filter(nestedCall => jsxCallHasReducerCallbackProp(nestedCall, reducersForNode(nestedCall, reducersByFunction)))
        if (!nestedCalls.length) continue
        const imported = entry.kind === "default" ? "default" : entry.imported
        let nestedComponent
        try {
          nestedComponent = resolveComponentExport(entry.target, imported, importedSource, sourceFiles)
        } catch {
          fail(nestedCalls[0], "Reducer callback props require a component imported from a relative TypeScript module")
        }
        for (const nestedCall of nestedCalls) {
          const nested = specializeComponentCall(nestedCall, nestedComponent, sourceFile, factory, context, fail, "Reducer-callback")
          if (nested.effects.length) fail(nestedCall, "Reducer-callback components cannot declare effects")
          nested.root = mergeSpecializedImports(nested.root, nestedComponent.getSourceFile(), nestedCall, nested.effects)
          synthesizeTree(nested.root)
          replacements.set(nestedCall, nested.root)
          count++
        }
      }
      if (!count) return root
      const expanded = replaceSpecializedCalls(root, replacements, context)
      ts.setParentRecursive(expanded, false)
      expanded.parent = root.parent
      return expanded
    }
    const staticConditionValue = expression => {
      const value = unwrapExpression(expression)
      if (value.kind === ts.SyntaxKind.TrueKeyword) return true
      if (value.kind === ts.SyntaxKind.FalseKeyword || value.kind === ts.SyntaxKind.NullKeyword || ts.isIdentifier(value) && value.text === "undefined") return false
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return Boolean(value.text)
      if (ts.isNumericLiteral(value)) return Number(value.text) !== 0
      return undefined
    }
    const foldSetterStaticConditions = root => {
      const visit = node => {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          const condition = staticConditionValue(node.left)
          if (condition !== undefined) return condition ? ts.visitNode(node.right, visit) : node.left
        }
        if (ts.isConditionalExpression(node)) {
          const condition = staticConditionValue(node.condition)
          if (condition !== undefined) return ts.visitNode(condition ? node.whenTrue : node.whenFalse, visit)
        }
        return ts.visitEachChild(node, visit, context)
      }
      const folded = ts.visitNode(root, visit)
      ts.setParentRecursive(folded, false)
      folded.parent = root.parent
      return folded
    }
    const expandSetterComponents = (root, componentSource, trail, aggregate, parentSetters) => {
      root = foldSetterStaticConditions(root)
      const replacements = new WeakMap()
      let count = 0
      const visit = (node, dynamic = false) => {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          visit(node.left, dynamic)
          visit(node.right, true)
          return
        }
        if (ts.isConditionalExpression(node)) {
          visit(node.condition, dynamic)
          visit(node.whenTrue, true)
          visit(node.whenFalse, true)
          return
        }
        const tag = jsxTagName(node)
        if (tag && (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase())) {
          if (!ts.isIdentifier(tag)) fail(node, "Nested setter-callback components must use identifier JSX tags")
          const name = tag.text
          let component = localComponentDeclaration(componentSource, name)
          let imported = false
          if (!component) {
            const binding = clientImportBindings(componentSource, componentSource.fileName, sourceFiles).get(name)
            if (!binding || binding.kind === "namespace") fail(node, `Nested setter-callback component ${name} must be declared locally or imported from a relative TypeScript module`)
            component = resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, importedSource, sourceFiles)
            imported = true
          }
          if (trail.includes(component)) {
            const chain = [...trail, component].map(entry => entry.name?.text || "anonymous").join(" -> ")
            fail(node, `Nested setter-callback component cycle: ${chain}`)
          }
          const setters = new Map(parentSetters)
          for (const state of aggregate.ordinaryStates) setters.set(state.setter, state.state)
          if (jsxSetterCallbackProps(node, setters, functionsForNode(node), reducersForNode(node, reducersByFunction)).length) fail(node, "Setter callbacks cannot cross a second component boundary")
          const nested = specializeComponentCall(node, component, sourceFile, factory, context, fail, "Nested setter-callback", true, true, new Set(setters.values()))
          if (dynamic && (nested.hookDeclarations.length || nested.effects.length)) fail(node, "Hookful nested setter-callback components require an unconditional or statically truthy render path")
          nested.root = expandSetterComponents(nested.root, component.getSourceFile(), [...trail, component], nested, setters)
          if (imported) synthesizeTree(nested.root = mergeSpecializedImports(nested.root, component.getSourceFile(), node, nested.effects))
          aggregate.calculations.push(...nested.calculations)
          aggregate.effects.push(...nested.effects)
          aggregate.hookDeclarations.push(...nested.hookDeclarations)
          aggregate.ordinaryStates.push(...nested.ordinaryStates)
          aggregate.ordinaryRefs.push(...nested.ordinaryRefs)
          aggregate.usesComponentId ||= nested.usesComponentId
          replacements.set(node, nested.root)
          count++
          return
        }
        ts.forEachChild(node, child => visit(child, dynamic))
      }
      visit(root)
      if (!count) return root
      const expanded = replaceSpecializedCalls(root, replacements, context)
      ts.setParentRecursive(expanded, false)
      expanded.parent = root.parent
      return expanded
    }
    for (const [name, component] of components) {
      const calls = jsxTagUses(sourceFile, name)
      const stateBackedCalls = calls.filter(call => isStateBackedListComponentCall(call, component.function, settersByFunction.get(nearestFunction(call)) ?? new Map()))
      if (!stateBackedCalls.length) continue
      if (isExportedDeclaration(component.declaration)) fail(component.declaration, `State-backed list component ${name} cannot be exported`)
      if (identifierReferenceCount(sourceFile, name) !== calls.length) fail(component.declaration, `State-backed list component ${name} may only be referenced as JSX`)
      if (stateBackedCalls.length !== calls.length) fail(component.declaration, `State-backed list component ${name} must receive its mapped prop from local state at every call`)
      for (const call of stateBackedCalls) {
        const specialization = specializeComponentCall(call, component.function, sourceFile, factory, context, fail)
        if (specialization.effects.length) fail(call, "State-backed list components cannot declare effects")
        componentSpecializations.set(call, specialization)
        stateBackedComponentRoots.push(specialization.root)
      }
      specializedDeclarations.add(component.declaration)
      stateBackedComponentFunctions.add(component.function)
    }
    for (const [name, binding] of importBindings) {
      if (binding.kind === "namespace") continue
      const calls = jsxTagUses(sourceFile, name)
      if (!calls.some(call => jsxCallHasDirectStateProp(call, settersByFunction.get(nearestFunction(call)) ?? new Map()))) continue
      const imported = binding.kind === "default" ? "default" : binding.imported
      let component
      try {
        component = resolveComponentExport(binding.target, imported, importedSource, sourceFiles)
      } catch (error) {
        if (error.message.includes("does not export a statically analyzable keyed list component")) continue
        throw error
      }
      const stateBackedCalls = calls.filter(call => isStateBackedListComponentCall(call, component, settersByFunction.get(nearestFunction(call)) ?? new Map()))
      for (const call of stateBackedCalls) {
        const specialization = specializeComponentCall(call, component, sourceFile, factory, context, fail)
        if (specialization.effects.length) fail(call, "State-backed list components cannot declare effects")
        componentSpecializations.set(call, specialization)
        stateBackedComponentRoots.push(specialization.root)
      }
    }
    const specializeSetterCallbacks = (call, component, callbackProps, imported) => {
      if (componentSpecializations.has(call)) fail(call, "Setter callback props cannot be combined with another component specialization")
      if (component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name)) fail(component, "Setter-callback components must use one destructured props parameter")
      for (const prop of callbackProps) {
        const element = component.parameters[0].name.elements.find(entry => !entry.dotDotDotToken && (entry.propertyName ?? entry.name).getText() === prop)
        if (!element || !ts.isIdentifier(element.name)) fail(call, `Setter-callback component must destructure callback prop ${JSON.stringify(prop)}`)
        const references = []
        const collectReferences = node => {
          if (ts.isIdentifier(node) && node.text === element.name.text && isReferenceIdentifier(node)) references.push(node)
          ts.forEachChild(node, collectReferences)
        }
        collectReferences(component.body)
        if (references.length !== 1) fail(element, `Setter-callback prop ${JSON.stringify(prop)} must be used exactly once in the component`)
      }
      const specialization = specializeComponentCall(call, component, sourceFile, factory, context, fail, "Setter-callback", false, true, new Set(settersForNode(call, settersByFunction).values()))
      if (specialization.hookDeclarations.length || specialization.effects.length) {
        const substitutions = new Map()
        const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
        for (const attribute of attributes.properties) {
          if (!ts.isJsxAttribute(attribute) || !callbackProps.includes(attribute.name.text) || !attribute.initializer || !ts.isJsxExpression(attribute.initializer) || !ts.isIdentifier(attribute.initializer.expression)) continue
          const callback = functionsForNode(attribute).get(attribute.initializer.expression.text)
          if (callback) substitutions.set(attribute.initializer.expression.text, callback)
        }
        if (substitutions.size) {
          specialization.root = substituteClone(specialization.root, substitutions, factory, context)
          for (const effect of specialization.effects) effect.call = substituteClone(effect.call, substitutions, factory, context)
        }
      }
      specialization.root = expandSetterComponents(specialization.root, component.getSourceFile(), [component], specialization, settersForNode(call, settersByFunction))
      if (imported) synthesizeTree(specialization.root = mergeSpecializedImports(specialization.root, component.getSourceFile(), call, specialization.effects))
      if (specialization.hookDeclarations.length || specialization.effects.length) {
        const owner = nearestFunction(call)
        const name = `KSetterComponent${Math.max(0, call.pos)}`
        const effectStatements = specialization.effects.map(entry => {
          const effectCall = factory.updateCallExpression(entry.call, factory.createIdentifier("__kComponentUseEffect"), entry.call.typeArguments, entry.call.arguments)
          synthesizeTree(effectCall)
          const effectSource = entry.source.getSourceFile()
          componentEffectEntries.set(effectCall, { source: entry.source, sourceFile: effectSource, imports: clientImportBindings(effectSource, effectSource.fileName, sourceFiles) })
          return factory.createExpressionStatement(effectCall)
        })
        const helper = factory.createFunctionDeclaration(
          undefined,
          undefined,
          name,
          undefined,
          [],
          undefined,
          factory.createBlock([...specialization.hookDeclarations, ...effectStatements, factory.createReturnStatement(specialization.root)], true)
        )
        ts.setParentRecursive(helper, false)
        helper.parent = owner.body
        const helpers = setterHookHelpers.get(owner.body) ?? []
        helpers.push(helper)
        setterHookHelpers.set(owner.body, helpers)
        const setters = new Map(settersForNode(call, settersByFunction))
        for (const state of specialization.ordinaryStates) setters.set(state.setter, state.state)
        settersByFunction.set(helper, setters)
        usesComponentState ||= specialization.ordinaryStates.length > 0
        usesComponentId ||= specialization.usesComponentId
        usesComponentRef ||= specialization.ordinaryRefs.length > 0
        usesComponentEffects ||= specialization.effects.length > 0
        specialization.root = factory.createJsxSelfClosingElement(factory.createIdentifier(name), undefined, factory.createJsxAttributes([]))
        ts.setParentRecursive(specialization.root, false)
        specialization.root.parent = call.parent
      }
      componentSpecializations.set(call, specialization)
    }
    for (const [name, component] of components) {
      for (const call of jsxTagUses(sourceFile, name)) {
        const callbackProps = jsxSetterCallbackProps(call, settersByFunction.get(nearestFunction(call)) ?? new Map(), functionsForNode(call), reducersForNode(call, reducersByFunction))
        if (callbackProps.length) specializeSetterCallbacks(call, component.function, callbackProps, false)
      }
    }
    for (const [name, binding] of importBindings) {
      if (binding.kind === "namespace") continue
      const calls = jsxTagUses(sourceFile, name)
      const callbackCalls = calls.map(call => ({ call, callbackProps: jsxSetterCallbackProps(call, settersByFunction.get(nearestFunction(call)) ?? new Map(), functionsForNode(call), reducersForNode(call, reducersByFunction)) })).filter(entry => entry.callbackProps.length)
      if (!callbackCalls.length) continue
      const imported = binding.kind === "default" ? "default" : binding.imported
      let component
      try {
        component = resolveComponentExport(binding.target, imported, importedSource, sourceFiles)
      } catch {
        fail(callbackCalls[0].call, "Setter callback props require a component imported from a relative TypeScript module")
      }
      for (const { call, callbackProps } of callbackCalls) specializeSetterCallbacks(call, component, callbackProps, true)
    }
    for (const [name, component] of components) {
      const calls = jsxTagUses(sourceFile, name)
      const dispatchCalls = calls.filter(call => jsxCallHasDirectReducerProp(call, reducersForNode(call, reducersByFunction)))
      if (!dispatchCalls.length) continue
      if (isExportedDeclaration(component.declaration)) fail(component.declaration, `Reducer-dispatch component ${name} cannot be exported`)
      if (identifierReferenceCount(sourceFile, name) !== calls.length) fail(component.declaration, `Reducer-dispatch component ${name} may only be referenced as JSX`)
      if (dispatchCalls.length !== calls.length) fail(component.declaration, `Reducer-dispatch component ${name} must receive a direct local reducer dispatch at every call`)
      for (const call of dispatchCalls) {
        if (componentSpecializations.has(call)) fail(call, "Reducer dispatch props cannot be combined with another component specialization")
        const specialization = specializeComponentCall(call, component.function, sourceFile, factory, context, fail, "Reducer-dispatch")
        registerRowHooks(call, specialization)
        specialization.root = expandReducerCallbacks(specialization.root, component.function.getSourceFile(), call)
        componentSpecializations.set(call, specialization)
        reducerComponentCalls.add(call)
      }
      specializedDeclarations.add(component.declaration)
    }
    for (const [name, binding] of importBindings) {
      if (binding.kind === "namespace") continue
      const calls = jsxTagUses(sourceFile, name)
      const dispatchCalls = calls.filter(call => jsxCallHasDirectReducerProp(call, reducersForNode(call, reducersByFunction)))
      if (!dispatchCalls.length) continue
      const imported = binding.kind === "default" ? "default" : binding.imported
      let component
      try {
        component = resolveComponentExport(binding.target, imported, importedSource, sourceFiles)
      } catch {
        fail(dispatchCalls[0], `Reducer dispatch props require a component imported from a relative TypeScript module`)
      }
      const componentSource = component.getSourceFile()
      for (const call of dispatchCalls) {
        if (componentSpecializations.has(call)) fail(call, "Reducer dispatch props cannot be combined with another component specialization")
        const specialization = specializeComponentCall(call, component, sourceFile, factory, context, fail, "Reducer-dispatch")
        registerRowHooks(call, specialization)
        specialization.root = expandReducerCallbacks(specialization.root, componentSource, call)
        specialization.root = mergeSpecializedImports(specialization.root, componentSource, call, specialization.effects)
        synthesizeTree(specialization.root)
        componentSpecializations.set(call, specialization)
        reducerComponentCalls.add(call)
      }
    }
    const rawRenderedLists = []
    const collectRenderedLists = node => {
      const specialization = componentSpecializations.get(node)
      if (specialization) {
        collectRenderedLists(specialization.root)
        return
      }
      if (ts.isJsxExpression(node) && node.initializer === undefined && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
        const owner = nearestFunction(node)
        const setters = settersForNode(node, settersByFunction)
        const staticCollection = state => [...(localStateSettersByFunction.get(owner) ?? [])].some(setter => setters.get(setter) === state && !referenceIdentifiers(owner.body, setter).length)
        const calculatedCollection = expression => {
          const value = unwrapExpression(expression)
          if (!ts.isPropertyAccessExpression(value) || !ts.isIdentifier(value.expression)) return undefined
          const entries = jsxLocalDeclarations.get(nearestFunction(node))?.get(value.expression.text)
          if (!entries?.length) return undefined
          const initializer = entries.length === 1 ? unwrapExpression(entries[0].initializer) : undefined
          if (!initializer || !ts.isCallExpression(initializer) || !ts.isIdentifier(initializer.expression) || !importBindings.has(initializer.expression.text)) return undefined
          if (entries[0].node.parent?.parent?.parent !== nearestFunction(entries[0].node)?.body) fail(value.expression, `Calculated collection result "${value.expression.text}" must be one top-level immutable local`)
          validateImportedCalculation(initializer, value.name.text)
          const expanded = resolveReactiveJsxExpression(value, nearestFunction(node), setters)
          if (expanded === value || !referencedStateNames(expanded, setters).size) fail(value, "Calculated collection fields must directly depend on local state")
          return expanded
        }
        const parts = listLocalUses.get(node) ?? keyedListParts(node.expression, setters, jsxLocalDeclarations.get(owner), fail, new Set(), importedCollections, factory, context, importedCollectionTransforms, calculatedCollection, staticCollection)
        if (parts) {
          for (const declaration of parts.aliasDeclarations ?? []) listLocalDeclarations.add(declaration)
          rawRenderedLists.push({ node, parts })
        }
      }
      ts.forEachChild(node, collectRenderedLists)
    }
    collectRenderedLists(sourceFile)
    const collectionAliasUses = new WeakSet(rawRenderedLists.flatMap(({ parts }) => parts.aliasUses ?? []))
    const collectionAliasDeclarations = new Set(rawRenderedLists.flatMap(({ parts }) => parts.aliasDeclarations ?? []))
    for (const declaration of collectionAliasDeclarations) {
      const owner = nearestFunction(declaration)
      const unsupported = identifierReferences(owner.body, declaration.name.text).find(reference => !collectionAliasUses.has(reference))
      if (unsupported) fail(unsupported, `Rendered collection alias "${declaration.name.text}" may only be used as a rendered collection source`)
    }
    const rejectUnsupportedRenderControl = node => {
      if (ts.isIfStatement(node) && containsRenderControl(node, jsxLocalsByFunction.get(nearestFunction(node)) ?? new Set())) {
        const setters = settersForNode(node, settersByFunction)
        if (referencedStateNames(node.expression, setters).size) {
          fail(node, "Reactive render if statements must use terminal returns or exhaustive adjacent JSX assignment")
        }
      }
      ts.forEachChild(node, rejectUnsupportedRenderControl)
    }
    rejectUnsupportedRenderControl(sourceFile)
    const listComponentNames = new Set(rawRenderedLists.flatMap(({ parts }) => {
      const tag = jsxTagName(parts.root)
      return tag && ts.isIdentifier(tag) && tag.text[0] === tag.text[0].toUpperCase() ? [tag.text] : []
    }))
    const keyedComponentCalls = new Set(rawRenderedLists.map(({ parts }) => parts.root))
    for (const call of rowHookCalls) if (!keyedComponentCalls.has(call)) fail(call, "Keyed row hooks are only supported in direct keyed map rows")
    for (const name of listComponentNames) {
      let component = components.get(name)
      const local = Boolean(component)
      if (!component) {
        const binding = importBindings.get(name)
        if (!binding || binding.kind === "namespace") fail(sourceFile, `Keyed list component ${name} must be declared locally or imported from a relative TypeScript module`)
        const imported = binding.kind === "default" ? "default" : binding.imported
        component = { function: resolveComponentExport(binding.target, imported, importedSource, sourceFiles), declaration: undefined }
      }
      const declaredCalls = jsxTagUses(sourceFile, name)
      if (local && identifierReferenceCount(sourceFile, name) !== declaredCalls.length) fail(component.declaration, `Keyed list component ${name} may only be referenced as JSX`)
      const calls = [...new Set([
        ...declaredCalls.filter(call => !stateBackedComponentFunctions.has(nearestFunction(call))),
        ...stateBackedComponentRoots.flatMap(root => jsxTagUses(root, name))
      ])]
      for (const call of calls) {
        const specialization = reducerComponentCalls.has(call)
          ? componentSpecializations.get(call)
          : specializeComponentCall(call, component.function, sourceFile, factory, context, fail, "Keyed list", true)
        registerRowHooks(call, specialization)
        if (specialization.effects.length && !keyedComponentCalls.has(call)) fail(call, "Effectful keyed row components may only be used directly as keyed map rows")
        specialization.component = component.function
        specialization.componentSource = component.function.getSourceFile()
        specialization.imported = !local
        componentSpecializations.set(call, specialization)
      }
      if (local) specializedDeclarations.add(component.declaration)
    }
    const expandKeyedComponents = (root, componentSource, trail = [], aggregate) => {
      const replacements = new WeakMap()
      let count = 0
      const visit = (node, currentAggregate = aggregate) => {
        if (node !== root && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && containsJsx(node)) {
          const nestedAggregate = { calculations: [], effects: [], hookDeclarations: [], rowStates: [], rowRefs: [] }
          for (const argument of node.arguments) visit(argument, nestedAggregate)
          if (nestedAggregate.hookDeclarations.length || nestedAggregate.effects.length) nestedRowSpecializations.set(`${node.pos}:${node.end}`, nestedAggregate)
          return
        }
        const tag = jsxTagName(node)
        if (tag && (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase())) {
          if (!ts.isIdentifier(tag)) fail(node, "Keyed list components must use identifier JSX tags")
          const name = tag.text
          let component = localComponentDeclaration(componentSource, name)
          let imported = false
          if (!component) {
            const binding = clientImportBindings(componentSource, componentSource.fileName, sourceFiles).get(name)
            if (!binding || binding.kind === "namespace") fail(node, `Keyed list component ${name} must be declared locally or imported from a relative TypeScript module`)
            component = resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, importedSource, sourceFiles)
            imported = true
          }
          if (trail.includes(component)) {
            const chain = [...trail, component].map(entry => entry.name?.text || "anonymous").join(" -> ")
            fail(node, `Keyed list component cycle: ${chain}`)
          }
          const specialization = specializeComponentCall(node, component, sourceFile, factory, context, fail, "Keyed list", true)
          registerRowHooks(node, specialization)
          specialization.root = expandKeyedComponents(specialization.root, component.getSourceFile(), [...trail, component], specialization)
          if (imported) synthesizeTree(specialization.root = mergeSpecializedImports(specialization.root, component.getSourceFile(), node, specialization.effects))
          expandedRowSpecializations.set(specialization.root, specialization)
          if (currentAggregate) {
            currentAggregate.effects.push(...specialization.effects)
            currentAggregate.hookDeclarations.push(...specialization.hookDeclarations)
            currentAggregate.rowStates.push(...specialization.rowStates)
            currentAggregate.rowRefs.push(...specialization.rowRefs)
          }
          replacements.set(node, specialization.root)
          count++
          return
        }
        ts.forEachChild(node, child => visit(child, currentAggregate))
      }
      visit(root)
      if (!count) return root
      const expanded = replaceSpecializedCalls(root, replacements, context)
      ts.setParentRecursive(expanded, false)
      expanded.parent = root.parent
      return expanded
    }
    const renderedLists = new WeakMap()
    const prepareListCallback = (callback, root, specialization, item) => {
      const statements = [...specialization.hookDeclarations]
      if (specialization.effects.length) {
        usesListEffects = true
        statements.push(...specialization.effects.map(entry => {
          const call = factory.updateCallExpression(entry.call, factory.createIdentifier("__kListUseEffect"), entry.call.typeArguments, entry.call.arguments)
          synthesizeTree(call)
          const effectSource = entry.source.getSourceFile()
          listEffectEntries.set(call, { item, source: entry.source, sourceFile: effectSource, imports: clientImportBindings(effectSource, effectSource.fileName, sourceFiles) })
          return factory.createExpressionStatement(call)
        }))
      }
      if (!statements.length) return callback
      const prepared = factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, callback.parameters, callback.type, callback.equalsGreaterThanToken, factory.createBlock([...statements, factory.createReturnStatement(root)], true))
      ts.setParentRecursive(prepared, false)
      prepared.parent = callback.parent
      return prepared
    }
    for (const { node, parts: originalParts } of rawRenderedLists) {
      if (keyedListParentTag(node) === "table") throw new Error("Keyed table rows must be wrapped in <tbody>, <thead>, or <tfoot>")
      const specialization = componentSpecializations.get(originalParts.root) ?? { root: originalParts.root, calculations: [], effects: [], hookDeclarations: [], rowStates: [], rowRefs: [] }
      const componentSource = specialization.componentSource ?? sourceFile
      specialization.root = expandKeyedComponents(specialization.root, componentSource, specialization.component ? [specialization.component] : [], specialization)
      if (specialization.imported) synthesizeTree(specialization.root = mergeSpecializedImports(specialization.root, componentSource, originalParts.root, specialization.effects))
      if (specialization.root !== originalParts.root) componentSpecializations.set(originalParts.root, specialization)
      const root = specialization.root
      let callback = root === originalParts.root ? originalParts.callback : factory.updateArrowFunction(
        originalParts.callback,
        originalParts.callback.modifiers,
        originalParts.callback.typeParameters,
        originalParts.callback.parameters,
        originalParts.callback.type,
        originalParts.callback.equalsGreaterThanToken,
        root
      )
      if (callback !== originalParts.callback) {
        ts.setParentRecursive(callback, false)
        callback.parent = originalParts.callback.parent
      }
      callback = prepareListCallback(callback, root, specialization, originalParts.item)
      const parts = { ...originalParts, root, callback }
      for (const calculation of specialization.calculations) {
        ts.setParentRecursive(calculation, false)
        calculation.parent = callback
        validateListExpression(calculation, parts.item, originalParts.root, fail)
      }
      validateKeyedList(parts, sourceFile, listValues, listEventItems, listConditions, settersForNode(originalParts.root, settersByFunction), specialization.rowStates, nestedLists, componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback)
      renderedLists.set(node, parts)
    }

    const compileRenderExpression = (expression, anchor) => {
      const parts = conditionalParts(expression)
      if (!parts) return ts.visitNode(expression, visitor)
      const setters = settersForNode(anchor, settersByFunction)
      const usedStates = referencedStateNames(parts.condition, setters)
      const captures = captureNames(parts.condition, parts.condition, setters)
      if (!usedStates.size && !captures.size) return ts.visitEachChild(expression, visitor, context)
      usesBehavior = true
      usesConditional = true
      return compileConditional(
        parts.kind,
        parts.condition,
        compileRenderExpression(parts.truthy, anchor),
        compileRenderExpression(parts.falsy, anchor),
        setters,
        factory,
        context,
        reactiveBindings,
        handlerUrl
      )
    }

    const visitor = node => {
      if (ts.isBlock(node) && setterHookHelpers.has(node)) {
        return ts.visitEachChild(factory.updateBlock(node, [...setterHookHelpers.get(node), ...node.statements]), visitor, context)
      }
      if (specializedDeclarations.has(node)) return node
      if (componentSpecializations.has(node)) return ts.visitNode(componentSpecializations.get(node).root, visitor)

      if (hasLinkElements && (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && isStylesheetLink(node)) {
        fail(node, "Stylesheets must be placed under src/ or declared in kudzu.config styles so Kudzu can emit them in <head>")
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "react") {
        if (!node.importClause) fail(node, "Side-effect React imports are not supported because Kudzu does not load the React runtime")
        if (node.importClause.isTypeOnly) return node
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral("@kudzujs/core"), node.attributes)
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && packageBindings.size && importDeclarationNames(node).some(name => packageBindings.has(name))) return undefined

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        if (!runtimeModuleReference(node)) return node
        if (isStaticImport(node.moduleSpecifier.text)) return staticImportEntry(node, sourceFile, file, staticFiles, importedAssets, cssModules, base, factory)?.replacement
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral(relativeModulePath(compiledPath(file), compiledPath(target))), node.attributes)
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        if (!runtimeModuleReference(node)) return node
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, factory.createStringLiteral(relativeModulePath(compiledPath(file), compiledPath(target))), node.attributes)
      }

      const listEffect = ts.isCallExpression(node) ? listEffectEntries.get(node) : undefined
      const componentEffect = ts.isCallExpression(node) ? componentEffectEntries.get(node) : undefined
      const specializedEffect = listEffect ?? componentEffect
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (hasUseEffectImport && node.expression.text === "useEffect" || specializedEffect)) {
        const effectFail = (target, message) => {
          if (specializedEffect) throw sourceNodeError(specializedEffect.source, specializedEffect.sourceFile, message)
          fail(target, message)
        }
        if (node.arguments.length !== 2) effectFail(node, "useEffect() requires exactly a callback and literal dependency array")
        const [callbackArgument, dependencies] = node.arguments
        const effectOwner = nearestFunction(node)
        const resolveEffectFunction = expression => {
          if (!ts.isIdentifier(expression)) return undefined
          const entries = jsxLocalDeclarations.get(effectOwner)?.get(expression.text)
          if (entries?.length !== 1 || entries[0].node.parent?.parent?.parent !== effectOwner?.body) return undefined
          const initializer = entries[0].initializer
          return ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer) ? initializer : undefined
        }
        let callback = ts.isArrowFunction(callbackArgument) || ts.isFunctionExpression(callbackArgument) ? callbackArgument : resolveEffectFunction(callbackArgument)
        if (!callback) effectFail(callbackArgument, "useEffect() callback must be inline or one top-level const function")
        if (ts.isFunctionExpression(callback) && callback.name) effectFail(callback, "useEffect() callback function must be anonymous")
        if (callback.asteriskToken) effectFail(callback, "useEffect() callback cannot be a generator")
        if (callback.parameters.length) effectFail(callback, "useEffect() callback cannot declare parameters")
        if (!ts.isArrayLiteralExpression(dependencies)) effectFail(dependencies, "useEffect() dependencies must be a literal array")
        const itemDependencies = []
        const ordinaryDependencies = []
        const setters = settersForNode(node, settersByFunction)
        let dependencyItem = listEffect?.item
        for (const dependency of dependencies.elements) {
          const value = unwrapExpression(dependency)
          if (!dependencyItem && ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && isDestructuredParameter(value.expression, nearestFunction(node))) dependencyItem = value.expression.text
          const field = dependencyItem && directProperty(dependency, dependencyItem)
          if (field) {
            if (["__proto__", "constructor", "prototype"].includes(field)) effectFail(dependency, `useEffect() keyed item property "${field}" is not supported`)
            itemDependencies.push(field)
          } else if (dependencyItem && referencesIdentifier(dependency, dependencyItem)) {
            effectFail(dependency, "useEffect() keyed item dependencies must be direct item.<field> properties")
          } else {
            ordinaryDependencies.push(dependency)
          }
        }
        const invalidDependency = ordinaryDependencies.find(dependency => !ts.isIdentifier(dependency))
        if (invalidDependency) effectFail(invalidDependency, "useEffect() dependencies must be direct state or runtime parameter identifiers")
        const dependencyExpressions = []
        const dependencyStates = new Map()
        const dependencySubstitutions = new Map()
        const subscriptionDependencies = []
        let hasDerivedDependency = false
        const stateNames = new Set(setters.values())
        const localDeclarations = jsxLocalDeclarations.get(nearestFunction(node))
        for (const dependency of ordinaryDependencies) {
          const entries = localDeclarations?.get(dependency.text)
          const initializer = entries?.length === 1 ? entries[0].initializer : undefined
          const directAlias = initializer && ts.isIdentifier(unwrapExpression(initializer)) && stateNames.has(unwrapExpression(initializer).text)
          const derivedStates = initializer && !directAlias ? referencedStateNames(initializer, setters) : new Set()
          if (derivedStates.size) {
            const usedStates = new Set()
            const expression = collectionExpression(initializer, {}, effectFail, stateNames, usedStates)
            if (!usedStates.size) effectFail(dependency, `useEffect() derived dependency "${dependency.text}" must read direct primitive state`)
            dependencyExpressions.push(expression)
            for (const name of usedStates) {
              subscriptionDependencies.push(factory.createIdentifier(name))
              dependencyStates.set(name, factory.createIdentifier(name))
            }
            dependencySubstitutions.set(dependency.text, initializer)
            hasDerivedDependency = true
          } else {
            subscriptionDependencies.push(dependency)
            dependencyExpressions.push(["state", dependency.text])
            dependencyStates.set(dependency.text, dependency)
          }
        }
        if (!hasDerivedDependency) {
          dependencyExpressions.length = 0
          dependencyStates.clear()
        }
        if (!effectOwner) fail(node, "useEffect() cannot be used outside a Kudzu component")
        if (!ts.isBlock(callback.body)) effectFail(callback, "useEffect() callback must use a block body")
        const cleanupSubstitutions = new Map()
        const collectNamedCleanups = current => {
          if (current !== callback && isFunctionLike(current)) return
          if (ts.isReturnStatement(current) && current.expression && ts.isIdentifier(unwrapExpression(current.expression))) {
            const cleanup = resolveEffectFunction(unwrapExpression(current.expression))
            if (cleanup) cleanupSubstitutions.set(unwrapExpression(current.expression).text, cleanup)
          }
          ts.forEachChild(current, collectNamedCleanups)
        }
        collectNamedCleanups(callback.body)
        if (cleanupSubstitutions.size) {
          callback = substituteClone(callback, cleanupSubstitutions, factory, context)
          ts.setParentRecursive(callback, false)
          callback.parent = callbackArgument.parent
        }
        const returns = effectReturns(callback)
        if (returns.invalid) effectFail(returns.invalid, "useEffect() return values must be inline cleanup functions")
        const invalidCleanup = returns.cleanups.find(cleanup => cleanup.parameters.length || cleanup.asteriskToken)
        if (invalidCleanup) effectFail(invalidCleanup, "useEffect() cleanup functions cannot declare parameters or be generators")
        if (returns.cleanup && callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) effectFail(callback, "useEffect() async callbacks cannot return cleanup functions")
        const callbackSource = specializedEffect?.sourceFile ?? sourceFile
        const callbackFile = callbackSource.fileName
        const workerStart = workerReferences.length
        let compiledCallback = dependencySubstitutions.size ? substituteClone(callback, dependencySubstitutions, factory, context) : callback
        if (compiledCallback !== callback) {
          ts.setParentRecursive(compiledCallback, false)
          compiledCallback.parent = callback.parent
        }
        if (listEffect && callbackFile !== file) {
          const originalCallback = listEffect.source.arguments[0]
          rejectWorkerConstructions(originalCallback, callbackSource, "Relative TypeScript Worker construction in imported keyed-row effects is not supported; construct the Worker in a directly compiled page or local component effect")
        } else {
          compiledCallback = rewriteEffectWorkers(compiledCallback, callbackFile, callbackSource, sourceFiles, workerReferences, factory, context)
        }
        const descriptor = compileNativeCallback(compiledCallback, setters, reducersForNode(node, reducersByFunction), factory, effectHandlers, specializedEffect?.imports ?? importBindings, clientImports, "effect", dependencyItem, true, returns.cleanup)
        for (const reference of workerReferences.slice(workerStart)) Object.assign(reference, { module: handlerUrl, handler: descriptor.exportName })
        usesListItem ||= Boolean(itemDependencies.length && !listEffect)
        usesBehavior = true
        return factory.updateCallExpression(node, node.expression, node.typeArguments, [
          callback,
          factory.createArrayLiteralExpression(hasDerivedDependency ? subscriptionDependencies : ordinaryDependencies),
          factory.createStringLiteral(handlerUrl),
          factory.createStringLiteral(descriptor.exportName),
          descriptor.states,
          descriptor.scope,
          factory.createStringLiteral(specializedEffect ? sourceLocation(specializedEffect.source, specializedEffect.sourceFile) : sourceLocation(node, sourceFile)),
          returns.cleanup ? factory.createTrue() : factory.createFalse(),
          factory.createArrayLiteralExpression(itemDependencies.map(field => factory.createStringLiteral(field))),
          hasDerivedDependency ? jsonExpression(dependencyExpressions, factory) : factory.createArrayLiteralExpression(),
          factory.createArrayLiteralExpression([...dependencyStates].map(([name, state]) => factory.createArrayLiteralExpression([factory.createStringLiteral(name), state])))
        ])
      }

      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && ((node.initializer.expression.text === "useState" || node.initializer.expression.text === "__kRowUseState" || node.initializer.expression.text === "__kComponentUseState") && node.initializer.arguments.length === 1 || node.initializer.expression.text === "useReducer" && node.initializer.arguments.length === 2)) {
        const stateElement = node.name.elements[0]
        if (!stateElement || !ts.isBindingElement(stateElement) || !ts.isIdentifier(stateElement.name)) return node
        const initializer = factory.updateCallExpression(node.initializer, node.initializer.expression, node.initializer.typeArguments, [
          ...node.initializer.arguments,
          factory.createStringLiteral(stateElement.name.text)
        ])
        return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, initializer)
      }

      if (ts.isVariableDeclaration(node) && listLocalDeclarations.has(node)) {
        return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, factory.createIdentifier("undefined"))
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && importBindings.has(node.initializer.expression.text)) {
        const setters = settersForNode(node, settersByFunction)
        const stateNames = new Set(setters.values())
        const rewrite = current => {
          if (ts.isShorthandPropertyAssignment(current) && stateNames.has(current.name.text)) return factory.createPropertyAssignment(current.name, factory.createPropertyAccessExpression(current.name, "value"))
          if (ts.isIdentifier(current) && stateNames.has(current.text) && isReferenceIdentifier(current)) return factory.createPropertyAccessExpression(current, "value")
          return ts.visitEachChild(current, rewrite, context)
        }
        if (referencedStateNames(node.initializer, setters).size) return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, ts.visitNode(node.initializer, rewrite))
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && jsxLocalsByFunction.get(nearestFunction(node))?.has(node.name.text) && referencesIdentifier(nearestFunction(node).body, node.name.text)) {
        const compiled = compileRenderExpression(node.initializer, node)
        if (compiled !== node.initializer) return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, compiled)
      }

      if (ts.isReturnStatement(node) && node.expression && isJsxLocalValue(node.expression, jsxLocalsByFunction.get(nearestFunction(node)) ?? new Set())) {
        const compiled = compileRenderExpression(node.expression, node)
        if (compiled !== node.expression) return factory.updateReturnStatement(node, compiled)
      }

      if (ts.isJsxExpression(node) && node.expression && listConditions.has(node.expression)) {
        const entry = listConditions.get(node.expression)
        return factory.updateJsxExpression(node, compileListConditional({
          ...entry,
          truthy: ts.visitNode(entry.truthy, visitor),
          falsy: ts.visitNode(entry.falsy, visitor)
        }, factory, listExpressions, handlerUrl))
      }

      if (ts.isJsxExpression(node) && node.expression && listValues.has(node.expression)) {
        return factory.updateJsxExpression(node, compileListValue(node.expression, listValues.get(node.expression), factory, listExpressions, handlerUrl))
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && listValues.has(node.initializer.expression)) {
        return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, compileListValue(node.initializer.expression, listValues.get(node.initializer.expression), factory, listExpressions, handlerUrl)))
      }

      if (ts.isJsxExpression(node) && node.initializer === undefined && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
        const nestedParts = nestedLists.get(unwrapExpression(node.expression))
        const listParts = renderedLists.get(node) ?? nestedParts
        if (listParts) {
          usesBehavior = true
          usesList = true
          let listSource = listParts.state
          if (listParts.calculation) {
            usesBinding = true
            listSource = compileReactiveBinding(listParts.calculation, settersForNode(node, settersByFunction), factory, context, reactiveBindings, handlerUrl, importBindings, clientImports)
          }
          const arguments_ = [
            listSource,
            listParts.keyField === null ? factory.createNull() : factory.createStringLiteral(listParts.keyField),
            ts.visitNode(listParts.callback, visitor),
            factory.createStringLiteral(listParts.ownerField ?? ""),
            jsonExpression(listParts.selector ?? [], factory),
            listParts.indexed ? factory.createTrue() : factory.createFalse()
          ]
          if (listParts.selectorStates?.size || listParts.static) arguments_.push(factory.createArrayLiteralExpression([...(listParts.selectorStates ?? [])].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))))
          if (listParts.static) arguments_.push(factory.createTrue())
          return factory.updateJsxExpression(node, factory.createCallExpression(factory.createIdentifier("__kList"), undefined, arguments_))
        }
        const conditional = conditionalParts(node.expression)
        if (conditional) {
          const compiled = compileRenderExpression(node.expression, node)
          if (compiled !== node.expression) return factory.updateJsxExpression(node, compiled)
        }
        const setters = settersForNode(node, settersByFunction)
        const expression = resolveReactiveJsxExpression(node.expression, nearestFunction(node), setters)
        const usedStates = referencedStateNames(expression, setters)
        const captures = captureNames(expression, expression, setters)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(expression) && !containsJsx(expression)) {
          usesBehavior = true
          usesBinding = true
          return factory.updateJsxExpression(node, compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl, importBindings, clientImports))
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && !isContextProviderValue(node, contexts) && !/^on/i.test(node.name.text) && !["key", "ref", "dangerouslysetinnerhtml"].includes(node.name.text.toLowerCase())) {
        const sourceExpression = node.initializer.expression
        const setters = settersForNode(node, settersByFunction)
        const expression = resolveReactiveJsxExpression(sourceExpression, nearestFunction(node), setters)
        const usedStates = referencedStateNames(expression, setters)
        const captures = captureNames(expression, expression, setters)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(expression)) {
          usesBehavior = true
          usesBinding = true
          const compiled = compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl, importBindings, clientImports)
          return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, compiled))
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && /^on[A-Z]/.test(node.name.text)) {
        const setters = settersForNode(node, settersByFunction)
        const event = compileEvent(node.initializer.expression, setters, reducersForNode(node, reducersByFunction), functionsForNode(node), factory, nativeHandlers, handlerUrl, listEventItems.get(node), new Map([...importBindings, ...packageBindings]), clientImports)
        if (event) {
          usesBehavior = true
          return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, event))
        }
        if (ts.isIdentifier(node.initializer.expression) && isDestructuredParameter(node.initializer.expression, nearestFunction(node))) return node
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
        throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${node.name.text} must reference a function`)
      }

      return ts.visitEachChild(node, visitor, context)
    }

    const transformed = ts.visitNode(sourceFile, visitor)
    if (!usesBehavior) return transformed

    const behaviorImports = [factory.createImportSpecifier(false, factory.createIdentifier("behavior"), factory.createIdentifier("__kBehavior"))]
    if (nativeHandlers.length) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("nativeBehavior"), factory.createIdentifier("__kNativeBehavior")))
    if (usesBinding) {
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("binding"), factory.createIdentifier("__kBinding")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("select"), factory.createIdentifier("__kSelect")))
    }
    if (usesConditional) {
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("conditional"), factory.createIdentifier("__kConditional")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("stateConditional"), factory.createIdentifier("__kStateConditional")))
    }
    if (usesList) {
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("list"), factory.createIdentifier("__kList")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listExpression"), factory.createIdentifier("__kListExpression")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listField"), factory.createIdentifier("__kListField")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listItem"), factory.createIdentifier("__kListItem")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listIndex"), factory.createIdentifier("__kListIndex")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listConditional"), factory.createIdentifier("__kListConditional")))
    }
    if (usesListItem && !usesList) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listItem"), factory.createIdentifier("__kListItem")))
    if (usesListEffects) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useEffect"), factory.createIdentifier("__kListUseEffect")))
    if (usesRowState) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useState"), factory.createIdentifier("__kRowUseState")))
    if (usesRowRef) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useRef"), factory.createIdentifier("__kRowUseRef")))
    if (usesComponentState) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useState"), factory.createIdentifier("__kComponentUseState")))
    if (usesComponentId) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useId"), factory.createIdentifier("__kComponentUseId")))
    if (usesComponentRef) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useRef"), factory.createIdentifier("__kComponentUseRef")))
    if (usesComponentEffects) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useEffect"), factory.createIdentifier("__kComponentUseEffect")))
    if (usesBinding || usesConditional) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("bindingValue"), factory.createIdentifier("__kBindingValue")))
    const behaviorImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(behaviorImports)),
      factory.createStringLiteral("@kudzujs/core")
    )
    return factory.updateSourceFile(transformed, [behaviorImport, ...transformed.statements])
  }
}

function normalizeRenderControlFlow(sourceFile, factory, context) {
  const normalizeStatements = statements => {
    const nested = statements.map(statement => ts.visitEachChild(statement, visitNested, context))
    const assigned = []
    for (let index = 0; index < nested.length; index++) {
      const statement = nested[index]
      const next = nested[index + 1]
      const declaration = singleUninitializedLet(statement)
      const assignment = declaration && next && assignmentConditional(next, declaration.name.text, factory)
      if (declaration && assignment) {
        const updated = factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, assignment)
        const list = factory.createVariableDeclarationList([updated], ts.NodeFlags.Const)
        assigned.push(factory.updateVariableStatement(statement, statement.modifiers, list))
        index++
      } else {
        assigned.push(statement)
      }
    }

    if (!assigned.length) return assigned
    const finalIf = returnConditional(assigned.at(-1), factory)
    if (finalIf) return [...assigned.slice(0, -1), factory.createReturnStatement(finalIf)]
    if (!ts.isReturnStatement(assigned.at(-1)) || !assigned.at(-1).expression) return assigned
    let expression = assigned.at(-1).expression
    let start = assigned.length - 1
    while (start > 0) {
      const previous = assigned[start - 1]
      if (!ts.isIfStatement(previous) || previous.elseStatement) break
      const truthy = returnOnlyExpression(previous.thenStatement)
      if (!truthy) break
      expression = factory.createConditionalExpression(previous.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), expression)
      start--
    }
    return start === assigned.length - 1 ? assigned : [...assigned.slice(0, start), factory.createReturnStatement(expression)]
  }

  const visitNested = node => {
    if (ts.isBlock(node)) return factory.updateBlock(node, normalizeStatements([...node.statements]))
    if (isFunctionLike(node) && ts.isBlock(node.body)) {
      if (!isRenderFunction(node)) return node
      const body = factory.updateBlock(node.body, normalizeStatements([...node.body.statements]))
      if (ts.isFunctionDeclaration(node)) return factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body)
      if (ts.isFunctionExpression(node)) return factory.updateFunctionExpression(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body)
      if (ts.isArrowFunction(node)) return factory.updateArrowFunction(node, node.modifiers, node.typeParameters, node.parameters, node.type, node.equalsGreaterThanToken, body)
    }
    return ts.visitEachChild(node, visitNested, context)
  }

  return ts.visitEachChild(sourceFile, visitNested, context)
}

function isRenderFunction(node) {
  if (ts.isFunctionDeclaration(node)) return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword) || Boolean(node.name && /^[A-Z]/.test(node.name.text))
  const declaration = node.parent
  return ts.isVariableDeclaration(declaration) && ts.isIdentifier(declaration.name) && /^[A-Z]/.test(declaration.name.text)
}

function singleUninitializedLet(statement) {
  if (!ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Let) === 0 || statement.declarationList.declarations.length !== 1) return undefined
  const declaration = statement.declarationList.declarations[0]
  return ts.isIdentifier(declaration.name) && !declaration.initializer ? declaration : undefined
}

function assignmentConditional(statement, name, factory) {
  if (!ts.isIfStatement(statement) || !statement.elseStatement) return undefined
  const truthy = assignmentOnlyExpression(statement.thenStatement, name)
  const falsy = ts.isIfStatement(statement.elseStatement)
    ? assignmentConditional(statement.elseStatement, name, factory)
    : assignmentOnlyExpression(statement.elseStatement, name)
  if (!truthy || !falsy) return undefined
  return factory.createConditionalExpression(statement.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), falsy)
}

function assignmentOnlyExpression(statement, name) {
  const candidate = ts.isBlock(statement) && statement.statements.length === 1 ? statement.statements[0] : statement
  if (!ts.isExpressionStatement(candidate) || !ts.isBinaryExpression(candidate.expression) || candidate.expression.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !ts.isIdentifier(candidate.expression.left) || candidate.expression.left.text !== name) return undefined
  return candidate.expression.right
}

function returnConditional(statement, factory) {
  if (!ts.isIfStatement(statement) || !statement.elseStatement) return undefined
  const truthy = returnOnlyExpression(statement.thenStatement)
  const falsy = ts.isIfStatement(statement.elseStatement)
    ? returnConditional(statement.elseStatement, factory)
    : returnOnlyExpression(statement.elseStatement)
  if (!truthy || !falsy) return undefined
  return factory.createConditionalExpression(statement.expression, factory.createToken(ts.SyntaxKind.QuestionToken), truthy, factory.createToken(ts.SyntaxKind.ColonToken), falsy)
}

function returnOnlyExpression(statement) {
  const candidate = ts.isBlock(statement) && statement.statements.length === 1 ? statement.statements[0] : statement
  return ts.isReturnStatement(candidate) && candidate.expression ? candidate.expression : undefined
}

function containsRenderControl(root, knownLocals) {
  let found = false
  const visit = node => {
    if (isFunctionLike(node) && node !== root) return
    if (ts.isReturnStatement(node) && node.expression && isJsxLocalValue(node.expression, knownLocals)) found = true
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && containsJsx(node.right)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function keyedListParts(expression, setters, declarations, fail, aliases = new Set(), importedCollections = new Set(), factory = ts.factory, context, importedCollectionTransforms = new Map(), calculatedCollection, staticCollection) {
  const value = unwrapExpression(expression)
  const directFrom = isArrayFromCall(value) && value.arguments.length === 2 && containsJsx(value.arguments[1])
  if (!directFrom && (!ts.isCallExpression(value) || value.arguments.length !== 1 || !ts.isPropertyAccessExpression(value.expression) || value.expression.name.text !== "map")) return undefined
  const collection = renderedCollectionSource(directFrom ? value.arguments[0] : value.expression.expression, setters, declarations, fail, aliases, importedCollections, new Set(setters.values()), importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
  if (!collection?.state && !collection?.calculation) return undefined
  if (directFrom) collection.selector.push(["from", undefined])
  let callback = directFrom ? value.arguments[1] : value.arguments[0]
  const parameters = collectionParameters(callback, "Keyed list map", fail)
  let root = unwrapExpression(callback.body)
  if (ts.isBlock(root)) {
    if (!context || root.statements.length !== 2 || !ts.isVariableStatement(root.statements[0]) || (root.statements[0].declarationList.flags & ts.NodeFlags.Const) === 0 || root.statements[0].declarationList.declarations.length !== 1 || !ts.isReturnStatement(root.statements[1]) || !root.statements[1].expression) fail(root, "Block-bodied keyed list map callbacks require one computed child collection const and a final JSX return")
    const declaration = root.statements[0].declarationList.declarations[0]
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) fail(declaration, "Computed child collections must initialize one const identifier")
    const computed = renderedCollectionSource(declaration.initializer, new Map(), undefined, fail, new Set(), new Set(), new Set(), importedCollectionTransforms, factory, context)
    if (!computed?.ownerField || computed.parentItem !== parameters.item) fail(declaration.initializer, `Computed child collections must start from ${parameters.item}.<field>`)
    const returned = root.statements[1].expression
    if (identifierReferenceCount(returned, declaration.name.text) !== 1) fail(declaration.name, `Computed child collection alias "${declaration.name.text}" must be used exactly once`)
    root = unwrapExpression(substituteClone(returned, new Map([[declaration.name.text, declaration.initializer]]), factory, context))
    callback = factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, callback.parameters, callback.type, callback.equalsGreaterThanToken, root)
    ts.setParentRecursive(callback, false)
    callback.parent = value
  }
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) fail(callback.body, "Keyed list map callback must return one JSX element")
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const key = attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && ts.isIdentifier(attribute.name) && attribute.name.text === "key")
  const keyExpression = key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer) && key.initializer.expression
  const field = keyExpression && directProperty(keyExpression, parameters.item)
  const positional = Boolean(keyExpression && parameters.index && ts.isIdentifier(unwrapExpression(keyExpression)) && unwrapExpression(keyExpression).text === parameters.index)
  if (!field && !positional) fail(key ?? root, `Keyed list root must have key={${parameters.item}.<field>} or key={${parameters.index ?? "index"}}`)
  return { ...collection, static: collection.static && (!collection.localStatic || collection.selector.length > 0), callback, root, item: parameters.item, index: parameters.index, indexed: Boolean(parameters.index), keyField: positional ? null : field }
}

function nestedKeyedListParts(expression, parentItem, fail) {
  const value = unwrapExpression(expression)
  if (!ts.isCallExpression(value) || value.arguments.length !== 1 || !ts.isPropertyAccessExpression(value.expression) || value.expression.name.text !== "map") return undefined
  const collection = renderedCollectionSource(value.expression.expression, new Map(), undefined, fail, new Set())
  if (!collection?.ownerField || collection.parentItem !== parentItem) return undefined
  const callback = value.arguments[0]
  const parameters = collectionParameters(callback, "Nested keyed list map", fail)
  const root = unwrapExpression(callback.body)
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) fail(callback.body, "Nested keyed list map callback must return one JSX element")
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const key = attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && ts.isIdentifier(attribute.name) && attribute.name.text === "key")
  const keyExpression = key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer) && key.initializer.expression
  const keyField = keyExpression && directProperty(keyExpression, parameters.item)
  const positional = Boolean(keyExpression && parameters.index && ts.isIdentifier(unwrapExpression(keyExpression)) && unwrapExpression(keyExpression).text === parameters.index)
  if (!keyField && !positional) fail(key ?? root, `Nested keyed list root must have key={${parameters.item}.<field>} or key={${parameters.index ?? "index"}}`)
  return { ...collection, callback, root, item: parameters.item, index: parameters.index, indexed: Boolean(parameters.index), keyField: positional ? null : keyField }
}

function renderedCollectionSource(expression, setters, declarations, fail, aliases, importedCollections = new Set(), stateNames = new Set(), importedCollectionTransforms = new Map(), factory = ts.factory, context, calculatedCollection, staticCollection) {
  const value = unwrapExpression(expression)
  if (ts.isIdentifier(value)) {
    if ([...setters.values()].includes(value.text)) {
      const localStatic = staticCollection?.(value.text)
      return { state: value, static: localStatic, localStatic, selector: [], selectorStates: new Set() }
    }
    if (importedCollections.has(value.text)) return { state: value, static: true, selector: [], selectorStates: new Set() }
    const entries = declarations?.get(value.text)
    if (!entries) return undefined
    if (entries.length !== 1 || aliases.has(value.text) || entries[0].node.parent?.parent?.parent !== nearestFunction(entries[0].node)?.body) fail(value, `Rendered collection alias "${value.text}" must be one top-level immutable local`)
    aliases.add(value.text)
    const source = renderedCollectionSource(entries[0].initializer, setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
    aliases.delete(value.text)
    return source && { ...source, aliasDeclarations: [...(source.aliasDeclarations ?? []), entries[0].node], aliasUses: [...(source.aliasUses ?? []), value] }
  }
  if (ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression)) {
    const calculation = calculatedCollection?.(value)
    if (calculation) return { calculation, selector: [], selectorStates: new Set() }
    return { state: undefined, ownerField: value.name.text, selector: [], parentItem: value.expression.text }
  }
  if (ts.isCallExpression(value) && ts.isIdentifier(value.expression) && importedCollectionTransforms.has(value.expression.text)) {
    const transform = importedCollectionTransforms.get(value.expression.text)
    const parameter = transform.parameters[0]
    if (value.arguments.length !== 1 || transform.parameters.length !== 1 || transform.asteriskToken || transform.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !parameter || !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken || parameter.initializer || parameter.questionToken) fail(value, `Imported collection transform "${value.expression.text}" must be synchronous with exactly one identifier parameter and one argument`)
    const returned = ts.isBlock(transform.body)
      ? transform.body.statements.length === 1 && ts.isReturnStatement(transform.body.statements[0]) ? transform.body.statements[0].expression : undefined
      : transform.body
    if (!returned) fail(value, `Imported collection transform "${value.expression.text}" must contain only one returned collection expression`)
    const transformSource = renderedCollectionSource(returned, new Map([[parameter.name.text, parameter.name.text]]), undefined, fail, new Set(), new Set(), new Set([parameter.name.text]))
    if (!transformSource?.state || transformSource.state.text !== parameter.name.text || transformSource.selectorStates.size) fail(value, `Imported collection transform "${value.expression.text}" must return a supported pure pipeline rooted only in its parameter`)
    const source = renderedCollectionSource(value.arguments[0], setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
    if (!source) fail(value.arguments[0], `Imported collection transform "${value.expression.text}" requires a supported collection argument`)
    return { ...source, selector: [...source.selector, ...transformSource.selector] }
  }
  if (ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression)) {
    const method = value.expression.name.text
    if (method === "filter") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection filter() requires one inline predicate")
      const source = renderedCollectionSource(value.expression.expression, setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
      if (!source) return undefined
      const parameters = collectionParameters(value.arguments[0], "Rendered collection filter()", fail)
      const selectorStates = new Set(source.selectorStates)
      return { ...source, selector: [...source.selector, ["filter", collectionExpression(unwrapExpression(value.arguments[0].body), parameters, fail, stateNames, selectorStates)]], selectorStates }
    }
    if (method === "flatMap") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection flatMap() requires one inline projector")
      const source = renderedCollectionSource(value.expression.expression, setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
      if (!source) return undefined
      const parameters = collectionParameters(value.arguments[0], "Rendered collection flatMap()", fail)
      const field = directProperty(value.arguments[0].body, parameters.item)
      if (!field) fail(value.arguments[0].body, `Rendered collection flatMap() projector must be ${parameters.item}.<field>`)
      if (["__proto__", "constructor", "prototype"].includes(field)) fail(value.arguments[0].body, `Rendered collection property "${field}" is not supported`)
      return { ...source, selector: [...source.selector, ["flatMap", field]] }
    }
    if (method === "slice") {
      if (value.arguments.length < 1 || value.arguments.length > 2) fail(value, "Rendered collection slice() requires a start and optional end")
      const source = renderedCollectionSource(value.expression.expression, setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
      if (!source) return undefined
      const selectorStates = new Set(source.selectorStates)
      const start = collectionExpression(value.arguments[0], {}, fail, stateNames, selectorStates)
      const end = value.arguments[1] && collectionExpression(value.arguments[1], {}, fail, stateNames, selectorStates)
      return { ...source, selector: [...source.selector, ["slice", start, end]], selectorStates }
    }
    if (method === "toSorted") {
      if (value.arguments.length !== 1) fail(value, "Rendered collection toSorted() requires one inline comparator")
      const source = renderedCollectionSource(value.expression.expression, setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
      if (!source) return undefined
      const comparator = value.arguments[0]
      const parameters = collectionParameters(comparator, "Rendered collection toSorted()", fail)
      if (comparator.parameters.length !== 2 || ts.isBlock(comparator.body)) fail(comparator, "Rendered collection toSorted() comparator must be a synchronous expression arrow with (left, right) identifier parameters")
      const selectorStates = new Set(source.selectorStates)
      const expression = collectionExpression(comparator.body, parameters, fail, stateNames, selectorStates)
      return { ...source, selector: [...source.selector, ["sort", expression]], selectorStates }
    }
    if (method === "sort") fail(value, "Rendered collections cannot use mutating sort(); use toSorted()")
  }
  if (isArrayFromCall(value)) {
    if (value.arguments.length < 1 || value.arguments.length > 2) fail(value, "Rendered Array.from() requires an anchor and optional inline mapper")
    const source = renderedCollectionSource(value.arguments[0], setters, declarations, fail, aliases, importedCollections, stateNames, importedCollectionTransforms, factory, context, calculatedCollection, staticCollection)
    if (!source) return undefined
    let mapper
    if (value.arguments[1]) {
      const parameters = collectionParameters(value.arguments[1], "Rendered Array.from() mapper", fail)
      const selectorStates = new Set(source.selectorStates)
      mapper = collectionExpression(unwrapExpression(value.arguments[1].body), parameters, fail, stateNames, selectorStates)
      source.selectorStates = selectorStates
    }
    return { ...source, selector: [...source.selector, ["from", mapper]] }
  }
}

function isArrayFromCall(value) {
  return ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression) && ts.isIdentifier(value.expression.expression) && value.expression.expression.text === "Array" && value.expression.name.text === "from"
}

function collectionParameters(callback, label, fail) {
  if (!ts.isArrowFunction(callback) || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || callback.parameters.length < 1 || callback.parameters.length > 2 || callback.parameters.some(parameter => !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken || parameter.initializer || parameter.questionToken)) fail(callback, `${label} callback must be a synchronous arrow function with (item) or (item, index) identifier parameters`)
  return { item: callback.parameters[0].name.text, index: callback.parameters[1]?.name.text }
}

function collectionExpression(expression, parameters, fail, stateNames = new Set(), selectorStates = new Set()) {
  const encode = node => {
    node = unwrapExpression(node)
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isNumericLiteral(node)) return ["value", ts.isNumericLiteral(node) ? Number(node.text) : node.text]
    if (node.kind === ts.SyntaxKind.TrueKeyword) return ["value", true]
    if (node.kind === ts.SyntaxKind.FalseKeyword) return ["value", false]
    if (node.kind === ts.SyntaxKind.NullKeyword) return ["value", null]
    if (ts.isIdentifier(node)) {
      if (node.text === parameters.item) return ["item"]
      if (node.text === parameters.index) return ["index"]
      if (node.text === "undefined") return ["undefined"]
      if (stateNames.has(node.text)) {
        selectorStates.add(node.text)
        return ["state", node.text]
      }
      fail(node, `Rendered collection expression identifier "${node.text}" is not allowed`)
    }
    if (ts.isPropertyAccessExpression(node)) {
      if (["__proto__", "constructor", "prototype"].includes(node.name.text)) fail(node, `Rendered collection property "${node.name.text}" is not supported`)
      return ["get", encode(node.expression), node.name.text, Boolean(node.questionDotToken)]
    }
    if (ts.isElementAccessExpression(node)) {
      const key = node.argumentExpression
      if (!ts.isStringLiteral(key) && !ts.isNumericLiteral(key)) fail(node, "Rendered collection computed properties require a direct string or numeric literal key")
      if (ts.isStringLiteral(key) && ["__proto__", "constructor", "prototype"].includes(key.text)) fail(node, `Rendered collection property "${key.text}" is not supported`)
      return ["get", encode(node.expression), ts.isNumericLiteral(key) ? Number(key.text) : key.text, Boolean(node.questionDotToken)]
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const operator = node.operator === ts.SyntaxKind.ExclamationToken ? "!" : node.operator === ts.SyntaxKind.PlusToken ? "+" : node.operator === ts.SyntaxKind.MinusToken ? "-" : undefined
      if (!operator) fail(node, "Rendered collection expression uses an unsupported unary operator")
      return ["unary", operator, encode(node.operand)]
    }
    if (ts.isTypeOfExpression(node)) return ["unary", "typeof", encode(node.expression)]
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.getText()
      if (!new Set(["&&", "||", "??", "===", "!==", "==", "!=", "<", "<=", ">", ">=", "+", "-", "*", "/", "%"]).has(operator)) fail(node, `Rendered collection expression operator "${operator}" is not supported`)
      return ["binary", operator, encode(node.left), encode(node.right)]
    }
    if (ts.isConditionalExpression(node)) return ["conditional", encode(node.condition), encode(node.whenTrue), encode(node.whenFalse)]
    if (ts.isArrayLiteralExpression(node) && !node.elements.some(ts.isSpreadElement)) return ["array", ...node.elements.map(encode)]
    if (ts.isObjectLiteralExpression(node)) return ["object", ...node.properties.map(property => {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name) && !ts.isNumericLiteral(property.name)) fail(property, "Rendered collection mapper objects require direct properties")
      return [property.name.text, encode(property.initializer)]
    })]
    if (ts.isTemplateExpression(node)) return ["template", [node.head.text, ...node.templateSpans.map(span => span.literal.text)], node.templateSpans.map(span => encode(span.expression))]
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && ["Boolean", "Number", "String"].includes(node.expression.text)) return ["global", node.expression.text, ...node.arguments.map(encode)]
      if (ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text
        if (ts.isIdentifier(node.expression.expression) && node.expression.expression.text === "Math" && pureMathMethods.has(method)) return ["math", method, ...node.arguments.map(encode)]
        if (pureListMethods.has(method)) return ["call", encode(node.expression.expression), method, ...node.arguments.map(encode)]
        if (mutatingListMethods.has(method)) fail(node, `Rendered collection expressions cannot call mutating method "${method}"`)
      }
      fail(node, "Rendered collection expressions cannot call arbitrary functions")
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isAwaitExpression(node) || ts.isNewExpression(node) || ts.isYieldExpression(node) || ts.isDeleteExpression(node) || ts.isPostfixUnaryExpression(node)) fail(node, "Rendered collection expressions must be pure and synchronous")
    fail(node, "Rendered collection expression is not supported")
  }
  return encode(expression)
}

function jsonExpression(value, factory) {
  return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("JSON"), "parse"), undefined, [factory.createStringLiteral(JSON.stringify(value))])
}

function isStateBackedListComponentCall(call, component, setters) {
  if (component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name)) return false
  const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  const stateNames = new Set(setters.values())
  const mappedProps = new Set()
  for (const element of component.parameters[0].name.elements) {
    if (!ts.isIdentifier(element.name)) continue
    const prop = (element.propertyName ?? element.name).getText()
    const attribute = attributes.properties.find(entry => ts.isJsxAttribute(entry) && entry.name.getText() === prop)
    const value = attribute?.initializer && ts.isJsxExpression(attribute.initializer) ? unwrapExpression(attribute.initializer.expression) : undefined
    if (value && ts.isIdentifier(value) && stateNames.has(value.text)) mappedProps.add(element.name.text)
  }
  if (!mappedProps.size) return false
  const returned = ts.isBlock(component.body)
    ? [...component.body.statements].reverse().find(ts.isReturnStatement)?.expression
    : component.body
  if (!returned || !containsJsx(returned)) return false
  let found = false
  const visit = node => {
    if (found || node !== returned && isFunctionLike(node)) return
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && ts.isIdentifier(node.expression.expression) && mappedProps.has(node.expression.expression.text)) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(returned)
  return found
}

function jsxCallHasDirectStateProp(call, setters) {
  const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  const stateNames = new Set(setters.values())
  return attributes.properties.some(attribute => {
    const value = ts.isJsxAttribute(attribute) && attribute.initializer && ts.isJsxExpression(attribute.initializer) ? unwrapExpression(attribute.initializer.expression) : undefined
    return value && ts.isIdentifier(value) && stateNames.has(value.text)
  })
}

function jsxSetterCallbackProps(call, setters, functions, reducers) {
  const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  return attributes.properties.flatMap(attribute => {
    if (!ts.isJsxAttribute(attribute) || !/^on[A-Z]/.test(attribute.name.text) || !attribute.initializer || !ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression) return []
    const value = unwrapExpression(attribute.initializer.expression)
    if (ts.isIdentifier(value) && setters.has(value.text)) return [attribute.name.text]
    const callback = ts.isArrowFunction(value) || ts.isFunctionExpression(value) ? value : ts.isIdentifier(value) ? functions.get(value.text) : undefined
    return callback && !nativeCaptureNames(callback, setters).size && !referencedReducerDispatches(callback.body, reducers, callback).size && referencedStateNames(callback.body, setters, callback).size ? [attribute.name.text] : []
  })
}

function jsxCallHasDirectReducerProp(call, reducers) {
  const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  return attributes.properties.some(attribute => {
    const value = ts.isJsxAttribute(attribute) && attribute.initializer && ts.isJsxExpression(attribute.initializer) ? unwrapExpression(attribute.initializer.expression) : undefined
    return value && ts.isIdentifier(value) && reducers.has(value.text)
  })
}

function jsxCallHasReducerCallbackProp(call, reducers) {
  const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  return attributes.properties.some(attribute => {
    const value = ts.isJsxAttribute(attribute) && attribute.initializer && ts.isJsxExpression(attribute.initializer) ? unwrapExpression(attribute.initializer.expression) : undefined
    return value && referencedReducerDispatches(value, reducers, value).size
  })
}

function runtimeImportNames(sourceFile, relative) {
  const names = new Set()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause || statement.importClause.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text.startsWith(".") !== relative || isStaticImport(statement.moduleSpecifier.text)) continue
    const clause = statement.importClause
    if (clause.name) names.add(clause.name.text)
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) names.add(clause.namedBindings.name.text)
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const entry of clause.namedBindings.elements) if (!entry.isTypeOnly) names.add(entry.name.text)
  }
  return names
}

function referenceIdentifiers(root, name) {
  const references = []
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && !isShadowedIdentifier(node, root)) references.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return references
}

function insideJsxEventHandler(node, root) {
  for (let current = node.parent; current && current !== root.parent; current = current.parent) {
    if (ts.isJsxAttribute(current) && /^on[A-Z]/.test(current.name.text)) return true
  }
  return false
}

function validateKeyedList(parts, sourceFile, listValues, listEventItems, listConditions, setters, rowStates, nestedLists, componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback) {
  const fail = (node, message) => {
    throw sourceNodeError(node, sourceFile, message)
  }
  const root = parts.root
  const item = parts.item
  const nestedDiagnostic = "Nested keyed list collections must be a direct property of the parent item"
  const validateElement = node => {
    const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName
    if (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) fail(node, "Keyed list items must use intrinsic JSX elements")
  }
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useId") fail(node, "useId() is not supported in keyed rows")
    if (ts.isJsxFragment(node)) fail(node, "Fragments are not supported in keyed lists")
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) validateElement(node)
    if (node !== root && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && containsJsx(node)) fail(node, nestedDiagnostic)
    if (ts.isJsxSpreadAttribute(node) && referencesIdentifier(node.expression, item)) fail(node, "Keyed list item spreads are not supported")
    if (ts.isJsxAttribute(node) && /^on[A-Z]/.test(node.name.text)) {
      listEventItems.set(node, { item, index: parts.index })
      return
    }
    if (ts.isJsxExpression(node) && node.expression) {
      const expression = unwrapExpression(node.expression)
      if (containsJsx(expression) && ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === "map") {
        const nested = nestedKeyedListParts(expression, item, fail)
        if (!nested) fail(expression, nestedDiagnostic)
        if (["__proto__", "constructor", "prototype"].includes(nested.ownerField)) fail(expression, `Nested keyed list owner property "${nested.ownerField}" is not supported`)
        if (referenceIdentifiers(nested.callback, item).length) fail(nested.root, "Nested keyed list rows cannot capture the parent item")
        const specialization = componentSpecializations.get(nested.root) ?? expandedRowSpecializations.get(nested.root) ?? nestedRowSpecializations.get(`${expression.pos}:${expression.end}`)
        const root = specialization?.root ?? nested.root
        let callback = root === nested.root ? nested.callback : factory.updateArrowFunction(
          nested.callback,
          nested.callback.modifiers,
          nested.callback.typeParameters,
          nested.callback.parameters,
          nested.callback.type,
          nested.callback.equalsGreaterThanToken,
          root
        )
        if (callback !== nested.callback) {
          ts.setParentRecursive(callback, false)
          callback.parent = nested.callback.parent
        }
        callback = prepareListCallback(callback, root, specialization ?? { hookDeclarations: [], effects: [] }, nested.item)
        const nestedParts = { ...nested, root, callback, state: parts.state, nested: true }
        for (const calculation of specialization?.calculations ?? []) {
          ts.setParentRecursive(calculation, false)
          calculation.parent = callback
          validateListExpression(calculation, nested.item, nested.root, fail)
        }
        nestedLists.set(expression, nestedParts)
        validateKeyedList(nestedParts, sourceFile, listValues, listEventItems, listConditions, setters, specialization?.rowStates ?? [], nestedLists, componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback)
        return
      }
      const condition = conditionalParts(expression)
      if (condition && containsJsx(expression)) {
        if (rowStates.some(rowState => referencedStateNames(condition.condition, setters).has(rowState.state))) {
          visit(condition.truthy)
          visit(condition.falsy)
          return
        }
        if (!referencesIdentifier(condition.condition, item) && !(parts.index && referencesIdentifier(condition.condition, parts.index))) fail(node, "Keyed list item conditions must read the item or index")
        validateListExpression(condition.condition, item, node, fail, parts.index)
        listConditions.set(node.expression, { ...condition, item, index: parts.index })
        visit(condition.truthy)
        visit(condition.falsy)
        return
      }
      const field = directProperty(expression, item)
      const isRootKey = ts.isJsxAttribute(node.parent) && node.parent.name.text === "key"
      if (field && ["__proto__", "constructor", "prototype"].includes(field)) fail(node, `Keyed list item property "${field}" is not supported`)
      if (field && ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.text.toLowerCase())) fail(node, `Keyed list item ${node.parent.name.text} is not supported`)
      if (isRootKey) return
      if (field) {
        listValues.set(node.expression, { field })
        return
      }
      if (referencesIdentifier(expression, item) || parts.index && referencesIdentifier(expression, parts.index)) {
        validateListExpression(expression, item, node, fail, parts.index)
        if (ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.text.toLowerCase())) fail(node, `Keyed list item ${node.parent.name.text} is not supported`)
        listValues.set(node.expression, { item, index: parts.index })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
}

function directConstObjectLiteral(expression, call) {
  expression = unwrapExpression(expression)
  if (ts.isObjectLiteralExpression(expression)) return expression
  if (!ts.isIdentifier(expression)) return
  const scopes = []
  for (let current = call.parent; current; current = current.parent) {
    if (isFunctionLike(current) && ts.isBlock(current.body)) scopes.push(current.body)
    if (ts.isSourceFile(current)) scopes.push(current)
  }
  for (const scope of scopes) {
    const declarations = []
    for (const statement of scope.statements) {
      if (!ts.isVariableStatement(statement)) continue
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === expression.text) declarations.push({ declaration, constant: (statement.declarationList.flags & ts.NodeFlags.Const) !== 0 })
      }
    }
    if (!declarations.length) continue
    if (declarations.length !== 1 || !declarations[0].constant || !declarations[0].declaration.initializer || declarations[0].declaration.end >= call.pos) return
    const initializer = unwrapExpression(declarations[0].declaration.initializer)
    if (ts.isObjectLiteralExpression(initializer)) return initializer
    return
  }
}

function specializedSpreadEntries(expression, call, fail, label, seen = new Set()) {
  const object = directConstObjectLiteral(expression, call)
  if (!object) fail(expression, `${label} component prop spreads must use an inline object literal or one direct const object literal declared in the calling component`)
  if (seen.has(object)) fail(expression, `${label} component prop spreads cannot be circular`)
  seen.add(object)
  const entries = []
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      entries.push(...specializedSpreadEntries(property.expression, call, fail, label, seen))
      continue
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      entries.push([property.name.text, property.name, property])
      continue
    }
    if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name) || !ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name) && !ts.isNumericLiteral(property.name)) {
      fail(property, `${label} component prop spreads must contain only direct properties`)
    }
    entries.push([property.name.text, property.initializer, property])
  }
  seen.delete(object)
  return entries
}

function specializedCallChildren(call, factory) {
  if (!ts.isJsxElement(call)) return []
  return call.children.flatMap(child => {
    if (ts.isJsxText(child)) {
      const lines = child.text.split(/\r\n|\n|\r/)
      const text = lines.length === 1
        ? child.text
        : lines.map((line, index) => {
            let text = line.replace(/\t/g, " ")
            if (index) text = text.trimStart()
            if (index < lines.length - 1) text = text.trimEnd()
            return text
          }).filter(Boolean).join(" ")
      return text ? [factory.createStringLiteral(text)] : []
    }
    if (ts.isJsxExpression(child)) return child.expression ? [child.expression] : []
    return [child]
  })
}

function flattenForwardedComponentChildren(root, factory, context) {
  const forwarded = expression => {
    const value = unwrapExpression(expression)
    if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value)) return [value]
    if (ts.isJsxFragment(value)) return [...value.children]
    if (ts.isArrayLiteralExpression(value) && !value.elements.some(ts.isSpreadElement)) {
      return value.elements.flatMap(element => {
        if (ts.isJsxFragment(element)) return [...element.children]
        if (ts.isJsxElement(element) || ts.isJsxSelfClosingElement(element)) return [element]
        return [factory.createJsxExpression(undefined, element)]
      })
    }
  }
  const visit = node => {
    if (ts.isJsxElement(node)) {
      const children = node.children.flatMap(child => {
        const values = ts.isJsxExpression(child) && child.expression ? forwarded(child.expression) : undefined
        return (values ?? [child]).map(entry => ts.visitNode(entry, visit))
      })
      return factory.updateJsxElement(node, ts.visitNode(node.openingElement, visit), children, ts.visitNode(node.closingElement, visit))
    }
    return ts.visitEachChild(node, visit, context)
  }
  return ts.visitNode(root, visit)
}

function expandSpecializedRest(root, returned, component, rest, entries, factory, context, fail, label) {
  const sourceRoot = unwrapExpression(returned)
  const sourceTag = jsxTagName(sourceRoot)
  if (!sourceTag || !ts.isIdentifier(sourceTag) || sourceTag.text[0] !== sourceTag.text[0].toLowerCase()) {
    fail(returned, `${label} component rest props must be forwarded exactly once to the direct intrinsic root`)
  }
  const sourceAttributes = ts.isJsxElement(sourceRoot) ? sourceRoot.openingElement.attributes : sourceRoot.attributes
  const spreads = sourceAttributes.properties.filter(attribute => ts.isJsxSpreadAttribute(attribute) && ts.isIdentifier(unwrapExpression(attribute.expression)) && unwrapExpression(attribute.expression).text === rest.name)
  const references = referenceIdentifiers(component.body, rest.name)
  if (spreads.length !== 1 || references.length !== 1 || unwrapExpression(spreads[0].expression) !== references[0]) {
    fail(rest.node, `${label} component rest props must be forwarded exactly once to the direct intrinsic root`)
  }
  for (const [name] of entries) {
    if (["__proto__", "constructor", "prototype"].includes(name)) fail(rest.node, `${label} component rest prop ${JSON.stringify(name)} is not supported`)
    if (name === "children") fail(rest.node, `${label} component rest props cannot forward children; destructure children explicitly`)
  }
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const expanded = attributes.properties.flatMap(attribute => {
    if (!ts.isJsxSpreadAttribute(attribute) || !ts.isIdentifier(unwrapExpression(attribute.expression)) || unwrapExpression(attribute.expression).text !== rest.name) return [attribute]
    return entries.map(([name, value]) => factory.createJsxAttribute(factory.createIdentifier(name), factory.createJsxExpression(undefined, cloneAst(value, factory, context))))
  })
  const last = new Map()
  expanded.forEach((attribute, index) => {
    if (ts.isJsxAttribute(attribute)) last.set(attribute.name.text, index)
  })
  const properties = expanded.filter((attribute, index) => !ts.isJsxAttribute(attribute) || last.get(attribute.name.text) === index)
  if (ts.isJsxSelfClosingElement(root)) return factory.updateJsxSelfClosingElement(root, root.tagName, root.typeArguments, factory.updateJsxAttributes(attributes, properties))
  const opening = factory.updateJsxOpeningElement(root.openingElement, root.openingElement.tagName, root.openingElement.typeArguments, factory.updateJsxAttributes(attributes, properties))
  return factory.updateJsxElement(root, opening, root.children, root.closingElement)
}

function specializeComponentCall(call, component, sourceFile, factory, context, fail, label = "Keyed list", allowComponentRoot = false, ordinaryHooks = false, ordinaryStateNames = new Set()) {
  if (component.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || component.asteriskToken) fail(component, `${label} components must be synchronous`)
  if (component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name)) fail(component, `${label} components must use one destructured props parameter`)
  const callAttributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  const props = new Map()
  const directProps = new Set()
  let key
  for (const attribute of callAttributes.properties) {
    if (ts.isJsxSpreadAttribute(attribute)) {
      for (const [name, value, property] of specializedSpreadEntries(attribute.expression, call, fail, label)) {
        if (["__proto__", "constructor", "prototype"].includes(name)) fail(property, `${label} component prop spread property ${JSON.stringify(name)} is not supported`)
        if (name === "key") fail(property, `${label} component prop spreads cannot declare key`)
        props.set(name, value)
      }
      continue
    }
    const name = attribute.name.text
    if (directProps.has(name) || name === "key" && key) fail(attribute, `Duplicate ${label.toLowerCase()} component prop "${name}"`)
    const value = !attribute.initializer
      ? factory.createTrue()
      : ts.isStringLiteral(attribute.initializer)
        ? factory.createStringLiteral(attribute.initializer.text)
        : ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression
          ? attribute.initializer.expression
          : factory.createIdentifier("undefined")
    if (name === "key") key = attribute
    else {
      props.set(name, value)
      directProps.add(name)
    }
  }
  const children = specializedCallChildren(call, factory)
  if (children.length) {
    if (directProps.has("children")) fail(call, `Duplicate ${label.toLowerCase()} component prop "children"`)
    props.set("children", children.length === 1 ? children[0] : factory.createArrayLiteralExpression(children))
  }
  const substitutions = new Map()
  const acceptedProps = new Set()
  let rest
  const elements = component.parameters[0].name.elements
  for (const [index, element] of elements.entries()) {
    if (element.dotDotDotToken) {
      if (!ts.isIdentifier(element.name) || element.propertyName || element.initializer || index !== elements.length - 1) fail(element, `${label} component rest props must be one final identifier binding`)
      rest = { name: element.name.text, node: element }
      continue
    }
    if (!ts.isIdentifier(element.name)) fail(element, `${label} component props cannot use nested destructuring`)
    if (element.initializer && !isSerializableStateLiteral(element.initializer)) fail(element.initializer, `${label} component prop defaults must be directly serializable primitive, plain-object, or array literals`)
    const prop = (element.propertyName ?? element.name).text
    acceptedProps.add(prop)
    substitutions.set(element.name.text, props.has(prop) ? props.get(prop) : element.initializer ?? factory.createIdentifier("undefined"))
  }
  const restEntries = [...props].filter(([prop]) => !acceptedProps.has(prop))
  if (!rest) for (const [prop] of restEntries) fail(call, `Unknown ${label.toLowerCase()} component prop "${prop}"`)

  let returned
  const calculations = []
  const effectCalls = []
  const hookDeclarations = []
  const rowStates = []
  const rowRefs = []
  const ordinaryStates = []
  const ordinaryRefs = []
  let usesComponentId = false
  if (!ts.isBlock(component.body)) {
    returned = component.body
  } else {
    const statements = [...component.body.statements]
    const last = statements.pop()
    if (!last || !ts.isReturnStatement(last) || !last.expression) fail(component.body, `${label} component must end with one JSX return`)
    for (const statement of statements) {
      if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && ts.isIdentifier(statement.expression.expression) && statement.expression.expression.text === "useEffect") {
        effectCalls.push(statement.expression)
        continue
      }
      if (!ts.isVariableStatement(statement) || (statement.declarationList.flags & ts.NodeFlags.Const) === 0 || statement.declarationList.declarations.length !== 1) fail(statement, `${label} component locals must be single const declarations`)
      const declaration = statement.declarationList.declarations[0]
      if (declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useState") {
        const hookLabel = ordinaryHooks ? "Setter-callback component" : "Keyed row"
        const initialArgument = declaration.initializer.arguments[0]
        const propReceiver = ordinaryHooks && initialArgument && ts.isCallExpression(initialArgument) && initialArgument.arguments.length === 0 && !initialArgument.questionDotToken && ts.isPropertyAccessExpression(initialArgument.expression) && !initialArgument.expression.questionDotToken && initialArgument.expression.name.text === "toString" && ts.isIdentifier(initialArgument.expression.expression) ? initialArgument.expression.expression : undefined
        const substitutedProp = propReceiver ? substitutions.get(propReceiver.text) : undefined
        const propStringInitializer = substitutedProp && ts.isIdentifier(unwrapExpression(substitutedProp)) && ordinaryStateNames.has(unwrapExpression(substitutedProp).text)
        if (declaration.initializer.arguments.length !== 1 || !isSerializableStateLiteral(initialArgument) && !propStringInitializer) throw sourceNodeError(declaration.initializer, component.getSourceFile(), `${hookLabel} useState() must use one directly serializable primitive, plain object, or array initial value${ordinaryHooks ? " or direct primitive state prop.toString()" : ""}; other dynamic initializers are not supported`)
        if (!ts.isArrayBindingPattern(declaration.name) || declaration.name.elements.length !== 2 || declaration.name.elements.some(element => !element || !ts.isBindingElement(element) || !ts.isIdentifier(element.name) || element.initializer || element.dotDotDotToken)) throw sourceNodeError(declaration.name, component.getSourceFile(), `${hookLabel} useState() must use [state, setter] identifier destructuring`)
        const suffix = `${Math.max(0, call.pos)}_${ordinaryHooks ? ordinaryStates.length : rowStates.length}`
        const state = ordinaryHooks ? `__kComponentState${suffix}` : `__kRowState${suffix}`
        const setter = ordinaryHooks ? `__kComponentSetter${suffix}` : `__kRowSetter${suffix}`
        substitutions.set(declaration.name.elements[0].name.text, factory.createIdentifier(state))
        substitutions.set(declaration.name.elements[1].name.text, factory.createIdentifier(setter))
        const binding = factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(state)),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(setter))
        ])
        const initialValue = propStringInitializer ? substituteClone(initialArgument, substitutions, factory, context) : cloneAst(initialArgument, factory, context)
        synthesizeTree(initialValue)
        const initializer = factory.createCallExpression(factory.createIdentifier(ordinaryHooks ? "__kComponentUseState" : "__kRowUseState"), undefined, [initialValue])
        hookDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(binding, undefined, undefined, initializer)], ts.NodeFlags.Const)))
        if (ordinaryHooks) ordinaryStates.push({ state, setter })
        else rowStates.push({ state, setter })
        continue
      }
      if (declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useRef") {
        const hookLabel = ordinaryHooks ? "Setter-callback component" : "Keyed row"
        if (declaration.initializer.arguments.length !== 1 || declaration.initializer.arguments[0].kind !== ts.SyntaxKind.NullKeyword) throw sourceNodeError(declaration.initializer, component.getSourceFile(), `${hookLabel} useRef() must use the direct initial value null`)
        if (!ts.isIdentifier(declaration.name)) throw sourceNodeError(declaration.name, component.getSourceFile(), `${hookLabel} useRef() must be assigned to one identifier`)
        const refs = ordinaryHooks ? ordinaryRefs : rowRefs
        const name = `${ordinaryHooks ? "__kComponentRef" : "__kRowRef"}${Math.max(0, call.pos)}_${refs.length}`
        substitutions.set(declaration.name.text, factory.createIdentifier(name))
        const initializer = factory.createCallExpression(factory.createIdentifier(ordinaryHooks ? "__kComponentUseRef" : "__kRowUseRef"), declaration.initializer.typeArguments?.map(type => cloneAst(type, factory, context)), [factory.createNull()])
        hookDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(factory.createIdentifier(name), undefined, undefined, initializer)], ts.NodeFlags.Const)))
        refs.push({ name })
        continue
      }
      if (declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useId") {
        if (!ordinaryHooks) throw sourceNodeError(declaration.initializer, component.getSourceFile(), "useId() is not supported in keyed row components")
        if (declaration.initializer.arguments.length || !ts.isIdentifier(declaration.name)) throw sourceNodeError(declaration.initializer, component.getSourceFile(), "Setter-callback component useId() must initialize one top-level const identifier without arguments")
        const name = `__kComponentId${Math.max(0, call.pos)}_${hookDeclarations.length}`
        substitutions.set(declaration.name.text, factory.createIdentifier(name))
        const initializer = factory.createCallExpression(factory.createIdentifier("__kComponentUseId"), undefined, [])
        hookDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(factory.createIdentifier(name), undefined, undefined, initializer)], ts.NodeFlags.Const)))
        usesComponentId = true
        continue
      }
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) fail(declaration, `${label} component locals must be initialized identifiers`)
      const calculation = substituteClone(declaration.initializer, substitutions, factory, context)
      calculations.push({ name: declaration.name.text, expression: calculation })
      substitutions.set(declaration.name.text, calculation)
    }
    returned = last.expression
  }
  let unsupportedHook
  const findUnsupportedHook = node => {
    if (unsupportedHook) return
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["useState", "useRef", "useId"].includes(node.expression.text)) unsupportedHook = node
    ts.forEachChild(node, findUnsupportedHook)
  }
  findUnsupportedHook(returned)
  for (const calculation of calculations) findUnsupportedHook(calculation.expression)
  if (unsupportedHook) throw sourceNodeError(unsupportedHook, component.getSourceFile(), `${ordinaryHooks ? "Setter-callback component" : "Keyed row"} ${unsupportedHook.expression.text}() must be one top-level const declaration`)
  let root = unwrapExpression(flattenForwardedComponentChildren(substituteClone(returned, substitutions, factory, context), factory, context))
  if (rest) root = expandSpecializedRest(root, returned, component, rest, restEntries, factory, context, fail, label)
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) fail(returned, `${label} component must return one JSX element`)
  const tag = jsxTagName(root)
  if (!ts.isIdentifier(tag) || !allowComponentRoot && tag.text[0] !== tag.text[0].toLowerCase()) fail(returned, `${label} component must directly return an intrinsic JSX element`)
  const rootAttributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  if (rootAttributes.properties.some(attribute => ts.isJsxAttribute(attribute) && attribute.name.text === "key")) fail(root, `${label} component intrinsic root cannot declare key`)
  if (key) root = addJsxAttribute(root, cloneAst(key, factory, context), factory)
  ts.setParentRecursive(root, false)
  root.parent = call.parent
  const effects = effectCalls.map(source => ({ source, call: substituteClone(source, substitutions, factory, context) }))
  return {
    root,
    calculations: calculations
      .filter(calculation => label !== "Reducer-dispatch" || !isFunctionLike(calculation.expression) || !isEventOnlyComponentLocal(returned, calculation.name))
      .map(calculation => calculation.expression),
    effects,
    hookDeclarations,
    rowStates,
    rowRefs,
    ordinaryStates,
    ordinaryRefs,
    usesComponentId
  }
}

function isSerializableStateLiteral(node) {
  const value = unwrapExpression(node)
  if (isPrimitiveDefaultLiteral(value)) return true
  if (ts.isArrayLiteralExpression(value)) return value.elements.every(element => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element) && isSerializableStateLiteral(element))
  if (!ts.isObjectLiteralExpression(value)) return false
  return value.properties.every(property => ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && property.name.text !== "__proto__" && isSerializableStateLiteral(property.initializer))
}

function synthesizeSerializableStateLiteral(node, factory) {
  node = unwrapExpression(node)
  if (ts.isStringLiteral(node)) return factory.createStringLiteral(node.text)
  if (ts.isNumericLiteral(node)) return factory.createNumericLiteral(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return factory.createTrue()
  if (node.kind === ts.SyntaxKind.FalseKeyword) return factory.createFalse()
  if (node.kind === ts.SyntaxKind.NullKeyword) return factory.createNull()
  if (ts.isPrefixUnaryExpression(node)) return factory.createPrefixUnaryExpression(node.operator, synthesizeSerializableStateLiteral(node.operand, factory))
  if (ts.isArrayLiteralExpression(node)) return factory.createArrayLiteralExpression(node.elements.map(element => synthesizeSerializableStateLiteral(element, factory)))
  return factory.createObjectLiteralExpression(node.properties.map(property => {
    const name = ts.isIdentifier(property.name) ? factory.createIdentifier(property.name.text) : ts.isNumericLiteral(property.name) ? factory.createNumericLiteral(property.name.text) : factory.createStringLiteral(property.name.text)
    return factory.createPropertyAssignment(name, synthesizeSerializableStateLiteral(property.initializer, factory))
  }))
}

function isPrimitiveDefaultLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNumericLiteral(node) ||
    (ts.isPrefixUnaryExpression(node) && (node.operator === ts.SyntaxKind.PlusToken || node.operator === ts.SyntaxKind.MinusToken) && ts.isNumericLiteral(node.operand)) ||
    node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword
}

function isEventOnlyComponentLocal(root, name) {
  let found = false
  let eventOnly = true
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node)) {
      found = true
      let parent = node.parent
      while (parent && parent !== root) {
        if (ts.isJsxAttribute(parent)) {
          if (!/^on[A-Z]/.test(parent.name.text)) eventOnly = false
          return
        }
        parent = parent.parent
      }
      eventOnly = false
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
  return found && eventOnly
}

function substituteClone(root, substitutions, factory, context) {
  const visit = (node, shadowed = new Set()) => {
    if (ts.isTypeNode(node)) return cloneAst(node, factory, context)
    if (ts.isShorthandPropertyAssignment(node) && substitutions.has(node.name.text) && !shadowed.has(node.name.text)) {
      return factory.createPropertyAssignment(cloneAst(node.name, factory, context), cloneAst(substitutions.get(node.name.text), factory, context))
    }
    if (ts.isIdentifier(node) && substitutions.has(node.text) && !shadowed.has(node.text) && isReferenceIdentifier(node) && !isJsxSyntaxIdentifier(node)) {
      return cloneAst(substitutions.get(node.text), factory, context)
    }
    const nextShadowed = isFunctionLike(node)
      ? new Set([...shadowed, ...node.parameters.flatMap(parameter => bindingNames(parameter.name))])
      : shadowed
    const clone = factory.cloneNode(node)
    ts.setTextRange(clone, node)
    ts.setOriginalNode(clone, node)
    return ts.visitEachChild(clone, child => visit(child, nextShadowed), context)
  }
  return visit(root)
}

function replaceSpecializedCalls(root, replacements, context) {
  const visit = node => replacements.get(node) ?? ts.visitEachChild(node, visit, context)
  return ts.visitNode(root, visit)
}

function cloneAst(root, factory, context) {
  const visit = node => {
    const clone = factory.cloneNode(node)
    ts.setTextRange(clone, node)
    ts.setOriginalNode(clone, node)
    return ts.visitEachChild(clone, visit, context)
  }
  return visit(root)
}

function synthesizeTree(root) {
  const visit = node => {
    ts.setTextRange(node, { pos: -1, end: -1 })
    ts.setOriginalNode(node, undefined)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return root
}

function addJsxAttribute(root, attribute, factory) {
  if (ts.isJsxSelfClosingElement(root)) {
    return factory.updateJsxSelfClosingElement(root, root.tagName, root.typeArguments, factory.updateJsxAttributes(root.attributes, [attribute, ...root.attributes.properties]))
  }
  const opening = factory.updateJsxOpeningElement(root.openingElement, root.openingElement.tagName, root.openingElement.typeArguments, factory.updateJsxAttributes(root.openingElement.attributes, [attribute, ...root.openingElement.attributes.properties]))
  return factory.updateJsxElement(root, opening, root.children, root.closingElement)
}

function jsxTagName(node) {
  return ts.isJsxElement(node) ? node.openingElement.tagName : ts.isJsxSelfClosingElement(node) ? node.tagName : undefined
}

function isStylesheetLink(node) {
  const element = ts.isJsxElement(node) ? node.openingElement : node
  if (!ts.isIdentifier(element.tagName) || element.tagName.text.toLowerCase() !== "link") return false
  const attribute = element.attributes.properties.find(property => ts.isJsxAttribute(property) && property.name.getText().toLowerCase() === "rel")
  if (!attribute?.initializer) return false
  const value = ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression && (ts.isStringLiteral(attribute.initializer.expression) || ts.isNoSubstitutionTemplateLiteral(attribute.initializer.expression))
      ? attribute.initializer.expression.text
      : undefined
  return value?.toLowerCase().split(/\s+/).includes("stylesheet") ?? false
}

function isContextProviderValue(node, contexts) {
  if (node.name.text !== "value") return false
  const element = node.parent?.parent
  const tag = ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName : undefined
  return ts.isPropertyAccessExpression(tag) && tag.name.text === "Provider" && ts.isIdentifier(tag.expression) && contexts.has(tag.expression.text)
}

function isJsxSyntaxIdentifier(node) {
  const parent = node.parent
  return (ts.isJsxOpeningElement(parent) || ts.isJsxClosingElement(parent) || ts.isJsxSelfClosingElement(parent)) && parent.tagName === node || ts.isJsxAttribute(parent) && parent.name === node
}

function isFunctionLike(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node) || ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node) || ts.isConstructorDeclaration(node)
}

function isDestructuredParameter(identifier, fn) {
  return fn?.parameters.some(parameter => ts.isObjectBindingPattern(parameter.name) && parameter.name.elements.some(element => ts.isIdentifier(element.name) && element.name.text === identifier.text)) ?? false
}

function isExportedDeclaration(node) {
  const statement = ts.isVariableDeclaration(node) ? node.parent?.parent : node
  return statement?.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword || modifier.kind === ts.SyntaxKind.DefaultKeyword) ?? false
}

function jsxTagUses(root, name) {
  const uses = []
  const visit = node => {
    const tag = ts.isJsxElement(node) ? node.openingElement.tagName : ts.isJsxSelfClosingElement(node) ? node.tagName : undefined
    if (tag && ts.isIdentifier(tag) && tag.text === name) uses.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return uses
}

const pureListMethods = new Set(["at", "charAt", "charCodeAt", "concat", "endsWith", "includes", "indexOf", "join", "lastIndexOf", "localeCompare", "padEnd", "padStart", "repeat", "replace", "replaceAll", "slice", "startsWith", "substring", "toLowerCase", "toUpperCase", "trim", "trimEnd", "trimStart"])
const mutatingListMethods = new Set(["copyWithin", "fill", "pop", "push", "reverse", "shift", "sort", "splice", "unshift"])
const pureMathMethods = new Set(["abs", "ceil", "floor", "max", "min", "pow", "round", "sign", "sqrt", "trunc"])
const pureListGlobals = new Set(["Boolean", "Infinity", "Math", "NaN", "Number", "String", "undefined"])
const assignmentOperators = new Set([
  ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken, ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken, ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken, ts.SyntaxKind.LessThanLessThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken, ts.SyntaxKind.AmpersandEqualsToken, ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken, ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken
])

function validateListExpression(expression, item, source, fail, index) {
  const visit = node => {
    if (ts.isTypeNode(node)) return
    if (ts.isElementAccessExpression(node) && referencesIdentifier(node.expression, item)) {
      const key = node.argumentExpression
      if (!ts.isStringLiteral(key) && !ts.isNumericLiteral(key)) fail(source, "Derived keyed list item computed properties require a direct string or numeric literal key")
      if (ts.isStringLiteral(key) && ["__proto__", "constructor", "prototype"].includes(key.text)) fail(source, `Derived keyed list item property "${key.text}" is not supported`)
    }
    if (ts.isPropertyAccessExpression(node) && ["__proto__", "constructor", "prototype"].includes(node.name.text) || ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression) && ["__proto__", "constructor", "prototype"].includes(node.argumentExpression.text)) {
      fail(source, "Derived keyed list item expressions cannot read __proto__, prototype, or constructor")
    }
    if (ts.isBinaryExpression(node) && assignmentOperators.has(node.operatorToken.kind) || ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) {
      fail(source, "Derived keyed list item expressions must be pure; assignments and updates are not supported")
    }
    if (ts.isDeleteExpression(node) || ts.isAwaitExpression(node) || ts.isNewExpression(node) || ts.isYieldExpression(node)) {
      fail(source, "Derived keyed list item expressions must be synchronous and side-effect free; delete, await, yield, and new are not supported")
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isTaggedTemplateExpression(node)) {
      fail(source, "Derived keyed list item expressions cannot create or invoke arbitrary functions")
    }
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression)) {
        const method = node.expression.name.text
        if (mutatingListMethods.has(method)) fail(source, `Derived keyed list item expressions cannot call mutating method "${method}"`)
        const receiver = node.expression.expression
        const mathCall = ts.isIdentifier(receiver) && receiver.text === "Math" && pureMathMethods.has(method)
        if (!mathCall && !pureListMethods.has(method)) fail(source, `Derived keyed list item expressions cannot call arbitrary method "${method}"`)
      } else if (!ts.isIdentifier(node.expression) || !["Boolean", "Number", "String"].includes(node.expression.text)) {
        fail(source, "Derived keyed list item expressions cannot call arbitrary functions")
      }
    }
    if (ts.isIdentifier(node) && isReferenceIdentifier(node) && !isJsxSyntaxIdentifier(node) && node.text !== item && node.text !== index && !pureListGlobals.has(node.text)) {
      fail(source, `Derived keyed list item expression identifier "${node.text}" is not allowed`)
    }
    ts.forEachChild(node, visit)
  }
  visit(expression)
}

function containsJsx(root) {
  let found = false
  const visit = node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function compileListExpression(read, expression, item, factory, listExpressions, handlerUrl, index) {
  const exportName = `listExpression${listExpressions.length}`
  listExpressions.push({ exportName, expression, item, index })
  return factory.createCallExpression(factory.createIdentifier("__kListExpression"), undefined, [read, factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)])
}

function compileListConditional(entry, factory, listExpressions, handlerUrl) {
  const exportName = `listExpression${listExpressions.length}`
  listExpressions.push({ exportName, expression: entry.condition, item: entry.item, index: entry.index })
  const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), entry.condition)
  const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
  return factory.createCallExpression(factory.createIdentifier("__kListConditional"), undefined, [
    factory.createStringLiteral(entry.kind), read, thunk(entry.truthy), thunk(entry.falsy), factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)
  ])
}

function compileListValue(expression, entry, factory, listExpressions, handlerUrl) {
  const read = factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), expression)
  return entry.field
    ? factory.createCallExpression(factory.createIdentifier("__kListField"), undefined, [read, factory.createStringLiteral(entry.field)])
    : compileListExpression(read, expression, entry.item, factory, listExpressions, handlerUrl, entry.index)
}

function directProperty(expression, objectName) {
  const value = unwrapExpression(expression)
  if (!ts.isPropertyAccessExpression(value) || !ts.isIdentifier(value.expression)) return undefined
  if (objectName !== undefined && value.expression.text !== objectName) return undefined
  return value.name.text
}

function keyedListParentTag(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isJsxElement(current)) return current.openingElement.tagName.getText().toLowerCase()
  }
  return undefined
}

function referencesIdentifier(root, name) {
  let found = false
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node)) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  visit(root)
  return found
}

function identifierReferenceCount(root, name) {
  return identifierReferences(root, name).length
}

function identifierReferences(root, name) {
  const references = []
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node) && !ts.isJsxClosingElement(node.parent)) references.push(node)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return references
}

function unwrapExpression(node) {
  return ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node) ? unwrapExpression(node.expression) : node
}

function isLocalConst(node) {
  const list = node.parent
  const statement = list?.parent
  return ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0 && ts.isVariableStatement(statement)
}

function isJsxLocalValue(expression, known) {
  const value = unwrapExpression(expression)
  if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value) || ts.isJsxFragment(value)) return true
  if (ts.isIdentifier(value)) return known.has(value.text)
  const parts = conditionalParts(value)
  return Boolean(parts && (isJsxLocalValue(parts.truthy, known) || isJsxLocalValue(parts.falsy, known)))
}

function compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl, importBindings = new Map(), clientImports = new Set()) {
  const parts = conditionalParts(expression)
  const state = parts && directStateIdentifier(parts.condition, setters)
  if (state && isPrimitiveDefaultLiteral(parts.truthy) && isPrimitiveDefaultLiteral(parts.falsy)) {
    return factory.createCallExpression(factory.createIdentifier("__kSelect"), undefined, [state, parts.truthy, parts.falsy])
  }
  return factory.createCallExpression(factory.createIdentifier("__kBinding"), undefined, compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl, importBindings, clientImports))
}

function compileConditional(kind, expression, truthy, falsy, setters, factory, context, reactiveBindings, handlerUrl) {
  const state = directStateIdentifier(expression, setters)
  const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
  if (state) return factory.createCallExpression(factory.createIdentifier("__kStateConditional"), undefined, [factory.createStringLiteral(kind), state, thunk(truthy), thunk(falsy)])
  const [initial, ...descriptor] = compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl)
  return factory.createCallExpression(factory.createIdentifier("__kConditional"), undefined, [factory.createStringLiteral(kind), initial, thunk(truthy), thunk(falsy), ...descriptor])
}

function directStateIdentifier(expression, setters) {
  const value = unwrapExpression(expression)
  return ts.isIdentifier(value) && new Set(setters.values()).has(value.text) ? value : undefined
}

function compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl, importBindings = new Map(), clientImports = new Set()) {
  const usedStates = referencedStateNames(expression, setters)
  const importedNames = referencedImportedBindings(expression, importBindings)
  const imports = [...importedNames].map(name => importBindings.get(name))
  for (const entry of imports) if (!entry.package) clientImports.add(entry.target)
  const captures = new Set([...captureNames(expression, expression, setters)].filter(name => !importedNames.has(name)))
  const exportName = `binding${reactiveBindings.length}`
  reactiveBindings.push({ exportName, expression, captures, states: usedStates, imports })
  const states = [...usedStates].map(name => factory.createArrayLiteralExpression([
    factory.createStringLiteral(name),
    factory.createIdentifier(name)
  ]))
  const scope = [...captures].map(name => factory.createArrayLiteralExpression([
    factory.createStringLiteral(name),
    factory.createIdentifier(name)
  ]))
  const stateNames = new Set(usedStates)
  const rewriteInitial = node => {
    if (ts.isShorthandPropertyAssignment(node) && stateNames.has(node.name.text)) {
      return factory.createPropertyAssignment(node.name, factory.createPropertyAccessExpression(node.name, "value"))
    }
    if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) {
      return factory.createPropertyAccessExpression(node, "value")
    }
    if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text)) {
      return factory.createPropertyAssignment(node.name, factory.createCallExpression(factory.createIdentifier("__kBindingValue"), undefined, [node.name]))
    }
    if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node)) {
      return factory.createCallExpression(factory.createIdentifier("__kBindingValue"), undefined, [node])
    }
    return ts.visitEachChild(node, rewriteInitial, context)
  }
  return [
    ts.visitNode(expression, rewriteInitial),
    factory.createStringLiteral(handlerUrl),
    factory.createStringLiteral(exportName),
    factory.createArrayLiteralExpression(states),
    factory.createArrayLiteralExpression(scope)
  ]
}

function conditionalParts(expression) {
  const unwrap = node => ts.isParenthesizedExpression(node) ? unwrap(node.expression) : node
  const value = unwrap(expression)
  if (ts.isBinaryExpression(value) && value.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
    return { kind: "and", condition: value.left, truthy: unwrap(value.right), falsy: factoryNull() }
  }
  if (ts.isConditionalExpression(value)) {
    return { kind: "ternary", condition: value.condition, truthy: unwrap(value.whenTrue), falsy: unwrap(value.whenFalse) }
  }
  return undefined
}

function factoryNull() {
  return ts.factory.createNull()
}

function compileEvent(expression, setters, reducers, functions, factory, nativeHandlers, handlerUrl, listItem, importBindings, clientImports) {
  if (ts.isIdentifier(expression)) expression = functions.get(expression.text)
  if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression) && !ts.isFunctionDeclaration(expression))) return undefined

  const optimized = referencedReducerDispatches(expression.body, reducers, expression).size ? undefined : compileOptimizedEvent(expression, setters, factory)
  if (optimized) return optimized

  rejectWorkerConstructions(expression, expression.getSourceFile(), "Relative TypeScript Worker construction is only supported directly inside an inline useEffect() callback")
  const descriptor = compileNativeCallback(expression, setters, reducers, factory, nativeHandlers, importBindings, clientImports, "handler", listItem)
  return factory.createCallExpression(factory.createIdentifier("__kNativeBehavior"), undefined, [
    factory.createStringLiteral(handlerUrl),
    factory.createStringLiteral(descriptor.exportName),
    descriptor.states,
    descriptor.scope
  ])
}

function compileNativeCallback(expression, setters, reducers, factory, entries, importBindings, clientImports, prefix, listItem, deferValues = false, snapshotNested = false) {
  const allCaptures = nativeCaptureNames(expression, setters)
  const usedReducers = referencedReducerDispatches(expression.body, reducers, expression)
  const imports = [...referencedImportedBindings(expression, importBindings)].map(name => importBindings.get(name))
  imports.push(...[...usedReducers].map(name => reducers.get(name).import).filter(Boolean))
  const captures = new Set([...allCaptures].filter(name => !importBindings.has(name)))
  for (const entry of imports) if (!entry.package) clientImports.add(entry.target)
  const usedStates = nativeStateNames(expression, setters)
  const exportName = `${prefix}${entries.length}`
  entries.push({ exportName, expression, captures, imports, setters: new Map([...setters].filter(([, state]) => usedStates.has(state))), reducers: new Map([...reducers].filter(([name]) => usedReducers.has(name))), snapshotNested })
  const value = name => deferValues
    ? factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createIdentifier(name))
    : factory.createIdentifier(name)
  return {
    exportName,
    states: factory.createArrayLiteralExpression([...usedStates].map(name => factory.createArrayLiteralExpression([
      factory.createStringLiteral(name),
      value(name)
    ]))),
    scope: factory.createArrayLiteralExpression([...captures].map(name => factory.createArrayLiteralExpression([
      factory.createStringLiteral(name),
      name === (typeof listItem === "string" ? listItem : listItem?.item)
        ? factory.createCallExpression(factory.createIdentifier("__kListItem"), undefined, [])
        : name === listItem?.index
          ? factory.createCallExpression(factory.createIdentifier("__kListIndex"), undefined, [])
          : value(name)
    ])))
  }
}

function referencedReducerDispatches(root, reducers, scopeRoot = root) {
  const used = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, scopeRoot)) used.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return used
}

function nativeStateNames(expression, setters) {
  return referencedStateNames(expression.body, setters, expression)
}

function referencedStateNames(root, setters, scopeRoot = root) {
  const stateNames = new Set(setters.values())
  const used = new Set()
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && !isShadowedIdentifier(node.expression, scopeRoot)) used.add(setters.get(node.expression.text))
    if (ts.isIdentifier(node) && setters.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, scopeRoot)) used.add(setters.get(node.text))
    if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, scopeRoot)) used.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(root)
  return used
}

function compileOptimizedEvent(expression, setters, factory) {
  const statements = ts.isBlock(expression.body) ? expression.body.statements : [factory.createExpressionStatement(expression.body)]
  const commands = statements.map(statement => {
    if (!ts.isExpressionStatement(statement)) return undefined
    return compileEventCommand(statement.expression, setters, factory)
  })
  if (!commands.length || commands.some(command => !command)) return undefined

  return factory.createCallExpression(factory.createIdentifier("__kBehavior"), undefined, [factory.createArrayLiteralExpression(commands)])
}

const nativeGlobals = new Set([
  "Array", "ArrayBuffer", "BigInt", "Blob", "Boolean", "Date", "Error", "Event", "FileReader", "FormData", "Infinity", "Intl", "JSON", "Map", "Math", "NaN", "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set", "String", "Symbol", "TypeError", "URL", "URLSearchParams", "WeakMap", "WeakSet", "WebSocket", "Worker", "alert", "atob", "btoa", "clearInterval", "clearTimeout", "console", "crypto", "document", "fetch", "globalThis", "history", "isFinite", "isNaN", "localStorage", "location", "navigator", "parseFloat", "parseInt", "queueMicrotask", "requestAnimationFrame", "setInterval", "setTimeout", "structuredClone", "undefined", "window"
])

function rewriteEffectWorkers(callback, file, sourceFile, sourceFiles, workerReferences, factory, context) {
  const visit = node => {
    const candidate = relativeWorkerCandidate(node, sourceFile)
    if (candidate) {
      if (nearestFunction(node) !== callback) throw sourceNodeError(node, sourceFile, "Relative TypeScript Worker construction must be directly inside the inline useEffect() callback, not a nested function")
      const { worker, url, specifier, options } = validateWorkerCandidate(candidate, sourceFile)
      const target = resolve(dirname(file), specifier)
      const sourceRelative = relative(sourceDirectory, target)
      if (sourceRelative.startsWith(`..${sep}`) || sourceRelative === ".." || resolve(sourceDirectory, sourceRelative) !== target) throw sourceNodeError(url.arguments[0], sourceFile, "Relative TypeScript Worker source must remain under src/")
      if (!sourceFiles.has(target)) throw sourceNodeError(url.arguments[0], sourceFile, `Relative TypeScript Worker ${JSON.stringify(specifier)} must resolve to an existing .worker.ts file under src/`)
      const identity = `${sourceRelative.replaceAll(sep, "/")}:${ts.getOriginalNode(node).getStart(sourceFile)}`
      const placeholder = `/__kudzu_worker_${createHash("sha256").update(identity).digest("hex").slice(0, 16)}__.js`
      workerReferences.push({ root: target, placeholder })
      return factory.updateNewExpression(worker, worker.expression, worker.typeArguments, [factory.createStringLiteral(placeholder), options])
    }
    return ts.visitEachChild(node, visit, context)
  }
  return ts.visitEachChild(callback, visit, context)
}

function rejectWorkerConstructions(expression, sourceFile, message) {
  const visit = node => {
    if (relativeWorkerCandidate(node, sourceFile)) throw sourceNodeError(node, sourceFile, message)
    ts.forEachChild(node, visit)
  }
  visit(expression.body ?? expression)
}

function relativeWorkerCandidate(node, sourceFile) {
  if (!ts.isNewExpression(node) || !ts.isIdentifier(node.expression) || node.expression.text !== "Worker") return undefined
  const first = node.arguments?.[0]
  if (!first || !ts.isNewExpression(first) || !ts.isIdentifier(first.expression) || first.expression.text !== "URL") return undefined
  const specifier = first.arguments?.[0]
  const base = first.arguments?.[1]
  const relativeLiteral = ts.isStringLiteral(specifier) && (specifier.text.startsWith("./") || specifier.text.startsWith("../"))
  if (!relativeLiteral && !(specifier && !ts.isStringLiteral(specifier) && base && isImportMetaUrl(base))) return undefined
  return { worker: node, url: first, sourceFile }
}

function validateWorkerCandidate(candidate, sourceFile) {
  const { worker, url } = candidate
  if (!isUnshadowedGlobal(worker.expression, sourceFile)) throw sourceNodeError(worker.expression, sourceFile, "Relative TypeScript Workers require the unshadowed global Worker constructor")
  if (!isUnshadowedGlobal(url.expression, sourceFile)) throw sourceNodeError(url.expression, sourceFile, "Relative TypeScript Workers require the unshadowed global URL constructor")
  if (url.arguments?.length !== 2 || !isImportMetaUrl(url.arguments[1])) throw sourceNodeError(url, sourceFile, "Relative TypeScript Workers require new URL(relativeLiteral, import.meta.url)")
  const specifierNode = url.arguments[0]
  if (!ts.isStringLiteral(specifierNode) || !(specifierNode.text.startsWith("./") || specifierNode.text.startsWith("../"))) throw sourceNodeError(specifierNode, sourceFile, "Relative TypeScript Worker paths must be relative string literals")
  if (/[\\?#]/.test(specifierNode.text) || !specifierNode.text.endsWith(".worker.ts")) throw sourceNodeError(specifierNode, sourceFile, "Relative TypeScript Worker paths must end in .worker.ts")
  if (worker.arguments?.length !== 2) throw sourceNodeError(worker, sourceFile, 'Relative TypeScript Workers require exactly { type: "module" } as the second argument')
  const options = worker.arguments[1]
  if (!ts.isObjectLiteralExpression(options) || options.properties.length !== 1) throw sourceNodeError(options, sourceFile, 'Relative TypeScript Workers require exactly { type: "module" } as the second argument')
  const property = options.properties[0]
  const name = ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : undefined
  if (name !== "type" || !ts.isStringLiteral(property.initializer) || property.initializer.text !== "module") throw sourceNodeError(property, sourceFile, 'Relative TypeScript Workers require exactly { type: "module" } as the second argument')
  return { worker, url, specifier: specifierNode.text, options }
}

function isImportMetaUrl(node) {
  return ts.isPropertyAccessExpression(node) && node.name.text === "url" && ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.expression.name.text === "meta"
}

function isUnshadowedGlobal(identifier, sourceFile) {
  if (isShadowedIdentifier(identifier, sourceFile)) return false
  return !sourceFile.statements.some(statement => {
    if (statementDeclaresName(statement, identifier.text)) return true
    if (!ts.isImportDeclaration(statement) || !statement.importClause) return false
    const clause = statement.importClause
    if (clause.name?.text === identifier.text) return true
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) return clause.namedBindings.name.text === identifier.text
    return clause.namedBindings && ts.isNamedImports(clause.namedBindings) ? clause.namedBindings.elements.some(entry => entry.name.text === identifier.text) : false
  })
}

function nativeCaptureNames(expression, setters) {
  return captureNames(expression, expression.body, setters)
}

function referencedImportedBindings(expression, imports) {
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && imports.has(node.text) && isReferenceIdentifier(node)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(expression.body ?? expression)
  return names
}

function captureNames(declarationRoot, referenceRoot, setters) {
  const local = new Set()
  if (!isFunctionLike(declarationRoot)) {
    const collectDeclarations = node => {
      if (ts.isVariableDeclaration(node)) for (const name of bindingNames(node.name)) local.add(name)
      if (ts.isParameter(node)) for (const name of bindingNames(node.name)) local.add(name)
      if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) local.add(node.name.text)
      ts.forEachChild(node, collectDeclarations)
    }
    collectDeclarations(declarationRoot)
  }
  const stateNames = new Set(setters.values())
  const captures = new Set()
  const visit = node => {
    if (ts.isTypeNode(node)) return
    if (ts.isIdentifier(node)) {
      const declared = isFunctionLike(declarationRoot) ? isShadowedIdentifier(node, declarationRoot) : local.has(node.text)
      if (isReferenceIdentifier(node) && !declared && !setters.has(node.text) && !stateNames.has(node.text) && !nativeGlobals.has(node.text)) captures.add(node.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(referenceRoot)
  return captures
}

function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text]
  return name.elements.flatMap(element => ts.isBindingElement(element) ? bindingNames(element.name) : [])
}

function isReferenceIdentifier(node) {
  const parent = node.parent
  if (!parent) return true
  if ((ts.isPropertyAccessExpression(parent) && parent.name === node) ||
      (ts.isPropertyAssignment(parent) && parent.name === node) ||
      (ts.isMethodDeclaration(parent) && parent.name === node) ||
      ((ts.isGetAccessorDeclaration(parent) || ts.isSetAccessorDeclaration(parent)) && parent.name === node) ||
      (ts.isVariableDeclaration(parent) && parent.name === node) ||
      (ts.isParameter(parent) && parent.name === node) ||
      (ts.isFunctionDeclaration(parent) && parent.name === node) ||
      (ts.isJsxAttribute(parent) && parent.name === node) ||
      (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) ||
      ts.isImportSpecifier(parent) || ts.isImportClause(parent)) return false
  return true
}

function nearestFunction(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current) || ts.isArrowFunction(current)) return current
  }
  return undefined
}

function nearestFunctionLike(node) {
  for (let current = node.parent; current; current = current.parent) if (isFunctionLike(current)) return current
  return undefined
}

function isShadowedByParameter(node, scopeRoot) {
  for (let current = node.parent; current; current = current.parent) {
    if (isFunctionLike(current) && current.parameters.some(parameter => bindingNames(parameter.name).includes(node.text))) return true
    if (current === scopeRoot) break
  }
  return false
}

function isShadowedIdentifier(node, scopeRoot) {
  if (isShadowedByParameter(node, scopeRoot)) return true
  if (node === scopeRoot) return false
  if (isFunctionLike(scopeRoot) && scopeRoot.name?.text === node.text) return true
  if (isFunctionLike(scopeRoot) && functionVarDeclaresName(scopeRoot, node.text)) return true
  for (let current = node.parent; current; current = current.parent) {
    if (current === scopeRoot) break
    if (ts.isFunctionExpression(current) && current.name?.text === node.text) return true
    if (ts.isBlock(current) && current.statements.some(statement => statementDeclaresName(statement, node.text))) return true
    if (ts.isCaseBlock(current) && current.clauses.some(clause => clause.statements.some(statement => statementDeclaresName(statement, node.text)))) return true
    if (ts.isCatchClause(current) && current.variableDeclaration && bindingNames(current.variableDeclaration.name).includes(node.text)) return true
    if ((ts.isForStatement(current) || ts.isForInStatement(current) || ts.isForOfStatement(current)) && loopDeclaresName(current, node.text)) return true
    if (isFunctionLike(current) && functionVarDeclaresName(current, node.text)) return true
  }
  return false
}

function statementDeclaresName(statement, name) {
  if (ts.isVariableStatement(statement)) return statement.declarationList.declarations.some(declaration => bindingNames(declaration.name).includes(name))
  if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isImportEqualsDeclaration(statement)) return statement.name?.text === name
  if ((ts.isEnumDeclaration(statement) || ts.isModuleDeclaration(statement)) && !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword)) return ts.isIdentifier(statement.name) && statement.name.text === name
  return false
}

function rejectOrdinaryWorkerImports(sourceFile, file, sourceFiles) {
  for (const node of sourceFile.statements) {
    let specifier
    let runtime = false
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      specifier = node.moduleSpecifier
      runtime = runtimeModuleReference(node)
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && ts.isStringLiteral(node.moduleReference.expression)) {
      specifier = node.moduleReference.expression
      runtime = !node.isTypeOnly
    }
    if (!runtime || !specifier?.text.startsWith(".")) continue
    let target
    try {
      target = resolveSourceImport(file, specifier.text, sourceFiles)
    } catch {
      continue
    }
    if (target.endsWith(".worker.ts")) throw sourceNodeError(specifier, sourceFile, "Worker source modules cannot be imported or re-exported as ordinary runtime modules; use new Worker(new URL(relative.worker.ts, import.meta.url), { type: \"module\" }) inside an inline useEffect() callback")
  }
}

function loopDeclaresName(loop, name) {
  const declaration = ts.isForStatement(loop) ? loop.initializer : loop.initializer
  return declaration && ts.isVariableDeclarationList(declaration) && declaration.declarations.some(entry => bindingNames(entry.name).includes(name))
}

function functionVarDeclaresName(fn, name) {
  let found = false
  const visit = node => {
    if (found || node !== fn.body && isFunctionLike(node)) return
    if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.BlockScoped) === 0 && node.declarations.some(entry => bindingNames(entry.name).includes(name))) found = true
    if (!found) ts.forEachChild(node, visit)
  }
  if (fn.body) visit(fn.body)
  return found
}

function settersForNode(node, settersByFunction) {
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isFunctionDeclaration(current) && !ts.isFunctionExpression(current) && !ts.isArrowFunction(current)) continue
    const setters = settersByFunction.get(current)
    if (setters) return setters
  }
  return new Map()
}

function reducersForNode(node, reducersByFunction) {
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isFunctionDeclaration(current) && !ts.isFunctionExpression(current) && !ts.isArrowFunction(current)) continue
    const reducers = reducersByFunction.get(current)
    if (reducers) return reducers
  }
  return new Map()
}

function clientImportBindings(sourceFile, file, sourceFiles) {
  const bindings = new Map()
  for (const node of sourceFile.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause || node.importClause.isTypeOnly || !ts.isStringLiteral(node.moduleSpecifier) || !node.moduleSpecifier.text.startsWith(".") || isStaticImport(node.moduleSpecifier.text)) continue
    let target
    try {
      target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
    } catch (error) {
      throw sourceNodeError(node.moduleSpecifier, sourceFile, error.message)
    }
    if (node.importClause.name) bindings.set(node.importClause.name.text, { kind: "default", local: node.importClause.name.text, target })
    const named = node.importClause.namedBindings
    if (named && ts.isNamespaceImport(named)) bindings.set(named.name.text, { kind: "namespace", local: named.name.text, target })
    if (named && ts.isNamedImports(named)) {
      for (const entry of named.elements) {
        if (!entry.isTypeOnly) bindings.set(entry.name.text, { kind: "named", imported: (entry.propertyName ?? entry.name).text, local: entry.name.text, target })
      }
    }
  }
  return bindings
}

function packageImportBindings(sourceFile) {
  const bindings = new Map()
  const rejectDynamic = node => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0]) ? node.arguments[0].text : null
      if (specifier === null) throw sourceNodeError(node, sourceFile, "Dynamic import specifiers are not supported")
      if (!specifier.startsWith(".")) throw sourceNodeError(node, sourceFile, `Dynamic package import ${JSON.stringify(specifier)} is not supported`)
    }
    ts.forEachChild(node, rejectDynamic)
  }
  rejectDynamic(sourceFile)
  for (const node of sourceFile.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue
    const target = node.moduleSpecifier.text
    if (!node.importClause) {
      if (!target.startsWith(".") && !["react", "react-router-dom", "@kudzujs/core"].includes(target) && !target.startsWith("@kudzujs/core/")) throw sourceNodeError(node, sourceFile, `Side-effect package import ${JSON.stringify(target)} is not supported`)
      continue
    }
    if (node.importClause.isTypeOnly) continue
    if (target.startsWith(".") || target.startsWith("node:") || target === "react" || target === "react-router-dom" || target === "@kudzujs/core" || target.startsWith("@kudzujs/core/")) continue
    if (node.importClause.name) bindings.set(node.importClause.name.text, { kind: "default", local: node.importClause.name.text, target, package: true })
    const named = node.importClause.namedBindings
    if (named && ts.isNamespaceImport(named)) bindings.set(named.name.text, { kind: "namespace", local: named.name.text, target, package: true })
    if (named && ts.isNamedImports(named)) for (const entry of named.elements) if (!entry.isTypeOnly) bindings.set(entry.name.text, { kind: "named", imported: (entry.propertyName ?? entry.name).text, local: entry.name.text, target, package: true })
  }
  return bindings
}

function importedSerializableCollectionNames(sourceFile, file, sourceFiles, sourceIndex) {
  return new Set(importedSerializableCollections(sourceFile, file, sourceFiles, sourceIndex).keys())
}

function importedSerializableCollections(sourceFile, file, sourceFiles, sourceIndex) {
  const collections = new Map()
  for (const [name, binding] of clientImportBindings(sourceFile, file, sourceFiles)) {
    if (binding.kind !== "named") continue
    const imported = parseSourceFile(binding.target, sourceIndex.get(binding.target))
    for (const statement of imported.statements) {
      if (!ts.isVariableStatement(statement) || !(statement.declarationList.flags & ts.NodeFlags.Const) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
      const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === binding.imported)
      if (declaration?.initializer && ts.isArrayLiteralExpression(unwrapExpression(declaration.initializer)) && isSerializableStateLiteral(declaration.initializer)) collections.set(name, unwrapExpression(declaration.initializer))
    }
  }
  return collections
}

function normalizeImportedStaticCollections(sourceFile, collections, factory, context) {
  if (!collections.size) return sourceFile
  const visitor = node => {
    if (ts.isPropertyAccessExpression(node) && node.name.text === "map" && ts.isIdentifier(node.expression) && collections.has(node.expression.text) && !isShadowedIdentifier(node.expression, sourceFile)) {
      return factory.updatePropertyAccessExpression(node, synthesizeTree(cloneAst(collections.get(node.expression.text), factory, context)), node.name)
    }
    return ts.visitEachChild(node, visitor, context)
  }
  return ts.visitNode(sourceFile, visitor)
}

function resolveComponentExport(file, exportName, getSource, sourceFiles, trail = []) {
  const key = `${file}:${exportName}`
  if (trail.includes(key)) throw new Error(`Imported keyed list component re-export cycle: ${[...trail, key].map(entry => relative(root, entry.slice(0, entry.lastIndexOf(":")))).join(" -> ")}`)
  const sourceFile = getSource(file)
  const nextTrail = [...trail, key]

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      const isDefault = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
      const isExported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      if (exportName === "default" && isDefault || exportName !== "default" && isExported && statement.name?.text === exportName) return statement
    }
    if (ts.isVariableStatement(statement) && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) && exportName !== "default") {
      const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === exportName)
      if (declaration?.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) return declaration.initializer
    }
    if (exportName === "default" && ts.isExportAssignment(statement) && !statement.isExportEquals && ts.isIdentifier(statement.expression)) {
      const component = localComponentDeclaration(sourceFile, statement.expression.text)
      if (component) return component
    }
    if (ts.isExportDeclaration(statement) && ts.isNamedExports(statement.exportClause)) {
      const entry = statement.exportClause.elements.find(element => !element.isTypeOnly && element.name.text === exportName)
      if (!entry) continue
      const imported = (entry.propertyName ?? entry.name).text
      if (statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
        if (!statement.moduleSpecifier.text.startsWith(".")) throw sourceNodeError(statement, sourceFile, "Imported keyed list components must use relative TypeScript re-exports")
        const target = resolveSourceImport(file, statement.moduleSpecifier.text, sourceFiles)
        return resolveComponentExport(target, imported, getSource, sourceFiles, nextTrail)
      }
      const component = localComponentDeclaration(sourceFile, imported)
      if (component) return component
    }
  }
  throw new Error(`${relative(root, file)} does not export a statically analyzable keyed list component named ${JSON.stringify(exportName)}`)
}

function localComponentDeclaration(sourceFile, name) {
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return statement
    if (ts.isVariableStatement(statement)) {
      const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === name)
      if (declaration?.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) return declaration.initializer
    }
  }
  return undefined
}

function sourceNodeError(node, fallbackSource, message) {
  const original = ts.getOriginalNode(node)
  const sourceFile = original.getSourceFile?.()?.fileName ? original.getSourceFile() : fallbackSource
  const position = sourceFile.getLineAndCharacterOfPosition(original.getStart(sourceFile))
  return new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${message}`)
}

function sourceLocation(node, fallbackSource) {
  const original = ts.getOriginalNode(node)
  const sourceFile = original.getSourceFile?.()?.fileName ? original.getSourceFile() : fallbackSource
  const position = sourceFile.getLineAndCharacterOfPosition(original.getStart(sourceFile))
  return `${sourceFile.fileName}:${position.line + 1}:${position.character + 1}`
}

function effectReturns(callback) {
  let cleanup = false
  let invalid
  const cleanups = []
  const visit = node => {
    if (invalid || node !== callback.body && isFunctionLike(node)) return
    if (ts.isReturnStatement(node) && node.expression) {
      const expression = unwrapExpression(node.expression)
      if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
        cleanup = true
        cleanups.push(expression)
      }
      else invalid = node
    }
    if (!invalid) ts.forEachChild(node, visit)
  }
  visit(callback.body)
  return { cleanup, cleanups, invalid }
}

function printClientImports(entries, handlerPath) {
  const unique = new Map(entries.map(entry => [`${entry.target}:${entry.kind}:${entry.imported ?? ""}:${entry.local}`, entry]))
  const groups = Map.groupBy(unique.values(), entry => entry.target)
  const imports = []
  for (const [target, group] of groups) {
    const specifier = group[0].package ? target : relativeModulePath(handlerPath, clientModulePath(target))
    const defaults = group.filter(entry => entry.kind === "default")
    const named = group.filter(entry => entry.kind === "named")
    if (defaults.length === 1 || named.length) imports.push(`import ${defaults.length === 1 ? `${defaults[0].local}${named.length ? ", " : ""}` : ""}${named.length ? `{ ${named.map(entry => entry.imported === entry.local ? entry.local : `${entry.imported} as ${entry.local}`).join(", ")} }` : ""} from ${JSON.stringify(specifier)}`)
    if (defaults.length > 1) for (const entry of defaults) imports.push(`import ${entry.local} from ${JSON.stringify(specifier)}`)
    for (const entry of group.filter(entry => entry.kind === "namespace")) imports.push(`import * as ${entry.local} from ${JSON.stringify(specifier)}`)
  }
  return imports.join("\n")
}

async function emitWorkers(references, sourceFiles, assetsDirectory, base, minify) {
  const roots = [...new Set(references.map(reference => reference.root))].sort()
  if (!roots.length) return new Map()
  await validateWorkerGraphs(roots, sourceFiles)
  const workerDirectory = join(assetsDirectory, "workers")
  await mkdir(workerDirectory, { recursive: true })
  const result = await bundle({
    absWorkingDir: root,
    entryPoints: roots,
    outbase: sourceDirectory,
    outdir: workerDirectory,
    entryNames: "[dir]/[name]-[hash]",
    chunkNames: "chunks/[name]-[hash]",
    bundle: true,
    splitting: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    minify,
    legalComments: "none",
    metafile: true,
    logLevel: "silent"
  })
  const emitted = new Map()
  for (const [output, metadata] of Object.entries(result.metafile.outputs)) {
    if (!metadata.entryPoint) continue
    const entry = resolve(root, metadata.entryPoint)
    const rootReferences = references.filter(reference => reference.root === entry)
    const outputFile = resolve(root, output)
    const url = assetPath(base, relative(outputDirectory, outputFile).replaceAll(sep, "/"))
    for (const reference of rootReferences) emitted.set(reference.placeholder, url)
  }
  for (const reference of references) if (!emitted.has(reference.placeholder)) throw new Error(`Worker entry was not emitted: ${relative(root, reference.root)}`)
  return emitted
}

async function validateWorkerGraphs(roots, sourceFiles) {
  const visited = new Set()
  const queue = [...roots]
  while (queue.length) {
    const file = queue.shift()
    if (visited.has(file)) continue
    visited.add(file)
    const sourceFile = parseSourceFile(file, await readFile(file, "utf8"))
    if (containsJsx(sourceFile)) throw sourceNodeError(sourceFile, sourceFile, "Worker modules must not contain JSX")
    const visit = node => {
      if (ts.isImportEqualsDeclaration(node)) throw sourceNodeError(node, sourceFile, "TypeScript import-equals declarations are not supported in Worker modules; use a relative ESM import")
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) throw sourceNodeError(node, sourceFile, "Dynamic imports are not supported in Worker modules")
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require") throw sourceNodeError(node, sourceFile, "require() is not supported in Worker modules")
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
    for (const node of sourceFile.statements) {
      if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier) || !runtimeModuleReference(node)) continue
      if (!node.moduleSpecifier.text.startsWith(".")) throw sourceNodeError(node.moduleSpecifier, sourceFile, "Worker modules may only use relative runtime imports")
      try {
        queue.push(resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles))
      } catch (error) {
        const message = error.message.slice(error.message.indexOf("Relative import"))
        throw sourceNodeError(node.moduleSpecifier, sourceFile, message)
      }
    }
  }
}

async function collectClientModules(entries, sourceFiles) {
  const modules = new Set()
  const queue = [...new Set(entries)]
  while (queue.length) {
    const file = queue.shift()
    if (modules.has(file)) continue
    const source = await readFile(file, "utf8")
    const sourceFile = parseSourceFile(file, source)
    rejectWorkerConstructions(sourceFile, sourceFile, "Relative TypeScript Worker construction is only supported directly inside an inline useEffect() callback, not imported client helpers")
    if (containsJsx(sourceFile)) throw new Error(`${relative(root, file)} Imported client helpers must not contain JSX`)
    rejectUnsupportedClientImports(sourceFile, file)
    modules.add(file)
    for (const node of sourceFile.statements) {
      if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier) || !runtimeModuleReference(node)) continue
      if (!node.moduleSpecifier.text.startsWith(".")) throw new Error(`${relative(root, file)} Imported client helpers may only use relative runtime imports`)
      if (isStaticImport(node.moduleSpecifier.text)) continue
      queue.push(resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles))
    }
  }
  const outputs = new Map()
  for (const file of modules) {
    const output = clientModulePath(file)
    if (outputs.has(output)) throw new Error(`${relative(root, file)} and ${relative(root, outputs.get(output))} emit the same client module path`)
    outputs.set(output, file)
  }
  return [...modules].sort()
}

async function compileClientModule(file, sourceFiles, staticFiles, importedAssets, cssModules, base) {
  const source = await readFile(file, "utf8")
  const transformer = context => sourceFile => {
    const factory = context.factory
    const visitor = node => {
      if (ts.isImportDeclaration(node) && runtimeModuleReference(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        if (isStaticImport(node.moduleSpecifier.text)) return staticImportEntry(node, sourceFile, file, staticFiles, importedAssets, cssModules, base, factory)?.replacement
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral(relativeModulePath(clientModulePath(file), clientModulePath(target))), node.attributes)
      }
      if (ts.isExportDeclaration(node) && runtimeModuleReference(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, factory.createStringLiteral(relativeModulePath(clientModulePath(file), clientModulePath(target))), node.attributes)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(sourceFile, visitor)
  }
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    transformers: { before: [transformer] },
    reportDiagnostics: true
  })
  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  return result.outputText
}

function resolveSourceImport(importer, specifier, sourceFiles) {
  const base = resolve(dirname(importer), specifier)
  const extension = extname(base)
  const stem = /\.(?:js|jsx|ts|tsx)$/.test(extension) ? base.slice(0, -extension.length) : base
  const candidates = extension === ".ts" || extension === ".tsx"
    ? [base]
    : [`${stem}.ts`, `${stem}.tsx`, join(stem, "index.ts"), join(stem, "index.tsx")]
  const matches = candidates.filter(candidate => sourceFiles.has(candidate))
  if (matches.length !== 1) throw new Error(`${relative(root, importer)} Relative import ${JSON.stringify(specifier)} must resolve to one TypeScript file in src/`)
  return matches[0]
}

function staticImportExtension(specifier) {
  return extname(specifier.split(/[?#]/, 1)[0]).toLowerCase()
}

function isStaticImport(specifier) {
  const extension = staticImportExtension(specifier)
  return extension === ".css" || staticAssetExtensions.has(extension)
}

function resolveStaticImport(importer, specifier, staticFiles) {
  const target = resolve(dirname(importer), specifier.split(/[?#]/, 1)[0])
  if (!staticFiles.has(target)) throw new Error(`${relative(root, importer)} Relative asset import ${JSON.stringify(specifier)} must resolve to an existing regular file under src/`)
  return target
}

async function safeStaticFiles(files) {
  const sourceRoot = await realpath(sourceDirectory)
  const entries = await Promise.all(files.map(async file => {
    try {
      const target = await realpath(file)
      const path = relative(sourceRoot, target)
      if (path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path) || !(await stat(target)).isFile()) return undefined
      return file
    } catch {
      return undefined
    }
  }))
  return new Set(entries.filter(Boolean))
}

function orderSourceStyles(cssFiles, sourceFiles, sourceIndex, staticFiles) {
  const ordered = []
  const seenStyles = new Set()
  const seenSources = new Set()
  const sourceSet = new Set(sourceFiles)
  const visit = file => {
    if (seenSources.has(file)) return
    seenSources.add(file)
    const sourceFile = parseSourceFile(file, sourceIndex.get(file))
    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.startsWith(".")) continue
      const specifier = statement.moduleSpecifier.text
      if (staticImportExtension(specifier) === ".css") {
        let target
        try { target = resolveStaticImport(file, specifier, staticFiles) } catch { continue }
        if (!seenStyles.has(target)) {
          seenStyles.add(target)
          ordered.push(target)
        }
        continue
      }
      if (isStaticImport(specifier)) continue
      try { visit(resolveSourceImport(file, specifier, sourceSet)) } catch {}
    }
  }
  for (const file of sourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))) visit(file)
  for (const file of sourceFiles) visit(file)
  return [...ordered, ...cssFiles.filter(file => !seenStyles.has(file))]
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

function staticImportEntry(node, sourceFile, file, staticFiles, importedAssets, cssModules, base, factory) {
  const specifier = node.moduleSpecifier.text
  if (specifier.includes("\\") || specifier.includes("#")) throw sourceNodeError(node.moduleSpecifier, sourceFile, "Static asset imports require forward-slash paths without hash suffixes")
  const queryIndex = specifier.indexOf("?")
  const query = queryIndex === -1 ? "" : specifier.slice(queryIndex + 1)
  if (query && query !== "url") throw sourceNodeError(node.moduleSpecifier, sourceFile, "Static asset imports support only the ?url query")
  let target
  try {
    target = resolveStaticImport(file, specifier, staticFiles)
  } catch (error) {
    throw sourceNodeError(node.moduleSpecifier, sourceFile, error.message)
  }
  if (node.attributes) throw sourceNodeError(node.attributes, sourceFile, "Static asset import attributes are not supported")
  const extension = staticImportExtension(specifier)
  if (query === "url") {
    if (!node.importClause?.name || node.importClause.isTypeOnly || node.importClause.namedBindings) throw sourceNodeError(node, sourceFile, "Static assets require one default import")
    if (extension !== ".css") importedAssets.add(target)
    const value = factory.createStringLiteral(assetPath(base, `assets/${relative(sourceDirectory, target).replaceAll(sep, "/")}`))
    return staticImportReplacement(node.importClause.name.text, value, factory)
  }
  if (extension === ".css") {
    const classes = cssModules.get(target)
    if (!node.importClause) return undefined
    if (!classes || !node.importClause.name || node.importClause.isTypeOnly || node.importClause.namedBindings) {
      const message = classes ? "CSS Modules require one default import" : "CSS imports must be side-effect imports"
      throw sourceNodeError(node.importClause, sourceFile, message)
    }
    const value = factory.createObjectLiteralExpression(Object.entries(classes).sort(([left], [right]) => left.localeCompare(right)).map(([name, scoped]) => factory.createPropertyAssignment(factory.createStringLiteral(name), factory.createStringLiteral(scoped))))
    return staticImportReplacement(node.importClause.name.text, value, factory)
  }
  if (!node.importClause?.name || node.importClause.isTypeOnly || node.importClause.namedBindings) throw sourceNodeError(node, sourceFile, "Static assets require one default import")
  importedAssets.add(target)
  const value = factory.createStringLiteral(assetPath(base, `assets/${relative(sourceDirectory, target).replaceAll(sep, "/")}`))
  return staticImportReplacement(node.importClause.name.text, value, factory)
}

function staticImportReplacement(name, value, factory) {
  return {
    name,
    value,
    replacement: factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
      factory.createVariableDeclaration(name, undefined, undefined, value)
    ], ts.NodeFlags.Const))
  }
}

function runtimeModuleReference(node) {
  if (ts.isExportDeclaration(node)) return !node.isTypeOnly && (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some(entry => !entry.isTypeOnly))
  const clause = node.importClause
  if (!clause) return true
  if (clause.isTypeOnly) return false
  if (clause.name || clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) return true
  return clause.namedBindings?.elements.some(entry => !entry.isTypeOnly) ?? false
}

function rejectUnsupportedClientImports(sourceFile, file) {
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) throw new Error(`${relative(root, file)} Dynamic imports are not supported in imported client helpers`)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require") throw new Error(`${relative(root, file)} require() is not supported in imported client helpers`)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
}

function parseSourceFile(file, source) {
  return ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}

function layoutExportError(file, source) {
  const sourceFile = parseSourceFile(file, source)
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      const specifier = statement.exportClause.elements.find(entry => entry.name.text === "layout")
      if (specifier) return sourceNodeError(specifier, sourceFile, "layout export must be a function")
    }
    if (ts.isVariableStatement(statement) && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const declaration = statement.declarationList.declarations.find(entry => ts.isIdentifier(entry.name) && entry.name.text === "layout")
      if (declaration) return sourceNodeError(declaration, sourceFile, "layout export must be a function")
    }
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === "layout") return sourceNodeError(statement, sourceFile, "layout export must be a function")
  }
  return new Error(`${relative(root, file)} layout export must be a function`)
}

function clientModulePath(file) {
  return `modules/${relative(sourceDirectory, file).replaceAll(sep, "/").replace(/\.(?:ts|tsx)$/, ".js")}`
}

function relativeModulePath(from, to) {
  const path = relative(dirname(from), to).replaceAll(sep, "/")
  return path.startsWith(".") ? path : `./${path}`
}

function printNativeHandler({ exportName, expression, captures, setters, reducers = new Map(), snapshotNested }) {
  const factory = ts.factory
  const stateNames = new Set(setters.values())
  const snapshotNames = snapshotNested ? nestedStateNames(expression, setters) : new Set()
  const snapshots = new Map([...snapshotNames].map(name => [name, factory.createUniqueName("__kEffectState")]))
  const captureSnapshotNames = snapshotNested ? nestedCaptureNames(expression, captures) : new Set()
  const captureSnapshots = new Map([...captureSnapshotNames].map(name => [name, factory.createUniqueName("__kEffectCapture")]))
  const transformer = context => root => {
    const visitor = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && reducers.has(node.expression.text) && !isShadowedIdentifier(node.expression, expression)) {
        const reducer = reducers.get(node.expression.text)
        if (reducer.store) return zustandActionDispatch(factory, reducer, node.arguments.map(argument => ts.visitNode(argument, visitor)))
        if (node.arguments.length !== 1) throw sourceNodeError(node, expression.getSourceFile(), "Reducer dispatches require exactly one action")
        return reducerDispatch(factory, reducer, ts.visitNode(node.arguments[0], visitor))
      }
      if (ts.isShorthandPropertyAssignment(node) && reducers.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
        if (reducers.get(node.name.text).store) throw sourceNodeError(node, expression.getSourceFile(), "Zustand actions must be called directly inside an event handler")
        return factory.createPropertyAssignment(node.name, reducerReference(factory, reducers.get(node.name.text)))
      }
      if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
        if (reducers.get(node.text).store) throw sourceNodeError(node, expression.getSourceFile(), "Zustand actions must be called directly inside an event handler")
        return reducerReference(factory, reducers.get(node.text))
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text) && !isShadowedIdentifier(node.expression, expression)) {
        return factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"),
          undefined,
          [factory.createStringLiteral(setters.get(node.expression.text)), ...node.arguments.map(argument => ts.visitNode(argument, visitor))]
        )
      }
      if (ts.isShorthandPropertyAssignment(node) && setters.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
        return factory.createPropertyAssignment(node.name, setterReference(factory, setters.get(node.name.text)))
      }
      if (ts.isIdentifier(node) && setters.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
        return setterReference(factory, setters.get(node.text))
      }
      if (ts.isShorthandPropertyAssignment(node) && stateNames.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
        if (snapshots.has(node.name.text) && insideNestedFunction(node, expression)) return factory.createPropertyAssignment(node.name, snapshots.get(node.name.text))
        return factory.createPropertyAssignment(node.name, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(node.name.text)]))
      }
      if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
        if (snapshots.has(node.text) && insideNestedFunction(node, expression)) return snapshots.get(node.text)
        return factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
          undefined,
          [factory.createStringLiteral(node.text)]
        )
      }
      if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
        if (captureSnapshots.has(node.name.text) && insideNestedFunction(node, expression)) return factory.createPropertyAssignment(node.name, captureSnapshots.get(node.name.text))
        return factory.createPropertyAssignment(node.name, scopeRead(factory, node.name.text))
      }
      if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
        if (captureSnapshots.has(node.text) && insideNestedFunction(node, expression)) return captureSnapshots.get(node.text)
        return scopeRead(factory, node.text)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(root, visitor)
  }
  const transformed = ts.transform(expression.body, [transformer])
  try {
    let body = ts.isBlock(expression.body)
      ? transformed.transformed[0]
      : factory.createBlock([factory.createReturnStatement(transformed.transformed[0])], true)
    const snapshotDeclarations = [
      ...[...snapshots].map(([name, identifier]) => factory.createVariableDeclaration(identifier, undefined, undefined, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"), undefined, [factory.createStringLiteral(name)]))),
      ...[...captureSnapshots].map(([name, identifier]) => factory.createVariableDeclaration(identifier, undefined, undefined, factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "scope"), undefined, [factory.createStringLiteral(name)])))
    ]
    if (snapshotDeclarations.length) body = factory.updateBlock(body, [
      factory.createVariableStatement(undefined, factory.createVariableDeclarationList(snapshotDeclarations, ts.NodeFlags.Const)),
      ...body.statements
    ])
    const modifiers = [factory.createModifier(ts.SyntaxKind.ExportKeyword)]
    if (expression.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) modifiers.push(factory.createModifier(ts.SyntaxKind.AsyncKeyword))
    const declaration = factory.createFunctionDeclaration(
      modifiers,
      expression.asteriskToken,
      exportName,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, "__k"), ...expression.parameters],
      undefined,
      body
    )
    return ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile())
  } finally {
    transformed.dispose()
  }
}

function nestedCaptureNames(expression, captures) {
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node) && insideNestedFunction(node, expression) && !isShadowedIdentifier(node, expression)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(expression.body)
  return names
}

function nestedStateNames(expression, setters) {
  const states = new Set(setters.values())
  const names = new Set()
  const visit = node => {
    if (ts.isIdentifier(node) && states.has(node.text) && isReferenceIdentifier(node) && insideNestedFunction(node, expression) && !isShadowedIdentifier(node, expression)) names.add(node.text)
    ts.forEachChild(node, visit)
  }
  visit(expression.body)
  return names
}

function insideNestedFunction(node, root) {
  for (let current = node.parent; current && current !== root; current = current.parent) {
    if (isFunctionLike(current)) return true
  }
  return false
}

function setterReference(factory, stateName) {
  return factory.createArrowFunction(
    undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, "value")],
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(stateName), factory.createIdentifier("value")])
  )
}

function reducerReference(factory, reducer) {
  const action = factory.createUniqueName("__kAction")
  return factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, action)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), reducerDispatch(factory, reducer, action))
}

function reducerDispatch(factory, reducer, action) {
  if (reducer.store) return zustandActionDispatch(factory, reducer, [action])
  const previous = factory.createUniqueName("__kPrevious")
  const update = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, previous)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createCallExpression(factory.createIdentifier(reducer.reducer), undefined, [previous, action]))
  return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(reducer.state), update])
}

function zustandActionDispatch(factory, reducer, args) {
  const previous = factory.createUniqueName("__kPrevious")
  const current = factory.createUniqueName("__kStore")
  const updateValue = factory.createUniqueName("__kUpdate")
  const partial = factory.createUniqueName("__kPartial")
  const action = factory.createUniqueName("__kAction")
  const set = factory.createIdentifier(reducer.store.setName)
  const merge = factory.createExpressionStatement(factory.createBinaryExpression(current, factory.createToken(ts.SyntaxKind.EqualsToken), factory.createObjectLiteralExpression([
    factory.createSpreadAssignment(current),
    factory.createSpreadAssignment(partial)
  ])))
  const setBody = factory.createBlock([
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(partial, undefined, undefined, factory.createConditionalExpression(
      factory.createBinaryExpression(factory.createTypeOfExpression(updateValue), factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken), factory.createStringLiteral("function")),
      undefined,
      factory.createCallExpression(updateValue, undefined, [current]),
      undefined,
      updateValue
    ))], ts.NodeFlags.Const)),
    merge
  ], true)
  const body = factory.createBlock([
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(current, undefined, undefined, factory.createObjectLiteralExpression([factory.createPropertyAssignment(reducer.store.field, previous)]))], ts.NodeFlags.Let)),
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(set, undefined, undefined, factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, updateValue)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), setBody))], ts.NodeFlags.Const)),
    factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(action, undefined, undefined, synthesizeTree(reducer.store.actions.get(reducer.action)))], ts.NodeFlags.Const)),
    factory.createExpressionStatement(factory.createCallExpression(action, undefined, args)),
    factory.createReturnStatement(factory.createPropertyAccessExpression(current, reducer.store.field))
  ], true)
  const update = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, previous)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), body)
  return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"), undefined, [factory.createStringLiteral(reducer.state), update])
}

function printReactiveBinding({ exportName, expression, captures, states }) {
  const factory = ts.factory
  const transformer = context => root => {
    const visitor = node => {
      if (ts.isShorthandPropertyAssignment(node) && states.has(node.name.text)) {
        return factory.createPropertyAssignment(
          node.name,
          factory.createCallExpression(
            factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
            undefined,
            [factory.createStringLiteral(node.name.text)]
          )
        )
      }
      if (ts.isIdentifier(node) && states.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) {
        return factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "get"),
          undefined,
          [factory.createStringLiteral(node.text)]
        )
      }
      if (ts.isShorthandPropertyAssignment(node) && captures.has(node.name.text)) {
        return factory.createPropertyAssignment(node.name, scopeRead(factory, node.name.text))
      }
      if (ts.isIdentifier(node) && captures.has(node.text) && isReferenceIdentifier(node)) {
        return scopeRead(factory, node.text)
      }
      return ts.visitEachChild(node, visitor, context)
    }
    return ts.visitNode(root, visitor)
  }
  const transformed = ts.transform(expression, [transformer])
  try {
    const declaration = factory.createFunctionDeclaration(
      [factory.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      exportName,
      undefined,
      [factory.createParameterDeclaration(undefined, undefined, "__k")],
      undefined,
      factory.createBlock([factory.createReturnStatement(transformed.transformed[0])], true)
    )
    return ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile())
  } finally {
    transformed.dispose()
  }
}

function printListExpression({ exportName, expression, item, index }) {
  const declaration = ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    exportName,
    undefined,
    [ts.factory.createParameterDeclaration(undefined, undefined, item), ts.factory.createParameterDeclaration(undefined, undefined, index ?? "__kIndex")],
    undefined,
    ts.factory.createBlock([ts.factory.createReturnStatement(expression)], true)
  )
  return ts.createPrinter().printNode(ts.EmitHint.Unspecified, declaration, expression.getSourceFile())
}

function scopeRead(factory, name) {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "scope"),
    undefined,
    [factory.createStringLiteral(name)]
  )
}

function compileEventCommand(expression, setters, factory) {
  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && ts.isIdentifier(expression.expression.expression) && expression.expression.expression.text === "console" && expression.expression.name.text === "log" && expression.arguments.length === 2 && ts.isStringLiteral(expression.arguments[0]) && ts.isIdentifier(expression.arguments[1]) && [...setters.values()].includes(expression.arguments[1].text)) {
    return command(factory, "log", expression.arguments[1], factory.createStringLiteral(expression.arguments[0].text))
  }

  if (!ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression) || expression.arguments.length !== 1) return undefined
  const stateName = setters.get(expression.expression.text)
  if (!stateName) return undefined

  const state = factory.createIdentifier(stateName)
  const value = expression.arguments[0]
  if (ts.isBinaryExpression(value) && ts.isIdentifier(value.left) && value.left.text === stateName && ts.isNumericLiteral(value.right)) {
    if (value.operatorToken.kind !== ts.SyntaxKind.PlusToken && value.operatorToken.kind !== ts.SyntaxKind.MinusToken) return undefined
    return command(factory, "add", state, numericExpression(factory, Number(value.right.text), value.operatorToken.kind === ts.SyntaxKind.MinusToken))
  }
  if (ts.isArrowFunction(value) && value.parameters.length === 1 && ts.isIdentifier(value.parameters[0].name) && ts.isBinaryExpression(value.body) && ts.isIdentifier(value.body.left) && value.body.left.text === value.parameters[0].name.text && ts.isNumericLiteral(value.body.right)) {
    if (value.body.operatorToken.kind !== ts.SyntaxKind.PlusToken && value.body.operatorToken.kind !== ts.SyntaxKind.MinusToken) return undefined
    return command(factory, "add", state, numericExpression(factory, Number(value.body.right.text), value.body.operatorToken.kind === ts.SyntaxKind.MinusToken))
  }
  if (isPrimitiveLiteral(value)) return command(factory, "set", state, synthesizeSerializableStateLiteral(value, factory))
  return undefined
}

function command(factory, operation, state, value) {
  return factory.createArrayLiteralExpression([factory.createStringLiteral(operation), state, value])
}

function isPrimitiveLiteral(node) {
  return isPrimitiveDefaultLiteral(node)
}

function numericExpression(factory, value, negative) {
  const literal = factory.createNumericLiteral(value)
  return negative ? factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, literal) : literal
}

function compiledPath(file) {
  return join(workDirectory, relative(sourceDirectory, file)).replace(/\.(?:ts|tsx)$/, ".mjs")
}

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

function normalizeStyles(value, base) {
  if (value === undefined) return { urls: [], sources: [] }
  if (!Array.isArray(value)) throw new Error("kudzu.config styles must be an array")
  const urls = []
  const sources = []
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

function specializeNavigationTextDescriptors(source) {
  const dynamic = source
    .replace("const textDescriptors = globalThis.__KUDZU_TEXT_BINDINGS__ && typeof document !== \"undefined\" ? JSON.parse(document.body.dataset.kTextBindings ?? \"[]\") : []", "const textDescriptors = () => globalThis.__KUDZU_TEXT_BINDINGS__ ? JSON.parse(document.body.dataset.kTextBindings ?? \"[]\") : []")
    .replace("const descriptor = textDescriptors[Number(node.data.slice(\"k-text:\".length))]", "const descriptor = textDescriptors()[Number(node.data.slice(\"k-text:\".length))]")
  if (dynamic === source) throw new Error("Navigation text descriptor specialization did not match binding-runtime.js")
  return dynamic
}

function normalizeBase(value) {
  if (value == null || value === "" || value === "/") return ""
  if (typeof value !== "string" || !value.startsWith("/") || /[?#\0]/.test(value) || /%(?:2f|5c)/i.test(value)) throw new Error("kudzu.config base must be a root-relative path")
  let decoded
  try { decoded = decodeURIComponent(value) } catch { throw new Error("kudzu.config base must be a root-relative path") }
  if (/[\\?#\0]/.test(decoded) || decoded.split("/").includes("..") || [...decoded].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159)) throw new Error("kudzu.config base must be a root-relative path")
  return value.replace(/\/+$/, "")
}

function browserPath(path) {
  return path ? new URL(path, "http://kudzu.local").pathname : ""
}

function assetPath(base, path) {
  return `${base}/${path}`
}

function withBase(base, path) {
  return base ? `${base}${path}` : path
}

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

function contentType(file) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
  }[extname(file)] ?? "application/octet-stream"
}
