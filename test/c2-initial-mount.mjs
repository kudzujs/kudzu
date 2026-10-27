import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises"
import { loadavg, tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { attributeCPU, moduleAttribution } from "./c2-module-marks.mjs"

if (process.argv[2] === "--summarize-cpu") {
  assert.equal(process.argv.length, 4)
  const summaries = []
  for (const arm of ["baseline", "candidate"]) for (let profile = 0; profile < 3; profile++) {
    const data = JSON.parse(await readFile(join(process.argv[3], `${arm}-${profile}.cpuprofile`)))
    summaries.push({ arm, profile, ...summarizeCPU(data) })
  }
  await writeFile(join(process.argv[3], "cpu-attribution.json"), JSON.stringify(summaries, null, 2))
  process.exit(0)
}
if (process.argv[2] === "--summarize-traces") {
  assert.equal(process.argv.length, 4)
  await summarizeTraces(process.argv[3])
  process.exit(0)
}
const trial = process.argv[2] === "--trial"
const rowIds = process.argv[2] === "--row-ids"
const rowOwnership = process.argv[2] === "--row-ownership"
const cpu = process.argv[2] === "--cpu"
const visits = process.argv[2] === "--visits" || process.argv[2] === "--resolved-visits"
const plannedIds = process.argv[2] === "--planned-ids"
const effectOrder = process.argv[2] === "--effect-order"
const rowEvents = process.argv[2] === "--row-events"
const resolvedIds = process.argv[2] === "--resolved-ids" || process.argv[2] === "--resolved-visits"
const moduleCPU = process.argv[2] === "--module-cpu"
const modules = process.argv[2] === "--modules" || moduleCPU
assert.equal(process.argv.length, trial || rowIds || rowOwnership || cpu || visits || plannedIds || effectOrder || rowEvents || resolvedIds || modules ? 3 : 2)
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
const revisions = { baseline: resolvedIds ? "v0.17.6" : rowEvents ? "v0.17.5" : trial || rowIds || rowOwnership || plannedIds || effectOrder ? "v0.17.4" : "v0.17.3", candidate: resolvedIds ? "4c7173c" : rowEvents ? "c25c4f8" : effectOrder ? "5d1ff7a" : plannedIds ? "b8f5ac1" : "v0.17.4" }
if (modules) Object.assign(revisions, { baseline: "v0.17.6", candidate: "v0.17.6" })
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
if (trial || rowIds || rowOwnership || plannedIds || resolvedIds && !visits) protocol.trial = {
  change: resolvedIds ? "Build proves initial HTML has no placeholders; skip initial direct-row replacement only for structural plans without event or ID/metadata attribute fills; preserve all value fills and clone registration" : plannedIds ? "Reuse template-derived eligible attribute locations through existing itemParts; retain recursive fallback and all first-value fills" : rowOwnership ? "Register direct ID replacement only for hasRowHooks descriptors; retain ownership paths and first-value fills" : rowIds ? "Replace direct row-ID attribute-array copying with indexed NamedNodeMap traversal; preserve all elements, attributes and template contents" : "For initially matching structural keys, fill every retained row from current items, then reuse existing roots instead of performing general placement and rebuilding root maps",
  gate: "At least 5% lower initial-DOM median, negative paired median, at least 16/21 faster pairs, no operation regression under the existing >5% and 16/21 slower gate, both lifetime suites and all C2 journeys pass",
  limits: "Scratch candidate only. Reject without production adoption if the predeclared speed gate fails; raw/gzip sizes remain separately reported."
}
if (cpu) Object.assign(protocol, {
  primary: "Initial-mount sampled CPU attribution, not a speed gate", profiles: 3, measuredBuilds: 1, warmupBuilds: 0,
  regressionGate: null,
  attribution: "CDP Profiler with 100 microsecond requested interval, from before navigation through initial readiness validation; collect every leaf and ancestor site, including idle/program/GC samples",
  limits: "Sampling perturbs timing; weights are not exact function durations. Inclusive ancestors overlap. Profiles do not establish speed ranking or justify adopting a candidate. Runtime output remains uninstrumented."
})
if (visits) Object.assign(protocol, {
  primary: "Direct row-ID visitor counts by list owner, not timing", profiles: 3, measuredBuilds: 1, warmupBuilds: 0,
  regressionGate: null,
  attribution: "Scratch counters in the direct recursive visitor; snapshot at initial acceptance and after complete journey",
  limits: "Instrumented output and all timings are diagnostic only. Count actual visited elements/attributes and placeholder-bearing attributes; retain full C2 acceptance."
})
if (effectOrder) Object.assign(protocol, {
  primary: "Correctness-fix cost characterization; no speed superiority gate",
  acceptance: "Candidate passes delayed owned-ref regression that fails on baseline; both arms pass prior lifetime tests and unchanged complete C2 acceptance",
  limits: "One ESM dependency orders list-owned effects after list initialization. Preserve costs and all failures; do not claim a speed improvement from this correctness packet."
})
if (rowEvents) Object.assign(protocol, {
  primary: "Correctness-fix cost characterization; no speed superiority gate",
  acceptance: "Baseline reproduces second-update row event failure; candidate passes delayed/repeated/cloned state and ref regression; both arms pass prior lifetime tests and complete unchanged C2 journeys",
  limits: "Direct-row event templates resolve through existing ownership before current item capture. Preserve all costs and failures; no initial traversal or speed improvement is claimed."
})
if (modules) Object.assign(protocol, {
  primary: "Diagnostic synchronous module-body attribution; no speed gate", profiles: 3, measuredBuilds: 1, warmupBuilds: 0,
  regressionGate: null,
  attribution: "Both arms pin v0.17.6; baseline is unmodified, candidate adds body start/end marks to emitted ESM. Native dependency order and full C2 acceptance remain unchanged.",
  limits: "Marked wall time is not CPU self time or a speed comparison. Module bodies exclude dependency evaluation and later async callbacks; top-level await is rejected. Preserve all traces, marks and artifact hashes."
})
if (moduleCPU) protocol.attribution += " Sample CPU at requested 100-microsecond interval in both arms; correlate candidate sample timestamps with marked body windows. Preserve signed deltas and all outside-window samples; sampling weights are not exact function durations."
await writeFile(join(results, "protocol.json"), JSON.stringify(protocol, null, 2))

try {
  const targets = []
  for (const [arm, tag] of Object.entries(revisions)) {
    const compiler = join(scratch, arm)
    await mkdir(compiler)
    const archive = execFileSync("git", ["archive", tag, "framework", "bin", "package.json"], { cwd: root, maxBuffer: 32 * 1024 * 1024 })
    execFileSync("tar", ["-xf", "-"], { cwd: compiler, input: archive })
    if (visits) {
      const path = join(compiler, "framework/list-runtime.js")
      let source = await readFile(path, "utf8")
      source = replace(source, "  const path = listRowPaths.get(root)\n  const replace = node => {", `  const path = listRowPaths.get(root)
  const owner = ownershipPaths.get(root)[0].split("=")[0]
  const counts = globalThis.__kudzuRowVisits ??= {}
  const count = counts[owner] ??= { entries: 0, elements: 0, attributes: 0, placeholders: 0 }
  count.entries++
  const replace = node => {
    count.elements++
    count.attributes += node.attributes.length`)
      source = replace(source,
        '    for (const attribute of [...node.attributes]) if ((attribute.name.startsWith("data-k-") || rowIdAttributes.has(attribute.name)) && attribute.value.includes("$k")) attribute.value = attribute.value.replaceAll("$k", path)',
        '    for (const attribute of [...node.attributes]) if ((attribute.name.startsWith("data-k-") || rowIdAttributes.has(attribute.name)) && attribute.value.includes("$k")) { count.placeholders++; attribute.value = attribute.value.replaceAll("$k", path) }')
      await writeFile(path, source)
    }
    if (rowOwnership && arm === "candidate") {
      const path = join(compiler, "framework/list-runtime.js")
      await writeFile(path, replace(await readFile(path, "utf8"),
        "  if (direct) directRowReplacements.add(root)",
        "  if (direct && hasRowHooks(descriptor)) directRowReplacements.add(root)"))
    }
    if (rowIds && arm === "candidate") {
      const path = join(compiler, "framework/list-runtime.js")
      const source = await readFile(path, "utf8")
      await writeFile(path, replace(source,
        '    for (const attribute of [...node.attributes]) if ((attribute.name.startsWith("data-k-") || rowIdAttributes.has(attribute.name)) && attribute.value.includes("$k")) attribute.value = attribute.value.replaceAll("$k", path)',
        `    for (let index = 0; index < node.attributes.length; index++) {
      const attribute = node.attributes[index]
      if ((attribute.name.startsWith("data-k-") || rowIdAttributes.has(attribute.name)) && attribute.value.includes("$k")) attribute.value = attribute.value.replaceAll("$k", path)
    }`))
    }
    if (trial && arm === "candidate") {
      const path = join(compiler, "framework/list-runtime.js")
      const source = await readFile(path, "utf8")
      const anchor = "  if (list.descriptor.key !== null && !list.descriptor.indexed && !list.descriptor.selector && (referenceOnly || list.values.size) && entries.every(entry => {"
      const candidate = replace(source, anchor, `  if (list.items === undefined && list.parts.directFill && entries.length === list.roots.size) {
    const roots = __KUDZU_LIST_STABLE_FAST_PATHS__ ? list.orderedRoots : [...list.roots.values()]
    if (entries.every((entry, index) => list.roots.get(entry.token) === roots[index])) {
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index]
        fillListItem(roots[index], entry.item, list.descriptor.nested, index)
        if (!referenceOnly) list.values.set(entry.token, entry.value)
      }
      list.items = items
      return
    }
  }
` + anchor)
      await writeFile(path, candidate)
    }
    await symlink(join(root, "node_modules"), join(compiler, "node_modules"))
    await cp(join(workspace, "kudzu/src"), join(compiler, "fixture/src"), { recursive: true })
    await cp(join(workspace, "kudzu/tsconfig.json"), join(compiler, "fixture/tsconfig.json"))
    targets.push({ id: arm, label: tag, architecture: "pre-rendered HTML with route capabilities", compiler, root: join(compiler, "fixture"), dist: join(compiler, "fixture/dist") })
    await cp(join(compiler, "framework/list-runtime.js"), join(results, `${arm}-list-runtime.js`))
    if (trial || rowIds || rowOwnership || plannedIds || effectOrder || rowEvents || resolvedIds) {
      await mkdir(join(compiler, "test/fixtures"), { recursive: true })
      for (const name of ["pending-evaluator-browser.test.mjs", "browser-cdp.mjs"]) await cp(join(root, "test", name), join(compiler, "test", name))
      if (effectOrder && arm === "baseline") await writeFile(join(compiler, "test/pending-evaluator-browser.test.mjs"), execFileSync("git", ["show", "v0.17.4:test/pending-evaluator-browser.test.mjs"], { cwd: root }))
      for (const name of ["pending-evaluator-browser", "pending-list-source", "list-condition-revision"]) await cp(join(root, "test/fixtures", name), join(compiler, "test/fixtures", name), { recursive: true })
      if (resolvedIds) await writeFile(join(compiler, "test/pending-evaluator-browser.test.mjs"), execFileSync("git", ["show", `${tag}:test/pending-evaluator-browser.test.mjs`], { cwd: root }))
      if (rowEvents && arm === "baseline") {
        let failure
        try {
          execFileSync(process.execPath, ["--test", "test/pending-evaluator-browser.test.mjs"], { cwd: compiler, encoding: "utf8", timeout: 90000 })
        } catch (error) { failure = error }
        assert.equal(failure?.status, 1, "baseline must reproduce the row-event failure")
        const log = `${failure.stdout}\n${failure.stderr}`
        await writeFile(join(results, "baseline-row-event-failure.log"), log)
        assert.match(log, /Owned row did not settle:.*12/)
        assert.match(log, /s1:\$k/)
        await writeFile(join(compiler, "test/pending-evaluator-browser.test.mjs"), execFileSync("git", ["show", "v0.17.5:test/pending-evaluator-browser.test.mjs"], { cwd: root }))
      }
      const log = execFileSync(process.execPath, ["--test", "test/pending-evaluator-browser.test.mjs"], { cwd: compiler, encoding: "utf8", timeout: 90000 })
      await writeFile(join(results, `${arm}-regression.log`), log)
    }
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
  if (visits) {
    runner = replace(runner, "const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)", "const browserProfiles = 3")
    runner = replace(runner, '    const heapAfterLoad = await send("Runtime.getHeapUsage")', `    const visits = { initial: await evaluate(send, "globalThis.__kudzuRowVisits ?? {}") }
    const heapAfterLoad = await send("Runtime.getHeapUsage")`)
    runner = replace(runner, '    const heapAfterJourney = await send("Runtime.getHeapUsage")', `    visits.fullJourney = await evaluate(send, "globalThis.__kudzuRowVisits ?? {}")
    await writeFile(join(resultsDirectory, target.id + "-" + profile + ".visits.json"), JSON.stringify(visits, null, 2))
    const heapAfterJourney = await send("Runtime.getHeapUsage")`)
    await writeFile(join(results, "runner.mjs"), runner)
    execFileSync(process.execPath, [join(results, "runner.mjs"), "--check"], { cwd: root, stdio: "inherit", timeout: 300000 })
    for (const target of targets) await cp(target.dist, join(results, `${target.id}-dist`), { recursive: true })
    const summaries = []
    for (const arm of Object.keys(revisions)) for (let profile = 0; profile < 3; profile++) {
      const counts = JSON.parse(await readFile(join(results, `${arm}-${profile}.visits.json`)))
      for (const phase of Object.values(counts)) for (const count of Object.values(phase)) {
        assert.ok(Object.values(count).every(value => Number.isSafeInteger(value) && value >= 0))
        assert.ok(count.elements >= count.entries && count.attributes >= count.placeholders)
      }
      summaries.push({ arm, profile, ...counts })
    }
    await writeFile(join(results, "visits.json"), JSON.stringify(summaries, null, 2))
    process.exit(0)
  }
  if (cpu) {
    runner = replace(runner, "const browserProfiles = check ? 1 : Number(process.env.BENCHMARK_PROFILES ?? 7)", "const browserProfiles = 3")
    runner = replace(runner, "    await send(\"Page.addScriptToEvaluateOnNewDocument\", { source: initialReadyScript() })", `    await send("Profiler.enable")
    await send("Profiler.setSamplingInterval", { interval: 100 })
    await send("Profiler.start")
    await send("Page.addScriptToEvaluateOnNewDocument", { source: initialReadyScript() })`)
    runner = replace(runner, "    const heapAfterLoad = await send(\"Runtime.getHeapUsage\")", `    const { profile: cpuProfile } = await send("Profiler.stop")
    await writeFile(join(resultsDirectory, target.id + "-" + profile + ".cpuprofile"), JSON.stringify(cpuProfile))
    await send("Profiler.disable")
    const heapAfterLoad = await send("Runtime.getHeapUsage")`)
    await writeFile(join(results, "runner.mjs"), runner)
    execFileSync(process.execPath, [join(results, "runner.mjs"), "--check"], { cwd: root, stdio: "inherit", timeout: 300000 })
    for (const target of targets) await cp(target.dist, join(results, `${target.id}-dist`), { recursive: true })
    const summaries = []
    for (const arm of Object.keys(revisions)) for (let profile = 0; profile < 3; profile++) {
      const data = JSON.parse(await readFile(join(results, `${arm}-${profile}.cpuprofile`)))
      summaries.push({ arm, profile, ...summarizeCPU(data) })
    }
    await writeFile(join(results, "cpu-attribution.json"), JSON.stringify(summaries, null, 2))
    process.exit(0)
  }
  if (!modules) {
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
      return { baseline: median(a), candidate: median(b), pairedMedian: median(b.map((value, index) => value - a[index])), slower, faster: b.filter((value, index) => value < a[index]).length, relativeChange, regressionGate: relativeChange > .05 && slower >= 16 }
    }
    const summary = {
      initial: compare(sample => sample.initialDomReadyMilliseconds),
      load: Object.fromEntries(["scriptMilliseconds", "taskMilliseconds", "layoutMilliseconds", "styleMilliseconds"].map(key => [key, compare(sample => sample.cpu.load[key])])),
      operations: Object.fromEntries(Object.keys(report.targets.baseline.browser.operations).map(key => [key, compare(sample => sample.operations[key])]))
    }
    if (trial || rowIds || rowOwnership || plannedIds || resolvedIds) summary.accepted = summary.initial.relativeChange <= -.05 && summary.initial.pairedMedian < 0 && summary.initial.faster >= 16 && !Object.values(summary.operations).some(value => value.regressionGate)
    const paths = async directory => (await readdir(directory, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).map(entry => join(entry.parentPath, entry.name).slice(directory.length + 1)).sort()
    assert.deepEqual(await paths(targets[0].dist), await paths(targets[1].dist))
    for (const path of await paths(targets[0].dist)) if (!(effectOrder ? path === "assets/effects/index.js" : path.endsWith("kudzu-list.js") || resolvedIds && path === "index.html")) assert.deepEqual(await readFile(join(targets[0].dist, path)), await readFile(join(targets[1].dist, path)), path)
    for (const target of targets) await cp(target.dist, join(results, `${target.id}-dist`), { recursive: true })
    await writeFile(join(results, "summary.json"), JSON.stringify(summary, null, 2))
  }

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
  if (modules) {
    traced = `import { instrumentModules } from ${JSON.stringify(new URL("./c2-module-marks.mjs", import.meta.url).href)}\n` + traced
    traced = replace(traced, "  return measured ? { milliseconds, peakRssBytes, output: await measureArtifacts(target.dist) } : null", `  if (target.id === "candidate") await instrumentModules(target.dist, ${JSON.stringify(join(results, "module-manifest.json"))})
  return measured ? { milliseconds, peakRssBytes, output: await measureArtifacts(target.dist) } : null`)
  }
  if (moduleCPU) {
    traced = replace(traced, '    const cpuBefore = await performanceMetrics(send)', `    await send("Profiler.enable")
    await send("Profiler.setSamplingInterval", { interval: 100 })
    await send("Profiler.start")
    const cpuBefore = await performanceMetrics(send)`)
    traced = replace(traced, '    await client.send("Tracing.end")', `    const { profile: cpuProfile } = await send("Profiler.stop")
    await writeFile(join(resultsDirectory, target.id + "-" + profile + ".cpuprofile"), JSON.stringify(cpuProfile))
    await send("Profiler.disable")
    await client.send("Tracing.end")`)
  }
  await writeFile(join(traces, "runner.mjs"), traced)
  execFileSync(process.execPath, [join(traces, "runner.mjs"), "--check"], { cwd: root, stdio: "inherit", timeout: 300000 })
  await summarizeTraces(traces)
  if (modules) {
    const manifest = JSON.parse(await readFile(join(results, "module-manifest.json")))
    const report = JSON.parse(await readFile(join(traces, "raw.json")))
    const attribution = []
    for (let profile = 0; profile < 3; profile++) {
      const bytes = await readFile(join(traces, `candidate-${profile}.trace.json`))
      const events = JSON.parse(bytes).traceEvents
      const result = moduleAttribution(events, report.targets.candidate.browser.rawProfiles[profile].initialDomReadyMilliseconds, manifest)
      if (moduleCPU) {
        const cpu = JSON.parse(await readFile(join(traces, `candidate-${profile}.cpuprofile`)))
        const start = events.find(event => event.name === "c2-initial-start").ts
        assert.ok(cpu.startTime <= start && cpu.endTime >= start + result.readiness.intervalMilliseconds * 1000, "CPU and trace clocks must cover the same readiness window")
        result.cpu = attributeCPU(cpu, result.modules, start)
      }
      attribution.push({ profile, traceSha256: sha256(bytes), ...result })
    }
    for (const entry of manifest) assert.equal(sha256(await readFile(join(targets[0].dist, entry.path))), entry.originalSha256)
    for (const path of ["index.html", "static/index.html"]) assert.deepEqual(await readFile(join(targets[0].dist, path)), await readFile(join(targets[1].dist, path)))
    for (const target of targets) await cp(target.dist, join(results, `${target.id}-dist`), { recursive: true })
    await writeFile(join(results, "module-attribution.json"), JSON.stringify(attribution, null, 2))
  }
} catch (error) {
  await writeFile(join(results, "failure.json"), JSON.stringify({ error: error.stack, load: loadavg() }, null, 2))
  throw error
}

function summarizeCPU(profile) {
  assert.ok(profile.samples.length > 0)
  assert.equal(profile.samples.length, profile.timeDeltas.length)
  const nodes = new Map(profile.nodes.map(node => [node.id, node]))
  assert.equal(nodes.size, profile.nodes.length)
  const parents = new Map()
  for (const node of nodes.values()) for (const child of node.children ?? []) {
    assert.ok(nodes.has(child))
    assert.equal(parents.has(child), false)
    parents.set(child, node.id)
  }
  const sites = new Map()
  const site = node => {
    const frame = node.callFrame
    const url = /^https?:/.test(frame.url) ? new URL(frame.url).pathname : frame.url
    const key = JSON.stringify([url, frame.functionName, frame.lineNumber, frame.columnNumber])
    if (!sites.has(key)) sites.set(key, { url, functionName: frame.functionName, lineNumber: frame.lineNumber, columnNumber: frame.columnNumber, selfMicroseconds: 0, inclusiveMicroseconds: 0, samples: 0 })
    return sites.get(key)
  }
  let sampledMicroseconds = 0
  const negativeDeltas = []
  for (const [index, id] of profile.samples.entries()) {
    assert.ok(nodes.has(id))
    const delta = profile.timeDeltas[index]
    assert.ok(Number.isFinite(delta))
    // Preserve signed profiler anomalies rather than silently clamping or dropping samples.
    if (delta < 0) negativeDeltas.push({ index, delta })
    sampledMicroseconds += delta
    const leaf = site(nodes.get(id))
    leaf.selfMicroseconds += delta
    leaf.samples++
    const ancestors = new Set(), seenSites = new Set()
    for (let parent = id; parent !== undefined; parent = parents.get(parent)) {
      assert.equal(ancestors.has(parent), false, "CPU profile parent cycle")
      ancestors.add(parent)
      const frame = site(nodes.get(parent))
      if (!seenSites.has(frame)) frame.inclusiveMicroseconds += delta
      seenSites.add(frame)
    }
  }
  assert.equal([...sites.values()].reduce((sum, frame) => sum + frame.selfMicroseconds, 0), sampledMicroseconds)
  assert.equal([...sites.values()].reduce((sum, frame) => sum + frame.samples, 0), profile.samples.length)
  return { durationMicroseconds: profile.endTime - profile.startTime, sampledMicroseconds, negativeDeltas, weightInterpretation: "Signed raw deltas, not exact durations; inspect negativeDeltas and sample counts", sampleCount: profile.samples.length, sites: [...sites.values()].sort((a, b) => b.selfMicroseconds - a.selfMicroseconds) }
}

async function summarizeTraces(traces) {
  const report = JSON.parse(await readFile(join(traces, "raw.json")))
  const attribution = []
  for (const arm of ["baseline", "candidate"]) for (let profile = 0; profile < 3; profile++) {
    const { traceEvents } = JSON.parse(await readFile(join(traces, `${arm}-${profile}.trace.json`)))
    const mark = name => {
      const matches = traceEvents.filter(event => event.name === name)
      assert.ok(matches.length, `${arm}/${profile}/${name}`)
      if (name === "c2-initial-start") assert.equal(matches.length, 1)
      for (const event of matches) {
        assert.equal(event.pid, matches[0].pid)
        assert.equal(event.tid, matches[0].tid)
        assert.equal(event.args.data.navigationId, matches[0].args.data.navigationId)
      }
      // DOMContentLoaded and a queued observer may both record readiness; the harness keeps the last value.
      return matches.toSorted((a, b) => a.ts - b.ts).at(-1)
    }
    const start = mark("c2-initial-start"), end = mark("c2-initial-ready")
    assert.equal(start.pid, end.pid)
    assert.equal(start.tid, end.tid)
    assert.equal(start.args.data.navigationId, end.args.data.navigationId)
    assert.ok(Math.abs(end.args.data.startTime - report.targets[arm].browser.rawProfiles[profile].initialDomReadyMilliseconds) < 1)
    assert.ok(end.ts > start.ts)
    const main = traceEvents.filter(event => event.pid === end.pid && event.tid === end.tid && event.ph === "X" && event.ts < end.ts && event.ts + event.dur > start.ts)
    const categories = Object.fromEntries(["ParseHTML", "EvaluateScript", "v8.evaluateModule", "FunctionCall", "UpdateLayoutTree", "Layout"].map(name => {
      const events = main.filter(event => event.name === name)
      return [name, { count: events.length, inclusiveMilliseconds: events.reduce((sum, event) => sum + Math.min(end.ts, event.ts + event.dur) - Math.max(start.ts, event.ts), 0) / 1000 }]
    }))
    attribution.push({ arm, profile, rendererPid: end.pid, rendererTid: end.tid, intervalMilliseconds: (end.ts - start.ts) / 1000, categories })
  }
  await writeFile(join(traces, "attribution.json"), JSON.stringify(attribution, null, 2))
}
