# Goal B: Static Realtime Dashboards

Goal B makes Kudzu sufficient for a ThingsBoard-shaped realtime device dashboard without turning Kudzu into a stream runtime, widget framework, or server platform. It preserves complete static documents, zero-JavaScript routes that use no browser capabilities, direct DOM ownership, native navigation fallback, and the absence of React, a VDOM, hydration, or a retained browser component tree.

`MIGRATION_ROADMAP.md` remains the source of truth for compiler invariants and fixture-first development. This document is the implementation contract for realtime dashboard work.

## Product Target

A user can statically deploy this flow:

```text
dashboard -> devices -> device detail -> alarms -> settings
```

The first vertical slice is deliberately smaller:

```text
plain route <-> realtime device dashboard
```

The dashboard receives a logical 1,000 telemetry samples per second, keeps a bounded history in a module Worker, downsamples it, and updates one imperative chart without routing samples through `useState()`.

## Runtime Model

```text
Complete static dashboard shell
  -> route-specific effect ESM
  -> route-owned module Worker
  -> bounded telemetry buffer and downsampling
  -> batched imperative chart updates
```

Kudzu state is for low-frequency UI state such as selected device, time range, filters, tabs, connection status, alarm status, and widget configuration. High-frequency samples belong in a Worker or imperative browser module.

The Worker is a capability, not a framework runtime. Routes that do not create one must not load its graph. Static routes must remain JavaScript-free.

## Milestone 1: Relative TypeScript Workers

Status: implemented and verified. The compiler recognizes only the exact inline-effect form below, emits its validated graph separately, rewrites the constructor to the base-aware same-origin asset, and leaves routes without this capability on their existing output paths.

Support this exact shape inside a compiled inline `useEffect` callback:

```tsx
useEffect(() => {
  const worker = new Worker(
    new URL("../telemetry.worker.ts", import.meta.url),
    { type: "module" },
  )

  const onMessage = (event: MessageEvent<ChartFrame>) => chart.render(event.data)
  worker.addEventListener("message", onMessage)

  return () => {
    worker.removeEventListener("message", onMessage)
    worker.terminate()
    chart.dispose()
  }
}, [])
```

Compiler requirements:

- accept only an unshadowed `Worker` with `new URL(relativeLiteral, import.meta.url)` and literal `{ type: "module" }`;
- resolve one `.worker.ts` entry under project source and bundle its relative TypeScript graph separately from window code;
- emit deterministic content-hashed ESM under `assets/workers` and rewrite the constructor to the base-aware emitted URL;
- reject package imports, JSX, TypeScript import-equals declarations, dynamic imports, `require()`, paths outside source, malformed options, and unsupported Worker forms with source locations;
- reject ordinary runtime imports or re-exports of `.worker.ts`; type-only imports may erase normally;
- do not mark Worker files as navigation capability scripts or import them into the window;
- create the Worker only when the owning effect mounts;
- preserve byte-for-byte generated shared/list/effect paths for builds without relative TypeScript Workers where practical;
- reject generated/public asset collisions instead of silently overwriting output.

Worker construction inside imported helpers or imported keyed-row effects, `SharedWorker`, classic workers, inline Blob workers, and arbitrary dynamic Worker URLs are outside Milestone 1. Imported keyed rows must move Worker ownership to a directly compiled page or local component effect so lexical global analysis remains tied to the original source tree.

## Ownership

| Owner | Lifetime | Dashboard responsibility |
|---|---|---|
| Document | Full document | authentication expiry and global diagnostics |
| Layout | Enhanced navigation session | tenant session or shared transport |
| Route | Current dashboard/device | Worker, telemetry subscription, request cancellation |
| DOM range | Current widget | chart, gauge, map, table, animation frame |
| Worker | Explicit owner cleanup | parsing, bounded buffering, aggregation, downsampling |

Leaving a route must remove message listeners, stop chart work, terminate its Worker, and invalidate stale UI writes before another route mounts. BFCache-preserved documents must retain their live ownership until a real document exit.

## Fixture Contract

The first fixture must provide:

- one complete realtime dashboard document and one complete plain document in an opt-in navigation group;
- one unrelated static route with zero JavaScript;
- a relative TypeScript Worker importing at least one relative helper;
- a fixed-capacity ring buffer with deterministic eviction;
- logical 1,000 samples/second input in batches rather than a 1 ms browser timer;
- bounded downsampled frames delivered at no more than display cadence;
- one imperative canvas or DOM chart updated without sample-level Kudzu setters;
- direct load, dashboard-to-plain navigation, back/forward, and repeated cached revisits;
- exact counters for Worker starts, terminations, messages, renders, listeners, and stale post-cleanup work;
- native document fallback when JavaScript or Worker creation fails.

## Acceptance Criteria

- the Worker graph is absent from static and plain route HTML and is fetched only after the dashboard effect mounts;
- two unchanged production builds emit identical Worker names and bytes;
- changing Worker source changes its content hash;
- base-prefixed deployment produces a valid same-origin Worker URL;
- 30 dashboard/plain cycles create and terminate exactly 30 route Workers with no growing listener or chart ownership;
- messages arriving after cleanup cannot update removed route DOM;
- the ring buffer remains at its configured capacity under sustained input;
- chart rendering is batched and sample ingestion does not call `useState()`;
- routes without Worker capabilities remain byte-for-byte unaffected;
- output raw/gzip cost, clean build time, sample throughput, render cadence, and lifecycle counters are recorded;
- `npm run check`, `npm test`, package dry-run, and browser checks pass.

Verified measurements for the focused `/dash` fixture: the minified Worker graph is `assets/workers/telemetry.worker-BVG2SA55.js`, 907 B raw and 477 B gzip. The dashboard window graph is 11,388 B raw and 5,148 B gzip across its shared runtime, effect runtime, navigation, route effect entry, and handler module; the Worker is not part of that graph. Seven clean minified builds measured 455.1, 459.9, 460.7, 463.5, 467.6, 472.6, and 475.2 ms, with a 463.5 ms median.

The real-Worker browser check uses real wall time and requires sustained generation beyond 1,130 samples at 700-1,300 logical samples/second, an exact 128-sample ring bound, batches of 10, exactly 24 displayed points, multiple renders, and a render ceiling below 25 Hz. Delayed Worker ticks catch up in batches to the logical 1,000 samples/second clock; frames emit no more often than every 50 ms. The imperative chart performs a minimal canvas path draw. The navigation ownership check completed 30 dashboard/plain cycles with exactly 30 starts and 30 terminations, exactly 60 listener additions and removals across message and error listeners, zero retained listeners after every cleanup, disposed every old chart canvas, fresh ownership on back/forward and cached revisits, and no render from a removed message listener invoked after cleanup. Dashboard, plain, and static HTML contain no Worker asset URL; plain does not load the route effect graph, and static contains no script, capability marker, or state payload. A no-Worker equivalent emitted byte-identical shared runtime, effect runtime, navigation, and route effect entry files with no `assets/workers` directory. An unreachable imported-row effect referencing `unused.worker.ts` emitted no Worker asset. Two unchanged builds emitted identical Worker names and bytes, and a controlled downsample-source change changed the emitted hash.

## Delivery Order

1. **Worker compiler capability**: exact syntax, graph bundling, hashing, base rewriting, diagnostics, and zero-cost exclusion.
2. **Capability conformance fixture**: mock telemetry Worker, bounded buffer, downsampling, imperative DOM ownership, and route cleanup.

Further work belongs to the React migration roadmap and starts from a reduced compatibility fixture that fails. Kudzu does not implement device, alarm, transport, or widget product features.

## Performance Gates

- sustained 1,000 samples/second does not create one main-thread task or Kudzu state commit per sample;
- Worker memory is bounded by declared buffer capacity;
- chart updates are batched to at most one per display frame;
- dashboard departure stops observable messages and renders before the next route mounts;
- repeated navigation leaves no growing Worker, timer, listener, chart, state, DOM, or heap ownership;
- Worker support adds no bytes to routes and builds that do not use it;
- material losses are profiled and fixed or documented as explicit tradeoffs using matched initial content and behavior.

## Non-Goals

- implementing ThingsBoard's server, protocol, rule engine, database, or complete UI;
- storing telemetry samples in Kudzu component state;
- adding a general observable, scheduler, stream, state, or widget runtime;
- retaining a browser component tree;
- request-time SSR, Server Actions, or a hidden application server;
- a plugin marketplace or arbitrary third-party React widgets;
- claiming Worker isolation as a security sandbox.

## Completion Definition

Goal B Milestone 1 is complete when the focused realtime fixture proves deterministic relative TypeScript Worker emission, bounded high-frequency processing, imperative chart updates, exact route ownership and cleanup across repeated navigation, native/static fallback, zero-cost exclusion, source diagnostics, and recorded production measurements.
