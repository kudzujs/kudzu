export const metadata = {
  title: "Kudzu 0.8.27 - Large-application compiler roadmap",
  description: "Kudzu 0.8.27 characterizes an E2B-derived resource boundary and publishes the ordered large-application and AI-native compiler program.",
  url: "https://kudzujs.cloud/releases/0.8.27",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.27 large-application compiler roadmap",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.27">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.27</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CHARACTERIZE · GENERALIZE · SCALE</p>
        <h1>Start from evidence.<br /><em>Build toward applications.</em></h1>
        <p className="release-lead">An E2B-derived terminal fixture now fixes the first Goal C resource boundary, while the architecture packet orders the semantic compiler work required for large React-shaped applications.</p>
        <div className="release-links">
          <a className="primary-action" href="#direction">See the direction</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.27/docs/next-architecture/large-application-ai-native-roadmap.md">Execution plan</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1</strong><span>Real resource boundary</span></div>
        <div><strong>12</strong><span>Ordered foundation PRs</span></div>
        <div><strong>176/176</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="direction">
        <div className="release-section-heading"><span>01</span><div><p>APPLICATION COMPILER</p><h2>Keep familiar source.<br />Generalize the semantics.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>EVIDENCE</span><h3>E2B resource boundary</h3><p>Terminal handles, generation invalidation, BFCache retention, resume, and discard cleanup remain one explicit unsupported fixture.</p></article>
          <article><span>DIAGNOSTIC</span><h3>Fail at the source</h3><p>Unsupported mutable page refs stop during source analysis instead of reaching the build-time DOM-ref runtime.</p></article>
          <article><span>SYMBOLS</span><h3>Resolve before expanding</h3><p>The first implementation adds one binding index for locals, parameters, imports, captures, globals, and unresolved names.</p></article>
          <article><span>SEMANTICS</span><h3>Lower intent once</h3><p>State operations, component dataflow, resources, and ranges follow stable symbols rather than accumulating exact AST shapes.</p></article>
          <article><span>ECOSYSTEM</span><h3>Contain package knowledge</h3><p>React ecosystem source is classified and normalized behind a compatibility boundary, not copied into a package encyclopedia in core.</p></article>
          <article><span>AI COST</span><h3>Measure successful work</h3><p>Tokens, files, tools, retries, completion time, source retention, browser behavior, and output bytes become explicit product evidence.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the runtime small. Make the compiler understand more.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.27</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.27 - Large-application compiler roadmap</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.27">GitHub release</a>
    </footer>
  </>
}
