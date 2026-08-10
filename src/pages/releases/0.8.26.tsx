export const metadata = {
  title: "Kudzu 0.8.26 - Goal B benchmark hardening",
  description: "Kudzu 0.8.26 makes Goal B commerce output checks exact and protects route-transform and keyed bulk-mount optimization boundaries.",
  url: "https://kudzujs.cloud/releases/0.8.26",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.26 Goal B benchmark hardening",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#benchmarks">Benchmarks</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.26">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.26</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REPRODUCE · PROTECT · CONTINUE</p>
        <h1>Keep the proof.<br /><em>Protect the path.</em></h1>
        <p className="release-lead">Goal B's retained optimizations now have exact commerce output comparison, direct transform-count coverage, guarded keyed bulk mounting, and an explicit baseline evidence map.</p>
        <div className="release-links">
          <a className="primary-action" href="#results">See the checks</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.26/PERFORMANCE.md#0826-goal-b-benchmark-hardening">Validation record</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1,011</strong><span>Pages compared</span></div>
        <div><strong>0</strong><span>Changed deploy hashes</span></div>
        <div><strong>175/175</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="results">
        <div className="release-section-heading"><span>01</span><div><p>GOAL B</p><h2>Make evidence repeatable.<br />Keep optimization narrow.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>COMMERCE</span><h3>Exact by default</h3><p>The paired runner rejects every candidate hash delta unless a historical comparison declares it explicitly.</p></article>
          <article><span>TRANSFORM</span><h3>Count exact work</h3><p>Repeated source transforms once, distinct source stays distinct, and each build owns a fresh result map.</p></article>
          <article><span>KEYED</span><h3>Guard bulk mounting</h3><p>The standard suite retains the threshold, majority checks, nested exclusions, and per-root fallback.</p></article>
          <article><span>BASELINE</span><h3>State the evidence</h3><p>Build, output, keyed, Worker, integration, and deliberate heap gaps are recorded separately.</p></article>
          <article><span>OUTPUT</span><h3>3,056 files agree</h3><p>Seven alternating 1,011-page builds emitted no changed deploy hash.</p></article>
          <article><span>NEXT</span><h3>Wait for a loss</h3><p>No new optimization starts until a current fixture reproduces a material regression.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the gains. Keep the proof.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.26</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.26 - Goal B benchmark hardening</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.26">GitHub release</a>
    </footer>
  </>
}
