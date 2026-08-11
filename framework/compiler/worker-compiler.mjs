import { createHash } from "node:crypto"
import { mkdir, readFile } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"
import { build as bundle } from "esbuild"
import ts from "typescript"
import { containsJsx, isUnshadowedGlobal, nearestFunction, sourceNodeError } from "./ast-helpers.mjs"

export function createWorkerCompiler({
  root,
  sourceDirectory,
  assetPath,
  parseSourceFile,
  resolveSourceImport,
  runtimeModuleReference
}) {
  const isImportMetaUrl = node => ts.isPropertyAccessExpression(node) && node.name.text === "url" && ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword && node.expression.name.text === "meta"

  const candidate = (node, sourceFile) => {
    if (!ts.isNewExpression(node) || !ts.isIdentifier(node.expression) || node.expression.text !== "Worker") return undefined
    const first = node.arguments?.[0]
    if (!first || !ts.isNewExpression(first) || !ts.isIdentifier(first.expression) || first.expression.text !== "URL") return undefined
    const specifier = first.arguments?.[0]
    const base = first.arguments?.[1]
    const relativeLiteral = ts.isStringLiteral(specifier) && (specifier.text.startsWith("./") || specifier.text.startsWith("../"))
    if (!relativeLiteral && !(specifier && !ts.isStringLiteral(specifier) && base && isImportMetaUrl(base))) return undefined
    return { worker: node, url: first, sourceFile }
  }

  const validateCandidate = (value, sourceFile) => {
    const { worker, url } = value
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

  const rewriteEffect = (callback, file, sourceFile, sourceFiles, factory, context) => {
    const workers = []
    const visit = node => {
      const value = candidate(node, sourceFile)
      if (value) {
        if (nearestFunction(node) !== callback) throw sourceNodeError(node, sourceFile, "Relative TypeScript Worker construction must be directly inside the inline useEffect() callback, not a nested function")
        const { worker, url, specifier, options } = validateCandidate(value, sourceFile)
        const target = resolve(dirname(file), specifier)
        const sourceRelative = relative(sourceDirectory, target)
        if (sourceRelative.startsWith(`..${sep}`) || sourceRelative === ".." || resolve(sourceDirectory, sourceRelative) !== target) throw sourceNodeError(url.arguments[0], sourceFile, "Relative TypeScript Worker source must remain under src/")
        if (!sourceFiles.has(target)) throw sourceNodeError(url.arguments[0], sourceFile, `Relative TypeScript Worker ${JSON.stringify(specifier)} must resolve to an existing .worker.ts file under src/`)
        const identity = `${sourceRelative.replaceAll(sep, "/")}:${ts.getOriginalNode(node).getStart(sourceFile)}`
        const placeholder = `/__kudzu_worker_${createHash("sha256").update(identity).digest("hex").slice(0, 16)}__.js`
        const original = ts.getOriginalNode(node)
        workers.push({
          root: sourceRelative.replaceAll(sep, "/"),
          placeholder,
          source: { file: relative(root, sourceFile.fileName).replaceAll(sep, "/"), start: original.getStart(sourceFile), end: original.end }
        })
        return factory.updateNewExpression(worker, worker.expression, worker.typeArguments, [factory.createStringLiteral(placeholder), options])
      }
      return ts.visitEachChild(node, visit, context)
    }
    return { callback: ts.visitEachChild(callback, visit, context), workers }
  }

  const rejectConstructions = (expression, sourceFile, message) => {
    const visit = node => {
      if (candidate(node, sourceFile)) throw sourceNodeError(node, sourceFile, message)
      ts.forEachChild(node, visit)
    }
    visit(expression.body ?? expression)
  }

  const rejectOrdinaryImports = (sourceFile, file, sourceFiles) => {
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

  const validateGraphs = async (roots, sourceFiles) => {
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

  const emit = async (references, sourceFiles, assetsDirectory, base, minify) => {
    const roots = [...new Set(references.map(reference => resolve(sourceDirectory, reference.root)))].sort()
    if (!roots.length) return new Map()
    await validateGraphs(roots, sourceFiles)
    const workerDirectory = resolve(assetsDirectory, "workers")
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
      const rootReferences = references.filter(reference => resolve(sourceDirectory, reference.root) === entry)
      const outputFile = resolve(root, output)
      const url = assetPath(base, relative(resolve(assetsDirectory, ".."), outputFile).replaceAll(sep, "/"))
      for (const reference of rootReferences) emitted.set(reference.placeholder, url)
    }
    for (const reference of references) if (!emitted.has(reference.placeholder)) throw new Error(`Worker entry was not emitted: ${reference.root}`)
    return emitted
  }

  return { candidate, emit, rejectConstructions, rejectOrdinaryImports, rewriteEffect }
}
