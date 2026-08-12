export const metadata = {
  title: "Kudzu 0.8.38 - Structural route artifacts",
  description: "Kudzu 0.8.38 makes handler, effect, Worker, CSS, package-client, and chunk retention follow validated per-route artifact edges.",
  url: "https://kudzujs.cloud/releases/0.8.38",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.38 structural route artifacts",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.38">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.38</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ROUTE · EDGE · EMIT</p>
        <h1>Render the route.<br /><em>Follow its edges.</em></h1>
        <p className="release-lead">Every emitted route now carries one validated artifact record. Handler, Worker, CSS, package-client, and chunk selection follows structural references instead of searching serialized HTML and plans.</p>
        <div className="release-links">
          <a className="primary-action" href="#artifacts">Inspect the artifact graph</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.38/PERFORMANCE.md#p011-structural-route-artifact-graph">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>173</strong><span>Byte-identical deploy files</span></div>
        <div><strong>0</strong><span>Serialized artifact searches</span></div>
        <div><strong>200/200</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="artifacts">
        <div className="release-section-heading"><span>11</span><div><p>ARTIFACT GRAPH</p><h2>Routes declare reachability.<br />Builds follow structure.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>RECORDS</span><h3>One route, one build record</h3><p>RouteIR, capability facts, entry paths, styles, and handler/effect references validate together before emission.</p></article>
          <article><span>HANDLERS</span><h3>Only rendered descriptors retain code</h3><p>Events, effects, bindings, conditions, and keyed lists register exact handler edges when their final descriptors are emitted.</p></article>
          <article><span>WORKERS</span><h3>Effects own Worker reachability</h3><p>Worker references match structural module and handler fields without concatenated string identities.</p></article>
          <article><span>CLOSURE</span><h3>Packages and chunks follow roots</h3><p>Selected handler modules establish package-client compilation and bundler entry points without parallel route maps.</p></article>
          <article><span>PARITY</span><h3>Structure changes, output does not</h3><p>The complete deploy graph, raw and gzip bytes, plan, runtime source, and browser behavior remain unchanged.</p></article>
          <article><span>NEXT</span><h3>Validate RouteIR deeply</h3><p>P0.12 rejects invalid concrete state, effect, binding, list, ownership, and artifact references before codegen.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the output. Make reachability explicit.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.38</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.38 - Structural route artifacts</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.38">GitHub release</a>
    </footer>
  </>
}
