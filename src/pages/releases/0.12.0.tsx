export const metadata = {
  title: "Kudzu 0.12.0 - Project route shell and runtime parameters",
  description: "Kudzu 0.12.0 proves directly addressable project and issue routes with complete fallback HTML, pathname parameters, host rewrites, and native links.",
  url: "https://kudzujs.cloud/releases/0.12.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.12.0 project route shell and runtime parameters",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.0">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.12.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PATH · DOCUMENT · RELEASE</p>
        <h1>Address every route.<br /><em>Keep navigation native.</em></h1>
        <p className="release-lead">Bracket file routes, pathname parameters, and ordered host rewrites deliver complete project and issue documents without a browser router.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the routes</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.0">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Runtime route shapes</span></div>
        <div><strong>0</strong><span>SPA route registries</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.12.0</span><div><p>DIRECT ROUTES</p><h2>Resolve the file.<br />Read the path.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROJECT</span><h3>Address project routes</h3><p>One bracket file reads the project identifier from the pathname.</p></article>
          <article><span>ISSUE</span><h3>Nest issue routes</h3><p>A second bracket file reads project and issue identifiers directly.</p></article>
          <article><span>HTML</span><h3>Emit complete fallbacks</h3><p>Each route ships document structure before browser parameter replacement.</p></article>
          <article><span>HOST</span><h3>Order rewrites safely</h3><p>Exact emitted files win before runtime route fallbacks.</p></article>
          <article><span>NATIVE</span><h3>Keep ordinary anchors</h3><p>Project-to-issue navigation remains document navigation.</p></article>
          <article><span>BOUNDARY</span><h3>Skip the router runtime</h3><p>No SPA registry, VDOM, hydration, or retained route tree ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Let files own route shape.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.12.0</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.12.0 - Project route shell and runtime parameters</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.0">GitHub release</a></footer>
  </>
}
