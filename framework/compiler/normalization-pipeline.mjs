import ts from "typescript"

export function applyNormalizationPasses(sourceFile, passes) {
  // Passes treat their input root as immutable and return the SourceFile used by the next pass.
  for (const [index, pass] of passes.entries()) {
    const next = pass(sourceFile)
    if (!next || !ts.isSourceFile(next)) throw new TypeError(`Normalization pass ${index + 1} must return a TypeScript SourceFile`)
    if (next !== sourceFile) ts.setParentRecursive(next, false)
    sourceFile = next
  }
  return sourceFile
}
