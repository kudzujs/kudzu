import ts from "typescript"

export function applyNormalizationPasses(sourceFile, passes) {
  for (const pass of passes) {
    sourceFile = pass(sourceFile)
    ts.setParentRecursive(sourceFile, false)
  }
  return sourceFile
}
