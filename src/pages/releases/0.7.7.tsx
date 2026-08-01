export const metadata = {
  title: "Kudzu 0.7.7 - Imported memo collections",
  description: "Kudzu 0.7.7 compiles state-dependent filters over imported static catalogs without a browser memo cache.",
  url: "https://kudzujs.cloud/releases/0.7.7",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.7 imported memo collections",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#state">State guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.7">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.7</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">IMPORTED MEMO COLLECTIONS</p>
        <h1>Import the catalog.<br /><em>Keep keyed identity.</em></h1>
        <p className="release-lead">State-dependent filters over imported static arrays now lower to Kudzu's existing keyed-list selectors instead of a browser memo cache.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.7">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Browser memo cache</span></div>
        <div><strong>0</strong><span>React runtime</span></div>
        <div><strong>92/92</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Static catalog.<br />Reactive selection.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORT</span><h3>Static anchors</h3><p>Named relative JSON-safe array exports resolve completely during the build.</p></article>
          <article><span>STATE</span><h3>Direct dependencies</h3><p>Declared local state reads re-evaluate only the existing collection selector.</p></article>
          <article><span>IDENTITY</span><h3>Stable keyed rows</h3><p>Rows that remain selected retain their exact DOM nodes through filtering.</p></article>
          <article><span>RESTORE</span><h3>Clean remounts</h3><p>Removed rows are released and mount fresh when the filter restores them.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Complete dependencies</h3><p>Missing captured state dependencies fail at build time with source locations.</p></article>
          <article><span>OUTPUT</span><h3>No memo runtime</h3><p>Static routes stay JavaScript-free and imported catalog modules do not ship.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Filter data, not component trees.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.7</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.7 - Imported memo collections</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.7">GitHub release</a>
    </footer>
  </>
}
