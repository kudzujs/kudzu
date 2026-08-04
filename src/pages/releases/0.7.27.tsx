export const metadata = {
  title: "Kudzu 0.7.27 - Stateful component migration",
  description: "Kudzu 0.7.27 compiles hookful setter-adapter components, prop-synchronized drafts, and derived JSX locals without a browser component runtime.",
  url: "https://kudzujs.cloud/releases/0.7.27",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.27 stateful component migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.27">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.27</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATEFUL COMPONENT MIGRATION</p>
        <h1>Keep the hooks.<br /><em>Lose the runtime.</em></h1>
        <p className="release-lead">Controlled React-shaped inputs can keep local state, IDs, refs, effects, and derived render values while Kudzu emits only static HTML and the route capabilities they use.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.27">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>4</strong><span>Child hooks specialized</span></div>
        <div><strong>0</strong><span>Browser component runtime</span></div>
        <div><strong>121/121</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Own the state.<br />Erase the component.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STATE</span><h3>Local input drafts</h3><p>Setter-adapter children own serializable state and direct primitive prop string initializers.</p></article>
          <article><span>IDENTITY</span><h3>IDs and object refs</h3><p>Build-time IDs and null-initialized refs retain direct DOM ownership.</p></article>
          <article><span>EFFECTS</span><h3>Cleanup stays scoped</h3><p>Dependencies, cleanup, and remount reuse existing route-specific effect capabilities.</p></article>
          <article><span>LIFECYCLE</span><h3>Fresh on remount</h3><p>Conditional removal releases state and refs before recreating synchronized ownership.</p></article>
          <article><span>RENDERING</span><h3>Derived locals bind</h3><p>Pure immutable expression chains compile into direct text and attribute updates.</p></article>
          <article><span>MIGRATION</span><h3>FIRE age input</h3><p>A conventional controlled input now keeps draft, blur, effect, and parent update behavior.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep familiar components. Ship direct capabilities.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.27</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.27 - Stateful component migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.27">GitHub release</a>
    </footer>
  </>
}
