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
    <h3>Runtime parameters</h3>
    <p>When a bracket value exists only in the request URL, export <code>runtimeParams = true</code> and read it with <code>useParams()</code>. Kudzu emits one static fallback document and a route-specific pathname matcher, not a client router.</p>
    <CodeBlock code={`// src/pages/items/[id].tsx
import { useEffect, useParams } from "@kudzujs/core"

export const runtimeParams = true

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()
  useEffect(() => {
    fetch(\`/api/items/\${encodeURIComponent(id)}\`)
  }, [])
  return <h1>Item {id}</h1>
}`} />
    <p><code>getStaticPaths()</code> and <code>runtimeParams</code> are mutually exclusive. Parameters occupy complete path segments and malformed, separator, control, and traversal-like values are rejected. Static hosts must try exact files first and then internally rewrite matching paths to the generated fallback while preserving the URL. Ordered rewrite metadata is available to <code>afterBuild()</code>.</p>
    <h3 id="navigation">Application navigation</h3>
    <p>Emitted exact and runtime-parameter routes may share a page-exported layout and opt into same-document navigation while every URL remains a complete standalone document.</p>
    <CodeBlock code={`// src/pages/product.tsx
export { Shell as layout } from "../components/Shell"

export default function ProductPage() {
  return <main><h1>Product</h1></main>
}

// kudzu.config.mjs
export default {
  navigation: { routes: ["/product", "/items/[id]"] }
}`} />
    <CodeBlock code={`// Multiple shared layouts (mutually exclusive with routes)
export default {
  navigation: { groups: [
    { routes: ["/product", "/items/[id]"] },
    { routes: ["/account", "/settings"] }
  ] }
}`} />
    <p>Every configured pattern must identify a globally unique emitted route. A runtime route uses its bracket pattern, such as <code>/items/[id]</code>. Each group uses one page-exported layout identity, while different groups may use different layouts. Kudzu emits one deterministic route-hashed, capability-specialized asset per group and rejects overlapping path domains across groups. Layout DOM, state, and effects persist within a group; route state, parameters, effects, and DOM-owner records reset after cleanup. Conditional and keyed effects follow those layout or route lifetimes, with fresh route records and item-property subscriptions on cached revisits. Eligible same-group anchors prefetch validated complete documents. Cross-group links, direct loads, reloads, failures, malformed paths, unsupported links, and ungrouped routes keep native document navigation. Coordinated exit/shared-element View Transitions are not supported.</p>
    <h3>Project configuration</h3>
    <CodeBlock code={`// kudzu.config.mjs
export default {
  base: "/newsletter",
  publicDir: "../public",
  styles: [{ source: "../src/styles/global.css", output: "/assets/styles.css", transform: css => transformCss(css) }],
  metadata: ({ props }) => ({ lang: props.locale, manifest: "/manifest.json" }),
  async afterBuild({ outDir, routes, plans, rewrites, base }) {
    // Write host rewrites, RSS, sitemap, or search indexes.
  }
}`} />
    <p>The base prefixes runtime, handler, stylesheet, icon, manifest, and dev-server URLs without nesting files under <code>dist</code>. Every CSS file under <code>src</code> is copied under <code>dist/assets</code> with its relative path and linked in deterministic order. Source style entries may transform CSS before writing their declared output. <code>publicDir</code> defaults to <code>public</code>. Config and page metadata may be objects or functions of route props; page metadata wins. Reserve <code>afterBuild()</code> for host rewrites and extra artifacts rather than HTML or stylesheet mutation. Page JSX must not render body stylesheets.</p>
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
    <p>State-backed keyed lists may stay in a same-file or relative-imported component when the page passes its local state identifier directly as a prop. Default, named/aliased, and direct named re-export imports are resolved. Kudzu specializes that component to intrinsic list DOM at build time instead of retaining it in the browser.</p>
    <CodeBlock code={`function ItemList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

return <ItemList items={items} />`} />
    <p>One nested keyed map may read a direct array property of its parent item, such as <code>category.items.map(item =&gt; &lt;li key={`{item.id}`}&gt;...&lt;/li&gt;)</code>. Kudzu preserves parent and child DOM identity when either level updates or reorders. The child row must have an intrinsic root and may capture its child item; computed collections, parent-item capture, a second child list, third-level nesting, child components, effects, conditions, and row-local state remain unsupported.</p>
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
    <h3 id="reducers">Reducers</h3>
    <p>Reducer dispatch uses the same immediate logical state and batched DOM commit path without retaining a browser component.</p>
    <CodeBlock code={`import todoReducer from "../todoReducer"

const [todos, dispatch] = useReducer(todoReducer, [])
dispatch({ type: "add", title: "Ship" })`} />
    <p>A dispatch may cross one direct prop boundary into a same-file or relative-imported synchronous component. Kudzu specializes the call so the child handler compiles in the parent reducer scope.</p>
    <CodeBlock code={`function Controls({ dispatch }: { dispatch: Dispatch<TodoAction> }) {
  return <button onClick={() => dispatch({ type: "add", title: "Ship" })}>Add</button>
}

return <Controls dispatch={dispatch} />`} />
    <p>Relative TypeScript constants and helpers used inside an imported child handler are bundled into the parent handler graph with collision-free local names. The direct child may be a keyed row receiving its item and dispatch; its inline or simple <code>const</code> event handler reads the latest item from the existing list scope. That row may declare one top-level primitive-literal <code>useState</code>. The list key preserves its state across updates and reorder, removal releases it, and existing binding and conditional capabilities update only that row. A specialized dispatch component may also pass one inline or simple <code>const</code> callback containing dispatch into one relative-imported synchronous intrinsic child.</p>
    <CodeBlock code={`const add = (title: string) => dispatch({ type: "add", title })
return <Input onSubmit={add} />`} />
    <p>The callback is substituted into the child's compiled event handler; it is not serialized. Dispatch and callback components may use destructured string, finite-number, boolean, or <code>null</code> defaults; missing props receive those values during specialization. The current migration form requires direct <code>[state, dispatch]</code> destructuring, exactly two hook arguments, and a pure synchronous two-parameter reducer imported by default or name from a relative TypeScript module. Dispatch and callback components require one destructured props parameter, one intrinsic root, no effects, and inline or simple <code>const</code> handlers. Object, array, computed, and function-call defaults, multiple or non-keyed specialized local states, lazy state or reducer initialization, reducer-dispatch keyed-row effects, package, namespace, local, async, and generator reducers, package imports or child imports outside handlers, <code>useCallback</code>, further forwarding, and reducer dispatch through context remain unsupported.</p>
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
    <h3 id="effects">Effects</h3>
    <p>Browser-only work can use an inline <code>useEffect</code> callback with a literal dependency array. Kudzu emits that callback as route-specific ESM and patches only state-bound DOM; it does not ship or rerun the component.</p>
    <CodeBlock code={`const [items, setItems] = useState([])

useEffect(async () => {
  const response = await fetch("/api/items")
  setItems(await response.json())
}, [])`} />
    <p>Effects may update text, attributes, conditions, and keyed lists. They may directly return an inline cleanup function. A document effect cleans up when the document leaves outside the browser back-forward cache; an effect in a conditional branch or supported keyed row mounts and cleans up with that DOM owner.</p>
    <CodeBlock code={`useEffect(() => {
  const onResize = () => console.log(window.innerWidth)
  window.addEventListener("resize", onResize)
  return () => window.removeEventListener("resize", onResize)
}, [])`} />
    <p>Primitive state and runtime parameter identifiers may trigger cleanup and rerun without rerunning the component.</p>
    <CodeBlock code={`const [event, setEvent] = useState("resize")

useEffect(() => {
  const listener = () => console.log(event)
  window.addEventListener(event, listener)
  return () => window.removeEventListener(event, listener)
}, [event])`} />
    <p>Kudzu coalesces committed dependency changes, awaits every affected cleanup in declaration order, and then runs new setups in declaration order. Dependencies must be direct signal identifiers or aliases holding JSON-safe primitives. A keyed row may also use direct primitive properties such as <code>[item.id]</code> or <code>[version, item.name]</code>; only rows whose selected values changed rerun, reorder does not rerun, and key changes remount. Whole-item, computed, nested, derived, prototype-sensitive, ordinary local, object, spread, and dynamic dependencies are rejected. Effect callbacks remain inline and block-bodied; named or dynamic cleanup functions, cleanup parameters or generators, other return values, callback parameters, and non-serializable captures remain unsupported. Routes without dependency effects do not load <code>kudzu-deps.js</code>.</p>
    <p>An effect may own a relative TypeScript module Worker. Kudzu emits its graph separately and creates it only when the effect mounts.</p>
    <CodeBlock code={`useEffect(() => {
  const worker = new Worker(
    new URL("../telemetry.worker.ts", import.meta.url),
    { type: "module" },
  )
  return () => worker.terminate()
}, [])`} />
    <p>The supported form requires unshadowed global <code>Worker</code> and <code>URL</code>, exact <code>import.meta.url</code>, a relative <code>.worker.ts</code> literal, and exactly <code>{`{ type: "module" }`}</code>. Worker imports must use relative TypeScript ESM without JSX, packages, import-equals, dynamic imports, or <code>require()</code>; ordinary runtime imports of Worker source are rejected. Event handlers, imported helpers, and imported keyed-row effects cannot construct relative TypeScript Workers. Give keyed-row Workers to a directly compiled page or local component effect instead.</p>
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
    <h3>Inline SVG</h3>
    <p>Static and reactive SVG presentation props use familiar React spellings. Kudzu preserves native names such as <code>viewBox</code> and maps aliases such as <code>fillRule</code>, <code>clipRule</code>, <code>strokeWidth</code>, <code>strokeLinecap</code>, <code>strokeLinejoin</code>, opacity/color props, <code>textAnchor</code>, and <code>vectorEffect</code> to SVG attributes.</p>
    <CodeBlock code={`<svg viewBox="0 0 24 24">
  <path fillRule="evenodd" strokeWidth={active ? 2 : 1} strokeLinecap="round" />
</svg>`} />
  </section>
}
