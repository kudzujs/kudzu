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

## `0.11.x`: Async And Server Data

### `0.11.0`: Owned Fetch Lifecycle

- **Purpose:** establish the greenfield loading/error/data/refetch baseline.
- **Expected boundary:** existing EffectIR, ordinary state, and native `fetch`.
- **Acceptance:** delayed stale response loses state authority, HTTP failure is
  accessible, explicit refetch recovers, route removal blocks late writes, and
  authored cancellation is tested where required.
- **Stop condition:** a query cache is added to implement one request.
- **Done condition:** the project list journey passes and `/help` stays zero-JS.

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

## `0.12.x`: Routing And Application Lifetime

### `0.12.0`: Project Route Shell And Runtime Parameters

- **Purpose:** prove directly addressable project and issue routes.
- **Expected boundary:** file routes, runtime parameters, complete HTML, and
  native navigation.
- **Acceptance:** direct entry, reload, invalid parameter rejection, project to
  issue navigation, and standalone fallback.
- **Stop condition:** an SPA route registry is introduced.
- **Done condition:** all target routes are addressable without a browser router.

### `0.12.1`: Shared Layout, History, Focus, And Scroll

- **Purpose:** complete the accepted same-document application group behavior.
- **Expected boundary:** existing navigation runtime and layout/route lifetime.
- **Acceptance:** back/forward, retained layout state, route cleanup, title/live
  announcement, focus destination, hash behavior, and explicit scroll policy.
- **Stop condition:** browser-native navigation is weakened for routes outside
  the approved group.
- **Done condition:** keyboard and browser-history journeys pass with native
  recovery.

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

### `0.12.3`: Route Failure And Restoration Policy

- **Purpose:** decide application-visible handling of navigation/data failures.
- **Expected boundary:** native fallback and application-owned error UI first.
- **Acceptance:** invalid document, asset failure, offline/error state, retry,
  focus restoration, and no half-replaced route.
- **Stop condition:** a generic React-style error-boundary renderer is required.
- **Done condition:** every failure leaves a valid document and recoverable
  navigation path.

### `0.12.4`: Nested Layout Evidence Decision

- **Purpose:** determine whether multiple independently retained layout owners
  are required.
- **Acceptance:** at least three unrelated application routes demonstrate the
  same lifetime that one shared layout plus static composition cannot express.
- **Stop condition:** route nesting is only a source-organization preference.
- **Done condition:** either existing layout composition is accepted or a
  minimal layout-owner chain is approved with explicit disposal order.

## `0.13.x`: Forms

### `0.13.0`: Production Form And Server Validation

- **Purpose:** complete issue creation with native constraints and server errors.
- **Expected boundary:** native form, FormData, state, and async handler.
- **Acceptance:** keyboard submit, native constraints, pending state, field and
  form errors, retry, focus/ARIA linkage, and retained valid input.
- **Stop condition:** React Hook Form is reproduced.
- **Done condition:** complete accessible create/edit behavior passes without a
  form runtime.

### `0.13.1`: Nested Fields, Field Arrays, Dirty, And Touched

- **Purpose:** determine which form metadata needs framework support.
- **Expected boundary:** object/array state and keyed rows first.
- **Acceptance:** dynamic assignee/checklist rows, reorder/remove, conditional
  fields, dirty/touched display, reset, and exact row identity.
- **Stop condition:** a registration/proxy runtime is added before three
  independent forms require the same metadata graph.
- **Done condition:** application composition is accepted or the smallest
  repeated metadata semantic is isolated.

### `0.13.2`: Multistep Draft And Autosave

- **Purpose:** prove draft persistence across steps and failures.
- **Expected boundary:** routes or conditionals, state, dependency effects,
  debounce cleanup, and storage/server persistence.
- **Acceptance:** step navigation, validation gate, debounced save, stale-save
  rejection, reload restore, reset, and conflict/error state.
- **Stop condition:** a wizard or autosave scheduler is added for one form.
- **Done condition:** no data loss occurs across navigation, reload, or failure.

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

## `0.14.x`: Lists, Tables, And Virtualization

### `0.14.0`: Project Table CRUD And Identity

- **Purpose:** establish the production table baseline.
- **Expected boundary:** existing keyed list runtime and valid table structure.
- **Acceptance:** insert, update, delete, reorder, sort, filter, selection,
  row-local edit state, keyboard access, and retained DOM identity.
- **Stop condition:** a data-grid runtime is introduced for ordinary tables.
- **Done condition:** complete CRUD behavior passes with measured update latency.

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

### `0.14.2`: Infinite Loading Composition

- **Purpose:** prove sentinel-driven incremental loading before virtualization.
- **Expected boundary:** IntersectionObserver, owned fetch, append, keyed list.
- **Acceptance:** cursor progression, duplicate suppression, end/error/retry,
  route cleanup, retained identity, and bounded result policy.
- **Stop condition:** infinite-query or observer runtime is added for one list.
- **Done condition:** the full journey passes with explicit network and memory
  bounds.

### `0.14.3`: 10,000-Item Browser Decision

- **Purpose:** measure direct DOM, pagination, and windowing alternatives.
- **Acceptance:** equivalent behavior, keyboard access, edit identity, scroll
  latency, DOM count, heap, and update latency across alternatives.
- **Stop condition:** a virtualization result is claimed without equivalent
  behavior or repeated samples.
- **Done condition:** the selected strategy and thresholds are recorded without
  assuming direct 10,000-row rendering is acceptable.

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

## `0.15.x`: Overlay And Layer Ownership

### `0.15.0`: Native Dialog Baseline

- **Purpose:** use browser top-layer semantics for destructive issue actions.
- **Acceptance:** initial focus, Escape/cancel, confirm, trigger focus restore,
  inert background, route cleanup, and static exclusion.
- **Stop condition:** a custom modal/focus-trap runtime replaces `<dialog>`.
- **Done condition:** project delete and edit confirmation pass accessibly.

### `0.15.1`: Popover, Dropdown, And Menu Behavior

- **Purpose:** establish the native-first non-modal overlay boundary.
- **Expected boundary:** native Popover where available, ordinary state/events,
  and owned listeners.
- **Acceptance:** positioning policy, outside click, Escape, trigger restore,
  roving keyboard behavior where menu semantics apply, and route cleanup.
- **Stop condition:** package Portal/Slot reconciliation enters the runtime.
- **Done condition:** supported native and custom boundaries are explicit.

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
| `0.10.3` | Active | Add the guarded application-owned persistence and state-release journey. | None |
| `0.11.0` onward | Blocked | Wait for the preceding patch acceptance and release record. | Ordered dependency |
