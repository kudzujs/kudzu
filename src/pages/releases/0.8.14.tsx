export const metadata = {
  title: "Kudzu 0.8.14 - Localized blog migration",
  description: "Kudzu 0.8.14 migrates browser locale entry, prefixed links, interactive static MDX, and a continuous canvas without React or package runtimes.",
  url: "https://kudzujs.cloud/releases/0.8.14",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.14 localized blog migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.14">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.14</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LOCALIZED BLOG MIGRATION</p>
        <h1>Keep the app behavior.<br /><em>Ship static routes.</em></h1>
        <p className="release-lead">Locale entry, native links, interactive static articles, and continuous canvas animation now compose without React or package runtimes.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.14">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Static locales</span></div>
        <div><strong>3</strong><span>Migration blockers removed</span></div>
        <div><strong>151/151</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Static content complete.<br />Imperative lifetime contained.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>MDX</span><h3>Static plus interactive</h3><p>Article HTML avoids eval while copy controls and tabs keep ordinary behavior.</p></article>
          <article><span>LOCALES</span><h3>Automatic native routing</h3><p>Browser detection and build-prefixed links preserve locale navigation.</p></article>
          <article><span>CANVAS</span><h3>Effect-owned drawing</h3><p>Local drawing state persists inside one route-specific effect closure.</p></article>
          <article><span>VISIBILITY</span><h3>Native observation</h3><p>IntersectionObserver and performance remain direct browser capabilities.</p></article>
          <article><span>CLEANUP</span><h3>Exact disposal</h3><p>Frames cancel, observers disconnect, and listeners leave with the document.</p></article>
          <article><span>STATIC</span><h3>Zero-cost siblings</h3><p>Routes without canvas work continue shipping zero JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep imperative work inside one owner.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.14</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.14 - Localized blog migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.14">GitHub release</a>
    </footer>
  </>
}
