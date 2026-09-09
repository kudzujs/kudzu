export const metadata = {
  title: "Kudzu 0.16.28 - Bounded route HTML summary",
  description: "Kudzu 0.16.28 reports a bounded lexical inventory of final route HTML without claiming browser correctness or script freedom.",
  url: "https://kudzujs.cloud/releases/0.16.28",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.28 bounded route HTML summary",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.28">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.28</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">ROUTE HTML / BROWSER OBSERVATIONS / HONEST LIMITS</p>
        <h1>Count the markers.<br /><em>Verify the behavior.</em></h1>
        <p className="release-lead">Normal builds now summarize final route HTML with bounded counts and paths. A literal marker scan is an inventory, not proof of script freedom, visible content, or accessibility.</p>
        <div className="release-links"><a className="primary-action" href="/docs#build">Read the build reference</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.28">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>64</strong><span>maximum concurrent route-file reads</span></div>
        <div><strong>0 B</strong><span>browser JavaScript delta</span></div>
        <div><strong>0</strong><span>new runtime concepts or dependencies</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.28</span><div><p>BOUNDED VERIFICATION</p><h2>Separate artifact facts.<br />Observe real behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>OUTPUT</span><h3>Final route HTML inventory</h3><p>The scan runs after public copying and afterBuild, then prints only after successful output promotion. It counts files with and without script/modulepreload text markers and unreadable files, showing up to five bounded, sorted paths per category. Quiet and JSON builds omit it.</p></article>
          <article><span>LIMITS</span><h3>Markers are not zero-JavaScript proof</h3><p>Comments, JSON-LD and inert content can match. Inline event attributes and extra public HTML are not checked. Compiler semantics, artifact schemas, runtime behavior and deploy bytes remain unchanged.</p></article>
          <article><span>REPOSITORY</span><h3>Browser tools stay repository-only</h3><p>Trusted-local Linux Chrome smoke tooling observes rendered text and accessible names, uses native input, and fails on observed browser or resource errors. Bounded exact-target diagnostics and copied-tool integrity checks are covered by regressions. These tools are not shipped in npm, a framework API, a sandbox, or full accessibility certification.</p></article>
          <article><span>EVIDENCE</span><h3>No demonstrated AI-token advantage</h3><p>Historical full-suite r8 remains Kudzu 23/25 versus React + Vite 24/25. Focused r9 records 3/5 versus 5/5; separate local summary r10 and equal-browser-tools r11 each record 4/5 versus 5/5. Failures remain included and experiments are not rescored. Browser adoption does not establish cost superiority; 1.0.0 remains blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Same semantics. Bounded output.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.28</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.28 - Bounded route HTML summary</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.28">GitHub release</a></footer>
  </>
}
