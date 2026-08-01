export const metadata = {
  title: "Kudzu 0.7.6 - Zustand-shaped shared stores",
  description: "Kudzu 0.7.6 compiles reduced Zustand stores to persistent shared-layout state without shipping React or Zustand.",
  url: "https://kudzujs.cloud/releases/0.7.6",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.6 Zustand-shaped shared stores",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#state">State guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.6">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.6</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ZUSTAND-SHAPED SHARED STORES</p>
        <h1>Keep the store.<br /><em>Drop the runtime.</em></h1>
        <p className="release-lead">Reduced Zustand authoring now becomes one persistent application-layout state slot and direct action updates instead of a browser store runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.6">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Zustand browser runtime</span></div>
        <div><strong>1</strong><span>Layout state slot</span></div>
        <div><strong>89/89</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar store source.<br />Layout-owned state.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CREATE</span><h3>Reduced store shape</h3><p>One exported create initializer becomes one serializable layout state slot.</p></article>
          <article><span>SELECT</span><h3>Direct properties</h3><p>Data and action selectors bind to existing state and handler capabilities.</p></article>
          <article><span>ACTIONS</span><h3>Synchronous updates</h3><p>Capture-free set actions inline as functional updates with current logical state.</p></article>
          <article><span>NAVIGATION</span><h3>Shared lifetime</h3><p>Same-group route changes preserve both the store and layout DOM identity.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Narrow boundary</h3><p>Derived selectors and unsupported store or action forms fail with source locations.</p></article>
          <article><span>OUTPUT</span><h3>No package runtime</h3><p>React and Zustand imports are absent from the generated deploy graph.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Share state, not a component tree.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.6</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.6 - Zustand-shaped shared stores</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.6">GitHub release</a>
    </footer>
  </>
}
