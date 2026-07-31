export const metadata = {
  title: "Kudzu 0.7.4 - Memoized collection pipelines",
  description: "Kudzu 0.7.4 compiles React useMemo collection pipelines to existing keyed-list selectors without a browser memo cache.",
  url: "https://kudzujs.cloud/releases/0.7.4",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.4 memoized collection pipelines",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Collection guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.4">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.4</span><span>JULY 2026</span></div>
        <p className="eyebrow">MEMOIZED COLLECTION PIPELINES</p>
        <h1>Keep the pipeline.<br /><em>Preserve the rows.</em></h1>
        <p className="release-lead">React useMemo collection work now lowers to Kudzu's existing selector and keyed DOM identity model instead of a browser component cache.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.4">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>0</strong><span>Browser memo caches</span></div>
        <div><strong>86/86</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>React-shaped derivation.<br />Keyed DOM updates.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FILTER</span><h3>Selector reuse</h3><p>Inline predicates compile through the existing synchronous collection evaluator.</p></article>
          <article><span>MAP</span><h3>Array.from lowering</h3><p>Intermediate map transforms become the existing serialized mapper operation.</p></article>
          <article><span>FLATMAP</span><h3>Direct child arrays</h3><p>Direct-property projections retain the established nested collection boundary.</p></article>
          <article><span>IDENTITY</span><h3>Stable keyed rows</h3><p>Existing rows retain their DOM nodes as memoized results change.</p></article>
          <article><span>SAFETY</span><h3>Synchronous callbacks</h3><p>Async, rest, default, optional, and arbitrary callbacks fail before output.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Collection authoring alone adds no JavaScript to static routes.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Derive data, not a component tree.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.4</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.4 - Memoized collection pipelines</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.4">GitHub release</a>
    </footer>
  </>
}
