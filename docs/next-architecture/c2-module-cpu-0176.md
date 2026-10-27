# C2 0.17.6 Function-Level CPU Attribution

Both arms pin `487a1566d23c6226974f919beb943d088142763b` (v0.17.6).
`KUDZU_REQUIRE_CHROME=1 node test/c2-initial-mount.mjs --module-cpu`
completed six unchanged local C2 journeys. Candidate output has the same scratch
module marks as the previous module-body packet; baseline is unmodified.
HTML is byte-identical and original module hashes match. CPU sampling requests
100 microseconds from before navigation through readiness validation.

The analyzer assigns each sample to its timestamp's synchronous module window,
or to `outside-module-bodies`. It preserves negative sampling deltas and checks
conservation of all sample counts and signed self weights. Inclusive ancestor
weights overlap and must not be summed. CPU/trace clock coverage is checked.
Raw profiles, traces, windows, outside samples and generated source are retained.
These are perturbed diagnostic weights, not exact function durations or a speed
comparison. Host: i5-9500 (six logical CPUs), Linux 7.0.0-38-generic x64,
Node 24.14.0, Chrome 152.0.7977.64.

| Site in its own module window | Profile 0 self µs | Profile 1 | Profile 2 |
|---|---:|---:|---:|
| binding `mountBindings` (`F`, line 1, column 1325) | 8,877 | 5,992 | 6,716 |
| list `replaceOwnedRowIds` visitor (`n`, column 16363) | 11,977 | 11,171 | 11,181 |
| list `initializeGeneralRowHooks` (`Z`, column 15766) | 5,473 | 2,673 | 2,507 |

Locations are zero-based in the **marked** emitted modules under
`assets/runtime/f66e3bc98f0dce02/`. `mountBindings` inclusive weights are
17,000/11,120/11,207 µs. Its replays inside the list body are only
920/628/966 µs, and inside the effect entry 954/1,083/1,017 µs. Replay removal
alone is not supported as a large startup win. Binding `N` at column 5623 is
`matching` (native selection and array copies); `b` at column 559 is
`patchBinding`. The rejected initial-ID exclusion remains rejected despite
the visitor's sampled cost.

## Next candidate, frozen before product edits

Investigate attribute-only binding registration: avoid the five property-marker
reads on nodes with no property binding, and retain parsed attribute descriptors
instead of copying each object and constructing temporary target/descriptor pairs.
The fixture is the existing C2 application with many attribute-bound keyed rows
and mixed property/attribute bindings. This changes discovery/allocation only:
all current-value fills, dependency registrations, async invalidation and owner
release remain required. Existing selectors and parsed descriptor fields suffice;
no compiler proof, new semantic primitive, pass or runtime concept is needed.

Scope: `framework/binding-runtime.js`, mixed property/attribute browser ownership
coverage in the pending-evaluator journey, the exact project artifact contract,
and the pinned C2 harness/workflow. `loadEvaluator` and `bindingStateIds` consume
explicit descriptor fields, so retaining `target` must not change evaluation.
Test attribute-only and mixed state/evaluator bindings through delayed loading,
commits, repeated mounting, unmount/release and remount. Preserve all existing
keyed, conditional, navigation, SVG and static-sibling checks.

Before adoption run full checks, package smoke, and one separately pinned hosted
uninstrumented comparison against v0.17.6: initial-DOM median at least 5% lower,
negative paired median, at least 16/21 faster pairs, and no operation median over
5% higher with at least 16/21 slower pairs. Keep all raw samples and costs; reject
without rerunning for favorable samples if this gate fails. Sampling alone does
not predict that this small candidate will pass. No version bump is authorized
until adoption.
