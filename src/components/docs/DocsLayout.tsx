export function DocsHeader() {
  return <header className="site-header docs-header">
    <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
    <a className="docs-home" href="/">Back to Kudzu ↗</a>
  </header>
}

export function DocsSidebar() {
  return <aside className="docs-sidebar">
    <p>GETTING STARTED</p>
    <a href="#install">Installation</a>
    <a href="#pages">Pages & routes</a>
    <a href="#navigation">Application navigation</a>
    <p>CORE</p>
    <a href="#components">Components</a>
    <a href="#state">State semantics</a>
    <a href="#zustand">Zustand stores</a>
    <a href="#context">Context</a>
    <a href="#attributes">Reactive attributes</a>
    <a href="#conditionals">Conditional DOM</a>
    <a href="#lists">Keyed lists</a>
    <a href="#events">Event handlers</a>
    <a href="#captures">Client captures</a>
    <p>REFERENCE</p>
    <a href="#architecture">Compiler architecture</a>
    <a href="#build">Build output</a>
    <a href="#benchmarks">Benchmarks</a>
    <a href="#limits">Current limits</a>
  </aside>
}

export function DocsIntro() {
  return <section className="docs-intro">
    <p className="eyebrow">KUDZU DOCUMENTATION · v0.8.17</p>
    <h1>Write TSX.<br /><em>Ship HTML.</em></h1>
    <p>Kudzu treats React-shaped TSX as compiler input, specializing it into complete HTML and only the route-specific browser capabilities used. There is no virtual DOM, hydration pass, or client component tree.</p>
  </section>
}
