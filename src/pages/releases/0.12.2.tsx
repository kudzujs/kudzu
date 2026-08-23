export const metadata = {
  title: "Kudzu 0.12.2 - Authentication and permission boundary",
  description: "Kudzu 0.12.2 proves native login, token restoration, role-aware UI, server authorization, rejection recovery, and logout without an auth runtime.",
  url: "https://kudzujs.cloud/releases/0.12.2",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.12.2 authentication and permission boundary",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.2">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.12.2</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SESSION · PERMISSION · RELEASE</p>
        <h1>Show the role.<br /><em>Enforce the boundary.</em></h1>
        <p className="release-lead">Native login and layout-owned session state now compose with server-authorized reads, mutations, rejection recovery, and logout.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect authentication</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.2">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1.4 ms</strong><span>Navigation median</span></div>
        <div><strong>432 B</strong><span>Added session gzip</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.12.2</span><div><p>AUTH OWNERSHIP</p><h2>Own the session.<br />Authorize the action.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FORM</span><h3>Use native login</h3><p>Constraint-backed email and password fields feed one application-owned async handler.</p></article>
          <article><span>RESTORE</span><h3>Validate stored tokens</h3><p>The shared layout restores identity only after the server accepts the token.</p></article>
          <article><span>ROLE</span><h3>Shape the interface</h3><p>Admin controls follow authenticated role state without pretending UI is security.</p></article>
          <article><span>SERVER</span><h3>Authorize every action</h3><p>Protected reads reject missing tokens and mutations reject insufficient roles.</p></article>
          <article><span>REJECT</span><h3>Clear invalid sessions</h3><p>A 401 removes the stored token before replacement navigation returns to login.</p></article>
          <article><span>LOGOUT</span><h3>End both owners</h3><p>Server logout and local state cleanup complete before the next document.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep authorization server-owned.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.12.2</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.12.2 - Authentication and permission boundary</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.2">GitHub release</a></footer>
  </>
}
