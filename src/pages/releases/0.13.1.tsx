export const metadata = {
  title: "Kudzu 0.13.1 - Nested form metadata",
  description: "Kudzu 0.13.1 composes conditional fields, dynamic keyed rows, dirty and touched display, reset, and exact DOM identity without a form registry.",
  url: "https://kudzujs.cloud/releases/0.13.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.13.1 nested form metadata",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.13.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATE · KEYS · NATIVE RESET</p>
        <h1>Own the metadata.<br /><em>Keep the field identity.</em></h1>
        <p className="release-lead">Conditional fields, checklist arrays, dirty and touched display, reorder, removal, and reset compose from ordinary state and stable keys.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the composition</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Field registries</span></div>
        <div><strong>17</strong><span>Session JS files</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.13.1</span><div><p>FORM METADATA</p><h2>Compose the graph.<br />Do not invent a runtime.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>NESTED</span><h3>Own one object</h3><p>Conditional assignee values and touched state stay explicit and local to the route.</p></article>
          <article><span>ARRAY</span><h3>Use stable keys</h3><p>Checklist rows add, reorder, and remove through immutable array updates.</p></article>
          <article><span>IDENTITY</span><h3>Retain the row</h3><p>Existing keys preserve exact input DOM identity through reorder and reset.</p></article>
          <article><span>RELEASE</span><h3>Drop removed owners</h3><p>Removed and reset-added rows disconnect instead of lingering in a component tree.</p></article>
          <article><span>RESET</span><h3>Restore the baseline</h3><p>Native reset clears uncontrolled values while ordinary state clears explicit metadata.</p></article>
          <article><span>BOUNDARY</span><h3>Ship no proxy graph</h3><p>No registration function, generic watcher, schema adapter, or form runtime is introduced.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep metadata application-owned.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.13.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.13.1 - Nested form metadata</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.1">GitHub release</a></footer>
  </>
}
