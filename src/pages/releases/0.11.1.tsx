export const metadata = {
  title: "Kudzu 0.11.1 - List/detail data consistency",
  description: "Kudzu 0.11.1 proves exact list/detail mutation consistency, request counts, navigation retention, and reload restoration without a query runtime.",
  url: "https://kudzujs.cloud/releases/0.11.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.11.1 list and detail data consistency",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.11.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">READ · MUTATE · RELOAD</p>
        <h1>Share the record.<br /><em>Count every request.</em></h1>
        <p className="release-lead">One layout owner keeps list and detail routes consistent through mutation, navigation, and reload using ordinary state and native fetch.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the evidence</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>GET per document</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.11.1</span><div><p>SHARED SERVER DATA</p><h2>Retain one owner.<br />Restore from truth.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>OWNER</span><h3>Retain one owner</h3><p>The application layout owns the project record for both routes.</p></article>
          <article><span>MUTATION</span><h3>Share confirmed data</h3><p>One server-confirmed rename is visible in list and detail immediately.</p></article>
          <article><span>NETWORK</span><h3>Count every request</h3><p>Enhanced navigation adds no project read; reload adds exactly one.</p></article>
          <article><span>RELOAD</span><h3>Restore server truth</h3><p>A fresh document reconstructs the confirmed revision from the server.</p></article>
          <article><span>LIMIT</span><h3>Keep document lifetime</h3><p>Shared state ends with its document and retained layout owner.</p></article>
          <article><span>BOUNDARY</span><h3>Skip query runtimes</h3><p>No request registry, cache, subscriber graph, or invalidation runtime ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Coordinate data with ordinary ownership.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.11.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.11.1 - List/detail data consistency</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.1">GitHub release</a></footer>
  </>
}
