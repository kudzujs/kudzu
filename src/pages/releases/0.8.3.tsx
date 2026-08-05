export const metadata = {
  title: "Kudzu 0.8.3 - Native interaction composition",
  description: "Kudzu 0.8.3 composes clipboard, debounce, and accessible SVG point interactions from existing route capabilities.",
  url: "https://kudzujs.cloud/releases/0.8.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.3 native interaction composition",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#events">Migration guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.3">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">NATIVE INTERACTION COMPOSITION</p>
        <h1>Use the platform.<br /><em>Keep ownership explicit.</em></h1>
        <p className="release-lead">Clipboard, debounce, and selected-point SVG tooltips reuse Kudzu's existing event, effect, binding, and keyed-list paths.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.3">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Native patterns</span></div>
        <div><strong>0</strong><span>Dedicated runtimes</span></div>
        <div><strong>133/133</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Ordinary browser APIs.<br />Existing compiler ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>CLIPBOARD</span><h3>Native copy actions</h3><p>Async handlers keep permission feedback in application-owned state.</p></article>
          <article><span>DEBOUNCE</span><h3>Effect-owned timers</h3><p>Direct cleanup cancels stale work on dependency changes and unmount.</p></article>
          <article><span>SVG</span><h3>Accessible selection</h3><p>Focus, click, Space, and Enter update an external HTML tooltip.</p></article>
          <article><span>IDENTITY</span><h3>Latest keyed points</h3><p>Retained SVG nodes keep identity while handlers read updated labels.</p></article>
          <article><span>OUTPUT</span><h3>No dedicated runtime</h3><p>Existing route-specific event, effect, binding, and list ESM does the work.</p></article>
          <article><span>STATIC</span><h3>Zero-cost siblings</h3><p>Unaffected static routes continue to emit complete HTML without JavaScript.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep native interactions ordinary.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.3</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.3 - Native interaction composition</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.3">GitHub release</a>
    </footer>
  </>
}
