import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFile, readdir } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { build } from "../framework/build.mjs"

const root = resolve(import.meta.dirname, "..")
const fixtures = [
  ["greenfield", "project-application"],
  ["editor", "codemirror-editor"],
  ["lazy-editor", "lazy-codemirror"],
  ["lazy-editor-journey", "codemirror-editor-lazy"],
  ["answer-questions", "apache-answer-browser-questions"],
  ["answer-routes", "apache-answer-route-shell"],
  ["answer-auth", "apache-answer-auth-ownership"],
  ["answer-authoring", "apache-answer-authoring-admin"],
  ["memos-outline", "memos-outline-migration"]
]

const report = { schema: 1, packet: "0.18.2", revision: process.env.GITHUB_SHA || "working-tree", fixtures: [] }

for (const [name, directory] of fixtures) {
  const fixture = join(root, "test/fixtures", directory)
  await build({ root: fixture, quiet: true })
  const artifacts = JSON.parse(await readFile(join(fixture, ".kudzu/kudzu-artifacts.json"), "utf8"))
  assert.equal(artifacts.version, 2)
  const files = await inventory(join(fixture, "dist"))
  const owners = new Map()
  const routes = []

  for (const route of artifacts.routes) {
    const source = sourcePath(route.route)
    await readFile(join(fixture, source))
    const htmlPath = route.route === "/" ? "index.html" : `${route.route.slice(1)}/index.html`
    const html = files.get(htmlPath)
    assert.ok(html, `${name} ${route.route} did not emit ${htmlPath}`)
    const edges = [
      ...route.runtime.entries.map(path => [path, "runtime-entry"]),
      ...route.runtime.requirements.map(path => [path, "runtime-requirement"]),
      ...route.handlers.entries.map(path => [path, "handler-entry"]),
      ...route.handlers.chunks.map(path => [path, "handler-chunk"]),
      ...(route.handlers.lazyChunks ?? []).map(path => [path, "lazy-handler-chunk"]),
      ...route.workers.flatMap(worker => [[worker.entry, `worker:${worker.source}`], ...worker.chunks.map(path => [path, `worker-chunk:${worker.source}`])]),
      ...route.styles.map(path => [path, "style"])
    ]
    const owned = new Map()
    for (const [url, reason] of edges) {
      const path = new URL(url, "https://kudzu.invalid").pathname.slice(1)
      const file = files.get(path)
      assert.ok(file, `${name} ${route.route} owns missing artifact ${url}`)
      const reasons = owned.get(path) ?? new Set()
      reasons.add(reason)
      owned.set(path, reasons)
      const routesForFile = owners.get(path) ?? new Set()
      routesForFile.add(route.route)
      owners.set(path, routesForFile)
    }
    const scripts = matches(html.text, /<script\b[^>]*type="module"[^>]*src="([^"]+)"/g)
    const preloads = matches(html.text, /<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)
    assert.deepEqual(preloads, scripts, `${name} ${route.route} modulepreload mismatch`)
    const assets = [...owned].sort(([left], [right]) => left.localeCompare(right)).map(([path, reasons]) => ({ path, reasons: [...reasons].sort(), ...fileRecord(files.get(path)) }))
    const eagerAssets = assets.filter(asset => !asset.reasons.includes("lazy-handler-chunk"))
    const lazyAssets = assets.filter(asset => asset.reasons.includes("lazy-handler-chunk"))
    routes.push({
      route: route.route,
      source,
      html: { path: htmlPath, ...fileRecord(html) },
      assets,
      eagerRawBytes: eagerAssets.reduce((total, file) => total + file.rawBytes, 0),
      eagerGzipBytes: eagerAssets.reduce((total, file) => total + file.gzipBytes, 0),
      lazyRawBytes: lazyAssets.reduce((total, file) => total + file.rawBytes, 0),
      lazyGzipBytes: lazyAssets.reduce((total, file) => total + file.gzipBytes, 0),
      rawBytes: assets.reduce((total, file) => total + file.rawBytes, 0),
      gzipBytes: assets.reduce((total, file) => total + file.gzipBytes, 0)
    })
  }

  for (const [path] of files) {
    if (path.startsWith("assets/") && path.endsWith(".js")) assert.ok(owners.has(path), `${name} emitted ownerless JavaScript ${path}`)
  }
  report.fixtures.push({
    name,
    directory,
    output: totals(files),
    sharedChunks: artifacts.sharedChunks,
    routes
  })
}

console.log(JSON.stringify(process.env.FULL ? report : {
  ...report,
  fixtures: report.fixtures.map(fixture => ({
    name: fixture.name,
    directory: fixture.directory,
    output: fixture.output,
    sharedChunks: fixture.sharedChunks,
    routes: fixture.routes.map(route => ({ route: route.route, source: route.source, html: route.html, artifacts: route.assets.length, lazyArtifacts: route.assets.filter(asset => asset.reasons.includes("lazy-handler-chunk")).length, eagerRawBytes: route.eagerRawBytes, eagerGzipBytes: route.eagerGzipBytes, lazyRawBytes: route.lazyRawBytes, lazyGzipBytes: route.lazyGzipBytes, rawBytes: route.rawBytes, gzipBytes: route.gzipBytes }))
  }))
}, null, 2))

async function inventory(directory) {
  const files = new Map()
  const walk = async current => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory()) await walk(path)
      else {
        const contents = await readFile(path)
        files.set(relative(directory, path).replaceAll("\\", "/"), { contents, text: contents.toString() })
      }
    }
  }
  await walk(directory)
  return files
}

function sourcePath(route) {
  if (route === "/") return "src/pages/index.tsx"
  return `src/pages/${route.slice(1)}.tsx`
}

function matches(source, pattern) {
  return [...source.matchAll(pattern)].map(match => match[1]).sort()
}

function fileRecord(file) {
  return {
    rawBytes: file.contents.length,
    gzipBytes: gzipSync(file.contents).length,
    sha256: createHash("sha256").update(file.contents).digest("hex")
  }
}

function totals(files) {
  const records = [...files].sort(([left], [right]) => left.localeCompare(right))
  return {
    files: files.size,
    rawBytes: records.reduce((total, [, file]) => total + file.contents.length, 0),
    gzipBytes: records.reduce((total, [, file]) => total + gzipSync(file.contents).length, 0),
    sha256: createHash("sha256").update(records.map(([path, file]) => `${path}:${createHash("sha256").update(file.contents).digest("hex")}`).join("\n")).digest("hex")
  }
}
