export const metadata = {
  title: "Kudzu 0.8.7 - Reactive keyed row selection",
  description: "Kudzu 0.8.7 lets keyed rows combine current item data with direct primitive parent state for reactive classes and ARIA attributes.",
  url: "https://kudzujs.cloud/releases/0.8.7",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.7 reactive keyed row selection",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Keyed lists</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.7">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.7</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACTIVE KEYED ROW SELECTION</p>
        <h1>Select a row.<br /><em>Keep the row.</em></h1>
        <p className="release-lead">Current item data and direct primitive parent state now compose in keyed-row classes, ARIA attributes, and text without remounting DOM.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.7">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Direct state path</span></div>
        <div><strong>0</strong><span>Remounted rows</span></div>
        <div><strong>134/134</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Selection stays declarative.<br />Identity stays native.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STATE</span><h3>Direct parent reads</h3><p>Flat rows combine current item or index data with direct primitive parent state.</p></article>
          <article><span>ARIA</span><h3>Accessible selection</h3><p>ARIA attributes update with selected state using ordinary React-shaped expressions.</p></article>
          <article><span>CLASS</span><h3>Current styling</h3><p>Selected-row classes patch directly without recreating retained keyed nodes.</p></article>
          <article><span>IDENTITY</span><h3>Rows stay mounted</h3><p>State commits reevaluate only affected row expression text and attributes.</p></article>
          <article><span>MIGRATION</span><h3>React Notes proven</h3><p>A real notes app keeps its familiar active-row comparison and local persistence.</p></article>
          <article><span>BOUNDARY</span><h3>Primitive and pure</h3><p>Object state, nested captures, structural conditions, and arbitrary calls remain rejected.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep selected rows declarative.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.7</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.7 - Reactive keyed row selection</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.7">GitHub release</a>
    </footer>
  </>
}
