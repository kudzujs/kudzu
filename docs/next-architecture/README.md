# Kudzu Architecture Continuation

This directory is the continuation packet after `0.8.15`. Planned versions remain plans until package metadata and release records mark them complete.

The top-level [`GOAL_A.md`](../../GOAL_A.md) and [`GOAL_B.md`](../../GOAL_B.md) are historical completed capability records. Do not overwrite or reinterpret them. The Goal A/B/C/D names in this directory refer to the next architecture discussion:

| Goal | Decision | Start condition |
|---|---|---|
| A: compiler foundation | Complete in `0.8.23` | The no-write source compiler, RouteIR v1, CapabilityIR v1, generator boundaries, and output baseline are recorded. |
| B: optimization benchmarks | Active | Keyed restoration, no-op normalization, and exact route-entry transform reuse are retained; continue only when another current fixture reproduces a material loss. |
| C: state/resource model | Research only | Reduced fixtures expose a limitation |
| D: routing compatibility | Current behavior preserved | Revisit only with migration evidence and invariant review |

The active post-`0.8.27` implementation sequence is [`large-application-ai-native-roadmap.md`](./large-application-ai-native-roadmap.md). It orders compiler semantic generalization, large-application foundations, compatibility boundaries, AI tooling, and production validation without changing the invariants below.

## Required Invariants

- Every route remains a complete static HTML document.
- Build-known static routes emit zero JavaScript.
- Interactive routes emit only capabilities they use.
- React, hydration, a VDOM, retained browser components, and React islands remain forbidden.
- Native anchors are the default; same-document navigation remains explicit and route-group scoped.
- Compiler specialization preserves ordinary React-shaped TSX where it can be analyzed safely.
- Unsupported nearby forms fail with source-located diagnostics.

## Reading Order

1. [`compiler-current-architecture.md`](./compiler-current-architecture.md): exact current responsibilities and data flow.
2. [`large-application-ai-native-roadmap.md`](./large-application-ai-native-roadmap.md): active direction, priorities, PR queue, and completion evidence.
3. [`goal-a-compiler-foundation.md`](./goal-a-compiler-foundation.md): completed extraction and generator foundation.
4. [`versioning.md`](./versioning.md): completed patch sequence and future sequencing rules.
5. [`performance-gates.md`](./performance-gates.md): output, build, and browser gates.
6. [`goal-b-optimization-benchmarks.md`](./goal-b-optimization-benchmarks.md): active measurements, retained optimizations, and continuation rules.
7. [`goal-c-state-resource-research.md`](./goal-c-state-resource-research.md): research boundary only.
8. [`goal-d-routing-compatibility-decisions.md`](./goal-d-routing-compatibility-decisions.md): routing and islands decisions.

## Resume Checklist

- [ ] Read [`MIGRATION_ROADMAP.md`](../../MIGRATION_ROADMAP.md) and this directory before planning migration work.
- [ ] Follow the PR dependency order in [`large-application-ai-native-roadmap.md`](./large-application-ai-native-roadmap.md); update it before broadening or reordering a patch.
- [ ] Confirm `package.json` still reports the actual current version; never infer release status from this plan.
- [ ] Inspect the worktree and preserve unrelated or uncommitted changes.
- [ ] Start later architecture work only by an explicit decision from the completed Goal A baseline.
- [ ] Preserve accepted syntax, diagnostics, route plans, HTML, asset selection, and browser ownership behavior.
- [ ] Run the repository checks required by that implementation patch and record output deltas.
- [ ] Update this packet when a planned boundary changes; update release records only when a release actually occurs.
