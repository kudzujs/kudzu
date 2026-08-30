import { dirname, extname, join, relative, resolve } from "node:path"
import ts from "typescript"
import { sourceNodeError } from "./ast-helpers.mjs"

export function createSourceGraph(root) {
  const resolveSourceImport = (importer, specifier, sourceFiles) => {
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

  const ordinaryRuntimeDependencies = (file, sourceFile, sourceFiles, isStaticImport) => {
    const dependencies = []
    const rejectDynamicImports = node => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const argument = node.arguments[0]
        const specifier = node.arguments.length === 1 && ts.isStringLiteralLike(argument) ? JSON.stringify(argument.text) : argument?.getText(sourceFile) ?? "<missing>"
        if (ownedLazyPackageImport(node)) return
        throw sourceNodeError(node, sourceFile, `Dynamic import ${specifier} is not supported in ordinary source modules`)
      }
      ts.forEachChild(node, rejectDynamicImports)
    }
    rejectDynamicImports(sourceFile)
    for (const node of sourceFile.statements) {
      if ((!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) || !runtimeModuleReference(node) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
      const specifier = node.moduleSpecifier
      if (!specifier.text.startsWith(".") || isStaticImport(specifier.text)) continue
      try {
        dependencies.push(resolveSourceImport(file, specifier.text, sourceFiles))
      } catch (error) {
        const detail = error.message.slice(error.message.indexOf("Relative import"))
        const edge = ts.isExportDeclaration(node) ? "re-export" : "import"
        throw sourceNodeError(specifier, sourceFile, detail.replace("Relative import", `Relative runtime ${edge}`))
      }
    }
    return dependencies
  }

  return { ordinaryRuntimeDependencies, parseSourceFile, resolveSourceImport, runtimeModuleReference }
}

export function ownedLazyPackageImport(node) {
  if (!ts.isCallExpression(node) || node.expression.kind !== ts.SyntaxKind.ImportKeyword || node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) return false
  const target = node.arguments[0].text
  if (!target || target.startsWith(".") || target.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(target)) return false
  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isArrowFunction(current) && !ts.isFunctionExpression(current)) continue
    const call = current.parent
    return ts.isCallExpression(call) && call.arguments[0] === current && ts.isIdentifier(call.expression) && call.expression.text === "useEffect" && !current.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
  }
  return false
}

export function runtimeModuleReference(node) {
  if (ts.isExportDeclaration(node)) return !node.isTypeOnly && (!node.exportClause || !ts.isNamedExports(node.exportClause) || node.exportClause.elements.some(entry => !entry.isTypeOnly))
  const clause = node.importClause
  if (!clause) return true
  if (clause.isTypeOnly) return false
  if (clause.name || clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) return true
  return clause.namedBindings?.elements.some(entry => !entry.isTypeOnly) ?? false
}

export function parseSourceFile(file, source) {
  return ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
}
