export const metadata = {
  title: "Kudzu 0.8.40 - Property-level effect dependencies",
  description: "Kudzu 0.8.40 lets effects select primitive property paths from ordinary object state through existing DerivedIR.",
  url: "https://kudzujs.cloud/releases/0.8.40",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.40 property-level effect dependencies",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#effects">Effects</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.40">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.40</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SELECT · COMPARE · REACT</p>
        <h1>Subscribe to the object.<br /><em>React to the property.</em></h1>
        <p className="release-lead">Effects can now follow primitive property paths over ordinary object state without splitting application data into artificial signals or adding a browser component runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#dependencies">Inspect dependency selection</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.40/PERFORMANCE.md#p1-property-level-object-state-effect-dependencies">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Runtime JavaScript added</span></div>
        <div><strong>21</strong><span>Alternating build pairs</span></div>
        <div><strong>205/205</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="dependencies">
        <div className="release-section-heading"><span>P1</span><div><p>PROPERTY DEPENDENCIES</p><h2>Keep object-shaped state.<br />Rerun only for selected values.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Keep ordinary object state</h3><p>Direct property paths and top-level immutable primitive locals remain familiar React-shaped effect dependencies.</p></article>
          <article><span>DERIVED IR</span><h3>Reuse one expression language</h3><p>Property reads lower to the existing tagged DerivedIR instead of introducing field signals, proxies, or another evaluator.</p></article>
          <article><span>COMPARE</span><h3>Skip unchanged selections</h3><p>Object commits schedule comparison, then Object.is prevents cleanup and rerun when the selected primitive stays equal.</p></article>
          <article><span>FAIL CLOSED</span><h3>Reject ambiguous identity</h3><p>Whole objects, dynamic properties, object-valued results, and mixed whole-object/property dependencies remain unsupported.</p></article>
          <article><span>OUTPUT</span><h3>Ship no new runtime</h3><p>Route JavaScript, effect runtime, RouteIR, and capability selection stay unchanged; only the authored route owns its effect.</p></article>
          <article><span>NEXT</span><h3>Cross more component boundaries</h3><p>The next migration-backed investigation follows props, callbacks, refs, and context through deeper ordinary composition.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the object. Select the value.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.40</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.40 - Property-level effect dependencies</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.40">GitHub release</a>
    </footer>
  </>
}
