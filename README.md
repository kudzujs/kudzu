<p align="center">
  <img src="https://raw.githubusercontent.com/kudzujs/kudzu/main/public/icon-128.png" width="96" alt="Kudzu logo">
</p>

# Kudzu

HTML-first TSX framework with synchronous state semantics and no virtual DOM.

Kudzu keeps the familiar function-component, props, children, event-handler, and `useState` shape. Static components compile to HTML. Simple interactions compile to small behavior commands, while normal sync or async JavaScript handlers compile to external ESM.

> Experimental `0.4.x`: the compiler API and supported TSX surface may change.

Documentation: [kudzujs.cloud/docs](https://kudzujs.cloud/docs)

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

Pages live in `src/pages`; `index.tsx` maps to `/`. `npm run dev` serves locally on `127.0.0.1`, reloads the browser after successful rebuilds, and shows build failures in an error overlay. Set `PORT` to change the default port of `3000`. The development client is injected only by the dev server; production output in `dist/` is unaffected.

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

## Reactive Attributes

`className`, `disabled`, controlled `value`, and controlled `checked` accept normal state-dependent TSX expressions. The same `value` binding works for inputs and selects:

```tsx
<div className={active ? "active" : "idle"} />
<button disabled={loading}>Save</button>
<input value={name} onInput={event => setName(event.currentTarget.value)} />
<input type="checkbox" checked={subscribed} onChange={event => setSubscribed(event.currentTarget.checked)} />
<select value={theme} onChange={event => setTheme(event.currentTarget.value)} />
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

Kudzu compiles derived expressions to external ESM and patches only the bound DOM attribute or property. `aria-*` and `data-*` boolean values serialize as `"true"` or `"false"`; ordinary false values remove the attribute. Reactive `style`, `ref`, and `dangerouslySetInnerHTML` remain unsupported.

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

## Keyed Lists

Map local array state directly to one keyed JSX element per item:

```tsx
const [items, setItems] = useState([
  { id: 1, name: "Oak", done: false },
  { id: 2, name: "Pine", done: true }
])

<ul>{items.map(item =>
  <li
    key={item.id}
    className={item.done ? "done" : "active"}
    aria-label={`${item.name} item`}
  >
    {item.name.toUpperCase()}
    <button onClick={() => setItems(items.filter(entry => entry.id !== item.id))}>Remove</button>
  </li>
)}</ul>
```

Kudzu emits initial items as static HTML, then adds, removes, updates, and moves keyed elements directly. Existing keys move without remounting, preserving uncontrolled descendant state. Direct `item.<field>` reads use compact markers; derived item expressions compile to external ESM evaluators. Item-local handlers use delegated events and receive the latest JSON-safe item for their key, including after updates, additions, and reorders. The item remains stored once in shared list state; handler descriptors carry a placeholder that the list runtime fills when mounting or updating the keyed root.

Each item must be an ordinary plain object with a unique string or finite-number key; nested data may contain only JSON-safe arrays, ordinary plain objects, and primitive values. Null-prototype objects are rejected to preserve JSON round-trip parity. The current syntax requires a direct local-state `.map`, one identifier callback parameter, one intrinsic JSX root, and `key={item.<field>}`. Derived expressions must be pure and synchronous: item reads, literals, operators, templates, approved read-only string/array methods, deterministic `Math` methods, and `String`/`Number`/`Boolean` conversion are supported. Component state, locals, imported helpers, browser globals, Promise values, mutation, arbitrary calls, and prototype-sensitive properties are rejected. Nested conditions or lists, item spreads, component tags, fragments, and reactive `style`, `ref`, or `dangerouslySetInnerHTML` remain unsupported. Keyed rows must be placed inside an explicit `<tbody>`, `<thead>`, or `<tfoot>`.

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

Primitive values, arrays, plain objects, and destructured props can be captured by client handlers. Functions, symbols, bigints, cycles, class instances, and imported helper functions are not yet supported as captures.

Native handlers are delegated after normal event bubbling and run from the target toward matching Kudzu ancestors in deterministic order. Delegated handlers cannot call or reference `preventDefault`, `stopPropagation`, or `stopImmediatePropagation`; the compiler rejects those methods because external ESM cannot apply them with correct synchronous DOM semantics.

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
- Components are authoring units; no component tree is retained in the browser.
- There is no VDOM, hydration pass, router, or client application runtime.

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
- Primitive `useState` bindings
- Synchronous and async event handlers
- Serializable component-local captures
- Direct text DOM patches
- Reactive standard, `aria-*`, and `data-*` attributes
- Controlled `value` and `checked` form properties
- Conditional child `&&` and ternary DOM patches
- Direct keyed local-state lists

Not implemented yet:

- Generalized JSX-valued locals and non-direct list item expressions
- Server actions and request-time SSR
- Imported client helpers and React package islands
- HMR and framework DevTools

## Benchmarks

Measurements below were produced on the same machine from production builds. Each framework received one warm-up followed by seven clean builds in rotating order; the table reports the median. Initial JavaScript includes inline scripts, root script references, and their static import graph, compressed file-by-file with gzip level 9. Total output is the raw size of every deploy artifact.

### Interactive Counter

Same counter with initial value `7` and increment/decrement buttons:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | 487 B | 1.4 KB | **373 ms** |
| Astro | Yes | **158 B** | **365 B** | 877 ms |
| Svelte CSR | No | 10.5 KB | 26.9 KB | 837 ms |
| Qwik CSR | No | 20.6 KB | 57.8 KB | 626 ms |
| Vue CSR | No | 24.0 KB | 60.3 KB | 778 ms |
| React CSR | No | 59.2 KB | 189.0 KB | 1049 ms |
| Next.js | Yes | 182.1 KB | 652.2 KB | 3099 ms |

Astro produces the smallest hand-authored counter. Kudzu's advantage in this fixture is React-shaped state code with a sub-1 KB runtime, not the smallest possible JavaScript.

### Static Journal Page

Same content and CSS across every fixture:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | **0 B** | 3.2 KB | **478 ms** |
| Astro | Yes | **0 B** | **3.0 KB** | 1253 ms |
| Svelte CSR | No | 10.2 KB | 27.2 KB | 1018 ms |
| Qwik CSR | No | 20.2 KB | 59.6 KB | 784 ms |
| Vue CSR | No | 24.2 KB | 62.3 KB | 960 ms |
| React CSR | No | 59.8 KB | 192.3 KB | 1253 ms |
| Next.js | Yes | 182.6 KB | 663.6 KB | 3880 ms |

Benchmark snapshot collected on July 21, 2026 with Node 24.14.0 on an Intel i5-9500. React, Vue, Svelte, and Qwik used client-rendered fixtures, while Kudzu and Astro emitted initial HTML; Qwik therefore did not exercise its SSR resumability advantage. These results compare the selected one-page fixtures, not ecosystem maturity, browser interaction speed, or each framework's full rendering options. Build times vary with machine load and filesystem cache.

## Development

```bash
npm install
npm run check
npm test
```

License: MIT
