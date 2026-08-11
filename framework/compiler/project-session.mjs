import { join, resolve } from "node:path"
import { assetPath } from "./path-helpers.mjs"
import { createSourceGraph } from "./source-graph.mjs"
import { createWorkerCompiler } from "./worker-compiler.mjs"

export function createProjectSession(projectRoot = process.cwd()) {
  const root = resolve(projectRoot)
  const sourceDirectory = join(root, "src")
  const graph = createSourceGraph(root)
  return {
    root,
    sourceDirectory,
    pagesDirectory: join(sourceDirectory, "pages"),
    workDirectory: join(root, ".kudzu"),
    outputDirectory: join(root, "dist"),
    sourceIndex: new Map(),
    sourceFiles: new Set(),
    graph,
    workerCompiler: createWorkerCompiler({ root, sourceDirectory, assetPath, ...graph })
  }
}
