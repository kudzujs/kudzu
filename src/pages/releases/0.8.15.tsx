export const metadata = {
  title: "Kudzu 0.8.15 - Compiler architecture",
  description: "Kudzu 0.8.15 separates AST passes, migration analysis, Worker compilation, code generation, and development serving into explicit compiler boundaries.",
  url: "https://kudzujs.cloud/releases/0.8.15",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.15 compiler architecture",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.15">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.15</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPILER ARCHITECTURE</p>
        <h1>React-shaped input.<br /><em>Explicit compiler stages.</em></h1>
        <p className="release-lead">Normalization, semantic analysis, Worker compilation, and route-specific code generation now have clear source boundaries without changing deploy behavior.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.15">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>11</strong><span>Focused compiler modules</span></div>
        <div><strong>39%</strong><span>Less build.mjs</span></div>
        <div><strong>153/153</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>One compiler model.<br />Clear ownership boundaries.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PIPELINE</span><h3>Ordered normalization</h3><p>Page and imported source share one pass sequence with parent repair after every transform.</p></article>
          <article><span>MIGRATION</span><h3>Focused syntax passes</h3><p>React, Router, browser signals, timers, animation frames, and render control own their diagnostics.</p></article>
          <article><span>ANALYSIS</span><h3>Shared AST scope</h3><p>Binding, reference, shadowing, effect-return, and source-location rules live in one tested module.</p></article>
          <article><span>CODEGEN</span><h3>Descriptor-driven ESM</h3><p>Effect and handler generators consume analyzed descriptors instead of mixing with source recognition.</p></article>
          <article><span>WORKERS</span><h3>Compiler-aware graphs</h3><p>Worker validation, graph checks, hashing, and emission share one feature boundary.</p></article>
          <article><span>OUTPUT</span><h3>Behavior preserved</h3><p>Static zero-JavaScript routes and capability-specific interactive output remain unchanged.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Treat TSX as compiler input.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.15</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.15 - Compiler architecture</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.15">GitHub release</a>
    </footer>
  </>
}
