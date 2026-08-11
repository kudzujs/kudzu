# Planned Version Sequence

This is an execution sequence, not release history. `0.8.16` through `0.8.37` are completed scopes represented by package/release records.

Keep each patch behavior-preserving and independently reviewable. If a boundary proves inseparable, revise this plan before combining releases; do not silently broaden a patch.

| Planned patch | Scope | Completion evidence |
|---|---|---|
| `0.8.16` | Finish source-local descriptor, collection, command, capability, and Zustand analysis boundaries; publish the current architecture and continuation packet. | Existing descriptor order, diagnostics, transformed modules, route plans, output bytes, and benchmark graphs remain equivalent. |
| `0.8.17` | Add the sparse JSON-safe ModuleIR and move the Counter command fast path from generated AST to plain Command IR before lowering through existing codegen. | Exact command IR round-trip and byte-identical Counter module, HTML, plan, and asset set. |
| `0.8.18` | Produce explicit state, setter, props, ref, ID, and component-specialization results without changing final state allocation. | Repeated, conditional, imported, setter-adapter, Context, and reducer component ownership remains identical. |
| `0.8.19` | Promote native HandlerIR, BindingIR, and DerivedIR; codegen consumes results without rediscovering captures, states, reducers, imports, or pure expressions. | Command-only routes retain zero handler ESM; native/binding/package/reducer fixtures preserve output and diagnostics. |
| `0.8.20` | Replace keyed-list AST side tables with an explicit KeyedBlock ownership result and typed existing list descriptor. | Insert/update/reorder/remove/nested/SVG identity and exact state/effect/ref release remain unchanged. |
| `0.8.21` | Replace effect AST side tables with EffectIR covering setup, cleanup, dependencies, ownership, source, and Worker edges. | Route/layout/conditional/list lifetime, stale-write isolation, and exact resource cleanup remain unchanged. |
| `0.8.22` | Version the existing RouteIR and CapabilityIR, formalize numeric slots plus readable debug metadata, and extract focused runtime generators. | RouteIR and CapabilityIR reject unsupported versions; runtime generator contracts, output gates, and the recorded benchmark pass. |
| `0.8.23` | Forward-fix Goal A by moving source normalization, semantic analysis, ModuleIR finalization, handler generation, and build-module generation behind one no-write source compiler result. | `build.mjs` contains no TSX feature analysis; source results are JSON-safe and project-relative; diagnostics, deploy bytes, tests, and build performance remain equivalent. |
| `0.8.24` | Start Goal B with measured large keyed restoration and no-op normalization optimizations. | Fresh-profile keyed restoration improves materially; alternating 1,000-product builds improve materially; correctness, output, and byte deltas are recorded. |
| `0.8.25` | Reuse byte-identical generated native, parameter, and effect route-entry transforms within one build and strengthen compiler/release boundaries. | Alternating 1,011-page builds improve materially with identical deploy hashes; normalization and ModuleIR fail closed; Node, Chrome, package, and registry gates pass. |
| `0.8.26` | Harden Goal B benchmark reproducibility and ordinary regression coverage without changing runtime behavior. | Commerce comparison defaults to exact output; route transform counts and keyed bulk/fallback guards are protected by the standard suite; baseline coverage and limits are explicit. |
| `0.8.27` | Characterize the first Goal C browser-resource boundary and publish the ordered large-application and AI-native compiler execution plan. | The E2B-derived fixture fails with a source-located diagnostic, no resource runtime or API is added, and the next PR dependencies and completion evidence are explicit. |
| `0.8.28` | Add the source-local binding index and adopt it for reactive binding capture/import discovery and lowering. | Lexical shadowing is identity-based for complete indexed bindings, synthesized keyed expressions retain their fallback, the 1,000-reference guard passes, and no browser bytes or public API are added. |
| `0.8.29` | Move native handler, effect, remaining binding, list evaluator, optimized-command, and effect-resource discovery/lowering onto source-local lexical identity. | Shadowed imports/globals/state/resources remain distinct, HandlerIR/BindingIR round trips pass, synthesized trees retain the fallback, and no runtime or public API is added. |
| `0.8.30` | Validate ordinary runtime graph edges before code generation and reject dynamic imports at the importer source. | Page/helper/re-export/dynamic fixtures report original file/range/specifier without `.kudzu` paths; Worker, type-only, unreachable, output, and runtime behavior remain unchanged. |
| `0.8.31` | Invalidate pending native-handler contexts when their route, keyed, conditional, or document DOM owner is released. | Late setters, queued commits, and captured refs cannot mutate replacement ownership; synchronous dispatch remains within the performance gate and runtime bytes are recorded. |
| `0.8.32` | Stage and validate production output before rollback-safe promotion, reject same-root overlap, and tighten keyed browser paths. | Build/hook failures preserve the prior output, stale locks fail closed, interrupted backups recover on the next admitted build after lock removal, public/generated collisions fail, and deploy output remains equivalent. |
| `0.8.33` | Move root, graph, source records, compiler paths, and Worker ownership into an explicit build-scoped ProjectSession. | Two independent roots compile through one imported build entry without config, source, `.kudzu`, Worker, or output leakage; CLI CWD behavior remains unchanged. |
| `0.8.34` | Cache canonical parsed modules and narrow export summaries within one ProjectSession while cloning transformer input. | A 100-importer fixture parses and summarizes 103 unique modules once, creates independent normalization trees, preserves the complete source-result digest, and leaks no cache state across projects. |
| `0.8.35` | Resolve cross-module declarations through stable ModuleSymbol and source-local SiteId records. | Default/named exports, aliases, barrel chains, `export *`, cycles, ambiguity, repeated compilation, source invalidation, private clones, and measured build behavior remain deterministic. |
| `0.8.36` | Lower equivalent direct, aliased, and local-helper state updates through existing command HandlerIR. | The four required forms emit identical commands and no native handler module; recursion, escape, mutation, and dynamic dispatch fail at authored source locations. |
| `0.8.37` | Unify ModuleIR and ComponentAnalysis references through deterministic source-local slots and stable symbols. | Every handler, binding, derived, effect, keyed, specialization, state, ref, capture, and import edge validates before build-module generation. |

## Sequence Rules

- Goal A is complete. Goal B proceeds from the `0.8.23` baseline one repeatable measured loss at a time.
- Keep Goal C research out of these patches and publish no store/resource API.
- Keep Goal D behavior unchanged: complete HTML, native default, opt-in groups, no islands.
- A planned patch may ship under a different actual version only if this table and release-facing documentation are updated before release.
- Release notes describe completed facts; this file continues to describe future work.
- Internal decomposition alone does not require `0.9.0`; use a minor only for a public compiler/tooling or compatibility boundary.

## Generator Versions

`create-kudzu@0.1.102` adds an explicit install step to the generated README and clearer completion output. Its `@kudzujs/core` range `^0.8.15` accepts every current `0.8.x` patch; a future `0.9.0` template must use `^0.9.0`.

## Release Boundary

Every patch is independently revertible before publication. After npm publication, never repoint its tag; forward-fix with the next patch. Require the exact commit to pass CI, package smoke installation, registry verification, and the performance gates before starting the next ownership seam.

## Per-Patch Continuation Checklist

- [ ] Confirm all earlier planned patches are complete or explicitly replanned.
- [ ] Inspect current uncommitted changes and preserve unrelated work.
- [ ] Name the exact producer/consumer boundary being changed.
- [ ] Keep source support and public runtime behavior unchanged.
- [ ] Apply [`performance-gates.md`](./performance-gates.md).
- [ ] Update current architecture mapping when responsibility actually moves.
- [ ] Update `RELEASES.md` only as part of a real release, never from this plan alone.
