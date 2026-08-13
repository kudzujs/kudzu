export const metadata = {
  title: "Kudzu 0.8.48 - Multi-handler setter callbacks",
  description: "Kudzu 0.8.48 lowers one specialized setter callback from multiple direct intrinsic handlers to the same parent signal without a callback runtime.",
  url: "https://kudzujs.cloud/releases/0.8.48",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.48 multi-handler setter callbacks",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.48">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.48</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SHARE · LOWER · OWN</p>
        <h1>Use one callback.<br /><em>Handle multiple events.</em></h1>
        <p className="release-lead">A specialized leaf can call one setter callback from multiple direct intrinsic handlers. Kudzu lowers each call to the same parent signal while preserving the existing fail-closed callback boundary.</p>
        <div className="release-links">
          <a className="primary-action" href="#multiple-handlers">Inspect the lowering</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.48/PERFORMANCE.md#current-0848-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>N</strong><span>Direct event handlers</span></div>
        <div><strong>1</strong><span>Shared parent signal</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
      </section>

      <section className="release-section" id="multiple-handlers">
        <div className="release-section-heading"><span>P1</span><div><p>CALLBACK DATAFLOW</p><h2>Author ordinary handlers.<br />Emit concrete operations.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Reuse one callback</h3><p>A leaf may call the same setter callback once in each of multiple direct intrinsic on* handlers.</p></article>
          <article><span>LOWERING</span><h3>Target one signal</h3><p>Every handler lowers independently to a concrete operation over the same parent state signal.</p></article>
          <article><span>FORWARDING</span><h3>Keep existing depth</h3><p>The proven three-boundary direct component forwarding path remains available.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Reject ambiguous use</h3><p>Repeated same-handler calls, aliases, non-handler references, and forwarding fan-out fail at authored source.</p></article>
          <article><span>OUTPUT</span><h3>Ship plain commands</h3><p>Command-only interactions retain compact data descriptors instead of serialized callback functions.</p></article>
          <article><span>RUNTIME</span><h3>Add nothing global</h3><p>No callback registry, component tree, hydration layer, or browser runtime module is added.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Let one state adapter serve every direct control.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.48</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.48 - Multi-handler setter callbacks</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.48">GitHub release</a>
    </footer>
  </>
}
