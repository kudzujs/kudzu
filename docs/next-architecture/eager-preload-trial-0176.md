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

Next: pin this candidate and the harness; run one hosted, uninstrumented 21-pair
comparison against 0.17.6, plus separate diagnostic traces. Require >=5% lower
initial-DOM median, negative paired median, >=16/21 faster pairs and no operation
>5% worse with >=16/21 slower pairs. Both lifetime arms and every C2 journey must
pass. Preserve failed measurements; no favorable rerun or output-only re-gating.
