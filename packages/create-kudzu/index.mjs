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

await Promise.all([
  mkdir(resolve(root, "src/components"), { recursive: true }),
  mkdir(resolve(root, "src/pages"), { recursive: true })
])

const name = basename(root).toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "kudzu-app"
const files = {
  "package.json": `${JSON.stringify({
    name,
    version: "0.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "kudzu dev",
      build: "kudzu build",
      check: "tsc --noEmit && kudzu build"
    },
    dependencies: {
      "@kudzujs/core": "^0.16.17"
    },
    devDependencies: {
      typescript: "^5.9.2"
    }
  }, null, 2)}\n`,
  "tsconfig.json": `${JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      jsxImportSource: "@kudzujs/core",
      types: [],
      strict: true
    }
  }, null, 2)}\n`,
  ".gitignore": "node_modules/\ndist/\n.kudzu/\n",
  "src/components/SiteHeader.tsx": `import "../style.css"

export function SiteHeader({ current }: { current: "home" | "about" }) {
  return <header className="site-header">
    <a className="brand" href="/"><span>K</span>Kudzu</a>
    <nav aria-label="Main navigation">
      <a className={current === "home" ? "active" : ""} href="/">Showcase</a>
      <a className={current === "about" ? "active" : ""} href="/about">Static route</a>
      <a href="https://kudzujs.cloud/docs">Docs</a>
    </nav>
  </header>
}
`,
  "src/components/CapabilityCard.tsx": `type Props = { number: string; title: string; description: string; output: string }

export function CapabilityCard({ number, title, description, output }: Props) {
  return <article className="capability-card">
    <span>{number}</span>
    <h3>{title}</h3>
    <p>{description}</p>
    <code>{output}</code>
  </article>
}
`,
  "src/pages/index.tsx": `import { useState } from "@kudzujs/core"
import { CapabilityCard } from "../components/CapabilityCard"
import { SiteHeader } from "../components/SiteHeader"

export const metadata = {
  title: "${name} | Built with Kudzu",
  description: "A working Kudzu starter with static HTML and direct interactions",
  themeColor: "#b7ff5a"
}

export default function HomePage() {
  const [count, setCount] = useState(0)

  return <>
    <SiteHeader current="home" />
    <main>
      <section className="hero">
        <p className="eyebrow">HTML-FIRST TSX</p>
        <h1>Keep the components.<br /><em>Lose the runtime.</em></h1>
        <p className="intro">Edit the components, routes, state, metadata, and source CSS already working in this project.</p>
        <div className="hero-actions">
          <a className="primary" href="#capabilities">Explore the starter</a>
          <a href="https://kudzujs.cloud/docs">Read the docs -&gt;</a>
        </div>
      </section>

      <section className="signals" aria-label="Kudzu output">
        <div><strong>0 B</strong><span>JS on static routes</span></div>
        <div><strong>TSX</strong><span>Function components</span></div>
        <div><strong>direct</strong><span>DOM updates</span></div>
      </section>

      <section className="demo">
        <div>
          <p className="eyebrow">LIVE STATE</p>
          <h2>Only interactive pages ship behavior.</h2>
          <p>This counter uses familiar <code>useState</code>. Kudzu compiles only the page-specific ESM needed for direct DOM updates.</p>
        </div>
        <div className="counter">
          <span>Growth count</span><strong>{count}</strong>
          <div>
            <button onClick={() => setCount(count + 1)}>Grow +1</button>
            <button onClick={() => { setCount(count + 1); setCount(count + 1) }}>Grow +2</button>
          </div>
        </div>
      </section>

      <section className="capabilities" id="capabilities">
        <div className="section-heading"><p className="eyebrow">INCLUDED EXAMPLES</p><h2>Start by changing real code.</h2></div>
        <div className="capability-grid">
          <CapabilityCard number="01" title="File routes" description="Every TSX file under src/pages becomes a route." output="pages/about.tsx -> /about" />
          <CapabilityCard number="02" title="Components" description="Compose ordinary typed function components and props." output="components/SiteHeader.tsx" />
          <CapabilityCard number="03" title="Static HTML" description="Pages without browser behavior emit no JavaScript." output="about.html + 0 B JS" />
          <CapabilityCard number="04" title="Local state" description="Use React-shaped state and synchronous event handlers." output="useState(0)" />
          <CapabilityCard number="05" title="Metadata" description="Export page titles, descriptions, and theme colors." output="export const metadata" />
          <CapabilityCard number="06" title="Source CSS" description="Imported CSS is emitted only for routes that reach it." output="src/style.css" />
        </div>
      </section>
    </main>
    <footer><span>Built with Kudzu</span><a href="https://github.com/kudzujs/kudzu">GitHub -&gt;</a></footer>
  </>
}
`,
  "src/pages/about.tsx": `import { SiteHeader } from "../components/SiteHeader"

export const metadata = { title: "Static route | ${name}", description: "A zero-JavaScript Kudzu route" }

export default function AboutPage() {
  return <>
    <SiteHeader current="about" />
    <main className="static-page">
      <p className="eyebrow">ZERO-JAVASCRIPT ROUTE</p>
      <h1>This page is already complete.</h1>
      <p>There are no hooks or event handlers here, so Kudzu emits HTML and CSS without client JavaScript.</p>
      <a className="primary" href="/">Back to the showcase</a>
    </main>
  </>
}
`,
  "src/style.css": `:root { color: #f3f5ed; background: #0b0d0a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-synthesis: none; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; }
a { color: inherit; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.site-header, main, footer { width: min(1120px, calc(100% - 40px)); margin-inline: auto; }
.site-header { display: flex; align-items: center; justify-content: space-between; padding: 24px 0; }
.brand { display: flex; gap: 10px; align-items: center; font-weight: 800; text-decoration: none; }
.brand span { display: grid; width: 34px; height: 34px; place-items: center; color: #0b0d0a; background: #b7ff5a; border-radius: 50%; }
nav { display: flex; gap: 24px; font-size: .9rem; }
nav a { color: #9da496; text-decoration: none; }
nav a:hover, nav a.active { color: #f3f5ed; }
.hero { min-height: 620px; padding: 120px 0 80px; border-top: 1px solid #252a22; }
.eyebrow { color: #b7ff5a; font: 700 .75rem/1 ui-monospace, monospace; letter-spacing: .14em; }
h1, h2, h3, p { margin-top: 0; }
h1 { max-width: 950px; margin-bottom: 28px; font-size: clamp(3.6rem, 9vw, 7.8rem); line-height: .9; letter-spacing: -.07em; }
h1 em { color: #b7ff5a; font-style: normal; }
.intro { max-width: 680px; color: #aeb5a7; font-size: clamp(1.1rem, 2vw, 1.4rem); line-height: 1.6; }
.hero-actions { display: flex; gap: 24px; align-items: center; margin-top: 38px; }
.hero-actions a { text-underline-offset: 5px; }
.primary { display: inline-block; padding: 14px 20px; color: #0b0d0a; background: #b7ff5a; border-radius: 3px; font-weight: 800; text-decoration: none; }
.signals { display: grid; grid-template-columns: repeat(3, 1fr); border-block: 1px solid #252a22; }
.signals div { display: grid; gap: 7px; padding: 32px; border-right: 1px solid #252a22; }
.signals div:last-child { border: 0; }
.signals strong { font-size: 1.6rem; }
.signals span { color: #899083; font-size: .85rem; }
.demo { display: grid; grid-template-columns: 1.2fr .8fr; gap: 80px; align-items: center; padding: 120px 0; }
.demo h2, .section-heading h2 { max-width: 700px; font-size: clamp(2.5rem, 6vw, 5rem); line-height: .98; letter-spacing: -.055em; }
.demo p:not(.eyebrow) { max-width: 580px; color: #9da496; line-height: 1.7; }
.counter { display: grid; gap: 20px; padding: 30px; background: #141712; border: 1px solid #30352c; }
.counter > span { color: #9da496; font-size: .8rem; text-transform: uppercase; letter-spacing: .12em; }
.counter strong { color: #b7ff5a; font: 700 7rem/.9 ui-monospace, monospace; }
.counter div { display: flex; gap: 10px; }
button { padding: 12px 16px; color: #f3f5ed; background: #242a20; border: 1px solid #40483a; border-radius: 3px; cursor: pointer; }
button:hover { color: #0b0d0a; background: #b7ff5a; }
.capabilities { padding: 40px 0 120px; }
.section-heading { margin-bottom: 52px; }
.capability-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid #30352c; border-left: 1px solid #30352c; }
.capability-card { min-height: 260px; padding: 28px; border-right: 1px solid #30352c; border-bottom: 1px solid #30352c; }
.capability-card > span { color: #b7ff5a; font: .75rem ui-monospace, monospace; }
.capability-card h3 { margin: 44px 0 12px; font-size: 1.35rem; }
.capability-card p { min-height: 48px; color: #929a8b; line-height: 1.5; }
.capability-card code { color: #cbd1c4; font-size: .78rem; }
footer { display: flex; justify-content: space-between; padding: 28px 0 50px; color: #899083; border-top: 1px solid #252a22; }
.static-page { min-height: calc(100vh - 90px); padding: 14vh 0; border-top: 1px solid #252a22; }
.static-page h1 { max-width: 850px; font-size: clamp(3.5rem, 9vw, 7rem); }
.static-page > p:not(.eyebrow) { max-width: 650px; margin-bottom: 36px; color: #aeb5a7; font-size: 1.2rem; line-height: 1.7; }
@media (max-width: 760px) {
  .site-header { align-items: flex-start; }
  nav { gap: 12px; font-size: .78rem; }
  .hero { min-height: auto; padding: 80px 0; }
  .signals, .capability-grid { grid-template-columns: 1fr; }
  .signals div { border-right: 0; border-bottom: 1px solid #252a22; }
  .demo { grid-template-columns: 1fr; gap: 40px; padding: 80px 0; }
}
`,
  "README.md": `# ${name}

This starter is a working Kudzu showcase, not an empty scaffold.

- \`src/pages/index.tsx\` demonstrates metadata, state, handlers, and component composition.
- \`src/pages/about.tsx\` is a static route that ships zero client JavaScript.
- \`src/components\` contains reusable typed function components.
- \`src/style.css\` is imported by the shared header and linked only by routes that reach it.

\`kudzu.config.mjs\` is optional. Add it only when the project needs a base path, external public directory, transformed source styles, global metadata, navigation groups, or post-build artifacts.

\`\`\`bash
npm install
npm run dev
npm run check
npm run build
\`\`\`

Documentation: https://kudzujs.cloud/docs
`
}

await Promise.all(Object.entries(files).map(async ([file, content]) => {
  await writeFile(resolve(root, file), content)
}))

if (!skipInstall) {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["install"], { cwd: root, stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log(`\nCreated ${name} in ${root}${skipInstall ? "" : " with dependencies installed"}\n\n  cd ${target}\n${skipInstall ? "  npm install\n" : ""}  npm run dev\n`)
