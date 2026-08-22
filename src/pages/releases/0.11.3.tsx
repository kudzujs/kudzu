export const metadata = {
  title: "Kudzu 0.11.3 - Optimistic mutation and rollback",
  description: "Kudzu 0.11.3 proves optimistic list/detail mutation, exact rollback, duplicate prevention, retry, and reload with ordinary state.",
  url: "https://kudzujs.cloud/releases/0.11.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.11.3 optimistic mutation and rollback",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.11.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">WRITE · REJECT · RETRY</p>
        <h1>Write first.<br /><em>Rollback exactly.</em></h1>
        <p className="release-lead">One owned handler snapshots shared state, writes optimistically, restores after rejection, and confirms retry without a transaction runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the mutation</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Accepted mutation</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>3 B</strong><span>Session gzip increase</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.11.3</span><div><p>OWNED MUTATION</p><h2>Snapshot locally.<br />Confirm server truth.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>OPTIMISTIC</span><h3>Write immediately</h3><p>List and detail consume the optimistic shared project value.</p></article>
          <article><span>DUPLICATE</span><h3>Disable duplicates</h3><p>The pending UI disables another authored submission after commit.</p></article>
          <article><span>ROLLBACK</span><h3>Restore exactly</h3><p>An HTTP failure restores the captured name and revision.</p></article>
          <article><span>ERROR</span><h3>Report accessibly</h3><p>The rejected attempt exposes a route-independent alert.</p></article>
          <article><span>RETRY</span><h3>Confirm the retry</h3><p>The second attempt replaces optimistic state with server truth.</p></article>
          <article><span>BOUNDARY</span><h3>Skip transactions</h3><p>No transaction primitive, cache, scheduler, or mutation runtime ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Own mutations with ordinary state.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.11.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.11.3 - Optimistic mutation and rollback</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.3">GitHub release</a></footer>
  </>
}
