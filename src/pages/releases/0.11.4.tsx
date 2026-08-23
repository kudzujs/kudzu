export const metadata = {
  title: "Kudzu 0.11.4 - Pagination, refresh, and polling policy",
  description: "Kudzu 0.11.4 proves URL-owned pagination, bounded results, refresh, history, and visibility-aware polling cleanup without a scheduler.",
  url: "https://kudzujs.cloud/releases/0.11.4",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.11.4 pagination refresh and polling policy",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.4">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.11.4</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PAGE · REFRESH · RELEASE</p>
        <h1>Bound the data.<br /><em>Own the policy.</em></h1>
        <p className="release-lead">URL signals, one abortable fetch effect, and one optional polling effect cover the complete policy without a cache or scheduler.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the policy</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.4">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>11</strong><span>Exact list requests</span></div>
        <div><strong>2</strong><span>Maximum retained rows</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.11.4</span><div><p>OWNED SERVER DATA</p><h2>Synchronize the URL.<br />Release the work.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>QUERY</span><h3>Own page and filter</h3><p>Existing URL signals drive one bounded server read.</p></article>
          <article><span>HISTORY</span><h3>Restore on back</h3><p>Native history restores URL, signals, and result rows.</p></article>
          <article><span>REFRESH</span><h3>Refetch explicitly</h3><p>One route-owned counter restarts the abortable effect.</p></article>
          <article><span>VISIBILITY</span><h3>Suppress hidden work</h3><p>Hidden visibility events make no request.</p></article>
          <article><span>CLEANUP</span><h3>Release both owners</h3><p>Disabling polling clears its interval and listener.</p></article>
          <article><span>BOUNDARY</span><h3>Skip schedulers</h3><p>No cache, registry, retained result store, or scheduler ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep server-data policy local.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.11.4</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.11.4 - Pagination, refresh, and polling policy</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.4">GitHub release</a></footer>
  </>
}
