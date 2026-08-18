export const metadata = {
  title: "Kudzu 0.8.58 - Keyed item draft state",
  description: "Kudzu 0.8.58 initializes keyed row object drafts from the direct item prop while preserving key-scoped ownership.",
  url: "https://kudzujs.cloud/releases/0.8.58",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.58 keyed item draft state",
  themeColor: "#36c98f"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Keyed lists</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.58">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.58</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CLONE · RETAIN · RELEASE</p>
        <h1>Keep the key.<br /><em>Keep the draft.</em></h1>
        <p className="release-lead">A keyed row can now initialize an independent object draft directly from its item prop, retain it through reorder, and recreate it from the current item after removal.</p>
        <div className="release-links">
          <a className="primary-action" href="#keyed-drafts">Inspect the lifecycle</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.58/PERFORMANCE.md#current-0858-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Narrow initializer</span></div>
        <div><strong>3</strong><span>Lifecycle proofs</span></div>
        <div><strong>0</strong><span>Component runtimes</span></div>
      </section>

      <section className="release-section" id="keyed-drafts">
        <div className="release-section-heading"><span>P1</span><div><p>KEYED ITEM DRAFT STATE</p><h2>Clone once.<br />Own by key.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>MOUNT</span><h3>Clone on mount</h3><p>Each new key clones its current direct item prop into independent row state.</p></article>
          <article><span>REORDER</span><h3>Retain on reorder</h3><p>The same key preserves its draft and DOM identity while rows move.</p></article>
          <article><span>REMOVE</span><h3>Release exactly</h3><p>Removing a key deletes its row-owned draft with the existing ownership path.</p></article>
          <article><span>REMOUNT</span><h3>Start fresh</h3><p>Re-adding a released key initializes from the latest item instead of stale state.</p></article>
          <article><span>BOUNDARY</span><h3>Stay direct</h3><p>Aliases, property paths, and composed item expressions remain fail-closed.</p></article>
          <article><span>OUTPUT</span><h3>Keep static static</h3><p>Sibling routes without interaction continue to ship complete HTML and no JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep Todo-style row drafts in ordinary component syntax.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.58</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.58 - Keyed item draft state</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.58">GitHub release</a>
    </footer>
  </>
}
