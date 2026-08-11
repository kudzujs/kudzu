export const metadata = {
  title: "Kudzu 0.8.31 - Async native-handler ownership",
  description: "Kudzu 0.8.31 invalidates pending async native handlers when route, keyed, or conditional DOM ownership is released.",
  url: "https://kudzujs.cloud/releases/0.8.31",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.31 async native-handler ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#events">Event handlers</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.31">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.31</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">START · RELEASE · IGNORE</p>
        <h1>Let async work finish.<br /><em>Drop stale ownership.</em></h1>
        <p className="release-lead">Pending event work can resolve naturally, but state writes, queued commits, and object refs stop at the DOM lifetime that created them.</p>
        <div className="release-links">
          <a className="primary-action" href="#ownership">See the ownership guard</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.31/PERFORMANCE.md#0831-async-native-handler-ownership">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Ownership exits covered</span></div>
        <div><strong>6.4 ms</strong><span>Both sync medians</span></div>
        <div><strong>189/189</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="ownership">
        <div className="release-section-heading"><span>04</span><div><p>NATIVE OWNERSHIP</p><h2>Release the listener.<br />Invalidate its work.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ROUTES</span><h3>Navigation ends writes</h3><p>Outgoing route handlers cannot recreate state or update replacement route DOM after enhanced navigation.</p></article>
          <article><span>KEYS</span><h3>Removed rows stay fresh</h3><p>A late keyed-row handler cannot alter a newly added row that reuses the same key and ownership IDs.</p></article>
          <article><span>STATE</span><h3>Setters become no-ops</h3><p>Direct and captured setters check the mounted registration before mutating browser state.</p></article>
          <article><span>COMMITS</span><h3>Queued writes are cleared</h3><p>A microtask scheduled before unmount drops its commit. The measured correctness cost is 94 B aggregate gzip.</p></article>
          <article><span>REFS</span><h3>Replacement nodes stay isolated</h3><p>Captured object refs resolve to null after release instead of finding a new node with the same compiler ID.</p></article>
          <article><span>NEXT</span><h3>Build output safety</h3><p>P0.5 stages and validates output before replacing the previous successful build with rollback protection.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ordinary async handlers. Keep ownership exact.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.31</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.31 - Async native-handler ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.31">GitHub release</a>
    </footer>
  </>
}
