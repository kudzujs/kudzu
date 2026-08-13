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
    sample("build", fixture, target)
  }

  const samples = Object.fromEntries(Object.keys(targets).map(name => [name, { compile: [], build: [] }]))
  const expectedBuild = new Map()
  for (let index = 0; index < runs; index++) for (const [name, target] of orderedTargets(targets, index)) {
    const compile = sample("compile", fixture, target)
    const build = sample("build", fixture, target)
    const previous = expectedBuild.values().next().value
    expectedBuild.set(name, comparableBuild(build))
    if (previous && JSON.stringify(comparableBuild(build)) !== JSON.stringify(previous)) throw new Error(`${name} deploy output differs from the comparison target`)
    samples[name].compile.push(compile)
    samples[name].build.push(build)
  }

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
    output: expectedBuild.values().next().value
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
  const { createProjectSession } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/project-session.mjs")))
  const { createSourceCompiler } = await import(pathToFileURL(join(frameworkRoot, "framework/compiler/source-compiler.mjs")))
  const project = createProjectSession(fixture, { counters, sourceIndex })
  const compiler = createSourceCompiler(project)
  const graphStarted = performance.now()
  const reachable = compiler.reachableSourceFiles(pages, new Set(files), sourceIndex)
  const graphMs = elapsed(graphStarted)
  const reachableSet = new Set(reachable)
  const compileStarted = performance.now()
  const results = reachable.map(file => compiler.compileSource(file, reachableSet, sourceIndex, new Set(), new Map(), ""))
  const compileMs = elapsed(compileStarted)
  const output = JSON.stringify(results.map(result => [result.file, result.componentAnalysis, result.moduleIR, result.buildModule, result.handlerModule]))
  process.stdout.write(JSON.stringify({
    sourceReadMs,
    graphMs,
    compileMs,
    modules: reachable.length,
    resultBytes: Buffer.byteLength(output),
    digest: createHash("sha256").update(output).digest("hex"),
    counters,
    maxRssMiB: rss()
  }))
}

async function sampleBuild(fixture) {
  rmSync(join(fixture, ".kudzu"), { recursive: true, force: true })
  rmSync(join(fixture, "dist"), { recursive: true, force: true })
  const { build } = await import(pathToFileURL(join(frameworkRoot, "framework/build.mjs")))
  const started = performance.now()
  await build({ root: fixture, quiet: true })
  const elapsedMs = elapsed(started)
  const outputRoot = join(fixture, "dist")
  const files = walk(outputRoot)
  const hash = createHash("sha256")
  let bytes = 0
  for (const file of files) {
    const content = readFileSync(file)
    bytes += content.length
    hash.update(relative(outputRoot, file)).update("\0").update(content)
  }
  const plan = JSON.parse(readFileSync(join(fixture, ".kudzu/kudzu-plan.json"), "utf8"))
  process.stdout.write(JSON.stringify({ elapsedMs, files: files.length, pages: plan.routes.length, bytes, digest: hash.digest("hex"), maxRssMiB: rss() }))
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
      compile: summarize(values.compile.map(value => value.compileMs)),
      cleanBuild: summarize(values.build.map(value => value.elapsedMs))
    },
    peakRssMiB: {
      compile: summarize(values.compile.map(value => value.maxRssMiB)),
      cleanBuild: summarize(values.build.map(value => value.maxRssMiB))
    },
    compiler: { counters: values.compile[0].counters, resultBytes: values.compile[0].resultBytes, digest: values.compile[0].digest }
  }
}

function paired(samples) {
  const difference = (phase, field) => samples.candidate[phase].map((value, index) => Number((value[field] - samples.baseline[phase][index][field]).toFixed(1)))
  return { compile: summarize(difference("compile", "compileMs")), cleanBuild: summarize(difference("build", "elapsedMs")) }
}

function orderedTargets(targets, round) {
  const entries = Object.entries(targets)
  return round % 2 ? entries.reverse() : entries
}

function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right)
  return { runs: values, median: sorted[Math.floor(sorted.length / 2)], min: sorted[0], max: sorted.at(-1) }
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
