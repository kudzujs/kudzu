export const metadata = {
  title: "Kudzu 0.7.25 - Router-shaped native navigation",
  description: "Kudzu 0.7.25 lowers supported React Router useNavigate authoring to base-aware native document navigation without a router runtime.",
  url: "https://kudzujs.cloud/releases/0.7.25",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.25 router-shaped native navigation",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#navigation">Routing guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.25">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.25</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ROUTER-SHAPED NATIVE NAVIGATION</p>
        <h1>Call navigate.<br /><em>Leave the router behind.</em></h1>
        <p className="release-lead">Familiar imperative navigation source now becomes a base-aware native document load, without React Router, hydration, or an SPA runtime.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.25">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Native navigation modes</span></div>
        <div><strong>0 B</strong><span>On static destinations</span></div>
        <div><strong>117/117</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Keep the call.<br />Use the platform.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Top-level binding</h3><p>Named or aliased useNavigate initializes one ordinary component local.</p></article>
          <article><span>PUSH</span><h3>Native assign</h3><p>Static destinations lower directly to globalThis.location.assign.</p></article>
          <article><span>REPLACE</span><h3>Native replace</h3><p>Exactly replace true lowers directly to globalThis.location.replace.</p></article>
          <article><span>BASE</span><h3>Deployment aware</h3><p>Configured base prefixes paths while preserving query and fragment data.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Unsafe shapes stop</h3><p>Dynamic, relative, aliased, and option-heavy calls fail at their source.</p></article>
          <article><span>EXCLUSION</span><h3>Static stays static</h3><p>Destination documents gain no JavaScript from the navigation source.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Navigate without carrying a router.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.25</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.25 - Router-shaped native navigation</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.25">GitHub release</a>
    </footer>
  </>
}
