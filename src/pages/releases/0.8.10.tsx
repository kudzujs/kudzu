export const metadata = {
  title: "Kudzu 0.8.10 - Native dialog migration",
  description: "Kudzu 0.8.10 proves a source migration path from shadcn and Radix-shaped dialog components to the native dialog element.",
  url: "https://kudzujs.cloud/releases/0.8.10",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.10 native dialog migration",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.10">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.10</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">NATIVE DIALOG MIGRATION</p>
        <h1>Replace the portal.<br /><em>Use the platform.</em></h1>
        <p className="release-lead">A shadcn/Radix-shaped dialog now demonstrates how migration can preserve familiar React-shaped source while removing the package runtime in favor of native dialog behavior.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.10">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Native event types</span></div>
        <div><strong>0</strong><span>React or Radix bytes</span></div>
        <div><strong>140/140</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar source retained.<br />Package runtime removed.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>React-shaped boundary</h3><p><code>forwardRef</code>, props, children, refs, and JSX handlers remain ordinary source.</p></article>
          <article><span>NATIVE</span><h3>Platform modal</h3><p><code>showModal()</code>, <code>close()</code>, and cancel behavior replace Portal machinery.</p></article>
          <article><span>FOCUS</span><h3>Accessible ownership</h3><p>Labeling, initial focus, and explicit trigger restoration are browser-verified.</p></article>
          <article><span>OUTPUT</span><h3>Capability-specific ESM</h3><p>Complete HTML ships with only the route's click and cancel handlers.</p></article>
          <article><span>MOBILE</span><h3>Contained docs code</h3><p>Documentation code blocks now scroll instead of widening mobile pages.</p></article>
          <article><span>BOUNDARY</span><h3>No package emulation</h3><p>Portal, Slot, cloning, and compound Context remain source migration work.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Migrate the component. Remove the runtime.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.10</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.10 - Native dialog migration</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.10">GitHub release</a>
    </footer>
  </>
}
