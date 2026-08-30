export const metadata = {
  title: "Kudzu 0.16.6 - Owner-triggered capability imports",
  description: "Kudzu 0.16.6 defers one guarded package dependency until its effect owner activates while static siblings remain JavaScript-free.",
  url: "https://kudzujs.cloud/releases/0.16.6",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.6 owner-triggered capability imports",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.6">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.6</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">OWNER ACTIVATION · NATIVE ESM · STATIC EXCLUSION</p>
        <h1>Load the feature.<br /><em>Only when it matters.</em></h1>
        <p className="release-lead">A guarded effect can now defer one exact package graph until its owner activates, without a loader, island, or component runtime.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the boundary</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.6">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>91.4%</strong><span>Less initial editor gzip</span></div>
        <div><strong>1</strong><span>Deferred package request</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.6</span><div><p>BOUNDED LAZY LOADING</p><h2>Validate the edge.<br />Own the lifetime.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Keep ordinary effects</h3><p>One literal package import follows one direct dependency-state guard.</p></article>
          <article><span>BUILD</span><h3>Split the graph</h3><p>The package stays out of build-time component execution and initial preload.</p></article>
          <article><span>REPORT</span><h3>Expose deferred bytes</h3><p>Route artifacts distinguish eager closure from owned lazy chunks.</p></article>
          <article><span>BROWSER</span><h3>Deduplicate natively</h3><p>The browser module map serves remounts without another network request.</p></article>
          <article><span>OWNER</span><h3>Dispose exactly</h3><p>Effect cleanup destroys the package instance on owner and document release.</p></article>
          <article><span>STATIC</span><h3>Ship nothing unused</h3><p>The static sibling remains complete HTML with zero JavaScript.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Defer the expensive edge.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.6</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.6 - Owner-triggered capability imports</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.6">GitHub release</a></footer>
  </>
}
