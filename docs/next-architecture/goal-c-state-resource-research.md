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

## First Application Survey

The first GitHub survey used active licensed React/TypeScript applications rather than library demos. It found four distinct pressure families:

| Application evidence | Ownership pressure | Research disposition |
|---|---|---|
| [E2B Dashboard terminal](https://github.com/e2b-dev/dashboard/blob/97164c9cbc8ced05b9039415318550f4e4df3874/src/features/dashboard/terminal/dashboard-terminal.tsx) | Mutable remote handle and generation tokens survive callbacks; BFCache entry retains the handle, real discard closes it, and restore resumes it | First reduced fixture because it is the smallest precise lifetime |
| [Mattermost WebSocket client](https://github.com/mattermost/mattermost/blob/53373e3752c6e8d7979b787f342fea4c56e68472/webapp/platform/client/src/websocket.ts) and [Twenty SSE provider](https://github.com/twentyhq/twenty/blob/cd288d84470503ba897c0823a9d98701fa9986ab/packages/twenty-front/src/modules/sse-db-event/components/SSEProvider.tsx) | One document/layout transport has many independently mounted route subscribers plus reconnect and replay state | Strong cross-owner subscription research; too broad for the first fixture |
| [Actual Budget queries](https://github.com/actualbudget/actual/blob/87e33e49eb4d666c33e0c0f172faf340d1b7aa0a/packages/desktop-client/src/payees/queries.ts) and [Plane workspace wrapper](https://github.com/makeplane/plane/blob/31853ab2b8b7810c59dc30d22e52c8f4b5a71a47/apps/web/core/layouts/auth-layout/workspace-wrapper.tsx) | Shared keyed request results outlive route consumers and are invalidated by external events or owner changes | Candidate for keyed layout/document ownership, not authorization for a query API |
| [InstantDB optimistic update](https://github.com/instantdb/instant/blob/30561b01ea850514dd4e0270bdd6ff3ed159bbb1/client/www/lib/auth.ts) and [Raven reaction update](https://github.com/The-Commit-Company/raven/blob/a29a274466b7a060754839b3c8e29bbee012a61d/packages/lib/hooks/useReactToMessage.ts) | Multiple consumers observe one optimistic snapshot that must commit or roll back atomically | Two independent examples of shared optimistic transactions; still research only |

### E2B Reduced Fixture

The repository-owned fixture at `test/fixtures/goal-c-e2b-terminal` preserves the relevant conventional React shape without E2B's UI, SDK, or `useEffectEvent` dependency:

- one `null`-initialized remote handle ref;
- one numeric generation ref invalidating late asynchronous opens;
- `pagehide.persisted` retaining the handle for BFCache;
- non-persisted `pagehide` and effect cleanup closing it;
- `pageshow.persisted` resuming the retained handle;
- one unrelated static sibling route.

The build fails before BFCache behavior can be evaluated:

```text
src/pages/index.tsx:7:25 Mutable value useRef() is unsupported except for an effect-owned useRef(0) animation-frame handle; otherwise keep resource-private mutable values inside the owning effect
```

The failure is triggered by the ordinary `useRef(0)` generation token during source analysis. Existing animation-frame specialization cannot safely cover this shape: the generation token has different writes and callback ownership, while the remote handle is a browser-only non-serializable value rather than a DOM ref. Supporting only the token would expose incorrect DOM-ref semantics for the handle.

The remaining question before any state/resource API discussion is whether independent fixtures justify a narrow specialization for callback-shared effect resources with document and BFCache ownership. Until then, the source-located diagnostic preserves the current boundary.

An effect-local rewrite is a useful control, but requiring applications to restructure ordinary callback-shared refs is not automatically an acceptable migration solution. The fixture remains an expected failure until research answers that boundary.

## Decision Boundary

Research may produce notes, fixtures, measurements, or a narrow compiler-specialization proposal. It must not publish `createStore`, `resource`, `query`, cache, Provider, subscription, or scheduler APIs. A public API requires separate approval after at least two independent migration fixtures establish the same semantics and after zero-cost exclusion is demonstrated.

## Continuation Checklist

- [ ] Keep Goal C out of Goal A implementation patches.
- [ ] Start with a failing migration fixture, not API design.
- [ ] Classify build-known, browser-only, layout-owned, route-owned, and DOM-owned data.
- [ ] Test existing compiler capabilities before proposing a new one.
- [ ] Record unresolved semantics instead of filling them with a generic runtime.
- [ ] Stop at research unless a separate implementation decision is approved.
