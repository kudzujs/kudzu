export const metadata = {
  title: "Kudzu 0.16.11 - Structured compiler diagnostics",
  description: "Kudzu 0.16.11 adds stable machine-readable authored-source diagnostics while preserving concise human errors and unchanged browser output.",
  url: "https://kudzujs.cloud/releases/0.16.11",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.11 structured compiler diagnostics",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.11">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.11</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STABLE CODES · EXACT RANGES · HUMAN ERRORS PRESERVED</p>
        <h1>Read errors directly.<br /><em>Stop parsing prose.</em></h1>
        <p className="release-lead">Kudzu now exposes authored-source failures as a compact versioned JSON envelope while keeping ordinary build and development diagnostics concise.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the contract</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.11">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>7</strong><span>Stable fields</span></div>
        <div><strong>0 B</strong><span>Browser delta</span></div>
        <div><strong>293</strong><span>Passing tests</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.11</span><div><p>STRUCTURED DIAGNOSTICS</p><h2>Keep source context.<br />Hide compiler internals.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SCHEMA</span><h3>Version the envelope</h3><p>Machine consumers receive deterministic ordered diagnostics under one explicit schema version.</p></article>
          <article><span>IDENTITY</span><h3>Use stable codes</h3><p>Semantic codes and stages replace message-substring parsing without exposing pass filenames.</p></article>
          <article><span>SOURCE</span><h3>Point to authored ranges</h3><p>Project-relative files, lines, columns, and offsets identify the original TypeScript or TSX site.</p></article>
          <article><span>GUIDANCE</span><h3>Suggest only safe paths</h3><p>Compatibility class and migration suggestion remain nullable when no proven advice exists.</p></article>
          <article><span>HUMAN</span><h3>Preserve readable errors</h3><p>Ordinary builds and the development overlay keep concise source-located messages.</p></article>
          <article><span>OUTPUT</span><h3>Ship no browser change</h3><p>Runtime graphs, route artifacts, static HTML, and deploy hashes remain unchanged.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Give tooling a stable error contract.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.11</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.11 - Structured compiler diagnostics</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.11">GitHub release</a></footer>
  </>
}
