# Large Application And AI-Native Development Plan

## Status

Completed compiler-foundation record and longer-term plan after `0.8.35`. The [`0.9-semantic-compression.md`](./0.9-semantic-compression.md) execution queue is complete. The active queue for current work is [`application-capability-release-plan.md`](./application-capability-release-plan.md) at packet `0.18.3`. This document does not mark any remaining planned capability as supported and does not authorize a React runtime, VDOM, hydration, retained browser component tree, generic rerenderer, public store/query/resource API, SPA router, or islands.

[`MIGRATION_ROADMAP.md`](../../MIGRATION_ROADMAP.md) remains the product authority for product invariants and fixture-driven feature selection. [`application-capability-release-plan.md`](./application-capability-release-plan.md) is authoritative for current work order and evidence at packet `0.18.3`; this plan retains the completed foundation, deferred program, and long-term production gates. If implementation evidence changes either boundary, update the relevant document before broadening a patch.

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
| Project graph | `framework/compiler/project-session.mjs`, `source-graph.mjs`, `build.mjs` | Explicit project root, parsed-module/export-summary cache, source ownership, and development-session source/result/route-render invalidation; export resolution remains intentionally narrow |
| Normalization | `framework/compiler/source-compiler.mjs`, focused passes | Pass order and package ownership are implicit; semantically equal source often follows different shape-specific paths |
| Component/state analysis | `framework/compiler/source-compiler.mjs`, `analysis/component-analysis.mjs` | AST identity, identifier text, source offsets, and caller-side AST specialization remain central |
| Handler/binding analysis | `framework/compiler/descriptor-session.mjs`, `handler-lowering.mjs` | Capture/import/state discovery is name-based and arbitrary handlers become code before IR finalization |
| Effect/resource analysis | `effect-analysis.mjs`, resource-specific passes | Selected browser APIs have exact-shape ownership checks; there is no package-neutral resource model |
| Lists/ranges | `source-compiler.mjs`, `list-runtime.js` | Strong keyed ownership, but syntax recognition and runtime branches are list-specific and not a general range/window primitive |
| ModuleIR | `compiler/ir/module-ir.mjs` | Numeric slots, names, export strings, and formatted owner strings coexist; several sections are descriptive rather than authoritative inputs |
| RouteIR/CapabilityIR | `route-capability-planner.mjs` | Validation is shallow and capability selection is site-wide across interactive routes |
| Build/codegen | `framework/build.mjs`, runtime generators | Full destructive builds, source-text runtime surgery, and no route capability/chunk closure report; route CSS closure is structural |
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
- Full development rebuilds into project-session invalidation; rollback-safe production output and explicit session ownership are complete.
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
- [x] P0.6 Explicit ProjectSession is complete in `0.8.33`. Each build owns an absolute root, project paths, source records, bound graph operations, and Worker compiler. Explicit-root build/dev entry points preserve omitted-root CLI CWD behavior. One imported build function compiles two same-shaped roots with isolated config, HTML, `.kudzu`, source results, and Worker bundles; all 191 tests and package checks pass without browser or source-syntax changes.
- [x] P0.7 Parsed module and export summary caching is complete in `0.8.34`. Canonical read-only source trees and narrow export summaries are invalidated together by source text and remain ProjectSession-local; every normalization context receives a deep clone with independent parent links. A 100-importer fixture parses and summarizes 103 unique page/barrel/component/helper modules exactly once and creates 200 importer-local clones. The maintained paired benchmark preserves the complete source-result digest and establishes no material timing or peak-RSS conclusion; all 193 tests and package checks pass without broadening exports, source syntax, or browser output.
- [x] P0.8 Stable ModuleSymbol and SiteId is complete in `0.8.35`. ProjectSession records source-local declaration, import, and re-export sites and resolves stable ModuleSymbol records through default/named exports, aliases, barrel chains, `export *`, ambiguity, and cycles. Cross-module compiler consumers locate resolved declarations by SiteId in their private normalized clones, while component calls, hooks, keyed blocks, effects, and ownership records expose deterministic source-local SiteIds. Repeated sessions and compilations preserve IDs, and symbol-only barrel traversal avoids cloning intermediate modules without changing browser artifacts or source syntax.
- [x] P0.9 Semantic State Operations is complete in `0.8.36`. Direct setters, one immutable state-value alias, one synchronous zero-argument arrow helper, and one synchronous one-parameter function helper lower to identical existing command HandlerIR. Binding identity proves state/setter/helper/parameter ownership; recursion, escape, mutation, and dynamic helper dispatch fail at authored source locations. Existing direct command specialization remains first, unrelated safe handlers retain native ESM, and no command ABI, runtime, JavaScript VM, or general expression IR is added.
- [x] P0.10 ModuleIR Reference Unification is complete in `0.8.37`. ModuleIR and ComponentAnalysis v2 assign deterministic slots to symbols, signals, handlers, bindings, derived values, effects, keyed blocks, imports, owners, specializations, states, refs, and IDs. State, capture, import, effect, collection, parent/child, specialization, and row edges use structural slots or ModuleSymbol records while readable names remain codegen/debug metadata. A fail-closed pre-codegen validator rejects malformed slots, unsupported versions, duplicate exports, broken reciprocity, and ownership cycles; focused JSON round-trip checks and all 198 tests pass without changing browser runtime behavior.
- [x] P0.11 RouteBuildRecord and Artifact Graph is complete in `0.8.38`. Each rendered route records RouteIR, capability facts, route-entry paths, styles, and exact handler/effect references. Build orchestration derives Handler ESM, Worker, package-client, and chunk closure from those edges; serialized HTML/plan `includes()` searches, formatted effect keys, and parallel route-fact/entry arrays are removed. Focused malformed-reference and JSON round-trip checks plus the standard suite preserve the exact 173-file deploy digest and bytes.
- [x] P0.12 Deep RouteIR and CapabilityIR Validation is complete in `0.8.39`. RouteIR v1 validates state/parameter identity, commands, captures, effects, bindings, conditions, keyed-list ownership, and JSON safety before artifact selection. RouteBuildRecord checks concrete capability reciprocity, and CapabilityIR validates standalone implications plus exact projection from route records before codegen. Identity caching avoids repeated validation of immutable contracts; all 203 tests and byte-identical deploy checks pass without runtime or accepted-source changes.
- [x] The P1 source-scale benchmark foundation is complete after `0.8.44`. `npm run benchmark:source-scale` generates 500 reachable modules, 50,550 TS/TSX lines, and 50 routes outside the repository, then measures source read, graph discovery, compile, clean build, deterministic output, cache counters, and peak RSS in fresh processes. Its paired mode alternates another checkout with the current tree and rejects deploy-output differences. The first measured specialization keeps Kudzu transformation for TSX, package imports, assets, and unresolved edges while plain relative-only `.ts` modules receive path rewriting alone; seven alternating samples against `v0.8.44` reduced compile median 39.2% and clean-build median 28.4% with identical deploy output. A reduced deterministic run remains in the standard suite.

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
| Property-level derived dependencies | Object state exposes direct property-path effect dependencies through existing DerivedIR without splitting application state into artificial primitives; multi-boundary propagation remains ordered next |
| Package-neutral shared state and actions | Existing Zustand support lowers through generic signal/action records; Redux-shaped research has a reusable target |
| Resource ownership | WebSocket, SSE, subscriptions, timers, observers, Workers, and imperative SDKs can share acquire/owner/dependency/cleanup semantics |
| Browser-only package modules | Native JS packages may be bundled only into effect/handler/resource chunks without build-time execution |
| Range ownership | Conditional, keyed, overlay, and future virtualized DOM ranges share release and identity primitives where semantics match |
| Route/layout graph | Nested persistent layouts and route lifetimes remain complete-document based and recoverable through native navigation |
| Route capability and chunk closure | Every route reports exact runtime, handler, package, Worker, and shared chunk edges |
| Route/layout CSS closure | Unrelated feature CSS is absent from a route unless configured global |
| Incremental development build | A source change recompiles and rerenders only affected modules/routes while preserving full reload correctness |
| Source-scale benchmark | `npm run benchmark:source-scale` deterministically generates at least 500 reachable modules, 50,000 TS/TSX lines, and 50 routes, then reports source-read, graph, compile, clean-build, output, and peak-RSS measurements from fresh processes |

### P2: Compatibility And Migration

- Add an internal compatibility adapter registry.
- Consolidate React compatibility ownership behind one adapter contract.
- Register React Router ownership without changing native navigation semantics.
- Move Zustand-specific logic out of generic core, handler, and state paths onto package-neutral shared-state/action IR. **Completed in `0.8.50`:** the Zustand pass preserves package diagnostics while generic compiler consumers use validated SharedStateIR/SharedActionIR identities and references; no public adapter or store runtime was added.
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

**Completed in `0.8.33`:** `createProjectSession()` resolves one explicit or call-time-CWD root and owns standard paths, source records, bound graph resolution, and a root-bound Worker compiler. Build, development, config, styles, routes, generated modules, locking, staging, and promotion consume that ownership. One process compiles two roots with identical module names and verifies distinct config, HTML, `.kudzu`, source results, and Worker bundles. Existing CLI output-safety coverage remains unchanged; no parsed-module cache, browser runtime, source syntax, or public migration API is added.

### PR 7: Parsed Module And Export Summary Cache

**Objective:** make work proportional to unique modules instead of importer edges.

**Dependency:** PR 6.

**Test fixture:** at least 100 importers sharing component/helper modules; expose parse/summary counters in tests without production logging.

**Done condition:** each unchanged module is parsed and summarized once per project session; transformed mutable AST is not shared across transformer contexts.

**Completed in `0.8.34`:** ProjectSession caches one canonical parsed tree and one supported-export summary per file/source-text pair. Reachability, static collection, Zustand, client-helper, style, layout-diagnostic, and Worker graph reads reuse canonical trees; importer normalization deep-clones every node and repairs clone-local parents. Optional injected counters add no production logging. Unit coverage proves source invalidation and cross-session isolation; 100 pages sharing one barrel component and helper produce 103 parse misses, 103 summary misses, and 200 independent normalization clones.

### PR 8: Stable ModuleSymbol And SiteId

**Objective:** represent declarations, imports, re-exports, component calls, hooks, and ownership sites independently of transformed AST identity.

**Tests:** default/named exports, aliases, barrel chains, `export *`, cycles, and deterministic IDs after repeated compilation.

**Done condition:** cross-module semantic consumers use ModuleSymbol records and source-local SiteId values; readable names remain diagnostic metadata.

**Completed in `0.8.35`:** ProjectSession export summaries now include stable declaration/import/re-export records. ModuleSymbol identity is project-relative module path plus declaration SiteId and excludes readable names; cycle-safe resolution supports direct/default/named/aliased/barrel/`export *` paths and rejects ambiguity. Imported semantic consumers resolve symbols first, then find the authored SiteId in an importer-private normalized clone. Component analysis and ModuleIR ownership records carry deterministic owner, component-call, hook, keyed-list, and effect SiteIds. Focused fixtures verify default/named aliases, barrels, `export *`, cycles, ambiguity, repeated-session determinism, repeated-compilation determinism, and source-dependent resolution-cache invalidation. The 100-importer fixture retains 103 parse and summary misses while removing 100 intermediate barrel clones.

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

**Completed in `0.8.36`:** The command specializer now performs narrow whole-handler analysis only when the existing direct fast path fails. The four required forms emit the same `add` command, signal slot, owner, build-module behavior call, RouteIR command, and browser command runtime; alias/helper forms emit no native handler module. Focused compiler and command-only fixture coverage proves JSON-safe IR equivalence, source diagnostics, no native behavior artifacts, and unchanged batching/runtime ABI. The maintained 100-importer benchmark retains identical output and cache counts with no material timing or peak-RSS conclusion.

### PR 10: ModuleIR Reference Unification

**Objective:** replace mixed state names, export strings, formatted owner strings, and slots with validated source-local slots and SymbolRef records.

**Tests:** malformed references, duplicate exports, parent/child reciprocity, cycles, version rejection, and JSON round trips.

**Done condition:** every HandlerIR, BindingIR, DerivedIR, EffectIR, KeyedBlockIR, and component specialization edge validates before build-module generation.

**Completed in `0.8.37`:** ModuleIR and ComponentAnalysis v2 replace formatted owner keys and cross-record export/name lookups with source-local slots, StateRef/OwnerRef records, SymbolRef slots, and stable ModuleSymbol records. Descriptor finalization resolves imports, handlers, bindings, effects, derived dependencies, keyed collections, row ownership, and component prop signals before one fail-closed validation boundary. The validator checks slot/index integrity, state/setter ownership, captures/imports, duplicate exports, effect-handler roles, keyed parent/child reciprocity and cycles, specialization/ref edges, and JSON-safe round trips. Existing export names and state spellings remain only where emitted module/runtime ABIs require them.

### PR 11: RouteBuildRecord And Artifact Graph

**Objective:** make route artifact selection structural.

**Files:** add a focused route-artifact module; update `build.mjs` and capability planning.

**Done condition:** handler, effect, Worker, CSS, package, and chunk reachability derives from explicit route edges; serialized `includes()` searches and parallel route-fact maps are removed.

**Completed in `0.8.38`:** `renderPage()` retains exact handler references only when final event, effect, binding, conditional, or keyed-list descriptors are emitted. RouteBuildRecord validates those references with RouteIR, capability facts, route-entry paths, and styles before `build.mjs` projects runtime entries and artifact closure. Handler modules resolve by exact URL, Worker references resolve by structural module/handler pairs, and package-client/chunk roots derive from retained modules. The clean 152-page baseline and candidate builds produce byte-identical `kudzu-plan.json`, 173 deploy files, raw/gzip bytes, and deploy digest with no material build-time regression.

### PR 12: Deep RouteIR And CapabilityIR Validation

**Objective:** fail before codegen for invalid concrete route references and capability projections.

**Done condition:** duplicate/missing state IDs, invalid event/effect dependencies, broken list ownership, invalid binding descriptors, and artifact mismatches have focused tests and deterministic diagnostics.

**Completed in `0.8.39`:** A focused RouteIR validator now indexes state and parameter identities, validates command vocabulary and targets, recursively checks native/effect captures and binding descriptors, proves condition and keyed-list identity/ownership, and rejects non-JSON-safe contracts. RouteBuildRecord invokes that boundary before artifact selection and verifies behavior/binding/list/entry reciprocity. CapabilityIR validates event/count/flag implications and recomputes its exact expected projection from validated records before codegen. The clean 153-page baseline and candidate builds retain byte-identical plans, 174 deploy files, raw/gzip bytes, and deploy digest with no material build-time regression.

## Large Application Capability Order

After the relevant P0 foundations, investigate capabilities in this order:

1. Property-level derived dependencies over ordinary object state. **Completed in `0.8.40`:** direct property paths and top-level immutable primitive locals over object state reuse tagged DerivedIR, subscribe to the source signal, and compare selected values with `Object.is`; whole-object and dynamic dependencies remain rejected.
2. Multi-boundary component/prop/callback/ref/context dataflow. **Three-boundary callback/ref ownership completed in `0.8.43`; collision-free Context action-private state completed in `0.8.44`; action-only Provider setter exposure removed in `0.8.46`; direct primitive prop state initialization completed in `0.8.47`; repeated direct leaf-handler callback use completed in `0.8.48`; direct child callback fan-out completed in `0.8.49`; direct plain-object prop state initialization completed in `0.8.57`; direct keyed item draft initialization completed in `0.8.58`; direct array prop draft initialization completed in `0.8.59`; matching array-draft setter effects completed in `0.8.60`; parameterized primitive debounce hooks completed in `0.8.61`; direct `createRef()` outside-click hooks completed in `0.8.62`:** forwarding preserves parent SignalIR, Context action lowering uses compiler-owned aliases when consumer locals reuse Provider state/setter names, action-required setters may remain compiler-only when their state is publicly exposed, specialized children may seed local state from a direct parent signal authored with a serializable primitive, plain-object, or array literal, keyed rows may seed object draft state from their direct item prop, and one callback may branch through multiple component `on*` props and intrinsic handlers. A direct first-boundary parent setter may also retain its authored matching `set*` prop name; additional forwarding remains restricted to `on*` props. The ClimateCompatibleGrowth-derived dropdown proves independent array drafts, exact direct setter-effect synchronization, parameterized debounce ownership, and one exact outside-click listener over an intrinsic DOM ref. A fourth callback boundary, callback aliases/non-handler uses, dynamic debounce delays, non-primitive debounce inputs, dynamic outside-click events, mismatched cleanup/state-setter pairs, fully hidden Context state, additional `set*` forwarding, keyed item aliases, property paths, and composed expressions remain fail-closed. Broader prop, callback, ref, and Context graphs remain migration-led work.
3. Package-neutral shared state/actions and migration of current Zustand internals. **Completed in `0.8.50`:** Zustand source normalization produces one generic shared-state adapter descriptor; selectors and handlers register JSON-safe SharedStateIR/SharedActionIR records, handler lowering consumes package-neutral actions, and existing RouteIR, layout ownership, same-turn updates, navigation persistence, and browser output remain unchanged. Redux/RTK and public adapter APIs remain unsupported.
4. Browser-only package imports in owned effect/resource modules. **Completed in `0.8.51` for effects:** direct package references in inline effect setup/cleanup callbacks use existing package import records and route-owned effect ESM bundling; build-time component modules and static siblings omit the package. Helper-indirect, render-time, dynamic-import, and ResourceIR package graphs remain unsupported.
5. ResourceIR from at least two independent WebSocket/SSE/SDK fixtures with the same semantics. **Completed in `0.8.52` without ResourceIR for private ownership:** the E2B terminal and route-owned WebSocket fixtures lower refs used exclusively by one inline effect to invocation-private closure objects, while existing effect ownership supplies replacement, cleanup, stale setter invalidation, navigation, and BFCache disposal. ResourceIR remains unapproved and now requires independent cross-owner transport/subscription fixtures that cannot fit this narrower model.
6. Route/layout capability and CSS chunk closure. **Route/layout CSS closure completed in `0.8.53`; structural reporting completed in `0.8.54`; signature-keyed runtime emission completed in `0.8.55`:** each page's reachable TypeScript graph supplies exact stylesheet edges, and `.kudzu/kudzu-artifacts.json` follows handler and Worker metafiles transitively. Equal standalone CapabilityIR signatures now share one co-located runtime family, different signatures emit isolated files, and every enhanced-navigation group uses one union family so persistent layout state and lifecycle hooks retain a single ESM identity. Static routes emit no family, route entries import their assigned family, and unrelated route capabilities no longer change loaded runtime bytes or URLs.
7. Incremental source and affected-route builds. **Completed in `0.8.56`:** development retains one ProjectSession, intersects batched changed paths with current and prior per-page runtime graphs, recompiles the complete graph of only affected pages, and reuses unaffected SourceResult and pre-family route render records. Enhanced-navigation groups invalidate together, failed builds retain pending changes and prior output, generation-specific build modules prevent stale Node ESM imports, and a focused independent-route fixture proves one helper change recompiles two of four modules, rerenders one of two pages, preserves a static zero-JavaScript sibling, and emits byte-identical deploy output to a fresh-process full build.
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
| Zustand | Compiled, partial, isolated through internal shared-state/action IR |
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

- The completed `0.9.0` cross-framework gate proves lower browser cost and matched user-facing performance against React + Vite, Vue, Svelte, and Astro before AI productivity claims are considered.
- The maintained AI delivery suite uses the same model, tools, requirements, budgets, and acceptance checks across frameworks, includes failed attempts, and establishes the highest success rate plus lowest median cost per successful task before `1.0.0`.
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

All listed foundation and `0.9` slices are complete. Current work continues at `0.18.3` Shared Chunks And Prefetch Policy under the [`application-capability-release-plan.md`](./application-capability-release-plan.md); keep ResourceIR limited to qualifying independent fixtures, and do not add range ownership, virtualization, optimistic transactions, a public adapter/store API, or a router before evidence justifies them.
