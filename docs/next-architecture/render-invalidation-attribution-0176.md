# Renderer invalidation attribution — pinned 0.17.6

2026-10-29. Hosted diagnostic
[40800976322](https://github.com/kudzujs/kudzu/actions/runs/40800976322), harness
`da2cb94`. Both arms pin released commit
`487a1566d23c6226974f919beb943d088142763b`. The candidate arm means **marked release
output**, not an optimization. No 21-pair adoption comparison was run.

## Decision

The new traces identify two application text updates as the source of the small
final layout invalidations. They do not establish an avoidable runtime source for
the large initial document-render cost. The startup optimization lane pauses:
there is no evidence-ready new speed candidate, and none of the nine rejected
candidates is reopened. Additional tracing of the same unexplained gap is not
automatically authorized.

The next evidence-ready maintenance packet is the separately reproduced artifact
report correctness defect: a route/family can report `kudzu-style.js` even when
specialization does not emit that module. Fixing report accuracy must preserve
production deploy bytes; it is not a startup optimization or speed claim.

## Frozen method and validation

`node test/c2-initial-mount.mjs --invalidations` retains the complete C2 source,
readiness predicate and journey. Three fresh diagnostic profiles per arm use the
same tracing categories:

```text
devtools.timeline
blink.user_timing
disabled-by-default-devtools.timeline.invalidationTracking
disabled-by-default-devtools.timeline.stack
```

The marked arm reuses `instrumentModules()` and its exact source-hash manifest.
Original hashes match every unmarked module, marked hashes match every instrumented
module, and both HTML files are byte-identical across arms. The analyzer parses
both emitted static-import graphs, proves they are equal, and verifies all 11
marked module bodies finish their static dependencies before starting. All modules
are observed before final readiness; bodies do not overlap.

Required-Chrome full check/388 tests and all six diagnostic C2 journeys pass,
including row identity/latest handlers, effects and cleanup, keyboard behavior,
delayed/missing scripts and the static sibling. Local check/388 tests and focused
module-marker tests also pass. The analyzer validates frame/navigation/thread
identity, exact readiness conservation, source locations, same-frame node links
and counts. Missing stacks are retained rather than attributed by proximity.

Host: AMD EPYC 7763 (four logical CPUs), Linux 7.0.0-1017-azure x64,
Node 24.22.1, Chrome 156.0.8078.47. This differs from the earlier preload trial's
Chrome/Node/OS versions. Do not transfer absolute timings, detailed event ordering
or caller conclusions backwards into that earlier run. Stack tracking and marks
perturb scheduling; even this run's arms are not a speed comparison.

## What the event stacks prove

Every profile contains exactly six stack-bearing invalidation events:

1. Two `Removed from layout` records for old text nodes, with top stack frames in
   emitted `assets/handlers/pages/index.js` functions `x` and `g`.
2. Two `Node was inserted into tree` style records for new text nodes, with the
   same two application stack locations.
3. Two `Added to layout` records for those same new node IDs, with the top stack
   frame `ready` in the injected harness, while its `offsetHeight` read flushes
   pending work.

The analyzer resolves the one-based trace line/column into each emitted JS AST.
Function `x` writes `textContent` on `[data-effect-setup]`; `g` writes it on
`[data-child-setup]`. These are the fixture's ordinary dependency effects that
replace `setup pending` with `setup 0`. The marked arm places all four application
invalidation records inside the **effects entry** body, not the handler module's
declaration-only body. Full stacks retain the effect dispatcher and owner calls.
Prefix marks move emitted source from line 1 to line 2; source resolution accounts
for that instead of borrowing baseline locations.

Same-frame node IDs connect each inserted text node to its later layout attachment.
This distinguishes the **mutation producer** (application effect) from the
**synchronous layout trigger** (harness readiness read). Removing either effect
would change behavior; removing the read would weaken the frozen readiness test.

| Arm/profile | No-stack layout additions | No-stack style insertions | Stack-bearing invalidations | Layout passes | Layout inside `ready`, ms |
| --- | --- | --- | --- | --- | --- |
| unmarked 0 | 13,509 | 2,356 | 6 | 6 | 1.169 |
| unmarked 1 | 13,509 | 565 | 6 | 4 | 0.575 |
| unmarked 2 | 13,509 | 1,955 | 6 | 5 | 0.960 |
| marked 0 | 13,509 | 1,577 | 6 | 5 | 0.761 |
| marked 1 | 13,509 | 888 | 6 | 4 | 0.712 |
| marked 2 | 13,509 | 665 | 6 | 4 | 0.500 |

## What the large rendering work does and does not prove

All profiles report 13,509 no-stack `Added to layout` events, matching the final
initial document layout-object total. Of those events, 13,508 occur inside
`UpdateLayoutTree`, one inside document parsing, and none inside a recorded
module evaluation. These are browser layout-object construction contexts, not
proof that an adjacent runtime module inserted 13,509 DOM elements. Counts are
not unique DOM nodes or durations; layout objects may share a DOM node.

The large render passes grow the initial layout tree. Beyond the two application
text replacements above, these traces do not record another teardown/rebuild
producer with an application stack. In the marked arm, the binding and list module
bodies have **no tracked invalidation records**. This does not mean they perform
zero DOM writes: previous write census already proves otherwise. Browser tracking
can coalesce or omit redundant invalidations; no event is not a universal
no-invalidation guarantee.

No-stack style-insertion counts vary substantially with document parsing and render
scheduling. Preserve the counts, original args and missing-stack cases. They do
not establish a removable cost, an application caller, or a causal cost per event.
Initial document rendering, parser work and required effect output cannot be
removed from the matched workload to manufacture an improvement.

The recorded caller evidence resolves the small final text-update path. The large
initial tree work remains a browser/document workload without a demonstrated
avoidable framework producer. Instrumented wall times are diagnostics only;
no speedup, statistical tie or cross-framework superiority is established.

## Next bounded correctness packet

1. Preserve/reproduce `node test/artifact-baseline.mjs` failing on released source
   for project `/app/projects`: reported `kudzu-style.js` is absent from deploy.
   Add a focused report-versus-emitted-file assertion before editing.
2. Inspect `routeRuntimeEdges()` and `familyRuntimeRequirements()` against actual
   style-module emission and specialized binding/list imports. Reuse the existing
   capability facts; do not turn the report into a second emitter or add a public
   graph API. Cover bindings without styles, styled bindings, list styles and
   shared/navigation families, preserving required real edges.
3. Re-run the complete artifact-baseline fixture set plus report/output checks.
   Require byte-identical deploy artifacts, unchanged ownership/lazy/Worker/static
   exclusions, `npm run check`, `npm test` and package smokes. If another report
   discrepancy appears, record its actual producer/consumer mismatch before
   broadening the fix; no speculative graph rewrite.
4. Treat any eventual release as a correctness delivery with the existing CI,
   package and protected-publication gates. Do not claim startup benefit or launch
   another performance comparison for a reporting-only change.

Diagnostic changes add no product source, semantic primitive, core pass/LOC,
runtime concept or deployed browser bytes. Core 0.17.6 / generator 0.1.167 remain
deployed; no release/tag/npm publication/deployment follows this packet. Startup
superiority and independent AI-cost/1.0 gates remain unresolved.

## Evidence

The release archive contains protocol, trace runner, all six raw traces/journeys,
both deploys, mark manifest/attribution, `analyze-invalidations.mjs`, full original
event args and resolved-source results, validation logs and pinned source copies.
Run `node /path/to/analyze-invalidations.mjs /path/to/repo` after extraction with
repository dependencies installed. The analyzer reads archived inputs only and
records their hashes. Archive receipts are in `PERFORMANCE.md`.
