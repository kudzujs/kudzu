import { useState } from "@kudzujs/core"

export const metadata = {
  title: "Kudzu Docs — HTML-first TSX",
  description: "Kudzu installation, components, state semantics, reactive attributes, event handlers, routing, and build reference.",
  lang: "en",
  locale: "en_US",
  siteName: "Kudzu",
  url: "https://kudzujs.cloud/docs",
  image: "https://kudzujs.cloud/og-image.png",
  imageAlt: "Kudzu HTML-first TSX framework documentation",
  themeColor: "#8d52ff",
  icon: "/favicon.ico",
  appleTouchIcon: "/apple-touch-icon.png",
  manifest: "/site.webmanifest"
}

function MenuBar() {
  return (
    <nav className="docs-menu" aria-label="Example navigation">
      <a href="#components">Components</a>
      <a href="#state">State</a>
      <a href="#conditionals">Conditional DOM</a>
      <a href="#lists">Keyed lists</a>
    </nav>
  )
}

export default function DocsPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className="site-header docs-header">
        <a className="brand" href="/"><img src="/icon-128.png" alt="Kudzu" /></a>
        <a className="docs-home" href="/">Back to Kudzu ↗</a>
      </header>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <p>GETTING STARTED</p>
          <a href="#install">Installation</a>
          <a href="#pages">Pages & routes</a>
          <p>CORE</p>
          <a href="#components">Components</a>
          <a href="#state">State semantics</a>
          <a href="#attributes">Reactive attributes</a>
          <a href="#conditionals">Conditional DOM</a>
          <a href="#lists">Keyed lists</a>
          <a href="#events">Event handlers</a>
          <a href="#captures">Client captures</a>
          <p>REFERENCE</p>
          <a href="#build">Build output</a>
          <a href="#limits">Current limits</a>
        </aside>

        <main className="docs-content">
          <section className="docs-intro">
            <p className="eyebrow">KUDZU DOCUMENTATION · v0.4.3</p>
            <h1>Write TSX.<br /><em>Ship HTML.</em></h1>
            <p>Kudzu keeps React-shaped authoring while compiling state changes into direct DOM patches. There is no virtual DOM, hydration pass, or client component tree.</p>
          </section>

          <section className="docs-section" id="install">
            <div className="docs-heading"><span>01</span><div><p>GETTING STARTED</p><h2>Installation</h2></div></div>
            <p>Create a project and start the development server:</p>
            <pre><code>{`npm create kudzu@latest my-app
cd my-app
npm run dev`}</code></pre>
            <p>To add Kudzu to an existing project, install <code>@kudzujs/core</code> and configure TypeScript with <code>jsxImportSource: "@kudzujs/core"</code>.</p>
          </section>

          <section className="docs-section" id="pages">
            <div className="docs-heading"><span>02</span><div><p>GETTING STARTED</p><h2>Pages & routes</h2></div></div>
            <p>Every TSX file in <code>src/pages</code> becomes static HTML in <code>dist</code>.</p>
            <div className="docs-table">
              <code>src/pages/index.tsx</code><span>→</span><code>/</code>
              <code>src/pages/docs.tsx</code><span>→</span><code>/docs</code>
              <code>src/pages/blog/index.tsx</code><span>→</span><code>/blog</code>
            </div>
          </section>

          <section className="docs-section" id="components">
            <div className="docs-heading"><span>03</span><div><p>CORE</p><h2>Components</h2></div></div>
            <p>Use function components, props, children, and fragments. Components run at build time and do not remain as a browser-side tree.</p>
            <pre><code>{`function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>
}

export default function Page() {
  return <Greeting name="Kudzu" />
}`}</code></pre>
          </section>

          <section className="docs-section" id="state">
            <div className="docs-heading"><span>04</span><div><p>CORE</p><h2>State semantics</h2></div></div>
            <p>Declare local primitive state with the same syntax as React. Setters update logical state immediately and DOM writes batch at the end of the synchronous turn.</p>
            <pre><code>{`const [count, setCount] = useState(0)

function growTwice() {
  setCount(count + 1)
  setCount(count + 1)
}`}</code></pre>
            <div className="docs-callout"><strong>Result</strong><span>Logical state increases by 2. Bound DOM nodes patch once.</span></div>
          </section>

          <section className="docs-section" id="attributes">
            <div className="docs-heading"><span>05</span><div><p>CORE · NEW</p><h2>Reactive attributes</h2></div></div>
            <p>State-dependent <code>className</code>, <code>disabled</code>, <code>value</code>, and <code>checked</code> use normal React-shaped expressions. Kudzu compiles each expression into an external ESM evaluator and patches only its DOM target.</p>
            <pre><code>{`const [active, setActive] = useState(false)
const [loading, setLoading] = useState(false)
const [name, setName] = useState("Kudzu")
const [subscribed, setSubscribed] = useState(false)

return <>
  <div className={active ? "active" : "idle"} />
  <button disabled={loading}>Save</button>
  <input
    value={name}
    onInput={event => setName(event.currentTarget.value)}
  />
  <input
    type="checkbox"
    checked={subscribed}
    onChange={event => setSubscribed(event.currentTarget.checked)}
  />
  <select value={name} onChange={event => setName(event.currentTarget.value)} />
  <button
    aria-expanded={active}
    data-state={active ? "open" : "closed"}
    hidden={!active}
    title={active ? "Active" : "Inactive"}
  />
</>`}</code></pre>
            <div className="attribute-grid">
              <div><code>className</code><p>Sets or removes the element's live <code>class</code> attribute.</p></div>
              <div><code>disabled</code><p>Toggles the boolean attribute and native disabled property.</p></div>
              <div><code>value</code><p>Updates the live value property for controlled inputs and selects.</p></div>
              <div><code>checked</code><p>Updates the live boolean property for controlled checkboxes and radios.</p></div>
              <div><code>any attribute</code><p>Patches standard, <code>aria-*</code>, and <code>data-*</code> attributes without a compiler allowlist.</p></div>
            </div>
          </section>

          <section className="docs-section" id="conditionals">
            <div className="docs-heading"><span>06</span><div><p>CORE · NEW</p><h2>Conditional DOM</h2></div></div>
            <p>Child <code>&amp;&amp;</code> and ternary expressions compile to bounded DOM ranges. Kudzu inserts or removes only that range and does not rerun a browser component tree.</p>
            <pre><code>{`function MenuBar() {
  return <nav>
    <a href="/docs">Docs</a>
    <a href="/about">About</a>
  </nav>
}

const [open, setOpen] = useState(false)

return <>
  {open
    ? <button onClick={() => setOpen(false)}>Close menu</button>
    : <button onClick={() => setOpen(true)}>Open menu</button>}
  {open && <MenuBar />}
</>`}</code></pre>
            <div className="conditional-demo">
              <div><span>LIVE EXAMPLE</span><p>{menuOpen ? "Menu mounted" : "Menu dormant"}</p></div>
              {menuOpen
                ? <button onClick={() => setMenuOpen(false)}>Close menu</button>
                : <button onClick={() => setMenuOpen(true)}>Open menu</button>}
            </div>
            {menuOpen && <MenuBar />}
            <div className="docs-callout"><strong>State</strong><span>Logical Kudzu state persists across branch switches. Uncontrolled input values, focus, selection, and imperative DOM mutations reset when a branch is remounted.</span></div>
            <p>Both branches are rendered into inert templates at build time. Conditional rendering is a UI mechanism, not an authorization boundary: do not place secrets or access-controlled content in a dormant branch, and avoid build-time side effects in branch components.</p>
          </section>

          <section className="docs-section" id="lists">
            <div className="docs-heading"><span>07</span><div><p>CORE · NEW</p><h2>Keyed lists</h2></div></div>
            <p>Map local array state directly to one keyed intrinsic element. Initial items are static HTML; browser updates add, remove, update, and move existing keyed elements without a VDOM or remount.</p>
            <pre><code>{`const [items, setItems] = useState([
  { id: 1, name: "Oak", done: false },
  { id: 2, name: "Pine", done: true }
])

return <ul>
  {items.map(item =>
    <li
      key={item.id}
      className={item.done ? "done" : "active"}
      aria-label={\`\${item.name} item\`}
    >
      {item.name.toUpperCase()}
      <button onClick={() =>
        setItems(items.filter(entry => entry.id !== item.id))
      }>Remove</button>
    </li>
  )}
</ul>`}</code></pre>
            <div className="docs-callout"><strong>Keys</strong><span>Keys must be unique strings or finite numbers. Existing keys move rather than remount, preserving uncontrolled descendant DOM state.</span></div>
            <p>Each item and nested object must be an ordinary plain object; null-prototype objects are rejected for JSON round-trip parity. Direct item-property reads use compact markers. Derived item text and normal attributes compile to external ESM evaluators and must remain pure and synchronous: item reads, literals, operators, templates, approved read-only methods, deterministic <code>Math</code>, and primitive conversion are supported. Mutation, Promise values, arbitrary calls, browser globals, component state, locals, imported helpers, and prototype-sensitive properties are rejected. Delegated item handlers receive the latest JSON-safe item for their key; descriptors use a placeholder rather than duplicating the full item in initial HTML. Nested conditions or lists, item spreads, component tags, fragments, and reactive <code>style</code>, <code>ref</code>, or <code>dangerouslySetInnerHTML</code> remain unsupported. Put keyed rows inside an explicit <code>tbody</code>, <code>thead</code>, or <code>tfoot</code>.</p>
          </section>

          <section className="docs-section" id="events">
            <div className="docs-heading"><span>08</span><div><p>CORE</p><h2>Event handlers</h2></div></div>
            <p>Setter-only handlers compile to ordered commands. Conditions, browser APIs, event reads, and async code compile to external ESM without <code>eval</code>.</p>
            <p>Delegated native handlers run after normal event bubbling, from the event target toward matching Kudzu ancestors in deterministic order with the correct <code>currentTarget</code>. They cannot call or reference <code>preventDefault()</code>, <code>stopPropagation()</code>, or <code>stopImmediatePropagation()</code>; the compiler rejects those methods because external ESM cannot apply them with correct synchronous DOM semantics.</p>
            <pre><code>{`async function loadStatus() {
  setLoading(true)
  const response = await fetch("/api/status")
  setLoading(false)
}`}</code></pre>
          </section>

          <section className="docs-section" id="captures">
            <div className="docs-heading"><span>09</span><div><p>CORE</p><h2>Client captures</h2></div></div>
            <p>Handlers and reactive expressions may capture serializable component locals and destructured props.</p>
            <div className="docs-columns">
              <div><strong>Supported</strong><p>Strings, booleans, numbers, arrays, plain objects, and destructured props.</p></div>
              <div><strong>Unsupported</strong><p>Functions, symbols, bigints, cycles, class instances, and imported helpers.</p></div>
            </div>
          </section>

          <section className="docs-section" id="build">
            <div className="docs-heading"><span>10</span><div><p>REFERENCE</p><h2>Build output</h2></div></div>
            <pre><code>{`npm run build

dist/
├── index.html
├── docs/index.html
└── assets/
    ├── style.css
    ├── kudzu.js
    ├── kudzu-binding.js (when used)
    ├── kudzu-list.js (when used)
    ├── kudzu-native.js (when used)
    ├── kudzu-serialization.js (when used)
    └── handlers/`}</code></pre>
            <p>Static pages ship no JavaScript. Interactive pages receive only the command runtime and external handler or binding modules they use.</p>
          </section>

          <section className="docs-section" id="limits">
            <div className="docs-heading"><span>11</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
            <ul className="docs-limits">
              <li>Reactive <code>style</code>, <code>ref</code>, and <code>dangerouslySetInnerHTML</code> are not supported.</li>
              <li>Reactive conditional DOM is limited to the HTML namespace and is rejected inside SVG or MathML.</li>
              <li>Keyed lists require direct local-state maps and intrinsic roots; nested dynamic JSX, item spreads, and derived-expression captures remain unsupported.</li>
              <li>Generalized JSX-valued locals are not implemented.</li>
              <li>There is no request-time SSR, server actions, router, HMR, or DevTools.</li>
              <li>Imported client helpers and non-serializable captures are rejected at build time.</li>
            </ul>
          </section>
        </main>
      </div>
    </>
  )
}
