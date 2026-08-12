export const metadata = {
  title: "Kudzu 0.8.43 - Three-boundary callback ownership",
  description: "Kudzu 0.8.43 preserves direct setter, callback, ref, state, effect, and ID ownership through three component boundaries without a browser component tree.",
  url: "https://kudzujs.cloud/releases/0.8.43",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.43 three-boundary callback ownership",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.43">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.43</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">FORWARD · VALIDATE · ERASE</p>
        <h1>Cross a third boundary.<br /><em>Keep ownership direct.</em></h1>
        <p className="release-lead">Setters, simple state callbacks, and object refs can pass through two presentation forwarding components while Kudzu still emits direct leaf capabilities, not component instances.</p>
        <div className="release-links">
          <a className="primary-action" href="#ownership">Inspect ownership</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.43/PERFORMANCE.md#current-0843-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Direct component boundaries</span></div>
        <div><strong>0 B</strong><span>Browser runtime added</span></div>
        <div><strong>208/208</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="ownership">
        <div className="release-section-heading"><span>P1</span><div><p>CALLBACK OWNERSHIP</p><h2>Validate every boundary.<br />Erase every forwarding layer.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SIGNALS</span><h3>Keep the parent signal</h3><p>The leaf handler retains the original parent SignalIR through two direct forwarding components.</p></article>
          <article><span>ORDER</span><h3>Expand before substitution</h3><p>Each authored component is validated while its callback prop is still a direct identifier, then specialized into the leaf.</p></article>
          <article><span>HOOKS</span><h3>Preserve leaf ownership</h3><p>Local state, effects, deterministic IDs, and object refs retain exact conditional cleanup and fresh remount behavior.</p></article>
          <article><span>OUTPUT</span><h3>Erase forwarding functions</h3><p>Presentation components do not survive in emitted browser JavaScript and static siblings remain zero-JavaScript.</p></article>
          <article><span>REFS</span><h3>Release with the DOM</h3><p>Parent refs resolve to the intrinsic leaf, become null on removal, and resolve to fresh DOM after remount.</p></article>
          <article><span>FAIL CLOSED</span><h3>Stop at four</h3><p>A fourth callback boundary, aliases, spreads, intermediate adapters, and repeated uses remain rejected.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep composing ordinary presentation components.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.43</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.43 - Three-boundary callback ownership</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.43">GitHub release</a>
    </footer>
  </>
}
