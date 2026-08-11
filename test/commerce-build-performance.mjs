import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readFileSync, readlinkSync, readdirSync, rmSync, symlinkSync } from "node:fs"
import { performance } from "node:perf_hooks"
import { join, relative, resolve } from "node:path"

const app = resolve(process.env.APP_ROOT || "")
const baseline = resolve(process.env.BASELINE_ROOT || "")
const candidate = resolve(process.env.CANDIDATE_ROOT || ".")
const runs = Number(process.env.RUNS || 21)
const catalogSize = String(process.env.CATALOG_SIZE || 1000)
const preserveOutput = process.env.PRESERVE_OUTPUT === "1"
const expectedChanges = (process.env.EXPECTED_CHANGES || "").split(",").filter(Boolean).sort()
const coreLink = resolve(app, "node_modules/@kudzujs/core")
const outputRoot = resolve(app, "dist")

if (!process.env.APP_ROOT || !process.env.BASELINE_ROOT) throw new Error("APP_ROOT and BASELINE_ROOT are required")
if (!existsSync(resolve(app, "scripts/gen-catalog.mjs")) || !existsSync(resolve(baseline, "bin/kudzu.mjs")) || !existsSync(resolve(candidate, "bin/kudzu.mjs"))) throw new Error("Benchmark app or Kudzu root is missing")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")

const generated = spawnSync(process.execPath, [resolve(app, "scripts/gen-catalog.mjs")], { cwd: app, encoding: "utf8", env: { ...process.env, OTW_CATALOG_SIZE: catalogSize } })
if (generated.error || generated.signal || generated.status !== 0) throw generated.error || new Error(generated.stderr || generated.stdout || `catalog generation exited with ${generated.signal || generated.status}`)

const originalLink = readlinkSync(coreLink)
const roots = { baseline, candidate }
const timings = { baseline: [], candidate: [] }
let expectedOutput
let expectedManifest
let restored = false
let outputBytes = 0

function restore() {
  if (restored) return
  rmSync(coreLink, { recursive: true, force: true })
  symlinkSync(originalLink, coreLink, "dir")
  restored = true
}

for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  restore()
  process.kill(process.pid, signal)
})

function outputManifest(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) outputManifest(path, files)
    else {
      const bytes = readFileSync(path)
      outputBytes += bytes.length
      files.push([relative(outputRoot, path), createHash("sha256").update(bytes).digest("hex")])
    }
  }
  return files
}

function build(name) {
  rmSync(coreLink, { recursive: true, force: true })
  symlinkSync(roots[name], coreLink, "dir")
  if (!preserveOutput) rmSync(outputRoot, { recursive: true, force: true })
  rmSync(resolve(app, ".kudzu"), { recursive: true, force: true })
  const start = performance.now()
  const result = spawnSync(process.execPath, [resolve(roots[name], "bin/kudzu.mjs"), "build"], { cwd: app, encoding: "utf8", maxBuffer: 1 << 28 })
  const elapsed = Number((performance.now() - start).toFixed(1))
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout || `build exited with ${result.signal || result.status}`)
  outputBytes = 0
  const manifest = new Map(outputManifest(outputRoot))
  const output = { files: manifest.size, pages: [...manifest.keys()].filter(file => file.endsWith(".html")).length, bytes: outputBytes }
  expectedOutput ??= output
  if (output.files !== expectedOutput.files || output.pages !== expectedOutput.pages || output.bytes !== expectedOutput.bytes) throw new Error(`${name} output ${JSON.stringify(output)} differs from baseline ${JSON.stringify(expectedOutput)}`)
  expectedManifest ??= manifest
  const changed = [...manifest].filter(([file, hash]) => expectedManifest.get(file) !== hash).map(([file]) => file).sort()
  const allowed = name === "candidate" ? expectedChanges : []
  if ([...expectedManifest.keys()].some(file => !manifest.has(file)) || JSON.stringify(changed) !== JSON.stringify(allowed)) throw new Error(`${name} output differs from baseline at ${JSON.stringify(changed)}; expected ${JSON.stringify(allowed)}`)
  return elapsed
}

try {
  build("baseline")
  build("candidate")
  for (let round = 0; round < runs; round++) {
    for (const name of round % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"]) timings[name].push(build(name))
  }
  const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
  console.log(JSON.stringify({
    fixture: `${catalogSize}-product kudzu-based-bench storefront`,
    methodology: `one warm-up and ${runs} alternating ${preserveOutput ? "replacement" : "clean"} builds`,
    output: { ...expectedOutput, candidateChanges: expectedChanges },
    timings,
    medians: { baseline: median(timings.baseline), candidate: median(timings.candidate) }
  }, null, 2))
} finally {
  restore()
}
