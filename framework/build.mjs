import { createServer } from "node:http"
import { randomUUID } from "node:crypto"
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
  await rm(workDirectory, { recursive: true, force: true })
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(workDirectory, { recursive: true })
  await mkdir(outputDirectory, { recursive: true })

  const projectFiles = await walk(sourceDirectory)
  const sourceFiles = projectFiles.filter(file => /\.(?:ts|tsx)$/.test(file)).sort()
  const cssFiles = projectFiles.filter(file => file.endsWith(".css")).sort()
  if (!sourceFiles.length) throw new Error("No TypeScript files found in src/")
  const sourceFileSet = new Set(sourceFiles)

  const handlerModules = []
  for (const file of sourceFiles) {
    const handlerModule = await compile(file, sourceFileSet, base)
    if (handlerModule) handlerModules.push(handlerModule)
  }

  const pageFiles = sourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))
  if (!pageFiles.length) throw new Error("No pages found in src/pages/")

  let behaviorCount = 0
  let bindingCount = 0
  let listCount = 0
  let listStyleCount = 0
  let stateSeedCount = 0
  const plans = []
  const emittedRoutes = new Set()
  const styleUrls = cssFiles.map(file => assetPath(base, `assets/${relative(sourceDirectory, file).replaceAll(sep, "/")}`))

  for (const pageFile of pageFiles) {
    const compiledFile = compiledPath(pageFile)
    const module = await import(`${pathToFileURL(compiledFile).href}?v=${Date.now()}`)
    if (typeof module.default !== "function") throw new Error(`${relative(root, pageFile)} must export a default component`)

    const entries = await staticPathEntries(module, pageFile)
    for (const { params, props } of entries) {
      const route = routeFromPage(pageFile, params)
      const routePath = withBase(base, `/${route}`)
      if (emittedRoutes.has(routePath)) throw new Error(`Duplicate route: ${routePath}`)
      emittedRoutes.add(routePath)
      const result = await renderPage(module.default, {
        ...(module.metadata ?? {}),
        styles: styleUrls.length ? styleUrls : false,
        base
      }, props)
      const routeDirectory = join(outputDirectory, route)
      await mkdir(routeDirectory, { recursive: true })
      await writeFile(join(routeDirectory, "index.html"), result.html)
      plans.push({ route: routePath, ...result.plan })
      if (result.hasBehaviors) behaviorCount++
      if (result.hasBindings) bindingCount++
      if (result.hasLists) listCount++
      if (result.hasListStyles) listStyleCount++
      if (result.hasStateSeed) stateSeedCount++
    }
  }

  const assetsDirectory = join(outputDirectory, "assets")
  await mkdir(assetsDirectory, { recursive: true })
  const commandEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.commands).map(event => event.event)))].sort()
  const nativeEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.native).map(event => event.event)))].sort()
  const hasTextBindings = plans.some(plan => plan.bindings.some(binding => binding.target === "text"))
  const hasListConditions = plans.some(plan => plan.lists.some(list => list.conditions))
  const nativeModules = handlerModules.filter(module => module.hasNativeHandlers).map(module => assetPath(base, `assets/${module.path}`))
  const hasNativeHandlers = nativeModules.length > 0
  if (behaviorCount) {
    const runtimeFile = bindingCount || listCount || hasNativeHandlers ? "./shared-runtime.js" : "./runtime.js"
    const runtime = specializeRuntime(await readFile(new URL(runtimeFile, import.meta.url), "utf8"), commandEvents, stateSeedCount > 0)
    await writeJavaScript(join(assetsDirectory, "kudzu.js"), runtime, minify)
  }
  if (bindingCount || hasNativeHandlers) await writeJavaScript(join(assetsDirectory, "kudzu-serialization.js"), await readFile(new URL("./serialization.js", import.meta.url), "utf8"), minify)
  if (bindingCount || listStyleCount) await writeJavaScript(join(assetsDirectory, "kudzu-style.js"), await readFile(new URL("./style.js", import.meta.url), "utf8"), minify)
  if (bindingCount) {
    const bindingRuntime = (await readFile(new URL("./binding-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
      .replace('"./style.js"', '"./kudzu-style.js"')
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-binding.js"), bindingRuntime, minify, { "globalThis.__KUDZU_TEXT_BINDINGS__": String(hasTextBindings) })
  }
  if (listCount) {
    let listRuntime = (await readFile(new URL("./list-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
    const stylePatch = `  if (target === "style") {
    const style = serializeStyle(value)
    if (style) node.setAttribute("style", style)
    else node.removeAttribute("style")
    return
  }`
    listRuntime = listRuntime.replace("  /* list-style */", listStyleCount ? stylePatch : "")
    if (listStyleCount) listRuntime = `import { serializeStyle } from "./kudzu-style.js"\n${listRuntime}`
    await writeBundledJavaScript(join(assetsDirectory, "kudzu-list.js"), listRuntime, minify, { __KUDZU_LIST_CONDITIONS__: String(hasListConditions) })
  }
  if (hasNativeHandlers) {
    const nativeRuntime = (await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
    await writeJavaScript(join(assetsDirectory, "kudzu-native.js"), specializeNativeRuntime(nativeRuntime, nativeEvents, nativeModules), minify)
  }
  for (const handlerModule of handlerModules) {
    const output = join(assetsDirectory, handlerModule.path)
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeJavaScript(output, handlerModule.code, minify)
  }
  const clientModules = await collectClientModules(handlerModules.flatMap(module => module.clientImports), sourceFileSet)
  for (const file of clientModules) {
    const output = join(assetsDirectory, clientModulePath(file))
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeJavaScript(output, await compileClientModule(file, sourceFileSet), minify)
  }
  if (clientModules.length) {
    await bundle({
      entryPoints: handlerModules.map(module => join(assetsDirectory, module.path)),
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
  await writeFile(join(workDirectory, "kudzu-plan.json"), JSON.stringify({ routes: plans }, null, 2))
  for (const file of cssFiles) {
    const output = join(assetsDirectory, relative(sourceDirectory, file))
    await mkdir(dirname(output), { recursive: true })
    await cp(file, output)
  }
  if (await exists(join(root, "public"))) await cp(join(root, "public"), outputDirectory, { recursive: true })
  if (config.afterBuild !== undefined) {
    if (typeof config.afterBuild !== "function") throw new Error("kudzu.config afterBuild must be a function")
    await config.afterBuild({ root, outDir: outputDirectory, sourceDir: sourceDirectory, base, routes: plans.map(plan => plan.route), plans })
  }

  if (!quiet) console.log(`Built ${plans.length} page(s), ${behaviorCount} interactive page(s) into dist/`)
}

function specializeEvents(source, events) {
  return source.replace(/const eventNames = \[[^\n]+\]/, `const eventNames = ${JSON.stringify(events)}`)
}

function specializeNativeRuntime(source, events, modules) {
  const imports = modules.map((module, index) => `import * as __kNativeModule${index} from ${JSON.stringify(module)}`).join("\n")
  const entries = modules.map((module, index) => `[${JSON.stringify(module)}, __kNativeModule${index}]`).join(",")
  return `${imports}\n${specializeEvents(source, events).replace(/const modules = new Map\(\[[^\n]*\]\)/, `const modules = new Map([${entries}])`)}`
}

export function specializeRuntime(source, events, hasStateSeed) {
  const specialized = specializeEvents(source, events)
  if (hasStateSeed) return specialized
  return specialized
    .replace("  const initialState = document.body.dataset.kState\n", "")
    .replace(/^  if \(initialState\).*\n/m, "")
}

async function writeJavaScript(file, source, minify) {
  const code = minify ? (await transform(source, { format: "esm", legalComments: "none", minify: true, target: "es2022" })).code : source
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
      const pathname = decodeURIComponent(url.pathname)
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

      const relativePath = stripBase(pathname, base).replace(/^\/+/, "")
      let file = resolve(outputDirectory, relativePath)
      if (!file.startsWith(`${outputDirectory}${sep}`) && file !== outputDirectory) throw new Error("Invalid path")

      if ((await exists(file)) && (await stat(file)).isDirectory()) file = join(file, "index.html")
      if (!(await exists(file)) && !extname(file)) file = join(file, "index.html")
      const isHtml = extname(file) === ".html"
      const content = isHtml
        ? injectDevClient(buildError ? errorPage(buildError) : await readFile(file, "utf8"), session, revision, buildError ? [] : await devSchema(pathname))
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
  return `${html}${devClient(session, revision, schema)}`
}

function stripBase(path, base) {
  if (!base) return path
  if (path === base) return "/"
  return path.startsWith(`${base}/`) ? path.slice(base.length) : path
}

async function devSchema(pathname) {
  try {
    const plan = JSON.parse(await readFile(join(workDirectory, "kudzu-plan.json"), "utf8"))
    const route = pathname.replace(/\/(?:index\.html)?$/, "") || "/"
    return stateSchema(plan.routes.find(entry => entry.route === route)?.states ?? [])
  } catch {
    return []
  }
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

async function compile(file, sourceFiles, base) {
  const source = await readFile(file, "utf8")
  const nativeHandlers = []
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
    transformers: { before: [createKudzuTransformer(nativeHandlers, reactiveBindings, listExpressions, assetPath(base, `assets/${handlerPath}`), file, sourceFiles, clientImports)] },
    reportDiagnostics: true
  })

  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) {
    throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  }

  const output = compiledPath(file)
  await mkdir(resolve(output, ".."), { recursive: true })
  await writeFile(output, result.outputText)

  if (!nativeHandlers.length && !reactiveBindings.length && !listExpressions.length) return undefined
  const moduleSource = [
    printClientImports(nativeHandlers.flatMap(handler => handler.imports), handlerPath),
    ...nativeHandlers.map(handler => printNativeHandler(handler)),
    ...reactiveBindings.map(entry => printReactiveBinding(entry)),
    ...listExpressions.map(entry => printListExpression(entry))
  ].join("\n")
  const moduleResult = ts.transpileModule(moduleSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true
  })
  const moduleErrors = moduleResult.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (moduleErrors.length) throw new Error(moduleErrors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  return { path: handlerPath, code: moduleResult.outputText, hasNativeHandlers: nativeHandlers.length > 0, clientImports: [...clientImports] }
}

function createKudzuTransformer(nativeHandlers, reactiveBindings, listExpressions, handlerUrl, file, sourceFiles, clientImports) {
  return context => sourceFile => {
    const factory = context.factory
    const importBindings = clientImportBindings(sourceFile, file, sourceFiles)
    const settersByFunction = new Map()
    const functions = new Map()
    const jsxLocalDeclarations = new Map()
    const jsxLocalsByFunction = new Map()
    const listLocalDeclarations = new WeakSet()
    const listLocalUses = new WeakMap()
    const listValues = new WeakMap()
    const listEventItems = new WeakMap()
    const listConditions = new WeakMap()
    let usesBehavior = false
    let usesBinding = false
    let usesConditional = false
    let usesList = false

    const collect = node => {
      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callName = ts.isIdentifier(node.initializer.expression) ? node.initializer.expression.text : ""
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
      if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        functions.set(node.name.text, node.initializer)
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && isTopLevelConst(node)) {
        const owner = nearestFunction(node)
        const declarations = jsxLocalDeclarations.get(owner) ?? new Map()
        declarations.set(node.name.text, { node, initializer: node.initializer })
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
        for (const [name, { initializer }] of declarations) {
          if (!names.has(name) && isJsxLocalValue(initializer, names)) {
            names.add(name)
            changed = true
          }
        }
      }
      jsxLocalsByFunction.set(owner, names)
    }
    for (const [owner, declarations] of jsxLocalDeclarations) {
      const setters = settersByFunction.get(owner) ?? new Map()
      for (const [name, declaration] of declarations) {
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

    const visitor = node => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        return factory.updateImportDeclaration(node, node.modifiers, node.importClause, factory.createStringLiteral(modulePath(node.moduleSpecifier.text)), node.attributes)
      }

      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith(".")) {
        return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, factory.createStringLiteral(modulePath(node.moduleSpecifier.text)), node.attributes)
      }

      if (ts.isVariableDeclaration(node) && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "useState" && node.initializer.arguments.length === 1) {
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
        const parts = conditionalParts(node.initializer)
        if (parts) {
          const setters = settersForNode(node, settersByFunction)
          const usedStates = referencedStateNames(parts.condition, setters)
          const captures = captureNames(parts.condition, parts.condition, setters)
          if (usedStates.size || captures.size) {
            usesBehavior = true
            usesConditional = true
            const compiled = compileConditional(parts.kind, parts.condition, ts.visitNode(parts.truthy, visitor), ts.visitNode(parts.falsy, visitor), setters, factory, context, reactiveBindings, handlerUrl)
            return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, compiled)
          }
        }
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
        const listParts = listLocalUses.get(node) ?? keyedListParts(node.expression, settersForNode(node, settersByFunction))
        if (listParts) {
          if (keyedListParentTag(node) === "table") throw new Error("Keyed table rows must be wrapped in <tbody>, <thead>, or <tfoot>")
          validateKeyedList(listParts, sourceFile, settersForNode(node, settersByFunction), listValues, listEventItems, listConditions)
          usesBehavior = true
          usesList = true
          return factory.updateJsxExpression(node, factory.createCallExpression(factory.createIdentifier("__kList"), undefined, [
            listParts.state,
            factory.createStringLiteral(listParts.keyField),
            ts.visitNode(listParts.callback, visitor)
          ]))
        }
        const parts = conditionalParts(node.expression)
        if (parts) {
          const setters = settersForNode(node, settersByFunction)
          const usedStates = referencedStateNames(parts.condition, setters)
          const captures = captureNames(parts.condition, parts.condition, setters)
          if (usedStates.size || captures.size) {
            usesBehavior = true
            usesConditional = true
            const truthy = ts.visitNode(parts.truthy, visitor)
            const falsy = ts.visitNode(parts.falsy, visitor)
            const compiled = compileConditional(parts.kind, parts.condition, truthy, falsy, setters, factory, context, reactiveBindings, handlerUrl)
            return factory.updateJsxExpression(node, compiled)
          }
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

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && !/^on/i.test(node.name.getText()) && !["key", "ref", "dangerouslysetinnerhtml"].includes(node.name.getText().toLowerCase())) {
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

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && /^on[A-Z]/.test(node.name.getText())) {
        const setters = settersForNode(node, settersByFunction)
        const event = compileEvent(node.initializer.expression, setters, functions, factory, nativeHandlers, handlerUrl, listEventItems.get(node), importBindings, clientImports)
        if (event) {
          usesBehavior = true
          return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, event))
        }
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
        throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${node.name.getText()} must reference a function`)
      }

      return ts.visitEachChild(node, visitor, context)
    }

    const transformed = ts.visitNode(sourceFile, visitor)
    if (!usesBehavior) return transformed

    const behaviorImports = [factory.createImportSpecifier(false, factory.createIdentifier("behavior"), factory.createIdentifier("__kBehavior"))]
    if (nativeHandlers.length) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("nativeBehavior"), factory.createIdentifier("__kNativeBehavior")))
    if (usesBinding) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("binding"), factory.createIdentifier("__kBinding")))
    if (usesConditional) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("conditional"), factory.createIdentifier("__kConditional")))
    if (usesList) {
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("list"), factory.createIdentifier("__kList")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listExpression"), factory.createIdentifier("__kListExpression")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listField"), factory.createIdentifier("__kListField")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listItem"), factory.createIdentifier("__kListItem")))
      behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("listConditional"), factory.createIdentifier("__kListConditional")))
    }
    if (usesBinding || usesConditional) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("bindingValue"), factory.createIdentifier("__kBindingValue")))
    const behaviorImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(behaviorImports)),
      factory.createStringLiteral("@kudzujs/core")
    )
    return factory.updateSourceFile(transformed, [behaviorImport, ...transformed.statements])
  }
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
  const key = attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText() === "key")
  const field = key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer) && key.initializer.expression && directProperty(key.initializer.expression, callback.parameters[0].name.text)
  if (!field) throw new Error(`Keyed list root must have key={${callback.parameters[0].name.text}.<field>}`)
  return { state, callback, root, item: callback.parameters[0].name.text, keyField: field }
}

function validateKeyedList(parts, sourceFile, setters, listValues, listEventItems, listConditions) {
  const fail = (node, message) => {
    const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    throw new Error(`${sourceFile.fileName}:${position.line + 1}:${position.character + 1} ${message}`)
  }
  const validateElement = node => {
    const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName
    if (!ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) fail(node, "Keyed list items must use intrinsic JSX elements")
  }
  let conditionDepth = 0
  const visit = node => {
    if (ts.isJsxFragment(node)) fail(node, "Fragments are not supported in keyed lists")
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) validateElement(node)
    if (node !== parts.root && ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && containsJsx(node)) fail(node, "Nested keyed lists are not supported")
    if (ts.isJsxSpreadAttribute(node) && referencesIdentifier(node.expression, parts.item)) fail(node, "Keyed list item spreads are not supported")
    if (ts.isJsxAttribute(node) && /^on[A-Z]/.test(node.name.getText())) {
      listEventItems.set(node, parts.item)
      return
    }
    if (ts.isJsxExpression(node) && node.expression) {
      const expression = unwrapExpression(node.expression)
      const condition = conditionalParts(expression)
      if (condition && containsJsx(expression)) {
        if (conditionDepth) fail(node, "Nested item conditions are not supported in keyed lists")
        if (!referencesIdentifier(condition.condition, parts.item)) fail(node, "Keyed list item conditions must read the item")
        validateListExpression(condition.condition, parts.item, node, fail)
        listConditions.set(node.expression, { ...condition, item: parts.item })
        conditionDepth++
        visit(condition.truthy)
        visit(condition.falsy)
        conditionDepth--
        return
      }
      const field = directProperty(expression, parts.item)
      const isRootKey = ts.isJsxAttribute(node.parent) && node.parent.name.getText() === "key"
      if (field && ["__proto__", "constructor", "prototype"].includes(field)) fail(node, `Keyed list item property "${field}" is not supported`)
      if (field && ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.getText().toLowerCase())) fail(node, `Keyed list item ${node.parent.name.getText()} is not supported`)
      if (isRootKey) return
      if (field) {
        listValues.set(node.expression, { field })
        return
      }
      if (referencesIdentifier(expression, parts.item)) {
        validateListExpression(expression, parts.item, node, fail)
        if (ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.getText().toLowerCase())) fail(node, `Keyed list item ${node.parent.name.getText()} is not supported`)
        listValues.set(node.expression, { item: parts.item })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(parts.root)
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

function isTopLevelConst(node) {
  const list = node.parent
  const statement = list?.parent
  const owner = nearestFunction(node)
  return ts.isVariableDeclarationList(list) && (list.flags & ts.NodeFlags.Const) !== 0 && ts.isVariableStatement(statement) && statement.parent === owner?.body
}

function isJsxLocalValue(expression, known) {
  const value = unwrapExpression(expression)
  if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value) || ts.isJsxFragment(value)) return true
  if (ts.isIdentifier(value)) return known.has(value.text)
  const parts = conditionalParts(value)
  return Boolean(parts && (isJsxLocalValue(parts.truthy, known) || isJsxLocalValue(parts.falsy, known)))
}

function compileReactiveBinding(expression, setters, factory, context, reactiveBindings, handlerUrl) {
  return factory.createCallExpression(factory.createIdentifier("__kBinding"), undefined, compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl))
}

function compileConditional(kind, expression, truthy, falsy, setters, factory, context, reactiveBindings, handlerUrl) {
  const [initial, ...descriptor] = compileReactiveExpression(expression, setters, factory, context, reactiveBindings, handlerUrl)
  const thunk = branch => factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), branch)
  return factory.createCallExpression(factory.createIdentifier("__kConditional"), undefined, [factory.createStringLiteral(kind), initial, thunk(truthy), thunk(falsy), ...descriptor])
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

function compileEvent(expression, setters, functions, factory, nativeHandlers, handlerUrl, listItem, importBindings, clientImports) {
  if (ts.isIdentifier(expression)) expression = functions.get(expression.text)
  if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression) && !ts.isFunctionDeclaration(expression))) return undefined

  const optimized = compileOptimizedEvent(expression, setters, factory)
  if (optimized) return optimized

  const allCaptures = nativeCaptureNames(expression, setters)
  const imports = [...referencedImportedBindings(expression, importBindings)].map(name => importBindings.get(name))
  const captures = new Set([...allCaptures].filter(name => !importBindings.has(name)))
  for (const entry of imports) clientImports.add(entry.target)
  const usedStates = nativeStateNames(expression, setters)
  const exportName = `handler${nativeHandlers.length}`
  nativeHandlers.push({ exportName, expression, captures, imports, setters: new Map([...setters].filter(([, state]) => usedStates.has(state))) })
  const states = [...usedStates].map(name => factory.createArrayLiteralExpression([
    factory.createStringLiteral(name),
    factory.createIdentifier(name)
  ]))
  return factory.createCallExpression(factory.createIdentifier("__kNativeBehavior"), undefined, [
    factory.createStringLiteral(handlerUrl),
    factory.createStringLiteral(exportName),
    factory.createArrayLiteralExpression(states),
    factory.createArrayLiteralExpression([...captures].map(name => factory.createArrayLiteralExpression([
      factory.createStringLiteral(name),
      name === listItem ? factory.createCallExpression(factory.createIdentifier("__kListItem"), undefined, []) : factory.createIdentifier(name)
    ])))
  ])
}

function nativeStateNames(expression, setters) {
  return referencedStateNames(expression.body, setters, expression)
}

function referencedStateNames(root, setters, scopeRoot = root) {
  const stateNames = new Set(setters.values())
  const used = new Set()
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text)) used.add(setters.get(node.expression.text))
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
  "Array", "ArrayBuffer", "BigInt", "Boolean", "Date", "Error", "Event", "FormData", "Infinity", "Intl", "JSON", "Map", "Math", "NaN", "Number", "Object", "Promise", "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set", "String", "Symbol", "TypeError", "URL", "URLSearchParams", "WeakMap", "WeakSet", "WebSocket", "atob", "btoa", "clearInterval", "clearTimeout", "console", "crypto", "document", "fetch", "globalThis", "history", "isFinite", "isNaN", "location", "navigator", "parseFloat", "parseInt", "queueMicrotask", "requestAnimationFrame", "setInterval", "setTimeout", "structuredClone", "undefined", "window"
])

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
  const collectDeclarations = node => {
    if (ts.isVariableDeclaration(node)) for (const name of bindingNames(node.name)) local.add(name)
    if (ts.isParameter(node)) for (const name of bindingNames(node.name)) local.add(name)
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) local.add(node.name.text)
    ts.forEachChild(node, collectDeclarations)
  }
  collectDeclarations(declarationRoot)

  const stateNames = new Set(setters.values())
  const captures = new Set()
  const visit = node => {
    if (ts.isTypeNode(node)) return
    if (ts.isIdentifier(node) && isReferenceIdentifier(node) && !local.has(node.text) && !setters.has(node.text) && !stateNames.has(node.text) && !nativeGlobals.has(node.text)) {
      captures.add(node.text)
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
      (ts.isVariableDeclaration(parent) && parent.name === node) ||
      (ts.isParameter(parent) && parent.name === node) ||
      (ts.isFunctionDeclaration(parent) && parent.name === node) ||
      (ts.isBindingElement(parent) && parent.name === node) ||
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
    if ((ts.isFunctionDeclaration(current) || ts.isFunctionExpression(current) || ts.isArrowFunction(current)) && current.parameters.some(parameter => bindingNames(parameter.name).includes(node.text))) return true
    if (current === scopeRoot) break
  }
  return false
}

function settersForNode(node, settersByFunction) {
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isFunctionDeclaration(current) && !ts.isFunctionExpression(current) && !ts.isArrowFunction(current)) continue
    const setters = settersByFunction.get(current)
    if (setters) return setters
  }
  return new Map()
}

function clientImportBindings(sourceFile, file, sourceFiles) {
  const bindings = new Map()
  for (const node of sourceFile.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause || node.importClause.isTypeOnly || !ts.isStringLiteral(node.moduleSpecifier) || !node.moduleSpecifier.text.startsWith(".")) continue
    const target = resolveSourceImport(file, node.moduleSpecifier.text, sourceFiles)
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

async function collectClientModules(entries, sourceFiles) {
  const modules = new Set()
  const queue = [...new Set(entries)]
  while (queue.length) {
    const file = queue.shift()
    if (modules.has(file)) continue
    const source = await readFile(file, "utf8")
    const sourceFile = parseSourceFile(file, source)
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
    : [`${stem}.ts`, `${stem}.tsx`]
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

function clientModulePath(file) {
  return `modules/${relative(sourceDirectory, file).replaceAll(sep, "/").replace(/\.(?:ts|tsx)$/, ".js")}`
}

function relativeModulePath(from, to) {
  const path = relative(dirname(from), to).replaceAll(sep, "/")
  return path.startsWith(".") ? path : `./${path}`
}

function printNativeHandler({ exportName, expression, captures, setters }) {
  const factory = ts.factory
  const stateNames = new Set(setters.values())
  const transformer = context => root => {
    const visitor = node => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && setters.has(node.expression.text)) {
        return factory.createCallExpression(
          factory.createPropertyAccessExpression(factory.createIdentifier("__k"), "set"),
          undefined,
          [factory.createStringLiteral(setters.get(node.expression.text)), ...node.arguments.map(argument => ts.visitNode(argument, visitor))]
        )
      }
      if (ts.isIdentifier(node) && stateNames.has(node.text) && isReferenceIdentifier(node) && !isShadowedByParameter(node, expression)) {
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
  const transformed = ts.transform(expression.body, [transformer])
  try {
    const body = ts.isBlock(expression.body)
      ? transformed.transformed[0]
      : factory.createBlock([factory.createReturnStatement(transformed.transformed[0])], true)
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

function modulePath(value) {
  if (/\.(?:ts|tsx|js|jsx)$/.test(value)) return value.replace(/\.(?:ts|tsx|js|jsx)$/, ".mjs")
  return `${value}.mjs`
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

function normalizeBase(value) {
  if (value == null || value === "" || value === "/") return ""
  if (typeof value !== "string" || !value.startsWith("/") || /[?#\0]/.test(value) || value.split("/").includes("..")) throw new Error("kudzu.config base must be a root-relative path")
  return value.replace(/\/+$/, "")
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
