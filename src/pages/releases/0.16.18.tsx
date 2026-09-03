export const metadata = {
  title: "Kudzu 0.16.18 - AI attribution integrity",
  description: "Kudzu 0.16.18 prevents unattributed AI delivery attempts from inflating success and cost results.",
  url: "https://kudzujs.cloud/releases/0.16.18",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.18 AI attribution integrity",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.18">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.18</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">RAW TRACE REQUIRED · ZERO FALSE SUCCESSES · ZERO RUNTIME DELTA</p>
        <h1>Count the evidence.<br /><em>Never the assumption.</em></h1>
        <p className="release-lead">The AI delivery harness now fails closed when an adapter omits attribution, preserving honest success and cost denominators before the production-shaped comparison.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the attribution proof</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.18">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Unattributed successes</span></div>
        <div><strong>3/3</strong><span>Focused harness checks</span></div>
        <div><strong>0 B</strong><span>Browser output delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.18</span><div><p>AI ATTRIBUTION INTEGRITY</p><h2>Require the trace.<br />Preserve the denominator.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FAIL CLOSED</span><h3>No synthetic success</h3><p>An exit-zero adapter without its raw trace is retained as an incomplete failure, never a zero-token success.</p></article>
          <article><span>SUCCESS RATE</span><h3>Keep failures visible</h3><p>Missing attribution contributes zero successes to both paired variants instead of inflating either framework.</p></article>
          <article><span>COST</span><h3>Withhold unsupported claims</h3><p>Per-success token and monetary summaries remain null when no attributable success exists.</p></article>
          <article><span>RAW EVIDENCE</span><h3>Retain the attempt</h3><p>The runner still records source, artifacts, acceptance, commands, and the explicit incomplete attribution state.</p></article>
          <article><span>SCOPE</span><h3>Claim no ranking</h3><p>The five-task production comparison remains active; this patch only repairs its evidence boundary.</p></article>
          <article><span>OUTPUT</span><h3>Ship zero extra bytes</h3><p>The change touches benchmark, tests, and release records only, adding no compiler, runtime, API, or browser artifact.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep AI evidence attributable.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.18</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.18 - AI attribution integrity</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.18">GitHub release</a></footer>
  </>
}
