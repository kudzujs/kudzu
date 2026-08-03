export const metadata = {
  title: "Kudzu 0.7.21 - Composable collections and effects",
  description: "Kudzu 0.7.21 adds imported pure collection transforms, pagination, search, immutable sorting, and precise derived and named effect authoring.",
  url: "https://kudzujs.cloud/releases/0.7.21",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.21 composable collections and effects",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Collection guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.21">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.21</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPOSABLE COLLECTIONS AND EFFECTS</p>
        <h1>Compose the data.<br /><em>Keep effects precise.</em></h1>
        <p className="release-lead">Collection pipelines now cover imported transforms, pagination, search, and sorting, while derived and named effects retain exact cleanup and dependency semantics.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.21">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>4</strong><span>Collection additions</span></div>
        <div><strong>2</strong><span>Effect additions</span></div>
        <div><strong>107/107</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>More familiar source.<br />The same bounded runtime.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORTS</span><h3>Pure transforms</h3><p>Relative one-parameter collection helpers compose into existing selectors.</p></article>
          <article><span>PAGINATION</span><h3>Immutable slice</h3><p>State-driven slice bounds update bounded keyed output.</p></article>
          <article><span>SEARCH</span><h3>Reactive strings</h3><p>Filter predicates combine direct state with pure string methods.</p></article>
          <article><span>SORT</span><h3>Immutable ordering</h3><p>Expression-bodied toSorted comparators preserve original arrays and keyed identity.</p></article>
          <article><span>DEPENDENCIES</span><h3>Derived primitives</h3><p>Effects compare calculated values and skip unchanged results.</p></article>
          <article><span>CALLBACKS</span><h3>Named setup and cleanup</h3><p>Simple same-component const functions substitute into existing handlers.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Compose without a component runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.21</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.21 - Composable collections and effects</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.21">GitHub release</a>
    </footer>
  </>
}
