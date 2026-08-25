# Kudzu Architecture Continuation

This directory is the compiler continuation packet. Planned versions remain plans until package metadata and release records mark them complete.

The top-level [`GOAL_A.md`](../../GOAL_A.md) and [`GOAL_B.md`](../../GOAL_B.md) are historical completed capability records. Do not overwrite or reinterpret them. The Goal A/B/C/D names in this directory refer to the next architecture discussion:

| Goal | Decision | Start condition |
|---|---|---|
| A: compiler foundation | Complete in `0.8.23` | The no-write source compiler, RouteIR v1, CapabilityIR v1, generator boundaries, and output baseline are recorded. |
| B: optimization benchmarks | Active | Keyed restoration, no-op normalization, exact route-entry transform reuse, and identical route-entry file sharing are retained; continue only when another current fixture reproduces a material loss. |
| C: state/resource model | Research only | Reduced fixtures expose a limitation |
| D: routing compatibility | Current behavior preserved | Revisit only with migration evidence and invariant review |

The completed `0.9.0` milestone is recorded in [`0.9-semantic-compression.md`](./0.9-semantic-compression.md) and [`0.9-implementation-plan.md`](./0.9-implementation-plan.md). It freezes the `0.8.62` baseline, then closes evidence-backed work on Derived, shared state/actions, resource ownership, component ownership, pass reduction, and final cross-framework proof. [`large-application-ai-native-roadmap.md`](./large-application-ai-native-roadmap.md) remains the completed foundation and longer-term plan. Model-driven delivery is separately gated for 1.0. ResourceIR remains unapproved; range ownership, virtualization, optimistic transactions, public adapters, and generic runtimes still require independent evidence and architecture review.

[`1.0-large-application-compatibility-audit.md`](./1.0-large-application-compatibility-audit.md) records the first post-0.9 probes against Memos, Apache Answer, and Actual Budget. The audit finds that reduced slices build but whole-application source retention and behavior parity do not yet pass.

[`application-capability-release-plan.md`](./application-capability-release-plan.md) is the authoritative post-0.9 execution queue. It assigns one application-capability section to each minor target and one independently accepted evidence packet to each patch candidate from `0.10.0` through the `1.0.0` gate. Evidence-only candidates do not consume package versions. It supersedes the provisional 0.10/0.11/0.12 tool-first ordering in the completed 0.9 handoff without rewriting that historical record.

## Required Invariants

- Every route remains a complete static HTML document.
- Build-known static routes emit zero JavaScript.
- Interactive routes emit only capabilities they use.
- React, hydration, a VDOM, retained browser components, and React islands remain forbidden.
- Native anchors are the default; same-document navigation remains explicit and route-group scoped.
- Compiler specialization preserves ordinary React-shaped TSX where it can be analyzed safely.
- Unsupported nearby forms fail with source-located diagnostics.

## Reading Order

1. [`application-capability-release-plan.md`](./application-capability-release-plan.md): active minor/patch execution queue through `1.0.0`.
2. [`0.9-semantic-compression.md`](./0.9-semantic-compression.md): completed scope, evidence, and release gates.
3. [`0.9-implementation-plan.md`](./0.9-implementation-plan.md): detailed historical session packets, benchmark plan, reports, and release procedure.
4. [`0.9-baseline.md`](./0.9-baseline.md): dated architecture, pass, IR, runtime-concept, LOC, and test baseline.
5. [`0.9-benchmark-contracts.md`](./0.9-benchmark-contracts.md): frozen matched-content, stateful, commerce, scale, resource, and anti-gaming contracts.
6. [`1.0-large-application-compatibility-audit.md`](./1.0-large-application-compatibility-audit.md): local large-application migration probes, retention caveats, blockers, and authorized-protocol handoff.
7. [`compiler-current-architecture.md`](./compiler-current-architecture.md): exact current responsibilities and data flow.
8. [`performance-gates.md`](./performance-gates.md): output, build, and browser gates.
9. [`large-application-ai-native-roadmap.md`](./large-application-ai-native-roadmap.md): completed foundation, longer-term direction, and completion evidence.
10. [`goal-a-compiler-foundation.md`](./goal-a-compiler-foundation.md): completed extraction and generator foundation.
11. [`versioning.md`](./versioning.md): completed patch sequence and future sequencing rules.
12. [`goal-b-optimization-benchmarks.md`](./goal-b-optimization-benchmarks.md): active measurements, retained optimizations, and continuation rules.
13. [`goal-c-state-resource-research.md`](./goal-c-state-resource-research.md): research boundary only.
14. [`goal-d-routing-compatibility-decisions.md`](./goal-d-routing-compatibility-decisions.md): routing and islands decisions.

## Resume Checklist

- [ ] Read [`MIGRATION_ROADMAP.md`](../../MIGRATION_ROADMAP.md), [`0.9-semantic-compression.md`](./0.9-semantic-compression.md), and [`0.9-implementation-plan.md`](./0.9-implementation-plan.md) before planning migration work.
- [ ] Follow the active patch in [`application-capability-release-plan.md`](./application-capability-release-plan.md); treat compatibility audits as candidate-selection input, not replacement work queues.
- [ ] Confirm `package.json` still reports the actual current version; never infer release status from this plan.
- [ ] Inspect the worktree and preserve unrelated or uncommitted changes.
- [ ] Start later architecture work only by an explicit decision from the completed Goal A baseline.
- [ ] Preserve accepted syntax, diagnostics, route plans, HTML, asset selection, and browser ownership behavior.
- [ ] Run the repository checks required by that implementation patch and record output deltas.
- [ ] Update this packet when a planned boundary changes; update release records only when a release actually occurs.
