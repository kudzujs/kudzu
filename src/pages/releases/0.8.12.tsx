export const metadata = {
  title: "Kudzu 0.8.12 - Static icon migration",
  description: "Kudzu 0.8.12 moves used Lucide-shaped icons to accessible static SVG and removes build-folded evaluator JavaScript.",
  url: "https://kudzujs.cloud/releases/0.8.12",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.12 static icon migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.12">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.12</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATIC ICON MIGRATION</p>
        <h1>Keep icons familiar.<br /><em>Ship only the SVG.</em></h1>
        <p className="release-lead">Used Lucide-shaped icons become source-owned TSX and compile to accessible static markup with no package factory or browser runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.12">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static icon JavaScript</span></div>
        <div><strong>2</strong><span>Accessible SVG modes</span></div>
        <div><strong>143/143</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Icon source retained.<br />Package runtime removed.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Relative TSX icons</h3><p>Only used icons move into ordinary components with direct intrinsic SVG roots.</p></article>
          <article><span>A11Y</span><h3>Explicit semantics</h3><p>Meaningful icons keep roles and titles; decorative icons keep aria-hidden.</p></article>
          <article><span>PROPS</span><h3>Familiar inputs</h3><p>Dimensions, stroke width, fill, classes, and native attributes remain ordinary props.</p></article>
          <article><span>STATIC</span><h3>Zero JavaScript</h3><p>Complete SVG markup is emitted directly into HTML without a client icon runtime.</p></article>
          <article><span>REACH</span><h3>Unused icons excluded</h3><p>Unreachable icon modules never enter compiler or deploy output.</p></article>
          <article><span>FOLD</span><h3>Dead evaluators removed</h3><p>Final output references now decide which handler modules are emitted.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Own the icon source. Ship the SVG.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.12</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.12 - Static icon migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.12">GitHub release</a>
    </footer>
  </>
}
