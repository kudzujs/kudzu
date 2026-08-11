export const metadata = {
  title: "Kudzu 0.8.37 - Structural ModuleIR references",
  description: "Kudzu 0.8.37 replaces formatted compiler links with validated source-local slots and stable symbols.",
  url: "https://kudzujs.cloud/releases/0.8.37",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.37 structural ModuleIR references",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#architecture">Architecture</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.37">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.37</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">SLOT · SYMBOL · VALIDATE</p>
        <h1>Names explain.<br /><em>Slots connect.</em></h1>
        <p className="release-lead">ModuleIR and ComponentAnalysis now carry one structural reference graph. Handlers, bindings, effects, keyed blocks, and component ownership validate before generated modules can exist.</p>
        <div className="release-links">
          <a className="primary-action" href="#references">Inspect the boundary</a>
          <a href="https://github.com/kudzujs/kudzu/blob/v0.8.37/PERFORMANCE.md#p010-structural-moduleir-references">Measurements</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>Versioned analysis contracts</span></div>
        <div><strong>1</strong><span>Fail-closed validation boundary</span></div>
        <div><strong>198/198</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="references">
        <div className="release-section-heading"><span>10</span><div><p>REFERENCE GRAPH</p><h2>Every edge resolves.<br />Before code generation.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>SLOTS</span><h3>Records own their identity</h3><p>Signals, handlers, bindings, effects, keyed blocks, imports, owners, states, refs, and IDs use deterministic array slots.</p></article>
          <article><span>SYMBOLS</span><h3>Cross-module identity stays stable</h3><p>Source-local SymbolRefs and stable ModuleSymbols replace formatted owner strings and name-based links.</p></article>
          <article><span>VALIDATION</span><h3>Malformed graphs fail closed</h3><p>Missing slots, duplicate exports, broken parent-child reciprocity, cycles, and unsupported versions stop before build-module generation.</p></article>
          <article><span>OWNERSHIP</span><h3>Effects and rows point home</h3><p>Specializations, row state, refs, prop signals, and effect lifetimes retain explicit structural owners.</p></article>
          <article><span>DEBUG</span><h3>Names stay readable</h3><p>Export and state spellings remain where emitted ABIs or diagnostics need them, but no longer establish compiler identity.</p></article>
          <article><span>NEXT</span><h3>Build an artifact graph</h3><p>P0.11 makes handler, Worker, CSS, package, and chunk retention follow explicit route artifact edges.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep the source. Strengthen the compiler graph.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.37</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.37 - Structural ModuleIR references</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.37">GitHub release</a>
    </footer>
  </>
}
