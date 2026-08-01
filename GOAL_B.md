# Goal B: Relative TypeScript Worker Capability Proof

Goal B is a completed cross-application compiler-capability proof for one browser-only pattern used by realtime React-shaped applications: a route-owned relative TypeScript module Worker created and cleaned up from an inline `useEffect`.

The realtime dashboard is a stress and conformance fixture. It is not a Kudzu product vertical, dashboard API, stream runtime, widget framework, server platform, or claim of ThingsBoard compatibility. [`MIGRATION_ROADMAP.md`](./MIGRATION_ROADMAP.md) remains the source of truth for future fixture-driven migration work.

## Status

The exact relative TypeScript Worker capability is implemented and verified. Kudzu recognizes one statically analyzable constructor form, emits its validated module graph separately, rewrites the URL for the configured base, ties creation and termination to effect ownership, and adds no Worker bytes to routes that do not use it.

Further Worker, transport, effect, or React compatibility work must begin with a reduced conventional React migration fixture that fails.

## Capability Target

The focused proof uses one Worker-enabled route, one plain companion route, and one unrelated static route:

```text
plain route <-> Worker-enabled route
```

The stress fixture generates a logical 1,000 samples per second, keeps bounded history in a module Worker, downsamples it, and updates one imperative chart. Telemetry and chart details validate Worker isolation, throughput, and ownership; they are not Kudzu product features or advice to rewrite ordinary declarative UI imperatively.

## Supported Form

The Worker must be constructed directly inside a compiled inline effect:

```tsx
useEffect(() => {
  const worker = new Worker(
    new URL("../telemetry.worker.ts", import.meta.url),
    { type: "module" },
  )

  const onMessage = (event: MessageEvent<Frame>) => resource.render(event.data)
  worker.addEventListener("message", onMessage)

  return () => {
    worker.removeEventListener("message", onMessage)
    worker.terminate()
    resource.dispose()
  }
}, [])
```

Compiler requirements:

- accept only an unshadowed `Worker` with `new URL(relativeLiteral, import.meta.url)` and literal `{ type: "module" }`;
- resolve one `.worker.ts` entry under project source and bundle its relative TypeScript graph separately from window code;
- emit deterministic content-hashed ESM under `assets/workers` and rewrite the constructor to the base-aware emitted URL;
- reject package imports, JSX, import-equals declarations, dynamic imports, `require()`, paths outside source, malformed options, and unsupported Worker forms with source locations;
- reject ordinary runtime imports or re-exports of `.worker.ts`; type-only imports may erase normally;
- never mark Worker files as document capability scripts or import them into the window;
- create the Worker only when its owning effect mounts;
- preserve zero-cost exclusion for builds without relative TypeScript Workers;
- reject generated/public asset collisions.

Worker construction in imported helpers or imported keyed-row effects, `SharedWorker`, classic workers, Blob workers, arbitrary dynamic URLs, and package runtime graphs remain outside this completed capability.

## Ownership

| Owner | Lifetime | Capability responsibility |
|---|---|---|
| Document | Full document | global diagnostics and document-exit cleanup |
| Layout | Enhanced navigation session | explicitly shared browser resource |
| Route | Current route range | Worker, subscription, request cancellation |
| DOM range | Connected conditional/keyed range | imperative resource and animation work |
| Worker | Explicit owner cleanup | parsing, bounded buffering, aggregation |

On an enhanced same-document transition, route cleanup removes listeners, stops imperative work, terminates its Worker, and invalidates stale UI writes before the next route mounts. Non-persisted document exit performs cleanup; a BFCache-persisted document retains live ownership for restoration.

## Fixture Contract

The capability fixture proves:

- one complete Worker-enabled document and one complete plain document in an opt-in navigation group;
- one unrelated static route with zero JavaScript;
- a relative TypeScript Worker importing at least one relative helper;
- bounded deterministic buffering and batched sample generation;
- bounded frames delivered no faster than display cadence;
- one imperative resource updated without sample-level Kudzu setters;
- direct load, enhanced navigation, back/forward, and repeated cached revisits;
- exact starts, terminations, messages, renders, listeners, disposal, and stale-write counters;
- native document fallback when JavaScript or Worker creation fails.

## Acceptance And Performance Gates

- The Worker graph is absent from static and plain route HTML and fetched only after its effect mounts.
- Two unchanged builds emit identical Worker names and bytes; source changes alter the content hash.
- Base-prefixed output constructs a valid same-origin Worker URL.
- Repeated route cycles create and terminate exactly one route Worker each with no growing ownership.
- Messages after cleanup cannot update removed route DOM.
- Worker memory remains bounded by declared capacity.
- High-frequency ingestion does not create one main-thread task or Kudzu state commit per sample.
- Imperative rendering is batched to its declared cadence.
- Builds without this capability remain unaffected.
- Raw/gzip output, build time, throughput, cadence, and lifecycle counters are recorded.
- `npm run check`, `npm test`, package dry-run, and applicable browser checks pass.

## Historical Validation Record

The focused fixture emitted a 907 B raw / 477 B gzip Worker graph and an 11,388 B raw / 5,148 B gzip window graph. Seven clean minified builds measured a 463.5 ms median. Thirty route cycles produced exactly 30 starts and terminations, balanced message/error listener registration, bounded 128-sample history, no retained chart ownership, no stale post-cleanup render, deterministic unchanged builds, and a changed hash after a controlled Worker source edit.

These numbers are dated conformance evidence. They do not define a dashboard product target.

## Non-Goals

- Device, alarm, tenant, transport, chart, map, or widget product features.
- A general stream, observable, scheduler, state, or plugin runtime.
- Storing high-frequency samples in Kudzu component state.
- Retaining a browser component tree.
- Request-time SSR, server actions, or a hidden server.
- Arbitrary third-party React widgets.
- Treating Worker isolation as a security sandbox.
