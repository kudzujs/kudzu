export const metadata = {
  title: "Kudzu 0.9.3 - Large-app migration slices",
  description: "Kudzu 0.9.3 adds Apache Answer-derived routing, query, layout, data, authentication build intake, and authoring migration evidence without React or package runtimes.",
  url: "https://kudzujs.cloud/releases/0.9.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.9.3 large-app migration slices",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.9.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REDUCE · OWN · VERIFY</p>
        <h1>Keep familiar source.<br /><em>Ship only the capability.</em></h1>
        <p className="release-lead">Real large-application source now crosses more router, query, layout, data, authentication, and authoring boundaries without adding React, hydration, or package runtimes.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the slices</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>7</strong><span>Answer evidence slices</span></div>
        <div><strong>0 B</strong><span>Static sibling JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.9.3</span><div><p>LARGE-APP MIGRATION</p><h2>Specialize common source.<br />Keep boundaries explicit.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ROUTES</span><h3>Fold exact matches</h3><p>Build-known useMatch and native route shells add no browser router.</p></article>
          <article><span>QUERY</span><h3>Own URL state</h3><p>Numeric and imported-string fallbacks remain reactive through native search signals.</p></article>
          <article><span>LAYOUT</span><h3>Erase grid wrappers</h3><p>React Bootstrap Row and Col become native Bootstrap markup.</p></article>
          <article><span>DATA</span><h3>Replace package queries</h3><p>Owned effects preserve loading, errors, stale isolation, and keyed data.</p></article>
          <article><span>AUTH</span><h3>Intake session ownership</h3><p>Build evidence covers storage, login, restore, protected reads, and 401 clearing through existing state semantics.</p></article>
          <article><span>LIMITS</span><h3>Fail honestly</h3><p>Runtime i18n and unproven package surfaces retain actionable diagnostics.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Expand migration coverage without expanding the runtime.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.9.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.9.3 - Large-app migration slices</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.9.3">GitHub release</a></footer>
  </>
}
