export const metadata = {
  title: "Kudzu 0.11.0 - Owned fetch lifecycle",
  description: "Kudzu 0.11.0 proves loading, error, refetch, stale-work rejection, and cancellation with native fetch and existing effect ownership.",
  url: "https://kudzujs.cloud/releases/0.11.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.11.0 owned fetch lifecycle",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.0">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.11.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LOAD · REPLACE · RELEASE</p>
        <h1>Fetch the data.<br /><em>Own the lifecycle.</em></h1>
        <p className="release-lead">Loading, HTTP failure, refetch, stale work, and cancellation now compose from ordinary state, effects, and native fetch without a query runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the lifecycle</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.0">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>21</strong><span>Fresh Chrome profiles</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.11.0</span><div><p>OWNED SERVER DATA</p><h2>Keep requests local.<br />Release stale work.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>LOADING</span><h3>Show loading accessibly</h3><p>The static document exposes a live status while browser-only data starts.</p></article>
          <article><span>ERROR</span><h3>Report HTTP failure</h3><p>Non-success responses become an accessible alert owned by application state.</p></article>
          <article><span>REFETCH</span><h3>Recover explicitly</h3><p>One primitive request counter restarts the existing dependency effect.</p></article>
          <article><span>STALE</span><h3>Reject old writes</h3><p>Superseded continuations cannot replace newer keyed project data.</p></article>
          <article><span>CLEANUP</span><h3>Abort on release</h3><p>Dependency replacement and route removal invoke authored cancellation.</p></article>
          <article><span>BOUNDARY</span><h3>Skip query runtimes</h3><p>No cache, Provider, retry scheduler, or request registry ships to the browser.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Own browser data without a query runtime.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.11.0</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.11.0 - Owned fetch lifecycle</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.11.0">GitHub release</a></footer>
  </>
}
