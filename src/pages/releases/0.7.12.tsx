export const metadata = {
  title: "Kudzu 0.7.12 - Exported row reuse",
  description: "Kudzu 0.7.12 specializes directly exported same-file rows reused across static and keyed JSX sites without browser component functions.",
  url: "https://kudzujs.cloud/releases/0.7.12",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.12 exported row reuse",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.12">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.12</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">EXPORTED ROW REUSE</p>
        <h1>Export the row.<br /><em>Reuse the shape.</em></h1>
        <p className="release-lead">Directly exported row components now remain reusable source across static and keyed JSX sites while every call still disappears into intrinsic browser output.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.12">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Browser components</span></div>
        <div><strong>2</strong><span>Direct export forms</span></div>
        <div><strong>95/95</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Reusable source.<br />Specialized calls.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FUNCTION</span><h3>Direct declarations</h3><p>Exported function rows retain ordinary TypeScript component authoring.</p></article>
          <article><span>CONST</span><h3>Function values</h3><p>Exported arrow and function-valued constants specialize through the same path.</p></article>
          <article><span>STATIC</span><h3>Ordinary reuse</h3><p>The same row may render at a static JSX site without leaving a component runtime.</p></article>
          <article><span>KEYED</span><h3>Stable identity</h3><p>Multiple keyed sites retain existing update, reorder, and removal semantics.</p></article>
          <article><span>OUTPUT</span><h3>Intrinsic browser DOM</h3><p>Component names and functions remain confined to build-time modules.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Static boundary</h3><p>Dynamic aliases and non-JSX references still fail at their source.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep reusable rows exported.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.12</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.12 - Exported row reuse</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.12">GitHub release</a>
    </footer>
  </>
}
