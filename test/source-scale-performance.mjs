import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { cpus, tmpdir, totalmem } from "node:os"
import { dirname, join, relative, resolve } from "node:path"
import { performance } from "node:perf_hooks"
import { fileURLToPath, pathToFileURL } from "node:url"

const localRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const frameworkRoot = resolve(process.env.TARGET_ROOT || localRoot)

if (process.argv[2] === "sample") {
  const mode = process.argv[3]
  const fixture = resolve(process.argv[4])
  if (mode === "compile") await sampleCompile(fixture)
  else if (mode === "build") await sampleBuild(fixture)
  else if (mode === "changed-build") await sampleChangedBuild(fixture)
  else if (mode === "incremental") await sampleIncremental(fixture)
  else throw new Error(`Unknown sample mode ${JSON.stringify(mode)}`)
  process.exit(0)
}

const routes = integerEnv("ROUTES", 50, 1)
const modulesPerRoute = integerEnv("MODULES_PER_ROUTE", 9, 1)
const fillerLines = integerEnv("FILLER_LINES", 110, 0)
const runs = integerEnv("RUNS", 3, 1)
const warmups = integerEnv("WARMUPS", 1, 0)
const baselineRoot = process.env.BASELINE_ROOT ? resolve(process.env.BASELINE_ROOT) : undefined
const fixture = mkdtempSync(join(tmpdir(), "kudzu-source-scale-"))

try {
  const topology = generateFixture(fixture, { routes, modulesPerRoute, fillerLines })
  if (routes === 50 && topology.modules < 500) throw new Error(`Default fixture must contain at least 500 modules, received ${topology.modules}`)
  if (routes === 50 && topology.lines < 50_000) throw new Error(`Default fixture must contain at least 50,000 lines, received ${topology.lines}`)

  const targets = baselineRoot ? { baseline: baselineRoot, candidate: localRoot } : { candidate: frameworkRoot }
  for (let index = 0; index < warmups; index++) for (const [name, target] of orderedTargets(targets, index)) {
    sample("compile", fixture, target)
    sample("incremental", fixture, target)
    sample("build", fixture, target)
  }

  const samples = Object.fromEntries(Object.keys(targets).map(name => [name, { compile: [], build: [], incremental: [] }]))
  const changedBuilds = new Map(Object.entries(targets).map(([name, target]) => [name, comparableBuild(sample("changed-build", fixture, target))]))
  const expectedBuild = new Map()
  const expectedIncremental = new Map()
  for (let index = 0; index < runs; index++) for (const [name, target] of orderedTargets(targets, index)) {
    const compile = sample("compile", fixture, target)
    const incremental = sample("incremental", fixture, target)
    const build = sample("build", fixture, target)
    const previous = expectedBuild.values().next().value
    const previousIncremental = expectedIncremental.values().next().value
    expectedBuild.set(name, comparableBuild(build))
    expectedIncremental.set(name, comparableBuild(incremental))
    if (previous && JSON.stringify(comparableBuild(build)) !== JSON.stringify(previous)) throw new Error(`${name} deploy output differs from the comparison target`)
    if (previousIncremental && JSON.stringify(comparableBuild(incremental)) !== JSON.stringify(previousIncremental)) throw new Error(`${name} incremental output differs from the comparison target`)
    if (JSON.stringify(comparableBuild(incremental)) !== JSON.stringify(changedBuilds.get(name))) throw new Error(`${name} incremental output differs from a clean build of the changed source`)
    samples[name].compile.push(compile)
    samples[name].incremental.push(incremental)
    samples[name].build.push(build)
  }
  const recovery = verifyRecovery(fixture, frameworkRoot, expectedBuild.get("candidate"))

  console.log(JSON.stringify({
    fixture: "generated source-scale application",
    topology,
    methodology: `${warmups} warm-up${warmups === 1 ? "" : "s"} and ${runs} measured fresh-process samples; fixture generation excluded${baselineRoot ? "; baseline/candidate order alternated" : ""}`,
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1))
    },
    targets: Object.fromEntries(Object.entries(samples).map(([name, values]) => [name, summarizeTarget(values)])),
    ...(baselineRoot ? { pairedCandidateMinusBaselineMs: paired(samples) } : {}),
    recovery,
    output: expectedBuild.values().next().value,
    incrementalOutput: expectedIncremental.values().next().value,
    changedCleanOutput: changedBuilds.values().next().value
  }, null, 2))
} finally {
  rmSync(fixture, { recursive: true, force: true })
}

async function sampleCompile(fixture) {
  const sourceDirectory = join(fixture, "src")
  const readStarted = performance.now()
  const files = walk(sourceDirectory).filter(file => /\.(?:ts|tsx)$/.test(file))
  const pages = files.filter(file => file.startsWith(`${join(sourceDirectory, "pages")}/`) && file.endsWith(".tsx"))
  const sourceIndex = new Map(files.map(file => [file, readFileSync(file, "utf8")]))
  const sourceReadMs = elapsed(readStarted)
  const counters = {}
  const timings = {}
  const { createProjectSession } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/project-session.mjs")))
  const { createSourceCompiler } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/source-compiler.mjs")))
  const project = createProjectSession(fixture, { counters, sourceIndex, timings })
  const compiler = createSourceCompiler(project)
  const graphStarted = performance.now()
  const parseBefore = timings.parseMs ?? 0
  const reachable = compiler.reachableSourceFiles(pages, new Set(files), sourceIndex)
  const graphMs = Number(Math.max(0, performance.now() - graphStarted - ((timings.parseMs ?? 0) - parseBefore)).toFixed(1))
  const reachableSet = new Set(reachable)
  const compileStarted = performance.now()
  const compileParseBefore = timings.parseMs ?? 0
  const normalizeBefore = timings.normalizeMs ?? 0
  const results = reachable.map(file => compiler.compileSource(file, reachableSet, sourceIndex, new Set(), new Map(), ""))
  const compileMs = Number(Math.max(0, performance.now() - compileStarted - ((timings.parseMs ?? 0) - compileParseBefore) - ((timings.normalizeMs ?? 0) - normalizeBefore)).toFixed(1))
  const output = JSON.stringify(results.map(result => [result.file, result.componentAnalysis, result.moduleIR, result.buildModule, result.handlerModule]))
  process.stdout.write(JSON.stringify({
    sourceReadMs,
    graphMs,
    compileMs,
    modules: reachable.length,
    resultBytes: Buffer.byteLength(output),
    digest: createHash("sha256").update(output).digest("hex"),
    counters,
    timings: roundedTimings(timings),
    maxRssMiB: rss()
  }))
}

async function sampleBuild(fixture) {
  rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
  rmSync(join(fixture, "dist"), { recursive: true, force: true })
  const timings = {}
  const { createProjectSession } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/project-session.mjs")))
  const { buildWithSession } = await import(pathToFileURL(join(frameworkRoot, "framework/build.mjs")))
  const project = createProjectSession(fixture, { timings })
  const started = performance.now()
  await buildWithSession(project, { quiet: true, retainCache: false })
  const elapsedMs = elapsed(started)
  const output = outputSnapshot(join(fixture, "dist"))
  const plan = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-plan.json"), "utf8"))
  process.stdout.write(JSON.stringify({ elapsedMs, ...output, pages: plan.routes.length, timings: roundedTimings(timings), maxRssMiB: rss() }))
}

async function sampleChangedBuild(fixture) {
  const changed = changedSource(fixture)
  const source = readFileSync(changed, "utf8")
  writeFileSync(changed, source.replace("Route 0", "Route 0 updated"))
  try {
    await sampleBuild(fixture)
  } finally {
    writeFileSync(changed, source)
  }
}

async function sampleIncremental(fixture) {
  rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
  rmSync(join(fixture, "dist"), { recursive: true, force: true })
  const timings = {}
  const { createProjectSession } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/project-session.mjs")))
  const { buildWithSession } = await import(pathToFileURL(join(frameworkRoot, "framework/build.mjs")))
  const project = createProjectSession(fixture, { timings })
  await buildWithSession(project, { quiet: true, retainCache: true })
  for (const name of Object.keys(timings)) delete timings[name]
  const changed = changedSource(fixture)
  const source = readFileSync(changed, "utf8")
  writeFileSync(changed, source.replace("Route 0", "Route 0 updated"))
  try {
    const started = performance.now()
    const result = await buildWithSession(project, { changedFiles: [changed], quiet: true, retainCache: true })
    const elapsedMs = elapsed(started)
    const output = outputSnapshot(join(fixture, "dist"))
    const plan = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-plan.json"), "utf8"))
    const maxRssMiB = rss()
    const incrementalTimings = roundedTimings(timings)
    const page = join(fixture, "src/pages/scale-0.tsx")
    const pageSource = readFileSync(page, "utf8")
    writeFileSync(page, "export default function Page( {\n")
    let failed = false
    try {
      await buildWithSession(project, { changedFiles: [page], quiet: true, retainCache: true })
    } catch {
      failed = true
    } finally {
      writeFileSync(page, pageSource)
    }
    if (!failed || outputSnapshot(join(fixture, "dist")).digest !== output.digest) throw new Error("Failed retained-session build did not preserve deploy output")
    await buildWithSession(project, { changedFiles: [page], quiet: true, retainCache: true })
    if (outputSnapshot(join(fixture, "dist")).digest !== output.digest) throw new Error("Retained session did not recover after source restoration")
    process.stdout.write(JSON.stringify({ elapsedMs, ...output, pages: plan.routes.length, timings: incrementalTimings, incremental: result.incremental, recovery: { passed: true }, maxRssMiB }))
  } finally {
    writeFileSync(changed, source)
  }
}

function changedSource(fixture) {
  const changed = walk(join(fixture, "src/features/route-0")).find(file => file.endsWith(".ts") && readFileSync(file, "utf8").includes('"Route 0"'))
  if (!changed) throw new Error("Incremental source target was not found")
  return changed
}

function generateFixture(root, options) {
  mkdirSync(join(root, "src/pages"), { recursive: true })
  mkdirSync(join(root, "src/features"), { recursive: true })
  mkdirSync(join(root, "node_modules/@kudzujs"), { recursive: true })
  symlinkSync(frameworkRoot, join(root, "node_modules/@kudzujs/core"), "dir")
  writeFileSync(join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", jsx: "react-jsx", jsxImportSource: "@kudzujs/core", strict: true }, include: ["src"] }))
  let lines = 0
  for (let route = 0; route < options.routes; route++) {
    for (let module = options.modulesPerRoute - 1; module >= 0; module--) {
      const next = module === options.modulesPerRoute - 1 ? JSON.stringify(`Route ${route}`) : `label${module + 1}`
      const imports = module === options.modulesPerRoute - 1 ? [] : [`import { label${module + 1} } from "./module-${module + 1}"`]
      const filler = Array.from({ length: options.fillerLines }, (_, index) => `export const value${module}_${index} = ${route * 100_000 + module * 1_000 + index}`)
      lines += writeSource(join(root, "src/features", `route-${route}`, `module-${module}.ts`), [...imports, `export const label${module} = ${next}`, ...filler])
    }
    lines += writeSource(join(root, "src/pages", `scale-${route}.tsx`), [
      `import { label0 } from "../features/route-${route}/module-0"`,
      "export default function Page() {",
      `  return <main data-route="${route}"><h1>{label0}</h1></main>`,
      "}"
    ])
  }
  return { routes: options.routes, importedModules: options.routes * options.modulesPerRoute, modules: options.routes * (options.modulesPerRoute + 1), lines }
}

function writeSource(file, lines) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, `${lines.join("\n")}\n`)
  return lines.length
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) walk(file, files)
    else if (entry.isFile() || lstatSync(file).isSymbolicLink()) files.push(file)
  }
  return files.sort()
}

function sample(mode, fixture, target = frameworkRoot) {
  rmSync(join(fixture, "node_modules/@kudzujs/core"), { recursive: true, force: true })
  symlinkSync(target, join(fixture, "node_modules/@kudzujs/core"), "dir")
  const result = spawnSync(process.execPath, [process.argv[1], "sample", mode, fixture], { encoding: "utf8", env: { ...process.env, TARGET_ROOT: target }, maxBuffer: 1 << 29 })
  if (result.error || result.signal || result.status !== 0) throw result.error || new Error(result.stderr || result.stdout || `${mode} sample exited with ${result.signal || result.status}`)
  return JSON.parse(result.stdout)
}

function comparableBuild(value) {
  return { files: value.files, pages: value.pages, bytes: value.bytes, digest: value.digest }
}

function summarizeTarget(values) {
  return {
    phasesMs: {
      sourceRead: summarize(values.compile.map(value => value.sourceReadMs)),
      reachableGraph: summarize(values.compile.map(value => value.graphMs)),
      parse: summarizeOptional(values.compile.map(value => value.timings.parseMs)),
      normalize: summarizeOptional(values.compile.map(value => value.timings.normalizeMs)),
      compile: summarize(values.compile.map(value => value.compileMs)),
      render: summarizeOptional(values.build.map(value => value.timings.renderMs)),
      write: summarizeOptional(values.build.map(value => value.timings.writeMs)),
      cleanBuild: summarize(values.build.map(value => value.elapsedMs)),
      incrementalBuild: summarize(values.incremental.map(value => value.elapsedMs))
    },
    peakRssMiB: {
      compile: summarize(values.compile.map(value => value.maxRssMiB)),
      cleanBuild: summarize(values.build.map(value => value.maxRssMiB))
    },
    compiler: { counters: values.compile[0].counters, resultBytes: values.compile[0].resultBytes, digest: values.compile[0].digest },
    incremental: { compiledModules: values.incremental.map(value => value.incremental.compiledModules), renderedPages: values.incremental.map(value => value.incremental.renderedPages), recovery: values.incremental.map(value => value.recovery.passed), retainedSessionPeakRssMiB: summarize(values.incremental.map(value => value.maxRssMiB)) }
  }
}

function paired(samples) {
  const difference = (phase, field) => samples.candidate[phase].map((value, index) => Number((value[field] - samples.baseline[phase][index][field]).toFixed(1)))
  return { compile: summarize(difference("compile", "compileMs")), cleanBuild: summarize(difference("build", "elapsedMs")), incrementalBuild: summarize(difference("incremental", "elapsedMs")) }
}

function verifyRecovery(fixture, target, expected) {
  rmSync(join(fixture, "node_modules/@kudzujs/core"), { recursive: true, force: true })
  symlinkSync(target, join(fixture, "node_modules/@kudzujs/core"), "dir")
  const page = join(fixture, "src/pages/scale-0.tsx")
  const source = readFileSync(page, "utf8")
  writeFileSync(page, "export default function Page( {\n")
  let failed
  try {
    failed = spawnSync(process.execPath, [join(target, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8", timeout: 1_200_000 })
  } finally {
    writeFileSync(page, source)
  }
  if (failed.error || failed.signal || failed.status === 0) throw failed.error || new Error("Failure-recovery probe unexpectedly built invalid source")
  const preserved = outputSnapshot(join(fixture, "dist"))
  const recovered = spawnSync(process.execPath, [join(target, "bin/kudzu.mjs"), "build"], { cwd: fixture, encoding: "utf8", timeout: 1_200_000 })
  if (recovered.error || recovered.signal || recovered.status !== 0) throw recovered.error || new Error(recovered.stderr || recovered.stdout)
  const final = outputSnapshot(join(fixture, "dist"))
  const passed = preserved.digest === expected.digest && final.digest === expected.digest
  if (!passed) throw new Error(`Failure recovery changed deploy output ${expected.digest} -> ${preserved.digest} -> ${final.digest}`)
  return { passed, failedStatus: failed.status, preservedDigest: preserved.digest, recoveredDigest: final.digest }
}

function outputSnapshot(outputRoot) {
  const files = walk(outputRoot)
  const hash = createHash("sha256")
  let bytes = 0
  for (const file of files) {
    const content = readFileSync(file)
    bytes += content.length
    hash.update(relative(outputRoot, file)).update("\0").update(content)
  }
  return { files: files.length, bytes, digest: hash.digest("hex") }
}

function roundedTimings(timings) {
  return Object.fromEntries(Object.entries(timings).map(([name, value]) => [name, Number(value.toFixed(1))]))
}

function orderedTargets(targets, round) {
  const entries = Object.entries(targets)
  return round % 2 ? entries.reverse() : entries
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1) }
}

function summarizeOptional(values) {
  return values.every(Number.isFinite) ? summarize(values) : null
}

function integerEnv(name, fallback, minimum) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value < minimum) throw new Error(`${name} must be an integer of at least ${minimum}`)
  return value
}

function elapsed(started) {
  return Number((performance.now() - started).toFixed(1))
}

function rss() {
  return Number((process.resourceUsage().maxRSS / 1024).toFixed(1))
}
