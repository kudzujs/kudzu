import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmod, cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"
import test from "node:test"

test("adapter checkpoints partial usage and includes setup in its process-tree deadline", { skip: process.platform === "win32" }, async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-adapter-lifecycle-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const npm = join(directory, "npm")
  const model = join(directory, "model")
  const late = join(directory, "late")
  await writeFile(npm, `#!${process.execPath}\nsetTimeout(() => console.log('installed'), 700)\n`)
  await writeFile(model, `#!${process.execPath}
const { spawn } = require('node:child_process')
spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').writeFileSync(${JSON.stringify(late)}, 'late'), 2500)`)}], { stdio: 'ignore' }).unref()
console.log(JSON.stringify({ type: 'step_finish', sessionID: 'fake-session', part: { tokens: { input: 17, output: 3, reasoning: 2, cache: { read: 5 } }, cost: 0.25 } }))
process.stdout.write('{"type":')
console.error('partial stderr')
setInterval(() => {}, 1000)
`)
  await chmod(npm, 0o755)
  await chmod(model, 0o755)
  const traceFile = join(directory, "trace.jsonl")
  const started = Date.now()
  const child = spawn(process.execPath, [resolve("test/ai-delivery-opencode-adapter.mjs")], {
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, OPENCODE_BIN: model, KUDZU_AI_DELIVERY_GROUP: "0" },
    stdio: ["pipe", "pipe", "pipe"],
  })
  t.after(() => child.kill("SIGKILL"))
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", chunk => { stdout += chunk })
  child.stderr.on("data", chunk => { stderr += chunk })
  const closed = new Promise(resolveClose => child.on("close", status => resolveClose(status)))
  child.stdin.end(JSON.stringify({ workspace: directory, trace: traceFile, attempt: "fake", prompt: "", publicContext: [], model: { id: "fake", revision: "fake" }, budgets: { elapsedMs: 2000 }, deadline: started + 2000 }))
  let checkpoint
  for (let tries = 0; tries < 150; tries++) {
    checkpoint = await readFile(traceFile, "utf8").then(JSON.parse).catch(() => null)
    if (checkpoint?.usage.inputTokens === 22) break
    await delay(10)
  }
  assert.equal(child.exitCode, null, "usage is persisted before exit")
  assert.equal(checkpoint?.usage.inputTokens, 22)
  assert.equal(checkpoint.complete, false)
  assert.match(stdout, /step_finish/)
  assert.equal(await closed, 1)
  const trace = JSON.parse(await readFile(traceFile, "utf8"))
  assert.equal(trace.timedOut, true)
  assert.equal(trace.complete, false)
  assert.deepEqual(trace.usage, { inputTokens: 22, outputTokens: 3, reasoningTokens: 2 })
  assert.equal(trace.providerCostUsd, 0.25)
  assert.ok(trace.elapsedMs >= 1800 && trace.elapsedMs < 2600, `setup shares deadline: ${trace.elapsedMs}`)
  assert.match(stderr, /partial stderr/)
  await delay(2600)
  await assert.rejects(readFile(late), { code: "ENOENT" })

  for (const setupTimeout of [false, true]) {
    await writeFile(npm, `#!${process.execPath}\n${setupTimeout ? "setInterval(() => {}, 1000)" : "process.exit(0)"}\n`)
    await writeFile(model, `#!${process.execPath}\nprocess.exit(0)\n`)
    const result = spawnSync(process.execPath, [resolve("test/ai-delivery-opencode-adapter.mjs")], {
      env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, OPENCODE_BIN: model, KUDZU_AI_DELIVERY_GROUP: "0" },
      input: JSON.stringify({ workspace: directory, trace: traceFile, attempt: "empty", prompt: "", publicContext: [], model: { id: "fake", revision: "fake" }, budgets: { elapsedMs: 500 } }),
      timeout: 5000,
    })
    assert.equal(result.status, setupTimeout ? 1 : 0)
    const empty = JSON.parse(await readFile(traceFile, "utf8"))
    assert.equal(empty.complete, false, "no provider usage is never complete attribution")
    assert.equal(empty.timedOut, setupTimeout)
  }
})

test("runner kills the outer command group and keeps timed-out evidence incomplete", { skip: process.platform === "win32" }, async t => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-runner-lifecycle-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fixture = join(directory, "fixture")
  await cp(resolve("test/fixtures/ai-delivery"), fixture, { recursive: true })
  const late = join(directory, "late")
  const adapterFile = join(fixture, "adapter.mjs")
  const adapter = `${await readFile(adapterFile, "utf8")}
const { spawn } = await import('node:child_process')
spawn(process.execPath, ['-e', ${JSON.stringify(`setTimeout(() => require('node:fs').appendFileSync(${JSON.stringify(late)}, 'late'), 2500)`)}], { stdio: 'ignore' }).unref()
console.log('partial stdout')
console.error('partial stderr')
setInterval(() => {}, 1000)
`
  await writeFile(adapterFile, adapter)
  const protocolFile = join(fixture, "protocol.json")
  const protocol = JSON.parse(await readFile(protocolFile, "utf8"))
  protocol.model.adapter.sha256 = createHash("sha256").update(adapter).digest("hex")
  protocol.budgets.elapsedMs = 1500
  protocol.schedule = protocol.schedule.slice(0, 2)
  await writeFile(protocolFile, JSON.stringify(protocol))
  const output = join(directory, "evidence")
  const result = spawnSync(process.execPath, [resolve("test/ai-delivery-runner.mjs"), "--protocol", protocolFile, "--out", output], { encoding: "utf8", timeout: 15000 })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(await readFile(join(output, "run.json"), "utf8"))
  assert.equal(report.status, "incomplete")
  for (const attempt of report.attempts) {
    assert.equal(attempt.status, "failure")
    assert.equal(attempt.attribution, "incomplete")
    assert.equal(attempt.commands.adapter.timedOut, true)
    assert.equal(attempt.metrics.tokens.input, 20)
    assert.equal(attempt.acceptance.passed, true, "timeout cannot become success even with passing acceptance")
    assert.match(await readFile(join(output, attempt.evidence, "adapter.stdout"), "utf8"), /partial stdout/)
    assert.match(await readFile(join(output, attempt.evidence, "adapter.stderr"), "utf8"), /partial stderr/)
  }
  assert.equal(report.variants.every(variant => variant.tokensPerSuccess === null), true)
  await delay(2600)
  await assert.rejects(readFile(late), { code: "ENOENT" })
})
