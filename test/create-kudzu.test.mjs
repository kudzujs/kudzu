import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
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
  assert.match(result.stdout, /cd app\s+npm install\s+npm run dev/)
  const packageJson = JSON.parse(await readFile(join(directory, "app/package.json"), "utf8"))
  const tsconfig = JSON.parse(await readFile(join(directory, "app/tsconfig.json"), "utf8"))
  const page = await readFile(join(directory, "app/src/pages/index.tsx"), "utf8")
  const staticPage = await readFile(join(directory, "app/src/pages/about.tsx"), "utf8")
  const component = await readFile(join(directory, "app/src/components/CapabilityCard.tsx"), "utf8")
  const header = await readFile(join(directory, "app/src/components/SiteHeader.tsx"), "utf8")
  const readme = await readFile(join(directory, "app/README.md"), "utf8")
  const generatorPackage = JSON.parse(await readFile(new URL("../packages/create-kudzu/package.json", import.meta.url), "utf8"))
  const generatorLock = JSON.parse(await readFile(new URL("../packages/create-kudzu/package-lock.json", import.meta.url), "utf8"))
  assert.equal(packageJson.dependencies["@kudzujs/core"], "^0.16.34")
  assert.deepEqual(tsconfig.compilerOptions.types, [])
  assert.equal(packageJson.devDependencies.typescript, "^5.9.2")
  assert.equal(packageJson.scripts.check, "tsc --noEmit && kudzu build")
  assert.match(page, /useState/)
  assert.match(page, /CapabilityCard/)
  assert.match(page, /export const metadata/)
  assert.doesNotMatch(staticPage, /useState|onClick/)
  assert.match(component, /function CapabilityCard/)
  assert.match(header, /import "\.\.\/style\.css"/)
  assert.match(readme, /working Kudzu showcase/)
  assert.match(readme, /kudzu\.config\.mjs.*optional/)
  assert.match(readme, /npm install\s+npm run dev/)
  assert.equal(generatorLock.version, generatorPackage.version)
  assert.equal(generatorLock.packages[""].version, generatorPackage.version)
  await assert.rejects(readFile(join(directory, "app/AGENTS.md")), { code: "ENOENT" })
})

test("opts into bounded app guidance without changing generated application code", async t => {
  const directory = await mkdtemp(join(tmpdir(), "create-kudzu-ai-"))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const generator = fileURLToPath(new URL("../packages/create-kudzu/index.mjs", import.meta.url))
  for (const mode of ["baseline", "guided"]) {
    const cwd = join(directory, mode)
    await mkdir(cwd)
    const result = spawnSync(process.execPath, [generator, "app", "--no-install", ...(mode === "guided" ? ["--ai"] : [])], { cwd, encoding: "utf8" })
    assert.equal(result.status, 0, result.stderr)
    if (mode === "guided") assert.match(result.stdout, /AGENTS\.md/)
  }
  const baseline = join(directory, "baseline/app"), guided = join(directory, "guided/app")
  const before = await readdir(baseline, { recursive: true }), after = await readdir(guided, { recursive: true })
  assert.deepEqual(after.toSorted(), [...before, "AGENTS.md", "kudzu-ai.mjs"].toSorted())
  for (const file of await readdir(baseline, { recursive: true, withFileTypes: true })) {
    if (!file.isFile() || ["README.md", "package.json", ".gitignore"].includes(file.name)) continue
    const path = join(file.parentPath, file.name)
    assert.deepEqual(await readFile(path), await readFile(path.replace(baseline, guided)))
  }
  const originalManifest = JSON.parse(await readFile(join(baseline, "package.json"), "utf8"))
  const guidedManifest = JSON.parse(await readFile(join(guided, "package.json"), "utf8"))
  assert.equal(guidedManifest.scripts.ai, "node kudzu-ai.mjs")
  delete guidedManifest.scripts.ai
  assert.deepEqual(guidedManifest, originalManifest)
  assert.equal(await readFile(join(guided, ".gitignore"), "utf8"), await readFile(join(baseline, ".gitignore"), "utf8") + ".kudzu-ai/\n")
  assert.deepEqual(await readFile(join(guided, "kudzu-ai.mjs")), await readFile(new URL("../packages/create-kudzu/ai.mjs", import.meta.url)))
  const guidance = await readFile(join(guided, "AGENTS.md"), "utf8")
  assert.ok(Buffer.byteLength(guidance) <= 2048, "default AI context must stay within 2 KiB")
  assert.match(guidance, /node_modules\/@kudzujs\/core\/README\.md/)
  assert.match(guidance, /npm run check/)
  assert.match(guidance, /browser/)
  assert.match(await readFile(join(guided, "README.md"), "utf8"), /AGENTS\.md/)
  await writeFile(join(guided, "AGENTS.md"), "User-owned instructions\n")
  const rejected = spawnSync(process.execPath, [generator, guided, "--ai", "--no-install"], { encoding: "utf8" })
  assert.notEqual(rejected.status, 0)
  assert.match(rejected.stderr, /not empty/)
  assert.equal(await readFile(join(guided, "AGENTS.md"), "utf8"), "User-owned instructions\n")
})
