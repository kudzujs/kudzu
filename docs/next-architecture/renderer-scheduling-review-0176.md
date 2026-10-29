# Renderer scheduling review — 0.17.6 preload trial

2026-10-29. Read-only analysis of the six preserved traces from hosted
[40651024837](https://github.com/kudzujs/kudzu/actions/runs/40651024837).
No new benchmark samples or product edits. The rejected preload candidate remains
rejected: 349.5/341.8 ms uninstrumented medians, −2.20%, 11/21 faster pairs.

## Decision

The early-fetch/late-ready gap is not evidence of an idle browser waiting for more
JavaScript. All three candidate traces show substantial document parsing and
rendering between network completion and the first module evaluation. Module
execution starts shortly after the document finishes parsing, consistent with the
emitted non-async module scripts' native deferred execution.

The small synchronous layout inside the readiness callback does not account for
the major render cost. Large style/layout passes outside that callback are proven;
their individual invalidation sources after module execution are not. No product
optimization is selected from this review. The next bounded packet is diagnostic
invalidation/module-body attribution on pinned 0.17.6, not another speed candidate.

## Method and conservation

`review.mjs` reads both deploy HTML files, the frozen protocol/runner, the trace
report, prior discovery results and all six traces. It verifies the marked
navigation, renderer thread, document frame/origin, 11 successful script requests,
five non-async module entries in the head, and matching document parse events.
Reported `ResourceFinish.args.data.finishTime` is rounded to trace microseconds;
renderer event delivery timestamps remain separate. Last script network finish
equals last non-entry dependency finish in these profiles.

The existing `test/c2-readiness-attribution.mjs` analyzer partitions each marked
interval using the innermost selected span. The review splits that interval at
network completion and first module start, then asserts the disjoint windows
reconstruct **every original category total**, not just total elapsed time.
It separately reports the network-to-ready window; do not add that overlapping
summary to the disjoint windows. All times below are wall time relative to each
profile's start mark, not CPU self time or navigation-start time.

## Network completion does not imply execution readiness

| Arm/profile | Last script network finish ms | Final HTML parse end ms | First module ms | Final readiness mark ms |
| --- | --- | --- | --- | --- |
| baseline 0 | 119.523 | 100.710 | 102.668 | 256.445 |
| baseline 1 | 117.026 | 107.086 | 108.145 | 272.205 |
| baseline 2 | 136.571 | 118.791 | 120.040 | 255.894 |
| candidate 0 | 37.094 | 121.040 | 122.254 | 276.648 |
| candidate 1 | 19.179 | 97.923 | 98.919 | 273.515 |
| candidate 2 | 38.643 | 105.187 | 106.605 | 265.700 |

Every recorded `ParseHTML` slice in the marked interval belongs to the main
document and ends before the first module evaluation. `domInteractive` falls
between the final parse slice and first module start in all six profiles. The
parse-to-first-module gaps are 0.996–1.958 ms across both arms, and 0.996–1.418 ms
for the candidate. The baseline can execute an independent module before all
dependencies of other entries finish; its network-to-first-module interval is
therefore not a positive waiting interval and is reported as absent.

For the candidate, the positive network-to-first-module windows conserve as:

| Profile | Window ms | Style + layout | HTML parsing | Prepaint + paint + layerize | Other recorded work | Uncovered |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 85.160 | 51.566 | 15.998 | 8.635 | 1.065 | 7.896 |
| 1 | 79.740 | 36.866 | 22.876 | 6.311 | 1.447 | 12.240 |
| 2 | 67.962 | 29.284 | 17.921 | 6.652 | 1.210 | 12.895 |

These are per-profile exclusive sums, not sums of category medians. Uncovered time
is not proven idle, network wait, or recoverable latency. Download completion was
moved earlier, but it did not remove parsing/rendering or authorize executing
modules against an incomplete document. This does not justify changing script
ordering, adding async module execution, hiding content or weakening readiness.

## Proven render context versus unknown invalidation owner

The trace records four `Layout` events per profile. The first two see growing
document layout trees; the third and final see 13,509 layout objects. These are
layout-object counts, not DOM-element counts or unique invalidation counts.
Every recorded layout root is the document. Five `UpdateLayoutTree` events per
profile include a small initial style update and a small final readiness update.

The review checks containing script spans, rather than guessing a caller from
adjacent events. All recorded style/layout spans fall into these exclusive contexts:

| Arm/profile | Before first module, outside script ms | After first module, outside script ms | Inside harness `ready` ms |
| --- | --- | --- | --- |
| baseline 0 | 55.655 | 34.274 | 1.942 |
| baseline 1 | 48.913 | 43.949 | 0.871 |
| baseline 2 | 73.725 | 21.714 | 0.735 |
| candidate 0 | 74.795 | 23.940 | 1.215 |
| candidate 1 | 37.274 | 56.378 | 1.062 |
| candidate 2 | 53.691 | 38.796 | 0.828 |

Before first module execution, these spans are document rendering, not synchronous
Kudzu module work. The harness's early `ready()` calls perform selector/count/text
checks and return; its sole layout read follows all readiness predicates. The
containing `ready` spans with empty script URL agree with the frozen injected
runner source's `document.body.offsetHeight` check. No large layout span is nested
inside a recorded module evaluation or another application function call.

This is **execution-context attribution**, not invalidation attribution. A DOM
write can invalidate layout that the browser performs later outside the writer's
stack. In particular, candidate 1 runs module spans at +102.016…125.136 and
+125.798…184.995 ms, then performs style at +185.787…203.219 and layout at
+203.240…242.186 ms before later modules. Other profiles schedule their third
large render pass earlier. That variation helps explain why earlier requests or
earlier individual module spans do not establish earlier final readiness, but does
not prove what invalidated that render pass.

The archived trace categories are only `devtools.timeline,blink.user_timing`.
There are no invalidation-tracking events in the reviewed intervals. The layout
records identify frame/root/dirty-object counts, without a mutation-source stack;
module evaluation spans have no URLs. Remaining source ownership is explicitly
unknown. Do not assign module names from nearby compilation events, blame all
late layout on application writes, or infer that the entire document-render cost
is removable. The traced samples remain diagnostic, not speed evidence.

## Next bounded diagnostic packet

1. Pin both diagnostic arms to released commit
   `487a1566d23c6226974f919beb943d088142763b`; no preload candidate or product edit.
   Use the unchanged C2 source, readiness predicate and complete journey.
2. Reuse the existing scratch-only module-body mark instrumentation. Add explicit
   DevTools invalidation-tracking/stack categories to diagnostic tracing so
   asynchronous style/layout work can be connected to an invalidator when Chrome
   supplies that evidence. Preserve raw event args, node/frame identifiers and
   absent-stack cases. Do not treat a node ID or temporal adjacency as a caller.
3. Collect only three diagnostic profiles per arm: unmarked released output and
   the same output with marks. Both use the same trace categories. Verify the
   marked arm's output manifest, native ESM order and complete C2 ownership,
   cleanup, accessibility, failure-resilience and static-sibling acceptance.
   Instrumented timing is not an adoption comparison and cannot reopen a rejected
   candidate. No new 21-pair speed run is authorized by this packet.
4. Conserve readiness windows as here, separate parser/browser rendering,
   synchronous forced layout, deferred invalidations and unknowns. Report whether
   a concrete producer/consumer path has avoidable work while preserving complete
   HTML and behavior. Keep uncertainty if stack tracking is insufficient.
5. Only after a distinct avoidable product cost is demonstrated may a separate
   correctness fixture and frozen uninstrumented adoption packet be proposed.
   No content/DOM/accessibility omission, virtualized benchmark, readiness change,
   generic runtime, or source-level application rewrite is authorized.

This review adds zero semantic primitives, core passes/LOC, runtime concepts,
browser bytes or benchmark delta. Core 0.17.6 / generator 0.1.167 stay deployed.
Startup superiority and independent AI-cost/1.0 gates remain unresolved. The
optional artifact-report missing-style requirement remains a separate tooling
defect, not a new explanation for browser startup.

## Reproduction

Extract the preserved `c2-eager-preloads-40651024837` release archive. Run
`node /path/to/renderer-scheduling-0176/review.mjs /path/to/repo /path/to/c2-eager-preloads-40651024837`.
The review archive contains script/results/logs, the pinned analyzer, source and
input hashes, this report and validation logs. Its `review.json` retains every
window, render event's original args, parse interval and attribution decision.
No browser is launched by the analysis script and no input evidence is changed.
