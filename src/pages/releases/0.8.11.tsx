export const metadata = {
  title: "Kudzu 0.8.11 - Stale-safe data migration",
  description: "Kudzu 0.8.11 moves data work by availability time and prevents superseded dependency effects from committing stale results.",
  url: "https://kudzujs.cloud/releases/0.8.11",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.11 stale-safe data migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.11">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.11</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STALE-SAFE DATA MIGRATION</p>
        <h1>Move data by timing.<br /><em>Keep only the latest.</em></h1>
        <p className="release-lead">Build-known reads become static HTML, browser-only reads become owned effects, and superseded async work can no longer overwrite the latest result.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.11">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Library migrations</span></div>
        <div><strong>0</strong><span>Cache runtime bytes</span></div>
        <div><strong>142/142</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Data timing classified.<br />Stale writes rejected.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>BUILD</span><h3>Async static reads</h3><p>Build-known query results render complete HTML without browser JavaScript.</p></article>
          <article><span>BROWSER</span><h3>Owned fetch effects</h3><p>Browser-only reads use application loading, error, result, and refetch state.</p></article>
          <article><span>LATEST</span><h3>Invocation tokens</h3><p>Late setters from superseded dependency effects cannot overwrite current state.</p></article>
          <article><span>FORMS</span><h3>Native form migration</h3><p>Constraint validation and FormData replace React Hook Form runtime behavior.</p></article>
          <article><span>STATIC</span><h3>Zero-cost siblings</h3><p>Routes without browser-only work continue shipping complete zero-JavaScript HTML.</p></article>
          <article><span>BOUNDARY</span><h3>No hidden frameworks</h3><p>Providers, caches, retries, controllers, watchers, and resolvers remain removed.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Move the data. Keep the latest result.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.11</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.11 - Stale-safe data migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.11">GitHub release</a>
    </footer>
  </>
}
