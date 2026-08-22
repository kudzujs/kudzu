export const metadata = {
  title: "Kudzu 0.10.1 - Application state scale",
  description: "Kudzu 0.10.1 proves primitive, object, array, derived, conditional, and nested keyed state ownership in one measured project journey.",
  url: "https://kudzujs.cloud/releases/0.10.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.10.1 application state scale",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.10.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATE · OWNERSHIP · SCALE</p>
        <h1>Grow the state graph.<br /><em>Keep the boundary exact.</em></h1>
        <p className="release-lead">One project journey now proves ordinary state composition, nested keyed identity, exact release, and measured commit scaling without normalized state or a rerender runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the evidence</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>5</strong><span>Ordinary route states</span></div>
        <div><strong>0.9 ms</strong><span>32-state commit median</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.10.1</span><div><p>APPLICATION STATE</p><h2>Compose existing semantics.<br />Measure the real journey.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STATE</span><h3>Use ordinary records</h3><p>Primitive, object, and array states drive one project-management surface.</p></article>
          <article><span>DERIVED</span><h3>Update one summary</h3><p>Project labels and issue counts remain deterministic across replacements.</p></article>
          <article><span>KEYS</span><h3>Preserve nested identity</h3><p>Retained projects and issues keep DOM identity while removed rows release state.</p></article>
          <article><span>OWNERS</span><h3>Unmount exactly</h3><p>Conditional summaries and keyed rows receive fresh ownership after removal.</p></article>
          <article><span>SCALE</span><h3>Record commit cost</h3><p>Seven fresh Chrome processes measure 1, 8, and 32-state commits.</p></article>
          <article><span>BOUNDARY</span><h3>Stop before a runtime</h3><p>Unsupported object-field nested replacement remains explicit instead of adding rerender machinery.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Build on measured state ownership.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.10.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.10.1 - Application state scale</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.1">GitHub release</a></footer>
  </>
}
