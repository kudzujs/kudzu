export const metadata = {
  title: "Kudzu 0.16.14 - Fair AI delivery evidence",
  description: "Kudzu 0.16.14 records equal-condition delivery attempts, raw failures, costs, source retention, and browser artifacts without cherry-picking.",
  url: "https://kudzujs.cloud/releases/0.16.14",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.14 fair AI delivery evidence",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.14">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.14</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">EQUAL CONDITIONS · RAW FAILURES · ATTRIBUTED COST</p>
        <h1>Keep every attempt.<br /><em>Measure before claiming.</em></h1>
        <p className="release-lead">Kudzu now owns a pinned delivery protocol that gives Kudzu and React+Vite the same prompt, model, tools, budgets, and behavior acceptance.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the protocol</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.14">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>4</strong><span>Fixture attempts</span></div>
        <div><strong>2</strong><span>Raw failures retained</span></div>
        <div><strong>0 B</strong><span>Browser delta</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.14</span><div><p>AI DELIVERY PROTOCOL</p><h2>Pin equal inputs.<br />Retain complete evidence.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FAIRNESS</span><h3>Share one protocol</h3><p>Model revision, pricing, tools, prompt, budgets, acceptance, and paired order are pinned before execution.</p></article>
          <article><span>ISOLATION</span><h3>Copy clean starters</h3><p>Every attempt receives an isolated starter tree and an independent final build and acceptance run.</p></article>
          <article><span>FAILURES</span><h3>Keep failed work</h3><p>Raw output, final source, artifacts, and acceptance results remain present when behavior fails.</p></article>
          <article><span>COST</span><h3>Count the numerator</h3><p>Tokens, pricing, tool calls, files, builds, corrections, and failed-attempt cost remain visible.</p></article>
          <article><span>SOURCE</span><h3>Measure retention</h3><p>Starter and final authored trees are hashed while generated output is inventoried separately.</p></article>
          <article><span>LIMIT</span><h3>Claim only protocol proof</h3><p>The deterministic fixture validates accounting; it does not rank Kudzu against React+Vite.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Measure delivery without cherry-picking.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.14</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.14 - Fair AI delivery evidence</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.14">GitHub release</a></footer>
  </>
}
