export const metadata = {
  title: "Kudzu 0.8.47 - Direct primitive prop state",
  description: "Kudzu 0.8.47 initializes specialized child state directly from a primitive parent state prop while retaining independent ownership and existing browser capabilities.",
  url: "https://kudzujs.cloud/releases/0.8.47",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.47 direct primitive prop state",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.47">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.47</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">LINK · SEED · OWN</p>
        <h1>Pass primitive state.<br /><em>Initialize children directly.</em></h1>
        <p className="release-lead">Specialized children can initialize local state from one direct primitive parent prop. Kudzu reads the build-known value while preserving independent child ownership and the parent signal relationship.</p>
        <div className="release-links">
          <a className="primary-action" href="#primitive-props">Inspect the dataflow</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.47/PERFORMANCE.md#current-0847-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Direct primitive prop</span></div>
        <div><strong>2</strong><span>Independent state IDs</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
      </section>

      <section className="release-section" id="primitive-props">
        <div className="release-section-heading"><span>P1</span><div><p>PROP DATAFLOW</p><h2>Read the build value.<br />Keep structural ownership.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Use state directly</h3><p>A specialized child may write useState(value) when value is one direct primitive parent state prop.</p></article>
          <article><span>PROOF</span><h3>Require primitive input</h3><p>The compiler verifies the parent state has a build-known string, number, boolean, null, or undefined initializer.</p></article>
          <article><span>SEED</span><h3>Store JSON-safe data</h3><p>Build scratch reads the parent signal value so RouteIR receives a serializable child initial value.</p></article>
          <article><span>OWNERSHIP</span><h3>Keep states independent</h3><p>Parent and child retain separate IDs while handlers and effects preserve structural prop links.</p></article>
          <article><span>BOUNDARY</span><h3>Reject wider shapes</h3><p>Object/array props, aliases, composed expressions, and arbitrary initializers remain source-diagnosed.</p></article>
          <article><span>OUTPUT</span><h3>Ship existing capabilities</h3><p>No component runtime, hydration, state library, or browser module is added.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep controlled child initialization ordinary.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.47</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.47 - Direct primitive prop state</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.47">GitHub release</a>
    </footer>
  </>
}
