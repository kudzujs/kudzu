# React Migration Direction

This document is the durable product and implementation direction for future Kudzu work. Read it before changing architecture or attempting a React migration.

The approved business-application milestone and its performance gates are defined in [`GOAL_A.md`](./GOAL_A.md).

Goal A Phase 3 layout and route render scopes are implemented. Phase 4 supports the legacy `navigation: { routes: string[] }` group and post-Goal-A `navigation: { groups: [{ routes: string[] }] }` shared-layout groups. Each group enhances only its emitted exact or `runtimeParams` routes exporting the same layout function; group assets and pattern/effect/parameter specialization are independent, cross-group links remain native, and overlapping cross-group path domains are rejected. Every route remains a complete document. Top-level layout- and route-owned effects mount for their declared lifetime; conditional/keyed DOM-owned effects remain rejected in navigation groups. The Phase 6 compatibility probe confirms that these existing lifetimes can own a mock stream and an imperative helper across navigation; it adds no telemetry, chart, worker, socket, plugin, or public framework API.

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
- Use browser document navigation and ordinary `<a>` elements by default. Goal A may enhance explicitly configured application route groups while preserving complete documents and native fallback.
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
| SPA transitions | Goal A opt-in application groups only; complete documents and native fallback remain required |

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
- Accept directly returned inline cleanup functions and literal arrays of direct primitive signal dependencies; reject dependency expressions, named or dynamic cleanup returns, unsupported captures, and non-analyzable calls with source-located diagnostics.

Acceptance criteria:

- A page can fetch on mount, set state, and patch reactive text, attributes, conditions, and keyed lists.
- A page without `useEffect` has byte-for-byte unchanged runtime output.
- No React code or component function is shipped.
- Tests cover success, async failure behavior, cleanup disposal and isolation, unsupported dependencies, unsupported returns, and multiple independent effects.
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

The two-parameter fixture's route matcher is 702 B gzip. Its complete binding, dependency effect, event, serialization, and parameter initial graph is 6.7 KB gzip and its seven-run clean-build median is 491 ms.

### 4. Add Effect Semantics Only When Proven Necessary

Status: mount-only cleanup, primitive dependency arrays, cleanup-before-rerun, and DOM-range ownership are implemented. Direct state and runtime parameter signal identifiers are compared with `Object.is`; commits coalesce per turn, affected asynchronous cleanups are awaited in declaration order, then replacement setups run in declaration order. Components are not rerun. Document effects skip persisted page exits; effects in conditional ranges and supported keyed row components mount and clean up with their DOM owner.

The three-cleanup isolation fixture emits 1.4 KB gzip across its four JavaScript files, including a 487 B gzip route effect entry, and its seven-run clean-build median is 480 ms.

In the matched one-listener cleanup benchmark, Kudzu emits 1.2 KB JavaScript gzip and builds in 402 ms. Svelte emits 10.1 KB in 861 ms, Vue 23.6 KB in 768 ms, React 59.1 KB in 1,058 ms, and the hand-written Astro baseline 127 B in 865 ms. Kudzu and Astro include initial HTML; the CSR fixtures do not.

In the matched dependency-rerun benchmark, Kudzu emits 1.5 KB JavaScript gzip and builds in 429 ms. Svelte emits 9.7 KB in 995 ms, Vue 23.8 KB in 943 ms, React 59.2 KB in 1,172 ms, and the hand-written Astro baseline 196 B in 969 ms. Kudzu and Astro include initial HTML; the CSR fixtures do not. Single-effect, single-dependency routes use a direct runner without generic maps, sets, or sorting.

After mount-only effects and runtime params unblock a real migration, add the next missing semantic one at a time:

1. cleanup for `useEffect(fn, [])` (implemented);
2. primitive dependency arrays such as `[id]` (implemented);
3. cleanup-before-rerun (implemented);
4. effect ownership inside conditional or keyed DOM ranges (implemented; keyed item-property dependencies remain unsupported).

Each addition must reuse capability mount/unmount hooks, have one focused migration fixture, and preserve zero output cost for pages that do not use it.

Do not implement `useLayoutEffect`, concurrent rendering, Suspense semantics, transitions, or an effect scheduler without an explicit application requirement.

### 5. Document Resource Correctness Before Navigation Features

Status: implemented for stylesheets and generated route modules. CSS under `src` and root-relative or absolute HTTP URLs in `kudzu.config` `styles` are emitted in deterministic order in every document `<head>`. This permits `afterBuild()` to produce a declared stylesheet without making the browser discover it in the body. Direct static `<link rel="stylesheet">` JSX fails with a source-located diagnostic; computed JSX stylesheet output is rejected during rendering. Trusted raw HTML remains deliberately unparsed. Interactive route modules are also emitted in the head, retaining deferred execution while allowing cold downloads to overlap HTML transfer.

In a generic seven-run browser fixture with 75.3 KB HTML, a 57 KB two-module graph, 100 ms latency, and 200 KB/s download throughput, head discovery started the entry request 383 ms earlier and reached route readiness 208 ms earlier on a cold load. Warm-cache readiness was unchanged, transferred module bytes were unchanged, and both forms recorded zero layout shift. A 31-run interleaved clean-build comparison measured 596.6 ms for `v0.5.9` and 584.8 ms with document-resource handling, a 2.0% reduction; the overlapping ranges make this a no-regression result rather than a claimed build-speed gain.

Before adding view transitions, asset hashing, image transformation, or further navigation behavior, reduce a general fixture and measure cold and warm document loads under production-like caching. Record HTML, CSS, initial ESM graph, local media and font bytes, request transfer sizes, layout shift, and largest contentful paint. Goal A navigation followed this gate: its first complete-document transition exposed one network round trip, so a finite validated prefetch cache was added only after the matched fixture measured the need. An individual migrated application may reveal a category of problem but must not become Kudzu architecture or a framework fixture by itself.

Acceptance criteria:

- Static pages remain JavaScript-free.
- Styles are present before the body and preserve deterministic source-then-config order.
- Generated route modules are discovered in the head, execute after parsing, and remain absent from static routes.
- Configured local style URLs honor `base`; absolute HTTP URLs remain unchanged.
- Direct body stylesheet diagnostics identify the source location and computed forms still fail before output is written.
- Any later navigation capability remains opt-in and preserves ordinary `<a>` fallback behavior.

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
- A default SPA router or global client application runtime; Goal A navigation remains explicit and route-group scoped.
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
