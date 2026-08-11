import { join, resolve } from "node:path"
import ts from "typescript"
import { assetPath } from "./path-helpers.mjs"
import { createSourceGraph } from "./source-graph.mjs"
import { createWorkerCompiler } from "./worker-compiler.mjs"

export function createProjectSession(projectRoot = process.cwd(), { counters, sourceIndex = new Map() } = {}) {
  const root = resolve(projectRoot)
  const sourceDirectory = join(root, "src")
  const graph = createSourceGraph(root)
  const modules = createModuleCache(sourceIndex, graph.parseSourceFile, counters)
  return {
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

function createModuleCache(sourceIndex, parseSourceFile, counters) {
  const records = new Map()
  const increment = name => {
    if (counters) counters[name] = (counters[name] ?? 0) + 1
  }
  const read = (file, source = sourceIndex.get(file)) => {
    if (typeof source !== "string") throw new Error(`Source text is unavailable for ${file}`)
    const cached = records.get(file)
    if (cached?.source === source) return cached
    const sourceFile = parseSourceFile(file, source)
    increment("parsedModules")
    const exports = summarizeExports(sourceFile)
    increment("exportSummaries")
    const record = { source, sourceFile, exports }
    records.set(file, record)
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
  return { clone, read }
}

function summarizeExports(sourceFile) {
  const exports = new Map()
  const add = (name, value) => {
    if (!exports.has(name)) exports.set(name, value)
  }
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement)) {
      const exported = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      const isDefault = statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword)
      if (isDefault) add("default", { kind: "function", local: statement.name?.text })
      if (exported && statement.name) add(statement.name.text, { kind: "function", local: statement.name.text })
      continue
    }
    if (ts.isVariableStatement(statement) && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) add(declaration.name.text, { kind: "local", local: declaration.name.text })
      continue
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals && ts.isIdentifier(statement.expression)) {
      add("default", { kind: "local", local: statement.expression.text })
      continue
    }
    if (!ts.isExportDeclaration(statement) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
    for (const element of statement.exportClause.elements) {
      if (element.isTypeOnly) continue
      const name = element.name.text
      const imported = (element.propertyName ?? element.name).text
      add(name, statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)
        ? { kind: "reexport", imported, specifier: statement.moduleSpecifier.text, node: statement }
        : { kind: "local", local: imported })
    }
  }
  return exports
}
