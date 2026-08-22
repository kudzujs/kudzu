export const metadata = {
  title: "Kudzu 0.11.2 - Request coordination evidence",
  description: "Kudzu 0.11.2 reviews three server-data fixtures and closes shared request coordination without a new primitive or browser bytes.",
  url: "https://kudzujs.cloud/releases/0.11.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.11.2 request coordination evidence",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.11.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">OWN · INVALIDATE · RELEASE</p>
        <h1>Review the pressure.<br /><em>Keep one owner.</em></h1>
        <p className="release-lead">Three unrelated server-data fixtures reuse ordinary state and owned effects. None requires a shared request registry, subscriber graph, or cache.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the decision</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Independent fixtures</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>0 B</strong><span>Browser increase</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.11.2</span><div><p>COORDINATION DECISION</p><h2>Reuse ownership.<br />Reject speculative cache.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROJECT</span><h3>Share one layout owner</h3><p>List and detail consume one project record without duplicate reads.</p></article>
          <article><span>QUERY</span><h3>Own one route effect</h3><p>TanStack-shaped loading reduces to explicit state and one request owner.</p></article>
          <article><span>URL</span><h3>Invalidate dependencies</h3><p>Answer-shaped page and order changes replace stale effect ownership.</p></article>
          <article><span>REUSE</span><h3>Reuse owned effects</h3><p>Existing dependency invalidation and cleanup cover every journey.</p></article>
          <article><span>EVIDENCE</span><h3>Require repeated pressure</h3><p>No fixture has independent subscribers requesting the same key.</p></article>
          <article><span>BOUNDARY</span><h3>Skip request registries</h3><p>No cache, invalidation graph, subscriber set, or scheduler ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep server data explicitly owned.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.11.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.11.2 - Request coordination evidence</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.2">GitHub release</a></footer>
  </>
}
