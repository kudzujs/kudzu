import assert from "node:assert/strict"
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import test from "node:test"
import ts from "typescript"
import { buildWithSession } from "../framework/build.mjs"
import { createProjectSession } from "../framework/compiler/project-session.mjs"

test("preloads only the emitted eager document graph in clean and cached builds", async t => {
  for (const [source, base] of [["../../benchmarks/runtime-matrix/kudzu", ""], ["shared-lazy-codemirror", "/preload&test"], ["codemirror-editor", "/editor"], ["worker-effects", "/dash"]]) {
    const fixture = await mkdtemp(resolve("test/fixtures/preload-"))
    t.after(() => rm(fixture, { recursive: true, force: true }))
    await cp(resolve("test/fixtures", source, "src"), join(fixture, "src"), { recursive: true })
    if (source === "codemirror-editor") await cp(join(fixture, "src/pages/index.tsx"), join(fixture, "src/pages/second.tsx"))
    if (source === "shared-lazy-codemirror") await writeFile(join(fixture, "src/pages/eager.tsx"), `import { useEffect } from "@kudzujs/core"; import { EditorView } from "@codemirror/view"; export default function Eager() { useEffect(() => { console.log(EditorView) }, []); return <p>Eager package owner</p> }`)
    await writeFile(join(fixture, "kudzu.config.mjs"), `export default ${JSON.stringify({ base })}`)
    const project = createProjectSession(fixture)
    let initial
    for (const options of [{ retainCache: false }, { retainCache: true }, { retainCache: true, changedFiles: [] }]) {
      await buildWithSession(project, { quiet: true, ...options })
      const dist = join(fixture, "dist")
      const outputs = (await readdir(dist, { recursive: true })).filter(path => /\.(html|js)$/.test(path)).sort()
      const files = Object.fromEntries(await Promise.all(outputs.map(async path => [path, await readFile(join(dist, path), "utf8")])))
      if (initial) assert.deepEqual(files, initial, "cached and clean output")
      else initial = files
      for (const [path, html] of Object.entries(files).filter(([path]) => path.endsWith(".html"))) {
        const decode = value => value.replaceAll("&amp;", "&")
        const scripts = [...html.matchAll(/<script type="module"[^>]* src="([^"]+)"/g)].map(match => decode(match[1]))
        const preloads = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map(match => decode(match[1]))
        const expected = new Set(scripts)
        for (const url of expected) {
          const source = files[url.slice(base.length + 1)]
          assert.equal(typeof source, "string", url)
          const parsed = ts.createSourceFile(url, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
          for (const node of parsed.statements) {
            if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier) continue
            expected.add(new URL(node.moduleSpecifier.text, `https://test.invalid${url}`).pathname)
          }
        }
        assert.deepEqual([...preloads].sort(), [...expected].sort(), `${source} ${path} exact eager closure`)
        assert.equal(preloads.length, new Set(preloads).size)
        assert.equal(preloads.some(url => url.includes("/workers/")), false)
        if (!scripts.length) assert.deepEqual(preloads, [], "static route")
        if (source.includes("runtime-matrix") && path === "index.html") {
          assert.equal(scripts.length, 5)
          assert.equal(preloads.length, 11)
        }
      }
      const report = JSON.parse(await readFile(join(fixture, ".kudzu/kudzu-artifacts.json")))
      if (source === "codemirror-editor") assert.ok(report.sharedChunks.some(chunk => chunk.routes.length === 2), "shared eager package chunk")
      for (const route of report.routes) {
        const path = route.route.slice(base.length).replace(/^\//, "")
        const html = files[path ? `${path}/index.html` : "index.html"]
        for (const lazy of route.handlers.lazyChunks) assert.equal(html.includes(lazy.replaceAll("&", "&amp;")), false, lazy)
      }
    }
  }
})
