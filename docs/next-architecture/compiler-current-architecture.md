# Current Compiler Architecture

This maps the completed `0.8.19` handler, binding, and derived IR boundary. File and function names are the stable references; line numbers are intentionally omitted because Goal A moves code.

## Responsibility Map

| Responsibility | Current owner | Current contract |
|---|---|---|
| CLI entry | [`bin/kudzu.mjs`](../../bin/kudzu.mjs) | Dispatches build and development commands. |
| Build orchestration | [`framework/build.mjs`](../../framework/build.mjs), `build()` | Loads config; discovers reachable source, CSS, and assets; compiles sources; renders routes; plans capabilities; emits `dist/`; invokes `afterBuild`. |
| Reachability/import resolution | `framework/build.mjs`, `reachableSourceFiles()`, `resolveSourceImport()` | Starts from page entries, follows relative runtime imports/re-exports and validated Worker references, and excludes unreachable migration source. |
| Ordered normalization | [`framework/compiler/normalization-pipeline.mjs`](../../framework/compiler/normalization-pipeline.mjs), `applyNormalizationPasses()`; `framework/build.mjs`, `normalizeCompilerSource()` | Applies migration/resource passes in order and repairs TypeScript parent pointers after every pass. Imported source uses the same pipeline. |
| Focused normalization passes | [`framework/compiler/`](../../framework/compiler/) | React, Router, browser signals, animation-frame refs, custom-hook timers, Zustand, and render control each validate and lower a narrow source shape. |
| Shared AST/scope helpers | [`framework/compiler/ast-helpers.mjs`](../../framework/compiler/ast-helpers.mjs) | Binding, scope, reference, effect-return, and source-location analysis. |
| Pure collection language | [`framework/compiler/collection-analysis.mjs`](../../framework/compiler/collection-analysis.mjs) | Analyzes collection roots/selectors and serializes the allowed pure expression language used by lists and derived dependencies. |
| Main semantic analysis | `framework/build.mjs`, `createKudzuTransformer()` | Produces transformed source plus explicit component, handler, binding, and derived results while still owning effect and keyed-list ownership side tables. |
| Component ownership analysis | [`framework/compiler/analysis/component-analysis.mjs`](../../framework/compiler/analysis/component-analysis.mjs) | Retains ordered JSON-safe owner and specialization records for state, setters, props, refs, IDs, direct signal links, and source provenance; AST identity remains private to its source-local session. |
| Per-source descriptor registration | [`framework/compiler/descriptor-session.mjs`](../../framework/compiler/descriptor-session.mjs), `createSemanticArtifact()`, `createDescriptorSession()` | Keeps AST descriptors private during analysis, then finalizes deterministic JSON-safe HandlerIR, BindingIR, DerivedIR, imports, and client roots into ModuleIR. |
| Command IR and codegen | [`framework/compiler/optimize/command-specialization.mjs`](../../framework/compiler/optimize/command-specialization.mjs), [`framework/compiler/ir/module-ir.mjs`](../../framework/compiler/ir/module-ir.mjs), [`framework/compiler/codegen/command-codegen.mjs`](../../framework/compiler/codegen/command-codegen.mjs) | Supported command handlers specialize to JSON-safe ModuleIR, then emit the existing `__kBehavior` AST without changing route plans. |
| Build module generation | `framework/build.mjs`, `compile()` | Runs TypeScript with the Kudzu transformer, writes build-executable modules to `.kudzu`, rejects surviving React/Router runtime references, and generates handler source when descriptors exist. |
| Handler/evaluator lowering | [`framework/compiler/handler-lowering.mjs`](../../framework/compiler/handler-lowering.mjs) | Completes source-local callback/binding/list AST rewriting and diagnostics before the JSON-safe IR boundary. |
| Handler module codegen | [`framework/compiler/handler-codegen.mjs`](../../framework/compiler/handler-codegen.mjs) | Renders finalized ordered imports and concatenates generated module-export source without TypeScript AST or semantic discovery. |
| Worker graph | [`framework/compiler/worker-compiler.mjs`](../../framework/compiler/worker-compiler.mjs) | Validates the exact effect-owned Worker form, validates its relative graph, emits content-hashed ESM, and resolves placeholders only for rendered effects. |
| Build-time JSX execution | [`framework/core.mjs`](../../framework/core.mjs), `renderPage()` | Executes compiled pages/layouts, allocates deterministic route/layout ownership IDs, emits complete HTML, and returns the serializable route plan and capability booleans. |
| Route capability projection | [`framework/compiler/route-capability-planner.mjs`](../../framework/compiler/route-capability-planner.mjs), `planRouteCapabilities()` | Purely folds rendered route plans and route facts into aggregate runtime/artifact requirements. |
| Effect entry generation | [`framework/compiler/effect-codegen.mjs`](../../framework/compiler/effect-codegen.mjs) | Generates ordinary, dependency, owned, and navigable effect entries from rendered descriptors. |
| Runtime specialization/emission | `framework/build.mjs` | Selects runtime files and currently removes branches through feature booleans, string replacement, compile-time defines, and esbuild. |
| Browser capabilities | [`framework/*.js`](../../framework/) | Small optional modules for commands, bindings, lists, effects, native handlers, serialization, parameters, and navigation; no component runtime. |
| Opt-in navigation | [`framework/navigation-runtime.js`](../../framework/navigation-runtime.js) plus `framework/build.mjs` navigation configuration/emission | Fetches and validates complete same-origin documents, replaces only the marked route range, manages route/layout disposal, history, focus, finite prefetch retention, and native fallback. |
| Development serving | [`framework/dev-server.mjs`](../../framework/dev-server.mjs) and [`framework/dev-state.js`](../../framework/dev-state.js) | Rebuild/watch/SSE and response-only short-lived state restoration; never changes production `dist/`. |

## Current Data Flow

```text
src/pages entries + config
  -> project discovery and reachable relative graph
  -> shared ordered source normalization
  -> main transformer semantic analysis
       -> transformed build-time TS/TSX
       -> per-source semantic artifact
  -> TypeScript transpilation
       -> .kudzu executable modules
       -> generated handler/effect/binding/list-evaluator modules
  -> import page modules and execute renderPage()
       -> complete HTML
       -> serializable route plan
       -> referenced handler URLs and route facts
  -> remove unrendered handlers/effects/Workers
  -> planRouteCapabilities(route plans, route facts)
       -> aggregate capability manifest
  -> specialize and emit only selected runtime/capability ESM
  -> write route index.html, CSS/assets, Worker graphs, rewrites, and .kudzu/kudzu-plan.json
  -> optional afterBuild()
```

The browser consumes static HTML first. State seeds and descriptors in that HTML connect only to emitted command, binding, list, native-handler, effect, parameter, or navigation modules. Browser execution patches owned DOM directly; it does not invoke component functions or reconstruct a component tree.

## Current Coupling To Remove

- `createKudzuTransformer()` combines discovery, validation, specialization, descriptor registration, and transformed-source emission.
- Effect/keyed ownership relationships and transient component rewrite indexes remain in `WeakMap`/`WeakSet` tables keyed by AST identity; handler, binding, derived, and component ownership now have explicit JSON-safe source results.
- `build()` destructures a broad capability manifest into many booleans and performs artifact-specific source surgery.
- Runtime specialization relies on exact source-string and regular-expression replacements in `framework/build.mjs`.
- Route facts, rendered plans, artifact requirements, and emitted-file decisions are represented at adjacent but not fully explicit boundaries.

Goal A addresses these couplings without changing source support, output semantics, or browser architecture.

## Continuation Checklist

- [ ] Re-read every caller before moving a helper out of `framework/build.mjs`.
- [ ] Keep analysis results serializable where AST identity is not required.
- [ ] Keep AST-bearing descriptors source-local and consume them before render planning.
- [ ] Do not move tightly coupled code behind a large context object merely to reduce file size.
- [ ] Compare route plans and emitted artifacts before and after each extraction.
