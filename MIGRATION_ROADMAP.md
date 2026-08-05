# React Migration Roadmap

This document is the source of truth for Kudzu's product direction, architecture invariants, and future development order. Read it before extending React-shaped syntax or browser capabilities.

[`GOAL_A.md`](./GOAL_A.md) and [`GOAL_B.md`](./GOAL_B.md) are completed capability-validation records. Their commerce and realtime dashboard fixtures prove general lifecycle, navigation, async-workflow, and Worker capabilities; they are not separate product verticals or future priority lists.

## North Star

An AI should be able to migrate ordinary React-shaped TypeScript and TSX to CDN-deployable static HTML, CSS, and only the route-specific ESM capabilities actually used, with minimal source restructuring.

```text
ordinary React-shaped TSX
  -> Kudzu compiler specialization
  -> complete static HTML + CSS + capability-specific ESM
```

Kudzu is a general migration compiler. Shops, dashboards, documentation, blogs, landing pages, forms, and administration screens are outcomes built on the same compiler model. No application category defines Kudzu's architecture.

Syntax compatibility does not mean reproducing React wholesale. Kudzu accepts the statically analyzable subset it can lower to build-time output and direct browser capabilities. Unsupported nearby patterns must fail at build time with a file, line, and actionable explanation.

## Product Invariants

- Never add React as a runtime or production dependency.
- Never add a VDOM, hydration pass, retained browser component tree, generic component rerenderer, or hook dispatcher.
- Static routes ship zero client JavaScript.
- Interactive routes ship only the capabilities they use.
- Prefer build-time execution whenever all inputs are available during the build.
- State setters update logical state immediately and batch direct DOM writes at synchronous-turn boundaries.
- Preserve familiar function components, props, children, JSX, hooks, conditions, collections, and event handlers where Kudzu can compile them safely.
- Prefer compiler specialization over asking migrated applications to replace ordinary declarative React UI with imperative DOM code.
- Unknown browser-only data receives a static shell plus only the ESM needed to obtain and patch it.
- Native document navigation and ordinary `<a>` elements are the default.
- Same-document navigation remains explicit, route-group scoped, complete-document based, and recoverable through native navigation.
- Do not add compatibility APIs speculatively. A real or reduced conventional React fixture must fail first.

## Data And Route Decisions

Classify each migrated screen before changing the framework.

| Requirement | Kudzu treatment |
|---|---|
| Data and route known at build time | Async component or `getStaticPaths()`; emit complete HTML |
| Interaction after user input | Existing event compiler; emit handler ESM only |
| Data available only after browser mount | Inline `useEffect`; emit one route-specific effect graph |
| Route IDs known at build time | Bracket route plus `getStaticPaths()` |
| Route value known only from the URL | Static fallback plus compiled pathname parameter reader |
| Normal navigation | Native `<a>` document navigation |
| Proven same-document requirement | Explicit shared-layout route group with complete-document fallback |
| High-frequency browser processing | Relative Worker or imperative resource owned by an effect when a fixture proves it |
| Dataset too large for direct DOM | Pagination or windowing; do not render an unbounded tree |

Do not add `getStaticProps`, request-time SSR, an SPA router, a stream runtime, or a virtualization system until a reduced migration fixture proves the existing treatments insufficient.

## Completed Foundation

The following are available building blocks, not future vertical roadmaps:

- Async build-time components, `getStaticPaths()`, runtime path parameters, metadata, base paths, public assets, CSS, CSS Modules, and post-build hooks.
- React import normalization for supported named/aliased hooks, direct `React.*` members, fragments, same-file `memo`, inline `useCallback`, direct intrinsic `forwardRef`, top-level `useId`, and analyzable `useMemo` expressions and collections.
- Function components, props, children, context, direct bindings, conditions, controlled form properties, refs, and synchronous or async handlers.
- `useState`, independent repeated non-keyed child state with conditional mount ownership, reduced relative-imported `useReducer`, direct dispatch specialization, and reduced Zustand-shaped shared state proven by migration fixtures.
- Mount and dependency effects with cleanup, route/layout lifetimes, conditional/keyed ownership, stale-write isolation, and relative TypeScript Workers.
- Keyed local-state and imported static collections, pure selectors, nested direct-property lists, recursive and directly exported row specialization, static/keyed component reuse, analyzable specialized prop spreads, serializable literal defaults, direct intrinsic rest forwarding, forwarded JSX children, latest-item handlers, row state/effects/refs, and stable keyed identity.
- Complete-document native fallback and optional shared-layout navigation groups with parameter initialization, finite prefetch caching, focus, history, cleanup, and independent capability output.
- React-shaped SVG presentation attributes, direct `clsx` lowering, fixed-locale reactive `Intl.NumberFormat` display formatting, relative TypeScript handler helpers, and source-located diagnostics.

Completed fixtures such as commerce, TodoMVC, nested order data, Zustand state, landing pages, and realtime Workers are evidence that these compiler capabilities compose. They do not set the product's domain or automatically justify broader package compatibility.

## Development Selection Rule

Future work begins with an actual React application or a reduced fixture derived from one.

1. Build the source with the current compiler before restructuring it.
2. Inventory the first unsupported ordinary React pattern.
3. Reduce that pattern to the smallest executable fixture.
4. Confirm the pattern is general React authoring rather than one application's architecture.
5. Reuse an existing compiler/runtime capability before adding a new one.
6. Implement the narrowest shared specialization that preserves familiar source.
7. Add source diagnostics for the supported boundary and nearby rejected forms.
8. Prove static output, browser behavior, identity/cleanup, and zero-cost exclusion.
9. Measure output bytes, build time, and the affected browser operation.
10. Update public support and limit documentation.

An unsupported item is not automatically backlog work. Arbitrary callbacks, packages, and React semantics remain unsupported until independent migration evidence justifies a safe static specialization.

## Active Fixture Queue

This queue orders the next investigations by general migration value. Start only the highest item for which a real failing fixture exists.

### Completed In 0.8.0

- Relative zero-argument custom hooks expose direct shorthand state/setter pairs and state-capturing callbacks to one top-level caller destructuring.
- Writable React Router search parameters use native inline `URLSearchParams` updaters, push/replace history, signal recommits, and `popstate` synchronization.
- Guarded `localStorage` restoration and persistence compose through existing mount/dependency effects, preserving deterministic static fallbacks without a storage runtime.
- Reachable source compilation excludes unused React/Vite modules while preserving source diagnostics for every reachable module.
- Direct imported immutable maps fold to static HTML, and relative structured calculations reevaluate consumed scalar fields through existing binding ESM.
- Direct event-only package imports bundle into route handlers without executing during static rendering.
- Production Tailwind output, Inter assets, direct native SVG charts, and Excel export compose without adding Tailwind, Recharts, or a package runtime to Kudzu.
- FIRE migration validation covers all fourteen routes, URL/storage updates and reload, reset, presets, chart identity, Quiz recommendation, keyed Debt updates, Excel workbook creation, and zero-JavaScript Home/Books/Apps output.

### Completed In 0.8.1

- A direct custom-hook reset action may batch literal updates across its returned state/setter pairs. Imported callback literals are synthesized into existing behavior commands, and the FIRE Standard reset now remains owned by its hook while URL and storage effects observe the same commit.

### Completed In 0.8.2

- A direct array field from one top-level synchronous relative calculation result may feed a keyed intrinsic list. Route-specific evaluator ESM refreshes a compiler-owned array anchor before the existing list reconciler runs, preserving keyed SVG namespace, latest item handlers, and DOM identity without a chart or component runtime.
- The FIRE Standard projection exposes eleven calculated yearly points as accessible keyed SVG circles. Input commits update coordinates and labels while retaining every year node alongside the existing reactive path.

### Characterized In 0.8.3

- A direct clipboard action returned by a relative custom hook compiles through existing async native-handler ESM, including application-owned success and rejection state, without a clipboard runtime.
- A dependency effect using `setTimeout()` with directly returned `clearTimeout()` cleanup provides debounced synchronization; dependency changes and conditional unmount cancel pending work through existing effect ownership.
- The React/Vite migration fixture verifies latest-only debounce commits, unmount cancellation, fresh remount, clipboard success/failure, and zero JavaScript on its static sibling.
- Parent state plus focus, keyboard, and click handlers on calculated keyed SVG points drives an external accessible tooltip through existing native-handler and binding ESM. Recalculation preserves point identity and gives retained handlers the latest labels; the static sibling remains JavaScript-free.

### 1. Timer-Backed Custom Actions

Direct clipboard callbacks and effect-owned debounce require no new framework capability. Investigate a returned custom-hook action with private timer ownership only when a migration fixture proves that the ordinary effect form is insufficient. Compile the exact proven action to existing event/effect ownership rather than serializing arbitrary closures or adding a scheduler.

Acceptance: callback identity and captures are statically known, timers and cleanup have explicit ownership, and unsupported indirect calls fail at build time.

### 2. Expanded Chart Interaction

Accessible selected-point tooltips require no new framework capability. Investigate detailed Withdrawal/Debt series only after a reduced migration fixture proves additional interaction is needed. Prefer direct SVG bindings and keyed SVG rows; add no chart runtime unless native output is measurably insufficient.

Acceptance: accessible static SVG is present initially, updates preserve element identity, and unaffected routes ship no chart JavaScript.

## Cross-Cutting Performance Gates

Every migration feature must preserve:

- zero JavaScript for unaffected static routes;
- no new shared runtime bytes for routes that do not use the capability;
- complete initial HTML where data is build-known;
- direct DOM identity and cleanup semantics;
- no unexplained material build or browser regression;
- honest comparisons with matched content and behavior.

Production measurements receive one warm-up and at least seven interleaved builds. Browser measurements use rotating fresh profiles; use more runs when ranges overlap. Record raw/gzip artifacts, environment, raw arrays, medians, known losses, and deliberate limits.

## AI Migration Workflow

When migrating a React application:

1. Inspect routes, data timing, hooks, browser globals, router usage, packages, forms, and expected behavior.
2. Preserve ordinary React-shaped source where current Kudzu supports it.
3. Move build-known fetches into async pages/components.
4. Use `getStaticPaths()` for build-known dynamic routes.
5. Use native anchors unless same-document navigation is an explicit requirement.
6. Build and run browser checks after each route.
7. Reduce the first blocker before extending the compiler.
8. Measure generated HTML, raw/gzip JavaScript, build time, and affected interactions.
9. Document both the new support and its deliberate boundary.

## Explicit Non-Goals

- Running arbitrary React applications unchanged.
- React runtime, package ecosystem, islands, VDOM, hydration, or retained components.
- Shipping component functions to reproduce React rerender semantics.
- A default SPA router or global client application runtime.
- Request-time SSR, server actions, or a hidden application server.
- General state, stream, scheduler, widget, plugin, chart, map, editor, or virtualization frameworks.
- Implementing speculative compatibility because an API exists in React.

## Completion Definition

A migration feature is complete only when:

- it comes from a real or reduced conventional React fixture;
- ordinary source structure is preserved where safely compilable;
- static HTML remains the initial document;
- generated JavaScript is capability-specific and absent when unused;
- diagnostics explain unsupported nearby forms;
- browser tests prove behavior, ownership, and identity where applicable;
- performance and output impact are recorded;
- `npm run check` and `npm test` pass;
- public documentation states support, limits, and architecture tradeoffs.
