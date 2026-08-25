export const metadata = {
  title: "Kudzu 0.13.3 - File upload boundary",
  description: "Kudzu 0.13.3 composes bounded file validation, multipart upload, cancellation, retry, route cleanup, and attachment mutation without an upload runtime.",
  url: "https://kudzujs.cloud/releases/0.13.3",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.13.3 file upload boundary",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav><a href="/">Home</a><a href="/docs">Documentation</a><a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.3">GitHub release</a></nav>
    </header>
    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.13.3</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">FILES · CANCELLATION · OWNED EFFECTS</p>
        <h1>Upload the file.<br /><em>Abort with the owner.</em></h1>
        <p className="release-lead">Native validation, multipart fetch, cancellation, failure and retry, route cleanup, and keyed attachment mutation compose from ordinary route state and owned effects.</p>
        <div className="release-links"><a className="primary-action" href="#proof">Inspect the lifecycle</a><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.3">Release evidence</a></div>
      </section>
      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0</strong><span>Upload runtimes</span></div>
        <div><strong>17</strong><span>Session JS files</span></div>
        <div><strong>0 B</strong><span>Static help JavaScript</span></div>
      </section>
      <section className="release-section" id="proof">
        <div className="release-section-heading"><span>0.13.3</span><div><p>UPLOAD OWNERSHIP</p><h2>Bound the input.<br />Own the request.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>VALIDATE</span><h3>Reject before request</h3><p>Native file selection accepts one plain-text attachment up to the authored 1 KiB boundary.</p></article>
          <article><span>READ</span><h3>Keep bounded state</h3><p>The selected name, type, size, and text remain route-owned for retry without reselection.</p></article>
          <article><span>SEND</span><h3>Use native multipart</h3><p>One owned effect reconstructs the Blob, FormData, fetch request, and abort signal.</p></article>
          <article><span>CANCEL</span><h3>Abort exact work</h3><p>User cancellation and route departure release the same in-flight request owner.</p></article>
          <article><span>RETRY</span><h3>Retain recovery input</h3><p>Accessible transport feedback preserves the selected file state for direct retry.</p></article>
          <article><span>MUTATE</span><h3>Append the attachment</h3><p>A successful response updates the existing keyed list with no transfer runtime.</p></article>
        </div>
      </section>
      <section className="release-upgrade"><p className="eyebrow">UPGRADE</p><h2>Keep upload ownership application-local.</h2><div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.13.3</code></div></section>
    </main>
    <footer><a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a><p>Kudzu 0.13.3 - File upload boundary</p><a href="https://github.com/kudzujs/kudzu/releases/tag/v0.13.3">GitHub release</a></footer>
  </>
}
