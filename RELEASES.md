# Kudzu Releases

## 0.7.8 - Static collection fast paths

Kudzu 0.7.8 specializes compiler-owned static `filter` collections so repeated category changes avoid general keyed-list validation and reconciliation.

### New in 0.7.8

- Static source items, unique keys, source positions, and reference entries validate and cache once when the list mounts.
- Structural rows removed by a filter become detached prototypes; restoration clones fresh DOM, preserving remount semantics without moving retained keys.
- Interleaved additions insert only new contiguous runs instead of attaching additions and then reordering the complete list.
- General local-state lists, dynamic selectors, indexed rows, handlers, effects, refs, and row state retain their existing reconciliation paths.
- The capability is route-specific and compiles out when no compiler-owned static collection is rendered.
- The matched route adds 648 B gzip compared with 0.7.7's initial implementation while reducing 500-row restoration from 13.2 ms to 3.6 ms.

### Benchmark

The matched fixture imports 1,000 alternating products, filters to 500, then restores all 1,000 while checking retained and remounted DOM identity. Thirty-one rotating fresh Chrome 150 profiles on an Apple M3 used 4x CPU throttling. Median visible/filter/restore times were Kudzu 37.8/8.4/3.6 ms, React 86.3/12.9/6.2 ms, Vue 54.1/8.4/4.3 ms, and Svelte 61.4/11.7/8.3 ms. React, Vue, and Svelte used Vite CSR shells while Kudzu emitted initial HTML, so visible-row and artifact comparisons are architecture-dependent.

### Boundary

The fast path requires a compiler-owned static source, field keys, filter-only selection, and structural rows without handlers, effects, refs, row state, or index dependencies. It is intended for ordinary catalog-sized collections, not direct rendering of 100,000 or 1,000,000 DOM rows; use pagination or windowing for those workloads.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.8
```

## 0.7.7 - Imported memo collections

Kudzu 0.7.7 lets ordinary React migration source filter an imported static catalog through state-dependent `useMemo` while reusing existing keyed-list reconciliation.

### New in 0.7.7

- Named relative imports of exported JSON-safe `const` arrays can anchor analyzable collection pipelines.
- Direct local-state reads in collection selectors invalidate the list when their declared state dependencies change.
- Existing keys retain DOM identity through filtering and restoration; removed keys remount when restored.
- Compiler-owned static collection state is excluded from development snapshot restoration.
- Static routes remain JavaScript-free, and interactive routes ship no React runtime or browser memo cache.
- Focused fixtures verify dependency diagnostics, static output, generated selectors, and browser DOM identity.

### Boundary

Static collections must be named relative imports of exported JSON-safe `const` arrays. Package, namespace, default, dynamic, mutable, and non-serializable collection sources remain unsupported, as do arbitrary callbacks and general-purpose memo caching.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.7
```

## 0.7.6 - Zustand-shaped shared stores

Kudzu 0.7.6 lets reduced React migration source retain a Zustand `create(set => ...)` store across an explicitly configured shared-layout navigation group.

### New in 0.7.6

- One exported store with one directly serializable data property and synchronous capture-free actions compiles to one ordinary layout-lifetime Kudzu state slot.
- Components select the data or an action with direct forms such as `state => state.quantities` and `state => state.add`.
- Selected actions inline through existing functional state updates, so repeated same-turn calls observe current logical state and DOM writes still batch.
- Same-group navigation retains the store and layout DOM while incoming route bindings mount against the current value.
- Neither React, Zustand, a subscription runtime, nor a generic external-store capability enters the deploy output.
- The shopping fixture verifies two same-turn additions, product-to-cart retention, removal, layout DOM identity, package erasure, and source diagnostics in Chrome.

### Boundary

The shared layout must initialize the store before route consumers. Derived selectors, multiple data properties, middleware, `get`, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, keyed-row initialization, and indirect action forwarding remain unsupported.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.6
```

## 0.7.5 - Class composition migration

Kudzu 0.7.5 lets ordinary React source retain common direct `clsx` calls while compiling them to existing static and reactive class paths.

### New in 0.7.5

- Default and named `clsx` imports lower at build time for string and number literals, literal arrays, literal object conditions, and conditional expressions.
- Dynamic object conditions reuse existing reactive class bindings without serializing or shipping the `clsx` function.
- Static uses add no browser JavaScript, and the package import is erased from compiled modules.
- Mixed React imports such as `import { useState, type ReactNode } from "react"` now erase type-only specifiers before runtime module rewriting.
- The React/Vite fixture verifies initial class output, state-driven class updates in Chrome, package erasure, and mixed type imports.

### Boundary

`clsx` spreads, computed object keys, arbitrary calls, and indirect references remain unsupported. This is source lowering for a proven migration pattern, not package execution or a general React ecosystem runtime.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.5
```

## 0.7.4 - Memoized collection pipelines

Kudzu 0.7.4 lets ordinary React/Vite source retain analyzable collection work inside `useMemo` while reusing the existing keyed-list selector and DOM identity model.

### New in 0.7.4

- Inline `useMemo` callbacks accept collection pipelines rooted in direct local array state.
- Existing `filter`, direct-property `flatMap`, and `Array.from` selector analysis is reused without a browser memo cache.
- Intermediate `.map()` calls lower to the existing `Array.from(source, mapper)` selector operation.
- Memo locals are removed from emitted server modules after their uses are inlined, so state signals never execute array methods during rendering.
- State updates preserve keyed row DOM identity while adding, removing, filtering, mapping, and reordering selected values.
- Collection callbacks must be synchronous arrows with plain `(item)` or `(item, index)` identifier parameters; async, rest, default, and optional parameters fail with source locations.
- The React/Vite fixture verifies `filter + map`, selector generation, browser updates, and retained identity for an existing row.

### Boundary

Memoized collections use the existing statically analyzable collection subset. Arbitrary callbacks, external captures, asynchronous transforms, getters, and general-purpose memo caching remain unsupported. React, a VDOM, hydration, and a retained browser component tree are not emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.4
```

## 0.7.3 - React memo normalization

Kudzu 0.7.3 accepts common React memo authoring forms while preserving build-time components, direct state bindings, static HTML, and capability-only JavaScript.

### New in 0.7.3

- `memo(Component)` and aliased or direct-member equivalents lower to same-file build-time function components.
- Inline `useCallback` wrappers continue to lower directly to analyzable handler functions without a browser memo cache.
- Inline synchronous `useMemo` callbacks may return one expression over primitive literals and direct local state.
- Memoized state expressions are inlined at same-component JSX uses so existing bindings update them without component rerenders.
- Static pages wrapped in `memo` remain JavaScript-free.
- Component shadowing, impure expressions, incomplete state dependencies, duplicate memo locals, and nested memo-local captures fail with source locations.
- The React/Vite app fixture verifies repeated counter updates, derived `Double 2`/`Double 4` output, CSS and SVG assets, mount effects, and a zero-JavaScript static route.

### Boundary

`memo` identifiers must name unshadowed same-file top-level function components. `useMemo` locals must use unique `const` declarations, may reference only direct local state and primitive literals, and cannot cross nested function boundaries. No browser component cache, React runtime, VDOM, hydration, or retained component tree is emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.3
```

## 0.7.2 - React hook normalization

Kudzu 0.7.2 accepts more ordinary React/Vite hook syntax while compiling through the existing static HTML and direct DOM capability paths.

### New in 0.7.2

- Supported hooks imported from `react` may retain aliases such as `useState as useMenuState` and `useEffect as runEffect`.
- Default and namespace imports may use direct supported members such as `React.useState(...)`.
- Inline React `useCallback` wrappers with literal inert dependencies are erased to their callback before Kudzu specialization.
- Captured local state must appear in the callback dependency array, preserving an actionable boundary around stale React closures.
- Unsupported members, indirect hook references, computed React members, and effectful dependency expressions fail with source locations.
- Type-only React namespaces remain available to TypeScript and do not trigger runtime migration diagnostics.
- A React/Vite-shaped app fixture verifies CSS, SVG assets, a non-root base, aliased state/effects, member state, repeated callback updates, browser interaction, and a zero-JavaScript static route.

### Boundary

`useCallback` requires an inline function and a literal array containing only identifiers or primitive literals. `memo`, `useMemo`, React classes, indirect hook references, side-effect React imports, and dynamic React imports remain unsupported. React, a VDOM, hydration, and a retained browser component tree are never emitted.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.2
```

## 0.7.1 - Vite-style landing assets

Kudzu 0.7.1 lets ordinary React/Vite landing-page source retain its common local stylesheet and static asset imports while preserving static HTML output and capability-only JavaScript.

### New in 0.7.1

- Relative side-effect CSS imports are validated and erased before server module evaluation.
- Default CSS Module imports compile to deterministic scoped class maps with no client runtime.
- Relative image, SVG, and font imports compile to base-aware URL strings; supported assets also accept `?url`.
- Relative CSS `url(...)` references are rewritten to base-aware emitted URLs, preserving query and hash suffixes.
- Referenced asset bytes are copied under deterministic source-relative `dist/assets` paths.
- Static assets and CSS Modules work inside specialized relative keyed-row components.
- Declaration files under `src` remain available to TypeScript but are excluded from executable module compilation.
- The migration fixture verifies a non-root base, byte-identical assets, scoped classes, browser interaction, and zero JavaScript on its static route.

### Boundary

CSS Module `composes`, arbitrary import queries, import hashes/attributes, and named or namespace asset bindings fail at build time with source locations. React, a VDOM, hydration, and a retained browser component tree remain absent.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.1
```

## 0.7.0 - React-source migration preview

Kudzu 0.7.0 begins the migration track for ordinary React-shaped landing pages. Existing source may retain conventional supported imports from `react`; Kudzu rewrites those imports to compile-time APIs, pre-renders complete HTML, and emits only the route capabilities that are actually used. React, a virtual DOM, hydration, and a browser component tree are never emitted or executed.

```tsx
import React, { useState } from "react"

export default function Header() {
  const [open, setOpen] = useState(false)

  return <React.Fragment>
    <button onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
    {open && <nav>Navigation</nav>}
  </React.Fragment>
}
```

### New in 0.7.0

- Conventional unaliased named imports of supported hooks from `react` compile through Kudzu without loading React.
- Default, namespace, and named `Fragment` imports are accepted for migration source.
- Relative function components, props, children, conditions, attributes, text, and event handlers keep their familiar TSX shape.
- Static routes using the accepted React import forms still ship zero JavaScript.
- Interactive routes ship direct DOM capabilities only; the landing-page acceptance fixture adds state, text, attribute, condition, and menu-handler capabilities.
- Emitted modules are checked for surviving runtime React references, and side-effect React imports fail with a source location.
- Keyed collections now support analyzable `filter`, direct-property `flatMap`, `Array.from`, positional keys, recursively deep sibling child maps, nested conditions, latest-item handlers, multiple serializable row states, effects, and `null` object refs.

### Current boundary

This is source migration support, not a React compatibility runtime. Aliased hooks, member hook calls such as `React.useState`, `memo`, `useMemo`, `useCallback`, React classes, React Router, Next-specific components, React UI packages, side-effect imports, and dynamic React imports remain unsupported. Migrate a real route, reduce the first unsupported pattern to a fixture, and extend the compiler one proven blocker at a time.

### Measured fixture

The two-route landing fixture retains React imports across relative components. Its static route has no script, while its interactive mobile-menu route emits 10,245 B raw / 5,030 B aggregate gzip JavaScript across seven capability files. Seven clean builds after one warm-up measured a 310.0 ms median on the development machine described in `MIGRATION_ROADMAP.md`.

### Upgrade

```bash
npm install @kudzujs/core@^0.7.0
```

New Kudzu source should continue importing APIs from `@kudzujs/core`. Retaining `react` imports is intended for migration input where minimizing source edits matters.
