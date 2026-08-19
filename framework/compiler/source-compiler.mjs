import { readFile, realpath, stat } from "node:fs/promises"
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path"
import ts from "typescript"
import { createBindingIndex } from "./analysis/binding-index.mjs"
import { createComponentAnalysisSession } from "./analysis/component-analysis.mjs"
import { normalizeEffectPrivateRefs } from "./effect-private-ref-pass.mjs"
import { bindingNames, containsJsx, effectReturns, functionVarDeclaresName, importDeclarationNames, isFunctionLike, isLocalConst, isReferenceIdentifier, isShadowedByParameter, isShadowedIdentifier, isUnshadowedGlobal, nearestFunction, referenceIdentifiers, referencesIdentifier, sourceLocation, sourceNodeError, statementDeclaresName, unwrapExpression } from "./ast-helpers.mjs"
import { normalizeMediaQueryExternalStores, normalizeNavigatorCapabilityConditions } from "./browser-signal-passes.mjs"
import { analyzeCollectionPipeline, collectionExpression, collectionParameters, isArrayFromCall, mutatingCollectionMethods as mutatingListMethods, pureCollectionMathMethods as pureMathMethods, pureCollectionMethods as pureListMethods } from "./collection-analysis.mjs"
import { normalizeCustomHookTimerRefs } from "./custom-hook-timer-pass.mjs"
import { captureNames, createDescriptorSession, createSemanticArtifact, nativeCaptureNames, referencedReducerDispatches, referencedStateNames } from "./descriptor-session.mjs"
import { analyzeEffectDependencies, validateEffectOwnedBrowserResources } from "./effect-analysis.mjs"
import { createHandlerCodegen } from "./handler-codegen.mjs"
import { createHandlerLowering } from "./handler-lowering.mjs"
import { registerSharedAction, registerSharedState } from "./ir/module-ir.mjs"
import { analyzeOutsideClickHook, normalizeOutsideClickHooks } from "./outside-click-pass.mjs"
import { createCommandSpecializer } from "./optimize/command-specialization.mjs"
import { applyNormalizationPasses } from "./normalization-pipeline.mjs"
import { assetPath, relativeModulePath, withBase } from "./path-helpers.mjs"
import { createReactMigrationPass, reactMemoExpression } from "./react-migration-pass.mjs"
import { normalizeRenderControlFlow } from "./render-control-pass.mjs"
import { createRouterPass } from "./router-pass.mjs"
import { createProjectSession } from "./project-session.mjs"
import { createZustandPass } from "./zustand-pass.mjs"

export function createSourceCompiler(project) {
const { root, sourceDirectory, pagesDirectory, workDirectory, workerCompiler, modules, counters } = project
const buildDirectory = project.buildDirectory ?? workDirectory
const { ordinaryRuntimeDependencies, resolveSourceImport, runtimeModuleReference } = project.graph
const parseSourceFile = (file, source) => modules.read(file, source).sourceFile
const staticAssetExtensions = new Set([".avif", ".gif", ".ico", ".jpeg", ".jpg", ".otf", ".png", ".svg", ".ttf", ".webp", ".woff", ".woff2"])

function compileSource(file, sourceFiles, sourceIndex, staticFiles, cssModules, base) {
  const importedAssets = new Set()
  const source = sourceIndex.get(file)
  const semantic = createSemanticArtifact(relative(root, file).replaceAll(sep, "/"))
  const handlerPath = `handlers/${relative(sourceDirectory, file).replaceAll(sep, "/").replace(/\.(?:ts|tsx)$/, ".js")}`
  const plain = plainTypeScriptModule(file, source, sourceFiles)
  if (plain && counters) counters.plainModules = (counters.plainModules ?? 0) + 1
  const result = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "@kudzujs/core"
    },
    transformers: { before: [plain ? createPlainModuleTransformer(file, sourceFiles) : createKudzuTransformer({ semantic, handlerUrl: assetPath(base, `assets/${handlerPath}`), file, sourceFiles, sourceIndex, staticFiles, importedAssets, cssModules, base })] },
    reportDiagnostics: true
  })

  const errors = result.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (errors.length) {
    throw new Error(errors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  }
  const packageReference = emittedPackageReference(result.outputText, file, new Set(["react", "react-router-dom"]))
  if (packageReference) throw new Error(`${relative(root, file)} Runtime ${packageReference} module references are not supported`)

  const output = compiledPath(file)
  const { componentAnalysis, moduleIR } = semantic
  const sourceResult = { file: relative(root, file).replaceAll(sep, "/"), componentAnalysis, moduleIR, buildModule: { path: relative(root, output).replaceAll(sep, "/"), code: result.outputText }, importedAssets: [...importedAssets].map(file => relative(root, file).replaceAll(sep, "/")).sort() }
  const moduleHandlers = moduleIR.handlers.filter(handler => handler.kind === "module-export")
  if (!moduleHandlers.length && !moduleIR.bindings.length) {
    normalizeModulePaths(moduleIR)
    return sourceResult
  }
  const moduleSource = printHandlerModule({ moduleIR, handlerPath })
  const moduleResult = ts.transpileModule(moduleSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true
  })
  const moduleErrors = moduleResult.diagnostics?.filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error) ?? []
  if (moduleErrors.length) throw new Error(moduleErrors.map(error => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n"))
  normalizeModulePaths(moduleIR)
  sourceResult.handlerModule = { path: handlerPath, code: moduleResult.outputText, hasNativeHandlers: moduleHandlers.some(handler => handler.role === "native"), hasEffects: moduleHandlers.some(handler => handler.role === "effect"), clientImports: moduleIR.clientModules, hasPackageImports: moduleIR.imports.some(entry => entry.package) }
  return sourceResult
}

function plainTypeScriptModule(file, source, sourceFiles) {
  if (!file.endsWith(".ts")) return false
  const sourceFile = parseSourceFile(file, source)
  for (const statement of sourceFile.statements) {
    if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !runtimeModuleReference(statement)) continue
    if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.startsWith(".") || isStaticImport(statement.moduleSpecifier.text)) return false
    try { resolveSourceImport(file, statement.moduleSpecifier.text, sourceFiles) } catch { return false }
  }
  return true
}

function createPlainModuleTransformer(file, sourceFiles) {
  return context => sourceFile => context.factory.updateSourceFile(sourceFile, sourceFile.statements.map(statement => {
    if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !runtimeModuleReference(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.startsWith(".")) return statement
    const target = resolveSourceImport(file, statement.moduleSpecifier.text, sourceFiles)
    const specifier = context.factory.createStringLiteral(relativeModulePath(compiledPath(file), compiledPath(target)))
    if (ts.isImportDeclaration(statement)) return context.factory.updateImportDeclaration(statement, statement.modifiers, statement.importClause, specifier, statement.attributes)
    return context.factory.updateExportDeclaration(statement, statement.modifiers, statement.isTypeOnly, statement.exportClause, specifier, statement.attributes)
  }))
}

function normalizeModulePaths(moduleIR) {
  const normalize = target => isAbsolute(target) ? relative(root, target).replaceAll(sep, "/") : target
  moduleIR.imports = moduleIR.imports.map(entry => entry.package ? entry : { ...entry, target: normalize(entry.target) })
  moduleIR.clientModules = moduleIR.clientModules.map(normalize)
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
  const ordinary = new Set()
  const workers = new Set()
  const queue = entries.map(file => ({ file, owner: "ordinary" }))
  while (queue.length) {
    const { file, owner } = queue.pop()
    const visited = owner === "ordinary" ? ordinary : workers
    if (visited.has(file)) continue
    visited.add(file)
    reachable.add(file)
    const sourceFile = parseSourceFile(file, sourceIndex.get(file))
    if (owner === "ordinary") for (const target of ordinaryRuntimeDependencies(file, sourceFile, sourceFiles, isStaticImport)) queue.push({ file: target, owner: target.endsWith(".worker.ts") ? "worker" : owner })
    const visit = node => {
      if (owner === "worker") {
        const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && runtimeModuleReference(node) && node.moduleSpecifier
        if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith(".") && !isStaticImport(specifier.text)) {
          try { queue.push({ file: resolveSourceImport(file, specifier.text, sourceFiles), owner }) } catch {}
        }
      }
      const worker = workerCompiler.candidate(node, sourceFile)
      if (worker && ts.isStringLiteral(worker.url.arguments[0]) && worker.url.arguments[0].text.endsWith(".worker.ts")) {
        try { queue.push({ file: resolveSourceImport(file, worker.url.arguments[0].text, sourceFiles), owner: "worker" }) } catch {}
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }
  return [...reachable].sort()
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

function parameterizedDebounceHook(hook) {
  if (!hook || hook.parameters.length !== 2 || hook.asteriskToken || hook.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(hook.body) || hook.body.statements.length !== 3) return undefined
  const sourceFile = hook.getSourceFile()
  if (!hasFrameworkImport(sourceFile, "useState") || !hasFrameworkImport(sourceFile, "useEffect")) return undefined
  const [valueParameter, delayParameter] = hook.parameters
  if (!ts.isIdentifier(valueParameter.name) || valueParameter.initializer || valueParameter.dotDotDotToken || !ts.isIdentifier(delayParameter.name) || delayParameter.initializer || delayParameter.dotDotDotToken) return undefined
  const [stateStatement, effectStatement, returnStatement] = hook.body.statements
  if (!ts.isVariableStatement(stateStatement) || !(stateStatement.declarationList.flags & ts.NodeFlags.Const) || stateStatement.declarationList.declarations.length !== 1) return undefined
  const stateDeclaration = stateStatement.declarationList.declarations[0]
  if (!ts.isArrayBindingPattern(stateDeclaration.name) || stateDeclaration.name.elements.length !== 2 || !ts.isIdentifier(stateDeclaration.name.elements[0]?.name) || !ts.isIdentifier(stateDeclaration.name.elements[1]?.name) || !stateDeclaration.initializer || !ts.isCallExpression(stateDeclaration.initializer) || !ts.isIdentifier(stateDeclaration.initializer.expression) || stateDeclaration.initializer.expression.text !== "useState" || stateDeclaration.initializer.arguments.length !== 1) return undefined
  const stateArgument = unwrapExpression(stateDeclaration.initializer.arguments[0])
  const directValue = ts.isIdentifier(stateArgument) && stateArgument.text === valueParameter.name.text
  const normalizedValue = ts.isPropertyAccessExpression(stateArgument) && ts.isIdentifier(stateArgument.expression) && stateArgument.expression.text === valueParameter.name.text && stateArgument.name.text === "value"
  if (!directValue && !normalizedValue) return undefined
  if (!ts.isExpressionStatement(effectStatement) || !ts.isCallExpression(effectStatement.expression) || !ts.isIdentifier(effectStatement.expression.expression) || effectStatement.expression.expression.text !== "useEffect" || effectStatement.expression.arguments.length !== 2) return undefined
  const [setup, dependencies] = effectStatement.expression.arguments
  if ((!ts.isArrowFunction(setup) && !ts.isFunctionExpression(setup)) || setup.parameters.length || setup.asteriskToken || setup.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(setup.body) || setup.body.statements.length !== 2 || !ts.isArrayLiteralExpression(dependencies)) return undefined
  const normalizedDependencies = dependencies.elements.length === 1 && ts.isIdentifier(dependencies.elements[0]) && dependencies.elements[0].text === valueParameter.name.text
  const sourceDependencies = dependencies.elements.length === 2 && ts.isIdentifier(dependencies.elements[0]) && dependencies.elements[0].text === valueParameter.name.text && ts.isIdentifier(dependencies.elements[1]) && dependencies.elements[1].text === delayParameter.name.text
  if (!normalizedDependencies && !sourceDependencies) return undefined
  const timerStatement = setup.body.statements[0]
  if (!ts.isVariableStatement(timerStatement) || !(timerStatement.declarationList.flags & ts.NodeFlags.Const) || timerStatement.declarationList.declarations.length !== 1) return undefined
  const timerDeclaration = timerStatement.declarationList.declarations[0]
  if (!ts.isIdentifier(timerDeclaration.name) || !timerDeclaration.initializer || !ts.isCallExpression(timerDeclaration.initializer) || !ts.isIdentifier(timerDeclaration.initializer.expression) || timerDeclaration.initializer.expression.text !== "setTimeout" || !isUnshadowedGlobal(timerDeclaration.initializer.expression, sourceFile) || timerDeclaration.initializer.arguments.length !== 2 || !ts.isIdentifier(timerDeclaration.initializer.arguments[1]) || timerDeclaration.initializer.arguments[1].text !== delayParameter.name.text) return undefined
  const timeoutCallback = timerDeclaration.initializer.arguments[0]
  const timeoutBody = (ts.isArrowFunction(timeoutCallback) || ts.isFunctionExpression(timeoutCallback)) && !timeoutCallback.parameters.length && !timeoutCallback.asteriskToken && !timeoutCallback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) ? timeoutCallback.body : undefined
  const setterCall = timeoutBody && (ts.isBlock(timeoutBody) ? timeoutBody.statements.length === 1 && ts.isExpressionStatement(timeoutBody.statements[0]) ? timeoutBody.statements[0].expression : undefined : timeoutBody)
  if (!setterCall || !ts.isCallExpression(setterCall) || !ts.isIdentifier(setterCall.expression) || setterCall.expression.text !== stateDeclaration.name.elements[1].name.text || setterCall.arguments.length !== 1 || !ts.isIdentifier(setterCall.arguments[0]) || setterCall.arguments[0].text !== valueParameter.name.text) return undefined
  const cleanupReturn = setup.body.statements[1]
  const cleanup = ts.isReturnStatement(cleanupReturn) && cleanupReturn.expression && (ts.isArrowFunction(cleanupReturn.expression) || ts.isFunctionExpression(cleanupReturn.expression)) && !cleanupReturn.expression.parameters.length ? cleanupReturn.expression : undefined
  const cleanupBody = cleanup && (ts.isBlock(cleanup.body) ? cleanup.body.statements.length === 1 && ts.isExpressionStatement(cleanup.body.statements[0]) ? cleanup.body.statements[0].expression : undefined : cleanup.body)
  if (!cleanupBody || !ts.isCallExpression(cleanupBody) || !ts.isIdentifier(cleanupBody.expression) || cleanupBody.expression.text !== "clearTimeout" || !isUnshadowedGlobal(cleanupBody.expression, sourceFile) || cleanupBody.arguments.length !== 1 || !ts.isIdentifier(cleanupBody.arguments[0]) || cleanupBody.arguments[0].text !== timerDeclaration.name.text) return undefined
  if (!ts.isReturnStatement(returnStatement) || !returnStatement.expression || !ts.isIdentifier(returnStatement.expression) || returnStatement.expression.text !== stateDeclaration.name.elements[0].name.text) return undefined
  return { dependencies, delay: delayParameter.name.text, normalized: normalizedValue && normalizedDependencies, stateCall: stateDeclaration.initializer, state: stateDeclaration.name.elements[0].name.text, setter: stateDeclaration.name.elements[1].name.text, value: valueParameter.name.text }
}

function normalizeParameterizedDebounceHooks(sourceFile, factory, context) {
  const visitor = node => {
    if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const hook = parameterizedDebounceHook(node)
      if (hook && !hook.normalized) {
        const rewrite = current => {
          if (current === hook.stateCall) return factory.updateCallExpression(current, current.expression, current.typeArguments, [factory.createPropertyAccessExpression(factory.createIdentifier(hook.value), "value")])
          if (current === hook.dependencies) return factory.updateArrayLiteralExpression(current, [factory.createIdentifier(hook.value)])
          return ts.visitEachChild(current, rewrite, context)
        }
        return ts.visitEachChild(node, rewrite, context)
      }
    }
    return ts.visitEachChild(node, visitor, context)
  }
  return ts.visitNode(sourceFile, visitor)
}

function normalizeCompilerSource(sourceFile, { base, context, file, importedCollections, importedStaticCollections, sourceFiles, sourceIndex }) {
  const factory = context.factory
  let customHookTimerStates = new Set()
  sourceFile = applyNormalizationPasses(sourceFile, [
    ...(importedStaticCollections ? [source => normalizeImportedStaticCollections(source, importedStaticCollections, factory, context)] : []),
    source => normalizeReactRouterSyntax(source, factory, context, base),
    source => normalizeClsxSyntax(source, factory, context),
    source => normalizeMediaQueryExternalStores(source, factory, context),
    source => normalizeReactMigrationSyntax(source, factory, context, importedCollections ?? importedSerializableCollectionNames(source, file, sourceFiles, sourceIndex)),
    source => normalizeNavigatorCapabilityConditions(source, factory, context),
    source => normalizeParameterizedDebounceHooks(source, factory, context),
    source => normalizeOutsideClickHooks(source, factory, context),
    source => normalizeEffectPrivateRefs(source, factory, context),
    source => {
      const result = normalizeCustomHookTimerRefs(source, factory, context)
      customHookTimerStates = result.timerStates
      return result.sourceFile
    },
    source => {
      validateUseIdSyntax(source)
      return source
    },
    source => normalizeLazyStateInitializers(source, factory, context, file, sourceFiles, sourceIndex),
    source => normalizeZustandMigrationSyntax(source, factory, context),
    source => normalizeRenderControlFlow(source, factory, context),
    source => {
      workerCompiler.rejectOrdinaryImports(source, file, sourceFiles)
      return source
    }
  ])
  return { sourceFile, customHookTimerStates }
}

function createKudzuTransformer({ semantic, handlerUrl, file, sourceFiles, sourceIndex, staticFiles, importedAssets, cssModules, base }) {
  const { moduleIR } = semantic
  return context => sourceFile => {
    const hasLinkElements = /<link/i.test(sourceFile.text)
    const importedStaticCollections = importedSerializableCollections(sourceFile, file, sourceFiles, sourceIndex)
    const importedCollections = new Set(importedStaticCollections.keys())
    const normalized = normalizeCompilerSource(sourceFile, { base, context, file, importedCollections, importedStaticCollections, sourceFiles, sourceIndex })
    sourceFile = normalized.sourceFile
    const { customHookTimerStates } = normalized
    const bindingIndex = createBindingIndex(sourceFile)
    const factory = context.factory
    let activeStateOwners
    let activeKeyedBlock
    const sourceName = source => relative(root, source.fileName).replaceAll(sep, "/")
    const componentAnalysis = createComponentAnalysisSession(semantic.componentAnalysis)
    const descriptors = createDescriptorSession({
      semantic,
      handlerUrl,
      factory,
      context,
      bindingIndex,
      compileEventCommand,
      handlerLowering,
      isPrimitiveLiteral: isPrimitiveDefaultLiteral,
      stateReferences: node => new Map([...stateOwnersForNode(node), ...(activeStateOwners ?? [])]),
      symbolReference: (name, node, aliases) => {
        const names = new Set([name, ...aliases])
        let binding
        const visitName = current => {
          if (binding) return
          if (ts.isIdentifier(current)) {
            if (names.has(current.text)) binding = current
            return
          }
          for (const element of current.elements) if (ts.isBindingElement(element)) visitName(element.name)
        }
        for (let current = node; current && !binding; current = current.parent) if (isFunctionLike(current)) {
          for (const parameter of current.parameters) visitName(parameter.name)
          if (ts.isBlock(current.body)) for (const statement of current.body.statements) {
            if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) visitName(declaration.name)
            if (ts.isFunctionDeclaration(statement) && statement.name) visitName(statement.name)
          }
        }
        return binding ? { kind: "module-symbol", symbol: modules.symbol(binding.getSourceFile().fileName, binding, name) } : undefined
      },
      sourceName,
      rejectWorkerConstructions: expression => workerCompiler.rejectConstructions(expression, expression.getSourceFile(), "Relative TypeScript Worker construction is only supported directly inside an inline useEffect() callback")
    })
    const importBindings = clientImportBindings(sourceFile, file, sourceFiles)
    const packageBindings = packageImportBindings(sourceFile)
    for (const [name] of packageBindings) {
      const references = referenceIdentifiers(sourceFile, name)
      const invalid = references.find(reference => !insideJsxEventHandler(reference, sourceFile) && !insideOwnedEffectCallback(reference, sourceFile))
      if (invalid) throw sourceNodeError(invalid, sourceFile, `Package import ${JSON.stringify(name)} may only be referenced directly inside JSX event handlers or owned effect setup/cleanup callbacks`)
    }
    const hasUseEffectImport = sourceFile.statements.some(statement => ts.isImportDeclaration(statement) && ["@kudzujs/core", "react"].includes(statement.moduleSpecifier.text) && statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings) && statement.importClause.namedBindings.elements.some(entry => !entry.propertyName && entry.name.text === "useEffect"))
    const importedSourceCache = new Map()
    const importedSource = target => {
      let result = importedSourceCache.get(target)
      if (!result) {
        result = normalizeCompilerSource(modules.clone(target, context.factory, context), { base, context, file: target, sourceFiles, sourceIndex })
        importedSourceCache.set(target, result)
      }
      return result.sourceFile
    }
    const importedCollectionTransforms = new Map()
    const importedCalculationFunctions = new Map()
    const validatedEffectCalculations = new WeakSet()
    for (const [name, binding] of importBindings) {
      if (binding.kind === "namespace") continue
      try {
        importedCollectionTransforms.set(name, resolveComponentExport(binding.target, binding.kind === "default" ? "default" : binding.imported, target => parseSourceFile(target, sourceIndex.get(target)), sourceFiles))
      } catch {}
    }
    const settersByFunction = new Map()
    const stateOwnersByFunction = new Map()
    const localStateSettersByFunction = new Map()
    const reducersByFunction = new Map()
    const sharedStateAdapters = new Map()
    const resolvedSharedState = entry => {
      const exportName = entry.kind === "default" ? "default" : entry.imported
      const key = `${entry.target}:${exportName}`
      if (sharedStateAdapters.has(key)) return sharedStateAdapters.get(key)
      const targetSource = parseSourceFile(entry.target, sourceIndex.get(entry.target))
      const store = analyzeZustandStores(targetSource).get(exportName)
      sharedStateAdapters.set(key, store)
      return store
    }
    const functions = new Map()
    const customHookFunctionsByOwner = new Map()
    const customHookPrivateFields = new WeakMap()
    const contextProviderPrivateSetters = new WeakMap()
    const components = new Map()
    const contexts = new Set()
    const customHooks = new Map()
    const parameterizedDebounceCalls = new WeakSet()
    const resolvedParameterizedDebounceHooks = new Map()
    const outsideClickCalls = new WeakMap()
    const resolvedOutsideClickHooks = new Map()
    const jsxLocalDeclarations = new Map()
    const jsxLocalsByFunction = new Map()
    const listLocalDeclarations = []
    const listLocalUses = []
    const analysisSource = node => {
      const original = ts.getOriginalNode(node)
      return original.pos >= 0 && original.end >= 0 ? { file: sourceName(original.getSourceFile()), start: original.getStart(), end: original.end } : undefined
    }
    const analysisSite = (node, role) => {
      const original = ts.getOriginalNode(node)
      return original.pos >= 0 && original.end >= 0 ? modules.siteId(original, role) : undefined
    }
    const analyzedProps = owner => {
      if (owner.parameters.length !== 1 || !ts.isObjectBindingPattern(owner.parameters[0].name)) return []
      return owner.parameters[0].name.elements.map(element => ({
        name: (element.propertyName ?? element.name).getText(),
        local: element.name.getText(),
        ...(element.dotDotDotToken ? { rest: true } : {}),
        ...(element.initializer ? { hasDefault: true } : {})
      }))
    }
    const ownerName = owner => owner.name?.text ?? (ts.isVariableDeclaration(owner.parent) && ts.isIdentifier(owner.parent.name) ? owner.parent.name.text : "anonymous")
    const ensureOwner = (owner, kind = "component") => componentAnalysis.registerOwner(owner, { kind, name: ownerName(owner), props: analyzedProps(owner), site: analysisSite(owner, "owner"), source: analysisSource(owner) })
    const registerState = (owner, state, setter, kind, node, externalOwner) => {
      const ownerRecord = ensureOwner(owner)
      const stateRecord = componentAnalysis.registerState(owner, { name: state, setter, kind, ...(externalOwner ? { owner: externalOwner.owner } : {}), site: analysisSite(node, "hook"), source: analysisSource(node) })
      const stateOwner = externalOwner?.state
        ? { kind: "module-symbol", symbol: externalOwner.state }
        : { kind: "state", owner: { kind: "component", slot: ownerRecord.slot }, slot: stateRecord.slot }
      const stateOwners = stateOwnersByFunction.get(owner) ?? new Map()
      stateOwners.set(state, stateOwner)
      stateOwnersByFunction.set(owner, stateOwners)
      return stateRecord
    }
    const stateOwnersForNode = node => {
      for (let current = node.parent; current; current = current.parent) {
        if (isFunctionLike(current)) {
          const stateOwners = stateOwnersByFunction.get(current) ?? stateOwnersByFunction.get(ts.getOriginalNode(current))
          if (stateOwners) return stateOwners
          const site = analysisSite(current, "owner")
          const owner = site && semantic.componentAnalysis.owners.find(entry => entry.site === site)
          if (owner) return new Map(owner.states.map(state => [state.name, { kind: "state", owner: { kind: "component", slot: owner.slot }, slot: state.slot }]))
        }
      }
      return new Map()
    }
    const fallbackOwner = node => {
      for (let current = node.parent; current; current = current.parent) {
        const owner = isFunctionLike(current) ? componentAnalysis.owner(current) : undefined
        if (owner) return { kind: "component", slot: owner.slot }
      }
      return { kind: "module" }
    }
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

    const resolveContextHook = (returned, hookSource) => {
      if (!hasFrameworkImport(hookSource, "useContext")) throw sourceNodeError(returned.expression, hookSource, "Relative Context hooks must call useContext imported from react or @kudzujs/core")
      if (returned.arguments.length !== 1 || !ts.isIdentifier(returned.arguments[0])) throw sourceNodeError(returned, hookSource, "Relative Context hooks must directly return useContext(ContextIdentifier)")
      const contextName = returned.arguments[0].text
      let providerSource = hookSource
      let providerContextName = contextName
      const hookImports = clientImportBindings(hookSource, hookSource.fileName, sourceFiles)
      if (hookImports.has(contextName)) {
        const binding = hookImports.get(contextName)
        if (binding.kind === "namespace" || binding.kind === "default") throw sourceNodeError(returned.arguments[0], hookSource, "Relative Context hooks require a named Context import")
        providerSource = importedSource(binding.target)
        providerContextName = binding.imported
      }
      const hasContext = hasFrameworkImport(providerSource, "createContext") && providerSource.statements.some(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => ts.isIdentifier(declaration.name) && declaration.name.text === providerContextName && declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "createContext"))
      if (!hasContext) throw sourceNodeError(returned.arguments[0], hookSource, "Relative Context hooks require a local or named relative createContext() declaration")

      const providers = []
      const findProviders = node => {
        if (ts.isJsxAttribute(node) && node.name.text === "value") {
          const element = node.parent?.parent
          const tag = ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName : undefined
          if (ts.isPropertyAccessExpression(tag) && tag.name.text === "Provider" && ts.isIdentifier(tag.expression) && tag.expression.text === providerContextName) providers.push(node)
        }
        ts.forEachChild(node, findProviders)
      }
      findProviders(providerSource)
      if (providers.length !== 1) throw sourceNodeError(returned.arguments[0], hookSource, "Relative Context hooks require exactly one Provider value in the Context module")
      const provider = providers[0]
      const value = provider.initializer && ts.isJsxExpression(provider.initializer) && provider.initializer.expression ? unwrapExpression(provider.initializer.expression) : undefined
      if (!value || !ts.isObjectLiteralExpression(value)) throw sourceNodeError(provider, providerSource, "Context Provider value must be one direct object literal")
      const owner = nearestFunction(provider)
      if (!owner) throw sourceNodeError(provider, providerSource, "Context Provider value must be returned by a component")
      const stateOwner = { kind: "module-symbol", symbol: modules.symbol(providerSource.fileName, owner, ownerName(owner)) }

      const states = new Map()
      const stateSymbols = new Map()
      const callbacks = new Map()
      const hasUseState = hasFrameworkImport(providerSource, "useState")
      const collectProviderBindings = node => {
        if (ts.isVariableDeclaration(node) && nearestFunction(node) === owner) {
          if (hasUseState && ts.isArrayBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "useState") {
            const [state, setter] = node.name.elements
            if (node.name.elements.length === 2 && state && setter && ts.isBindingElement(state) && ts.isBindingElement(setter) && ts.isIdentifier(state.name) && ts.isIdentifier(setter.name)) {
              states.set(setter.name.text, state.name.text)
              stateSymbols.set(state.name.text, modules.symbol(providerSource.fileName, state.name, state.name.text))
            }
          }
          if (ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) callbacks.set(node.name.text, node.initializer)
        }
        ts.forEachChild(node, collectProviderBindings)
      }
      collectProviderBindings(owner.body)

      const fields = new Set()
      const stateFields = new Set([...states].flat())
      for (const property of value.properties) {
        if (!ts.isShorthandPropertyAssignment(property)) throw sourceNodeError(property, providerSource, "Context Provider values must use direct shorthand state, setter, or action fields")
        const name = property.name.text
        if (!stateFields.has(name) && !callbacks.has(name)) throw sourceNodeError(property, providerSource, `Context Provider field ${JSON.stringify(name)} must be a direct provider-owned state, setter, or action`)
        fields.add(name)
      }
      for (const [setter, state] of states) {
        if (fields.has(setter) && !fields.has(state)) throw sourceNodeError(value, providerSource, `Context Provider setter ${JSON.stringify(setter)} requires exposed state ${JSON.stringify(state)}`)
      }
      for (const [name, callback] of callbacks) {
        if (!fields.has(name)) continue
        if (callback.asteriskToken || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) throw sourceNodeError(callback, providerSource, `Context action ${JSON.stringify(name)} must be synchronous`)
        const capture = nativeCaptureNames(callback, states).values().next().value
        if (capture) throw sourceNodeError(callback, providerSource, `Context action ${JSON.stringify(name)} cannot capture private binding ${JSON.stringify(capture)}`)
        for (const state of referencedStateNames(callback.body, states, callback)) {
          const setter = [...states].find(([, candidate]) => candidate === state)?.[0]
          if (!setter || !fields.has(state)) throw sourceNodeError(callback, providerSource, `Context action ${JSON.stringify(name)} requires exposed state field ${JSON.stringify(state)}`)
        }
      }
      return { callbacks: new Map([...callbacks].filter(([name]) => fields.has(name))), context: true, fields, privateStates: new Set(), stateOwner, stateSymbols, states }
    }

    const resolveCustomHook = (binding, call) => {
      const exportName = binding.kind === "default" ? "default" : binding.imported
      const key = `${binding.target}:${exportName}`
      if (customHooks.has(key)) return customHooks.get(key)
      const hook = resolveComponentExport(binding.target, exportName, importedSource, sourceFiles)
      const hookSource = hook.getSourceFile()
      if (hook.parameters.length || hook.asteriskToken || hook.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(hook.body)) throw sourceNodeError(hook, hookSource, "Relative custom hooks must be synchronous zero-argument functions with a block body")
      const returns = hook.body.statements.filter(ts.isReturnStatement)
      const returned = returns.length === 1 && returns[0] === hook.body.statements.at(-1) && returns[0].expression ? unwrapExpression(returns[0].expression) : undefined
      if (returned && ts.isCallExpression(returned) && ts.isIdentifier(returned.expression) && returned.expression.text === "useContext") {
        const analysis = resolveContextHook(returned, hookSource)
        customHooks.set(key, analysis)
        return analysis
      }
      if (!returned || !ts.isObjectLiteralExpression(returned)) throw sourceNodeError(hook.body, hookSource, "Relative custom hooks must end with one direct object return or direct useContext(ContextIdentifier)")

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
      const privateStates = new Set([...states.values()].filter(state => importedSourceCache.get(hookSource.fileName)?.customHookTimerStates.has(state)))
      const analysis = { callbacks, fields, privateStates, states }
      customHooks.set(key, analysis)
      return analysis
    }
    const resolveParameterizedDebounceHook = binding => {
      const exportName = binding.kind === "default" ? "default" : binding.imported
      const key = `${binding.target}:${exportName}`
      if (resolvedParameterizedDebounceHooks.has(key)) return resolvedParameterizedDebounceHooks.get(key)
      const hook = resolveComponentExport(binding.target, exportName, importedSource, sourceFiles)
      const analysis = parameterizedDebounceHook(hook)
      resolvedParameterizedDebounceHooks.set(key, analysis)
      return analysis
    }
    const resolveOutsideClickHook = binding => {
      const exportName = binding.kind === "default" ? "default" : binding.imported
      const key = `${binding.target}:${exportName}`
      if (resolvedOutsideClickHooks.has(key)) return resolvedOutsideClickHooks.get(key)
      const hook = resolveComponentExport(binding.target, exportName, importedSource, sourceFiles)
      const analysis = analyzeOutsideClickHook(hook)
      resolvedOutsideClickHooks.set(key, analysis)
      return analysis
    }

    const collect = node => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
        const callName = ts.isIdentifier(node.initializer.expression) ? node.initializer.expression.text : ""
        const customHookImport = callName && /^use[A-Z]/.test(callName) && importBindings.has(callName) && importBindings.get(callName).kind !== "namespace" && !resolvedSharedState(importBindings.get(callName))
        const debounce = customHookImport && ts.isIdentifier(node.name) ? resolveParameterizedDebounceHook(importBindings.get(callName)) : undefined
        if (debounce) {
          if (!isLocalConst(node)) throw sourceNodeError(node, sourceFile, "Parameterized debounce hooks must initialize one top-level const identifier")
          const owner = nearestFunction(node)
          const value = node.initializer.arguments[0] && unwrapExpression(node.initializer.arguments[0])
          const delay = node.initializer.arguments[1] && unwrapExpression(node.initializer.arguments[1])
          const setters = owner ? settersByFunction.get(owner) ?? new Map() : new Map()
          if (!owner) throw sourceNodeError(node, sourceFile, "Parameterized debounce hooks cannot be used outside a Kudzu component")
          if (node.initializer.arguments.length !== 2 || !ts.isIdentifier(value) || !new Set(setters.values()).has(value.text) || !componentHasDirectPrimitiveState(owner, value.text)) throw sourceNodeError(node.initializer, sourceFile, "Parameterized debounce hooks require one direct primitive state argument")
          if (!ts.isNumericLiteral(delay)) throw sourceNodeError(node.initializer.arguments[1] ?? node.initializer, sourceFile, "Parameterized debounce hook delays must be numeric literals")
          const syntheticSetter = `__kSetDebounced_${Math.max(0, node.pos)}`
          setters.set(syntheticSetter, node.name.text)
          registerState(owner, node.name.text, syntheticSetter, "custom-hook", node)
          settersByFunction.set(owner, setters)
          parameterizedDebounceCalls.add(node.initializer)
        } else if (customHookImport) {
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
          const requiredContextStates = new Set()
          if (hook.context) {
            for (const name of names) {
              const callback = hook.callbacks.get(name)
              if (callback) for (const state of referencedStateNames(callback.body, hook.states, callback)) requiredContextStates.add(state)
            }
          }
          const contextSubstitutions = new Map()
          const contextSharedStates = new Map()
          for (const [setter, state] of hook.states) {
            if (hook.context) {
              if (names.has(setter) && !names.has(state)) throw sourceNodeError(node.name, sourceFile, `Relative Context setter ${JSON.stringify(setter)} requires state ${JSON.stringify(state)} to be destructured`)
              if (!names.has(state) && !requiredContextStates.has(state)) continue
              const privateFields = customHookPrivateFields.get(node) ?? []
              const localName = field => {
                if (names.has(field)) return field
                const occupied = name => owner.parameters.some(parameter => bindingNames(parameter.name).includes(name)) || owner.body.statements.some(statement => statement !== node.parent.parent && statementDeclaresName(statement, name))
                if (!occupied(field)) return field
                let index = 0
                let local
                do local = `__kContext_${field}${index++ || ""}`
                while (occupied(local))
                return local
              }
              const localState = localName(state)
              const localSetter = localName(setter)
              setters.set(localSetter, localState)
              registerState(owner, localState, localSetter, "context", node, { owner: hook.stateOwner, state: hook.stateSymbols.get(state) })
              const sharedState = registerSharedState(moduleIR, { identity: hook.stateOwner.symbol.id, field: state })
              contextSharedStates.set(state, sharedState)
              stateOwnersByFunction.get(owner).set(localState, { kind: "shared-state", sharedState: sharedState.slot })
              if (requiredContextStates.has(state)) {
                for (const [field, local] of [[state, localState], [setter, localSetter]]) {
                  if (names.has(field) || privateFields.some(entry => (typeof entry === "string" ? entry : entry.property) === field)) continue
                  privateFields.push({ property: field, local })
                  if (field !== local) contextSubstitutions.set(field, factory.createIdentifier(local))
                }
                customHookPrivateFields.set(node, privateFields)
              }
              continue
            }
            if (hook.privateStates.has(state)) {
              setters.set(setter, state)
              registerState(owner, state, setter, "custom-hook", node)
              const fields = customHookPrivateFields.get(node) ?? []
              fields.push(state, setter)
              customHookPrivateFields.set(node, fields)
              continue
            }
            if (names.has(setter) !== names.has(state)) throw sourceNodeError(node.name, sourceFile, `Relative custom hook state ${JSON.stringify(state)} and setter ${JSON.stringify(setter)} must be destructured together`)
            if (names.has(setter)) {
              setters.set(setter, state)
              registerState(owner, state, setter, "custom-hook", node)
            }
          }
          settersByFunction.set(owner, setters)
          for (const name of names) {
            if (hook.callbacks.has(name)) {
              const callback = contextSubstitutions.size ? substituteClone(hook.callbacks.get(name), contextSubstitutions, factory, context) : hook.callbacks.get(name)
              const callbacks = customHookFunctionsByOwner.get(owner) ?? new Map()
              callbacks.set(name, callback)
              customHookFunctionsByOwner.set(owner, callbacks)
              if (hook.context) {
                const reducers = reducersByFunction.get(owner) ?? new Map()
                const states = new Map([...hook.states].map(([setter, state]) => [contextSubstitutions.get(setter)?.text ?? setter, contextSubstitutions.get(state)?.text ?? state]))
                const referenced = referencedStateNames(hook.callbacks.get(name).body, hook.states, hook.callbacks.get(name))
                const anchor = [...hook.states.values()].find(state => referenced.has(state))
                const sharedState = contextSharedStates.get(anchor)
                if (!sharedState) {
                  reducers.set(name, { sourceKind: "Context", directImplementation: callback, states })
                  reducersByFunction.set(owner, reducers)
                  continue
                }
                const action = registerSharedAction(moduleIR, { state: sharedState.slot, name })
                reducers.set(name, { state: contextSubstitutions.get(anchor)?.text ?? anchor, sourceKind: "Context", sharedAction: { ...action, directImplementation: callback, states } })
                reducersByFunction.set(owner, reducers)
              }
            }
            else if (![...hook.states].some(([setter, state]) => name === setter || name === state)) throw sourceNodeError(node.name, sourceFile, `Relative custom hook result ${JSON.stringify(name)} must be a direct useState value, setter, or callback`)
          }
        }
        if (ts.isIdentifier(node.name) && callName && importBindings.has(callName) && importBindings.get(callName).kind !== "namespace") {
          const storeImport = importBindings.get(callName)
          const store = resolvedSharedState(storeImport)
          if (store) {
            const selector = node.initializer.arguments[0]
            if (node.initializer.arguments.length !== 1 || !selector || !ts.isArrowFunction(selector) || selector.parameters.length !== 1 || !ts.isIdentifier(selector.parameters[0].name) || !ts.isPropertyAccessExpression(unwrapExpression(selector.body)) || !ts.isIdentifier(unwrapExpression(selector.body).expression) || unwrapExpression(selector.body).expression.text !== selector.parameters[0].name.text) throw sourceNodeError(node.initializer, sourceFile, `${store.sourceKind} selectors must be direct arrows such as ${store.selectorExample}`)
            const selected = unwrapExpression(selector.body).name.text
            const owner = nearestFunction(node)
            if (!owner) throw sourceNodeError(node, sourceFile, `${store.sourceKind} stores cannot be used outside a Kudzu component`)
            const setters = settersByFunction.get(owner) ?? new Map()
            const sharedState = registerSharedState(moduleIR, { identity: store.identity, field: store.field, initialValue: store.initialData })
            const sharedReference = { kind: "shared-state", sharedState: sharedState.slot }
            if (selected === store.field) {
              const setter = `__kStoreState_${node.name.text}`
              setters.set(setter, node.name.text)
              registerState(owner, node.name.text, setter, "shared-state", node)
              stateOwnersByFunction.get(owner).set(node.name.text, sharedReference)
            }
            else if (store.actions.has(selected)) {
              setters.set(node.name.text, node.name.text)
              registerState(owner, node.name.text, node.name.text, "shared-action", node)
              stateOwnersByFunction.get(owner).set(node.name.text, sharedReference)
              const action = registerSharedAction(moduleIR, { state: sharedState.slot, name: selected })
              const reducers = reducersByFunction.get(owner) ?? new Map()
              reducers.set(node.name.text, { state: node.name.text, sourceKind: store.sourceKind, sharedAction: { ...action, setName: store.setName, field: store.field, implementation: store.actions.get(selected) } })
              reducersByFunction.set(owner, reducers)
            } else throw sourceNodeError(unwrapExpression(selector.body).name, sourceFile, `${store.sourceKind} store ${JSON.stringify(store.name)} has no supported property ${JSON.stringify(selected)}`)
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
          registerState(owner, stateElement.name.text, dispatchElement.name.text, "reducer", node)
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
              registerState(owner, stateElement.name.text, setterElement.name.text, "state", node)
              settersByFunction.set(owner, setters)
              const localSetters = localStateSettersByFunction.get(owner) ?? new Set()
              localSetters.add(setterElement.name.text)
              localStateSettersByFunction.set(owner, localSetters)
            }
          }
        }
      }
      if (ts.isCallExpression(node) && ts.isExpressionStatement(node.parent) && ts.isIdentifier(node.expression) && /^use[A-Z]/.test(node.expression.text) && importBindings.has(node.expression.text) && importBindings.get(node.expression.text).kind !== "namespace") {
        const hook = resolveOutsideClickHook(importBindings.get(node.expression.text))
        if (hook) {
          const owner = nearestFunction(node)
          const ref = node.arguments[0] && unwrapExpression(node.arguments[0])
          const callback = directSetterLiteralCallback(node.arguments[1], owner ? settersByFunction.get(owner) ?? new Map() : new Map())
          if (!owner || node.arguments.length !== 2 || !ts.isIdentifier(ref) || !componentHasDirectObjectRef(owner, ref.text)) throw sourceNodeError(node, sourceFile, "Outside-click hooks require one direct component DOM ref as their first argument")
          if (!callback) throw sourceNodeError(node.arguments[1] ?? node, sourceFile, "Outside-click hooks require one inline direct literal setter callback")
          outsideClickCalls.set(node, callback)
        }
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        functions.set(node.name.text, node)
        if (node.parent === sourceFile) {
          components.set(node.name.text, { function: node, declaration: node })
          ensureOwner(node)
          const debounce = parameterizedDebounceHook(node)
          if (debounce) {
            const setters = settersByFunction.get(node) ?? new Map()
            setters.set(`__kDebounceSource_${Math.max(0, node.pos)}`, debounce.value)
            registerState(node, debounce.value, `__kDebounceSource_${Math.max(0, node.pos)}`, "custom-hook", node.parameters[0])
            settersByFunction.set(node, setters)
          }
        }
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) {
        functions.set(node.name.text, node.initializer)
        if (node.parent?.parent?.parent === sourceFile) {
          components.set(node.name.text, { function: node.initializer, declaration: node })
          ensureOwner(node.initializer)
        }
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression)) {
        const owner = nearestFunction(node)
        if (owner && node.initializer.expression.text === "useRef") {
          const nullInitializer = node.initializer.arguments.length === 1 && node.initializer.arguments[0].kind === ts.SyntaxKind.NullKeyword
          if (!nullInitializer && owner.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)) throw sourceNodeError(node.initializer, sourceFile, "Mutable useRef() values must be referenced exclusively inside one owned effect; DOM refs require useRef(null)")
          if (nullInitializer) {
            ensureOwner(owner)
            componentAnalysis.registerRef(owner, { name: node.name.text, site: analysisSite(node, "hook"), source: analysisSource(node) })
          }
        }
        if (owner && node.initializer.expression.text === "useId" && node.initializer.arguments.length === 0) {
          ensureOwner(owner)
          componentAnalysis.registerId(owner, { name: node.name.text, site: analysisSite(node, "hook"), source: analysisSource(node) })
        }
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === "createContext") contexts.add(node.name.text)
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && isLocalConst(node) && !(ts.isCallExpression(node.initializer) && parameterizedDebounceCalls.has(node.initializer))) {
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
    const collectContextProviderPrivateSetters = node => {
      if (ts.isJsxAttribute(node) && isContextProviderValue(node, contexts)) {
        const value = node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression ? unwrapExpression(node.initializer.expression) : undefined
        const owner = nearestFunction(node)
        if (value && ts.isObjectLiteralExpression(value) && owner) {
          const states = new Map()
          const callbacks = new Map()
          const visitOwner = current => {
            if (ts.isVariableDeclaration(current) && nearestFunction(current) === owner) {
              if (ts.isArrayBindingPattern(current.name) && current.initializer && ts.isCallExpression(current.initializer) && ts.isIdentifier(current.initializer.expression) && current.initializer.expression.text === "useState") {
                const [state, setter] = current.name.elements
                if (current.name.elements.length === 2 && state && setter && ts.isBindingElement(state) && ts.isBindingElement(setter) && ts.isIdentifier(state.name) && ts.isIdentifier(setter.name)) states.set(setter.name.text, state.name.text)
              }
              if (ts.isIdentifier(current.name) && current.initializer && (ts.isArrowFunction(current.initializer) || ts.isFunctionExpression(current.initializer))) callbacks.set(current.name.text, current.initializer)
            }
            ts.forEachChild(current, visitOwner)
          }
          visitOwner(owner.body)
          const fields = new Set(value.properties.filter(ts.isShorthandPropertyAssignment).map(property => property.name.text))
          const missing = [...states].filter(([setter, state]) => fields.has(state) && !fields.has(setter) && [...callbacks].some(([name, callback]) => fields.has(name) && referencedStateNames(callback.body, states, callback).has(state))).map(([setter]) => setter)
          if (missing.length) contextProviderPrivateSetters.set(node, missing)
        }
      }
      ts.forEachChild(node, collectContextProviderPrivateSetters)
    }
    collectContextProviderPrivateSetters(sourceFile)
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
          listLocalDeclarations.push(declaration.node)
          if (uses.length) listLocalUses.push({ node: uses[0], parts })
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
      return { calculation, returns }
    }
    const validateSelectedEffectCalculation = (call, field) => {
      const { calculation, returns } = validateImportedCalculation(call, field)
      const calculationSource = calculation.getSourceFile()
      const reject = (target, message) => { throw sourceNodeError(target, calculationSource, message) }
      if (calculation.asteriskToken || calculation.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) reject(calculation, "Imported calculations used by useEffect() must be synchronous; move async work into the owned effect")
      if (calculation.parameters.some(parameter => !ts.isIdentifier(parameter.name) || parameter.dotDotDotToken || parameter.initializer || parameter.questionToken)) reject(calculation, "Imported calculations used by useEffect() require ordinary identifier parameters without defaults or rest")
      if (call.arguments.some(argument => !ts.isIdentifier(unwrapExpression(argument)))) fail(call, "useEffect() selected calculation arguments must be direct primitive state identifiers; aliases, property paths, and composed arguments are not supported")
      const shapes = returns.map(returned => returned.properties.map(property => {
        if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property) || ts.isComputedPropertyName(property.name) || ["__proto__", "constructor", "prototype"].includes(property.name.text)) reject(property, "Imported calculations used by useEffect() must return direct safe plain-object fields without spreads, methods, or computed names")
        return property.name.text
      }).sort())
      const expected = JSON.stringify(shapes[0])
      if (shapes.some(shape => JSON.stringify(shape) !== expected)) reject(calculation, `Imported calculations used by useEffect() must return the same direct plain-object fields on every path; expected ${expected}`)
      if (validatedEffectCalculations.has(calculation)) return
      const staticImports = importedSerializableCollections(calculationSource, calculationSource.fileName, sourceFiles, sourceIndex)
      const imported = new Map()
      for (const statement of calculationSource.statements) if (ts.isImportDeclaration(statement) && statement.importClause && !statement.importClause.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier)) {
        const names = []
        if (statement.importClause.name) names.push(statement.importClause.name.text)
        const bindings = statement.importClause.namedBindings
        if (bindings && ts.isNamespaceImport(bindings)) names.push(bindings.name.text)
        if (bindings && ts.isNamedImports(bindings)) names.push(...bindings.elements.filter(entry => !entry.isTypeOnly).map(entry => entry.name.text))
        for (const name of names) imported.set(name, statement.moduleSpecifier.text)
      }
      for (const [name, target] of imported) if (!target.startsWith(".") && referencesIdentifier(calculation.body, name)) reject(calculation.body, `Imported calculations used by useEffect() cannot reference package import ${JSON.stringify(name)} from ${JSON.stringify(target)}`)
      const localNames = new Set(calculation.parameters.flatMap(parameter => bindingNames(parameter.name)))
      if (ts.isBlock(calculation.body)) for (const statement of calculation.body.statements) {
        if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) for (const name of bindingNames(declaration.name)) localNames.add(name)
        if (ts.isFunctionDeclaration(statement) && statement.name) localNames.add(statement.name.text)
      }
      const localDeclarations = new Map()
      if (ts.isBlock(calculation.body)) for (const statement of calculation.body.statements) if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer) localDeclarations.set(declaration.name.text, declaration.initializer)
      const visiting = []
      const visited = new Set()
      const visitLocal = name => {
        if (visited.has(name)) return
        const cycle = visiting.indexOf(name)
        if (cycle >= 0) reject(localDeclarations.get(name), `Imported calculation derived-local cycle: ${[...visiting.slice(cycle), name].join(" -> ")}`)
        visiting.push(name)
        const initializer = localDeclarations.get(name)
        if (initializer) for (const candidate of localDeclarations.keys()) if (referencesIdentifier(initializer, candidate)) visitLocal(candidate)
        visiting.pop()
        visited.add(name)
      }
      for (const name of localDeclarations.keys()) visitLocal(name)
      const visit = node => {
        if (ts.isTypeNode(node)) return
        if (ts.isBinaryExpression(node) && assignmentOperators.has(node.operatorToken.kind) || ts.isPostfixUnaryExpression(node) || ts.isPrefixUnaryExpression(node) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator) || ts.isDeleteExpression(node)) reject(node, "Imported calculations used by useEffect() must be pure; assignments, updates, delete, and mutation are not supported")
        if (ts.isAwaitExpression(node) || ts.isYieldExpression(node) || ts.isNewExpression(node)) reject(node, "Imported calculations used by useEffect() must be deterministic and synchronous; await, yield, and construction are not supported")
        if (ts.isCallExpression(node)) {
          if (ts.isIdentifier(node.expression) && ["Boolean", "Number", "String"].includes(node.expression.text)) {
            // Primitive conversions are deterministic.
          } else if (ts.isPropertyAccessExpression(node.expression)) {
            const method = node.expression.name.text
            const receiver = unwrapExpression(node.expression.expression)
            if (mutatingListMethods.has(method)) reject(node, `Imported calculations used by useEffect() must be pure; mutating method ${JSON.stringify(method)} is not supported`)
            const math = ts.isIdentifier(receiver) && receiver.text === "Math"
            const find = method === "find" && node.arguments.length === 1 && ts.isArrowFunction(node.arguments[0]) && !ts.isBlock(node.arguments[0].body) && !node.arguments[0].modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
            if (!find && !(math && pureMathMethods.has(method)) && !pureListMethods.has(method)) reject(node, `Imported calculations used by useEffect() must be deterministic; call ${JSON.stringify(node.expression.getText(calculationSource))} is not supported`)
          } else reject(node, "Imported calculations used by useEffect() cannot call arbitrary functions")
        }
        if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
          const target = imported.get(node.text)
          if (target && !target.startsWith(".")) reject(node, `Imported calculations used by useEffect() cannot reference package import ${JSON.stringify(node.text)} from ${JSON.stringify(target)}`)
          if (target?.startsWith(".") && !staticImports.has(node.text)) reject(node, `Imported calculations used by useEffect() may capture only relative exported JSON-safe const arrays; capture ${JSON.stringify(node.text)} is opaque or nonserializable`)
        }
        ts.forEachChild(node, visit)
      }
      visit(calculation.body)
      validatedEffectCalculations.add(calculation)
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
              for (const argument of call.arguments) collectionExpression(argument, { fail: (target, message) => fail(target, message.replace("Rendered collection", "Reactive imported calculation")), stateNames: allowedNames })
              return factory.createNumericLiteral(0)
            }
          }
          return ts.visitEachChild(current, validate, context)
        }
        const normalized = ts.visitNode(value, validate)
        collectionExpression(normalized, { fail: (node, message) => fail(node, message.replace("Rendered collection", "Reactive JSX local")), stateNames: allowedNames })
        return
      }
      const intl = constructor.expression.expression
      if (!isUnshadowedGlobal(intl, sourceFile)) fail(intl, "Reactive JSX Intl.NumberFormat requires the unshadowed global Intl object")
      if (constructor.arguments?.length !== 1 || !ts.isStringLiteral(constructor.arguments[0])) fail(constructor, "Reactive JSX Intl.NumberFormat requires exactly one static string locale")
      const rounded = value.arguments.length === 1 ? unwrapExpression(value.arguments[0]) : undefined
      const roundAccess = rounded && ts.isCallExpression(rounded) && !rounded.questionDotToken && rounded.arguments.length === 1 && ts.isPropertyAccessExpression(rounded.expression) && !rounded.expression.questionDotToken && rounded.expression.name.text === "round" && ts.isIdentifier(rounded.expression.expression) && rounded.expression.expression.text === "Math" ? rounded.expression : undefined
      if (!roundAccess) fail(value, "Reactive JSX Intl.NumberFormat format() requires exactly Math.round(expression)")
      if (!isUnshadowedGlobal(roundAccess.expression, sourceFile)) fail(roundAccess.expression, "Reactive JSX Intl.NumberFormat requires the unshadowed global Math object")
      collectionExpression(rounded.arguments[0], { fail: (node, message) => fail(node, message.replace("Rendered collection", "Reactive JSX local")), stateNames: allowedNames })
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
      const usedStates = referencedStateNames(expanded, setters, expanded, bindingIndex)
      if (!usedStates.size) return expression
      const captures = captureNames(expanded, expanded, setters, bindingIndex)
      const allowedNames = new Set([...setters.values(), ...captures])
      validateReactiveJsxExpression(expanded, allowedNames)
      return expanded
    }
    const componentSpecializations = new WeakMap()
    const specializedEffectStateOwners = new WeakMap()
    const calculationDerivedByOwner = new WeakMap()
    const setterHookHelpers = new WeakMap()
    const expandedRowSpecializations = new WeakMap()
    const nestedRowSpecializations = new Map()
    const reducerComponentCalls = new WeakSet()
    const rowHookCalls = []
    const specializedDeclarations = new WeakSet()
    const stateBackedComponentFunctions = new WeakSet()
    const stateBackedComponentRoots = []
    let specializedImportIndex = 0
    const specialize = (call, component, label = "Keyed list", allowComponentRoot = false, ordinaryHooks = false, ordinaryStateNames = new Set(), ownership) => {
      const result = specializeComponentCall(call, component, sourceFile, factory, context, fail, label, allowComponentRoot, ordinaryHooks, ordinaryStateNames)
      const owner = nearestFunction(call)
      const setters = ownership?.setters ?? settersForNode(call, settersByFunction)
      const stateOwners = ownership?.stateOwners ?? stateOwnersForNode(call)
      const callbacks = functionsForNode(call)
      const propSignals = expression => {
        const signals = new Set()
        if (ts.isIdentifier(expression) && setters.has(expression.text)) signals.add(setters.get(expression.text))
        const callback = ts.isIdentifier(expression) ? callbacks.get(expression.text) : undefined
        for (const state of referencedStateNames((callback ?? expression).body ?? callback ?? expression, setters, callback ?? expression, bindingIndex)) signals.add(state)
        return [...signals].map(name => descriptors.signal(name, expression, stateOwners))
      }
      result.analysis = componentAnalysis.registerSpecialization({
        kind: label,
        ...(owner ? { owner: { kind: "component", slot: ensureOwner(owner).slot } } : {}),
        ...(analysisSite(call, "component-call") ? { site: analysisSite(call, "component-call") } : {}),
        ...(analysisSource(call) ? { source: analysisSource(call) } : {}),
        props: result.props.map(prop => {
          const expression = result.propExpressions.get(prop.name)
          const signals = expression ? propSignals(expression) : []
          return { ...prop, ...(signals.length ? { signals } : {}) }
        }),
        states: [
          ...result.rowStates.map(({ state, setter, source }) => ({ name: state, setter, kind: "row", ...(analysisSite(source, "hook") ? { site: analysisSite(source, "hook") } : {}), ...(analysisSource(source) ? { source: analysisSource(source) } : {}) })),
          ...result.ordinaryStates.map(({ state, setter, source }) => ({ name: state, setter, kind: "component", ...(analysisSite(source, "hook") ? { site: analysisSite(source, "hook") } : {}), ...(analysisSource(source) ? { source: analysisSource(source) } : {}) }))
        ],
        refs: [...result.rowRefs.map(({ name, source }) => ({ name, kind: "row", ...(analysisSite(source, "hook") ? { site: analysisSite(source, "hook") } : {}), ...(analysisSource(source) ? { source: analysisSource(source) } : {}) })), ...result.ordinaryRefs.map(({ name, source }) => ({ name, kind: "component", ...(analysisSite(source, "hook") ? { site: analysisSite(source, "hook") } : {}), ...(analysisSource(source) ? { source: analysisSource(source) } : {}) }))],
        ids: result.ordinaryIds.map(({ name, source }) => ({ name, ...(analysisSite(source, "hook") ? { site: analysisSite(source, "hook") } : {}), ...(analysisSource(source) ? { source: analysisSource(source) } : {}) }))
      })
      result.propStateOwners = new Map(result.props.flatMap(prop => {
        const expression = result.propExpressions.get(prop.name)
        const value = expression && unwrapExpression(expression)
        const reference = value && ts.isIdentifier(value) ? stateOwners.get(value.text) : undefined
        return reference ? [[prop.local, reference]] : []
      }))
      for (const effect of result.effects) {
        effect.stateOwners = result.propStateOwners
        effect.analysisOwner = { kind: "specialization", slot: result.analysis.slot }
      }
      for (const [slot, state] of [...result.rowStates, ...result.ordinaryStates].entries()) state.analysisReference = { kind: "state", owner: { kind: "specialization", slot: result.analysis.slot }, slot }
      for (const [slot, ref] of [...result.rowRefs, ...result.ordinaryRefs].entries()) ref.analysisReference = { specialization: result.analysis.slot, ref: slot }
      return result
    }
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
      const stateOwners = new Map(stateOwnersByFunction.get(owner))
      for (const state of specialization.rowStates) {
        setters.set(state.setter, state.state)
        stateOwners.set(state.state, state.analysisReference)
      }
      settersByFunction.set(owner, setters)
      stateOwnersByFunction.set(owner, stateOwners)
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
    const expandReducerCallbacks = (root, componentSource, call, ownership) => {
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
          const nested = specialize(nestedCall, nestedComponent, "Reducer-callback", false, false, new Set(), ownership)
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
    const validateSetterCallbackProps = (call, component, callbackProps) => {
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
        if (!references.length) fail(element, `Setter-callback prop ${JSON.stringify(prop)} must be called by at least one intrinsic event handler`)
        const effect = directSetterPropEffect(component, prop)
        if (effect) {
          if (references.length !== effect.references.size || references.some(reference => !effect.references.has(reference))) fail(references.find(reference => !effect.references.has(reference)) ?? element, `Setter-callback prop ${JSON.stringify(prop)} effect must directly set its prop-derived state with exact [state, setter] dependencies`)
          continue
        }
        const handlers = new Set()
        for (const reference of references) {
          if (ts.isJsxExpression(reference.parent) && ts.isJsxAttribute(reference.parent.parent) && /^on[A-Z]/.test(reference.parent.parent.name.text)) {
            const attribute = reference.parent.parent
            const tag = attribute.parent?.parent && (ts.isJsxOpeningElement(attribute.parent.parent) || ts.isJsxSelfClosingElement(attribute.parent.parent)) ? attribute.parent.parent.tagName : undefined
            if (ts.isIdentifier(tag) && tag.text[0] !== tag.text[0].toLowerCase()) continue
            if (ts.isIdentifier(tag) && !handlers.has(attribute)) {
              handlers.add(attribute)
              continue
            }
          }
          if (!ts.isCallExpression(reference.parent) || reference.parent.expression !== reference) fail(reference, `Setter-callback prop ${JSON.stringify(prop)} must be called directly inside an intrinsic event handler`)
          let attribute
          for (let current = reference.parent; current && current !== component.body; current = current.parent) {
            if (ts.isJsxAttribute(current) && /^on[A-Z]/.test(current.name.text)) {
              attribute = current
              break
            }
          }
          const tag = attribute?.parent?.parent && (ts.isJsxOpeningElement(attribute.parent.parent) || ts.isJsxSelfClosingElement(attribute.parent.parent)) ? attribute.parent.parent.tagName : undefined
          if (!attribute || !ts.isIdentifier(tag) || tag.text[0] !== tag.text[0].toLowerCase()) fail(reference, `Setter-callback prop ${JSON.stringify(prop)} must be called directly inside an intrinsic event handler`)
          if (handlers.has(attribute)) fail(reference, `Setter-callback prop ${JSON.stringify(prop)} may only be called once per event handler`)
          handlers.add(attribute)
        }
      }
    }
    const expandSetterComponents = (root, componentSource, trail, aggregate, parentSetters, parentStateOwners, callbackDepth = 2) => {
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
          const stateOwners = new Map(parentStateOwners)
          for (const state of aggregate.ordinaryStates) stateOwners.set(state.state, state.analysisReference)
          const callbackProps = supportedSetterCallbackProps(component, jsxSetterCallbackProps(node, setters, functionsForNode(node), reducersForNode(node, reducersByFunction)))
          const callbackSubstitutions = new Map()
          if (callbackProps.length) {
            if (!callbackDepth) fail(node, "Setter callbacks cannot cross more than three component boundaries")
            const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes
            for (const prop of callbackProps) {
              const attribute = attributes.properties.find(entry => ts.isJsxAttribute(entry) && entry.name.text === prop)
              const value = attribute?.initializer && ts.isJsxExpression(attribute.initializer) ? unwrapExpression(attribute.initializer.expression) : undefined
              if (!value || !ts.isIdentifier(value)) fail(attribute ?? node, "A nested setter callback must be forwarded directly as one JSX event prop")
              const callback = functionsForNode(value).get(value.text)
              if (callback) callbackSubstitutions.set(value.text, callback)
            }
            validateSetterCallbackProps(node, component, callbackProps)
          }
          const nested = specialize(node, component, "Nested setter-callback", true, true, new Set(setters.values()), { setters, stateOwners })
          if (dynamic && (nested.hookDeclarations.length || nested.effects.length)) fail(node, "Hookful nested setter-callback components require an unconditional or statically truthy render path")
          nested.root = expandSetterComponents(nested.root, component.getSourceFile(), [...trail, component], nested, setters, stateOwners, callbackDepth - Boolean(callbackProps.length))
          if (callbackSubstitutions.size) {
            nested.root = substituteClone(nested.root, callbackSubstitutions, factory, context)
            for (const effect of nested.effects) effect.call = substituteClone(effect.call, callbackSubstitutions, factory, context)
          }
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
        const specialization = specialize(call, component.function)
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
        const specialization = specialize(call, component)
        if (specialization.effects.length) fail(call, "State-backed list components cannot declare effects")
        componentSpecializations.set(call, specialization)
        stateBackedComponentRoots.push(specialization.root)
      }
    }
    const specializeSetterCallbacks = (call, component, callbackProps, imported) => {
      if (componentSpecializations.has(call)) fail(call, "Setter callback props cannot be combined with another component specialization")
      validateSetterCallbackProps(call, component, callbackProps)
      const attributes = ts.isJsxElement(call) ? call.openingElement.attributes : call.attributes
      const setters = settersForNode(call, settersByFunction)
      for (const prop of callbackProps) {
        const effect = directSetterPropEffect(component, prop)
        if (!effect) continue
        const stateAttribute = attributes.properties.find(entry => ts.isJsxAttribute(entry) && entry.name.text === effect.stateProp)
        const setterAttribute = attributes.properties.find(entry => ts.isJsxAttribute(entry) && entry.name.text === prop)
        const stateValue = stateAttribute?.initializer && ts.isJsxExpression(stateAttribute.initializer) ? unwrapExpression(stateAttribute.initializer.expression) : undefined
        const setterValue = setterAttribute?.initializer && ts.isJsxExpression(setterAttribute.initializer) ? unwrapExpression(setterAttribute.initializer.expression) : undefined
        if (!ts.isIdentifier(stateValue) || !ts.isIdentifier(setterValue) || setters.get(setterValue.text) !== stateValue.text || !componentHasDirectArrayState(nearestFunction(call), stateValue.text)) fail(setterAttribute ?? call, `Setter-callback effect prop ${JSON.stringify(prop)} must target the same direct array state passed through ${JSON.stringify(effect.stateProp)}`)
      }
      const specialization = specialize(call, component, "Setter-callback", true, true, new Set(settersForNode(call, settersByFunction).values()))
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
      specialization.root = expandSetterComponents(specialization.root, component.getSourceFile(), [component], specialization, settersForNode(call, settersByFunction), stateOwnersForNode(call))
      if (imported) synthesizeTree(specialization.root = mergeSpecializedImports(specialization.root, component.getSourceFile(), call, specialization.effects))
      if (specialization.hookDeclarations.length || specialization.effects.length) {
        const owner = nearestFunction(call)
        const name = `KSetterComponent${Math.max(0, call.pos)}`
        const effectStatements = specialization.effects.map(entry => {
          const effectCall = factory.updateCallExpression(entry.call, factory.createIdentifier("__kComponentUseEffect"), entry.call.typeArguments, entry.call.arguments)
          synthesizeTree(effectCall)
          ts.setOriginalNode(effectCall, entry.source)
          specializedEffectStateOwners.set(effectCall, { owner: { kind: "specialization", slot: specialization.analysis.slot }, references: specialization.propStateOwners })
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
        const stateOwners = new Map([...stateOwnersForNode(call), ...specialization.propStateOwners])
        for (const state of specialization.ordinaryStates) stateOwners.set(state.state, state.analysisReference)
        stateOwnersByFunction.set(helper, stateOwners)
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
        const callbackProps = supportedSetterCallbackProps(component.function, jsxSetterCallbackProps(call, settersByFunction.get(nearestFunction(call)) ?? new Map(), functionsForNode(call), reducersForNode(call, reducersByFunction)))
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
      for (const { call, callbackProps } of callbackCalls) {
        const supportedProps = supportedSetterCallbackProps(component, callbackProps)
        if (supportedProps.length) specializeSetterCallbacks(call, component, supportedProps, true)
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
        const specialization = specialize(call, component.function, "Reducer-dispatch")
        registerRowHooks(call, specialization)
        specialization.root = expandReducerCallbacks(specialization.root, component.function.getSourceFile(), call, {
          setters: new Map([...settersForNode(call, settersByFunction), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.setter, state.state])]),
          stateOwners: new Map([...stateOwnersForNode(call), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.state, state.analysisReference])])
        })
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
        const specialization = specialize(call, component, "Reducer-dispatch")
        registerRowHooks(call, specialization)
        specialization.root = expandReducerCallbacks(specialization.root, componentSource, call, {
          setters: new Map([...settersForNode(call, settersByFunction), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.setter, state.state])]),
          stateOwners: new Map([...stateOwnersForNode(call), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.state, state.analysisReference])])
        })
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
        const parts = listLocalUses.find(entry => entry.node === node)?.parts ?? keyedListParts(node.expression, setters, jsxLocalDeclarations.get(owner), fail, new Set(), importedCollections, factory, context, importedCollectionTransforms, calculatedCollection, staticCollection)
        if (parts) {
          for (const declaration of parts.aliasDeclarations ?? []) if (!listLocalDeclarations.includes(declaration)) listLocalDeclarations.push(declaration)
          rawRenderedLists.push({ node, parts })
        }
      }
      ts.forEachChild(node, collectRenderedLists)
    }
    collectRenderedLists(sourceFile)
    const collectionAliasUses = rawRenderedLists.flatMap(({ parts }) => parts.aliasUses ?? [])
    const collectionAliasDeclarations = new Set(rawRenderedLists.flatMap(({ parts }) => parts.aliasDeclarations ?? []))
    for (const declaration of collectionAliasDeclarations) {
      const owner = nearestFunction(declaration)
      const unsupported = identifierReferences(owner.body, declaration.name.text).find(reference => !collectionAliasUses.includes(reference))
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
          : specialize(call, component.function, "Keyed list", true)
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
          const nestedAggregate = { calculations: [], effects: [], hookDeclarations: [], rowStates: [], rowRefs: [], specializations: [] }
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
          const specialization = specialize(node, component, "Keyed list", true)
          registerRowHooks(node, specialization)
          specialization.root = expandKeyedComponents(specialization.root, component.getSourceFile(), [...trail, component], specialization)
          if (imported) synthesizeTree(specialization.root = mergeSpecializedImports(specialization.root, component.getSourceFile(), node, specialization.effects))
          expandedRowSpecializations.set(specialization.root, specialization)
          if (currentAggregate) {
            currentAggregate.specializations ??= []
            currentAggregate.specializations.push(specialization.analysis.slot, ...(specialization.specializations ?? []))
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
    const preparedRenderedLists = []
    const prepareListCallback = (callback, root, specialization) => {
      const statements = [...specialization.hookDeclarations]
      if (specialization.effects.length) {
        usesListEffects = true
        statements.push(...specialization.effects.map(entry => {
          const call = factory.updateCallExpression(entry.call, factory.createIdentifier("__kListUseEffect"), entry.call.typeArguments, entry.call.arguments)
          synthesizeTree(call)
          ts.setOriginalNode(call, entry.source)
          specializedEffectStateOwners.set(call, { owner: entry.analysisOwner, references: entry.stateOwners ?? specialization.propStateOwners })
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
      const specialization = componentSpecializations.get(originalParts.root) ?? { root: originalParts.root, calculations: [], effects: [], hookDeclarations: [], rowStates: [], rowRefs: [], ordinaryStates: [] }
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
      callback = prepareListCallback(callback, root, specialization)
      const parts = {
        ...originalParts,
        root,
        callback,
        specializations: [specialization.analysis?.slot, ...(specialization.specializations ?? [])].filter(slot => slot !== undefined),
        rowStates: [...specialization.rowStates, ...specialization.ordinaryStates],
        rowRefs: specialization.rowRefs,
        analysisStateOwners: new Map([...stateOwnersForNode(originalParts.root), ...(specialization.propStateOwners ?? []), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.state, state.analysisReference])])
      }
      for (const calculation of specialization.calculations) {
        ts.setParentRecursive(calculation, false)
        calculation.parent = callback
        validateListExpression(calculation, parts.item, originalParts.root, fail)
      }
      const analysis = validateKeyedList(parts, sourceFile, settersForNode(originalParts.root, settersByFunction), specialization.rowStates, componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback, bindingIndex)
      preparedRenderedLists.push({ node, parts, analysis })
    }

    const compileRenderExpression = (expression, anchor) => {
      const parts = conditionalParts(expression)
      if (!parts) return ts.visitNode(expression, visitor)
      const setters = settersForNode(anchor, settersByFunction)
      const usedStates = referencedStateNames(parts.condition, setters, parts.condition, bindingIndex)
      const captures = captureNames(parts.condition, parts.condition, setters, bindingIndex)
      if (!usedStates.size && !captures.size) return ts.visitEachChild(expression, visitor, context)
      usesBehavior = true
      usesConditional = true
      return descriptors.compileConditional(
        parts.kind,
        parts.condition,
        compileRenderExpression(parts.truthy, anchor),
        compileRenderExpression(parts.falsy, anchor),
        setters
      )
    }

    const visitWithStateOwners = (node, stateOwners) => {
      const previous = activeStateOwners
      activeStateOwners = new Map([...(previous ?? []), ...stateOwners])
      const result = ts.visitNode(node, visitor)
      activeStateOwners = previous
      return result
    }
    const keyedEntry = (entries, node) => entries.find(entry => entry.node === node)
    const compileKeyedBlock = (node, { parts: listParts, analysis }) => {
      usesBehavior = true
      usesList = true
      const blockSlot = moduleIR.keyedBlocks.length
      let listSource = listParts.state
      const collectionName = listParts.state?.text
      const collectionReference = collectionName && new Map([...stateOwnersForNode(node), ...(activeStateOwners ?? [])]).get(collectionName)
      const collectionSymbol = listParts.state && bindingIndex.resolveReference(listParts.state, node)?.slot
      let collection = collectionReference
        ? { kind: "signal", signal: descriptors.signal(collectionName, node, new Map([[collectionName, collectionReference]])) }
        : collectionSymbol !== undefined ? { kind: "symbol", symbol: collectionSymbol } : { kind: "static" }
      if (listParts.calculation) {
        usesBinding = true
        const compiled = descriptors.compileReactiveBinding(listParts.calculation, { setters: settersForNode(node, settersByFunction), importBindings, keyedBlock: blockSlot, derived: calculationBinding(node, nearestFunction(node)) })
        listSource = compiled.node
        collection = { kind: "binding", binding: compiled.binding }
      }
      const derived = listParts.selector?.length ? descriptors.registerDerived("selector", listParts.selector, listParts.selectorStates, node) : undefined
      const parent = activeKeyedBlock?.block
      const rowStates = (listParts.rowStates ?? []).map(state => ({ name: state.state, setter: state.setter, signal: descriptors.signal(state.state, node, new Map([[state.state, state.analysisReference]])), ...(analysisSource(state.source) ? { source: analysisSource(state.source) } : {}) }))
      const rowRefs = (listParts.rowRefs ?? []).map(ref => ({ name: ref.name, ...ref.analysisReference, ...(analysisSource(ref.source) ? { source: analysisSource(ref.source) } : {}) }))
      const specializations = [...new Set([...(listParts.specializations ?? []), ...rowStates.map(state => moduleIR.signals[state.signal].reference.owner?.slot), ...rowRefs.map(ref => ref.specialization)].filter(value => value !== undefined))]
      const block = descriptors.registerKeyedBlock({
        ...(analysisSite(node, "keyed-list") ? { site: analysisSite(node, "keyed-list") } : {}),
        ...(analysisSource(node) ? { source: analysisSource(node) } : {}),
        ...(parent ? { parent: parent.slot } : {}),
        children: [],
        collection,
        key: listParts.keyField,
        ...(listParts.ownerField ? { ownerField: listParts.ownerField } : {}),
        item: listParts.item,
        ...(listParts.index ? { index: listParts.index } : {}),
        indexed: listParts.indexed,
        static: Boolean(listParts.static),
        ...(derived ? { selector: derived.slot } : {}),
        selectorSignals: [...(listParts.selectorStates ?? [])].map(name => descriptors.signal(name, node)),
        specializations,
        rowStates,
        rowRefs
      })
      if (parent) parent.children.push(block.slot)
      const previous = activeKeyedBlock
      activeKeyedBlock = { analysis, block, parts: listParts }
      const callback = visitWithStateOwners(listParts.callback, listParts.analysisStateOwners ?? new Map())
      activeKeyedBlock = previous
      const arguments_ = [
        listSource,
        block.key === null ? factory.createNull() : factory.createStringLiteral(block.key),
        callback,
        factory.createStringLiteral(block.ownerField ?? ""),
        jsonExpression(derived?.selector ?? listParts.selector ?? [], factory),
        block.indexed ? factory.createTrue() : factory.createFalse()
      ]
      if (block.selectorSignals.length || block.static) arguments_.push(factory.createArrayLiteralExpression([...(listParts.selectorStates ?? [])].map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))))
      if (block.static) arguments_.push(factory.createTrue())
      return factory.updateJsxExpression(node, factory.createCallExpression(factory.createIdentifier("__kList"), undefined, arguments_))
    }
    const visitor = node => {
      const outsideClick = ts.isCallExpression(node) && outsideClickCalls.get(node)
      if (outsideClick) return factory.updateCallExpression(node, node.expression, node.typeArguments, [node.arguments[0], factory.createIdentifier(outsideClick.setter), cloneAst(outsideClick.value, factory, context)])
      if (ts.isJsxAttribute(node) && contextProviderPrivateSetters.has(node)) {
        const expression = unwrapExpression(node.initializer.expression)
        const value = factory.updateObjectLiteralExpression(expression, [...expression.properties, ...contextProviderPrivateSetters.get(node).map(name => factory.createShorthandPropertyAssignment(name))])
        return factory.updateJsxAttribute(node, node.name, factory.updateJsxExpression(node.initializer, value))
      }
      if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && customHookPrivateFields.has(node)) {
        const privateFields = customHookPrivateFields.get(node)
        return factory.updateVariableDeclaration(node, factory.updateObjectBindingPattern(node.name, [
          ...node.name.elements,
          ...privateFields.map(entry => typeof entry === "string"
            ? factory.createBindingElement(undefined, undefined, entry)
            : factory.createBindingElement(undefined, entry.property === entry.local ? undefined : entry.property, entry.local))
        ]), node.exclamationToken, node.type, node.initializer)
      }
      if (ts.isBlock(node) && setterHookHelpers.has(node)) {
        return ts.visitEachChild(factory.updateBlock(node, [...setterHookHelpers.get(node), ...node.statements]), visitor, context)
      }
      if (specializedDeclarations.has(node)) return node
      if (componentSpecializations.has(node)) {
        const specialization = componentSpecializations.get(node)
        const stateOwners = new Map([...stateOwnersForNode(node), ...(specialization.propStateOwners ?? []), ...[...specialization.rowStates, ...specialization.ordinaryStates].map(state => [state.state, state.analysisReference])])
        return visitWithStateOwners(specialization.root, stateOwners)
      }

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

      const effectAlias = ts.isCallExpression(node) && ts.isIdentifier(node.expression) ? node.expression.text : undefined
      const listEffect = effectAlias === "__kListUseEffect"
      const specializedEffect = listEffect || effectAlias === "__kComponentUseEffect" ? (() => {
        const source = ts.getOriginalNode(node)
        const sourceFile = source.getSourceFile()
        return { source, sourceFile, imports: clientImportBindings(sourceFile, sourceFile.fileName, sourceFiles) }
      })() : undefined
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (hasUseEffectImport && effectAlias === "useEffect" || specializedEffect)) {
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
        const setters = settersForNode(node, settersByFunction)
        const resolveCalculation = dependency => {
          if (specializedEffect) return undefined
          const value = unwrapExpression(dependency)
          const result = ts.isIdentifier(value) ? value : ts.isPropertyAccessExpression(value) || ts.isElementAccessExpression(value) ? unwrapExpression(value.expression) : undefined
          if (!result || !ts.isIdentifier(result)) return undefined
          const entries = jsxLocalDeclarations.get(effectOwner)?.get(result.text)
          const initializer = entries?.length === 1 && entries[0].node.parent?.parent?.parent === effectOwner?.body ? unwrapExpression(entries[0].initializer) : undefined
          if (!initializer || !ts.isCallExpression(initializer) || !ts.isIdentifier(initializer.expression) || !importBindings.has(initializer.expression.text)) return undefined
          if (ts.isIdentifier(value)) effectFail(value, `useEffect() cannot depend on the whole imported calculation result ${JSON.stringify(value.text)}; select one JSON-safe primitive field such as ${value.text}.id`)
          if (ts.isElementAccessExpression(value)) effectFail(value, `useEffect() imported calculation dependencies require one direct static result field such as ${result.text}.id; computed result properties are not supported`)
          if (!ts.isPropertyAccessExpression(value) || ["__proto__", "constructor", "prototype"].includes(value.name.text)) effectFail(value, "useEffect() imported calculation dependency field must not be __proto__, prototype, or constructor")
          validateSelectedEffectCalculation(initializer, value.name.text)
          const expanded = unwrapExpression(resolveReactiveJsxExpression(dependency, effectOwner, setters))
          if (!ts.isPropertyAccessExpression(expanded) || expanded.name.text !== value.name.text) return undefined
          const call = unwrapExpression(expanded.expression)
          if (!ts.isCallExpression(call) || !ts.isIdentifier(call.expression) || !importBindings.has(call.expression.text)) return undefined
          const states = referencedStateNames(call, setters, call, bindingIndex)
          if (states.size < 2 || call.arguments.some(argument => !ts.isIdentifier(unwrapExpression(argument)) || !states.has(unwrapExpression(argument).text))) effectFail(call, "useEffect() selected calculations require at least two direct primitive state arguments")
          return { name: value.expression.text, field: value.name.text, call, states, source: dependency }
        }
        const dependencyAnalysis = analyzeEffectDependencies({
          dependencies,
          node,
          listEffect,
          keyedItem: activeKeyedBlock?.parts.item,
          setters,
          localDeclarations: jsxLocalDeclarations.get(nearestFunction(node)),
          factory,
          fail: effectFail,
          bindingIndex,
          resolveCalculation
        })
        const { dependencyItem, itemDependencies, ordinaryDependencies, entries: dependencyEntries, dependencyStates, substitutions: dependencySubstitutions, subscriptions: subscriptionDependencies, hasDerived: hasDerivedDependency } = dependencyAnalysis
        const calculationEntries = dependencyEntries.filter(entry => entry.kind === "calculation")
        if (calculationEntries.length && (calculationEntries.length !== 1 || dependencyEntries.length !== 1)) effectFail(dependencies, "useEffect() selected calculation fields must be the only dependency")
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
        validateEffectOwnedBrowserResources(callback, returns, effectFail, bindingIndex)
        const calculationEvaluators = dependencyEntries.map(entry => entry.kind === "calculation" ? descriptors.compileDerivedEvaluator(entry.call, { setters, importBindings }) : undefined)
        const callbackSource = specializedEffect?.sourceFile ?? sourceFile
        const callbackFile = callbackSource.fileName
        let compiledCallback = dependencySubstitutions.size ? substituteClone(callback, dependencySubstitutions, factory, context) : callback
        if (compiledCallback !== callback) {
          ts.setParentRecursive(compiledCallback, false)
          compiledCallback.parent = callback.parent
        }
        let workers = []
        if (listEffect && callbackFile !== file) {
          const originalCallback = specializedEffect.source.arguments[0]
          workerCompiler.rejectConstructions(originalCallback, callbackSource, "Relative TypeScript Worker construction in imported keyed-row effects is not supported; construct the Worker in a directly compiled page or local component effect")
        } else {
          const rewritten = workerCompiler.rewriteEffect(compiledCallback, callbackFile, callbackSource, sourceFiles, factory, context)
          compiledCallback = rewritten.callback
          workers = rewritten.workers
        }
        const descriptor = descriptors.compileEffectCallback(compiledCallback, {
          setters,
          reducers: reducersForNode(node, reducersByFunction),
          importBindings: specializedEffect?.imports ?? new Map([...importBindings, ...packageBindings]),
          listItem: dependencyItem,
          keyedBlock: activeKeyedBlock?.block.slot,
          stateOwners: new Map([...stateOwnersForNode(callbackArgument), ...stateOwnersForNode(node), ...(specializedEffectStateOwners.get(node)?.references ?? []), ...(activeStateOwners ?? [])]),
          deferValues: true,
          snapshotNested: returns.cleanup,
          liveStates: customHookTimerStates
        })
        usesListItem ||= Boolean(itemDependencies.length && !listEffect)
        usesBehavior = true
        const derivedDependencies = hasDerivedDependency ? dependencyEntries.map((entry, index) => entry.kind === "derived"
          ? descriptors.registerDerived("expression", entry.expression, entry.states, entry.source)
          : entry.kind === "calculation" ? descriptors.registerDerived("calculation", { binding: calculationEvaluators[index].binding, fields: [entry.field] }, entry.states, entry.source) : undefined) : []
        if (calculationEntries.length) {
          const calculations = calculationDerivedByOwner.get(effectOwner) ?? new Map()
          dependencyEntries.forEach((entry, index) => {
            if (entry.kind === "calculation") calculations.set(entry.name, derivedDependencies[index])
          })
          calculationDerivedByOwner.set(effectOwner, calculations)
        }
        const effectSource = specializedEffect?.source ?? node
        const lexicalOwner = nearestFunction(effectSource)
        const effectStateOwners = new Map([...stateOwnersForNode(callbackArgument), ...stateOwnersForNode(node), ...(specializedEffectStateOwners.get(node)?.references ?? []), ...(activeStateOwners ?? [])])
        const signalFor = name => descriptors.signal(name, node, effectStateOwners)
        const subscriptionNames = (hasDerivedDependency ? subscriptionDependencies : ordinaryDependencies).map(dependency => dependency.text)
        const dependencyStateNames = [...dependencyStates.keys()]
        const effect = descriptors.registerEffect(descriptor, {
          cleanup: returns.cleanup,
          dependencies: hasDerivedDependency ? dependencyEntries.map((entry, index) => entry.kind === "derived"
            ? { kind: "derived", derived: derivedDependencies[index].slot, sources: [...entry.states].map(signalFor) }
            : entry.kind === "calculation" ? { kind: "derived", derived: derivedDependencies[index].slot, sources: [...entry.states].map(signalFor), field: entry.field, evaluator: calculationEvaluators[index].binding } : { kind: "signal", signal: signalFor(entry.name) }) : ordinaryDependencies.map(dependency => ({ kind: "signal", signal: signalFor(dependency.text) })),
          subscriptions: subscriptionNames.map(signalFor),
          dependencySignals: dependencyStateNames.map(signalFor),
          itemDependencies,
          ownership: {
            kind: activeKeyedBlock ? "keyed" : "component",
            owner: specializedEffectStateOwners.get(node)?.owner ?? fallbackOwner(effectSource),
            ...(activeKeyedBlock ? { keyedBlock: activeKeyedBlock.block.slot } : {}),
            ...(lexicalOwner ? { component: { name: ownerName(lexicalOwner), ...(analysisSite(lexicalOwner, "owner") ? { site: analysisSite(lexicalOwner, "owner") } : {}), ...(analysisSource(lexicalOwner) ? { source: analysisSource(lexicalOwner) } : {}) } } : {})
          },
          workers,
          ...(analysisSite(effectSource, "hook") ? { site: analysisSite(effectSource, "hook") } : {}),
          ...(analysisSource(effectSource) ? { source: analysisSource(effectSource) } : {})
        })
        const hasExpressionDependency = dependencyEntries.some(entry => entry.kind === "derived")
        const dependencyExpressions = hasExpressionDependency ? effect.dependencies.map((dependency, index) => dependency.kind === "derived" ? moduleIR.derived[dependency.derived].expression : ["state", dependencyEntries[index]?.name ?? ordinaryDependencies[index].text]) : []
        const dependencyEvaluators = calculationEntries.length ? calculationEvaluators.map((evaluator, index) => evaluator ? factory.createObjectLiteralExpression([
          factory.createSpreadAssignment(evaluator.descriptor),
          factory.createPropertyAssignment("field", factory.createStringLiteral(dependencyEntries[index].field))
        ]) : factory.createNull()) : []
        const buildCallback = [...packageBindings].some(([name]) => referenceIdentifiers(callback, name).length)
          ? factory.createArrowFunction(undefined, undefined, [], undefined, factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), factory.createBlock([], false))
          : callback
        return factory.updateCallExpression(node, node.expression, node.typeArguments, [
          buildCallback,
          factory.createArrayLiteralExpression(subscriptionNames.map(name => factory.createIdentifier(name))),
          factory.createStringLiteral(handlerUrl),
          factory.createStringLiteral(effect.setup.exportName),
          descriptor.states,
          descriptor.scope,
          factory.createStringLiteral(specializedEffect ? sourceLocation(specializedEffect.source, specializedEffect.sourceFile) : sourceLocation(node, sourceFile)),
          effect.cleanup ? factory.createTrue() : factory.createFalse(),
          factory.createArrayLiteralExpression(effect.itemDependencies.map(field => factory.createStringLiteral(field))),
          dependencyExpressions.length ? jsonExpression(dependencyExpressions, factory) : factory.createArrayLiteralExpression(),
          factory.createArrayLiteralExpression(dependencyStateNames.map(name => factory.createArrayLiteralExpression([factory.createStringLiteral(name), factory.createIdentifier(name)]))),
          factory.createArrayLiteralExpression(dependencyEvaluators)
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

      if (ts.isVariableDeclaration(node) && listLocalDeclarations.includes(node)) {
        return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, factory.createIdentifier("undefined"))
      }

      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && importBindings.has(node.initializer.expression.text)) {
        if (parameterizedDebounceCalls.has(node.initializer)) return node
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

      const listCondition = ts.isJsxExpression(node) && node.expression ? keyedEntry(activeKeyedBlock?.analysis.conditions ?? [], node.expression) : undefined
      if (listCondition) {
        const entry = listCondition.value
        return factory.updateJsxExpression(node, descriptors.compileListConditional({
          ...entry,
          keyedBlock: activeKeyedBlock.block.slot,
          truthy: ts.visitNode(entry.truthy, visitor),
          falsy: ts.visitNode(entry.falsy, visitor)
        }))
      }

      const listValue = ts.isJsxExpression(node) && node.expression ? keyedEntry(activeKeyedBlock?.analysis.values ?? [], node.expression) : undefined
      if (listValue) {
        return factory.updateJsxExpression(node, descriptors.compileListValue(node.expression, { ...listValue.value, keyedBlock: activeKeyedBlock.block.slot }))
      }

      const attributeListValue = ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression ? keyedEntry(activeKeyedBlock?.analysis.values ?? [], node.initializer.expression) : undefined
      if (attributeListValue) {
        return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, descriptors.compileListValue(node.initializer.expression, { ...attributeListValue.value, keyedBlock: activeKeyedBlock.block.slot })))
      }

      if (ts.isJsxExpression(node) && node.initializer === undefined && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
        const renderedList = keyedEntry(preparedRenderedLists, node)
        const nestedList = keyedEntry(activeKeyedBlock?.analysis.nested ?? [], unwrapExpression(node.expression))
        if (renderedList || nestedList) return compileKeyedBlock(node, renderedList ?? nestedList)
        const conditional = conditionalParts(node.expression)
        if (conditional) {
          const compiled = compileRenderExpression(node.expression, node)
          if (compiled !== node.expression) return factory.updateJsxExpression(node, compiled)
        }
        const setters = settersForNode(node, settersByFunction)
        const expression = resolveReactiveJsxExpression(node.expression, nearestFunction(node), setters)
        const usedStates = referencedStateNames(expression, setters, expression, bindingIndex)
        const captures = captureNames(expression, expression, setters, bindingIndex)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(expression) && !containsJsx(expression)) {
          usesBehavior = true
          usesBinding = true
          return factory.updateJsxExpression(node, descriptors.compileReactiveBinding(expression, { setters, importBindings, derived: calculationBinding(node.expression, nearestFunction(node)) }).node)
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && !isContextProviderValue(node, contexts) && !/^on/i.test(node.name.text) && !["key", "ref", "dangerouslysetinnerhtml"].includes(node.name.text.toLowerCase())) {
        const sourceExpression = node.initializer.expression
        const setters = settersForNode(node, settersByFunction)
        const expression = resolveReactiveJsxExpression(sourceExpression, nearestFunction(node), setters)
        const usedStates = referencedStateNames(expression, setters, expression, bindingIndex)
        const captures = captureNames(expression, expression, setters, bindingIndex)
        if ((usedStates.size || captures.size) && !ts.isIdentifier(expression)) {
          usesBehavior = true
          usesBinding = true
          const compiled = descriptors.compileReactiveBinding(expression, { setters, importBindings, derived: calculationBinding(sourceExpression, nearestFunction(node)) })
          return factory.updateJsxAttribute(node, node.name, factory.createJsxExpression(undefined, compiled.node))
        }
      }

      if (ts.isJsxAttribute(node) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && /^on[A-Z]/.test(node.name.text)) {
        const setters = settersForNode(node, settersByFunction)
        const event = descriptors.compileEvent(node.initializer.expression, {
          owner: fallbackOwner(node),
          stateOwners: new Map([...stateOwnersForNode(node), ...(activeStateOwners ?? [])]),
          setters,
          reducers: reducersForNode(node, reducersByFunction),
          functions: functionsForNode(node),
          listItem: activeKeyedBlock ? { item: activeKeyedBlock.parts.item, index: activeKeyedBlock.parts.index } : undefined,
          keyedBlock: activeKeyedBlock?.block.slot,
          importBindings: new Map([...importBindings, ...packageBindings])
        })
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

    function calculationBinding(expression, owner) {
      const calculations = calculationDerivedByOwner.get(owner)
      if (!calculations?.size) return undefined
      const fields = new Map()
      const visit = node => {
        const value = unwrapExpression(node)
        if (ts.isPropertyAccessExpression(value) && ts.isIdentifier(value.expression) && calculations.has(value.expression.text)) {
          const derived = calculations.get(value.expression.text)
          const entry = fields.get(derived.slot) ?? { derived, fields: new Set() }
          entry.fields.add(value.name.text)
          fields.set(derived.slot, entry)
        }
        ts.forEachChild(node, visit)
      }
      visit(expression)
      if (fields.size !== 1) return undefined
      const [{ derived, fields: selected }] = fields.values()
      for (const field of selected) if (!derived.calculation.fields.includes(field)) derived.calculation.fields.push(field)
      return { derived: derived.slot, fields: [...selected] }
    }

    const transformed = ts.visitNode(sourceFile, visitor)
    descriptors.finalize()
    if (!usesBehavior) return transformed

    const behaviorImports = [factory.createImportSpecifier(false, factory.createIdentifier("behavior"), factory.createIdentifier("__kBehavior"))]
    if (moduleIR.handlers.some(handler => handler.kind === "module-export" && handler.role === "native")) behaviorImports.push(factory.createImportSpecifier(false, factory.createIdentifier("nativeBehavior"), factory.createIdentifier("__kNativeBehavior")))
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
  let collection = analyzeCollectionPipeline(directFrom ? value.arguments[0] : value.expression.expression, {
    setters, declarations, fail, aliases, importedCollections, stateNames: new Set(setters.values()), importedCollectionTransforms, calculatedCollection, staticCollection
  })
  if (!collection?.state && !collection?.calculation) return undefined
  if (directFrom) collection.selector.push(["from", undefined])
  let callback = directFrom ? value.arguments[1] : value.arguments[0]
  const parameters = collectionParameters(callback, "Keyed list map", fail)
  let root = unwrapExpression(callback.body)
  if (ts.isBlock(root)) {
    if (!context || root.statements.length !== 2 || !ts.isVariableStatement(root.statements[0]) || (root.statements[0].declarationList.flags & ts.NodeFlags.Const) === 0 || root.statements[0].declarationList.declarations.length !== 1 || !ts.isReturnStatement(root.statements[1]) || !root.statements[1].expression) fail(root, "Block-bodied keyed list map callbacks require one computed child collection const and a final JSX return")
    const declaration = root.statements[0].declarationList.declarations[0]
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) fail(declaration, "Computed child collections must initialize one const identifier")
    const computed = analyzeCollectionPipeline(declaration.initializer, { fail, importedCollectionTransforms })
    if (!computed?.ownerField || computed.parentItem !== parameters.item) fail(declaration.initializer, `Computed child collections must start from ${parameters.item}.<field>`)
    const returned = root.statements[1].expression
    if (identifierReferenceCount(returned, declaration.name.text) !== 1) fail(declaration.name, `Computed child collection alias "${declaration.name.text}" must be used exactly once`)
    root = unwrapExpression(substituteClone(returned, new Map([[declaration.name.text, declaration.initializer]]), factory, context))
    callback = factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, callback.parameters, callback.type, callback.equalsGreaterThanToken, root)
    ts.setParentRecursive(callback, false)
    callback.parent = value
  }
  const conditional = conditionalKeyedMapRoot(callback, root, parameters, collection, fail, new Set(setters.values()), factory, value)
  if (conditional) ({ callback, root, collection } = conditional)
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
  let collection = analyzeCollectionPipeline(value.expression.expression, { fail })
  if (!collection?.ownerField || collection.parentItem !== parentItem) return undefined
  let callback = value.arguments[0]
  const parameters = collectionParameters(callback, "Nested keyed list map", fail)
  let root = unwrapExpression(callback.body)
  const conditional = conditionalKeyedMapRoot(callback, root, parameters, collection, fail, new Set(), ts.factory, value)
  if (conditional) ({ callback, root, collection } = conditional)
  if (!ts.isJsxElement(root) && !ts.isJsxSelfClosingElement(root)) fail(callback.body, "Nested keyed list map callback must return one JSX element")
  const attributes = ts.isJsxElement(root) ? root.openingElement.attributes : root.attributes
  const key = attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && ts.isIdentifier(attribute.name) && attribute.name.text === "key")
  const keyExpression = key && ts.isJsxAttribute(key) && key.initializer && ts.isJsxExpression(key.initializer) && key.initializer.expression
  const keyField = keyExpression && directProperty(keyExpression, parameters.item)
  const positional = Boolean(keyExpression && parameters.index && ts.isIdentifier(unwrapExpression(keyExpression)) && unwrapExpression(keyExpression).text === parameters.index)
  if (!keyField && !positional) fail(key ?? root, `Nested keyed list root must have key={${parameters.item}.<field>} or key={${parameters.index ?? "index"}}`)
  return { ...collection, callback, root, item: parameters.item, index: parameters.index, indexed: Boolean(parameters.index), keyField: positional ? null : keyField }
}

function conditionalKeyedMapRoot(callback, root, parameters, collection, fail, stateNames, factory, parent) {
  let condition
  let rendered
  if (ts.isBinaryExpression(root) && root.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && (ts.isJsxElement(unwrapExpression(root.right)) || ts.isJsxSelfClosingElement(unwrapExpression(root.right)))) {
    condition = root.left
    rendered = unwrapExpression(root.right)
  } else if (ts.isConditionalExpression(root) && (ts.isJsxElement(unwrapExpression(root.whenTrue)) || ts.isJsxSelfClosingElement(unwrapExpression(root.whenTrue)))) {
    if (unwrapExpression(root.whenFalse).kind !== ts.SyntaxKind.NullKeyword) fail(root.whenFalse, "Conditional keyed map callbacks require condition ? <Element> : null")
    condition = root.condition
    rendered = unwrapExpression(root.whenTrue)
  } else {
    return undefined
  }
  if (parameters.index) fail(callback.parameters[1], "Conditional keyed map callbacks cannot use a map index because filtering changes index semantics; use an explicit filter(...).map((item, index) => ...) when a filtered index is intended")
  const selectorStates = new Set(collection.selectorStates)
  const selector = collectionExpression(condition, { parameters, fail, stateNames, selectorStates })
  const normalized = factory.updateArrowFunction(callback, callback.modifiers, callback.typeParameters, callback.parameters, callback.type, callback.equalsGreaterThanToken, rendered)
  ts.setParentRecursive(normalized, false)
  normalized.parent = parent
  return { callback: normalized, root: rendered, collection: { ...collection, selector: [...collection.selector, ["filter", selector]], selectorStates } }
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
    if (!ts.isJsxAttribute(attribute) || !attribute.initializer || !ts.isJsxExpression(attribute.initializer) || !attribute.initializer.expression) return []
    const value = unwrapExpression(attribute.initializer.expression)
    if (ts.isIdentifier(value) && setters.has(value.text) && (/^on[A-Z]/.test(attribute.name.text) || /^set[A-Z]/.test(attribute.name.text))) return [attribute.name.text]
    if (!/^on[A-Z]/.test(attribute.name.text)) return []
    const callback = ts.isArrowFunction(value) || ts.isFunctionExpression(value) ? value : ts.isIdentifier(value) ? functions.get(value.text) : undefined
    return callback && !nativeCaptureNames(callback, setters).size && !referencedReducerDispatches(callback.body, reducers, callback).size && referencedStateNames(callback.body, setters, callback).size ? [attribute.name.text] : []
  })
}

function componentHasDirectPropStateInitializer(component) {
  if (!component || component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name) || !ts.isBlock(component.body)) return false
  const props = new Set(component.parameters[0].name.elements.filter(element => !element.dotDotDotToken && ts.isIdentifier(element.name)).map(element => element.name.text))
  return component.body.statements.some(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useState" && declaration.initializer.arguments.length === 1 && ts.isIdentifier(declaration.initializer.arguments[0]) && props.has(declaration.initializer.arguments[0].text)))
}

function componentHasDirectPrimitiveState(component, state) {
  return Boolean(component && ts.isBlock(component.body) && component.body.statements.some(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => ts.isArrayBindingPattern(declaration.name) && ts.isIdentifier(declaration.name.elements[0]?.name) && declaration.name.elements[0].name.text === state && declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useState" && declaration.initializer.arguments.length === 1 && isPrimitiveDefaultLiteral(unwrapExpression(declaration.initializer.arguments[0])))))
}

function componentHasDirectObjectRef(component, ref) {
  if (!component || !ts.isBlock(component.body)) return false
  const declaration = component.body.statements.some(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(entry => ts.isIdentifier(entry.name) && entry.name.text === ref && entry.initializer && ts.isCallExpression(entry.initializer) && ts.isIdentifier(entry.initializer.expression) && entry.initializer.expression.text === "useRef" && entry.initializer.arguments.length === 1 && entry.initializer.arguments[0].kind === ts.SyntaxKind.NullKeyword))
  let attachments = 0
  let intrinsic = 0
  const visit = node => {
    if (ts.isJsxAttribute(node) && node.name.text === "ref" && node.initializer && ts.isJsxExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) && node.initializer.expression.text === ref) {
      attachments++
      const element = node.parent?.parent
      const tag = ts.isJsxOpeningElement(element) || ts.isJsxSelfClosingElement(element) ? element.tagName : undefined
      if (ts.isIdentifier(tag) && tag.text[0] === tag.text[0].toLowerCase()) intrinsic++
    }
    ts.forEachChild(node, visit)
  }
  visit(component.body)
  return declaration && attachments === 1 && intrinsic === 1
}

function directSetterLiteralCallback(node, setters) {
  node = node && unwrapExpression(node)
  if ((!ts.isArrowFunction(node) && !ts.isFunctionExpression(node)) || node.parameters.length || node.asteriskToken || node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)) return undefined
  const expression = ts.isBlock(node.body) ? node.body.statements.length === 1 && ts.isExpressionStatement(node.body.statements[0]) ? node.body.statements[0].expression : undefined : node.body
  if (!expression || !ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression) || !setters.has(expression.expression.text) || expression.arguments.length !== 1 || !isPrimitiveDefaultLiteral(unwrapExpression(expression.arguments[0]))) return undefined
  return { setter: expression.expression.text, value: unwrapExpression(expression.arguments[0]) }
}

function componentHasDirectArrayState(component, state) {
  return Boolean(component && ts.isBlock(component.body) && component.body.statements.some(statement => ts.isVariableStatement(statement) && statement.declarationList.declarations.some(declaration => ts.isArrayBindingPattern(declaration.name) && ts.isIdentifier(declaration.name.elements[0]?.name) && declaration.name.elements[0].name.text === state && declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useState" && declaration.initializer.arguments.length === 1 && ts.isArrayLiteralExpression(unwrapExpression(declaration.initializer.arguments[0])))))
}

function directSetterPropEffect(component, setterProp) {
  if (!component || component.parameters.length !== 1 || !ts.isObjectBindingPattern(component.parameters[0].name) || !ts.isBlock(component.body)) return undefined
  const props = component.parameters[0].name.elements.filter(element => !element.dotDotDotToken && ts.isIdentifier(element.name))
  const setter = props.find(element => !element.propertyName && element.name.text === setterProp)
  if (!setter) return undefined
  for (const statement of component.body.statements) {
    if (!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) continue
    const declaration = statement.declarationList.declarations[0]
    if (!ts.isArrayBindingPattern(declaration.name) || !declaration.initializer || !ts.isCallExpression(declaration.initializer) || !ts.isIdentifier(declaration.initializer.expression) || declaration.initializer.expression.text !== "useState" || declaration.initializer.arguments.length !== 1 || !ts.isIdentifier(declaration.initializer.arguments[0]) || !ts.isIdentifier(declaration.name.elements[0]?.name)) continue
    const stateProp = props.find(element => !element.propertyName && element.name.text === declaration.initializer.arguments[0].text)
    if (!stateProp) continue
    const state = declaration.name.elements[0].name.text
    for (const effectStatement of component.body.statements) {
      if (!ts.isExpressionStatement(effectStatement) || !ts.isCallExpression(effectStatement.expression) || !ts.isIdentifier(effectStatement.expression.expression) || effectStatement.expression.expression.text !== "useEffect" || effectStatement.expression.arguments.length !== 2) continue
      const [callback, dependencies] = effectStatement.expression.arguments
      if ((!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) || callback.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) || !ts.isBlock(callback.body) || callback.body.statements.length !== 1 || !ts.isArrayLiteralExpression(dependencies) || dependencies.elements.length !== 2) continue
      const body = callback.body.statements[0]
      if (!ts.isExpressionStatement(body) || !ts.isCallExpression(body.expression) || !ts.isIdentifier(body.expression.expression) || body.expression.expression.text !== setter.name.text || body.expression.arguments.length !== 1 || !ts.isIdentifier(body.expression.arguments[0]) || body.expression.arguments[0].text !== state) continue
      if (!ts.isIdentifier(dependencies.elements[0]) || dependencies.elements[0].text !== state || !ts.isIdentifier(dependencies.elements[1]) || dependencies.elements[1].text !== setter.name.text) continue
      return { stateProp: (stateProp.propertyName ?? stateProp.name).getText(), references: new Set([body.expression.expression, dependencies.elements[1]]) }
    }
  }
}

function supportedSetterCallbackProps(component, props) {
  const acceptsSetProp = componentHasDirectPropStateInitializer(component)
  return props.filter(prop => /^on[A-Z]/.test(prop) || acceptsSetProp)
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

function insideJsxEventHandler(node, root) {
  for (let current = node.parent; current && current !== root.parent; current = current.parent) {
    if (ts.isJsxAttribute(current) && /^on[A-Z]/.test(current.name.text)) return true
  }
  return false
}

function insideOwnedEffectCallback(node, root) {
  let callback
  for (let current = node.parent; current && current !== root.parent; current = current.parent) {
    if (!isFunctionLike(current)) continue
    callback = current
    break
  }
  if (!callback) return false
  if (ts.isCallExpression(callback.parent) && callback.parent.arguments[0] === callback && ts.isIdentifier(callback.parent.expression) && callback.parent.expression.text === "useEffect") return true
  const returned = callback.parent
  if (!ts.isReturnStatement(returned)) return false
  for (let current = returned.parent; current && current !== root.parent; current = current.parent) {
    if (!isFunctionLike(current)) continue
    return ts.isCallExpression(current.parent) && current.parent.arguments[0] === current && ts.isIdentifier(current.parent.expression) && current.parent.expression.text === "useEffect"
  }
  return false
}

function validateKeyedList(parts, sourceFile, setters, rowStates, componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback, bindingIndex) {
  const fail = (node, message) => {
    throw sourceNodeError(node, sourceFile, message)
  }
  const analysis = { values: [], conditions: [], nested: [] }
  const root = parts.root
  const item = parts.item
  for (const state of rowStates) if (state.initializer && state.initializer !== item) throw sourceNodeError(state.source.initializer, state.source.getSourceFile(), "Keyed row useState() item initializer must be the direct keyed item prop")
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
        callback = prepareListCallback(callback, root, specialization ?? { hookDeclarations: [], effects: [] })
        const specializedStates = [...(specialization?.rowStates ?? []), ...(specialization?.ordinaryStates ?? [])]
        const nestedParts = {
          ...nested,
          root,
          callback,
          state: parts.state,
          nested: true,
          specializations: [specialization?.analysis?.slot, ...(specialization?.specializations ?? [])].filter(slot => slot !== undefined),
          rowStates: specializedStates,
          rowRefs: specialization?.rowRefs ?? [],
          analysisStateOwners: new Map([...(parts.analysisStateOwners ?? []), ...(specialization?.propStateOwners ?? []), ...specializedStates.map(state => [state.state, state.analysisReference])])
        }
        for (const calculation of specialization?.calculations ?? []) {
          ts.setParentRecursive(calculation, false)
          calculation.parent = callback
          validateListExpression(calculation, nested.item, nested.root, fail)
        }
        const nestedAnalysis = validateKeyedList(nestedParts, sourceFile, setters, specialization?.rowStates ?? [], componentSpecializations, expandedRowSpecializations, nestedRowSpecializations, factory, prepareListCallback, bindingIndex)
        analysis.nested.push({ node: expression, parts: nestedParts, analysis: nestedAnalysis })
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
        analysis.conditions.push({ node: node.expression, value: { ...condition, item, index: parts.index } })
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
        analysis.values.push({ node: node.expression, value: { field } })
        return
      }
      if (referencesIdentifier(expression, item) || parts.index && referencesIdentifier(expression, parts.index)) {
        const states = referencedStateNames(expression, setters, expression, bindingIndex)
        for (const rowState of rowStates) states.delete(rowState.state)
        if (parts.nested && states.size) fail(node, "Nested keyed list item expressions cannot read parent state")
        validateListExpression(expression, item, node, fail, parts.index, states)
        if (ts.isJsxAttribute(node.parent) && ["ref", "dangerouslysetinnerhtml"].includes(node.parent.name.text.toLowerCase())) fail(node, `Keyed list item ${node.parent.name.text} is not supported`)
        analysis.values.push({ node: node.expression, value: { item, index: parts.index, states } })
        return
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(root)
  return analysis
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
  const propAnalysis = elements.map(element => ({
    name: (element.propertyName ?? element.name).getText(),
    local: element.name.getText(),
    provided: element.dotDotDotToken ? restEntries.length > 0 : props.has((element.propertyName ?? element.name).text),
    ...(element.dotDotDotToken ? { rest: true } : {}),
    ...(element.initializer ? { hasDefault: true, defaultApplied: !props.has((element.propertyName ?? element.name).text) } : {})
  }))

  let returned
  const calculations = []
  const effectCalls = []
  const hookDeclarations = []
  const rowStates = []
  const rowRefs = []
  const ordinaryStates = []
  const ordinaryRefs = []
  const ordinaryIds = []
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
        const propReceiver = initialArgument && (ordinaryHooks ? ts.isIdentifier(initialArgument) ? initialArgument : ts.isCallExpression(initialArgument) && initialArgument.arguments.length === 0 && !initialArgument.questionDotToken && ts.isPropertyAccessExpression(initialArgument.expression) && !initialArgument.expression.questionDotToken && initialArgument.expression.name.text === "toString" && ts.isIdentifier(initialArgument.expression.expression) ? initialArgument.expression.expression : undefined : ts.isIdentifier(initialArgument) ? initialArgument : undefined)
        const substitutedProp = propReceiver ? substitutions.get(propReceiver.text) : undefined
        const substitutedState = substitutedProp && ts.isIdentifier(unwrapExpression(substitutedProp)) ? unwrapExpression(substitutedProp).text : undefined
        const directProp = ts.isIdentifier(initialArgument)
        const parentInitializer = substitutedState ? directStateInitializer(call, substitutedState) : undefined
        const propInitializer = ordinaryHooks && substitutedState && ordinaryStateNames.has(substitutedState) && parentInitializer && (isPrimitiveDefaultLiteral(parentInitializer) || directProp && (ts.isObjectLiteralExpression(parentInitializer) || ts.isArrayLiteralExpression(parentInitializer)))
        const rowItemProp = propReceiver && elements.find(element => !element.dotDotDotToken && ts.isIdentifier(element.name) && element.name.text === propReceiver.text)
        const rowItemInitializer = !ordinaryHooks && directProp && substitutedState && rowItemProp && directProps.has((rowItemProp.propertyName ?? rowItemProp.name).text)
        if (declaration.initializer.arguments.length !== 1 || !isSerializableStateLiteral(initialArgument) && !propInitializer && !rowItemInitializer) throw sourceNodeError(declaration.initializer, component.getSourceFile(), `${hookLabel} useState() must use one directly serializable primitive, plain object, or array initial value${ordinaryHooks ? " or direct state prop initialized with a primitive, plain object, or array; .toString() requires a primitive prop" : " or the direct keyed item prop"}; other dynamic initializers are not supported`)
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
        const initialValue = rowItemInitializer
          ? cloneAst(substitutedProp, factory, context)
          : propInitializer
          ? ts.isIdentifier(initialArgument)
            ? factory.createPropertyAccessExpression(cloneAst(substitutedProp, factory, context), "value")
            : substituteClone(initialArgument, substitutions, factory, context)
          : cloneAst(initialArgument, factory, context)
        synthesizeTree(initialValue)
        const initializer = factory.createCallExpression(factory.createIdentifier(ordinaryHooks ? "__kComponentUseState" : "__kRowUseState"), undefined, rowItemInitializer ? [initialValue, factory.createStringLiteral(state), factory.createStringLiteral("list-item")] : [initialValue])
        hookDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(binding, undefined, undefined, initializer)], ts.NodeFlags.Const)))
        if (ordinaryHooks) ordinaryStates.push({ state, setter, source: declaration })
        else rowStates.push({ state, setter, source: declaration, ...(rowItemInitializer ? { initializer: substitutedState } : {}) })
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
        refs.push({ name, source: declaration })
        continue
      }
      if (declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && declaration.initializer.expression.text === "useId") {
        if (!ordinaryHooks) throw sourceNodeError(declaration.initializer, component.getSourceFile(), "useId() is not supported in keyed row components")
        if (declaration.initializer.arguments.length || !ts.isIdentifier(declaration.name)) throw sourceNodeError(declaration.initializer, component.getSourceFile(), "Setter-callback component useId() must initialize one top-level const identifier without arguments")
        const name = `__kComponentId${Math.max(0, call.pos)}_${hookDeclarations.length}`
        substitutions.set(declaration.name.text, factory.createIdentifier(name))
        const initializer = factory.createCallExpression(factory.createIdentifier("__kComponentUseId"), undefined, [])
        hookDeclarations.push(factory.createVariableStatement(undefined, factory.createVariableDeclarationList([factory.createVariableDeclaration(factory.createIdentifier(name), undefined, undefined, initializer)], ts.NodeFlags.Const)))
        ordinaryIds.push({ name, source: declaration })
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
    ordinaryIds,
    propExpressions: props,
    props: propAnalysis,
    usesComponentId: ordinaryIds.length > 0
  }
}

function isSerializableStateLiteral(node) {
  const value = unwrapExpression(node)
  if (isPrimitiveDefaultLiteral(value)) return true
  if (ts.isArrayLiteralExpression(value)) return value.elements.every(element => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element) && isSerializableStateLiteral(element))
  if (!ts.isObjectLiteralExpression(value)) return false
  return value.properties.every(property => ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name) && property.name.text !== "__proto__" && isSerializableStateLiteral(property.initializer))
}

function directStateInitializer(call, name) {
  const owner = nearestFunction(call)
  if (!owner || !ts.isBlock(owner.body)) return
  for (const statement of owner.body.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isArrayBindingPattern(declaration.name) || !declaration.initializer || !ts.isCallExpression(declaration.initializer) || !ts.isIdentifier(declaration.initializer.expression) || declaration.initializer.expression.text !== "useState") continue
      const state = declaration.name.elements[0]
      const initialValue = declaration.initializer.arguments[0]
      if (state && ts.isBindingElement(state) && ts.isIdentifier(state.name) && state.name.text === name && declaration.initializer.arguments.length === 1 && isSerializableStateLiteral(initialValue)) return unwrapExpression(initialValue)
    }
  }
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

const pureListGlobals = new Set(["Boolean", "Infinity", "Math", "NaN", "Number", "String", "undefined"])
const assignmentOperators = new Set([
  ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken, ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken, ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken, ts.SyntaxKind.LessThanLessThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken, ts.SyntaxKind.AmpersandEqualsToken, ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken, ts.SyntaxKind.BarBarEqualsToken, ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken
])

function validateListExpression(expression, item, source, fail, index, states = new Set()) {
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
    if (ts.isIdentifier(node) && isReferenceIdentifier(node) && !isJsxSyntaxIdentifier(node) && node.text !== item && node.text !== index && !states.has(node.text) && !pureListGlobals.has(node.text)) {
      fail(source, `Derived keyed list item expression identifier "${node.text}" is not allowed`)
    }
    ts.forEachChild(node, visit)
  }
  visit(expression)
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

function isJsxLocalValue(expression, known) {
  const value = unwrapExpression(expression)
  if (ts.isJsxElement(value) || ts.isJsxSelfClosingElement(value) || ts.isJsxFragment(value)) return true
  if (ts.isIdentifier(value)) return known.has(value.text)
  const parts = conditionalParts(value)
  return Boolean(parts && (isJsxLocalValue(parts.truthy, known) || isJsxLocalValue(parts.falsy, known)))
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

function hasFrameworkImport(sourceFile, name) {
  return sourceFile.statements.some(node => {
    if (!ts.isImportDeclaration(node) || node.importClause?.isTypeOnly || !ts.isStringLiteral(node.moduleSpecifier) || !["react", "@kudzujs/core"].includes(node.moduleSpecifier.text)) return false
    const bindings = node.importClause?.namedBindings
    return bindings && ts.isNamedImports(bindings) && bindings.elements.some(entry => !entry.isTypeOnly && entry.name.text === name && (entry.propertyName ?? entry.name).text === name)
  })
}

function packageImportBindings(sourceFile) {
  const bindings = new Map()
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

function resolveComponentExport(file, exportName, getSource, sourceFiles) {
  const symbol = modules.resolveExport(file, exportName, sourceFiles)
  const target = symbol && resolve(root, symbol.module)
  const declaration = symbol && modules.declaration(symbol, getSource(target))
  if (declaration && ts.isFunctionDeclaration(declaration)) return declaration
  if (declaration && ts.isVariableDeclaration(declaration) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) return declaration.initializer
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

async function collectClientModules(entries, sourceFiles) {
  const modules = new Set()
  const queue = [...new Set(entries)]
  while (queue.length) {
    const file = queue.shift()
    if (modules.has(file)) continue
    const source = project.sourceIndex.get(file) ?? await readFile(file, "utf8")
    const sourceFile = project.modules.read(file, source).sourceFile
    workerCompiler.rejectConstructions(sourceFile, sourceFile, "Relative TypeScript Worker construction is only supported directly inside an inline useEffect() callback, not imported client helpers")
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

async function compileClientModule(file, sourceFiles, staticFiles, cssModules, base) {
  const importedAssets = new Set()
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
  return { file: relative(root, file).replaceAll(sep, "/"), path: clientModulePath(file), code: result.outputText, importedAssets: [...importedAssets].map(file => relative(root, file).replaceAll(sep, "/")).sort() }
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

function orderSourceStyles(entryFiles, sourceFiles, sourceIndex, staticFiles) {
  const ordered = []
  const seenStyles = new Set()
  const seenSources = new Set()
  const sourceSet = new Set(sourceFiles)
  const visit = file => {
    if (seenSources.has(file)) return
    seenSources.add(file)
    const sourceFile = parseSourceFile(file, sourceIndex.get(file))
    for (const statement of sourceFile.statements) {
      if ((!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) || !runtimeModuleReference(statement) || !statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.moduleSpecifier.text.startsWith(".")) continue
      const specifier = statement.moduleSpecifier.text
      const queryIndex = specifier.indexOf("?")
      const query = queryIndex === -1 ? "" : specifier.slice(queryIndex + 1)
      if (ts.isImportDeclaration(statement) && staticImportExtension(specifier) === ".css") {
        if (query) continue
        const target = resolveStaticImport(file, specifier, staticFiles)
        if (!seenStyles.has(target)) {
          seenStyles.add(target)
          ordered.push(target)
        }
        continue
      }
      if (isStaticImport(specifier)) continue
      visit(resolveSourceImport(file, specifier, sourceSet))
    }
  }
  for (const file of entryFiles) visit(file)
  return ordered
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
    importedAssets.add(target)
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

function rejectUnsupportedClientImports(sourceFile, file) {
  const visit = node => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) throw new Error(`${relative(root, file)} Dynamic imports are not supported in imported client helpers`)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require") throw new Error(`${relative(root, file)} require() is not supported in imported client helpers`)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
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

function compiledPath(file) {
  return join(buildDirectory, relative(sourceDirectory, file)).replace(/\.(?:ts|tsx)$/, ".mjs")
}

const compileEventCommand = createCommandSpecializer({ isPrimitiveLiteral: isPrimitiveDefaultLiteral })
const { analyzeZustandStores, normalizeZustandMigrationSyntax } = createZustandPass({ isSerializableStateLiteral, nativeCaptureNames, sourceDirectory })
const handlerLowering = createHandlerLowering({ cloneAst, synthesizeTree })
const printHandlerModule = createHandlerCodegen({
  resolveClientImport: (entry, handlerPath) => entry.package ? entry.target : relativeModulePath(handlerPath, clientModulePath(entry.target))
})
const { normalizeReactMigrationSyntax, validateUseIdSyntax } = createReactMigrationPass({ cloneAst, jsxTagName })
const normalizeReactRouterSyntax = createRouterPass({ withBase })

return { collectClientModules, compileClientModule, compiledPath, compileSource, layoutExportError, orderSourceStyles, reachableSourceFiles, safeStaticFiles }
}

const currentCompiler = sourceIndex => createSourceCompiler(createProjectSession(process.cwd(), { sourceIndex }))
export const collectClientModules = (...arguments_) => currentCompiler().collectClientModules(...arguments_)
export const compileClientModule = (...arguments_) => currentCompiler().compileClientModule(...arguments_)
export const compiledPath = (...arguments_) => currentCompiler().compiledPath(...arguments_)
export const compileSource = (...arguments_) => currentCompiler(arguments_[2]).compileSource(...arguments_)
export const layoutExportError = (...arguments_) => currentCompiler(new Map([[arguments_[0], arguments_[1]]])).layoutExportError(...arguments_)
export const orderSourceStyles = (...arguments_) => currentCompiler(arguments_[2]).orderSourceStyles(...arguments_)
export const reachableSourceFiles = (...arguments_) => currentCompiler(arguments_[2]).reachableSourceFiles(...arguments_)
export const safeStaticFiles = (...arguments_) => currentCompiler().safeStaticFiles(...arguments_)
