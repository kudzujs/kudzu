import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { fileURLToPath } from "node:url"

test("creates a Kudzu project", async t => {
  const directory = await mkdtemp(join(tmpdir(), "create-kudzu-"))
  t.after(() => rm(directory, { recursive: true, force: true }))

  const generator = fileURLToPath(new URL("../packages/create-kudzu/index.mjs", import.meta.url))
  const result = spawnSync(process.execPath, [generator, "app", "--no-install"], {
    cwd: directory,
    encoding: "utf8"
  })

  assert.equal(result.status, 0, result.stderr)
  const packageJson = JSON.parse(await readFile(join(directory, "app/package.json"), "utf8"))
  const page = await readFile(join(directory, "app/src/pages/index.tsx"), "utf8")
  assert.equal(packageJson.dependencies["@kudzujs/core"], "^0.6.6")
  assert.match(page, /useState/)
})
