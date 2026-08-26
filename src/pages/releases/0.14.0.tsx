export const metadata = {
  title: "Kudzu 0.14.0 - Project table CRUD and identity",
  description: "Kudzu 0.14.0 composes native project table CRUD, sorting, filtering, selection, keyboard access, and retained identity without a data-grid runtime.",
  url: "https://kudzujs.cloud/releases/0.14.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.14.0 project table CRUD and identity",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.0">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.14.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">TABLES · CRUD · KEYED IDENTITY</p>
        <h1>Edit the row.<br /><em>Keep its identity.</em></h1>
        <p className="release-lead">Native table structure, ordinary state, collection selectors, and keyed ownership compose complete project CRUD without a data-grid runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the table</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.0">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0.8 ms</strong><span>Table update median</span></div>
        <div><strong>17</strong><span>Session JS files</span></div>
        <div><strong>0</strong><span>Data-grid runtimes</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.14.0</span><div><p>KEYED TABLE OWNERSHIP</p><h2>Change the data.<br />Retain the row.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STRUCTURE</span><h3>Use a native table</h3><p>Valid table markup preserves browser semantics without a grid component runtime.</p></article>
          <article><span>CRUD</span><h3>Own ordinary state</h3><p>Insert, inline update, and delete reuse the existing array-state and handler paths.</p></article>
          <article><span>ORDER</span><h3>Compose selectors</h3><p>Reverse, immutable sorting, and active filtering feed the same keyed collection.</p></article>
          <article><span>IDENTITY</span><h3>Retain edited rows</h3><p>Stable keys preserve row and draft-input identity through reorder and sort.</p></article>
          <article><span>KEYBOARD</span><h3>Keep native controls</h3><p>Buttons and labeled inputs retain browser focus and keyboard behavior.</p></article>
          <article><span>MEASURE</span><h3>Commit in 0.8 ms</h3><p>Seven fresh Chrome profiles measure Save-click to committed table DOM.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Build tables from existing semantics.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.14.0</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.14.0 - Project table CRUD and identity</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.0">GitHub release</a></footer>
  </>
}
