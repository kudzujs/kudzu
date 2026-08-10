export const metadata = {
  title: "Kudzu 0.8.28 - Source-local binding index",
  description: "Kudzu 0.8.28 resolves lexical source bindings before reactive capture, import, and lowering decisions without adding browser runtime bytes.",
  url: "https://kudzujs.cloud/releases/0.8.28",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.28 source-local binding index",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.28">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.28</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">RESOLVE · CLASSIFY · LOWER</p>
        <h1>Resolve the source.<br /><em>Lower the right value.</em></h1>
        <p className="release-lead">Kudzu's first large-application compiler foundation assigns lexical identity before reactive bindings decide what is local, imported, captured, global, or unresolved.</p>
        <div className="release-links">
          <a className="primary-action" href="#foundation">See the foundation</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.28/docs/next-architecture/large-application-ai-native-roadmap.md">Execution plan</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>6</strong><span>Reference classes</span></div>
        <div><strong>1,000</strong><span>Indexed-reference guard</span></div>
        <div><strong>185/185</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="foundation">
        <div className="release-section-heading"><span>01</span><div><p>COMPILER FOUNDATION</p><h2>Identity before names.<br />Semantics before shapes.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>LOCALS</span><h3>Lexical slots</h3><p>Declarations, parameters, imports, captures, globals, and unresolved references receive deterministic source-local identities and ranges.</p></article>
          <article><span>GLOBALS</span><h3>Shadowing stays local</h3><p>Application values named document, location, history, navigator, or console no longer become browser globals.</p></article>
          <article><span>IMPORTS</span><h3>Parameters stay parameters</h3><p>A callback parameter shadowing an import no longer creates a client-module edge or package reachability.</p></article>
          <article><span>LOWERING</span><h3>Rewrite exact occurrences</h3><p>Only references resolved as state or captures lower to runtime reads; same-named nested bindings remain untouched.</p></article>
          <article><span>FALLBACK</span><h3>Synthesized source stays safe</h3><p>Generated keyed expressions keep the established lowering path unless their complete source identity is available.</p></article>
          <article><span>NEXT</span><h3>Descriptors follow</h3><p>P0.2 moves native handlers, effects, and remaining descriptor discovery onto the same identity model.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Understand more source. Ship no extra runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.28</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.28 - Source-local binding index</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.28">GitHub release</a>
    </footer>
  </>
}
