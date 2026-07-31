import { CodeBlock } from "../../components/CodeBlock"

export const metadata = {
  title: "Kudzu 0.7.0 - React-source migration preview",
  description: "Kudzu 0.7.0 accepts supported React-shaped source and emits static HTML plus only the direct DOM capabilities each route needs.",
  url: "https://kudzujs.cloud/releases/0.7.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.0 React-source migration preview",
  themeColor: "#8d52ff"
}

const source = `import React, { useState } from "react"

export default function Header() {
  const [open, setOpen] = useState(false)

  return <React.Fragment>
    <button onClick={() => setOpen(!open)}>
      {open ? "Close" : "Menu"}
    </button>
    {open && <nav>Navigation</nav>}
  </React.Fragment>
}`

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.0">GitHub release ↗</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.0</span><span>JULY 2026</span></div>
        <p className="eyebrow">REACT-SOURCE MIGRATION PREVIEW</p>
        <h1>Bring React-shaped source.<br /><em>Ship without React.</em></h1>
        <p className="release-lead">Kudzu can now ingest supported conventional React imports as migration source, pre-render complete HTML, and emit only the direct DOM behavior each route actually uses.</p>
        <div className="release-links">
          <a className="primary-action" href="#start">See how it works</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.0">Browse the tag ↗</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>0</strong><span>React runtime modules</span></div>
        <div><strong>310 ms</strong><span>Landing fixture build median</span></div>
      </section>

      <section className="release-section" id="start">
        <div className="release-section-heading"><span>01</span><div><p>THE NEW INPUT</p><h2>Keep the shape.<br />Change the outcome.</h2></div></div>
        <div className="release-story">
          <div className="release-code"><CodeBlock code={source} /></div>
          <div className="release-flow">
            <div><span>INPUT</span><strong>React-shaped TSX</strong><p>Functions, props, fragments, named hooks, conditions, and ordinary event handlers.</p></div>
            <b>↓</b>
            <div><span>COMPILER</span><strong>Kudzu specialization</strong><p>Supported React imports become compile-time APIs. Components do not survive as a browser tree.</p></div>
            <b>↓</b>
            <div><span>OUTPUT</span><strong>HTML + needed ESM</strong><p>Static routes ship no JavaScript. Interactive routes ship only their direct DOM capabilities.</p></div>
          </div>
        </div>
      </section>

      <section className="release-section">
        <div className="release-section-heading"><span>02</span><div><p>WHAT LANDED</p><h2>Migration primitives,<br />not a compatibility runtime.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORTS</span><h3>React source ingestion</h3><p>Supported unaliased named hooks and default, namespace, or named Fragment imports compile without loading React.</p></article>
          <article><span>COMPONENTS</span><h3>Relative composition</h3><p>Function components, props, children, nested conditions, and handlers retain their familiar TSX structure.</p></article>
          <article><span>COLLECTIONS</span><h3>Deeper list shapes</h3><p>Analyzable selectors, positional keys, sibling child maps, nested rows, local state, refs, and effects specialize directly.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Accepted React import syntax does not make a static route interactive or add a client runtime.</p></article>
          <article><span>SAFETY</span><h3>No surviving React</h3><p>Generated modules are checked for runtime React references; side-effect imports fail with a source location.</p></article>
          <article><span>BEHAVIOR</span><h3>Capability-only ESM</h3><p>State, attributes, conditional DOM, effects, and event handlers ship only when the route uses them.</p></article>
        </div>
      </section>

      <section className="release-boundary-section">
        <div><p className="eyebrow">CURRENT BOUNDARY</p><h2>Source migration,<br />not React in disguise.</h2></div>
        <div>
          <p>Aliased hooks, <code>React.useState</code>, <code>memo</code>, <code>useMemo</code>, <code>useCallback</code>, React classes, React Router, Next-specific components, and React UI packages remain unsupported.</p>
          <p>A real migration should reduce its first blocker to a fixture, then extend the compiler one proven pattern at a time.</p>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Start with one route.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.0</code></div>
        <p>New Kudzu code should still import from <code>@kudzujs/core</code>. Retaining <code>react</code> imports is for migrations where minimizing source edits matters.</p>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.0 · React-source migration preview</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.0">GitHub release ↗</a>
    </footer>
  </>
}
