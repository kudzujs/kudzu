export const metadata = {
  title: "Kudzu 0.7.29 - Hermetic TypeScript checks",
  description: "Kudzu 0.7.29 isolates project and fixture typechecks from unrelated ambient types and declarations in ancestor directories.",
  url: "https://kudzujs.cloud/releases/0.7.29",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.29 hermetic TypeScript checks",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#install">Installation guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.29">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.29</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">HERMETIC TYPESCRIPT CHECKS</p>
        <h1>Check the project.<br /><em>Not the parent folder.</em></h1>
        <p className="release-lead">Fresh installs now typecheck against their declared environment instead of inheriting ambient packages from whatever directory happens to contain the checkout.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.29">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>clean</strong><span>npm ci checkout</span></div>
        <div><strong>0</strong><span>Inherited ambient types</span></div>
        <div><strong>122/122</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Same source.<br />Same result.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROJECT</span><h3>Ambient types isolated</h3><p>The root config no longer scans unrelated ancestor type packages.</p></article>
          <article><span>CREATE</span><h3>New apps match</h3><p>Generated projects receive the same explicit empty ambient type set.</p></article>
          <article><span>FIXTURES</span><h3>Declarations stay local</h3><p>Migration fixtures typecheck source without merging foreign library internals.</p></article>
          <article><span>CLEAN INSTALL</span><h3>npm ci verified</h3><p>A fresh checkout passes below deliberately conflicting ancestor packages.</p></article>
          <article><span>COMPILER</span><h3>No runtime change</h3><p>Generated HTML and browser capabilities remain unchanged.</p></article>
          <article><span>SUITE</span><h3>122 tests</h3><p>Framework, migration, browser, and release checks all pass.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Make checks reproducible.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.29</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.29 - Hermetic TypeScript checks</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.29">GitHub release</a>
    </footer>
  </>
}
