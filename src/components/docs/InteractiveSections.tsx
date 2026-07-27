import { useState } from "@kudzujs/core"
import { CodeBlock } from "../CodeBlock"

function MenuBar() {
  return <nav className="docs-menu" aria-label="Example navigation">
    <a href="#components">Components</a><a href="#state">State</a><a href="#conditionals">Conditional DOM</a><a href="#lists">Keyed lists</a>
  </nav>
}

export function ConditionalsSection() {
  const [menuOpen, setMenuOpen] = useState(false)
  return <section className="docs-section" id="conditionals">
    <div className="docs-heading"><span>06</span><div><p>CORE · NEW</p><h2>Conditional DOM</h2></div></div>
    <p>Child <code>&amp;&amp;</code> and ternary expressions compile to bounded DOM ranges. Kudzu inserts or removes only that range and does not rerun a browser component tree.</p>
    <CodeBlock code={`function MenuBar() {
  return <nav><a href="/docs">Docs</a><a href="/about">About</a></nav>
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
      {menuOpen ? <button onClick={() => setMenuOpen(false)}>Close menu</button> : <button onClick={() => setMenuOpen(true)}>Open menu</button>}
    </div>
    {menuOpen && <MenuBar />}
    <div className="docs-callout"><strong>State</strong><span>Logical Kudzu state persists across branch switches. Uncontrolled input values, focus, selection, and imperative DOM mutations reset when a branch is remounted.</span></div>
    <p>Top-level and block-scoped immutable <code>const</code> values can hold static JSX, state-dependent branches, aliases, and nested JSX locals. Kudzu compiles their initializers to the same bounded ranges as inline conditions.</p>
    <CodeBlock code={`const menu = open ? <MenuBar /> : <p>Menu dormant</p>
const content = open && menu

return <main>{content}</main>`} />
    <CodeBlock code={`if (loading) return <Loading />
if (failed) return <ErrorView />
return <Content />

let view
if (open) view = <MenuBar />
else view = <p>Menu dormant</p>
return view`} />
    <p>Terminal early-return chains and one adjacent exhaustive <code>let</code> assignment normalize to the same bounded conditional ranges. Branches may contain only that return or assignment; effectful statements and non-exhaustive or later assignments are rejected for reactive rendering.</p>
    <p>A 1,000-component A/B build emitted identical runtime assets and condition counts. Mixed block-local, early-return, and assignment source added 18 B gzip for evaluator exports and increased clean build time from 590 ms to 604 ms.</p>
    <p>Both branches are rendered into inert templates at build time. Conditional rendering is a UI mechanism, not an authorization boundary: do not place secrets or access-controlled content in a dormant branch, and avoid build-time side effects in branch components.</p>
  </section>
}

export function ListsSection() {
  const [demoTrees, setDemoTrees] = useState([{ id: 1, name: "Oak" }, { id: 2, name: "Pine" }])

  function createTrees() {
    setDemoTrees([{ id: 1, name: "Oak" }, { id: 2, name: "Pine" }])
  }

  function addTree() {
    const id = Math.max(0, ...demoTrees.map(item => item.id)) + 1
    setDemoTrees([...demoTrees, { id, name: `Vine ${id}` }])
  }

  function reverseTrees() {
    setDemoTrees([...demoTrees].reverse())
  }

  return <section className="docs-section" id="lists">
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
  setItems([...items, { id, name: "Vine " + id }])
}

function reverse() {
  setItems([...items].reverse())
}

const rows = items.map(item => <li key={item.id} style={{ opacity: item.id % 2 ? 1 : 0.7 }}>
  <span>{item.name}</span>
  {item.id % 2 ? <strong>Odd</strong> : <small>Even</small>}
  <button onClick={() => setItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
</li>)

return <><button onClick={create}>Create</button><button onClick={add}>Add</button><button onClick={reverse}>Reverse</button><ul>{rows}</ul></>`} />
    <p>A top-level same-file row component or one imported from a relative TypeScript module can be the map root. Default, named, aliased, and named re-export imports resolve at build time. Kudzu specializes each call, supporting projected props, callback props, simple local calculations, and inline effects without shipping a browser component runtime.</p>
    <CodeBlock code={`function TreeRow({ name, onRemove }: { name: string; onRemove: () => void }) {
  const label = name.toUpperCase()
  return <li>{label}<button onClick={() => onRemove()}>Remove</button></li>
}

const rows = items.map(item =>
  <TreeRow key={item.id} name={item.name} onRemove={() => setItems(items.filter(entry => entry.id !== item.id))} />
)`} />
    <div className="list-demo">
      <div className="list-demo-actions"><span>LIVE KEYED LIST</span><button onClick={createTrees}>Create</button><button onClick={addTree}>Add</button><button onClick={reverseTrees}>Reverse</button></div>
      <ul>{demoTrees.map(item => <li key={item.id} data-id={item.id} style={{ opacity: item.id % 2 ? 1 : 0.7 }}>
        <span>{item.name}</span>{item.id % 2 ? <strong>Odd</strong> : <small>Even</small>}<code>#{item.id}</code>
        <button onClick={() => setDemoTrees(demoTrees.filter(entry => entry.id !== item.id))}>Remove</button>
      </li>)}</ul>
    </div>
    <div className="docs-callout"><strong>Keys</strong><span>Keys must be unique strings or finite numbers. Existing keys move rather than remount, preserving uncontrolled descendant DOM state.</span></div>
    <p>Each item and nested object must be an ordinary plain object; null-prototype objects are rejected for JSON round-trip parity. The map may be direct JSX or one top-level immutable local rendered once as a JSX child. A row component accepts destructured props, top-level single-<code>const</code> calculations, and inline effects before one intrinsic return; it remains reusable because only each call site is specialized. Row effects mount after insertion and clean up on removal. Dependencies may be empty, direct primitive Kudzu state identifiers, or direct primitive item properties such as <code>[item.id]</code> and <code>[version, item.name]</code>. Selected field changes rerun only affected rows with the complete latest item; unrelated fields and reorder do nothing, while key changes remove and mount. Whole-item, computed, nested, derived, and prototype-sensitive dependencies are rejected. Direct item-property reads use compact markers. Derived item text, attributes, object styles, and single-level <code>&amp;&amp;</code> or ternary JSX conditions compile to external ESM evaluators and must remain pure and synchronous. Conditional branches patch only their bounded DOM and mount or unmount their handlers and effects. Mutation, Promise values, arbitrary calls, browser globals, component state, imported helpers used in calculations, and prototype-sensitive properties are rejected. Direct item handlers receive the latest JSON-safe item for their key. Package or namespace row imports, same-file exported rows, reusable aliases, prop spreads/defaults/rest, children, nested item conditions, lists, component tags, fragments, refs, and <code>dangerouslySetInnerHTML</code> remain unsupported. Put keyed rows inside an explicit <code>tbody</code>, <code>thead</code>, or <code>tfoot</code>.</p>
  </section>
}

export function EventsSection() {
  return <section className="docs-section" id="events">
    <div className="docs-heading"><span>08</span><div><p>CORE</p><h2>Event handlers</h2></div></div>
    <p>Setter-only handlers compile to ordered commands. Conditions, browser APIs, event reads, and async code compile to external ESM without <code>eval</code>.</p>
    <p>Native handlers use direct DOM listeners with normal <code>currentTarget</code>, bubbling, default-action, and propagation semantics. Handler modules load before listener registration, so <code>preventDefault()</code>, <code>stopPropagation()</code>, and <code>stopImmediatePropagation()</code> work synchronously as expected.</p>
    <p>Native handlers may call default, named, or namespace helpers from relative TypeScript modules. Kudzu bundles the reachable helper graph into handler ESM and shared chunks. Helper runtime imports must remain relative; package imports, dynamic imports, JSX helpers, and direct imported event callbacks are rejected.</p>
    <p>Object refs resolve DOM elements when a native handler reads <code>current</code>. They initialize with <code>null</code> and need no effect or hydration lifecycle.</p>
    <CodeBlock code={`const inputRef = useRef<HTMLInputElement>(null)

return <><input ref={inputRef} /><button onClick={() => inputRef.current?.focus()}>Focus</button></>`} />
    <CodeBlock code={`async function loadStatus() {
  setLoading(true)
  const response = await fetch("/api/status")
  setLoading(false)
}`} />
    <CodeBlock code={`import { normalizeStatus } from "../lib/status"

async function loadStatus() {
  const response = await fetch("/api/status")
  setStatus(normalizeStatus(await response.json()))
}`} />
  </section>
}

export function CapturesSection() {
  return <section className="docs-section" id="captures">
    <div className="docs-heading"><span>09</span><div><p>CORE</p><h2>Client captures</h2></div></div>
    <p>Handlers and reactive expressions may capture serializable component locals and destructured props.</p>
    <div className="docs-columns">
      <div><strong>Supported</strong><p>Strings, booleans, numbers, arrays, plain objects, and destructured props.</p></div>
      <div><strong>Unsupported</strong><p>Function captures, symbols, bigints, cycles, and class instances. Relative imported helpers use browser ESM instead of capture serialization.</p></div>
    </div>
  </section>
}
