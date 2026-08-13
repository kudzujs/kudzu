export const metadata = {
  title: "Kudzu 0.8.44 - Collision-free Context actions",
  description: "Kudzu 0.8.44 assigns collision-free compiler aliases to Context action-private Provider state while preserving consumer local names and zero Context runtime output.",
  url: "https://kudzujs.cloud/releases/0.8.44",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.44 collision-free Context actions",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#context">Context</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.44">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.44</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ALIAS · SPECIALIZE · ERASE</p>
        <h1>Keep your local names.<br /><em>Specialize Context privately.</em></h1>
        <p className="release-lead">Context actions can use their Provider-owned state and setters even when a consumer declares the same names. Kudzu resolves the collision inside the compiler and still ships only concrete state operations.</p>
        <div className="release-links">
          <a className="primary-action" href="#context-aliases">Inspect aliasing</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.44/PERFORMANCE.md#current-0844-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Required application renames</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
        <div><strong>208/208</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="context-aliases">
        <div className="release-section-heading"><span>P1</span><div><p>CONTEXT DATAFLOW</p><h2>Alias private fields.<br />Preserve public source.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CONSUMERS</span><h3>Keep local declarations</h3><p>A consumer-local setCount or setNotes remains valid static or reactive application data.</p></article>
          <article><span>PROVIDERS</span><h3>Retain state identity</h3><p>Action-private Provider state and setters keep their existing structural owner and signal relationship.</p></article>
          <article><span>ALIASES</span><h3>Choose a free local</h3><p>The compiler checks parameters and declarations, then generates a collision-free internal binding.</p></article>
          <article><span>ACTIONS</span><h3>Rewrite before lowering</h3><p>The action AST and state map receive the same alias before existing HandlerIR code generation.</p></article>
          <article><span>OUTPUT</span><h3>Ship concrete operations</h3><p>No Context object, Provider tree, action function, or new runtime module survives compilation.</p></article>
          <article><span>FAIL CLOSED</span><h3>Keep semantic limits</h3><p>Private captures, hidden state pairs, indirect action references, and dynamic Provider values remain rejected.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep Context consumers naturally named.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.44</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.44 - Collision-free Context actions</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.44">GitHub release</a>
    </footer>
  </>
}
