export const metadata = {
  title: "Kudzu 0.8.35 - Stable module identity",
  description: "Kudzu 0.8.35 resolves declarations through stable ModuleSymbol and source-local SiteId records across aliases, barrels, and transformed AST clones.",
  url: "https://kudzujs.cloud/releases/0.8.35",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.35 stable module identity",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.35">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.35</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SYMBOLS · SITES · RESOLVE</p>
        <h1>Names explain.<br /><em>Identity decides.</em></h1>
        <p className="release-lead">Declarations now keep one stable identity across aliases, barrel exports, source caches, and private transformer clones. Cross-module analysis follows authored sites instead of transient AST objects.</p>
        <div className="release-links">
          <a className="primary-action" href="#identity">See the identity boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.35/PERFORMANCE.md#p08-stable-modulesymbol-and-siteid">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>103</strong><span>Unique module summaries</span></div>
        <div><strong>100</strong><span>Private transformer clones</span></div>
        <div><strong>195/195</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="identity">
        <div className="release-section-heading"><span>08</span><div><p>SEMANTIC IDENTITY</p><h2>Follow authored meaning.<br />Not mutable syntax objects.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SYMBOLS</span><h3>Declarations keep one identity</h3><p>A ModuleSymbol combines project-relative module ownership with a declaration SiteId. Readable names remain useful without deciding semantics.</p></article>
          <article><span>EXPORTS</span><h3>Barrels resolve completely</h3><p>Default and named exports, aliases, barrel chains, <code>export *</code>, cycles, and ambiguity now share one checked graph.</p></article>
          <article><span>SITES</span><h3>Authored locations survive clones</h3><p>Owners, component calls, hooks, keyed lists, and effects carry deterministic source-local SiteIds across repeated compilation.</p></article>
          <article><span>ISOLATION</span><h3>Transformer trees stay private</h3><p>Consumers resolve a symbol first, then locate its authored site in their own normalized clone. Canonical AST mutation remains forbidden.</p></article>
          <article><span>MEASURED</span><h3>Extra meaning, no build loss</h3><p>The 100-importer candidate removes half the clones and records a small directional build improvement with unchanged deployed JavaScript.</p></article>
          <article><span>NEXT</span><h3>Semantic state operations</h3><p>P0.9 will lower equivalent state-update syntax through the existing structured HandlerIR path without adding a JavaScript VM.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep familiar source. Stabilize compiler meaning.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.35</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.35 - Stable module identity</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.35">GitHub release</a>
    </footer>
  </>
}
