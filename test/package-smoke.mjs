import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const root = new URL("..", import.meta.url)
const temporary = await mkdtemp(join(tmpdir(), "kudzu-package-smoke-"))

try {
  const packed = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { cwd: root, encoding: "utf8" }))
  const consumer = join(temporary, "consumer")
  await mkdir(join(consumer, "src", "pages"), { recursive: true })
  await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "kudzu-package-smoke", private: true, type: "module" }))
  await writeFile(join(consumer, "index.mjs"), 'await import("@kudzujs/core"); await import("@kudzujs/core/jsx-runtime")\n')
  await writeFile(join(consumer, "src", "pages", "index.tsx"), 'export default function Page() { return <main>packed Kudzu</main> }\n')
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(temporary, packed[0].filename)], { cwd: consumer, stdio: "inherit" })
  execFileSync(process.execPath, [join(consumer, "index.mjs")], { cwd: consumer, stdio: "inherit" })
  execFileSync(join(consumer, "node_modules", ".bin", "kudzu"), ["build"], { cwd: consumer, stdio: "inherit" })
  assert.match(await readFile(join(consumer, "dist", "index.html"), "utf8"), /packed Kudzu/)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
