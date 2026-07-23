# React Migration Direction

This document is the durable product and implementation direction for future Kudzu work. Read it before changing architecture or attempting a React migration.

## North Star

An AI should be able to migrate a conventional React application while preserving familiar TSX authoring. Kudzu then compiles that source to CDN-deployable static HTML, CSS, and the smallest route-specific ESM needed for behavior.

```text
React-shaped TSX
  -> Kudzu compiler
  -> pre-rendered HTML + CSS + capability-specific ESM
```

Syntax compatibility does not mean shipping React semantics wholesale. Kudzu supports the statically analyzable subset it can compile to direct DOM operations. Unsupported patterns must fail at build time with a file, line, and actionable message.

## Invariants

- Never add React as a runtime or production dependency.
- Never add a VDOM, hydration pass, retained browser component tree, or generic component re-renderer.
- Static routes ship zero client JavaScript.
- Interactive routes ship only capabilities they use.
- State setters update logical state immediately and batch direct DOM writes at synchronous-turn boundaries.
- Prefer build-time execution whenever all inputs are available during the build.
- Unknown runtime data cannot be pre-rendered as known content. Emit a static shell plus only the ESM needed to obtain and patch that data.
- Use browser document navigation and ordinary `<a>` elements by default. Client routing is not part of the current roadmap.
- Do not add compatibility APIs speculatively. Start with a real migration fixture that fails, then implement the smallest shared compiler feature that unblocks it.

## Existing Building Blocks

Kudzu already has the pieces below. Reuse them instead of creating parallel systems.

- Async components can fetch build-time data and still emit static HTML.
- `getStaticPaths()` handles dynamic paths known during the build and passes page props.
- `useState`, context, reactive text and attributes, conditionals, keyed lists, and normal ESM event handlers compile to direct DOM behavior.
- Shared state, serialization, DOM commit batching, mount hooks, and cleanup hooks already exist in capability runtimes.
- Imported relative TypeScript helpers and imported keyed-list row components already have build-time resolution paths.

For build-time data, prefer the existing form:

```tsx
export default async function ProductsPage() {
  const products = await fetch("https://example.test/api/products").then(response => response.json())
  return <ProductList products={products} />
}
```

Do not add `getStaticProps` unless a concrete migration cannot use async components or `getStaticPaths()`.

## Data And Route Decisions

Classify each migrated screen before changing the framework.

| Requirement | Kudzu treatment |
|---|---|
| Data and route known at build time | Async component or `getStaticPaths()`; emit complete static HTML |
| Interaction after user input | Existing event compiler; emit handler ESM only |
| Data available only after browser mount | Compile `useEffect(fn, [])` to route-specific effect ESM |
| Route IDs known at build time | Existing bracket route plus `getStaticPaths()` |
| UUID or route value known only from the request URL | Static fallback document plus compiled pathname parameter reader |
| Normal navigation | Native `<a>` document navigation |
| SPA transitions | Out of scope until explicitly approved from measured need |

## Implementation Order

### 1. Migration Fixture And Inventory

Before adding APIs, create or identify a minimal fixture from the actual React application. Inventory:

- routes and which are build-known versus runtime-only;
- initial fetches and whether they can run during the build;
- hooks used on mount or after state changes;
- React Router usage;
- browser-only globals;
- third-party React components;
- expected HTML, interactions, and navigation behavior.

Rewrite what current Kudzu already supports first. A failed fixture becomes the executable requirement for the next compiler feature.

### 2. Mount-Only `useEffect`

Status: implemented. The compiler emits route-specific effect entries, supports direct and functional setters including setter references such as `.then(setItem)`, isolates sync and async failures, and leaves effect-free routes unchanged.

Implement only the common initial-fetch shape first:

```tsx
const [item, setItem] = useState(null)

useEffect(() => {
  fetch(`/api/items/${id}`)
    .then(response => response.json())
    .then(setItem)
}, [])
```

Compiler requirements:

- Export `useEffect` from `@kudzujs/core` with React-shaped call syntax.
- Initially accept exactly one inline block-bodied function and a literal empty dependency array.
- Do not execute the effect during static rendering.
- Compile the callback through the existing external ESM and capture machinery where possible.
- Generate a route-specific effect entry and include it only on pages using an effect.
- Reuse existing logical state and direct DOM commit paths for setters.
- Do not introduce a scheduler, component instance, hook dispatcher, or component re-render loop in the browser.
- Reject dependencies, cleanup returns, unsupported captures, and non-analyzable calls with source-located diagnostics until each is deliberately implemented.

Acceptance criteria:

- A page can fetch on mount, set state, and patch reactive text, attributes, conditions, and keyed lists.
- A page without `useEffect` has byte-for-byte unchanged runtime output.
- No React code or component function is shipped.
- Tests cover success, async failure behavior, unsupported dependencies, unsupported cleanup, and multiple independent effects.
- Benchmarks report added raw and gzip JavaScript for the effect fixture.

### 3. Runtime Path Parameters

Status: implemented. `export const runtimeParams = true` on a bracket page emits one static fallback, ordered host rewrite metadata, and a route-specific `useParams()` pathname matcher. Exact static files win in development, effects import the matcher before execution, and no navigation interception is added.

Support bracket routes whose values cannot be enumerated during the build, without adding an SPA router.

Target authoring shape:

```tsx
import { useParams } from "@kudzujs/core"

export default function ItemPage() {
  const { id } = useParams()
  return <ItemDetail id={id} />
}
```

Compiler and build requirements:

- Keep existing `getStaticPaths()` behavior for build-known routes.
- When a bracket page intentionally has runtime-only params, emit one static fallback document for its route pattern.
- Generate only the pathname matcher and parameter extraction needed by that route.
- Make the development server resolve matching runtime paths to the fallback document.
- Expose deployment rewrite information or documented adapter configuration for static hosts. Do not hide a request server inside the client runtime.
- Treat decoded parameters as untrusted input and reject malformed or traversal-like values.
- Allow extracted params to feed mount effects and direct bindings without executing a browser component tree.

The fallback opt-in is `export const runtimeParams = true`; physical fallback output keeps the bracket pattern under `dist`, and ordered rewrites are exposed through the build plan and `afterBuild()`.

Acceptance criteria:

- A direct request to a UUID path serves static fallback HTML and reads the correct parameter.
- Refresh and deep-link entry work without client-side navigation.
- Build-known dynamic routes remain unchanged.
- Static routes without runtime params have byte-for-byte unchanged output.
- Tests cover decoding, invalid values, multiple parameters, route precedence, base paths, and development-server behavior.

The two-parameter fixture's route matcher is 672 B gzip. Its complete binding, effect, event, serialization, and parameter initial graph is 6.1 KB gzip and its seven-run clean-build median is 450 ms.

### 4. Add Effect Semantics Only When Proven Necessary

After mount-only effects and runtime params unblock a real migration, add the next missing semantic one at a time:

1. cleanup for `useEffect(fn, [])`;
2. primitive dependency arrays such as `[id]`;
3. cleanup-before-rerun;
4. effect ownership inside conditional or keyed DOM ranges.

Each addition must reuse capability mount/unmount hooks, have one focused migration fixture, and preserve zero output cost for pages that do not use it.

Do not implement `useLayoutEffect`, concurrent rendering, Suspense semantics, transitions, or an effect scheduler without an explicit application requirement.

## AI Migration Workflow

When asked to migrate a React application:

1. Inspect the source application; do not assume it needs a router or lifecycle support.
2. Replace React imports with `@kudzujs/core` only for APIs Kudzu supports.
3. Convert build-known fetches to async page/component work.
4. Convert build-known dynamic routes to `getStaticPaths()`.
5. Replace React Router links with ordinary `<a>` navigation unless SPA transitions are an explicit requirement.
6. Preserve React-shaped function components, props, children, JSX, `useState`, and handlers where supported.
7. Build and run browser checks after each migrated route.
8. If blocked, reduce the blocker to a fixture in this repository before extending the compiler.
9. Measure generated HTML, raw JS, gzip JS, and clean build time against the previous form.
10. Document the newly supported syntax and its deliberate limits.

## Explicit Non-Goals

- Running arbitrary React applications unchanged.
- Compatibility with the React package or React component ecosystem.
- Shipping component functions to reproduce React re-render semantics.
- A default SPA router or global client application runtime.
- Request-time SSR, server actions, or a hidden application server.
- Replacing browser-native navigation for cosmetic SPA behavior.

## Completion Definition

A migration feature is complete only when:

- it is driven by a real or reduced migration fixture;
- static HTML remains the initial document;
- generated JavaScript is capability-specific and absent when unused;
- diagnostics explain unsupported nearby React patterns;
- `npm run check` and `npm test` pass;
- a browser test proves the behavior where applicable;
- output-size and build-time impact are recorded;
- public documentation states both support and limits.
