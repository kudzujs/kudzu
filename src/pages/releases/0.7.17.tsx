export const metadata = {
  title: "Kudzu 0.7.17 - Lazy reducer initialization",
  description: "Kudzu 0.7.17 lowers statically analyzable third-argument useReducer initializers into existing compiler-owned state and fixes keyed-list specialization fallbacks.",
  url: "https://kudzujs.cloud/releases/0.7.17",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.17 lazy reducer initialization",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#reducers">Reducer guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.17">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.17</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LAZY REDUCER INITIALIZATION</p>
        <h1>Pass the argument.<br /><em>Keep the reducer pure.</em></h1>
        <p className="release-lead">The familiar third-argument reducer initializer now becomes serialized compiler-owned state, while keyed-list fallback paths retain their authored DOM behavior.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.17">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Initializer execution</span></div>
        <div><strong>3</strong><span>Initializer locations</span></div>
        <div><strong>105/105</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Static input.<br />Existing reducer path.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SYNTAX</span><h3>Three-argument reducer</h3><p>Keep conventional useReducer reducer, initial argument, and initializer authoring.</p></article>
          <article><span>SCOPE</span><h3>Inline or imported</h3><p>One-parameter initializers may be inline, same-file, or relative-imported functions.</p></article>
          <article><span>LOWERING</span><h3>Literal substitution</h3><p>The compiler substitutes serializable input and emits fresh primitive, object, or array literals.</p></article>
          <article><span>OWNERSHIP</span><h3>Existing state semantics</h3><p>The lowered value reuses synchronous reducer state, dispatch, and DOM ownership.</p></article>
          <article><span>LISTS</span><h3>Fallbacks restored</h3><p>Capability-specialized keyed lists preserve template cloning and zero-index filling.</p></article>
          <article><span>OUTPUT</span><h3>No reducer runtime</h3><p>Initializer functions and React remain absent from browser deploy assets.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Initialize once at build time.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.17</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.17 - Lazy reducer initialization</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.17">GitHub release</a>
    </footer>
  </>
}
