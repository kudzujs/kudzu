export const metadata = {
  title: "Kudzu 0.8.13 - Browser capability migration",
  description: "Kudzu 0.8.13 specializes Memos scroll spies, Excalidraw progressive sharing, and Cal.com responsive media queries into owned browser effects.",
  url: "https://kudzujs.cloud/releases/0.8.13",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.13 browser capability migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.13">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.13</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">BROWSER CAPABILITY MIGRATION</p>
        <h1>Keep browser logic familiar.<br /><em>Ship only its capability.</em></h1>
        <p className="release-lead">Real React-shaped scroll, sharing, and responsive source becomes static fallback plus only the owned effects and handlers each route uses.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.13">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Production migrations</span></div>
        <div><strong>0</strong><span>General runtimes added</span></div>
        <div><strong>149/149</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Browser ownership explicit.<br />Static fallback intact.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>MEMOS</span><h3>Frame-owned scroll spy</h3><p>Scroll bursts coalesce through one effect-owned animation frame with exact cancellation.</p></article>
          <article><span>EXCALIDRAW</span><h3>Progressive Web Share</h3><p>Capability-gated DOM and handlers mount only when navigator.share exists.</p></article>
          <article><span>CAL.COM</span><h3>Responsive Booker</h3><p>Static media-query stores become desktop-first HTML plus owned change listeners.</p></article>
          <article><span>A11Y</span><h3>Native semantics</h3><p>Active headings, absent unsupported controls, and status feedback remain explicit.</p></article>
          <article><span>CLEANUP</span><h3>Document ownership</h3><p>Frames and listeners stop on disposal; late browser events cannot update removed UI.</p></article>
          <article><span>STATIC</span><h3>Zero-cost siblings</h3><p>Routes without browser capabilities continue shipping zero JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the source. Own the browser lifetime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.13</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.13 - Browser capability migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.13">GitHub release</a>
    </footer>
  </>
}
