export const metadata = {
  title: "Kudzu 0.7.22 - SVG structures and native links",
  description: "Kudzu 0.7.22 adds reactive SVG structures and erases supported React Router Link authoring to base-aware native anchors.",
  url: "https://kudzujs.cloud/releases/0.7.22",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.22 SVG structures and native links",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#navigation">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.22">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.22</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SVG STRUCTURES AND NATIVE LINKS</p>
        <h1>Draw reactively.<br /><em>Navigate natively.</em></h1>
        <p className="release-lead">Conditional and keyed SVG output now keeps its real namespace, while familiar Link source becomes a base-aware anchor with no router runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.22">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>SVG structures</span></div>
        <div><strong>0 B</strong><span>Link runtime</span></div>
        <div><strong>111/111</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Keep familiar structure.<br />Ship native platform behavior.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CONDITIONS</span><h3>Reactive SVG branches</h3><p>Replacement nodes parse in the actual SVG parent context.</p></article>
          <article><span>COLLECTIONS</span><h3>Keyed SVG rows</h3><p>Flat intrinsic lists retain identity through add, update, reorder, and removal.</p></article>
          <article><span>NAMESPACE</span><h3>No SVG renderer</h3><p>Existing ownership handles SVG nodes after one contextual fragment parse.</p></article>
          <article><span>MIGRATION</span><h3>Link becomes anchor</h3><p>Named or aliased React Router Link JSX erases to native navigation.</p></article>
          <article><span>BASE PATHS</span><h3>Application-aware hrefs</h3><p>Static root-relative destinations receive the configured base.</p></article>
          <article><span>MEASURED</span><h3>Bounded overhead</h3><p>Fresh-profile browser runs and complete raw arrays document the cost.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Use the platform without rewriting the source.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.22</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.22 - SVG structures and native links</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.22">GitHub release</a>
    </footer>
  </>
}
