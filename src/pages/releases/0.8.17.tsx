export const metadata = {
  title: "Kudzu 0.8.17 - Command ModuleIR",
  description: "Kudzu 0.8.17 lowers supported command handlers through plain JSON-safe ModuleIR and focused source codegen without changing deploy output.",
  url: "https://kudzujs.cloud/releases/0.8.17",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.17 command ModuleIR",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.17">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.17</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">COMMAND MODULE IR</p>
        <h1>Plain command data.<br /><em>The same deploy program.</em></h1>
        <p className="release-lead">Counter-shaped handlers now cross a JSON-safe ModuleIR boundary before focused codegen restores the existing command-only build path.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What changed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.17">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Real ModuleIR slice</span></div>
        <div><strong>0 B</strong><span>Runtime graph delta</span></div>
        <div><strong>166/166</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT CHANGED</p><h2>Analyze plain data.<br />Generate known commands.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ANALYSIS</span><h3>Plain command IR</h3><p>ADD, SET, and state logging become JSON-safe records instead of generated TypeScript nodes.</p></article>
          <article><span>IDENTITY</span><h3>Numeric slots</h3><p>Signal and handler slots are deterministic while readable names and lexical owners remain available for debugging.</p></article>
          <article><span>CODEGEN</span><h3>One-way boundary</h3><p>Focused codegen consumes ModuleIR signal and handler data, recreating the existing behavior call without source discovery.</p></article>
          <article><span>NUMBERS</span><h3>Exact semantics</h3><p>Unary plus and negative zero survive JSON through explicit syntax metadata; non-finite values use generic handlers.</p></article>
          <article><span>SOURCE</span><h3>Honest provenance</h3><p>Original handlers retain repository-relative ranges while synthetic compiler callbacks invent no locations.</p></article>
          <article><span>OUTPUT</span><h3>Byte parity</h3><p>Unchanged HTML, plans, command runtime, Worker graph, and window graph match 0.8.16 byte for byte.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Compile commands through data.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.17</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.17 - Command ModuleIR</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.17">GitHub release</a>
    </footer>
  </>
}
