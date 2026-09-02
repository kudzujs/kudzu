import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import test from "node:test"

const chrome = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(path => path && existsSync(path))

if (process.env.KUDZU_REQUIRE_CHROME && !chrome) throw new Error("Chrome is required for the project list decision test; set CHROME_BIN to an executable Chrome or Chromium binary")

test("freezes the 0.21.0 large-list pagination acceptance", { skip: !chrome && "Chrome unavailable", timeout: 120_000 }, () => {
  const result = spawnSync(process.execPath, [new URL("./project-list-decision-performance.mjs", import.meta.url).pathname], {
    encoding: "utf8",
    env: { ...process.env, ACCEPTANCE: "1", CHROME_BIN: chrome, DIAGNOSTIC: "1", RUNS: "1", STRATEGIES: "pagination" },
    timeout: 120_000
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
  const report = JSON.parse(result.stdout)
  assert.deepEqual(report.acceptance, { keyboard: true, focus: true, releasedState: true, staticExclusion: true })
  assert.deepEqual(report.strategies.pagination.rows, { runs: [100], median: 100, min: 100, max: 100 })
})
