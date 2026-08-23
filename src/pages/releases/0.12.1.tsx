export const metadata = {
  title: "Kudzu 0.12.1 - Shared layout, history, focus, and scroll",
  description: "Kudzu 0.12.1 completes shared-layout navigation with retained state, route cleanup, history, announcements, focus, scroll policy, and native recovery.",
  url: "https://kudzujs.cloud/releases/0.12.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.12.1 shared layout history focus and scroll",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.12.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">HISTORY · FOCUS · RELEASE</p>
        <h1>Keep the shell.<br /><em>Move the route.</em></h1>
        <p className="release-lead">Shared layouts now retain application state while history, cleanup, titles, announcements, focus, and scroll follow each destination.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect navigation</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1.3 ms</strong><span>Navigation median</span></div>
        <div><strong>+5 B</strong><span>Session gzip</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.12.1</span><div><p>NAVIGATION LIFETIME</p><h2>Retain the owner.<br />Restore the destination.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>LAYOUT</span><h3>Retain layout state</h3><p>The shared shell and workspace state survive push, back, and forward.</p></article>
          <article><span>ROUTE</span><h3>Release route state</h3><p>Departed route effects and draft state are removed before fresh remount.</p></article>
          <article><span>HEAD</span><h3>Update title and status</h3><p>Each destination updates document metadata and a polite live announcement.</p></article>
          <article><span>FOCUS</span><h3>Focus the destination</h3><p>Hash targets win; otherwise the route heading or main landmark receives focus.</p></article>
          <article><span>SCROLL</span><h3>Apply an explicit policy</h3><p>Hash targets scroll into view while ordinary destinations return to the top.</p></article>
          <article><span>NATIVE</span><h3>Leave native routes native</h3><p>Links outside the configured group remain browser document navigation.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep navigation owned.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.12.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.12.1 - Shared layout, history, focus, and scroll</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.1">GitHub release</a></footer>
  </>
}
