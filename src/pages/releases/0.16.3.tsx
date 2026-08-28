export const metadata = {
  title: "Kudzu 0.16.3 - State-owned drag and drop",
  description: "Kudzu 0.16.3 keeps keyed state in durable control while a real SortableJS effect owns only the bounded drag gesture lifecycle.",
  url: "https://kudzujs.cloud/releases/0.16.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.3 state-owned drag and drop",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ONE DURABLE ORDER · ONE KEYED OWNER · ZERO DRAG RUNTIME</p>
        <h1>Move the row.<br /><em>Keep state in charge.</em></h1>
        <p className="release-lead">A real drag engine may own the gesture, while Kudzu state keeps durable order, identity, keyboard parity, and cleanup exact.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the ownership</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>26,603 B</strong><span>Sortable fixture JS gzip</span></div>
        <div><strong>0 B</strong><span>Static sibling JS</span></div>
        <div><strong>0</strong><span>Drag runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.3</span><div><p>STATE-OWNED ORDER</p><h2>Borrow the gesture.<br />Retain the keys.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>DRAG</span><h3>Move temporarily</h3><p>SortableJS owns only the active pointer gesture.</p></article>
          <article><span>STATE</span><h3>Commit once</h3><p>One immutable reorder remains the durable source of truth.</p></article>
          <article><span>IDENTITY</span><h3>Retain rows</h3><p>Existing keyed reconciliation preserves row and input identity.</p></article>
          <article><span>KEYBOARD</span><h3>Share behavior</h3><p>Buttons use the same state operation as the drag callback.</p></article>
          <article><span>RECOVERY</span><h3>Restore safely</h3><p>Invalid package indexes restore DOM without mutating state.</p></article>
          <article><span>RELEASE</span><h3>Dispose exactly</h3><p>Conditional and document release destroy the package owner.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep durable order declarative.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.3 - State-owned drag and drop</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.3">GitHub release</a></footer>
  </>
}
