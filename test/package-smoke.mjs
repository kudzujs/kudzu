import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const root = new URL("..", import.meta.url)
const temporary = await mkdtemp(join(tmpdir(), "kudzu-package-smoke-"))

try {
  const packed = JSON.parse(execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { cwd: root, encoding: "utf8" }))
  const files = execFileSync("tar", ["-tzf", join(temporary, packed[0].filename)], { encoding: "utf8" }).trim().split("\n").map(file => file.replace(/^package\//, ""))
  assert.deepEqual(files.toSorted(), packed[0].files.map(file => file.path).toSorted())
  for (const file of files) assert.doesNotMatch(file, /^(?:docs\/next-architecture\/|(?:GOAL_A|GOAL_B|MIGRATION_ROADMAP|PERFORMANCE|RELEASES)\.md$|framework\/README\.md$)/)
  const required = ["package.json", "README.md", "LICENSE"]
  for (const directory of ["bin", "framework"]) {
    for (const file of await readdir(new URL(`${directory}/`, root), { recursive: true, withFileTypes: true })) {
      if (file.isFile() && !(directory === "framework" && file.name === "README.md")) required.push(relative(fileURLToPath(root), join(file.parentPath, file.name)).replaceAll("\\", "/"))
    }
  }
  for (const file of required) assert.ok(files.includes(file), `missing packed file: ${file}`)
  const consumer = join(temporary, "consumer")
  await mkdir(join(consumer, "src", "pages"), { recursive: true })
  await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "kudzu-package-smoke", private: true, type: "module" }))
  await writeFile(join(consumer, "index.mjs"), 'await import("@kudzujs/core"); await import("@kudzujs/core/jsx-runtime")\n')
  await writeFile(join(consumer, "src", "pages", "index.tsx"), 'export default function Page() { return <main>packed Kudzu</main> }\n')
  await writeFile(join(consumer, "src", "data.ts"), 'export const items = [{ id: "fern", name: "Fern" }, { id: "moss", name: "Moss" }]\n')
  await writeFile(join(consumer, "src", "Item.tsx"), 'export function Item({ item }) { return <li>{item.name}</li> }\n')
  const readme = await readFile(new URL("README.md", root), "utf8")
  const example = readme.match(/```tsx\n(import \{ useState \}[^`]+export default function ItemsPage\(\)[^`]+)```/)
  assert.ok(example, "public collection example is present")
  await writeFile(join(consumer, "src", "pages", "items.tsx"), example[1])
  await writeFile(join(consumer, "src", "pages", "static.tsx"), 'import { items } from "../data"\nimport { Item } from "../Item"\nexport default function Page() { return <ul>{items.filter(item => item.id === "fern").map(item => <Item key={item.id} item={item} />)}</ul> }\n')
  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", join(temporary, packed[0].filename)], { cwd: consumer, stdio: "inherit" })
  execFileSync(process.execPath, [join(consumer, "index.mjs")], { cwd: consumer, stdio: "inherit" })
  const manifest = JSON.parse(await readFile(join(consumer, "node_modules", "@kudzujs", "core", "package.json"), "utf8"))
  assert.deepEqual(manifest.exports, {
    ".": { types: "./framework/core.d.ts", default: "./framework/core.mjs" },
    "./jsx-runtime": { types: "./framework/jsx-runtime.d.ts", default: "./framework/jsx-runtime.mjs" }
  })
  assert.deepEqual(manifest.bin, { kudzu: "bin/kudzu.mjs" })
  for (const file of required.filter(file => file.startsWith("framework/") || file.startsWith("bin/"))) {
    assert.deepEqual(await readFile(join(consumer, "node_modules", "@kudzujs", "core", file)), await readFile(new URL(file, root)), `packed source changed: ${file}`)
  }
  execFileSync(join(consumer, "node_modules", ".bin", "kudzu"), ["build"], { cwd: consumer, stdio: "inherit" })
  assert.match(await readFile(join(consumer, "dist", "index.html"), "utf8"), /packed Kudzu/)
  const interactive = await readFile(join(consumer, "dist", "items", "index.html"), "utf8")
  assert.match(interactive, /Fern/)
  assert.match(interactive, /Moss/)
  assert.match(interactive, /Matches: .*2/)
  assert.match(interactive, /data-k-native-input=/)
  assert.match(interactive, /<script/)
  for (const route of ["index.html", "static/index.html"]) assert.doesNotMatch(await readFile(join(consumer, "dist", route), "utf8"), /<script|data-k-|modulepreload/)
  const staticHtml = await readFile(join(consumer, "dist", "static", "index.html"), "utf8")
  assert.match(staticHtml, /Fern/)
  assert.doesNotMatch(staticHtml, /Moss/)
} finally {
  await rm(temporary, { recursive: true, force: true })
}
