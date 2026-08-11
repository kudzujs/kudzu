export const metadata = {
  title: "Kudzu 0.8.33 - Project-scoped compilation",
  description: "Kudzu 0.8.33 isolates project roots, source graphs, compiler paths, and Workers so independent applications can compile safely in one process.",
  url: "https://kudzujs.cloud/releases/0.8.33",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.33 project-scoped compilation",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.33">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.33</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ROOT · GRAPH · OUTPUT</p>
        <h1>One process.<br /><em>Independent projects.</em></h1>
        <p className="release-lead">Every build now carries its own root, source records, graph resolver, compiler paths, and Worker ownership. Project A cannot become Project B by being imported first.</p>
        <div className="release-links">
          <a className="primary-action" href="#session">See the session boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.33/docs/next-architecture/compiler-current-architecture.md">Architecture</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Roots compiled in one process</span></div>
        <div><strong>0</strong><span>Import-time project roots</span></div>
        <div><strong>191/191</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="session">
        <div className="release-section-heading"><span>06</span><div><p>PROJECT OWNERSHIP</p><h2>Resolve once per build.<br />Keep every edge local.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SESSION</span><h3>One explicit root</h3><p>ProjectSession owns src, pages, compiler scratch, output, source records, graph operations, and Worker compilation.</p></article>
          <article><span>ISOLATION</span><h3>Same names stay separate</h3><p>Independent projects may use identical page, helper, config, and Worker filenames without sharing compiler state or artifacts.</p></article>
          <article><span>COMPATIBILITY</span><h3>CLI behavior stays familiar</h3><p>Build and development entry points accept an explicit root. Omit it and Kudzu resolves the current directory when the command runs.</p></article>
          <article><span>WORKERS</span><h3>Bundles follow their project</h3><p>Worker graph validation, esbuild working directories, hashed output, and placeholder resolution remain bound to the owning root.</p></article>
          <article><span>OUTPUT</span><h3>Safety remains intact</h3><p>Project-local locks, staging, collision checks, rollback, and recovery continue to guard each root independently.</p></article>
          <article><span>NEXT</span><h3>Parse once per session</h3><p>P0.7 can now add parsed-module and export-summary caching without leaking mutable compiler state across projects.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the CLI. Gain a real project boundary.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.33</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.33 - Project-scoped compilation</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.33">GitHub release</a>
    </footer>
  </>
}
