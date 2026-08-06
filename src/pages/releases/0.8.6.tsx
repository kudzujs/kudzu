export const metadata = {
  title: "Kudzu 0.8.6 - Responsive list reversals",
  description: "Kudzu 0.8.6 keeps keyed-list fast-path bookkeeping current across repeated reverse and removal actions.",
  url: "https://kudzujs.cloud/releases/0.8.6",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.6 responsive list reversals",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Keyed lists</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.6">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.6</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">RESPONSIVE LIST REVERSALS</p>
        <h1>Reverse now.<br /><em>Reverse again.</em></h1>
        <p className="release-lead">Keyed-list fast paths now keep their logical baseline aligned with every DOM reorder and removal.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.6">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3×</strong><span>Rapid reversals</span></div>
        <div><strong>0</strong><span>Remounted rows</span></div>
        <div><strong>134/134</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Current order retained.<br />Immediate actions restored.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>REVERSE</span><h3>Fresh baseline</h3><p>Every reverse records the latest logical order after moving keyed nodes.</p></article>
          <article><span>REMOVE</span><h3>Current survivors</h3><p>Single-item removal records its remaining collection before returning.</p></article>
          <article><span>INPUT</span><h3>No artificial wait</h3><p>Each subsequent action observes the prior microtask commit immediately.</p></article>
          <article><span>IDENTITY</span><h3>Rows stay mounted</h3><p>Existing nodes move in place and preserve uncontrolled descendant state.</p></article>
          <article><span>REGRESSION</span><h3>Three rapid moves</h3><p>Chrome verifies reverse, restore, and repeat without a timer delay.</p></article>
          <article><span>ARCHITECTURE</span><h3>Same direct DOM path</h3><p>No VDOM, hydration, or component runtime was introduced.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep repeated list actions immediate.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.6</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.6 - Responsive list reversals</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.6">GitHub release</a>
    </footer>
  </>
}
