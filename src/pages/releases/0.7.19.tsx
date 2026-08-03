export const metadata = {
  title: "Kudzu 0.7.19 - Reusable collection aliases",
  description: "Kudzu 0.7.19 lets one immutable collection alias feed multiple keyed lists and formalizes one-boundary callback and ref ownership.",
  url: "https://kudzujs.cloud/releases/0.7.19",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.19 reusable collection aliases",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">List guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.19">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.19</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REUSABLE COLLECTION ALIASES</p>
        <h1>Share the source.<br /><em>Keep each list owned.</em></h1>
        <p className="release-lead">One immutable collection alias can now drive multiple keyed lists, while ordinary child callbacks and refs retain explicit one-boundary ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.19">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2+</strong><span>Alias list sites</span></div>
        <div><strong>1</strong><span>Owned boundary</span></div>
        <div><strong>107/107</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Reuse the pipeline.<br />Preserve each identity.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ALIASES</span><h3>Multiple list sites</h3><p>One immutable local collection alias may feed multiple keyed maps.</p></article>
          <article><span>PROOF</span><h3>Every use analyzed</h3><p>Mixed non-collection reads fail at their source instead of becoming stale values.</p></article>
          <article><span>IDENTITY</span><h3>Independent keyed DOM</h3><p>Each list preserves its own elements through insertion, reorder, and removal.</p></article>
          <article><span>CALLBACKS</span><h3>One direct boundary</h3><p>Setter callbacks forward into a same-file or imported child's intrinsic event.</p></article>
          <article><span>REFS</span><h3>Conditional ownership</h3><p>Removal resolves object refs to null; remount points them at fresh elements.</p></article>
          <article><span>OUTPUT</span><h3>No component runtime</h3><p>Descriptors remain compiler-owned without hydration or retained instances.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Reuse collections safely.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.19</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.19 - Reusable collection aliases</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.19">GitHub release</a>
    </footer>
  </>
}
