export const metadata = {
  title: "Kudzu 0.16.21 - AI evidence npm recovery",
  description: "Kudzu 0.16.21 retries npm publication of the unchanged corrected AI delivery evidence.",
  url: "https://kudzujs.cloud/releases/0.16.21",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.21 AI evidence npm recovery",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.21">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.21</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">NPM RECOVERY · SAME EVIDENCE · ZERO RUNTIME DELTA</p>
        <h1>Keep the record.<br /><em>Move only forward.</em></h1>
        <p className="release-lead">The 0.16.20 GitHub release remains immutable after npm rejected its trusted-publishing signing certificate. This patch retries the same corrected 0.21.4 result without changing the framework.</p>
        <div className="release-links"><a className="primary-action" href="/releases/0.16.19">Inspect the evidence</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.21">Release transaction</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>11/25</strong><span>Kudzu successes</span></div>
        <div><strong>24/25</strong><span>React + Vite successes</span></div>
        <div><strong>0 B</strong><span>Browser output delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.21</span><div><p>AI EVIDENCE NPM RECOVERY</p><h2>Preserve every byte.<br />Retry only publication.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMMUTABILITY</span><h3>No moved tag</h3><p>The public v0.16.19 and v0.16.20 tags remain unchanged and directly inspectable.</p></article>
          <article><span>PUBLICATION</span><h3>Forward-only retry</h3><p>Core 0.16.21 and generator 0.1.146 use new package versions rather than reused coordinates.</p></article>
          <article><span>GATE</span><h3>Still blocked</h3><p>The failed 0.21.4 success-and-cost decision is unchanged and does not authorize 1.0.</p></article>
          <article><span>SCOPE</span><h3>Metadata only</h3><p>No compiler, runtime, public API, dependency, generated behavior, or browser byte changes.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Install the recovery release.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.21</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.21 - AI evidence npm recovery</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.21">GitHub release</a></footer>
  </>
}
