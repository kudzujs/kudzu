import { spawnSync } from "node:child_process"
import { readFileSync, readdirSync, rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"
import { performance } from "node:perf_hooks"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = resolve(root, "test/fixtures/worker-effects")
const build = resolve(root, "bin/kudzu.mjs")
const runs = []

try {
  for (let index = 0; index < 8; index++) {
    rmSync(resolve(fixture, "dist"), { recursive: true, force: true })
    rmSync(resolve(fixture, ".kudzu"), { recursive: true, force: true })
    const start = performance.now()
    const result = spawnSync(process.execPath, [build, "build"], { cwd: fixture, encoding: "utf8" })
    if (result.status !== 0) throw new Error(result.stderr || result.stdout)
    if (index) runs.push(Number((performance.now() - start).toFixed(1)))
  }

  const asset = file => readFileSync(resolve(fixture, "dist", file))
  const size = files => files.reduce((total, file) => {
    const bytes = asset(file)
    total.raw += bytes.length
    total.gzip += gzipSync(bytes).length
    return total
  }, { raw: 0, gzip: 0 })
  const worker = `assets/workers/${readdirSync(resolve(fixture, "dist/assets/workers")).find(file => file.endsWith(".js"))}`
  const artifacts = JSON.parse(readFileSync(resolve(fixture, ".kudzu/kudzu-artifacts.json")))
  const route = artifacts.routes.find(route => route.route === "/dash/dashboard")
  const deployPath = path => path.slice(path.indexOf("/assets/") + 1)
  const windowFiles = [...new Set([
    ...route.runtime.requirements.map(deployPath),
    ...route.runtime.entries.filter(path => path.includes("kudzu-navigation")).map(deployPath),
    "assets/effects/dashboard/index.js",
    "assets/handlers/pages/dashboard.js"
  ])]
  const sorted = [...runs].sort((left, right) => left - right)

  console.log(JSON.stringify({
    fixture: "worker-effects",
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    methodology: "one warm-up, seven clean production builds",
    buildMs: { runs, median: sorted[3] },
    workerGraph: size([worker]),
    windowGraph: size(windowFiles)
  }, null, 2))
} finally {
  rmSync(resolve(fixture, "dist"), { recursive: true, force: true })
  rmSync(resolve(fixture, ".kudzu"), { recursive: true, force: true })
}
