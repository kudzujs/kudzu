export const metadata = {
  title: "Kudzu 0.8.36 - Semantic state operations",
  description: "Kudzu 0.8.36 lowers equivalent direct, aliased, and local-helper state updates to the same command IR without adding handler JavaScript.",
  url: "https://kudzujs.cloud/releases/0.8.36",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.36 semantic state operations",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.36">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.36</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">STATE · PROVE · LOWER</p>
        <h1>Write the intent.<br /><em>Ship one command.</em></h1>
        <p className="release-lead">Direct setters, immutable aliases, and small local helpers now converge on the same structured state operation. Familiar source stays familiar while command-only pages avoid native handler JavaScript.</p>
        <div className="release-links">
          <a className="primary-action" href="#operations">See the semantic boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.36/PERFORMANCE.md#p09-semantic-state-operations">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>4</strong><span>Equivalent source forms</span></div>
        <div><strong>0</strong><span>Native handler modules</span></div>
        <div><strong>197/197</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="operations">
        <div className="release-section-heading"><span>09</span><div><p>SEMANTIC OPERATIONS</p><h2>Different syntax.<br />One proven state write.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>DIRECT</span><h3>The fast path stays fast</h3><p>Existing direct setters specialize first and retain their exact command ABI and generated browser artifacts.</p></article>
          <article><span>ALIASES</span><h3>Immutable values stay commands</h3><p>One state-derived local passed directly to its setter lowers without creating a general expression runtime.</p></article>
          <article><span>HELPERS</span><h3>Local intent can stay local</h3><p>Proven one-call arrow and function helpers specialize to the same state operation as inline source.</p></article>
          <article><span>IDENTITY</span><h3>Bindings decide meaning</h3><p>State, setter, helper, and parameter ownership are checked by lexical binding identity rather than matching names alone.</p></article>
          <article><span>SAFETY</span><h3>Dynamic behavior fails early</h3><p>Recursion, escape, mutation, optional calls, and object dispatch report authored source diagnostics.</p></article>
          <article><span>NEXT</span><h3>Unify ModuleIR references</h3><p>P0.10 replaces remaining mixed names and formatted owner strings with validated source-local references.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep familiar updates. Ship structured commands.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.36</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.36 - Semantic state operations</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.36">GitHub release</a>
    </footer>
  </>
}
