export const metadata = {
  title: "Kudzu 0.16.25 - Static content and acceptance alignment",
  description: "Kudzu 0.16.25 removes static topic JavaScript and aligns future acceptance without rescoring historical evidence.",
  url: "https://kudzujs.cloud/releases/0.16.25",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.25 static content",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.25">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.25</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">STATIC CONTENT / EXISTING SEMANTICS / HONEST EVIDENCE</p>
        <h1>Keep static content.<br /><em>Drop its JavaScript.</em></h1>
        <p className="release-lead">Direct imported static selectors stay at build time. Original normalized query aliases support direct JSX counts, and future acceptance checks the communicated semantic requirements.</p>
        <div className="release-links"><a className="primary-action" href="/docs#state">Read the state model</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.25">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>10</strong><span>zero-JavaScript content siblings</span></div>
        <div><strong>4</strong><span>JavaScript files removed in replay</span></div>
        <div><strong>0</strong><span>new runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.25</span><div><p>STATIC CONTENT</p><h2>Original source.<br />Less JavaScript.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>COMPILER</span><h3>Static selectors</h3><p>Existing build-time map execution removes topic list ownership. Direct collection counts register normalized query build values. Seven compiler lines add no pass, IR kind, or runtime concept.</p></article>
          <article><span>REPLAY</span><h3>Smaller output</h3><p>Content builds drop from 13 to 9 JavaScript files, saving 20,539 raw and 7,299 aggregate gzip bytes. Retained JavaScript is byte-identical; all ten static siblings pass.</p></article>
          <article><span>ACCEPTANCE</span><h3>Semantic requirements</h3><p>Future-only r6 accepts named CRUD groups and combined polite count/empty regions, and enforces all static siblings. Its published 0.16.24 starter pins remain frozen.</p></article>
          <article><span>LIMITS</span><h3>No replacement score</h3><p>Historical r5 remains 18/25 versus 23/25 with two partial traces; r2 remains 11/25 versus 24/25. No fresh model rerun is claimed. Persistent version refs remain unsupported, unsafe render writes are diagnosed, and 1.0.0 stays blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep static routes static.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.25</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.25 - Static content and acceptance alignment</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.25">GitHub release</a></footer>
  </>
}
