export const metadata = {
  title: "Kudzu 0.10.2 - Shared-layout navigation",
  description: "Kudzu 0.10.2 preserves workspace state across explicit list/detail navigation while route drafts reset and static routes remain outside the group.",
  url: "https://kudzujs.cloud/releases/0.10.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.10.2 shared-layout navigation",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.10.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LAYOUT · ROUTE · RELEASE</p>
        <h1>Keep the workspace.<br /><em>Release the route.</em></h1>
        <p className="release-lead">Explicit list/detail navigation now preserves layout-owned workspace state while every route draft receives exact, fresh ownership.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the journey</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2.3 ms</strong><span>Navigation median</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.10.2</span><div><p>SHARED LAYOUT</p><h2>Persist one owner.<br />Reset everything else.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>LAYOUT</span><h3>Keep workspace state</h3><p>One explicit group retains the application header and selected workspace.</p></article>
          <article><span>ROUTE</span><h3>Own drafts locally</h3><p>The detail draft releases on exit and initializes fresh when the route returns.</p></article>
          <article><span>CONTEXT</span><h3>Erase the authoring layer</h3><p>A familiar relative Context hook lowers to existing package-neutral shared state.</p></article>
          <article><span>NATIVE</span><h3>Keep document fallback</h3><p>Help remains an ordinary anchor target with complete static HTML.</p></article>
          <article><span>SCALE</span><h3>Measure the transition</h3><p>Seven fresh Chrome profiles verify behavior before recording navigation time.</p></article>
          <article><span>BOUNDARY</span><h3>Skip the SPA router</h3><p>Navigation stays explicit, route-group scoped, and recoverable through documents.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Build with exact route lifetimes.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.10.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.10.2 - Shared-layout navigation</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.2">GitHub release</a></footer>
  </>
}
