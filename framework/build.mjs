import { createServer } from "node:http"
import { createHash, randomUUID } from "node:crypto"
import { cp, mkdir, readFile, readdir, rm, stat, watch, writeFile } from "node:fs/promises"
import { dirname, extname, join, relative, resolve, sep } from "node:path"
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

const devClient = (session, revision, schema) => `<script>(()=>{const show=event=>{let box=document.getElementById("__kudzu_error");if(!box){box=document.createElement("div");box.id="__kudzu_error";box.setAttribute("role","alert");box.setAttribute("aria-live","assertive");box.style.cssText="position:fixed;inset:0;z-index:2147483647;overflow:auto;padding:2rem;background:#200;color:#fff;font:16px/1.5 ui-monospace,monospace";const title=document.createElement("strong"),text=document.createElement("pre");title.textContent="Kudzu build error";text.style.whiteSpace="pre-wrap";box.append(title,text);document.body.append(box)}box.querySelector("pre").textContent=event.data};const schema=${inlineJson(schema)},route=location.pathname+location.search+location.hash,urls=[...document.querySelectorAll('script[type="module"][src]')].map(node=>node.src).filter(url=>/\\/assets\\/kudzu(?:-(?:binding|list|native))?\\.js$/.test(new URL(url).pathname));const devImport=import("/__kudzu_dev.js"),runtimeImports=Promise.allSettled(urls.map(url=>import(url)));const ready=(async()=>{const dev=await devImport,modules=await runtimeImports,runtime=modules.find(result=>result.status==="fulfilled"&&result.value.browserState instanceof Map&&typeof result.value.commitDom==="function")?.value;try{dev.restoreState(sessionStorage,route,runtime?.browserState,schema,runtime?.commitDom)}catch{}return{dev,runtime}})().catch(()=>({}));const events=new EventSource("/__kudzu_reload?session=${session}&revision=${revision}");let reloading=false;events.addEventListener("reload",async()=>{if(reloading)return;reloading=true;try{const{dev,runtime}=await ready;dev?.snapshotState(sessionStorage,route,runtime?.browserState,schema)}catch{}location.reload()});events.addEventListener("build-error",show)})()</script>`

export async function build({ quiet = false, minify = true } = {}) {
  const config = await loadConfig()
  const base = normalizeBase(config.base)
  const configuredStyles = normalizeStyles(config.styles, base)
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
  const sourceFiles = projectFiles.filter(file => /\.(?:ts|tsx)$/.test(file)).sort()
  const cssFiles = projectFiles.filter(file => file.endsWith(".css")).sort()
  if (!sourceFiles.length) throw new Error("No TypeScript files found in src/")
  const sourceFileSet = new Set(sourceFiles)
  const sourceIndex = new Map(await Promise.all(sourceFiles.map(async file => [file, await readFile(file, "utf8")])))

  const handlerModules = []
  const workerReferences = []
  for (const file of sourceFiles) {
    if (file.endsWith(".worker.ts")) continue
    const handlerModule = await compile(file, sourceFileSet, sourceIndex, base, workerReferences)
    if (handlerModule) handlerModules.push(handlerModule)
  }

  const pageFiles = sourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))
  if (!pageFiles.length) throw new Error("No pages found in src/pages/")

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
  const paramEntries = []
  const rewrites = []
  const emittedRoutes = new Set()
  const emittedApplicationRoutes = new Set()
  const emittedNavigationRecords = []
  const renderedHandlerUrls = new Set()
  const styleUrls = [...new Set([
    ...cssFiles.map(file => assetPath(base, `assets/${relative(sourceDirectory, file).replaceAll(sep, "/")}`)),
    ...configuredStyles
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
      const navigationGroup = navigationByRoute.get(applicationRoute)
      const navigable = Boolean(navigationGroup)
      const effectPath = `effects/${route ? `${route}/index` : "index"}.js`
      const paramPath = `params/${route}/index.js`
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
        ...(module.metadata ?? {}),
        styles: styleUrls.length ? styleUrls : false,
        base,
        runtimeAsset: runtimePlaceholder,
        effectAsset: assetPath(base, `assets/${effectPath}`),
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
      if (result.hasParams) paramEntries.push({ path: paramPath, schema: runtimeSchema, params: result.plan.params, usesDependencyRuntime, navigable })
      if (result.hasEffects) effectEntries.push({ path: effectPath, effects: runtimeEffects(result.plan.effects, navigable), paramPath: result.hasParams ? paramPath : undefined, usesDependencyRuntime, navigable })
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
  if (renderedWorkerReferences.length && await exists(join(root, "public", "assets", "workers"))) throw new Error("public/assets/workers collides with Kudzu's generated Worker asset namespace")
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
  const hasListConditions = plans.some(plan => plan.lists.some(list => list.conditions))
  const hasListTextRanges = plans.some(plan => plan.lists.some(list => list.textRanges))
  const hasListAttributes = plans.some(plan => plan.lists.some(list => list.attributes))
  const hasListEvents = plans.some(plan => plan.lists.some(list => list.events))
  const hasListExpressions = plans.some(plan => plan.lists.some(list => list.expressions))
  const hasListExpressionAttributes = plans.some(plan => plan.lists.some(list => list.expressionAttributes))
  const hasListSeeds = plans.some(plan => plan.lists.some(list => list.seed))
  const hasListEffects = plans.some(plan => plan.lists.some(list => list.effects))
  const hasListRowStates = plans.some(plan => plan.lists.some(list => list.rowStates))
  const hasItemDependencies = plans.some(plan => plan.effects.some(effect => effect.itemDependencies?.length))
  const hasListAsyncParts = hasListExpressions || hasListExpressionAttributes || hasListConditions
  const hasListMounts = hasListConditions || plans.some(plan => plan.lists.some(list => list.mount))
  const hasNestedStateCaptures = hasNestedCaptureState(plans)
  const hasSetterCaptures = hasCaptureType(plans, "setter")
  const hasEffectCaptures = plans.some(plan => plan.effects.some(effect => Object.keys(effect.scope).length))
  const nativeModules = emittedHandlerModules.filter(module => module.hasNativeHandlers).map(module => assetPath(base, `assets/${module.path}`))
  const hasNativeHandlers = nativeModules.length > 0
  const hasEffects = effectEntries.length > 0
  const hasNavigableEffects = effectEntries.some(entry => entry.navigable)
  const hasNavigableOwners = effectEntries.some(entry => entry.navigable && entry.effects.some(effect => effect.owner))
  const hasSharedRuntime = bindingCount || listCount || hasNativeHandlers || navigationRoutes.length
  const hasDependencyRuntime = pageEntries.some(entry => entry.usesDependencyRuntime)
  const runtimeName = usesDependencyRuntime => usesDependencyRuntime ? "kudzu-deps.js" : "kudzu.js"
  for (const entry of pageEntries) {
    const routeDirectory = join(outputDirectory, entry.route)
    await mkdir(routeDirectory, { recursive: true })
    const html = entry.html.replace(runtimePlaceholder, escapeAttribute(assetPath(base, `assets/${runtimeName(entry.usesDependencyRuntime)}`)))
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
      "globalThis.__KUDZU_CAPTURE_STATE__": String(hasNestedStateCaptures)
    })
  }
  if (listCount) {
    let listRuntime = (await readFile(new URL("./list-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
    if (!hasItemDependencies) listRuntime = listRuntime.replace(", notifyListItem", "")
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
      __KUDZU_LIST_ROW_STATES__: String(hasListRowStates)
    })
  }
  if (hasNativeHandlers) {
    const nativeRuntime = (await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
    await writeJavaScript(join(assetsDirectory, "kudzu-native.js"), specializeNativeRuntime(nativeRuntime, nativeEvents, nativeModules), minify, {
      "globalThis.__KUDZU_CAPTURE_SETTER__": String(hasSetterCaptures)
    })
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
    await writeJavaScript(output, printParamEntry(entry.schema, entry.params, output, assetsDirectory, base, runtimeName(entry.usesDependencyRuntime), entry.navigable), minify)
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
    await writeJavaScript(output, await compileClientModule(file, sourceFileSet), minify)
  }
  if (clientModules.length) {
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
    await cp(file, output)
  }
  if (await exists(join(root, "public"))) await cp(join(root, "public"), outputDirectory, { recursive: true })
  if (config.afterBuild !== undefined) {
    if (typeof config.afterBuild !== "function") throw new Error("kudzu.config afterBuild must be a function")
    await config.afterBuild({ root, outDir: outputDirectory, sourceDir: sourceDirectory, base, routes: plans.map(plan => plan.route), plans, rewrites: sortedRewrites })
  }

  if (!quiet) console.log(`Built ${plans.length} page(s), ${behaviorCount} interactive page(s) into dist/`)
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
    capabilities.params?.(location.pathname)
    layoutDispose = await capabilities.effects?.mountLayoutEffects?.() ?? noDispose
    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose
  } catch (error) {
    console.error(error)
  }
}
`, "")
    .replace("  await ready\n", "")
    .replace("    const capabilities = await loadCapabilities(parsed)\n", "    await Promise.all(parsed.assets.filter(path => path !== navigationAsset).map(path => import(path)))\n")
    .replace("    await routeDispose()\n    if (current !== revision) return\n", "")
    .replace("    commit(incoming, parsed.nodes, capabilities.params, url.pathname)\n", "    commit(incoming, parsed.nodes)\n")
    .replace("    routeDispose = await capabilities.effects?.mountRouteEffects?.() ?? noDispose\n", "")
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

function specializeNativeRuntime(source, events, modules) {
  const imports = modules.map((module, index) => `import * as __kNativeModule${index} from ${JSON.stringify(module)}`).join("\n")
  const entries = modules.map((module, index) => `[${JSON.stringify(module)}, __kNativeModule${index}]`).join(",")
  return `${imports}\n${specializeEvents(source, events).replace(/const modules = new Map\(\[[^\n]*\]\)/, `const modules = new Map([${entries}])`)}`
}

function printEffectEntry(effects, output, handlerModules, assetsDirectory, base, paramPath, runtimeName) {
  const hasCleanup = effects.some(effect => effect.cleanup)
  const hasDependencies = effects.some(effect => effect.dependencies?.length || effect.itemDependencies?.length)
  const hasOwners = effects.some(effect => effect.owner)
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
    ...(paramPath ? [`import ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, paramPath)))}`] : []),
    ...modules.map((module, index) => `import * as __kEffectModule${index} from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, module.path)))}`)
  ]
  const entries = moduleUrls.map((url, index) => `[${JSON.stringify(url)}, __kEffectModule${index}]`).join(",")
  if (hasOwners) return printOwnedEffectEntry(imports, effects, entries)
  if (effects.length === 1 && effects[0].dependencies?.length === 1) return printSingleDependencyEffect(imports, effects[0], hasCleanup)
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
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-effect.js")))}`,
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
  const moduleUrls = [...new Set(effects.map(effect => effect.module))]
  const modules = moduleUrls.map(url => {
    const module = handlerModules.find(entry => assetPath(base, `assets/${entry.path}`) === url)
    if (!module) throw new Error(`Effect handler module was not emitted: ${url}`)
    return module
  })
  const imports = [
    `import * as __kRuntime from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu.js")))}`,
    `import { createEffectContext } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, "kudzu-effect.js")))}`,
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
    ...(effect.itemDependencies ? { itemDependencies: effect.itemDependencies, listState: effect.listState } : {}),
    ...(effect.cleanup ? { cleanup: true } : {}),
    ...(effect.owner ? { owner: effect.owner } : {}),
    ...(effect.list ? { list: true } : {}),
    ...(lifetimes && effect.lifetime ? { lifetime: effect.lifetime } : {}),
    states: effect.states,
    scope: effect.scope
  }))
}

function printOwnedEffectEntry(imports, effects, entries) {
  const hasItemDependencies = effects.some(effect => effect.itemDependencies?.length)
  const hasOrdinaryDependencies = effects.some(effect => effect.dependencies?.length)
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
function createRecord(effect, index) {
  return { effect, index, ${hasItemDependencies ? "order: order++, " : ""}mounted: !effect.owner, marker: undefined, version: 0, values: undefined, cleanup: undefined, disposal: undefined, token: undefined }
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
        const record = createRecord(template.effect, template.index)
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

function printParamEntry(schema, params, output, assetsDirectory, base, runtimeName, navigable) {
  const prefix = navigable ? "export function initializeParams(pathname) {\n" : "let pathname = location.pathname\n"
  const suffix = navigable ? "\n}" : ""
  return `import { browserState, commitDom } from ${JSON.stringify(relativeModulePath(output, join(assetsDirectory, runtimeName)))}
const base = ${inlineJson(browserPath(base).slice(1).split("/").filter(Boolean).map(segment => decodeURIComponent(segment)))}
const schema = ${inlineJson(schema.segments)}
const params = ${inlineJson(params)}
${prefix}let path = pathname
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
}${suffix}`
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
    external: ["./kudzu.js", "./kudzu-serialization.js", "./kudzu-style.js"],
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

export async function dev({ port = parseDevPort(process.env.PORT) } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`Invalid dev server port: ${port}`)
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

  server.listen(port, "127.0.0.1", () => console.log(`Kudzu dev server: http://127.0.0.1:${server.address().port}`))

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

async function compile(file, sourceFiles, sourceIndex, base, workerReferences) {
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
    transformers: { before: [createKudzuTransformer(nativeHandlers, effectHandlers, reactiveBindings, listExpressions, assetPath(base, `assets/${handlerPath}`), file, sourceFiles, sourceIndex, clientImports, workerReferences)] },
    reportDiagnostics: true
  })

  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) {
    throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  }

  const output = compiledPath(file)
  await mkdir(resolve(output, ".."), { recursive: true })
  await writeFile(output, result.outputText)

  if (!nativeHandlers.length && !effectHandlers.length && !reactiveBindings.length && !listExpressions.length) return undefined
  const callbacks = [...nativeHandlers, ...effectHandlers]
  const moduleSource = [
    printClientImports(callbacks.flatMap(handler => handler.imports), handlerPath),
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
  return { path: handlerPath, code: moduleResult.outputText, hasNativeHandlers: nativeHandlers.length > 0, hasEffects: effectHandlers.length > 0, clientImports: [...clientImports] }
}

function createKudzuTransformer(nativeHandlers, effectHandlers, reactiveBindings, listExpressions, handlerUrl, file, sourceFiles, sourceIndex, clientImports, workerReferences) {
  return context => sourceFile => {
    const factory = context.factory
    const hasLinkElements = /<link/i.test(sourceFile.text)
    sourceFile = normalizeRenderControlFlow(sourceFile, factory, context)
    ts.setParentRecursive(sourceFile, false)
    rejectOrdinaryWorkerImports(sourceFile, file, sourceFiles)
    const importBindings = clientImportBindings(sourceFile, file, sourceFiles)
    const hasUseEffectImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === "@kudzujs/core" && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useEffect"))
    const importedSources = new Map()
    const importedSource = target => {
      let imported = importedSources.get(target)
      if (!imported) {
        imported = normalizeRenderControlFlow(parseSourceFile(target, sourceIndex.get(target)), factory, context)
        ts.setParentRecursive(imported, false)
        importedSources.set(target, imported)
      }
      return imported
    }
    const settersByFunction = new Map()
    const reducersByFunction = new Map()
    const functions = new Map()
    const components = new Map()
    const contexts = new Set()
    const jsxLocalDeclarations = new Map()
    const jsxLocalsByFunction = new Map()
    const listLocalDeclarations = new WeakSet()
    const listLocalUses = new WeakMap()
    const listValues = new WeakMap()
    const listEventItems = new WeakMap()
    const listConditions = new WeakMap()
    const listEffectEntries = new WeakMap()
    let usesBehavior = false
    let usesBinding = false
    let usesConditional = false
    let usesList = false
    let usesListEffects = false
    let usesListItem = false
    let usesRowState = false

    const collect = node => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callName = ts.isIdentifier(node.initializer.expression) ? node.initializer.expression.text : ""
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
          const parts = keyedListParts(declaration.initializer, setters)
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
    const componentSpecializations = new WeakMap()
    const reducerComponentCalls = new WeakSet()
    const reducerRowStateCalls = []
    const specializedDeclarations = new WeakSet()
    const stateBackedComponentFunctions = new WeakSet()
    const stateBackedComponentRoots = []
    let specializedImportIndex = 0
    const registerReducerRowState = (call, specialization) => {
      if (!specialization.rowState) return
      let owner
      for (let current = call.parent; current; current = current.parent) {
        if (isFunctionLike(current) && reducersByFunction.has(current)) {
          owner = current
          break
        }
      }
      const setters = settersByFunction.get(owner) ?? new Map()
      setters.set(specialization.rowState.setter, specialization.rowState.state)
      settersByFunction.set(owner, setters)
      reducerRowStateCalls.push(call)
      usesRowState = true
    }
    const mergeSpecializedImports = (root, componentSource, call) => {
      const componentImports = clientImportBindings(componentSource, componentSource.fileName, sourceFiles)
      for (const name of runtimeImportNames(componentSource, false)) if (referenceIdentifiers(root, name).length) fail(call, "Imported specialized component handlers may only use relative TypeScript runtime imports")
      const substitutions = new Map()
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
          nested.root = mergeSpecializedImports(nested.root, nestedComponent.getSourceFile(), nestedCall)
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
        if (specialization.effects.length) fail(call, "Reducer-dispatch components cannot declare effects")
        registerReducerRowState(call, specialization)
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
        if (specialization.effects.length) fail(call, "Reducer-dispatch components cannot declare effects")
        registerReducerRowState(call, specialization)
        specialization.root = expandReducerCallbacks(specialization.root, componentSource, call)
        specialization.root = mergeSpecializedImports(specialization.root, componentSource, call)
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
        const parts = listLocalUses.get(node) ?? keyedListParts(node.expression, settersForNode(node, settersByFunction))
        if (parts) rawRenderedLists.push({ node, parts })
      }
      ts.forEachChild(node, collectRenderedLists)
    }
    collectRenderedLists(sourceFile)
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
    for (const call of reducerRowStateCalls) if (!keyedComponentCalls.has(call)) fail(call, "Reducer-dispatch component useState() is only supported in a direct keyed row")
    for (const name of listComponentNames) {
      let component = components.get(name)
      const local = Boolean(component)
      if (!component) {
        const binding = importBindings.get(name)
        if (!binding || binding.kind === "namespace") fail(sourceFile, `Keyed list component ${name} must be declared locally or imported from a relative TypeScript module`)
        const imported = binding.kind === "default" ? "default" : binding.imported
        component = { function: resolveComponentExport(binding.target, imported, importedSource, sourceFiles), declaration: undefined }
      }
      if (local && isExportedDeclaration(component.declaration)) fail(component.declaration, `Keyed list component ${name} cannot be exported`)
      const declaredCalls = jsxTagUses(sourceFile, name)
      if (local && identifierReferenceCount(sourceFile, name) !== declaredCalls.length) fail(component.declaration, `Keyed list component ${name} may only be referenced as JSX`)
      const calls = [
        ...declaredCalls.filter(call => !stateBackedComponentFunctions.has(nearestFunction(call))),
        ...stateBackedComponentRoots.flatMap(root => jsxTagUses(root, name))
      ]
      for (const call of calls) {
        const specialization = reducerComponentCalls.has(call)
          ? componentSpecializations.get(call)
          : specializeComponentCall(call, component.function, sourceFile, factory, context, fail)
        if (specialization.effects.length && !keyedComponentCalls.has(call)) fail(call, "Effectful keyed row components may only be used directly as keyed map rows")
        componentSpecializations.set(call, specialization)
      }
      if (local) specializedDeclarations.add(component.declaration)
    }
    const renderedLists = new WeakMap()
    for (const { node, parts: originalParts } of rawRenderedLists) {
      if (keyedListParentTag(node) === "table") throw new Error("Keyed table rows must be wrapped in <tbody>, <thead>, or <tfoot>")
      const specialization = componentSpecializations.get(originalParts.root)
      const root = specialization?.root ?? originalParts.root
      let callback = root === originalParts.root ? originalParts.callback : factory.updateArrowFunction(
        originalParts.callback,
        originalParts.callback.modifiers,
        originalParts.callback.typeParameters,
        originalParts.callback.parameters,
        originalParts.callback.type,
        originalParts.callback.equalsGreaterThanToken,
        root
      )
      if (specialization?.stateDeclarations.length) callback = factory.updateArrowFunction(
        callback,
        callback.modifiers,
        callback.typeParameters,
        callback.parameters,
        callback.type,
        callback.equalsGreaterThanToken,
        factory.createBlock([...specialization.stateDeclarations, factory.createReturnStatement(root)], true)
      )
      if (callback !== originalParts.callback) {
        ts.setParentRecursive(callback, false)
        callback.parent = originalParts.callback.parent
      }
      const parts = { ...originalParts, root, callback }
      for (const calculation of specialization?.calculations ?? []) {
        ts.setParentRecursive(calculation, false)
        calculation.parent = callback
        validateListExpression(calculation, parts.item, originalParts.root, fail)
      }
      validateKeyedList(parts, sourceFile, listValues, listEventItems, listConditions, settersForNode(originalParts.root, settersByFunction), specialization?.rowState)
      if (specialization?.effects.length) {
        usesListEffects = true
        const statements = specialization.effects.map(entry => {
          const call = factory.updateCallExpression(entry.call, factory.createIdentifier("__kListUseEffect"), entry.call.typeArguments, entry.call.arguments)
          synthesizeTree(call)
          const effectSource = entry.source.getSourceFile()
          listEffectEntries.set(call, { item: parts.item, source: entry.source, sourceFile: effectSource, imports: clientImportBindings(effectSource, effectSource.fileName, sourceFiles) })
          return factory.createExpressionStatement(call)
        })
        callback = factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, callback.parameters, callback.type, callback.equalsGreaterThanToken, factory.createBlock([...statements, factory.createReturnStatement(root)], true))
        ts.setParentRecursive(callback, false)
        callback.parent = originalParts.callback.parent
        parts.callback = callback
      }
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
      if (specializedDeclarations.has(node)) return node
      if (componentSpecializations.has(node)) return ts.visitNode(componentSpecializations.get(node).root, visitor)

      if (hasLinkElements && (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && isStylesheetLink(node)) {
        fail(node, "Stylesheets must be placed under src/ or declared in kudzu.config styles so Kudzu can emit them in <head>")
      }

      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral(relativeModulePath(compiledPath(file), compiledPath(target))), node.attributes)
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
        return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, factory.createStringLiteral(relativeModulePath(compiledPath(file), compiledPath(target))), node.attributes)
      }

      const listEffect = ts.isCallExpression(node) ? listEffectEntries.get(node) : undefined
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (hasUseEffectImport && node.expression.text === "useEffect" || listEffect)) {
        const effectFail = (target, message) => {
          if (listEffect) throw sourceNodeError(listEffect.source, listEffect.sourceFile, message)
          fail(target, message)
        }
        if (node.arguments.length !== 2) effectFail(node, "useEffect() requires exactly a callback and literal dependency array")
        const [callback, dependencies] = node.arguments
        if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) effectFail(callback, "useEffect() callback must be an inline function")
        if (ts.isFunctionExpression(callback) && callback.name) effectFail(callback, "useEffect() callback function must be anonymous")
        if (callback.asteriskToken) effectFail(callback, "useEffect() callback cannot be a generator")
        if (callback.parameters.length) effectFail(callback, "useEffect() callback cannot declare parameters")
        if (!ts.isArrayLiteralExpression(dependencies)) effectFail(dependencies, "useEffect() dependencies must be a literal array")
        const itemDependencies = []
        const ordinaryDependencies = []
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
        if (!nearestFunction(node)) fail(node, "useEffect() cannot be used outside a Kudzu component")
        if (!ts.isBlock(callback.body)) effectFail(callback, "useEffect() callback must use a block body")
        const returns = effectReturns(callback)
        if (returns.invalid) effectFail(returns.invalid, "useEffect() return values must be inline cleanup functions")
        const invalidCleanup = returns.cleanups.find(cleanup => cleanup.parameters.length || cleanup.asteriskToken)
        if (invalidCleanup) effectFail(invalidCleanup, "useEffect() cleanup functions cannot declare parameters or be generators")
        if (returns.cleanup && callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) effectFail(callback, "useEffect() async callbacks cannot return cleanup functions")
        const setters = settersForNode(node, settersByFunction)
        const callbackSource = listEffect?.sourceFile ?? sourceFile
        const callbackFile = callbackSource.fileName
        const workerStart = workerReferences.length
        let compiledCallback
        if (listEffect && callbackFile !== file) {
          const originalCallback = listEffect.source.arguments[0]
          rejectWorkerConstructions(originalCallback, callbackSource, "Relative TypeScript Worker construction in imported keyed-row effects is not supported; construct the Worker in a directly compiled page or local component effect")
          compiledCallback = callback
        } else {
          compiledCallback = rewriteEffectWorkers(callback, callbackFile, callbackSource, sourceFiles, workerReferences, factory, context)
        }
        const descriptor = compileNativeCallback(compiledCallback, setters, reducersForNode(node, reducersByFunction), factory, effectHandlers, listEffect?.imports ?? importBindings, clientImports, "effect", dependencyItem, true, returns.cleanup)
        for (const reference of workerReferences.slice(workerStart)) Object.assign(reference, { module: handlerUrl, handler: descriptor.exportName })
        usesListItem ||= Boolean(itemDependencies.length && !listEffect)
        usesBehavior = true
        return factory.updateCallExpression(node, node.expression, node.typeArguments, [
          callback,
          factory.createArrayLiteralExpression(ordinaryDependencies),
          factory.createStringLiteral(handlerUrl),
          factory.createStringLiteral(descriptor.exportName),
          descriptor.states,
          descriptor.scope,
          factory.createStringLiteral(listEffect ? sourceLocation(listEffect.source, listEffect.sourceFile) : sourceLocation(node, sourceFile)),
          returns.cleanup ? factory.createTrue() : factory.createFalse(),
          factory.createArrayLiteralExpression(itemDependencies.map(field => factory.createStringLiteral(field)))
        ])
      }

      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && ((node.initializer.expression.text === "useState" || node.initializer.expression.text === "__kRowUseState") && node.initializer.arguments.length === 1 || node.initializer.expression.text === "useReducer" && node.initializer.arguments.length === 2)) {
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
        const listParts = renderedLists.get(node)
        if (listParts) {
          usesBehavior = true
          usesList = true
          return factory.updateJsxExpression(node, factory.createCallExpression(factory.createIdentifier("__kList"), undefined, [
            listParts.state,
            factory.createStringLiteral(listParts.keyField),
            ts.visitNode(listParts.callback, visitor)
          ]))
        }
        const conditional = conditionalParts(node.expression)
        if (conditional) {
          const compiled = compileRenderExpression(node.expression, node)
          if (compiled !== node.expression) return factory.updateJsxExpression(node, compiled)
        }
        const setters = settersForNode(node, settersByFunction)
        const usedStates = referencedStateNames(node.expression, setters)
        const captures = captureNames(node.expression, node.expression, setters)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(node.expression) && !containsJsx(node.expression)) {
          usesBehavior = true
          usesBinding = true
          return factory.updateJsxExpression(node, compileReactiveBinding(node.expression, setters, factory, context, reactiveBindings, handlerUrl))
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && !isContextProviderValue(node, contexts) && !/^on/i.test(node.name.text) && !["key", "ref", "dangerouslysetinnerhtml"].includes(node.name.text.toLowerCase())) {
        const expression = node.initializer.expression
        const setters = settersForNode(node, settersByFunction)
        const usedStates = referencedStateNames(expression, setters)
        const captures = captureNames(expression, expression, setters)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(expression)) {
          usesBehavior = true
          usesBinding = true
          const compiled = compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl)
          return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, compiled))
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && /^on[A-Z]/.test(node.name.text)) {
        const setters = settersForNode(node, settersByFunction)
        const event = compileEvent(node.initializer.expression, setters, reducersForNode(node, reducersByFunction), functions, factory, nativeHandlers, handlerUrl, listEventItems.get(node), importBindings, clientImports)
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
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listConditional"), factory.createIdentifier("__kListConditional")))
    }
    if (usesListItem && !usesList) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listItem"), factory.createIdentifier("__kListItem")))
    if (usesListEffects) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useEffect"), factory.createIdentifier("__kListUseEffect")))
    if (usesRowState) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("useState"), factory.createIdentifier("__kRowUseState")))
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

function keyedListParts(expression, setters) {
  const value = unwrapExpression(expression)
  if (!ts.isCallExpression(value) || value.arguments.length !== 1 || !ts.isPropertyAccessExpression(value.expression) || value.expression.name.text !== "map" || !ts.isIdentifier(value.expression.expression)) return undefined
  const state = value.expression.expression
  if (![...setters.values()].includes(state.text)) return undefined
  const callback = value.arguments[0]
  if (!ts.isArrowFunction(callback) || callback.parameters.length !== 1 || !ts.isIdentifier(callback.parameters[0].name)) {
    throw new Error("Keyed list map callback must be an arrow function with one identifier parameter")
  }
  const root = unwrapExpression(callback.body)
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) throw new Error("Keyed list map callback must return one JSX element")
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const key = attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && ts.isIdentifier(attribute.name) && attribute.name.text === "key")
  const field = key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer) && key.initializer.expression && directProperty(key.initializer.expression, callback.parameters[0].name.text)
  if (!field) throw new Error(`Keyed list root must have key={${callback.parameters[0].name.text}.<field>}`)
  return { state, callback, root, item: callback.parameters[0].name.text, keyField: field }
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
    if (!ts.isImportDeclaration(statement) || !statement.importClause || statement.importClause.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier) || statement.moduleSpecifier.text.startsWith(".") !== relative) continue
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

function validateKeyedList(parts, sourceFile, listValues, listEventItems, listConditions, setters, rowState) {
  const fail = (node, message) => {
    throw sourceNodeError(node, sourceFile, message)
  }
  const root = parts.root
  const item = parts.item
  const validateElement = node => {
    const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName
    if (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) fail(node, "Keyed list items must use intrinsic JSX elements")
  }
  let conditionDepth = 0
  const visit = node => {
    if (ts.isJsxFragment(node)) fail(node, "Fragments are not supported in keyed lists")
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) validateElement(node)
    if (node !== root && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && containsJsx(node)) fail(node, "Nested keyed lists are not supported")
    if (ts.isJsxSpreadAttribute(node) && referencesIdentifier(node.expression, item)) fail(node, "Keyed list item spreads are not supported")
    if (ts.isJsxAttribute(node) && /^on[A-Z]/.test(node.name.text)) {
      listEventItems.set(node, item)
      return
    }
    if (ts.isJsxExpression(node) && node.expression) {
      const expression = unwrapExpression(node.expression)
      const condition = conditionalParts(expression)
      if (condition && containsJsx(expression)) {
        if (conditionDepth) fail(node, "Nested item conditions are not supported in keyed lists")
        if (rowState && referencedStateNames(condition.condition, setters).has(rowState.state)) {
          conditionDepth++
          visit(condition.truthy)
          visit(condition.falsy)
          conditionDepth--
          return
        }
        if (!referencesIdentifier(condition.condition, item)) fail(node, "Keyed list item conditions must read the item")
        validateListExpression(condition.condition, item, node, fail)
        listConditions.set(node.expression, { ...condition, item })
        conditionDepth++
        visit(condition.truthy)
        visit(condition.falsy)
        conditionDepth--
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
      if (referencesIdentifier(expression, item)) {
        validateListExpression(expression, item, node, fail)
        if (ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.text.toLowerCase())) fail(node, `Keyed list item ${node.parent.name.text} is not supported`)
        listValues.set(node.expression, { item })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
}

function specializeComponentCall(call, component, sourceFile, factory, context, fail, label = "Keyed list") {
  if (component.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || component.asteriskToken) fail(component, `${label} components must be synchronous`)
  if (component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name)) fail(component, `${label} components must use one destructured props parameter`)
  if (ts.isJsxElement(call) && call.children.some(child => !ts.isJsxText(child) || child.text.trim())) fail(call, `${label} component children are not supported`)
  const callAttributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
  const props = new Map()
  let key
  for (const attribute of callAttributes.properties) {
    if (ts.isJsxSpreadAttribute(attribute)) fail(attribute, `${label} component prop spreads are not supported`)
    const name = attribute.name.text
    if (props.has(name) || name === "key" && key) fail(attribute, `Duplicate ${label.toLowerCase()} component prop "${name}"`)
    const value = !attribute.initializer
      ? factory.createTrue()
      : ts.isStringLiteral(attribute.initializer)
        ? factory.createStringLiteral(attribute.initializer.text)
        : ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression
          ? attribute.initializer.expression
          : factory.createIdentifier("undefined")
    if (name === "key") key = attribute
    else props.set(name, value)
  }
  const substitutions = new Map()
  const acceptedProps = new Set()
  for (const element of component.parameters[0].name.elements) {
    if (element.dotDotDotToken || !ts.isIdentifier(element.name) || (element.initializer && label === "Keyed list")) fail(element, `${label} component props cannot use rest, defaults, or nested destructuring`)
    if (element.initializer && !isPrimitiveDefaultLiteral(element.initializer)) fail(element.initializer, `${label} component prop defaults must be primitive literals`)
    const prop = (element.propertyName ?? element.name).text
    acceptedProps.add(prop)
    substitutions.set(element.name.text, props.has(prop) ? props.get(prop) : element.initializer ?? factory.createIdentifier("undefined"))
  }
  for (const prop of props.keys()) if (!acceptedProps.has(prop)) fail(call, `Unknown ${label.toLowerCase()} component prop "${prop}"`)

  let returned
  const calculations = []
  const effectCalls = []
  const stateDeclarations = []
  let rowState
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
        if (label !== "Reducer-dispatch") fail(declaration, `${label} components cannot declare local state`)
        if (rowState) throw sourceNodeError(declaration, component.getSourceFile(), "Reducer-dispatch keyed row components may declare exactly one top-level useState()")
        if (declaration.initializer.arguments.length !== 1 || !isPrimitiveDefaultLiteral(declaration.initializer.arguments[0])) throw sourceNodeError(declaration.initializer, component.getSourceFile(), "Reducer-dispatch keyed row useState() must use one primitive literal initial value; lazy initialization is not supported")
        if (!ts.isArrayBindingPattern(declaration.name) || declaration.name.elements.length !== 2 || declaration.name.elements.some(element => !element || !ts.isBindingElement(element) || !ts.isIdentifier(element.name) || element.initializer || element.dotDotDotToken)) throw sourceNodeError(declaration.name, component.getSourceFile(), "Reducer-dispatch keyed row useState() must use [state, setter] identifier destructuring")
        const suffix = Math.max(0, call.pos)
        const state = `__kRowState${suffix}`
        const setter = `__kRowSetter${suffix}`
        substitutions.set(declaration.name.elements[0].name.text, factory.createIdentifier(state))
        substitutions.set(declaration.name.elements[1].name.text, factory.createIdentifier(setter))
        const binding = factory.createArrayBindingPattern([
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(state)),
          factory.createBindingElement(undefined, undefined, factory.createIdentifier(setter))
        ])
        const initializer = factory.createCallExpression(factory.createIdentifier("__kRowUseState"), undefined, [cloneAst(declaration.initializer.arguments[0], factory, context)])
        stateDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(binding, undefined, undefined, initializer)], ts.NodeFlags.Const)))
        rowState = { state, setter }
        continue
      }
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) fail(declaration, `${label} component locals must be initialized identifiers`)
      const calculation = substituteClone(declaration.initializer, substitutions, factory, context)
      calculations.push({ name: declaration.name.text, expression: calculation })
      substitutions.set(declaration.name.text, calculation)
    }
    returned = last.expression
  }
  let unsupportedState
  const findUnsupportedState = node => {
    if (unsupportedState) return
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "useState") unsupportedState = node
    ts.forEachChild(node, findUnsupportedState)
  }
  findUnsupportedState(returned)
  for (const calculation of calculations) findUnsupportedState(calculation.expression)
  if (unsupportedState) throw sourceNodeError(unsupportedState, component.getSourceFile(), label === "Reducer-dispatch" ? "Reducer-dispatch keyed row useState() must be one top-level const declaration" : `${label} components cannot declare local state`)
  let root = unwrapExpression(substituteClone(returned, substitutions, factory, context))
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) fail(returned, `${label} component must return one JSX element`)
  const tag = jsxTagName(root)
  if (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) fail(returned, `${label} component must directly return an intrinsic JSX element`)
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
    stateDeclarations,
    rowState
  }
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
  if (node.name.getText() !== "value") return false
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

const pureListMethods = new Set(["at", "charAt", "charCodeAt", "concat", "endsWith", "includes", "indexOf", "join", "lastIndexOf", "padEnd", "padStart", "repeat", "replace", "replaceAll", "slice", "startsWith", "substring", "toLowerCase", "toUpperCase", "trim", "trimEnd", "trimStart"])
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

function validateListExpression(expression, item, source, fail) {
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
    if (ts.isIdentifier(node) && isReferenceIdentifier(node) && node.text !== item && !pureListGlobals.has(node.text)) {
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

function compileListExpression(read, expression, item, factory, listExpressions, handlerUrl) {
  const exportName = `listExpression${listExpressions.length}`
  listExpressions.push({ exportName, expression, item })
  return factory.createCallExpression(factory.createIdentifier("__kListExpression"), undefined, [read, factory.createStringLiteral(handlerUrl), factory.createStringLiteral(exportName)])
}

function compileListConditional(entry, factory, listExpressions, handlerUrl) {
  const exportName = `listExpression${listExpressions.length}`
  listExpressions.push({ exportName, expression: entry.condition, item: entry.item })
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
    : compileListExpression(read, expression, entry.item, factory, listExpressions, handlerUrl)
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
  let count = 0
  const visit = node => {
    if (ts.isIdentifier(node) && node.text === name && isReferenceIdentifier(node)) count++
    ts.forEachChild(node, visit)
  }
  visit(root)
  return count
}

function unwrapExpression(node) {
  return ts.isParenthesizedExpression(node) ? unwrapExpression(node.expression) : node
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

function compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl) {
  const parts = conditionalParts(expression)
  const state = parts && directStateIdentifier(parts.condition, setters)
  if (state && isPrimitiveDefaultLiteral(parts.truthy) && isPrimitiveDefaultLiteral(parts.falsy)) {
    return factory.createCallExpression(factory.createIdentifier("__kSelect"), undefined, [state, parts.truthy, parts.falsy])
  }
  return factory.createCallExpression(factory.createIdentifier("__kBinding"), undefined, compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl))
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

function compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl) {
  const usedStates = referencedStateNames(expression, setters)
  const captures = captureNames(expression, expression, setters)
  const exportName = `binding${reactiveBindings.length}`
  reactiveBindings.push({ exportName, expression, captures, states: usedStates })
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
  imports.push(...[...usedReducers].map(name => reducers.get(name).import))
  const captures = new Set([...allCaptures].filter(name => !importBindings.has(name)))
  for (const entry of imports) clientImports.add(entry.target)
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
      name === listItem ? factory.createCallExpression(factory.createIdentifier("__kListItem"), undefined, []) : value(name)
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
  "Array", "ArrayBuffer", "BigInt", "Boolean", "Date", "Error", "Event", "FormData", "Infinity", "Intl", "JSON", "Map", "Math", "NaN", "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set", "String", "Symbol", "TypeError", "URL", "URLSearchParams", "WeakMap", "WeakSet", "WebSocket", "Worker", "atob", "btoa", "clearInterval", "clearTimeout", "console", "crypto", "document", "fetch", "globalThis", "history", "isFinite", "isNaN", "location", "navigator", "parseFloat", "parseInt", "queueMicrotask", "requestAnimationFrame", "setInterval", "setTimeout", "structuredClone", "undefined", "window"
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
  visit(expression.body)
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
    if (!ts.isImportDeclaration(node) || !node.importClause || node.importClause.isTypeOnly || !ts.isStringLiteral(node.moduleSpecifier) || !node.moduleSpecifier.text.startsWith(".")) continue
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
    const specifier = relativeModulePath(handlerPath, clientModulePath(target))
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

async function compileClientModule(file, sourceFiles) {
  const source = await readFile(file, "utf8")
  const transformer = context => sourceFile => {
    const factory = context.factory
    const visitor = node => {
      if (ts.isImportDeclaration(node) && runtimeModuleReference(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
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
        if (node.arguments.length !== 1) throw sourceNodeError(node, expression.getSourceFile(), "Reducer dispatches require exactly one action")
        return reducerDispatch(factory, reducers.get(node.expression.text), ts.visitNode(node.arguments[0], visitor))
      }
      if (ts.isShorthandPropertyAssignment(node) && reducers.has(node.name.text) && !isShadowedIdentifier(node.name, expression)) {
        return factory.createPropertyAssignment(node.name, reducerReference(factory, reducers.get(node.name.text)))
      }
      if (ts.isIdentifier(node) && reducers.has(node.text) && isReferenceIdentifier(node) && !isShadowedIdentifier(node, expression)) {
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
  const previous = factory.createUniqueName("__kPrevious")
  const update = factory.createArrowFunction(undefined, undefined, [factory.createParameterDeclaration(undefined, undefined, previous)], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createCallExpression(factory.createIdentifier(reducer.reducer), undefined, [previous, action]))
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

function printListExpression({ exportName, expression, item }) {
  const declaration = ts.factory.createFunctionDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    exportName,
    undefined,
    [ts.factory.createParameterDeclaration(undefined, undefined, item)],
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
    return command(factory, "log", expression.arguments[1], expression.arguments[0])
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
  if (isPrimitiveLiteral(value)) return command(factory, "set", state, value)
  return undefined
}

function command(factory, operation, state, value) {
  return factory.createArrayLiteralExpression([factory.createStringLiteral(operation), state, value])
}

function isPrimitiveLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword
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
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error("kudzu.config styles must be an array of URLs")
  return value.map((style, index) => {
    if (typeof style !== "string" || !style) throw new Error(`kudzu.config styles[${index}] must be a non-empty URL`)
    if (style.startsWith("//")) throw new Error(`kudzu.config styles[${index}] must be root-relative or an absolute HTTP URL`)
    if (style.startsWith("/")) return withBase(base, style)
    if (!/^https?:\/\//i.test(style)) throw new Error(`kudzu.config styles[${index}] must be root-relative or an absolute HTTP URL`)
    try { new URL(style) } catch { throw new Error(`kudzu.config styles[${index}] must be root-relative or an absolute HTTP URL`) }
    return style
  })
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
