# Startup budget decision review — 0.17.6

2026-10-28. Read-only review of preserved experiments; no new benchmark samples.
Production remains core 0.17.6 / generator 0.1.167.

## Decision

All eight startup candidates remain rejected. The next bounded experiment should
test earlier discovery of **existing eager static ESM dependencies** through native
modulepreload links. This is a testable scheduling hypothesis, not a demonstrated
speedup or authorization to ship it. Do not retry the rejected loop/field changes.

## Rechecked adoption ledger

Each row compares baseline/candidate on its own hosted VM, with 21 uninstrumented
pairs. Do not compare absolute timings across rows. The review recomputes medians,
paired medians and faster-pair counts from raw profiles and checks rejection.

| Hosted run | Candidate | Initial DOM ms | Change | Paired ms | Faster pairs |
| --- | --- | --- | --- | --- | --- |
| 39901189209 | Initial root-map reuse | 282.4 / 285.8 | +1.20% | −1.3 | 11/21 |
| 39906191247 | Indexed ID traversal | 300.6 / 291.0 | −3.19% | −5.0 | 13/21 |
| 39908509063 | Hook-free ID registration | 293.8 / 293.6 | −0.07% | +2.3 | 9/21 |
| 39913071277 | Planned ID attributes | 307.9 / 295.2 | −4.12% | −7.7 | 15/21 |
| 40259544715 | Initial-ID exclusion | 271.3 / 264.8 | −2.40% | −18.4 | 15/21 |
| 40443460003 | Attribute-only bindings | 286.7 / 275.1 | −4.05% | −11.6 | 16/21 |
| 40450942360 | First-fill attribute comparison | 325.1 / 315.0 | −3.11% | −8.1 | 14/21 |
| 40605304361 | False capture-default omission | 214.0 / 208.9 | −2.38% | −3.1 | 13/21 |

Planned ID attributes also fail the `rowRemove` regression gate. In every trial,
2–6 pairs have lower script CPU without lower readiness. That observation explains
why CPU/call/byte reductions are insufficient acceptance evidence; it does not
identify a causal replacement bottleneck. Retain the original >=5% lower median,
negative paired median, >=16/21 faster pairs and operation-regression gates.

## Existing trace evidence

The review analyzes all 24 preserved traces from the four 0.17.6 trials (three
profiles per arm), using the existing readiness partition analyzer. Each profile
conserves its start-mark-to-final-ready interval; time preceding the start mark is
reported separately. Categories are exclusive within a profile. Never sum
overlapping spans, medians from different categories, or network and renderer time.

All 24 emitted eager graphs contain 11 modules. Only five entry scripts have
explicit preload links. The six other modules are:

- `kudzu-collection-selector.js`
- `kudzu-effect.js`
- `assets/handlers/pages/index.js`
- `kudzu-native.js`
- `kudzu-serialization.js`
- `kudzu-style.js`

Runtime filenames above live under the emitted content-addressed runtime family.
Every missing-preload request has a script initiator matching a direct static
import edge in its own emitted graph. Requests are restricted to the marked
renderer, document frame, origin and readiness interval; Chrome/extension traffic
is excluded. Dynamic imports are not followed by the review's TypeScript AST walk.

Across the 12 baseline traces, first dependency sends occur +85.564…130.121 ms
after the start mark. The latest explicitly preloaded entry's reported network
finish is +10.993…31.839 ms. These ranges establish delayed discovery, **not** a
recoverable 50–120 ms budget: HTML parsing, style/layout, renderer scheduling and
module work overlap the interval.

For a concrete within-profile account, run 40605304361 baseline profile 0 has:

- Entry modules network-complete by +11.469 ms.
- Dependencies requested at +87.984…91.531 ms; final dependency network completion
  +100.118 ms.
- Module evaluation spans +88.584…91.191, +101.171…116.304 and
  +116.852…165.536 ms, followed by more module work. Evaluation spans have no URLs;
  do not assign them module names from ordering alone.
- The native dependency's renderer `ResourceFinish` event arrives at +166.405 ms,
  although `args.data.finishTime` reports network completion near +99 ms. The
  difference is event delivery delay, not 67 ms of network transfer.
- The conserved marked interval is 183.387 ms: module evaluation 69.854, layout
  34.179, style 13.568, HTML parsing 16.490, GC 12.130, prepaint 12.921, uncovered
  20.679, and remaining categories 3.566 ms. The reported initial-DOM metric is
  211.8 ms and includes time before the mark. Uncovered time is not proven idle or
  network wait.

Earlier native preloads might overlap dependency fetching with document work.
They might instead compete for resources or shift evaluation/layout scheduling.
Only an uninstrumented controlled comparison can determine net readiness benefit.

## Implementation seam and next bounded packet

`framework/build.mjs:preloadModules()` currently scans entry script tags only;
both streaming/non-retained and retained-cache HTML write paths call it. HTML is
written before runtime/handler emission and final handler bundling. A correct
experiment must account for that ordering rather than read unfinished files.

`framework/compiler/route-artifact-report.mjs` already separates route runtime
entries/requirements, eager handler entries/chunks, lazy chunks and Worker graphs.
Its runtime requirements are capability-derived, not a verified exact emitted
import graph (for example, style requirements and actual style emission use
different conditions). Do not blindly preload the report's union or an entire
runtime family. Reuse ownership information, but prove each added link is in the
route entry scripts' actual emitted static-import closure after specialization and
bundling. No new public manifest, loader, browser registry or runtime is needed.

Before product edits, freeze the following packet:

1. Reproduce a failing output assertion on 0.17.6: C2's six eager dependencies lack
   preload links. Establish an exact static-closure oracle over emitted imports.
   This is an output failure, not a newly demonstrated semantic failure.
2. Add only native modulepreload hints for same-build eager dependencies of the
   existing document entry scripts, deduplicated and base-correct. Preserve script
   order and native ESM execution. Exclude dynamic imports and their lazy-only
   descendants, Workers, unrelated route modules and static pages. An output
   reachable by both eager and lazy paths remains eager.
3. Cover both build write paths, base prefixes, shared/eager handler chunks,
   guarded package imports and Workers. Verify static siblings remain zero-JS;
   lazy chunks remain unrequested before activation. Retain delayed/missing-script
   recovery, initial effect ordering, keyed identity/latest handlers, cleanup,
   accessibility and complete C2 journeys. Verify generated JS is byte-identical;
   report exact HTML/deploy deltas and update contracts only for intended links.
4. Run `npm run check`, `npm test`, package smokes and relevant browser journeys.
   Pin candidate and harness commits before one hosted comparison against
   `487a1566d23c6226974f919beb943d088142763b` (0.17.6).
5. Keep 21 alternating fresh-profile uninstrumented pairs, unchanged workload and
   readiness predicate. Adopt only with >=5% lower initial-DOM median, negative
   paired median, >=16/21 faster pairs, and no operation >5% worse with >=16/21
   slower pairs. Trace three separate profiles per arm only for diagnostics.
   Earlier requests, fewer gaps or byte changes cannot override failure.
6. Reject and restore if any frozen gate fails; preserve evidence without a
   favorable rerun. Release only an accepted candidate through the existing
   delivery gates, including fresh protected npm approval.

Scope for that later change: both HTML finalization callers, emitted graph and
route ownership, exact output fixtures, lazy/Worker/base/static tests, comparison
harness/protocol, and performance/release records. This review itself changes no
product code: zero semantic primitives, core passes/LOC, runtime concepts, browser
bytes or benchmark delta. Startup superiority and independent AI-cost/1.0 gates
remain unresolved.

## Reproduction and provenance

The accompanying `startup-budget-0176` archive contains `review.mjs`, `review.json`,
`review.log`, the pinned partition analyzer and this report. From the repository
with dependencies installed, run `node /path/to/review.mjs /path/to/repo
/path/to/evidence-parent`. Extract the eight named `c2-*` evidence directories
under that parent first; their release archive receipts are in `PERFORMANCE.md`.
The review hashes each raw report, summary, protocol, trace, trace report, HTML
and visited JS module. The archive also records repository and analyzer provenance.
No browser is launched and no input evidence is rewritten.
