export const metadata = {
  title: "Kudzu 0.13.2 - Multistep draft and autosave",
  description: "Kudzu 0.13.2 composes native step validation, versioned draft persistence, debounced saves, stale-write rejection, conflict retention, and reset without a wizard runtime.",
  url: "https://kudzujs.cloud/releases/0.13.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.13.2 multistep draft and autosave",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.13.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STEPS · VERSIONS · OWNED EFFECTS</p>
        <h1>Keep the draft.<br /><em>Reject the stale save.</em></h1>
        <p className="release-lead">Native validation, conditional steps, versioned storage, debounced server writes, conflict retention, and reset compose from ordinary route state and owned effects.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the lifecycle</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Autosave schedulers</span></div>
        <div><strong>17</strong><span>Session JS files</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.13.2</span><div><p>DRAFT OWNERSHIP</p><h2>Persist the values.<br />Keep the lifecycle local.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>VALIDATE</span><h3>Use native constraints</h3><p>The first step stays put and focuses its required control before navigation.</p></article>
          <article><span>PERSIST</span><h3>Version the draft</h3><p>Guarded local storage restores values and the current step after navigation or reload.</p></article>
          <article><span>DEBOUNCE</span><h3>Clean up the timer</h3><p>One dependency effect cancels replaced work and sends only the latest owned version.</p></article>
          <article><span>REJECT</span><h3>Drop stale completion</h3><p>Older server versions and late effect writes cannot replace the current draft.</p></article>
          <article><span>RETAIN</span><h3>Surface the conflict</h3><p>Accessible conflict state keeps every current value available for recovery.</p></article>
          <article><span>RESET</span><h3>Clear every owner</h3><p>State, status, version, storage, and pending debounce return to one known baseline.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep persistence application-owned.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.13.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.13.2 - Multistep draft and autosave</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.2">GitHub release</a></footer>
  </>
}
