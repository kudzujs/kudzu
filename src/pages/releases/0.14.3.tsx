export const metadata = {
  title: "Kudzu 0.14.3 - 10,000-item browser decision",
  description: "Kudzu 0.14.3 measures direct DOM, pagination, and scroll-window alternatives and selects native pagination for 10,000-item project tables.",
  url: "https://kudzujs.cloud/releases/0.14.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.14.3 10,000-item browser decision",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.14.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">10,000 ROWS · THREE STRATEGIES · ONE DECISION</p>
        <h1>Measure the range.<br /><em>Choose native pagination.</em></h1>
        <p className="release-lead">Direct DOM, pagination, and a scroll-driven window run through the same native edit and identity checks before architecture changes are considered.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the decision</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>90,023</strong><span>Direct DOM nodes</span></div>
        <div><strong>1,470</strong><span>Paginated DOM nodes</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.14.3</span><div><p>BOUNDED DOM</p><h2>Keep one page.<br />Keep platform behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>DIRECT</span><h3>Reject giant DOM</h3><p>Ten thousand rows produce 90,023 DOM nodes and an 806.6 ms load median.</p></article>
          <article><span>PAGE</span><h3>Bound at 100</h3><p>Pagination holds 1,470 nodes and changes range in a 12.1 ms median.</p></article>
          <article><span>WINDOW</span><h3>Measure scrolling</h3><p>The fixed-height window is slower to change range and requires extra policy.</p></article>
          <article><span>EDIT</span><h3>Test identity</h3><p>Off-range native input state releases and returns fresh in both bounded paths.</p></article>
          <article><span>ACCESS</span><h3>Prefer the platform</h3><p>Pages preserve native keyboard, focus, and variable-row-height behavior.</p></article>
          <article><span>STOP</span><h3>Add no runtime</h3><p>One fixture does not authorize virtual range ownership or a scheduler.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Ship measured bounded lists.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.14.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.14.3 - 10,000-item browser decision</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.14.3">GitHub release</a></footer>
  </>
}
