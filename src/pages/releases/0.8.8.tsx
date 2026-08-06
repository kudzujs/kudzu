export const metadata = {
  title: "Kudzu 0.8.8 - Conditional keyed map roots",
  description: "Kudzu 0.8.8 lowers ordinary conditional keyed map roots into existing pure filter selectors with complete ownership cleanup.",
  url: "https://kudzujs.cloud/releases/0.8.8",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.8.8 conditional keyed map roots",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#lists">Keyed lists</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.8">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.8.8</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">CONDITIONAL KEYED MAP ROOTS</p>
        <h1>Write the condition.<br /><em>Keep the ownership.</em></h1>
        <p className="release-lead">Ordinary conditional keyed maps now lower to Kudzu's existing filter path, preserving familiar TSX and direct DOM lifecycle semantics.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.8.8">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>2</strong><span>React forms</span></div>
        <div><strong>0</strong><span>New runtime bytes</span></div>
        <div><strong>134/134</strong><span>Tests passing</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Conditional source retained.<br />Existing filters reused.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AND</span><h3>Logical row roots</h3><p><code>condition &amp;&amp; &lt;Row /&gt;</code> compiles without source restructuring.</p></article>
          <article><span>TERNARY</span><h3>Nullable row roots</h3><p><code>condition ? &lt;Row /&gt; : null</code> follows the same selector path.</p></article>
          <article><span>OWNERSHIP</span><h3>Complete cleanup</h3><p>Removal releases row state, effects, and refs; re-entry starts fresh.</p></article>
          <article><span>IDENTITY</span><h3>Siblings stay mounted</h3><p>Rows that remain selected retain their exact keyed DOM nodes.</p></article>
          <article><span>STATIC</span><h3>Zero-cost folding</h3><p>Build-known imported conditions still emit complete HTML without JavaScript.</p></article>
          <article><span>BOUNDARY</span><h3>No ambiguous indexes</h3><p>Map indexes and alternate JSX fallbacks remain source-diagnosed.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep conditional rows React-shaped.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.8.8</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.8.8 - Conditional keyed map roots</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.8.8">GitHub release</a>
    </footer>
  </>
}
