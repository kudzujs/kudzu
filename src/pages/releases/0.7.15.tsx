export const metadata = {
  title: "Kudzu 0.7.15 - Child state ownership",
  description: "Kudzu 0.7.15 gives repeated ordinary child components independent state and resets conditional child state on remount without a browser component tree.",
  url: "https://kudzujs.cloud/releases/0.7.15",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.15 child state ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#state">State guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.15">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.15</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CHILD STATE OWNERSHIP</p>
        <h1>Repeat the child.<br /><em>Keep state independent.</em></h1>
        <p className="release-lead">Ordinary same-file and imported children now prove independent state across repeated calls, while conditional removal releases owned slots and remount starts fresh.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.15">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Browser components</span></div>
        <div><strong>4</strong><span>Ownership checks</span></div>
        <div><strong>102/102</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Independent calls.<br />Fresh remounts.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>REPEAT</span><h3>Distinct state IDs</h3><p>Every ordinary child invocation receives its own concrete slots.</p></article>
          <article><span>IMPORTS</span><h3>Shared handler, isolated state</h3><p>Relative children reuse generated code while each element carries its own state map.</p></article>
          <article><span>CONDITIONS</span><h3>Branch ownership</h3><p>Descriptors record only state created directly by their branch.</p></article>
          <article><span>UNMOUNT</span><h3>Slots released</h3><p>Removing conditional DOM deletes its owned logical state after capability cleanup.</p></article>
          <article><span>REMOUNT</span><h3>Initial values restored</h3><p>Re-entry clones serialized object state or restores primitive initializers.</p></article>
          <article><span>OUTPUT</span><h3>No component runtime</h3><p>Static routes stay script-free and browser assets contain no component tree.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Let each child own its state.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.15</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.15 - Child state ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.15">GitHub release</a>
    </footer>
  </>
}
