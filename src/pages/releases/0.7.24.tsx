export const metadata = {
  title: "Kudzu 0.7.24 - Router-shaped query reads",
  description: "Kudzu 0.7.24 lowers supported read-only React Router useSearchParams authoring to nullable route signals and a minimal native query reader.",
  url: "https://kudzujs.cloud/releases/0.7.24",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.24 router-shaped query reads",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#navigation">Routing guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.24">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.24</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ROUTER-SHAPED QUERY READS</p>
        <h1>Read the URL.<br /><em>Ship only the reader.</em></h1>
        <p className="release-lead">Familiar read-only search parameter source now becomes nullable route signals and one native query initializer, without React Router or a retained component tree.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.24">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Native URL reader</span></div>
        <div><strong>0 B</strong><span>On unused routes</span></div>
        <div><strong>115/115</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Keep the query shape.<br />Lower every read.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Read-only tuple</h3><p>Named or aliased useSearchParams initializes one top-level params binding.</p></article>
          <article><span>SIGNALS</span><h3>Static get reads</h3><p>Each literal query key becomes one cached nullable route signal.</p></article>
          <article><span>PLATFORM</span><h3>Native decoding</h3><p>URLSearchParams handles missing, empty, duplicate, plus, and encoded values.</p></article>
          <article><span>ORDERING</span><h3>Effects see latest values</h3><p>Query initialization completes before route effects mount.</p></article>
          <article><span>NAVIGATION</span><h3>Same-document ready</h3><p>Configured navigation passes the requested search string into route setup.</p></article>
          <article><span>EXCLUSION</span><h3>Zero cost when unused</h3><p>Static siblings emit no parameter asset or browser JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Read query values without carrying a router.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.24</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.24 - Router-shaped query reads</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.24">GitHub release</a>
    </footer>
  </>
}
