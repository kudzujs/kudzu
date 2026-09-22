import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import test from "node:test"

test("publication verification retries visible errors and requires a successful matching lookup", { skip: process.platform === "win32" }, async t => {
  const workflow = await readFile(new URL("../.github/workflows/publish.yml", import.meta.url), "utf8")
  const block = workflow.match(/      - name: Verify published versions\n        timeout-minutes: 15\n        run: \|\n((?:          .*\n|\n)+)/)?.[1]
  assert.ok(block, "execute the actual publication verification step")
  const script = block.split("\n").map(line => line.slice(10)).join("\n")
  const root = await mkdtemp(join(tmpdir(), "publish-verification-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "bin"))
  await mkdir(join(root, "packages/create-kudzu"), { recursive: true })
  await writeFile(join(root, "package.json"), JSON.stringify({ version: "1.2.3" }))
  await writeFile(join(root, "packages/create-kudzu/package.json"), JSON.stringify({ version: "0.0.7" }))
  await writeFile(join(root, "bin/npm"), `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2), version = args[1].split("@").at(-1);
fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(args) + "\\n");
const calls = fs.readFileSync(process.env.CALL_LOG, "utf8").trim().split("\\n").length;
if (process.env.MODE === "retry" && calls === 1 || process.env.MODE === "processing" && calls <= 13) {
  console.error("npm error E404 registry not yet updated"); process.exitCode = 1;
} else if (process.env.MODE === "unauthorized") {
  console.log(version); console.error("npm error E401 lookup rejected"); process.exitCode = 1;
} else console.log(process.env.MODE === "mismatch" ? "0.0.0" : version);
`, { mode: 0o755 })
  await writeFile(join(root, "bin/sleep"), '#!/bin/sh\nprintf "%s\\n" "$1" >> "$SLEEP_LOG"\n', { mode: 0o755 })
  for (const mode of ["retry", "processing", "unauthorized", "mismatch"]) {
    const log = join(root, `${mode}.jsonl`)
    const sleepLog = join(root, `${mode}-sleep.txt`)
    const result = spawnSync("bash", ["-e", "-c", script], { cwd: root, env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, MODE: mode, CALL_LOG: log, SLEEP_LOG: sleepLog }, encoding: "utf8", timeout: 30000 })
    const calls = (await readFile(log, "utf8")).trim().split("\n").map(JSON.parse)
    const succeeds = mode === "retry" || mode === "processing"
    assert.equal(result.status, succeeds ? 0 : 1, result.stderr)
    assert.equal(calls.length, mode === "retry" ? 3 : mode === "processing" ? 15 : 120)
    const sleeps = (await readFile(sleepLog, "utf8")).trim().split("\n")
    assert.equal(sleeps.length, mode === "retry" ? 1 : mode === "processing" ? 13 : 119)
    assert.ok(sleeps.every(seconds => seconds === "5"), "poll every five seconds without sleeping after exhaustion")
    if (succeeds) {
      assert.match(result.stderr, /E404 registry not yet updated/)
      assert.deepEqual(calls.at(-1), ["view", "create-kudzu@0.0.7", "version"])
    } else {
      assert.ok(calls.every(args => args[1] === "@kudzujs/core@1.2.3"), "stop before the next package after failure")
      assert.match(result.stderr, mode === "unauthorized" ? /E401 lookup rejected/ : /Expected 1\.2\.3.*0\.0\.0/)
    }
  }
})
