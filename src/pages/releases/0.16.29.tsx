export const metadata = {
  title: "Kudzu 0.16.29 - Unused runtime exclusion",
  description: "Kudzu 0.16.29 excludes unused style serialization and conditional DOM ownership from route-specific JavaScript.",
  url: "https://kudzujs.cloud/releases/0.16.29",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.29 unused runtime exclusion",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.29">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.29</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">EXISTING SEMANTICS / FEWER UNUSED CAPABILITIES</p>
        <h1>Keep the behavior.<br /><em>Drop unused code.</em></h1>
        <p className="release-lead">Route families now omit style serialization and conditional ownership when no owner needs them. Ordinary components, reactive bindings and navigation keep their existing semantics.</p>
        <div className="release-links"><a className="primary-action" href="/docs#build">Read the build reference</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.29">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Measured fixture savings">
        <div><strong>1,202 B</strong><span>unused style graph removed from search</span></div>
        <div><strong>1,399 B</strong><span>unused conditional code removed from bindings</span></div>
        <div><strong>0</strong><span>new runtime concepts or dependencies</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.29</span><div><p>UNUSED RUNTIME EXCLUSION</p><h2>One family.<br />Only required capabilities.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STYLE</span><h3>Serializer only when used</h3><p>Existing binding targets and list-style facts determine whether the runtime family needs style serialization. Dynamic-style pages preserve their serializer and updates.</p></article>
          <article><span>CONDITIONS</span><h3>Branches only when used</h3><p>Text and attribute bindings without structural branches omit conditional registries, template hooks and branch update/release work. Any conditional owner in a shared family retains that capability.</p></article>
          <article><span>VERIFICATION</span><h3>Ownership remains intact</h3><p>Regression fixtures cover styles, conditional replacement, keyed identity, navigation and script-free siblings. Capability-family hashes change intentionally with the new specialization facts.</p></article>
          <article><span>EVIDENCE</span><h3>Measured bytes, honest limits</h3><p>These are deploy-byte savings, not measured AI-cost or latency superiority. Browser and Astro comparison tools remain repository-only; historical attempts are preserved and 1.0.0 remains blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Ship only required capabilities.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.29</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.29 - Unused runtime exclusion</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.29">GitHub release</a></footer>
  </>
}
