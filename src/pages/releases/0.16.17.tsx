export const metadata = {
  title: "Kudzu 0.16.17 - Browser performance gates",
  description: "Kudzu 0.16.17 enforces browser latency and long-session memory budgets without changing production compiler or runtime code.",
  url: "https://kudzujs.cloud/releases/0.16.17",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.17 browser performance gates",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.17">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.17</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">100 MS ACTIONS · 101 NAVIGATIONS · ZERO RUNTIME DELTA</p>
        <h1>Measure the session.<br /><em>Fail when it drifts.</em></h1>
        <p className="release-lead">Kudzu's existing keyed, range, navigation, lazy-load, and endurance evidence now carries explicit release alarms.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the browser proof</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.17">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>84.5 ms</strong><span>2,000-row restore</span></div>
        <div><strong>4.9 ms</strong><span>Enhanced navigation</span></div>
        <div><strong>79,988 B</strong><span>101-navigation heap delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.17</span><div><p>BROWSER PERFORMANCE GATES</p><h2>Bound every operation.<br />Retain every owner.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>KEYED</span><h3>Restore under budget</h3><p>Append, filter, restore, and reverse all pass one maintained 100 ms median alarm across seven fresh profiles.</p></article>
          <article><span>RANGE</span><h3>Keep the DOM bounded</h3><p>Pagination and windowing retain exactly 100 rows while direct static HTML remains the zero-JavaScript control.</p></article>
          <article><span>NAVIGATION</span><h3>Preserve the layout</h3><p>Table updates and list-to-detail navigation stay below budget while layout state and DOM identity survive.</p></article>
          <article><span>LAZY</span><h3>Load once on demand</h3><p>One deferred CodeMirror chunk stays out of initial HTML, is shared by two owners, and cleans up exactly.</p></article>
          <article><span>ENDURANCE</span><h3>Balance 101 navigations</h3><p>Editor handles, documents, listeners, state, DOM, and forced-GC heap remain inside declared bounds.</p></article>
          <article><span>OUTPUT</span><h3>Ship zero extra bytes</h3><p>The gates change benchmark and evidence code only, adding no compiler, runtime, API, or browser artifact.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep browser performance executable.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.17</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.17 - Browser performance gates</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.17">GitHub release</a></footer>
  </>
}
