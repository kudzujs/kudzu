export const metadata = {
  title: "Kudzu 0.8.57 - Plain-object prop draft state",
  description: "Kudzu 0.8.57 initializes specialized child draft state from one direct parent plain-object state prop without a component runtime.",
  url: "https://kudzujs.cloud/releases/0.8.57",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.57 plain-object prop draft state",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.57">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.57</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SNAPSHOT · EDIT · COMMIT</p>
        <h1>Start with the object.<br /><em>Keep the draft separate.</em></h1>
        <p className="release-lead">A specialized child can now initialize local draft state directly from one parent plain-object state prop, preserving familiar editor composition without shipping a component runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#object-drafts">Inspect the ownership</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.57/PERFORMANCE.md#current-0857-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Independent state slots</span></div>
        <div><strong>1</strong><span>Existing compiler path</span></div>
        <div><strong>0 B</strong><span>New runtime code</span></div>
      </section>

      <section className="release-section" id="object-drafts">
        <div className="release-section-heading"><span>P1</span><div><p>PLAIN-OBJECT PROP DRAFT STATE</p><h2>Preserve composition.<br />Separate ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROOF</span><h3>Prove the parent</h3><p>The parent state must start from one direct JSON-safe plain-object literal.</p></article>
          <article><span>OWNERSHIP</span><h3>Own the draft</h3><p>The child receives an independent state slot and setter.</p></article>
          <article><span>CALLBACK</span><h3>Commit explicitly</h3><p>The authored callback moves the latest draft back to parent state.</p></article>
          <article><span>STRUCTURE</span><h3>Keep SignalIR</h3><p>The direct prop retains its structural parent signal relationship.</p></article>
          <article><span>BOUNDARY</span><h3>Reject arrays</h3><p>Arrays, aliases, property paths, and composed values remain fail-closed.</p></article>
          <article><span>OUTPUT</span><h3>Ship no runtime</h3><p>The existing handler and binding capabilities perform every update.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary object editors shaped like ordinary React.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.57</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.57 - Plain-object prop draft state</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.57">GitHub release</a>
    </footer>
  </>
}
