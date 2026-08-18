export const metadata = {
  title: "Kudzu 0.8.56 - Incremental affected-route development builds",
  description: "Kudzu 0.8.56 recompiles and rerenders only source-affected routes during development while preserving full-build output.",
  url: "https://kudzujs.cloud/releases/0.8.56",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.56 incremental affected-route development builds",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.56">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.56</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">TRACE · INVALIDATE · REUSE</p>
        <h1>Change one graph.<br /><em>Leave the rest alone.</em></h1>
        <p className="release-lead">Development rebuilds now follow each changed source through the page graph, recompiling and rerendering only affected routes while retaining complete rollback-safe output.</p>
        <div className="release-links">
          <a className="primary-action" href="#incremental-builds">Follow the graph</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.56/PERFORMANCE.md#current-0856-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2 / 4</strong><span>Modules recompiled</span></div>
        <div><strong>1 / 2</strong><span>Pages rerendered</span></div>
        <div><strong>0 B</strong><span>Static route runtime</span></div>
      </section>

      <section className="release-section" id="incremental-builds">
        <div className="release-section-heading"><span>P1</span><div><p>INCREMENTAL AFFECTED-ROUTE BUILDS</p><h2>Reuse proven work.<br />Keep full-build correctness.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>GRAPH</span><h3>Trace page graphs</h3><p>Changed paths intersect current and prior per-page runtime dependencies.</p></article>
          <article><span>COMPILE</span><h3>Compile affected closure</h3><p>Each affected route recompiles its complete reachable source graph.</p></article>
          <article><span>RENDER</span><h3>Reuse route renders</h3><p>Unchanged pages retain validated pre-family render records.</p></article>
          <article><span>NAVIGATION</span><h3>Invalidate groups</h3><p>Shared layouts rebuild together to preserve one ESM ownership identity.</p></article>
          <article><span>RECOVERY</span><h3>Carry failed changes</h3><p>Pending invalidations survive errors while prior output stays available.</p></article>
          <article><span>OUTPUT</span><h3>Match clean builds</h3><p>Focused incremental output is byte-identical to a fresh full build.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Spend development work only where source changes reach.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.56</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.56 - Incremental affected-route development builds</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.56">GitHub release</a>
    </footer>
  </>
}
