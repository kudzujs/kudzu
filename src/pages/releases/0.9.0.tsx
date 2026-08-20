export const metadata = {
  title: "Kudzu 0.9.0 - Semantic compression",
  description: "Kudzu 0.9.0 compiles broader React-shaped applications through bounded package-neutral semantics and route-specific browser capabilities.",
  url: "https://kudzujs.cloud/releases/0.9.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.9.0 semantic compression",
  themeColor: "#ff8a3d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs">Documentation</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.0">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.9.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPRESS · SPECIALIZE · SHIP</p>
        <h1>Keep the React shape.<br /><em>Ship only the capability.</em></h1>
        <p className="release-lead">State, derived data, shared actions, effects, component ownership, and keyed collections now converge on Kudzu's bounded package-neutral semantic core.</p>
        <div className="release-links">
          <a className="primary-action" href="#proof">Inspect the proof</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.9.0/PERFORMANCE.md#09-final-proof-candidate-diagnostics">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>10,011</strong><span>Commerce pages proven</span></div>
        <div><strong>542,484 KiB</strong><span>10k-route peak RSS</span></div>
      </section>

      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.9</span><div><p>SEMANTIC COMPRESSION</p><h2>Ordinary source.<br />Bounded output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>DERIVED</span><h3>Calculate without a runtime</h3><p>Relative synchronous calculations specialize into existing reactive bindings and keyed ownership.</p></article>
          <article><span>ACTIONS</span><h3>Erase provider machinery</h3><p>Reduced Context and Zustand actions lower to package-neutral shared state and commands.</p></article>
          <article><span>OWNERSHIP</span><h3>Keep identity exact</h3><p>Repeated, conditional, and keyed components retain state, refs, effects, and cleanup without a browser component tree.</p></article>
          <article><span>STATIC</span><h3>Ship no unused JavaScript</h3><p>Static routes remain complete HTML with zero deployed browser code.</p></article>
          <article><span>SCALE</span><h3>Build ten thousand routes</h3><p>Staged HTML and streamed evidence keep peak RSS below the matched Astro build.</p></article>
          <article><span>BOUNDARY</span><h3>Fail closed</h3><p>Unsupported dynamic shapes retain source diagnostics instead of widening into a general runtime.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Compile broader React-shaped applications without shipping React.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.9.0</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.9.0 - Semantic compression</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.0">GitHub release</a>
    </footer>
  </>
}
