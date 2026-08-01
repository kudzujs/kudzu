# Goal A: Static Application Lifecycles And Opt-In Navigation

Goal A is a completed compiler-capability milestone for general React-to-static migration. It proves that ordinary React-shaped applications can retain shared layouts, route lifetimes, asynchronous workflows, and optional same-document navigation while every route remains a complete static document.

The six-route commerce journey is one executable validation fixture. It is not Kudzu's product scope, a commerce API, or the priority model for future development. [`MIGRATION_ROADMAP.md`](./MIGRATION_ROADMAP.md) is the source of truth for product direction and future fixture-driven work.

## Status

Goal A is complete for explicitly configured emitted-route groups with shared layouts. Implemented capabilities include:

- complete standalone documents for exact and runtime-parameter routes;
- native navigation fallback and opt-in same-document navigation;
- persistent layout state and effects with disposable route state and effects;
- conditional and keyed DOM ownership within layout and route lifetimes;
- validated finite prefetch caching for eligible links;
- optimistic success, rejection, rollback, and stale-write suppression;
- multiple independent shared-layout groups with overlap diagnostics.

Future migration features do not extend Goal A as a product vertical. They return to the migration roadmap and begin with a failing conventional React fixture.

## Capability Contract

A migrated application may use familiar function components, props, children, JSX, hooks, conditions, collections, and handlers while Kudzu emits:

```text
complete static document
  -> optional persistent layout range
  -> replaceable route range
  -> only the route-specific ESM capabilities used
```

The capability must preserve:

- complete indexable HTML for every route;
- direct entry, reload, back, forward, query strings, and base paths;
- URL, route, and shared-layout state with explicit lifetimes;
- async loading, empty, error, retry, cancellation, and stale-result handling;
- optimistic updates, rejection, rollback, and accessible status output;
- focus, title, scroll, and announcement behavior after enhanced navigation;
- ordinary document navigation when JavaScript is absent, late, or fails.

## Invariants

- Native `<a>` navigation is the default.
- Navigation enhancement is explicit per emitted route group.
- Every enhanced route also exists as a complete document.
- Static routes emit zero client JavaScript.
- Interactive routes emit only the capabilities they use.
- React, a VDOM, hydration, retained browser components, and browser component rerenders remain forbidden.
- External, download, modified-click, reload, malformed, unsupported, and ungrouped links keep native behavior.
- A failed or superseded transition cannot commit stale route state.
- No separate fragment protocol, router API, cache, or scheduler is added without a measured fixture requirement.

## Ownership Model

Goal A adds explicit ownership, not a state library or application runtime.

| Owner | Lifetime | General examples |
|---|---|---|
| Document | Full document | global listeners and document-exit cleanup |
| Layout | Enhanced navigation session | user summary, navigation state, shared resource |
| Route | Current route range | filters, requests, subscriptions, pending work |
| DOM range | Conditional or keyed item | listener, effect, ref, imperative child resource |

Removing an owner disposes its effects, listeners, pending work, and descendant registrations exactly once. A non-persisted document exit cleans route ownership before layout ownership. A BFCache-persisted document retains live ownership for restoration.

## Validation Fixture

The reduced commerce journey remains a useful integration fixture because it exercises the neutral capability contract in one flow:

```text
home -> category -> product -> cart -> checkout -> account
```

Its product filters prove URL state, variants prove route state, cart/session data proves layout state, rejected updates prove rollback, and product-to-cart transitions prove enhanced navigation. These nouns belong to the fixture only; Kudzu must not add commerce-specific APIs or architecture.

Other applications should validate the same capabilities with domain-appropriate fixtures such as documentation, content, administration, forms, and dashboards.

## Performance Protocol

Matched comparisons may include React/Vite, static exports from established frameworks, and hand-written HTML/DOM code as a lower bound. Every target must provide the same initial content, behavior, errors, navigation semantics, and accessibility before results are compared directly.

Record at least:

- deploy bytes and initial raw/gzip JavaScript;
- HTML, CSS, media, and route transfer bytes;
- clean build median;
- cold and warm LCP, CLS, INP, startup work, and heap;
- state update, optimistic rejection, rollback, and route transition latency;
- repeated-navigation listener, request, state, DOM, and heap ownership.

Production builds receive one warm-up and at least seven interleaved runs. Browser comparisons use rotating fresh profiles and additional runs when ranges overlap. A repeatable browser median change above 5% is material; deterministic byte growth is always reviewed.

## Regression Gates

- Static routes still emit zero JavaScript.
- Routes outside configured groups remain unaffected by navigation support.
- No hydration task or retained component tree is introduced.
- Repeated navigation leaves no growing ownership.
- Material regressions against Kudzu's previous path are explained and fixed or recorded as explicit tradeoffs.
- Competitor comparisons disclose unequal rendering architecture and fixture limitations.
- `npm run check`, `npm test`, and applicable browser checks pass.

## Historical Validation Record

The completed commerce and lifecycle measurements remain dated evidence, not current product requirements. The latest retained records include complete desktop/mobile navigation runs, zero cold/warm CLS, exact cleanup counters, capability byte deltas, and matched framework comparisons. Release notes and repository history retain version-specific numbers; new measurements must record their source revision, fixture, browser, hardware, raw arrays, and limitations.

## Non-Goals

- A default SPA router.
- A commerce framework or reusable commerce package.
- Arbitrary React package compatibility.
- Runtime component registration, hydration, or client component rendering.
- Request-time SSR, server actions, or a hidden application server.
- Charting, mapping, telemetry, virtual-grid, or editor engines.
- Winning synthetic metrics by omitting equivalent content, behavior, accessibility, or fallback.
