export const metadata = {
  title: "Kudzu 0.8.2 - Calculated keyed collections",
  description: "Kudzu 0.8.2 lets calculated array fields update keyed intrinsic lists while preserving static HTML and DOM identity.",
  url: "https://kudzujs.cloud/releases/0.8.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.2 calculated keyed collections",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Collections guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.2">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CALCULATED KEYED COLLECTIONS</p>
        <h1>Recalculate the data.<br /><em>Retain the DOM.</em></h1>
        <p className="release-lead">A direct array field from a relative calculation can now drive an intrinsic keyed list without a chart or component runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.2">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Calculated array anchor</span></div>
        <div><strong>0</strong><span>New general runtimes</span></div>
        <div><strong>133/133</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Structured calculations.<br />Stable keyed ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CALCULATION</span><h3>Direct array fields</h3><p>One top-level relative calculation result may feed an intrinsic keyed map.</p></article>
          <article><span>IDENTITY</span><h3>Retained keys</h3><p>Existing rows keep their DOM identity through updates and reorder.</p></article>
          <article><span>SVG</span><h3>Correct namespace</h3><p>Calculated SVG rows continue using the existing keyed SVG ownership path.</p></article>
          <article><span>HANDLERS</span><h3>Latest items</h3><p>Retained event handlers read refreshed item values after every commit.</p></article>
          <article><span>OUTPUT</span><h3>Module preloads</h3><p>Required route modules receive preload hints while static output stays complete.</p></article>
          <article><span>STATIC</span><h3>Zero-cost siblings</h3><p>Routes without calculated collections continue shipping zero JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep calculations relative and collection fields direct.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.2</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.2 - Calculated keyed collections</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.2">GitHub release</a>
    </footer>
  </>
}
