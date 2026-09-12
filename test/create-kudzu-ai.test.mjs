import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile, copyFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { docs, check } from "../packages/create-kudzu/ai.mjs"

test("reads installed README sections without including fenced headings or hiding truncation", async t => {
  const root = await mkdtemp(join(tmpdir(), "kudzu-ai-docs-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const directory = join(root, "node_modules/@kudzujs/core")
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, "package.json"), JSON.stringify({ version: "0.16.30" }))
  const text = "# Kudzu\n\n## Authoring\nUse state.\n```md\n## Not a section\n```\n## C#\n" + "x".repeat(7000) + "\n## Verify ##\nCheck behavior.\n"
  await writeFile(join(directory, "README.md"), text)
  assert.deepEqual((await docs(root)).headings, ["Authoring", "C#", "Verify"])
  const authoring = await docs(root, "authoring")
  assert.equal(authoring.version, "0.16.30")
  assert.equal(authoring.startLine, 3)
  assert.equal(authoring.endLine, 7)
  assert.match(authoring.text, /Not a section/)
  assert.doesNotMatch(authoring.text, /Check behavior/)
  assert.equal(authoring.truncated, false)
  const large = await docs(root, "C#")
  assert.equal(large.text.length, 6000)
  assert.equal(large.truncated, true)
  await assert.rejects(docs(root, "../../package.json"), /exact README heading/)
  assert.equal(await readFile(join(directory, "README.md"), "utf8"), text)
})

test("executes the real check, retains complete logs, propagates failure, and bounds execution", { timeout: 20000 }, async t => {
  const root = await mkdtemp(join(tmpdir(), "kudzu-ai-check-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await copyFile(new URL("../packages/create-kudzu/ai.mjs", import.meta.url), join(root, "kudzu-ai.mjs"))
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module", scripts: { check: "node check.mjs" } }))
  await writeFile(join(root, "check.mjs"), 'console.log("start"); console.log("x".repeat(8000)); console.error("ERROR_IN_FULL_LOG"); console.log("y".repeat(8000)); process.exit(7)\n')
  const failed = await check(root, 10000)
  assert.equal(failed.passed, false)
  assert.equal(failed.exitCode, 7)
  assert.equal(failed.browserVerified, false)
  assert.equal(failed.log.truncated, true)
  assert.ok(failed.log.excerpt.length < 4300)
  const full = await readFile(failed.log.path)
  assert.equal(full.length, failed.log.bytes)
  assert.match(full.toString(), /ERROR_IN_FULL_LOG/)
  assert.doesNotMatch(failed.log.excerpt, /ERROR_IN_FULL_LOG/)
  const cli = spawnSync(process.execPath, [join(root, "kudzu-ai.mjs"), "check"], { cwd: tmpdir(), encoding: "utf8", timeout: 10000 })
  assert.equal(cli.status, 7)
  assert.equal(JSON.parse(cli.stdout).passed, false)
  await writeFile(join(root, "check.mjs"), 'console.log("passed")\n')
  const passed = await check(root, 10000)
  assert.equal(passed.passed, true)
  assert.equal(passed.log.truncated, false)
  assert.notEqual(passed.log.path, failed.log.path)
  assert.deepEqual(await readFile(failed.log.path), full)
  await writeFile(join(root, "check.mjs"), 'import { spawn } from "node:child_process"; import { writeFileSync } from "node:fs"; const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"]); writeFileSync("child.pid", String(child.pid)); setInterval(() => {}, 1000)\n')
  const timeout = await check(root, 3000)
  assert.equal(timeout.passed, false)
  assert.equal(timeout.timedOut, true)
  if (process.platform !== "win32") {
    const pid = Number(await readFile(join(root, "child.pid"), "utf8"))
    // Killed children can briefly remain zombies; ps status distinguishes them from a live worker.
    const status = spawnSync("ps", ["-p", String(pid), "-o", "stat="], { encoding: "utf8" })
    assert.ok(status.status !== 0 || !status.stdout.trim() || status.stdout.trim().startsWith("Z"), status.stdout)
  }
  await assert.rejects(check(root, 0), /timeout-ms/)
  await writeFile(join(root, "check.mjs"), 'import { check } from "./kudzu-ai.mjs"; await check(process.cwd())\n')
  const recursive = await check(root, 10000)
  assert.equal(recursive.passed, false)
  assert.match((await readFile(recursive.log.path)).toString(), /recursively/)
})
