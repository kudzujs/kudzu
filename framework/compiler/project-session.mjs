import { join, relative, resolve, sep } from "node:path"
import ts from "typescript"
import { sourceNodeError } from "./ast-helpers.mjs"
import { assetPath } from "./path-helpers.mjs"
import { createSourceGraph } from "./source-graph.mjs"
import { createWorkerCompiler } from "./worker-compiler.mjs"

export function createProjectSession(projectRoot = process.cwd(), { counters, sourceIndex = new Map(), timings } = {}) {
  const root = resolve(projectRoot)
  const sourceDirectory = join(root, "src")
  const graph = createSourceGraph(root)
  if (timings && !ts.performance.isEnabled()) ts.performance.enable()
  const modules = createModuleCache(root, sourceIndex, graph, counters, timings)
  return {
    counters,
    timings,
    root,
    sourceDirectory,
    pagesDirectory: join(sourceDirectory, "pages"),
    workDirectory: join(root, ".kudzu"),
    outputDirectory: join(root, "dist"),
    sourceIndex,
    sourceFiles: new Set(),
    graph,
    modules,
    workerCompiler: createWorkerCompiler({ root, sourceDirectory, assetPath, readSourceModule: modules.read, ...graph })
  }
}

function createModuleCache(root, sourceIndex, graph, counters, timings) {
  const records = new Map()
  let resolvedExports = new WeakMap()
  const moduleName = file => relative(root, file).replaceAll(sep, "/")
  const siteId = (node, role = "site") => {
    const original = ts.getOriginalNode(node)
    return `${role}:${original.getStart(original.getSourceFile())}:${original.end}`
  }
  const moduleSymbol = (file, node, name) => {
    const site = siteId(node, "declaration")
    const module = moduleName(file)
    return { id: `${module}#${site}`, module, site, name }
  }
  const increment = name => {
    if (counters) counters[name] = (counters[name] ?? 0) + 1
  }
  const read = (file, source = sourceIndex.get(file)) => {
    if (typeof source !== "string") throw new Error(`Source text is unavailable for ${file}`)
    const cached = records.get(file)
    if (cached?.source === source) return cached
    const parseBefore = timings ? ts.performance.getDuration("Parse") : 0
    const sourceFile = graph.parseSourceFile(file, source)
    if (timings) timings.parseMs = (timings.parseMs ?? 0) + ts.performance.getDuration("Parse") - parseBefore
    increment("parsedModules")
    const summary = summarizeModule(file, sourceFile, moduleSymbol, siteId)
    increment("exportSummaries")
    const record = { source, sourceFile, ...summary }
    records.set(file, record)
    resolvedExports = new WeakMap()
    return record
  }
  const clone = (file, factory, context) => {
    const visit = node => {
      const copy = factory.cloneNode(node)
      ts.setTextRange(copy, node)
      ts.setOriginalNode(copy, node)
      return ts.visitEachChild(copy, visit, context)
    }
    const sourceFile = visit(read(file).sourceFile)
    ts.setParentRecursive(sourceFile, false)
    increment("clonedModules")
    return sourceFile
  }
  const resolveExport = (file, exportName, sourceFiles) => {
    let cached = resolvedExports.get(sourceFiles)
    const cacheKey = `${file}:${exportName}`
    const cachedResolution = cached?.get(cacheKey)
    if (cachedResolution?.dependencies.every(([target, source]) => sourceIndex.get(target) === source)) return cachedResolution.symbol
    const dependencies = new Set()
    const resolveEntry = (currentFile, name, trail) => {
      const key = `${currentFile}:${name}`
      if (trail.includes(key)) return { cycle: [...trail, key] }
      const record = read(currentFile)
      dependencies.add(currentFile)
      const entry = record.exports.get(name)
      const nextTrail = [...trail, key]
      if (entry?.kind === "local") {
        const symbol = entry.symbol ?? record.declarations.get(entry.local)
        return symbol ? { symbol } : {}
      }
      if (entry?.kind === "reexport") {
        if (!entry.specifier.startsWith(".")) throw sourceNodeError(entry.node, record.sourceFile, "Imported keyed list components must use relative TypeScript re-exports")
        return resolveEntry(graph.resolveSourceImport(currentFile, entry.specifier, sourceFiles), entry.imported, nextTrail)
      }
      if (name === "default") return {}
      const matches = new Map()
      let cycle
      for (const star of record.exportStars) {
        if (!star.specifier.startsWith(".")) continue
        const result = resolveEntry(graph.resolveSourceImport(currentFile, star.specifier, sourceFiles), name, nextTrail)
        if (result.symbol) matches.set(result.symbol.id, result.symbol)
        else cycle ??= result.cycle
      }
      if (matches.size > 1) throw new Error(`${moduleName(currentFile)} has an ambiguous export named ${JSON.stringify(name)}`)
      return matches.size ? { symbol: matches.values().next().value } : cycle ? { cycle } : {}
    }
    const result = resolveEntry(file, exportName, [])
    if (result.cycle) throw new Error(`Imported keyed list component re-export cycle: ${result.cycle.map(entry => moduleName(entry.slice(0, entry.lastIndexOf(":")))).join(" -> ")}`)
    cached = resolvedExports.get(sourceFiles) ?? new Map()
    cached.set(cacheKey, { symbol: result.symbol, dependencies: [...dependencies].map(target => [target, sourceIndex.get(target)]) })
    resolvedExports.set(sourceFiles, cached)
    return result.symbol
  }
  const declaration = (symbol, sourceFile) => {
    const file = resolve(root, symbol.module)
    const record = read(file)
    if (!sourceFile || sourceFile === record.sourceFile) return record.declarationSites.get(symbol.site)
    for (const statement of sourceFile.statements) {
      if (ts.isFunctionDeclaration(statement) && siteId(statement, "declaration") === symbol.site) return statement
      if (ts.isVariableStatement(statement)) for (const entry of statement.declarationList.declarations) {
        if (siteId(entry, "declaration") === symbol.site) return entry
      }
    }
  }
  return { clone, declaration, read, resolveExport, siteId, symbol: moduleSymbol }
}

function summarizeModule(file, sourceFile, moduleSymbol, siteId) {
  const exports = new Map()
  const imports = new Map()
  const declarations = new Map()
  const declarationSites = new Map()
  const exportStars = []
  const add = (name, value) => {
    if (!exports.has(name)) exports.set(name, value)
  }
  const declare = (name, node) => {
    const symbol = moduleSymbol(file, node, name)
    if (!declarations.has(name)) declarations.set(name, symbol)
    declarationSites.set(symbol.site, node)
    return symbol
  }
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly && ts.isStringLiteral(statement.moduleSpecifier)) {
      const specifier = statement.moduleSpecifier.text
      const clause = statement.importClause
      if (clause?.name) imports.set(clause.name.text, { kind: "default", imported: "default", specifier, site: siteId(clause.name, "import") })
      if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) imports.set(clause.namedBindings.name.text, { kind: "namespace", imported: "*", specifier, site: siteId(clause.namedBindings, "import") })
      if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const element of clause.namedBindings.elements) {
        if (!element.isTypeOnly) imports.set(element.name.text, { kind: "named", imported: (element.propertyName ?? element.name).text, specifier, site: siteId(element, "import") })
      }
      continue
    }
    if (ts.isFunctionDeclaration(statement)) {
      const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      const isDefault = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
      const name = statement.name?.text ?? (isDefault ? "default" : undefined)
      const symbol = name ? declare(name, statement) : undefined
      if (isDefault && symbol) add("default", { kind: "local", symbol })
      if (exported && !isDefault && statement.name && symbol) add(statement.name.text, { kind: "local", local: statement.name.text, symbol })
      continue
    }
    if (ts.isVariableStatement(statement)) {
      const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) {
        const symbol = declare(declaration.name.text, declaration)
        if (exported) add(declaration.name.text, { kind: "local", local: declaration.name.text, symbol })
      }
      continue
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals && ts.isIdentifier(statement.expression)) {
      add("default", { kind: "local", local: statement.expression.text })
      continue
    }
    if (!ts.isExportDeclaration(statement)) continue
    if (!statement.exportClause && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      exportStars.push({ specifier: statement.moduleSpecifier.text, site: siteId(statement, "reexport") })
      continue
    }
    if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
    for (const element of statement.exportClause.elements) {
      if (element.isTypeOnly) continue
      const name = element.name.text
      const imported = (element.propertyName ?? element.name).text
      add(name, statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? { kind: "reexport", imported, specifier: statement.moduleSpecifier.text, site: siteId(element, "reexport"), node: statement }
        : { kind: "local", local: imported })
    }
  }
  return { declarations, declarationSites, exports, exportStars, imports }
}
