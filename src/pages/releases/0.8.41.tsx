export const metadata = {
  title: "Kudzu 0.8.41 - Two-boundary callback ownership",
  description: "Kudzu 0.8.41 preserves setter, callback, ref, state, effect, and ID ownership through one additional direct presentation-component boundary.",
  url: "https://kudzujs.cloud/releases/0.8.41",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.41 two-boundary callback ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.41">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.41</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">FORWARD · SPECIALIZE · RELEASE</p>
        <h1>Cross one more boundary.<br /><em>Keep ownership direct.</em></h1>
        <p className="release-lead">Ordinary presentation components can forward setters, simple state callbacks, and object refs through a second component boundary while Kudzu still ships direct DOM capabilities, not component instances.</p>
        <div className="release-links">
          <a className="primary-action" href="#ownership">Inspect ownership</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.41/PERFORMANCE.md#p1-direct-two-boundary-callback-and-ref-dataflow">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Callback component boundaries</span></div>
        <div><strong>0 B</strong><span>Runtime JavaScript added</span></div>
        <div><strong>206/206</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="ownership">
        <div className="release-section-heading"><span>P1</span><div><p>CALLBACK OWNERSHIP</p><h2>Compose familiar components.<br />Erase the forwarding layer.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SIGNALS</span><h3>Preserve parent signals</h3><p>Direct setters and simple state callbacks retain the original parent SignalIR through nested specialization.</p></article>
          <article><span>COMPOSITION</span><h3>Forward one layer deeper</h3><p>One presentation component may destructure and directly forward the callback once to an intrinsic event prop.</p></article>
          <article><span>OWNERSHIP</span><h3>Keep child hooks local</h3><p>Child state, effects, IDs, and object refs retain independent ownership through removal and fresh remount.</p></article>
          <article><span>REFS</span><h3>Resolve the intrinsic root</h3><p>A parent-owned object ref follows the same proven tree and resolves to null when conditional DOM releases it.</p></article>
          <article><span>EXCLUSION</span><h3>Ship no component runtime</h3><p>Static siblings remain zero-JavaScript and emitted routes contain no callback registry or retained component function.</p></article>
          <article><span>FAIL CLOSED</span><h3>Reject a third boundary</h3><p>Aliases, spreads, adapters in the forwarding layer, repeated callback uses, and deeper callback chains stay unsupported.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the components. Erase the indirection.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.41</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.41 - Two-boundary callback ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.41">GitHub release</a>
    </footer>
  </>
}
