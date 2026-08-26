export const metadata = {
  title: "Kudzu 0.14.2 - Infinite loading composition",
  description: "Kudzu 0.14.2 composes bounded cursor loading from native IntersectionObserver, owned fetch, ordinary state, and existing keyed lists.",
  url: "https://kudzujs.cloud/releases/0.14.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.14.2 infinite loading composition",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.14.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SENTINEL · OWNED FETCH · BOUNDED RESULTS</p>
        <h1>Reach the sentinel.<br /><em>Load only the next page.</em></h1>
        <p className="release-lead">Native observation, ordinary state, and existing keyed ownership compose cursor loading without a query runtime, scheduler, or browser component tree.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the bounds</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Maximum requests</span></div>
        <div><strong>6</strong><span>Maximum retained rows</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.14.2</span><div><p>INCREMENTAL OWNERSHIP</p><h2>Append the page.<br />Keep the identity.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>OBSERVE</span><h3>Use the platform</h3><p>One intrinsic sentinel owns a native IntersectionObserver with exact disconnect.</p></article>
          <article><span>FETCH</span><h3>Own each request</h3><p>Cursor changes start one abortable route effect without a query cache.</p></article>
          <article><span>APPEND</span><h3>Reuse keyed rows</h3><p>Immutable append preserves existing project DOM and row state.</p></article>
          <article><span>DEDUPE</span><h3>Suppress repeats</h3><p>Repeated triggers and project IDs do not create duplicate requests or rows.</p></article>
          <article><span>RECOVER</span><h3>Retry explicitly</h3><p>Accessible loading, error, retry, and terminal states remain application-owned.</p></article>
          <article><span>BOUND</span><h3>Stop at six</h3><p>Two successful pages and six retained projects keep network and memory finite.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Compose bounded incremental loading.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.14.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.14.2 - Infinite loading composition</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.2">GitHub release</a></footer>
  </>
}
