import { createServer } from "node:http"
import { cp, mkdir, readFile, readdir, rm, stat, watch, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"
import { renderPage } from "./core.mjs"

const root = process.cwd()
const sourceDirectory = join(root, "src")
const pagesDirectory = join(sourceDirectory, "pages")
const workDirectory = join(root, ".kudzu")
const outputDirectory = join(root, "dist")

export async function build({ quiet = false } = {}) {
  await rm(workDirectory, { recursive: true, force: true })
  await rm(outputDirectory, { recursive: true, force: true })
  await mkdir(workDirectory, { recursive: true })
  await mkdir(outputDirectory, { recursive: true })

  const sourceFiles = (await walk(sourceDirectory)).filter(file => /\.(?:ts|tsx)$/.test(file)).sort()
  if (!sourceFiles.length) throw new Error("No TypeScript files found in src/")

  const handlerModules = []
  for (const file of sourceFiles) {
    const handlerModule = await compile(file)
    if (handlerModule) handlerModules.push(handlerModule)
  }

  const pageFiles = sourceFiles.filter(file => file.startsWith(`${pagesDirectory}${sep}`) && file.endsWith(".tsx"))
  if (!pageFiles.length) throw new Error("No pages found in src/pages/")

  let behaviorCount = 0
  let bindingCount = 0
  let stateSeedCount = 0
  const plans = []
  const hasStyles = await exists(join(sourceDirectory, "style.css"))

  for (const pageFile of pageFiles) {
    const compiledFile = compiledPath(pageFile)
    const module = await import(`${pathToFileURL(compiledFile).href}?v=${Date.now()}`)
    if (typeof module.default !== "function") throw new Error(`${relative(root, pageFile)} must export a default component`)

    const result = await renderPage(module.default, {
      ...(module.metadata ?? {}),
      styles: hasStyles
    })
    const route = routeFromPage(pageFile)
    const routeDirectory = join(outputDirectory, route)
    await mkdir(routeDirectory, { recursive: true })
    await writeFile(join(routeDirectory, "index.html"), result.html)
    plans.push({ route: `/${route}`, ...result.plan })
    if (result.hasBehaviors) behaviorCount++
    if (result.hasBindings) bindingCount++
    if (result.hasStateSeed) stateSeedCount++
  }

  const assetsDirectory = join(outputDirectory, "assets")
  await mkdir(assetsDirectory, { recursive: true })
  const commandEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.commands).map(event => event.event)))].sort()
  const nativeEvents = [...new Set(plans.flatMap(plan => plan.events.filter(event => event.native).map(event => event.event)))].sort()
  if (behaviorCount) {
    const runtimeFile = bindingCount ? "./shared-runtime.js" : "./runtime.js"
    const runtime = specializeRuntime(await readFile(new URL(runtimeFile, import.meta.url), "utf8"), commandEvents, stateSeedCount > 0)
    await writeFile(join(assetsDirectory, "kudzu.js"), runtime)
  }
  const hasNativeHandlers = handlerModules.some(module => module.hasNativeHandlers)
  if (bindingCount || hasNativeHandlers) await cp(new URL("./serialization.js", import.meta.url), join(assetsDirectory, "kudzu-serialization.js"))
  if (bindingCount) {
    const bindingRuntime = (await readFile(new URL("./binding-runtime.js", import.meta.url), "utf8"))
      .replace('"./shared-runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
    await writeFile(join(assetsDirectory, "kudzu-binding.js"), bindingRuntime)
  }
  if (hasNativeHandlers) {
    const nativeRuntime = (await readFile(new URL("./native-runtime.js", import.meta.url), "utf8"))
      .replace('"./runtime.js"', '"./kudzu.js"')
      .replace('"./serialization.js"', '"./kudzu-serialization.js"')
    await writeFile(join(assetsDirectory, "kudzu-native.js"), specializeEvents(nativeRuntime, nativeEvents))
  }
  for (const handlerModule of handlerModules) {
    const output = join(assetsDirectory, handlerModule.path)
    await mkdir(resolve(output, ".."), { recursive: true })
    await writeFile(output, handlerModule.code)
  }
  await writeFile(join(workDirectory, "kudzu-plan.json"), JSON.stringify({ routes: plans }, null, 2))
  if (hasStyles) await cp(join(sourceDirectory, "style.css"), join(assetsDirectory, "style.css"))
  if (await exists(join(root, "public"))) await cp(join(root, "public"), outputDirectory, { recursive: true })

  if (!quiet) console.log(`Built ${pageFiles.length} page(s), ${behaviorCount} interactive page(s) into dist/`)
}

function specializeEvents(source, events) {
  return source.replace(/const eventNames = \[[^\n]+\]/, `const eventNames = ${JSON.stringify(events)}`)
}

function specializeRuntime(source, events, hasStateSeed) {
  const specialized = specializeEvents(source, events)
  if (hasStateSeed) return specialized
  return specialized
    .replace("  const initialState = document.body.dataset.kState\n", "")
    .replace("  if (initialState) for (const [id, value] of JSON.parse(initialState)) browserState.set(id, value)\n", "")
}

export async function dev() {
  await build()

  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
      const relativePath = pathname.replace(/^\/+/, "")
      let file = resolve(outputDirectory, relativePath)
      if (!file.startsWith(`${outputDirectory}${sep}`) && file !== outputDirectory) throw new Error("Invalid path")

      if ((await exists(file)) && (await stat(file)).isDirectory()) file = join(file, "index.html")
      if (!(await exists(file)) && !extname(file)) file = join(file, "index.html")
      const content = await readFile(file)
      response.writeHead(200, { "content-type": contentType(file) })
      response.end(content)
    } catch {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
      response.end("Not found")
    }
  })

  server.listen(3000, () => console.log("Kudzu dev server: http://localhost:3000"))

  let timer
  const watcher = watch(sourceDirectory, { recursive: true })
  for await (const event of watcher) {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        await build({ quiet: true })
        console.log(`Rebuilt after ${event.filename ?? "source change"}`)
      } catch (error) {
        console.error(error)
      }
    }, 80)
  }
}

async function compile(file) {
  const source = await readFile(file, "utf8")
  const nativeHandlers = []
  const reactiveBindings = []
  const handlerPath = `handlers/${relative(sourceDirectory, file).replaceAll(sep, "/").replace(/\.(?:ts|tsx)$/, ".js")}`
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "@kudzujs/core"
    },
    transformers: { before: [createKudzuTransformer(nativeHandlers, reactiveBindings, `/assets/${handlerPath}`)] },
    reportDiagnostics: true
  })

  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) {
    throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  }

  const output = compiledPath(file)
  await mkdir(resolve(output, ".."), { recursive: true })
  await writeFile(output, result.outputText)

  if (!nativeHandlers.length && !reactiveBindings.length) return undefined
  const moduleSource = [
    ...nativeHandlers.map(handler => printNativeHandler(handler)),
    ...reactiveBindings.map(entry => printReactiveBinding(entry))
  ].join("\n")
  const moduleResult = ts.transpileModule(moduleSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true
  })
  const moduleErrors = moduleResult.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (moduleErrors.length) throw new Error(moduleErrors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  return { path: handlerPath, code: moduleResult.outputText, hasNativeHandlers: nativeHandlers.length > 0 }
}

function createKudzuTransformer(nativeHandlers, reactiveBindings, handlerUrl) {
  return context => sourceFile => {
    const factory = context.factory
    const settersByFunction = new Map()
    const functions = new Map()
    let usesBehavior = false
    let usesBinding = false
    let usesConditional = false

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
      ts.forEachChild(node, collect)
    }
    collect(sourceFile)

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

      if (ts.isJsxExpression(node) && node.initializer === undefined && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
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
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ["className", "disabled", "value", "checked"].includes(node.name.getText())) {
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
        const event = compileEvent(node.initializer.expression, setters, functions, factory, nativeHandlers, handlerUrl)
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
    if (usesBinding || usesConditional) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("bindingValue"), factory.createIdentifier("__kBindingValue")))
    const behaviorImport = factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamedImports(behaviorImports)),
      factory.createStringLiteral("@kudzujs/core")
    )
    return factory.updateSourceFile(transformed, [behaviorImport, ...transformed.statements])
  }
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

function compileEvent(expression, setters, functions, factory, nativeHandlers, handlerUrl) {
  if (ts.isIdentifier(expression)) expression = functions.get(expression.text)
  if (!expression || (!ts.isArrowFunction(expression) && !ts.isFunctionExpression(expression) && !ts.isFunctionDeclaration(expression))) return undefined

  const optimized = compileOptimizedEvent(expression, setters, factory)
  if (optimized) return optimized

  const captures = nativeCaptureNames(expression, setters)
  const usedStates = nativeStateNames(expression, setters)
  const exportName = `handler${nativeHandlers.length}`
  nativeHandlers.push({ exportName, expression, captures, setters: new Map([...setters].filter(([, state]) => usedStates.has(state))) })
  const states = [...usedStates].map(name => factory.createArrayLiteralExpression([
    factory.createStringLiteral(name),
    factory.createIdentifier(name)
  ]))
  const scope = [...captures].map(name => factory.createArrayLiteralExpression([
    factory.createStringLiteral(name),
    factory.createIdentifier(name)
  ]))
  return factory.createCallExpression(factory.createIdentifier("__kNativeBehavior"), undefined, [
    factory.createStringLiteral(handlerUrl),
    factory.createStringLiteral(exportName),
    factory.createArrayLiteralExpression(states),
    factory.createArrayLiteralExpression(scope)
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

function routeFromPage(file) {
  const page = relative(pagesDirectory, file).replace(/\\/g, "/").replace(/\.tsx$/, "")
  return page === "index" ? "" : page.replace(/\/index$/, "")
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
