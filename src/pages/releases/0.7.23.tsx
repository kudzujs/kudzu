export const metadata = {
  title: "Kudzu 0.7.23 - Router-shaped runtime params",
  description: "Kudzu 0.7.23 redirects supported React Router useParams authoring to its existing route-specific pathname reader.",
  url: "https://kudzujs.cloud/releases/0.7.23",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.23 router-shaped runtime params",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#navigation">Routing guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.23">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.23</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ROUTER-SHAPED RUNTIME PARAMS</p>
        <h1>Keep route source.<br /><em>Drop the router.</em></h1>
        <p className="release-lead">Familiar useParams calls now feed Kudzu's existing pathname capability, preserving route behavior without React Router or a client component tree.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.23">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Existing path reader</span></div>
        <div><strong>0 B</strong><span>Router runtime</span></div>
        <div><strong>112/112</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Preserve the call shape.<br />Reuse the capability.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORTS</span><h3>Named or aliased</h3><p>Conventional useParams bindings redirect to Kudzu core.</p></article>
          <article><span>TYPES</span><h3>Generic preserved</h3><p>One TypeScript parameter survives normalization and erases at compile time.</p></article>
          <article><span>PATHNAME</span><h3>Existing reader</h3><p>Secure segment decoding and route-specific initialization remain unchanged.</p></article>
          <article><span>COMPOSITION</span><h3>Link plus params</h3><p>One router import can lower native links and runtime params together.</p></article>
          <article><span>LIFECYCLE</span><h3>Existing ownership</h3><p>Bindings, effects, handlers, and navigation groups receive the same signals.</p></article>
          <article><span>BOUNDARY</span><h3>Direct calls only</h3><p>Indirect references and runtime arguments fail at their source location.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the route shape, not the router runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.23</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.23 - Router-shaped runtime params</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.23">GitHub release</a>
    </footer>
  </>
}
