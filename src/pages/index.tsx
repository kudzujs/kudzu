import { useState } from "@kudzujs/core"

export const metadata = {
  title: "Kudzu — HTML-first TSX framework",
  description: "React-shaped TSX, synchronous state semantics, and zero virtual DOM. Kudzu ships static HTML and only the behavior each page needs.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  url: "https://github.com/kudzujs/kudzu",
  image: "https://raw.githubusercontent.com/kudzujs/kudzu/main/public/og-image.png",
  imageAlt: "Kudzu HTML-first TSX framework",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  manifest: "/site.webmanifest"
}

export default function HomePage() {
  const [count, setCount] = useState(0)

  function grow() {
    setCount(count + 1)
  }

  function growTwice() {
    setCount(count + 1)
    setCount(count + 1)
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/">
          <img src="/icon-64.png" alt="" />
          <span>kudzu</span>
        </a>
        <nav>
          <a href="#model">Model</a>
          <a href="https://www.npmjs.com/package/@kudzujs/core">npm</a>
          <a className="github-link" href="https://github.com/kudzujs/kudzu">GitHub ↗</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>v0.1</span> HTML-FIRST TSX FRAMEWORK</p>
            <h1>Grow from<br /><em>HTML.</em></h1>
            <p className="intro">React-shaped syntax. Synchronous state. Zero virtual DOM. Kudzu sends static HTML first, then grows only the behavior your page actually needs.</p>
            <div className="actions">
              <a className="primary-action" href="https://www.npmjs.com/package/@kudzujs/core">npm i @kudzujs/core</a>
              <a className="secondary-action" href="https://github.com/kudzujs/kudzu">Read the source ↗</a>
            </div>
          </div>
          <div className="hero-mark" aria-hidden="true">
            <div className="orbit"></div>
            <img src="/icon-512.png" alt="" />
          </div>
        </section>

        <section className="signals" aria-label="Framework highlights">
          <div><strong>0</strong><span>Virtual DOM</span></div>
          <div><strong>0 B</strong><span>Static page JS</span></div>
          <div><strong>581 B</strong><span>Counter JS gzip</span></div>
          <div><strong>sync</strong><span>State semantics</span></div>
        </section>

        <section className="model" id="model">
          <div className="section-title">
            <p className="eyebrow">THE GROWTH MODEL</p>
            <h2>Write components.<br />Ship outcomes.</h2>
          </div>
          <div className="pipeline">
            <article><span>01</span><h3>Static TSX</h3><p>Compiles to complete HTML with no browser runtime.</p><code>component → HTML</code></article>
            <article><span>02</span><h3>State setters</h3><p>Compile to ordered commands and direct text patches.</p><code>setter → behavior</code></article>
            <article><span>03</span><h3>Normal JavaScript</h3><p>Compiles to external ESM without eval or hydration.</p><code>handler → ESM</code></article>
          </div>
        </section>

        <section className="demo">
          <div>
            <p className="eyebrow">SYNCHRONOUS BY DEFAULT</p>
            <h2>Two setters.<br />Two changes.</h2>
            <p>Logical state updates immediately. DOM writes wait until the synchronous turn ends.</p>
          </div>
          <div className="counter-card">
            <div className="counter-output"><span>growth</span><strong>{count}</strong></div>
            <div className="counter-actions">
              <button onClick={grow}>Grow +1</button>
              <button onClick={growTwice}>Grow +2</button>
            </div>
            <code>setCount(count + 1)</code>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand" href="/"><img src="/icon-64.png" alt="" /><span>kudzu</span></a>
        <p>A framework that grows only where it needs to.</p>
        <span>MIT · 2026</span>
      </footer>
    </>
  )
}
