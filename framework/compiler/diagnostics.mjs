import { isAbsolute, relative, sep } from "node:path"

export class KudzuDiagnosticError extends Error {
  constructor(diagnostics) {
    super(diagnostics.map(formatDiagnostic).join("\n"))
    this.diagnostics = diagnostics
  }
}

export function createDiagnosticError(diagnostic) {
  return new KudzuDiagnosticError([{
    code: "source.unsupported",
    stage: "analyze",
    severity: "error",
    compatibilityClass: null,
    suggestion: null,
    ...diagnostic,
  }])
}

export function createTypeScriptDiagnosticError(errors, flattenMessage) {
  return new KudzuDiagnosticError(errors.map(error => {
    const sourceFile = error.file
    const startOffset = error.start ?? 0
    const endOffset = startOffset + (error.length ?? 0)
    const start = sourceFile?.getLineAndCharacterOfPosition(startOffset)
    const end = sourceFile?.getLineAndCharacterOfPosition(endOffset)
    return {
      code: "source.syntax.invalid",
      stage: "analyze",
      severity: "error",
      compatibilityClass: null,
      suggestion: null,
      message: flattenMessage(error.messageText),
      ...(sourceFile && start && end ? { source: {
        file: sourceFile.fileName,
        start: { line: start.line + 1, column: start.character + 1, offset: startOffset },
        end: { line: end.line + 1, column: end.character + 1, offset: endOffset },
      } } : {}),
    }
  }))
}

export function normalizeDiagnosticError(error, root) {
  if (!(error instanceof KudzuDiagnosticError)) return error
  const normalized = new KudzuDiagnosticError(error.diagnostics.map(diagnostic => ({
    ...diagnostic,
    source: diagnostic.source && {
      ...diagnostic.source,
      file: normalizeFile(diagnostic.source.file, root),
    },
  })))
  normalized.message = error.message
  return normalized
}

export function diagnosticEnvelope(error) {
  if (!(error instanceof KudzuDiagnosticError)) return undefined
  return { version: 1, diagnostics: error.diagnostics }
}

function normalizeFile(file, root) {
  if (!isAbsolute(file)) return file.replaceAll(sep, "/")
  const path = relative(root, file)
  return (path.startsWith("..") ? file : path).replaceAll(sep, "/")
}

function formatDiagnostic(diagnostic) {
  const start = diagnostic.source?.start
  const location = diagnostic.source ? `${diagnostic.source.file}${start ? `:${start.line}:${start.column}` : ""} ` : ""
  return `${location}${diagnostic.message}`
}
