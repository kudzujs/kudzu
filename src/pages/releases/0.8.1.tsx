export const metadata = {
  title: "Kudzu 0.8.1 - Custom-hook reset actions",
  description: "Kudzu 0.8.1 batches direct custom-hook state resets without a callback runtime.",
  url: "https://kudzujs.cloud/releases/0.8.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.1 custom-hook reset actions",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.1">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CUSTOM-HOOK RESET ACTIONS</p>
        <h1>Keep reset ownership.<br /><em>Inside the hook.</em></h1>
        <p className="release-lead">Direct primitive resets from relative custom hooks become one batched behavior command, with no callback registry or component runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.1">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Batched reset commit</span></div>
        <div><strong>12</strong><span>FIRE fields reset</span></div>
        <div><strong>132/132</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Ordinary hook actions.<br />Static compiler ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>HOOKS</span><h3>Returned reset actions</h3><p>Direct callback shorthand remains owned by its relative custom hook.</p></article>
          <article><span>BATCHING</span><h3>One commit</h3><p>Multiple literal setter calls reuse Kudzu's existing behavior command path.</p></article>
          <article><span>LITERALS</span><h3>Primitive coverage</h3><p>Strings, numbers, negatives, booleans, and null emit source-independent commands.</p></article>
          <article><span>EFFECTS</span><h3>Existing synchronization</h3><p>Dependent URL and storage effects observe the completed reset commit.</p></article>
          <article><span>FIX</span><h3>Imported AST safety</h3><p>Command literals no longer retain source ranges from another module.</p></article>
          <article><span>BOUNDARY</span><h3>No callback runtime</h3><p>Dynamic values, private captures, timers, and indirect actions remain rejected.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary reset actions in their custom hooks.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.1</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.1 - Custom-hook reset actions</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.1">GitHub release</a>
    </footer>
  </>
}
