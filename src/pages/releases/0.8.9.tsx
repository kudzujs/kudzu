export const metadata = {
  title: "Kudzu 0.8.9 - Context-backed CRUD actions",
  description: "Kudzu 0.8.9 specializes state-backed Context actions into existing route handler ESM without a browser Provider tree.",
  url: "https://kudzujs.cloud/releases/0.8.9",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.9 Context-backed CRUD actions",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#context">Context</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.9">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.9</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CONTEXT-BACKED CRUD ACTIONS</p>
        <h1>Keep the Provider.<br /><em>Ship concrete state.</em></h1>
        <p className="release-lead">Conventional Context-backed actions now specialize into Kudzu's existing state and handler capabilities, preserving componentized React-shaped source without shipping a Context runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.9">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Provider specialized</span></div>
        <div><strong>0</strong><span>Context runtime bytes</span></div>
        <div><strong>139/139</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Context source retained.<br />Existing state reused.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>HOOK</span><h3>Relative Context hooks</h3><p>A direct <code>useContext(Context)</code> return resolves one analyzable Provider module.</p></article>
          <article><span>ACTIONS</span><h3>Concrete state updates</h3><p>Selected synchronous actions inline into route-specific handler ESM.</p></article>
          <article><span>CRUD</span><h3>Object-array workflows</h3><p>Create, rename, select, and delete compose with keyed Notes UI.</p></article>
          <article><span>STATIC</span><h3>Zero-cost exclusion</h3><p>Unaffected routes still emit complete HTML without JavaScript.</p></article>
          <article><span>ERASED</span><h3>No Provider tree</h3><p>Context objects, action functions, and component ownership remain build-only.</p></article>
          <article><span>BOUNDARY</span><h3>Source diagnostics</h3><p>Hidden captures, aliases, dynamic values, and multiple Providers stay rejected.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep CRUD state behind Context.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.9</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.9 - Context-backed CRUD actions</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.9">GitHub release</a>
    </footer>
  </>
}
