export const metadata = {
  title: "Kudzu 0.7.20 - Computed child collections",
  description: "Kudzu 0.7.20 compiles one direct child collection const inside a block-bodied keyed map callback into existing nested-list ownership.",
  url: "https://kudzujs.cloud/releases/0.7.20",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.20 computed child collections",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">List guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.20">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.20</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPUTED CHILD COLLECTIONS</p>
        <h1>Compute the children.<br /><em>Keep the keys.</em></h1>
        <p className="release-lead">Block-bodied keyed maps can now name one direct child selector before returning JSX, while nested ownership remains fully compiler generated.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.20">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Computed child const</span></div>
        <div><strong>0</strong><span>New runtime paths</span></div>
        <div><strong>107/107</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Name the selector.<br />Reuse nested ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Block-bodied maps</h3><p>Declare one collection const, then return ordinary keyed JSX.</p></article>
          <article><span>SOURCE</span><h3>Direct child property</h3><p>The calculation starts from the current parent item's child array.</p></article>
          <article><span>SELECTORS</span><h3>Existing pure pipeline</h3><p>Filter, direct-property flatMap, and Array.from reuse current encoding.</p></article>
          <article><span>IDENTITY</span><h3>Nested keys preserved</h3><p>Insertion, reorder, and removal retain existing child DOM ownership.</p></article>
          <article><span>DIAGNOSTICS</span><h3>One proven use</h3><p>Multiple or mixed alias reads fail before build-time evaluation.</p></article>
          <article><span>OUTPUT</span><h3>No new runtime</h3><p>The compiler substitutes the const into the existing nested list path.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Compute child lists naturally.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.20</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.20 - Computed child collections</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.20">GitHub release</a>
    </footer>
  </>
}
