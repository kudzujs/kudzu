export const metadata = {
  title: "Kudzu 0.16.22 - Reactive collection count reuse",
  description: "Kudzu 0.16.22 lets filtered collection aliases drive keyed lists, counts, and conditional branches.",
  url: "https://kudzujs.cloud/releases/0.16.22",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.22 reactive collection count reuse",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.22">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.22</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">ORDINARY TSX · SHARED COLLECTION · ZERO RUNTIME DELTA</p>
        <h1>Filter once.<br /><em>Reuse the result.</em></h1>
        <p className="release-lead">A filtered collection alias can now drive a keyed list, a top-level count, reactive text, and an empty-state branch without duplicated state or imperative DOM code.</p>
        <div className="release-links"><a className="primary-action" href="/docs#lists">Read the list model</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.22">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>302</strong><span>tests passed</span></div>
        <div><strong>0</strong><span>new runtime concepts</span></div>
        <div><strong>0 B</strong><span>shared runtime delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.22</span><div><p>REACTIVE COLLECTION COUNT REUSE</p><h2>One source.<br />Every consumer.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>NORMALIZATION</span><h3>Count aliases</h3><p>Supported collection pipelines now retain their meaning through direct length reads and top-level count locals.</p></article>
          <article><span>OWNERSHIP</span><h3>Stable keyed rows</h3><p>Count-selected branches reuse existing conditional and keyed ownership, including exact unmount and fresh remount behavior.</p></article>
          <article><span>EVIDENCE</span><h3>Chrome required</h3><p>The maintained browser journey verifies count updates, empty-state entry, keyed removal, and remount.</p></article>
          <article><span>SCOPE</span><h3>Compiler only</h3><p>No semantic primitive, compiler pass, runtime concept, API, dependency, or shared-runtime byte was added.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Use ordinary collection reuse.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.22</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.22 - Reactive collection count reuse</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.22">GitHub release</a></footer>
  </>
}
