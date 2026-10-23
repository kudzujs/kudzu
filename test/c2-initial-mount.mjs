import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import { loadavg, tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const workspace = join(root, "benchmarks/runtime-matrix")
const results = join(root, "c2-initial-mount-results")
const scratch = await mkdtemp(join(tmpdir(), "c2-initial-mount-"))
await mkdir(results)
const original = await readFile(join(workspace, "run.mjs"), "utf8")
const replace = (source, before, after) => {
  assert.equal(source.split(before).length, 2, before)
  return source.replace(before, after)
}
const sha256 = value => createHash("sha256").update(value).digest("hex")
const revisions = { baseline: "v0.17.3", candidate: "v0.17.4" }
for (const tag of Object.values(revisions)) assert.equal(execFileSync("git", ["diff", tag, "--", "benchmarks/runtime-matrix/kudzu/src", "benchmarks/runtime-matrix/kudzu/tsconfig.json"], { cwd: root, encoding: "utf8" }), "", "C2 fixture must match both release tags")
const commits = Object.fromEntries(Object.entries(revisions).map(([arm, tag]) => [arm, execFileSync("git", ["rev-parse", `${tag}^{commit}`], { cwd: root, encoding: "utf8" }).trim()]))
const protocol = {
  commits, revisions, runnerSha256: sha256(original), initialLoad: loadavg(),
  primary: "initialDomReadyMilliseconds", profiles: 21, measuredBuilds: 7, warmupBuilds: 1,
  order: "Alternate targets by round; fresh Chrome profile for every sample; one hosted VM",
  regressionGate: "Candidate primary median >5% higher AND at least 16/21 slower pairs; paired median and all raw samples reported. Failure to meet this gate does not establish a statistical tie.",
  attribution: "Untraced CDP load script/task/layout/style deltas; separately three traced profiles per arm, excluded from timing gate",
  acceptance: "Unchanged complete C2 journey, row identity, cleanup, accessibility, delayed/missing scripts and zero-JS sibling",
  limits: "Readiness includes harness predicates and a forced layout; CDP load deltas extend through initial validation. Trace categories can overlap and must not be summed as exclusive costs. No runtime candidate is authorized by this diagnostic alone."
}
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))

try {
  const targets = []
  for (const [arm, tag] of Object.entries(revisions)) {
    const compiler = join(scratch, arm)
    await mkdir(compiler)
    const archive = execFileSync("git", ["archive", tag, "framework", "bin", "package.json"], { cwd: root, maxBuffer: 32 * 1024 * 1024 })
    execFileSync("tar", ["-xf", "-"], { cwd: compiler, input: archive })
    await symlink(join(root, "node_modules"), join(compiler, "node_modules"))
    await cp(join(workspace, "kudzu/src"), join(compiler, "fixture/src"), { recursive: true })
    await cp(join(workspace, "kudzu/tsconfig.json"), join(compiler, "fixture/tsconfig.json"))
    targets.push({ id: arm, label: tag, architecture: "pre-rendered HTML with route capabilities", compiler, root: join(compiler, "fixture"), dist: join(compiler, "fixture/dist") })
    await cp(join(compiler, "framework/list-runtime.js"), join(results, `${arm}-list-runtime.js`))
  }
  let runner = replace(original, "const workspace = dirname(fileURLToPath(import.meta.url))", `const workspace = ${JSON.stringify(workspace)}`)
  runner = replace(runner, 'const resultsDirectory = join(workspace, "results")', `const resultsDirectory = ${JSON.stringify(results)}`)
  runner = replace(runner, runner.match(/const targets = \[[\s\S]*?\n\]/)[0], `const targets = ${JSON.stringify(targets)}`)
  runner = runner.replaceAll('target.id === "kudzu"', 'target.id !== "react"')
  runner = replace(runner, 'join(root, "bin/kudzu.mjs"), "build"', 'join(target.compiler, "bin/kudzu.mjs"), "build"')
  runner = replace(runner, "await requireFiles()", 'await access(join(root, "bin/kudzu.mjs"), constants.R_OK)')
  runner = replace(runner, "const versions = await frameworkVersions()", `const versions = ${JSON.stringify(revisions)}`)
  runner = replace(runner, '["--headless=new","--remote-debugging-port=0"', '["--headless=new","--no-sandbox","--remote-debugging-port=0"')
  runner = replace(runner, 'v8CompileMilliseconds:milliseconds("V8CompileDuration")', 'v8CompileMilliseconds:milliseconds("V8CompileDuration"),layoutMilliseconds:milliseconds("LayoutDuration"),styleMilliseconds:milliseconds("RecalcStyleDuration")')
  runner = replace(runner, "        samples[target.id].push(sample)", `        samples[target.id].push(sample)
        await writeFile(join(resultsDirectory, "progress.json"), JSON.stringify(samples))`)
  await writeFile(join(results, "runner.mjs"), runner)
  execFileSync(process.execPath, [join(results, "runner.mjs")], { cwd: root, env: { ...process.env, BENCHMARK_PROFILES: "21" }, stdio: "inherit", timeout: 900000 })
  const report = JSON.parse(await readFile(join(results, "raw.json")))
  const median = values => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]
  const compare = read => {
    const a = report.targets.baseline.browser.rawProfiles.map(read)
    const b = report.targets.candidate.browser.rawProfiles.map(read)
    assert.equal(a.length, 21)
    assert.equal(b.length, 21)
    assert.ok([...a, ...b].every(Number.isFinite))
    const slower = b.filter((value, index) => value > a[index]).length
    const relativeChange = median(a) === 0 ? null : median(b) / median(a) - 1
    return { baseline: median(a), candidate: median(b), pairedMedian: median(b.map((value, index) => value - a[index])), slower, relativeChange, regressionGate: relativeChange > .05 && slower >= 16 }
  }
  const summary = {
    initial: compare(sample => sample.initialDomReadyMilliseconds),
    load: Object.fromEntries(["scriptMilliseconds", "taskMilliseconds", "layoutMilliseconds", "styleMilliseconds"].map(key => [key, compare(sample => sample.cpu.load[key])])),
    operations: Object.fromEntries(Object.keys(report.targets.baseline.browser.operations).map(key => [key, compare(sample => sample.operations[key])]))
  }
  const paths = async directory => (await readdir(directory, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(directory.length + 1)).sort()
  assert.deepEqual(await paths(targets[0].dist), await paths(targets[1].dist))
  for (const path of await paths(targets[0].dist)) if (!path.endsWith("kudzu-list.js")) assert.deepEqual(await readFile(join(targets[0].dist, path)), await readFile(join(targets[1].dist, path)), path)
  for (const target of targets) await cp(target.dist, join(results, `${target.id}-dist`), { recursive: true })
  await writeFile(join(results, "summary.json"), JSON.stringify(summary, null, 2))

  const traces = join(results, "traces")
  await mkdir(traces)
  let traced = replace(runner, `const resultsDirectory = ${JSON.stringify(results)}`, `const resultsDirectory = ${JSON.stringify(traces)}`)
  traced = replace(traced, "const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)", "const browserProfiles = 3")
  traced = replace(traced, "    const cpuBefore = await performanceMetrics(send)", `    const traceEvents = []
    let completeTrace
    const traceDone = new Promise(resolve => { completeTrace = resolve })
    client.onEvent(message => {
      if (message.method === "Tracing.dataCollected") traceEvents.push(...message.params.value)
      if (message.method === "Tracing.tracingComplete") completeTrace()
    })
    await client.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing", transferMode: "ReportEvents" })
    const cpuBefore = await performanceMetrics(send)`)
  traced = replace(traced, "    const heapAfterLoad = await send(\"Runtime.getHeapUsage\")", `    await client.send("Tracing.end")
    await Promise.race([traceDone, new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Trace completion deadline")), 15000); timer.unref() })])
    await writeFile(join(resultsDirectory, target.id + "-" + profile + ".trace.json"), JSON.stringify({ traceEvents }))
    const heapAfterLoad = await send("Runtime.getHeapUsage")`)
  traced = replace(traced, "    globalThis.__runtimeMatrixReady = null;", '    performance.mark("c2-initial-start"); globalThis.__runtimeMatrixReady = null;')
  traced = replace(traced, "globalThis.__runtimeMatrixReady = performance.now();", 'globalThis.__runtimeMatrixReady = performance.now(); performance.mark("c2-initial-ready");')
  await writeFile(join(traces, "runner.mjs"), traced)
  execFileSync(process.execPath, [join(traces, "runner.mjs"), "--check"], { cwd: root, stdio: "inherit", timeout: 300000 })
  const attribution = []
  for (const arm of Object.keys(revisions)) for (let profile = 0; profile < 3; profile++) {
    const { traceEvents } = JSON.parse(await readFile(join(traces, `${arm}-${profile}.trace.json`)))
    const mark = name => {
      const matches = traceEvents.filter(event => event.name === name)
      assert.equal(matches.length, 1, `${arm}/${profile}/${name}`)
      return matches[0]
    }
    const start = mark("c2-initial-start"), end = mark("c2-initial-ready")
    assert.equal(start.pid, end.pid)
    assert.equal(start.tid, end.tid)
    assert.ok(end.ts > start.ts)
    const main = traceEvents.filter(event => event.pid === end.pid && event.tid === end.tid && event.ph === "X" && event.ts < end.ts && event.ts + event.dur > start.ts)
    const categories = Object.fromEntries(["ParseHTML", "EvaluateScript", "FunctionCall", "UpdateLayoutTree", "Layout"].map(name => {
      const events = main.filter(event => event.name === name)
      return [name, { count: events.length, inclusiveMilliseconds: events.reduce((sum, event) => sum + Math.min(end.ts, event.ts + event.dur) - Math.max(start.ts, event.ts), 0) / 1000 }]
    }))
    attribution.push({ arm, profile, rendererPid: end.pid, rendererTid: end.tid, intervalMilliseconds: (end.ts - start.ts) / 1000, categories })
  }
  await writeFile(join(traces, "attribution.json"), JSON.stringify(attribution, null, 2))
} catch (error) {
  await writeFile(join(results, "failure.json"), JSON.stringify({ error: error.stack, load: loadavg() }, null, 2))
  throw error
}
