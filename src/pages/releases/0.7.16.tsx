export const metadata = {
  title: "Kudzu 0.7.16 - Build-time lazy state",
  description: "Kudzu 0.7.16 lowers directly serializable lazy useState initializers into existing compiler-owned state without a browser component runtime.",
  url: "https://kudzujs.cloud/releases/0.7.16",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.16 build-time lazy state",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#state">State guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.16">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.16</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">BUILD-TIME LAZY STATE</p>
        <h1>Write the initializer.<br /><em>Ship only the value.</em></h1>
        <p className="release-lead">React-shaped lazy state now lowers to serialized compiler ownership across ordinary children, conditional remounts, and keyed rows.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.16">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Browser components</span></div>
        <div><strong>3</strong><span>Literal families</span></div>
        <div><strong>2</strong><span>Import sources</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar syntax.<br />Existing ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SYNTAX</span><h3>Lazy initializer form</h3><p>Use an anonymous synchronous zero-argument function just as in ordinary React source.</p></article>
          <article><span>DATA</span><h3>Serializable literals</h3><p>Primitive, plain-object, and array returns lower directly into build-time state.</p></article>
          <article><span>CHILDREN</span><h3>Independent calls</h3><p>Repeated same-file and imported children retain distinct concrete state IDs.</p></article>
          <article><span>REMOUNT</span><h3>Fresh object state</h3><p>Conditional re-entry clones the serialized initializer instead of restoring stale data.</p></article>
          <article><span>ROWS</span><h3>Key-scoped ownership</h3><p>Keyed rows reuse their existing structural state path across updates and reorder.</p></article>
          <article><span>OUTPUT</span><h3>Initializer erased</h3><p>No lazy function, React runtime, or browser component tree enters deploy assets.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the React-shaped initializer.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.16</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.16 - Build-time lazy state</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.16">GitHub release</a>
    </footer>
  </>
}
