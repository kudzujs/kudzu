export const metadata = {
  title: "Kudzu 0.8.20 - Explicit keyed ownership",
  description: "Kudzu 0.8.20 gives keyed collections deterministic JSON-safe parent, child, specialization, state, ref, handler, and binding ownership.",
  url: "https://kudzujs.cloud/releases/0.8.20",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.20 explicit keyed ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.20">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.20</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">KEY · OWNER · LIFETIME</p>
        <h1>Own every row.<br /><em>Keep every node.</em></h1>
        <p className="release-lead">Keyed collections now cross one explicit source boundary with deterministic parent, child, component, state, ref, handler, and binding ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.20">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>168/168</strong><span>Tests passing</span></div>
        <div><strong>0 B</strong><span>Runtime graph delta</span></div>
        <div><strong>7</strong><span>Parity fixtures</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Make ownership explicit.<br />Leave the DOM alone.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>BLOCKS</span><h3>Deterministic structure</h3><p>Every keyed site records its slot, parent, children, key policy, collection source, selector, and source range.</p></article>
          <article><span>COMPONENTS</span><h3>Complete membership</h3><p>Recursive local and imported rows retain every specialization, including stateless intermediate components.</p></article>
          <article><span>HOOKS</span><h3>State and ref provenance</h3><p>Row states and refs retain their declaration source and exact component-specialization owner.</p></article>
          <article><span>LINKS</span><h3>Owned generated code</h3><p>Keyed commands, handlers, effects, expressions, conditions, and calculated bindings point back to their block.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>Complete site output and seven representative keyed fixture trees match 0.8.19.</p></article>
          <article><span>RUNTIME</span><h3>Same identity</h3><p>Build-time rendering still owns final IDs, while retained keys preserve DOM, state, refs, and effects exactly as before.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the keys. Make ownership visible.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.20</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.20 - Explicit keyed ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.20">GitHub release</a>
    </footer>
  </>
}
