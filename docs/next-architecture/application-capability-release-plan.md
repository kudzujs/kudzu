# Application Capability Release Plan

This is the authoritative execution plan from `0.10.0` through `1.0.0`. It
replaces the provisional `0.10` normalize, `0.11` diagnostics, and `0.12`
adapter ordering recorded in the completed 0.9 packet. Those tools remain in
scope, but application capability evidence now determines their order.

The plan assigns one application-capability section to each minor release and
one independently releasable evidence packet to each patch release. Planned
versions are not completed releases. `package.json`, release notes, tags, and
registry metadata change only after the matching packet passes every gate.

## Product Outcome

Kudzu must support complete modern application journeys with no React runtime,
VDOM, hydration, retained browser component tree, generic component renderer,
or hook dispatcher. Static routes may still emit zero JavaScript. Interactive
routes may emit every route- or feature-specific capability required for
correct behavior.

The target is zero unused runtime, not zero runtime.

## Version Map

| Minor | Capability section | Required outcome |
|---|---|---|
| `0.10.x` | Local and shared state | The greenfield application shell and state ownership baseline are executable. |
| `0.11.x` | Async and server data | Loading, errors, stale work, mutation, and evidence-backed shared coordination are complete. |
| `0.12.x` | Routing and application lifetime | Authenticated route, layout, history, focus, and failure journeys are complete. |
| `0.13.x` | Forms | Production-shaped validation, drafts, conditional fields, autosave, and upload boundaries are complete. |
| `0.14.x` | Lists, tables, and virtualization | Large keyed data behavior and a measured bounded-DOM decision are complete. |
| `0.15.x` | Overlay and layer ownership | Accessible dialog, popover/menu, toast, and any proven layer ownership are complete. |
| `0.16.x` | External complex UI | Real editor, chart/map, or grid packages use bounded mount/update/dispose ownership. |
| `0.17.x` | Long-lived applications | Realtime, repeated navigation, cleanup, and long-running memory gates pass. |
| `0.18.x` | Lazy loading and code splitting | Large feature dependencies load only when their owner requires them. |
| `0.19.x` | React ecosystem migration | Apache Answer and Memos pass connected browser journeys through the compatibility boundary. |
| `0.20.x` | AI tooling and delivery cost | Structured tools and a fair tracked AI benchmark reduce cost per successful task. |
| `0.21.x` | Production-scale proof | Functional parity, build scale, browser performance, memory, and release evidence pass together. |
| `1.0.0` | Stable application model | Semantic IR v1 is stable and the maintained AI delivery gate passes. |

## Execution Rules

1. Work on exactly one patch packet at a time. Start the next packet only after
   the previous packet is released or this document explicitly replans it.
2. Begin behavior work with a real failing greenfield or React-derived fixture.
3. Reduce the failure through native platform behavior, existing Kudzu
   semantics, normalization, or an internal adapter, in that order.
4. Two unrelated real fixtures register a repeated application limitation.
   Three unrelated real fixtures are required before architecture review may
   authorize a new semantic primitive.
5. A patch may complete without a new primitive, compiler pass, public API, or
   runtime when existing composition satisfies its acceptance contract.
6. Package-specific knowledge ends in compatibility analysis, normalization,
   or an internal adapter. It must not enter generic IR, codegen, or runtime.
7. Every static sibling remains JavaScript-free. Every interactive route emits
   only the capabilities selected by its validated route record.
8. Every patch records semantic primitives, core compiler/pass LOC, runtime
   concepts, browser bytes, fixtures, output hashes, and benchmark deltas.
9. Do not publish a planned version merely because its source compiles. The
   exact release commit must pass behavior, accessibility, browser, output,
   package, and applicable performance gates.
10. Never silently combine patch packets. Revise this plan first when an
    inseparable producer/consumer boundary is proven.

## Shared Testbeds

### Greenfield Project Application

The maintained greenfield testbed is a project-management SaaS with this route
shape:

```text
/login
/app/projects
/app/projects/:projectId
/app/issues
/app/issues/:issueId
/app/settings
/help
```

It grows one accepted user journey at a time. `/help` is the static zero-JS
control. The application uses a deterministic local HTTP server until a packet
explicitly requires a different transport.

### Apache Answer

The connected acceptance target is:

```text
login
-> question list
-> search/filter/pagination
-> detail
-> create/edit
-> server validation/error
-> mutation and list refresh
-> logout
```

### Memos

The connected acceptance target is:

```text
login
-> feed
-> pagination
-> create memo
-> reaction
-> realtime refresh
-> logout
```

Actual Budget remains deferred until a complete pinned workspace and executable
dependency graph are available.

## `0.10.x`: Local And Shared State

### `0.10.0`: Application Contract And State Baseline

- **Purpose:** create the durable greenfield testbed and capability inventory.
- **Current limitation:** state, forms, lists, and navigation are proven mostly
  in isolated fixtures rather than one maintained application.
- **Expected files:** a dedicated project-application fixture, browser
  acceptance entry, package script, and capability manifest; no production
  compiler or runtime file should change.
- **Acceptance:** `/app/projects` renders deterministic project state, one
  interaction updates direct DOM, `/help` emits zero JavaScript, required
  Chrome runs in CI, and route/artifact baselines are recorded.
- **AI effect:** one application and one manifest replace repeated repository
  exploration when selecting later capability work.
- **Stop condition:** the fixture becomes a syntax showcase instead of a user
  journey, or requires a new primitive before the baseline exists.
- **Done condition:** every later packet can add behavior to the same testbed
  and reuse its framework-neutral acceptance harness.

**Completion evidence:** the tracked project application emits `/login`,
`/app/projects`, and `/help`. The project route reuses one existing primitive
SignalIR state and one command handler; it adds no production compiler LOC,
pass, semantic primitive, Handler ESM, or runtime concept. Its existing command
runtime graph is 768 raw / 441 aggregate gzip bytes, while `/help` emits 0 B
JavaScript. The complete fixture emits 4 files, 1,970 raw / 1,265 aggregate gzip
bytes, with deploy digest
`94ce7d01cac2e80823a36279294015d2f22328acaed571abb9996f8ca6171121`.
The focused Chrome journey, `npm run check`, 273 non-browser tests, 273
required-Chrome tests, and package smoke pass. No production performance claim
is made because compiler and runtime sources are unchanged.

### `0.10.1`: Local, Object, Array, And Derived State Scale

- **Purpose:** prove stable dependency and ownership behavior with many ordinary
  states and nested JSON-safe application records.
- **Expected boundary:** existing SignalIR, DerivedIR, bindings, conditions, and
  keyed ownership; no normalized-state runtime.
- **Acceptance:** deterministic updates across project summary, filters, issue
  counts, derived labels, conditional owners, and nested lists; unrelated DOM
  does not change; removal releases owned state.
- **Performance:** record commit latency and runtime metadata for increasing
  state/dependency counts.
- **Stop condition:** proposed support depends on arbitrary object mutation or a
  generic rerender loop.
- **Done condition:** the recorded scale remains within the material regression
  threshold and nearby unsupported dynamic paths fail at authored locations.

**Completion evidence:** the project journey composes five ordinary route
states: one object, two arrays, and two primitives. Six existing reactive
bindings, one conditional owner, three keyed lists, one nested issue list, and
one keyed row-local state cover summary replacement, filtering, derived issue
counts, saved-filter append, conditional release/remount, keyed identity, and
row-state release/reset. An unrelated control records zero DOM mutations. The
route adds no semantic primitive, pass, browser runtime concept, normalized
state, or generic rerender path; the only supported source adjustment is the
application's use of a separate project array state at the existing keyed-list
boundary. Direct object-field nested-list replacement remains outside this
packet after its isolated experiment failed browser replacement, while the
existing dynamic object-property diagnostic remains source-located.

The application deploy contains 12 files, 47,546 raw / 16,285 aggregate gzip
bytes, with SHA-256
`d50c9ff6dccba338559dd9e9141c4607ec62da30385658e617a86f7af3f52e0f`.
`/app/projects` uses 39,178 raw / 14,143 aggregate gzip JavaScript bytes;
`/help` remains 0 B. The generated 1/8/32-state scale benchmark emits identical
deploy output under `v0.10.0` and the candidate. Seven fresh Chrome processes
record commit medians of 0.5/0.6/0.9 ms as the derived binding dependency edges
increase from 0 to 8 to 32. Runtime JavaScript is 768/10,935/11,341 raw bytes
and 441/4,789/4,841 aggregate gzip bytes. No material regression is present.
Release commit `f04041b`, tag `v0.10.1`, both CI jobs, the GitHub release,
`@kudzujs/core@0.10.1`, `create-kudzu@0.1.105`, registry metadata, and a fresh
scaffold install/check are verified.

### `0.10.2`: Shared Layout And Cross-Route State

- **Purpose:** keep workspace/session state across an explicit application
  navigation group while resetting route-owned state.
- **Expected boundary:** existing SharedStateIR, layout state IDs, route release,
  and native fallback.
- **Acceptance:** workspace selection survives project/list/detail transitions;
  route drafts reset; reload behavior is explicit; a separate route group does
  not receive the shared state.
- **Stop condition:** implementation requires a document-global store or SPA
  router.
- **Done condition:** state lifetime and disposal are exact in browser tests and
  static routes receive no shared-state runtime.

**Completion evidence:** the greenfield application adds one exact Alpha detail
route and one explicit navigation group around list/detail routes. A relative
Context hook lowers through the existing `SharedStateIR`: both routes own the
same `workspace` layout state while list state and the detail `draft` remain
route-owned. Required Chrome proves retained layout DOM identity, workspace
persistence in both directions, detail DOM release, fresh draft state on
re-entry, and initial layout/draft values in a fresh document. `/help` remains
outside the group, retains its native anchor path, and emits complete HTML with
0 B JavaScript.

This packet adds no semantic primitive, ModuleIR kind, compiler pass, production
compiler LOC, runtime concept, normalization rule, adapter rule, store, or SPA
router. It adds one application layout/context module, one route, one config,
and one positive browser journey; existing navigation-group diagnostics retain
the nearby rejected configuration boundary. The fixture emits 14 files, 57,293
raw / 19,985 aggregate gzip bytes, with deploy SHA-256
`1c867ee7119f7eb23b935c4506c2a46639acb75c13f0916b29c255421b0d123d`.
The list/detail session uses 10 unique JavaScript files totaling 46,418 raw /
17,045 aggregate gzip bytes. Seven fresh Chrome profiles record list-to-detail
completion at `[2.3, 6.5, 1.4, 1.3, 5.1, 1.3, 4.0]` ms, median 2.3 ms.

Release commit `76a45c4`, tag `v0.10.2`, both CI jobs, the GitHub release,
`@kudzujs/core@0.10.2`, `create-kudzu@0.1.106`, registry metadata, and a fresh
registry-backed scaffold install/check passed on 2026-08-22. Publish workflow
`32566976581` completed every version, package, publication, and registry gate.

### `0.10.3`: Persistence Recipe And State Release

- **Purpose:** prove URL, storage, and server-backed persistence without adding a
  persistence framework.
- **Expected boundary:** application-owned effects and Web Storage.
- **Acceptance:** guarded restore, schema/version failure fallback, write after
  state changes, logout clear, conditional/keyed release, and fresh remount.
- **Stop condition:** a generic persistence API is proposed without another
  independent application requirement.
- **Done condition:** deterministic static fallback and browser recovery pass
  with no storage runtime in unused routes.

**Completion evidence:** the greenfield application layout now owns one guarded
`localStorage` recipe composed entirely from ordinary state and two existing
effects. Static HTML starts with `Primary`; a mount effect accepts only version
1 records whose workspace is `Primary` or `Secondary`, while absent, malformed,
wrong-schema, and wrong-version records fall back safely. A readiness state
prevents the dependency effect from overwriting storage before restore.
Workspace changes write the versioned record, and logout disables persistence,
removes the record, and resets visible state in one synchronous handler.

Required Chrome proves valid restore, every fallback, post-commit persistence,
logout removal, conditional and keyed release/fresh remount, route draft
release/fresh revisit, and a fresh direct document. `/help` remains outside the
navigation group with complete HTML and 0 B JavaScript. The fixture emits 19
files, 65,376 raw / 23,471 aggregate gzip bytes, with deploy SHA-256
`bb58826876bdf090a85d2c1f8a1edcbbc9abd35d5335eb3d1e7fb1fafe6bed72`.
The two-route session uses 15 unique JavaScript files totaling 53,562 raw /
20,323 aggregate gzip bytes.

This packet adds zero semantic primitives, ModuleIR kinds, compiler passes,
production compiler lines, runtime concepts, normalization rules, adapter
rules, public APIs, stores, or persistence runtimes. One existing positive
application fixture gains valid, absent, malformed, wrong-schema, wrong-version,
write, and clear browser cases. A matched 21-profile measurement records the
authored capability cost: the 0.10.2 list/detail median of 1.9 ms and 46,418 raw /
17,045 gzip session JavaScript becomes 1.5 ms and 53,562 / 20,323 bytes. The
timing ranges overlap with no material loss; the 7,144 raw / 3,278 gzip byte
increase is the explicit cost of route-owned effect/native entries, not a
compiler or shared-runtime change.

Release commit `4420ccc`, tag `v0.10.3`, both CI jobs, the GitHub release,
`@kudzujs/core@0.10.3`, `create-kudzu@0.1.107`, registry metadata, and a fresh
registry-backed scaffold install/check passed on 2026-08-22. Publish workflow
`32568752477` completed every version, package, publication, and registry gate.

## `0.11.x`: Async And Server Data

### `0.11.0`: Owned Fetch Lifecycle

- **Purpose:** establish the greenfield loading/error/data/refetch baseline.
- **Expected boundary:** existing EffectIR, ordinary state, and native `fetch`.
- **Acceptance:** delayed stale response loses state authority, HTTP failure is
  accessible, explicit refetch recovers, route removal blocks late writes, and
  authored cancellation is tested where required.
- **Stop condition:** a query cache is added to implement one request.
- **Done condition:** the project list journey passes and `/help` stays zero-JS.

**Completion evidence:** the project list now composes one route-owned native
`fetch` effect with ordinary request, status, error, project, and summary state.
The deterministic server drives initial loading, a fast explicit refetch, an
HTTP 500 alert, and recovery. A delayed prior continuation attempts its writes
after dependency replacement and cannot replace the newer keyed project data.
The effect owns an `AbortController`; dependency replacement and route removal
invoke authored abort cleanup, and late route work cannot mutate the detail
route or recreated list ownership. Existing project filtering, nested keyed
identity, row state, shared layout state, persistence, and logout journeys still
pass. `/help` remains complete HTML with 0 B JavaScript.

This packet adds zero semantic primitives, ModuleIR kinds, compiler passes,
production compiler lines, runtime concepts, normalization rules, adapter
rules, public APIs, caches, Providers, retry schedulers, or query runtimes. One
existing positive application fixture gains loading, success, stale completion,
HTTP failure, recovery, cancellation, and route-release cases. The fixture
still emits 19 files and now totals 67,886 raw / 24,077 aggregate gzip bytes,
with deploy SHA-256
`9c06d2a5d47b4ea2ae54cebbc0448bf161907691ee37a02a5dae0e7c37779ae4`.
The project route uses 52,130 raw / 19,502 aggregate gzip JavaScript bytes; the
two-route session uses 54,770 / 20,763 bytes, an authored capability increase of
1,208 raw / 440 gzip bytes over `0.10.3`. Twenty-one fresh Chrome profiles record
0.8 ms median list-to-detail completion with a 0.6/1.3 ms range. The changed
fetch-completion prerequisite permits no latency improvement claim; no material
regression is present.

Clean-worktree `npm run check`, 273/273 standard tests, the required project
Chrome journey, the focused required-Chrome retry for the one full-suite browser
timeout, and packed-package smoke pass on 2026-08-22.

Release commit `8065d86`, tag `v0.11.0`, both CI jobs, the GitHub release,
`@kudzujs/core@0.11.0`, `create-kudzu@0.1.108`, registry metadata, and a fresh
registry-backed scaffold install/check passed on 2026-08-22. Publish workflow
`32571667242` completed every version, package, publication, and registry gate.

### `0.11.1`: List And Detail Data Consistency Evidence

- **Purpose:** expose the first real multi-consumer coordination limit.
- **Expected boundary:** layout shared state plus existing effects first.
- **Acceptance:** project list and detail observe one mutation, duplicate
  requests are counted, route changes and refresh are deterministic, and all
  current limitations are machine-recorded.
- **Stop condition:** the fixture invents package-shaped query semantics not
  required by the user journey.
- **Done condition:** existing composition is accepted or the smallest repeated
  missing coordination contract is isolated.

**Completion evidence:** one layout-owned project record composes from two
primitive shared signals and one existing mount effect. The list and detail
routes observe the same server-confirmed rename without another read. The
deterministic journey records one initial GET, zero additional GETs across two
enhanced route changes, one mutation POST, and exactly one new GET after full
document reload. The refreshed document reconstructs revision 1 from server
truth while route-owned detail draft state resets. `/help` remains complete HTML
with 0 B JavaScript.

Current composition is accepted. Shared data lasts for one document and retained
layout owner; independently authored fetch owners are not deduplicated, and no
request registry, invalidation graph, subscriber set, or retained query cache
exists. This one fixture does not authorize `0.11.2`: it needs no coordination
primitive after ownership is placed correctly, while the packet requires two
additional independent fixtures to demonstrate the same missing contract.

This packet adds zero semantic primitives, ModuleIR kinds, compiler passes,
production compiler lines, runtime concepts, normalization rules, adapter rules,
public APIs, caches, Providers, or query runtimes. One existing positive fixture
gains list/detail consistency, counted domain requests, mutation, navigation,
and reload cases. It emits 20 files totaling 69,501 raw / 24,649 aggregate gzip
bytes with deploy SHA-256
`bc6335131b7867da2857621211919fad43ebfb9414aac711c45f0c8ed3803022`.
The two-route session uses 16 JavaScript files totaling 55,736 raw / 21,208
aggregate gzip bytes, an authored application increase of 966 raw / 445 gzip
bytes over `0.11.0`. Twenty-one fresh Chrome profiles record a 0.9 ms median
list-to-detail completion with a 0.7/1.2 ms range, overlapping the prior
0.6/1.3 ms range; no latency change is claimed.

Clean-worktree `npm run check`, 273/273 required-Chrome tests, and packed-package
smoke passed on 2026-08-22. Release commit `5bab3fe`, tag `v0.11.1`, feature CI
`32573961250`, the GitHub release, `@kudzujs/core@0.11.1`,
`create-kudzu@0.1.109`, registry metadata, and a fresh registry-backed scaffold
install/check passed. Publish workflow `32574182988` completed every version,
package, publication, and registry gate.

### `0.11.2`: Shared Request Coordination

- **Purpose:** implement only the deduplication, subscriber, and invalidation
  semantics authorized by `0.11.1` and two additional independent fixtures.
- **Expected boundary:** package-neutral application semantics; no TanStack,
  SWR, Provider, retry scheduler, or public query API by default.
- **Acceptance:** one in-flight request per key, exact subscriber ownership,
  invalidation after mutation, route/layout disposal, bounded retention, and
  static exclusion.
- **Stop condition:** three unrelated fixtures do not require the same semantic
  primitive, or ordinary shared state remains sufficient.
- **Done condition:** architecture review records the reused or new primitive,
  runtime bytes, cache bound, and cleanup behavior.

**Completion evidence:** architecture review covers three unrelated executable
fixtures: the project application, TanStack Query-shaped product loading, and
Apache Answer/SWR-shaped question loading. Every fixture has one explicit data
owner, ordinary loading/error/data state, one native fetch effect, dependency or
owner invalidation, exact cleanup, and static exclusion. None has two independent
owners requesting one key, independently releasable subscribers, mutation-key
invalidation, retained results after owner release, or a cache bound.

The stop condition is met and this packet closes with no new primitive. The
project application records `closed-no-new-primitive`, the three reviewed
fixtures, an empty repeated-missing-contract list, and the reused semantics in
its machine-readable capability contract. Existing fixture journeys remain the
executable behavioral evidence. Absence of generic deduplication is not itself
fixture pressure.

This packet adds zero semantic primitives, ModuleIR kinds, compiler passes,
production compiler lines, runtime concepts, normalization rules, adapter rules,
public APIs, request registries, subscriber sets, invalidation graphs, caches, or
browser bytes. One existing machine-readable contract and assertion change;
all three existing positive fixtures remain behaviorally unchanged. The project
application retains its 20-file, 69,501 raw / 24,649 aggregate gzip deploy and
55,736 raw / 21,208 aggregate gzip two-route JavaScript session. Cache bound is
not applicable because no cache exists; cleanup remains existing effect and
route/layout owner release.

Clean-worktree `npm run check`, 273/273 required-Chrome tests, and packed-package
smoke passed on 2026-08-22. Release commit `0ae4d5d`, tag `v0.11.2`, CI
`32575316981`, the GitHub release, `@kudzujs/core@0.11.2`,
`create-kudzu@0.1.110`, registry metadata, and a fresh registry-backed scaffold
install/check passed. Publish workflow `32575541567` completed every version,
package, publication, and registry gate.

### `0.11.3`: Mutation, Optimistic Update, And Rollback

- **Purpose:** complete issue create/edit/delete behavior under failure.
- **Expected boundary:** immediate state setters and existing shared data
  coordination; a transaction primitive is evidence-gated.
- **Acceptance:** optimistic list/detail update, server rejection, exact
  rollback, duplicate-submit prevention, retained row identity, and accessible
  error state.
- **Stop condition:** generic transactions are proposed for a single-owner
  handler.
- **Done condition:** data integrity survives success, failure, navigation, and
  retry.

**Completion evidence:** one layout-owned async rename handler snapshots the
current project name/revision, writes an immediate optimistic value, disables its
button after the synchronous-turn commit, and sends one native POST. The
deterministic server rejects the first attempt. The handler restores the exact
snapshot, exposes `HTTP 500` through an accessible alert, and leaves the retained
keyed row identity unchanged. A retry from detail writes the optimistic value,
clears the alert, commits the confirmed revision, survives list/detail
navigation, and restores from server truth after full document reload. Counts
record two attempts, one accepted mutation, and no mutation-triggered GET.

Existing immediate setters, native async handlers, shared layout signals, and
owner authority are sufficient. This packet adds zero semantic primitives,
ModuleIR kinds, compiler passes, production compiler lines, runtime concepts,
normalization rules, adapter rules, public APIs, transaction primitives, caches,
or schedulers. One positive application fixture gains optimistic success,
failure, rollback, disabled duplicate submission, navigation, retry, and reload
cases. It emits 19 files totaling 73,202 raw / 25,057 aggregate gzip bytes with
deploy SHA-256
`40c68fef4eeba5ea4c1a92e9a8003b74e6a45b7a10671ee2f3e4952010117b26`.
The two-route session uses 15 JavaScript files totaling 56,318 raw / 21,211
aggregate gzip bytes, an authored application increase of 582 raw / 3 gzip bytes
over `0.11.2`. Twenty-one fresh Chrome profiles record a 0.8 ms median with a
0.7/1.0 ms range; no latency change is claimed.

Clean-worktree `npm run check`, 273/273 required-Chrome tests, and packed-package
smoke passed on 2026-08-22. Release commit `ba6f97a`, tag `v0.11.3`, CI
`32576861865`, the GitHub release, `@kudzujs/core@0.11.3`,
`create-kudzu@0.1.111`, registry metadata, and a fresh registry-backed scaffold
install/check passed. Publish workflow `32577090955` completed every version,
package, publication, and registry gate.

### `0.11.4`: Pagination, Refresh, And Polling Policy

- **Purpose:** complete bounded server-data loading before infinite data work.
- **Expected boundary:** URL signals, effects, native timers, and visibility
  events.
- **Acceptance:** page/filter synchronization, back/forward, refresh, optional
  polling cleanup, no duplicate work, and bounded retained results.
- **Stop condition:** background policy becomes a universal scheduler without
  repeated evidence.
- **Done condition:** the exact owner and network behavior are measured and
  documented.

**Completion evidence:** the project list reads page and filter from two
existing React Router query signals and restarts its existing abortable fetch
effect when either changes. Static updater handlers push page 2/all and page
1/active URLs. Two browser back operations restore the prior URL, signal values,
and bounded server results. An explicit refresh increments the same route-owned
request signal. Optional polling owns one native interval and one
`visibilitychange` listener; hidden events perform no work, one visible event
performs one refresh, and disabling polling clears both owners before a later
event. The deterministic journey records 11 total list requests across initial
stale replacement, HTTP recovery, page/filter history, refresh, polling, and
route remount. Every response retains at most two rows.

Existing query signals, primitive state, dependency effects, abort invalidation,
native timers/listeners, and route cleanup are sufficient. This packet adds zero
semantic primitives, ModuleIR kinds, compiler passes, production compiler lines,
runtime concepts, normalization rules, adapter rules, public APIs, caches,
schedulers, or retained result stores. One positive application fixture gains
page/filter URL ownership, history, refresh, visibility-aware polling, exact
cleanup, request counts, and bounded-result cases. It emits 20 files totaling
77,263 raw / 26,156 aggregate gzip bytes with deploy SHA-256
`a3864a5155d658e86378fce80de94e082ef0894c5db5f5793d91b4de7f359b46`.
The two-route session uses 16 JavaScript files totaling 58,970 raw / 22,124
aggregate gzip bytes, an authored application increase of 2,652 raw / 913 gzip
bytes over `0.11.3`. Twenty-one fresh Chrome profiles record a 1.3 ms median
with a 1.2/1.6 ms range. The prior range does not overlap, so the 0.5 ms median
increase is disclosed rather than presented as a no-regression result. `/help`
remains 0 B JavaScript.

## `0.12.x`: Routing And Application Lifetime

### `0.12.0`: Project Route Shell And Runtime Parameters

- **Purpose:** prove directly addressable project and issue routes.
- **Expected boundary:** file routes, runtime parameters, complete HTML, and
  native navigation.
- **Acceptance:** direct entry, reload, invalid parameter rejection, project to
  issue navigation, and standalone fallback.
- **Stop condition:** an SPA route registry is introduced.
- **Done condition:** all target routes are addressable without a browser router.

**Completion evidence:** the maintained project application adds one bracket
project page and one nested bracket issue page, both using the existing aliased
React Router `useParams()` migration path and the existing shared application
layout. Each fallback emits complete document structure plus only pathname
parameter, binding, native-handler, and owned-layout capability ESM. The project
page owns a native parameterized anchor to its first issue. The issue page owns a
native parameterized project return. Neither standalone artifact includes the
enhanced-navigation entry.

The fixture emits the compiler-provided ordered rewrite records through its
existing `afterBuild` host boundary. A deterministic static server checks exact
files first, then applies those records for direct project and issue entry.
Required Chrome proves project entry,
issue entry, and issue reload; the generated parameter module rejects an encoded
slash before mounting. Static HTML and artifact assertions prove the project to
issue anchor remains native, both routes share one signature-keyed standalone
runtime family, and `/help` remains 0 B JavaScript. Deployment still must install
the generated rewrites; Kudzu does not add a server or browser route registry.

Existing file routes, runtime pathname parameters, layout ownership, route
bindings, native anchors, host rewrites, and browser reload are sufficient. This
packet adds zero semantic primitives, ModuleIR kinds, compiler passes,
production compiler lines, runtime concepts, normalization rules, adapter rules,
or public APIs. One positive application fixture gains two route files, direct
entry, reload, invalid-parameter rejection, native project-to-issue linkage, and
host fallback cases. It emits 36 files totaling 105,577 raw / 38,067 aggregate
gzip bytes with deploy SHA-256
`6a6c5985cf2a7e9649b0bbd70506357051dac995a74225b0022c5f1ecedaf2b8`.
The runtime project route uses 17,905 raw / 8,455 gzip JavaScript bytes and the
issue route uses 18,002 raw / 8,474 gzip bytes. The existing two-route enhanced
session remains byte-identical at 58,970 raw / 22,124 gzip bytes. Twenty-one
fresh Chrome profiles record a 1.3 ms median with a 1.1/1.6 ms range; the range
overlaps `0.11.4`, so no latency change is claimed.

### `0.12.1`: Shared Layout, History, Focus, And Scroll

- **Purpose:** complete the accepted same-document application group behavior.
- **Expected boundary:** existing navigation runtime and layout/route lifetime.
- **Acceptance:** back/forward, retained layout state, route cleanup, title/live
  announcement, focus destination, hash behavior, and explicit scroll policy.
- **Stop condition:** browser-native navigation is weakened for routes outside
  the approved group.
- **Done condition:** keyboard and browser-history journeys pass with native
  recovery.

**Completion evidence:** the project application adds route titles, one native
hash anchor, and one intrinsic hash destination. Required Chrome activates the
focused anchor, retains the layout and workspace state through push, back, and
forward navigation, releases and recreates dirty route state, updates the title
and polite live status, focuses hash and heading destinations, applies explicit
hash and top scroll policies, and leaves `/help` browser-native outside the
approved route group.

The journey exposed one existing JavaScript value bug: an absent hash produced
the empty string and prevented the nullish heading/main focus fallback. The
navigation runtime now produces `null` for that case. This packet adds zero
semantic primitives, ModuleIR kinds, compiler passes, core compiler lines,
runtime concepts, normalization rules, adapter rules, or public APIs. Runtime
source remains 351 lines. One positive application fixture gains the complete
acceptance journey; `/help` remains 0 B JavaScript.

The fixture emits 36 files totaling 106,096 raw / 38,201 aggregate gzip bytes
with deploy SHA-256
`4f1ce541af0794fcb17458ad37db7b32beb434f3a83cb7f949f13b3e4536fe1c`.
The two-route session uses 16 JavaScript files totaling 58,974 raw / 22,129
aggregate gzip bytes, 4 raw / 5 gzip bytes above `0.12.0`. Seven fresh Chrome
profiles record a 1.3 ms navigation median with a 1.3/1.5 ms range. The range
overlaps `0.12.0`, so no latency change is claimed. This correctness packet has
no measured AI-delivery cost effect.

### `0.12.2`: Authentication And Permission Boundary

- **Purpose:** complete login, restore, 401, logout, and permission-aware UI.
- **Expected boundary:** shared layout state, owned fetch, storage, and server or
  host authorization.
- **Acceptance:** invalid and valid login, reload restoration, direct protected
  entry, role-aware controls, server rejection, token clear, and logout.
- **Stop condition:** client conditional rendering is presented as a security
  boundary.
- **Done condition:** server authorization and client UX responsibilities are
  executable and explicit.

**Completion evidence:** the project application replaces its placeholder login
route with a native constrained form and one async handler. The shared layout
restores a stored token, validates the current user, exposes authenticated
identity and role state, and clears local state before replacement navigation on
rejection or logout. Required Chrome proves invalid and valid login, reload
restoration, anonymous and rejected direct protected entry, member/admin control
visibility, server 401/403 enforcement, token clearing, and logout. Client
conditions are recorded as presentation only; the deterministic API server
authorizes every protected read and mutation.

Existing native forms, state, layout ownership, effects, storage, fetch, and
native navigation are sufficient. This packet adds zero semantic primitives,
ModuleIR kinds, compiler passes, production compiler/runtime lines, runtime
concepts, normalization rules, adapter rules, public APIs, auth runtimes, or
servers. The fixture emits 43 files totaling 123,476 raw / 45,305 aggregate gzip
bytes with deploy SHA-256
`81d0b3c5e0d1d1f72f29d219647601463f5317f215274e14a45fe5ba92eb033e`.
The login route uses 12,093 raw / 5,795 gzip JavaScript bytes. The two-route
session uses 16 JavaScript files totaling 60,767 raw / 22,561 aggregate gzip
bytes. Seven fresh Chrome profiles record a 1.4 ms navigation median with a
1.2/1.5 ms range; the range overlaps `0.12.1`, so no latency change is claimed.
`/help` remains 0 B JavaScript.

### `0.12.3`: Route Failure And Restoration Policy

- **Purpose:** decide application-visible handling of navigation/data failures.
- **Expected boundary:** native fallback and application-owned error UI first.
- **Acceptance:** invalid document, asset failure, offline/error state, retry,
  focus restoration, and no half-replaced route for those precommit failures.
- **Stop condition:** a generic React-style error-boundary renderer is required.
- **Done condition:** each classified transport, document-validation,
  capability-loading, or stylesheet-loading failure leaves a valid document
  and recoverable navigation path.

**Completion evidence:** required Chrome injects deterministic fetch and
response-body transport rejections through a pending prefetch and click retry,
then proves the current URL, route DOM, and retained layout remain unchanged.
The test moves focus away while the request is pending; the existing polite
navigation status announces the failure and restores the initiating link.
Activating that link again completes list-to-detail replacement and focuses the
destination heading.
Separate invalid-identity, missing-capability-module, and missing-stylesheet
responses fail before route disposal and recover through the existing native
document fallback. The maintained HTTP 500 project read still reports an
application-owned alert and succeeds on explicit retry.

Only `navigation-runtime.js` changes: fetch and response-body transport failures
receive one private error classification, while document validation and asset
failures keep their existing fallback. The source grows from 351 to 374 lines and adds no
semantic primitive, ModuleIR kind, compiler pass, core compiler line, runtime
concept, public API, error-boundary renderer, route registry, or additional
browser file. The application emits 43 files totaling 123,835 raw / 45,379
aggregate gzip bytes with deploy SHA-256
`fb9d24cc01791bf80b67b659738ba62beded6ff6ce14a86a278fa4b34d088acf`.
The two-route session remains 16 JavaScript files totaling 61,126 raw / 22,663
aggregate gzip bytes, 359 raw bytes above `0.12.2`; the unpaired,
environment-sensitive 102-byte gzip difference is not attributed to the patch.
`/help` remains 0 B JavaScript. Seven fresh Linux x64 Chrome 142 profiles record
a 1.8 ms median with a 1.5/2.4 ms range. No latency comparison is claimed
against the macOS arm64 Chrome 151 `0.12.2` samples.

### `0.12.4`: Nested Layout Evidence Decision

- **Purpose:** determine whether multiple independently retained layout owners
  are required.
- **Acceptance:** at least three unrelated application routes demonstrate the
  same lifetime that one shared layout plus static composition cannot express.
- **Stop condition:** route nesting is only a source-organization preference.
- **Done condition:** either existing layout composition is accepted or a
  minimal layout-owner chain is approved with explicit disposal order.

**Completion evidence:** architecture review covers the project application's
list, static detail, runtime project, and runtime issue routes; Apache Answer's
questions, tags, admin, and legal route-shell reduction; its independently
reduced authentication shell; the Context and Zustand cart reductions; and the
two disjoint navigation-group shells. All executable evidence fits one retained
layout owner around one replaceable route owner, followed by existing
conditional, keyed, effect, and DOM ownership. The project runtime routes use
native document navigation, the Answer shell is static composition, and the
independent navigation groups require disjoint top-level owners rather than a
nested owner chain.

No reviewed route proves an intermediate layout whose DOM, state, or effects
must survive descendant route replacement and then dispose on subtree exit.
The qualifying evidence count is zero, below the required three unrelated
routes. The stop condition is met: current nesting is source organization or
static composition, so this packet accepts the existing single-layout model and
does not authorize a layout-owner chain. A future review must first prove the
same otherwise-inexpressible intermediate lifetime in three unrelated
executable application routes, including leaf-before-intermediate and
deepest-first disposal requirements.

The project application records `closed-by-stop-condition`, the reviewed route
sets, an empty qualifying-route list, and the reused ownership semantics in its
machine-readable capability contract. This packet adds zero semantic
primitives, ModuleIR or RouteIR kinds, compiler passes, production compiler or
runtime lines, runtime concepts, normalization or adapter rules, public APIs,
layout registries, disposal paths, browser files, or browser bytes. Existing
fixtures and output remain unchanged: 43 deploy files totaling 123,835 raw /
45,379 aggregate gzip bytes with the same deploy digest, a 61,126 raw / 22,663
aggregate gzip two-route JavaScript session, and 0 B JavaScript on `/help`. No
benchmark rerun or latency claim applies to a machine-readable evidence decision
with no generated-output change.

## `0.13.x`: Forms

### `0.13.0`: Production Form And Server Validation

- **Purpose:** complete issue creation with native constraints and server errors.
- **Expected boundary:** native form, FormData, state, and async handler.
- **Acceptance:** keyboard submit, native constraints, pending state, field and
  form errors, retry, focus/ARIA linkage, and retained valid input.
- **Stop condition:** React Hook Form is reproduced.
- **Done condition:** complete accessible create/edit behavior passes without a
  form runtime.

**Completion evidence:** the maintained Alpha project detail now authors one
ordinary uncontrolled issue form with native `required` and `minLength`
constraints, `FormData`, three route-owned primitive states, one object ref, and
one async submit handler. Required Chrome sends real Enter key events through
the browser input domain and proves empty and short titles make zero requests.
For valid input, the deterministic server returns a delayed `422` field error,
then a `503` form error, then a `201` success. The journey verifies pending
disable/label state, title focus, `aria-invalid` and `aria-describedby` linkage,
alert/status roles, exact attempt/create counts, retry without re-entry, and
retention of the valid title and description through every response.

The existing native-form, state, ref, conditional, binding, and handler
semantics cover the complete packet. Production compiler and runtime source do
not change. The application route grows from 20 to 70 authored lines and emits
one additional route handler file; no form package, registration API, proxy
metadata graph, schema adapter, semantic primitive, IR kind, compiler pass,
runtime concept, public API, or browser runtime file is added. `/help` remains
complete HTML with 0 B JavaScript.

The project application emits 44 files totaling 127,343 raw / 46,261 aggregate
gzip bytes with deploy SHA-256
`183f5a7ca081f99ae38de6974e61fdcb32ca49de699359aac053d0154ae38036`.
The two-route session uses 17 JavaScript files totaling 62,118 raw / 23,096
aggregate gzip bytes, 992 raw / 433 gzip bytes above `0.12.4`; the detail route
itself adds the same 992 raw bytes and 440 gzip bytes. Seven fresh Linux x64
Chrome 142 profiles record list-to-detail samples of
`[3.8, 5.6, 4.3, 2.6, 2.9, 3.6, 3.1]` ms, a 3.6 ms median and 2.6/5.6 ms range.
The range does not overlap `0.12.4`; this is the measured cost of adding the
form DOM and route-specific handler to the destination application route, not a
same-content compiler/runtime comparison or a latency improvement claim.

### `0.13.1`: Nested Fields, Field Arrays, Dirty, And Touched

- **Purpose:** determine which form metadata needs framework support.
- **Expected boundary:** object/array state and keyed rows first.
- **Acceptance:** dynamic assignee/checklist rows, reorder/remove, conditional
  fields, dirty/touched display, reset, and exact row identity.
- **Stop condition:** a registration/proxy runtime is added before three
  independent forms require the same metadata graph.
- **Done condition:** application composition is accepted or the smallest
  repeated metadata semantic is isolated.

**Completion evidence:** the maintained Alpha issue form now owns nested
assignee metadata as one ordinary object state and a dynamic checklist as one
ordinary array state with stable string keys. Native `input`, `blur`, `change`,
and `reset` events drive explicit dirty/touched display, conditional assignee
fields, immutable checklist add/reorder/remove operations, and reset to the
authored baseline. Required Chrome proves retained checklist keys preserve exact
DOM identity through reorder and reset, removed and reset-added keys disconnect,
conditional ownership releases the assignee controls, and native reset clears
uncontrolled title/body values plus application-owned metadata. The existing
keyboard constraints and delayed `422`, `503`, and `201` server journey continue
to pass while nested assignee/checklist values survive field and form failures.

The first failing fixture was the `0.13.1` project-application contract against
the released `0.13.0` Alpha form. Native controls and existing object/array
state, condition, keyed-list, binding, and handler semantics close it without a
normalization rule, adapter, semantic primitive, IR kind, compiler pass,
production compiler/runtime line, runtime concept, public API, registration
function, proxy metadata graph, schema adapter, or form runtime. The
machine-readable decision is `closed-by-application-composition`; dynamic field
names, schema-driven registration, generic watchers, and proxy dirty/touched
graphs remain unsupported until independent real forms prove a repeated gap.

The application emits 44 files totaling 138,064 raw / 47,964 aggregate gzip
bytes with deploy SHA-256
`f0d96cfd5dee2cf3fa67f4ebe25d8b32cbb1bf66e72ed5ca1c29bd06fdcc0a33`.
The maintained two-route session remains 17 JavaScript files and grows by 3,286
raw / 803 aggregate gzip bytes to 65,404 / 23,899 bytes. This is authored
route-specific form behavior, not a shared form runtime; `/help` remains 0 B
JavaScript. Seven fresh Linux x64 Chrome 142 profiles record list-to-detail
samples of `[3.5, 3.3, 4.4, 3.3, 3.2, 4.7, 3.3]` ms, a 3.3 ms median and
3.2/4.7 ms range. The range overlaps `0.13.0` and the destination content
changed, so no latency regression or improvement is claimed.

### `0.13.2`: Multistep Draft And Autosave

- **Purpose:** prove draft persistence across steps and failures.
- **Expected boundary:** routes or conditionals, state, dependency effects,
  debounce cleanup, and storage/server persistence.
- **Acceptance:** step navigation, validation gate, debounced save, stale-save
  rejection, reload restore, reset, and conflict/error state.
- **Stop condition:** a wizard or autosave scheduler is added for one form.
- **Done condition:** no data loss occurs across navigation, reload, or failure.

Development evidence is complete. The Alpha application now owns a two-step
project setup draft with native first-step constraints, parent-owned values,
versioned local storage, one mount restore effect, and one dependency effect
whose direct timeout cleanup debounces an owned server write. Required Chrome
proves step navigation, validation, two overlapping versions, server rejection
of the older save, ignored stale completion, enhanced-navigation restoration,
reload restoration, retained conflict input, and reset of state, storage, and
pending work.

The first failing fixture was the `0.13.2` project-application contract against
the released `0.13.1` Alpha route. Existing ordinary state, conditional
ownership, dependency invalidation, effect cleanup, owned fetch, late-write
rejection, and guarded versioned storage close it without a semantic primitive,
IR kind, compiler pass, production compiler/runtime line, normalization rule,
adapter, runtime concept, public API, wizard scheduler, or autosave scheduler.
The machine-readable decision is `closed-by-application-composition`.

The application emits 44 files totaling 144,633 raw / 49,217 aggregate gzip
bytes with deploy SHA-256
`06a35341c5e70bfec48c46ad767ac351326b39ba701f5c1f1d03992a65ec8b9e`.
The maintained two-route session remains 17 JavaScript files and grows by 3,260
raw / 848 aggregate gzip bytes to 68,664 / 24,747 bytes; `/help` remains 0 B
JavaScript. Seven fresh Linux x64 Chrome 142 profiles record list-to-detail
samples of `[10.7, 7.4, 3.7, 7.9, 6.1, 4.0, 5.4]` ms, a 6.1 ms median and
3.7/10.7 ms range. The destination content changed and the range is noisy, so
no same-content latency regression or improvement is claimed.

### `0.13.3`: File Upload Boundary

- **Purpose:** move beyond local file reading to a real upload lifecycle.
- **Expected boundary:** native input, FormData/fetch or a proven browser API.
- **Acceptance:** type/size validation, progress when the selected transport can
  expose it, cancellation, failure/retry, route departure, and successful
  attachment mutation.
- **Stop condition:** chunking/resume/background upload is added without a real
  application requirement.
- **Done condition:** the supported transport and unsupported progress/resume
  boundary are explicit and tested.

Development evidence is complete. The Alpha application accepts one plain-text
attachment up to 1 KiB, rejects invalid type and size before any request, reads
the selected file into bounded route state, and reconstructs it as a `Blob` in
one dependency effect that owns `FormData`, fetch, and `AbortController`.
Required Chrome proves explicit user cancellation, delayed `503` feedback,
retry without reselection, successful keyed attachment mutation, and exact
abort when enhanced navigation releases the route.

The first failing fixture was the `0.13.3` project-application contract against
the released `0.13.2` Alpha route. Existing native file handlers, ordinary
state, dependency invalidation, effect cleanup, owned fetch, route release, and
keyed list identity close it without a semantic primitive, IR kind, compiler
pass, production compiler/runtime line, normalization rule, adapter, runtime
concept, public API, upload scheduler, or transfer runtime. The machine-readable
decision is `closed-by-application-composition`.

Fetch does not expose upload progress, so the application renders that boundary
explicitly and does not emit a fake progress element. Chunking, resume,
background sync, binary formats, multiple concurrent files, and files above the
authored 1 KiB in-memory text limit remain unsupported. Add a different
transport only when a real application requires one of those capabilities.

The application emits 44 files totaling 150,023 raw / 50,240 aggregate gzip
bytes with deploy SHA-256
`a16fd5dbc08086aa6a7c0ec0aba3a38fbe2a63b96005a81e8747a7f4e45e214e`.
The maintained two-route session remains 17 JavaScript files and grows by 2,367
raw / 557 aggregate gzip bytes to 71,031 / 25,304 bytes; `/help` remains 0 B
JavaScript. Seven fresh Linux x64 Chrome 142 profiles record list-to-detail
samples of `[3.7, 5.0, 3.5, 3.7, 3.8, 3.8, 4.0]` ms, a 3.8 ms median and
3.5/5.0 ms range. The destination content changed, so no same-content latency
regression or improvement is claimed.

## `0.14.x`: Lists, Tables, And Virtualization

### `0.14.0`: Project Table CRUD And Identity

- **Purpose:** establish the production table baseline.
- **Expected boundary:** existing keyed list runtime and valid table structure.
- **Acceptance:** insert, update, delete, reorder, sort, filter, selection,
  row-local edit state, keyboard access, and retained DOM identity.
- **Stop condition:** a data-grid runtime is introduced for ordinary tables.
- **Done condition:** complete CRUD behavior passes with measured update latency.

Evidence complete. The first failing fixture was the
`0.14.0` project-application contract against the previous article list. It now
uses a native table, ordinary array/object state, the existing pure collection
selector, three existing keyed row-state slots, and native button/input keyboard
behavior for insert, update, delete, reverse, sort, filter, selection, and edit.
The browser journey proves retained row and draft-input identity through reorder
and sort, fresh identity/state after filter removal and restoration, and focused
keyboard reachability. Native `hidden` keeps the editor mounted rather than
introducing a conditional callback-scope adapter or data-grid runtime.

This slice adds zero semantic primitives, zero compiler passes, zero core LOC,
and zero runtime concepts. It changes one real fixture, its contract, the
machine-readable capability record, and the existing project benchmark. The
application remains 44 files and changes from the `0.13.3` baseline by +9,235
raw / +1,387 aggregate gzip bytes to 159,258 / 51,627 bytes, with deploy SHA-256
`ebb3358e7a03612459e723ae765c39d105498db9d293415b924f1066cddf4793`.
The maintained two-route session remains 17 JavaScript files and grows by 2,273
raw / 626 aggregate gzip bytes to 73,304 / 25,930 bytes; `/help` remains 0 B
JavaScript.

Seven fresh Linux x64 Chrome 142 profiles record table Save-click-to-committed-
DOM samples of `[0.7, 0.8, 1.0, 0.7, 1.1, 0.7, 0.8]` ms, a 0.8 ms median and
0.7/1.1 ms range. This is the first equivalent table-update measurement, so no
same-content latency delta is claimed. The same runs record list-to-detail
samples of `[3.9, 3.9, 5.5, 4.2, 6.1, 3.5, 3.4]` ms, a 3.9 ms median and
3.4/6.1 ms range. No compiler/runtime production logic changed; `0.14.0`
publishes the accepted application-capability packet and `create-kudzu@0.1.122`
generates projects on `@kudzujs/core@^0.14.0`.

### `0.14.1`: Nested And Object-State Collections

- **Purpose:** prove project/group/issue/checklist nesting from ordinary object
  state without authored field state.
- **Expected boundary:** existing object-property links and nested KeyedBlockIR.
- **Acceptance:** replacement, nested insertion/removal/reorder, latest handlers,
  row cleanup, invalid-shape rejection, and static sibling exclusion.
- **Stop condition:** dynamic property paths or mutation require generic runtime
  object observation.
- **Done condition:** direct immutable paths cover the application journey and
  nearby dynamic forms fail clearly.

Release evidence complete. The first failure replaced the project route's
separate array state with one direct `projectData.projects` field and failed at
build time because nested lists required their source ownership signal itself to
contain an array. The compiler already emitted a binding-backed root
`KeyedBlockIR`, its selector states, and the nested issue child block. Build-time
list validation now allows an object-valued signal only for a compiler-proven
`ownerField`; root lists still require arrays and nested non-array fields still
fail. Browser mounting initializes binding-backed roots with children from their
serialized state before the evaluator module loads, preserving the existing
parent prototype and ownership path.

Required Chrome proves immutable whole-object replacement, nested issue insert,
update, reorder, removal, re-addition, retained project/issue identity, latest
issue handlers, descendant state release, and fresh remount. Existing dynamic
object-property, alias, mutation, mutating-sort, and non-array diagnostics retain
the negative boundary, while `/help` remains complete HTML with 0 B JavaScript.
The slice adds zero semantic primitives, IR kinds, compiler passes,
normalization rules, adapters, runtime concepts, or public APIs. It changes one
build-time validation line and adds one production list-runtime line.

The release emits 44 files totaling 164,305 raw / 52,185 aggregate gzip bytes
with deploy SHA-256
`0a3b7e10b3447a76a9c04ef34ad7c2bfa30400ea53c9d16fc85b1c7cbf2ea203`.
The two-route session remains 17 JavaScript files totaling 74,826 raw / 26,204
aggregate gzip bytes. Seven fresh Chrome 142 profiles record table
update samples of `[0.8, 0.8, 0.7, 0.8, 0.9, 0.8, 0.8]` ms, a 0.8 ms median and
0.7/0.9 ms range, plus navigation samples of
`[3.7, 4.1, 4.5, 3.9, 4.2, 3.9, 4.3]` ms, a 4.1 ms median and 3.7/4.5 ms range.
`0.14.1` publishes this accepted packet, and `create-kudzu@0.1.123` generates
projects on `@kudzujs/core@^0.14.1`.

### `0.14.2`: Infinite Loading Composition

- **Purpose:** prove sentinel-driven incremental loading before virtualization.
- **Expected boundary:** IntersectionObserver, owned fetch, append, keyed list.
- **Acceptance:** cursor progression, duplicate suppression, end/error/retry,
  route cleanup, retained identity, and bounded result policy.
- **Stop condition:** infinite-query or observer runtime is added for one list.
- **Done condition:** the full journey passes with explicit network and memory
  bounds.

Release candidate evidence complete. The maintained project application adds one
intrinsic sentinel, an owned native `IntersectionObserver`, cursor and request
primitive state, an owned fetch with `AbortController`, immutable keyed append,
duplicate ID suppression, and explicit loading/error/retry/end UI. The authored
policy permits two successful pages of two records and retains at most six unique
projects. It adds no infinite-query runtime, observer scheduler, cache, retained
component tree, or virtualization machinery.

Required Chrome proves duplicate sentinel triggers issue one request, duplicate
records do not remount retained rows, cursor progression reaches an authored
`503`, retry reaches terminal state, post-terminal triggers issue no request, and
enhanced navigation disconnects the observer and aborts the in-flight fetch
signal. Exact request counts and retained DOM identity pass. `/help` remains
complete HTML with 0 B JavaScript.

The slice adds zero semantic primitives, IR kinds, compiler passes, production
compiler/runtime lines, normalization rules, adapters, runtime concepts, or
public APIs. The application emits 44 files totaling 168,037 raw / 52,955
aggregate gzip bytes with deploy SHA-256
`230dea098442275e42a966ca595743a4da9c832327ba52d4d09de663c68f8f1a`.
The maintained two-route session remains 17 JavaScript files totaling 76,889 raw
/ 26,750 aggregate gzip bytes.

Seven fresh macOS arm64 Chrome 151 profiles record table update samples of
`[0.4, 0.5, 0.5, 0.3, 0.5, 0.4, 0.6]` ms, a 0.5 ms median and 0.3/0.6 ms range,
plus navigation samples of `[2.3, 2.3, 2.2, 2.6, 2.5, 2.5, 2.3]` ms, a 2.3 ms
median and 2.2/2.6 ms range. The environment differs from `0.14.1`, so no timing
delta is claimed. `0.14.2` publishes this accepted packet, and
`create-kudzu@0.1.124` generates projects on `@kudzujs/core@^0.14.2`.

### `0.14.3`: 10,000-Item Browser Decision

- **Purpose:** measure direct DOM, pagination, and windowing alternatives.
- **Acceptance:** equivalent behavior, keyboard access, edit identity, scroll
  latency, DOM count, heap, and update latency across alternatives.
- **Stop condition:** a virtualization result is claimed without equivalent
  behavior or repeated samples.
- **Done condition:** the selected strategy and thresholds are recorded without
  assuming direct 10,000-row rendering is acceptable.

Decision evidence is complete. A tracked three-route fixture and
`npm run benchmark:project-list-decision` now compare one static 10,000-row
table with pagination and a scroll-driven 100-row window over the same
deterministic records and native edit controls. Seven rotating fresh Chrome 142
profiles show direct DOM
at an 806.6 ms load median and 90,023 DOM nodes, versus 165.4/161.2 ms and a
1,470/1,471-node median for pagination and the scroll window. Direct JavaScript
heap is lower because its route is static; DOM size and load remain materially
worse.

Pagination is selected. Its 12.1 ms range median is lower than the window's 16.5
ms, it uses 100,300 fewer median JavaScript-heap bytes, and it preserves native
page, keyboard, focus, and variable-row-height behavior without a scroll listener
or measurement policy. Both bounded routes release an edited off-range row and
restore fresh native input identity. The experiment adds no semantic primitive,
IR kind, compiler pass, production compiler/runtime line, runtime concept, or
public API. `0.14.4` remains blocked because this one fixture cannot authorize
virtual range ownership.

### `0.14.4`: Virtual Range Ownership

- **Purpose:** implement bounded DOM only if `0.14.3` and three independent
  fixtures authorize it.
- **Expected boundary:** keyed ownership extended by a minimal visible-range
  owner; no general component renderer.
- **Acceptance:** spacer/measurement behavior, retained key state, keyboard and
  focus, dynamic row height policy, cleanup, and bounded heap.
- **Stop condition:** evidence favors pagination or native containment.
- **Done condition:** range semantics are package-neutral, optional, measured,
  and absent from non-virtual routes.

Closed by stop condition. The `0.14.3` decision selected pagination over both
direct 10,000-row DOM and the authored fixed-height scroll window. No independent
application fixture proves pagination or application-owned bounded ranges
insufficient, against the required three. Kudzu therefore adds no visible-range
owner, measurement policy, range primitive, or virtualization runtime and moves
to the next evidence-ready application capability.

## `0.15.x`: Overlay And Layer Ownership

### `0.15.0`: Native Dialog Baseline

- **Purpose:** use browser top-layer semantics for destructive issue actions.
- **Acceptance:** initial focus, Escape/cancel, confirm, trigger focus restore,
  inert background, route cleanup, and static exclusion.
- **Stop condition:** a custom modal/focus-trap runtime replaces `<dialog>`.
- **Done condition:** project delete and edit confirmation pass accessibly.

Implementation evidence is local and release gates remain pending. The maintained
project application replaces immediate keyed project deletion with one shared
native `<dialog>`, one route-owned object ref, and one pending project ID state.
Existing row callback specialization opens the browser top layer; native cancel,
explicit cancel, and confirmation handlers close it without a Portal, focus trap,
overlay runtime, or retained component tree.

Required Chrome proves modal top-layer behavior, native initial focus, explicit
cancel, Escape-equivalent `requestClose()`, trigger-focus restoration, confirmed
keyed deletion with fallback focus, retained sibling identity, and exact top-layer
release on enhanced route navigation. The static `/help` sibling remains 0 B
JavaScript. The slice adds no semantic primitive, IR kind, compiler pass,
production compiler/runtime line, normalization rule, adapter, runtime concept,
or public API. The application emits 44 files totaling 169,778 raw / 53,294
aggregate gzip bytes with deploy SHA-256
`91c5517e69c341bbd2051f07b3f0ad7df627098ba8e1984561268ea8666f3407`.
The maintained two-route session remains 17 JavaScript files totaling 77,453 raw
/ 26,905 aggregate gzip bytes.

Seven fresh macOS arm64 Chrome 151 profiles record table update samples of
`[0.5, 0.6, 0.6, 0.6, 0.6, 0.4, 0.5]` ms, a 0.6 ms median and 0.4/0.6 ms range,
plus navigation samples of `[2.3, 2.6, 2.9, 2.6, 2.5, 2.7, 2.5]` ms, a 2.6 ms
median and 2.3/2.9 ms range. These retained-path ranges overlap the previous
same-environment evidence, so no timing improvement or regression is claimed.

### `0.15.1`: Popover, Dropdown, And Menu Behavior

- **Purpose:** establish the native-first non-modal overlay boundary.
- **Expected boundary:** native Popover where available, ordinary state/events,
  and owned listeners.
- **Acceptance:** positioning policy, outside click, Escape, trigger restore,
  roving keyboard behavior where menu semantics apply, and route cleanup.
- **Stop condition:** package Portal/Slot reconciliation enters the runtime.
- **Done condition:** supported native and custom boundaries are explicit.

Completed with the maintained project application as the qualifying fixture. A
keyed project row now authors one top-level `useId()`, a native
`popovertarget`, and a native `popover="auto"` action group. The compiler scopes
the generated ID by the existing keyed ownership path and the list runtime
rewrites only intrinsic `id`, `for`, static ARIA IDREF, `form`, `headers`,
`list`, and `popovertarget` attributes. Unsupported ID escapes receive a source
diagnostic. Native Chrome behavior supplies the top layer, Escape, light
dismiss, and trigger focus restoration; ordinary keyed ownership preserves IDs
across reorder, scopes inserted rows, recreates deterministic IDs after
remove/re-add, and releases an open popover during enhanced navigation. The
authored overlay uses static anchor positioning and `role="group"`, so menu
roving focus is not applicable.

The slice adds no semantic primitive, IR kind, compiler pass, runtime concept,
public API, Portal/Slot reconciliation, focus manager, positioning engine, or
retained overlay tree. It adds 52 and removes 24 production lines across the
source compiler, RouteIR validation, capability projection, build renderer, and
existing list runtime. The maintained application emits 44 files totaling
171,202 raw / 53,629 aggregate gzip bytes with deploy SHA-256
`46ba45b4a423b9627c6ede5f8dd3a667f593cb5401454ae42ecc66207b07b323`.
The two-route session remains 17 JavaScript files totaling 77,779 raw / 27,050
aggregate gzip bytes, a 326 raw / 145 gzip byte increase from `0.15.0`; the
static `/help` sibling remains 0 B JavaScript. Familiar React-shaped `useId()`
authoring remains intact, so no application adapter or migration-only source
structure is added.

Seven fresh macOS arm64 Chrome 151 profiles record table update samples of
`[0.4, 0.4, 0.5, 0.4, 0.5, 0.5, 0.5]` ms, a 0.5 ms median and 0.4/0.5 ms range,
plus navigation samples of `[4, 2.4, 2.6, 2.5, 2.5, 2.8, 2.4]` ms, a 2.5 ms
median and 2.4/4 ms range. These retained-path ranges overlap prior evidence,
so no timing improvement or regression is claimed.

### `0.15.2`: Toast And Notification Ownership

- **Purpose:** provide application feedback across route mutations.
- **Expected boundary:** layout state, keyed list, timer effects, and live region.
- **Acceptance:** queue, deduplication, timeout, pause/focus behavior if required,
  dismissal, route persistence, announcement, and disposal.
- **Stop condition:** a global scheduler is added before ordinary composition is
  shown insufficient.
- **Done condition:** notifications remain owner-bounded and absent from unused
  route output.

### `0.15.3`: Layer Owner Decision

- **Purpose:** decide whether logical ownership of DOM rendered outside its
  authored range is necessary.
- **Acceptance:** three independent overlay fixtures fail native top-layer and
  in-place composition for the same reason.
- **Stop condition:** the request is React Portal source compatibility alone.
- **Done condition:** no new concept is added, or a minimal owner edge with exact
  cleanup/focus order is approved.

## `0.16.x`: External Complex UI

### `0.16.0`: Bounded External UI Contract

- **Purpose:** define and prove `mount`, `update`, `dispose`, owner, lifetime, and
  route-specific assets without a React island.
- **Expected boundary:** DOM ref plus owned effect first.
- **Acceptance:** a small imperative package creates and disposes one real DOM or
  canvas instance; static siblings exclude it.
- **Stop condition:** the package requires React reconciliation.
- **Done condition:** package ownership remains inside effect/handler ESM and no
  generic widget runtime is added.

### `0.16.1`: Real Editor Lifecycle

- **Purpose:** integrate one real CodeMirror-class editor.
- **Acceptance:** mount, initial value, application-state update, editor-to-state
  update, dependency changes, route disposal, remount, errors, and accessibility.
- **Stop condition:** preserving the React wrapper requires a React island.
- **Done condition:** the native package owns its DOM and Kudzu owns only its
  bounded lifecycle.

### `0.16.2`: Chart And Map Lifecycle

- **Purpose:** validate the same contract against unrelated canvas/SVG/map DOM.
- **Acceptance:** resize/data update, listener/source cleanup, route transition,
  retained instance where required, and asset exclusion.
- **Stop condition:** package-specific concepts enter generic IR/runtime.
- **Done condition:** one lifecycle model covers editor and chart/map evidence.

### `0.16.3`: Grid And Drag/Drop Decision

- **Purpose:** test external data-grid or drag engine ownership against keyed
  Kudzu state.
- **Acceptance:** keyboard equivalent, reorder/mutation, state synchronization,
  package disposal, and failure recovery.
- **Stop condition:** two independent renderers attempt to own the same DOM.
- **Done condition:** either bounded ownership is proven or the package is
  explicitly unsupported with a migration path.

## `0.17.x`: Long-Lived Applications

### `0.17.0`: Endurance Harness

- **Purpose:** make long-session correctness locally reproducible.
- **Expected files:** a dedicated browser soak harness and machine-readable heap,
  listener, resource, DOM, and navigation counters.
- **Acceptance:** repeated route, conditional, keyed, dialog, and editor cycles;
  raw traces are retained.
- **Stop condition:** only a short synthetic timing loop is measured.
- **Done condition:** failures identify the owner that retained memory or work.

### `0.17.1`: WebSocket Application Journey

- **Purpose:** move from isolated fake socket ownership to project notifications.
- **Acceptance:** connect, message, keyed update, reconnect, stale socket
  rejection, route/layout lifetime, offline/error state, and exact cleanup.
- **Stop condition:** a shared transport runtime is added for one consumer.
- **Done condition:** repeated navigation balances every listener, timer, and
  socket handle.

### `0.17.2`: Shared SSE/Transport Decision

- **Purpose:** test multiple independently mounted consumers, replay, and
  reconnect against existing layout effects/shared state.
- **Acceptance:** subscription add/remove, one transport, replay ordering,
  reconnect, consumer removal, final close, and bounded history.
- **Stop condition:** fewer than three independent applications require the same
  shared transport semantics.
- **Done condition:** existing composition passes or a minimal transport owner is
  architecture-approved.

### `0.17.3`: Memory And Disposal Gate

- **Purpose:** close document/layout/route/range/external-instance memory risks.
- **Acceptance:** long repeated journeys show bounded heap, DOM, prefetch cache,
  resource handles, listener counts, and state maps.
- **Stop condition:** undocumented browser GC timing is presented as exact proof.
- **Done condition:** retained growth has a declared bound and repeated samples
  pass the agreed threshold.

## `0.18.x`: Lazy Loading And Code Splitting

### `0.18.0`: Route And Feature Artifact Baseline

- **Purpose:** record current route-specific ESM, shared chunks, preload, Worker,
  CSS, and navigation prefetch behavior.
- **Expected boundary:** existing RouteBuildRecord and artifact report.
- **Acceptance:** exact source-to-artifact ownership and bytes for the greenfield
  app, editor, Answer, and Memos routes.
- **Stop condition:** a new loader is designed before the current graph is
  measured.
- **Done condition:** every eager dependency has a structural reason.

### `0.18.1`: Bounded Lazy Capability Import

- **Purpose:** permit one statically analyzable feature dependency to load only
  when its owner requests it.
- **Expected boundary:** validated static dynamic-import edge, route artifact
  closure, owner token, and native ESM import.
- **Acceptance:** exact specifier, no arbitrary graph escape, deduplicated load,
  error/retry, owner release, and static exclusion.
- **Stop condition:** arbitrary dynamic imports or lazy component rendering are
  required.
- **Done condition:** the feature loader is capability-specific, not a component
  runtime.

### `0.18.2`: Lazy Editor Journey

- **Purpose:** apply `0.18.1` to the real editor.
- **Acceptance:** editor package absent before activation, loaded once on demand,
  mount/update/dispose behavior unchanged, failure recoverable, and revisit
  semantics explicit.
- **Stop condition:** package evaluation must occur during build rendering.
- **Done condition:** initial route bytes fall by the exact deferred package
  graph without losing behavior.

### `0.18.3`: Shared Chunks And Prefetch Policy

- **Purpose:** avoid duplicate large feature graphs and define optional preload.
- **Acceptance:** shared chunk ownership, no duplicate fetch, route/interaction
  prefetch policy, cache bound, cancellation limits, and output report.
- **Stop condition:** all features are globally prefetched.
- **Done condition:** policy minimizes unused transfer while meeting accepted
  interaction latency.

## `0.19.x`: React Ecosystem Migration

### `0.19.0`: Compatibility Boundary And Inventory

- **Purpose:** centralize package recognition and compatibility provenance without
  changing semantic IR or browser output.
- **Expected files:** focused compatibility metadata/registry, current passes,
  project report; no public plugin API.
- **Acceptance:** Native, Compiled, Normalized, Adapter, Owned External UI,
  Partial, and Unsupported sites are deterministic and source-located.
- **Stop condition:** package origin enters ModuleIR, RouteIR, codegen, or runtime.
- **Done condition:** existing React Router, Bootstrap, Zustand, and browser
  normalizations preserve output and diagnostics.

### `0.19.1`: Apache Answer Authentication Journey

- **Purpose:** promote the existing build-only auth fixture to browser evidence.
- **Acceptance:** anonymous, invalid login, valid login, token restore, shared
  header/settings, 401 clear, replacement navigation, public zero-JS sibling.
- **Stop condition:** client UI is treated as authorization.
- **Done condition:** the complete journey passes against a deterministic server.

### `0.19.2`: Apache Answer Connected Authoring Journey

- **Purpose:** connect query, route, detail, create/edit, validation, mutation,
  refresh, admin, and logout.
- **Acceptance:** behavior, accessibility, persistence, errors, navigation,
  source retention, and output all pass.
- **Stop condition:** fixture-only compiler semantics or broad package runtime is
  introduced.
- **Done condition:** this is a connected browser journey, not a whole-app claim.

### `0.19.3`: Memos Feed And CRUD Journey

- **Purpose:** establish the first durable Memos application slice.
- **Acceptance:** login, loading/error, feed, pagination, create/edit/delete,
  retained memo identity, refresh, and logout.
- **Stop condition:** outline-only or static feed output is presented as Memos
  migration.
- **Done condition:** pinned upstream provenance and exact retained source are
  recorded.

### `0.19.4`: Memos Realtime Journey

- **Purpose:** add reaction and realtime refresh using the accepted long-lived
  transport model.
- **Acceptance:** mutation, server event, deduplication, reconnect, stale event
  rejection, route cleanup, and memory gate.
- **Stop condition:** a query or SSE package runtime is copied wholesale.
- **Done condition:** browser and endurance acceptance pass.

### `0.19.5`: Actual Budget Intake Decision

- **Purpose:** determine whether a complete, legally and technically usable
  workspace can become the third application proof.
- **Acceptance:** pinned source, install/build path, dependency inventory, first
  executable user journey, and honest source-retention denominator.
- **Stop condition:** workspace dependencies or core packages remain absent.
- **Done condition:** a later packet is authorized, or deferral is recorded with
  no compatibility claim.

## `0.20.x`: AI Tooling And Delivery Cost

### `0.20.0`: Structured Diagnostics

- **Purpose:** expose stable machine-readable errors from the existing compiler.
- **Acceptance:** version, code, stage, severity, source range, message,
  compatibility class, and safe suggestion; human diagnostics remain useful.
- **Stop condition:** diagnostic codes expose pass filenames or unstable IR.
- **Done condition:** agents no longer parse message substrings for maintained
  fixtures.

### `0.20.1`: `kudzu inspect --json`

- **Purpose:** expose reachable application and compatibility inventory.
- **Acceptance:** filtered module/route/package/capability/owner/blocker facts,
  deterministic order, schema version, and large-project context bound.
- **Stop condition:** the command builds a second analyzer or dumps full raw IR.
- **Done condition:** the first blocker can be selected without reading hundreds
  of source or dependency files.

### `0.20.2`: `kudzu explain --route`

- **Purpose:** trace one authored route to its selected browser artifacts.
- **Acceptance:** source site, normalization provenance, semantic owner,
  capability, entry/chunk/style/Worker, byte reason, and zero-JS explanation.
- **Stop condition:** a second artifact graph is introduced.
- **Done condition:** existing route records and artifact reports answer the
  query with bounded output.

### `0.20.3`: Deterministic Normalize And Fix

- **Purpose:** automate only edits proven safe and useful by recorded AI trials.
- **Acceptance:** check/preview/write modes, exact ranges, idempotence, comments
  retained, no unrelated formatting, and byte-equivalent output.
- **Stop condition:** canonical compiler source replaces ordinary authored TSX.
- **Done condition:** each fix has one diagnostic code and explicit preconditions.

### `0.20.4`: AI Delivery Protocol And Runner

- **Purpose:** track fair Kudzu and React+Vite delivery attempts.
- **Acceptance:** pinned model/tools/prompts/budgets, framework-neutral behavior
  suite, raw failures, token/cost/tool/file/build metrics, source retention, and
  browser artifacts.
- **Stop condition:** Kudzu receives private compiler guidance unavailable to the
  comparator.
- **Done condition:** every attempt is reproducible or fully attributable.

### `0.20.5`: Tooling Cost Validation

- **Purpose:** prove that diagnostics/inspect/explain/fix lower total cost per
  successful task.
- **Acceptance:** before/after attempts on the same tasks; failures remain in the
  numerator; success behavior remains identical.
- **Stop condition:** token reduction comes from omitted behavior or hidden
  context.
- **Done condition:** useful tools are retained and non-improving tools are
  removed or deferred.

## `0.21.x`: Production-Scale Proof

### `0.21.0`: Functional Parity Matrix

- **Purpose:** freeze complete greenfield, Answer, and Memos acceptance.
- **Acceptance:** content, auth, forms, CRUD, shared data, large list, overlay,
  editor, lazy load, realtime, errors, accessibility, and navigation pass.
- **Stop condition:** any build-only result is counted as application success.
- **Done condition:** every claimed capability has a browser journey and static
  exclusion control.

### `0.21.1`: Compiler And Route Scale

- **Purpose:** measure clean/incremental compilation and artifact emission.
- **Acceptance:** 100, 1,000, and separately provisioned 10,000 routes; module
  graph time, parse/normalize/compile/render/write time, peak RSS, output digest,
  and failure recovery.
- **Stop condition:** projected or incomplete 10,000-route data is called a pass.
- **Done condition:** repeated measurements and all material regressions are
  explained or fixed.

### `0.21.2`: Browser Performance And Memory

- **Purpose:** protect interaction latency and long-running stability.
- **Acceptance:** initial/session bytes, list/range latency, navigation, lazy
  feature load, resource cleanup, repeated heap, detached DOM, cache, listeners,
  and handles.
- **Stop condition:** smaller JavaScript is preferred over behavior parity.
- **Done condition:** complete features meet declared thresholds with bounded
  long-session growth.

### `0.21.3`: Package And Release Candidate

- **Purpose:** verify the exact candidate as an installed product.
- **Acceptance:** `npm run check`, `npm test`, required Chrome, focused
  benchmarks, package smoke, tarball inspection, generated application, registry
  dry run, docs, and release rollback procedure.
- **Stop condition:** version metadata changes before the exact candidate passes.
- **Done condition:** the reviewed commit is independently publishable.

### `0.21.4`: AI Delivery Proof

- **Purpose:** run the final equal-condition comparison on production-shaped
  tasks.
- **Acceptance:** highest or statistically tied success rate, lowest median cost
  per successful task, complete raw attempts, maintainable source, and retained
  browser/build advantage.
- **Stop condition:** cherry-picked attempts, toy-only tasks, or unequal tooling.
- **Done condition:** the evidence either authorizes `1.0.0` or names the next
  measured blocker without changing the release criteria.

## `1.0.0`: Stable Application Model

`1.0.0` is authorized only after every required `0.21.x` gate passes. It means:

- the small package-neutral application semantic model is stable;
- complete production-shaped application journeys pass;
- static routes retain zero JavaScript;
- interactive routes retain only used capabilities;
- React migration uses compatibility, normalization, adapters, and owned
  external UI rather than a React runtime;
- browser/build/performance and long-running memory gates pass;
- the equal-condition AI benchmark meets the published success and cost gates.

## Patch Session Procedure

Before implementation:

1. Read this plan, `MIGRATION_ROADMAP.md`, the current architecture map, and the
   applicable capability packet.
2. Confirm the package version and inspect uncommitted work without modifying
   unrelated changes.
3. Confirm every earlier patch is complete or explicitly replanned.
4. Name the exact application journey, failing fixture, owner, producer, and
   consumer boundary.
5. Record the baseline output, browser bytes, runtime concepts, compiler/pass
   LOC, and applicable benchmark.

During implementation:

1. Add the failing fixture first.
2. Try native behavior and existing semantics before changing the framework.
3. Keep the smallest correct patch and preserve ordinary React-shaped TSX.
4. Add nearby negative diagnostics and static zero-cost exclusion.
5. Do not broaden public APIs, IR, runtime, or package support beyond the packet.

Before release:

1. Run focused tests, `npm run check`, `npm test`, required Chrome, and package
   smoke.
2. Run affected output and performance gates with at least seven interleaved
   measured samples where a comparison is claimed.
3. Record fixtures, semantic primitives, core/pass LOC, runtime concepts,
   browser bytes, output digest, benchmark deltas, AI-cost effect, risks, and
   known limits.
4. Update package version, lockfile, release notes, support documentation, and
   registry-facing records only on the exact accepted release commit.
5. Complete the release transaction below, then advance the active status to
   the next patch.

## Release Transaction

Every completed patch and every new minor is a real release. A work session that
does not complete its packet does not consume a version; the next session
continues the same target version.

1. Confirm the target version is the active packet and is not already present in
   npm or Git tags.
2. Update `package.json`, root lockfile metadata, `RELEASES.md`, README/support
   records, and generator metadata when the release changes generated projects.
3. Run the complete release gate on the exact versioned tree: focused tests,
   `npm run check`, `npm test`, required Chrome, `npm run test:package`, affected
   benchmarks, package inspection, and `git diff --check`.
4. Inspect `git status`, the complete diff, and recent release history. Stage
   only the intended packet and release files.
5. Create one release commit using the established `Release Kudzu X.Y.Z`
   convention. Do not amend a rejected release commit; fix forward and create a
   new commit.
6. Push the release commit and require its CI checks to pass.
7. Create tag `vX.Y.Z` on that exact commit and push the tag. Never move or
   repoint a published tag.
8. Publish the matching GitHub release. The existing `Publish npm` workflow
   checks out the tag, reruns check/test/package gates, verifies version/tag
   equality, publishes `@kudzujs/core` and any changed `create-kudzu`, and checks
   npm registry visibility.
9. Require the publish workflow to pass, verify npm metadata and a fresh install
   manually, and record the release URL and registry versions.
10. Only after commit, push, tag, GitHub release, npm publication, registry
    verification, and fresh-install verification succeed may the next patch
    become active.

If Git push, tag push, GitHub release, npm publication, or registry verification
fails, the current packet remains active. Do not start or version the next
packet. npm versions and published tags are immutable; recover with the same
release transaction where possible or document and publish a forward-fix patch.

## Active Status

| Patch | Status | Next exact action | Blocker |
|---|---|---|---|
| `0.10.0` | Released | Preserve the published application baseline and release evidence. | None |
| `0.10.1` | Released | Preserve the published state-scale evidence and explicit object-field limit. | None |
| `0.10.2` | Released | Preserve the published shared-layout navigation and exact route-release evidence. | None |
| `0.10.3` | Released | Preserve the published guarded persistence recipe and zero-runtime exclusion. | None |
| `0.11.0` | Released | Preserve the published owned-fetch lifecycle and zero-query-runtime exclusion. | None |
| `0.11.1` | Released | Preserve the published single-owner consistency and exact request-count evidence. | None |
| `0.11.2` | Released | Preserve the published no-new-primitive architecture decision and zero-byte result. | None |
| `0.11.3` | Released | Preserve the published optimistic rollback, duplicate prevention, navigation, and retry evidence. | None |
| `0.11.4` | Released | Preserve the published bounded pagination, history, refresh, polling cleanup, and exact request-count evidence. | None |
| `0.12.0` | Released | Preserve direct runtime entry, reload, rewrite, and native fallback evidence. | None |
| `0.12.1` | Released | Preserve the published layout/history/focus/scroll evidence. | None |
| `0.12.2` | Released | Preserve the published authentication and permission evidence. | None |
| `0.12.3` | Released | Preserve the published route failure, focused retry, native fallback, and precommit retention evidence. | None |
| `0.12.4` | Released | Preserve the published single-layout decision and zero-owner-chain evidence. | None |
| `0.13.0` | Released | Preserve native constraints, server feedback, focused field errors, retained input, and retry evidence. | None |
| `0.13.1` | Released | Preserve application-owned nested metadata, keyed row identity, release, and reset evidence. | None |
| `0.13.2` | Released | Preserve multistep validation, versioned persistence, stale-save rejection, conflict retention, and reset evidence. | None |
| `0.13.3` | Released | Preserve the published upload validation, cancellation, retry, route cleanup, and attachment mutation evidence. | None |
| `0.14.0` | Released | Preserve native table CRUD, retained identity, keyboard access, and measured update evidence. | None |
| `0.14.1` | Released | Preserve immutable object-state replacement, nested keyed identity, latest handlers, and exact row release. | None |
| `0.14.2` | Released | Preserve bounded cursor loading, duplicate suppression, retry/end behavior, retained identity, and route cleanup. | None |
| `0.14.3` | Released | Preserve the published 10,000-item pagination decision and measurement evidence. | None |
| `0.14.4` | Closed by stop condition | Preserve pagination as the selected strategy until three independent fixtures authorize virtual ownership review. | Evidence favors pagination; zero qualifying fixtures |
| `0.15.0` | Closed by native composition | Preserve the native dialog, focus, cancellation, keyed deletion, and route cleanup evidence. | No production change; no release consumed |
| `0.15.1` | Released | Preserve key-scoped IDs, native Popover behavior, retained keyed identity, and route cleanup evidence. | None |
| `0.15.2` | Active | Begin with a real toast and notification ownership fixture. | None |
