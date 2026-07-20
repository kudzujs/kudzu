import { spawn } from "node:child_process"
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"
import { gzipSync } from "node:zlib"
import { performance } from "node:perf_hooks"

const root = resolve(import.meta.dirname, "..")
const bin = name => join(root, "node_modules", ".bin", name)
const suite = process.argv[2] === "blog" ? "blog" : "counter"
const fixtureRoot = suite === "blog" ? join(import.meta.dirname, "blog") : import.meta.dirname
const contentMarker = suite === "blog" ? "웹을 만들며 배운 것을 기록합니다." : "Count: 7"

const targets = [
  {
    name: "Kudzu",
    directory: "kudzu",
    command: [process.execPath, join(root, "bin", "kudzu.mjs"), "build"],
    output: "dist",
    model: suite === "blog" ? "Static HTML" : "Static HTML + behavior patch",
    vdom: false,
    activation: "Event delegation",
    strength: suite === "blog" ? "React-shaped TSX with zero client JavaScript for static pages" : "Initial HTML, compiled state patches, and native ESM fallback",
    tradeoff: suite === "blog" ? "Young compiler and ecosystem; Astro is slightly smaller in this fixture" : "Imported client helpers and framework ecosystem remain limited"
  },
  {
    name: "React",
    directory: "react",
    command: [bin("vite"), "build"],
    output: "dist",
    model: "Client-side rendering",
    vdom: true,
    activation: "Client render",
    strength: "Largest component ecosystem and unrestricted dynamic UI",
    tradeoff: "The page depends on downloading and executing the React runtime"
  },
  {
    name: "Next.js",
    directory: "next",
    command: [bin("next"), "build"],
    output: "out",
    cleanup: [".next"],
    model: suite === "blog" ? "Static RSC" : "Static RSC + client component",
    vdom: true,
    activation: suite === "blog" ? "Server output" : "React hydration",
    strength: "Integrated routing, server rendering, RSC, data and deployment model",
    tradeoff: suite === "blog" ? "Large framework bootstrap and build output for a static page" : "More build artifacts and React hydration for client components"
  },
  {
    name: "Astro",
    directory: "astro",
    command: [bin("astro"), "build"],
    output: "dist",
    cleanup: [".astro"],
    model: suite === "blog" ? "Static HTML" : "Static HTML + native script",
    vdom: false,
    activation: "Native script",
    strength: "HTML-first output and opt-in islands across UI frameworks",
    tradeoff: "Cross-island state and app-like client flows need explicit design"
  },
  {
    name: "Qwik",
    directory: "qwik",
    command: [bin("vite"), "build"],
    output: "dist",
    model: "Qwik client fixture",
    vdom: false,
    activation: "Client render",
    strength: "SSR applications can resume and lazy-load event code",
    tradeoff: "This client-only fixture does not exercise resumability"
  },
  {
    name: "Svelte",
    directory: "svelte",
    command: [bin("vite"), "build"],
    output: "dist",
    model: "Compiled client rendering",
    vdom: false,
    activation: "Client mount",
    strength: "Compiler-generated fine-grained DOM updates with concise syntax",
    tradeoff: "This CSR fixture still mounts a client runtime before showing content"
  }
]

if (suite === "blog") {
  targets.splice(2, 0, {
    name: "Vue",
    directory: "vue",
    command: [bin("vite"), "build"],
    output: "dist",
    model: "Client-side rendering",
    vdom: true,
    activation: "Client mount",
    strength: "Approachable templates and an integrated reactive ecosystem",
    tradeoff: "This CSR fixture requires the Vue runtime before content appears"
  })
}

const results = []

for (const target of targets) {
  const cwd = join(fixtureRoot, target.directory)
  process.stdout.write(`Building ${target.name}... `)
  const durations = []
  let buildOutput

  for (let run = 0; run < (suite === "blog" ? 3 : 1); run++) {
    await rm(join(cwd, target.output), { recursive: true, force: true })
    for (const entry of target.cleanup ?? []) await rm(join(cwd, entry), { recursive: true, force: true })
    const started = performance.now()
    buildOutput = await execute(target.command, cwd)
    durations.push(Math.round(performance.now() - started))
    if (buildOutput.code !== 0) break
  }
  const buildMs = durations.sort((left, right) => left - right)[Math.floor(durations.length / 2)]

  if (buildOutput.code !== 0) {
    console.log("failed")
    console.error(buildOutput.stderr || buildOutput.stdout)
    process.exitCode = 1
    continue
  }

  const metrics = await measure(join(cwd, target.output), contentMarker)
  results.push({
    name: target.name,
    model: target.model,
    vdom: target.vdom,
    activation: target.activation,
    strength: target.strength,
    tradeoff: target.tradeoff,
    buildMs,
    ...metrics
  })
  console.log(`${buildMs}ms, ${formatBytes(metrics.javascript.gzip)} JS gzip`)
}

if (results.length) {
  const resultDirectory = join(import.meta.dirname, "results")
  await mkdir(resultDirectory, { recursive: true })
  const generatedAt = new Date().toISOString()
  const resultName = suite === "blog" ? "blog-latest" : "latest"
  await writeFile(join(resultDirectory, `${resultName}.json`), JSON.stringify({ suite, generatedAt, results }, null, 2))
  await writeFile(join(resultDirectory, `${resultName}.md`), report(generatedAt, results))
  console.log(`\nReport: ${relative(root, join(resultDirectory, `${resultName}.md`))}`)
}

async function measure(directory, marker) {
  const files = await walk(directory)
  const groups = {
    html: files.filter(file => extname(file) === ".html"),
    javascript: files.filter(file => [".js", ".mjs"].includes(extname(file))),
    css: files.filter(file => extname(file) === ".css")
  }

  const htmlContents = await Promise.all(groups.html.map(file => readFile(file, "utf8")))
  const inlineScripts = htmlContents.flatMap(html => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]))
  const measured = {}

  for (const [name, paths] of Object.entries(groups)) {
    const contents = await Promise.all(paths.map(file => readFile(file)))
    measured[name] = sizes(contents)
  }

  const inline = sizes(inlineScripts.map(script => Buffer.from(script)))
  measured.javascript.raw += inline.raw
  measured.javascript.gzip += inline.gzip

  const rootHtml = await readFile(join(directory, "index.html"), "utf8")
  const initialScriptPaths = [...rootHtml.matchAll(/<script[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1].split(/[?#]/)[0].replace(/^\/+/, ""))
  const initialExternalScripts = await staticScriptGraph(directory, initialScriptPaths)
  const initialInlineScripts = [...rootHtml.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match => Buffer.from(match[1]))

  const allFiles = await Promise.all(files.map(file => readFile(file)))
  return {
    files: files.length,
    output: sizes(allFiles),
    html: measured.html,
    javascript: measured.javascript,
    css: measured.css,
    initialJavascript: sizes([...initialExternalScripts, ...initialInlineScripts]),
    initialHtml: visibleText(rootHtml).includes(marker)
  }
}

function sizes(contents) {
  return {
    raw: contents.reduce((total, content) => total + content.byteLength, 0),
    gzip: contents.reduce((total, content) => total + gzipSync(content, { level: 9 }).byteLength, 0)
  }
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : path
  }))).flat()
}

async function staticScriptGraph(directory, entries) {
  const pending = [...entries]
  const visited = new Set()
  const contents = []

  while (pending.length) {
    const path = pending.pop()
    if (!path || visited.has(path)) continue
    visited.add(path)

    const content = await readFile(join(directory, path))
    contents.push(content)
    const source = content.toString("utf8")
    const imports = [
      ...source.matchAll(/\bimport\s*(?:[^"'()]*?\s*from\s*)?["']([^"']+)["']/g),
      ...source.matchAll(/\bexport\s+[^"']*?\sfrom\s*["']([^"']+)["']/g)
    ].map(match => match[1])

    for (const specifier of imports) {
      if (specifier.startsWith("/")) pending.push(specifier.replace(/^\/+/, ""))
      if (specifier.startsWith(".")) pending.push(relative(directory, resolve(directory, path, "..", specifier)))
    }
  }

  return contents
}

function execute([command, ...args], cwd) {
  return new Promise(resolveProcess => {
    const child = spawn(command, args, { cwd, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", chunk => { stdout += chunk })
    child.stderr.on("data", chunk => { stderr += chunk })
    child.on("close", code => resolveProcess({ code, stdout, stderr }))
  })
}

function report(generatedAt, rows) {
  const table = rows.map(row => `| ${row.name} | ${row.model} | ${row.initialHtml ? "Yes" : "No"} | ${formatBytes(row.html.gzip)} | ${formatBytes(row.css.gzip)} | ${formatBytes(row.initialJavascript.gzip)} | ${formatBytes(row.javascript.gzip)} | ${formatBytes(row.output.raw)} | ${row.buildMs}ms |`).join("\n")
  const capabilities = rows.map(row => `| ${row.name} | ${row.strength} | ${row.tradeoff} |`).join("\n")
  const description = suite === "blog"
    ? "All fixtures render the same static developer blog homepage with matching content and CSS."
    : "All fixtures implement the same counter with initial value 7 and increment/decrement buttons."
  return `# ${suite === "blog" ? "Static blog" : "Framework"} benchmark\n\nGenerated: ${generatedAt}\n\n${description} Measurements are production build artifacts on this machine, not published package-size estimates.\n\n| Framework | Rendering model | Initial content | HTML gzip | CSS gzip | Initial JS gzip | Emitted JS gzip | Total output | Build |\n|---|---|---:|---:|---:|---:|---:|---:|---:|\n${table}\n\n## Architectural context\n\n| Framework | Representative strength | Cost or limitation in this fixture |\n|---|---|---|\n${capabilities}\n\n## What the columns mean\n\n- **Initial content**: the root HTML contains the primary page heading before JavaScript runs.\n- **Initial JS**: inline scripts, root HTML script references, and their static import graph. Dynamic imports are excluded.\n- **Emitted JS**: every JavaScript artifact plus inline scripts, compressed file-by-file.\n- **Total output**: every emitted artifact, including framework metadata and source maps if produced.\n- **Build**: ${suite === "blog" ? "median of three" : "one"} clean wall-clock build${suite === "blog" ? "s" : ""}; it varies by machine and filesystem cache.\n\nThis is a one-page build benchmark, not a measurement of ecosystem maturity, development experience, server throughput, or complex application performance. Astro inlines the shared CSS, so its CSS bytes appear in HTML rather than the CSS column. The Qwik fixture is client-only, so its primary SSR resumability advantage is not exercised.\n`
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`
  return `${(value / 1024).toFixed(1)} KB`
}
