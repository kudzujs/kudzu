export const metadata = {
  title: "Kudzu 0.8.50 - Package-neutral shared state IR",
  description: "Kudzu 0.8.50 isolates reduced Zustand migration behind validated SharedStateIR and SharedActionIR records without adding a public store API or runtime.",
  url: "https://kudzujs.cloud/releases/0.8.50",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.50 package-neutral shared state IR",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#zustand">Shared state</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.50">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.50</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ADAPT · VALIDATE · LOWER</p>
        <h1>Contain package syntax.<br /><em>Share one state model.</em></h1>
        <p className="release-lead">Reduced Zustand source now enters generic compiler paths through validated SharedStateIR and SharedActionIR records. Package diagnostics stay at the adapter boundary while route output and browser behavior remain unchanged.</p>
        <div className="release-links">
          <a className="primary-action" href="#shared-state-ir">Inspect the IR boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.50/PERFORMANCE.md#current-0850-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Package-neutral IR records</span></div>
        <div><strong>1</strong><span>Layout state identity</span></div>
        <div><strong>0 B</strong><span>Store runtime added</span></div>
      </section>

      <section className="release-section" id="shared-state-ir">
        <div className="release-section-heading"><span>P1</span><div><p>SHARED STATE IR</p><h2>Validate semantic links.<br />Preserve deploy behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ADAPTER</span><h3>Contain Zustand</h3><p>The focused migration pass owns package syntax, accepted forms, and source diagnostics.</p></article>
          <article><span>STATE</span><h3>Record stable identity</h3><p>SharedStateIR stores one JSON-safe identity, field, initial value, and deterministic slot.</p></article>
          <article><span>ACTION</span><h3>Link actions structurally</h3><p>SharedActionIR references its owning state slot before handler lowering and code generation.</p></article>
          <article><span>VALIDATION</span><h3>Fail before output</h3><p>Dangling state and action references are rejected at the existing ModuleIR boundary.</p></article>
          <article><span>BEHAVIOR</span><h3>Keep route semantics</h3><p>Layout lifetime, same-turn updates, batched effects, and enhanced navigation stay unchanged.</p></article>
          <article><span>BOUNDARY</span><h3>Publish no store API</h3><p>Redux support, public adapters, subscriptions, and a generic browser store remain unsupported.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep migration syntax. Gain a validated internal model.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.50</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.50 - Package-neutral shared state IR</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.50">GitHub release</a>
    </footer>
  </>
}
