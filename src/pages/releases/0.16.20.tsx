export const metadata = {
  title: "Kudzu 0.16.20 - AI evidence forward release",
  description: "Kudzu 0.16.20 forward-publishes the unchanged corrected AI delivery evidence.",
  url: "https://kudzujs.cloud/releases/0.16.20",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.20 AI evidence forward release",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.20">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.20</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">IMMUTABLE FORWARD RELEASE · SAME EVIDENCE · ZERO RUNTIME DELTA</p>
        <h1>Keep the record.<br /><em>Move only forward.</em></h1>
        <p className="release-lead">The 0.16.19 GitHub evidence release remains immutable after its npm workflow stopped before publication. This patch carries the same corrected 0.21.4 result into npm without changing the framework.</p>
        <div className="release-links"><a className="primary-action" href="/releases/0.16.19">Inspect the evidence</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.20">Release transaction</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>11/25</strong><span>Kudzu successes</span></div>
        <div><strong>24/25</strong><span>React + Vite successes</span></div>
        <div><strong>0 B</strong><span>Browser output delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.20</span><div><p>AI EVIDENCE FORWARD RELEASE</p><h2>Preserve every byte.<br />Publish the same result.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMMUTABILITY</span><h3>No moved tag</h3><p>The public v0.16.19 tag and its raw archive remain unchanged and directly inspectable.</p></article>
          <article><span>PUBLICATION</span><h3>Forward-only recovery</h3><p>Core 0.16.20 and generator 0.1.145 are new package versions rather than reused failed release coordinates.</p></article>
          <article><span>GATE</span><h3>Still blocked</h3><p>The failed 0.21.4 success-and-cost decision is unchanged and does not authorize 1.0.</p></article>
          <article><span>SCOPE</span><h3>Metadata only</h3><p>No compiler, runtime, public API, dependency, generated behavior, or browser byte changes.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Install the forward release.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.20</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.20 - AI evidence forward release</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.20">GitHub release</a></footer>
  </>
}
