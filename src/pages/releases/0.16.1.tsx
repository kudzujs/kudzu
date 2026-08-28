export const metadata = {
  title: "Kudzu 0.16.1 - Retained external editor ownership",
  description: "Kudzu 0.16.1 owns a retained CodeMirror-class package instance across mount and dependency effects without a React island or widget runtime.",
  url: "https://kudzujs.cloud/releases/0.16.1",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.1 retained external editor ownership",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.1">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.1</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ONE PACKAGE INSTANCE · ONE OWNER · ZERO WIDGET RUNTIME</p>
        <h1>Retain the editor.<br /><em>Bound the lifetime.</em></h1>
        <p className="release-lead">Ordinary mount and dependency effects can share one proven package handle while Kudzu keeps cleanup, remount, and browser output owner-scoped.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the lifecycle</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.1">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>214,968 B</strong><span>CodeMirror fixture JS</span></div>
        <div><strong>0 B</strong><span>Static sibling JS</span></div>
        <div><strong>0</strong><span>Widget runtime concepts</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.1</span><div><p>RETAINED INSTANCE OWNERSHIP</p><h2>Keep package DOM.<br />Release it exactly.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>MOUNT</span><h3>Create once</h3><p>A host ref and mount effect create the real CodeMirror view.</p></article>
          <article><span>UPDATE</span><h3>Retain identity</h3><p>Later dependency effects update the same package instance.</p></article>
          <article><span>INPUT</span><h3>Sync both ways</h3><p>Editor transactions update ordinary application state.</p></article>
          <article><span>ERROR</span><h3>Recover locally</h3><p>Package update failures remain accessible application-owned state.</p></article>
          <article><span>RELEASE</span><h3>Destroy exactly</h3><p>Conditional and document release destroy the owned view once.</p></article>
          <article><span>BOUNDARY</span><h3>Add no registry</h3><p>No React island, ResourceIR, widget registry, or component runtime ships.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Own imperative UI directly.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.1</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.1 - Retained external editor ownership</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.1">GitHub release</a></footer>
  </>
}
