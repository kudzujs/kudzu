export const metadata = {
  title: "Kudzu 0.16.8 - Shared lazy capability graphs",
  description: "Kudzu 0.16.8 shares one deferred package graph across route owners with interaction-only loading and lexical ownership validation.",
  url: "https://kudzujs.cloud/releases/0.16.8",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.8 shared lazy capability graphs",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.8">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.8</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SHARED GRAPH · NATIVE ESM · LEXICAL OWNERSHIP</p>
        <h1>Share the graph.<br /><em>Load on interaction.</em></h1>
        <p className="release-lead">Two route owners now use one deferred CodeMirror graph without eager prefetch, a loader, or an application cache.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the policy</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.8">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Shared deferred graph</span></div>
        <div><strong>0</strong><span>Duplicate package requests</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.8</span><div><p>TWO ROUTE OWNERS</p><h2>One native module.<br />Exact ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>GRAPH</span><h3>Defer once</h3><p>Both route records own the same CodeMirror chunk instead of duplicate package output.</p></article>
          <article><span>POLICY</span><h3>Load on interaction</h3><p>The package stays absent until an editor owner explicitly activates.</p></article>
          <article><span>ROUTE</span><h3>Navigate without prefetch</h3><p>Enhanced navigation can fetch documents without promoting the lazy graph.</p></article>
          <article><span>CACHE</span><h3>Use native ESM</h3><p>The document module map prevents a second request without an authored cache.</p></article>
          <article><span>BOUNDARY</span><h3>Reject false owners</h3><p>Lexical binding proves the effect hook is an actual React or Kudzu import.</p></article>
          <article><span>STATIC</span><h3>Exclude completely</h3><p>The static sibling remains complete HTML with zero JavaScript.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Share large features without loading them early.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.8</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.8 - Shared lazy capability graphs</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.8">GitHub release</a></footer>
  </>
}
