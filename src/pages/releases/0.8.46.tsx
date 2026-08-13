export const metadata = {
  title: "Kudzu 0.8.46 - Private Context action setters",
  description: "Kudzu 0.8.46 keeps action-only Provider setters out of authored Context APIs while preserving concrete state operations and zero Context runtime output.",
  url: "https://kudzujs.cloud/releases/0.8.46",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.46 private Context action setters",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#context">Context</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.46">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.46</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">HIDE · PROVE · SPECIALIZE</p>
        <h1>Keep setters private.<br /><em>Ship concrete actions.</em></h1>
        <p className="release-lead">Context actions can keep implementation-only setters out of the public Provider value. Kudzu restores only what compilation needs and still emits direct state operations.</p>
        <div className="release-links">
          <a className="primary-action" href="#private-setters">Inspect the boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.46/PERFORMANCE.md#current-0846-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Public action-only setters</span></div>
        <div><strong>2</strong><span>Retained RouteIR signals</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
      </section>

      <section className="release-section" id="private-setters">
        <div className="release-section-heading"><span>P1</span><div><p>CONTEXT DATAFLOW</p><h2>Remove API leakage.<br />Preserve state identity.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Expose state, not setters</h3><p>Provider values keep readable state and public actions without publishing implementation-only setter fields.</p></article>
          <article><span>SCRATCH</span><h3>Restore proven fields</h3><p>The compiler adds only setters required by selected synchronous actions to build-time Provider data.</p></article>
          <article><span>LOWERING</span><h3>Keep concrete writes</h3><p>Existing handler lowering still emits direct notes and activeId state operations.</p></article>
          <article><span>CONSUMERS</span><h3>Preserve local names</h3><p>Compiler-owned aliases avoid collisions without changing authored hook destructuring.</p></article>
          <article><span>BOUNDARY</span><h3>Fail closed</h3><p>Fully hidden action state, setter-only exposure, private captures, and indirect action references remain rejected.</p></article>
          <article><span>OUTPUT</span><h3>Ship no Context tree</h3><p>No Context object, Provider tree, action function, setter registry, or new runtime survives compilation.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep Context APIs focused on application behavior.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.46</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.46 - Private Context action setters</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.46">GitHub release</a>
    </footer>
  </>
}
