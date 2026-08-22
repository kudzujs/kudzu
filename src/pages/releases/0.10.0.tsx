export const metadata = {
  title: "Kudzu 0.10.0 - Application capability baseline",
  description: "Kudzu 0.10.0 begins the application capability release train with a tracked greenfield state, browser, output, and static zero-JavaScript contract.",
  url: "https://kudzujs.cloud/releases/0.10.0",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.10.0 application capability baseline",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.0">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.10.0</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">MODEL · BUILD · VERIFY</p>
        <h1>Prove the application.<br /><em>Then extend the compiler.</em></h1>
        <p className="release-lead">A durable project-management application now anchors each application capability, React migration, browser output, and AI delivery decision.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the baseline</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.0">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>New runtime concepts</span></div>
        <div><strong>3</strong><span>Greenfield routes</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.10.0</span><div><p>APPLICATION BASELINE</p><h2>Fix the contract.<br />Grow one journey at a time.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>APP</span><h3>Track one greenfield surface</h3><p>Login, projects, and help routes start a durable project-management application.</p></article>
          <article><span>STATE</span><h3>Reuse existing semantics</h3><p>One primitive state command updates direct text with no handler module.</p></article>
          <article><span>STATIC</span><h3>Keep the zero-JS control</h3><p>The help route remains complete HTML with no client assets.</p></article>
          <article><span>BROWSER</span><h3>Test the real journey</h3><p>Required Chrome verifies the authored interaction instead of build output alone.</p></article>
          <article><span>OUTPUT</span><h3>Freeze route evidence</h3><p>Capabilities, files, bytes, and deploy digest are machine-recorded.</p></article>
          <article><span>PLAN</span><h3>Release by capability</h3><p>Each application section owns a minor and each accepted packet owns a patch.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Build from an executable application contract.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.10.0</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.10.0 - Application capability baseline</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.10.0">GitHub release</a></footer>
  </>
}
