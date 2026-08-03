export const metadata = {
  title: "Kudzu 0.7.18 - Primitive child prop dependencies",
  description: "Kudzu 0.7.18 keeps direct primitive parent state reactive across ordinary child DOM bindings and effect dependencies without a browser component tree.",
  url: "https://kudzujs.cloud/releases/0.7.18",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.18 primitive child prop dependencies",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Component guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.18">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.18</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PRIMITIVE CHILD PROP DEPENDENCIES</p>
        <h1>Pass the signal.<br /><em>Keep the child ordinary.</em></h1>
        <p className="release-lead">Direct primitive parent state now has an explicit supported contract through same-file and imported child bindings, effects, and conditional ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.18">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Browser components</span></div>
        <div><strong>3</strong><span>Ownership paths</span></div>
        <div><strong>106/106</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>One parent signal.<br />Direct child updates.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>PROPS</span><h3>Destructured primitives</h3><p>A direct primitive parent state remains a signal after ordinary child prop destructuring.</p></article>
          <article><span>BINDINGS</span><h3>Direct DOM patches</h3><p>Child text and attributes update through the existing parent state ID.</p></article>
          <article><span>EFFECTS</span><h3>Dependency continuity</h3><p>Child effects clean up and rerun when the shared primitive dependency changes.</p></article>
          <article><span>REPEAT</span><h3>Independent effects</h3><p>Repeated calls share state while retaining distinct effect records and captures.</p></article>
          <article><span>CONDITIONS</span><h3>Owned lifecycle</h3><p>Conditional mount creates the effect and removal cleans it up exactly once.</p></article>
          <article><span>OUTPUT</span><h3>No component runtime</h3><p>React and child component functions remain absent from browser assets.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep primitive props reactive.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.18</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.18 - Primitive child prop dependencies</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.18">GitHub release</a>
    </footer>
  </>
}
