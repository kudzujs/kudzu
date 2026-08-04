export const metadata = {
  title: "Kudzu 0.7.26 - React-shaped migration and faster lists",
  description: "Kudzu 0.7.26 expands ordinary React-shaped migration support and moves the measured 500-card search ahead of React with indexed keyed-row release.",
  url: "https://kudzujs.cloud/releases/0.7.26",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.26 React-shaped migration and faster lists",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.26">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.26</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACT-SHAPED MIGRATION AND FASTER LISTS</p>
        <h1>Bring the app.<br /><em>Beat the baseline.</em></h1>
        <p className="release-lead">More ordinary React-shaped TSX compiles directly, while indexed keyed-row release moves the measured 500-card search ahead of React without a client component tree.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.26">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2.88%</strong><span>Faster filter than React</span></div>
        <div><strong>87.29%</strong><span>Less gzip JavaScript</span></div>
        <div><strong>118/118</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Migrate more.<br />Scan less.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>TYPES</span><h3>ReactNode-shaped JSX</h3><p>React 19 component output and contextual DOM events typecheck as migration input.</p></article>
          <article><span>INPUTS</span><h3>Setter adapters</h3><p>Controlled value adapters cross one supported component boundary without shipping callbacks.</p></article>
          <article><span>COLLECTIONS</span><h3>Type-only wrappers erase</h3><p>Imported static collections remain analyzable through assertions such as as const.</p></article>
          <article><span>SELECTORS</span><h3>Fewer allocations</h3><p>State reads are cached and hot expression evaluation avoids temporary arrays.</p></article>
          <article><span>OWNERSHIP</span><h3>Indexed row release</h3><p>Proven safe rows release bindings and conditions by state ID instead of subtree scans.</p></article>
          <article><span>PERFORMANCE</span><h3>13.5 milliseconds</h3><p>Twenty-one alternating runs put the matched search 2.88 percent ahead of React.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Bring familiar TSX. Ship less work.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.26</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.26 - React-shaped migration and faster lists</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.26">GitHub release</a>
    </footer>
  </>
}
