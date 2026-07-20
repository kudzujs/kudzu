<p align="center">
  <img src="https://raw.githubusercontent.com/kudzujs/kudzu/main/public/icon-128.png" width="96" alt="Kudzu logo">
</p>

# Kudzu

HTML-first TSX framework with synchronous state semantics and no virtual DOM.

Brand assets, favicons, manifest icons, and the 1200×630 social preview live in [`public/`](./public).

Kudzu keeps the familiar function-component, props, children, event-handler, and `useState` shape. Static components compile to HTML. Simple interactions compile to small behavior commands, while normal sync or async JavaScript handlers compile to external ESM.

> Experimental `0.1.x`: the compiler API and supported TSX surface may change.

## Install

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

Pages live in `src/pages`; `index.tsx` maps to `/`. Production output is written to `dist/`.

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

## Rendering

```text
TSX
├─ static component      → HTML
├─ ordered state setter  → behavior command
└─ normal JS handler     → route handler ESM
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

Not implemented yet:

- Reactive attributes, classes, and controlled inputs
- Conditional DOM patches and keyed lists
- Server actions and request-time SSR
- Imported client helpers and React package islands
- HMR and framework DevTools

## Benchmarks

Measurements below were produced on the same machine from production builds. They compare build artifacts, not ecosystem maturity or full application performance.

### Interactive Counter

Same counter with initial value `7` and increment/decrement buttons:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | **581 B** | 1.7 KB | **371 ms** |
| Astro | Yes | 158 B | **365 B** | 953 ms |
| Svelte CSR | No | 10.5 KB | 26.9 KB | 910 ms |
| Qwik CSR | No | 20.6 KB | 57.8 KB | 633 ms |
| React CSR | No | 59.2 KB | 189.0 KB | 1010 ms |
| Next.js | Yes | 182.1 KB | 652.2 KB | 3074 ms |

Astro produces the smallest hand-authored counter. Kudzu's advantage in this fixture is React-shaped state code with a sub-1 KB runtime, not the smallest possible JavaScript.

### Static Journal Page

Same content and CSS across every fixture; build is the median of three clean runs:

| Framework | Initial content | Initial JS gzip | Total output | Clean build |
|---|---:|---:|---:|---:|
| Kudzu | Yes | **0 B** | 3.1 KB | **383 ms** |
| Astro | Yes | **0 B** | **3.0 KB** | 1022 ms |
| Svelte CSR | No | 10.2 KB | 27.2 KB | 907 ms |
| Qwik CSR | No | 20.2 KB | 59.6 KB | 619 ms |
| Vue CSR | No | 24.2 KB | 62.3 KB | 719 ms |
| React CSR | No | 59.8 KB | 192.3 KB | 1053 ms |
| Next.js | Yes | 182.6 KB | 663.6 KB | 3054 ms |

Benchmark snapshot collected on July 20, 2026 from equivalent production fixtures on the same machine. Qwik used a client entry and therefore did not exercise its SSR resumability advantage. Build times vary by hardware and filesystem cache.

## Development

```bash
npm install
npm run check
npm test
```

License: MIT
