export const metadata = {
  title: "Kudzu 0.16.7 - Lazy retained editor lifecycle",
  description: "Kudzu 0.16.7 loads a real retained CodeMirror editor on activation while preserving updates, recovery, identity, and exact cleanup.",
  url: "https://kudzujs.cloud/releases/0.16.7",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.7 lazy retained editor lifecycle",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.7">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.7</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LAZY PACKAGE · RETAINED IDENTITY · EXACT CLEANUP</p>
        <h1>Open the editor.<br /><em>Only load it once.</em></h1>
        <p className="release-lead">The real CodeMirror journey now starts without its package graph, then preserves every update and ownership guarantee after activation.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the journey</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.7">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>89.9%</strong><span>Less initial editor gzip</span></div>
        <div><strong>1</strong><span>Package request per document</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.7</span><div><p>REAL EDITOR JOURNEY</p><h2>Defer the graph.<br />Keep the behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ACTIVATE</span><h3>Load on demand</h3><p>The CodeMirror graph stays absent until the editor owner opens.</p></article>
          <article><span>STATE</span><h3>Retain updates</h3><p>Application and editor changes share the existing owner-scoped handle.</p></article>
          <article><span>ERROR</span><h3>Recover accessibly</h3><p>Authored update failures preserve editor DOM and clear after recovery.</p></article>
          <article><span>IDENTITY</span><h3>Keep the node</h3><p>Value commits update the retained editor without replacing its DOM.</p></article>
          <article><span>REVISIT</span><h3>Reset on revisit</h3><p>Conditional remount starts fresh state while native ESM stays cached.</p></article>
          <article><span>STATIC</span><h3>Exclude completely</h3><p>The static sibling remains complete HTML with zero JavaScript.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep the editor, lose the eager graph.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.7</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.7 - Lazy retained editor lifecycle</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.7">GitHub release</a></footer>
  </>
}
