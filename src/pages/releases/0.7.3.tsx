export const metadata = {
  title: "Kudzu 0.7.3 - React memo normalization",
  description: "Kudzu 0.7.3 compiles same-file memo components and direct-state useMemo expressions without a browser component cache.",
  url: "https://kudzujs.cloud/releases/0.7.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.3 React memo normalization",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.3">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.3</span><span>JULY 2026</span></div>
        <p className="eyebrow">REACT MEMO NORMALIZATION</p>
        <h1>Keep memo syntax.<br /><em>Ship reactive HTML.</em></h1>
        <p className="release-lead">Common memo wrappers now become build-time components, callbacks, and direct state expressions instead of a browser component cache.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.3">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>0</strong><span>Browser memo caches</span></div>
        <div><strong>85/85</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Memo-shaped source.<br />Compiler-owned updates.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>COMPONENTS</span><h3>Same-file memo</h3><p>Memoized function components remain build-time functions and never become a browser tree.</p></article>
          <article><span>CALLBACKS</span><h3>Inline useCallback</h3><p>Validated wrappers lower to existing direct event-handler specialization.</p></article>
          <article><span>VALUES</span><h3>Direct-state useMemo</h3><p>Primitive expressions over local state inline into their same-component uses.</p></article>
          <article><span>UPDATES</span><h3>Reactive bindings</h3><p>Existing state binding capabilities update memoized output without rerendering a component.</p></article>
          <article><span>SAFETY</span><h3>Source diagnostics</h3><p>Impure expressions, missing dependencies, shadowing, duplicates, and nested captures fail early.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Memo syntax alone adds no JavaScript to static routes.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the shape. Drop the cache.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.3</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.3 - React memo normalization</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.3">GitHub release</a>
    </footer>
  </>
}
