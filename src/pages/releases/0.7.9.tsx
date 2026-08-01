export const metadata = {
  title: "Kudzu 0.7.9 - Keyed-row prop defaults",
  description: "Kudzu 0.7.9 compiles primitive literal prop defaults in keyed row components without adding browser runtime code.",
  url: "https://kudzujs.cloud/releases/0.7.9",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.9 keyed-row prop defaults",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.9">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.9</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">KEYED-ROW PROP DEFAULTS</p>
        <h1>Keep the default.<br /><em>Erase the component.</em></h1>
        <p className="release-lead">Ordinary primitive prop defaults now survive keyed-row specialization while the component call and React import still disappear before browser output.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.9">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Added browser runtime</span></div>
        <div><strong>4</strong><span>Primitive default forms</span></div>
        <div><strong>93/93</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar component props.<br />Build-time substitution.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STRING</span><h3>Text defaults</h3><p>Missing string props become their literal values at the specialized call site.</p></article>
          <article><span>NUMBER</span><h3>Finite numbers</h3><p>Positive and signed finite numeric literals compile without a runtime component.</p></article>
          <article><span>BOOLEAN</span><h3>Boolean defaults</h3><p>True and false defaults feed existing attribute, condition, and binding analysis.</p></article>
          <article><span>NULL</span><h3>Explicit absence</h3><p>Null defaults preserve ordinary optional output without serializing a component.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Narrow boundary</h3><p>Rest, nested destructuring, and non-primitive initializers still fail at their source.</p></article>
          <article><span>DIRECTION</span><h3>General migration</h3><p>The roadmap now prioritizes ordinary React composition across every application type.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary defaults in ordinary components.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.9</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.9 - Keyed-row prop defaults</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.9">GitHub release</a>
    </footer>
  </>
}
