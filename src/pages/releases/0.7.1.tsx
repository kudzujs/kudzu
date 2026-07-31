export const metadata = {
  title: "Kudzu 0.7.1 - Vite-style landing assets",
  description: "Kudzu 0.7.1 compiles common CSS, CSS Module, image, SVG, font, and asset URL imports without adding a client runtime.",
  url: "https://kudzujs.cloud/releases/0.7.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.1 Vite-style landing assets",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#build">Build guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.1">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.1</span><span>JULY 2026</span></div>
        <p className="eyebrow">VITE-STYLE LANDING ASSETS</p>
        <h1>Keep the imports.<br /><em>Ship static assets.</em></h1>
        <p className="release-lead">Common React/Vite landing-page CSS, modules, images, SVGs, fonts, and asset URLs now compile to deterministic static output without adding hydration or a browser component runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.1">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>1 pass</strong><span>CSS and asset lowering</span></div>
        <div><strong>82/82</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Vite-shaped input.<br />Kudzu output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CSS</span><h3>Side-effect imports</h3><p>Relative stylesheet imports are validated, ordered through the source graph, and emitted in the document head.</p></article>
          <article><span>MODULES</span><h3>Scoped class maps</h3><p>Default CSS Module imports become deterministic build-time objects with locally scoped class names.</p></article>
          <article><span>ASSETS</span><h3>Static URL imports</h3><p>Images, SVGs, and fonts become base-aware URL strings, including the common <code>?url</code> form.</p></article>
          <article><span>CSS URL</span><h3>Referenced files</h3><p>Relative <code>url(...)</code> values are rewritten safely while query and hash suffixes are preserved.</p></article>
          <article><span>COMPONENTS</span><h3>Specialized rows</h3><p>Asset values remain available when imported keyed-row components and their effects are specialized.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Class maps and asset URLs are build-time literals, so static routes still ship no JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Move the page, not the runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.1</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.1 - Vite-style landing assets</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.1">GitHub release</a>
    </footer>
  </>
}
