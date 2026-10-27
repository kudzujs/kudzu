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

Investigate attribute-only binding registration: avoid property-marker reads on
nodes with no property binding (C2 emits three property kinds), and retain parsed attribute descriptors
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

## Candidate validation

The mixed-binding journey passes on released 0.17.6 before the product edit, and
on the candidate afterward. It combines delayed evaluator-backed input value and
generic attribute bindings with direct truthy class state, and checks duplicate
mount, delayed current values, commits, release and remount. Focused binding,
evaluator, browser and compiler-specialization tests pass. Full `npm run check`,
382 tests plus the project application journey, and both package smokes pass.
CPU-diagnostic full checks also pass.

Candidate changes only the binding runtime (+2 net source lines); compiler LOC,
passes, semantic primitives and runtime concepts are unchanged. Exact measured
project output grows by 186 raw / 68 local aggregate gzip bytes across 42 files;
its static route remains zero-JS. The candidate is not adopted: the separately
pinned hosted comparison is still required. The C2 emitted property set is
`class`, `value`, `style` (three probes per attribute-only node); the original
archived diagnostic's reference to five described the unspecialized source.

## Hosted outcome: rejected

Candidate `9cb3853a063277730560b43774614e1d6d6e54e3`, harness `a1c7e89`,
run [40443460003](https://github.com/kudzujs/kudzu/actions/runs/40443460003).
Full checks and both lifetime arms pass, followed by 42 uninstrumented and six
traced complete C2 journeys. Initial-DOM medians are 286.7/275.1 ms (−4.05%),
paired median −11.6 ms, 16/21 faster pairs. The >=5% median requirement fails:
**reject**, without reruns or relaxation. Script CPU 97.370/90.796 ms,
paired −4.259 ms, 16/21 faster, is secondary and cannot replace the primary gate.
No operation meets the frozen regression gate. Row restore median is 5.30%
higher but only 10/21 pairs are slower; this is not proof of a statistical tie.

C2 JS grows 43,267 → 43,319 raw and 16,343 → 16,361 level-9 gzip bytes;
HTML remains byte-identical at 688,281 raw / 69,741 gzip. Build medians are
673.059/667.788 ms. Host: Intel Xeon Platinum 8370C (four logical CPUs),
Node 24.21.0, Chrome 155.0.8059.39, Linux 6.17.0-1022-azure x64.
Only compare arms within this run.

Product runtime and project artifact contract are restored byte-for-byte to
v0.17.6; mixed-binding regression coverage stays. Restored full check, 382 tests
plus the project journey and both package smokes pass. No product semantic,
compiler, runtime-concept or browser-byte delta remains. No tag, npm publication
or website deployment follows the rejected trial. Startup improvement remains
unresolved; the next diagnostic packet is in the application capability plan.
