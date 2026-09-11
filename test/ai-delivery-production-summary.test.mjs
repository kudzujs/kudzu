import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"

test("production summary includes a third framework without hiding missing task coverage", async t => {
  const out = await mkdtemp(join(tmpdir(), "delivery-summary-"))
  t.after(() => rm(out, { recursive: true, force: true }))
  const tasks = ["content", "forms", "crud", "commerce", "realtime"]
  const variants = ["kudzu", "react-vite", "astro"]
  const runs = tasks.map(id => ({ status: "complete", protocol: { id }, variants: variants.map(id => ({ id, tokensPerSuccess: 100 })), attempts: variants.map(variant => ({ variant, status: "success", attribution: "fully-attributable", metrics: { elapsedMs: 10, toolCalls: 1, filesRead: 1, filesModified: 1, buildAttempts: 1, correctionCycles: 0 } })) }))
  for (const [i, task] of tasks.entries()) {
    await mkdir(join(out, task))
    await writeFile(join(out, task, "run.json"), JSON.stringify(runs[i]))
  }
  const summarize = async () => {
    const r = spawnSync(process.execPath, ["test/ai-delivery-production-suite.mjs", "--out", out, "--summarize"], { encoding: "utf8" })
    assert.equal(r.status, 0, r.stderr)
    return JSON.parse(await readFile(join(out, "suite.json"), "utf8"))
  }
  const complete = await summarize()
  assert.deepEqual(complete.variants.map(v => v.id), variants)
  assert.equal(complete.status, "complete")
  assert.equal(complete.variants[2].successes, 5)
  assert.equal(complete.variants[2].medianTaskTokenCostPerSuccess, 100)
  runs[4].variants.pop(); runs[4].attempts.pop()
  await writeFile(join(out, "realtime/run.json"), JSON.stringify(runs[4]))
  const incomplete = await summarize()
  assert.equal(incomplete.status, "incomplete")
  assert.equal(incomplete.variants[2].medianTaskTokenCostPerSuccess, null)
  assert.deepEqual(incomplete.variants[2].taskTokenCostPerSuccess, [100, 100, 100, 100, null])
})

test("Astro Content starter preserves the comparator data, styles, and pre-task boundary", async () => {
  const root = new URL("./fixtures/ai-delivery-production/content/starters/", import.meta.url)
  for (const file of ["data.ts", "styles.css"]) assert.deepEqual(await readFile(new URL(`astro/src/${file}`, root)), await readFile(new URL(`react-vite/src/${file}`, root)))
  const page = await readFile(new URL("astro/src/pages/articles/index.astro", root), "utf8")
  assert.match(page, /articles\.map/)
  assert.doesNotMatch(page, /<script|<input|aria-live/)
  const pkg = JSON.parse(await readFile(new URL("astro/package.json", root), "utf8"))
  const lock = JSON.parse(await readFile(new URL("astro/package-lock.json", root), "utf8"))
  for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) assert.equal(lock.packages[`node_modules/${name}`].version, version)
  assert.equal(pkg.scripts.build, "astro check && astro build")
})

test("delivery source retention excludes generated Astro scratch but keeps authored Astro pages", async t => {
  const root = await mkdtemp(join(tmpdir(), "delivery-astro-scratch-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const fixture = join(root, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const adapter = await readFile(join(fixture, "adapter.mjs"), "utf8") + '\nawait (await import("node:fs/promises")).mkdir(resolve(input.workspace,".astro"));\nawait writeFile(resolve(input.workspace,".astro/types.d.ts"),"generated");\nawait writeFile(resolve(input.workspace,"src/Page.astro"),"<p>Authored</p>");\n'
  await writeFile(join(fixture, "adapter.mjs"), adapter)
  const path = join(fixture, "protocol.json"), protocol = JSON.parse(await readFile(path, "utf8"))
  protocol.model.adapter.sha256 = createHash("sha256").update(adapter).digest("hex")
  await writeFile(path, JSON.stringify(protocol))
  const output = join(root, "evidence")
  const result = spawnSync(process.execPath, ["test/ai-delivery-runner.mjs", "--protocol", path, "--out", output], { encoding: "utf8", timeout: 120000 })
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  for (const attempt of report.attempts) {
    const source = join(output, attempt.evidence, "source")
    assert.equal(await readFile(join(source, "src/Page.astro"), "utf8"), "<p>Authored</p>")
    await assert.rejects(readFile(join(source, ".astro/types.d.ts")), { code: "ENOENT" })
  }
})

test("runner accepts three equally scheduled frameworks and rejects malformed comparisons", async t => {
  const root = await mkdtemp(join(tmpdir(), "delivery-three-way-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const fixture = join(root, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const path = join(fixture, "protocol.json"), protocol = JSON.parse(await readFile(path, "utf8"))
  protocol.variants.push({ ...protocol.variants[1], id: "astro" })
  protocol.schedule = [0, 1].flatMap(ordinal => protocol.variants.map(({ id }) => ({ id: `${id}-${ordinal}`, variant: id, ordinal })))
  await writeFile(path, JSON.stringify(protocol))
  const output = join(root, "evidence")
  const run = () => spawnSync(process.execPath, ["test/ai-delivery-runner.mjs", "--protocol", path, "--out", output], { encoding: "utf8", timeout: 120000 })
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  assert.equal(report.attempts.length, 6)
  assert.deepEqual(report.variants.map(v => [v.id, v.successes, v.attempts]), [["kudzu", 1, 2], ["react-vite", 1, 2], ["astro", 1, 2]])
  for (const [change, message] of [
    [p => p.schedule.pop(), /equal attempt ordinals/],
    [p => { p.variants[2].id = p.variants[0].id }, /uniquely named/],
    [p => { p.variants = [p.variants[0]] }, /at least two/],
  ]) {
    const invalid = structuredClone(protocol); change(invalid)
    await writeFile(path, JSON.stringify(invalid))
    const failure = run(); assert.notEqual(failure.status, 0); assert.match(failure.stderr, message)
  }
})
