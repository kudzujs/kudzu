export const metadata = {
  title: "Kudzu 0.8.49 - Setter callback fan-out",
  description: "Kudzu 0.8.49 specializes one setter callback through multiple direct child controls to the same parent signal without a callback runtime.",
  url: "https://kudzujs.cloud/releases/0.8.49",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.49 setter callback fan-out",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.49">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.49</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">BRANCH · SPECIALIZE · OWN</p>
        <h1>Forward one callback.<br /><em>Connect every control.</em></h1>
        <p className="release-lead">A component can forward one setter callback directly to multiple child controls. Kudzu specializes every branch to the original parent signal while preserving the existing depth and escape boundaries.</p>
        <div className="release-links">
          <a className="primary-action" href="#callback-fanout">Inspect the branches</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.49/PERFORMANCE.md#current-0849-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>N</strong><span>Direct child controls</span></div>
        <div><strong>1</strong><span>Original parent signal</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
      </section>

      <section className="release-section" id="callback-fanout">
        <div className="release-section-heading"><span>P1</span><div><p>CALLBACK FAN-OUT</p><h2>Branch component props.<br />Keep concrete operations.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Forward directly</h3><p>Pass one destructured setter callback through multiple child component on* props.</p></article>
          <article><span>SPECIALIZATION</span><h3>Expand every branch</h3><p>Each child component specializes independently before handler analysis.</p></article>
          <article><span>OWNERSHIP</span><h3>Target one signal</h3><p>Every resulting leaf operation retains the original parent state owner.</p></article>
          <article><span>COMPOSITION</span><h3>Use multiple handlers</h3><p>Fan-out composes with the multi-handler leaf support released in 0.8.48.</p></article>
          <article><span>BOUNDARY</span><h3>Stay direct</h3><p>Aliases, ordinary prop names, spreads, adapters, and a fourth boundary remain diagnosed.</p></article>
          <article><span>RUNTIME</span><h3>Ship no callbacks</h3><p>No callback registry, component tree, hydration layer, or browser runtime module is added.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Let one state adapter serve a control group.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.49</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.49 - Setter callback fan-out</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.49">GitHub release</a>
    </footer>
  </>
}
