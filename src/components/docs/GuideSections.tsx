import { CodeBlock } from "../CodeBlock"

export function InstallationSection() {
  return <section className="docs-section" id="install">
    <div className="docs-heading"><span>01</span><div><p>GETTING STARTED</p><h2>Installation</h2></div></div>
    <p>Create a project and start the development server:</p>
    <CodeBlock language="shell" code={`npm create kudzu@latest my-app
cd my-app
npm run dev`} />
    <p>To add Kudzu to an existing project, install <code>@kudzujs/core</code> and configure TypeScript with <code>jsxImportSource: "@kudzujs/core"</code>.</p>
  </section>
}

export function PagesSection() {
  return <section className="docs-section" id="pages">
    <div className="docs-heading"><span>02</span><div><p>GETTING STARTED</p><h2>Pages & routes</h2></div></div>
    <p>Every TSX file in <code>src/pages</code> becomes static HTML in <code>dist</code>.</p>
    <div className="docs-table">
      <code>src/pages/index.tsx</code><span>→</span><code>/</code>
      <code>src/pages/docs.tsx</code><span>→</span><code>/docs</code>
      <code>src/pages/blog/index.tsx</code><span>→</span><code>/blog</code>
    </div>
    <p>Bracket parameters use <code>getStaticPaths()</code> to emit multiple static pages with build-time props.</p>
    <CodeBlock code={`// src/pages/posts/[slug].tsx
export async function getStaticPaths() {
  return [
    { params: { slug: "oak" }, props: { title: "Oak" } },
    { params: { slug: "pine" }, props: { title: "Pine" } }
  ]
}

export default function Post({ title }: { title: string }) {
  return <h1>{title}</h1>
}`} />
    <p>Missing params, unsafe path segments, and duplicate output routes fail the build. Catch-all parameters are not yet supported.</p>
    <h3>Project configuration</h3>
    <CodeBlock code={`// kudzu.config.mjs
export default {
  base: "/newsletter",
  async afterBuild({ outDir, routes, plans, base }) {
    // Write RSS, sitemap, or search indexes.
  }
}`} />
    <p>The base prefixes runtime, handler, stylesheet, icon, manifest, and dev-server URLs without nesting files under <code>dist</code>. Every CSS file under <code>src</code> is copied under <code>dist/assets</code> with its relative path and linked in deterministic order.</p>
    <h3>Trusted HTML</h3>
    <CodeBlock code={`<article dangerouslySetInnerHTML={{ __html: renderedNotionHtml }} />`} />
    <p>Raw HTML is not sanitized. It accepts trusted build-time content only; reactive values, children on the same element, void elements, and keyed-list raw HTML are rejected.</p>
  </section>
}

export function ComponentsSection() {
  return <section className="docs-section" id="components">
    <div className="docs-heading"><span>03</span><div><p>CORE</p><h2>Components</h2></div></div>
    <p>Use function components, props, children, and fragments. Components run at build time and do not remain as a browser-side tree.</p>
    <CodeBlock code={`function Greeting({ name }: { name: string }) {
  return <h1>Hello {name}</h1>
}

export default function Page() {
  return <Greeting name="Kudzu" />
}`} />
  </section>
}

export function StateSection() {
  return <section className="docs-section" id="state">
    <div className="docs-heading"><span>04</span><div><p>CORE</p><h2>State semantics</h2></div></div>
    <p>Declare local state with the same syntax as React. State may contain primitives or serializable plain objects. Setters update logical state immediately and DOM writes batch at the end of the synchronous turn.</p>
    <CodeBlock code={`const [count, setCount] = useState(0)

function growTwice() {
  setCount(count + 1)
  setCount(count + 1)
}

const [weather, setWeather] = useState({ temperature: 28, label: "Warm" })

return <p>{weather.temperature}° {weather.label}</p>`} />
    <p>Derived text patches a comment-bounded text node without adding a wrapper element. Table cells, options, SVG text, layout, and element selectors retain their authored structure.</p>
    <div className="docs-callout"><strong>Result</strong><span>Logical state increases by 2. Bound DOM nodes patch once.</span></div>
    <h3 id="context">Context</h3>
    <p>Context passes default, nested, or reactive object values through component layers without retaining a browser component tree.</p>
    <CodeBlock code={`type ThemeValue = {
  theme: string
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function Toolbar() {
  const value = useContext(ThemeContext)
  if (!value) return null
  return <button className={value.theme === "dark" ? "theme-dark" : "theme-light"} onClick={() => value.setTheme("light")}>Save</button>
}

function App() {
  const [theme, setTheme] = useState("dark")
  return <ThemeContext.Provider value={{ theme, setTheme }}>
    <Toolbar />
  </ThemeContext.Provider>
}`} />
    <p>Context objects may contain state, setters, nested plain data, and static fields. Consumers may destructure or rename properties. Kudzu emits only concrete state/setter IDs and reconstructs live getters with the existing synchronous, batched setter semantics; no function source or browser Provider tree is shipped. Nested Providers remain independent. Arbitrary functions, accessors, cycles, symbols, and non-plain objects are rejected when captured for browser use.</p>
    <h3 id="effects">Mount effects</h3>
    <p>Browser-only initial work can use an inline <code>useEffect</code> callback with a literal empty dependency array. Kudzu emits that callback as route-specific ESM and patches only state-bound DOM; it does not ship or rerun the component.</p>
    <CodeBlock code={`const [items, setItems] = useState([])

useEffect(async () => {
  const response = await fetch("/api/items")
  setItems(await response.json())
}, [])`} />
    <p>Effects may update text, attributes, conditions, and keyed lists. The callback must be inline and block-bodied. Dependencies, cleanup or other return values, callback parameters, and non-serializable captures remain unsupported and fail during the build. Routes without effects emit no effect entry.</p>
  </section>
}

export function AttributesSection() {
  return <section className="docs-section" id="attributes">
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
  <input value={name} onInput={event => setName(event.currentTarget.value)} />
  <input type="checkbox" checked={subscribed} onChange={event => setSubscribed(event.currentTarget.checked)} />
  <select value={name} onChange={event => setName(event.currentTarget.value)} />
  <button aria-expanded={active} data-state={active ? "open" : "closed"} hidden={!active} title={active ? "Active" : "Inactive"} />
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
}
