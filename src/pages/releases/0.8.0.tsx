export const metadata = {
  title: "Kudzu 0.8.0 - URL-backed custom hooks",
  description: "Kudzu 0.8.0 migrates stateful relative React custom hooks with writable search parameters and guarded browser storage.",
  url: "https://kudzujs.cloud/releases/0.8.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.0 URL-backed custom hooks",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.0">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">URL-BACKED CUSTOM HOOKS</p>
        <h1>Keep the React shape.<br /><em>Own the browser capability.</em></h1>
        <p className="release-lead">Stateful relative hooks can restore browser values, update native URLs, and persist inputs without shipping React, hydration, or a hook runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.0">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>React runtime bytes</span></div>
        <div><strong>2</strong><span>Native URL modes</span></div>
        <div><strong>132/132</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>State, URL, storage.<br />One static route.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>HOOKS</span><h3>Relative ownership</h3><p>Direct state, setters, actions, and effects retain familiar custom-hook source structure.</p></article>
          <article><span>QUERY</span><h3>Writable parameters</h3><p>Inline URLSearchParams updaters lower to native push or replace history writes.</p></article>
          <article><span>STORAGE</span><h3>Guarded restoration</h3><p>Mount effects restore validated browser values over deterministic static fallbacks.</p></article>
          <article><span>SYNC</span><h3>Direct recommits</h3><p>URL changes reuse existing signal, DOM binding, and dependency-effect commits.</p></article>
          <article><span>BOUNDARY</span><h3>Static shapes only</h3><p>Aliases, dynamic returns, direct-value query setters, and private callback captures stop at build time.</p></article>
          <article><span>MIGRATION</span><h3>Fourteen FIRE routes</h3><p>Production CSS, presets, native SVG, Quiz, Debt, persistence, and Excel export compose without React.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Migrate browser-backed state without a client framework.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.0</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.0 - URL-backed custom hooks</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.0">GitHub release</a>
    </footer>
  </>
}
