export const metadata = {
  title: "Kudzu 0.16.19 - Corrected AI delivery evidence",
  description: "Kudzu 0.16.19 records the failed 0.21.4 AI delivery gate and publishes its raw evidence.",
  url: "https://kudzujs.cloud/releases/0.16.19",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.19 corrected AI delivery evidence",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.19">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.19</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">50 PREDECLARED ATTEMPTS · FAILED 1.0 GATE · ZERO RUNTIME DELTA</p>
        <h1>Publish the result.<br /><em>Especially when it loses.</em></h1>
        <p className="release-lead">The corrected production-shaped comparison measured Kudzu at 11/25 attributable successes and React + Vite at 24/25. The evidence names the next blockers and keeps 1.0 blocked.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the comparison</a><a href="https://github.com/kudzujs/kudzu/releases/download/v0.16.19/kudzu-ai-delivery-0.21.4-gpt-5.6-sol.tar.gz">Download raw evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>11/25</strong><span>Kudzu successes</span></div>
        <div><strong>24/25</strong><span>React + Vite successes</span></div>
        <div><strong>0 B</strong><span>Browser output delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.21.4</span><div><p>CORRECTED AI DELIVERY PROOF</p><h2>Keep the failures.<br />Follow the evidence.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SUCCESS RATE</span><h3>Gate not met</h3><p>Kudzu reached 44% against React + Vite at 96%, so the required highest-or-tied success rate did not pass.</p></article>
          <article><span>COST</span><h3>No aggregate claim</h3><p>Content and commerce had no Kudzu success, leaving its median task cost unavailable rather than inferred.</p></article>
          <article><span>CONTENT</span><h3>Accepted, over budget</h3><p>All five Kudzu pages passed in Chrome only after exceeding the frozen input-token and tool-call limits.</p></article>
          <article><span>COMMERCE</span><h3>Reactive branch text</h3><p>All five Kudzu attempts froze the below-threshold text while React passed all five derived-state journeys.</p></article>
          <article><span>RAW EVIDENCE</span><h3>Both batches retained</h3><p>The invalid first batch and corrected revision are archived together with a published SHA-256 digest.</p></article>
          <article><span>SCOPE</span><h3>Evidence only</h3><p>No compiler, runtime, public API, dependency, generated application behavior, or browser byte changes.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Use the published evidence boundary.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.19</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.19 - Corrected AI delivery evidence</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.19">GitHub release</a></footer>
  </>
}
