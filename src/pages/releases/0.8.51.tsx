export const metadata = {
  title: "Kudzu 0.8.51 - Owned effect package imports",
  description: "Kudzu 0.8.51 bundles direct browser-only package references from inline effect setup and cleanup into route-owned effect ESM.",
  url: "https://kudzujs.cloud/releases/0.8.51",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.51 owned effect package imports",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#effects">Effects</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.51">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.51</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">OWN · BUNDLE · RELEASE</p>
        <h1>Import for the browser.<br /><em>Ship only with the effect.</em></h1>
        <p className="release-lead">Inline effect setup and cleanup callbacks can reference browser-only package bindings directly. Kudzu keeps those imports out of build execution and bundles them only with the owning route effect.</p>
        <div className="release-links">
          <a className="primary-action" href="#effect-packages">Inspect the ownership</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.51/PERFORMANCE.md#current-0851-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Owning effect graph</span></div>
        <div><strong>0</strong><span>Build executions</span></div>
        <div><strong>0 B</strong><span>Static sibling package code</span></div>
      </section>

      <section className="release-section" id="effect-packages">
        <div className="release-section-heading"><span>P1</span><div><p>EFFECT PACKAGE OWNERSHIP</p><h2>Keep setup and cleanup ordinary.<br />Retain only referenced code.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Import directly</h3><p>Reference package bindings directly inside inline effect setup and cleanup callbacks.</p></article>
          <article><span>BUILD</span><h3>Execute nothing</h3><p>Build scratch receives an inert callback while preserving effect ownership metadata.</p></article>
          <article><span>BUNDLE</span><h3>Use existing ESM</h3><p>Package imports flow through existing handler records and route effect bundling.</p></article>
          <article><span>OWNERSHIP</span><h3>Keep exact lifetime</h3><p>Setup and cleanup retain route, layout, conditional, and keyed effect ownership.</p></article>
          <article><span>EXCLUSION</span><h3>Protect static siblings</h3><p>Routes without the effect ship neither package code nor effect JavaScript.</p></article>
          <article><span>BOUNDARY</span><h3>Stay direct</h3><p>Render-time, helper-indirect, mixed, side-effect, and dynamic package imports remain diagnosed.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep browser SDK setup inside the effect that owns it.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.51</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.51 - Owned effect package imports</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.51">GitHub release</a>
    </footer>
  </>
}
