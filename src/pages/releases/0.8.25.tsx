export const metadata = {
  title: "Kudzu 0.8.25 - Exact route-entry reuse",
  description: "Kudzu 0.8.25 improves 1,011-page builds by 9.17%, validates compiler boundaries, and strengthens package release gates.",
  url: "https://kudzujs.cloud/releases/0.8.25",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.25 exact route-entry reuse",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#benchmarks">Benchmarks</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.25">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.25</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REUSE · VALIDATE · RELEASE</p>
        <h1>Transform once.<br /><em>Prove every boundary.</em></h1>
        <p className="release-lead">Byte-identical generated route entries now share one build-local transform result, while normalization, ModuleIR, package, and publication boundaries fail closed.</p>
        <div className="release-links">
          <a className="primary-action" href="#results">See the results</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.25/PERFORMANCE.md#0825-route-entry-transform-reuse">Raw measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>9.17%</strong><span>Faster 1,011-page build</span></div>
        <div><strong>0 B</strong><span>Deploy output delta</span></div>
        <div><strong>174/174</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="results">
        <div className="release-section-heading"><span>01</span><div><p>GOAL B</p><h2>Reuse exact work.<br />Reject broken boundaries.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>BUILD</span><h3>Exact-source reuse</h3><p>Native, parameter, and effect entries share transformed bytes only when their complete generated source matches.</p></article>
          <article><span>SCOPE</span><h3>One build only</h3><p>The focused map is discarded after each build and never becomes a persistent or generalized transform cache.</p></article>
          <article><span>NORMALIZE</span><h3>SourceFile contract</h3><p>Every normalization pass returns the immutable root consumed by the next pass or fails immediately.</p></article>
          <article><span>MODULE IR</span><h3>Valid slot graph</h3><p>Finalization rejects missing signal, handler, derived, keyed, and ownership references before code generation.</p></article>
          <article><span>PACKAGES</span><h3>Install what ships</h3><p>CI packs the tarball, installs it in a clean consumer, imports public entries, and runs the packed CLI.</p></article>
          <article><span>RELEASE</span><h3>Versions agree</h3><p>Tags, manifests, lockfiles, minimum Node, Chrome, and published registry versions are explicit gates.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Reuse the bytes. Keep the output.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.25</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.25 - Exact route-entry reuse</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.25">GitHub release</a>
    </footer>
  </>
}
