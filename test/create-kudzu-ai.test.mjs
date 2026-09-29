import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
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
  await writeFile(join(root, "check.mjs"), 'console.log("start"); console.log("x".repeat(8000)); console.error("Error: ROOT_CAUSE_MARKER"); console.log("y".repeat(8000)); process.exit(7)\n')
  const failed = await check(root, 10000)
  assert.equal(failed.passed, false)
  assert.equal(failed.exitCode, 7)
  assert.equal(failed.browserVerified, false)
  assert.equal(failed.log.truncated, true)
  assert.ok(failed.log.excerpt.length < 4300)
  const full = await readFile(failed.log.path)
  assert.equal(full.length, failed.log.bytes)
  assert.match(full.toString(), /ROOT_CAUSE_MARKER/)
  assert.match(failed.log.excerpt, /Error: ROOT_CAUSE_MARKER/)
  await writeFile(join(root, "check.mjs"), 'console.error("x".repeat(8000) + "error TS2322: WRONG_TYPE" + "y".repeat(8000)); process.exit(7)\n')
  const inlineFailure = await check(root, 10000)
  assert.equal(inlineFailure.passed, false)
  assert.match(inlineFailure.log.excerpt, /error TS2322: WRONG_TYPE/)
  assert.ok(inlineFailure.log.excerpt.length < 4300)
  const cli = spawnSync(process.execPath, [join(root, "kudzu-ai.mjs"), "check"], { cwd: tmpdir(), encoding: "utf8", timeout: 10000 })
  assert.equal(cli.status, 7)
  assert.equal(JSON.parse(cli.stdout).passed, false)
  await writeFile(join(root, "check.mjs"), 'console.log("passed")\n')
  const passed = await check(root, 10000)
  assert.equal(passed.passed, true)
  assert.equal(passed.log.truncated, false)
  assert.notEqual(passed.log.path, failed.log.path)
  assert.deepEqual(await readFile(failed.log.path), full)
  await writeFile(join(root, "check.mjs"), 'console.log("noise".repeat(3200)); console.log("passed")\n')
  const verbosePass = await check(root, 10000)
  assert.equal(verbosePass.passed, true)
  assert.equal(verbosePass.log.truncated, true)
  assert.ok(verbosePass.log.bytes > 16000)
  assert.ok(verbosePass.log.excerpt.length <= 512, "successful check returns only the status tail")
  assert.match(verbosePass.log.excerpt, /passed/)
  assert.match(await readFile(verbosePass.log.path, "utf8"), /noise/)
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

test("managed check descendants stop when their outer process group is killed", { timeout: 20000, skip: process.platform === "win32" }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kudzu-ai-owner-"))
  await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module", scripts: { check: "node worker.mjs" } }))
  await writeFile(join(root, "worker.mjs"), 'import {writeFileSync} from "node:fs";writeFileSync("worker.pid",String(process.pid));let n=0;setInterval(()=>writeFileSync("heartbeat",String(++n)),25)')
  const helper = new URL("../packages/create-kudzu/ai.mjs", import.meta.url).href
  const outer = spawn(process.execPath, ["--input-type=module", "-e", `const {check}=await import(${JSON.stringify(helper)});await check(${JSON.stringify(root)},10000)`], { detached: true, stdio: "ignore", env: { ...process.env, KUDZU_AI_DELIVERY_GROUP: "1" } })
  const exited = new Promise(resolve => outer.once("exit", resolve))
  let group
  try {
    let worker
    for (let i = 0; i < 100; i++) {
      try { worker = Number(await readFile(join(root, "worker.pid"), "utf8")); await readFile(join(root, "heartbeat")); break } catch { await new Promise(resolve => setTimeout(resolve, 50)) }
    }
    assert.ok(worker > 1, "managed check worker must start")
    const workerGroup = Number(spawnSync("ps", ["-p", String(worker), "-o", "pgid="], { encoding: "utf8" }).stdout.trim())
    const selfGroup = Number(spawnSync("ps", ["-p", String(process.pid), "-o", "pgid="], { encoding: "utf8" }).stdout.trim())
    assert.ok(workerGroup > 1 && workerGroup !== selfGroup, "cleanup is limited to the test's owned groups")
    group = workerGroup
    process.kill(-outer.pid, "SIGKILL")
    await exited
    const before = await readFile(join(root, "heartbeat"), "utf8")
    await new Promise(resolve => setTimeout(resolve, 250))
    assert.equal(await readFile(join(root, "heartbeat"), "utf8"), before, "check must not keep writing after its outer owner is killed")
    assert.equal(group, outer.pid, "managed descendants inherit the outer group")
    const state = spawnSync("ps", ["-p", String(worker), "-o", "stat="], { encoding: "utf8" })
    assert.ok(state.status !== 0 || !state.stdout.trim() || state.stdout.trim().startsWith("Z"))
  } finally {
    for (const pid of new Set([outer.pid, group].filter(pid => pid > 1))) try { process.kill(-pid, "SIGKILL") } catch (error) { if (error.code !== "ESRCH") throw error }
    await exited
    await rm(root, { recursive: true, force: true })
  }
})

test("managed check timeout and interruption stop its descendants without killing sibling work", { timeout: 30000, skip: process.platform === "win32" }, async () => {
  for (const mode of ["timeout", "signal"]) {
    const root = await mkdtemp(join(tmpdir(), "kudzu-ai-managed-"))
    await writeFile(join(root, "package.json"), JSON.stringify({ private: true, type: "module", scripts: { check: "node worker.mjs" } }))
    await writeFile(join(root, "worker.mjs"), 'import{spawn}from"node:child_process";import{writeFileSync}from"node:fs";const child=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});writeFileSync("workers.json",JSON.stringify([process.pid,child.pid]));console.log("worker started");setInterval(()=>{},1000)')
    const helper = new URL("../packages/create-kudzu/ai.mjs", import.meta.url).href
    const script = `import{spawn,spawnSync}from'node:child_process';const {check}=await import(${JSON.stringify(helper)});const sibling=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});try{const result=await check(${JSON.stringify(root)},${mode === "timeout" ? 3000 : 10000});const state=spawnSync('ps',['-p',String(sibling.pid),'-o','stat='],{encoding:'utf8'}).stdout.trim();console.log(JSON.stringify({result,siblingAlive:!!state&&!state.startsWith('Z')}))}finally{sibling.kill('SIGKILL')}`
    const outer = spawn(process.execPath, ["--input-type=module", "-e", script], { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, KUDZU_AI_DELIVERY_GROUP: "1" } })
    let stdout = "", stderr = ""
    outer.stdout.on("data", data => { stdout += data })
    outer.stderr.on("data", data => { stderr += data })
    const exited = new Promise(resolve => outer.once("close", code => resolve(code)))
    try {
      let workers
      for (let i = 0; i < 100; i++) {
        try { workers = JSON.parse(await readFile(join(root, "workers.json"), "utf8")); break } catch { await new Promise(resolve => setTimeout(resolve, 50)) }
      }
      assert.equal(workers?.length, 2, "managed worker and grandchild must start")
      if (mode === "signal") outer.kill("SIGTERM")
      assert.equal(await exited, 0, stderr)
      const { result, siblingAlive } = JSON.parse(stdout)
      assert.equal(siblingAlive, true)
      assert.equal(result.passed, false)
      assert.equal(result.timedOut, mode === "timeout")
      assert.equal(result.interrupted, mode === "signal" ? "SIGTERM" : null)
      assert.equal(result.error, null)
      assert.match(await readFile(result.log.path, "utf8"), /worker started/)
      for (const pid of workers) {
        const state = spawnSync("ps", ["-p", String(pid), "-o", "stat="], { encoding: "utf8" })
        assert.ok(state.status !== 0 || !state.stdout.trim() || state.stdout.trim().startsWith("Z"), `live check descendant ${pid}: ${state.stdout}`)
      }
    } finally {
      try { process.kill(-outer.pid, "SIGKILL") } catch (error) { if (error.code !== "ESRCH") throw error }
      await exited
      await rm(root, { recursive: true, force: true })
    }
  }
})
