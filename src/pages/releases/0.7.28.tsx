export const metadata = {
  title: "Kudzu 0.7.28 - Nested component specialization",
  description: "Kudzu 0.7.28 recursively specializes nested same-file and imported components inside setter-adapter children without a browser component runtime.",
  url: "https://kudzujs.cloud/releases/0.7.28",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.28 nested component specialization",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.28">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.28</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">NESTED COMPONENT SPECIALIZATION</p>
        <h1>Nest the component.<br /><em>Erase the boundary.</em></h1>
        <p className="release-lead">Optional imported UI can keep its own hooks and declarative composition while Kudzu folds static paths and emits intrinsic HTML plus only the capabilities that remain.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.28">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>recursive</strong><span>Component specialization</span></div>
        <div><strong>0</strong><span>Component runtime</span></div>
        <div><strong>122/122</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Compose normally.<br />Compile completely.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>NESTING</span><h3>Recursive components</h3><p>Same-file and relative-imported children specialize through to intrinsic JSX.</p></article>
          <article><span>HOOKS</span><h3>One generated owner</h3><p>Static-path nested state, IDs, refs, and effects join outer ownership.</p></article>
          <article><span>OPTIONALS</span><h3>Dead paths fold away</h3><p>Omitted and false optional UI allocates no hooks or browser capability.</p></article>
          <article><span>IMPORTS</span><h3>Assets and handlers follow</h3><p>Nested relative imports merge through existing specialized handler graphs.</p></article>
          <article><span>SAFETY</span><h3>Dynamic hooks stop early</h3><p>Unknown conditional ownership and second-boundary setters receive diagnostics.</p></article>
          <article><span>MIGRATION</span><h3>Tooltip restored</h3><p>FIRE AgeInput keeps imported hover state and generated ARIA identity.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep composition. Ship the result.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.28</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.28 - Nested component specialization</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.28">GitHub release</a>
    </footer>
  </>
}
