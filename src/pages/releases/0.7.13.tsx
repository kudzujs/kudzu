export const metadata = {
  title: "Kudzu 0.7.13 - Deterministic useId",
  description: "Kudzu 0.7.13 compiles ordinary React useId calls into deterministic static HTML IDs without browser JavaScript.",
  url: "https://kudzujs.cloud/releases/0.7.13",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.13 deterministic useId",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.13">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.13</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">DETERMINISTIC USEID</p>
        <h1>Keep the hook.<br /><em>Ship the ID.</em></h1>
        <p className="release-lead">Ordinary React-shaped accessibility components can retain top-level useId calls while Kudzu resolves stable HTML relationships entirely at build time.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.13">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Browser capability</span></div>
        <div><strong>3</strong><span>React import forms</span></div>
        <div><strong>98/98</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Stable references.<br />Static output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Familiar useId</h3><p>Named, aliased, default-member, and namespace-member React calls normalize before evaluation.</p></article>
          <article><span>ACCESSIBILITY</span><h3>Linked controls</h3><p>Labels, descriptions, and controls reuse one deterministic document ID.</p></article>
          <article><span>REPEAT</span><h3>Distinct instances</h3><p>Repeated component calls receive unique IDs in stable render order.</p></article>
          <article><span>SCOPES</span><h3>Layout and route</h3><p>Separate namespaces avoid collisions across shared layout and route content.</p></article>
          <article><span>OUTPUT</span><h3>Zero runtime</h3><p>The final values are ordinary static attributes with no browser hook machinery.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Safe boundary</h3><p>Non-top-level and keyed-row forms fail before duplicate IDs can ship.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep accessible IDs declarative.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.13</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.13 - Deterministic useId</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.13">GitHub release</a>
    </footer>
  </>
}
