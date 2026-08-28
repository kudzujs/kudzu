export const metadata = {
  title: "Kudzu 0.16.4 - Scoped GSAP animation lifecycle",
  description: "Kudzu 0.16.4 keeps GSAP presentation inside one owned effect while Kudzu retains structural DOM and exact lifetime ownership.",
  url: "https://kudzujs.cloud/releases/0.16.4",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.4 scoped GSAP animation lifecycle",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.4">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.4</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SCOPED MOTION · STATIC FALLBACK · EXACT REVERT</p>
        <h1>Animate the surface.<br /><em>Keep ownership still.</em></h1>
        <p className="release-lead">GSAP owns bounded presentation while Kudzu keeps the document structure, reduced-motion fallback, and every disposal boundary exact.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the lifecycle</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.4">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>37,819 B</strong><span>GSAP fixture JS gzip</span></div>
        <div><strong>0 B</strong><span>Static sibling JS</span></div>
        <div><strong>0</strong><span>Animation runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.4</span><div><p>OWNED PRESENTATION</p><h2>Scope the motion.<br />Revert the owner.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SCOPE</span><h3>Target locally</h3><p>One DOM ref bounds every GSAP presentation target.</p></article>
          <article><span>FALLBACK</span><h3>Start visible</h3><p>Complete HTML remains deterministic before animation starts.</p></article>
          <article><span>MOTION</span><h3>Respect preference</h3><p>Reduced motion keeps static content without residual inline styles.</p></article>
          <article><span>UPDATE</span><h3>Replace exactly</h3><p>Dependency changes revert the prior context before setup.</p></article>
          <article><span>STRUCTURE</span><h3>Retain the DOM</h3><p>Kudzu remains the only durable structural owner.</p></article>
          <article><span>RELEASE</span><h3>Remount fresh</h3><p>Conditional and route disposal release every animation owner.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep motion bounded.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.4</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.4 - Scoped GSAP animation lifecycle</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.4">GitHub release</a></footer>
  </>
}
