export const metadata = {
  title: "Kudzu 0.8.52 - Effect-private mutable refs",
  description: "Kudzu 0.8.52 lowers effect-exclusive useRef values into invocation-private closures for SDK handles, WebSockets, generation tokens, and animation frames.",
  url: "https://kudzujs.cloud/releases/0.8.52",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.52 effect-private mutable refs",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#effects">Effects</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.52">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.52</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">ISOLATE · OWN · CLEAN</p>
        <h1>Keep the handle.<br /><em>Lose the runtime.</em></h1>
        <p className="release-lead">Effect-exclusive mutable refs become ordinary setup-invocation closures. SDK handles, WebSockets, generation tokens, and animation frames keep familiar React-shaped source while Kudzu retains exact ownership.</p>
        <div className="release-links">
          <a className="primary-action" href="#private-refs">Inspect the lowering</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.52/PERFORMANCE.md#current-0852-release-snapshot">Release evidence</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Owning effect</span></div>
        <div><strong>0</strong><span>Serialized ref captures</span></div>
        <div><strong>0 B</strong><span>Static sibling JavaScript</span></div>
      </section>

      <section className="release-section" id="private-refs">
        <div className="release-section-heading"><span>P1</span><div><p>EFFECT-PRIVATE OWNERSHIP</p><h2>Move mutable values inward.<br />Keep lifecycle boundaries exact.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SOURCE</span><h3>Keep ordinary refs</h3><p>Author top-level <code>useRef(null)</code> and <code>useRef(0)</code> values with direct <code>.current</code> access.</p></article>
          <article><span>LOWERING</span><h3>Create per invocation</h3><p>The compiler moves exclusive refs into the inline setup closure and removes component captures.</p></article>
          <article><span>REPLACEMENT</span><h3>Clean before restart</h3><p>Dependency changes invalidate and clean the old closure before creating a distinct replacement.</p></article>
          <article><span>BFCache</span><h3>Retain when persisted</h3><p>Mount effects preserve their closure across persisted pagehide and resume through authored listeners.</p></article>
          <article><span>EVIDENCE</span><h3>Exercise real handles</h3><p>E2B terminal and WebSocket fixtures verify generation, listeners, stale callbacks, and exact close behavior.</p></article>
          <article><span>BOUNDARY</span><h3>Fail closed</h3><p>Cross-effect/event refs, aliases, escaped objects, nonzero initializers, and missing cleanup invalidation remain diagnosed.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Let each effect own its browser resource completely.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.52</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.52 - Effect-private mutable refs</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.52">GitHub release</a>
    </footer>
  </>
}
