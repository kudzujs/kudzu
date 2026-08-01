export const metadata = {
  title: "Kudzu 0.7.11 - Serializable defaults and rest props",
  description: "Kudzu 0.7.11 preserves serializable object and array defaults plus direct intrinsic rest forwarding across specialized components.",
  url: "https://kudzujs.cloud/releases/0.7.11",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.11 serializable defaults and rest props",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.11">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.11</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SERIALIZABLE DEFAULTS</p>
        <h1>Keep the defaults.<br /><em>Forward the rest.</em></h1>
        <p className="release-lead">Ordinary object and array defaults plus direct intrinsic rest props now survive specialization while the component still disappears before browser output.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.11">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Added component runtime</span></div>
        <div><strong>1x</strong><span>Direct rest forwarding</span></div>
        <div><strong>95/95</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar destructuring.<br />Build-time attributes.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>OBJECTS</span><h3>Plain defaults</h3><p>Nested directly serializable object literals substitute at the specialized call site.</p></article>
          <article><span>ARRAYS</span><h3>List defaults</h3><p>Directly serializable array literals remain ordinary component defaults.</p></article>
          <article><span>REST</span><h3>Intrinsic forwarding</h3><p>One final rest binding expands exactly once on the direct intrinsic root.</p></article>
          <article><span>EVENTS</span><h3>Existing analysis</h3><p>Forwarded handlers, ARIA, styles, and attributes reuse current compiler capabilities.</p></article>
          <article><span>SCOPES</span><h3>Nested call sites</h3><p>Calling-component const spreads resolve outside direct map callbacks.</p></article>
          <article><span>README</span><h3>Shorter entry point</h3><p>Detailed APIs and benchmarks now live in the maintained documentation.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary component destructuring.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.11</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.11 - Serializable defaults and rest props</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.11">GitHub release</a>
    </footer>
  </>
}
