export const metadata = {
  title: "Kudzu 0.8.5 - Owned timer actions",
  description: "Kudzu 0.8.5 compiles one private custom-hook timeout ref into existing handler and effect ownership.",
  url: "https://kudzujs.cloud/releases/0.8.5",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.5 owned timer actions",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#events">Event handlers</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.5">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.5</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">OWNED TIMER ACTIONS</p>
        <h1>Replace the timer.<br /><em>Keep the owner.</em></h1>
        <p className="release-lead">A returned custom-hook action can replace one private timeout while effect cleanup owns cancellation across unmount and remount.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.5">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Owned timer ref</span></div>
        <div><strong>0</strong><span>New runtimes</span></div>
        <div><strong>134/134</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Latest work wins.<br />Cleanup remains explicit.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>REPLACE</span><h3>Latest timeout only</h3><p>Repeated actions directly clear the previous timer before assigning the next.</p></article>
          <article><span>OWNERSHIP</span><h3>Effect cleanup</h3><p>An empty-dependency effect clears the latest timer during conditional unmount.</p></article>
          <article><span>REMOUNT</span><h3>Fresh private state</h3><p>Removed owners release the hidden slot, and remount starts from null.</p></article>
          <article><span>MIGRATION</span><h3>Ordinary hook syntax</h3><p>Named, default-arrow, and re-exported relative hooks keep familiar React authoring.</p></article>
          <article><span>OUTPUT</span><h3>No timer runtime</h3><p>Existing handler, state, and effect capabilities provide the complete behavior.</p></article>
          <article><span>BOUNDARY</span><h3>Static diagnostics</h3><p>Dynamic delays and unsupported timer graphs fail at their source location.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Own delayed actions explicitly.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.5</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.5 - Owned timer actions</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.5">GitHub release</a>
    </footer>
  </>
}
