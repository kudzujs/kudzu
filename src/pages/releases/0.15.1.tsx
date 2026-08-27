export const metadata = {
  title: "Kudzu 0.15.1 - Key-scoped native popovers",
  description: "Kudzu 0.15.1 scopes keyed row useId values for native Popover triggers and intrinsic ID relationships without an overlay runtime.",
  url: "https://kudzujs.cloud/releases/0.15.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.15.1 key-scoped native popovers",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.15.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.15.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ONE ROW KEY · ONE NATIVE TOP LAYER · ZERO OVERLAY RUNTIME</p>
        <h1>Scope the identity.<br /><em>Let the platform pop.</em></h1>
        <p className="release-lead">Familiar keyed components keep useId and native Popover syntax while Kudzu specializes cloned ID relationships through existing list ownership.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the ownership</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.15.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Duplicate row IDs</span></div>
        <div><strong>0 B</strong><span>Static sibling JS</span></div>
        <div><strong>0</strong><span>Overlay runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.15.1</span><div><p>KEYED ID OWNERSHIP</p><h2>Clone the row.<br />Keep the relationship.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHOR</span><h3>Keep useId</h3><p>One top-level hook feeds intrinsic IDs and native popover targets.</p></article>
          <article><span>SCOPE</span><h3>Follow the key</h3><p>Existing keyed ownership gives every cloned row a deterministic ID path.</p></article>
          <article><span>NATIVE</span><h3>Use Popover</h3><p>Chrome supplies Escape, light dismiss, focus restoration, and the top layer.</p></article>
          <article><span>IDENTITY</span><h3>Retain reorder</h3><p>Rows and IDs survive reorder while removed keys remount fresh and deterministic.</p></article>
          <article><span>RELEASE</span><h3>Clean navigation</h3><p>An open popover leaves the top layer when enhanced navigation releases its row.</p></article>
          <article><span>BOUNDARY</span><h3>Add no overlay tree</h3><p>No Portal, Slot, focus manager, positioning engine, or retained component runtime ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Ship native keyed overlays.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.15.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.15.1 - Key-scoped native popovers</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.15.1">GitHub release</a></footer>
  </>
}
