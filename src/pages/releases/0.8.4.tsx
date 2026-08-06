export const metadata = {
  title: "Kudzu 0.8.4 - Browser-native handlers",
  description: "Kudzu 0.8.4 keeps standard browser globals in named event-handler ESM instead of SSR capture scope.",
  url: "https://kudzujs.cloud/releases/0.8.4",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.4 browser-native handlers",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#events">Event handlers</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.4">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.4</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">BROWSER-NATIVE HANDLERS</p>
        <h1>Keep globals.<br /><em>In the browser.</em></h1>
        <p className="release-lead">Named handlers now leave local storage, file readers, and alerts in route-specific browser ESM instead of SSR capture scope.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.4">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Browser globals</span></div>
        <div><strong>0</strong><span>New runtimes</span></div>
        <div><strong>133/133</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Browser APIs stay native.<br />Static rendering stays deterministic.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STORAGE</span><h3>Local backup data</h3><p>Named handlers read and remove local storage only after browser events.</p></article>
          <article><span>FILES</span><h3>Native file import</h3><p>FileReader construction remains in the generated handler module.</p></article>
          <article><span>FEEDBACK</span><h3>Native alerts</h3><p>Import failures can use the browser alert global without SSR capture.</p></article>
          <article><span>MIGRATION</span><h3>FrugalHQ proven</h3><p>Real backup export, import, and reset handlers now compile successfully.</p></article>
          <article><span>OUTPUT</span><h3>No new runtime</h3><p>The existing route-specific native-handler path does all the work.</p></article>
          <article><span>STATIC</span><h3>Node stays clean</h3><p>Static rendering never evaluates the browser-only globals.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep browser handlers ordinary.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.4</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.4 - Browser-native handlers</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.4">GitHub release</a>
    </footer>
  </>
}
