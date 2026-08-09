# Planned Version Sequence

This is an execution sequence, not release history. `0.8.16` through `0.8.24` are completed scopes represented by package/release records.

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

## Sequence Rules

- Goal A is complete. Goal B proceeds from the `0.8.23` baseline one repeatable measured loss at a time.
- Keep Goal C research out of these patches and publish no store/resource API.
- Keep Goal D behavior unchanged: complete HTML, native default, opt-in groups, no islands.
- A planned patch may ship under a different actual version only if this table and release-facing documentation are updated before release.
- Release notes describe completed facts; this file continues to describe future work.
- Internal decomposition alone does not require `0.9.0`; use a minor only for a public compiler/tooling or compatibility boundary.

## Generator Versions

Keep `create-kudzu@0.1.101` while its template remains unchanged. Its `@kudzujs/core` range `^0.8.15` already accepts every planned Goal A patch. Publish `0.1.102` only when the template or minimum core range changes; a future `0.9.0` template must use `^0.9.0`.

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
