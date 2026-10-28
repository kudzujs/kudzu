# Eager preload trial against 0.17.6

2026-10-28. Candidate only; acceptance follows the frozen
[`startup-budget-review-0176.md`](./startup-budget-review-0176.md) packet.

## Before measurement

The C2 exact-closure test fails on released production: five entry preloads omit
six emitted static dependencies. The candidate adds hints after final runtime
specialization and handler bundling, before public copying and afterBuild. Both
original HTML write paths retain their entry hints. A build-local emitted-file
index and parsed import cache follow only static imports/re-exports from actual
document scripts. Worker outputs and non-emitted URLs are excluded; dynamic
imports are not traversed. Native script ordering and every JS byte are unchanged.

Scope is 39 added build-orchestration lines, zero semantic primitives, semantic
passes, core semantic LOC, runtime concepts or browser JS bytes. This does add
post-emission HTML finalization work; build time remains a measured cost.

The focused output test passes for C2, base-prefixed shared lazy CodeMirror with
an independent eager package owner, two eager CodeMirror owners sharing a chunk,
and Workers. Each is built clean, cache-retained and unchanged-incremental; exact
closure, deduplication, static exclusion and lazy-only chunk exclusion hold.
Full check, 388 tests plus project journey, and both package smokes pass, including
the existing real lazy-package request/lifecycle and Worker browser tests.

An independent five-fixture baseline/candidate build comparison checks every
HTML/JS/CSS output path and byte. Only modulepreload tags differ. C2 HTML adds
494 raw / 80 level-9 gzip bytes; its static sibling and all JS are identical.
Project output remains 42 files, now 191,670 raw / 57,972 local aggregate gzip
bytes (+1,840 / +139 using the contract's compression settings), digest
`045bef5886a6c11a1373459290a89551c05d013bb018def42f505d3a3acbf48a`.
All route JS totals remain unchanged. Shared lazy, Worker and eager editor output
likewise differs only by eager hints.

The optional `test/artifact-baseline.mjs` runner has a pre-existing failure:
project `/app/projects` claims an un-emitted `kudzu-style.js` requirement. It was
reproduced with its released source/compiler as well as this candidate. Its old
entry-only preload assertion is updated for eager ownership, but the unrelated
artifact-report mismatch is not counted as a passing check. Exact emitted-graph
tests and five-fixture output comparisons are independent of that assumption.

Frozen before measurement: pin this candidate and the harness; run one hosted, uninstrumented 21-pair
comparison against 0.17.6, plus separate diagnostic traces. Require >=5% lower
initial-DOM median, negative paired median, >=16/21 faster pairs and no operation
>5% worse with >=16/21 slower pairs. Both lifetime arms and every C2 journey must
pass. Preserve failed measurements; no favorable rerun or output-only re-gating.

## Hosted outcome: rejected

Candidate `405877a`, harness `4529929`, hosted
[40651024837](https://github.com/kudzujs/kudzu/actions/runs/40651024837).
Required-Chrome full checks, both delayed-list lifetime arms, 42 uninstrumented
and six separately traced complete C2 journeys pass. The harness verifies every
non-HTML file is identical, stripped HTML is identical, and candidate C2 has
exactly one preload for every one of its 11 JS files versus five baseline entries.

Initial DOM medians **349.5 / 341.8 ms (−2.20%)**, paired −7.7 ms, **11/21** faster.
Both >=5% and >=16/21 adoption gates fail. No operation meets the regression gate.
Script CPU 112.544 / 113.067 ms (+0.46%), paired +0.334 ms, 9/21 faster. Build
medians 791.483 / 838.110 ms (+5.89%): the candidate adds measurable build work.
HTML 688,281 / 688,775 raw and 69,741 / 69,821 level-9 gzip bytes; JS remains
43,267 raw / 16,343 gzip in 11 files. Host: AMD EPYC 7763 (four logical CPUs),
Linux 6.17.0-1022-azure x64, Node 24.21.0, Chrome 155.0.8059.39. These arms are
compared only within this host/run, not against earlier trial absolute timings.

### Did discovery move?

Yes. `discovery.mjs` validates the six traces against the marked renderer,
navigation frame and origin, conserves each marked interval through the existing
partition analyzer, and records both network finish and renderer-delivery times.
The six non-entry dependencies change from script initiators to parser-initiated
link preloads. All times below are relative to each profile's start mark:

| Arm/profile | Dependency sends ms | Last dependency network finish ms | Marked readiness interval ms |
| --- | --- | --- | --- |
| baseline 0 | +102.287…109.378 | +119.523 | 256.445 |
| baseline 1 | +105.018…105.681 | +117.026 | 272.205 |
| baseline 2 | +123.402…124.029 | +136.571 | 255.894 |
| candidate 0 | −5.822…−5.371 | +37.094 | 276.648 |
| candidate 1 | −5.968…−5.619 | +19.179 | 273.515 |
| candidate 2 | −5.238…−3.883 | +38.643 | 265.700 |

The intended discovery change happened, but it did not pass the readiness gate.
For example, candidate 0 completes dependency networking at +37.094 ms, yet its
first recorded module evaluation begins +122.254 ms and the marked interval ends
at +276.648 ms. Candidate 1 evaluates long module spans earlier but still finishes
near its baseline interval. These are scheduling observations, not causal proof
that a particular module or layout accounts for the remainder. Evaluation spans
lack URLs; do not infer identities or sum overlapping spans/network intervals.
The three traced samples per arm are diagnostic and cannot replace the 21-pair
uninstrumented result. No favorable rerun is authorized.

### Restoration and next packet

Build source, optional artifact-runner source and exact project contract are
restored to 0.17.6. Retain graph-boundary/cache/base/shared-package/Worker regression
coverage, not the candidate-only assertion requiring all eager dependencies to be
preloaded. The original exact-closure assertion remains pinned in `405877a`.
Restored check, 388 tests plus project journey and package smokes pass. Net product
LOC, passes, semantic/runtime concepts and browser bytes are zero. No release,
version, npm publication or deployment follows this rejected experiment.

Next packet is a read-only renderer scheduling review using these six preserved
traces: partition work between reported dependency network completion and module
evaluation/readiness, identify whether repeated HTML/style/layout work belongs
to document parsing, application code or acceptance callbacks where trace evidence
allows, and mark unattributed work explicitly. Do not turn the removed discovery
gap into an idle-time estimate, change matched content/DOM/accessibility, weaken
readiness, or propose another product change before a distinct cost is proven.
The optional artifact report's pre-existing missing-style requirement remains a
separate tooling defect; it is not startup-speed evidence.
