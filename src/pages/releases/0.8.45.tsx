export const metadata = {
  title: "Kudzu 0.8.45 - Plain TypeScript fast path",
  description: "Kudzu 0.8.45 skips TSX semantic transformation for proven plain TypeScript modules, reducing source-scale compile and clean-build time with identical deploy output.",
  url: "https://kudzujs.cloud/releases/0.8.45",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.45 plain TypeScript fast path",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#benchmarks">Benchmarks</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.45">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.45</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CLASSIFY · TRANSPILE · SHIP</p>
        <h1>Skip work that plain TypeScript<br /><em>does not need.</em></h1>
        <p className="release-lead">Kudzu now keeps proven relative-only TypeScript modules on a narrow transpilation path while TSX and uncertain modules retain the full semantic compiler.</p>
        <div className="release-links">
          <a className="primary-action" href="#source-scale">Inspect the result</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.45/PERFORMANCE.md#current-0845-optimization-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>39.2%</strong><span>Compile median reduction</span></div>
        <div><strong>28.4%</strong><span>Clean-build median reduction</span></div>
        <div><strong>0 B</strong><span>Deploy output change</span></div>
      </section>

      <section className="release-section" id="source-scale">
        <div className="release-section-heading"><span>P1</span><div><p>SOURCE SCALE</p><h2>Classify narrowly.<br />Keep fallback safely.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PLAIN TS</span><h3>Use the short path</h3><p>Relative-only .ts modules receive TypeScript transpilation and ESM path rewriting without Kudzu TSX analysis.</p></article>
          <article><span>FALLBACK</span><h3>Keep full semantics</h3><p>TSX, packages, assets, unresolved edges, and uncertain forms retain the existing compiler transformer.</p></article>
          <article><span>FIXTURE</span><h3>Generate real scale</h3><p>The maintained runner creates 500 reachable modules, 50,550 lines, and 50 routes outside the repository.</p></article>
          <article><span>PAIRED</span><h3>Alternate targets</h3><p>Baseline and candidate order alternates across fresh processes to reduce host-order bias.</p></article>
          <article><span>OUTPUT</span><h3>Require equivalence</h3><p>The comparison fails when deploy files, pages, bytes, or SHA-256 digest differ.</p></article>
          <article><span>RUNTIME</span><h3>Ship nothing new</h3><p>The optimization changes compiler scratch only and adds no browser runtime or public API.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Build large TypeScript graphs with less compiler work.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.45</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.45 - Plain TypeScript fast path</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.45">GitHub release</a>
    </footer>
  </>
}
