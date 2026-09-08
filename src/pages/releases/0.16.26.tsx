export const metadata = {
  title: "Kudzu 0.16.26 - Product documentation and package hygiene",
  description: "Kudzu 0.16.26 improves the authoring guide and npm package contents without compiler or runtime changes.",
  url: "https://kudzujs.cloud/releases/0.16.26",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.26 product documentation",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.26">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.26</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">AUTHORING / PACKAGE HYGIENE / HONEST EVIDENCE</p>
        <h1>Keep the product.<br /><em>Leave internal docs out.</em></h1>
        <p className="release-lead">A generic authoring guide and a leaner installed package. Internal evidence stays in the repository; compiler and runtime behavior stay unchanged.</p>
        <div className="release-links"><a className="primary-action" href="/docs">Read the documentation</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.26">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>compiler or runtime changes</span></div>
        <div><strong>2</strong><span>script-free package smoke routes</span></div>
        <div><strong>0</strong><span>new dependencies</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.26</span><div><p>PACKAGE HYGIENE</p><h2>Useful guidance.<br />Verified contents.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Supported patterns</h3><p>The README explains native events and state, pure collection filters/counts, keyed children, and route-local static ownership. Public absolute links remain usable from npm.</p></article>
          <article><span>PACKAGE</span><h3>Actual tarball checks</h3><p>Internal evidence and architecture Markdown leave npm but remain in the repository. Smoke assertions verify required files, byte-identical framework/CLI sources, unchanged exports/bin, and the README consumer.</p></article>
          <article><span>MEASUREMENT</span><h3>Historical package comparison</h3><p>The same-tree pre-release comparison falls from 85 to 60 files and 536,166 to 200,431 gzip bytes, 62.6% smaller. These are not exact versioned release bytes or measured AI-token savings.</p></article>
          <article><span>LIMITS</span><h3>Evidence stays honest</h3><p>Historical r7 on released 0.16.25 records Kudzu 20/25 versus React + Vite 25/25. All final outputs pass acceptance; five content attempts exceed budgets. Context-isolation limitations remain. No new AI run, rescoring, or sandbox claim is included, and 1.0.0 stays blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Same compiler. Clearer guide.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.26</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.26 - Product documentation and package hygiene</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.26">GitHub release</a></footer>
  </>
}
