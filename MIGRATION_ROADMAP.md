# React Migration Direction

This document is the durable product and implementation direction for future Kudzu work. Read it before changing architecture or attempting a React migration.

The approved business-application milestone and its performance gates are defined in [`GOAL_A.md`](./GOAL_A.md). Static realtime dashboard work is defined in [`GOAL_B.md`](./GOAL_B.md).

Goal A Phase 3 layout and route render scopes are implemented. Phase 4 supports the legacy `navigation: { routes: string[] }` group and post-Goal-A `navigation: { groups: [{ routes: string[] }] }` shared-layout groups. Each group enhances only its emitted exact or `runtimeParams` routes exporting the same layout function; group assets and pattern/effect/parameter specialization are independent, cross-group links remain native, and overlapping path domains are rejected. Every route remains a complete document. Layout- and route-lifetime effects, including effects owned by conditional DOM and keyed rows, mount for their declared lifetime. Route registries are recreated after each insertion while the layout registry persists. Direct JSON-safe primitive keyed-item property dependencies rerun only rows whose selected values changed. Same-file and relative-imported components may receive a local state array directly and render its keyed map under an intrinsic root; the compiler specializes the wrapper at build time. The Phase 6 compatibility probe confirms that these lifetimes can own a mock stream and an imperative helper across navigation; it adds no telemetry, chart, worker, socket, plugin, or public framework API.

Goal B Milestone 1 is implemented. Exact relative `.worker.ts` module construction inside compiled inline effects emits a separately hashed Worker graph under `assets/workers`; route cleanup owns termination, and non-Worker routes retain their existing capability paths. The supported syntax and deliberate graph limits are specified in `GOAL_B.md`.

## North Star

An AI should be able to migrate a conventional React application while preserving ordinary common React-shaped TSX with minimal source restructuring. Kudzu should specialize declarative components, collection pipelines, hooks, and conditions in the compiler instead of requiring imperative DOM rewrites. This is a product-wide principle, not a Stay-specific compatibility target. Kudzu then compiles that source to CDN-deployable static HTML, CSS, and the smallest route-specific ESM needed for behavior.

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
- `useState`, relative-imported `useReducer`, context, reactive text and attributes including React-shaped SVG presentation props, conditionals, keyed lists, and normal ESM event handlers compile to direct DOM behavior.
- Shared state, serialization, DOM commit batching, mount hooks, and cleanup hooks already exist in capability runtimes.
- Imported relative TypeScript helpers, imported keyed-list row components, and same-file or relative-imported state-backed list wrappers already have build-time resolution paths. A keyed row may contain multiple direct parent-property child maps recursively at any depth. Nested maps may specialize chains of same-file and relative-imported rows with nested conditions, latest-item handlers, multiple serializable state slots, effects, and object refs.

The landing-page migration fixtures retain named and aliased hooks from `react`, direct members such as `React.useState`, same-file `memo`, inline `useCallback`, direct-state expression and analyzable collection-pipeline `useMemo`, `React.Fragment`, and named `Fragment` across relative components. They also retain Vite-shaped side-effect CSS, scoped CSS Module classes, default image/SVG/font imports, asset `?url`, relative CSS `url(...)` references under non-root bases, and direct `clsx` calls over literal values and object conditions. The compiler canonicalizes supported hooks, erases component and callback memo wrappers, inlines memoized primitive/direct-state expressions at same-component uses, lowers memoized `filter`/`map`/`flatMap`/`Array.from` pipelines to existing collection selectors, lowers supported `clsx` calls to ordinary class expressions, rewrites React imports to Kudzu, resolves styles and assets to build-time literals, and copies referenced bytes under source-relative `dist/assets` paths. Collection memos may start from local array state or a named relative import of an exported JSON-safe `const` array; direct local-state filter captures must appear in the literal dependency array and invalidate the existing keyed-list selector without a memo cache. Compiler-owned static filters over structural rows validate source metadata once, retain removed row prototypes, and restore fresh nodes without moving retained keys. The matched 1,000-row, 31-profile Chrome run measured Kudzu at 37.8/8.4/3.6 ms for visible/filter/restore, React at 86.3/12.9/6.2 ms, Vue at 54.1/8.4/4.3 ms, and Svelte at 61.4/11.7/8.3 ms under 4x CPU throttling. This does not replace pagination or windowing for datasets too large to render directly. Existing reactive binding and keyed-list compilation update memoized state results while preserving row identity; no browser memo cache or `clsx` function is emitted. Memo locals must be unique and cannot cross a nested function boundary. The same lowering applies inside specialized imported keyed rows. It emits no React reference, leaves static routes JavaScript-free, and compiles only the capabilities used by interactive routes. CSS Module `composes`, arbitrary import queries, and named or namespace asset bindings remain unsupported. This is source ingestion, not a React runtime or compatibility layer.

The TodoMVC React implementation at `tastejs/todomvc@ff43b02` supplied the first post-Goal-B reducer blockers: reducer-owned todo state, dispatch passed to child controls and keyed rows, a callback passed to an input, and a primitive prop default. Kudzu accepts direct `[state, dispatch] = useReducer(reducer, initialValue)` with a pure synchronous two-parameter reducer imported from a relative TypeScript module. Dispatch may cross one direct specialized same-file/relative component boundary, including a keyed row, and one inline or simple `const` callback may cross one additional relative-imported intrinsic boundary; an inline callback may retain a React `useCallback` wrapper. Keyed reducer rows use the general row specialization for multiple serializable state values, nested conditions, effects, and `null` object refs. Relative TypeScript handler helpers join the parent graph; no reducer runtime, dispatch capture, or dead child handler asset is emitted. Lazy state/reducer initialization, non-keyed specialized local state, package reducers, child imports outside handlers, further forwarding, and reducer dispatch through context remain unsupported. The original optimized fixture emitted 21,803 B raw/8,968 B gzip across seven JavaScript files and had a 396.3 ms seven-build median.

A reduced shopping migration fixture retains a named Zustand `create` import, one exported store with one serializable data property and synchronous capture-free merge-form `set` actions, and direct property selectors across a shared layout and two routes. The compiler erases Zustand, owns the data as one layout state slot, and inlines selected actions through the existing functional state update path. Same-turn actions observe current logical state; navigation preserves the store and layout DOM while route consumers remount against the retained value. Derived selectors, multiple data properties, middleware, `get`, subscriptions, equality functions, persist/devtools wrappers, async actions, helper captures, replacement updates, keyed-row initialization, and indirect forwarding remain unsupported.

The matched 1,000-row local-state benchmark edits row 500, reverses while requiring the same row and input DOM nodes, removes it, and re-adds the same key with reset state. Thirty-one rotating fresh-profile medians measured Kudzu at 2.7/10.8/3.0/3.7 ms for edit/reverse/remove/re-add, React at 6.2/25.8/9.1/6.7 ms, Vue at 3.0/12.1/4.2/4.1 ms, and Svelte at 2.8/50.4/4.6/5.9 ms. Kudzu had the lowest framework median for every operation; the 0.1 ms displayed edit lead over Svelte was not statistically significant, while every other framework comparison was significant. The separate seven-profile hand-written Astro/native run measured 1.6/5.7/1.2/1.3 ms. Kudzu's 434 ms clean-build median was the lowest framework build. Kudzu and Astro emit initial rows while the other fixtures are CSR; Kudzu's 586,612 B output includes complete HTML and per-row descriptors, so artifact sizes are not architecture-equivalent.

The matched 100-parent/1,000-child component benchmark updates one child's text and condition, reverses its children and parents independently, and removes one parent while requiring existing DOM identity. Kudzu measured 1.3/0.4/5.0/0.7 ms for those operations and a 477 ms clean-build median in the final interleaved run.

Initial child rows retain complete current HTML while their lists share one child row prototype, inert condition branches, and patch descriptors. The final fixture emits 339,601 B HTML and 359,271 B total raw deploy output, with 24,173 B aggregate gzip. Ordinary flat-list HTML and JavaScript remain byte-for-byte equal to the pre-feature `HEAD` build, and nested marker lookup is compiled out when nested lists are absent.

The Order migration fixture extends this ownership model from `orders → items` to `orders → items → option groups`. The compiler and runtime apply the same ownership recursively without a numeric depth limit; each row may own multiple immediate direct-property child maps, and nested rows retain keyed DOM identity and latest-item handlers.

The neutral React-shaped integration fixture combines a `flatMap`/`filter` alias, `(item, index)`, stable and positional keys, sibling/deep component lists, three nested conditions, and keyed-row state/effect/ref ownership. It emits 13,898 B HTML and 39,387 B raw/14,655 B gzip JavaScript across 11 files (16,514 B total file-by-file gzip at level 9). After one warm-up, seven artifact-clean builds measured 436.251-517.121 ms with a 486.594 ms median on July 30, 2026. Seven fresh Chrome profiles measured 2.2 ms filter update, 1.2 ms flatMap reorder, 0.6 ms row-state/effect rerun, 1.0 ms nested-condition re-entry, 0.8 ms removal cleanup, 2.1 ms re-add/reset, and 0.8/0.6/0.5 ms sibling-list update/add/reorder.

A reduced React icon fixture exposed verbatim camelCase SVG presentation attributes. Kudzu now normalizes an explicit common alias set during rendering, before both static output and reactive binding descriptors. Static icons remain zero-JavaScript and reactive SVG reuses the existing binding runtime byte-for-byte. In-SVG conditional/list ranges and namespaced attributes remain separate compatibility work.

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
4. effect ownership inside conditional or keyed DOM ranges, including direct primitive keyed-item property dependencies (implemented).

Each addition must reuse capability mount/unmount hooks, have one focused migration fixture, and preserve zero output cost for pages that do not use it.

Keyed row dependencies accept only direct `item.<field>` reads, optionally mixed with direct state or runtime parameter identifiers. Selected values must remain JSON-safe primitives. Whole-item, computed, nested, derived, and prototype-sensitive reads fail with source diagnostics. Reorder compares equal and does not run lifecycle work; selected field changes rerun only affected rows with the complete latest item, and key changes remain remove plus mount. The complete targeted-notification capability costs +821 B raw/+255 B gzip across its route entry, shared runtime, and list runtime; builds without item dependencies retain their previous path. The expanded three-route fixture's seven clean builds measured a 430 ms median.

The matched 1,000-row effect runtime benchmark measured Kudzu at 3.6 ms for one selected-field change, 2.4 ms for an unrelated-field change, and 8.8 ms for reorder after all targets were initialized. React CSR measured 9.8, 5.9, and 16.8 ms; Vue measured 5.8, 2.4, and 10.5 ms; Svelte measured 5.7, 4.1, and 58.1 ms; and hand-written native DOM measured 0.4, 0.2, and 5.7 ms. Kudzu and native emit initial rows while the framework fixtures are CSR, so artifact and build values are not architecture-equivalent comparisons. The list runtime notifies only the changed keyed root after refreshing its item marker, and route registries unsubscribe those hooks on disposal. List validation, serialization, and reconciliation remain O(n); do not add a general scheduler unless those existing costs exceed a real fixture's budget.

Do not implement `useLayoutEffect`, concurrent rendering, Suspense semantics, transitions, or an effect scheduler without an explicit application requirement.

### 5. Document Resource Correctness Before Navigation Features

Status: implemented for stylesheets and generated route modules. CSS under `src`, transformed source style entries, and root-relative or absolute HTTP URLs in `kudzu.config` `styles` are emitted in deterministic order in every document `<head>`. Configurable `publicDir` and props-aware config/page metadata remove post-build file copying and HTML mutation from migration configs. Direct static `<link rel="stylesheet">` JSX fails with a source-located diagnostic; computed JSX stylesheet output is rejected during rendering. Trusted raw HTML remains deliberately unparsed. Interactive route modules are also emitted in the head, retaining deferred execution while allowing cold downloads to overlap HTML transfer.

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
