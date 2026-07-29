<p align="center">
  <img src="https://raw.githubusercontent.com/kudzujs/kudzu/main/public/icon-128.png" width="96" alt="Kudzu logo">
</p>

# Kudzu

HTML-first TSX framework with synchronous state semantics and no virtual DOM.

Kudzu keeps the familiar function-component, props, children, event-handler, `useState`, `useReducer`, and mount-effect shape. Static components compile to HTML. Simple interactions compile to small behavior commands, while normal sync or async JavaScript handlers and mount effects compile to external ESM.

> Experimental `0.6.x`: the compiler API and supported TSX surface may change.

Documentation: [kudzujs.cloud/docs](https://kudzujs.cloud/docs)

Development target: [Goal A static business applications](./GOAL_A.md)

## Install

Create a new project:

```bash
npm create kudzu@latest my-app
cd my-app
npm run dev
```

Or add Kudzu to an existing project:

```bash
npm install @kudzujs/core
```

Add scripts:

```json
{
  "scripts": {
    "dev": "kudzu dev",
    "build": "kudzu build"
  }
}
```

Configure TypeScript:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@kudzujs/core",
    "strict": true
  }
}
```

Make sure application TSX files are included by this `tsconfig.json`. Files outside its `include` may fall into an editor-inferred React project and incorrectly report a missing `react/jsx-runtime` or React event-type errors.

Create `src/pages/index.tsx`:

```tsx
import { useState } from "@kudzujs/core"

export default function HomePage() {
  const [count, setCount] = useState(0)

  function increaseTwice() {
    setCount(count + 1)
    setCount(count + 1)
  }

  return <button onClick={increaseTwice}>Count: {count}</button>
}
```

```bash
npm run dev
```

Pages live in `src/pages`; `index.tsx` maps to `/`. `npm run dev` serves locally on `127.0.0.1`, reloads the browser after successful rebuilds, and shows build failures in an error overlay. Across that full-page reload, compatible Kudzu logical state is briefly preserved by route-unique state variable name for the current pathname, query, and hash, including controlled properties, conditions, and keyed-list arrays. Renamed, removed, and duplicate-named state is skipped. Uncontrolled DOM state, focus, selection, and imperative DOM mutations are not preserved. The server starts at `PORT` or `3000` and increments until it finds an available port. Set `HOST=0.0.0.0` when a local reverse proxy or container must reach the server. The development client and state snapshot are dev-only; production output in `dist/` is unaffected.

Dynamic static pages use bracket parameters and `getStaticPaths()`:

```tsx
// src/pages/posts/[slug].tsx
export async function getStaticPaths() {
  return [
    { params: { slug: "oak" }, props: { title: "Oak" } },
    { params: { slug: "pine" }, props: { title: "Pine" } }
  ]
}

export default function Post({ title }: { title: string }) {
  return <h1>{title}</h1>
}
```

This emits `/posts/oak` and `/posts/pine`. Parameter values must be safe single path segments; missing, unsafe, and duplicate routes fail the build.

When a bracket value exists only in the request URL, opt into one static fallback document and read it with `useParams()`:

```tsx
// src/pages/items/[id].tsx
import { useEffect, useParams } from "@kudzujs/core"

export const runtimeParams = true

export default function ItemPage() {
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetch(`/api/items/${encodeURIComponent(id)}`)
  }, [])

  return <h1>Item {id}</h1>
}
```

This emits `dist/items/[id]/index.html` and a route-specific pathname matcher. `getStaticPaths()` and `runtimeParams` are mutually exclusive. Runtime parameters occupy complete path segments, decode once, and reject empty, malformed, separator, control, and traversal-like values. The development server resolves deep links automatically. Production static hosts must try exact files first, then internally rewrite matching paths to the fallback file while preserving the browser URL; `.kudzu/kudzu-plan.json` and `afterBuild()` expose ordered `rewrites` for host adapters. Navigation remains ordinary `<a>` document navigation, not an SPA router.

Static trusted HTML can be rendered without a transform layer:

```tsx
<article dangerouslySetInnerHTML={{ __html: renderedNotionHtml }} />
```

The HTML is intentionally not sanitized. Use only trusted or previously sanitized build-time content. Reactive raw HTML, children on the same element, void elements, and keyed-list raw HTML are rejected.

Every CSS file under `src` is copied to the same relative path under `dist/assets` and linked in deterministic order. Configured root-relative URLs receive `base`; absolute HTTP URLs are preserved. A source style entry reads CSS, optionally transforms it, writes its declared output, and links it without an `afterBuild` file pipeline. `publicDir` defaults to `public` and may point elsewhere. Global or page `metadata` may be an object or a function of `{ route, params, props }`, so route props can set document language and head resources before rendering:

```js
export default {
  base: "/newsletter",
  publicDir: "../public",
  styles: [{
    source: "../src/styles/global.css",
    output: "/assets/styles.css",
    transform: css => transformCss(css)
  }],
  metadata: ({ props }) => ({ lang: props.locale, manifest: "/manifest.json" }),
  async afterBuild({ outDir, routes, plans, rewrites, base }) {
    // Write host rewrites, RSS, sitemap, or other non-document artifacts.
  }
}
```

The transform may return CSS text or an object with a `css` string, matching common CSS processor results. Page-exported `metadata` takes precedence over config metadata and may use the same function form.

Do not render `<link rel="stylesheet">` from page or component JSX. Kudzu rejects direct static body stylesheets with a source location and catches computed JSX stylesheet output during rendering. Trusted `dangerouslySetInnerHTML` remains unparsed and is responsible for its own resource tags.

## State Semantics

Kudzu intentionally differs from React's state snapshot behavior:

```tsx
function increaseTwice() {
  setCount(count + 1)
  setCount(count + 1)
}
```

- A setter updates logical state immediately.
- The next statement reads the latest logical state.
- Setters execute in source order.
- DOM writes batch at synchronous-turn boundaries.
- The same input produces the same execution plan.

The handler above increments by two and patches its bound DOM once. Inspect the generated plan at `.kudzu/kudzu-plan.json`.

State may also hold serializable plain objects. Property expressions in JSX text update directly:

```tsx
const [weather, setWeather] = useState({ temperature: 28, label: "Warm" })

return <p>{weather.temperature}° {weather.label}</p>
```

Derived text uses comment-bounded text nodes rather than wrapper elements, so table cells, options, SVG text, layout, and element selectors keep their authored structure.

Reducer state uses the same immediate logical updates and batched DOM commit:

```tsx
import todoReducer from "../todoReducer"

const [todos, dispatch] = useReducer(todoReducer, [])
dispatch({ type: "add", title: "Ship" })
```

The reduced migration form requires `[state, dispatch]`, exactly two hook arguments, and a synchronous two-parameter reducer exported as a default or named value from a relative TypeScript module. Dispatches in compiled handlers lower to functional state updates. A dispatch may cross one direct prop boundary into a same-file or relative-imported synchronous component whose intrinsic root contains the compiled handler:

```tsx
function Controls({ dispatch }: { dispatch: Dispatch<TodoAction> }) {
  return <button onClick={() => dispatch({ type: "add", title: "Ship" })}>Add</button>
}

return <Controls dispatch={dispatch} />
```

Kudzu specializes that call at build time; no function prop or child component survives in the browser. Reducers follow React's pure reducer contract. The direct child may also be a keyed row such as `todos.map(todo => <Item key={todo.id} todo={todo} dispatch={dispatch} />)`. Its inline or simple `const` event handler receives the latest keyed item. That row may declare one top-level `useState` with a primitive literal initial value; the existing list key owns its state across item updates and reorder, and removal releases it so a later re-add starts from the initializer. Reactive attributes and conditional DOM use the existing binding capability. Relative TypeScript constants and helpers used inside the handler are renamed for call-site safety and bundled into the parent handler graph. Lazy state or reducer initializers, multiple or non-keyed specialized local states, package, namespace, local, async, and generator reducers, package imports or child imports used outside event handlers, further dispatch forwarding, reducer-dispatch keyed-row effects, and reducer dispatch through context remain unsupported.

That specialized component may pass one inline or simple `const` callback containing dispatch to one relative-imported synchronous child with an intrinsic root:

```tsx
const add = (title: string) => dispatch({ type: "add", title })
return <Input onSubmit={add} />
```

Kudzu substitutes the callback into the child's compiled event handler at build time. This is not general function-prop serialization: only one nested specialized callback boundary is supported, and `useCallback`, further forwarding, effects, component roots, and callback use outside event handlers are rejected.

Reducer dispatch and callback components may use destructured string, finite-number, boolean, or `null` defaults. A missing prop is replaced during specialization; object, array, computed, and function-call defaults remain unsupported:

```tsx
function Input({ onSubmit, editing = false }) {
  // ...
}
```

## Reactive Attributes

`className`, `disabled`, controlled `value`, and controlled `checked` accept normal state-dependent TSX expressions. The same `value` binding works for inputs and selects:

```tsx
<div className={active ? "active" : "idle"} />
<button disabled={loading}>Save</button>
<input value={name} onInput={event => setName(event.currentTarget.value)} />
<input type="checkbox" checked={subscribed} onChange={event => setSubscribed(event.currentTarget.checked)} />
<select value={theme} onChange={event => setTheme(event.currentTarget.value)} />
<div style={{ opacity: open ? 1 : 0, width: open ? 240 : 0 }} />
```

Regular attributes use the same expressions without an allowlist:

```tsx
<button
  aria-expanded={open}
  data-state={open ? "open" : "closed"}
  hidden={!visible}
  title={open ? "Close menu" : "Open menu"}
/>
```

Kudzu compiles derived expressions to external ESM and patches only the bound DOM attribute or property. `aria-*` and `data-*` boolean values serialize as `"true"` or `"false"`; ordinary false values remove the attribute. Object `style` values use React-shaped camelCase properties, add `px` to nonzero dimensional numbers, and preserve unitless properties and CSS custom properties. Reactive `dangerouslySetInnerHTML` remains unsupported.

Inline SVG accepts React-shaped presentation props for static and reactive values. Kudzu preserves native camelCase SVG names such as `viewBox` while mapping common aliases such as `fillRule`, `clipRule`, `strokeWidth`, `strokeLinecap`, `strokeLinejoin`, opacity/color props, `textAnchor`, and `vectorEffect` to their SVG attribute names:

```tsx
<svg viewBox="0 0 24 24">
  <path fillRule="evenodd" strokeWidth={active ? 2 : 1} strokeLinecap="round" />
</svg>
```

## DOM Refs

Use an object ref to access an element from a normal event handler:

```tsx
const inputRef = useRef<HTMLInputElement>(null)

return <>
  <input ref={inputRef} />
  <button onClick={() => inputRef.current?.focus()}>Focus</button>
</>
```

Kudzu resolves `current` when the handler reads it, so removed conditional elements return `null` without a component runtime. Refs must initialize with `null`; callback refs, mutable value refs, and refs inside keyed lists are not supported.

## Context

Create a context to pass static or reactive values through component layers without prop drilling:

```tsx
type ThemeValue = { theme: string; setTheme: (theme: string) => void }
const ThemeContext = createContext<ThemeValue | null>(null)

function Toolbar() {
  const value = useContext(ThemeContext)
  if (!value) return null
  return <button className={`theme-${value.theme}`} onClick={() => value.setTheme("light")}>{value.theme}</button>
}

function App() {
  const [theme, setTheme] = useState("dark")
  return <ThemeContext.Provider value={{ theme, setTheme }}><Toolbar /></ThemeContext.Provider>
}
```

Context values may contain state, setters, arrays, nested plain objects, and static serializable fields. Consumers can read reactive properties, destructure or rename them, and call setters from normal handlers. Kudzu serializes only state and setter IDs, then materializes live browser getters and batched setters; no function source, Provider tree, component tree, or hydration is shipped. The default applies outside a Provider and nested Providers resolve to independent concrete state IDs at build time. Arbitrary functions, accessors, cycles, symbols, and non-plain objects remain rejected at the browser capture boundary.

## Conditional DOM

Inline child `&&` and ternary expressions insert and remove bounded DOM ranges directly. A menu bar needs only state setters:

```tsx
function MenuBar() {
  return <nav><a href="/docs">Docs</a></nav>
}

const [open, setOpen] = useState(false)

{open
  ? <button onClick={() => setOpen(false)}>Close menu</button>
  : <button onClick={() => setOpen(true)}>Open menu</button>}
{open && <MenuBar />}
```

Logical state persists across branch switches, while uncontrolled DOM state resets on remount. Both branches are materialized in inert templates at build time, so conditional rendering is not an authorization boundary and dormant branches must not contain secrets.

Reactive conditional DOM currently targets the HTML namespace and is rejected inside SVG or MathML.

Top-level or block-scoped immutable JSX locals can hold static or state-dependent branches:

```tsx
const menu = open ? <MenuBar /> : <p>Menu dormant</p>
const content = open && menu

return <main>{content}</main>
```

Kudzu compiles the local initializer to the same bounded DOM ranges as an inline condition. Terminal early returns and one adjacent exhaustive `let` assignment normalize to the same representation:

```tsx
if (loading) return <Loading />
if (failed) return <ErrorView />
return <Content />

let view
if (open) view = <Menu />
else view = <p>Closed</p>
return view
```

Branches may contain only the return or assignment being normalized. Effectful statements, non-exhaustive assignments, later reassignment, loops, `switch`, and `try` remain ordinary JavaScript and state-dependent render forms are rejected rather than evaluated against signal-object truthiness. Reactive branches are still both rendered into inert templates at build time.

A 1,000-component A/B build compared direct ternaries with an even mix of block locals, early returns, and exhaustive assignment. Both emitted 1,000 conditions and byte-identical runtime assets. The mixed source added 18 B gzip for three equivalent evaluator exports instead of one and built in 604 ms versus 590 ms (+2.24%).

## Keyed Lists

Map local array state directly to one keyed JSX element per item:

```tsx
const [items, setItems] = useState([
  { id: 1, name: "Oak", done: false },
  { id: 2, name: "Pine", done: true }
])

const rows = items.map(item =>
  <li
    key={item.id}
    className={item.done ? "done" : "active"}
    aria-label={`${item.name} item`}
    style={{ opacity: item.done ? 0.5 : 1 }}
  >
    {item.name.toUpperCase()}
    {item.done ? <strong>Complete</strong> : <span>Pending</span>}
    <button onClick={() => setItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
  </li>
)

return <ul>{rows}</ul>
```

The root may also be a top-level row component declared in the same file or imported from a relative TypeScript module. Default, named, aliased, and named re-export imports are resolved at build time. Kudzu specializes each call, so projected props, callback props, and simple local calculations compile to the same intrinsic list template:

```tsx
function ItemRow({ name, done, onRemove }: {
  name: string
  done: boolean
  onRemove: () => void
}) {
  const className = done ? "done" : "active"
  return <li className={className}>
    {name}
    <button onClick={() => onRemove()}>Remove</button>
  </li>
}

const rows = items.map(item => <ItemRow
  key={item.id}
  name={item.name}
  done={item.done}
  onRemove={() => setItems(items.filter(entry => entry.id !== item.id))}
/>)
```

The map may also stay inside a component that receives the local state array directly. The component may be declared in the page or imported by default or name from a relative TypeScript module; direct named re-exports are resolved at build time:

```tsx
function ItemList({ items }: { items: Item[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

return <ItemList items={items} />
```

The original row component remains reusable across multiple lists and ordinary JSX. State-backed list wrappers and row components are specialized to intrinsic JSX at build time; no component function or component runtime is shipped to the browser. Kudzu emits initial items as static HTML, then adds, removes, updates, styles, conditional branches, and moves keyed elements directly. The map may appear directly in JSX, in one top-level immutable `const` rendered once as a JSX child, or in one synchronous wrapper receiving the state identifier as a direct prop. Existing keys move without remounting, preserving uncontrolled descendant state. Direct `item.<field>` reads use compact markers; derived item expressions compile to external ESM evaluators. Single-level item-local `&&` and ternary JSX conditions patch only their bounded branch and mount or unmount its handlers. Item-local handlers and effects receive the latest JSON-safe item for their key. Effects mount after a row is connected and clean up when it is removed. A direct primitive item dependency such as `[item.name]`, optionally mixed with state as `[version, item.name]`, reruns only rows whose selected value changed; the replacement setup receives the complete latest item. Unrelated fields and reorder do not rerun it, while a key change removes and mounts the row. The item remains stored once in shared list state; runtime descriptors carry a placeholder that the list runtime fills when mounting or updating the keyed root.

One nested keyed map may read a direct array property of its parent item. This supports category/item data populated after mount while preserving both parent and child DOM identity across updates and reorder:

```tsx
{categories.map(category => <section key={category.id}>
  <h2>{category.title}</h2>
  <ul>{category.items.map(item => <li key={item.id}>{item.title}</li>)}</ul>
</section>)}
```

The nested collection must be `parent.<field>`, the child row must have one intrinsic root, and child handlers may capture the child item. A second child list, third nesting level, computed collection, parent-item capture from the child row, child conditions, child effects, child components, and child row-local state remain unsupported.

Each item must be an ordinary plain object with a unique string or finite-number key; nested data may contain only JSON-safe arrays, ordinary plain objects, and primitive values. Null-prototype objects are rejected to preserve JSON round-trip parity. The current syntax requires a local-state `.map`, one identifier callback parameter, one intrinsic JSX root or top-level local or relative-imported row component, and `key={item.<field>}`. State-backed list wrappers use one destructured props parameter, an intrinsic return root, no effects, and a direct local-state prop. Same-file wrappers must be unexported and state-backed at every call; relative default, named/aliased, and direct named re-export wrappers are specialized per qualifying call. Row components accept destructured projected props, top-level single-`const` calculations and inline effects before one intrinsic return. Effect dependencies inside a row may be empty, direct primitive Kudzu state identifiers, or direct `item.<field>` properties whose selected values remain JSON-safe primitives. Whole-item, computed, nested, derived, `__proto__`, `prototype`, and `constructor` dependencies are rejected. A list alias may only be rendered once and cannot be read by other JavaScript. Derived expressions must be pure and synchronous: item reads, literals, operators, templates, approved read-only string/array methods, deterministic `Math` methods, and `String`/`Number`/`Boolean` conversion are supported. Component state, imported helpers used inside calculations, browser globals, Promise values, mutation, arbitrary calls, and prototype-sensitive properties are rejected. Package, namespace, and star-export list wrappers, package or namespace row imports, same-file exported rows, reusable aliases, prop spreads/defaults/rest, children, nested item conditions beyond the direct one-level form above, component tags, refs, and `dangerouslySetInnerHTML` remain unsupported. Keyed rows must be placed inside an explicit `<tbody>`, `<thead>`, or `<tfoot>`.

The focused wrapper fixture emits 1,393 B raw / 500 B gzip HTML and 10,719 B raw / 4,665 B gzip JavaScript across its route capabilities. After one warm-up, seven clean builds measured 314.1, 325.3, 322.3, 327.2, 336.1, 322.4, and 315.0 ms, with a 322.4 ms median.

The three-wrapper relative-import fixture emits 2,279 B raw / 629 B gzip HTML and 11,370 B raw / 4,828 B gzip JavaScript, including one imported-wrapper item expression; its unused component handler module is not emitted. After one warm-up, seven clean builds measured 340.2, 349.4, 352.8, 335.0, 354.1, 364.3, and 349.5 ms, with a 349.5 ms median.

## Effects

Browser-only initial work uses the familiar empty-dependency effect shape:

```tsx
import { useEffect, useState } from "@kudzujs/core"

const [items, setItems] = useState([])

useEffect(async () => {
  const response = await fetch("/api/items")
  setItems(await response.json())
}, [])
```

Kudzu does not execute the effect during static rendering and does not ship the component. It emits one route-specific effect entry that invokes the compiled callback against existing logical state and direct DOM commit capabilities. Effects may update reactive text, attributes, conditions, and keyed lists. Multiple effects start independently in source order, and one synchronous or asynchronous failure is reported without suppressing later effects.

An effect may directly return an inline cleanup function:

```tsx
useEffect(() => {
  const onResize = () => console.log(window.innerWidth)
  window.addEventListener("resize", onResize)

  return () => window.removeEventListener("resize", onResize)
}, [])
```

Document-owned cleanup runs once when the document leaves outside the browser back-forward cache. An effect in a conditional branch or supported keyed row mounts only while its DOM owner is present and cleans up once when that owner is removed. Effect-local resources and component state read by nested cleanup closures retain their setup-time values. Cleanup failures are isolated so later cleanups still run.

Literal arrays of direct primitive `useState` or `useParams` signal identifiers rerun after committed dependency changes:

```tsx
const [event, setEvent] = useState("resize")

useEffect(() => {
  const listener = () => console.log(event)
  window.addEventListener(event, listener)
  return () => window.removeEventListener(event, listener)
}, [event])
```

Dependency values are limited to JSON-safe strings, finite numbers, booleans, and `null`; direct signal aliases are accepted, while expressions, property reads, ordinary props or locals, objects, spreads, and dynamic arrays fail the build. Kudzu compares dependencies with `Object.is`, coalesces multiple commits in one turn, invokes every affected previous cleanup in declaration order, awaits asynchronous cleanup, and then runs the affected setups in declaration order. The component itself is not rerun.

Effect callbacks must be inline and block-bodied. Named or dynamically obtained cleanup functions, cleanup parameters or generators, other return values, callback parameters, and non-serializable captures are rejected. Async effects cannot return cleanup functions; the cleanup itself may be async. Pages without effects receive no effect entry. Empty-dependency effects retain their smaller output, and dependency-only capability code is isolated to the routes that use `kudzu-deps.js` unless another capability already requires the shared runtime.

An inline effect may own an exact relative TypeScript module Worker:

```tsx
useEffect(() => {
  const worker = new Worker(
    new URL("../telemetry.worker.ts", import.meta.url),
    { type: "module" },
  )
  return () => worker.terminate()
}, [])
```

Kudzu resolves the path from the callback source, bundles the Worker and its relative TypeScript imports separately as content-hashed ESM under `assets/workers`, and rewrites the constructor to the base-prefixed same-origin asset URL. The Worker is fetched only when the effect mounts; it is not a capability script, preload, or window import. Unrendered effect handlers do not cause their Worker root to be emitted. This slice requires unshadowed global `Worker` and `URL`, exact `import.meta.url`, a relative `.worker.ts` string literal, and exactly `{ type: "module" }`. Worker graphs reject JSX, package runtime imports, TypeScript import-equals declarations, dynamic imports, `require()`, missing files, and paths outside `src`. Worker source cannot be imported or re-exported as an ordinary runtime module. Construction in event handlers, imported helpers, or imported keyed-row effects is rejected; move keyed-row Worker ownership to a directly compiled page or local component effect. Public or absolute JavaScript Workers remain ordinary browser code and are not transformed.

Route-owned browser requests use the same dependency-effect cleanup rather than a request runtime. Keep the effect callback synchronous, create an `AbortController` and timeout inside it, start the promise chain, and directly return cleanup that clears the timer and aborts the request. A command-only handler can update primitive command/revision state; the dependency effect then owns the request. Replacement or route disposal runs cleanup before the next setup and invalidates the old effect's setters. Applications must still check `response.ok`, distinguish timeout from other failures, and guard any imperative DOM writes themselves.

A matched mount-fetch benchmark renders a title and two keyed rows from local JSON. With one warm-up and seven rotating clean builds, Kudzu shipped initial HTML, 3.4 KB initial JS gzip, 8.1 KB total output, and built in 374 ms. React CSR shipped no initial content, 59.3 KB initial JS gzip, 189.2 KB total output, and built in 992 ms. Hand-written ESM shipped 534 B initial JS gzip, 1.2 KB total output, and built in 210 ms. Fresh-profile Chrome medians to loaded data were 157.9 ms, 166.5 ms, and 153.4 ms respectively.

A matched resize-listener cleanup fixture, measured with the same warm-up and seven rotating clean builds, shipped 1.2 KB JavaScript gzip and built in 402 ms with Kudzu. Svelte shipped 10.1 KB and built in 861 ms, Vue shipped 23.6 KB and built in 768 ms, and React shipped 59.1 KB and built in 1,058 ms. Kudzu and the 127 B hand-written Astro baseline emitted initial HTML; the CSR fixtures did not.

In the matched dependency-rerun fixture, Kudzu shipped 1.5 KB JavaScript gzip and built in 429 ms. Svelte shipped 9.7 KB in 995 ms, Vue 23.8 KB in 943 ms, React 59.2 KB in 1,172 ms, and the hand-written Astro baseline 196 B in 969 ms. Kudzu and Astro emitted initial HTML; the CSR fixtures did not.

## Normal JavaScript

Command-only setters use the smallest optimized path. Conditions, local variables, browser globals, events, and `async`/`await` compile to external ESM without `eval`, `new Function`, or inline executable code.

```tsx
async function load() {
  setStatus("loading")

  try {
    const response = await fetch("/api/status")
    const result = await response.json()
    setStatus(result.status)
  } catch {
    setStatus("failed")
  }
}
```

Native handlers may call default, named, or namespace helpers imported from relative TypeScript modules. Kudzu bundles the reachable helper graph into handler ESM and shared chunks; helper runtime imports must remain relative, and dynamic imports or JSX helpers are rejected. Imported functions cannot be used directly as JSX event callbacks.

```tsx
import { normalizeStatus } from "../lib/status"

async function load() {
  const response = await fetch("/api/status")
  setStatus(normalizeStatus(await response.json()))
}
```

Primitive values, arrays, plain objects, and destructured props can be captured by client handlers. Functions, symbols, bigints, cycles, and class instances are not supported as captures.

Native handlers use direct DOM listeners with normal `currentTarget`, bubbling, default-action, and propagation semantics. Handler modules load before listener registration, so `preventDefault`, `stopPropagation`, and `stopImmediatePropagation` work synchronously as expected.

## Rendering

```text
TSX
├─ static component      → HTML
├─ ordered state setter  → behavior command
├─ conditional child     → bounded DOM range
├─ keyed state map       → keyed DOM moves
└─ normal JS handler     → external ESM
```

- Static pages ship no client JavaScript.
- Interactive pages receive only the runtime capabilities they use.
- Interactive route modules are discovered in the document head and retain deferred execution after HTML parsing, overlapping cold downloads with document transfer.
- Production JavaScript is minified; development output stays readable.
- Components are authoring units; no component tree is retained in the browser.
- There is no VDOM, hydration pass, retained component tree, default router, or general client application runtime.

## Application Navigation

Pages may export one shared layout while continuing to emit complete standalone documents:

```tsx
export { Shell as layout } from "../components/Shell"

export default function ProductPage() {
  return <main><h1>Product</h1></main>
}
```

Opt emitted exact or runtime-parameter routes into same-document navigation:

```js
export default {
  navigation: { routes: ["/product", "/items/[id]"] }
}
```

The legacy single-group form remains supported. Applications with multiple shared layouts use mutually exclusive `groups`:

```js
export default {
  navigation: { groups: [
    { routes: ["/product", "/items/[id]"] },
    { routes: ["/account", "/settings"] }
  ] }
}
```

Every configured identity must be a unique emitted exact route or `runtimeParams` bracket pattern. Routes within each group must export the same layout function identity; different groups may export different layouts. Kudzu emits one deterministic, route-set-hashed navigation asset per group containing only that group's records and capabilities. Path domains may overlap within a group, where exact and more-specific matching wins, but overlapping exact/runtime or runtime/runtime domains across groups fail the build.

The layout DOM, state, and effects persist within its group; route state, parameters, and effects reset after cleanup on each transition. Conditional effects mount only while their DOM is connected. Keyed row effects mount per connected row, survive reorder, rerun only rows whose selected direct primitive item dependency changed, receive the latest complete item, and clean up on removal. Cached route modules create fresh route owner records and subscriptions on every revisit. Eligible same-group anchors prefetch validated complete documents into a finite memory cache. Cross-group links, ungrouped routes, direct requests, reloads, malformed runtime paths, JavaScript failures, and unsupported links retain native document navigation.

This produces fast same-document route changes, but it does not add a coordinated transition animation. CSS entry animations can style newly inserted route content; exit and shared-element View Transitions are not integrated yet.

Example Nginx configuration:

```nginx
location / {
    try_files $uri $uri/ $uri/index.html =404;
}
```

## Current Scope

Supported:

- Function components, props, children, fragments, and TSX
- File-based static routes
- Build-time async components
- Dynamic static routes with build-time props
- Runtime bracket parameters with static fallback documents and host rewrite metadata
- Static trusted `dangerouslySetInnerHTML`
- Base-path deployments, multiple CSS files, and `afterBuild`
- `useState` and relative-imported `useReducer` bindings
- Mount-only `useEffect(fn, [])` compiled to route-specific ESM
- Relative TypeScript module Workers owned by inline effects
- Conditional and keyed-row effect ownership with cleanup on DOM removal
- Synchronous and async event handlers
- Relative imported helpers in native handlers
- Serializable component-local captures
- Direct text DOM patches
- Reactive standard, `aria-*`, and `data-*` attributes
- Reactive object `style` attributes
- Static and reactive React-shaped SVG presentation attributes
- Object DOM refs in native event handlers
- Default, nested, and reactive context providers
- Controlled `value` and `checked` form properties
- Conditional child `&&` and ternary DOM patches
- Top-level and block-scoped JSX locals, terminal early returns, and exhaustive JSX assignment
- Direct keyed local-state lists
- Page-exported shared layouts with layout/route state lifetimes
- Opt-in exact/runtime-route navigation with complete-document prefetch and native fallback
- Layout- and route-lifetime effect mounts in navigation groups
- Conditional/keyed DOM-owned effects in navigation groups

Not implemented yet:

- Reusable keyed-list aliases
- Server actions and request-time SSR
- React package islands
- HMR and framework DevTools

## Benchmarks

### Goal A Commerce Journey

The matched fixture covers home, category, product, cart, checkout, and account routes with complete initial HTML, shared application layout state, product options, optimistic cart success and rejection, accessible errors, rollback, and product-to-cart navigation. Kudzu, React + Vite, Next.js, Nuxt, and SvelteKit render the same tested content and interactions.

Browser medians use seven rotating fresh Chrome profiles per target with 4x CPU slowdown, 100 ms latency, and 200 KiB/s throughput. Product JavaScript includes the initial static import graph; cold transfer includes the complete initial page transfer. Lower is better.

| Target | Product JS gzip | Cold transfer | Cold LCP | Warm LCP | Startup task | Heap | Interaction | Product → cart |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Kudzu | **7,334 B** | **35,260 B** | 332 ms | **156 ms** | **122.6 ms** | **650,708 B** | **4.8 ms** | **5.6 ms** |
| React + Vite | 61,464 B | 202,842 B | 332 ms | 264 ms | 179.9 ms | 1,062,520 B | 10.2 ms | 9.9 ms |
| Next.js | 190,090 B | 547,615 B | **324 ms** | 176 ms | 434.4 ms | 2,168,412 B | 14.0 ms | 30.0 ms |
| Nuxt | 67,620 B | 195,953 B | **324 ms** | 224 ms | 247.9 ms | 1,721,348 B | **4.5 ms** | 29.6 ms |
| SvelteKit | 32,474 B | 90,939 B | 376 ms | 184 ms | 143.8 ms | 999,496 B | 6.3 ms | 21.8 ms |

The current Kudzu application emits 35,355 deploy bytes. Its 7,334 B gzip product graph includes the 2,425 B navigation capability; all three sizes are unchanged by conditional/keyed navigation effects because this top-level-only fixture retains the smaller specialized path. The first implementation paid a 128.7 ms HTML round trip during product-to-cart navigation; validated near-viewport document prefetch measured 5.6 ms in the current run while preserving complete documents and native fallback.

The mobile row is retained from the previous matched run using a 390x844 viewport, 6x CPU slowdown, 150 ms latency, and 150 KiB/s throughput:

| Profile | Cold LCP | Warm LCP | Interaction | Product → cart | Reject feedback | Rollback/error | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| Desktop | 332 ms | 156 ms | 4.8 ms | 5.6 ms | 4.0 ms | 112.1 ms | 0 |
| Mobile | 420 ms | 220 ms | 5.6 ms | 8.7 ms | 4.1 ms | 158 ms | 0 |

Initial runs found a repeatable 6–7% small-build loss from TypeScript and esbuild module startup. Kudzu now enables Node's native module compile cache before lazily loading the compiler. The current seven-run matched commerce build measured Kudzu at 486.8 ms and React at 545.4 ms, making Kudzu 10.7% faster in that run. Kudzu also shipped 88.1% less product JavaScript, used 38.8% less measured heap, and measured 52.9% faster interaction and 43.4% faster product-to-cart navigation than React. Disabling the cache preserves byte-for-byte output. Attempts to replace generated-handler lowering or share one TypeScript Program did not improve the combined median and were not retained.

These results describe this six-route fixture on one machine, not framework ecosystem size or every rendering mode. Prefetch improves an eligible warm application transition; it does not hide cold transfer, and direct loads remain complete standalone documents.

### Capability Microbenchmarks

The measurements below isolate individual compiler capabilities. They were produced on the same machine from production builds. Each framework received one warm-up followed by seven clean builds in rotating order; the table reports the median. Initial JavaScript includes inline scripts, root script references, and their static import graph, compressed file-by-file with gzip level 9. Total output is the raw size of every deploy artifact.

### Interactive Counter

Same counter with initial value `7` and increment/decrement buttons:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | 393 B | 1.1 KB | **409 ms** |
| Astro | Yes | **158 B** | **365 B** | 893 ms |
| Svelte CSR | No | 10.5 KB | 26.9 KB | 867 ms |
| Qwik CSR | No | 20.6 KB | 57.8 KB | 600 ms |
| Vue CSR | No | 24.0 KB | 60.3 KB | 785 ms |
| React CSR | No | 59.2 KB | 189.0 KB | 1032 ms |
| Next.js | Yes | 182.1 KB | 652.2 KB | 3082 ms |

Astro produces the smallest hand-authored counter. Kudzu's advantage in this fixture is React-shaped state code with a sub-1 KB runtime, not the smallest possible JavaScript.

#### Imported Helper Cost

The same native counter calculation was measured inline and through one relative TypeScript helper. Click medians are per state update from five 20,000-click batches in each of seven fresh Chrome sessions.

| Kudzu variant | Files | Initial JS gzip | Total output | Clean build | Click |
|---|---:|---:|---:|---:|---:|
| Inline native handler | 5 | 1,827 B | 3,923 B | **426 ms** | **3.78 µs** |
| Imported helper | 5 | 1,845 B | 3,949 B | 446 ms | 4.47 µs |

Bundling removes the helper file boundary, leaving 26 raw bytes and 18 gzip bytes for the function definition and calls. The measured call adds 0.69 µs per state update. The smaller 393 B command-only counter above uses a different optimized runtime path and is not the helper overhead baseline.

#### Context Object Cost

The same native counter was measured with local state access and through `value={{ count, setCount }}`. Context uses live object properties in both derived text and handlers, so this measures the complete recursive capture and generic binding capability.

| Kudzu variant | Files | Initial JS gzip | Total output | Clean build | Click |
|---|---:|---:|---:|---:|---:|
| Local native state | 5 | **1,890 B** | **4,064 B** | **421 ms** | **3.96 µs** |
| Context object | 7 | 4,991 B | 11,829 B | 441 ms | 7.54 µs |

Context adds 3,101 B gzip and 3.59 µs per update only on pages using nested reactive capture descriptors. It preserves immediate logical reads across repeated setter calls and batches DOM writes once per synchronous turn. Capability specialization removes the recursive state/setter branches from pages that do not use them.

#### Wrapper-Free Derived Text

The same object-state counter was built with the legacy span target and the current comment-bounded text range. Browser medians use five 20,000-update batches in each of seven fresh Chrome sessions.

| Text target | Files | JS gzip | Total output | Clean build | Update |
|---|---:|---:|---:|---:|---:|
| Legacy span target | 7 | **4,453 B** | **10,065 B** | **404 ms** | **4.83 µs** |
| Comment range | 7 | 4,763 B | 10,922 B | 426 ms | 5.03 µs |

The range costs 310 B gzip only on pages using derived reactive text. It removes wrapper elements and preserves authored structure across table cells, options, SVG text, selectors, and conditional remounts; ordinary attribute and condition pages tree-shake the range code entirely.

### 123-Page Newsletter Build

The migration fixture emits the same 123 static detail pages, two stylesheets, base-prefixed URLs, and post-build feed with no browser JavaScript. Seven clean builds compare generated page files with one dynamic page module.

| Build model | TSX source files | Pages | JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|---:|
| Generated TSX workaround | 123 | 123 | 0 B | 52.0 KB | 882 ms |
| `getStaticPaths` | **1** | 123 | 0 B | 52.0 KB | **454 ms** |

`getStaticPaths` removes 122 generated source files and cuts clean build time by 48.5% without changing deploy output or runtime cost.

### Static Journal Page

Same content and CSS across every fixture:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | **0 B** | 3.2 KB | **422 ms** |
| Astro | Yes | **0 B** | **3.0 KB** | 1081 ms |
| Svelte CSR | No | 10.2 KB | 27.2 KB | 902 ms |
| Qwik CSR | No | 20.2 KB | 59.6 KB | 633 ms |
| Vue CSR | No | 24.2 KB | 62.3 KB | 810 ms |
| React CSR | No | 59.8 KB | 192.3 KB | 1110 ms |
| Next.js | Yes | 182.6 KB | 663.6 KB | 3126 ms |

### 1,000-item Keyed List

The list starts with 1,000 keyed items, then updates every label, reverses the order, removes odd IDs, and adds 500 items. Browser timings are medians from seven fresh headless Chrome runs, measured when a DOM observer sees each expected result rather than at the next animation frame.

| Framework | Initial content | Initial JS gzip | Total output | Build | Update | Reverse | Remove | Add | Operations total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Astro | Yes | **324 B** | **43.6 KB** | 834 ms | **4.3 ms** | **3.8 ms** | **1.3 ms** | **3.1 ms** | **12.5 ms** |
| Kudzu | Yes | 5.1 KB | 60.3 KB | **438 ms** | 7.5 ms | 7.0 ms | 1.8 ms | 6.9 ms | 23.2 ms |
| Next.js | Yes | 182.2 KB | 695.2 KB | 2983 ms | 7.0 ms | 12.0 ms | 3.9 ms | 6.7 ms | 29.6 ms |
| React CSR | No | 59.3 KB | 189.4 KB | 1020 ms | 9.5 ms | 11.7 ms | 3.8 ms | 5.3 ms | 30.3 ms |
| Vue CSR | No | 24.3 KB | 61.3 KB | 773 ms | 11.4 ms | 9.5 ms | 4.1 ms | 6.6 ms | 31.6 ms |
| Svelte CSR | No | 12.9 KB | 33.1 KB | 828 ms | 5.8 ms | 38.9 ms | 4.0 ms | 5.9 ms | 54.6 ms |
| Qwik CSR | No | 22.2 KB | 64.1 KB | 594 ms | 9.1 ms | 22.2 ms | 30.8 ms | 19.0 ms | 81.1 ms |

An intrinsic-root versus projected-prop row-component A/B build produced byte-for-byte identical `dist` output: 5,175 B JS gzip and 61,731 B total. Seven interleaved clean builds measured 467 ms and 455 ms. Browser operation medians totaled 23.7 ms and 23.9 ms respectively; because the deployed HTML and JavaScript are identical, the 0.2 ms difference is measurement variance rather than component runtime overhead.

Astro is the hand-authored native DOM baseline in the interactive fixtures. React, Vue, Svelte, and Qwik used client-rendered fixtures, while Kudzu and Astro emitted initial HTML; Qwik therefore did not exercise its SSR resumability advantage. Kudzu's keyed-list operations total 23.2 ms, 10.7 ms behind the hand-authored Astro baseline and 7.1 ms ahead of React across all four operations.

### 1,000-item Keyed Effect

Each keyed row owns one effect depending on `item.name`. The measured actions rename only row 500 and wait for exactly one cleanup/setup, change an unrelated detail and require no lifecycle work, then reverse all rows and again require no lifecycle work. Medians use seven fresh Chrome profiles; builds use one warm-up and seven rotating clean runs.

| Framework | Initial rows | Initial JS gzip | Total output | Build | Selected update | Unrelated update | Reverse |
|---|---:|---:|---:|---:|---:|---:|---:|
| Astro native | Yes | **381 B** | **90,734 B** | 1,022 ms | **0.4 ms** | **0.2 ms** | **5.5 ms** |
| Kudzu | Yes | 7,070 B | 221,056 B | **437 ms** | 3.4 ms | 2.9 ms | 7.8 ms |
| Vue CSR | No | 25,091 B | 63,368 B | 893 ms | 4.7 ms | **2.3 ms** | 10.1 ms |
| Svelte CSR | No | 12,848 B | 33,222 B | 1,012 ms | 5.2 ms | 3.0 ms | 48.1 ms |
| React CSR | No | 60,921 B | 194,301 B | 1,132 ms | 12.3 ms | 6.8 ms | 19.0 ms |

This is a post-initialization runtime microbenchmark, not an architecture-equivalent loading comparison. Kudzu and Astro emit all 1,000 rows in HTML while React, Vue, and Svelte use empty CSR shells, so their JavaScript, output, and build columns are observations rather than framework-size or startup claims. Once every target has 1,000 rows and effects ready, targeted changed-root notification reduces Kudzu's selected update from 6.2 to 3.4 ms, versus Vue at 4.7 ms, Svelte at 5.2 ms, and React at 12.3 ms. It adds 126 B gzip to Kudzu's initial graph. List reconciliation remains O(n), which dominates unrelated-field updates; Vue measures 2.3 ms there versus Kudzu's 2.9 ms. Astro is the hand-written direct-DOM lower bound.

### 1,000-item Keyed Row State

Row 500 enters local edit state, the list reverses while preserving that row and its input DOM identity, then the row is removed and the same key is re-added with fresh non-editing state. Every target passed seven fresh-profile correctness runs; timings start at click and stop only after row order, unique IDs, labels, local state, and DOM identity match.

| Framework | Initial rows | Initial JS gzip | Total output | Build | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Astro native | Yes | **373 B** | **83.7 KB** | 926 ms | **1.6 ms** | **5.9 ms** | **1.2 ms** | **1.4 ms** |
| Kudzu | Yes | 8.5 KB | 570.7 KB | **449 ms** | 2.7 ms | 10.1 ms | 3.0 ms | 3.1 ms |
| Vue CSR | No | 24.4 KB | 61.6 KB | 820 ms | 2.8 ms | 11.7 ms | 4.0 ms | 4.2 ms |
| Svelte CSR | No | 13.1 KB | 33.8 KB | 918 ms | 2.6 ms | 47.9 ms | 4.5 ms | 5.4 ms |
| React CSR | No | 59.4 KB | 189.5 KB | 1,074 ms | 5.9 ms | 26.4 ms | 9.0 ms | 6.5 ms |

Kudzu builds fastest and beats React, Vue, and Svelte on all four operations. Pure reducer identity fast paths skip unchanged-item validation for reorder, one removal, and append while preserving direct keyed DOM identity. Astro remains the hand-written native lower bound. Kudzu's 570.7 KB output includes complete initial HTML plus per-row direct-patch descriptors; React, Vue, and Svelte ship CSR shells, so deploy size and loading architecture are not equivalent comparisons.

The general benchmark snapshot was collected on July 22, 2026, the keyed-effect comparison on July 27, and keyed-row-state on July 28 with Node 24.14.0 on an Intel i5-9500. These results compare the selected one-page fixtures, not ecosystem maturity, browser interaction speed beyond the listed operations, or each framework's full rendering options. Build times vary with machine load and filesystem cache.

## Development

```bash
npm install
npm run check
npm test
```

License: MIT
