export const metadata = {
  title: "Kudzu 0.8.29 - Symbol-aware descriptor discovery",
  description: "Kudzu 0.8.29 resolves lexical symbols for native handlers, effects, bindings, list evaluators, commands, and effect resources without adding browser runtime bytes.",
  url: "https://kudzujs.cloud/releases/0.8.29",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.29 symbol-aware descriptor discovery",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.29">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.29</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">DISCOVER · VERIFY · LOWER</p>
        <h1>Resolve the symbol.<br /><em>Lower the descriptor.</em></h1>
        <p className="release-lead">Kudzu now carries source-local lexical identity through native handlers, effects, bindings, keyed evaluators, command specialization, and effect-resource ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#descriptors">See the compiler boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.29/docs/next-architecture/large-application-ai-native-roadmap.md">Execution plan</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>6</strong><span>Descriptor consumers</span></div>
        <div><strong>0 B</strong><span>New browser runtime</span></div>
        <div><strong>187/187</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="descriptors">
        <div className="release-section-heading"><span>02</span><div><p>DESCRIPTOR IDENTITY</p><h2>Discover once.<br />Rewrite the same symbol.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>HANDLERS</span><h3>Captures stay exact</h3><p>Native handlers and effects classify state, setters, reducers, imports, captures, and snapshots by lexical reference identity.</p></article>
          <article><span>LOWERING</span><h3>One semantic decision</h3><p>Code generation rewrites the same indexed occurrences selected during discovery instead of repeating a name-only guess.</p></article>
          <article><span>LISTS</span><h3>Nested names stay local</h3><p>Reactive and keyed evaluators distinguish outer state from callback parameters with the same spelling.</p></article>
          <article><span>COMMANDS</span><h3>Fast paths stay honest</h3><p>Optimized setters require an outer binding, while console logging requires the actual browser global.</p></article>
          <article><span>RESOURCES</span><h3>Cleanup owns a declaration</h3><p>Observers and animation frames match exact declarations, and shadowed Web API names remain application values.</p></article>
          <article><span>FALLBACK</span><h3>Synthesized trees stay safe</h3><p>Imported and compiler-generated AST uses the established conservative path unless the current index owns it completely.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Resolve more source. Ship the same runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.29</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.29 - Symbol-aware descriptor discovery</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.29">GitHub release</a>
    </footer>
  </>
}
