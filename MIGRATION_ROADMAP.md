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
- React-shaped SVG presentation attributes, direct `clsx` lowering, relative TypeScript handler helpers, and source-located diagnostics.

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

### 1. Hookful Component Specialization

Investigate ordinary imported or same-file components that own local hooks outside the currently specialized keyed-row shapes:

- Repeated non-keyed child local state and conditional removal/remount ownership are complete.
- directly serializable lazy `useState` and `useReducer` initialization are complete;
- direct primitive prop dependencies are complete for ordinary same-file and relative-imported children;
- Safe callback/ref ownership across one proven component boundary is complete for inline or simple `const` setter callbacks and `null`-initialized object refs forwarded to a direct intrinsic root.

Acceptance: ownership is compiler-generated, removal cleans up exactly once, and no generic component runtime or rerender loop is introduced.

### 2. Pure Collection Composition

Investigate common immutable collection source that remains awkward to migrate:

- Reusable aliases with statically provable use sites are complete for immutable local collection aliases feeding multiple keyed lists;
- computed direct child collections;
- imported pure synchronous transforms;
- immutable search, slice, pagination, and sorting forms proven by fixtures.

Mutation, arbitrary callbacks, promises, and package collection engines remain outside the queue. Large datasets require bounded visible output rather than giant DOM trees.

### 3. Common Effect Dependencies

Investigate effect forms common in ordinary React source:

- destructured primitive props backed directly by parent state are complete;
- simple derived primitive locals;
- common named callback or cleanup forms that remain statically resolvable;
- multiple direct dependencies without adding a scheduler.

Acceptance: direct dependency comparison, cleanup-before-rerun, stale async isolation, and route/DOM ownership remain explicit.

### 4. Structural SVG Rendering

Investigate conditional and keyed ranges inside SVG plus namespaced attributes only when a real icon, chart-shell, or illustration fixture fails. Reuse existing condition/list ownership and attribute normalization; do not create an SVG renderer.

### 5. Router-Shaped Source Lowering

Investigate conventional React Router source forms that can erase to existing behavior:

- `Link` to native anchors;
- route parameters to `getStaticPaths()` or the runtime pathname reader;
- query reads to build-time props or a minimal URL reader;
- imperative navigation to native document navigation where semantics match.

This work must not add a default SPA router. Same-document transitions require explicit user approval and a measured fixture need.

### 6. Repeated Package Patterns

Broaden Zustand, `clsx`, reducer forwarding, Worker forms, or UI-package source only after multiple independent fixtures expose the same statically lowerable pattern. Prefer erasing a narrow authoring shape to executing the package or adding an adapter framework.

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
