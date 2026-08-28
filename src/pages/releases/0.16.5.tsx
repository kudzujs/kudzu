export const metadata = {
  title: "Kudzu 0.16.5 - Bounded navigation cache",
  description: "Kudzu 0.16.5 rejects stale prefetch cache writes and proves bounded document, state, DOM, listener, and editor ownership across long sessions.",
  url: "https://kudzujs.cloud/releases/0.16.5",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.5 bounded navigation cache",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.5">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.5</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STALE REJECTION · BOUNDED CACHE · EXACT DISPOSAL</p>
        <h1>Navigate forward.<br /><em>Leave nothing behind.</em></h1>
        <p className="release-lead">Superseded prefetches can no longer resurrect pruned documents, and one long-lived browser gate keeps every owner measurable.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the bound</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.5">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>101</strong><span>Measured navigations</span></div>
        <div><strong>8 → 8</strong><span>Retained documents</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.5</span><div><p>BOUNDED OWNERSHIP</p><h2>Reject the stale.<br />Retain the current.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PREFETCH</span><h3>Prune by URL</h3><p>Current location and eligible anchors remain the complete cache bound.</p></article>
          <article><span>REVISION</span><h3>Reject stale work</h3><p>Superseded responses return before they can re-enter the cache.</p></article>
          <article><span>STATE</span><h3>Release routes</h3><p>Canonical browser state returns to the same empty owner set.</p></article>
          <article><span>RESOURCE</span><h3>Dispose editors</h3><p>Real CodeMirror mounts and disposals remain exactly balanced.</p></article>
          <article><span>TRANSPORT</span><h3>Own notifications</h3><p>One layout effect handles reconnect, offline recovery, and final close.</p></article>
          <article><span>TRACE</span><h3>Keep evidence</h3><p>Raw samples preserve heap, DOM, listener, resource, and navigation counters.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep navigation bounded.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.5</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.5 - Bounded navigation cache</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.5">GitHub release</a></footer>
  </>
}
