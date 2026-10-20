import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import { cpus, loadavg, tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const workspace = join(root, "benchmarks/runtime-matrix")
const results = join(root, "c2-registration-results")
const scratch = await mkdtemp(join(tmpdir(), "c2-binding-descriptors-"))
await mkdir(results)
const original = await readFile(join(workspace, "run.mjs"), "utf8")
const runtime = await readFile(join(root, "framework/binding-runtime.js"), "utf8")
const replace = (source, before, after) => {
  assert.equal(source.split(before).length, 2, `Expected one source anchor: ${before}`)
  return source.replace(before, after)
}
let candidate = replace(runtime, "const mountedBindings = new WeakSet()\n", "")
assert.equal(candidate.split("mountedBindings.has(node)").length, 3)
assert.equal(candidate.match(/^\s*mountedBindings\.(add|delete)\(node\)\n/gm)?.length, 4)
candidate = candidate.replaceAll("mountedBindings.has(node)", "bindingRegistrations.has(node)").replace(/^\s*mountedBindings\.(add|delete)\(node\)\n/gm, "\n")
candidate = replace(candidate, "bindingRegistrations.delete(binding.node)", "bindingRegistrations.set(binding.node, undefined)")
const sha256 = value => createHash("sha256").update(value).digest("hex")
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
assert.equal(execFileSync("git", ["diff", "v0.17.0", "--", "framework", "bin", "package.json", "package-lock.json"], { cwd: root, encoding: "utf8" }), "", "Freeze the released production baseline")
const version = JSON.parse(await readFile(join(root, "package.json"))).version
const protocol = {
  commit, baseline: "Released 0.17.0 production sources; candidate is scratch-only",
  runnerSha256: sha256(original), runtimeSha256: sha256(runtime), candidateSha256: sha256(candidate),
  change: "Use registration WeakMap membership instead of duplicate mounted WeakSet; release retains an undefined tombstone until DOM unmount",
  primary: "rowRestore", profiles: 21, buildWarmups: 1, measuredBuilds: 7,
  hypothesis: "Reduce duplicate ownership bookkeeping and shipped bytes while preserving release/remount semantics. Size adoption requires both raw and gzip reduction and no established operation regression; speed is reported separately.",
  order: "Alternate baseline/candidate order each round; fresh browser profile per sample",
  acceptance: "Unchanged full C2 journey, identity, cleanup, accessibility, resilience, static siblings",
  decision: "Size gate: raw and gzip decrease, unchanged plan/HTML, full acceptance and lifetime regression pass; reject any operation with >5% median loss and >=16/21 slower pairs. Separate speed gate: >=5% primary median improvement, negative paired median, >=16/21 faster pairs.",
  environment: "One GitHub-hosted VM, not a claim of dedicated physical hardware or cross-framework superiority",
  launchChange: "--no-sandbox added identically to both arms for the hosted Linux runner",
  initialLoad: loadavg(), cpu: cpus().map(cpu => cpu.model)
}
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))
await writeFile(join(results, "baseline-binding-runtime.js"), runtime)
await writeFile(join(results, "candidate-binding-runtime.js"), candidate)

try {
  for (const arm of ["baseline", "candidate"]) {
    const compiler = join(scratch, arm)
    await mkdir(join(compiler, "fixture"), { recursive: true })
    for (const path of ["framework", "bin", "package.json"]) await cp(join(root, path), join(compiler, path), { recursive: true })
    await symlink(join(root, "node_modules"), join(compiler, "node_modules"))
    await cp(join(workspace, "kudzu/src"), join(compiler, "fixture/src"), { recursive: true })
    await cp(join(workspace, "kudzu/tsconfig.json"), join(compiler, "fixture/tsconfig.json"))
    if (arm === "candidate") await writeFile(join(compiler, "framework/binding-runtime.js"), candidate)
    await mkdir(join(compiler, "test"))
    await cp(join(root, "test/binding-lifetime.test.mjs"), join(compiler, "test/binding-lifetime.test.mjs"))
    const log = execFileSync(process.execPath, ["--test", "test/binding-lifetime.test.mjs"], { cwd: compiler, encoding: "utf8", timeout: 15000 })
    await writeFile(join(results, `${arm}-regression.log`), log)
  }
  const targets = ["baseline", "candidate"].map(id => ({ id, label: id, architecture: "pre-rendered HTML with route capabilities", compiler: join(scratch, id), root: join(scratch, id, "fixture"), dist: join(scratch, id, "fixture/dist") }))
  let runner = replace(original, "const workspace = dirname(fileURLToPath(import.meta.url))", `const workspace = ${JSON.stringify(workspace)}`)
  runner = replace(runner, 'const resultsDirectory = join(workspace, "results")', `const resultsDirectory = ${JSON.stringify(results)}`)
  const targetBlock = runner.match(/const targets = \[[\s\S]*?\n\]/)?.[0]
  assert.ok(targetBlock)
  runner = replace(runner, targetBlock, `const targets = ${JSON.stringify(targets)}`)
  runner = runner.replaceAll('target.id === "kudzu"', 'target.id !== "react"')
  runner = replace(runner, 'join(root, "bin/kudzu.mjs"), "build"', 'join(target.compiler, "bin/kudzu.mjs"), "build"')
  runner = replace(runner, "await requireFiles()", 'await access(join(root, "bin/kudzu.mjs"), constants.R_OK)')
  runner = replace(runner, "const versions = await frameworkVersions()", `const versions = ${JSON.stringify({ kudzu: version, baseline: version, candidate: version })}`)
  runner = replace(runner, '["--headless=new","--remote-debugging-port=0"', '["--headless=new","--no-sandbox","--remote-debugging-port=0"')
  runner = replace(runner, "        samples[target.id].push(sample)", `        samples[target.id].push(sample)
        await writeFile(join(resultsDirectory, "progress.json"), JSON.stringify({ samples, load: loadavg() }))`)
  runner = 'import { loadavg } from "node:os"\n' + runner
  await writeFile(join(results, "runner.mjs"), runner)
  execFileSync(process.execPath, [join(results, "runner.mjs")], { cwd: root, env: { ...process.env, BENCHMARK_PROFILES: "21" }, stdio: "inherit", timeout: 900000 })
  const report = JSON.parse(await readFile(join(results, "raw.json")))
  const median = values => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
  const operations = Object.fromEntries(Object.keys(report.targets.baseline.browser.operations).map(name => {
    const a = report.targets.baseline.browser.operations[name], b = report.targets.candidate.browser.operations[name]
    assert.equal(a.samples.length, 21)
    assert.equal(b.samples.length, 21)
    return [name, { baseline: a.median, candidate: b.median, relativeChange: b.median / a.median - 1, pairedMedian: median(b.samples.map((value, i) => value - a.samples[i])), faster: b.samples.filter((value, i) => value < a.samples[i]).length, slower: b.samples.filter((value, i) => value > a.samples[i]).length }]
  }))
  const primary = operations[protocol.primary]
  const regressions = Object.entries(operations).filter(([, value]) => value.relativeChange > .05 && value.slower >= 16).map(([name]) => name)
  const speedAccepted = primary.relativeChange <= -.05 && primary.pairedMedian < 0 && primary.faster >= 16 && !regressions.length
  const javascript = Object.fromEntries(Object.entries(report.targets).map(([id, target]) => [id, target.artifacts.js]))
  const accepted = javascript.candidate.raw < javascript.baseline.raw && javascript.candidate.gzip < javascript.baseline.gzip && !regressions.length
  const summary = { accepted, speedAccepted, primary, regressions, operations, finalLoad: loadavg(), javascript }
  for (const arm of ["baseline", "candidate"]) {
    await cp(join(scratch, arm, "fixture/dist"), join(results, `${arm}-dist`), { recursive: true })
    await cp(join(scratch, arm, "fixture/.kudzu/kudzu-plan.json"), join(results, `${arm}-plan.json`))
  }
  assert.equal(await readFile(join(results, "baseline-plan.json"), "utf8"), await readFile(join(results, "candidate-plan.json"), "utf8"))
  const files = async arm => (await readdir(join(results, `${arm}-dist`), { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(join(results, `${arm}-dist`).length + 1)).sort()
  const baselineFiles = await files("baseline")
  assert.deepEqual(baselineFiles, await files("candidate"))
  const changed = []
  for (const path of baselineFiles) if (!(await readFile(join(results, "baseline-dist", path))).equals(await readFile(join(results, "candidate-dist", path)))) changed.push(path)
  assert.equal(changed.length, 1)
  assert.match(changed[0], /\/kudzu-binding\.js$/)
  summary.changedFiles = changed
  await writeFile(join(results, "decision.json"), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
} catch (error) {
  await writeFile(join(results, "failure.json"), JSON.stringify({ error: error.stack, stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? ""), load: loadavg() }, null, 2))
  throw error
}
