export const metadata = {
  title: "Kudzu 0.8.39 - Fail-closed route contracts",
  description: "Kudzu 0.8.39 deeply validates RouteIR, RouteBuildRecord, and CapabilityIR references before browser code generation.",
  url: "https://kudzujs.cloud/releases/0.8.39",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.39 fail-closed route contracts",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.39">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.39</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">PROVE · REFERENCE · GENERATE</p>
        <h1>Invalid graphs stop.<br /><em>Before browsers start.</em></h1>
        <p className="release-lead">Concrete route contracts now prove every state, command, effect, binding, condition, list, ownership, and capability edge before Kudzu selects artifacts or generates browser code.</p>
        <div className="release-links">
          <a className="primary-action" href="#validation">Inspect the validation boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.39/PERFORMANCE.md#p012-deep-routeir-and-capabilityir-validation">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>3</strong><span>Validated route contracts</span></div>
        <div><strong>0 B</strong><span>Runtime change</span></div>
        <div><strong>203/203</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="validation">
        <div className="release-section-heading"><span>12</span><div><p>FAIL-CLOSED CONTRACTS</p><h2>Every reference exists.<br />Every projection agrees.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>STATE</span><h3>Commands target real identity</h3><p>State and parameter IDs are unique, command operations are known, and every target resolves before runtime generation.</p></article>
          <article><span>EFFECTS</span><h3>Dependencies stay owned</h3><p>Effect state, captures, derived dependencies, keyed item fields, list ownership, and lifetimes validate together.</p></article>
          <article><span>REACTIVE</span><h3>Descriptors validate recursively</h3><p>Bindings, conditions, nested scope bindings, captures, and owned branch states use one checked reactive descriptor boundary.</p></article>
          <article><span>LISTS</span><h3>Ownership graphs remain reciprocal</h3><p>List IDs, keys, row templates, children, parent fields, duplicate ownership, and cycles fail deterministically.</p></article>
          <article><span>CAPABILITIES</span><h3>Projection matches every route</h3><p>CapabilityIR counts and flags are checked independently and against an exact recomputation from RouteBuildRecord inputs.</p></article>
          <article><span>NEXT</span><h3>Follow object properties</h3><p>The next migration-backed investigation is property-level derived dependencies over ordinary object state.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the output. Fail earlier.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.39</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.39 - Fail-closed route contracts</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.39">GitHub release</a>
    </footer>
  </>
}
