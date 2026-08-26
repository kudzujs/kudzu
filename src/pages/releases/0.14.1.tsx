export const metadata = {
  title: "Kudzu 0.14.1 - Nested and object-state collections",
  description: "Kudzu 0.14.1 composes root and nested keyed collections from direct immutable array fields of ordinary object state.",
  url: "https://kudzujs.cloud/releases/0.14.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.14.1 nested and object-state collections",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.14.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">OBJECT STATE · NESTED LISTS · KEYED IDENTITY</p>
        <h1>Replace the object.<br /><em>Retain the rows.</em></h1>
        <p className="release-lead">Direct immutable array fields of ordinary object state now compose root and nested keyed ownership without authored field state or a browser component tree.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the ownership</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0.8 ms</strong><span>Table update median</span></div>
        <div><strong>17</strong><span>Session JS files</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.14.1</span><div><p>NESTED KEYED OWNERSHIP</p><h2>Change the root.<br />Preserve the path.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STATE</span><h3>Own one object</h3><p>A direct static array field feeds the existing binding-backed keyed collection.</p></article>
          <article><span>NEST</span><h3>Reuse child ownership</h3><p>Direct child arrays retain the existing parent key path and shared row prototype.</p></article>
          <article><span>IDENTITY</span><h3>Retain keyed rows</h3><p>Immutable whole-object replacement preserves project and issue DOM identity.</p></article>
          <article><span>HANDLERS</span><h3>Read latest items</h3><p>Retained nested handlers receive current issue values after replacement and reorder.</p></article>
          <article><span>RELEASE</span><h3>Drop descendant state</h3><p>Removed rows release local state; re-added keys mount with fresh ownership.</p></article>
          <article><span>BOUNDARY</span><h3>Fail closed</h3><p>Dynamic paths, mutation, and non-array fields remain unsupported.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Compose nested collections from ordinary state.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.14.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.14.1 - Nested and object-state collections</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.1">GitHub release</a></footer>
  </>
}
