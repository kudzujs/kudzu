export const metadata = {
  title: "Kudzu 0.9.2 - Legacy CSS safety",
  description: "Kudzu 0.9.2 preserves legacy global CSS when explicit route ownership is absent and reports an actionable migration warning.",
  url: "https://kudzujs.cloud/releases/0.9.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.9.2 legacy CSS safety",
  themeColor: "#ff8a3d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.9.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PRESERVE · WARN · MIGRATE</p>
        <h1>Keep the styles.<br /><em>Make ownership explicit.</em></h1>
        <p className="release-lead">Legacy applications no longer upgrade to a successful but unstyled deploy. Kudzu preserves their global CSS while pointing to route-aware ownership.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the fallback</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Added browser JavaScript</span></div>
        <div><strong>2</strong><span>Legacy routes proven</span></div>
        <div><strong>1</strong><span>Actionable warning</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.9.2</span><div><p>CSS MIGRATION SAFETY</p><h2>Preserve behavior.<br />Retain route precision.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FALLBACK</span><h3>Keep legacy CSS</h3><p>Projects with no explicit ownership retain path-ordered global source styles.</p></article>
          <article><span>WARNING</span><h3>Expose migration work</h3><p>The build identifies the fallback and names both supported ownership paths.</p></article>
          <article><span>ROUTES</span><h3>Protect explicit apps</h3><p>Any imported or configured style keeps the route-aware path unchanged.</p></article>
          <article><span>BENCHMARKS</span><h3>Measure styled output</h3><p>Legacy comparisons no longer pass through a silently unstyled artifact.</p></article>
          <article><span>STATIC</span><h3>Add no JavaScript</h3><p>CSS compatibility changes links and emitted styles, never browser runtime.</p></article>
          <article><span>ORDER</span><h3>Stay deterministic</h3><p>Fallback styles use stable source-relative path ordering.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Upgrade safely, then declare route ownership.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.9.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.9.2 - Legacy CSS safety</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.2">GitHub release</a></footer>
  </>
}
