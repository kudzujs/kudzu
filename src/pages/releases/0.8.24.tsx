export const metadata = {
  title: "Kudzu 0.8.24 - Measured Goal B optimizations",
  description: "Kudzu 0.8.24 improves large keyed restoration by 19.77% and 1,000-product builds by 6.26% through benchmark-proven narrow optimizations.",
  url: "https://kudzujs.cloud/releases/0.8.24",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.24 measured Goal B optimizations",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#benchmarks">Benchmarks</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.24">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.24</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">MEASURE · NARROW · VERIFY</p>
        <h1>Find the repeated work.<br /><em>Remove only that.</em></h1>
        <p className="release-lead">The architecture optimization Goal B starts with measured improvements to large keyed restoration and large multi-route compilation without changing Kudzu's HTML-first architecture.</p>
        <div className="release-links">
          <a className="primary-action" href="#results">See the results</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.24/PERFORMANCE.md#0824-measured-goal-b-optimizations">Raw measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>19.77%</strong><span>Faster keyed restore</span></div>
        <div><strong>6.26%</strong><span>Faster 1,000-product build</span></div>
        <div><strong>172/172</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="results">
        <div className="release-section-heading"><span>01</span><div><p>GOAL B</p><h2>Optimize measured work.<br />Preserve every contract.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>KEYED</span><h3>Batch large restoration</h3><p>Safe top-level flat lists discover mount hooks once when additions dominate both the list and its parent.</p></article>
          <article><span>BUILD</span><h3>Skip no-op AST repair</h3><p>Normalization repairs parent pointers only when a pass returns a structurally changed source root.</p></article>
          <article><span>BENCHMARK</span><h3>Fresh-profile checks</h3><p>The maintained 2,000-row fixture measures append, filter, restore, and reverse while checking identity, state, and handlers.</p></article>
          <article><span>EXTERNAL</span><h3>Real route scale</h3><p>A public 1,000-product fixture validates 1,011 complete pages across 21 alternating clean builds.</p></article>
          <article><span>OUTPUT</span><h3>35 B gzip cost</h3><p>The keyed route adds 35 B aggregate gzip; normalization changes no emitted bytes.</p></article>
          <article><span>NEXT</span><h3>Repeated route transforms</h3><p>Identical generated route entries remain the next measured Goal B investigation, not a speculative cache.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the contracts. Drop the repeated work.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.24</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.24 - Measured Goal B optimizations</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.24">GitHub release</a>
    </footer>
  </>
}
