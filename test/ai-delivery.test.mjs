import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import test from "node:test"

test("records paired AI delivery successes and raw failures without cherry-picking", async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-ai-delivery-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const output = join(directory, "evidence")
  const runner = resolve("test/ai-delivery-runner.mjs")
  const protocol = resolve("test/fixtures/ai-delivery/protocol.json")
  const result = spawnSync(process.execPath, [runner, "--protocol", protocol, "--out", output], { encoding: "utf8", timeout: 120_000 })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  assert.equal(report.schema, 1)
  assert.equal(report.protocol.id, "fixture-equal-delivery")
  assert.deepEqual(report.schedule.map(entry => [entry.variant, entry.ordinal]), [["kudzu", 0], ["react-vite", 0], ["react-vite", 1], ["kudzu", 1]])
  assert.deepEqual(report.attempts.map(attempt => attempt.status), ["success", "success", "failure", "failure"])
  assert.deepEqual(report.variants.map(variant => [variant.id, variant.attempts, variant.successes, variant.successRateMillionths, variant.costPerSuccessUsdNanos]), [["kudzu", 2, 1, 500000, 100], ["react-vite", 2, 1, 500000, 100]])
  assert.equal(report.attempts.every(attempt => attempt.attribution === "reproducible"), true)
  assert.equal(report.attempts.every(attempt => attempt.metrics.tokens.input === 20 && attempt.metrics.costUsdNanos === 50), true)
  assert.equal(report.attempts.every(attempt => attempt.metrics.toolCalls === 2 && attempt.metrics.buildAttempts === 1), true)
  assert.equal(report.attempts.every(attempt => attempt.sourceRetention.method === "byte-identical-files-v1"), true)
  assert.equal(report.attempts.every(attempt => attempt.artifacts.files === 1 && /^[a-f0-9]{64}$/.test(attempt.artifacts.sha256)), true)
  assert.equal(report.attempts.filter(attempt => attempt.status === "failure").every(attempt => attempt.acceptance.passed === false), true)

  const failed = report.attempts.find(attempt => attempt.id === "react-vite-1")
  assert.match(await readFile(join(output, failed.evidence, "adapter.stderr"), "utf8"), /deliberate fixture failure/)
  assert.match(await readFile(join(output, failed.evidence, "source/src/value.txt"), "utf8"), /Wrong/)
  assert.match(await readFile(join(output, failed.evidence, "artifacts/index.html"), "utf8"), /Wrong/)
  assert.match(await readFile(join(output, failed.evidence, "acceptance.stdout"), "utf8"), /accessible Ready button/)
})

test("compares paired baseline and tool-assisted attempts", async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-ai-tooling-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fixture = join(directory, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const protocolFile = join(fixture, "protocol.json")
  const protocol = JSON.parse(await readFile(protocolFile, "utf8"))
  protocol.id = "fixture-tooling-cost"
  protocol.packet = "0.20.5"
  protocol.variants[0].id = "baseline"
  protocol.variants[0].condition = "baseline"
  protocol.variants[1].id = "tool-assisted"
  protocol.variants[1].condition = "tool-assisted"
  protocol.schedule = [
    { id: "baseline-0", variant: "baseline", ordinal: 0 },
    { id: "tool-assisted-0", variant: "tool-assisted", ordinal: 0 },
  ]
  await writeFile(protocolFile, `${JSON.stringify(protocol, null, 2)}\n`)
  const output = join(directory, "evidence")
  const result = spawnSync(process.execPath, [resolve("test/ai-delivery-runner.mjs"), "--protocol", protocolFile, "--out", output], { encoding: "utf8", timeout: 120_000 })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  assert.deepEqual(report.attempts.map(attempt => attempt.condition), ["baseline", "tool-assisted"])
  assert.equal(report.comparison.baseline.id, "baseline")
  assert.equal(report.comparison.toolAssisted.id, "tool-assisted")
  assert.equal(report.comparison.tokenCostPerSuccessDelta, 0)
  assert.equal(report.comparison.identicalAcceptance, protocol.task.acceptance.sha256)
})

test("does not count an unattributed adapter result as a success", async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-ai-missing-trace-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fixture = join(directory, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const adapter = ""
  await writeFile(join(fixture, "adapter.mjs"), adapter)
  const protocolFile = join(fixture, "protocol.json")
  const protocol = JSON.parse(await readFile(protocolFile, "utf8"))
  protocol.model.adapter.sha256 = createHash("sha256").update(adapter).digest("hex")
  protocol.schedule = protocol.schedule.slice(0, 2)
  await writeFile(protocolFile, `${JSON.stringify(protocol, null, 2)}\n`)
  const output = join(directory, "evidence")
  const result = spawnSync(process.execPath, [resolve("test/ai-delivery-runner.mjs"), "--protocol", protocolFile, "--out", output], { encoding: "utf8", timeout: 120_000 })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  assert.deepEqual(report.attempts.map(attempt => [attempt.status, attempt.attribution]), [["failure", "incomplete"], ["failure", "incomplete"]])
  assert.equal(report.status, "incomplete")
  assert.equal(report.variants.every(variant => variant.successRateMillionths === 0), true)
  assert.equal(report.variants[0].costPerSuccessUsdNanos, null)
  assert.equal(report.variants[0].tokensPerSuccess, null)
})

test("copies equal public tools, excludes harness bytes, and invalidates every changed tool or document", async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-public-tools-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fixture = join(directory, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const names = ["browser-smoke.mjs", "browser-cdp.mjs", "browser-smoke-public.md"]
  const contexts = []
  for (const name of names) {
    const bytes = await readFile(resolve("test", name))
    await writeFile(join(fixture, name), bytes)
    contexts.push({ path: name, copyTo: `.tools/${name}`, includeInPrompt: name.endsWith(".md"), sha256: createHash("sha256").update(bytes).digest("hex") })
  }
  const original = await readFile(join(fixture, "adapter.mjs"), "utf8")
  const protocolFile = join(fixture, "protocol.json")
  const protocol = JSON.parse(await readFile(protocolFile, "utf8"))
  protocol.tools.names.push("shell")
  protocol.variants.forEach(variant => { variant.publicContext = contexts })
  for (const [index, name] of names.entries()) {
    const adapter = `${original.replace("const successful = input.ordinal === 0", "const successful = true")}
const assert = (await import('node:assert/strict')).default
const { createHash } = await import('node:crypto')
const contexts = ${JSON.stringify(contexts)}
assert.equal(input.publicContext.length, 1)
assert.equal(input.publicContext[0].path, 'browser-smoke-public.md')
for (const entry of contexts) assert.equal(createHash('sha256').update(await readFile(resolve(input.workspace, entry.copyTo))).digest('hex'), entry.sha256)
const trace = JSON.parse(await readFile(input.trace))
trace.tools.push({name:'shell',command:'node .tools/browser-smoke.mjs dist'})
await writeFile(input.trace, JSON.stringify(trace)+'\\n')
if (input.ordinal === 1) await writeFile(resolve(input.workspace, '.tools/${name}'), 'changed')
`
    await writeFile(join(fixture, "adapter.mjs"), adapter)
    protocol.model.adapter.sha256 = createHash("sha256").update(adapter).digest("hex")
    await writeFile(protocolFile, JSON.stringify(protocol))
    const output = join(directory, `evidence-${index}`)
    const result = spawnSync(process.execPath, [resolve("test/ai-delivery-runner.mjs"), "--protocol", protocolFile, "--out", output], { encoding: "utf8", timeout: 120_000 })
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(await readFile(join(output, "run.json")))
    for (const attempt of report.attempts) {
      assert.equal(attempt.invalid, attempt.ordinal === 1)
      assert.equal(attempt.status, attempt.ordinal === 1 ? "failure" : "success")
      assert.equal(attempt.acceptance.passed, true, "passing acceptance cannot excuse tool tampering")
      assert.equal(attempt.metrics.buildAttempts, 1, "nested observations do not count as builds")
      assert.equal(attempt.metrics.toolCalls, 3, "browser shell is a normal tool call")
      assert.equal(attempt.contextIntegrity.length, 6)
      assert.equal(attempt.contextIntegrity.filter(entry => !entry.passed).length, attempt.ordinal === 1 ? 2 : 0)
      assert.equal(attempt.sourceRetention.baselineFiles, report.attempts[0].sourceRetention.baselineFiles)
      await assert.rejects(readFile(join(output, attempt.evidence, "source/.tools", name)), { code: "ENOENT" })
    }
  }
  protocol.variants[0].publicContext[0].copyTo = "../escape.mjs"
  await writeFile(protocolFile, JSON.stringify(protocol))
  const rejected = spawnSync(process.execPath, [resolve("test/ai-delivery-runner.mjs"), "--protocol", protocolFile, "--out", join(directory, "rejected")], { encoding: "utf8" })
  assert.notEqual(rejected.status, 0)
  assert.match(rejected.stderr, /unique .tools filename/)
})
