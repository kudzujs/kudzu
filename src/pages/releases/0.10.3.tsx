export const metadata = {
  title: "Kudzu 0.10.3 - Application-owned persistence",
  description: "Kudzu 0.10.3 proves guarded versioned Web Storage persistence using ordinary state and effects with no persistence runtime.",
  url: "https://kudzujs.cloud/releases/0.10.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.10.3 application-owned persistence",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.10.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">RESTORE · VALIDATE · RELEASE</p>
        <h1>Persist the value.<br /><em>Own the policy.</em></h1>
        <p className="release-lead">Versioned workspace persistence now composes from ordinary state, effects, and native storage without creating a framework persistence layer.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the recipe</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>21</strong><span>Fresh Chrome profiles</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.10.3</span><div><p>APPLICATION PERSISTENCE</p><h2>Guard the record.<br />Keep the runtime small.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FALLBACK</span><h3>Start deterministically</h3><p>Complete static HTML always begins from the authored Primary workspace.</p></article>
          <article><span>SCHEMA</span><h3>Accept exact values</h3><p>Only version-one records with a known workspace may replace the fallback.</p></article>
          <article><span>EFFECT</span><h3>Write after restore</h3><p>A readiness guard prevents initial state from racing the storage read.</p></article>
          <article><span>LOGOUT</span><h3>Clear synchronously</h3><p>One owned handler disables writes, removes storage, and resets visible state.</p></article>
          <article><span>OWNERSHIP</span><h3>Release local work</h3><p>Conditional, keyed, and route state still unmount and remount fresh.</p></article>
          <article><span>BOUNDARY</span><h3>Skip persistence APIs</h3><p>Keys, versions, validation, and policy remain explicit application code.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Persist without a persistence runtime.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.10.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.10.3 - Application-owned persistence</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.3">GitHub release</a></footer>
  </>
}
