export const metadata = {
  title: "Kudzu 0.8.54 - Inspectable route artifact closure",
  description: "Kudzu 0.8.54 reports exact per-route capability requirements and emitted handler, Worker, stylesheet, and shared-chunk ownership.",
  url: "https://kudzujs.cloud/releases/0.8.54",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.54 inspectable route artifact closure",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#build">Build output</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.54">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.54</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SIGN · FOLLOW · ATTRIBUTE</p>
        <h1>Trace the route.<br /><em>Through every chunk.</em></h1>
        <p className="release-lead">Validated route edges now continue through final handler and Worker bundle graphs. One deterministic report explains capability requirements, emitted entries, transitive chunks, styles, and shared ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#artifact-closure">Inspect the graph</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.54/PERFORMANCE.md#current-0854-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Route artifact contract</span></div>
        <div><strong>2</strong><span>Metafile graphs retained</span></div>
        <div><strong>0 B</strong><span>New browser runtime</span></div>
      </section>

      <section className="release-section" id="artifact-closure">
        <div className="release-section-heading"><span>P1</span><div><p>ROUTE ARTIFACT CLOSURE</p><h2>Keep structural ownership.<br />Make output explain itself.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SIGNATURES</span><h3>Sign capabilities</h3><p>Each route records one exact CapabilityIR manifest and deterministic SHA-256 signature.</p></article>
          <article><span>HANDLERS</span><h3>Follow retained entries</h3><p>Handler roots come directly from validated RouteBuildRecord references.</p></article>
          <article><span>WORKERS</span><h3>Keep graph boundaries</h3><p>Worker entries and chunks remain separate from document-loaded handler graphs.</p></article>
          <article><span>CHUNKS</span><h3>Attribute sharing</h3><p>Transitive esbuild outputs identify every route that reaches a shared chunk.</p></article>
          <article><span>STATIC</span><h3>Report zero cost</h3><p>Static routes retain empty runtime and handler edges with no browser JavaScript.</p></article>
          <article><span>HOOKS</span><h3>Expose to hooks</h3><p>The JSON-safe artifact contract is written to scratch and passed to <code>afterBuild()</code>.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Inspect what each route actually owns.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.54</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.54 - Inspectable route artifact closure</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.54">GitHub release</a>
    </footer>
  </>
}
