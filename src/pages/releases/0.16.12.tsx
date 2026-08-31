export const metadata = {
  title: "Kudzu 0.16.12 - Bounded application inspection",
  description: "Kudzu 0.16.12 adds deterministic bounded application inventory and first-blocker facts without exposing raw compiler IR or changing browser output.",
  url: "https://kudzujs.cloud/releases/0.16.12",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.12 bounded application inspection",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.12">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.12</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACHABLE FACTS · FIXED LIMITS · FIRST BLOCKER RETAINED</p>
        <h1>Inspect the application.<br /><em>Skip the raw compiler.</em></h1>
        <p className="release-lead">Kudzu now projects its existing build graph into compact deterministic JSON so tools can choose the next migration blocker without reading hundreds of files.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the inventory</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.12">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>7</strong><span>Bounded sections</span></div>
        <div><strong>0 B</strong><span>Browser delta</span></div>
        <div><strong>295</strong><span>Passing tests</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.12</span><div><p>APPLICATION INSPECTION</p><h2>Keep useful context.<br />Drop raw internals.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>REACHABILITY</span><h3>Report only used source</h3><p>Modules and packages come from the same route closure the authoritative build compiles.</p></article>
          <article><span>ROUTES</span><h3>Separate static and interactive</h3><p>Each route identifies its runtime family, enabled capability facts, and compact artifact counts.</p></article>
          <article><span>OWNERSHIP</span><h3>Name semantic owners</h3><p>Component and specialization records expose state, ref, ID, effect, and keyed ownership counts.</p></article>
          <article><span>BLOCKERS</span><h3>Retain the first stop</h3><p>Structured diagnostics, unsupported sites, and partial-package review candidates stay explicitly classified.</p></article>
          <article><span>BOUNDS</span><h3>Sort before truncation</h3><p>Fixed limits plus total and omitted counts keep large-project context deterministic and honest.</p></article>
          <article><span>OUTPUT</span><h3>Ship no browser change</h3><p>Runtime graphs, route artifacts, static HTML, and representative deploy hashes remain unchanged.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Inspect before choosing the next migration edit.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.12</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.12 - Bounded application inspection</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.12">GitHub release</a></footer>
  </>
}
