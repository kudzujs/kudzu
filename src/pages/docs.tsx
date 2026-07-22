import { useState } from "@kudzujs/core"
import { CodeBlock } from "../components/CodeBlock"

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

function BenchmarkTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return <div className="benchmark-table"><table>
    <thead><tr>{columns.map(column => <th>{column}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr>{row.map(value => <td>{value}</td>)}</tr>)}</tbody>
  </table></div>
}

export default function DocsPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [demoTrees, setDemoTrees] = useState([
    { id: 1, name: "Oak" },
    { id: 2, name: "Pine" }
  ])

  function createTrees() {
    setDemoTrees([
      { id: 1, name: "Oak" },
      { id: 2, name: "Pine" }
    ])
  }

  function addTree() {
    const id = Math.max(0, ...demoTrees.map(item => item.id)) + 1
    setDemoTrees([...demoTrees, { id, name: `Vine ${id}` }])
  }

  function reverseTrees() {
    setDemoTrees([...demoTrees].reverse())
  }

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
          <a href="#context">Context</a>
          <a href="#attributes">Reactive attributes</a>
          <a href="#conditionals">Conditional DOM</a>
          <a href="#lists">Keyed lists</a>
          <a href="#events">Event handlers</a>
          <a href="#captures">Client captures</a>
          <p>REFERENCE</p>
          <a href="#build">Build output</a>
          <a href="#benchmarks">Benchmarks</a>
          <a href="#limits">Current limits</a>
        </aside>

        <main className="docs-content">
          <section className="docs-intro">
            <p className="eyebrow">KUDZU DOCUMENTATION · v0.4.12</p>
            <h1>Write TSX.<br /><em>Ship HTML.</em></h1>
            <p>Kudzu keeps React-shaped authoring while compiling state changes into direct DOM patches. There is no virtual DOM, hydration pass, or client component tree.</p>
          </section>

          <section className="docs-section" id="install">
            <div className="docs-heading"><span>01</span><div><p>GETTING STARTED</p><h2>Installation</h2></div></div>
            <p>Create a project and start the development server:</p>
            <CodeBlock language="shell" code={`npm create kudzu@latest my-app
cd my-app
npm run dev`} />
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
            <CodeBlock code={`function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>
}

export default function Page() {
  return <Greeting name="Kudzu" />
}`} />
          </section>

          <section className="docs-section" id="state">
            <div className="docs-heading"><span>04</span><div><p>CORE</p><h2>State semantics</h2></div></div>
            <p>Declare local primitive state with the same syntax as React. Setters update logical state immediately and DOM writes batch at the end of the synchronous turn.</p>
            <CodeBlock code={`const [count, setCount] = useState(0)

function growTwice() {
  setCount(count + 1)
  setCount(count + 1)
}`} />
            <div className="docs-callout"><strong>Result</strong><span>Logical state increases by 2. Bound DOM nodes patch once.</span></div>
            <h3 id="context">Context</h3>
            <p>Context passes default, nested, or direct state values through component layers without retaining a browser component tree.</p>
            <CodeBlock code={`const ThemeContext = createContext("light")

function Toolbar() {
  const theme = useContext(ThemeContext)
  return <button className={theme === "dark" ? "theme-dark" : "theme-light"}>Save</button>
}

function App() {
  const [theme] = useState("dark")
  return <ThemeContext.Provider value={theme}>
    <Toolbar />
  </ThemeContext.Provider>
}`} />
            <p>Nested Providers override their parent. Reactive Provider values must be direct <code>useState</code> values; setters and objects containing reactive values are not supported.</p>
          </section>

          <section className="docs-section" id="attributes">
            <div className="docs-heading"><span>05</span><div><p>CORE · NEW</p><h2>Reactive attributes</h2></div></div>
            <p>State-dependent <code>className</code>, <code>style</code>, <code>disabled</code>, <code>value</code>, and <code>checked</code> use normal React-shaped expressions. Kudzu compiles each expression into an external ESM evaluator and patches only its DOM target.</p>
            <CodeBlock code={`const [active, setActive] = useState(false)
const [loading, setLoading] = useState(false)
const [name, setName] = useState("Kudzu")
const [subscribed, setSubscribed] = useState(false)

return <>
  <div className={active ? "active" : "idle"} />
  <div style={{ opacity: active ? 1 : 0, width: active ? 240 : 0 }} />
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
</>`} />
            <div className="attribute-grid">
              <div><code>className</code><p>Sets or removes the element's live <code>class</code> attribute.</p></div>
              <div><code>style</code><p>Serializes camelCase object properties, dimensional numbers, unitless values, and CSS custom properties.</p></div>
              <div><code>disabled</code><p>Toggles the boolean attribute and native disabled property.</p></div>
              <div><code>value</code><p>Updates the live value property for controlled inputs and selects.</p></div>
              <div><code>checked</code><p>Updates the live boolean property for controlled checkboxes and radios.</p></div>
              <div><code>any attribute</code><p>Patches standard, <code>aria-*</code>, and <code>data-*</code> attributes without a compiler allowlist.</p></div>
            </div>
          </section>

          <section className="docs-section" id="conditionals">
            <div className="docs-heading"><span>06</span><div><p>CORE · NEW</p><h2>Conditional DOM</h2></div></div>
            <p>Child <code>&amp;&amp;</code> and ternary expressions compile to bounded DOM ranges. Kudzu inserts or removes only that range and does not rerun a browser component tree.</p>
            <CodeBlock code={`function MenuBar() {
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
</>`} />
            <div className="conditional-demo">
              <div><span>LIVE EXAMPLE</span><p>{menuOpen ? "Menu mounted" : "Menu dormant"}</p></div>
              {menuOpen
                ? <button onClick={() => setMenuOpen(false)}>Close menu</button>
                : <button onClick={() => setMenuOpen(true)}>Open menu</button>}
            </div>
            {menuOpen && <MenuBar />}
            <div className="docs-callout"><strong>State</strong><span>Logical Kudzu state persists across branch switches. Uncontrolled input values, focus, selection, and imperative DOM mutations reset when a branch is remounted.</span></div>
            <p>Top-level immutable <code>const</code> values can hold static JSX, state-dependent branches, aliases, and nested JSX locals. Kudzu compiles their initializers to the same bounded ranges as inline conditions.</p>
            <CodeBlock code={`const menu = open ? <MenuBar /> : <p>Menu dormant</p>
const content = open && menu

return <main>{content}</main>`} />
            <p>Both branches are rendered into inert templates at build time. Conditional rendering is a UI mechanism, not an authorization boundary: do not place secrets or access-controlled content in a dormant branch, and avoid build-time side effects in branch components.</p>
          </section>

          <section className="docs-section" id="lists">
            <div className="docs-heading"><span>07</span><div><p>CORE · NEW</p><h2>Keyed lists</h2></div></div>
            <p>Map local array state directly to one keyed intrinsic element. Initial items are static HTML; browser updates add, remove, update, and move existing keyed elements without a VDOM or remount.</p>
            <CodeBlock code={`type Tree = { id: number; name: string }

const [items, setItems] = useState<Tree[]>([
  { id: 1, name: "Oak" },
  { id: 2, name: "Pine" }
])

function create() {
  setItems([{ id: 1, name: "Oak" }, { id: 2, name: "Pine" }])
}

function add() {
  const id = Math.max(0, ...items.map(item => item.id)) + 1
  setItems([...items, { id, name: \`Vine \${id}\` }])
}

function reverse() {
  setItems([...items].reverse())
}

const rows = items.map(item => <li key={item.id} style={{ opacity: item.id % 2 ? 1 : 0.7 }}>
  <span>{item.name}</span>
  <button onClick={() =>
    setItems(items.filter(entry => entry.id !== item.id))
  }>Remove</button>
</li>)

return <>
  <button onClick={create}>Create</button>
  <button onClick={add}>Add</button>
  <button onClick={reverse}>Reverse</button>
  <ul>{rows}</ul>
</>`} />
            <div className="list-demo">
              <div className="list-demo-actions">
                <span>LIVE KEYED LIST</span>
                <button onClick={createTrees}>Create</button>
                <button onClick={addTree}>Add</button>
                <button onClick={reverseTrees}>Reverse</button>
              </div>
              <ul>
                {demoTrees.map(item => <li key={item.id} data-id={item.id} style={{ opacity: item.id % 2 ? 1 : 0.7 }}>
                  <span>{item.name}</span>
                  <code>#{item.id}</code>
                  <button onClick={() => setDemoTrees(demoTrees.filter(entry => entry.id !== item.id))}>Remove</button>
                </li>)}
              </ul>
            </div>
            <div className="docs-callout"><strong>Keys</strong><span>Keys must be unique strings or finite numbers. Existing keys move rather than remount, preserving uncontrolled descendant DOM state.</span></div>
            <p>Each item and nested object must be an ordinary plain object; null-prototype objects are rejected for JSON round-trip parity. The map may be direct JSX or one top-level immutable local rendered once as a JSX child. Direct item-property reads use compact markers. Derived item text, attributes, and object styles compile to external ESM evaluators and must remain pure and synchronous: item reads, literals, operators, templates, approved read-only methods, deterministic <code>Math</code>, and primitive conversion are supported. Mutation, Promise values, arbitrary calls, browser globals, component state, locals, imported helpers, and prototype-sensitive properties are rejected. Direct item handlers receive the latest JSON-safe item for their key; descriptors use a placeholder rather than duplicating the full item in initial HTML. Nested conditions or lists, reusable aliases, item spreads, component tags, fragments, refs, and <code>dangerouslySetInnerHTML</code> remain unsupported. Put keyed rows inside an explicit <code>tbody</code>, <code>thead</code>, or <code>tfoot</code>.</p>
          </section>

          <section className="docs-section" id="events">
            <div className="docs-heading"><span>08</span><div><p>CORE</p><h2>Event handlers</h2></div></div>
            <p>Setter-only handlers compile to ordered commands. Conditions, browser APIs, event reads, and async code compile to external ESM without <code>eval</code>.</p>
            <p>Native handlers use direct DOM listeners with normal <code>currentTarget</code>, bubbling, default-action, and propagation semantics. Handler modules load before listener registration, so <code>preventDefault()</code>, <code>stopPropagation()</code>, and <code>stopImmediatePropagation()</code> work synchronously as expected.</p>
            <p>Object refs resolve DOM elements when a native handler reads <code>current</code>. They initialize with <code>null</code> and need no effect or hydration lifecycle.</p>
            <CodeBlock code={`const inputRef = useRef<HTMLInputElement>(null)

return <>
  <input ref={inputRef} />
  <button onClick={() => inputRef.current?.focus()}>Focus</button>
</>`} />
            <CodeBlock code={`async function loadStatus() {
  setLoading(true)
  const response = await fetch("/api/status")
  setLoading(false)
}`} />
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
            <CodeBlock language="text" code={`npm run build

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
    └── handlers/`} />
            <p>Static pages ship no JavaScript. Interactive pages receive only the command runtime and external handler or binding modules they use.</p>
          </section>

          <section className="docs-section" id="benchmarks">
            <div className="docs-heading"><span>11</span><div><p>REFERENCE</p><h2>Benchmarks</h2></div></div>
            <p>Production builds ran after one warm-up in seven rotating rounds on Node 24.14.0 and an Intel i5-9500. Browser list operations are medians from seven fresh headless Chrome runs, measured when a DOM observer sees each expected result rather than at the next animation frame.</p>
            <h3>Interactive counter</h3>
            <BenchmarkTable
              columns={["Framework", "Initial HTML", "JS gzip", "Output", "Build"]}
              rows={[
                ["Kudzu", "Yes", "393 B", "1.1 KB", "409 ms"],
                ["Astro", "Yes", "158 B", "365 B", "893 ms"],
                ["Qwik CSR", "No", "20.6 KB", "57.8 KB", "600 ms"],
                ["Vue CSR", "No", "24.0 KB", "60.3 KB", "785 ms"],
                ["Svelte CSR", "No", "10.5 KB", "26.9 KB", "867 ms"],
                ["React CSR", "No", "59.2 KB", "189.0 KB", "1032 ms"],
                ["Next.js", "Yes", "182.1 KB", "652.2 KB", "3082 ms"]
              ]}
            />
            <h3>Static journal</h3>
            <BenchmarkTable
              columns={["Framework", "Initial HTML", "JS gzip", "Output", "Build"]}
              rows={[
                ["Kudzu", "Yes", "0 B", "3.2 KB", "422 ms"],
                ["Astro", "Yes", "0 B", "3.0 KB", "1081 ms"],
                ["Qwik CSR", "No", "20.2 KB", "59.6 KB", "633 ms"],
                ["Vue CSR", "No", "24.2 KB", "62.3 KB", "810 ms"],
                ["Svelte CSR", "No", "10.2 KB", "27.2 KB", "902 ms"],
                ["React CSR", "No", "59.8 KB", "192.3 KB", "1110 ms"],
                ["Next.js", "Yes", "182.6 KB", "663.6 KB", "3126 ms"]
              ]}
            />
            <h3>1,000-item keyed list</h3>
            <BenchmarkTable
              columns={["Framework", "JS gzip", "Output", "Build", "Update", "Reverse", "Remove", "Add", "Total"]}
              rows={[
                ["Astro", "324 B", "43.6 KB", "826 ms", "4.1 ms", "3.7 ms", "1.4 ms", "3.3 ms", "12.5 ms"],
                ["Kudzu", "5.0 KB", "60.3 KB", "452 ms", "7.1 ms", "7.5 ms", "1.9 ms", "7.0 ms", "23.5 ms"],
                ["Next.js", "182.2 KB", "695.2 KB", "3002 ms", "7.5 ms", "12.3 ms", "4.1 ms", "7.8 ms", "31.7 ms"],
                ["Vue CSR", "24.3 KB", "61.3 KB", "765 ms", "11.4 ms", "9.8 ms", "4.4 ms", "7.0 ms", "32.6 ms"],
                ["React CSR", "59.3 KB", "189.4 KB", "1039 ms", "9.9 ms", "13.4 ms", "4.7 ms", "6.1 ms", "34.1 ms"],
                ["Svelte CSR", "12.9 KB", "33.1 KB", "845 ms", "6.2 ms", "42.9 ms", "4.6 ms", "6.2 ms", "59.9 ms"],
                ["Qwik CSR", "22.2 KB", "64.1 KB", "630 ms", "10.7 ms", "27.5 ms", "39.2 ms", "22.2 ms", "99.6 ms"]
              ]}
            />
            <p>Astro is the hand-authored native DOM baseline for interactive fixtures. Kudzu and Astro emit initial HTML; React, Vue, Svelte, and Qwik use client-rendered fixtures. These numbers describe the selected fixtures, not complete framework capability.</p>
          </section>

          <section className="docs-section" id="limits">
            <div className="docs-heading"><span>12</span><div><p>REFERENCE</p><h2>Current limits</h2></div></div>
            <ul className="docs-limits">
              <li>Callback refs, mutable value refs, keyed-list refs, and reactive <code>dangerouslySetInnerHTML</code> are not supported.</li>
              <li>Context setters and objects containing reactive context values are not supported.</li>
              <li>Reactive conditional DOM is limited to the HTML namespace and is rejected inside SVG or MathML.</li>
              <li>Keyed lists require local-state maps and intrinsic roots; reusable aliases, nested dynamic JSX, item spreads, and derived-expression captures remain unsupported.</li>
              <li>Block-scoped or reassigned JSX locals are not implemented.</li>
              <li>There is no request-time SSR, server actions, router, HMR, or DevTools.</li>
              <li>Imported client helpers and non-serializable captures are rejected at build time.</li>
            </ul>
          </section>
        </main>
      </div>
    </>
  )
}
