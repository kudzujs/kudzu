export const metadata = {
  title: "Kudzu 0.16.15 - Production evidence gates",
  description: "Kudzu 0.16.15 adds maintained compiler scale, large-list parity, and complete AI attribution evidence gates.",
  url: "https://kudzujs.cloud/releases/0.16.15",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.15 production evidence gates",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.15">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.15</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">COMPILER SCALE · BROWSER PARITY · COMPLETE ATTRIBUTION</p>
        <h1>Measure the real path.<br /><em>Reject incomplete proof.</em></h1>
        <p className="release-lead">Kudzu now keeps compiler phase, incremental equivalence, failure recovery, large-list browser behavior, and AI attribution inside maintained executable gates.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the evidence</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.15">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1,000</strong><span>Measured routes</span></div>
        <div><strong>10</strong><span>Incremental modules</span></div>
        <div><strong>300</strong><span>Browser acceptance tests</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.15</span><div><p>PRODUCTION EVIDENCE</p><h2>Measure each boundary.<br />Preserve every failure.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PHASES</span><h3>Time compiler boundaries</h3><p>Source reads, graph discovery, TypeScript parse, normalization, compile/transform, render, and write remain separately visible.</p></article>
          <article><span>INCREMENTAL</span><h3>Compare clean output</h3><p>Every changed-source incremental deploy must match a clean build byte-for-byte while touching only its affected route.</p></article>
          <article><span>RECOVERY</span><h3>Keep the last good deploy</h3><p>Invalid clean and retained-session builds preserve output and recover to the expected digest after source restoration.</p></article>
          <article><span>LISTS</span><h3>Run browser parity</h3><p>The 10,000-item pagination route proves keyboard navigation, focus, bounded DOM, released state, and static exclusion.</p></article>
          <article><span>ATTRIBUTION</span><h3>Reject missing traces</h3><p>Missing AI usage records mark the run incomplete and withhold cost-per-success claims instead of manufacturing zero cost.</p></article>
          <article><span>LIMIT</span><h3>Name the remaining scale</h3><p>The full 10,000-route compiler run remains pending separately provisioned hardware; projections do not count as acceptance.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Run production evidence as code.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.15</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.15 - Production evidence gates</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.15">GitHub release</a></footer>
  </>
}
