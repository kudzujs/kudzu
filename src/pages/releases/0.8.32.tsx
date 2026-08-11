export const metadata = {
  title: "Kudzu 0.8.32 - Staged and collision-safe output",
  description: "Kudzu 0.8.32 preserves the previous deploy tree when production generation, public validation, or afterBuild work fails.",
  url: "https://kudzujs.cloud/releases/0.8.32",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.32 staged and collision-safe output",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#build">Build output</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.32">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.32</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STAGE · VERIFY · PROMOTE</p>
        <h1>Build away from production.<br /><em>Publish only success.</em></h1>
        <p className="release-lead">Generation, public validation, and trusted hooks finish before Kudzu replaces the previous deploy tree. Ordinary failure leaves the last successful output intact.</p>
        <div className="release-links">
          <a className="primary-action" href="#output">See the output boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.32/PERFORMANCE.md#0832-staged-output-emission">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>7</strong><span>Generated namespaces guarded</span></div>
        <div><strong>3,056</strong><span>Identical commerce artifacts</span></div>
        <div><strong>190/190</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="output">
        <div className="release-section-heading"><span>05</span><div><p>OUTPUT OWNERSHIP</p><h2>Keep the last success.<br />Reject ambiguous files.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STAGING</span><h3>Complete before replacement</h3><p>HTML, capability ESM, Workers, CSS, public files, and afterBuild artifacts finish outside the active dist tree.</p></article>
          <article><span>COLLISIONS</span><h3>Generated paths stay owned</h3><p>Public route, runtime, handler, chunk, Worker, and stylesheet collisions stop the build instead of overwriting output.</p></article>
          <article><span>FAILURE</span><h3>Previous output survives</h3><p>Compiler, bundler, copy, and hook failures discard staging while the prior successful deploy remains unchanged.</p></article>
          <article><span>RECOVERY</span><h3>Interrupted swaps recover</h3><p>An exclusive same-root lock blocks overlap. After stale-lock removal, the next admitted build restores an interrupted promotion backup.</p></article>
          <article><span>MEASURED</span><h3>Equivalent deploy output</h3><p>A pre-hardening candidate observed a 5.71% lower local fixture median while all 3,056 commerce artifacts remained byte-identical.</p></article>
          <article><span>NEXT</span><h3>ProjectSession</h3><p>P0.6 moves root and compiler caches into explicit build-scoped ownership for independent projects.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep familiar builds. Keep output recoverable.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.32</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.32 - Staged and collision-safe output</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.32">GitHub release</a>
    </footer>
  </>
}
