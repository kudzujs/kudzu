import ts from "typescript"

export function applyNormalizationPasses(sourceFile, passes) {
  for (const pass of passes) {
    const next = pass(sourceFile)
    if (next !== sourceFile) ts.setParentRecursive(next, false)
    sourceFile = next
  }
  return sourceFile
}
