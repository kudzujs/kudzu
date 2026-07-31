export const metadata = {
  title: "Kudzu 0.7.2 - React hook normalization",
  description: "Kudzu 0.7.2 compiles aliased React hooks, direct member hook calls, and inline useCallback through existing direct DOM capabilities.",
  url: "https://kudzujs.cloud/releases/0.7.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.2 React hook normalization",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.2">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.2</span><span>JULY 2026</span></div>
        <p className="eyebrow">REACT HOOK NORMALIZATION</p>
        <h1>Keep the hooks.<br /><em>Ship direct DOM.</em></h1>
        <p className="release-lead">Aliased hooks, direct members such as React.useState, and inline useCallback now lower into Kudzu's existing build-time component and capability model.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.2">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Static route JavaScript</span></div>
        <div><strong>0</strong><span>React runtime modules</span></div>
        <div><strong>84/84</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar calls.<br />Canonical compiler input.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ALIASES</span><h3>Named hook aliases</h3><p>Supported state, effect, reducer, ref, and context imports normalize to the compiler's canonical hook names.</p></article>
          <article><span>MEMBERS</span><h3>React.useState</h3><p>Direct supported members on default and namespace React imports compile without loading React.</p></article>
          <article><span>CALLBACKS</span><h3>Inline useCallback</h3><p>Analyzable wrappers disappear before handler specialization, with no browser memoization runtime.</p></article>
          <article><span>SAFETY</span><h3>Dependency checks</h3><p>Captured state and effectful dependency expressions receive source-located diagnostics.</p></article>
          <article><span>TYPES</span><h3>Type-only React</h3><p>React type namespaces erase normally and stay outside runtime migration validation.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Accepted syntax adds no capability to routes that remain static.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Migrate syntax, not React.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.2</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.2 - React hook normalization</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.2">GitHub release</a>
    </footer>
  </>
}
