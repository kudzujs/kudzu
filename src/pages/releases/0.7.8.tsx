export const metadata = {
  title: "Kudzu 0.7.8 - Static collection fast paths",
  description: "Kudzu 0.7.8 specializes static collection filtering and restores fresh keyed rows faster than React, Vue, and Svelte in the matched benchmark.",
  url: "https://kudzujs.cloud/releases/0.7.8",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.8 static collection fast paths",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Collections guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.8">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.8</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATIC COLLECTION FAST PATHS</p>
        <h1>Filter static data.<br /><em>Restore fresh DOM.</em></h1>
        <p className="release-lead">Compiler-owned catalogs now validate once, retain removed row prototypes, and restore only fresh keyed runs without moving DOM that stayed visible.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.8">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3.6 ms</strong><span>500-row restoration</span></div>
        <div><strong>72.7%</strong><span>Faster than 0.7.7</span></div>
        <div><strong>31</strong><span>Fresh Chrome profiles</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Validate once.<br />Patch only change.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>INDEX</span><h3>Stable source metadata</h3><p>JSON-safe items, unique keys, source positions, and references validate once at mount.</p></article>
          <article><span>FILTER</span><h3>Focused removal</h3><p>Filter-only selectors remove omitted roots without rebuilding general reconciliation entries.</p></article>
          <article><span>RESTORE</span><h3>Fresh keyed clones</h3><p>Detached row prototypes create new DOM while retained keyed nodes keep exact identity.</p></article>
          <article><span>ORDER</span><h3>New runs only</h3><p>Interleaved restoration inserts new contiguous runs and never detaches retained rows.</p></article>
          <article><span>SCOPE</span><h3>Route-specific output</h3><p>Routes without compiler-owned static collections compile the specialization away.</p></article>
          <article><span>LIMIT</span><h3>Catalog scale</h3><p>Very large datasets still belong behind pagination or windowing, not giant DOM trees.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the rows that stayed. Clone only what returns.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.8</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.8 - Static collection fast paths</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.8">GitHub release</a>
    </footer>
  </>
}
