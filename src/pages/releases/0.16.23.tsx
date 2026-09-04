export const metadata = {
  title: "Kudzu 0.16.23 - Reactive conditional branch text",
  description: "Kudzu 0.16.23 keeps scalar text reactive inside selected conditional branches.",
  url: "https://kudzujs.cloud/releases/0.16.23",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.23 reactive conditional branch text",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.23">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.23</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">ORDINARY TSX · REACTIVE TEXT · EXISTING OWNERSHIP</p>
        <h1>Keep the branch.<br /><em>Update the words.</em></h1>
        <p className="release-lead">Scalar text inside a selected conditional branch now follows state changes without replacing the branch, adding a runtime concept, or restructuring familiar TSX.</p>
        <div className="release-links"><a className="primary-action" href="/docs#state">Read the state model</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.23">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>302</strong><span>tests passed</span></div>
        <div><strong>5/5</strong><span>commerce sources pass</span></div>
        <div><strong>0</strong><span>new runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.23</span><div><p>REACTIVE CONDITIONAL BRANCH TEXT</p><h2>Selected branch.<br />Live value.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>COMPILER</span><h3>Scalar branches</h3><p>Reactive scalar branch payloads now reuse the same text-binding compilation path as ordinary JSX text.</p></article>
          <article><span>OWNERSHIP</span><h3>Stable branch</h3><p>Text updates while the condition remains selected, then existing conditional ownership replaces the branch when needed.</p></article>
          <article><span>EVIDENCE</span><h3>Commerce 5/5</h3><p>All retained commerce sources pass build, behavior, accessibility, browser, and output acceptance.</p></article>
          <article><span>SCOPE</span><h3>Compiler only</h3><p>No semantic primitive, compiler pass, runtime concept, API, dependency, or shared-runtime source byte was added.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep conditional text reactive.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.23</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.23 - Reactive conditional branch text</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.23">GitHub release</a></footer>
  </>
}
