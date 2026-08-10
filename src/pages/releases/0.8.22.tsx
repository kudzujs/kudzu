export const metadata = {
  title: "Kudzu 0.8.22 - Versioned compiler foundation",
  description: "Kudzu 0.8.22 versions RouteIR and CapabilityIR, adds deterministic route-local state slots, and extracts focused artifact generators.",
  url: "https://kudzujs.cloud/releases/0.8.22",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.22 versioned compiler foundation",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.22">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.22</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">VERSION · SLOT · GENERATE</p>
        <h1>Version the plans.<br /><em>Keep the output.</em></h1>
        <p className="release-lead">The rendered route plan and pure capability projection now have explicit v1 contracts, while focused generators preserve complete HTML and existing browser ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.22">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>170/170</strong><span>Tests passing</span></div>
        <div><strong>250.1 ms</strong><span>Both build medians</span></div>
        <div><strong>7</strong><span>Parity builds</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Make contracts explicit.<br />Preserve every byte.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ROUTE IR</span><h3>Versioned rendered plans</h3><p>The existing renderPage plan is RouteIR v1, with deterministic route-local state slots beside unchanged browser IDs.</p></article>
          <article><span>CAPABILITY IR</span><h3>Pure projection</h3><p>The existing capability manifest is CapabilityIR v1, and consumers reject unsupported versions.</p></article>
          <article><span>GENERATORS</span><h3>Focused ownership</h3><p>List, parameter, core, effect, binding, native, and navigation generation moved behind narrow inputs.</p></article>
          <article><span>SAFETY</span><h3>Fail closed</h3><p>Required authored-runtime anchors fail instead of silently retaining stale branches.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>The complete site and six representative deploy trees remain byte-identical to 0.8.21.</p></article>
          <article><span>STATIC</span><h3>Zero JavaScript stays zero</h3><p>CapabilityIR selects runtime families while static pages remain complete documents with no browser JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Version the boundary. Preserve the behavior.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.22</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.22 - Versioned compiler foundation</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.22">GitHub release</a>
    </footer>
  </>
}
