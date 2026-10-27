import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { gzipSync } from "node:zlib"

const bytes = value => Buffer.byteLength(value)
const hash = value => createHash("sha256").update(value).digest("hex")
const category = name => {
  if (["data-k-state", "data-k-value", "data-k-layout-state"].includes(name)) return "state-seeds"
  if (name.startsWith("data-k-bind") || ["data-k-text", "data-k-text-bindings", "data-k-list-attrs", "data-k-list-text", "data-k-list-expression", "data-k-list-expression-attrs"].includes(name)) return "bindings"
  if (name.startsWith("data-k-on-") || name.startsWith("data-k-native") || name.startsWith("data-k-set-true-") || name === "data-k-list-events") return "events"
  if (name === "data-k-list" || name === "data-k-if") return "structural-descriptors"
  if (name.startsWith("data-k-effect")) return "effects"
  return "other-ownership-markers"
}

// Source accounting only: retain encoded values and original whitespace, never reserialize HTML.
export function census(source) {
  const entries = new Map(), spans = []
  const add = (name, group, start, end, value) => {
    const entry = entries.get(name) ?? { name, category: group, occurrences: 0, rawBytes: 0, valueBytes: 0, values: new Map() }
    entry.occurrences++
    entry.rawBytes += bytes(source.slice(start, end))
    entry.valueBytes += bytes(value)
    entry.values.set(value, (entry.values.get(value) ?? 0) + 1)
    entries.set(name, entry)
    spans.push({ start, end })
  }
  let cursor = 0
  while (cursor < source.length) {
    const start = source.indexOf("<", cursor)
    if (start < 0) break
    if (source.startsWith("<!--", start)) {
      const end = source.indexOf("-->", start + 4)
      assert.ok(end >= 0, "unterminated HTML comment")
      const value = source.slice(start + 4, end)
      if (/^k-[\w-]+(?::|$)/.test(value)) add(`comment:${value.split(":")[0]}`, "binding-range-comments", start, end + 3, value)
      cursor = end + 3
      continue
    }
    if (/^<!doctype\b/i.test(source.slice(start, start + 10))) {
      cursor = source.indexOf(">", start) + 1
      assert.ok(cursor > start, "unterminated doctype")
      continue
    }
    const tag = /^<(\/?)([a-z][\w:-]*)/i.exec(source.slice(start))
    if (!tag) { cursor = start + 1; continue }
    let position = start + tag[0].length
    while (true) {
      const end = /^\s*\/?>/.exec(source.slice(position))
      if (end) { position += end[0].length; break }
      assert.equal(tag[1], "", "attributes on closing tag")
      const attribute = /^\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/.exec(source.slice(position))
      assert.ok(attribute, `invalid attribute at ${position}`)
      const name = attribute[1].toLowerCase()
      if (name.startsWith("data-k-")) add(name, category(name), position, position + attribute[0].length, attribute[2] ?? attribute[3] ?? attribute[4] ?? "")
      position += attribute[0].length
    }
    cursor = position
    if (!tag[1] && ["script", "style", "textarea", "title"].includes(tag[2].toLowerCase())) {
      const close = new RegExp(`</${tag[2]}\\s*>`, "ig")
      close.lastIndex = cursor
      assert.ok(close.exec(source), `unclosed raw-text element ${tag[2]}`)
      cursor = close.lastIndex
    }
  }
  const attributes = [...entries.values()].map(({ values, ...entry }) => ({ ...entry,
    syntaxBytes: entry.rawBytes - entry.valueBytes,
    distinctEncodedValues: values.size,
    repeatedValueBytes: [...values].reduce((sum, [value, count]) => sum + bytes(value) * (count - 1), 0)
  })).sort((a, b) => b.rawBytes - a.rawBytes || a.name.localeCompare(b.name))
  const categories = {}
  for (const entry of attributes) categories[entry.category] = (categories[entry.category] ?? 0) + entry.rawBytes
  const metadataBytes = attributes.reduce((sum, entry) => sum + entry.rawBytes, 0)
  const rawBytes = bytes(source), residualBytes = rawBytes - metadataBytes
  let last = 0, residual = ""
  for (const span of spans) {
    assert.ok(span.start >= last, "overlapping metadata spans")
    residual += source.slice(last, span.start)
    last = span.end
  }
  residual += source.slice(last)
  assert.equal(bytes(residual), residualBytes)
  assert.equal(Object.values(categories).reduce((sum, size) => sum + size, residualBytes), rawBytes)
  return { sha256: hash(source), rawBytes, gzipBytes: gzipSync(source, { level: 9 }).length, metadataBytes, residualBytes, categories, attributes }
}

export async function censusDirectory(directory) {
  const pages = []
  for (const path of (await readdir(directory, { recursive: true })).filter(path => path.endsWith(".html")).sort()) {
    const source = await readFile(join(directory, path), "utf8")
    pages.push({ path, ...census(source) })
  }
  assert.ok(pages.length, "no HTML inputs")
  return { directory: resolve(directory), pages }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert.equal(process.argv.length, 5, "Usage: node test/html-byte-census.mjs C2_DIST PROJECT_DIST OUTPUT_JSON")
  const [c2, project] = await Promise.all(process.argv.slice(2, 4).map(censusDirectory))
  await writeFile(process.argv[4], JSON.stringify({ c2, project }, null, 2))
}
