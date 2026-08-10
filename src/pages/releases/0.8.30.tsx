export const metadata = {
  title: "Kudzu 0.8.30 - Graph failure diagnostics",
  description: "Kudzu 0.8.30 reports unresolved ordinary runtime edges and dynamic imports at the original importer before generated module loading.",
  url: "https://kudzujs.cloud/releases/0.8.30",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.30 graph failure diagnostics",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.30">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.30</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">TRACE · LOCATE · STOP</p>
        <h1>Fail at the source.<br /><em>Before output exists.</em></h1>
        <p className="release-lead">Kudzu now validates ordinary runtime graph edges during reachability, keeping missing imports, re-exports, and dynamic imports attached to the source that authored them.</p>
        <div className="release-links">
          <a className="primary-action" href="#graph">See the graph boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.30/docs/next-architecture/large-application-ai-native-roadmap.md">Execution plan</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>4</strong><span>Failure fixtures</span></div>
        <div><strong>0</strong><span>Generated paths leaked</span></div>
        <div><strong>189/189</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="graph">
        <div className="release-section-heading"><span>03</span><div><p>GRAPH DIAGNOSTICS</p><h2>Keep the edge.<br />Name the importer.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORTS</span><h3>Missing files stop early</h3><p>Bound and side-effect relative imports report the original file, line, column, and written specifier.</p></article>
          <article><span>RE-EXPORTS</span><h3>Barrels keep provenance</h3><p>Named/default forwarding and export-star failures point to the barrel that authored the unresolved edge.</p></article>
          <article><span>DYNAMIC</span><h3>One explicit boundary</h3><p>Relative, package, template, and computed dynamic imports fail during ordinary graph discovery.</p></article>
          <article><span>WORKERS</span><h3>Ownership stays separate</h3><p>Worker-only modules retain Worker-specific graph rules rather than inheriting ordinary-module diagnostics.</p></article>
          <article><span>EXCLUSION</span><h3>Unused source stays unused</h3><p>Type-only edges and unreachable migration files remain outside the runtime graph and cannot block builds.</p></article>
          <article><span>NEXT</span><h3>Symbols remain ordered</h3><p>Export-name validation waits for the planned module-symbol graph; this patch adds no speculative resolver.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Find the source error. Skip the generated detour.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.30</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.30 - Graph failure diagnostics</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.30">GitHub release</a>
    </footer>
  </>
}
