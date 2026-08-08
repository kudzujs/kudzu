export const metadata = {
  title: "Kudzu 0.8.18 - Explicit component ownership",
  description: "Kudzu 0.8.18 records JSON-safe state, setter, prop, ref, ID, and specialization ownership without changing final route allocation or deploy output.",
  url: "https://kudzujs.cloud/releases/0.8.18",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.18 explicit component ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.18">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.18</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMPONENT OWNERSHIP</p>
        <h1>Own state explicitly.<br /><em>Allocate it exactly as before.</em></h1>
        <p className="release-lead">State, setters, props, refs, IDs, and specialized component calls now form one JSON-safe source result while build-time rendering keeps final route ownership unchanged.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.18">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>6</strong><span>Explicit ownership kinds</span></div>
        <div><strong>0 B</strong><span>Runtime graph delta</span></div>
        <div><strong>167/167</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Trace lexical ownership.<br />Preserve runtime allocation.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>RESULT</span><h3>JSON-safe analysis</h3><p>Every compiled non-Worker source retains ordered owners and specializations without AST nodes, maps, sets, closures, or symbols.</p></article>
          <article><span>STATE</span><h3>Per-signal owners</h3><p>Commands resolve each state independently, including mixed parent, specialized child, keyed row, and Context Provider ownership.</p></article>
          <article><span>PROPS</span><h3>Explicit links</h3><p>Specialized props record defaults and the parent, reducer, or Context signals they carry across the supported boundary.</p></article>
          <article><span>HOOKS</span><h3>Refs and IDs</h3><p>Ordinary and specialized refs, deterministic IDs, state, and setters retain ordered slots and honest source ranges.</p></article>
          <article><span>BOUNDARY</span><h3>No component runtime</h3><p>The result describes compile-time ownership only. It does not serialize JSX or retain a browser component tree.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>Before release content, the complete build modules, plans, HTML, and browser assets matched 0.8.17 byte for byte.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Make ownership explicit.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.18</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.18 - Explicit component ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.18">GitHub release</a>
    </footer>
  </>
}
