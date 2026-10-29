import assert from "node:assert/strict"
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import test from "node:test"
import { build } from "../framework/build.mjs"

test("artifact style requirements match emitted standalone, shared and navigation families", async t => {
  const root = await mkdtemp(resolve("test/fixtures/artifact-style-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, "src/pages"), { recursive: true })
  const binding = styled => `import { useState } from "@kudzujs/core"; export default function Page() { const [count, setCount] = useState(0); return <button onClick={() => setCount(count + 1)} ${styled ? 'style={{ color: count ? "red" : "blue" }}' : ''}>{count + 1}</button> }`
  const list = styled => `import { useState } from "@kudzujs/core"; export default function Page() { const [items, setItems] = useState([{ id: 1, color: "red" }]); return <main><button onClick={() => setItems([...items])}>Copy</button><ul>{items.map(item => <li key={item.id} ${styled ? 'style={{ color: item.color }}' : ''}>{item.id}</li>)}</ul></main> }`
  const pages = { plain: binding(false), same: binding(false), styled: binding(true), list: list(true), "plain-list": list(false), "nav-plain": binding(false), "nav-style": binding(true), "nav-list": list(true), "nav-plain-list": list(false), static: "export default function Page() { return <p>Static</p> }" }
  await writeFile(join(root, "src/Shell.tsx"), "export function Shell({ children }) { return <div>{children}</div> }")
  for (const [name, source] of Object.entries(pages)) await writeFile(join(root, `src/pages/${name}.tsx`), source + (name.startsWith("nav-") ? '; import { Shell } from "../Shell"; export const layout = Shell' : ""))
  await writeFile(join(root, "kudzu.config.mjs"), `export default { base: "/app", navigation: { routes: ["/nav-plain", "/nav-style", "/nav-list", "/nav-plain-list"] } }`)
  await build({ root, quiet: true })
  const report = JSON.parse(await readFile(join(root, ".kudzu/kudzu-artifacts.json")))
  const style = path => path.endsWith("/kudzu-style.js")
  for (const entry of [...report.runtimeFamilies, ...report.routes.map(route => route.runtime)]) {
    for (const path of entry.requirements) await access(join(root, "dist", path.slice("/app/".length)))
  }
  const route = name => report.routes.find(route => route.route === `/app/${name}`)
  for (const name of ["plain", "same", "plain-list", "static"]) assert.equal(route(name).runtime.requirements.some(style), false, name)
  for (const name of ["styled", "list", "nav-plain", "nav-style", "nav-list", "nav-plain-list"]) assert.equal(route(name).runtime.requirements.some(style), true, name)
  assert.equal(route("plain").runtime.family, route("same").runtime.family)
  assert.equal(new Set(["nav-plain", "nav-style", "nav-list", "nav-plain-list"].map(name => route(name).runtime.family)).size, 1)
  for (const family of report.runtimeFamilies) {
    const emitted = await readFile(join(root, "dist/assets/runtime", family.id, family.manifest.bindings.count ? "kudzu-binding.js" : "kudzu-list.js"), "utf8")
    assert.equal(family.requirements.some(style), emitted.includes("kudzu-style.js"), family.id)
  }
  assert.deepEqual(route("static").runtime.requirements, [])
})
