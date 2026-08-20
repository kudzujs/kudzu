# Current Compiler Architecture

This maps the current `0.9.0` architecture, built on the completed `0.8.23` Goal A compiler foundation. File and function names are the stable references; line numbers are intentionally omitted because later work may still move code.

## Responsibility Map

| Responsibility | Current owner | Current contract |
|---|---|---|
| CLI entry | [`bin/kudzu.mjs`](../../bin/kudzu.mjs) | Dispatches build and development commands. |
| Project session | [`framework/compiler/project-session.mjs`](../../framework/compiler/project-session.mjs), `createProjectSession()` | Owns one absolute root, standard project paths, source records, bound graph operations, and Worker compiler. Production builds use one session; development retains it across rebuilds. Omitted roots resolve from call-time CWD. |
| Parsed module cache and symbols | [`framework/compiler/project-session.mjs`](../../framework/compiler/project-session.mjs) | Parses each unchanged source module once per ProjectSession and records source-local declaration/import/re-export sites. Stable ModuleSymbol records resolve direct, aliased, barrel, and `export *` exports with cycle and ambiguity checks; repeated resolutions are cached against their source dependencies, and normalization consumers locate the resolved SiteId in a fresh clone with independent parent links. |
| Build orchestration | [`framework/build.mjs`](../../framework/build.mjs), `build()`, `buildWithSession()` | Coordinates config, discovery, source compilation, RouteBuildRecord collection, CapabilityIR projection, generator invocation, artifact emission, and `afterBuild`. A retained session caches source results and pre-family route renders by page graph; successful builds alone replace that cache. |
| Reachability/import resolution | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `reachableSourceFiles()`; [`framework/compiler/source-graph.mjs`](../../framework/compiler/source-graph.mjs), `ordinaryRuntimeDependencies()`, `resolveSourceImport()` | Starts from page entries, follows relative runtime imports/re-exports and validated Worker references, excludes unreachable migration source, and fails unresolved ordinary edges or dynamic imports at the importer source location before code generation. |
| Ordered normalization | [`framework/compiler/normalization-pipeline.mjs`](../../framework/compiler/normalization-pipeline.mjs), `applyNormalizationPasses()`; [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `normalizeCompilerSource()` | Applies migration/resource passes in order and repairs TypeScript parent pointers after every structural change. Imported source uses the same pipeline. |
| Focused normalization passes | [`framework/compiler/`](../../framework/compiler/) | React, Router, browser signals, animation-frame refs, custom-hook timers, Zustand, and render control each validate and lower a narrow source shape. |
| Shared AST/scope helpers | [`framework/compiler/ast-helpers.mjs`](../../framework/compiler/ast-helpers.mjs) | Binding, scope, reference, inclusive ancestry, effect-return, and source-location analysis. |
| Source-local binding index | [`framework/compiler/analysis/binding-index.mjs`](../../framework/compiler/analysis/binding-index.mjs) | After normalization, assigns deterministic lexical slots and classifies local, parameter, import, capture, global, and unresolved references. Native handler, effect, binding, list evaluator, optimized-command, and effect-resource consumers use complete index-owned AST; synthesized expressions retain the existing fallback. |
| Pure collection language | [`framework/compiler/collection-analysis.mjs`](../../framework/compiler/collection-analysis.mjs) | Analyzes collection roots/selectors, including one direct array field of a proven object-state component prop, and serializes the allowed pure expression language used by lists and derived dependencies. |
| Main semantic analysis | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `createKudzuTransformer()` | Produces transformed source plus explicit component, shared-state/action, handler, binding, derived, keyed, and effect ownership results. Zustand package syntax and reduced Context actions resolve to package-neutral shared-state/action records before generic consumers. |
| Component ownership analysis | [`framework/compiler/analysis/component-analysis.mjs`](../../framework/compiler/analysis/component-analysis.mjs) | Produces ComponentAnalysis v2 with ordered JSON-safe owner and specialization slots for state, setters, props, refs, IDs, direct SignalIR links, direct static property/consumer links, structural OwnerRefs, source-local SiteIds, and source provenance. Three direct callback/ref component boundaries specialize into the same parent signal and intrinsic ownership; Context action-private setters may remain compiler-only and receive collision-free consumer-local aliases; AST identity remains private to its source-local session. |
| Per-source descriptor registration | [`framework/compiler/descriptor-session.mjs`](../../framework/compiler/descriptor-session.mjs), `createSemanticArtifact()`, `createDescriptorSession()` | Keeps AST descriptors private during analysis, then finalizes ModuleIR v2 with deterministic SymbolRef, SharedStateIR, SharedActionIR, SignalIR, HandlerIR, BindingIR, DerivedIR, EffectIR, KeyedBlockIR, and ImportIR slots. One fail-closed boundary validates every source-local and component ownership edge before build-module generation. |
| Route artifact graph | [`framework/compiler/route-build-record.mjs`](../../framework/compiler/route-build-record.mjs), `createRouteBuildRecord()`, `planRouteArtifacts()`; [`framework/compiler/route-artifact-report.mjs`](../../framework/compiler/route-artifact-report.mjs), `createRouteArtifactReport()` | Validates each rendered route's RouteIR, capabilities, entry paths, styles, and exact handler/effect references. Handler and Worker esbuild metafiles project transitive output edges back through those records into deterministic per-route capability signatures and runtime requirements plus emitted handler, Worker, stylesheet, and shared-chunk closure. |
| Route contract validation | [`framework/compiler/route-ir.mjs`](../../framework/compiler/route-ir.mjs), `assertRouteIR()` | Fails before artifact selection for invalid state/parameter identity, commands, native/effect captures and dependencies, reactive descriptors, conditions, keyed-list identity/ownership, marker fields, or JSON safety. Immutable in-memory contracts validate once by identity. |
| Command IR and codegen | [`framework/compiler/optimize/command-specialization.mjs`](../../framework/compiler/optimize/command-specialization.mjs), [`framework/compiler/ir/module-ir.mjs`](../../framework/compiler/ir/module-ir.mjs), [`framework/compiler/codegen/command-codegen.mjs`](../../framework/compiler/codegen/command-codegen.mjs) | Direct commands use the existing fast path; proven immutable state aliases and one-call local helpers specialize to the same JSON-safe command ModuleIR. Recursion, escape, mutation, and dynamic helper dispatch fail explicitly, while unrelated handlers retain native ESM. Codegen emits the existing `__kBehavior` AST and command ABI. |
| Source compilation | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `compileSource()` | Runs TypeScript with the Kudzu transformer, rejects surviving React/Router references, and returns a JSON-safe project-relative build module, component analysis, ModuleIR, optional handler module, and imported assets without filesystem writes. |
| Handler/evaluator lowering | [`framework/compiler/handler-lowering.mjs`](../../framework/compiler/handler-lowering.mjs) | Completes source-local callback, package-neutral Context/Zustand shared-action, binding, and list AST rewriting and diagnostics before the JSON-safe IR boundary. Provider/store implementation AST remains transient and final handlers retain shared-action edges. |
| Handler module codegen | [`framework/compiler/handler-codegen.mjs`](../../framework/compiler/handler-codegen.mjs) | Renders finalized ordered imports and concatenates generated module-export source without TypeScript AST or semantic discovery. |
| Effect analysis | [`framework/compiler/effect-analysis.mjs`](../../framework/compiler/effect-analysis.mjs) | Classifies ordered signal, ordinary or specialized object-property DerivedIR, and keyed-item dependencies and validates cleanup-owned browser resources before EffectIR registration. Object sources keep one signal subscription while the existing tagged evaluator and `Object.is` compare the selected primitive or authorized array value. |
| Worker graph | [`framework/compiler/worker-compiler.mjs`](../../framework/compiler/worker-compiler.mjs) | Returns functional Worker rewrite results and JSON-safe EffectIR edges, validates relative graphs, emits content-hashed ESM, and resolves placeholders only for rendered effects. |
| Shared path conversion | [`framework/compiler/path-helpers.mjs`](../../framework/compiler/path-helpers.mjs) | Converts project-relative module, browser, asset, and base paths for build and development serving. |
| Build-time JSX execution | [`framework/core.mjs`](../../framework/core.mjs), `renderPage()` | Executes compiled pages/layouts, allocates deterministic route/layout ownership IDs, emits complete HTML, and returns RouteIR v1 plus capability facts and exact retained handler references. |
| Route capability projection | [`framework/compiler/route-capability-planner.mjs`](../../framework/compiler/route-capability-planner.mjs), `planRouteCapabilities()`; [`framework/compiler/runtime-family-planner.mjs`](../../framework/compiler/runtime-family-planner.mjs), `planRuntimeFamilies()` | Validates RouteBuildRecord and RouteIR v1, projects exact route CapabilityIR, deduplicates equal standalone signatures, and unions each enhanced-navigation group at one required ESM singleton boundary. |
| Effect entry generation | [`framework/compiler/effect-codegen.mjs`](../../framework/compiler/effect-codegen.mjs) | Generates ordinary, dependency, owned, and navigable effect entries from rendered descriptors. |
| Runtime generation | [`framework/compiler/runtime-codegen.mjs`](../../framework/compiler/runtime-codegen.mjs), [`framework/compiler/list-runtime-codegen.mjs`](../../framework/compiler/list-runtime-codegen.mjs), [`framework/compiler/param-codegen.mjs`](../../framework/compiler/param-codegen.mjs) | Consumes versioned contracts, specializes authored capability sources with fail-closed anchors, and returns source/define results without filesystem ownership. |
| Artifact emission | `framework/build.mjs` | Selects route artifacts from RouteBuildRecord edges, emits each distinct runtime family under `assets/runtime/<family>/`, writes route HTML in bounded batches, bundles in a project-local staging sibling, copies public subtrees without replacing generated paths, runs `afterBuild`, then promotes with rollback. Byte-identical native, parameter, and effect entries share one file only when their family imports also match. |
| Browser capabilities | [`framework/*.js`](../../framework/) | Small optional modules for commands, bindings, lists, effects, native handlers, serialization, parameters, and navigation; native contexts invalidate writes and refs at DOM ownership release, with no component runtime. |
| Opt-in navigation | [`framework/navigation-runtime.js`](../../framework/navigation-runtime.js) plus `framework/build.mjs` navigation configuration/emission | Fetches and validates complete same-origin documents, replaces only the marked route range, manages route/layout disposal, history, focus, finite prefetch retention, and native fallback. |
| Development serving | [`framework/dev-server.mjs`](../../framework/dev-server.mjs) and [`framework/dev-state.js`](../../framework/dev-state.js) | Watches and batches changed source paths, recompiles and rerenders intersecting page graphs, then performs the existing complete staged artifact emission and SSE reload. Navigation groups invalidate together to retain one layout-function identity. Failed rebuilds preserve both prior output and pending invalidations while showing the existing error overlay. |

## Current Data Flow

```text
src/pages entries + config
  -> ProjectSession(root) with project paths, source records, parsed/symbol caches, graph, and Worker compiler
  -> project discovery and reachable relative graph
       -> in development, intersect changed paths with current and prior per-page graphs
       -> reuse unaffected SourceResult and pre-family route render records
  -> compileSource()
       -> ordered normalization and parent repair
       -> source-local binding index
       -> main transformer semantic analysis
       -> TypeScript transpilation
       -> JSON-safe build module, ModuleIR, handler module, and imported assets
  -> build orchestration writes .kudzu executable and handler modules
  -> import page modules and execute renderPage()
       -> complete HTML
       -> RouteIR v1 and exact handler references
  -> validated RouteBuildRecord per emitted route
       -> capability facts, route entries, styles, handler/effect artifact edges
  -> remove unrendered handlers/effects/Workers
    -> planRuntimeFamilies(RouteBuildRecord[], navigation groups)
        -> exact route signatures plus deduplicated standalone/group CapabilityIR families
  -> specialize and emit each selected runtime family under assets/runtime/<family>/
       -> reuse exact generated route-entry transforms within this build
  -> write route index.html, CSS/assets, Worker graphs, rewrites, and per-route artifact closure into staging/scratch
  -> copy public paths only where they do not replace generated artifacts
  -> optional afterBuild() against staging
  -> rollback-safe promotion to dist; recover an interrupted backup on the next admitted build after stale-lock removal
```

The browser consumes static HTML first. State seeds and descriptors in that HTML connect only to emitted command, binding, list, native-handler, effect, parameter, or navigation modules. Browser execution patches owned DOM directly; it does not invoke component functions or reconstruct a component tree.

## Residual Coupling

- `createKudzuTransformer()` remains one large source-local analysis unit combining validation, specialization, descriptor registration, and transformed-source emission.
- Transient component rewrite indexes remain source-local AST indexes; finalized handler, binding, derived, keyed, effect, signal, import, and component ownership edges use explicit JSON-safe slots or stable symbols.
- `build()` still owns filesystem writes after structural route artifact selection and generator results are produced.
- Runtime generators intentionally specialize readable authored sources through exact anchors; every required anchor fails closed, but a future generator format may remove this transitional dependency.
- Source reachability and source compilation remain in one session-bound compiler factory because both consume the same normalization and import graph contracts. ModuleSymbol resolution is stable across canonical and cloned trees; unsupported export syntax remains intentionally narrow.
- Incremental development still reads the source tree, rebuilds graph closure, and emits a complete rollback-safe staging directory. It avoids unaffected compilation and build-time JSX execution; finer filesystem and artifact-write invalidation is not yet justified.
- Imported declarations resolve by ModuleSymbol and source-local SiteId. Specialized and compiler-synthesized trees still use conservative name/scope fallback where the source-local binding index does not own the complete AST.

These are future simplification opportunities, not incomplete Goal A contracts. Goal A changed no source support, browser output semantics, or browser architecture.

## Continuation Checklist

- [ ] Re-read every caller before moving a helper out of `framework/build.mjs`.
- [ ] Keep analysis results serializable where AST identity is not required.
- [ ] Keep AST-bearing descriptors source-local and consume them before render planning.
- [ ] Do not move tightly coupled code behind a large context object merely to reduce file size.
- [ ] Compare route plans and emitted artifacts before and after each extraction.
