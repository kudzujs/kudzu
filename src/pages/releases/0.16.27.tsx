export const metadata = {
  title: "Kudzu 0.16.27 - Application verification guidance",
  description: "Kudzu 0.16.27 distinguishes successful compilation from browser and accessibility verification without changing compiler or runtime behavior.",
  url: "https://kudzujs.cloud/releases/0.16.27",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.16.27 application verification guidance",
  themeColor: "#23b26d"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.27">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.16.27</span><span>SEPTEMBER 2026</span></div>
        <p className="eyebrow">BUILD / BROWSER / HONEST EVIDENCE</p>
        <h1>Build the output.<br /><em>Verify the application.</em></h1>
        <p className="release-lead">Successful compilation is not browser or accessibility proof. The README, build reference, and ordinary build success output now make that boundary explicit.</p>
        <div className="release-links"><a className="primary-action" href="/docs#build">Read verification guidance</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.27">Inspect the release</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>compiler or runtime behavior changes</span></div>
        <div><strong>0 B</strong><span>browser JavaScript delta</span></div>
        <div><strong>0</strong><span>new dependencies</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.16.27</span><div><p>APPLICATION VERIFICATION</p><h2>Check visible behavior.<br />Keep evidence bounded.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>BROWSER</span><h3>Visible DOM, not raw strings</h3><p>Binding comments and inert templates make raw HTML matching and tag stripping unreliable for rendered text. Verify relevant interactions, labels, status updates, keyboard focus, and responsive layouts. Missing tools and truncated responses are not passes; rerun affected checks after edits.</p></article>
          <article><span>TOOLS</span><h3>Optional reports rebuild</h3><p>Inspect JSON and exact-route explain JSON both rebuild, including hooks and output emission. They report compiler and artifact facts, not full browser or accessibility proof, and are not a mandatory post-build sequence.</p></article>
          <article><span>OUTPUT</span><h3>A bounded success hint</h3><p>Ordinary successful builds link to the build reference. Failed, quiet, and JSON builds suppress the hint. Tests preserve byte-identical fixture artifacts; compiler semantics, runtime behavior, and browser JavaScript are unchanged. The prior npm internal-document exclusions remain in place.</p></article>
          <article><span>LIMITS</span><h3>Historical evidence, not savings</h3><p>Historical r8 on released 0.16.26 records Kudzu 23/25 versus React + Vite 24/25. All Kudzu outputs pass acceptance; two content attempts exceed input budgets and one unchanged React CRUD output fails acceptance. This guidance has no measured token benefit. No new benchmark, rescoring, or sandbox claim is included; 1.0.0 remains blocked.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Same compiler. Clearer verification.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.16.27</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.16.27 - Application verification guidance</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.16.27">GitHub release</a></footer>
  </>
}
