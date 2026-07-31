# Kudzu Releases

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
