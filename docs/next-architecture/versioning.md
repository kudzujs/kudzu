# Planned Version Sequence

This is an execution sequence, not release history. `0.8.16` through `0.8.62` are completed scopes represented by package/release records. The active `0.10.0` through `1.0.0` minor/patch sequence is maintained in [`application-capability-release-plan.md`](./application-capability-release-plan.md); that plan supersedes the provisional tool-first 0.10/0.11/0.12 ordering in the completed 0.9 handoff.

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
| `0.8.38` | Replace serialized route artifact discovery with validated RouteBuildRecord edges. | Handler, effect, Worker, CSS, package-client, and chunk retention is structural while deploy files, bytes, plans, and browser behavior remain unchanged. |
| `0.8.39` | Deeply validate concrete RouteIR, RouteBuildRecord, and CapabilityIR contracts. | Invalid state, command, effect, binding, condition, list, ownership, capability, and JSON references fail before codegen without changing deploy output. |
| `0.8.40` | Add property-level derived effect dependencies over ordinary object state. | Direct property paths and immutable primitive locals reuse existing DerivedIR and `Object.is`; whole-object/dynamic dependencies fail, runtime JavaScript is unchanged, and measured build/RSS changes remain below 5%. |
| `0.8.41` | Preserve callback, setter, and ref ownership through one additional direct presentation-component boundary. | Parent signals, child hooks, IDs, effects, refs, conditional cleanup, static zero-JavaScript output, and byte-identical deploy graphs pass; a third callback boundary fails closed. |
| `0.8.42` | Share byte-identical generated route entries and accelerate one proven read-only query form carry shape. | A static-path fixture emits one native/effect file for three routes; hidden GET carry initializes before deferred parameter ESM; static siblings remain zero-JavaScript; the losing catalog navigation experiment is excluded. |
| `0.8.43` | Preserve callback, setter, and ref ownership through a third direct component boundary. | Parent SignalIR, child state/effects/IDs, object refs, conditional cleanup, fresh remount, and static zero-JavaScript output pass in Chrome; a fourth callback boundary fails closed. |
| `0.8.44` | Remove consumer-local name collisions from specialized Context actions. | Action-private Provider state/setter fields receive deterministic collision-free aliases; CRUD browser behavior, direct state operations, diagnostics, and zero Context runtime output pass. |
| `0.8.45` | Add a source-scale benchmark and skip Kudzu semantic transformation for proven plain TypeScript modules. | Seven alternating samples improve compile and clean-build medians with identical deploy output; uncertain modules retain the existing transformer. |
| `0.8.46` | Remove action-only setter fields from authored Context Provider APIs. | Compiler scratch restores required setters while Notes CRUD, RouteIR signals, concrete state operations, diagnostics, and zero Context runtime output pass. |
| `0.8.47` | Initialize specialized child state from one direct primitive parent state prop. | Build-known primitive seeds, independent state ownership, existing handler specialization, and negative object/expression diagnostics pass without a runtime change. |
| `0.8.48` | Allow one setter-callback prop in multiple direct intrinsic handlers. | Each handler lowers once to the same parent signal; repeated same-handler calls and escaped uses fail without a runtime change. |
| `0.8.49` | Fan one setter-callback prop out through multiple direct child component event props. | Every branch lowers to the original parent signal; aliases, ordinary props, spreads, and the fourth boundary fail without a runtime change. |
| `0.8.50` | Isolate reduced Zustand migration behind package-neutral shared-state and action IR. | Validated shared identities/actions preserve RouteIR, layout lifetime, same-turn updates, diagnostics, browser behavior, and zero store runtime. |
| `0.8.51` | Bundle direct browser-only package references from inline owned effect setup/cleanup callbacks. | Package code stays in referenced route effect ESM; build scratch and static siblings omit it while indirect/render-time uses fail. |
| `0.8.52` | Lower effect-exclusive mutable refs into setup-invocation closures. | E2B and WebSocket fixtures preserve generation, replacement, BFCache, and cleanup without captures, ResourceIR, or static-sibling JavaScript. |
| `0.8.53` | Close source CSS over each route's reachable TypeScript graph and reconcile managed styles during navigation. | Routes exclude unrelated CSS; destination styles load before replacement, shared layout links retain identity, and cancelled loads roll back safely. |
| `0.8.54` | Project per-route capability requirements and post-bundle handler/Worker chunk closure into an inspectable artifact contract. | Deterministic signatures, exact retained entries, transitive chunks, reverse shared ownership, static-route exclusion, and `afterBuild()` access pass. |
| `0.8.55` | Emit deduplicated signature-keyed runtime families while preserving navigation-group singleton ownership. | Equal standalone signatures share files, different signatures isolate output, grouped routes share one union family, and static routes emit no runtime. |
| `0.8.56` | Recompile and rerender only source-affected routes during development. | A route-owned helper edit recompiles two of four modules, rerenders one of two pages, and emits byte-identical deploy output to a fresh full build. |
| `0.8.57` | Initialize specialized child draft state from one direct parent plain-object state prop. | A FIRE-derived editor preserves independent child draft state and parent commit behavior; arrays, aliases, property paths, and composed expressions remain rejected without runtime changes. |
| `0.8.58` | Initialize keyed row object draft state from the direct keyed item prop. | Todo reducer rows retain independent drafts and DOM identity across reorder, release state on removal, recreate drafts from the current item on remount, reject aliases, and preserve a static zero-JavaScript sibling. |
| `0.8.59` | Initialize specialized child draft state from one direct parent array-state prop and accept a direct matching `set*` setter prop. | A ClimateCompatibleGrowth-derived dropdown preserves independent array drafts, explicit parent commit, source naming, nearby diagnostics, and a static zero-JavaScript sibling without runtime changes. |
| `0.8.60` | Synchronize direct prop-derived array draft state through its matching parent setter in a dependency effect. | The ClimateCompatibleGrowth-derived dropdown preserves its exact direct effect/dependency shape, stable setter erasure, array identity comparison, independent parent replacement, nearby diagnostics, and a static zero-JavaScript sibling without runtime changes. |
| `0.8.61` | Specialize one parameterized relative primitive debounce hook through existing state and dependency-effect ownership. | The ClimateCompatibleGrowth-derived hook preserves direct state initialization, literal delay scope, timeout replacement/cleanup, conditional release, latest-value commit, nearby diagnostics, and a static zero-JavaScript sibling without runtime changes. |
| `0.8.62` | Lower direct React `createRef()` and one parameterized outside-click hook through existing DOM-ref and effect ownership. | The ClimateCompatibleGrowth-derived hook preserves inside/outside behavior, serializable setter scope, exact listener cleanup, conditional release/remount, nearby diagnostics, and a static zero-JavaScript sibling without runtime changes. |

## Sequence Rules

- Goal A is complete. Goal B proceeds from the `0.8.23` baseline one repeatable measured loss at a time.
- Keep Goal C research out of these patches and publish no store/resource API.
- Keep Goal D behavior unchanged: complete HTML, native default, opt-in groups, no islands.
- A planned patch may ship under a different actual version only if this table and release-facing documentation are updated before release.
- Release notes describe completed facts; this file continues to describe future work.
- Internal decomposition alone does not require `0.9.0`; use a minor only for a public compiler/tooling or compatibility boundary.
- From `0.10.0` onward, each application-capability section owns one minor and each independently accepted evidence packet owns one patch as defined by the active application-capability release plan.

## Generator Versions

`create-kudzu@0.1.115` retains the explicit install instructions and generates projects with `@kudzujs/core@^0.12.2`.

## Release Boundary

Every patch is independently revertible before publication. After npm publication, never repoint its tag; forward-fix with the next patch. Require the exact commit to pass CI, package smoke installation, registry verification, and the performance gates before starting the next ownership seam.

From `0.10.0` onward every completed patch packet is a full release transaction:
version and lockfile updates, release records, an accepted `Release Kudzu X.Y.Z`
commit, commit push and CI, an immutable `vX.Y.Z` tag push, a published GitHub
release, npm publication through `.github/workflows/publish.yml`, registry
verification, and fresh-install verification. Incomplete work sessions retain
the same target version and do not create commits, tags, or npm releases merely
because the session ended.

## Per-Patch Continuation Checklist

- [ ] Confirm all earlier planned patches are complete or explicitly replanned.
- [ ] Inspect current uncommitted changes and preserve unrelated work.
- [ ] Name the exact producer/consumer boundary being changed.
- [ ] Keep source support and public runtime behavior unchanged.
- [ ] Apply [`performance-gates.md`](./performance-gates.md).
- [ ] Update current architecture mapping when responsibility actually moves.
- [ ] Update `RELEASES.md` only as part of a real release, never from this plan alone.
