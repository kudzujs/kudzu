export const metadata = {
  title: "Kudzu 0.16.9 - Compatibility boundary and inventory",
  description: "Kudzu 0.16.9 records reachable package compatibility sites before normalization without changing semantic IR or browser output.",
  url: "https://kudzujs.cloud/releases/0.16.9",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.9 compatibility boundary and inventory",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.9">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.9</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACHABLE SOURCE · STABLE CLASSES · ZERO RUNTIME</p>
        <h1>Know the boundary.<br /><em>Keep it out of output.</em></h1>
        <p className="release-lead">Package compatibility is now source-located and inspectable before normalization while semantic IR and deployed artifacts remain package-neutral.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the inventory</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.9">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>7</strong><span>Compatibility classes</span></div>
        <div><strong>1</strong><span>Scratch report</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.9</span><div><p>COMPATIBILITY PROVENANCE</p><h2>Classify authored source.<br />Preserve semantic output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>GRAPH</span><h3>Inspect reachable files</h3><p>Unused migration source stays outside compilation and outside the report.</p></article>
          <article><span>SOURCE</span><h3>Keep exact ranges</h3><p>Every package/API site records its authored file and line/column range.</p></article>
          <article><span>CLASSES</span><h3>Name the treatment</h3><p>Native through Unsupported classifications use deterministic stable rules.</p></article>
          <article><span>BOUNDARY</span><h3>Stop before IR</h3><p>Package origin never enters ComponentAnalysis, ModuleIR, RouteIR, or codegen.</p></article>
          <article><span>OUTPUT</span><h3>Ship no provenance</h3><p>The report remains compiler scratch and adds no browser file or capability.</p></article>
          <article><span>API</span><h3>Add no plugin system</h3><p>The inventory is internal and introduces no public adapter contract.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Inspect package boundaries without shipping them.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.9</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.9 - Compatibility boundary and inventory</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.9">GitHub release</a></footer>
  </>
}
