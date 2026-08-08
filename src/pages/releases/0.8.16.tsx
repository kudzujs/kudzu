export const metadata = {
  title: "Kudzu 0.8.16 - Compiler analysis boundaries",
  description: "Kudzu 0.8.16 gives source-local descriptors, collection analysis, command specialization, Zustand migration, and route capability planning explicit compiler ownership.",
  url: "https://kudzujs.cloud/releases/0.8.16",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.16 compiler analysis boundaries",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.16">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.16</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPILER ANALYSIS</p>
        <h1>Source-local analysis.<br /><em>Explicit compiler ownership.</em></h1>
        <p className="release-lead">Descriptors, collection semantics, command fast paths, Zustand migration, and route capability projection now leave build orchestration without changing browser output.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.16">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>5</strong><span>New analysis modules</span></div>
        <div><strong>12%</strong><span>Less build.mjs</span></div>
        <div><strong>163/163</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Stable analysis seams.<br />The same deploy program.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>DESCRIPTORS</span><h3>Source-local session</h3><p>Handlers, effects, bindings, list evaluators, and client imports receive deterministic ownership and names.</p></article>
          <article><span>COLLECTIONS</span><h3>One pure language</h3><p>React migration, reactive JSX, effects, and keyed lists share selector and expression analysis.</p></article>
          <article><span>COMMANDS</span><h3>Fast path preserved</h3><p>Direct setter arithmetic and literals remain compact commands rather than generic handler functions.</p></article>
          <article><span>CAPABILITIES</span><h3>Pure route manifest</h3><p>Rendered plans determine runtime and artifact requirements through one tested projection.</p></article>
          <article><span>MIGRATION</span><h3>Focused Zustand pass</h3><p>The reduced store shape keeps its exact diagnostics and compiles to existing state operations.</p></article>
          <article><span>NEXT</span><h3>Goal A packet</h3><p>The repository records IR, versioning, performance, and deferred product decisions for continued work.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep runtime work proportional.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.16</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.16 - Compiler analysis boundaries</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.16">GitHub release</a>
    </footer>
  </>
}
