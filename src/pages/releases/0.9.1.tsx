export const metadata = {
  title: "Kudzu 0.9.1 - Positional primitive lists",
  description: "Kudzu 0.9.1 renders JSON-safe primitive positional collections while preserving strict property-keyed row validation.",
  url: "https://kudzujs.cloud/releases/0.9.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.9.1 positional primitive lists",
  themeColor: "#ff8a3d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs">Documentation</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.1">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.9.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">POSITION · VALIDATE · SHIP</p>
        <h1>Render primitive rows.<br /><em>Keep keyed data strict.</em></h1>
        <p className="release-lead">Position-keyed collections now accept JSON-safe primitive values without weakening property-keyed identity or adding browser runtime concepts.</p>
        <div className="release-links">
          <a className="primary-action" href="#proof">Inspect the boundary</a>
          <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.1">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>21</strong><span>Lupin game shapes audited</span></div>
        <div><strong>0 B</strong><span>Static sibling JavaScript</span></div>
      </section>

      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.9.1</span><div><p>POSITIONAL COLLECTIONS</p><h2>Broader values.<br />Same identity rules.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PRIMITIVES</span><h3>Render direct values</h3><p>Strings, numbers, booleans, and null values can occupy authored positional rows.</p></article>
          <article><span>IDENTITY</span><h3>Own by position</h3><p>Index-keyed rows retain positional semantics while explicit keys remain entity-owned.</p></article>
          <article><span>VALIDATION</span><h3>Keep object keys strict</h3><p>Property-keyed collections still require ordinary plain-object rows and valid keys.</p></article>
          <article><span>SERIALIZATION</span><h3>Avoid false compaction</h3><p>Primitive arrays bypass the compact object-record encoding path.</p></article>
          <article><span>REALTIME</span><h3>Compose game capabilities</h3><p>Lupin-derived fixtures cover room, socket, Canvas, input, and cleanup behavior.</p></article>
          <article><span>STATIC</span><h3>Pay only when used</h3><p>Static sibling routes remain complete HTML with zero browser JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Use primitive positional rows without weakening keyed collections.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.9.1</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.9.1 - Positional primitive lists</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.1">GitHub release</a>
    </footer>
  </>
}
