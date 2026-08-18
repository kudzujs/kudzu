export const metadata = {
  title: "Kudzu 0.8.59 - Array prop draft state",
  description: "Kudzu 0.8.59 initializes specialized child array drafts from one direct parent state prop without a component runtime.",
  url: "https://kudzujs.cloud/releases/0.8.59",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.59 array prop draft state",
  themeColor: "#ff8a3d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.59">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.59</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SEED · EDIT · APPLY</p>
        <h1>Keep the array local.<br /><em>Commit when ready.</em></h1>
        <p className="release-lead">A specialized child can now initialize an independent array draft from one direct parent state prop and preserve a conventional direct set* setter prop.</p>
        <div className="release-links">
          <a className="primary-action" href="#array-drafts">Inspect the boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.59/PERFORMANCE.md#current-0859-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Independent arrays</span></div>
        <div><strong>1</strong><span>Real migration fixture</span></div>
        <div><strong>0 B</strong><span>New runtime code</span></div>
      </section>

      <section className="release-section" id="array-drafts">
        <div className="release-section-heading"><span>P1</span><div><p>ARRAY PROP DRAFT STATE</p><h2>Preserve the shape.<br />Separate ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SEED</span><h3>Start from the prop</h3><p>A direct parent array literal supplies the child's build-known initial draft.</p></article>
          <article><span>OWNERSHIP</span><h3>Keep arrays independent</h3><p>Parent replacement does not mutate or synchronize the mounted child draft.</p></article>
          <article><span>COMMIT</span><h3>Apply explicitly</h3><p>The authored intrinsic handler moves the latest draft back to parent state.</p></article>
          <article><span>SOURCE</span><h3>Retain set* naming</h3><p>Prop-derived state components may keep a direct setter prop such as setSelectedItems.</p></article>
          <article><span>BOUNDARY</span><h3>Reject composition</h3><p>Aliases, property paths, spreads, indirect callbacks, and additional set* forwarding fail closed.</p></article>
          <article><span>OUTPUT</span><h3>Add no runtime</h3><p>Existing state, handler, and list capabilities perform every update.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary multi-select drafts shaped like ordinary React.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.59</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.59 - Array prop draft state</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.59">GitHub release</a>
    </footer>
  </>
}
