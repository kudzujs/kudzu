export const metadata = {
  title: "Kudzu 0.8.34 - Session-local module cache",
  description: "Kudzu 0.8.34 parses and summarizes each unchanged source module once per ProjectSession while keeping transformer ASTs isolated.",
  url: "https://kudzujs.cloud/releases/0.8.34",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.34 session-local module cache",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.34">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.34</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PARSE · SUMMARIZE · CLONE</p>
        <h1>Parse once.<br /><em>Transform in isolation.</em></h1>
        <p className="release-lead">ProjectSession now owns one canonical source tree and export summary per unchanged module. Every importer still receives a fresh mutable AST, keeping compiler work bounded without sharing transformer state.</p>
        <div className="release-links">
          <a className="primary-action" href="#cache">See the cache boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.34/PERFORMANCE.md#p07-parsed-module-and-export-summary-cache">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>103</strong><span>Unique modules parsed once</span></div>
        <div><strong>200</strong><span>Independent transformer clones</span></div>
        <div><strong>193/193</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="cache">
        <div className="release-section-heading"><span>07</span><div><p>MODULE OWNERSHIP</p><h2>Share immutable facts.<br />Never share mutation.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PARSE</span><h3>Unique modules define the work</h3><p>Reachability, styles, static collections, Zustand, client helpers, diagnostics, and Workers reuse one canonical parsed tree.</p></article>
          <article><span>EXPORTS</span><h3>Supported shapes summarize once</h3><p>Direct, default, aliased, and named re-export records retain the existing compiler boundary without widening accepted syntax.</p></article>
          <article><span>CLONES</span><h3>Transformer contexts stay private</h3><p>Normalization receives a deep clone of every node with independent parents, so one importer cannot mutate another's analysis.</p></article>
          <article><span>INVALIDATION</span><h3>Source text owns freshness</h3><p>A changed file replaces its parsed tree and export summary together. A different ProjectSession starts with no shared records.</p></article>
          <article><span>MEASURED</span><h3>Output stays identical</h3><p>The 100-importer A/B emits the same 382,603-byte source-result graph. No material timing claim is made from the drifting host run.</p></article>
          <article><span>NEXT</span><h3>Stable semantic identity</h3><p>P0.8 moves declarations, aliases, re-exports, ownership sites, and call sites onto ModuleSymbol and SiteId records.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the output. Bound repeated compiler work.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.34</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.34 - Session-local module cache</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.34">GitHub release</a>
    </footer>
  </>
}
