export const metadata = {
  title: "Kudzu 0.16.13 - Route artifact explanations",
  description: "Kudzu 0.16.13 traces one emitted route from authored source and semantic ownership to its selected browser artifacts and byte reasons.",
  url: "https://kudzujs.cloud/releases/0.16.13",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.13 route artifact explanations",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.13">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.13</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">AUTHORED SOURCE · SEMANTIC OWNER · EXACT ARTIFACT BYTES</p>
        <h1>Explain one route.<br /><em>Keep the compiler private.</em></h1>
        <p className="release-lead">Kudzu now traces one exact emitted route through its existing semantic and artifact records so tools can see why every browser byte exists.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Trace the route</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.13">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Artifact graph</span></div>
        <div><strong>0 B</strong><span>Browser delta</span></div>
        <div><strong>296</strong><span>Passing tests</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.13</span><div><p>ROUTE EXPLANATION</p><h2>Trace selected output.<br />Exclude raw internals.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Start from authored files</h3><p>The exact emitted route points to its page and reachable source closure, including normalization provenance.</p></article>
          <article><span>OWNERSHIP</span><h3>Name semantic owners</h3><p>Effects link their authored source range, component owner, cleanup, dependencies, and Worker source.</p></article>
          <article><span>CAPABILITY</span><h3>Show compiler selection</h3><p>The report names the route capability signature, runtime family, and enabled facts.</p></article>
          <article><span>BYTES</span><h3>Account for artifacts</h3><p>Runtime, handler, chunk, style, and Worker edges include byte reasons, raw and gzip sizes, and hashes.</p></article>
          <article><span>STATIC</span><h3>Explain zero JavaScript</h3><p>An absent behavior family and empty compiler-selected JavaScript closure prove the static route exclusion.</p></article>
          <article><span>BOUNDS</span><h3>Keep context compact</h3><p>Sorted fixed limits expose totals and omissions without HTML, generated code, raw IR, captures, or state values.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Ask why each route owns its bytes.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.13</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.13 - Route artifact explanations</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.13">GitHub release</a></footer>
  </>
}
