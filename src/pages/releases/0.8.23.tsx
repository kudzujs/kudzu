export const metadata = {
  title: "Kudzu 0.8.23 - Source compiler boundary",
  description: "Kudzu 0.8.23 completes Goal A with one no-write source compiler result for analysis, ModuleIR, handlers, build modules, and assets.",
  url: "https://kudzujs.cloud/releases/0.8.23",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.23 source compiler boundary",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.23">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.23</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ANALYZE · RETURN · ORCHESTRATE</p>
        <h1>Finish source work.<br /><em>Return only data.</em></h1>
        <p className="release-lead">Goal A completes with normalization, TSX analysis, ModuleIR finalization, handler generation, and build-module generation behind one no-write source compiler result.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.23">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>171/171</strong><span>Tests passing</span></div>
        <div><strong>744</strong><span>build.mjs lines</span></div>
        <div><strong>9</strong><span>Parity builds</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>GOAL A COMPLETE</p><h2>Keep AST work local.<br />Orchestrate explicit results.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>One no-write result</h3><p>compileSource returns the project-relative build module, component analysis, ModuleIR, optional handler module, and assets.</p></article>
          <article><span>BOUNDARY</span><h3>JSON-safe data</h3><p>No TypeScript node, Map, Set, function, closure, or Symbol crosses into build orchestration.</p></article>
          <article><span>GRAPH</span><h3>Shared resolution</h3><p>Source graph resolution and URL/filesystem conversion now have focused shared owners.</p></article>
          <article><span>WORKERS</span><h3>Direct emission owner</h3><p>The Worker compiler owns graph emission while source results retain only JSON-safe edges and rewritten source.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>The complete site and eight representative deploy trees remain byte-identical to 0.8.22.</p></article>
          <article><span>RUNTIME</span><h3>Unchanged contracts</h3><p>RouteIR, CapabilityIR, complete HTML, browser IDs, accepted syntax, and runtime capabilities remain unchanged.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Compile source once. Return explicit data.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.23</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.23 - Source compiler boundary</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.23">GitHub release</a>
    </footer>
  </>
}
