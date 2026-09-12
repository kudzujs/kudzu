<p align="center">
  <img src="https://raw.githubusercontent.com/kudzujs/kudzu/main/public/icon-128.png" width="96" alt="Kudzu logo">
</p>

# Kudzu

HTML-first TSX framework with synchronous state semantics and no virtual DOM.

Kudzu compiles ordinary React-shaped TypeScript and TSX into complete static HTML, CSS, and only the route-specific ESM capabilities actually used. Static pages ship zero JavaScript. React, hydration, a VDOM, and a retained browser component tree are not part of the output.

[![Watch the 22-second Kudzu compiler overview](https://raw.githubusercontent.com/kudzujs/kudzu/main/media/kudzu-demo-cover.png)](https://github.com/kudzujs/kudzu/blob/main/media/kudzu-demo.mp4)

*Watch: React-shaped TSX to static HTML and route-specific ESM in 22 seconds.*

> Experimental `0.16.x`: the compiler API and supported TSX surface may change.

**Current release: [0.16.35](https://github.com/kudzujs/kudzu/releases/tag/v0.16.35).** Flat evaluator families omit nested context preparation and recursive dependency collection, removing another 172 raw / 50 aggregate gzip JavaScript bytes from search. Nested component-prop evaluators retain current-state reads. The optional `create-kudzu --ai` authoring tools introduced in 0.16.34 remain available; AI-token savings are unmeasured and the AI-cost/1.0 gates remain blocked.

- [Documentation](https://kudzujs.cloud/docs)
- [Installation guide](https://kudzujs.cloud/docs#install)
- [Components and migration support](https://kudzujs.cloud/docs#components)
- [Current limits](https://kudzujs.cloud/docs#limits)
- [Benchmarks](https://kudzujs.cloud/docs#benchmarks)
- [Release history](https://github.com/kudzujs/kudzu/releases)

## Quick Start

Kudzu requires Node.js 22 or newer.

```bash
npm create kudzu@latest my-app
cd my-app
npm install
npm run dev
```

The generated project includes reusable components, an interactive state example, a zero-JavaScript static route, metadata, and responsive CSS.

For optional AI authoring guidance and local developer tools, use
`npm create kudzu@latest my-app -- --ai`. The generated `AGENTS.md` describes
`npm run ai -- docs` for installed documentation and `npm run ai -- check` for
typecheck/build execution with bounded output and full retained logs. These tools
stay outside default browser output. AI-token savings have not been measured.
See the [generator guide](https://github.com/kudzujs/kudzu/tree/main/packages/create-kudzu#optional-ai-authoring-guidance).

To add Kudzu to an existing project:

```bash
npm install @kudzujs/core typescript
```

Add the Kudzu commands to `package.json`:

```json
{
  "scripts": {
    "dev": "kudzu dev",
    "build": "kudzu build",
    "check": "tsc --noEmit && kudzu build"
  }
}
```

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

Put routes in `src/pages`; `src/pages/index.tsx` maps to `/`.

```tsx
import { useState } from "@kudzujs/core"

export default function HomePage() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>
    Grown {count} times
  </button>
}
```

```bash
npm run dev
npm run build
```

## Authoring

Use native HTML controls and events. Read the control through `event.currentTarget`
inside the handler and update state with its setter; Kudzu does not use React
synthetic events. Setters update logical state immediately and batch DOM writes.

Keep derived values pure: top-level `const` locals can normalize primitive state,
filter an immutable collection, and reuse its `.length` in JSX. Render ordinary
child components with stable keys rather than manually rebuilding DOM rows.
For example, with `items` exported as a JSON-safe immutable array from `../data`
and `Item` as a relative component rendering one item:

```tsx
import { useState } from "@kudzujs/core"
import { items } from "../data"
import { Item } from "../Item"

export default function ItemsPage() {
  const [query, setQuery] = useState("")
  const normalized = query.trim().toLowerCase()
  const visible = items.filter(item => item.name.toLowerCase().includes(normalized))
  const count = visible.length

  return <main>
    <label htmlFor="item-query">Find items</label>
    <input id="item-query" type="search" value={query}
      onInput={event => setQuery(event.currentTarget.value)} />
    <p aria-live="polite">Matches: {count}</p>
    <ul>{visible.map(item => <Item key={item.id} item={item} />)}</ul>
  </main>
}
```

Collection aliases must stay within supported collection/count uses; arbitrary
calls, mutation, and escaping reactive collections are not supported. Use the
build's source-located diagnostic and [current limits](https://kudzujs.cloud/docs#limits)
to identify the boundary rather than assuming arbitrary React code will compile.

Keep interactions in the routes that need them. Build-known direct imported
maps and pure static filters can emit complete HTML without list JavaScript.
A static sibling outside an enhanced-navigation group ships no JavaScript merely
because another page is interactive. Shared layout effects or explicit navigation
groups have their own lifetime; native anchors remain the default.

## Verify

A successful build validates supported source and emits deployable outputs; it
does not verify browser behavior or accessibility. Check visible DOM and relevant
interactions, labels, status updates, keyboard focus, and responsive layouts in a
browser as needed. Binding comments and inert templates mean raw HTML string
matches or tag stripping are not reliable checks of rendered text.

Normal builds also scan generated route HTML after `afterBuild`, reporting counts
with/without script or modulepreload text markers and unreadable files, with up to
five paths per category (long paths are truncated). This is a literal text scan,
not proof of script freedom: comments and inert content can match, inline event
attributes are not checked, and extra public HTML files are outside the route
inventory. Quiet and JSON builds omit this summary.

Keep checks bounded and report concise counts and failing paths rather than
repeatedly dumping minified artifacts. A missing tool or truncated response is
not a pass. After source changes, rerun affected checks. Optional compiler/artifact
reports and their limits are documented under [Build output](https://kudzujs.cloud/docs#build).

## How It Works

```text
ordinary React-shaped TSX
  -> Kudzu compiler specialization
  -> complete HTML + CSS + capability-specific ESM
```

- Function components execute at build time and do not survive as browser components.
- `useState` and reduced `useReducer`, including directly serializable lazy initialization, compile to synchronous logical state and batched direct DOM writes; top-level `useId` and direct intrinsic `forwardRef` authoring erase to static HTML without a component runtime.
- Conditions, keyed collections, attributes, events, refs, effects, and supported component boundaries compile to route-specific capabilities. A direct setter may cross one ordinary component boundary through one value-adapter event call; inline or simple `const` setter callbacks and object refs may cross the same direct intrinsic boundary.
- Build-known data and routes become complete HTML through async components and `getStaticPaths()`.
- Native document navigation is the default; static routes do not load a client runtime.
- A named or aliased React Router `Link` with a static root-relative `to` erases to a base-aware native anchor; no router package or runtime is emitted.
- A direct named or aliased React Router `useParams()` call on a `runtimeParams` bracket route reuses Kudzu's route-specific pathname reader.
- A direct top-level React Router `useMatch("/exact-path")` route binding folds case-insensitively from the build-known application route without browser JavaScript.
- React Router `useSearchParams()` supports direct static `get("name")` locals, the exact numeric pagination fallback `Number(params.get("page")) || 1`, a static imported-array string fallback, and inline setter updaters, lowering reads and history writes to one route-specific query capability.
- React Bootstrap `Row` and `Col` with children, static classes, and numeric literal `Col` breakpoints erase to native Bootstrap grid markup; applications retain ownership of Bootstrap CSS.
- Browser-only query data uses owned effects with application loading/error/data state; URL-derived dependencies, stale-response isolation, keyed results, and recovery require no query package runtime.
- Only TypeScript modules reachable from pages are compiled. Imported immutable direct maps can fold to static HTML, while direct fields from relative structured calculations reevaluate through route binding ESM.
- Package imports used directly inside JSX event callbacks are removed from build modules and retained only in bundled route handler ESM.
- A named or aliased React Router `useNavigate()` top-level binding lowers direct nested-callback calls with safe static root-relative destinations to native `location.assign()` or `location.replace()` navigation.
- Unsupported nearby patterns fail during the build with a source location and actionable boundary.

Migration input may retain supported imports from `react`; Kudzu erases those references and never emits or executes React. New Kudzu source should import framework APIs from `@kudzujs/core`.

See the [complete guide](https://kudzujs.cloud/docs), [interactive features](https://kudzujs.cloud/docs#state), and [current limits](https://kudzujs.cloud/docs#limits) instead of relying on this README as an API reference.

## Architecture

Kudzu treats React-shaped TSX as compiler input rather than as a browser runtime programming model:

```text
React-shaped TypeScript/TSX
  -> ordered AST normalization passes
  -> state/effect/handler/binding/list analysis
  -> complete HTML + route-specific capability ESM
```

- `framework/compiler/normalization-pipeline.mjs` owns pass order and repairs AST parent pointers after structurally changed transforms.
- Focused passes own React, React Router, browser-signal, animation-frame, timer, render-control, and Worker validation.
- The main transformer produces descriptors; effect and handler codegen modules turn them into route-specific ESM.
- Unsupported nearby syntax fails with source-located diagnostics instead of falling back to React or a generic runtime.

Kudzu intentionally does not provide:

- React runtime compatibility
- Virtual DOM or hydration
- Retained browser component instances
- A default SPA router
- Request-time SSR or server actions
- A general client state or effect runtime

Browser code is a compiler-generated capability module, included only when a route uses that capability. Kudzu does not eliminate every runtime; it eliminates unused runtime.

## Packages

- [`@kudzujs/core`](https://www.npmjs.com/package/@kudzujs/core): compiler, CLI, JSX runtime, and framework APIs
- [`create-kudzu`](https://www.npmjs.com/package/create-kudzu): project generator and working showcase

## Development

```bash
npm run check
npm test
```

Contributor instructions live in the [repository](https://github.com/kudzujs/kudzu).

## License

MIT
