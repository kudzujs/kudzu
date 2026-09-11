export const metadata = {
  title: "Kudzu 0.16.30 - Binding target specialization",
  description: "Kudzu 0.16.30 emits only the property and attribute binding paths used by each runtime family.",
  url: "https://kudzujs.cloud/releases/0.16.30",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.30 binding target specialization",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.30">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.30</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">PRECISE TARGETS / EXISTING OWNERSHIP</p>
        <h1>Patch the target.<br /><em>Skip the rest.</em></h1>
        <p className="release-lead">Property and attribute handlers now follow the targets used by each runtime family. Ordinary state updates keep their behavior while unused patching and element scans disappear.</p>
        <div className="release-links"><a className="primary-action" href="/docs#build">Read the build reference</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.30">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Measured fixture savings">
        <div><strong>605 B</strong><span>raw JavaScript removed from search</span></div>
        <div><strong>239 B</strong><span>aggregate gzip removed from search</span></div>
        <div><strong>0</strong><span>new runtime concepts or dependencies</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.30</span><div><p>BINDING TARGET SPECIALIZATION</p><h2>Read existing facts.<br />Emit less work.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROPERTIES</span><h3>Only used property handlers</h3><p>Class, disabled, checked and value handling is retained only when used. General attributes keep their own path, preserving ARIA and data attribute semantics.</p></article>
          <article><span>SCANS</span><h3>Bounded element discovery</h3><p>Generated selectors cover actual targets. Text-only families skip element scans; families using every property retain their smaller generic selector.</p></article>
          <article><span>OWNERSHIP</span><h3>Shared owners retain capabilities</h3><p>Any target required by a shared or navigable owner remains available. Source helper calls retain generic behavior without explicit codegen exclusions.</p></article>
          <article><span>EVIDENCE</span><h3>Measured output, unchanged goals</h3><p>Search and Project fixtures emit fewer bytes while the every-property control stays the same size. No AI-cost or latency superiority is claimed; 1.0.0 remains blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Use ordinary bindings.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.30</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.30 - Binding target specialization</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.30">GitHub release</a></footer>
  </>
}
