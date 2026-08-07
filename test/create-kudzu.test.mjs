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
  const tsconfig = JSON.parse(await readFile(join(directory, "app/tsconfig.json"), "utf8"))
  const page = await readFile(join(directory, "app/src/pages/index.tsx"), "utf8")
  const staticPage = await readFile(join(directory, "app/src/pages/about.tsx"), "utf8")
  const component = await readFile(join(directory, "app/src/components/CapabilityCard.tsx"), "utf8")
  const readme = await readFile(join(directory, "app/README.md"), "utf8")
  assert.equal(packageJson.dependencies["@kudzujs/core"], "^0.8.10")
  assert.deepEqual(tsconfig.compilerOptions.types, [])
  assert.equal(packageJson.devDependencies.typescript, "^5.9.2")
  assert.equal(packageJson.scripts.check, "tsc --noEmit && kudzu build")
  assert.match(page, /useState/)
  assert.match(page, /CapabilityCard/)
  assert.match(page, /export const metadata/)
  assert.doesNotMatch(staticPage, /useState|onClick/)
  assert.match(component, /function CapabilityCard/)
  assert.match(readme, /working Kudzu showcase/)
  assert.match(readme, /kudzu\.config\.mjs.*optional/)
})
