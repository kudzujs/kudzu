import { useState } from "@kudzujs/core"
import { CodeBlock } from "../components/CodeBlock"

export const metadata = {
  title: "Kudzu — HTML-first TSX framework",
  description: "A compiler that specializes React-shaped TSX into complete HTML and small, route-specific browser capabilities without a virtual DOM.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  url: "https://kudzujs.cloud/",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu HTML-first TSX framework",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  manifest: "/site.webmanifest"
}

export default function HomePage() {
  const [count, setCount] = useState(0)

  function grow() {
    setCount(count + 1)
  }

  function growTwice() {
    setCount(count + 1)
    setCount(count + 1)
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          <img src="/icon-128.png" alt="Kudzu" />
        </a>
        <nav>
          <a href="#quick-start">Start</a>
          <a href="#model">Model</a>
          <a href="/docs">Docs</a>
          <a href="/example">Examples</a>
          <a href="https://www.npmjs.com/package/@kudzujs/core">npm</a>
          <a className="github-link" href="https://github.com/kudzujs/kudzu">GitHub ↗</a>
        </nav>
      </header>

      <a className="release-banner" href="/releases/0.8.36">
        <span>v0.8.36</span>
        <strong>Semantic state operations</strong>
        <span>Read release notes →</span>
      </a>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>v0.8.36</span> COMPILER FRAMEWORK</p>
            <h1>React-shaped input.<br /><em>Static-first output.</em></h1>
            <p className="intro">Kudzu analyzes TypeScript ASTs and specializes familiar components, hooks, routes, effects, and collections into complete HTML plus only the browser capabilities each route uses.</p>
            <div className="actions">
              <a className="primary-action" href="#quick-start">Get started</a>
              <a className="secondary-action" href="https://github.com/kudzujs/kudzu">Explore GitHub ↗</a>
            </div>
            <div className="install-command"><span>$</span><code>npm create kudzu@latest my-app</code></div>
          </div>
          <div className="hero-code" aria-label="Kudzu code example">
            <div className="code-toolbar">
              <span className="window-dots">● ● ●</span>
              <span>counter.tsx</span>
            </div>
            <div className="code-body"><CodeBlock code={`import { useState } from "@kudzujs/core"

export default function Counter() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>
    Grown {count} times
  </button>
}`} /></div>
            <div className="compiled-note"><span>COMPILED OUTPUT</span><strong>HTML + route capabilities</strong></div>
          </div>
        </section>

        <section className="signals" aria-label="Framework highlights">
          <div><strong>0</strong><span>Virtual DOM</span></div>
          <div><strong>0 B</strong><span>Static page JS</span></div>
          <div><strong>direct</strong><span>DOM patches</span></div>
          <div><strong>sync</strong><span>State semantics</span></div>
        </section>

        <section className="quick-start" id="quick-start">
          <div>
            <p className="eyebrow">QUICK START</p>
            <h2>From zero to HTML.</h2>
            <p>Create a project, enter the directory, install dependencies, and start growing.</p>
          </div>
          <div className="terminal" aria-label="Installation commands">
            <div><span>01</span><code>npm create kudzu@latest my-app</code></div>
            <div><span>02</span><code>cd my-app</code></div>
            <div><span>03</span><code>npm install</code></div>
            <div><span>04</span><code>npm run dev</code></div>
          </div>
        </section>

        <section className="model" id="model">
          <div className="section-title">
            <p className="eyebrow">THE COMPILER MODEL</p>
            <h2>Analyze syntax.<br />Ship capabilities.</h2>
          </div>
          <div className="pipeline">
            <article><span>01</span><h3>Normalize</h3><p>Ordered AST passes lower supported React, Router, hook, and control-flow shapes.</p><code>source → canonical TSX</code></article>
            <article><span>02</span><h3>Analyze</h3><p>The transformer records state, effects, handlers, bindings, lists, and ownership.</p><code>semantics → descriptors</code></article>
            <article><span>03</span><h3>Generate</h3><p>Complete HTML ships with only the route-specific capability ESM it references.</p><code>descriptors → HTML + ESM</code></article>
          </div>
        </section>

        <section className="demo">
          <div>
            <p className="eyebrow">SYNCHRONOUS BY DEFAULT</p>
            <h2>Two setters.<br />Two changes.</h2>
            <p>Logical state updates immediately. DOM writes wait until the synchronous turn ends.</p>
          </div>
          <div className="counter-card">
            <div className="counter-output"><span>growth</span><strong>{count}</strong></div>
            <div className="counter-actions">
              <button onClick={grow}>Grow +1</button>
              <button onClick={growTwice}>Grow +2</button>
            </div>
            <code>setCount(count + 1)</code>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
        <p>A framework that grows only where it needs to.</p>
        <span>MIT · 2026</span>
      </footer>
    </>
  )
}
