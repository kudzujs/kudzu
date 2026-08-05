export const metadata = {
  title: "Kudzu 0.7.30 - Reactive number formatting",
  description: "Kudzu 0.7.30 keeps fixed-locale Intl.NumberFormat display values reactive without adding a formatting runtime.",
  url: "https://kudzujs.cloud/releases/0.7.30",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.30 reactive number formatting",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.30">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.30</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">REACTIVE NUMBER FORMATTING</p>
        <h1>Keep the number live.<br /><em>Format the output.</em></h1>
        <p className="release-lead">Controlled numeric inputs can keep familiar locale formatting while Kudzu binds the native expression directly to its source state.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.30">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>100,000</strong><span>Annual display</span></div>
        <div><strong>8,333</strong><span>Monthly display</span></div>
        <div><strong>123/123</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Native formatting.<br />Direct updates.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>INTL</span><h3>Static locales</h3><p>Literal locale NumberFormat chains compile as reactive display expressions.</p></article>
          <article><span>HTML</span><h3>Formatted from build</h3><p>Initial documents contain the same comma-formatted value users see.</p></article>
          <article><span>BINDING</span><h3>State stays live</h3><p>Existing route ESM reevaluates the native expression after each source change.</p></article>
          <article><span>BOUNDARY</span><h3>Dynamic locales stop</h3><p>Runtime locale selection and options remain explicit unsupported forms.</p></article>
          <article><span>OUTPUT</span><h3>No formatter runtime</h3><p>No shared capability, selector opcode, VDOM, or hydration is introduced.</p></article>
          <article><span>MIGRATION</span><h3>CurrencyInput restored</h3><p>FIRE annual and monthly values regain their original comma formatting.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep readable numbers reactive.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.30</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.30 - Reactive number formatting</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.30">GitHub release</a>
    </footer>
  </>
}
