# Application Capability Release Plan

This is the authoritative execution plan from `0.10.0` through `1.0.0`. It
replaces the provisional `0.10` normalize, `0.11` diagnostics, and `0.12`
adapter ordering recorded in the completed 0.9 packet. Those tools remain in
scope, but application capability evidence now determines their order.

The plan assigns one application-capability section to each minor release and
one independently releasable evidence packet to each patch release. Planned
versions are not completed releases. `package.json`, release notes, tags, and
registry metadata change only after the matching packet passes every gate.

Release transaction 0.16.30 publishes binding-target specialization with
generator 0.1.155. Existing target facts narrow property handling and element
scans while preserving shared-owner unions and generic source helpers. Recorded
byte reductions are not an AI-cost or latency result; prior measurement records
and the blocked 1.0 gate retain their meaning.

Binding-target follow-up after 0.16.29 uses existing RouteIR targets to specialize
property patching, general-attribute decoding and element scans per runtime
family. Imported search drops 605 raw / 239 gzip JS bytes; the all-property control
is unchanged. Shared owners retain all required targets and source helper calls
remain generic without explicit false defines. Original interrupted test logs
are retained alongside the passing resumed suite. This is output specialization,
not proof of AI-cost or latency superiority; no new semantic primitive is added.

Release transaction 0.16.29 collects the measured unused binding-style and
conditional runtime exclusions, repository-only browser tooling, and comparison
integrity follow-ups. Generator 0.1.154 targets the patch. Earlier no-release
statements retain their session meaning; historical scores and failed runs are
not retroactively improved. Raw evidence remains local/archived, outside npm.

Conditional exclusion follow-up (2026-09-11): no-branch binding pages now omit
conditional registries, template hooks and branch commit/release work using
existing condition facts and codegen defines. The bindings fixture drops 1,399
raw / 415 gzip JS bytes; actual branch owners retain their behavior and raw size.
Check and package smoke pass; the complete required-Chrome suite passes 328/328
serially plus the separately passed ownership test. Two parallel browser-smoke
startup/observation failures remain documented, not claimed solved. No AI-cost,
latency, or React/Astro superiority claim is authorized by this byte reduction.

Compiler output follow-up (2026-09-11): existing binding target facts now exclude
unused style serialization per runtime family. Four imported-search shapes drop
1,202 raw / 620 gzip JS bytes; full Content drops 1,202 / 619, and dynamic styles
retain identical serializer bytes. The Project app loses three redundant files.
New primitives/passes/runtime concepts are zero; compiler growth is six net lines.
Check, required-Chrome 1 + 327 tests, package smoke and retained Content browser
acceptance pass. These measured deploy-byte savings do not establish AI-cost or
latency superiority over React/Astro; the delivery/1.0 gates remain blocked.

R17 three-way Content evidence (2026-09-11) aligns all root typecheckers at 6.0.3
and completes five attempts per framework. It exposes a scorer defect: hidden
Astro rows are counted as visible results. Preserve original 5/5 Kudzu, 5/5 React,
0/5 Astro scores as unsuitable for a fair ranking. Corrected visibility checks
pass unchanged artifacts 15/15 in a separate diagnostic replay, not a new model
trial. Recorded token totals remain 1,675,472 / 1,022,921 / 1,313,616. Future r18
protocols pin the visibility correction; no cost/speed win or 1.0 is authorized.

Astro comparison readiness (2026-09-11): an ordinary pre-task Content starter
now builds the same eleven routes/data/styles; isolated native-script validation
passes common behavior/browser checks plus ten static siblings. Third-framework
aggregation and `.astro` scratch exclusion now have regressions. This is harness
readiness, not a compiler or AI-cost win. Before provider calls, freeze a separate
three-way protocol and explicitly address Astro checker's TypeScript 6.0.3 versus
the existing 7.0.2 comparator pins. Existing five-task protocols/scores remain
unchanged; incomplete task coverage must never yield an aggregate ranking.

Offline continuation after R16: the browser utility's default AX observation
omits static text entries only when their entire name is already in returned
body text, with an explicit omission count. Named controls/structure and full
live targeting remain. Two unchanged real command replays retain fourteen text
checks and cut response bytes 51.82%/50.85%; this is a filtered observation
summary, not complete AX-tree preservation or measured AI-token savings. No
provider call, scorer change, historical rescoring or new runtime occurs.

Latest bounded cost experiment: **R16 (2026-09-11)** completes ten serial CONTENT
attempts with the identical R15 application package and symmetrically updated
role-only browser tooling. Kudzu succeeds 5/5 and React 4/5; all final outputs
pass acceptance, but React ordinal 0 exceeds the file-read budget. Failure-inclusive
tokens per accepted task are 319,211.8 versus 279,643.5: Kudzu remains 14.15%
higher. No agent uses the optional role-only form (0/10), so the offline repair
avoidance is not realized in model behavior. Preserve these costs and the five
exact-name failures; do not relax supplied names, budgets or historic scores.
The full-suite/1.0 gate remains blocked. See `PERFORMANCE.md` and the immutable
input copies under `test-results/ai-delivery-production/role-only-r16-20260911/`.

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

Published release evidence complete. The maintained project application adds one
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

Validation evidence is complete and the packet closed without consuming a release
because no production compiler or runtime changed. The maintained
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

Release transaction complete at commit
`2dd5c409d3553cdf0b04080f1ba7c39b4541c523` and immutable tag `v0.15.1`.
CI run `33069675599` passed both jobs. The GitHub release is
[`v0.15.1`](https://github.com/kudzujs/kudzu/releases/tag/v0.15.1), and publish
workflow run `33071439012` published and verified `@kudzujs/core@0.15.1` and
`create-kudzu@0.1.126`. A fresh registry install imported `useId()` from core
and confirmed both exact package versions. The first publish attempt stopped at
the existing concurrent Chrome timing gate before any publish step; the exact
same immutable tag passed on the release-event retry.

### `0.15.2`: Toast And Notification Ownership

- **Purpose:** provide application feedback across route mutations.
- **Expected boundary:** layout state, keyed list, timer effects, and live region.
- **Acceptance:** queue, deduplication, timeout, pause/focus behavior if required,
  dismissal, route persistence, announcement, and disposal.
- **Stop condition:** a global scheduler is added before ordinary composition is
  shown insufficient.
- **Done condition:** notifications remain owner-bounded and absent from unused
  route output.

**Result:** closed by ordinary layout composition. The maintained project
application now owns one deduplicated notification queue in layout state, renders
keyed rows in a native polite live region, and uses one cleanup-owned sequential
timeout plus explicit dismissal. Required Chrome preserves the live-region and
row identities through enhanced route replacement, proves timeout removal and
disposal, and keeps `/help` at zero JavaScript. The 45-file deploy totals 193,770
raw / 60,227 aggregate gzip bytes. No scheduler, primitive, runtime concept, or
production source changed, so no release was consumed.

### `0.15.3`: Layer Owner Decision

- **Purpose:** decide whether logical ownership of DOM rendered outside its
  authored range is necessary.
- **Acceptance:** three independent overlay fixtures fail native top-layer and
  in-place composition for the same reason.
- **Stop condition:** the request is React Portal source compatibility alone.
- **Done condition:** no new concept is added, or a minimal owner edge with exact
  cleanup/focus order is approved.

**Result:** closed with no owner edge. Native dialog and Popover already satisfy
modal and non-modal top-layer behavior, while maintained dropdown, tooltip,
notification, and menu fixtures compose in their authored ranges. Zero fixtures
fail because DOM must render outside its authored range, below the required three
independent failures. Portal source compatibility alone remains insufficient;
no production source or release changed.

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

**Result:** closed through existing effect ownership. A real Typed.js instance
creates DOM from one attached host ref, replaces on application-state dependency
change, disposes on conditional/document release, and remounts fresh. The package
is absent from the complete zero-JavaScript static sibling. No compiler, IR,
runtime concept, or production source changed, so no release was consumed.

### `0.16.1`: Real Editor Lifecycle

- **Purpose:** integrate one real CodeMirror-class editor.
- **Acceptance:** mount, initial value, application-state update, editor-to-state
  update, dependency changes, route disposal, remount, errors, and accessibility.
- **Stop condition:** preserving the React wrapper requires a React island.
- **Done condition:** the native package owns its DOM and Kudzu owns only its
  bounded lifecycle.

**Result:** complete. The Apache Answer-derived CodeMirror fixture exposes the
first real retained-instance failure: an unattached `useRef(null)` shared by one
mount/cleanup effect and a later dependency update effect was incorrectly treated
as a DOM ref. Kudzu now lowers exactly one proven retained handle to existing
owner-scoped object state. Required Chrome proves initial value, retained
application updates, editor-to-state updates, package-error recovery, accessible
textbox naming, conditional disposal, fresh remount, and document disposal. The
fixture emits 214,968 raw / 71,607 aggregate gzip JavaScript bytes while its
static sibling emits zero. One existing normalization pass grows; semantic
concepts, IR kinds, runtime concepts, runtime files, and public APIs remain
unchanged.

### `0.16.2`: Chart And Map Lifecycle

- **Purpose:** validate the same contract against unrelated canvas/SVG/map DOM.
- **Acceptance:** resize/data update, listener/source cleanup, route transition,
  retained instance where required, and asset exclusion.
- **Stop condition:** package-specific concepts enter generic IR/runtime.
- **Done condition:** one lifecycle model covers editor and chart/map evidence.

**Result:** closed through the `0.16.1` retained-instance contract. A reduced
Mattermost Chart.js doughnut chart first reproduced the existing diagnostic when
its dependency effect both created and updated the retained instance. Moving
acquisition, resize-listener registration, and exact destroy/reset cleanup into
one mount effect leaves later data effects read-only and lowers the handle to the
same owner-scoped object state used by CodeMirror. Required Chrome proves initial
drawing, retained data and resize updates, listener removal, enhanced route
disposal, fresh remount, accessibility, and package exclusion from the static
sibling. The interactive graph is 208,686 raw / 73,312 aggregate gzip bytes
across six JavaScript files; the static sibling emits zero. Semantic primitives,
IR kinds, compiler passes, core/compiler LOC, normalization rules, runtime
concepts, runtime files, and public APIs change by zero. One positive fixture and
one browser contract were added. The maintained Worker/effect benchmark remains
907 raw / 477 gzip bytes for the Worker graph and 14,456 raw / 6,159 gzip bytes
for the window graph; its seven-run Linux median was 2,464.9 ms, recorded without
a timing comparison because the host differs from the published baseline. No
production source changed, so no release was consumed.

### `0.16.3`: Grid And Drag/Drop Decision

- **Purpose:** test external data-grid or drag engine ownership against keyed
  Kudzu state.
- **Acceptance:** keyboard equivalent, reorder/mutation, state synchronization,
  package disposal, and failure recovery.
- **Stop condition:** two independent renderers attempt to own the same DOM.
- **Done condition:** either bounded ownership is proven or the package is
  explicitly unsupported with a migration path.

**Result:** complete through existing keyed state and effect ownership. A
THRM-derived SortableJS fixture reproduced one compiler failure because the
browser `HTMLElement` constructor was classified as an effect capture and then
evaluated during the Node build. Adding that platform constructor to the
existing browser-global set fixes the shared root cause while lexical shadowing
remains covered. During a gesture SortableJS may move DOM temporarily, but its
`onEnd` callback restores authored order before one immutable state reorder;
Kudzu's keyed reconciler remains the durable DOM owner and preserves retained
row and input identity. The same state operation provides keyboard movement and
reset, while invalid package indexes restore DOM without changing state.
Required Chrome proves drag and keyboard reorder, state synchronization,
identity, invalid-input recovery, conditional/document disposal, and fresh
remount. The interactive graph is 72,251 raw / 26,603 aggregate gzip bytes
across ten JavaScript files; the static sibling emits zero. Its normalized
deploy archive SHA-256 is
`a55c18e14ba29df3f1f8ccdc7bcae936092508a01d05abdb887417e6fffb2ecf`.
Semantic primitives, IR kinds, compiler passes, normalization rules, runtime
concepts, runtime files, drag/drop abstractions, and public APIs change by zero;
one existing compiler lookup gains one token. One positive fixture, one browser
contract, and one browser-global shadowing case were added. The maintained
Worker/effect benchmark remains 907 raw / 477 gzip bytes for the Worker graph
and 14,456 raw / 6,159 gzip bytes for the window graph; its seven-run Linux
median was 999.7 ms, recorded without a timing comparison because the host
differs from the published baseline.

### `0.16.4`: GSAP Animation Lifecycle

- **Purpose:** validate one real GSAP landing-page animation against existing
  DOM-ref and effect ownership.
- **Expected boundary:** one owned effect and native reduced-motion behavior;
  no animation IR or scheduler runtime.
- **Acceptance:** mount, deterministic static fallback, scoped targets,
  prefers-reduced-motion behavior, dependency update where required, route and
  conditional disposal, fresh remount, and static sibling asset exclusion.
- **Stop condition:** package timelines compete with Kudzu for durable DOM
  structure or require a retained component renderer.
- **Done condition:** GSAP owns only bounded presentation changes and exact
  cleanup while Kudzu retains document structure and lifetime ownership.

**Result:** complete. A reduction of the MIT-licensed
Magic Modal landing page at revision
`ab3df864de5b01d604d26345165ea5f7900eae14` reproduced one compiler failure:
GSAP's root-scoped `context()` receives an inline callback whose direct package
calls were rejected because package-reference validation stopped at the nearest
function. The existing ancestry check now accepts only an unbroken chain of
inline call arguments back to the owned effect; named, local, and imported helper
indirection remains rejected. Required Chrome proves deterministic visible HTML,
root-scoped presentation, native reduced-motion fallback without residual inline
opacity/transform, dependency replacement with retained DOM identity,
conditional and enhanced-route disposal, and fresh remount. GSAP owns only
bounded opacity and transform changes; Kudzu retains structural DOM and lifetime
ownership. The interactive graph is 94,110 raw / 37,819 aggregate gzip bytes
across eight JavaScript files; the static sibling emits zero. Its normalized
deploy archive SHA-256 is
`2b6467f04452c51878ea81d5e80db21c60286e191e1e49ac482556dbf7c713c3`.
Semantic primitives, IR kinds, compiler passes, normalization rules, runtime
concepts, runtime files, animation abstractions, schedulers, and public APIs
change by zero; one existing compiler ancestry helper shrinks by two LOC. One
positive fixture and one two-scenario browser contract were added. The maintained
Worker/effect benchmark remains 907 raw / 477 gzip bytes for the Worker graph and
14,456 raw / 6,159 gzip bytes for the window graph; its seven-run Linux median was
625.9 ms, recorded without a timing comparison because the host differs from the
published baseline.

### `0.16.5`: Endurance Harness

- **Purpose:** make long-session correctness locally reproducible.
- **Expected files:** a dedicated browser soak harness and machine-readable heap,
  listener, resource, DOM, and navigation counters.
- **Acceptance:** repeated route, conditional, keyed, dialog, and editor cycles;
  raw traces are retained.
- **Stop condition:** only a short synthetic timing loop is measured.
- **Done condition:** failures identify the owner that retained memory or work.

**Result:** closed through existing document, route, conditional, keyed, and
effect ownership. A dedicated application fixture repeatedly opens and closes a
native dialog, removes and recreates keyed row state, conditionally disposes and
remounts a real CodeMirror editor, and navigates to a canonical released route.
The standalone Chrome harness keeps one browser profile alive, runs five warm-up
and 30 measured cycles by default, forces GC only before five-cycle checkpoints,
and retains machine-readable `samples.jsonl`, `summary.json`, and
`environment.json` artifacts under the ignored `test-results/endurance/` path.
The required default run completed 71 enhanced navigations with 71 editor mounts
and 71 disposals. Every released checkpoint had zero active editors, dialogs,
and keyed rows, 29 route elements, six documents, 141 DOM nodes, and seven event
listeners. Forced-GC heap moved from 1,820,132 to 2,005,572 bytes, below the
larger of the declared 2 MiB or 15% observation alarm. A deterministic failure
reports `route:/plain` and the mismatched counters; browser exceptions and failed
requests are retained with the same owner. The interactive route graph is
242,928 raw / 81,792 aggregate gzip bytes across 11 JavaScript files. Semantic
primitives, IR kinds, compiler passes, core/compiler LOC, runtime concepts,
runtime files, and public APIs change by zero; one test fixture and one browser
harness were added. This evidence changed no production source by itself and was
published with the later stale-prefetch fix in the actual `0.16.5` patch.

Release transaction complete at commit
`f23db7403060df7615b684f3a4a39781e600ed23` and immutable tag `v0.16.5`.
CI run `33235364419` passed Node 22, required-Chrome Node 24, and the Cloudflare
deployment. The GitHub release is
[`v0.16.5`](https://github.com/kudzujs/kudzu/releases/tag/v0.16.5), and publish
workflow run `33235705347` published and verified `@kudzujs/core@0.16.5` and
`create-kudzu@0.1.130`. A fresh registry-only install imported core, confirmed
both exact package versions, generated a two-route application, and passed its
TypeScript and production build check.

## `0.17.x`: Long-Lived Applications

### `0.17.0`: WebSocket Application Journey

- **Purpose:** move from isolated fake socket ownership to project notifications.
- **Acceptance:** connect, message, keyed update, reconnect, stale socket
  rejection, route/layout lifetime, offline/error state, and exact cleanup.
- **Stop condition:** a shared transport runtime is added for one consumer.
- **Done condition:** repeated navigation balances every listener, timer, and
  socket handle.

**Result:** closed through existing layout state, `EffectIR`, keyed-list, and
enhanced-navigation ownership. The first project-application browser extension
failed at `websocket-connect`; one inline layout effect now owns a native
WebSocket, four socket listeners, native online/offline listeners, generation
and socket-identity stale guards, and one 50 ms reconnect timer. Incoming
snapshots are validated before replacing the existing notification array, so a
same-key server update retains its DOM node and live-region ownership. Required
Chrome proves connect, message, keyed update, visible error, reconnect, stale
message/error rejection, offline cancellation, online recovery, and eight
list/detail enhanced transitions with one retained layout socket. The journey
creates three sockets total; while connected it has one active socket, four
socket listeners, and two online/offline listeners. Of two reconnect timers,
one fires and one is cleared. Final document disposal leaves zero active sockets,
socket listeners, window listeners, and reconnect timers, and repeated disposal
changes no counter. The project deploy grows by 2,908 raw / 652 aggregate gzip
bytes; the list-route JavaScript graph grows by 1,755 raw / 460 aggregate gzip
bytes, while `/help` remains zero JavaScript. Semantic primitives, IR kinds,
compiler passes, core/compiler LOC, runtime concepts, runtime files, transport
abstractions, and public APIs change by zero; one existing application fixture
and one browser scenario grow. The maintained Worker/effect graph remains 907
raw / 477 gzip bytes for Worker and 14,456 raw / 6,159 gzip bytes for window;
its seven-run Linux median was 605.6 ms. No production source changed, so no
release was consumed.

### `0.17.1`: Shared SSE/Transport Decision

- **Purpose:** test multiple independently mounted consumers, replay, and
  reconnect against existing layout effects/shared state.
- **Acceptance:** subscription add/remove, one transport, replay ordering,
  reconnect, consumer removal, final close, and bounded history.
- **Stop condition:** fewer than three independent applications require the same
  shared transport semantics.
- **Done condition:** existing composition passes or a minimal transport owner is
  architecture-approved.

**Result:** closed by the stop condition with zero qualifying applications.
Mattermost and Twenty remain external research candidates, but neither has a
repository-owned reduction proving the complete shared-consumer, ordered replay,
reconnect, independent removal, final close, and bounded-history contract. The
project application has one layout consumer; all Lupin reductions belong to one
application and each owns its socket in one page effect; the route WebSocket,
navigation telemetry, Worker dashboard, Memos audit, and development EventSource
also lack the complete shared transport shape. Existing layout state and
independent `EffectIR` owners remain authoritative. Semantic primitives, IR
kinds, compiler passes, core/compiler LOC, runtime concepts, runtime files,
fixtures, browser bytes, and public APIs change by zero. No production source
changed, so no release was consumed.

### `0.17.2`: Memory And Disposal Gate

- **Purpose:** close document/layout/route/range/external-instance memory risks.
- **Acceptance:** long repeated journeys show bounded heap, DOM, prefetch cache,
  resource handles, listener counts, and state maps.
- **Stop condition:** undocumented browser GC timing is presented as exact proof.
- **Done condition:** retained growth has a declared bound and repeated samples
  pass the agreed threshold.

**Result:** complete with one navigation-cache ownership fix. A deterministic
race holds unique prefetched documents, starts navigation to each, commits a
canonical route that prunes them, and then releases the stale responses. Before
the fix, five races left `browserState.size` at zero but increased CDP documents
from 8 to 16 under owner `navigation:documents`: stale `navigate()` calls wrote
their parsed documents back into the cache before checking the navigation
revision. `navigation-runtime.js` now checks revision before the existing cache
write; no cache type, LRU, cancellation registry, or public instrumentation was
added. The default gate batches ten races within browser connection limits, then
runs 30 route, conditional, keyed, dialog, and editor cycles in one Chrome
profile. Across 101 navigations, baseline/final documents remain 8, browser state
entries 0, DOM nodes 174, listeners 7, and editor mounts/disposals 71/71. Forced-
GC heap moves from 1,826,244 to 2,022,160 bytes, below the declared larger-of-2-
MiB-or-15% alarm. Semantic primitives, IR kinds, compiler passes, runtime
concepts, runtime files, cache abstractions, and public APIs change by zero; one
production runtime reorders one existing statement with zero LOC growth. The
maintained Worker graph remains 907 raw / 477 gzip bytes and the window graph
remains 14,456 raw bytes with gzip moving from 6,159 to 6,160 bytes; its seven-
run Linux median was 795.3 ms, recorded without a timing comparison because the
host load differs. One endurance fixture and browser gate grow, while static
routes remain zero JavaScript. This packet ships as the actual `0.16.5` patch to
retain the public `0.16.x` version line.

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

**Result:** closed by the existing RouteBuildRecord and artifact report. A
test-only collector builds the greenfield project, real CodeMirror editor, four
separate Apache Answer reductions, and Memos outline reduction: seven fixtures
and 25 routes total. It joins each route's source page to HTML, runtime entries
and requirements, handler entries/chunks, Worker entries/chunks, and styles,
then records exact raw/gzip bytes and SHA-256 values. Every generated JavaScript
file has at least one route owner, every direct module script has one matching
`modulepreload`, and every static control owns zero JavaScript and zero preload.
No measured fixture emits a shared chunk.

The greenfield deploy is 45 files and 196,678 raw / 60,880 aggregate gzip
bytes. Its project routes own 38,652-69,178 raw JavaScript bytes; `/login` owns
12,093 raw bytes and `/help` owns zero. The editor route owns 214,968 raw /
71,607 gzip bytes, including its 200,260 raw / 64,949 gzip CodeMirror handler;
its static sibling owns zero. The Answer question reduction owns 32,022 raw /
12,408 gzip bytes. Its route-shell static pages own zero while the two runtime
parameter pages own 2,134 and 2,078 raw bytes. Answer auth routes own 25,684 and
26,818 raw bytes with a zero-byte public sibling; authoring/admin routes own
12,251 and 20,919 raw bytes with a zero-byte legal sibling. The Memos outline
owns 14,701 raw / 7,044 gzip bytes and its static sibling owns zero.

Current navigation prefetch remains structurally bounded: eligible same-origin
group links prefetch on hover, focus, viewport proximity, or idle fallback;
promises deduplicate, failures leave the cache, current/eligible URLs define the
retained set, and the `0.16.5` revision check rejects stale navigation results
before cache insertion. The report intentionally records emitted closure rather
than esbuild input-byte attribution. Answer and Memos remain disconnected
reductions, not whole-application claims. Semantic primitives, IR kinds,
compiler passes, production compiler/runtime LOC, runtime concepts/files, and
public APIs change by zero. No release is consumed.

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

**Completion evidence:** one direct literal bare-package `import()` may remain
inside an inline synchronous effect when its first statement is the exact
dependency-state guard `if (!state) return`. The source graph, descriptor
session, ModuleIR validation, build-module erasure, esbuild split graph, and
route artifact report preserve that edge without adding a loader. Relative,
URL, render-time, event, indirect, async-effect, unguarded, and multiple dynamic
imports remain rejected. Failed native ESM evaluation remains visible through
application-owned error state; same-document retry of the failed URL is not
claimed because the browser module map cannot be reset without adding the
loader forbidden by this packet.

The CodeMirror-derived fixture initially requests no deferred chunk. Activation
requests one chunk, mounts the editor, and owner release destroys it. Remount
uses the browser module map without another request, and document disposal
balances the second mount. The initial eager graph is 12,982 raw / 6,153 gzip
bytes versus 214,968 raw / 71,607 gzip bytes for the existing eager editor;
250,086 raw / 80,890 gzip bytes move to the deferred graph. Initial gzip falls
by 65,454 bytes (91.4%), while the static sibling remains 0 B JavaScript.

The packet adds no semantic primitive, compiler pass, public API, browser
runtime concept/file, React, VDOM, hydration, retained component tree, or retry
cache. It adds one validated `ImportIR` kind and additive
`handlers.lazyChunks` reporting. Production compiler sources change by 76 added
and 11 removed lines. The artifact collector now covers eight fixtures and 27
routes with no ownerless JavaScript or preload mismatch. `npm run check`, 284
required-Chrome tests, package smoke, and the maintained benchmark pass. The
Worker graph remains 907 raw / 477 gzip bytes; the window graph remains 14,456
raw / 6,160 gzip bytes, with a seven-build median of 222.8 ms. This packet ships
as the actual `0.16.6` patch to retain the public `0.16.x` version line.

### `0.18.2`: Lazy Editor Journey

- **Purpose:** apply `0.18.1` to the real editor.
- **Acceptance:** editor package absent before activation, loaded once on demand,
  mount/update/dispose behavior unchanged, failure recoverable, and revisit
  semantics explicit.
- **Stop condition:** package evaluation must occur during build rendering.
- **Done condition:** initial route bytes fall by the exact deferred package
  graph without losing behavior.

**Completion evidence:** a real retained CodeMirror editor now begins closed and
uses the `0.18.1` guarded literal package edge for its mount. The existing
effect-private-ref normalization recognizes its one direct `.then()` assignment
as the retained setup write, lowers the handle to owner-scoped state, and leaves
later value effects read-only. Indirect callbacks, repeated writes, attached
refs, update-effect writes, missing null-reset cleanup, and broader dynamic
imports retain diagnostics. Package evaluation remains entirely in browser
effect ESM.

Required Chrome records zero chunk requests before activation and one afterward.
It proves initial content and accessible name, application-to-editor and
editor-to-application updates, retained DOM identity, authored update failure
and recovery, exact conditional disposal, fresh `Alpha` state on remount, no
second package request, and final document disposal. Native ESM evaluation
failure retry remains outside this packet as recorded in `0.18.1`.

The eager editor owns 214,968 raw / 71,607 gzip bytes. The lazy retained editor
initially owns 15,896 raw / 7,230 gzip bytes and defers 250,086 raw / 80,890 gzip
bytes, reducing initial gzip by 64,377 bytes (89.9%). Its static sibling remains
0 B JavaScript. The artifact collector covers nine fixtures and 29 routes with
no ownerless JavaScript or preload mismatch.

The packet adds no semantic primitive, IR kind, compiler pass, public API,
browser runtime concept/file, loader, resource registry, or widget runtime. One
existing normalization pass changes by 15 added and four removed production
lines. `npm run check`, 285 required-Chrome tests, package smoke, and the
maintained benchmark pass. Worker and window graphs remain 907 raw / 477 gzip
and 14,456 raw / 6,160 gzip bytes; the seven-build median is 230.5 ms. This
packet ships as the actual `0.16.7` patch to retain the public `0.16.x` line.

### `0.18.3`: Shared Chunks And Prefetch Policy

- **Purpose:** avoid duplicate large feature graphs and define optional preload.
- **Acceptance:** shared chunk ownership, no duplicate fetch, route/interaction
  prefetch policy, cache bound, cancellation limits, and output report.
- **Stop condition:** all features are globally prefetched.
- **Done condition:** policy minimizes unused transfer while meeting accepted
  interaction latency.

**Completion evidence:** two enhanced-navigation route owners now use one
deferred CodeMirror graph. Existing multi-entry esbuild splitting emits one
250,086 raw / 80,890 gzip byte chunk, and the existing artifact report records
that exact lazy path as shared by `/` and `/second`. Their eager graphs remain
21,599 raw / 9,466 gzip and 21,609 raw / 9,468 gzip bytes. Neither route HTML
preloads the deferred chunk, navigation document prefetch does not request it,
and the static sibling remains complete HTML with 0 B JavaScript.

Required Chrome proves zero requests before interaction, one request when the
first owner activates, exact disposal, no route-triggered request, and no second
request when the second owner activates. The selected policy is therefore no
optional package preload: interaction calls native `import()` immediately, the
browser module map deduplicates it for the document lifetime, and Kudzu owns no
additional cache. Native ESM imports cannot be cancelled after request; owner
cleanup invalidates the callback and prevents a late mount rather than claiming
network cancellation.

The released lazy-import gate is also hardened before closing the packet.
`ownedLazyPackageImport()` now resolves the callback callee through the existing
lexical binding index and accepts only named `useEffect` imports from React or
Kudzu. A local function with the same text can no longer bypass the ordinary
dynamic-import diagnostic. The packet adds no semantic primitive, IR kind,
compiler pass, public API, runtime concept/file, loader, prefetch registry, or
cache. Four existing compiler files change by 17 added and eight removed lines.
The artifact collector covers ten fixtures and 32 routes. `npm run check`, 288
required-Chrome tests, package smoke, and the maintained benchmark pass. Worker
and window graphs remain 907 raw / 477 gzip and 14,456 raw / 6,160 gzip bytes;
the loaded Linux host records a 696.6 ms seven-build median without a timing
comparison. This packet ships as the actual `0.16.8` patch to retain the public
`0.16.x` line.

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

Implementation and release-candidate evidence complete. One internal registry
now owns package identities and classifies original reachable import, re-export,
and literal dynamic-import sites before normalization. The deterministic
`.kudzu/kudzu-compatibility.json` report records package/API identity, stable
rule, Native, Compiled, Normalized, Adapter, Owned External UI, Partial, or
Unsupported treatment, and exact authored line/column range. Type-only,
relative, Node, Kudzu-first-party, and unreachable source stays outside the
inventory.

React Router, React Bootstrap, Zustand, React migration, browser-signal, `clsx`,
and i18next recognition reuse the registry's package identities. Focused tests
cover all seven classes, aliases, exact ranges, deterministic ordering, and a
real build where an unreachable unsupported module is excluded. Existing
project output baselines and package diagnostics remain green. Package origin
does not enter SourceResult, ComponentAnalysis, ModuleIR, RouteIR, codegen,
runtime files, `afterBuild()`, or deploy output.

The slice adds zero semantic primitives, IR kinds, compiler passes,
normalization entries, runtime concepts/files, browser bytes, or public APIs.
Production compiler/orchestration changes are 161 added and 13 removed lines,
including the 141-line registry, for +148 net compatibility/build lines and zero
core semantic LOC. `npm run check`, 290 required-Chrome tests, package smoke,
and the maintained benchmark pass. Worker and window graphs remain 907 raw /
477 gzip and 14,456 raw / 6,160 gzip bytes; seven clean Linux x64 builds record
a 532.6 ms median without a timing comparison. This packet ships as the actual
`0.16.9` patch, with `create-kudzu@0.1.134`, to retain the public
`0.16.x` line.

### `0.19.1`: Apache Answer Authentication Journey

- **Purpose:** promote the existing build-only auth fixture to browser evidence.
- **Acceptance:** anonymous, invalid login, valid login, token restore, shared
  header/settings, 401 clear, replacement navigation, public zero-JS sibling.
- **Stop condition:** client UI is treated as authorization.
- **Done condition:** the complete journey passes against a deterministic server.

Complete. The existing Apache Answer reduction now runs one required-Chrome
journey against a deterministic native server. It proves anonymous startup,
invalid and valid native form submission, token persistence and reload restore,
layout-owned header/settings reads, a server 401 clearing storage and shared
state, and replacement navigation back to the anonymous login document. The
public sibling remains complete HTML with zero JavaScript.

No authored fixture, compiler, IR, runtime, or deploy artifact changed. The
packet adds one browser harness only: zero semantic primitives, ModuleIR kinds,
passes, normalization entries, runtime concepts, public APIs, and browser bytes.
The authentication fixture remains 17 deploy files and 36,441 raw / 15,598 gzip
bytes; `/` owns 25,684 raw / 11,372 gzip bytes, `/settings` owns 26,818 raw /
11,319 gzip bytes, and `/public` owns 0 JavaScript bytes. Worker and window
graphs remain 907 raw / 477 gzip and 14,456 raw / 6,160 gzip bytes; seven clean
Linux x64 builds record a 674.7 ms median without a timing comparison. This
packet ships as the actual `0.16.10` patch, with `create-kudzu@0.1.135`, to
retain the public `0.16.x` line.

### `0.19.2`: Apache Answer Connected Authoring Journey

- **Purpose:** connect query, route, detail, create/edit, validation, mutation,
  refresh, admin, and logout.
- **Acceptance:** behavior, accessibility, persistence, errors, navigation,
  source retention, and output all pass.
- **Stop condition:** fixture-only compiler semantics or broad package runtime is
  introduced.
- **Done condition:** this is a connected browser journey, not a whole-app claim.

Complete. One Apache Answer-derived fixture now connects invalid and valid login,
layout-shared authentication, page/order query loading, explicit refresh, native
creation with server validation and retained draft, runtime detail routing,
editing, reload persistence, keyed administration, delete-and-refetch, and
logout against one deterministic server. Native controls and status/alert
regions preserve the accessibility boundary, every retained source file is
checked, and the public sibling remains complete HTML with zero JavaScript.

The packet reuses existing Zustand normalization, search signals, dependency
effects, runtime parameters, native handlers, bindings, keyed ownership, and
enhanced navigation. It adds zero semantic primitives, ModuleIR kinds, compiler
passes or core LOC, runtime concepts, package adapters, and public APIs. The new
fixture emits 33 deploy files and 88,198 raw / 33,173 gzip bytes; `/` owns 27,196
raw / 11,968 gzip bytes, `/questions` owns 51,577 raw / 19,801 gzip bytes,
`/questions/add` owns 27,109 raw / 11,893 gzip bytes, runtime detail owns 32,783
raw / 14,056 gzip bytes, admin owns 50,861 raw / 19,426 gzip bytes, and `/public`
owns zero JavaScript. Worker and window graphs remain 907 raw / 477 gzip and
14,456 raw / 6,160 gzip bytes; seven clean Linux x64 builds record a 640.5 ms
median without a timing comparison. No production logic changed, so the public
version remains `0.16.10` and no release is consumed.

### `0.19.3`: Memos Feed And CRUD Journey

- **Purpose:** establish the first durable Memos application slice.
- **Acceptance:** login, loading/error, feed, pagination, create/edit/delete,
  retained memo identity, refresh, and logout.
- **Stop condition:** outline-only or static feed output is presented as Memos
  migration.
- **Done condition:** pinned upstream provenance and exact retained source are
  recorded.

Complete. A fixture pinned to Memos revision
`e5ed6e7ec60e141d6e354f3ab59906c2c47dccac` now runs invalid and valid login,
initial loading, a server pagination failure, explicit recovery, overlapping-key
pagination, create, edit, delete, reload persistence, and logout against one
deterministic server. The retained memo row keeps DOM identity through the
failed request, successful pagination, and every CRUD refetch. Native labels,
status and alert regions preserve the accessibility boundary, every authored
source file is retained, and the public sibling emits zero JavaScript.

The packet reuses existing Zustand normalization, dependency effects, keyed
ownership, native forms and handlers, and enhanced navigation. It adds zero
semantic primitives, ModuleIR kinds, compiler passes or core LOC, runtime
concepts, package adapters, and public APIs. The fixture emits 19 deploy files
and 56,167 raw / 21,634 gzip bytes; `/` owns 25,856 raw / 11,396 gzip bytes,
`/feed` owns 45,690 raw / 17,836 gzip bytes, and `/public` owns zero JavaScript.
Worker and window graphs remain 907 raw / 477 gzip and 14,456 raw / 6,160 gzip
bytes; seven clean Linux x64 builds record a 761.8 ms median without a timing
comparison. No production logic changed, so the public version remains
`0.16.10` and no release is consumed.

### `0.19.4`: Memos Realtime Journey

- **Purpose:** add reaction and realtime refresh using the accepted long-lived
  transport model.
- **Acceptance:** mutation, server event, deduplication, reconnect, stale event
  rejection, route cleanup, and memory gate.
- **Stop condition:** a query or SSE package runtime is copied wholesale.
- **Done condition:** browser and endurance acceptance pass.

Complete. The connected Memos fixture now adds a native reaction mutation and
an effect-owned WebSocket that refreshes the keyed feed from versioned server
events. Required Chrome proves duplicate and stale version rejection, old-socket
callback rejection after reconnect, retained memo DOM identity, exact route
cleanup, and fresh ownership after re-entry and reload. Active sockets,
listeners, and reconnect timers remain bounded and return to zero after each
owner release. The public sibling remains complete HTML with zero JavaScript.

The packet reuses existing native handlers, keyed ownership, effect-private
lifecycle, invalidation, timers, and route release. It adds zero semantic
primitives, ModuleIR kinds, compiler passes or core LOC, runtime concepts,
normalization or adapter rules, and public APIs. The fixture emits 19 deploy
files and 57,811 raw / 22,069 gzip bytes; `/` owns 25,856 raw / 11,396 gzip
bytes, `/feed` owns 46,740 raw / 18,184 gzip bytes, and `/public` owns zero
JavaScript. Worker and window graphs remain 907 raw / 477 gzip and 14,456 raw /
6,160 gzip bytes; seven clean Linux x64 builds record a 620.7 ms median without
a timing comparison. Browser-disabled tests pass 292/292, required-Chrome
focused acceptance, package smoke, and artifact accounting pass. No production
logic changed, so the public version remains `0.16.10` and no release is
consumed.

### `0.19.5`: Actual Budget Intake Decision

- **Purpose:** determine whether a complete, legally and technically usable
  workspace can become the third application proof.
- **Acceptance:** pinned source, install/build path, dependency inventory, first
  executable user journey, and honest source-retention denominator.
- **Stop condition:** workspace dependencies or core packages remain absent.
- **Done condition:** a later packet is authorized, or deferral is recorded with
  no compatibility claim.

Deferred by the stop condition. The pinned MIT revision
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a` remains only a sparse desktop-client
acquisition: 810 TS/TSX modules, 163,344 LOC, and 80 route declarations without
the workspace tooling, component library, core backend, Yarn release, database,
worker coordinator, or spreadsheet implementation needed to install and run an
honest user journey. The prior static report probe is an exported report, not
Actual Budget, and its 22/906 retained-line result is not a whole-workspace
denominator. No later application packet, compatibility claim, compiler work,
runtime, package adapter, public API, version, or release is authorized. Intake
may resume only from a complete pinned workspace and executable dependency
graph.

## `0.20.x`: AI Tooling And Delivery Cost

### `0.20.0`: Structured Diagnostics

- **Purpose:** expose stable machine-readable errors from the existing compiler.
- **Acceptance:** version, code, stage, severity, source range, message,
  compatibility class, and safe suggestion; human diagnostics remain useful.
- **Stop condition:** diagnostic codes expose pass filenames or unstable IR.
- **Done condition:** agents no longer parse message substrings for maintained
  fixtures.

Complete. Authored
source failures now propagate as one versioned diagnostic envelope with stable
semantic code, stage, severity, project-relative source range, human message,
nullable compatibility class, and nullable safe suggestion. `kudzu build
--json` emits only that deterministic envelope for structured failures, while
ordinary builds and the development overlay retain readable source-located
messages. Unresolved imports and re-exports, unsupported dynamic imports,
TypeScript syntax errors, runtime-locale `react-i18next`, and keyed-row ref
initializers prove the maintained boundary without parsing message text.

The implementation centralizes 72 lines in `diagnostics.mjs`, reuses the
existing compatibility classification function, and normalizes paths only at
the project build boundary. It adds zero semantic primitives, ModuleIR kinds,
compiler passes, normalization entries, runtime concepts, browser modules, or
public application APIs. Production source is +111 net lines, including +8 in
the measured core semantic file set; the increase is compiler/tooling error
transport rather than semantic analysis. All representative deploy manifests
and hashes remain unchanged. Worker and window graphs remain 907 raw / 477 gzip
and 14,456 raw / 6,160 gzip bytes; seven clean Linux x64 release-candidate builds
record a 1,034.4 ms median without a timing comparison. `npm run check`, 293/293
browser-disabled and required-Chrome tests, focused CLI JSON tests, development error recovery, package smoke,
artifact accounting, and `git diff --check` pass. The packet ships as
`@kudzujs/core@0.16.11` with `create-kudzu@0.1.136`.

### `0.20.1`: `kudzu inspect --json`

- **Purpose:** expose reachable application and compatibility inventory.
- **Acceptance:** filtered module/route/package/capability/owner/blocker facts,
  deterministic order, schema version, and large-project context bound.
- **Stop condition:** the command builds a second analyzer or dumps full raw IR.
- **Done condition:** the first blocker can be selected without reading hundreds
  of source or dependency files.

Complete. `kudzu inspect --json` now runs the authoritative build and projects
the existing reachable source, compatibility, ComponentAnalysis, ModuleIR,
CapabilityIR, and route-artifact records into one versioned report. Modules,
routes, packages, compatibility sites, capability families, semantic owners,
and blockers sort before fixed section limits; totals and omitted counts keep
large-project context explicit. Unreachable source, generated code, HTML, raw
IR, captures, state values, and full artifact closures remain excluded.

One real CLI fixture proves reachable filtering, static and interactive route
facts, native package classification, state ownership, project-relative paths,
deterministic output, and structured blocked inventory. A synthetic 101-module
and 51-blocker check proves sort-before-truncation and first-blocker retention.
The implementation is one 154-line projection over existing records plus the
existing build/CLI seam; it adds no analyzer, semantic primitive, compiler pass,
normalization entry, runtime concept, or browser module. Representative deploy
manifests and hashes remain unchanged. Worker and window graphs remain 907 raw /
477 gzip and 14,456 raw / 6,160 gzip bytes; seven clean builds record a 648.7 ms
median without a timing comparison. Browser-disabled and required-Chrome suites
pass 295/295 tests, package smoke and artifact accounting pass, and the packet
ships as `@kudzujs/core@0.16.12` with `create-kudzu@0.1.137`.

### `0.20.2`: `kudzu explain --route`

- **Purpose:** trace one authored route to its selected browser artifacts.
- **Acceptance:** source site, normalization provenance, semantic owner,
  capability, entry/chunk/style/Worker, byte reason, and zero-JS explanation.
- **Stop condition:** a second artifact graph is introduced.
- **Done condition:** existing route records and artifact reports answer the
  query with bounded output.

Completed by `@kudzujs/core@0.16.13` and `create-kudzu@0.1.138`. The
`worker-effects` fixture proves exact configured-base lookup for an effect-owned
Worker route, authored source closure, `Dashboard` ownership, capability family,
runtime/handler/Worker byte reasons, raw/gzip totals, hashes, deterministic
output, structured missing-route diagnostics, and a static sibling with an empty
JavaScript closure. The implementation is one 137-line bounded projection over
existing source results, compatibility sites, route records, and the sole route
artifact report plus the existing build/CLI seam. It adds no analyzer, semantic
primitive, compiler pass, normalization entry, runtime concept, or browser
module. Representative deploy manifests and hashes remain unchanged. Worker and
window graphs remain 907 raw / 477 gzip and 14,456 raw / 6,160 gzip bytes; seven
clean builds record a 605 ms median without a timing comparison. Browser-disabled
and required-Chrome suites pass 296/296 tests, and package smoke and artifact
accounting pass. Fixed 100-record section limits expose totals and omitted counts;
the command requires one exact emitted route and intentionally excludes raw IR,
HTML, generated code, captures, and state values.

### `0.20.3`: Deterministic Normalize And Fix

- **Purpose:** automate only edits proven safe and useful by recorded AI trials.
- **Acceptance:** check/preview/write modes, exact ranges, idempotence, comments
  retained, no unrelated formatting, and byte-equivalent output.
- **Stop condition:** canonical compiler source replaces ordinary authored TSX.
- **Done condition:** each fix has one diagnostic code and explicit preconditions.

Deferred by the evidence gate without production changes or a release. A complete
repository inventory found no recorded model prompt, model/tool version, raw
attempt, correction cycle, token/cost trace, or repeated source edit proving any
automatic fix useful. Existing diagnostics offer migration guidance but do not
identify a uniquely safe edit; replacing a non-null ref initializer would change
authored behavior. The existing lazy-state-literal normalization could support a
narrow exact-range rewrite while preserving comments and output bytes, but no AI
trial records it as a correction or cost reduction. Adding check/preview/write
infrastructure now would therefore be speculative and violate the packet purpose.
Resume this packet only after `0.20.4` records a repeated correction with one
stable diagnostic code, a unique semantics-preserving replacement, and
compiler-proven preconditions. No fixture, analyzer, fix command, formatter,
compiler pass, runtime concept, browser module, package version, or release was
added.

### `0.20.4`: AI Delivery Protocol And Runner

- **Purpose:** track fair Kudzu and React+Vite delivery attempts.
- **Acceptance:** pinned model/tools/prompts/budgets, framework-neutral behavior
  suite, raw failures, token/cost/tool/file/build metrics, source retention, and
  browser artifacts.
- **Stop condition:** Kudzu receives private compiler guidance unavailable to the
  comparator.
- **Done condition:** every attempt is reproducible or fully attributable.

Completed by `@kudzujs/core@0.16.14` and `create-kudzu@0.1.139`. The
repository-owned Node standard-library runner pins the model revision, pricing,
tools, prompt, budgets, adapter, acceptance command, starter digests, optional
public context, and paired schedule before creating isolated workspaces. It
retains raw adapter/build/acceptance streams, final source, browser artifacts,
hashes, attribution, token/cost/tool/file/build metrics, source retention, and
both successful and failed attempts. The deterministic two-attempt-per-variant
fixture proves equal ordering, one retained failure per variant, independent
final builds, framework-neutral acceptance, and failure-inclusive cost per
success. It is protocol evidence only and makes no Kudzu versus React+Vite
delivery claim. No dependency, compiler pass, semantic primitive, runtime
concept, application API, or browser byte was added. Browser-disabled and
required-Chrome suites pass 297/297 tests, and package smoke passes.

### `0.20.5`: Tooling Cost Validation

- **Purpose:** prove that diagnostics/inspect/explain/fix lower total cost per
  successful task.
- **Acceptance:** before/after attempts on the same tasks; failures remain in the
  numerator; success behavior remains identical.
- **Stop condition:** token reduction comes from omitted behavior or hidden
  context.
- **Done condition:** useful tools are retained and non-improving tools are
  removed or deferred.

Measured on 2026-09-01 with five interleaved attempts per condition against one
Apache Answer-derived static Bootstrap correction. Both conditions passed 5/5
with identical accepted behavior, source retention, and browser artifacts, but
plain-build baseline cost 67,860 tokens per success while structured
build/inspect/explain cost 84,793. The structured bundle is therefore deferred
as an AI default rather than credited with a cost reduction. Existing JSON,
inspection, and explanation commands remain for their independently accepted
machine-readable contracts; no speculative `fix` command, compiler pass,
runtime concept, application API, dependency, or browser byte was added. Exact
samples, medians, and ranges are recorded in `PERFORMANCE.md`, while the pinned
protocol reproduces and retains raw attempt evidence under the ignored
`test-results/ai-delivery/` path.

## `0.21.x`: Production-Scale Proof

### `0.21.0`: Functional Parity Matrix

- **Purpose:** freeze complete greenfield, Answer, and Memos acceptance.
- **Acceptance:** content, auth, forms, CRUD, shared data, large list, overlay,
  editor, lazy load, realtime, errors, accessibility, and navigation pass.
- **Stop condition:** any build-only result is counted as application success.
- **Done condition:** every claimed capability has a browser journey and static
  exclusion control.

**Result:** closed through existing application semantics without a release.
The required-Chrome 300-test matrix passes content, authentication, forms, CRUD,
shared data, large lists, overlays, editor ownership, lazy loading, realtime,
errors, accessibility, and navigation across the maintained greenfield, Apache
Answer, Memos, and focused package fixtures. The one material matrix gap was the
10,000-item pagination decision: its release/remount behavior existed only in an
optional benchmark. One ordinary browser acceptance now proves Enter-key page
advance, focus retention, the 101-200 and restored 1-100 ranges, bounded 100-row
DOM, fresh off-range input state, and no browser exceptions. Greenfield `/help`,
Answer and Memos `/public`, package `/static` routes, and the complete direct
10,000-row route provide zero-JavaScript controls.

The artifact inventory now includes the large-list fixture: 19 files,
1,900,048 raw / 242,968 aggregate gzip bytes, deploy SHA-256
`1bbaf3479ac90f923deb469c73eb93c0dd7364e7fe906919b167f2f854deda70`.
Pagination owns 30,143 raw / 11,193 gzip bytes of existing JavaScript while the
direct static route owns zero. Semantic primitives, IR kinds, compiler passes,
production compiler/runtime LOC, normalization rules, adapters, runtime
concepts, public APIs, and browser artifacts change by zero. `npm run check`,
required-Chrome 300/300, package smoke, focused acceptance, and artifact
inventory pass. No production feature changed, so no release is consumed.

### `0.21.1`: Compiler And Route Scale

- **Purpose:** measure clean/incremental compilation and artifact emission.
- **Acceptance:** 100, 1,000, and separately provisioned 10,000 routes; module
  graph time, parse/normalize/compile/render/write time, peak RSS, output digest,
  and failure recovery.
- **Stop condition:** projected or incomplete 10,000-route data is called a pass.
- **Done condition:** repeated measurements and all material regressions are
  explained or fixed.

**Result:** opt-in internal telemetry records source reads, reachable
graph discovery, TypeScript parse, normalize, compile/transform, render, and
write boundaries without changing deploy output. Compile/transform excludes
the measured TypeScript parse and Kudzu normalization but includes indivisible
esbuild parse/transform for proven import-free modules. Render includes
provisional page materialization, write includes finalization and staged-output
promotion, and the end-to-end clean build is not their sum. The runner also proves that an
incremental source edit matches a clean build of the changed source, compares
paired incremental outputs when a baseline is supplied, names retained-session
rather than incremental-only peak RSS, and fails the process when either clean
or retained-session invalid-source recovery changes output. This adds no
semantic primitive, compiler pass, runtime concept, public API, deploy artifact,
or browser byte; production compiler/build instrumentation is 35 added and four
removed lines.

One warm-up and three fresh-process samples pass at 100 routes / 1,000 modules /
101,100 lines and 1,000 routes / 10,000 modules / 1,011,000 lines. Clean-build
medians are 7,444.3 and 77,515.9 ms with 672.3 and 3,182.3 MiB peak RSS;
incremental medians are 1,838.0 and 18,132.1 ms, recompiling exactly 10 modules
and rendering one page in every sample. Clean and changed digests differ,
incremental output equals a clean changed-source build, and clean and retained
failure probes preserve then recover the expected digest. Exact phase samples,
bytes, and digests are recorded in `PERFORMANCE.md`.

The full 10,000-route / 100,000-module / 10,110,000-line topology initially
exhausted a 10,240 MiB V8 heap because the canonical module cache retained about
90,000 complete TypeScript ASTs. A 1,024-record LRU bounds that existing cache
without changing stable position-based symbols. The identical topology then
completed under the same heap cap with 5,461.0 MiB clean-build RSS and 8,266.9
MiB retained-session peak RSS. It emits 10,000 files / 2,237,780 B with clean
digest `7a48bc40ff33c4faaef8a01ab90fcfe611a4bada5364a6fedca42f80ad5070d3`;
incremental output matches a clean changed-source build, recompiles 10 modules,
renders one page, and clean and retained recovery pass. One complete measured
run is retained after two diagnostic runs completed measured stages but exposed
cleanup and timeout defects; no projection or reduced topology is counted.
The memory fix adds eight net production lines, no semantic primitive, pass,
runtime concept, public API, deploy artifact, or browser byte.

### `0.21.2`: Browser Performance And Memory

- **Purpose:** protect interaction latency and long-running stability.
- **Acceptance:** initial/session bytes, list/range latency, navigation, lazy
  feature load, resource cleanup, repeated heap, detached DOM, cache, listeners,
  and handles.
- **Stop condition:** smaller JavaScript is preferred over behavior parity.
- **Done condition:** complete features meet declared thresholds with bounded
  long-session growth.

**Result:** closed through existing route artifacts, keyed ownership, enhanced
navigation, native ESM loading, and the released endurance harness. Seven fresh
Chrome profiles keep 2,000-row append, filter, restore, and reverse medians at
9.6, 17.6, 84.5, and 19.4 ms against a 100 ms median alarm. Project table save
and list-to-detail navigation medians are 0.9 and 4.9 ms against the same alarm;
the exact session graph owns 17 JavaScript files totaling 81,200 raw / 27,885
aggregate gzip bytes. The static 10,000-row document loads in a 999.8 ms median
against a 2,000 ms alarm. Pagination and windowing keep the DOM at 100 rows,
load in 163.1 and 251.7 ms against a 1,000 ms alarm, and change range in 18.1
and 23.7 ms against a 100 ms alarm.

The lazy editor retains 12,982 raw / 6,153 gzip eager bytes and one 250,086 raw
/ 80,890 gzip deferred CodeMirror chunk; two route owners share one native ESM
module request and the static sibling remains zero JavaScript. Focused Chrome
acceptance passes 3/3. The endurance gate passes five warm-ups, ten stale-
prefetch races, 30 ownership cycles, and 101 navigations: editor mounts and
disposals balance 71/71, browser state stays zero, documents and listeners stay
at six and seven, DOM nodes move by one, and forced-GC heap grows 79,988 B under
the existing 2 MiB or 15% alarm. No exception or failed request occurs. Three
existing benchmark entry points now fail when their declared median budgets are
exceeded; the artifact collector may name the current packet. Production source,
semantic primitives, compiler passes, runtime concepts, APIs, deploy artifacts,
and browser bytes change by zero. Exact samples and limitations are recorded in
`PERFORMANCE.md`; no package release is consumed.

### `0.21.3`: Package And Release Candidate

- **Purpose:** verify the exact candidate as an installed product.
- **Acceptance:** `npm run check`, `npm test`, required Chrome, focused
  benchmarks, package smoke, tarball inspection, generated application, registry
  dry run, docs, and release rollback procedure.
- **Stop condition:** version metadata changes before the exact candidate passes.
- **Done condition:** the reviewed commit is independently publishable.

**Result:** released as `@kudzujs/core@0.16.17` and
`create-kudzu@0.1.142`. The exact versioned tree passes `npm run check`, all 301
remaining tests after the application contract, package smoke, generator
creation, and both registry dry runs. Tarball inspection records the expected 85
core files and four generator files with no bundled dependencies. The Node 22
no-browser lane initially attempted the list acceptance despite
`KUDZU_SKIP_BROWSER`; that test now follows the existing skip contract while the
Node 24 required-Chrome lane retains the browser acceptance.

Seven fresh exact-candidate Chrome profiles pass every maintained alarm. The
project table-save/navigation medians are 0.7/3.6 ms; direct, pagination, and
window load medians are 849.2, 166.6, and 184.5 ms; bounded range medians are
13.0 and 19.7 ms. The keyed benchmark also passes all four 100 ms alarms. A
fresh endurance run balances editor mounts/disposals at 71/71 across 101
navigations, with zero document/listener growth, one additional DOM node, and
144,172 B forced-GC heap growth under the 2 MiB alarm. Package contents preserve
the existing production compiler/runtime and introduce no semantic primitive,
pass, runtime concept, API, deploy artifact, or browser byte. The immutable
rollback contract remains forward-only: a failed push, tag, publication, or
registry verification keeps this packet active; a published npm version or tag
is never moved and requires a forward-fix patch.

Commit `e9b33c04a7a2a382b858069910e4473800e7b70a`, tag `v0.16.17`, the
[GitHub release](https://github.com/kudzujs/kudzu/releases/tag/v0.16.17), and
[publish workflow](https://github.com/kudzujs/kudzu/actions/runs/33704726784)
are complete. npm exposes core `0.16.17` and generator `0.1.142`; a fresh
registry-generated application resolves core `0.16.17` and passes its complete
TypeScript and Kudzu build check.

### `0.21.4`: AI Delivery Proof

- **Purpose:** run the final equal-condition comparison on production-shaped
  tasks.
- **Acceptance:** highest or statistically tied success rate, lowest median cost
  per successful task, complete raw attempts, maintainable source, and retained
  browser/build advantage.
- **Stop condition:** cherry-picked attempts, toy-only tasks, or unequal tooling.
- **Done condition:** the evidence either authorizes `1.0.0` or names the next
  measured blocker without changing the release criteria.

The first independently reviewable evidence-integrity prerequisite is released
as `@kudzujs/core@0.16.18`. A successful adapter result without its raw
attribution trace previously remained eligible for the success-rate and median
successful-cost denominators with synthetic zero metrics. The runner now
requires the trace in the success predicate, retains that attempt as an
incomplete failure, and withholds unsupported per-success claims. The focused
three-test harness passes and the change adds one condition with no semantic
primitive, compiler pass, runtime concept, application API, dependency, or
application browser byte.

This prerequisite makes no framework ranking. Existing complete fixtures cover
the content, forms, CRUD/shared-state, and resource/realtime task classes. The
pinned public `kudzu-based-bench` storefront at commit
`f2d5be1a516c539e30f7125f6870d42b1dd02ecd` remains the smallest complete paired
commerce source. The next exact action is to freeze equivalent pre-task starters
and complete acceptance journeys for those five classes, then run at least five
interleaved attempts per framework and task under one model, tool, context, and
time contract.

The corrected production comparison was recorded in GitHub release `v0.16.19`.
Its npm workflow stopped before publication on an unrelated flaky project browser
journey. The `v0.16.20` forward release passed every repository gate, but npm
rejected its trusted-publishing signing certificate with HTTP 403. The immutable
recovery release `@kudzujs/core@0.16.21` carries the unchanged evidence and
`create-kudzu@0.1.146` targets it.
The first batch is retained but excluded from ranking after hidden content/form
selector assumptions and inconsistent React versions were found. Revision 2
hashes the written contracts and executable acceptance, uses React 19.2.8 in all
five task classes, and records Kudzu 11/25 attributable successes (44%) against
React + Vite 24/25 (96%). One React realtime adapter exceeded 300 seconds without
a trace and correctly remains incomplete; it was not selectively replaced.

The gate fails: Kudzu has no successful task result for content or commerce, so
its aggregate task-token median is unavailable. React's incomplete realtime
attempt also leaves its aggregate failure-inclusive cost unavailable. Kudzu keeps lower accepted browser artifacts and zero-JavaScript static
siblings, but does not meet the required success-rate or cost criteria. The raw
invalid and corrected attempts are published as
`kudzu-ai-delivery-0.21.4-gpt-5.6-sol.tar.gz`, SHA-256
`4e37d15b4c4b0cf88720a3a7743996794b2e0172dbc43d40514f944fb01bd0f8`.
The next evidence-selected work must address reactive collection normalization
and count reuse, then reactive text inside selected conditional branches.
`1.0.0` remains unauthorized. This packet adds no semantic primitive, compiler
pass, runtime concept, public API, dependency, generated behavior, or browser
byte.

The first evidence-selected follow-up now normalizes one supported collection
alias across a keyed map, a top-level `.length` count, reactive text, and a
count-selected JSX branch. It reuses collection analysis plus existing binding,
conditional, and keyed ownership: no semantic primitive, compiler pass, runtime
concept, API, dependency, or shared-runtime byte was added. The implementation
changes two existing compiler files by net 37 lines and extends one positive and
one negative fixture. Required Chrome verifies count updates, empty-branch
unmount, keyed remount, and retained source diagnostics; all 302 tests, package
smoke, and `npm run check` pass. The exercised route ships the unchanged 36,219
B shared runtime closure and 37,870 B total JavaScript including its existing
route handlers. No benchmark contract or budget changes; the production AI
comparison must be rerun only after the remaining selected-branch reactive-text
blocker is addressed. This follow-up is released as `@kudzujs/core@0.16.22`
with `create-kudzu@0.1.147`. `1.0.0` remains unauthorized.

The second evidence-selected follow-up now lowers reactive scalar text inside a
selected conditional branch through the existing binding descriptor and
conditional ownership paths. It adds no semantic primitive, compiler pass,
runtime concept, API, dependency, or shared-runtime source byte; one production
compiler file grows by net 11 lines. A focused fixture proves same-branch text
updates and branch replacement, and required Chrome, all 302 tests, package
smoke, and `npm run check` pass. The five retained commerce sources now pass
their complete acceptance with `empty`, `below`, and `reached` all true and a
zero-JavaScript static sibling. Their route-specific checkout handlers add
147-154 transferred bytes; no runtime module or benchmark contract changes.
This does not revise the published equal-condition score without a complete
rerun, so `1.0.0` remains unauthorized. This follow-up is released as
`@kudzujs/core@0.16.23` with `create-kudzu@0.1.148`.

The user-approved 2026-09-07 `0.16.24` continuation addresses the initial r3
content patch's imported collection alias and direct filter-count failures.
[`imported-article-search`](../../test/fixtures/imported-article-search/README.md)
reproduced both failures before changes. The reduction extends existing import
discovery, pure selector normalization, and count build-value lowering, with
existing BindingIR/DerivedIR/KeyedBlockIR consumers and route/keyed/conditional
ownership. It adds no primitive, IR kind, pass, runtime concept, API, or adapter;
the two core files grow by net 39 lines. Three source variants produce identical
JavaScript (32,190 raw / 12,324 gzip B) and six unsafe neighboring forms remain
source-located errors. Required Chrome verifies search/count/empty transitions,
retained keys, fresh remounts, and static zero-JavaScript exclusion. Check, the
project ownership gate plus 308 tests, package smoke, and both package dry-runs pass.

The full initial-source replay passes the unchanged content acceptance and emits
the same 13 JavaScript files/bytes as the earlier retained inlined workaround
(55,447 raw / 20,976 gzip B). This is a source replay, not a fresh model trial or
replacement benchmark score; no timing or AI-cost improvement is claimed.
[`PERFORMANCE.md`](../../PERFORMANCE.md#imported-search-source-replay-2026-09-07)
records commands, provenance, accounting, and limits. Preserve the original r3
evidence. The release also includes the reviewed r4 protocol/adapter lifecycle
work: atomic partial traces, bounded incremental output, setup-inclusive deadlines,
owned process-tree termination, and incomplete timeout attribution. Two Linux
lifecycle regressions protect future-run integrity; Windows termination remains
untested. The frozen r4 starters stay on published `0.16.23`; old raw records are
not reinterpreted. This packet ships as `@kudzujs/core@0.16.24` with
`create-kudzu@0.1.149`, without authorizing `1.0.0` or a new AI performance claim.

The post-release 2026-09-07 r5 rerun now executes all 50 predeclared attempts with
published `0.16.24` core pins, registry lock integrity, and canonical hashes in
all five Kudzu starters. Revision 5 preserves the release-documented r4 pins as
history rather than relabeling them; model `openai/gpt-5.6-sol`, OpenCode 1.18.27,
budgets, prompts, public context, acceptance, React starters, schedules, and the
r4 lifecycle adapter are unchanged. No compiler or runtime change is made.

The frozen scorer records Kudzu 18/25 versus React + Vite 23/25, with per-task
counts 3/5, 5/5, 3/5, 5/5, 2/5 versus 5/5, 5/5, 3/5, 5/5, 5/5. All tasks finish,
but two Kudzu realtime deadline failures retain partial attribution, so suite
status and Kudzu aggregate token cost remain incomplete. React's failure-inclusive
task-token median is 81,111. Historical r2's published 11/25 versus 24/25 and all
r3 raw evidence remain unchanged; no selective retries or replacement scores.

This is not a clean ranking or `1.0.0` authorization. Four CRUD failures are
exact accessible-name mismatches against a requirement absent from the supplied
prompt; two content failures arise from the grader reading count and empty copy
as one live-region string, one also exceeding the input budget. The next
prerequisite is acceptance/prompt alignment review without retroactive rescoring.
Real compiler intake remains in raw `query.trim` failures for direct count uses
of normalized-query filters and realtime refs intended to survive pause/resume.
One null-ref workaround builds but fails the first snapshot; two zero-ref
attempts fail cleanup proof and time out. Accepted source retains declarative
composition but some Kudzu attempts add derived/version state workarounds.
Designated static siblings remain script-free; content's unchanged topic source
emits list scripts, leaving the broader static-route contract unproven.

Exact commands, nine-failure census, hashes, artifact medians, and scope limits:
[`PERFORMANCE.md`](../../PERFORMANCE.md#0214-released-01624-rerun-2026-09-07).
Local raw evidence is
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01/`.
Six integrity/lifecycle tests, `npm run check`, and the standalone ownership gate
plus 308 tests pass. No commit, version bump, publication, or release is part of
this continuation.

### r5 Compiler Follow-Up

The evidence-backed follow-up is implemented without changing the dirty r5/r6
protocol, prompt, contract, or acceptance work. The two content reductions were
confirmed red before compiler changes: direct JSX `.length` over a normalized
query filter threw `query.trim is not a function`, and the unchanged static topic
filter emitted list state/scripts. Existing count dependency registration now
selects signal build values, while direct imported pipelines without selector
states or collection aliases stay in ordinary build-time map execution.
BindingIR, DerivedIR, KeyedBlockIR, and route/keyed/conditional ownership remain
unchanged; reactive selectors retain the existing list path and negative checks.

Realtime source tracing closes the proposed lifetime extension negatively.
Attempts 0/3 correctly reject version refs without cleanup reset; moving them
into invocation-private closures would lose the version on pause/resume. Attempt
1 exposes a separate diagnostic gap: render-written null refs were accepted as
DOM refs, which serialize an ID rather than the retained numeric value. Existing
ref normalization now rejects those writes at source. No cross-invocation ref,
resource primitive, runtime, or arbitrary callback support was added. Original
state-based attempts 2/4 still pass the realtime browser journey.

Accounting: semantic primitives, IR kinds, core passes, normalization entries,
transform/adapter rules, runtime concepts/source, and APIs all +0; core semantic
LOC +5, focused normalization LOC +2, one diagnostic guard, two positive and two
negative reduced cases. The four search variants emit identical JavaScript at
32,190 raw / 12,324 gzip B. All five final content sources plus the recovered
first attempt-1 patch pass the prepared r6 acceptance, including every one of the
ten static siblings and combined polite regions. Each deploy removes four topic
JavaScript files totaling 20,539 raw / 7,299 gzip B, including 20,462 / 7,204 B of
runtime files; every retained JavaScript file is byte-identical to r5.

`npm run check`, the standalone ownership gate plus 315 required-Chrome tests,
and package smoke pass with 1,200,000 ms command timeouts. Exact source locations,
replay hashes, commands, output tables, diagnostic boundaries, and local evidence
are in [`PERFORMANCE.md`](../../PERFORMANCE.md#r5-compiler-follow-up-2026-09-07).
This is source replay, not AI rescoring: r5 remains 18/25 versus 23/25 with partial
traces, and published r2 remains 11/25 versus 24/25. No model rerun, timing claim,
commit, release, or `1.0.0` authorization follows. The next benchmark decision
must use the aligned r6 protocol in a separately authorized complete run, not
selective retries or broader compiler semantics without new evidence.

### 0.16.25 Release Transaction

The user-authorized patch packages the preceding r5 records, compiler fixes,
render-ref diagnostic, and future-only r6 acceptance alignment as core 0.16.25
and create-kudzu 0.1.150. The pre-release session records above remain historical.
R6 accepts semantically named CRUD groups and combined polite count/empty regions,
and checks all ten content static siblings. Its hashes and published 0.16.24
starter pins remain frozen; testing 0.16.25 in a model run requires a new frozen
revision. No fresh model run, score replacement, persistent-ref support, or
`1.0.0` authorization is part of this release.

### Released 0.16.25 r7 Measurement

The separately authorized September 7-8 r7 run pins released 0.16.25 and retains
r6's aligned acceptance, with unchanged model `openai/gpt-5.6-sol`, OpenCode
1.18.27, budgets, React inputs, and serial schedules. All 50 scheduled attempts
finish with complete attribution: Kudzu 20/25 versus React + Vite 25/25. Content
is 0/5 versus 5/5; forms, CRUD, commerce, and realtime are each 5/5 versus 5/5.
All final outputs pass build and browser acceptance. Every Kudzu content failure
exceeds the input-token budget, two also exceed tool calls, and one exceeds files
read. Content's ten static siblings pass in every Kudzu output.

The aborted session's completed content task remains byte-for-byte unchanged.
After checking no benchmark process was live, the full interrupted forms
directory (one recorded success plus partial next attempt) was archived with
provenance, then its entire ten-attempt schedule restarted before remaining tasks.
No attempts were merged or selectively replaced. The scored suite is complete;
the excluded interrupted attempt still has unknown total cost, not zero cost.

Failure-inclusive task-token costs for Kudzu are unavailable, 100,930, 137,740,
79,680, and 219,656; React costs are 155,982, 93,985, 132,744, 61,196, and 177,862.
Kudzu's five-task median remains unavailable; React's is 132,744. The gate remains
blocked and `1.0.0` unauthorized. R6 acceptance/prompt changes prevent causal
comparison with r5's historical score, which remains untouched.

Audit verifies 50 result/trace pairs, 300 command-stream digests, 540 artifact
entries, frozen inputs, unchanged manifests/locks, and interruption provenance.
Raw tools also reveal reads of shipped historical benchmark/architecture reports
and one installed compiler source file. Public-package availability is not proof
of isolated public-context-only execution: retain the scores but withhold a clean
documentation-only ranking. Next work is separate review of content context
consumption and evidence isolation under unchanged budgets, not speculative
compiler expansion or selective reruns. All five realtime attempts recover from
ref diagnostics; this does not establish persistent-ref support.

Exact results, limitations, commands, and local archive metadata are maintained in
[`PERFORMANCE.md`](../../PERFORMANCE.md#0214-released-01625-rerun-2026-09-08).
Nine focused checks, `npm run check`, and the ownership gate plus 315/315
required-Chrome tests pass. The unique local audited archive SHA-256 is
`aaa16c7881b6b8412e61d1eec88a508af1df5f46bf733270338c2557b5285427`;
its 1,707-file manifest covers raw runs, interruption evidence, frozen inputs,
audits, and verification logs. It is not uploaded or published.
No compiler/acceptance changes, commit, push, release, or version bump occurred in
this measurement session.

### Approved Product Docs/Package Follow-Up

The September 8 evidence review selects package/documentation hygiene rather
than compiler expansion: all five content first patches/builds pass, while
installed evidence reads add unnecessary context. The public README now explains
native currentTarget/state updates, pure local collection filters/counts, keyed
children, and route-local static ownership without task-specific labels or
benchmark solutions. Public release links replace the benchmark-heavy release
introduction and internal packet links.

The npm allowlist removes internal evidence Markdown, including the architecture
directory and framework README, while preserving repository records and every
executable framework/CLI/type/asset file. Actual tarball smoke assertions verify
required contents, forbidden paths, byte-identical installed sources, unchanged
exports/bin, the README's generic consumer, and two zero-JavaScript routes.
No dependency, compiler fixture, semantic primitive, core pass/LOC, normalization
rule, runtime concept/source, or application browser capability changes.

Measured package size falls from 85 to 60 files, 2,090,515 to 991,259 unpacked
bytes, 2,154,496 to 1,036,800 raw tar bytes, and 536,166 to 200,431 gzip bytes
(-62.6%). The public README grows by 1,204 bytes to document supported authoring.
This measures packaging, not predicted model-token savings. Package smoke,
12 focused imported-search/benchmark-integrity tests, check (225 pages), and
the ownership gate plus 315/315 required-Chrome tests pass. Four imported-search
variants retain identical 32,190 raw / 12,324 aggregate gzip JavaScript bytes.
Commands, archive paths, and measurement definitions are in
[`PERFORMANCE.md`](../../PERFORMANCE.md#product-documentation-and-package-cleanup-2026-09-08).

Full public-context isolation remains separately deferred: compiler sources are
still readable and web/repository references remain possible. No sandbox claim,
protocol/budget change, retrospective rescoring, model rerun, version bump,
commit, push, or release follows. Dirty r7 evidence and its 20/25 versus 25/25
score remain intact; `1.0.0` remains blocked.

### 0.16.26 Release Transaction

The separately approved patch publishes the preceding evidence and product
documentation/package cleanup as core `0.16.26` and create-kudzu `0.1.151`.
The earlier no-release session statements remain historical. Internal documents
remain in the repository but leave the installed package; actual tarball smoke
assertions protect executable sources, exports/bin, and the generic README example.
The 85-to-60-file, 536,166-to-200,431-gzip-byte comparison is the historical
same-tree pre-release measurement, not exact versioned release bytes or predicted
model-token savings. Compiler/runtime changes, semantic primitives, core passes/LOC,
and runtime concepts are zero. Frozen r7 inputs retain released `0.16.25` and
20/25 versus 25/25; there is no new model run, rescoring, sandbox claim, or
`1.0.0` authorization. Current source links and a static release page track the
new patch while old releases remain unchanged.

### Authorized 0.16.26 r8 Package/README Measurement

The September 8 follow-up authorizes the full unchanged 50-attempt production
schedule against registry 0.16.26, advancing only Kudzu pins/locks, canonical
hashes, and revision metadata to r8. Compare r7 content exploration before/after
first build, docs reads, model steps, failure-inclusive costs, acceptance, source
retention, and static siblings. Separate uncached/cache/provider token accounting.
No compiler changes, selective reruns, scorer/budget changes, release, or causal
proof are authorized. Installed source and public web remain accessible; this
is not a sandbox. R7 and all interrupted raw evidence remain unchanged.
The predeclared comparison and subsequent results live in `PERFORMANCE.md` and
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r8-kudzu-0.16.26-20260908-01/`.

### Completed 0.16.26 r8 Measurement

The unchanged serial schedule completed September 8, 04:44:22-06:28:51 UTC,
with 50 fully attributable attempts and no interruption/retry: Kudzu 23/25,
React + Vite 24/25. Content is 3/5 versus 5/5; forms 5/5 versus 5/5; CRUD 5/5
versus 4/5; commerce and realtime each 5/5 versus 5/5. All final builds and all
25 Kudzu acceptance journeys pass, including every static sibling. Kudzu content
ordinals 2/4 exceed only input tokens; React CRUD ordinal 4 asks for clarification,
changes nothing, and fails browser acceptance. All costs/failures remain scored.

Scheduled token totals are 4,541,314 versus 2,786,135, including 3,687,296 versus
2,062,208 cached input tokens. Reported subscription dollars are zero, not zero
work; no discounted-cache invoice is available. The one availability preflight
adds 6,735 tokens separately. Failure-inclusive median task costs are 142,845
versus 132,422, so the delivery cost/success gate and 1.0 remain blocked.

Content tokens fall 33.6% from r7, with pre-build exploration calls 122 to 73,
pre-build model steps 57 to 40, and excluded evidence Markdown reads 18 to 0.
All five read the README once and pass their first build. Post-build steps rise
28 to 33 and consume 1,052,052 tokens: content output inspection/stopping behavior
under unchanged budgets is the next measured blocker, not compiler correctness.
React content also falls 15.1%; small samples, service drift, and r7 interruption
preclude causal proof. Source searches and a realtime `framework/core.mjs` read
persist. No sandbox/isolation claim or broader compiler work follows.

`PERFORMANCE.md` records per-task costs, cache accounting, output/retention,
environment, raw paths, checks, and archive metadata. Audit verifies 50 traces,
300 streams, 540 artifacts, and 545 source files. Historical r7, interrupted
provenance, and older scores remain unchanged; no commit, push, bump, or release.

Verification passes: six focused tests, check (226 pages, 2 interactive), the
standalone ownership gate plus 315/315 required-Chrome tests with no skips, and
packed-package smoke. The complete local r8 archive contains a 1,798-file
manifest and is 4,271,388 bytes; SHA-256
`81bf1d782b68f66ea1891740e40c5bc09bd9b161c769a36b8178ca2604d2f7c6`.
All 1,707 r7 manifest entries and its archive digest verify unchanged. Archive
paths and this post-archive metadata-update boundary are recorded in PERFORMANCE.

### Pre-Release Verification Guidance Follow-Up (2026-09-08)

The user-approved patch addresses misleading post-build checks, not compiler
correctness: r8 content ordinals 2/4 confused raw HTML/tag stripping with visible
text around binding comments/inert templates; ordinal 3's missing `rg` pipeline
yielded misleading zeros. All five first builds passed. Generic README/docs
guidance now distinguishes supported compilation from browser/accessibility
verification, bounds inspection output, rejects missing/truncated evidence as a
pass, and calls for affected rechecks after source changes. Optional inspect and
exact-route explain both rebuild and report compiler/artifact facts only.
A non-quiet success hint links to docs#build; it neither certifies behavior nor
asks agents to stop checking.

Four implementation/guidance/test files plus PERFORMANCE and this packet change.
One framework source file, +3 net core LOC (console only); +0 compiler passes,
semantic primitives, runtime concepts, APIs, dependencies, or fixtures. Existing
output tests cover the hint, failed/quiet/JSON suppression, and byte-identical
fixture artifacts. Browser JS delta is 0 raw / 0 gzip B: four imported-search
variants retain 9 files, 32,190 raw / 12,324 aggregate gzip B. Documentation HTML
changes intentionally. Token savings and performance improvements are unmeasured;
historical r8 metrics above are not results of this patch.

Sequential 1,200,000 ms-timeout checks pass: build-output 6/6, required-Chrome
imported-article-search 6/6, packed-package smoke, npm check (226 pages, 2
interactive), and required-Chrome npm test (standalone 1/1 plus 315/315, no skips).
This is not exhaustive manual browser/accessibility proof. PERFORMANCE records
the exact commands and byte digest. Existing dirty r8 evidence/protocol changes,
adapter/scorer/budgets, and historic scores remain untouched; no commit, push,
release, bump, or new model run is authorized or performed.

### 0.16.27 Release Transaction

The subsequent explicit user authorization releases the completed r8 records and
verification guidance as core `0.16.27` and create-kudzu `0.1.152`, with commit,
push, exact-commit CI, immutable annotated tag, GitHub release, protected npm
publication, registry integrity, and fresh generator-install verification.
Earlier no-release statements preserve those sessions' scope, not this approval.
Current source references, tests, release notes, and a new static release page
track the patch; historical pages and frozen r8 registry pins stay unchanged.

This reduces misleading post-build checks through product documentation and a
non-quiet console hint, not compiler semantics. Raw HTML/tag stripping is not
visible-DOM proof; build success is not browser/accessibility proof. Optional
inspect/explain reports rebuild. Failed/quiet/JSON output suppresses the hint.
Framework accounting remains +3 net console LOC, zero new passes, semantic
primitives, runtime concepts, dependencies, fixtures, or browser JavaScript.
Prior npm internal-doc exclusions remain. Historical r8 remains 23/25 versus
24/25; this guidance has no measured token benefit, and no new benchmark,
rescoring, sandbox claim, or `1.0.0` authorization follows. Registry and fresh
installation remain publication-time gates; protected approval is not bypassed.

Sequential local release checks pass with 1,200,000 ms timeouts: check builds
227 pages (2 interactive), required-Chrome npm test passes standalone 1/1 plus
315/315 with no skips, standalone packed-package smoke passes, and both npm pack
dry runs retain the intended 60-file core / 4-file generator package contents.
The four imported-search variants retain 32,190 raw / 12,324 aggregate gzip
JavaScript bytes. PERFORMANCE records exact pack sizes and the documentation-only
verification-record boundary. Exact-commit CI and protected publication remain
release-transaction gates, not assumed completed by these local checks.

### Focused 0.16.27 Content R9 Result (2026-09-09)

The separately authorized ten-attempt comparison is complete: **Kudzu 3/5 versus
React + Vite 5/5**, with all ten first/final builds and frozen Chrome acceptance
journeys passing. K2 exceeds input/tool budgets; K4 exceeds input budget. Failures
remain included: 2,003,387 versus 585,279 tokens, 667,796 versus 117,056 rounded
tokens per success, and all-attempt elapsed medians 173,645 versus 110,585 ms.
Kudzu does not use less of everything: raw/gzip deploy medians are smaller
(68,404/26,410 versus 206,367/66,388 bytes), while AI tokens, time, and tool calls
are higher. Historical full-suite r8 remains 23/25 versus 24/25, not overwritten
by this subset; neither the AI cost gate nor `1.0.0` is cleared.

Initial inspection found no live benchmark and a clean worktree, but the original
r9 stopped after eight complete successes and one partial ninth attempt. Its
entire directory is preserved in an intact checksummed interruption archive.
The restart reused the exact frozen ten-entry schedule, model
`openai/gpt-5.6-sol`, OpenCode 1.18.27, registry core 0.16.27, scorer and budgets;
no selective retries, merging, model switch, or full fifty-attempt run occurred.
Known interrupted cost and both preflights are separately retained, yielding at
least 4,799,245 recorded focused-work tokens, versus 2,588,666 in the fresh schedule.

Against r8 Content, Kudzu total/post-build tokens rise 6.44%/7.05%, while React
total tokens fall 11.60%. All five Kudzu agents read the Verify guidance and
receive the build hint, but none follows the URL or executes a browser journey.
Raw-HTML/template counting, minified searches, missing `rg`, and faulty custom
assertions persist. Required builds and independent scored acceptance were not
dropped on either side; agent verification alone is not browser/a11y proof.
Four Kudzu agents receive compiler/runtime grep snippets; one reads public types.
No excluded evidence Markdown reads or webfetch occur, but public source access
persists. Five trials and service/environment drift do not establish causal A/B
benefit, isolation, or comprehensive accessibility compliance.

The full report, per-attempt metrics, source/scorer limitations, exact hashes,
and required tracked-change verification/archive record are in PERFORMANCE and
`test-results/ai-delivery-production/0.21.4-content-only-r9-kudzu-0.16.27-restart-20260909-01/`.
No compiler/scorer/adapter changes: zero semantic primitives, core passes/LOC,
runtime concepts, dependencies or compiler fixtures added. No commit, push,
release or main version bump. Further work needs evidence-backed authorization,
not selective reruns of budget failures.

Post-edit verification passes sequentially with 1,200,000 ms timeouts: check
(227 pages, 2 interactive), required-Chrome npm test (standalone 1/1 plus 315/315,
no skips/failures), and diff whitespace validation. Four imported-search outputs
retain 32,190 raw / 12,324 gzip JS bytes. PERFORMANCE and the retained execution
logs record the tested edits and this later verification-metadata-only update.

### Unreleased R9 Tool-Output Follow-Up (2026-09-09)

The authorized next reduction addresses the retained r9 post-build script/preload
inventory rather than adding compiler semantics or another documentation hint.
Normal successful build output now reports a literal scan of freshly emitted
route HTML after `afterBuild`: counts with/without script/modulepreload text
markers, unreadable files, and at most five bounded paths per nonempty category.
The existing browser/a11y verification warning remains. No claim of script
freedom, visible content, or browser correctness follows from this scan.

Existing inspect/explain commands rebuild and continue to do so. The v2 artifact
report is compiler closure metadata, not final HTML evidence; consuming arbitrary
cached inventory would introduce freshness/trust requirements without solving
post-hook correctness. This change instead reuses the current build's route
records and staged files, printing only after successful promotion. Quiet/JSON
output, artifact schema and bytes, return contracts, and failure exits remain
unchanged. Extra public HTML and subsequent external mutations are outside scope.

The new initially failing CLI fixture reproduces the missing bounded inventory,
then covers static/interactive output, hook-injected scripts/preloads, unreadable
routes, base paths, truncation by route count, and unchanged deploy/report bytes.
Seven focused output tests pass. The fixture adds 133 stdout bytes with unchanged
4,985 raw / 2,591 gzip JS bytes; its static-only build emits no JS files. Build
orchestration adds 25 net lines; semantic-core LOC, passes, primitives, runtime
concepts, dependencies, and browser-byte deltas remain zero. Normal builds add
one sequential route-file read per page; quiet/JSON builds skip it. PERFORMANCE
records the exact lexical limitations and verification results.

Full sequential verification with 1,200,000 ms timeouts passes: check (227 pages,
2 interactive), required-Chrome tests (standalone 1/1 plus 316/316, no skips),
and fresh-install package smoke (3 pages, 1 interactive). The site reports 144
route files without markers and 83 with markers, including existing post-build
SEO JSON-LD scripts, with none unreadable. All four maintained imported-search
fixtures retain 32,190 raw / 12,324 gzip JS bytes and the prior runtime hash.

This is an unreleased tooling change, not a rescoring or new model experiment.
AI token/cost savings and build-speed effects are unmeasured. Historical full r8
remains 23/25 versus 24/25, focused r9 remains 3/5 versus 5/5, and the 1.0 gate
remains blocked. No release transaction or version bump is authorized here.

### Local Summary Candidate R10 Closure (2026-09-09)

The authorized end-to-end assessment is complete, with **no demonstrated AI-cost
advantage**. An immutable local `0.16.27-summary.20260909.1` tarball ran the exact
r9 Content schedule, model, OpenCode, budgets, public context and scorer: Kudzu
4/5 versus React 5/5; all ten first/final builds and Chrome acceptance journeys
pass. Kudzu's input-budget failure remains included in 1,742,479 versus 467,550
total tokens, with elapsed medians 157,611 versus 90,893 ms. Kudzu total tokens
fall 13.02% from r9 while React falls 20.12%; all five Kudzu agents still repeat
the HTML marker scan. K2 repeats template-counting/minified-code assertions and
K4 encounters missing `rg`. Neither side runs an agent-owned browser journey.
No new heuristic or generic verification runtime is justified by this result.

The only production correction bounds the added reads using the existing
64-file batch size while preserving sorted output. Twenty-one alternating builds
per size/revision measured the initial sequential 1,011-page median at +5.03%;
final batched medians are +4.80% at 111 pages and -0.23% at 1,011 pages, with
paired percentage medians +2.01%/+1.60% and overlapping ranges. There is no
established repeatable >5% final regression and no claimed speedup. Every deploy
path and byte remains identical to release. The regression now crosses a batch
boundary; the correction adds six orchestration lines (+31 total versus release),
zero semantic-core LOC/passes/primitives, runtime concepts or browser bytes.

PERFORMANCE records the full protocol, failure-inclusive metrics, source and
verification review, statistical limitations, required gates and archive record.
Evidence is retained under
`test-results/ai-delivery-production/summary-candidate-20260909/`; canonical
protocols and historical archives are unchanged. The workspace remains 0.16.27,
with no publication or release transaction. Full r8 remains 23/25 versus 24/25,
focused r9 remains 3/5 versus 5/5, and 1.0 remains blocked. This closes measurement
of the summary, not the AI-delivery problem; further product work must start
from trace evidence rather than assuming the inventory solved it.

Final sequential gates pass with 1,200,000 ms timeouts: check (227 pages),
required-Chrome tests (standalone 1/1 plus 316/316, zero skips/failures), and packed
package smoke (3 pages). Four imported-search fixtures retain 32,190 raw / 12,324
gzip JS bytes and their runtime digest. `git diff --check` passes. The sibling
`summary-candidate-20260909-audited.tar.gz` and `.sha256` preserve the candidate,
baseline, full experiment and verification evidence without rewriting r9.
These are subsequent verification/archival metadata, not further code changes.

### Registry Content R12 Closure (2026-09-09)

The authorized CONTENT-only ten-attempt experiment using registry `0.16.28` is
complete at **Kudzu 5/5 versus React + Vite 5/5**, with all final builds and unchanged
scored browser acceptance passing. This is qualified evidence: the pre-run command
passed seven browser/copy tests but omitted the separate lifecycle test file and
frozen-protocol test file. Both categories pass in the full post-run suite; that
does not retroactively satisfy the requested pre-measurement sequencing gate.
No selective retry, replacement attempt or retrospective protocol repair occurred.

R12 freezes release `04e14e3`, exact registry lock integrity and archived tarball,
and equal released favicon/AX tools and task-neutral instructions. R11's runner,
adapter, model `openai/gpt-5.6-sol`, OpenCode 1.18.27 binary, task, acceptance,
React 19.2.8 / Vite 8.2.2 starter, budgets and serial schedule remain unchanged.
No scorer, compiler, runner or measured input changes during the run. No private
grader exposure or new feature. All 60 R12 post-agent/post-acceptance tool checks
pass; transient write-and-restore is not detected and no hostile sandbox is claimed.

Failure-inclusive totals are **1,572,199 versus 1,270,703 tokens**; tokens per
success are 314,439.8 versus 254,140.6. Median elapsed is 150,351 versus 151,896 ms,
median normalized tools 28 versus 24, and model builds total five versus seven.
The separately charged preflight is 6,727 tokens; total recorded cost is 2,849,629
tokens. Provider-reported subscription dollars are zero, not free compute.

All ten agents use real input. Kudzu/React clean smoke exits are **9/10 and 8/10**,
with 21/19 successful fills, 35/45 text checks and no clicks. R1/R4 correct CSS
uppercase names using the new AX diagnostic and rebuild; K4 corrects a static-text
expectation's casing without source changes. All three failed calls stay charged.
R3's unrelated nonzero `git diff` compared two files outside a repository and does
not prove source retention. Independent source audits verify only two authored
file changes per attempt. Four of five Kudzu agents still repeat raw-HTML marker
scans; K1 relies on the build summary. One R12 browser output spill is retained
without charging recovered bytes as model-visible context.

R12 Kudzu tokens are 12.23% below historical R11 but still 23.73% above same-run
React; React tokens fall 4.94% from R11. Five samples, run-time/cache/provider drift,
new registry version and changed tools/docs preclude causal or statistical
superiority. R11 stays 4/5 versus 5/5 with eighteen nonzero smoke calls. Full R8
stays 23/25 versus 24/25; focused score parity does not clear full-suite or 1.0 gates.

Evidence: `test-results/ai-delivery-production/browser-tools-r12-20260909/`, with
the sibling audited archive and external checksum. Protocol SHA-256:
`663e86f02018a7d7d7cc0319d1351a0acc5cce15551d2c630ee163c7caeecc3a`;
registry tarball SHA-256:
`06acf44d6a7754dca48293ec522b1af6eaca5d6e9cfe6d1d774feba6755ea643`.
PERFORMANCE records per-attempt metrics, tool exits, actual journeys, final-answer
limits, full hashes and comparison. Audit reconciles 20 R11/R12 attempts, 120
streams, 340 artifacts, 330 source files and 120 context checks without rescoring
history. Prior/interrupted archives are hash-verified and unchanged.

Sequential 1,200,000-ms check, required-Chrome standalone 1/1 plus 320/320 tests
with zero skips/failures, and package smoke pass. Four search fixtures retain
32,190 raw / 12,324 gzip JS bytes and their runtime digest. Semantic primitives,
core passes/LOC, runtime concepts, dependencies and production browser-byte deltas
are zero. No commit, push, release or version change.

Next packet: review bounded browser observations and post-build inventory/stopping
cost from these traces. Before any future provider call, explicitly gate on the
lifecycle and frozen-protocol test files as well as browser/copy checks. Any changed
instructions/output policy requires a new equal-condition freeze, not retroactive
R12 edits, selective retries, another automatic run or speculative compiler work.

### Offline R15 Selector Ergonomics (2026-09-11)

Offline follow-up complete; no model/provider calls. Eight original uppercase-label
applications (K0/K1/K3, R0–R4) pass the unchanged frozen acceptance after reversing
only their recorded naming correction in disposable source copies. The eight
initial exact-name failures reproduce; role-only counterfactual commands complete
32 fills and 54 unchanged text assertions with zero failures. Exact uppercase names
also work without application edits. Six CSS edits and two added `aria-label`s were
unnecessary for these checks, not compiler fixes or proven accessibility repairs.

The repository smoke helper adds conventional optional `name` targeting: omitted
name requires exactly one existing AX role candidate; supplied names remain exact,
including casing and empty strings. Disabled siblings still count for ambiguity;
invalid action descriptors, non-writable/non-text fill targets, hidden/inert,
disabled and obscured click targets fail closed. Existing bounded candidate hints
and explicit snapshots suffice for name discovery. Only neutral future-copy utility
documentation changes; historical inputs, protocol, scorer and score stay frozen.

PERFORMANCE and `role-only-offline-20260911/` record source reconstruction, commands,
observations, acceptance and 2,995 unchanged R15 regular-file hashes. Helper +6 net
physical LOC; semantic primitives/core passes/core LOC/runtime concepts/browser
bytes +0. Required browser/lifecycle/protocol/copy checks 12/12, check, final
required-Chrome standalone 1/1 plus 321/321 suite, and package smoke pass. Two prior
full-suite environment/browser failures are retained in the performance record;
passing reruns required no code changes. No actual token saving is measured.
R15 stays 5/5 each with Kudzu 19.30% higher tokens per acceptance; no release or
automatic benchmark rerun. Next work remains offline evidence review unless a new
equal-condition model experiment is separately authorized.

### CONTENT R15 Observation Reuse Measurement (2026-09-10)

Archive closure outside its snapshot: 73,331,847 B, 2,247 manifest files,
SHA-256 `3147eee8fee712ef74a386cef48d399c935d3971548ef1889c8b4014cab7abbc`.
Deterministic packs, checksum, extracted/live hashes and historical integrity pass.

Separately authorized single ten-attempt serial CONTENT batch completes at **5/5
Kudzu versus 5/5 React**, unchanged final acceptance, no retries or interruptions.
R13 neutral context is the baseline; R14's failed inventory policy is excluded.
Current README without the removed map and symmetric non-adjacent observation
reuse are explicitly frozen in a fresh immutable local candidate; main is 0.16.28.
Exact OpenCode 1.18.27/model, budgets, task/scorer, React starter and schedule are
unchanged. All 11 deterministic lifecycle/protocol/browser/copy checks pass before
the separately charged 6,727-token availability probe and ten attempts.

Failure-inclusive totals: **1,652,454 / 1,385,083 tokens**, **330,490.8 / 277,016.6
per accepted task**; Kudzu remains **19.30% higher**. Median elapsed is
169,577/177,782 ms with overlapping ranges. Batch duration is 29m 2.369s; total
including preflight is 3,044,264 tokens. Cost objective **unmet; model calls stopped**.
All 60 copied-context checks pass. Eight exact AX-name smoke failures are corrected
within attempts and fully charged; all ten agents fill controls, none clicks links.
105 full-record references include 20 non-adjacent reuses; incremental serialized
output reduction is 42,956 B, not measured token savings or causal cost attribution.

Evidence: `test-results/ai-delivery-production/observation-reuse-r15-20260910/`.
Protocol `6ae7cebf31da592a1a9e48c081ff2fee79c5e8092afcf87a06765564539d08d0`;
candidate `399ac4fb05654bed5a232274536b823336649e8e1918167ead632ed37a5e128b`.
PERFORMANCE records every attempt, token/cache/phase/tool metric, source/artifact
audit and limits. Historical R13/R12 comparisons are descriptive; README, identity,
tool/docs and time/cache/provider drift prevent sole-change causal claims. No fresh
twenty-attempt A/B, compiler/runtime change, release, configuration edit or commit.
Existing compaction remains; R14 policy is unadopted. Full R8 and 1.0 remain blocked.

Final sequential 1,200,000-ms check, required-Chrome standalone 1/1 plus 320/320
tests (zero failures/skips), and packed-package smoke pass. Search-fixture bytes
and runtime digest remain unchanged. Exact receipts, source/trace manifests and
historical comparisons are retained in the sibling audited archive; only factual
verification metadata follows the gates, with no benchmark or model repeat.

### Offline Non-Adjacent Observation Reuse (2026-09-10)

Offline R12/R13/R14 replay identifies 26 returns to earlier exact bounded
observations beyond adjacent compaction. Reusing the existing `observationFrom`
format removes 111,419/1,050,026 serialized bytes (10.61%) with identical expanded
records, including failures. Two exact historical Chrome command replays reduce
output about 18.4% with unchanged requests, assertions and full snapshot recovery.
The repository-only utility is +1 net line over the preceding dirty version;
no framework API, compiler/runtime, provider/configuration or frozen-copy change.
See `PERFORMANCE.md` and `observation-reuse-20260910` evidence for hashes, replay
commands and gates. AI cost/tokens per accepted task remain unmeasured; failed
inventory policy is not adopted, scores are not rewritten, and no new model run
or release is authorized by this output-only result.

### R12 Token/Observation Follow-Up (2026-09-10)

The resumed user-approved review preserves the dirty R12 closure history and the
prior agent's minimal browser-output implementation. No new model run occurs.
R12's 301,496 excess tokens split into 162,685 pre-build, 19,237 first-build-message
and 119,574 post-build. Cache-read input accounts arithmetically for +311,936,
offset by -10,373 uncached, +481 output and -548 reasoning. Pre-build has 40 versus
35 model steps, but 91 versus 94 raw tool events; five passing Kudzu first builds
do not authorize compiler work. Provider totals cannot attribute individual cached
tokens causally to particular reads or calls.

Raw trace evidence includes repeated broad root inventories (K2 lines 9-10),
package searches followed by README reads (K0 lines 21-26, K1 lines 22-27), an
8,121 B public type read (K3 line 24), post-build raw marker scans (K0 lines 47/52),
and 42,179 B from K1's 12-command smoke (line 44). Lines refer to each unchanged
R12 `content/attempts/content-<variant>-<ordinal>/adapter.stdout`. The existing
public README and lexical summary already explain authoring/verification; another
hint or speculative compiler/CLI addition is not justified. Pre-build exploration
and stopping overhead remain unresolved, not relabeled as savings.

The concrete general fix deduplicates identical bounded text/AX observations on
actions and text checks through `observationFrom`, preserving every operation,
assertion, error, timeout and exit. Explicit open/snapshot and changed observations
remain full; references point directly to a full record within this invocation.
The public tool document records the contract and limited meaning of equality.
No assertion, observation bound, cache charge or acceptance criterion is weakened.

K1's exact historical commands replay locally on archived artifacts at 42,179 ->
22,969 bytes (-45.54%), with six compact records, clean completion, and identical
expanded observations excluding elapsed times. The regression fails against the
frozen baseline at the expected missing reference. Historical-stream projection
is 272,027 -> 162,993 B for Kudzu and 307,487 -> 177,483 B for React, including
failures and recovered spill output without changing historical token accounting.
These are output bytes, not measured model-token or end-to-end productivity gains.

Evidence, script, source hashes, per-phase usage, exact tool-call locations,
baseline regression output and both live replay streams are separate from frozen
R12 at `test-results/ai-delivery-production/browser-observation-followup-20260910/`.
See `PERFORMANCE.md` for the complete attribution table and limitations. Core
semantic primitives/passes/LOC, runtime concepts, dependencies and production
browser-byte deltas remain zero; utility implementation delta is +5 net lines.
No compiler fixture, package/runtime change, model call, commit, push or release.

Sequential 1,200,000-ms gates after the tracked changes pass: focused required-
Chrome browser/copy/lifecycle/protocol checks 11/11; check builds 228 pages, two
interactive; required-Chrome full tests pass standalone 1/1 plus 320/320 with zero
skips/failures; package smoke builds three pages, one interactive. Four search
fixtures retain 32,190 raw / 12,324 gzip JS bytes and the prior runtime digest.
All stderr logs are empty and `git diff --check` passes.

Next gate remains a separately authorized equal-condition freeze after explicit
lifecycle, frozen-protocol, utility and copy-integrity checks. No automatic model
rerun, asymmetric instructions, scorer/budget adjustment or 1.0 gate clearance.

### CONTENT R14 Symmetric Inventory Policy (2026-09-10)

Archive closure (external to its own snapshot): 69,954,597 B, 1,077 evidence files,
SHA-256 `f92d4de5dfb437cdd5ad5f668a3c5ffb00b7faab388933cd281eee9b06418a05`.
Two deterministic packs match; manifest files, archive members and checksum pass.

The separately authorized single ten-attempt batch has run all scheduled attempts:
**Kudzu 1/5 versus React + Vite 2/5**, against historical R13 5/5 versus 5/5.
All ten independent final builds and Chrome behavior/accessibility/output checks
pass, but six fully attributable attempts exceed unchanged budgets and React R3
also times out. Its recorded usage is a lower bound; the runner correctly retains
`incomplete` aggregate attribution. No selective retry or second batch occurred.
The AI-cost objective is not achieved, and this policy is not promoted/installed.

Both variants receive identical 920 B generic initial-discovery public context,
charged in the input. No repository map, package-doc/type ban, hidden grader hint,
forced early stopping, OpenCode config/permission/sandbox change or dependency is
added. The immutable local `0.16.28-inventory-policy.20260910.1` package differs
from R13 only by README map removal and copied manifest identity; complete source
digests document both. Browser tools/compaction, runner/adapter, scorer, task,
React starter/dependency pins, OpenCode 1.18.27 binary, `openai/gpt-5.6-sol`, budgets,
pricing and serial K0,R0,R1,K1,K2,R2,R3,K3,K4,R4 schedule remain unchanged.

Offline coverage and explicit lifecycle/protocol/browser/copied-context tests
pass 11/11 before calls. The actual frozen-input validation caught invalid
uncopied-context metadata; the original freeze/log is preserved and the ordinary
default inclusion form passes before the one availability probe. That preparation
repair is not a benchmark restart. Probe: 6,727 tokens, 6.428 s. Batch: 33m 42.541s.

Recorded failure-inclusive tokens are **2,442,428 versus >=1,836,645**, including
cache reads; total with preflight **>=4,285,800**, unknown React timeout tail.
Tokens per success are 2,442,428 versus unknown (lower bound 918,322.5). Historical
R13 is 1,731,168 versus 1,266,931. Prebuild tokens rise to 1,007,656/696,677,
postbuild to 1,219,695/>=990,148; median elapsed is 184,993/184,527 ms, median
tools 39/41. Zero subscription dollars do not mean free compute or complete cost.

All agents census the root and expose every authored path: 14/14 and 19/19,
including React's ten nested HTML entries outside src plus root index. Unknown
authored subtrees are expanded, not silently omitted. Nine agents still issue
truncated broad root globs. All-phase file-read output grows 129,494 -> 323,832 B
Kudzu and 88,025 -> 215,257 B React; full lockfile and more page/package reads
outweigh smaller glob output. Coverage adoption is not cost reduction, and bytes
are not tokens. Raw path/offset/output/shell ledgers account for inspection.

Audit reconciles 60 streams, 170 artifacts, 165 source files, 60 unchanged copied
context checks and 96 valid compaction references (297,056 exact omitted output
bytes). Browser smoke exits are 8/8 and 8/9. R1 repairs its authored CSS AX-name
mismatch; K3 repairs shell quoting. R3 adds source-based static rendering across
13 files, repairs route selection and TS5097 errors, then times out without agent
browser testing. Its final independent acceptance does not erase those failures.
No demonstrable compiler/browser-tool regression or grader bypass is found.

Evidence: `test-results/ai-delivery-production/inventory-policy-r14-20260910/`.
Protocol SHA-256 `451090eb5f0858a0d8b2da229c58e71b18a1c9d1e4d2536990fa7d0aa09de84c`;
candidate SHA-256 `419e87aebf5bc754d973dcd4b47290e41670abfaf9db6871d2c6ae13769d892a`.
PERFORMANCE includes every score, failure, token/cache/phase/cost/time/tool metric,
adoption/output/source/maintainability/trust audit and limitations. Five pairs,
incomplete tail cost, README/identity differences and time/cache/provider drift
prevent causal attribution. This is not a compiler win. Main remains 0.16.28;
no commit, push or release. All prior dirty changes and R13 evidence are preserved.
Full R8 stays 23/25 versus 24/25; full-suite and 1.0 gates remain blocked. Stop
provider runs; any next step is bounded offline review of inventory-versus-content
reading and existing framework-specific static wording, not another automatic batch.

Final `npm run check` passes. First required-Chrome suite has one infrastructure
failure (nginx HTTP-on-HTTPS response instead of a component-list fixture), retained
with occupied-port evidence; legacy PID-derived port ownership remains a risk,
not a claimed compiler fix. One unchanged full-suite verification repeat passes
standalone 1/1 plus 320/320 with no skips; package smoke builds three pages, one
interactive. Every command has a 1,200,000-ms receipt. No benchmark was repeated.

### CONTENT R13 Measurement And Map Removal (2026-09-10)

Archive closure (external to its own snapshot): 68,962,181 B, 1,042 evidence files,
SHA-256 `83dc57ad33f9e3604f591b8c56b76c310da08490586dfb7474098c7de8a5fa4a`;
two deterministic packs match and checksum verifies. Freeze-to-archive time is
46m 47.248s; actual serial batch is 28m 14.049s. No attempt remains running.

The user-authorized independent ten-attempt R13 batch is complete: **5/5 Kudzu
versus 5/5 React + Vite** with unchanged independent acceptance. The immutable
local `0.16.28-observation-map.20260910.1` tarball retains the measured 689 B map;
both variants receive identical observation-dedup tools/docs. Main remains
`0.16.28`; model `openai/gpt-5.6-sol`, hash-pinned OpenCode 1.18.27, registry
dependency locks, React starter, task, runner/adapter, scorer, budgets and serial
schedule match R12. Explicit lifecycle/protocol/browser/copy tests pass 11/11
before the separately charged availability probe and all ten calls. No selective
retry, midrun edit, substitution, compiler change, commit, push or release occurs.

Failure-inclusive tokens are **1,731,168 versus 1,266,931**, 346,233.6 versus
253,386.2 per success; Kudzu is 36.64% higher than contemporary React and 10.11%
higher than historical R12. Median elapsed is 167,425 versus 156,615 ms, median
tools 29 versus 25, builds six each. Actual serial batch takes 28m 14.049s;
including the 6,727-token availability probe costs 3,004,826 tokens. Zero reported
subscription dollars do not mean free compute. Prebuild excess is 254,033 tokens;
first-build-message/postbuild excess is 31,190/179,014. No AI-cost win is claimed.

The audit verifies 95 direct full-observation references, reducing exact JSON
records from expanded 658,445 B to actual 366,915 B. These are observed output
bytes, not token predictions. All agents interact; clean smoke exits are 6/7 and
11/12. K2/R0 retain authored CSS uppercase AX-name failures, repair their labels,
rebuild and pass. No utility correctness regression is observed; compaction stays.

Map exposure is 1/5, after that agent already reads declarations and manifest;
no map-directed navigation is observed. Three readers skip to later README
offsets, one never reads it. Package reads grow from historical 7/37,758 B to
11/60,343 B. Preserve the batch, then remove the unproven 689 B map and its
dedicated smoke assertions; this is not causal disproof or a measurement of the
post-removal package. No second model batch occurs. Two interventions and five
pairs cannot isolate cause; R12's omitted pre-run gates remain qualified.

Evidence: `test-results/ai-delivery-production/browser-tools-r13-20260910/` and
its deterministic audited archive/checksum. Protocol SHA-256
`d0e9fa058e09d6601c1bd04a33a35495e338d55f67fe501cd7854a82203e334c`;
tarball SHA-256 `577f11730a0f6bbb4d31176ddb587dabb8e8f9fdce2358e746792a605d67fad5`.
PERFORMANCE records per-attempt/phase costs, adoption definitions, browser inputs,
failures, source and static/accessibility evidence, full limitations and raw paths.
Audit reconciles 60 streams, 170 artifacts, 165 source files and 60 context checks;
all attempts change only the article page and styles. R12 raw history is unchanged.

Final sequential check, required-Chrome standalone 1/1 plus 320/320 (zero skips)
and package smoke pass after map removal. Semantic primitives, core passes/LOC,
runtime concepts, dependencies and production browser-byte deltas remain zero.
Full R8 remains 23/25 versus 24/25, with the full-suite and 1.0 gates blocked.
Next work reviews prebuild discovery and repeated postbuild inventory evidence;
no automatic rerun, private/asymmetric guidance or speculative compiler feature.

### Offline Inventory Policy Review (2026-09-10)

The authorized offline comparison preserves R12/R13 and the five prior dirty
files. Evidence/script/draft:
`test-results/ai-delivery-production/inventory-policy-20260910/`.
Complete scoped inventories cover 14/14 Kudzu and 19/19 React authored files;
strict src-plus-root discovery is rejected because ten React HTML entrypoints
live outside src. The generic draft includes root/configured entrypoints,
data/styles/assets and unknown authored subtrees, retaining unrestricted explicit
package docs/types access (326/463 declarations), not a dependency ban.

Across five attempts, exact broad output versus projected inventory plus root
census is R12 Kudzu 69,798 -> 6,025 B, React 49,533 -> 8,790 B; R13 Kudzu
56,810 -> 6,025 B, React 59,918 -> 8,790 B. Original temporary workspaces are gone;
frozen starters and local dependency copies support separately labeled matching/
ordering simulations, not a proprietary-tool replay. React's older local package
layout is version-aligned and hashed, not claimed as the original installation.
PERFORMANCE and the evidence README retain coverage, overlaps, limits and hashes.

GO only for policy review; no installed config, forced prompt, model/provider
call, token/timing claim, compiler/CLI edit, protocol change or automatic rerun.
Any symmetric model experiment still requires separate authorization and pre-run
gates. The full-suite and 1.0 gates remain blocked. Required check (228 pages,
two interactive) and test (standalone 1/1 plus 320/320, zero failures/skips) pass;
1,200,000-ms command receipts and unchanged-source checks accompany this update.

### Prebuild Discovery Follow-Up (2026-09-10)

The user-authorized next investigation targets the unresolved prebuild cost only.
Read-only R12 traces show six Kudzu broad root inventories at 69,798 B versus five
React inventories at 49,533 B; all truncate at 100 paths, including 559/600 versus
436/500 dependency paths. K2's second root inventory repeats 48 previously listed
paths (5,610 B with newlines), but also adds paths. Package searches followed by
README reads occur before every Kudzu first edit; all first builds pass. K2 also
probes nonexistent package `dist/`, while K4 enumerates 100 declaration paths.
The package-location question, not missing compiler support, authorizes this slice.

The existing README gains a 689 B Installed Package map before Quick Start, linking
the unchanged Authoring/Verify sections and existing public declarations/manifest.
It states actual package locations and the existing local build invocation without
another example, command, API, internal docs dump, task-specific advice or stopping
rule. Package smoke checks the map's 1 KiB ceiling and links, installed README
equality, absent package `dist/`/`docs/`, unchanged exports/source, and the exact
documented shell build. The baseline README fails the new map assertion.

Measured discoverability: four direct location links replace no map; full README
bytes increase 10,612 -> 11,301, while Authoring remains 2,023 B. This is not an AI
token reduction. Search-before-read behavior, later-offset readers and root glob
semantics may receive no benefit. Root inventory behavior is an external tool
concern, and OpenCode configuration remains outside authorization. Cached context
is still charged; the 162,685 excess prebuild tokens remain unresolved.

Evidence and exact trace lines are in PERFORMANCE and the separate ignored
`test-results/ai-delivery-production/prebuild-discovery-20260910/` research record.
All 1,039 frozen R12 files, 19 preceding follow-up evidence files and the three
browser utility/test/document hashes verify unchanged. Historical sections above
are preserved rather than retrospectively changing their conclusions.

Sequential 1,200,000-ms focused 11/11, check (228 pages, two interactive), required-
Chrome standalone 1/1 plus 320/320 (no skips/failures), and package smoke (three
pages, one interactive) pass. Search fixture raw/gzip bytes and runtime digest
remain unchanged. Semantic primitives, core passes/LOC, runtime concepts and
production browser-byte deltas are zero. Release remains 0.16.28; no model call,
benchmark rerun, configuration edit, commit, push, version bump or release.
Any future equal-condition measurement still requires separate authorization and
explicit lifecycle/protocol/browser/copy gates. The full-suite and 1.0 gates remain
blocked; the next unresolved problem is prebuild exploration, not postbuild output.

### Exact Target Diagnostics Follow-Up (2026-09-09)

R11's four CSS-uppercase lookup failures authorize a local diagnostic-only fix.
Snapshots already contain computed AX names. The shared fill/click error now
reuses its existing AX tree to show at most five same-role candidates (only exact
matches on ambiguity), their total count, and 160-character names with truncation
flags. No extra browser query, DOM scan, fuzzy matching, retry, relaxed assertion
or new browser API. Hidden/inert/template nodes stay excluded; ambiguity still
fails before dispatch. Favicon handling, security and cleanup remain unchanged.

One generic Chrome/CLI regression fails before the change and covers uppercase
computed labels, ARIA names, exclusion, ambiguity, and count/name bounds. Core
LOC/passes, semantic primitives, runtime concepts, dependencies and deployed
raw/gzip browser bytes change by zero. PERFORMANCE records the evidence and
limits. No model rerun or token-saving claim; the repeated agent inventory cost
is not proven solved. R11 copies/hashes/scores remain frozen, and future model
measurements require a new equal-tool freeze. No release/version transaction.

Verification: focused checks **9/9**; sequential 1,200,000-ms check (227 pages,
two interactive), required-Chrome npm test (standalone **1/1** plus **320/320**,
zero failures/skips), and package smoke (three pages, one interactive) all pass.
Four imported-search fixtures retain 32,190 raw / 12,324 gzip JS bytes and their
runtime digest. Frozen input/package/binary integrity and the R11 archive checksum
pass; `git diff --check` passes. Utility delta is +7/-2 lines, regression +42,
public instructions +4 net; existing dirty edits are preserved.

### Missing Favicon Smoke Follow-Up (2026-09-09)

Source-only tooling fix: the local smoke server returns 204 only for an exact
automatic `/favicon.ico` image request with no filesystem entry and no matching
authored document `href`/`src`. Real files are served; explicit icons, missing
scripts/styles, document requests, broken/escaping symlinks, exceptions and network
failures are not ignored. CDP collection and the bounded observation window stay
unchanged; there is no document/SPA fallback. CLI regression coverage includes a
genuinely favicon-free page and authored resource failures.

R11 remains **4/5 versus 5/5**, with all eighteen historical smoke calls nonzero
and every recorded interaction/cost unchanged. Frozen-input/package/binary
integrity checks pass; archived tools/protocols are not updated. No model rerun,
rescoring, commit, push or release. Future measurements require a new tool freeze.
Semantic primitives, core passes/LOC, runtime concepts and browser-byte deltas
remain zero. PERFORMANCE records this follow-up separately from R11 closure.

Verification passes: focused browser/copy/frozen-protocol tests **8/8**; sequential
1,200,000-ms gates pass check (227 pages, two interactive), required-Chrome npm
test (standalone **1/1** plus **319/319**, no failures/skips), and package smoke
(three pages, one interactive). Four search fixtures retain 32,190 raw / 12,324
gzip JS bytes and their prior runtime digest. Only verification docs follow.

### Equal Browser Tools R11 Closure (2026-09-09)

The authorized separate CONTENT-only experiment is complete: **Kudzu 4/5 versus
React + Vite 5/5**, with all ten final builds and unchanged scored Chrome journeys
passing. Both sides' 5/5 agents now use native browser input and rendered-text
checks. Browser adoption is proven, but AI-cost superiority is not: total tokens
are **1,791,290 versus 1,336,775**, median elapsed 160,513 versus 152,302 ms, and
tokens per success 447,823 versus 267,355. K0's 409,491 input tokens exceed the
unchanged 400,000 budget. The independent 6,727-token preflight brings recorded
experiment cost to 3,134,792 tokens; provider-reported subscription dollars are
zero, not free compute. No incomplete attempt, retry or replacement occurred.

R11 freezes equal `.tools` copies of the two generic browser files and task-neutral
public instructions through the existing publicContext facility. A new frozen
adapter copy permits optional post-build browser work, while historical adapters,
canonical protocols, task, scorer, model `openai/gpt-5.6-sol`, OpenCode 1.18.27,
React 19.2.8 / Vite 8.2.2, budgets and serial ten-entry schedule remain unchanged.
The unshipped `0.16.27-browsertools.20260909.1` working-tree snapshot installs from
a read-only SHA-256-addressed tarball with lock integrity, not a mutable symlink.
Main remains 0.16.27. No release, commit, push, tag or version transaction occurred.

The runner excludes harness files from both source-retention inventories and
invalidates changed/missing/symlink tools/docs after the agent and after acceptance.
All 60 checks pass. Deterministic fake agents prove equal copies, file-by-file
tamper rejection even with passing acceptance, source exclusion and normal shell
accounting; real Chrome proves input/click and timeout cleanup. Managed Chrome
inherits the runner's process group so a deadline cannot strand a detached browser.
This remains trusted-local tooling, not a hostile-agent sandbox. Browser commands
are ordinary shell tools; inner observations/input are not hidden build attempts.

K0 and R1/R3/R4 correct CSS-transformed accessible names after real browser failures.
The agents perform 19 successful fills each, no clicks, across six/twelve shell
calls. All eighteen calls nevertheless exit nonzero: four initially fail exact
names, fourteen finish interaction commands but report the starter's missing
favicon. Every agent discloses the 404; passing individual text checks must not be
called a clean smoke exit or exhaustive accessibility proof. All five Kudzu agents
still repeat raw-HTML marker inventory. Three output spill files are retained with
hashes; archival full command counts are 72/102 versus model-visible 69/100, without
retroactively charging recovered bytes as observed tokens.

PERFORMANCE contains per-attempt metrics, protocol examples, actual verification
quality, source review, package/tool hashes and comparative R9/R10 evidence.
Evidence root: `test-results/ai-delivery-production/browser-tools-r11-20260909/`.
Protocol SHA-256 is `68bc6175101cedc3a7e66fbf3aa20db5add2365142ae64ebce0ab6a71fbb709e`;
tarball SHA-256 is `4a5c74cbb7adf9e5a70708f959a2b3c2f4f68351a67a7fed831770ca3e0c104b`.
The audit reconciles 30 attempts, 180 streams, 510 artifacts and 495 source files
across the three revisions without rescoring them. Semantic primitives, core
passes/LOC, runtime concepts, dependencies and browser-byte deltas are zero.

Kudzu tokens rise 2.80% versus R10 while React rises 185.91%; the narrower 1.340x
ratio does not demonstrate savings. Five trials, changed tool exposure and
instructions, separate schedules, cache/service and host drift preclude causal
superiority. R9 remains 3/5 versus 5/5, R10 remains 4/5 versus 5/5, and full R8
remains 23/25 versus 24/25. Neither the full-50 nor the 1.0 gate is cleared.
Next blockers are bounded observation output, clear separation of request errors
from interaction assertions, and remaining post-build inventory/source exploration.
Any follow-up must freeze a new protocol before measurement, not ignore errors,
selectively retry budget failures, expand a general browser API or claim a release.

Final sequential 1,200,000-ms gates pass: check (227 pages, two interactive),
required-Chrome npm test (standalone 1/1 plus 318/318, no failures/skips), fresh
package smoke (three pages, one interactive), and diff whitespace validation.
Four imported-search fixtures preserve 32,190 raw / 12,324 gzip JS bytes and the
prior runtime digest. The sibling `browser-tools-r11-20260909-audited.tar.gz` and
external `.sha256` retain frozen inputs, tools, package source/tarballs, historical
byte copies, all comparison traces/artifacts, original tool-output spill files,
verification and provenance. Subsequent changes are verification/archive metadata
only; existing batched-summary/docs edits remain intact.

### Ordinary Browser Smoke Follow-Up (2026-09-09)

Historical implementation record; R11 above closes the then-future equal-tool
experiment, without replacing this record or the historical scores.

User-authorized follow-up to the failed summary candidate addresses raw-HTML
verification with a real, repository-only Chrome path rather than another hint or
compiler heuristic. `test/browser-smoke.mjs` reuses the unchanged generic CDP
transport copied to `test/browser-cdp.mjs`. Neither file imports grader code.
Extraction failed the frozen acceptance hash test, so the oracle was restored
byte-for-byte; sharing it must wait for a new protocol. Historical raw
results, task assertions, adapter, protocol and budgets are not rewritten.

The visible shell interface opens a trusted build directory, returns bounded
rendered-text/accessibility snapshots, fills and clicks exact accessible role/name
targets, and optionally checks caller-supplied rendered text. Native input changes
DOM; inert templates are not counted as content. Failure is nonzero, not a fallback
to regex approval. One disposable loopback server/profile/browser group owns the
30-second session and cleanup. External proxy traffic is rejected, not forwarded.
No Playwright/browser tool was installed in this environment; no dependency was
added. This is Linux smoke tooling, not a shipped framework API, sandbox, backend
fixture, comprehensive accessibility harness or hidden acceptance invocation.

PERFORMANCE records invocation examples, exact bounds, network and cleanup limits,
the generic framework-neutral DOM regression, and future equal-tool protocol
requirements. Static artifact checks remain separate. Semantic primitives, core
passes/LOC, runtime concepts, adapter rules, dependencies and browser bytes change
by zero. No model experiment ran and no token/cost advantage is claimed.

Next: review and freeze a separately named future protocol with identical public
utility files/docs and explicit browser shell permissions for both frameworks,
retaining commands/observations and normal tool/time/token accounting. Do not copy
test assertions, grading answers or task-specific selectors into model tools.
Do not rerun automatically, rescore R8/R9/R10, release, or bump versions. The AI
delivery and 1.0 gate remain blocked until new equal-condition evidence exists.

Final sequential gates use 1,200,000-ms timeouts: check passes (227 pages),
required-Chrome tests pass standalone 1/1 plus 317/317 with no skips/failures,
and packed-package smoke passes (3 pages). The unchanged frozen-oracle hash gate
passes; the generic smoke includes a stalled-renderer deadline and CLI failure
exit check. Tooling/test size is 132 + 51 + 55 lines, with no compiler or deployed
runtime change. Existing imported-search browser bytes/digest remain unchanged.
PERFORMANCE records the earlier extraction failure and final results; only this
verification metadata follows those checks. Existing dirty work is preserved.

### 0.16.28 Release Transaction

The user separately authorizes the accumulated tooling/evidence scope as core
`0.16.28` and generator `0.1.153`, including commit/push, exact-commit CI,
immutable annotated tag, GitHub release and protected npm publication. Earlier
session-specific no-release statements above remain historical records. This is
not acceptance of the AI-delivery or 1.0 gates, and authorizes no model calls.

The public npm change is the final route HTML lexical summary, batched at 64 reads
and printed only after successful promotion, plus its generic documentation.
Browser smoke/CDP utilities, equal public-context copy/integrity checks and
R9/R10/R11 reports stay repository-only. Package allowlists remain unchanged.
Release review fixes the browser-test skip/required-Chrome contract and a proven
missing `srcset` favicon false pass, with CSS-image coverage using CDP request
classification. Frozen experiment tools, protocols, archives and scores are not
rewritten. PERFORMANCE records scope, measurements, review and verification.

No semantic primitive, core pass/LOC, runtime concept, dependency or deployed
browser byte is added. Build orchestration changes by +30 net lines (31 added,
one removed, correcting the earlier +31 count). Existing
R10 paired measurements preserve deploy bytes, with no established >5% final
regression or speedup. No AI-token advantage is demonstrated: full R8 remains
23/25 versus 24/25, focused R9 is 3/5 versus 5/5, local R10 and R11 each 4/5
versus 5/5. Registry integrity and fresh generator install remain publication
gates; protected environment approval must use the normal GitHub UI.

Local sequential gates pass: check (228 pages, two interactive), required-Chrome
standalone 1/1 plus 320/320 tests with no skips, fresh packed-package smoke and
both dry-run manifests (core 60 files, generator four). Four search fixtures keep
32,190 raw / 12,324 gzip JS bytes. PERFORMANCE records exact pack sizes and the
subsequent verification-metadata-only boundary; CI/publication are still separate
transaction gates.

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
| `0.15.2` | Closed by layout composition | Preserve owner-bounded queue, deduplication, dismissal, route persistence, live-region, and timer cleanup evidence. | No production change; no release consumed |
| `0.15.3` | Closed by stop condition | Preserve native top-layer and in-place composition until three independent authored-range failures exist. | Zero qualifying failures; no release consumed |
| `0.16.0` | Closed by existing effect ownership | Preserve real package mount, replacement, disposal, remount, and static exclusion evidence. | No production change; no release consumed |
| `0.16.1` | Released | Preserve the retained CodeMirror instance boundary, bidirectional updates, error recovery, accessibility, and exact cleanup. | None |
| `0.16.2` | Closed by existing effect ownership | Preserve retained Chart.js data/resize updates, listener and route cleanup, fresh remount, accessibility, and static exclusion. | No production change; no release consumed |
| `0.16.3` | Released | Preserve state-owned order, keyed identity, keyboard parity, invalid-input recovery, package disposal, and static exclusion. | None |
| `0.16.4` | Released | Preserve scoped GSAP presentation, reduced-motion fallback, dependency/owner cleanup, fresh remount, and static exclusion. | None |
| `0.16.5` | Released | Preserve the reproducible endurance evidence, project notification ownership, and bounded stale-prefetch cache disposal. | None |
| `0.17.0` | Closed by existing layout effect ownership | Preserve project notification connect, keyed update, reconnect, stale rejection, offline recovery, retained navigation, and exact cleanup evidence. | No production change; no release consumed |
| `0.17.1` | Closed by stop condition | Preserve independent effect ownership until three applications prove the complete shared transport and bounded replay contract. | Zero qualifying applications; no release consumed |
| `0.17.2` | Released as `0.16.5` | Preserve stale-prefetch rejection and bounded document, state, resource, listener, DOM, and external-instance ownership. | Patch release retained the `0.16.x` public version line |
| `0.18.0` | Closed by existing artifact reporting | Preserve exact route/source ownership, bytes, hashes, preload equality, zero-JavaScript controls, and bounded prefetch policy. | No production change; no release consumed |
| `0.18.1` | Released as `0.16.6` | Preserve one guarded literal package edge, native module-map deduplication, exact owner cleanup, deferred artifact ownership, and static exclusion. | Patch release retained the `0.16.x` public version line |
| `0.18.2` | Released as `0.16.7` | Preserve on-demand retained editor mount, bidirectional updates, failure recovery, identity, exact cleanup, cached fresh remount, and static exclusion. | Patch release retained the `0.16.x` public version line |
| `0.18.3` | Released as `0.16.8` | Preserve shared deferred ownership, interaction-only loading, native document module-map deduplication, exact owner cleanup, binding-aware import validation, and static exclusion. | Patch release retained the `0.16.x` public version line |
| `0.19.0` | Released as `0.16.9` | Preserve the compatibility registry, reachable source inventory, exact ranges, and package-neutral output boundary. | Patch release retained the `0.16.x` public version line |
| `0.19.1` | Released as `0.16.10` | Preserve anonymous, invalid/valid login, token restore, layout-shared session reads, 401 clear, replacement navigation, and public zero-JavaScript output. | Patch release retained the `0.16.x` public version line |
| `0.19.2` | Closed by existing semantics | Preserve connected auth, query, route, create/edit validation, refresh, persistence, admin deletion, logout, source retention, accessibility, and public zero-JavaScript output. | No production change; no release consumed |
| `0.19.3` | Closed by existing semantics | Preserve connected Memos login, loading/error, feed, overlapping-key pagination, refresh, CRUD, reload persistence, logout, source retention, accessibility, and public zero-JavaScript output. | No production change; no release consumed |
| `0.19.4` | Closed by existing effect ownership | Preserve reaction mutation, version deduplication, stale-socket rejection, reconnect, keyed identity, exact route cleanup, fresh ownership, bounded handles/listeners/timers, and public zero-JavaScript output. | No production change; no release consumed |
| `0.19.5` | Deferred by stop condition | Resume only from a complete pinned Actual Budget workspace with an executable dependency graph and honest retention denominator. | Sparse acquisition omits required workspace and core packages; no compatibility claim |
| `0.20.0` | Released as `0.16.11` | Preserve stable diagnostic schema/codes, authored ranges, human errors, compatibility reuse, and zero browser/output delta. | Patch release retained the `0.16.x` public version line |
| `0.20.1` | Released as `0.16.12` | Preserve bounded deterministic reachable inventory, first-blocker retention, existing-record reuse, and zero browser/output delta. | Patch release retained the `0.16.x` public version line |
| `0.20.2` | Released as `0.16.13` | Preserve exact emitted-route lookup, authored provenance, semantic ownership, capability/artifact byte reasons and hashes, bounded deterministic output, structured missing-route diagnostics, and zero-JavaScript explanation. | Patch release retained the `0.16.x` public version line |
| `0.20.3` | Deferred by evidence gate | Resume only after recorded AI trials prove one repeated correction safe and useful with a stable diagnostic code and compiler-proven preconditions. | No recorded AI trials; no production change or release consumed |
| `0.20.4` | Released as `0.16.14` | Preserve pinned equal conditions, isolated paired attempts, raw failures, independent acceptance, attribution, failure-inclusive costs, source retention, and browser artifact evidence. | Deterministic fixture validates the protocol only; no framework ranking claimed |
| `0.20.5` | Closed by measured stop condition | Preserve the negative tooling-cost result and do not present structured tools as an AI cost reduction. | Tool-assisted attempts cost 16,933 more tokens per success; no release consumed |
| `0.21.0` | Closed by existing semantics | Preserve the complete browser parity matrix, large-list keyboard/release acceptance, and static exclusion controls. | No production change; no release consumed |
| `0.21.1` | Released as `0.16.16` | Preserve 100/1,000/10,000-route phase, RSS, output, digest, incremental-equivalence, recovery, and bounded canonical-AST retention evidence. | Full 10,000-route report has one complete measured run after two measured-stage diagnostics; no projection used |
| `0.21.2` | Closed by existing semantics | Preserve initial/session/lazy bytes, keyed/range/navigation median alarms, and bounded endurance ownership evidence. | Same-revision absolute gates; structural artifact bytes are not compressed network transfer |
| `0.21.3` | Released as `0.16.17` | Preserve exact package, browser, benchmark, registry, and fresh-install evidence. | One initial navigation benchmark invocation stalled at the outer timeout; its clean seven-profile rerun passed all alarms |
| `0.21.4` | Full r8 and separately authorized single focused r15 schedule finished; gate blocked | Cost objective unmet; stop model calls. Retain observation reuse, do not adopt R14 inventory policy, preserve all historical failures. Any follow-up is offline review, not an automatic rerun. | Full r8 stays 23/25 versus 24/25. R15 CONTENT is 5/5 versus 5/5 with fully attributable totals 1,652,454 versus 1,385,083; Kudzu tokens per accepted task are 19.30% higher. R13/R12 comparisons remain descriptive. All pre-call lifecycle/protocol/browser/copy gates pass; no selective retry, compiler/runtime/config change or release. |
