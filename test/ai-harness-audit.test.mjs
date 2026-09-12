import assert from "node:assert/strict"
import { test } from "node:test"
import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { auditTrace } from "./ai-harness-audit.mjs"

test("audits recorded usage and conservative repeat candidates without conflating bytes and cost", () => {
  const tool = (message, name, input, output, metadata = {}) => ({ type: "tool_use", sessionID: "session", part: { messageID: message, tool: name, state: { status: "completed", input, output, metadata } } })
  const finish = (message, reason = "tool-calls") => ({ type: "step_finish", sessionID: "session", part: { messageID: message, reason, tokens: { input: 10, output: 3, reasoning: 2, cache: { read: 20, write: 4 } } } })
  const events = [
    tool("a", "read", { filePath: "a.ts", limit: 10 }, "한글"),
    tool("a", "read", { limit: 10, filePath: "a.ts" }, "한글"),
    tool("a", "read", { filePath: "a.ts", offset: 11 }, "한글"),
    tool("a", "read", { filePath: "a.ts", limit: 10 }, "changed"),
    tool("a", "read", { filePath: "a.ts", limit: 10 }, "한글", { truncated: true }),
    finish("a"),
    tool("b", "bash", { command: "npm run build" }, "failed build"),
    finish("b"),
    tool("c", "read", { filePath: "a.ts", limit: 10 }, "한글"),
    tool("c", "bash", { command: "npm run build" }, "passed build"),
    finish("c", "stop"),
  ]
  const text = "npm installation preamble\n" + events.map(JSON.stringify).join("\n")
  const report = auditTrace(text)
  assert.equal(report.legacyNormalizedTokens, 105)
  assert.deepEqual(report.usage, { input: 30, cacheRead: 60, cacheWrite: 12, output: 9, reasoning: 6 })
  assert.deepEqual(Object.values(report.phases).map(phase => phase.legacyNormalizedTokens), [35, 35, 35, 0])
  assert.equal(report.firstBuildCandidate.line, 8)
  assert.equal(report.tools[0].outputBytes, 6)
  assert.deepEqual(report.ignoredLines, [1])
  assert.deepEqual(report.truncatedOutputLines, [6])
  assert.equal(report.exactRepeatedObservations.length, 2)
  assert.equal(report.exactRepeatedObservations[0].previousLine, 2)
  assert.equal(report.exactRepeatedObservations[0].interveningPotentialMutation, false)
  assert.equal(report.exactRepeatedObservations[1].interveningPotentialMutation, true)
  assert.equal(report.terminalStopObserved, true)
  assert.equal(auditTrace(events.slice(0, 6).map(JSON.stringify).join("\n")).phases.unpartitioned.legacyNormalizedTokens, 35)
  const interrupted = auditTrace(text + "\n" + JSON.stringify({ type: "step_start", part: { messageID: "d" } }))
  assert.equal(interrupted.terminalStopObserved, false)
  assert.deepEqual(interrupted.unfinishedMessages, ["d"])
  assert.throws(() => auditTrace(text + '\n{"broken":'), /Invalid JSON/)
  assert.throws(() => auditTrace("preamble only"), /No recorded model usage/)
  assert.throws(() => auditTrace(text + "\n" + JSON.stringify(finish("c"))), /duplicate/)
  const invalid = finish("z")
  invalid.part.tokens.input = -1
  assert.throws(() => auditTrace(JSON.stringify(invalid)), /Invalid usage/)
  const mixed = finish("z")
  mixed.sessionID = "another"
  assert.throws(() => auditTrace(text + "\n" + JSON.stringify(mixed)), /Mixed sessions/)
})

test("CLI retains missing usage as invalid and refuses to overwrite an earlier report", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kudzu-harness-audit-"))
  try {
    const stream = join(directory, "adapter.stdout"), out = join(directory, "audit.json")
    await writeFile(stream, "npm installation only\n")
    const args = [fileURLToPath(new URL("./ai-harness-audit.mjs", import.meta.url)), "--out", out, stream]
    const result = spawnSync(process.execPath, args, { encoding: "utf8" })
    assert.equal(result.status, 1)
    const original = await readFile(out, "utf8"), report = JSON.parse(original)
    assert.equal(report.complete, false)
    assert.equal(report.reports[0].status, "invalid")
    assert.equal(report.reports[0].error, "No recorded model usage")
    assert.equal(await readFile(stream, "utf8"), "npm installation only\n")
    assert.equal(spawnSync(process.execPath, args).status, 1)
    assert.equal(await readFile(out, "utf8"), original)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
