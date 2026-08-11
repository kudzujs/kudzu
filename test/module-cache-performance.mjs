import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cpus, totalmem } from "node:os"
import { performance } from "node:perf_hooks"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

if (process.argv[2] === "sample") {
  const target = resolve(process.argv[3])
  const projectRoot = resolve("/tmp/kudzu-module-cache-fixture")
  const sourceDirectory = resolve(projectRoot, "src")
  const pages = Array.from({ length: 100 }, (_, index) => resolve(sourceDirectory, "pages", `cache-${index}.tsx`))
  const sourceIndex = new Map([
    [resolve(sourceDirectory, "components/index.tsx"), 'export { Shared } from "./Shared"'],
    [resolve(sourceDirectory, "components/Shared.tsx"), `
import { format } from "../helper"
export function Shared({ item }) {
  return <li><button onClick={() => { document.title = format(item.id) }}>{item.id}</button></li>
}
`],
    [resolve(sourceDirectory, "helper.ts"), "export const format = value => String(value)"]
  ])
  for (const [index, page] of pages.entries()) sourceIndex.set(page, `
import { Shared } from "../components"
import { useState } from "@kudzujs/core"
export default function Page() {
  const [items, setItems] = useState([{ id: ${index} }])
  return <><button onClick={() => setItems([...items])}>Refresh</button><ul>{items.map(item => <Shared key={item.id} item={item} />)}</ul></>
}
`)

  const { createProjectSession } = await import(pathToFileURL(resolve(target, "framework/compiler/project-session.mjs")))
  const { createSourceCompiler } = await import(pathToFileURL(resolve(target, "framework/compiler/source-compiler.mjs")))
  const counters = {}
  const started = performance.now()
  const project = createProjectSession(projectRoot, { counters, sourceIndex })
  const compiler = createSourceCompiler(project)
  const allFiles = new Set(sourceIndex.keys())
  const reachable = compiler.reachableSourceFiles(pages, allFiles, sourceIndex)
  const reachableSet = new Set(reachable)
  const results = reachable.map(file => compiler.compileSource(file, reachableSet, sourceIndex, new Set(), new Map(), ""))
  const elapsed = performance.now() - started
  const output = JSON.stringify(results.map(result => ({
    file: result.file,
    componentAnalysis: result.componentAnalysis,
    moduleIR: result.moduleIR,
    buildModule: result.buildModule,
    handlerModule: result.handlerModule
  })))
  const comparableOutput = JSON.stringify(JSON.parse(output, (key, value) => key === "site" ? undefined : value))
  process.stdout.write(JSON.stringify({
    elapsed: Number(elapsed.toFixed(3)),
    maxRssMiB: Number((process.resourceUsage().maxRSS / 1024).toFixed(1)),
    modules: reachable.length,
    bytes: Buffer.byteLength(comparableOutput),
    digest: createHash("sha256").update(comparableOutput).digest("hex"),
    sourceResultBytes: Buffer.byteLength(output),
    counters
  }))
  process.exit(0)
}

const roots = {
  baseline: resolve(process.env.BASELINE_ROOT || ""),
  candidate: resolve(process.env.CANDIDATE_ROOT || ".")
}
const runs = Number(process.env.RUNS || 21)
const warmups = Number(process.env.WARMUPS || 3)
if (!process.env.BASELINE_ROOT) throw new Error("BASELINE_ROOT is required")
if (!Number.isInteger(runs) || runs < 7) throw new Error("RUNS must be an integer of at least 7")
if (!Number.isInteger(warmups) || warmups < 1) throw new Error("WARMUPS must be a positive integer")

const samples = { baseline: [], candidate: [] }
let expected
function sample(name) {
  const result = spawnSync(process.execPath, [process.argv[1], "sample", roots[name]], { encoding: "utf8", maxBuffer: 1 << 28 })
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout || `${name} sample exited with ${result.signal || result.status}`)
  const value = JSON.parse(result.stdout)
  const output = { modules: value.modules, bytes: value.bytes, digest: value.digest }
  expected ??= output
  if (JSON.stringify(output) !== JSON.stringify(expected)) throw new Error(`${name} output ${JSON.stringify(output)} differs from ${JSON.stringify(expected)}`)
  if (name === "candidate" && JSON.stringify(value.counters) !== JSON.stringify({ parsedModules: 103, exportSummaries: 103, clonedModules: 100 })) throw new Error(`Candidate cache counters differ: ${JSON.stringify(value.counters)}`)
  return value
}

for (let round = 0; round < warmups; round++) for (const name of round % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"]) sample(name)
for (let round = 0; round < runs; round++) {
  for (const name of round % 2 ? ["candidate", "baseline"] : ["baseline", "candidate"]) samples[name].push(sample(name))
}

const median = values => [...values].sort((left, right) => left - right)[Math.floor(values.length / 2)]
const pairedElapsedDifferences = samples.candidate.map((value, index) => Number((value.elapsed - samples.baseline[index].elapsed).toFixed(3)))
const summarize = name => ({
  elapsedMs: {
    runs: samples[name].map(value => value.elapsed),
    median: median(samples[name].map(value => value.elapsed)),
    min: Math.min(...samples[name].map(value => value.elapsed)),
    max: Math.max(...samples[name].map(value => value.elapsed))
  },
  maxRssMiB: {
    runs: samples[name].map(value => value.maxRssMiB),
    median: median(samples[name].map(value => value.maxRssMiB))
  },
  sourceResultBytes: samples[name][0].sourceResultBytes
})

console.log(JSON.stringify({
  fixture: "100 pages sharing one barrel component and helper",
  topology: { importers: 100, uniqueModules: 103, candidateClones: 100 },
  methodology: `${warmups} warm-up${warmups === 1 ? "" : "s"} and ${runs} alternating samples in fresh Node processes; fixture generation and output hashing excluded from timing`,
  environment: { node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1)) },
  output: expected,
  baseline: summarize("baseline"),
  candidate: summarize("candidate"),
  pairedCandidateMinusBaselineMs: {
    runs: pairedElapsedDifferences,
    median: median(pairedElapsedDifferences),
    candidateFaster: pairedElapsedDifferences.filter(value => value < 0).length,
    baselineFaster: pairedElapsedDifferences.filter(value => value > 0).length
  },
  candidateCounters: samples.candidate[0].counters
}, null, 2))
