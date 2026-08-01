export const metadata = {
  title: "Kudzu 0.7.5 - Class composition migration",
  description: "Kudzu 0.7.5 compiles common clsx calls to static and reactive classes without shipping the package runtime.",
  url: "https://kudzujs.cloud/releases/0.7.5",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.5 class composition migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#attributes">Attribute guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.5">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.5</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CLASS COMPOSITION MIGRATION</p>
        <h1>Compose the class.<br /><em>Drop the runtime.</em></h1>
        <p className="release-lead">Common clsx calls now lower to ordinary static and reactive class expressions instead of becoming a serialized browser dependency.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.5">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>clsx browser runtime</span></div>
        <div><strong>0</strong><span>React type imports emitted</span></div>
        <div><strong>86/86</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Package-shaped source.<br />Native class output.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>IMPORTS</span><h3>Direct clsx calls</h3><p>Default and named imports are recognized and removed during compilation.</p></article>
          <article><span>OBJECTS</span><h3>Conditional classes</h3><p>Literal object conditions become ordinary conditional string expressions.</p></article>
          <article><span>ARRAYS</span><h3>Literal composition</h3><p>Nested literal arrays and conditional values lower without a helper runtime.</p></article>
          <article><span>REACTIVE</span><h3>Existing bindings</h3><p>State-driven classes continue through Kudzu's direct attribute patching path.</p></article>
          <article><span>TYPES</span><h3>Clean React erasure</h3><p>Mixed type-only React specifiers disappear before runtime import rewriting.</p></article>
          <article><span>STATIC</span><h3>Zero stays zero</h3><p>Static class composition adds no browser JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the helper syntax, not the helper.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.5</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.5 - Class composition migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.5">GitHub release</a>
    </footer>
  </>
}
