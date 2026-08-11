# Large Application And AI-Native Development Plan

## Status

Active execution plan after `0.8.32`. This document turns the current compiler audit into an ordered implementation program. It does not mark any planned capability as supported and does not authorize a React runtime, VDOM, hydration, retained browser component tree, generic rerenderer, public store/query/resource API, SPA router, or islands.

[`MIGRATION_ROADMAP.md`](../../MIGRATION_ROADMAP.md) remains authoritative for product invariants and fixture-driven feature selection. This plan is authoritative for the order and completion evidence of compiler generalization, large-application foundations, compatibility boundaries, AI tooling, and scale validation. If implementation evidence changes a boundary, update this document before broadening a patch.

## Product Outcome

Kudzu must support ordinary React-shaped TypeScript and TSX from small static sites through production SaaS, dashboards, CRUD, commerce, authenticated applications, realtime collaboration, data-heavy interfaces, and large module graphs. The browser should receive complete HTML and only the capabilities required by each route or application lifetime.

The differentiating KPI is `cost per successful task`, not source line count alone. A successful task includes build, browser behavior, accessibility, output, and ownership checks. Track input/output/reasoning tokens, files read and modified, tool calls, compiler attempts, failed attempts, correction cycles, completion time, source retention, and final client bytes.

The governing principle is:

> Write what AI already knows. Compile away what AI should not need to reason about.

## Audited Baseline

The current implementation already provides:

- complete route HTML and zero JavaScript for static routes;
- synchronous logical state with direct DOM commits;
- route, layout, conditional, keyed, effect, ref, and Worker ownership;
- stable keyed row identity with nested lists, state, refs, effects, and SVG;
- stale effect-invocation isolation and explicit cleanup;
- narrow React, React Router, and Zustand-shaped normalization;
- JSON-safe ComponentAnalysis, ModuleIR, RouteIR v1, and CapabilityIR v1;
- no-write source compilation and capability-specific runtime emission;
- source-located fail-closed diagnostics and broad reduced-fixture coverage.

The current limiting architecture is observable in these files:

| Concern | Current owner | Limitation to remove |
|---|---|---|
| Project graph | `framework/compiler/source-graph.mjs`, `framework/build.mjs` | Global root, repeated parsing, narrow export resolution, no incremental project session |
| Normalization | `framework/compiler/source-compiler.mjs`, focused passes | Pass order and package ownership are implicit; semantically equal source often follows different shape-specific paths |
| Component/state analysis | `framework/compiler/source-compiler.mjs`, `analysis/component-analysis.mjs` | AST identity, identifier text, source offsets, and caller-side AST specialization remain central |
| Handler/binding analysis | `framework/compiler/descriptor-session.mjs`, `handler-lowering.mjs` | Capture/import/state discovery is name-based and arbitrary handlers become code before IR finalization |
| Effect/resource analysis | `effect-analysis.mjs`, resource-specific passes | Selected browser APIs have exact-shape ownership checks; there is no package-neutral resource model |
| Lists/ranges | `source-compiler.mjs`, `list-runtime.js` | Strong keyed ownership, but syntax recognition and runtime branches are list-specific and not a general range/window primitive |
| ModuleIR | `compiler/ir/module-ir.mjs` | Numeric slots, names, export strings, and formatted owner strings coexist; several sections are descriptive rather than authoritative inputs |
| RouteIR/CapabilityIR | `route-capability-planner.mjs` | Validation is shallow and capability selection is site-wide across interactive routes |
| Build/codegen | `framework/build.mjs`, runtime generators | Full destructive builds, serialized-string handler reachability, source-text runtime surgery, no route chunk/CSS closure report |
| Browser lifetime | `native-runtime.js`, `effect-runtime.js`, `navigation-runtime.js` | Effects and native handlers invalidate stale writes at their existing effect or DOM ownership boundary |
| Compatibility | React/Router/Zustand passes plus core branches | Package-specific knowledge is not contained behind one adapter boundary |
| AI interface | CLI and string diagnostics | No stable diagnostic codes, semantic index, explain, fix, or migration analysis output |

## Architecture Direction

```text
ProjectSession
  -> parsed module and package graph
  -> compatibility adapter registry
  -> normalized modules with stable declaration/site identities
  -> binding and symbol resolution
  -> source semantic analysis
       component and prop edges
       state, derived, event, and operation edges
       effect and resource ownership
       collection and range ownership
  -> strengthened existing ModuleIR
  -> build-time render instantiation
  -> RouteBuildRecord with RouteIR and artifact edges
  -> per-route capability signature and chunk closure
  -> HTML, CSS, and capability-specific ESM
```

This is an incremental evolution of the current repository:

- Keep ComponentAnalysis and ModuleIR; make their references stable and their records authoritative.
- Keep `renderPage()` for build-known execution and concrete route ownership IDs; stop using it to rediscover source semantics already present in ModuleIR.
- Keep RouteIR and CapabilityIR; deepen validation and replace parallel route facts with one RouteBuildRecord.
- Keep existing browser runtimes; extract package-neutral semantic primitives only after fixtures prove repeated ownership needs.
- Do not introduce a general JavaScript bytecode VM or model the complete TypeScript language in a new IR.

## Required Invariants

- Static routes remain zero JavaScript.
- Interactive routes add no capability unrelated to their source and route lifetime.
- Complete HTML remains the initial document.
- Native navigation remains the fallback and default.
- React and ecosystem package source may be accepted, normalized, migrated, or adapted without executing React.
- Package-specific knowledge must not leak beyond the compatibility boundary into generic ownership, dataflow, IR, or browser runtime code.
- New semantic support starts from a real or reduced failing application fixture.
- Every patch is independently reviewable, fail-closed, and measured against representative output.
- A compiler refactor must preserve accepted source, diagnostics, RouteIR, HTML, assets, and browser ownership unless its scope explicitly changes one contract.

## Preserve, Refactor, Avoid

### Preserve

- Build-known execution and complete static output.
- Direct DOM ownership and synchronous logical state.
- Route/layout/key-path lifetime semantics.
- Keyed identity and exact state/effect/ref release.
- Effect invalidation and cleanup.
- JSON-safe, versioned stage boundaries.
- Source-located diagnostics.
- Rendered Worker exclusion and content hashing.
- Capability-specific output with no React runtime.

### Refactor

- Identifier text into resolved SymbolRef records.
- AST identity and `pos:end` keys into stable source-local declaration/site IDs.
- Exact setter syntax into semantic value and state-operation analysis.
- Caller-side component AST copying into a component/prop/callback graph.
- Manual export discovery into a project module-symbol graph.
- Primitive-only dependencies into property-path and derived dependencies.
- Resource-specific ownership passes into a package-neutral ResourceIR when evidence permits.
- Serialized handler URL searches into explicit artifact references.
- Site-wide capability unions into route capability signatures.
- Full destructive development builds into project-session invalidation and rollback-safe output.
- String-only diagnostics into structured diagnostics suitable for machines and AI agents.

### Avoid

- React runtime fallback, hydration, islands, or a browser component tree.
- Public Kudzu-specific router, query, store, form, or scheduler APIs before migration evidence.
- One core pass per ecosystem package.
- A generic rerender engine or general callback registry.
- Incomplete dynamic import support.
- Speculative cache, virtualization, portal, stream, or resource runtimes.
- File splitting that does not reduce semantic coupling.

## Priority Program

### Execution Status

- [x] P0.1 Source-local binding index is complete in `0.8.28`. Reactive binding capture/import discovery and lowering use the index only when the complete expression is indexed; synthesized keyed expressions retain the existing fail-safe path. Focused scope tests, a 1,000-reference guard, browser integration, all 185 tests, and packed-package smoke pass.
- [x] P0.2 Symbol-aware descriptor discovery is complete in `0.8.29`. Native handler, effect, remaining binding, list evaluator, optimized-command, and effect-resource discovery/lowering use the source-local binding index when it owns the complete AST; synthesized trees retain the existing fail-safe path. Focused lexical-shadow, JSON-safe IR, resource-ownership checks, all 187 tests, and packed-package smoke pass.
- [x] P0.3 Graph diagnostics is complete in `0.8.30`. Reachable ordinary modules validate relative runtime imports/re-exports and reject every dynamic `import()` at the importer source location before compilation or generated module loading. Ordinary and Worker traversal retain separate ownership, type-only and unreachable edges remain excluded, focused page/helper/re-export/dynamic fixtures pass with all 189 tests and packed-package smoke, and no export-symbol graph, ProjectSession, runtime, or public API is added.
- [x] P0.4 Async native handler ownership is complete in `0.8.31`. Mounted native registrations invalidate direct/captured setters, queued commits, and captured refs before listener removal. Chrome route, keyed-row, document-disposal, and synchronous event-dispatch checks, all 189 tests, and packed-package smoke pass without cancelling application promises or adding a scheduler.
- [x] P0.5 Staged and collision-safe output is complete in `0.8.32`. Production output completes in one project-local staging tree, public files are compared against generated route/runtime/handler/chunk/Worker/CSS paths while copying, `afterBuild` runs before rollback-safe promotion, and ordinary failures preserve the prior `dist`. Same-root overlap and stale locks fail closed; after stale-lock removal, an interrupted promotion backup recovers on the next admitted build. Focused collision/replacement/dev checks pass with equivalent `v0.8.31` commerce deploy output; `.kudzu` remains compiler scratch for P0.6.
- [ ] P0.6 Explicit ProjectSession is next. Root and caches must become build-scoped so independent projects can compile safely in one process.

### P0: Semantic Correctness And Compiler Foundation

P0 creates the semantic base required by every later large-application capability. Do not begin broad ecosystem or application features before the relevant P0 dependencies are complete.

| Order | Objective | Dependency | Completion evidence |
|---|---|---|---|
| P0.1 | Source-local binding index | None | Local, parameter, import, capture, global, and unresolved references are classified consistently |
| P0.2 | Descriptor consumers use SymbolRef | P0.1 | Handler/effect/binding capture and import discovery no longer depends only on text names |
| P0.3 | Graph diagnostics | P0.1 | Relative dynamic imports and unresolved runtime edges fail at the source location |
| P0.4 | Async native handler ownership | None | Pending handlers cannot write after route or DOM ownership is released |
| P0.5 | Staged collision-safe build | None | Failed builds preserve prior output and public files cannot overwrite generated artifacts |
| P0.6 | Explicit ProjectSession | P0.1 | Root and caches are build-scoped; two projects can compile safely in one process |
| P0.7 | Parsed module/export cache | P0.6 | Shared modules are parsed and summarized once per build |
| P0.8 | Stable ModuleSymbol and SiteId | P0.6-P0.7 | Imports, re-exports, aliases, owners, and call sites use stable identities outside a pass |
| P0.9 | Semantic state-operation analysis | P0.1, P0.8 | Equivalent setter/helper forms lower to the same state operation |
| P0.10 | ModuleIR reference unification | P0.8-P0.9 | Signals, bindings, effects, keyed blocks, handlers, and owners use validated slots/symbols |
| P0.11 | Explicit route artifact graph | P0.10 | Handler/Worker/CSS/chunk retention uses structural references, not serialized string searches |
| P0.12 | Deep RouteIR and CapabilityIR validation | P0.10-P0.11 | Invalid state, effect, binding, list, ownership, and artifact references fail before codegen |

### P1: Large Application Foundations

| Objective | Required result |
|---|---|
| Cross-module component and prop dataflow | Deep composition, callbacks, setters, refs, context, and children retain semantic links without repeated AST inlining |
| Property-level derived dependencies | Object state can expose path-level dependencies without splitting application state into artificial primitives |
| Package-neutral shared state and actions | Existing Zustand support lowers through generic signal/action records; Redux-shaped research has a reusable target |
| Resource ownership | WebSocket, SSE, subscriptions, timers, observers, Workers, and imperative SDKs can share acquire/owner/dependency/cleanup semantics |
| Browser-only package modules | Native JS packages may be bundled only into effect/handler/resource chunks without build-time execution |
| Range ownership | Conditional, keyed, overlay, and future virtualized DOM ranges share release and identity primitives where semantics match |
| Route/layout graph | Nested persistent layouts and route lifetimes remain complete-document based and recoverable through native navigation |
| Route capability and chunk closure | Every route reports exact runtime, handler, package, Worker, and shared chunk edges |
| Route/layout CSS closure | Unrelated feature CSS is absent from a route unless configured global |
| Incremental development build | A source change recompiles and rerenders only affected modules/routes while preserving full reload correctness |
| Source-scale benchmark | At least 500 reachable modules, 50,000 TS/TSX lines, 50 routes, phase timings, and peak RSS |

### P2: Compatibility And Migration

- Add an internal compatibility adapter registry.
- Consolidate React compatibility ownership behind one adapter contract.
- Register React Router ownership without changing native navigation semantics.
- Move Zustand-specific logic out of generic core, handler, and state paths onto package-neutral shared-state/action IR.
- Characterize Redux/RTK, TanStack Query, React Hook Form, Zod, Radix/Headless UI/MUI, CSS-in-JS, animation, chart, drag/drop, virtualization, auth, REST, and GraphQL against real application fixtures.
- Prefer native packages and Web APIs, then compilation, deterministic migration, adapters, partial support, or explicit unsupported status in that order.
- Publish no public adapter API until an external adapter requires independent versioning.

### P3: AI Compiler Interface

- `kudzu check --json` with stable code, stage, file/range, symbols, module/component/ownership paths, compatibility status, suggestions, and safe fixes.
- `kudzu explain [route|symbol] --json` from the semantic and artifact graphs.
- `kudzu fix` only for deterministic changes whose preconditions the compiler proves.
- `kudzu migrate --analyze` for module, component, route, package, state, effect, resource, and blocker inventory.
- Migration readiness percentages must be calculated from actual classified modules/use sites, never estimated.

### P4: Production And Scale Validation

- Maintain Tier 1 reduced fixtures, Tier 2 complete small/medium apps, Tier 3 large production slices, and Tier 4 whole existing React applications.
- Require Chrome, Firefox, and WebKit journeys for production candidates.
- Add source maps, accessibility automation, keyboard journeys, security checks, output manifests, long-navigation heap tests, and deployment/cache guidance.
- Compare Kudzu and React + Vite first with the same agent, model, tools, task, and acceptance checks; expand only after the protocol is stable.
- Report median and range for tokens, cost, file reads, tool calls, builds, failures, completion time, source retention, output bytes, and accepted behavior.

## PR Execution Queue

### PR 1: Source-Local Binding Index

**Objective:** establish one correct reference classifier before further compiler generalization.

**Current problem:** `descriptor-session.mjs`, migration passes, and source analysis use identifier text plus separate shadow walkers. A local named like a browser global or import can be classified incorrectly, and later cross-module work has no stable foundation.

**Files:**

- Add `framework/compiler/analysis/binding-index.mjs`.
- Add `test/binding-index.test.mjs`.
- Update `framework/compiler/ast-helpers.mjs` only for shared scope primitives proven necessary.
- Update a narrow capture/import consumer in `framework/compiler/descriptor-session.mjs`.

**Internal contract:**

```text
resolveReference(identifier)
  -> local declaration
  -> parameter
  -> import
  -> outer lexical capture
  -> known global
  -> unresolved
```

Every result carries a stable source-local binding slot, debug name, declaration range when present, and reference range. AST nodes remain source-session-local and do not enter JSON-safe IR.

**Not in scope:**

- Cross-module TypeScript Program.
- Component graph changes.
- New accepted React syntax.
- Handler operation IR.
- Public API or runtime changes.

**Tests:**

- Shadowed `document`, `location`, `history`, `navigator`, and `console`.
- Imported name shadowed by callback parameter or local declaration.
- Outer component capture versus callback-local binding.
- State/setter name collision across owners.
- Existing Router, React, binding, native handler, and effect fixtures.

**Performance check:** create a focused synthetic source with at least 1,000 references and record index construction and lookup time. The purpose is a regression guard, not an optimization claim.

**Done condition:** capture/import classification uses the binding index for the selected consumer, all existing tests pass, representative generated artifacts remain byte-identical except for an explicitly corrected shadowing case, and no browser bytes are added.

### PR 2: Symbol-Aware Descriptor Discovery

**Objective:** move native handler, effect, and binding capture/import discovery onto the P0.1 binding index.

**Files:** `descriptor-session.mjs`, `handler-lowering.mjs`, `effect-analysis.mjs`, compiler tests.

**Tests:** shadowed imports/globals in native handlers, effects, bindings, and list evaluators; JSON-safe HandlerIR/BindingIR round trips.

**Done condition:** these analyses no longer decide identity from identifier text alone; output and diagnostics remain equivalent for existing accepted source.

### PR 3: Graph Failure Diagnostics

**Objective:** fail early for runtime graph edges the compiler cannot emit safely.

**Files:** `source-graph.mjs`, `source-compiler.mjs`; add page/helper/re-export invalid fixtures.

**Done condition:** unresolved relative imports/re-exports and ordinary dynamic imports report importer, source range, and specifier; no generated `.kudzu` path is the primary diagnostic.

### PR 4: Async Native Handler Invalidation

**Objective:** prevent late async event work from mutating released route/keyed ownership.

**Files:** `native-runtime.js`, navigation/list ownership integration, browser test fixture.

**Performance check:** compare synchronous event dispatch before and after; no material regression.

**Done condition:** a handler resolving after enhanced navigation or row removal cannot recreate or mutate released state, refs, or DOM.

**Completed in `0.8.31`:** the existing native registration lifetime now guards state mutation, queued commits, and captured ref lookup. Route and keyed-row browser checks recreate the same ownership IDs before old work resolves, and document disposal invalidates a pending layout handler. Replacement state and DOM remain fresh. Both 5,000-event Chrome dispatch medians are 6.4 ms, and the 209 B raw / 94 B aggregate gzip runtime cost is recorded in `PERFORMANCE.md`.

### PR 5: Staged And Collision-Safe Output

**Objective:** make production builds safe before scaling the build graph.

**Files:** `build.mjs`, build integration tests.

**Tests:** public collisions with route HTML, core runtime, handler entry, chunk, Worker namespace, source CSS, and configured CSS; failed build preserves prior `dist`.

**Done condition:** output is staged, validated, and promoted with rollback/recovery; public content cannot silently replace generated artifacts.

**Completed in `0.8.32`:** Kudzu emits into a locked project-local staging sibling, validates public files during one collision-safe copy traversal, runs trusted `afterBuild` mutation there, and promotes with backup rollback. Active overlap and stale locks fail closed; after stale-lock removal, the next admitted build restores an interrupted promotion backup. This is a guarded two-rename replacement, not a lock-free atomic directory exchange. Route HTML is written in bounded batches. Route HTML, core runtime, handler entry, actual esbuild chunk, Worker namespace, source CSS, and configured CSS collisions preserve the complete prior manifest; late hook failure also preserves it and successful replacement removes stale files. Before final lock/recovery hardening, twenty-one alternating 1,011-page replacement builds observed a 5.71% lower median with identical 3,056-file / 11,137,074-byte commerce deploy output.

### PR 6: ProjectSession And Explicit Root

**Objective:** remove import-time project globals and establish build-scoped graph/cache ownership.

**Files:** add `compiler/project-session.mjs`; update build, source graph, source compiler, and tests.

**Done condition:** two independent roots compile in one process, current CLI behavior and artifacts remain unchanged, and source caches cannot leak between projects.

### PR 7: Parsed Module And Export Summary Cache

**Objective:** make work proportional to unique modules instead of importer edges.

**Dependency:** PR 6.

**Test fixture:** at least 100 importers sharing component/helper modules; expose parse/summary counters in tests without production logging.

**Done condition:** each unchanged module is parsed and summarized once per project session; transformed mutable AST is not shared across transformer contexts.

### PR 8: Stable ModuleSymbol And SiteId

**Objective:** represent declarations, imports, re-exports, component calls, hooks, and ownership sites independently of transformed AST identity.

**Tests:** default/named exports, aliases, barrel chains, `export *`, cycles, and deterministic IDs after repeated compilation.

**Done condition:** cross-module semantic consumers use ModuleSymbol records and source-local SiteId values; readable names remain diagnostic metadata.

### PR 9: Semantic State Operations

**Objective:** lower semantically equivalent state updates to the existing structured HandlerIR path.

**Required source equivalence:**

```tsx
setCount(count + 1)
const next = count + 1; setCount(next)
const increment = () => setCount(count + 1); increment()
function increment(value) { setCount(value + 1) }; increment(count)
```

**Internal scope:** extend existing command/value representation only for proven pure state operations. Keep arbitrary safe browser handlers as generated ESM; do not invent a general JavaScript IR.

**Done condition:** the equivalent forms produce the same StateWrite semantics, browser result, ownership references, and zero-unused-runtime behavior; recursion, escape, mutation, and dynamic dispatch fail with explicit diagnostics.

### PR 10: ModuleIR Reference Unification

**Objective:** replace mixed state names, export strings, formatted owner strings, and slots with validated source-local slots and SymbolRef records.

**Tests:** malformed references, duplicate exports, parent/child reciprocity, cycles, version rejection, and JSON round trips.

**Done condition:** every HandlerIR, BindingIR, DerivedIR, EffectIR, KeyedBlockIR, and component specialization edge validates before build-module generation.

### PR 11: RouteBuildRecord And Artifact Graph

**Objective:** make route artifact selection structural.

**Files:** add a focused route-artifact module; update `build.mjs` and capability planning.

**Done condition:** handler, effect, Worker, CSS, package, and chunk reachability derives from explicit route edges; serialized `includes()` searches and parallel route-fact maps are removed.

### PR 12: Deep RouteIR And CapabilityIR Validation

**Objective:** fail before codegen for invalid concrete route references and capability projections.

**Done condition:** duplicate/missing state IDs, invalid event/effect dependencies, broken list ownership, invalid binding descriptors, and artifact mismatches have focused tests and deterministic diagnostics.

## Large Application Capability Order

After the relevant P0 foundations, investigate capabilities in this order:

1. Property-level derived dependencies over ordinary object state.
2. Multi-boundary component/prop/callback/ref/context dataflow.
3. Package-neutral shared state/actions and migration of current Zustand internals.
4. Browser-only package imports in owned effect/resource modules.
5. ResourceIR from at least two independent WebSocket/SSE/SDK fixtures with the same semantics.
6. Route/layout capability and CSS chunk closure.
7. Incremental source and affected-route builds.
8. Range ownership and virtualization only after a real data-heavy fixture establishes direct DOM limits.
9. Optimistic shared transactions only after independent mutation fixtures establish commit/rollback semantics.

## Compatibility Strategy

Classify every package or category as one of:

- Native: ordinary JS/TS/Web package; use it directly in an allowed build or browser module.
- Compiled: package-shaped source lowers to package-neutral semantics and the import is erased.
- Migrated: deterministic source transformation replaces a React runtime implementation with native/Kudzu source.
- Adapter: repeated package semantics justify an internal compatibility adapter.
- Partial: only an explicit API subset is supported.
- Unsupported: safe transformation is not proven; report the reason and migration path.

Current factual baseline:

| Ecosystem | Current classification |
|---|---|
| React source | Compiled, partial |
| React Router | Compiled, partial |
| Zustand | Compiled, partial, insufficiently isolated |
| Redux/RTK | Unsupported |
| TanStack Query | Migrated recipe, partial |
| React Hook Form | Migrated recipe, partial |
| Zod | Unsupported in ordinary shared schema placement; native-package candidate after module work |
| Radix dialog | Migrated to native dialog, partial |
| Headless UI/MUI | Unsupported |
| Plain CSS | Native |
| CSS Modules | Compiled, partial |
| Tailwind | Application-owned CSS adapter boundary |
| CSS-in-JS | Unsupported |
| Native SVG/canvas charts | Native/compiled |
| React chart, animation, drag/drop, virtualization packages | Unsupported or migration candidates |
| REST `fetch` | Native/compiled, partial async model |
| GraphQL/auth/browser SDKs | Unsupported until browser package/resource ownership exists |

## Application Corpus

| Tier | Required evidence |
|---|---|
| Tier 1 | Existing reduced positive/negative fixtures with exact semantic boundaries |
| Tier 2 | Complete small/medium React applications such as CRUD, forms, commerce, admin, chat, and calendar |
| Tier 3 | Production slices with 100-500 modules, shared state, routing, packages, forms, server state, charts, auth, and resources |
| Tier 4 | At least two whole existing React applications, including one stateful/realtime app, with 500+ modules and 100,000+ reachable lines where available |

Every corpus entry records upstream URL/commit/license, acquisition hash, original source, migration patch, retained-source percentage, package classification, unsupported census, route/module/component counts, browser/a11y journeys, artifact bytes, build/rebuild/RSS metrics, and AI task traces.

## AI Cost And Tooling Gates

Architecture work must connect to measurable AI cost reduction:

| Compiler capability | Expected cost reduction |
|---|---|
| Symbol graph | Fewer file searches, alias mistakes, and capture debugging cycles |
| Semantic operations | Fewer rewrites into exact compiler-recognized syntax |
| Component dataflow | Less component flattening and callback forwarding surgery |
| Property dependencies | Less artificial primitive-state decomposition |
| Compatibility registry | Less Kudzu-specific package knowledge and documentation lookup |
| Structured diagnostics | Fewer log-parsing and source-location tool calls |
| Explain graph | Fewer files read to understand a route or mutation |
| Deterministic fixes | Fewer repetitive source edits and retries |
| Incremental build | Lower feedback time per compiler attempt |
| Artifact graph | Faster runtime/chunk/debugging attribution |

The first comparison is Kudzu versus React + Vite using the same agent, model, tools, prompt, task, and acceptance suite. Record at least five attempts per task and report medians and ranges. A build-only result is not success.

## Production Gates Before 1.0

- Async native and effect work cannot write after ownership release.
- Build output is staged, collision-safe, and rollback/recovery guarded.
- Source maps connect generated route code to TS/TSX diagnostics.
- Chrome, Firefox, and WebKit pass required journeys.
- Accessibility automation and keyboard checks cover forms, navigation, dialogs, menus, charts, and errors.
- Route, module, package, CSS, Worker, and chunk closures are inspectable.
- Clean build, one-file rebuild, peak RSS, long-navigation heap, and mixed keyed ownership benchmarks have maintained baselines.
- Package compatibility status and version guarantees are public and machine-readable.
- Deployment cache, CSP, authentication, private-data, upload, and error-handling guidance is explicit.
- At least one complete content application and one complete stateful/realtime application pass production gates.
- AI benchmark results report cost per successful task and context surface area per successful task.

## Per-PR Required Evidence

- [ ] State the exact producer and consumer boundary changed.
- [ ] Name the real fixture or correctness failure authorizing the patch.
- [ ] Add a focused check that fails before the implementation.
- [ ] Preserve unrelated source support and diagnostics.
- [ ] Compare representative ModuleIR, RouteIR, HTML, emitted paths, and bytes.
- [ ] Prove static sibling routes remain zero JavaScript.
- [ ] Prove identity, cleanup, cancellation, and late-completion behavior where ownership changes.
- [ ] Record build/runtime measurements for nontrivial paths.
- [ ] Run `npm run check`, `npm test`, and package smoke when package output changes.
- [ ] Update this plan before combining or reordering scopes.
- [ ] Update release notes only after the implementation is complete and published.

## Immediate Decision

PR 1 through PR 5 are complete. The next PR is **PR 6: ProjectSession And Explicit Root**. Do not skip directly to a store, resource, router, virtualization, or ecosystem package feature.
