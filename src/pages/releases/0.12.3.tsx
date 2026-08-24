export const metadata = {
  title: "Kudzu 0.12.3 - Route failure and restoration policy",
  description: "Kudzu 0.12.3 retains valid documents across transport failures, restores retry focus, and preserves native fallback for invalid route assets.",
  url: "https://kudzujs.cloud/releases/0.12.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.12.3 route failure and restoration policy",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.12.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">RETAIN · RESTORE · RETRY</p>
        <h1>Keep the document.<br /><em>Restore the path.</em></h1>
        <p className="release-lead">Transport failures now retain the valid current route for focused retry, while invalid documents and assets continue through native navigation.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect recovery</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>1.8 ms</strong><span>Navigation median</span></div>
        <div><strong>359 B</strong><span>Added session raw</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.12.3</span><div><p>FAILURE OWNERSHIP</p><h2>Retain what works.<br />Fall back natively.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>FETCH</span><h3>Keep the document</h3><p>A rejected enhanced request leaves the current URL, layout, route DOM, and state intact.</p></article>
          <article><span>BODY</span><h3>Classify stream loss</h3><p>A response body that disconnects follows the same retained-document policy.</p></article>
          <article><span>STATUS</span><h3>Announce recovery</h3><p>The existing polite status gives the failure a visible and assistive-technology path.</p></article>
          <article><span>FOCUS</span><h3>Restore the trigger</h3><p>Focus returns to the initiating anchor even when it moved while the request was pending.</p></article>
          <article><span>RETRY</span><h3>Try the link again</h3><p>The same native link retries after failed prefetch and click requests without a scheduler.</p></article>
          <article><span>NATIVE</span><h3>Reject invalid assets</h3><p>Invalid identity, missing modules, and missing stylesheets keep native document fallback.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep failure recovery native.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.12.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.12.3 - Route failure and restoration policy</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.12.3">GitHub release</a></footer>
  </>
}
