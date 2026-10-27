import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"
import ts from "typescript"
import { analyze, partition } from "./c2-readiness-attribution.mjs"

export function markModule(source, path) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  assert.equal(file.parseDiagnostics.length, 0, `invalid emitted module: ${path}`)
  const visit = node => {
    if (ts.isFunctionLike(node)) {
      if (node.name && ts.isComputedPropertyName(node.name)) visit(node.name.expression)
      return
    }
    assert.ok(!ts.isAwaitExpression(node) && !(ts.isForOfStatement(node) && node.awaitModifier), `top-level await cannot measure synchronous module body: ${path}`)
    ts.forEachChild(node, visit)
  }
  visit(file)
  return `globalThis.performance.mark(${JSON.stringify(`c2-module-start:${path}`)});\n${source}\n;globalThis.performance.mark(${JSON.stringify(`c2-module-end:${path}`)});\n`
}

export async function instrumentModules(directory, manifestPath) {
  const manifest = []
  for (const entry of await readdir(directory, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".js")) continue
    const file = join(entry.parentPath, entry.name)
    const path = relative(directory, file).replaceAll("\\", "/")
    const source = await readFile(file, "utf8"), marked = markModule(source, path)
    const digest = text => createHash("sha256").update(text).digest("hex")
    manifest.push({ path, originalBytes: Buffer.byteLength(source), markedBytes: Buffer.byteLength(marked), originalSha256: digest(source), markedSha256: digest(marked) })
    await writeFile(file, marked)
  }
  assert.ok(manifest.length)
  await writeFile(manifestPath, JSON.stringify(manifest.sort((a, b) => a.path.localeCompare(b.path)), null, 2))
}

export function moduleAttribution(events, readiness, manifest) {
  const readinessReport = analyze(events, readiness)
  const start = events.find(event => event.name === "c2-initial-start")
  const end = Math.max(...events.filter(event => event.name === "c2-initial-ready").map(event => event.ts))
  const marks = events.filter(event => event.name.startsWith("c2-module-"))
  const modules = []
  for (const entry of manifest) {
    const starts = marks.filter(event => event.name === `c2-module-start:${entry.path}`)
    const ends = marks.filter(event => event.name === `c2-module-end:${entry.path}`)
    if (!starts.length && !ends.length) continue
    assert.equal(starts.length, 1, entry.path)
    assert.equal(ends.length, 1, entry.path)
    for (const mark of [...starts, ...ends]) {
      assert.equal(mark.pid, start.pid)
      assert.equal(mark.tid, start.tid)
      assert.equal(mark.args.data.navigationId, start.args.data.navigationId)
    }
    const left = starts[0].ts, right = ends[0].ts
    assert.ok(left >= start.ts && right >= left && right <= end, entry.path)
    const spans = events.filter(event => event.pid === start.pid && event.tid === start.tid && event.ph === "X")
    modules.push({ path: entry.path, startMilliseconds: (left - start.ts) / 1000, endMilliseconds: (right - start.ts) / 1000, bodyMilliseconds: (right - left) / 1000,
      ...(right > left ? partition(spans, left, right) : { totalsMicroseconds: {}, segments: [] }) })
  }
  assert.ok(modules.length, "no module bodies observed")
  assert.equal(marks.length, modules.length * 2, "unknown or unmatched module marks")
  modules.sort((a, b) => a.startMilliseconds - b.startMilliseconds)
  for (let i = 1; i < modules.length; i++) assert.ok(modules[i].startMilliseconds >= modules[i - 1].endMilliseconds, "synchronous ESM bodies must not overlap")
  return { readiness: readinessReport, modules, notObservedBeforeReadiness: manifest.filter(entry => !modules.some(module => module.path === entry.path)).map(entry => entry.path) }
}
