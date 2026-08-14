import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import test from "node:test"
import { build as buildProject } from "../framework/build.mjs"

const cli = resolve("bin/kudzu.mjs")

test("stages output and rejects public artifact collisions", { timeout: 120_000 }, async t => {
  const fixture = await mkdtemp(resolve("test/fixtures/output-safety-"))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  const put = async (path, contents) => {
    const file = join(fixture, path)
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, contents)
  }
  const build = env => spawnSync(process.execPath, [cli, "build"], { cwd: fixture, encoding: "utf8", env: { ...process.env, ...env } })

  await put("src/pages/index.tsx", page("Generation A"))
  await put("src/pages/about.tsx", `
import { useEffect } from "@kudzujs/core"
import { label } from "../shared"
export default function About() {
  useEffect(() => {
    const worker = new Worker(new URL("../about.worker.ts", import.meta.url), { type: "module" })
    return () => worker.terminate()
  }, [])
  return <button onClick={() => { document.title = label("about") }}>About</button>
}
`)
  await put("src/shared.ts", `export const label = value => String(value)`)
  await put("src/worker-shared.ts", `export const ready = "ready"`)
  await put("src/task.worker.ts", `import { ready } from "./worker-shared"; self.addEventListener("message", () => postMessage(ready))`)
  await put("src/about.worker.ts", `import { ready } from "./worker-shared"; self.addEventListener("message", () => postMessage(ready))`)
  await put("src/app.css", `main { color: rebeccapurple; }`)
  await put("theme.css", `body { background: white; }`)
  await put("public/old-only.txt", "old")
  await put("kudzu.config.mjs", `
import { writeFile } from "node:fs/promises"
import { join } from "node:path"
export default {
  styles: [{ source: "theme.css", output: "/assets/configured.css" }],
  async afterBuild({ outDir }) {
    if (process.env.KUDZU_TEST_AFTER_BUILD_FAILURE === "1") {
      await writeFile(join(outDir, "failed-marker.txt"), "bad")
      throw new Error("intentional afterBuild failure")
    }
  }
}
`)

  const initial = build()
  assert.equal(initial.status, 0, `${initial.stdout}\n${initial.stderr}`)
  const expected = await fileManifest(join(fixture, "dist"))
  const chunk = Object.keys(expected).find(path => path.startsWith("assets/handlers/chunks/"))
  assert.ok(chunk, "fixture must emit a shared handler chunk")
  const artifacts = JSON.parse(await readFile(join(fixture, ".kudzu", "kudzu-artifacts.json"), "utf8"))
  const homeArtifacts = artifacts.routes.find(route => route.route === "/")
  const aboutArtifacts = artifacts.routes.find(route => route.route === "/about")
  const chunkUrl = `/${chunk}`
  assert.equal(artifacts.version, 1)
  assert.deepEqual(homeArtifacts.handlers.entries, ["/assets/handlers/pages/index.js"])
  assert.deepEqual(aboutArtifacts.handlers.entries, ["/assets/handlers/pages/about.js"])
  assert.equal(homeArtifacts.handlers.chunks.includes(chunkUrl), true)
  assert.equal(aboutArtifacts.handlers.chunks.includes(chunkUrl), true)
  assert.deepEqual(artifacts.sharedChunks.find(entry => entry.path === chunkUrl), { path: chunkUrl, routes: ["/", "/about"] })
  assert.equal(homeArtifacts.workers.length, 1)
  assert.equal(aboutArtifacts.workers.length, 1)
  const workerChunk = homeArtifacts.workers[0].chunks.find(path => aboutArtifacts.workers[0].chunks.includes(path))
  assert.match(workerChunk, /^\/assets\/workers\/chunks\//)
  assert.deepEqual(artifacts.sharedChunks.find(entry => entry.path === workerChunk), { path: workerChunk, routes: ["/", "/about"] })

  const collisions = [
    ["index.html", /public\/index\.html collides with generated output index\.html/],
    ["assets/kudzu.js", /public\/assets\/kudzu\.js collides with generated output assets\/kudzu\.js/],
    ["assets/handlers/pages/index.js", /public\/assets\/handlers\/pages\/index\.js collides with generated output assets\/handlers\/pages\/index\.js/],
    [chunk, /collides with generated output assets\/handlers\/chunks\//],
    ["assets/workers/public.txt", /public\/assets\/workers collides with Kudzu's generated Worker asset namespace/],
    ["assets/app.css", /public\/assets\/app\.css collides with generated output assets\/app\.css/],
    ["assets/configured.css", /public\/assets\/configured\.css collides with generated output assets\/configured\.css/]
  ]
  for (const [path, message] of collisions) {
    await put(`public/${path}`, "collision")
    const result = build()
    assert.notEqual(result.status, 0, `${path}\n${result.stdout}\n${result.stderr}`)
    assert.match(`${result.stdout}\n${result.stderr}`, message)
    assert.deepEqual(await fileManifest(join(fixture, "dist")), expected)
    await rm(join(fixture, "public", path.startsWith("assets/workers/") ? "assets/workers" : path), { recursive: true, force: true })
  }

  const lateFailure = build({ KUDZU_TEST_AFTER_BUILD_FAILURE: "1" })
  assert.notEqual(lateFailure.status, 0)
  assert.match(`${lateFailure.stdout}\n${lateFailure.stderr}`, /intentional afterBuild failure/)
  assert.deepEqual(await fileManifest(join(fixture, "dist")), expected)
  assert.equal(Object.hasOwn(expected, "failed-marker.txt"), false)

  await writeFile(join(fixture, ".kudzu-build.lock"), String(process.pid))
  const overlapping = build()
  assert.notEqual(overlapping.status, 0)
  assert.match(`${overlapping.stdout}\n${overlapping.stderr}`, /Another Kudzu build is already running/)
  assert.deepEqual(await fileManifest(join(fixture, "dist")), expected)
  await rm(join(fixture, ".kudzu-build.lock"))

  await rename(join(fixture, "dist"), join(fixture, ".kudzu-dist-backup"))
  await writeFile(join(fixture, ".kudzu-build.lock"), "99999999")
  const staleLock = build()
  assert.notEqual(staleLock.status, 0)
  assert.match(`${staleLock.stdout}\n${staleLock.stderr}`, /stale Kudzu build lock.*remove it before building/)
  await rm(join(fixture, ".kudzu-build.lock"))
  const recoveredFailure = build({ KUDZU_TEST_AFTER_BUILD_FAILURE: "1" })
  assert.notEqual(recoveredFailure.status, 0)
  assert.match(`${recoveredFailure.stdout}\n${recoveredFailure.stderr}`, /intentional afterBuild failure/)
  assert.deepEqual(await fileManifest(join(fixture, "dist")), expected)

  await put("src/pages/index.tsx", page("Generation B"))
  await rm(join(fixture, "public", "old-only.txt"))
  const replacement = build()
  assert.equal(replacement.status, 0, `${replacement.stdout}\n${replacement.stderr}`)
  assert.match(await readFile(join(fixture, "dist/index.html"), "utf8"), /Generation B/)
  await assert.rejects(readFile(join(fixture, "dist/old-only.txt")))
  assert.deepEqual((await readdir(fixture)).filter(name => name.startsWith(".kudzu-dist-")), [])
  assert.equal((await readdir(fixture)).includes(".kudzu-build.lock"), false)
})

test("builds independent project roots in one process", async t => {
  const fixture = await mkdtemp(resolve("test/fixtures/project-session-"))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  const roots = [join(fixture, "first"), join(fixture, "second")]

  for (const [index, root] of roots.entries()) {
    const name = index ? "Second project" : "First project"
    await mkdir(join(root, "src", "pages"), { recursive: true })
    await writeFile(join(root, "src", "label.ts"), `export const label = ${JSON.stringify(name)}`)
    await writeFile(join(root, "src", "task.worker.ts"), `self.addEventListener("message", () => postMessage(${JSON.stringify(`${name} worker`)}))`)
    await writeFile(join(root, "src", "pages", "index.tsx"), `
import { useEffect } from "@kudzujs/core"
import { label } from "../label"
export default function Page() {
  useEffect(() => {
    const worker = new Worker(new URL("../task.worker.ts", import.meta.url), { type: "module" })
    return () => worker.terminate()
  }, [])
  return <h1>{label}</h1>
}
`)
    await writeFile(join(root, "kudzu.config.mjs"), `export default { base: ${JSON.stringify(index ? "/second" : "/first")}, metadata: { title: ${JSON.stringify(name)} } }`)
  }

  const first = await buildProject({ root: roots[0], quiet: true, minify: false })
  const second = await buildProject({ root: roots[1], quiet: true, minify: false })

  assert.match(await readFile(join(roots[0], "dist", "index.html"), "utf8"), /<title>First project<\/title>.*<h1>First project<\/h1>/s)
  assert.match(await readFile(join(roots[1], "dist", "index.html"), "utf8"), /<title>Second project<\/title>.*<h1>Second project<\/h1>/s)
  assert.deepEqual(first.sourceResults.map(result => result.file), ["src/label.ts", "src/pages/index.tsx"])
  assert.deepEqual(second.sourceResults.map(result => result.file), ["src/label.ts", "src/pages/index.tsx"])
  assert.match(await readFile(join(roots[0], ".kudzu", "pages", "index.mjs"), "utf8"), /\.\.\/label\.mjs/)
  assert.match(await readFile(join(roots[1], ".kudzu", "pages", "index.mjs"), "utf8"), /\.\.\/label\.mjs/)
  const firstWorker = (await readdir(join(roots[0], "dist", "assets", "workers"))).find(file => file.startsWith("task.worker-"))
  const secondWorker = (await readdir(join(roots[1], "dist", "assets", "workers"))).find(file => file.startsWith("task.worker-"))
  assert.match(await readFile(join(roots[0], "dist", "assets", "workers", firstWorker), "utf8"), /First project worker/)
  assert.match(await readFile(join(roots[1], "dist", "assets", "workers", secondWorker), "utf8"), /Second project worker/)
})

function page(title) {
  return `
import { useEffect, useState } from "@kudzujs/core"
import { label } from "../shared"
import "../app.css"
export default function Page() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const worker = new Worker(new URL("../task.worker.ts", import.meta.url), { type: "module" })
    worker.postMessage("start")
    return () => worker.terminate()
  }, [])
  return <main><h1>${title}</h1><button onClick={() => setCount(count + 1)}>{count}</button><button onFocus={() => { document.title = label("home") }}>Native</button></main>
}
`
}

async function fileManifest(directory, current = directory, manifest = {}) {
  for (const entry of (await readdir(current, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(current, entry.name)
    if (entry.isDirectory()) await fileManifest(directory, path, manifest)
    else manifest[path.slice(directory.length + 1).replaceAll("\\", "/")] = (await readFile(path)).toString("base64")
  }
  return manifest
}
