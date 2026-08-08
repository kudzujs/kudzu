# Goal C: State And Resource Research

## Status

Research only. There is no approved public store API, resource API, cache API, query API, scheduler, or runtime proposal.

## Existing Model

Kudzu already has compiler-owned state slots and explicit ownership:

| Owner | Lifetime | Existing examples |
|---|---|---|
| Document | Full non-persisted document | global disposal and document listeners |
| Layout | One enhanced-navigation group session | explicitly shared state/effects |
| Route | Current complete-document route range | parameters, requests, route effects/state |
| DOM range/key path | Conditional or keyed ownership | row state/effects/refs and nested resources |

`framework/core.mjs` allocates ownership IDs and serializable plans at build time. Browser runtimes hold only logical state and direct DOM/lifecycle registrations needed by emitted capabilities. Effects own browser resources and cleanup; stale invocations are invalidated before replacement.

## Research Questions

- Which real migration cannot be expressed with build-time data, ordinary state, layout ownership, route ownership, or one effect-owned browser resource?
- Is the missing behavior compile-time specialization, lifetime declaration, deduplication, persistence, or request coordination?
- Can a reduced conventional React fixture retain familiar source without shipping a public resource abstraction?
- What exact cancellation, stale-result, error, retry, disposal, navigation, and BFCache semantics are required?
- Can the capability be absent from unrelated routes and avoid a shared cache/scheduler?

## Required Evidence

Before any proposal, provide:

- a real application or reduced conventional React fixture that fails today;
- the smallest unsupported source shape and current diagnostic;
- data timing and required owner lifetime;
- behavior for success, empty, failure, retry, replacement, unmount, navigation, and late completion;
- output and ownership costs;
- an explanation of why existing async build rendering, state/effects, layout ownership, native platform storage, or effect-owned resources are insufficient.

## Decision Boundary

Research may produce notes, fixtures, measurements, or a narrow compiler-specialization proposal. It must not publish `createStore`, `resource`, `query`, cache, Provider, subscription, or scheduler APIs. A public API requires separate approval after at least two independent migration fixtures establish the same semantics and after zero-cost exclusion is demonstrated.

## Continuation Checklist

- [ ] Keep Goal C out of Goal A implementation patches.
- [ ] Start with a failing migration fixture, not API design.
- [ ] Classify build-known, browser-only, layout-owned, route-owned, and DOM-owned data.
- [ ] Test existing compiler capabilities before proposing a new one.
- [ ] Record unresolved semantics instead of filling them with a generic runtime.
- [ ] Stop at research unless a separate implementation decision is approved.
