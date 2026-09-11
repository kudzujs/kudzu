import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { staticOutputChecks } from "./ai-delivery-production-acceptance.mjs"

const workspace = resolve(process.argv[2])
const manifest = JSON.parse(await readFile(join(workspace, "package.json"), "utf8"))
assert.ok(manifest.dependencies?.astro, "This additional static-output check is for Astro Content")
const run = spawnSync(process.execPath, [new URL("./ai-delivery-production-acceptance.mjs", import.meta.url).pathname, workspace, "content"], { encoding: "utf8", timeout: 120000 })
if (run.error || run.signal) throw run.error ?? new Error(`Acceptance interrupted: ${run.signal}`)
const report = JSON.parse(run.stdout)
// Reuse the same behavior/a11y/browser checks and require all ten static siblings.
const output = await staticOutputChecks("content", true, join(workspace, "dist"))
report.output = { ...report.output, ...output }
report.passed = run.status === 0 && report.passed && output.passed
process.stdout.write(JSON.stringify(report) + "\n")
if (!report.passed) process.exitCode = 1
