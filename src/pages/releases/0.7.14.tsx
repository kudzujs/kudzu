export const metadata = {
  title: "Kudzu 0.7.14 - Intrinsic forwardRef",
  description: "Kudzu 0.7.14 erases ordinary React forwardRef wrappers into direct intrinsic output without a browser component runtime.",
  url: "https://kudzujs.cloud/releases/0.7.14",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu 0.7.14 intrinsic forwardRef",
  themeColor: "#8d52ff"
}

export default function ReleasePage() {
  return <>
    <header className="site-header release-header">
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <nav>
        <a href="/">Home</a>
        <a href="/docs#components">Components guide</a>
        <a className="github-link" href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.14">GitHub release</a>
      </nav>
    </header>

    <main className="release-notes">
      <section className="release-hero">
        <div className="release-version"><span>0.7.14</span><span>AUGUST 2026</span></div>
        <p className="eyebrow">INTRINSIC FORWARDREF</p>
        <h1>Keep the wrapper.<br /><em>Ship the element.</em></h1>
        <p className="release-lead">Ordinary React-shaped input components can retain a direct forwardRef boundary while Kudzu separates ref from props and resolves the intrinsic target entirely at build time.</p>
        <div className="release-links">
          <a className="primary-action" href="#landed">What landed</a>
          <a href="https://github.com/kudzujs/kudzu/tree/v0.7.14">Browse the tag</a>
        </div>
      </section>

      <section className="release-metrics" aria-label="Release facts">
        <div><strong>0 B</strong><span>Wrapper runtime</span></div>
        <div><strong>1</strong><span>Direct ref boundary</span></div>
        <div><strong>101/101</strong><span>Framework tests</span></div>
      </section>

      <section className="release-section" id="landed">
        <div className="release-section-heading"><span>01</span><div><p>WHAT LANDED</p><h2>Familiar boundary.<br />Intrinsic result.</h2></div></div>
        <div className="release-feature-grid">
          <article><span>AUTHORING</span><h3>Direct forwardRef</h3><p>Named, aliased, default-member, and namespace-member React calls normalize before evaluation.</p></article>
          <article><span>PROPS</span><h3>Ref stays separate</h3><p>The forwarded ref is removed from ordinary props and rest before the component runs.</p></article>
          <article><span>TARGET</span><h3>One intrinsic root</h3><p>The object ref is forwarded exactly once to the element that owns it.</p></article>
          <article><span>OPTIONAL</span><h3>No ref required</h3><p>Calls without a ref remain ordinary static intrinsic output.</p></article>
          <article><span>OUTPUT</span><h3>Zero wrapper runtime</h3><p>React, forwardRef, and component wrappers stay out of browser assets.</p></article>
          <article><span>DIAGNOSTICS</span><h3>Unsafe forms fail</h3><p>Indirect, nested, repeated, callback, and component-root forwarding stop at the source.</p></article>
        </div>
      </section>

      <section className="release-upgrade">
        <p className="eyebrow">UPGRADE</p>
        <h2>Keep ref boundaries declarative.</h2>
        <div className="install-command"><span>$</span><code>npm install @kudzujs/core@^0.7.14</code></div>
      </section>
    </main>

    <footer>
      <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
      <p>Kudzu 0.7.14 - Intrinsic forwardRef</p>
      <a href="https://github.com/kudzujs/kudzu/releases/tag/v0.7.14">GitHub release</a>
    </footer>
  </>
}
