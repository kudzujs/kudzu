#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { mkdir, readdir, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"

const args = process.argv.slice(2)
const skipInstall = args.includes("--no-install")
const target = args.find(argument => !argument.startsWith("-")) ?? "kudzu-app"
const root = resolve(target)

try {
  if ((await readdir(root)).length) throw new Error(`${target} is not empty`)
} catch (error) {
  if (error.code !== "ENOENT") throw error
}

await mkdir(resolve(root, "src/pages"), { recursive: true })

const name = basename(root).toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "kudzu-app"
const files = {
  "package.json": `${JSON.stringify({
    name,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "kudzu dev",
      build: "kudzu build"
    },
    dependencies: {
      "@kudzujs/core": "^0.6.7"
    }
  }, null, 2)}\n`,
  "tsconfig.json": `${JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      jsxImportSource: "@kudzujs/core",
      strict: true
    }
  }, null, 2)}\n`,
  ".gitignore": "node_modules/\ndist/\n.kudzu/\n",
  "src/pages/index.tsx": `import { useState } from "@kudzujs/core"

export default function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <p>Kudzu is growing.</p>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Grow +1</button>
    </main>
  )
}
`,
  "src/style.css": `:root {
  color: #f7f3ff;
  background: #01020c;
  font-family: system-ui, sans-serif;
}

body { margin: 0; }
main { display: grid; min-height: 100vh; place-content: center; text-align: center; }
p { color: #cfa8ff; }
h1 { font-size: clamp(3rem, 10vw, 7rem); margin: 0 0 2rem; }
button { padding: .8rem 1.2rem; color: white; background: #8d52ff; border: 0; border-radius: .5rem; cursor: pointer; }
`
}

await Promise.all(Object.entries(files).map(async ([file, content]) => {
  await writeFile(resolve(root, file), content)
}))

if (!skipInstall) {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["install"], { cwd: root, stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log(`\nCreated ${name} in ${root}\n\n  cd ${target}\n  npm run dev\n`)
