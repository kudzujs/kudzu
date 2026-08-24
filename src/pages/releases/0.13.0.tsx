export const metadata = {
  title: "Kudzu 0.13.0 - Production form and server validation",
  description: "Kudzu 0.13.0 compiles native constraints, server feedback, focused field errors, retained input, and retry without a form runtime.",
  url: "https://kudzujs.cloud/releases/0.13.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.13.0 production form and server validation",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.0">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.13.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">NATIVE · ACCESSIBLE · RETRYABLE</p>
        <h1>Keep the form native.<br /><em>Own only what the app needs.</em></h1>
        <p className="release-lead">Browser constraints, focused server feedback, pending state, retained input, and retry compile from ordinary TSX with no form runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the form</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.0">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Form runtimes</span></div>
        <div><strong>3</strong><span>Server outcomes</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.13.0</span><div><p>FORM OWNERSHIP</p><h2>Use the platform.<br />Keep feedback explicit.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CONSTRAINTS</span><h3>Let the browser block</h3><p>Required and minimum-length controls prevent invalid keyboard submission before any request.</p></article>
          <article><span>PENDING</span><h3>Own one status</h3><p>The application disables submission and labels the in-flight operation with ordinary state.</p></article>
          <article><span>FIELD</span><h3>Focus the correction</h3><p>Server field feedback updates ARIA linkage and returns focus to the exact invalid control.</p></article>
          <article><span>FORM</span><h3>Announce the failure</h3><p>Form-level service errors use a native alert while preserving every valid authored value.</p></article>
          <article><span>RETRY</span><h3>Submit without re-entry</h3><p>The same corrected values survive failure and succeed on the next keyboard submission.</p></article>
          <article><span>BOUNDARY</span><h3>Ship no registry</h3><p>No field registration API, metadata proxy, schema adapter, or browser form runtime is introduced.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep form ownership local.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.13.0</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.13.0 - Production form and server validation</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.0">GitHub release</a></footer>
  </>
}
