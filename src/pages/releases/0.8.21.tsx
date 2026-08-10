export const metadata = {
  title: "Kudzu 0.8.21 - Explicit effect ownership",
  description: "Kudzu 0.8.21 records deterministic JSON-safe effect setup, cleanup, dependencies, ownership, source provenance, and Worker edges.",
  url: "https://kudzujs.cloud/releases/0.8.21",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.21 explicit effect ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.21">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.21</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SETUP · CLEANUP · OWNER</p>
        <h1>Record every effect.<br /><em>Preserve every lifetime.</em></h1>
        <p className="release-lead">Effects now cross a deterministic JSON-safe source boundary with explicit setup, cleanup, dependencies, component and keyed ownership, provenance, and Worker edges.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.21">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>170/170</strong><span>Tests passing</span></div>
        <div><strong>0 B</strong><span>Runtime graph delta</span></div>
        <div><strong>4</strong><span>Parity builds</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Make effects explicit.<br />Keep lifecycle behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>EFFECT IR</span><h3>Complete records</h3><p>Setup handlers retain cleanup, ordered direct and derived dependencies, subscriptions, snapshots, and keyed-item fields.</p></article>
          <article><span>OWNERSHIP</span><h3>Lexical provenance</h3><p>Components and keyed blocks retain effect ownership through local and imported row specialization.</p></article>
          <article><span>WORKERS</span><h3>Explicit graph edges</h3><p>Relative Worker rewriting returns callback and edge results, and rendered emission derives only from EffectIR.</p></article>
          <article><span>ANALYSIS</span><h3>Focused validation</h3><p>Dependency classification and cleanup-owned browser resource validation live in the effect analyzer.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>The complete site and effect, keyed-effect, and Worker-effect builds match 0.8.20 before release content.</p></article>
          <article><span>RUNTIME</span><h3>Same lifetimes</h3><p>Build-time rendering still owns concrete IDs, mounting, stale-write invalidation, and cleanup order.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Make ownership explicit. Keep effects exact.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.21</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.21 - Explicit effect ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.21">GitHub release</a>
    </footer>
  </>
}
