import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { cp, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { staticOutputChecks } from "./ai-delivery-production-acceptance.mjs"

// No model calls. Install the pinned Astro starter with npm ci before this smoke.
const starter = new URL("./fixtures/ai-delivery-production/content/starters/astro/", import.meta.url).pathname
const workspace = await mkdtemp(join(tmpdir(), "astro-content-"))
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: workspace, encoding: "utf8", timeout: 120000 })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  return result.stdout
}
try {
  for (const file of ["src", "package.json", "package-lock.json", "tsconfig.json"]) await cp(join(starter, file), join(workspace, file), { recursive: true })
  await symlink(join(starter, "node_modules"), join(workspace, "node_modules"))
  run("npm", ["run", "build"])
  assert.ok((await staticOutputChecks("content", true, join(workspace, "dist"))).passed)
  const initial = await readFile(join(workspace, "dist/articles/index.html"), "utf8")
  assert.equal((initial.match(/class="article-card"/g) ?? []).length, 6)
  assert.doesNotMatch(initial, /<script\b|<input\b/)
  const page = join(workspace, "src/pages/articles/index.astro")
  const source = await readFile(page, "utf8")
  // This validation implementation is outside the model starter and public context.
  await writeFile(page, source.replace('  <div class="article-grid">', '  <label for="query">Search articles</label><input id="query" type="search" /><p aria-live="polite" id="count">6 articles</p><p id="empty" hidden>No articles match your search.</p>\n  <div class="article-grid">') + `
<script>
  const input = document.querySelector<HTMLInputElement>('#query')!
  const grid = document.querySelector<HTMLElement>('.article-grid')!
  const count = document.querySelector<HTMLElement>('#count')!
  const empty = document.querySelector<HTMLElement>('#empty')!
  const rows = Array.from(grid.children)
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    const selected = rows.filter(row => [row.querySelector('h2')!.textContent!, row.querySelector('.eyebrow')!.textContent!].some(value => value.toLowerCase().includes(query)))
    grid.replaceChildren(...selected)
    count.textContent = selected.length + (selected.length === 1 ? ' article' : ' articles')
    empty.hidden = selected.length !== 0
  })
</script>
`)
  run("npm", ["run", "build"])
  const result = JSON.parse(run(process.execPath, [new URL("./astro-content-acceptance.mjs", import.meta.url).pathname, workspace]))
  assert.ok(result.passed)
  assert.equal(result.output.artifacts.length, 10)
  await writeFile(join(workspace, "dist/about/index.html"), '<!doctype html><script>console.log("unwanted static script")</script>')
  const invalid = spawnSync(process.execPath, [new URL("./astro-content-acceptance.mjs", import.meta.url).pathname, workspace], { cwd: workspace, encoding: "utf8", timeout: 120000 })
  assert.equal(invalid.status, 1)
  assert.equal(JSON.parse(invalid.stdout).output.passed, false)
  const files = await readdir(join(workspace, "dist"), { recursive: true })
  console.log(JSON.stringify({ passed: true, pages: files.filter(path => path.endsWith(".html")).length, staticSiblings: 10, behavior: result.behavior.passed, accessibility: result.accessibility.passed, browser: result.browser.passed, note: "Harness readiness only; hand-authored smoke is not AI delivery success or a framework ranking" }))
} finally {
  await rm(workspace, { recursive: true, force: true })
}
