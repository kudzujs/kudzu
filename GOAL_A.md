# Goal A: Static Business Applications

Goal A makes Kudzu sufficient for a conventional business application, starting with a complete commerce journey and leaving a clean path to realtime dashboards. It must preserve Kudzu's static HTML, zero-JavaScript static routes, direct DOM updates, and lack of a browser component tree.

This is the implementation contract. `MIGRATION_ROADMAP.md` remains the source of truth for compiler invariants and the fixture-first workflow.

The benchmark runner, framework fixtures, generated artifacts, and raw arrays are retained as local validation material and are intentionally excluded from the repository and npm package. Published numbers below are a dated product record rather than a reproducible public benchmark bundle. The matched versions were Kudzu 0.5.10, React 19.2.8 with Vite, Next.js 16.2.11, Nuxt 4.5.0 with Vue 3.5.40, and SvelteKit 2.70.1 with Svelte 5.56.7.

## Implementation Status

**Goal A is complete for one explicitly configured emitted-route group with one shared layout.** Complete standalone documents, exact and runtime-parameter navigation, native fallback, persistent layout state/effects, disposable route state/effects, optimistic workflows, desktop/mobile performance gates, and the dashboard expansion seam are covered. Multiple independent shared-layout groups and conditional/keyed DOM-owned effects within layout and route lifetimes were added post-Goal-A.

- **Phase 1 complete**: a local six-route commerce fixture, locked React/Next/Nuxt/SvelteKit comparisons, and a reproducible artifact/build/Chrome runner validate the implementation.
- **Phase 2 complete**: effects inside conditional ranges and supported keyed row components mount with their DOM owner, unsubscribe and clean up on removal, and remount without affecting effect-free output.
- **Phase 3 complete**: page-exported layouts render complete documents with compiler-owned route boundaries, collision-free layout/route IDs, and state/effect ownership metadata. Effects remain document effects and client navigation is unchanged.
- **Phase 4 route/layout effects implemented**: layout effects mount once per document session, route effects remount after awaited route cleanup, and primitive dependency subscriptions exist only while their lifetime is mounted. Conditional/keyed effects use per-lifetime owner registries; route registries are fresh on cached revisits. Direct primitive keyed-item properties rerun only changed rows; reorder does not rerun and key changes remount. Disposed effect setters and queued commits are inactive.
- **Phase 4 document prefetch implemented**: visible, near-visible, hovered, or focused eligible group anchors prefetch and validate complete documents without importing target capabilities. The finite in-memory full-URL cache removes the measured product-cart HTML RTT while preserving retry and native fallback.
- **Phase 5 complete**: matched async cart success/rejection flows prove immediate optimistic updates, duplicate prevention, accessible errors, rollback, route-local reset, and stale-write suppression without new framework APIs.
- **Phase 6 expansion probe complete**: one layout-owned mock `EventTarget` stream and one route-owned imperative chart stub use existing effects and a relative TypeScript helper across repeated navigation, with exact listener and disposal assertions. This proves only the compatibility seam; Kudzu does not provide telemetry or chart support.
- **Desktop and mobile gates complete**: both profiles use seven rotating fresh Chrome runs per target and record zero cold/warm CLS.

The capability-local prefetch/cache increased the commerce navigation asset from 1,887 B to 2,306 B gzip (+419 B). Routes outside the configured group remain unchanged.

In the focused effect-enabled navigation fixture, mount support adds 171 B gzip to the same-route navigation asset and 37 B gzip to the shared runtime. The active-context guard adds 18 B gzip to `kudzu-effect.js` (257 B total); cache-safe route entries are 1,059-1,116 B gzip. The effect-free commerce specialization remains byte-for-byte unchanged.

The post-Goal-A runtime-pattern matcher increases the exact-only commerce navigation asset from 2,306 B to 2,461 B gzip. The mixed exact/runtime navigation fixture emits a 3,105 B gzip navigation asset and a 703 B gzip cache-safe parameter initializer.

The post-Goal-A multiple-group fixture emits a 7,448 B raw / 3,099 B gzip (`gzip -9`) mixed runtime/effect group asset, including one native exclusion for an overlapping ungrouped exact route, and a separately specialized 5,681 B raw / 2,448 B gzip exact effect-free group asset. These measurements do not revise the historical Goal A benchmark.

In a matched one-effect navigation build with the same conditional capability, moving the effect from the route body into the conditional owner changes the route effect entry from 2,181 B raw / 1,036 B gzip to 4,135 B raw / 1,807 B gzip (`+1,954 B` raw / `+771 B` gzip). Owner-hook unsubscription changes the shared runtime from 1,347 B raw / 718 B gzip to 1,459 B raw / 732 B gzip (`+112 B` raw / `+14 B` gzip). Top-level-only and effect-free navigation builds retain their smaller generators.

In matched state-only and item-property keyed-row builds, targeted notification adds 821 B raw / 255 B gzip across the route effect entry, shared runtime, and list runtime. Builds without item-property dependencies retain their previous generated path.

In the latest matched 1,000-row keyed-effect runtime microbenchmark, Kudzu measured 3.6 ms selected-row cleanup/update/setup, 2.4 ms unrelated-field update, and 8.8 ms reorder after all rows and effects were ready. React CSR measured 9.8, 5.9, and 16.8 ms; Vue measured 5.8, 2.4, and 10.5 ms; and Svelte measured 5.7, 4.1, and 58.1 ms. Targeted changed-root notification avoids an extra O(n) effect-record scan; list reconciliation remains O(n). Kudzu emits initial rows while these framework fixtures are CSR, so their JavaScript, output, and build observations are not architecture-equivalent claims.

A 0.6.4 release-tree desktop rerun of the matched six-route commerce fixture measured Kudzu at 486.8 ms build, 35,355 deploy bytes, 7,334 B gzip product JavaScript, 332/156 ms cold/warm LCP, 122.6 ms startup task, 4.8 ms interaction, and 5.6 ms product-cart navigation. React measured 545.4 ms build, 61,464 B gzip product JavaScript, 332/264 ms LCP, 179.9 ms startup task, 10.2 ms interaction, and 9.9 ms navigation. Kudzu built 10.7% faster and its top-level-only fixture retained byte-identical deploy, product-graph, and navigation-asset sizes after navigation-owned effects were added. Raw arrays and the consolidated report are retained under the local demo benchmark workspace.

The Phase 6 chart probe's complete initial module graph is 11,902 B raw / 5,331 B gzip. It adds no framework API or package and does not change the commerce benchmark fixture.

The app-mode Kudzu fixture emits 34,879 deploy bytes. Its product route loads 15,800 raw / 7,215 gzip bytes of initial JavaScript, including the 2,306 B gzip navigation capability. Routes outside a configured application group retain the static zero-JavaScript and byte-for-byte gates.

The latest matched run used seven rotating production builds and seven rotating fresh Chrome profiles per target at 4x CPU slowdown, 100 ms latency, and 200 KiB/s download. Raw local results retain the full arrays, artifact groups, environment, and limitations.

| Target | Product JS gzip | Cold transfer | Cold LCP | Warm LCP | Cold task | Cold heap | Interaction | Product-cart |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Kudzu | 7,215 B | 34,809 B | 324 ms | 140 ms | 103.3 ms | 648,844 B | 3.7 ms | 5.7 ms |
| React + Vite | 61,464 B | 202,842 B | 324 ms | 232 ms | 160.0 ms | 1,062,520 B | 10.5 ms | 8.3 ms |
| Next.js | 190,090 B | 546,581 B | 316 ms | 156 ms | 357.7 ms | 2,157,020 B | 11.4 ms | 26.9 ms |
| Nuxt | 67,620 B | 195,953 B | 320 ms | 204 ms | 205.1 ms | 1,721,348 B | 3.9 ms | 33.0 ms |
| SvelteKit | 32,473 B | 90,929 B | 340 ms | 172 ms | 125.8 ms | 999,496 B | 4.7 ms | 20.3 ms |

The navigation capability initially measured 128.7 ms because it paid one HTML round trip. Validated near-viewport document prefetch reduced the final seven-run median to 5.7 ms while Kudzu still transferred 62% less than SvelteKit and 83% less than React on the cold product load. A progressive-HTML grid shift found by the benchmark was fixed in the matched CSS; 30 focused Kudzu profiles and the final desktop/mobile cross-framework runs then recorded zero cold and warm CLS.

The original final table measured 460.8 ms for Kudzu and 429.5 ms for React, and a focused follow-up confirmed a 6-7% loss primarily from TypeScript ESM/compiler startup. A post-gate startup fix now enables Node's native module compile cache before lazily loading the compiler. The first empty-cache build measured 541.4 ms against the previous 547.6 ms path; after one warm-up, 31 interleaved artifact-clean builds measured Kudzu at 425.8 ms and React at 483.4 ms, making Kudzu 11.9% faster in that run. Cache-disabled and cached builds emit byte-for-byte identical output.

The mobile profile uses a 390x844 viewport, 6x CPU slowdown, 150 ms latency, and 150 KiB/s download. Kudzu measured 420 ms cold LCP, 220 ms warm LCP, 5.6 ms interaction, 8.7 ms product-cart navigation, 4.1 ms optimistic rejection, and 158 ms rollback/error.

## Product Target

A user can build and deploy this flow without React, a VDOM, hydration, or a request server:

```text
home -> category -> product -> cart -> checkout -> account
```

The reference fixture must cover:

- complete indexable HTML for public pages;
- direct entry, reload, back, forward, query strings, and base paths;
- product filters stored in the URL;
- product variants and quantity as route state;
- cart and session information shared by an application layout;
- async loading, empty, error, retry, and cancellation behavior;
- optimistic cart updates with rollback after a rejected request;
- accessible focus, title, scroll, and announcement behavior after navigation;
- ordinary document navigation when JavaScript is absent, late, or fails.

The fixture is a generic executable requirement, not a reusable commerce package. Kudzu should add only compiler features that the reduced fixture proves necessary.

## Runtime Model

Kudzu continues to emit a complete document for every route. Native `<a>` navigation remains the default. An explicitly configured application route group may enhance eligible same-origin links after the initial document has loaded.

```text
Static document
  -> optional persistent layout
  -> replaceable route range
  -> capability-specific route ESM
```

The implementation must use the smallest measured mechanism. A separate fragment format, prefetcher, cache, or router API is not required unless the fixture and browser measurements show that parsing the existing document output is insufficient.

Navigation enhancement must not become a general SPA runtime:

- no VDOM, hydration, retained component tree, or component rerenderer;
- no global router on routes outside an opted-in application group;
- no interception of external, download, modified-click, reload, or explicitly native links;
- no client-only route as the sole representation of indexable content;
- no duplicated source component execution in the browser.

## Ownership And Cleanup

Goal A needs explicit ownership, not a new state library:

| Owner | Lifetime | Examples |
|---|---|---|
| Document | Full document | global listeners and document exit cleanup |
| Layout | Enhanced navigation session | user summary, cart count, persistent connection |
| Route | Current route range | filters, selected variant, request, subscription |
| DOM range | Conditional or keyed item | listener, effect, imperative child resource |

Removing an owner must dispose its effects, listeners, pending work, and descendant registrations exactly once. A failed or superseded navigation must not commit stale route state. Full document navigation remains the recovery path.

High-frequency data is deliberately not a Goal A state feature. A later dashboard can keep WebSocket parsing, telemetry buffers, charts, maps, and editors in Workers or imperative browser modules while Kudzu owns their route or layout lifecycle.

## Delivery Order

Each phase starts with one failing fixture and ends with correctness, browser, size, and build measurements.

1. **Benchmark harness**: freeze the commerce journey, network profiles, framework versions, generated artifacts, and measurement scripts before optimizing Kudzu.
2. **Owned effects**: complete cleanup for conditional ranges and keyed items using the existing mount and unmount hooks. **Complete.**
3. **Layout and route scopes**: retain only declared layout state and dispose route-owned behavior on every completed transition. **Compiler ownership complete; transition behavior belongs to Phase 4.**
4. **Opt-in navigation**: support eligible links, history, aborts, stale responses, focus, scroll, metadata, and native fallback. **Complete for emitted exact/runtime-parameter routes and layout/route effects, including conditional/keyed DOM ownership.**
5. **Business workflows**: close only fixture-proven gaps in forms, async requests, optimistic updates, and diagnostics. **Complete for the matched cart success/rejection flow.**
6. **Expansion probe**: prove that one persistent mock stream and one imperative chart stub can mount, update, navigate, and dispose without adding a component runtime. **Compatibility probe complete; real telemetry and chart engines remain outside Goal A.**

Do not begin a later phase while the current phase has an unexplained correctness or performance regression.

## Performance Comparison

The matched comparison set is:

- Kudzu from the previous completed phase;
- React with an equivalent production static deployment;
- Next.js static export;
- Vue/Nuxt static generation;
- Svelte/SvelteKit static generation;
- hand-written HTML and DOM JavaScript where it provides a useful lower bound.

Every implementation must render the same initial content and provide the same tested behavior. Results that omit initial HTML, navigation semantics, error handling, or accessibility are reported separately and cannot be presented as direct wins.

Use identical content, CSS, local images, API payloads, cache state, browser version, CPU profile, and network profile. Record at least:

- deploy artifact bytes and initial raw/gzip JavaScript;
- HTML, CSS, image, and route payload transfer bytes;
- clean build median;
- cold and warm LCP, CLS, and INP;
- hydration or startup main-thread work;
- cold and warm route transition time;
- cart update and rollback latency;
- browser heap after initial load and repeated navigation;
- duplicate listeners, unfinished requests, and lifecycle leaks.

Production builds receive one warm-up and at least seven interleaved runs. Keep raw results and record the median; use additional runs when ranges overlap or a result controls an architectural decision.

## Performance Gates

Goal A is not complete unless:

- static routes still emit zero JavaScript;
- routes outside an application group remain byte-for-byte unaffected by navigation support;
- an application route ships only the layout and route capabilities it uses;
- no hydration task or browser component tree is introduced;
- repeated navigation leaves no growing listener, request, state, DOM, or heap ownership;
- Kudzu has no unexplained material regression against its previous phase;
- material losses against the fastest matched framework are profiled and either fixed or documented as an explicit product tradeoff;
- performance claims include fixture limitations and do not compare unequal initial content as equivalent.

For browser timings, treat a repeatable median change above 5% as material. Deterministic byte growth is reviewed regardless of percentage. Measurement noise is not a reason to optimize: repeat the interleaved run first.

When a gate fails, stop feature work, reduce the cause, fix the shared path, rerun `npm run check`, `npm test`, and the affected benchmark, then continue. Do not hide regressions with prefetching, omitted content, or a weaker competitor fixture.

## Completion Definition

Goal A is complete when the commerce fixture passes direct-load and enhanced-navigation browser tests, every lifecycle owner cleans up correctly, static fallback behavior remains intact, and the benchmark gates above pass on both desktop and mobile profiles.

The final validation record must retain the generated artifacts, framework versions, commands, raw measurements, medians, known losses, and deliberate limits.

## Non-Goals

- A default SPA router.
- Arbitrary React application or package compatibility.
- Runtime component registration or client component rendering.
- Request-time SSR, server actions, or a hidden server.
- A charting, mapping, telemetry, virtual-grid, or visual-editor engine.
- A custom widget marketplace or plugin security model.
- Winning every synthetic metric at the cost of correctness, accessibility, or deploy output.
