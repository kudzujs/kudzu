import ts from "typescript"

export const compatibilityClasses = Object.freeze([
  "Native",
  "Compiled",
  "Normalized",
  "Adapter",
  "Owned External UI",
  "Partial",
  "Unsupported"
])

export const compatibilityPackages = Object.freeze({
  clsx: "clsx",
  react: "react",
  reactBootstrap: "react-bootstrap",
  reactI18next: "react-i18next",
  reactRouter: "react-router-dom",
  zustand: "zustand"
})

const compiledReact = new Set(["default", "*", "Fragment", "createContext", "useContext", "useEffect", "useId", "useReducer", "useRef", "useState"])
const normalizedReact = new Set(["createRef", "forwardRef", "memo", "useCallback", "useMemo", "useSyncExternalStore"])
const normalizedRouter = new Set(["useMatch", "useParams", "useSearchParams"])
const ownedExternalUi = new Set(["@codemirror/view", "chart.js", "gsap", "sortablejs", "typed.js"])

export function createCompatibilityReport(sources) {
  const sites = sources.flatMap(({ file, source }) => compatibilitySites(file, source)).sort(compareSites)
  const counts = Object.fromEntries(compatibilityClasses.map(name => [name, 0]))
  const packages = new Map()
  for (const site of sites) {
    counts[site.classification]++
    const key = `${site.package}\0${site.classification}`
    packages.set(key, { package: site.package, classification: site.classification, sites: (packages.get(key)?.sites ?? 0) + 1 })
  }
  return {
    version: 1,
    summary: counts,
    packages: [...packages.values()].sort((left, right) => compareText(left.package, right.package) || compareText(left.classification, right.classification)),
    sites
  }
}

function compatibilitySites(file, source) {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const sites = []
  const add = (target, imported, local, kind, node) => {
    if (!isBarePackage(target) || target === "@kudzujs/core" || target.startsWith("@kudzujs/core/")) return
    const rule = classify(target, imported, kind)
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())
    sites.push({
      package: target,
      imported,
      ...(local && local !== imported ? { local } : {}),
      kind,
      classification: rule.classification,
      rule: rule.id,
      file,
      location: { line: start.line + 1, column: start.character + 1, endLine: end.line + 1, endColumn: end.character + 1 }
    })
  }
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = node.moduleSpecifier.text
      const clause = node.importClause
      if (!clause?.isTypeOnly) {
        if (!clause) add(target, null, null, "side-effect-import", node.moduleSpecifier)
        if (clause?.name) add(target, "default", clause.name.text, "import", clause.name)
        const bindings = clause?.namedBindings
        if (bindings && ts.isNamespaceImport(bindings)) add(target, "*", bindings.name.text, "import", bindings.name)
        if (bindings && ts.isNamedImports(bindings)) for (const entry of bindings.elements) {
          if (!entry.isTypeOnly) add(target, (entry.propertyName ?? entry.name).text, entry.name.text, "import", entry)
        }
      }
      return
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const target = node.moduleSpecifier.text
      const clause = node.exportClause
      if (!node.isTypeOnly) {
        if (!clause || ts.isNamespaceExport(clause)) add(target, "*", null, "re-export", clause ?? node.moduleSpecifier)
        else for (const entry of clause.elements) if (!entry.isTypeOnly) add(target, (entry.propertyName ?? entry.name).text, entry.name.text, "re-export", entry)
      }
      return
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      add(node.arguments[0].text, "*", null, "dynamic-import", node.arguments[0])
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return sites
}

function classify(target, imported, kind) {
  if (kind === "re-export") return { id: "package.re-export.unsupported", classification: "Unsupported" }
  if (kind === "side-effect-import") return { id: "package.side-effect.unsupported", classification: "Unsupported" }
  const root = packageRoot(target)
  if (kind === "dynamic-import") return { id: "package.dynamic.partial", classification: "Partial" }
  if (target === compatibilityPackages.react) {
    if (compiledReact.has(imported)) return { id: "react.compiled", classification: "Compiled" }
    if (normalizedReact.has(imported)) return { id: "react.normalized", classification: "Normalized" }
    return { id: "react.partial", classification: "Partial" }
  }
  if (target === compatibilityPackages.reactRouter) {
    if (imported === "Link" || imported === "useNavigate") return { id: "react-router-dom.native", classification: "Native" }
    if (normalizedRouter.has(imported)) return { id: "react-router-dom.normalized", classification: "Normalized" }
    return { id: "react-router-dom.partial", classification: "Partial" }
  }
  if (target === compatibilityPackages.reactBootstrap) return ["Row", "Col"].includes(imported)
    ? { id: "react-bootstrap.normalized", classification: "Normalized" }
    : { id: "react-bootstrap.partial", classification: "Partial" }
  if (target === compatibilityPackages.zustand) return imported === "create"
    ? { id: "zustand.adapter", classification: "Adapter" }
    : { id: "zustand.partial", classification: "Partial" }
  if (target === compatibilityPackages.clsx) return ["default", "clsx"].includes(imported)
    ? { id: "clsx.normalized", classification: "Normalized" }
    : { id: "clsx.partial", classification: "Partial" }
  if (target === compatibilityPackages.reactI18next) return { id: "react-i18next.unsupported", classification: "Unsupported" }
  if (ownedExternalUi.has(root)) return { id: "owned-external-ui", classification: "Owned External UI" }
  return { id: "package.contextual", classification: "Partial" }
}

function packageRoot(target) {
  const parts = target.split("/")
  return target.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]
}

function isBarePackage(target) {
  return !target.startsWith(".") && !target.startsWith("/") && !target.startsWith("node:") && !/^[a-z][a-z+.-]*:/i.test(target)
}

function compareSites(left, right) {
  return compareText(left.file, right.file) || left.location.line - right.location.line || left.location.column - right.location.column || compareText(left.package, right.package) || compareText(String(left.imported), String(right.imported))
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
