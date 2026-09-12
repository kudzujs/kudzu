import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

const root = fileURLToPath(new URL("..", import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), "kudzu-generator-smoke-"))
try {
  const [pack] = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { cwd: join(root, "packages/create-kudzu"), encoding: "utf8" }))
  execFileSync("tar", ["-xzf", join(temporary, pack.filename), "-C", temporary])
  assert.ok(pack.files.some(file => file.path === "ai.mjs"))
  const version = JSON.parse(await readFile(join(root, "package.json"), "utf8")).version
  const results = []
  let guidanceBytes
  for (const mode of ["baseline", "guided"]) {
    const parent = join(temporary, mode)
    await mkdir(parent)
    execFileSync(process.execPath, [join(temporary, "package/index.mjs"), "app", "--no-install", ...(mode === "guided" ? ["--ai"] : [])], { cwd: parent })
    const app = join(parent, "app")
    // Use identical installed core/TypeScript for both arms; no registry version drift.
    await mkdir(join(app, "node_modules/@kudzujs"), { recursive: true })
    await symlink(root, join(app, "node_modules/@kudzujs/core"), "dir")
    await symlink(join(root, "node_modules/typescript"), join(app, "node_modules/typescript"), "dir")
    await mkdir(join(app, "node_modules/.bin"))
    await symlink(join(root, "node_modules/typescript/bin/tsc"), join(app, "node_modules/.bin/tsc"))
    await symlink(join(root, "bin/kudzu.mjs"), join(app, "node_modules/.bin/kudzu"))
    if (mode === "guided") {
      const doc = JSON.parse(execFileSync(process.execPath, [join(app, "kudzu-ai.mjs"), "docs", "Authoring"], { encoding: "utf8" }))
      assert.equal(doc.version, version)
      assert.match(doc.text, /event.currentTarget/)
      const checked = JSON.parse(execFileSync("npm", ["run", "--silent", "ai", "--", "check"], { cwd: app, encoding: "utf8" }))
      assert.equal(checked.passed, true)
      assert.equal(checked.browserVerified, false)
      assert.match(await readFile(checked.log.path, "utf8"), /Built 2 page/)
      guidanceBytes = (await readFile(join(app, "AGENTS.md"))).length
    } else execFileSync("npm", ["run", "check"], { cwd: app, stdio: "inherit" })
    const dist = join(app, "dist"), outputs = {}
    for (const entry of await readdir(dist, { recursive: true, withFileTypes: true })) {
      if (!entry.isFile()) continue
      const file = join(entry.parentPath, entry.name)
      outputs[relative(dist, file)] = await readFile(file)
    }
    assert.ok(!Object.keys(outputs).some(path => /AGENTS|README|kudzu-ai|\.kudzu-ai/.test(path)))
    assert.doesNotMatch(outputs["about/index.html"].toString(), /<script|modulepreload/)
    results.push(outputs)
  }
  assert.deepEqual(results[1], results[0])
  console.log(JSON.stringify({ core: version, generatorFiles: pack.files.length, guidanceBytes, identicalDeployFiles: Object.keys(results[0]).length, deployRawBytes: Object.values(results[0]).reduce((sum, value) => sum + value.length, 0), deployAggregateGzipBytes: Object.values(results[0]).reduce((sum, value) => sum + gzipSync(value).length, 0), tokenSavings: "unmeasured" }))
} finally {
  await rm(temporary, { recursive: true, force: true })
}
