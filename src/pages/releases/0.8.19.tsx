export const metadata = {
  title: "Kudzu 0.8.19 - Handler, binding, and derived IR",
  description: "Kudzu 0.8.19 promotes native handlers, reactive bindings, list evaluators, imports, and pure derived expressions into JSON-safe ModuleIR.",
  url: "https://kudzujs.cloud/releases/0.8.19",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.19 handler binding and derived IR",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.19">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.19</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">HANDLER · BINDING · DERIVED</p>
        <h1>Analyze once.<br /><em>Generate from data.</em></h1>
        <p className="release-lead">Native callbacks, reactive evaluators, ordered imports, and pure derived expressions now cross the same JSON-safe source boundary as command and component ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.19">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Promoted IR families</span></div>
        <div><strong>0 B</strong><span>Runtime graph delta</span></div>
        <div><strong>167/167</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Finish source analysis.<br />Keep codegen mechanical.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>HANDLERS</span><h3>Stable exports</h3><p>Native and effect callbacks retain explicit signals, captures, snapshots, imports, roles, source ranges, and generated export source.</p></article>
          <article><span>BINDINGS</span><h3>Explicit evaluators</h3><p>Reactive bindings and list evaluators retain ordered states, captures, parameters, imports, and module-export slots.</p></article>
          <article><span>DERIVED</span><h3>Canonical tuples</h3><p>List selectors and derived effect dependencies emit from their registered JSON-safe expression records.</p></article>
          <article><span>CODEGEN</span><h3>No semantic traversal</h3><p>Handler codegen imports no TypeScript API. It renders ordered imports and concatenates finalized export source.</p></article>
          <article><span>EXCLUSION</span><h3>Commands stay inline</h3><p>Command-only and static routes still create no external handler ESM or unused browser capability.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>Before release content, representative HTML, plans, handlers, bindings, lists, effects, and runtime assets matched 0.8.18.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Generate from explicit results.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.19</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.19 - Handler, binding, and derived IR</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.19">GitHub release</a>
    </footer>
  </>
}
