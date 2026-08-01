export const metadata = {
  title: "Kudzu 0.7.10 - Component composition",
  description: "Kudzu 0.7.10 preserves analyzable prop spreads and forwarded JSX children across specialized collection components.",
  url: "https://kudzujs.cloud/releases/0.7.10",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.10 component composition",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.10">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.10</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPONENT COMPOSITION</p>
        <h1>Spread the props.<br /><em>Keep the children.</em></h1>
        <p className="release-lead">Ordinary component composition now crosses existing collection specialization boundaries while every component call still disappears before browser output.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.10">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Added browser runtime</span></div>
        <div><strong>2</strong><span>Composition forms</span></div>
        <div><strong>95/95</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Ordinary call sites.<br />Intrinsic output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CONST SPREADS</span><h3>Known sources</h3><p>Direct calling-component const objects expand into specialized props at build time.</p></article>
          <article><span>INLINE SPREADS</span><h3>Local objects</h3><p>Inline object literals preserve normal source-order prop overrides.</p></article>
          <article><span>CHILDREN</span><h3>Forwarded content</h3><p>Text and JSX elements flatten into the specialized intrinsic component root.</p></article>
          <article><span>STATIC</span><h3>Zero-cost routes</h3><p>Composition without browser behavior still emits no client JavaScript.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Analyzable boundary</h3><p>Dynamic and unsafe spread shapes fail at their source location.</p></article>
          <article><span>MIGRATION</span><h3>Less restructuring</h3><p>Conventional landing components keep familiar props and children syntax.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep composing ordinary components.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.10</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.10 - Component composition</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.10">GitHub release</a>
    </footer>
  </>
}
