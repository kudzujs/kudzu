export const metadata = {
  title: "Kudzu 0.8.55 - Signature-keyed runtime families",
  description: "Kudzu 0.8.55 emits isolated capability runtime families while preserving one ESM singleton across each enhanced-navigation group.",
  url: "https://kudzujs.cloud/releases/0.8.55",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.55 signature-keyed runtime families",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.55">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.55</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">HASH · SHARE · ISOLATE</p>
        <h1>Split the runtime.<br /><em>Keep the lifecycle whole.</em></h1>
        <p className="release-lead">Standalone routes now share runtime files only when their capability signatures match. Enhanced-navigation routes intentionally union at the group boundary so layout state and lifecycle hooks keep one ESM identity.</p>
        <div className="release-links">
          <a className="primary-action" href="#runtime-families">Inspect the families</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.55/PERFORMANCE.md#current-0855-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Family per signature</span></div>
        <div><strong>1</strong><span>Singleton per nav group</span></div>
        <div><strong>0 B</strong><span>Static route runtime</span></div>
      </section>

      <section className="release-section" id="runtime-families">
        <div className="release-section-heading"><span>P1</span><div><p>SIGNATURE-KEYED RUNTIME FAMILIES</p><h2>Share only exact needs.<br />Preserve ownership boundaries.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SIGNATURES</span><h3>Share exact signatures</h3><p>Equivalent standalone routes reuse one deterministic runtime directory.</p></article>
          <article><span>ISOLATION</span><h3>Separate differences</h3><p>Unrelated capabilities no longer alter another route's loaded bytes or cache URL.</p></article>
          <article><span>NAVIGATION</span><h3>Keep navigation whole</h3><p>Each enhanced-navigation group uses one union family for persistent ownership.</p></article>
          <article><span>ENTRIES</span><h3>Link directly</h3><p>Parameter, effect, and native entries import their assigned family without a loader.</p></article>
          <article><span>REPORT</span><h3>Record actual output</h3><p>Artifact report v2 maps exact route signatures to emitted family files.</p></article>
          <article><span>STATIC</span><h3>Emit nothing</h3><p>Static routes retain complete HTML and zero client JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Cache runtime capabilities by what routes actually need.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.55</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.55 - Signature-keyed runtime families</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.55">GitHub release</a>
    </footer>
  </>
}
