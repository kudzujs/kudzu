export const metadata = {
  title: "Kudzu 0.16.16 - Bounded compiler module cache",
  description: "Kudzu 0.16.16 bounds canonical TypeScript AST retention and completes the 100,000-module source-scale contract under a 10 GiB heap.",
  url: "https://kudzujs.cloud/releases/0.16.16",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.16 bounded compiler module cache",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.16">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.16</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">100,000 MODULES · 10 GiB HEAP · STABLE SYMBOLS</p>
        <h1>Keep the symbols.<br /><em>Release the old trees.</em></h1>
        <p className="release-lead">Kudzu now bounds complete canonical TypeScript records while preserving stable source-position identity and reparsing evicted modules only when needed.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the scale proof</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.16">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>100K</strong><span>TypeScript modules</span></div>
        <div><strong>5.46 GiB</strong><span>Clean-build RSS</span></div>
        <div><strong>1,024</strong><span>Canonical records</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.16</span><div><p>BOUNDED COMPILER MEMORY</p><h2>Retain what is hot.<br />Reparse what is cold.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CAUSE</span><h3>Measure the retained graph</h3><p>The full topology exposed roughly 90,000 parent-linked TypeScript ASTs held by an unbounded canonical cache.</p></article>
          <article><span>BOUND</span><h3>Keep 1,024 records</h3><p>A small LRU releases old complete records while source text and stable module identities remain authoritative.</p></article>
          <article><span>IDENTITY</span><h3>Preserve stable symbols</h3><p>Evicted modules reparse to the same source-position symbol IDs, declarations, diagnostics, and output.</p></article>
          <article><span>SCALE</span><h3>Compile 100,000 modules</h3><p>The complete 10,110,000-line topology finishes under the same 10 GiB heap that previously exhausted memory.</p></article>
          <article><span>INCREMENTAL</span><h3>Touch one route</h3><p>The retained session recompiles ten modules, renders one page, and matches a clean changed-source build.</p></article>
          <article><span>OUTPUT</span><h3>Ship zero extra bytes</h3><p>The change affects compiler scratch only and adds no semantic primitive, runtime concept, or browser artifact.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Bound compiler memory at source scale.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.16</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.16 - Bounded compiler module cache</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.16">GitHub release</a></footer>
  </>
}
