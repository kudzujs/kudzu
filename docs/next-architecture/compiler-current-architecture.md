# Current Compiler Architecture

This maps the current `0.8.31` architecture built on the completed `0.8.23` Goal A compiler foundation. File and function names are the stable references; line numbers are intentionally omitted because later work may still move code.

## Responsibility Map

| Responsibility | Current owner | Current contract |
|---|---|---|
| CLI entry | [`bin/kudzu.mjs`](../../bin/kudzu.mjs) | Dispatches build and development commands. |
| Build orchestration | [`framework/build.mjs`](../../framework/build.mjs), `build()` | Coordinates config, discovery, source compilation, RouteIR rendering, CapabilityIR projection, generator invocation, artifact emission, and `afterBuild`. |
| Reachability/import resolution | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `reachableSourceFiles()`; [`framework/compiler/source-graph.mjs`](../../framework/compiler/source-graph.mjs), `ordinaryRuntimeDependencies()`, `resolveSourceImport()` | Starts from page entries, follows relative runtime imports/re-exports and validated Worker references, excludes unreachable migration source, and fails unresolved ordinary edges or dynamic imports at the importer source location before code generation. |
| Ordered normalization | [`framework/compiler/normalization-pipeline.mjs`](../../framework/compiler/normalization-pipeline.mjs), `applyNormalizationPasses()`; [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `normalizeCompilerSource()` | Applies migration/resource passes in order and repairs TypeScript parent pointers after every structural change. Imported source uses the same pipeline. |
| Focused normalization passes | [`framework/compiler/`](../../framework/compiler/) | React, Router, browser signals, animation-frame refs, custom-hook timers, Zustand, and render control each validate and lower a narrow source shape. |
| Shared AST/scope helpers | [`framework/compiler/ast-helpers.mjs`](../../framework/compiler/ast-helpers.mjs) | Binding, scope, reference, effect-return, and source-location analysis. |
| Source-local binding index | [`framework/compiler/analysis/binding-index.mjs`](../../framework/compiler/analysis/binding-index.mjs) | After normalization, assigns deterministic lexical slots and classifies local, parameter, import, capture, global, and unresolved references. Native handler, effect, binding, list evaluator, optimized-command, and effect-resource consumers use complete index-owned AST; synthesized expressions retain the existing fallback. |
| Pure collection language | [`framework/compiler/collection-analysis.mjs`](../../framework/compiler/collection-analysis.mjs) | Analyzes collection roots/selectors and serializes the allowed pure expression language used by lists and derived dependencies. |
| Main semantic analysis | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `createKudzuTransformer()` | Produces transformed source plus explicit component, handler, binding, derived, keyed, and effect ownership results. |
| Component ownership analysis | [`framework/compiler/analysis/component-analysis.mjs`](../../framework/compiler/analysis/component-analysis.mjs) | Retains ordered JSON-safe owner and specialization records for state, setters, props, refs, IDs, direct signal links, and source provenance; AST identity remains private to its source-local session. |
| Per-source descriptor registration | [`framework/compiler/descriptor-session.mjs`](../../framework/compiler/descriptor-session.mjs), `createSemanticArtifact()`, `createDescriptorSession()` | Keeps AST descriptors private during analysis, then finalizes deterministic JSON-safe HandlerIR, BindingIR, DerivedIR, KeyedBlockIR, EffectIR, imports, and client roots into ModuleIR and validates every local slot reference. |
| Command IR and codegen | [`framework/compiler/optimize/command-specialization.mjs`](../../framework/compiler/optimize/command-specialization.mjs), [`framework/compiler/ir/module-ir.mjs`](../../framework/compiler/ir/module-ir.mjs), [`framework/compiler/codegen/command-codegen.mjs`](../../framework/compiler/codegen/command-codegen.mjs) | Supported command handlers specialize to JSON-safe ModuleIR, then emit the existing `__kBehavior` AST without changing route plans. |
| Source compilation | [`framework/compiler/source-compiler.mjs`](../../framework/compiler/source-compiler.mjs), `compileSource()` | Runs TypeScript with the Kudzu transformer, rejects surviving React/Router references, and returns a JSON-safe project-relative build module, component analysis, ModuleIR, optional handler module, and imported assets without filesystem writes. |
| Handler/evaluator lowering | [`framework/compiler/handler-lowering.mjs`](../../framework/compiler/handler-lowering.mjs) | Completes source-local callback/binding/list AST rewriting and diagnostics before the JSON-safe IR boundary. |
| Handler module codegen | [`framework/compiler/handler-codegen.mjs`](../../framework/compiler/handler-codegen.mjs) | Renders finalized ordered imports and concatenates generated module-export source without TypeScript AST or semantic discovery. |
| Effect analysis | [`framework/compiler/effect-analysis.mjs`](../../framework/compiler/effect-analysis.mjs) | Classifies ordered signal, derived, and keyed-item dependencies and validates cleanup-owned browser resources before EffectIR registration. |
| Worker graph | [`framework/compiler/worker-compiler.mjs`](../../framework/compiler/worker-compiler.mjs) | Returns functional Worker rewrite results and JSON-safe EffectIR edges, validates relative graphs, emits content-hashed ESM, and resolves placeholders only for rendered effects. |
| Shared path conversion | [`framework/compiler/path-helpers.mjs`](../../framework/compiler/path-helpers.mjs) | Converts project-relative module, browser, asset, and base paths for build and development serving. |
| Build-time JSX execution | [`framework/core.mjs`](../../framework/core.mjs), `renderPage()` | Executes compiled pages/layouts, allocates deterministic route/layout ownership IDs, emits complete HTML, and returns RouteIR v1 plus capability facts. |
| Route capability projection | [`framework/compiler/route-capability-planner.mjs`](../../framework/compiler/route-capability-planner.mjs), `planRouteCapabilities()` | Validates RouteIR v1 and purely folds rendered plans and route facts into CapabilityIR v1. |
| Effect entry generation | [`framework/compiler/effect-codegen.mjs`](../../framework/compiler/effect-codegen.mjs) | Generates ordinary, dependency, owned, and navigable effect entries from rendered descriptors. |
| Runtime generation | [`framework/compiler/runtime-codegen.mjs`](../../framework/compiler/runtime-codegen.mjs), [`framework/compiler/list-runtime-codegen.mjs`](../../framework/compiler/list-runtime-codegen.mjs), [`framework/compiler/param-codegen.mjs`](../../framework/compiler/param-codegen.mjs) | Consumes versioned contracts, specializes authored capability sources with fail-closed anchors, and returns source/define results without filesystem ownership. |
| Artifact emission | `framework/build.mjs` | Selects required files from CapabilityIR and writes or bundles generated sources with esbuild. Byte-identical native, parameter, and effect route entries reuse one exact-source transform result within the current build only. |
| Browser capabilities | [`framework/*.js`](../../framework/) | Small optional modules for commands, bindings, lists, effects, native handlers, serialization, parameters, and navigation; native contexts invalidate writes and refs at DOM ownership release, with no component runtime. |
| Opt-in navigation | [`framework/navigation-runtime.js`](../../framework/navigation-runtime.js) plus `framework/build.mjs` navigation configuration/emission | Fetches and validates complete same-origin documents, replaces only the marked route range, manages route/layout disposal, history, focus, finite prefetch retention, and native fallback. |
| Development serving | [`framework/dev-server.mjs`](../../framework/dev-server.mjs) and [`framework/dev-state.js`](../../framework/dev-state.js) | Rebuild/watch/SSE and response-only short-lived state restoration; never changes production `dist/`. |

## Current Data Flow

```text
src/pages entries + config
  -> project discovery and reachable relative graph
  -> compileSource()
       -> ordered normalization and parent repair
       -> source-local binding index
       -> main transformer semantic analysis
       -> TypeScript transpilation
       -> JSON-safe build module, ModuleIR, handler module, and imported assets
  -> build orchestration writes .kudzu executable and handler modules
  -> import page modules and execute renderPage()
       -> complete HTML
       -> RouteIR v1
       -> referenced handler URLs and route facts
  -> remove unrendered handlers/effects/Workers
   -> planRouteCapabilities(RouteIR records, route facts)
       -> CapabilityIR v1
  -> specialize and emit only selected runtime/capability ESM
       -> reuse exact generated route-entry transforms within this build
  -> write route index.html, CSS/assets, Worker graphs, rewrites, and .kudzu/kudzu-plan.json
  -> optional afterBuild()
```

The browser consumes static HTML first. State seeds and descriptors in that HTML connect only to emitted command, binding, list, native-handler, effect, parameter, or navigation modules. Browser execution patches owned DOM directly; it does not invoke component functions or reconstruct a component tree.

## Residual Coupling

- `createKudzuTransformer()` remains one large source-local analysis unit combining validation, specialization, descriptor registration, and transformed-source emission.
- Transient component rewrite indexes remain source-local AST indexes; handler, binding, derived, keyed, effect, and component ownership now have explicit JSON-safe source results.
- `build()` still owns explicit artifact selection and filesystem writes after generator results are produced.
- Runtime generators intentionally specialize readable authored sources through exact anchors; every required anchor fails closed, but a future generator format may remove this transitional dependency.
- Source reachability and source compilation share one module because both consume the same normalization and import graph contracts.
- Imported, specialized, and compiler-synthesized trees still use conservative name/scope fallback where the source-local binding index does not own the complete AST; cross-module semantics remain deferred to stable ModuleSymbol and SiteId work.

These are future simplification opportunities, not incomplete Goal A contracts. Goal A changed no source support, browser output semantics, or browser architecture.

## Continuation Checklist

- [ ] Re-read every caller before moving a helper out of `framework/build.mjs`.
- [ ] Keep analysis results serializable where AST identity is not required.
- [ ] Keep AST-bearing descriptors source-local and consume them before render planning.
- [ ] Do not move tightly coupled code behind a large context object merely to reduce file size.
- [ ] Compare route plans and emitted artifacts before and after each extraction.
