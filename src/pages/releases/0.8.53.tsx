export const metadata = {
  title: "Kudzu 0.8.53 - Route-aware CSS closure",
  description: "Kudzu 0.8.53 links source CSS only from routes that reach it and reconciles managed styles safely during enhanced navigation.",
  url: "https://kudzujs.cloud/releases/0.8.53",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.53 route-aware CSS closure",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#configuration">CSS configuration</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.53">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.53</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACH · LOAD · RETAIN</p>
        <h1>Style the route.<br /><em>Not the whole site.</em></h1>
        <p className="release-lead">Source CSS now follows the same reachable module graph as each page. Enhanced navigation prepares destination styles before replacing route DOM and keeps shared layout links alive.</p>
        <div className="release-links">
          <a className="primary-action" href="#css-closure">Inspect the closure</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.53/PERFORMANCE.md#current-0853-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Reachable style graph</span></div>
        <div><strong>0</strong><span>Unrelated route links</span></div>
        <div><strong>0 B</strong><span>Static navigation JavaScript</span></div>
      </section>

      <section className="release-section" id="css-closure">
        <div className="release-section-heading"><span>P1</span><div><p>ROUTE/LAYOUT CSS CLOSURE</p><h2>Follow module ownership.<br />Swap styles without a flash.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>GRAPH</span><h3>Follow imports</h3><p>Relative CSS follows each page's reachable TypeScript imports and re-exports in deterministic order.</p></article>
          <article><span>ROUTES</span><h3>Exclude unrelated CSS</h3><p>Static and interactive routes omit stylesheets owned by unreachable features.</p></article>
          <article><span>GLOBALS</span><h3>Declare intent</h3><p>Only <code>kudzu.config styles</code> applies CSS globally, with duplicate URLs removed.</p></article>
          <article><span>NAVIGATION</span><h3>Load before commit</h3><p>Destination styles finish loading before route cleanup and DOM replacement.</p></article>
          <article><span>LAYOUTS</span><h3>Retain shared links</h3><p>Matching layout styles preserve their exact link DOM identity across route transitions.</p></article>
          <article><span>CANCELLATION</span><h3>Rollback safely</h3><p>Overlapping navigation removes provisional CSS without disturbing the newer transaction.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Import feature CSS where the feature enters the graph.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.53</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.53 - Route-aware CSS closure</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.53">GitHub release</a>
    </footer>
  </>
}
