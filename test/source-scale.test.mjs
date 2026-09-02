import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import test from "node:test"

test("generates and measures a deterministic source-scale application", () => {
  const result = spawnSync(process.execPath, [new URL("./source-scale-performance.mjs", import.meta.url).pathname], {
    encoding: "utf8",
    env: { ...process.env, ROUTES: "2", MODULES_PER_ROUTE: "2", FILLER_LINES: "5", RUNS: "2", WARMUPS: "0" },
    maxBuffer: 1 << 24
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(result.stdout)
  assert.deepEqual(report.topology, { routes: 2, importedModules: 4, modules: 6, lines: 34 })
  assert.deepEqual(report.targets.candidate.compiler.counters, { parsedModules: 4, exportSummaries: 4, plainModules: 4 })
  assert.equal(report.output.pages, 2)
  assert.deepEqual(Object.keys(report.targets.candidate.phasesMs), ["sourceRead", "reachableGraph", "parse", "normalize", "compile", "render", "write", "cleanBuild", "incrementalBuild"])
  assert.equal(report.targets.candidate.phasesMs.compile.runs.length, 2)
  assert.equal(report.targets.candidate.peakRssMiB.cleanBuild.runs.length, 2)
  assert.deepEqual(report.targets.candidate.incremental.compiledModules, [3, 3])
  assert.deepEqual(report.targets.candidate.incremental.renderedPages, [1, 1])
  assert.deepEqual(report.targets.candidate.incremental.recovery, [true, true])
  assert.equal(report.targets.candidate.incremental.retainedSessionPeakRssMiB.runs.length, 2)
  assert.notEqual(report.incrementalOutput.digest, report.output.digest)
  assert.deepEqual(report.incrementalOutput, report.changedCleanOutput)
  assert.equal(report.recovery.passed, true)
  assert.equal(report.recovery.preservedDigest, report.output.digest)
  assert.equal(report.recovery.recoveredDigest, report.output.digest)
})
