export const metadata = {
  title: "Kudzu 0.16.10 - Apache Answer authentication journey",
  description: "Kudzu 0.16.10 proves Apache Answer login, restoration, shared session state, and 401 replacement navigation without changing browser output.",
  url: "https://kudzujs.cloud/releases/0.16.10",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.10 Apache Answer authentication journey",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.10">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.10</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">NATIVE LOGIN · OWNED SESSION · ZERO NEW RUNTIME</p>
        <h1>Authenticate normally.<br /><em>Own every transition.</em></h1>
        <p className="release-lead">Apache Answer's reduced session path now passes its complete browser journey against a deterministic server using existing state, effects, storage, fetch, and navigation.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the journey</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.10">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>7</strong><span>Auth transitions</span></div>
        <div><strong>0 B</strong><span>Public route JS</span></div>
        <div><strong>0</strong><span>New runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.10</span><div><p>CONNECTED AUTHENTICATION</p><h2>Prove the journey.<br />Keep native ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>ANONYMOUS</span><h3>Start without a token</h3><p>The mount effect clears the deterministic loading fallback into anonymous state.</p></article>
          <article><span>LOGIN</span><h3>Submit native forms</h3><p>Invalid and valid credentials exercise application-owned error and session state.</p></article>
          <article><span>STORAGE</span><h3>Restore after reload</h3><p>A persisted token is validated before shared user state is restored.</p></article>
          <article><span>LAYOUT</span><h3>Share one session</h3><p>Header and settings consumers read the same layout-owned package-neutral record.</p></article>
          <article><span>401</span><h3>Expire safely</h3><p>The server rejection clears token and state before replacement navigation.</p></article>
          <article><span>OUTPUT</span><h3>Add no browser code</h3><p>The fixture, compiler, runtime, and deploy artifacts remain unchanged.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep authentication server-authoritative.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.10</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.10 - Apache Answer authentication journey</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.10">GitHub release</a></footer>
  </>
}
