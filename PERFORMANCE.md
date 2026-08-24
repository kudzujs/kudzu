# Performance Records

Reproducibility classes: `npm run benchmark`, `npm run benchmark:keyed`, `npm run benchmark:native`, `npm run benchmark:module-cache`, `npm run benchmark:project-navigation`, `npm run benchmark:project-state`, and `npm run benchmark:source-scale` are maintained in this repository; `npm run benchmark:commerce` is a maintained paired runner over the public external storefront; older excluded-workspace sections are historical provenance only and are not current framework rankings.

`npm run benchmark:source-scale` generates its fixture outside the repository so 50,000 lines of synthetic source are not tracked. The default topology is 50 pages plus 450 route-owned imported modules. Generation is excluded from timing; fresh-process samples separately report source reads, reachable-graph discovery, source compilation, clean production build, compiler-result and deploy digests, output files/bytes, cache counters, and peak RSS. `ROUTES`, `MODULES_PER_ROUTE`, `FILLER_LINES`, `WARMUPS`, and `RUNS` may reduce or expand the fixture without changing the default acceptance floor. `TARGET_ROOT` measures another checkout; `BASELINE_ROOT` alternates that checkout with the current tree and requires identical deploy output.

The maintained 2026-08-13 comparison used Node 24.14.0 and an Intel Core i5-9500 Linux x64 host, one warm-up, and seven alternating fresh-process samples against clean `v0.8.44`. A narrow fast path skips Kudzu semantic transformation for 450 plain `.ts` modules whose runtime edges are exclusively resolvable relative TypeScript imports or exports; all other modules retain the existing transformer. Compile median fell from 2,323.9 ms to 1,413.2 ms (39.2%) and clean-build median from 3,325.3 ms to 2,382.4 ms (28.4%); every paired sample improved. Compile peak-RSS median fell from 571.2 MiB to 552.6 MiB, while build peak RSS was 570.9 MiB versus 568.8 MiB. Compiler scratch fell from 7,328,390 to 1,971,061 bytes. Both targets emitted the same 50 static HTML files, 10,980 bytes, and deploy SHA-256 `e107d78a7f55bc8a1af0ea6e53efeffa19b3d44d21c892484d103fa346e7ba7b`. This is a source-scale compiler comparison, not a cross-framework result.

## 0.12.3 Route Failure And Restoration Policy

Measured 2026-08-24 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome proves current-document retention for fetch and
response-body transport failures, accessible failure status, restored link
focus, retry after a failed pending prefetch, invalid-document fallback,
capability-module fallback, stylesheet fallback, and no pre-commit route
removal. The maintained application-owned HTTP 500 alert and explicit data
retry continue to pass.

The two-route session uses 16 JavaScript files totaling 61,126 raw / 22,663
aggregate gzip bytes, an increase of 359 raw bytes from `0.12.2` for
transport-error classification, status, and focus restoration. The 102-byte
gzip difference is unpaired and environment-sensitive, so it is not attributed
to the patch. Navigation
samples are `[1.5, 1.6, 2.0, 1.7, 1.8, 2.4, 1.8]` ms, with a 1.8 ms median and
1.5/2.4 ms minimum/maximum. The environment differs from the macOS arm64 Chrome
151 `0.12.2` measurement, so no latency comparison is claimed.

The application emits 43 files totaling 123,835 raw / 45,379 aggregate gzip
bytes with deploy SHA-256
`fb9d24cc01791bf80b67b659738ba62beded6ff6ce14a86a278fa4b34d088acf`.
Core semantic LOC remains 5,682 with no semantic primitive, compiler pass, core
compiler line, runtime concept, or public API. Navigation runtime source grows
from 351 to 374 lines. `/help` remains 0 B JavaScript.

## 0.12.2 Authentication And Permission Boundary

Measured 2026-08-23 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. Required Chrome proves invalid and valid login, token-backed
reload restoration, anonymous and rejected direct entry, role-aware controls,
server-enforced API and admin authorization, token clearing, and logout.

The two-route session uses 16 JavaScript files totaling 60,767 raw / 22,561
aggregate gzip bytes, an increase of 1,793 raw / 432 gzip bytes from `0.12.1`
for authored session state, restoration, and authorization headers. Navigation
samples are `[1.3, 1.5, 1.5, 1.2, 1.3, 1.4, 1.4]` ms, with a 1.4 ms median and
1.2/1.5 ms minimum/maximum. The range overlaps `0.12.1`, so no latency change
is claimed.

The application emits 43 files totaling 123,476 raw / 45,305 aggregate gzip
bytes with deploy SHA-256
`81d0b3c5e0d1d1f72f29d219647601463f5317f215274e14a45fe5ba92eb033e`.
The login route uses 12,093 raw / 5,795 aggregate gzip JavaScript bytes. Core
semantic LOC remains 5,682 with no pass, primitive, production compiler/runtime
change, or runtime-concept change. `/help` remains 0 B JavaScript.

## 0.12.1 Shared Layout, History, Focus, And Scroll

Measured 2026-08-23 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=7 npm run benchmark:project-navigation` uses fresh Chrome
profiles after the required browser journey proves hash and non-hash focus,
explicit hash/top scroll, title/live announcements, back/forward, retained
layout state, fresh route state, and native navigation outside the route group.

The two-route session uses 16 JavaScript files totaling 58,974 raw / 22,129
aggregate gzip bytes, an increase of 4 raw / 5 gzip bytes from `0.12.0` for the
correct non-hash focus fallback. Navigation samples are
`[1.5, 1.4, 1.3, 1.3, 1.3, 1.3, 1.4]` ms, with a 1.3 ms median and 1.3/1.5 ms
minimum/maximum. The range overlaps `0.12.0`, so no latency change is claimed.

The application emits 36 files totaling 106,096 raw / 38,201 aggregate gzip
bytes with deploy SHA-256
`4f1ce541af0794fcb17458ad37db7b32beb434f3a83cb7f949f13b3e4536fe1c`.
Core semantic LOC remains 5,682 with no pass, primitive, or runtime-concept
change. `/help` remains 0 B JavaScript. No AI-delivery cost comparison applies
to this browser correctness patch.

## 0.12.0 Project Route Shell And Runtime Parameters

Measured 2026-08-23 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` retains the same
fetch-complete list-to-detail interval while the application also emits
standalone runtime project and issue routes.

The maintained enhanced session is unchanged at 16 JavaScript files totaling
58,970 raw / 22,124 aggregate gzip bytes. Navigation samples are
`[1.3, 1.4, 1.2, 1.4, 1.4, 1.4, 1.3, 1.3, 1.2, 1.4, 1.4, 1.3, 1.1, 1.2, 1.2, 1.2, 1.6, 1.3, 1.4, 1.4, 1.4]`
ms, with a 1.3 ms median and 1.1/1.6 ms minimum/maximum. The range overlaps
`0.11.4`, so no latency change is claimed.

The runtime project route uses 17,905 raw / 8,455 aggregate gzip JavaScript
bytes; its issue route uses 18,002 raw / 8,474 aggregate gzip bytes. Complete
deploy output grows by 16 files and 28,314 raw / 11,911 aggregate gzip bytes.
These routes reuse existing pathname parameters, layout effects, bindings, and
native anchors. No compiler or browser-runtime source changed, and `/help`
remains 0 B JavaScript.

## 0.11.4 Project Pagination And Polling Policy

Measured 2026-08-23 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` retains the same
fetch-complete list-to-detail interval. Required Chrome separately proves URL
page/filter push and back synchronization, explicit refresh, hidden-page polling
suppression, one visible refresh, exact cleanup, and results bounded to two rows.

The two-route session uses 16 unique JavaScript files totaling 58,970 raw /
22,124 aggregate gzip bytes. Navigation samples are
`[1.3, 1.6, 1.3, 1.3, 1.3, 1.3, 1.2, 1.2, 1.2, 1.4, 1.3, 1.3, 1.3, 1.4, 1.3, 1.3, 1.3, 1.3, 1.2, 1.5, 1.4]`
ms, with a 1.3 ms median and 1.2/1.6 ms minimum/maximum.

Compared with `0.11.3`, the authored query controls, query-backed fetch
dependencies, polling state/effect, and native timer/listener cleanup add 2,652
raw / 913 aggregate gzip session bytes. The prior 0.8 ms median and 0.7/1.0 ms
range do not overlap, so the measured 0.5 ms median increase is disclosed. No
compiler or browser-runtime source changed, and `/help` remains 0 B JavaScript.

## 0.11.3 Project Optimistic Mutation

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` retains the same
fetch-complete list-to-detail interval; the required application journey
separately executes optimistic failure, rollback, retry, and success.

The two-route session uses 15 unique JavaScript files totaling 56,318 raw /
21,211 aggregate gzip bytes. Navigation samples are
`[0.7, 0.7, 0.8, 0.8, 0.9, 0.7, 0.8, 0.8, 0.8, 0.8, 0.7, 0.8, 0.9, 0.7, 0.8, 0.9, 0.8, 0.9, 1.0, 0.9, 0.7]`
ms, with a 0.8 ms median and 0.7/1.0 ms minimum/maximum.

Compared with `0.11.2`, the authored mutation status/error state, conditional
UI, and async handler add 582 raw / 3 aggregate gzip session bytes. The prior
0.9 ms median and 0.7/1.2 ms range overlap, so no latency change is claimed. No
compiler or browser-runtime source changed, and `/help` remains 0 B JavaScript.

A clean homepage verification rerun on the same environment recorded
`[0.9, 0.7, 0.8, 0.9, 0.9, 0.7, 0.8, 0.9, 0.7, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.8, 0.9, 0.8, 0.9]`
ms, with a 0.9 ms median and 0.7/0.9 ms range. It reproduces the release result's
overlapping range and does not change the no-regression conclusion.

## 0.11.1 Project List/Detail Consistency

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` waits for both
route-owned list data and the layout-owned project record before measuring
list-to-detail completion across fresh Chrome profiles.

The two-route session uses 16 unique JavaScript files totaling 55,736 raw /
21,208 aggregate gzip bytes. Navigation samples are
`[1.0, 0.7, 0.7, 1.0, 0.9, 0.9, 0.9, 0.9, 0.8, 0.9, 0.8, 0.9, 0.9, 1.2, 0.8, 0.9, 1.1, 1.0, 1.0, 0.8, 0.8]`
ms, with a 0.9 ms median and 0.7/1.2 ms minimum/maximum.

Compared with `0.11.0`, the authored shared record effect, list/detail outputs,
and mutation handler add 966 raw / 445 aggregate gzip session bytes. The prior
0.8 ms median and 0.6/1.3 ms range overlap, so no latency change is claimed.
No compiler or browser-runtime source changed, and `/help` remains 0 B
JavaScript.

## 0.11.0 Project Owned Fetch Lifecycle

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` uses fresh Chrome
profiles, waits for the initial project fetch and persisted workspace update,
then measures list-to-detail completion including route-effect cancellation.

The two-route session uses 15 unique JavaScript files totaling 54,770 raw /
20,763 aggregate gzip bytes. Navigation samples are
`[1.1, 0.8, 0.7, 0.8, 0.7, 0.8, 0.8, 0.7, 0.7, 0.9, 0.9, 0.9, 0.7, 0.8, 0.7, 1.3, 0.8, 0.8, 0.6, 0.9, 0.9]`
ms, with a 0.8 ms median and 0.6/1.3 ms minimum/maximum.

Compared with the `0.10.3` release, the authored fetch effect, loading/error
conditions, and refetch state add 1,208 raw / 440 aggregate gzip session bytes.
`/help` remains 0 B JavaScript. The measured interval is unchanged, but the new
fetch-completion prerequisite makes this an acceptance-safe no-regression check,
not a latency improvement claim. No compiler or browser-runtime source changed.

## 0.10.3 Project Persistence Recipe

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `RUNS=21 npm run benchmark:project-navigation` uses fresh Chrome
profiles and exact extensionless application routes. Every accepted sample
updates workspace state, verifies layout identity and persisted state, then
measures list-to-detail completion.

The 0.10.2 release baseline and 0.10.3 candidate were measured with the same
21-profile timing protocol and host; the candidate additionally verifies its
persistence write before timing:

| Revision | Session JS raw/gzip | Navigation median | Min/max |
|---|---:|---:|---:|
| `0.10.2` | 46,418 / 17,045 B | 1.9 ms | 1.3 / 5.5 ms |
| `0.10.3` candidate | 53,562 / 20,323 B | 1.5 ms | 1.3 / 5.6 ms |

Baseline samples:
`[1.3, 1.8, 1.6, 1.9, 1.3, 1.3, 1.9, 5.1, 1.7, 1.4, 1.9, 5.0, 4.7, 1.9, 1.7, 5.5, 2.2, 1.7, 1.5, 2.0, 5.2]`.

Candidate samples:
`[2.6, 1.5, 1.8, 1.3, 1.5, 1.4, 1.7, 1.3, 1.5, 1.5, 1.9, 1.7, 1.6, 5.6, 1.5, 1.6, 1.5, 1.5, 1.5, 1.5, 1.6]`.

The +7,144 raw / +3,278 aggregate gzip bytes are the measured cost of two
authored layout effects, their route-owned entries, and one native clear
handler. The median changes from 1.9 to 1.5 ms with overlapping ranges, so no
latency improvement or regression is claimed. No compiler or browser-runtime
source changed. `/help` remains 0 B JavaScript, so unused routes pay no
persistence cost.

## 0.10.2 Project Shared-Layout Navigation

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `npm run benchmark:project-navigation` builds the tracked
project application, updates the layout-owned workspace state, and measures
list-to-detail completion across seven fresh Chrome profiles. Every accepted
sample verifies retained layout identity and the shared workspace value before
reporting timing.

The two-route session uses 10 unique JavaScript files totaling 46,418 raw /
17,045 aggregate gzip bytes. Navigation samples are
`[2.3, 6.5, 1.4, 1.3, 5.1, 1.3, 4.0]` ms, with a 2.3 ms median and 1.3/6.5 ms
minimum/maximum. Both routes use the existing shared runtime family;
`workspace` has layout lifetime while summary, collection, filter, conditional,
saved-filter, row, and detail-draft states retain route lifetime. No compiler or
browser runtime source changed, so no revision-to-revision performance claim is
made.

## 0.10.1 Project State Scale

Measured 2026-08-22 on macOS arm64 with Node 25.6.1 and Chrome
151.0.7922.172. `npm run benchmark:project-state` generates 1/8/32-state pages,
requires a clean `v0.10.0` checkout through `BASELINE_ROOT`, and verifies that
baseline and candidate deploy output is byte-identical before timing seven fresh
headless Chrome processes per scale. The shared deploy contains 10 files,
18,780 bytes, and digest
`3f83712254d95f1cf59c5034f363ea906406efa1bd9539f3bb8b9a0d54a3fdc5`.

| States / derived dependency edges | JavaScript raw / gzip | Commit runs (ms) | Median |
|---:|---:|---|---:|
| 1 / 0 | 768 / 441 B | 0.4, 0.4, 0.4, 0.5, 0.6, 0.6, 0.6 | 0.5 ms |
| 8 / 8 | 10,935 / 4,789 B | 0.6, 0.7, 0.6, 0.6, 0.7, 0.6, 0.6 | 0.6 ms |
| 32 / 32 | 11,341 / 4,841 B | 0.8, 0.8, 1.0, 0.9, 0.8, 1.0, 1.0 | 0.9 ms |

The 1-state command-only page needs only the existing command runtime. The
larger pages reuse the existing binding, serialization, style, and command
runtime modules. No normalized-state runtime, new runtime family, or generic
rerender path is added.

## 0.9 Shared State And Actions

Measured 2026-08-19 on Linux x64 with Node 24.14.0 and Chrome 142.0.7444.175. Baseline `abe87ceafbf70ed8eb2618976e2d1e18c378126f` and the candidate built identical final Context/Zustand cart source.

| Fixture | Deploy files | Baseline and candidate JS raw / gzip | Baseline and candidate digest |
|---|---:|---:|---|
| Context cart | 18 | 29,951 / 13,065 B | `66897dce8fffd9e6bfb8b6a65ffba922a9f19d47dbb12c2a613dfb4b5685ee93` |
| Zustand cart | 18 | 30,291 / 13,193 B | `9c157adc2ff9afef1c282d50cecf77f6c0d8be2251d996298155ffb396e50211` |

The maintained Worker/effect graph also remains byte-identical at 907 raw / 477 gzip B for the Worker and 13,786 raw / 5,931 gzip B for the window graph. One warm-up and seven clean builds measured `[651.6,643.9,596.7,631.5,613.3,634.0,555.0]` for the baseline and `[456.6,441.3,450.2,461.8,445.7,466.8,457.5]` for the final candidate, with medians 631.5 and 456.6 ms. Targets ran sequentially at different times rather than interleaved, so this is only an artifact-size and build-completion diagnostic, not a timing comparison or claim. Required Chrome proves same-turn updates, dependency cleanup, navigation persistence, and exact layout disposal for both source models; static siblings remain zero JavaScript.

## 0.9 Resource Lifecycle Evidence

Measured 2026-08-19 on Linux x64 with Node 24.14.0 and Chrome 142.0.7444.175. Required-Chrome journeys execute terminal async acquisition/discard/late resolution, WebSocket dependency replacement/navigation release/stale callbacks, and package-backed effect cleanup. These are correctness journeys, not browser timing benchmarks.

| Fixture graph | JavaScript raw / aggregate gzip | Static sibling |
|---|---:|---:|
| E2B-shaped terminal | 2,634 / 1,495 B | 0 B |
| Route WebSocket with navigation | 15,872 / 7,163 B | 0 B |
| Package-owned effect | 3,562,795 / 1,025,300 B | 0 B |

No resource runtime, registry, or shared capability bytes were added. The package graph intentionally bundles TypeScript as isolation evidence; it is not a recommended payload and creates no package resource handle.

The maintained Worker/effect benchmark remains 907 raw / 477 gzip B for the Worker graph and 13,786 raw / 5,931 gzip B for the window graph. One warm-up and seven final-candidate builds measured `[686.6,606.6,707.7,615.3,512.8,504.2,536.7]`, median 606.6 ms. This is a same-target completion diagnostic, not a revision comparison or timing claim.

## 0.9 Component Object Properties

Measured 2026-08-19 on Linux x64 with Node 24.14.0 and Chrome 142.0.7444.175. The WorkLedger-derived route emits 11 JavaScript files totaling 37,302 raw / 14,083 aggregate gzip B; its static sibling emits zero JavaScript. The route composes existing binding, list, native-handler, and effect families. No runtime family, browser component function, field state, or shared browser bytes were added.

Required Chrome proves three repeated/conditional owners, selected array `Object.is` effect suppression, keyed identity, exact replacement cleanup/setup, conditional release/remount, and idempotent disposal. The maintained Worker/effect graph remains 907 raw / 477 gzip B for Worker and 13,786 raw / 5,931 gzip B for window output. One warm-up and seven same-target completion builds measured `[1162.6,1505.3,1140.8,938.0,758.9,753.8,717.3]`, median 938.0 ms; no comparative timing claim is made.

## 0.9 Semantic Compression

Measured 2026-08-19 on Linux x64 with Node 24.14.0 and Chrome 142.0.7444.175. The first 06B deletion replaces duplicated object-property and setter-callback compiler helper materialization with one internal function. Core semantic source falls from 5,296 to 5,271 lines. It adds no pass, IR kind, runtime concept, accepted source, or browser bytes.

The WorkLedger deploy remains 13 files with digest `31886797161a33150afb3bcbf697545afd9d2041a4968decd33146e68d4b7595` and 37,302 raw / 14,083 aggregate gzip JavaScript bytes. The array-prop effect-sync deploy remains 10 files with digest `5e3bd8413e3d42c54e5c50d7098aa5c383e73846f7ad80201c663eae92393ec5` and 21,172 raw / 8,251 aggregate gzip JavaScript bytes.

The maintained Worker/effect graph remains 907 raw / 477 gzip B for Worker and 13,786 raw / 5,931 gzip B for window output. One warm-up and seven same-target completion builds measured `[439.4,438.7,438.6,464.9,491.6,479.7,444.7]`, median 444.7 ms. No comparative timing claim is made.

The second independent deletion removes primitive- and array-specific component-body scans in favor of the existing direct serializable state initializer lookup. Core semantic source falls another 7 lines to 5,264, for 32 lines removed in Session 06B. Parameterized-debounce output remains 13 files, 16,053 raw / 7,735 aggregate gzip JavaScript bytes, and deploy SHA-256 `b7106651c6a619b01a3e98101df4ac68f9262803e6729451ef03ed3971b36dc7`. Array-prop effect-sync output remains unchanged at the values above.

The maintained Worker/effect graph again remains byte-identical. One warm-up and seven same-target completion builds measured `[584.0,521.7,552.6,496.7,481.4,507.7,494.2]`, median 507.7 ms. Host load differs from the first run, so no timing comparison is made.

### 0.9 Final-Proof Candidate Diagnostics

Measured 2026-08-19 on Linux x64, Node 24.14.0, Chrome 142.0.7444.175, and an Intel Core i5-9500. Local benchmark source and raw files remain ignored; accepted medians, artifact values, environment, candidate revision, and deploy digests are recorded in the final-proof audit.

The five-target content application first exposed an 11,348 B Kudzu state-backed disclosure versus 410 B Astro inline JavaScript. Native `<details>/<summary>` preserves accessibility, disabled-JavaScript, native-navigation, and missing-script acceptance while reducing every target's route/session JavaScript to 0 B. Kudzu emits 8,441 total bytes and no deployed JavaScript; Astro emits 8,680 total bytes and no deployed JavaScript.

Five-target runtime and capability matrices each used one warm-up, seven rotating clean builds, and seven fresh rotating Chrome profiles. Kudzu emits 33,831 raw / 13,236 gzip B JavaScript for the stateful matrix versus 193,685 / 60,035 B React, 64,023 / 24,772 B Vue, 40,726 / 15,659 B Svelte, and 195,371 / 61,352 B Astro+React. Median Kudzu scalar, row update, append, effect, and async operations are 0.9, 2.4, 3.2, 1.2, and 0.6 ms. Worker and navigation medians plus limitations are in the final-proof audit.

The completed frozen C2 rerun expands that stateful matrix to immutable object replacement, multi-state derived output, keyed row-local state/effect/ref ownership, filter/restore, conditional cleanup/fresh remount, accessible SVG keyboard state, a static sibling, and blocked/delayed/missing-JavaScript acceptance. Across 21 fresh rotating profiles every target passes all 19 operations and ownership checks. Kudzu emits 43,567 raw / 16,408 gzip B deploy JavaScript and transfers 45,721 B in the session versus 196,089 / 60,661 B and 196,287 B React, 66,620 / 25,624 B and 66,817 B Vue, 44,046 / 16,818 B and 44,243 B Svelte, and 197,771 / 61,994 B and 198,361 B Astro+React. Fresh-process build RSS, deterministic digests, preload graphs, script CPU, and load/journey heap are recorded. Row-local ref resolution, synchronous cleanup, per-list lifecycle gating, shared list-item and ownership-path maps, item-dependency transport gating, structural row fill/ID plans, row-state release cleanup, and boolean-toggle specialization reduce Kudzu's row filter, row restore, and search restore medians from 34.6, 208.6, and 77.5 ms to 12.0, 62.6, and 51.6 ms. Row filter is faster than Vue's 13.3 ms; row restore and search restore are within 3.5% and 1.8% of their nearest comparator medians of 60.5 and 50.7 ms. C2 passes.

The completed C5 rerun records 32 balanced Worker starts, invalidations, listener removals, terminations, and ignored late callbacks after replacement plus 30 mount/dispose cycles for every target, with zero stale mutations and zero final active handles. Kudzu emits 17,639 raw / 8,189 gzip B and transfers 19,402 B for that Worker session versus 193,422 / 60,159 B and 193,607 B React and 195,108 / 61,493 B and 195,685 B Astro+React. Uniform build RSS, deterministic digests, preload graphs, script CPU, load/journey/disposal heap, and active balances are recorded. Chrome reports zero `V8CompileDuration` for most targets, so `ScriptDuration` is the maintained uniform execution measure unless a later trace separates parse cost.

The public commerce fixture prepares generated source and identical assets once per size outside the timed framework interval, then compares Kudzu and Astro with acceptance before timing and rotating cold/warm samples. Its Kudzu adapter now emits only the flattened page props and bounded collection rows actually compiled instead of a 37 MiB nested catalog literal. At 1,000 products and seven rotating runs, Kudzu cold/warm medians are 2,948.9 / 2,964.3 ms and peak RSS is 264,600 KiB versus Astro 3,835.3 / 3,845.0 ms and 408,100 KiB. Kudzu is 23.1% / 22.9% faster and uses 35.2% less peak RSS; it emits 1,011 pages, 10,057,806 B, and digest `468800762dd6977644e9d3f2bf018bd951cf08487fe42f99360d3b55db567cc9`.

At 10,000 products, both targets pass sampled-product acceptance and emit 10,011 pages. Kudzu cold/warm medians are 22,614.0 / 22,150.6 ms versus Astro 23,198.1 / 23,438.2 ms, so Kudzu is 2.5% / 5.5% faster. One-shot CLI builds intern repeated RouteIR descriptors, update validated records in place, spool rendered HTML to staging until runtime families are known, stream the unchanged pretty plan in 64-route batches, and release standalone route plans after serialization; dev, incremental, navigation, and `afterBuild` retain their plans. Peak RSS falls 71.0% from 1,870,904 to 542,484 KiB, 11.4% below Astro's 612,412 KiB, while output remains 96,379,876 B with digest `811234693329ebd61eeceb6cd05e5d52473e5c81972a820253bf1aea664a0910`. The 10,000-route build-time and RSS gates pass.

The final 2026-08-20 completion run passes `npm run check`, all 246 required-Chrome tests, fresh-install package smoke, and the maintained Worker benchmark. The Worker graph is 907 raw / 477 gzip B and the window graph is 14,093 raw / 6,037 gzip B; seven clean builds after one warm-up have a 535.9 ms median. This is a same-target completion diagnostic, not a revision timing claim.

The public `kudzu-based-bench` storefront then received one warm-up and seven alternating clean builds at 100, 1,000, and 10,000 generated products against the preceding `bb7fdc5` commit. Baseline and candidate output is byte-identical at every size. Timing distributions overlap and no build improvement or regression is claimed.

| Products | Pages / files | Output bytes | Baseline median | Candidate median |
|---:|---:|---:|---:|---:|
| 100 | 111 / 148 | 1,368,823 | 2,767.3 ms | 2,755.4 ms |
| 1,000 | 1,011 / 1,048 | 10,164,835 | 8,407.7 ms | 8,190.3 ms |
| 10,000 | 10,011 / 10,048 | 97,521,905 | 63,966.5 ms | 64,217.4 ms |

```text
100 baseline: [2671.0,2768.9,2881.5,2845.5,2767.3,2561.2,2705.8]
100 candidate: [2746.4,2796.4,2755.4,2812.7,2590.6,2494.1,2767.2]
1000 baseline: [8733.3,8059.4,8444.8,7923.9,7947.1,8407.7,8666.0]
1000 candidate: [8048.9,7927.7,8711.0,8640.6,8190.3,8171.3,8746.9]
10000 baseline: [65514.0,62738.0,64195.7,63610.6,63966.5,66885.2,63434.2]
10000 candidate: [62222.9,63710.3,64217.4,64236.1,63288.2,65652.3,64977.8]
```

## Historical 0.8.59 Release Snapshot

Kudzu 0.8.59 broadens existing compile-time setter-child specialization to one direct parent array-state prop and one direct `set*` setter prop in that prop-derived state shape. It adds no browser runtime code and makes no timing claim.

## Maintained 0.8.58 Release Snapshot

Kudzu 0.8.58 adds one narrow keyed-item initializer descriptor to the existing complex row-state path. Routes without that descriptor, including static siblings, retain their existing capability output. This release makes no timing claim.

## Maintained 0.8.57 Release Snapshot

Kudzu 0.8.57 broadens an existing compiler proof from direct primitive parent state to direct JSON-safe plain-object parent state for specialized child draft initialization. It adds no browser runtime code and makes no timing claim.

## Maintained 0.8.56 Release Snapshot

Kudzu 0.8.56 avoids unaffected source compilation and build-time JSX execution during development. The focused two-route correctness fixture recompiles two of four modules and rerenders one of two pages after a route-owned helper edit; this is a work-reduction assertion, not a timing claim.

## Maintained 0.8.55 Release Snapshot

Kudzu 0.8.55 replaces site-wide runtime specialization with deterministic route or navigation-group capability families. Unrelated standalone capabilities no longer change another route's loaded runtime bytes or cache URL; no new timing claim is made.

## Maintained 0.8.54 Release Snapshot

Kudzu 0.8.54 retains esbuild output metadata and writes one compiler-scratch artifact report after bundling. Deploy runtime behavior and output selection are unchanged, and no new performance claim is made.

## Maintained 0.8.53 Release Snapshot

Kudzu 0.8.53 removes unrelated source stylesheet links from route HTML and reuses shared layout links during enhanced navigation. Static routes add no JavaScript, and no new performance claim is made.

## Maintained 0.8.52 Release Snapshot

Kudzu 0.8.52 moves proven effect-private mutable refs from component scope into existing setup-invocation closures. The refs add no serialized route scope, shared runtime, or static-sibling JavaScript; no new performance claim is made.

## Maintained 0.8.51 Release Snapshot

Kudzu 0.8.51 broadens compiler-only package-reference routing into existing owned effect ESM and bundling. Static siblings and routes without the effect retain zero package bytes; no new performance claim is made.

## Maintained 0.8.50 Release Snapshot

Kudzu 0.8.50 changes compiler and build-time shared-state metadata while retaining existing RouteIR state ownership, action handler output, and browser runtimes. No new performance claim is made.

## Maintained 0.8.49 Release Snapshot

Kudzu 0.8.49 broadens compiler-only setter-callback validation to direct child fan-out while retaining the existing command descriptors and browser runtimes. No new performance claim is made.

## Maintained 0.8.48 Release Snapshot

Kudzu 0.8.48 broadens compiler-only setter-callback validation to multiple direct intrinsic handlers while retaining the existing command descriptors and browser runtimes. No new performance claim is made.

## Maintained 0.8.47 Release Snapshot

Kudzu 0.8.47 changes compiler-only specialized child initialization and retains existing parent/child state ownership, handler capabilities, and browser runtimes. No new performance claim is made.

## Maintained 0.8.46 Release Snapshot

Kudzu 0.8.46 changes compiler-only Context Provider scratch and retains the same concrete Notes state operations, RouteIR signals, runtime modules, and static sibling output. No new performance claim is made.

## Maintained 0.8.45 Optimization Snapshot

Kudzu 0.8.45 adds the plain TypeScript fast path and maintained paired source-scale runner described above. It changes compiler scratch only: the measured deploy graph is byte-identical to `v0.8.44`, and no browser runtime or public API changed.

## Maintained 0.8.44 Release Snapshot

Kudzu 0.8.44 changes compiler-only naming for action-private Context state and setters. The maintained Context browser fixture retains the same emitted concrete state operations and CRUD behavior while a same-named consumer local remains ordinary static content. No browser runtime module or public API changed, and no new performance claim is made.

## Maintained 0.8.43 Release Snapshot

Kudzu 0.8.43 extends compiler-only callback/ref specialization from two to three direct component boundaries. The maintained browser fixture retains the same parent state operations, child state/effect/ref ownership, conditional cleanup, and static zero-JavaScript sibling while the added forwarding component is absent from emitted JavaScript. No browser runtime module or public API changed, and no new performance ranking is claimed.

## Maintained 0.8.42 Optimization Snapshot

Kudzu 0.8.42 retains the tracked 0.8.41 runtime and six-route commerce matrices below and adds two focused external-fixture optimizations. Those focused samples compare Kudzu before and after the patch; they do not establish a current cross-framework ranking.

The maintained external 1,000-product fixture exposed 1,011 byte-identical native route entries and 1,011 byte-identical effect route entries. A three-run check against clean `v0.8.41` produced:

| Target | Cold build | Warm build | Output |
|---|---:|---:|---:|
| `v0.8.41` | 13,866 ms | 13,560 ms | 10.48 MB |
| Route-entry sharing candidate | 13,203 ms | 13,087 ms | 9.53 MB |

Cold build is 4.8% lower, warm build is 3.5% lower, and output is 9.1% smaller in this sample. A 100-product artifact inspection reduced 101 native and 101 effect route files to three native and five effect files because only byte-identical generated sources share paths. Single-route URLs and nonidentical entries retain their existing route paths. A seven-run alternating measurement is still required before making a stronger build-time attribution claim.

The external form fixture then replaced effect-delayed query carry with direct read-only query bindings on hidden `value` and `disabled` properties. Five Slow 4G sessions measured readiness at 348 ms versus the prior 783 ms, a 55.6% reduction. This is a narrow critical form path, not a general inline-capability policy; writable search state, handlers, effects, conditions, lists, unrelated bindings, and nonmatching markup retain the existing parameter capability path.

A static-catalog same-document navigation experiment was rejected. After compressing concrete route records to remove the first implementation's payload blowup, three Slow 4G sessions still favored native document navigation:

| Navigation | Detail | Back | Session transfer | Degraded capabilities |
|---|---:|---:|---:|---:|
| Native document | 314 ms | 107 ms | 322.2 KB | 15/18 |
| Enhanced candidate | 575 ms | 297 ms | 511 KB | 12/18 |

The static `getStaticPaths()` pattern expansion was removed. Existing exact and `runtimeParams` enhanced-navigation groups are unchanged, and native document navigation remains the default.

## Maintained 0.8.41 Cross-Framework Snapshot

Measured UTC 2026-08-12 on the Intel Core i5-9500 Linux x64 host, Node 24.14.0, and Chrome 142.0.7444.175. The tracked runtime matrix used one warm-up, seven interleaved clean builds, and seven rotating fresh Chrome profiles. Every correctness, accessibility, identity, effect-cleanup, and browser-error gate passed. Kudzu emits complete initial HTML while React, Vue, and Svelte start from client-rendered shells, so initial delivery and artifact totals are not architecture-equivalent.

| Runtime matrix target | Build median | HTML raw / gzip B | JS raw / gzip B | Total raw / gzip B | Complete initial DOM |
|---|---:|---:|---:|---:|---:|
| Kudzu `0.8.41` release tree | 1,475.480 ms | 179,388 / 37,008 | 33,575 / 12,928 | 212,963 / 49,936 | 532.9 ms |
| React 19.2.8 + Vite 8.1.5 | 856.231 ms | 282 / 219 | 193,685 / 60,043 | 193,967 / 60,262 | 510.6 ms |
| Vue 3.5.40 + Vite 8.1.5 | 1,053.062 ms | 281 / 221 | 64,023 / 24,772 | 64,304 / 24,993 | 357.6 ms |
| Svelte 5.56.7 + Vite 8.1.5 | 1,733.637 ms | 281 / 219 | 40,726 / 15,659 | 41,007 / 15,878 | 401.1 ms |

Raw runtime arrays, quartiles, checkout metadata, source hash, and validation results are checked in at `benchmarks/runtime-matrix/results/raw.json`. The maintained 2,000-row keyed run used one warm-up, seven clean builds, and seven fresh Chrome profiles: build 901.4 ms, append 14.7 ms, filter 25.4 ms, restore 126.2 ms, reverse 25.1 ms, and JavaScript 28,450 B raw / 11,036 B gzip. A requested 21-profile keyed run exceeded the 600-second limit and produced no result.

The maintained Worker benchmark recorded a 1,823.2 ms build median, 907 B raw / 477 B gzip Worker graph, and 12,148 B raw / 5,411 B gzip aggregate window graph. The tracked six-route commerce sources used one warm-up and seven rotating clean builds:

| Commerce target | Build median | Files | HTML raw / gzip B | JS raw / gzip B | Total raw / gzip B |
|---|---:|---:|---:|---:|---:|
| Kudzu | 867.188 ms | 17 | 17,123 / 5,376 | 18,428 / 8,261 | 37,434 / 14,689 |
| React 19.2.8 SSR + Vite hydration | 859.125 ms | 10 | 9,304 / 4,265 | 198,261 / 61,464 | 209,270 / 66,741 |
| Next.js 16.2.11 static export | 7,290.533 ms | 74 | 72,890 / 19,857 | 643,484 / 191,844 | 814,186 / 247,596 |
| Nuxt 4.5.0 generation | 7,334.287 ms | 26 | 17,557 / 7,850 | 191,758 / 70,925 | 215,851 / 82,067 |
| SvelteKit 2.70.1 static export | 4,725.279 ms | 19 | 15,832 / 6,511 | 85,095 / 33,477 | 102,659 / 41,047 |

The commerce targets share initial content and behavior contracts but use materially different architectures. The browser suite timed out in Kudzu's existing in-flight rejection-navigation wait before cross-target sampling, so no commerce browser timing is claimed.

## P1 Direct Two-Boundary Callback And Ref Dataflow

Measured UTC 2026-08-12 on the Intel Core i5-9500 Linux x64 host with 6 physical cores, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.40` at `c88b94f91b40d76fad58a208f3261de399c6d2b4`. The compiler and migration checks had SHA-256 `f80ec9c532376a90805c6d99b8cbfa162578592c71c5e62f1cb92e16a64a5ba3`.

One warm-up and seven alternating clean fresh-process builds produced byte-identical 176-file deploy graphs, 3,850,245 raw bytes, 1,984,991 aggregate gzip bytes, deploy SHA-256 `d24f9d4608b9ae096fa5e334cf8c6556e51d8588bff02d15e3eacf0c6711db81`, and `kudzu-plan.json` SHA-256 `302d75dac6f58306c139b398a436480cf60cdd5743e6100ab1c728bd255e16be`.

| Target | Clean build median | Range | Peak RSS median |
|---|---:|---:|---:|
| `v0.8.40` | 3,565.236 ms | 2,960.844-3,995.094 ms | 364.6 MiB |
| Two-boundary candidate | 3,470.277 ms | 3,099.259-3,842.591 ms | 362.0 MiB |

The candidate unpaired median is 2.66% lower; round-paired candidate-minus-baseline differences have a +59.834 ms median. Peak RSS is 0.74% lower. Ranges overlap and no material performance change is claimed.

```text
v0.8.40: [3671.298,3995.094,3776.594,3295.688,2960.844,3565.236,3563.737]
candidate: [3099.259,3674.641,3842.591,3400.780,3418.781,3470.277,3623.571]
paired candidate-baseline: [-572.039,-320.453,65.997,105.092,457.937,-94.959,59.834]
```

The FIRE-derived callback/ref fixture now forwards both a direct setter adapter and a simple state callback through one imported presentation component. Browser checks preserve parent state updates, child-local state/effects/IDs, parent ref resolution, conditional cleanup, fresh remount, and a zero-JavaScript static sibling. ComponentAnalysis retains the same parent SignalIR on each nested specialization. A third callback-carrying boundary remains rejected. No browser runtime, callback registry, component function, route artifact, or deploy byte was added.

## P1 Property-Level Object-State Effect Dependencies

Measured UTC 2026-08-12 on the Intel Core i5-9500 Linux x64 host with 6 physical cores, Node 24.14.0, npm 11.9.0, and Chrome 142.0.7444.175. The baseline was clean tag `v0.8.39` at `090b42124d596260bdd6a0814c014e5b906dc0eb`. The focused implementation and migration checks had SHA-256 `c097c10e786ff5d09537b52384c1bf3d32cb46998ef62125c23dda3355b62277`, produced by:

```bash
sha256sum framework/compiler/effect-analysis.mjs framework/core.mjs test/compiler-passes.test.mjs test/fixtures/zustand-migration/src/Shell.tsx test/framework.test.mjs | sha256sum
```

The complete 154-page repository build used one warm-up and 21 alternating clean fresh-process samples. Both targets emit 175 files and byte-identical `kudzu-plan.json` (`be842101f08aab2d8b3af5daa3ed0539a6a08ea8c3cba15cd25f3a36d53ef61f`). The only deploy difference is the updated public explanation in `docs/index.html`: candidate output adds 98 raw bytes and 31 aggregate gzip bytes. Compiler, effect runtime, route JavaScript, and all other artifacts are byte-identical.

| Target | Clean build median | Range | Peak RSS median | Deploy raw / gzip bytes |
|---|---:|---:|---:|---:|
| `v0.8.39` | 3,753.276 ms | 3,097.211-5,294.316 ms | 356.9 MiB | 3,845,393 / 1,983,262 B |
| Property dependency candidate | 3,883.841 ms | 3,533.936-4,919.378 ms | 363.7 MiB | 3,845,491 / 1,983,293 B |

The candidate unpaired median is 3.48% higher and the round-paired candidate-minus-baseline median is +103.031 ms. Peak RSS is 1.92% higher. Timing ranges overlap substantially and both changes remain below the 5% material-regression threshold, so no material build or memory regression is established.

```text
v0.8.39: [5294.316,4885.317,4462.086,3696.012,3105.264,3491.623,3852.100,3414.218,3753.276,3854.507,4311.174,3833.095,3097.211,3669.963,3567.084,3399.614,3626.351,3687.408,3883.556,4104.665,3880.847]
candidate: [4919.378,4548.065,4236.325,3752.842,3788.156,3738.609,3883.841,4110.706,4055.150,4116.317,3710.973,4016.578,3533.936,3625.603,3670.115,3840.795,4045.689,3988.434,3619.226,3944.068,3760.976]
paired candidate-baseline: [-374.938,-337.252,-225.761,56.830,682.892,246.986,31.741,696.488,301.874,261.810,-600.201,183.483,436.725,-44.360,103.031,441.181,419.338,301.026,-264.330,-160.597,-119.871]
```

The tracked runtime matrix then ran one warm-up, seven interleaved clean builds, and seven rotating fresh Chrome profiles for matched Kudzu, React/Vite, Vue/Vite, and Svelte/Vite workloads. Every correctness, accessibility, identity, effect-cleanup, and browser-error gate passed. This matrix uses a primitive effect dependency, so it is broad regression evidence rather than a property-dependency-specific framework claim.

| Runtime matrix target | Build median | JS raw / gzip B | Total raw / gzip B | Initial DOM | Effect update + cleanup |
|---|---:|---:|---:|---:|---:|
| Kudzu `0.8.39` candidate | 862.432 ms | 33,575 / 12,928 | 212,963 / 49,936 | 363.4 ms | 1.9 ms |
| React 19.2.8 + Vite 8.1.5 | 498.572 ms | 193,685 / 60,043 | 193,967 / 60,262 | 355.7 ms | 4.4 ms |
| Vue 3.5.40 + Vite 8.1.5 | 655.787 ms | 64,023 / 24,772 | 64,304 / 24,993 | 283.0 ms | 1.9 ms |
| Svelte 5.56.7 + Vite 8.1.5 | 907.584 ms | 40,726 / 15,659 | 41,007 / 15,878 | 307.9 ms | 2.5 ms |

The tracked six-route commerce sources also completed seven rotating clean builds for Kudzu, React SSR + Vite hydration, Next.js static export, Nuxt generation, and SvelteKit adapter-static. These targets have matched initial content and behavior contracts but materially different architectures.

| Commerce target | Build median | Files | HTML raw / gzip B | JS raw / gzip B | Total raw / gzip B |
|---|---:|---:|---:|---:|---:|
| Kudzu | 1,062.059 ms | 17 | 17,123 / 5,376 | 18,428 / 8,261 | 37,434 / 14,689 |
| React 19.2.8 SSR + Vite hydration | 1,020.288 ms | 10 | 9,304 / 4,265 | 198,261 / 61,464 | 209,270 / 66,741 |
| Next.js 16.2.11 static export | 7,939.352 ms | 74 | 72,890 / 19,860 | 643,484 / 191,844 | 814,186 / 247,612 |
| Nuxt 4.5.0 generation | 8,566.437 ms | 26 | 17,557 / 7,857 | 191,758 / 70,925 | 215,851 / 82,075 |
| SvelteKit 2.70.1 static export | 5,778.467 ms | 19 | 15,832 / 6,520 | 85,095 / 33,482 | 102,659 / 41,061 |

Kudzu commerce output is 4.54x-16.86x smaller in aggregate gzip than the compared hydrated/client-navigation outputs. React's clean build median is 3.9% lower than Kudzu's on this small fixture; Kudzu builds 5.4x-8.1x faster than the three full static-export frameworks. The full commerce browser command was attempted twice, but both runs timed out in Kudzu's existing in-flight rejection-navigation wait before cross-target browser sampling; no commerce browser timing result is claimed. The complete runtime matrix browser run above passed. Property-path effects reuse existing DerivedIR, source subscriptions, expression evaluation, and `Object.is`; no runtime module or field-signal mechanism was added.

## P0.12 Deep RouteIR And CapabilityIR Validation

Measured UTC 2026-08-12 on the Intel Core i5-9500 Linux x64 host with 6 physical cores, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.38` at `918f721d369fed486c5ff04a7423f79563e1c42e`. The focused implementation files had SHA-256 `f8f58432f264d5df12cadfba07986712cecf148be300b6071c03adaf42fd6594`, produced by:

```bash
sha256sum framework/compiler/route-ir.mjs framework/compiler/route-build-record.mjs framework/compiler/route-capability-planner.mjs framework/core.mjs test/compiler-passes.test.mjs | sha256sum
```

The repository's 153-page build used one warm-up and seven alternating clean fresh-process samples. Every sample produced the same 174-file deploy graph, 3,840,694 raw bytes, 1,981,560 aggregate gzip bytes, and SHA-256 `6c37ee550a217f4cf78494662e1e1ab4533582f031a2422b07eec74ed50eae74`. Baseline and candidate `kudzu-plan.json` files are byte-identical.

| Target | Clean build median | Range | Peak RSS median | Deploy bytes |
|---|---:|---:|---:|---:|
| `v0.8.38` | 2,356.477 ms | 2,159.934-2,389.644 ms | 352.7 MiB | 3,840,694 B |
| P0.12 candidate | 2,352.382 ms | 2,193.576-2,527.911 ms | 356.8 MiB | 3,840,694 B |

The candidate's unpaired median is 0.17% lower. Round-paired candidate-minus-baseline differences had a +14.255 ms median, with the candidate faster in one of seven pairs and the baseline faster in six. Timing ranges overlap and remain below the 5% material-regression threshold; candidate peak-RSS median is 4.1 MiB higher.

```text
v0.8.38: [2159.934,2223.405,2313.086,2378.192,2356.477,2380.726,2389.644]
candidate: [2193.576,2223.644,2317.685,2410.142,2352.382,2394.981,2527.911]
paired candidate-baseline: [33.642,0.239,4.599,31.950,-4.095,14.255,138.267]
```

RouteIR v1 now validates concrete state and parameter IDs, commands, native/effect captures, dependencies, reactive descriptors, conditions, keyed-list identity and ownership, marker fields, and strict JSON safety. RouteBuildRecord validates those references before artifact selection, while CapabilityIR validates standalone implications and exact projection from its route records before codegen. Repeated checks of the same immutable in-memory contracts are cached by identity. No runtime source, accepted TSX, deploy artifact, or browser behavior changes.

## P0.11 Structural Route Artifact Graph

Measured UTC 2026-08-11 on the Intel Core i5-9500 Linux x64 host with 6 physical cores, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.37` at `8b4e8850c40f2856216e43f23ad02ada8434eb37`. The focused implementation files had SHA-256 `1a93b7fff5d80f271c588f89486a47dc262427195a6a768fe392be949eb99b5e`, produced by:

```bash
sha256sum framework/build.mjs framework/compiler/route-build-record.mjs framework/compiler/route-capability-planner.mjs framework/core.mjs framework/core.d.ts test/compiler-passes.test.mjs | sha256sum
```

The repository's 152-page build used one warm-up and seven alternating clean fresh-process samples. Every sample produced the same 173-file deploy graph, 3,835,970 raw bytes, 1,979,875 aggregate gzip bytes, and SHA-256 `c1f95f25d43589b61d1abe7ecf256e5b5e9dddd5647fbcf6368c08cc5ae3ee20`. Baseline and candidate `kudzu-plan.json` files are byte-identical.

| Target | Clean build median | Range | Peak RSS median | Deploy bytes |
|---|---:|---:|---:|---:|
| `v0.8.37` | 1,820.186 ms | 1,769.592-1,910.670 ms | 351.6 MiB | 3,835,970 B |
| P0.11 candidate | 1,804.568 ms | 1,756.849-1,843.941 ms | 351.4 MiB | 3,835,970 B |

The candidate's unpaired median is 0.86% lower. Round-paired candidate-minus-baseline differences had a -20.933 ms median, with the candidate faster in five of seven pairs and the baseline faster in two. Timing ranges overlap, so no material improvement is claimed; peak-RSS medians differ by 0.3 MiB.

```text
v0.8.37: [1786.548,1834.792,1910.670,1853.493,1820.186,1769.592,1778.201]
candidate: [1756.849,1804.568,1843.941,1832.560,1811.390,1798.756,1782.132]
paired candidate-baseline: [-29.698,-30.225,-66.729,-20.933,-8.796,29.164,3.930]
```

RouteBuildRecord now owns each rendered route's RouteIR, capabilities, entry paths, styles, and exact handler/effect edges. Handler, Worker, package-client, and chunk closure starts from those structural edges instead of serialized HTML/plan searches or formatted effect keys. This changes build-scratch orchestration only; browser runtime source, RouteIR v1, CapabilityIR v1, emitted files, and deploy bytes remain unchanged.

## P0.10 Structural ModuleIR References

Measured UTC 2026-08-11 on an Apple M4 macOS arm64 host with 10 logical CPUs, 16 GiB RAM, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.36` at `268cd9023c9f47a912601f298963a9ffe9c00da2`. The compiler and focused-check patch had SHA-256 `f684c79027b290bc8c7d549667ef0d7f21a9d0057b5d6291fcce18b91947eff2`, produced by:

```bash
git diff --binary v0.8.36 -- framework/compiler/analysis/binding-index.mjs framework/compiler/analysis/component-analysis.mjs framework/compiler/descriptor-session.mjs framework/compiler/ir/module-ir.mjs framework/compiler/source-compiler.mjs test/compiler-passes.test.mjs test/framework.test.mjs | shasum -a 256
```

The maintained 100-importer fixture used one warm-up and seven alternating fresh-process samples. Both targets retain 103 parse misses, 103 export-summary misses, and 100 importer-local clones. ModuleIR and ComponentAnalysis v2 intentionally change the serialized compiler graph, so the previous equal-digest gate correctly rejects direct v1/v2 comparison: normalized result size changes from 382,603 B to 447,977 B and source-result size changes from 395,346 B to 460,720 B. The additional 65,374 B is deterministic structural slot, signal, symbol, and ownership metadata in compiler scratch; it is not deployed browser JavaScript.

| Target | Compiler median | Range | Peak RSS median | Source-result bytes |
|---|---:|---:|---:|---:|
| `v0.8.36` | 224.506 ms | 220.888-313.782 ms | 281.6 MiB | 395,346 B |
| `0.8.37` | 227.158 ms | 224.744-272.594 ms | 282.9 MiB | 460,720 B |

The candidate's unpaired median is 1.18% higher. Round-paired candidate-minus-baseline differences had a +6.270 ms median, with the candidate faster in two of seven pairs and the baseline faster in five. Timing ranges overlap, peak RSS differs by 1.3 MiB, and neither result crosses the 5% material-regression threshold.

```text
v0.8.36: [220.888,222.461,313.782,224.506,249.086,222.746,242.721]
candidate: [227.158,224.744,225.098,236.027,225.158,239.672,272.594]
paired candidate-baseline: [6.270,2.283,-88.684,11.521,-23.928,16.926,29.873]
```

ModuleIR and ComponentAnalysis are build-scratch contracts. Runtime-facing state names and export spellings remain only where generated module and browser ABIs require them. The standard suite verifies static zero-JavaScript output, capability exclusion, keyed identity, effect cleanup, Workers, navigation, and migration behavior; no browser runtime source was added for P0.10.

## P0.9 Semantic State Operations

Measured UTC 2026-08-11 on the Intel Core i5-9500 Linux x64 host with Node 24.14.0. The baseline was clean tag `v0.8.35` at `f25700d9d2b247c01db19f0e8c95f16cb1fa81a5`. The compiler and focused-check patch had SHA-256 `4c3c8a3de18b1e792ea84cf7608a89971850195036a58f37dd76e359bfc8a58d`, produced by:

```bash
git diff --binary v0.8.35 -- framework/compiler/optimize/command-specialization.mjs framework/compiler/descriptor-session.mjs test/compiler-passes.test.mjs test/fixtures/effect-isolation/src/pages/command.tsx test/framework.test.mjs | sha256sum
```

The maintained 100-importer fixture used three warm-ups and 21 alternating fresh-process samples. P0.9 keeps the existing direct command fast path first and invokes whole-handler semantic analysis only after direct specialization fails. Baseline and candidate produced the same normalized 382,603-byte graph, SHA-256 `8c35b3f6d2c571306bd97c4d51d4af76ca244badd36c57363bf579ef961f41aa`, 395,346-byte source result, and 103 / 103 / 100 parse, summary, and clone counts.

| Target | Compiler median | Range | Peak RSS median | Source-result bytes |
|---|---:|---:|---:|---:|
| `v0.8.35` | 947.100 ms | 839.270-1,064.444 ms | 258.0 MiB | 395,346 B |
| P0.9 candidate | 942.596 ms | 849.656-1,215.997 ms | 258.1 MiB | 395,346 B |

The candidate's unpaired median is 0.48% lower. Round-paired candidate-minus-baseline differences had a +1.754 ms median with the candidate faster in 10/21 pairs and the baseline faster in 11/21. Timing and peak-RSS ranges overlap, so no material improvement or regression is claimed. An initial implementation that routed every direct handler through whole-handler analysis measured a +12.584 ms paired median and 10.6 MiB higher RSS median; restoring the direct fast path and narrowing the analyzer removed that regression before this final record.

```text
v0.8.35: [955.382,927.389,935.312,852.622,839.270,918.424,943.013,1026.033,936.514,1019.725,921.591,1064.444,949.671,975.729,933.380,896.773,949.751,951.418,947.100,998.950,1041.266]
candidate: [942.596,1215.997,965.312,849.656,877.468,928.334,971.812,966.482,938.268,1016.268,932.327,939.217,928.284,1082.782,1086.319,976.534,881.665,915.266,962.642,905.596,1000.939]
paired candidate-baseline: [-12.786,288.608,30.000,-2.966,38.198,9.910,28.799,-59.551,1.754,-3.457,10.736,-125.227,-21.387,107.053,152.939,79.761,-68.086,-36.152,15.542,-93.354,-40.327]
```

The four required source forms lower to the same existing command HandlerIR and command-only browser path. Alias/helper forms therefore avoid the native handler module and native runtime they previously required; no command ABI, state batching, ownership, runtime source, or unaffected route artifact changes.

## P0.8 Stable ModuleSymbol And SiteId

Measured UTC 2026-08-11 on the same Intel Core i5-9500 Linux x64 host with Node 24.14.0. The baseline was clean tag `v0.8.34` at `007fcb6e23c7d5bc742fa37c28388d070da9f598`. The compiler and maintained-check patch had SHA-256 `10ed6beb448b9e86961afab0b798f010932b8a29f98475d41f7bd8cfad04a872`, produced by:

```bash
git diff --binary v0.8.34 -- framework/compiler/project-session.mjs framework/compiler/source-compiler.mjs framework/compiler/analysis/component-analysis.mjs test/compiler-passes.test.mjs test/module-cache-performance.mjs | sha256sum
```

The maintained 100-importer fixture used three warm-ups and 21 alternating fresh-process samples. Because P0.8 intentionally adds source-local `site` metadata, the runner removes only `site` keys for output-equivalence hashing and reports the unmodified source-result size separately. The normalized 382,603-byte graph retained SHA-256 `8c35b3f6d2c571306bd97c4d51d4af76ca244badd36c57363bf579ef961f41aa`; parse and summary misses remained 103 each. Stable symbol traversal removed unnecessary normalization of intermediate barrel modules, reducing importer-local clones from 200 to 100.

| Target | Compiler median | Range | Peak RSS median | Source-result bytes | Parse / summary / clone misses |
|---|---:|---:|---:|---:|---:|
| `v0.8.34` | 760.967 ms | 696.626-796.908 ms | 256.9 MiB | 382,603 B | not instrumented |
| `0.8.35` | 755.595 ms | 692.365-804.376 ms | 257.8 MiB | 395,346 B | 103 / 103 / 100 |

The candidate's unpaired median is 0.71% lower. Round-paired candidate-minus-baseline differences had a -2.971 ms median with the candidate faster in 13/21 pairs and the baseline faster in 8/21. This is a small directional improvement, not a material speedup claim. Peak RSS differs by 0.9 MiB and ranges overlap. The 12,743-byte source-result increase is deterministic SiteId metadata in build scratch, not deployed browser JavaScript.

Two measurements before removing intermediate barrel clones showed paired medians of +12.142 ms and +21.954 ms and RSS medians 11.7-12.3 MiB above baseline. Removing those clones reduced the paired median to +4.951 ms; caching repeated ModuleSymbol resolutions produced the final -2.971 ms result. The earlier measurements are not the final candidate record.

```text
v0.8.34: [791.247,780.543,796.908,783.896,786.968,790.739,784.589,753.377,697.477,696.626,701.336,718.764,709.913,743.865,749.294,791.943,743.784,758.566,783.665,763.691,760.967]
candidate: [783.482,799.855,760.681,768.299,804.376,802.390,783.124,799.484,692.365,720.229,708.652,707.073,712.554,708.853,750.750,756.400,742.668,755.595,776.556,747.370,751.392]
paired candidate-baseline: [-7.765,19.312,-36.227,-15.597,17.408,11.651,-1.465,46.107,-5.112,23.603,7.316,-11.691,2.641,-35.012,1.456,-35.543,-1.116,-2.971,-7.109,-16.321,-9.575]
```

```bash
git worktree add --detach /tmp/opencode/kudzu-v0.8.34 v0.8.34
ln -s "$PWD/node_modules" /tmp/opencode/kudzu-v0.8.34/node_modules
BASELINE_ROOT=/tmp/opencode/kudzu-v0.8.34 CANDIDATE_ROOT="$PWD" WARMUPS=3 RUNS=21 npm run benchmark:module-cache
```

## P0.7 Parsed Module And Export Summary Cache

Measured UTC 2026-08-11 on an Intel Core i5-9500 with 6 physical/logical cores, 31.2 GiB RAM, Linux 6.17.0-19-generic x64, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.33` at `65c96b13802c73e9c9a109cebbaac88bae7704a7`; both targets used the same installed dependencies. The implementation and maintained benchmark patch had SHA-256 `bca61b37f14c77488c4a35b62856faa6b471dd01081abcb69c47027b3b4615d9`, produced by:

```bash
git diff --binary v0.8.33..v0.8.34 -- framework/compiler/project-session.mjs framework/compiler/source-compiler.mjs framework/compiler/worker-compiler.mjs test/compiler-passes.test.mjs test/module-cache-performance.mjs package.json | sha256sum
```

The maintained in-memory fixture has 100 page importers sharing one barrel component and helper, for 103 unique modules. Each sample starts a fresh Node process; fixture generation and result hashing occur outside timing. Three warm-ups followed by 21 alternating samples compiled every reachable module. The candidate parsed and summarized each unique module once and created 200 importer-local normalization clones. Baseline and candidate produced the same 382,603-byte serialized source-result graph with SHA-256 `8c35b3f6d2c571306bd97c4d51d4af76ca244badd36c57363bf579ef961f41aa`.

| Target | Compiler median | Range | Peak RSS median | Parse / summary / clone misses |
|---|---:|---:|---:|---:|
| `v0.8.33` | 2,386.735 ms | 1,183.385–3,249.719 ms | 261.3 MiB | not instrumented |
| P0.7 candidate | 2,188.745 ms | 1,321.352–2,957.883 ms | 257.1 MiB | 103 / 103 / 200 |

Both timing arrays drifted upward during the run, making their raw 8.29% median difference unsuitable as an improvement claim. Round-paired candidate-minus-baseline differences had a +33.324 ms median, with the candidate faster in 9/21 pairs and the baseline faster in 12/21. Peak RSS ranges also overlap. This establishes bounded parse/summary work and identical compiler output with no material performance conclusion on this machine; it does not establish a speedup.

```text
v0.8.33: [1512.096,1244.231,1183.385,1655.352,1669.380,2033.448,1820.868,1774.702,1847.652,1889.290,2386.735,2926.474,2853.159,3249.719,2716.963,2569.254,2531.427,2727.951,2483.411,2492.172,2597.774]
candidate: [1943.630,1416.969,1321.352,1603.967,1340.557,1440.993,1913.509,2060.240,1796.133,2011.796,2188.745,2888.145,2957.883,2947.417,2750.287,2745.883,2799.166,2620.866,2499.916,2541.054,2530.391]
paired candidate-baseline: [431.534,172.738,137.967,-51.385,-328.823,-592.455,92.641,285.538,-51.519,122.506,-197.990,-38.329,104.724,-302.302,33.324,176.629,267.739,-107.085,16.505,48.882,-67.383]
```

```bash
git worktree add --detach /tmp/opencode/kudzu-v0.8.33 v0.8.33
ln -s "$PWD/node_modules" /tmp/opencode/kudzu-v0.8.33/node_modules
BASELINE_ROOT=/tmp/opencode/kudzu-v0.8.33 CANDIDATE_ROOT="$PWD" WARMUPS=3 RUNS=21 npm run benchmark:module-cache
```

### Current Cross-Framework Whole-Build Context

Measured again after the P0.8 optimization on 2026-08-11. This separate local check is not a parsed-module-cache comparison or maintained ranking. The external `/tmp/opencode/kudzu-dependency-benchmark` workspace is not Git-provenanced. It used Kudzu 0.8.35, React 19.2.7, Vue 3.5.40, Svelte 5.56.6, Astro 7.1.1, and Vite 7.3.6. Every target emitted matched initial device content, and fresh headless Chrome runs passed detail fetch, list filters, empty state, superseded async command, stale-result rejection, and HTTP error behavior. One warm-up preceded seven rotated clean builds. React, Vue, and Svelte perform separate client, SSR, and prerender builds; Astro uses its native build and an application-specific imperative script; Kudzu runs one static compiler build, so build stages and artifact architectures differ.

| Target | Build median | HTML raw / gzip | JavaScript raw / gzip | Total output |
|---|---:|---:|---:|---:|
| Kudzu | 495.4 ms | 5,647 B / 1,324 B | 30,712 B / 12,233 B | 36,359 B |
| React SSR | 1,639.5 ms | 1,338 B / 562 B | 195,864 B / 61,488 B | 197,202 B |
| Vue SSR | 1,477.3 ms | 1,348 B / 567 B | 69,643 B / 27,756 B | 70,991 B |
| Svelte SSR | 2,033.1 ms | 1,399 B / 582 B | 40,781 B / 15,898 B | 42,180 B |
| Astro native | 974.5 ms | 3,307 B / 1,229 B | 2,201 B / 883 B | 3,307 B |

```text
Kudzu: [474.3,482.6,493.4,495.4,498.0,503.5,504.9]
React SSR: [1589.6,1617.1,1638.4,1639.5,1640.7,1662.7,1667.5]
Vue SSR: [1433.8,1448.2,1450.0,1477.3,1486.0,1498.2,1500.5]
Svelte SSR: [1956.3,1993.7,2025.4,2033.1,2036.9,2060.2,2072.8]
Astro native: [943.3,945.9,964.7,974.5,988.8,996.4,999.5]
```

```bash
node /tmp/opencode/kudzu-dependency-benchmark/device-run.mjs
node /tmp/opencode/kudzu-dependency-benchmark/device-verify.mjs
```

Kudzu's build median was 69.8% lower than React SSR, 66.5% lower than Vue SSR, 75.6% lower than Svelte SSR, and 49.2% lower than Astro native in this protocol. Kudzu shipped 80.1%, 55.9%, and 23.1% less JavaScript gzip than React, Vue, and Svelte respectively. Astro shipped only 883 B JavaScript gzip and a 3,307 B single-file output, so Kudzu's JavaScript gzip was 13.9 times and total output 11.0 times larger than Astro's direct imperative implementation. Kudzu's larger HTML carries static content and capability descriptors; its 1,324 B gzip was close to Astro's 1,229 B but larger than the hydrated SSR controls' 562-582 B HTML.

The cross-framework result provides current whole-build and deploy-artifact context only. It does not show that Kudzu's ModuleSymbol cache is faster than another framework's module cache: this fixture has one application module per target and exposes no equivalent parser/cache counters. A cache-specific cross-framework claim would require matched 100-importer module graphs, equivalent output, equal cold/warm policy, and framework-specific cache instrumentation. The browser run verifies behavior rather than interaction latency; the maintained larger keyed benchmarks below remain the runtime-performance evidence.

## 2026-08-11 React, Vue, And Svelte Check

This is a current local check, not a maintained framework ranking. The external `/home/kft/Documents/etc/demo/benchmarks` workspace is not Git-provenanced, but its matched fixtures, validators, dependencies, and raw result files were present and reused without source changes. The Kudzu target used this P0.5 candidate with `0.8.31` package metadata; controls were React 19.2.7, Vue 3.5.40, Svelte 5.56.6, and Vite 7.3.6 on Node 24.14.0, Linux x64, and Chrome 142.0.7444.175.

Each fixture received one warm-up and seven rotating clean production builds. Seven fresh headless Chrome profiles per target validated exact row count/order/text, retained and released DOM identity, fresh state on re-entry, and effect lifecycle counts before recording MutationObserver completion. React, Vue, and Svelte are CSR controls with no initial rows in HTML; Kudzu emits all initial rows, so total deploy size is reported but is not architecture-equivalent.

| Fixture | Framework | Build median | Initial JS gzip | Total deploy raw |
|---|---|---:|---:|---:|
| 1,000 keyed rows with local state | Kudzu | 1,212 ms | 10.2 KB | 576.0 KB |
| | Svelte | 1,745 ms | 13.1 KB | 33.8 KB |
| | Vue | 1,584 ms | 24.4 KB | 61.6 KB |
| | React | 1,939 ms | 59.4 KB | 189.5 KB |
| 1,000 keyed effects | Kudzu | 735 ms | 9.8 KB | 226.0 KB |
| | Svelte | 1,554 ms | 12.5 KB | 32.4 KB |
| | Vue | 1,444 ms | 24.5 KB | 61.9 KB |
| | React | 1,741 ms | 59.5 KB | 189.7 KB |
| 100 parents x 10 keyed children | Kudzu | 732 ms | 8.2 KB | 354.6 KB |
| | Svelte | 1,613 ms | 13.1 KB | 33.8 KB |
| | Vue | 1,437 ms | 24.6 KB | 62.1 KB |
| | React | 1,718 ms | 59.5 KB | 190.0 KB |

Kudzu's build medians were 23% to 58% lower and its initial JavaScript gzip was 21% to 86% lower than the three CSR controls. A separate seven-run GNU `time` check on the keyed-row fixture measured median build peak RSS of 157.4 MiB for Kudzu, 209.2 MiB for Svelte, 208.0 MiB for Vue, and 281.3 MiB for React.

| Fixture operation | Kudzu | Svelte | Vue | React |
|---|---:|---:|---:|---:|
| Row edit | 5.6 ms | 4.9 ms | 5.7 ms | 11.9 ms |
| Reverse 1,000 rows | 28.2 ms | 94.3 ms | 23.2 ms | 51.8 ms |
| Remove row | 5.0 ms | 8.7 ms | 7.6 ms | 15.6 ms |
| Re-add row | 7.7 ms | 16.8 ms | 8.1 ms | 18.5 ms |
| Effect dependency update | 4.8 ms | 9.8 ms | 10.0 ms | 14.9 ms |
| Effect-unrelated update | 2.8 ms | 7.3 ms | 2.7 ms | 10.1 ms |
| Reverse effect rows | 11.7 ms | 71.5 ms | 13.4 ms | 29.5 ms |
| Nested child update | 2.7 ms | 3.4 ms | 6.5 ms | 12.0 ms |
| Reverse 10 children | 0.7 ms | 1.1 ms | 3.1 ms | 9.0 ms |
| Reverse 100 parents | 6.8 ms | 7.7 ms | 7.3 ms | 11.1 ms |
| Remove parent | 1.1 ms | 1.5 ms | 3.4 ms | 6.7 ms |

These initial browser runs were grouped by target and some seven-sample ranges were wide, so they were treated as directional rather than a framework ranking. The candidate then removed repeated keyed-root lookups and redundant removal-map reconstruction across the generic, nested, and reducer list paths, and merged binding/condition state dispatch into one committer. The keyed-row JavaScript graph decreased from 26,962 B raw / 10,508 B gzip to 26,768 B raw / 10,485 B gzip.

A 31-round rotating follow-up ran fresh Chrome profiles in alternating and periodically reversed framework order. Its full-list completion predicate retained the exact 1,000-row content and identity checks inside timing:

| Framework | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|
| Kudzu | 5.9 ms | 23.4 ms | 5.6 ms | 8.0 ms |
| Svelte | 5.5 ms | 97.0 ms | 9.2 ms | 14.7 ms |
| Vue | 6.8 ms | 26.6 ms | 9.6 ms | 10.0 ms |
| React | 14.7 ms | 51.0 ms | 20.2 ms | 14.3 ms |

Paired sign tests established Kudzu's reverse, remove, and re-add advantage over Vue at 6.0 ms (`p=0.00143`), 4.1 ms (`p=0.000192`), and 2.1 ms (`p=0.0107`) median differences. Kudzu also beat Svelte for those operations in 31/31, 28/31, and 27/31 rounds. The full-list edit result remained dominated by the validator: Kudzu versus Svelte had a 0.8 ms directional loss with `p=0.281`, while Kudzu versus Vue had a 0.4 ms directional gain with `p=0.720`.

A final edit-only protocol kept complete 1,000-row correctness validation after each measurement but used only the edited row's class/input identity as the completion signal. Over 31 rotating rounds, Kudzu measured 0.7 ms versus Svelte 1.4 ms and Vue 1.8 ms. Paired differences favored Kudzu by 0.7 ms in 30/31 rounds (`p=2.98e-8`) versus Svelte and by 0.9 ms in 31/31 rounds (`p=9.31e-10`) versus Vue. Complete seven-run suite samples remain in the external workspace's `benchmarks/results/*-current.{json,md}` files; rotating raw samples are temporary measurement artifacts and this section remains a current local check rather than a maintained general ranking.

## 0.8.32 Staged Output Emission

Measured UTC 2026-08-11 on an Intel Core i5-9500 with 6 cores, Linux 6.17.0-19-generic, Node 24.14.0, and npm 11.9.0. The baseline was clean tag `v0.8.31` at `06b436e`; baseline and the pre-release P0.5 candidate used the same installed dependencies and the public 1,000-product storefront fixture at `f2d5be1a516c539e30f7125f6870d42b1dd02ecd`. The later same-root lock and interrupted-backup recovery hardening was correctness-tested but not included in this timing array.

One warm-up followed by 21 alternating replacement builds preserved the preceding output so the candidate exercised staging, promotion, and prior-tree removal on every run. Generated `.kudzu` scratch was cleaned outside timing. The candidate folds collision validation into one public copy traversal and writes the already-rendered route HTML in bounded batches of 64.

| Target | Build median | Output |
|---|---:|---:|
| `v0.8.31` | 20,392.7 ms | 3,056 files / 11,137,074 B |
| P0.5 candidate | 19,229.1 ms | 3,056 files / 11,137,074 B |

The candidate median is 5.71% lower. Every relative artifact path and SHA-256 hash matched, so deploy raw and gzip sizes are unchanged and no browser bytes are added.

```text
v0.8.31: [20868.5,19436.9,22023.6,21433.5,20634.0,20410.1,20392.7,21408.8,20252.0,19858.3,20489.9,20835.2,20450.2,18727.3,17239.1,17578.2,17672.1,17465.1,21087.0,18892.8,18727.9]
candidate: [20481.6,18692.6,21060.7,19881.9,19510.8,20844.1,20348.6,19229.1,20304.8,19852.9,18929.3,20472.5,17384.9,18628.6,17890.2,18841.0,19755.6,17805.9,18282.5,17770.5,17370.3]
```

```bash
APP_ROOT=/tmp/opencode/kudzu-based-bench/apps/shop-kudzu \
BASELINE_ROOT=/tmp/opencode/kudzu-p05-profile \
PRESERVE_OUTPUT=1 RUNS=21 npm run benchmark:commerce
```

## 0.8.31 Async Native Handler Ownership

Measured UTC 2026-08-10 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, npm 11.18.0, and Chrome 151.0.7922.76. The baseline was clean tag `v0.8.30` at `9bb5ce8`; baseline and candidate used the same installed dependencies.

The implementation and maintained-check patch over `v0.8.30` had SHA-256 `c67956b67b558052885dd48a9dbe35f238b8ce042876537952355aa05b8cdc10`, produced by:

```bash
git diff --binary v0.8.30 -- framework/native-runtime.js framework/serialization.js test/fixtures/navigation/src/Shell.tsx test/fixtures/navigation/src/pages/product.tsx test/fixtures/navigation/public/browser-test.js test/framework.test.mjs test/native-performance.mjs package.json | shasum -a 256
```

The maintained browser runner built the same `test/fixtures/native-bubbling` source with each framework root. After one warm-up, 21 alternating headless Chrome processes dispatched 5,000 synchronous clicks through the real DOM listener, handler-module lookup, generated handler, state context, and queued-flush scheduling path. Both medians were 6.4 ms; the 6.1-6.8 ms baseline and 6.2-6.7 ms candidate ranges overlap, so no dispatch regression is established.

```bash
git worktree add --detach /tmp/kudzu-v0.8.30 v0.8.30
ln -s "$PWD/node_modules" /tmp/kudzu-v0.8.30/node_modules
BASELINE_ROOT=/tmp/kudzu-v0.8.30 RUNS=21 ITERATIONS=5000 \
CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npm run benchmark:native
```

```text
0.8.30: [6.6,6.3,6.4,6.3,6.3,6.8,6.3,6.6,6.3,6.4,6.5,6.4,6.5,6.5,6.4,6.1,6.3,6.2,6.5,6.4,6.4]
0.8.31: [6.4,6.7,6.2,6.4,6.6,6.6,6.5,6.4,6.5,6.4,6.4,6.4,6.6,6.5,6.4,6.3,6.4,6.4,6.6,6.2,6.4]
```

The maintained `native-bubbling` fixture retained the same eight JavaScript paths. The browser runner hashes every file and permits only the ownership-bearing native and capture-deserialization runtimes to change:

| Artifact | 0.8.30 raw / gzip | 0.8.31 raw / gzip | Delta raw / gzip |
|---|---:|---:|---:|
| `assets/kudzu-native.js` | 1,528 B / 842 B | 1,715 B / 925 B | +187 B / +83 B |
| `assets/kudzu-serialization.js` | 675 B / 381 B | 697 B / 392 B | +22 B / +11 B |
| Complete native fixture JavaScript | 13,629 B / 6,177 B | 13,838 B / 6,271 B | +209 B / +94 B |

The timing is a focused synchronous event-dispatch measurement, not a general interaction or asynchronous task benchmark. The runtime does not cancel application promises or arbitrary browser API work; it invalidates Kudzu state writes, queued commits, and captured ref resolution after the listener's DOM ownership is released.

## 0.8.26 Goal B Benchmark Hardening

The checked-in `benchmark:commerce` runner now requires byte-identical candidate output by default. `EXPECTED_CHANGES` is reserved for explicitly recorded historical comparisons; the route-entry reuse path also has a focused transform-count regression test in the ordinary suite.

After that runner update, seven alternating `v0.8.24` versus current-tree builds on the same Linux machine verified 1,011 pages, 3,056 files, and no changed deploy hash. The 14,766.5 ms and 12,202.4 ms medians validate the maintained runner and released-tree direction, but are not attributed to route-entry reuse alone because the compared revisions include all `0.8.25` compiler-boundary changes.

```text
v0.8.24: [14311.1,14766.5,15294.2,14718.0,13440.6,15245.2,15007.0]
current:  [12202.4,12243.2,11701.2,12320.8,11994.6,12461.4,12073.3]
```

## 0.8.25 Route Entry Transform Reuse

Measured UTC 2026-08-10 on an Intel Core i5-9500 with 6 cores, Linux 6.17.0-19-generic, Node 24.14.0, and npm 11.9.0. The public 1,000-product storefront fixture at `f2d5be1` generated 1,011 pages against the `0.8.24` tree plus the same compiler-boundary safety changes in both targets.

One warm-up followed by seven alternating clean builds compared repeated esbuild transformation with a build-local exact-source result map used only by generated native, parameter, and effect route entries. The median decreased from 13,851.0 ms to 12,581.4 ms, a 9.17% improvement. Every emitted path and SHA-256 hash matched. The catalog was generated once before timing; `dist` and `.kudzu` cleanup and manifest hashing remained outside timing.

```text
repeated transform: [13437.4,13851.0,13844.9,13440.8,13906.1,14310.0,14901.0]
exact-source reuse: [12480.2,12826.9,12777.9,12615.9,11869.7,12121.3,12581.4]
```

The map lasts for one build and keys the complete generated source after route-relative URLs are resolved. It is not a persistent or generalized JavaScript transform cache. The result measures the large repeated-route fixture on this Linux machine and is not directly comparable to the Apple M3 `0.8.24` build medians below.

## 0.8.24 Measured Goal B Optimizations

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, npm 11.18.0, and Chrome 151.0.7922.76. Baseline tag `v0.8.23` at `39a065b` and the `0.8.24` candidate used the same local volume and dependencies.

The implementation and maintained benchmark patch over `v0.8.23` had SHA-256 `c6c39b0c64f7a5d3271cb9f0286a4c6787aaf7e293744457629e6ea249e9ef76`, produced by:

```bash
git diff --binary v0.8.23 -- framework/compiler/normalization-pipeline.mjs framework/list-runtime.js test/compiler-passes.test.mjs test/keyed-performance.mjs test/fixtures/keyed-performance/src/pages/index.tsx test/commerce-build-performance.mjs package.json | shasum -a 256
```

Twenty-one fresh profiles measured 2,000-row restoration at 21.1 ms versus 26.3 ms, a 19.77% improvement. Twenty-one alternating clean builds of the external 1,000-product fixture measured 6,266.5 ms versus 6,684.7 ms, a 6.26% improvement. The keyed route adds 127 B raw / 35 B aggregate gzip JavaScript; the normalization optimization adds no output bytes. Complete methodology, arrays, artifacts, correctness checks, and limitations are in [Goal B Measurement Details](#goal-b-measurement-details).

Before release-content updates, the complete site plus `lists`, `keyed-row-hooks`, and `navigation` retained identical deploy file lists. Only `assets/kudzu-list.js` changed; every other deploy file was byte-identical. Their normalized `.kudzu` trees were identical to `v0.8.23`.

## 0.8.23 Source Compiler Boundary

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 22.23.2, and npm 11.18.0. Baseline tag `v0.8.22` at `60b9bff` and the current `0.8.23` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `v0.8.22` had SHA-256 `cfa25426f630f3d5d75a788f9ef8c63c48531c74ffc58727437890c47c511945`, produced by:

```bash
git diff --binary v0.8.22 -- framework/build.mjs framework/compiler/source-compiler.mjs framework/compiler/source-graph.mjs framework/compiler/path-helpers.mjs framework/compiler/worker-compiler.mjs framework/dev-server.mjs test/compiler-passes.test.mjs test/framework.test.mjs | shasum -a 256
```

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. The ranges overlap; the 0.24% lower candidate median does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.22 baseline | 287.7 ms | 907 B / 477 B | 12,148 B / 5,411 B |
| 0.8.23 candidate | 287.0 ms | 907 B / 477 B | 12,148 B / 5,411 B |

```text
0.8.22: [287.3,288.1,287.7,289.3,285.7,286.8,289.1]
0.8.23: [289.2,283.7,287.4,287.0,293.8,287.0,285.4]
```

Before release-content updates, the complete 135-page site and the `bindings`, `keyed-row-hooks`, `effect-dependencies`, `worker-effects`, `runtime-params`, `navigation`, `config-authoring`, and `event-package` deploy trees had identical file lists and bytes. Their `.kudzu` trees also matched after replacing only each checkout root in existing source-location strings. The invalid-reducer fixture retained the same source file, line, column, and diagnostic text. `build.mjs` decreased from 3,732 to 744 lines; this source-organization metric is not a runtime performance claim.

## Goal B Measurement Details

Goal B started from clean commit `39a065b4284c74e7bf8ee5e39647ef771f2ba6f6`. On the same Apple M3 environment with Node 22.23.2, the maintained `worker-effects` benchmark measured a 289.9 ms clean-build median, 907 B raw / 477 B gzip Worker graph, and 12,148 B raw / 5,411 B gzip window graph:

```text
build: [284.3,287.1,293.6,289.9,291.3,286.4,290.7]
```

After the two candidate optimizations, the same maintained benchmark measured a 286.2 ms median and identical graph sizes. This is a regression check rather than evidence for either optimization:

```text
build: [286.2,282.1,287.1,286.4,285.4,284.4,287.2]
```

Chrome 151.0.7922.76 passed the tracked throughput, cadence, bounded-history, stale-write, and 30-cycle ownership checks. The first Node 22 browser attempt returned no Worker data; immediate Node 25 and Node 22 retries passed, so this is recorded as a startup flake rather than a performance result.

The preserved external cross-framework workspace then rebuilt its 1,000-row Kudzu fixture against clean `0.8.23` to locate a possible keyed-list loss. This exploratory harness is not maintained in the repository and its historical framework results were not reused. Seven fresh unthrottled Chrome profiles all passed row visibility, retained identity, removal, and fresh re-add checks:

| Operation | Median | Raw runs |
|---|---:|---|
| Edit row 500 | 0.5 ms | 1.1, 0.6, 0.5, 0.5, 0.6, 0.5, 0.5 |
| Reverse 1,000 rows | 4.0 ms | 4.8, 3.8, 3.8, 4.2, 4.0, 4.1, 3.8 |
| Remove row 500 | 1.2 ms | 1.5, 1.1, 1.1, 1.3, 1.2, 1.2, 1.2 |
| Re-add row 500 | 1.3 ms | 2.3, 1.0, 1.3, 1.5, 1.1, 1.2, 1.4 |

That fixture's seven clean builds were `[390.891,389.698,393.034,390.798,389.477,390.258,388.714]` ms for a 390.258 ms median. It emitted 28,243 B raw / 9,245 B aggregate gzip initial JavaScript across eight files and 943,075 B total output across nine files. The absolute build result has no current matched control and does not establish a regression. No browser operation in this exploratory fixture established a material loss.

#### Maintained Keyed Restoration Benchmark

The repository-owned `npm run benchmark:keyed` fixture renders 2,000 keyed rows with row-local state, a reactive slice, and a reactive string filter. Each revision received one clean build warm-up, 21 measured clean builds, and 21 unthrottled fresh Chrome 151.0.7922.76 profiles. In-page `MutationObserver` completion includes the synchronous state commit and terminal DOM mutation. Every run retained row 1000 and its selected state, appended 33 rows beside 1,967 retained rows, filtered to one row, released row 1, restored row 1 with fresh identity/state and a working handler, and retained row 1000 through reversal.

The baseline uses the identical `0.8.24` benchmark harness and fixture copied into a clean `v0.8.23` worktree; only compiler/runtime source differs:

```bash
git worktree add --detach /tmp/kudzu-0.8.23 v0.8.23
mkdir -p /tmp/kudzu-0.8.23/test/fixtures/keyed-performance/src/pages
cp test/keyed-performance.mjs /tmp/kudzu-0.8.23/test/keyed-performance.mjs
cp test/fixtures/keyed-performance/src/pages/index.tsx /tmp/kudzu-0.8.23/test/fixtures/keyed-performance/src/pages/index.tsx
ln -s "$PWD/node_modules" /tmp/kudzu-0.8.23/node_modules
RUNS=21 CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node /tmp/kudzu-0.8.23/test/keyed-performance.mjs
RUNS=21 CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run benchmark:keyed
```

The measured loss was restoration from one retained row to 2,000 rows. The baseline called `mountDom()` separately for 1,999 connected additions. For top-level flat lists, the candidate calls it once on the connected list parent when more than 32 additions are a majority of both the next rows and their parent children. Nested/parent lists, shared containers dominated by unrelated siblings, and small or retained-heavy updates keep per-root mounting. This reduces repeated mount-hook selector traversal without adding a scheduler, cache, tree, or public API.

| Target | Build median | Append 33 | Filter median | Restore median | Reverse median | JavaScript raw / gzip |
|---|---:|---:|---:|---:|---:|---:|
| `0.8.23` baseline | 263.0 ms | 2.6 ms | 4.6 ms | 26.3 ms | 6.2 ms | 28,308 B / 10,937 B |
| Goal B candidate | 265.6 ms | 2.7 ms | 4.6 ms | 21.1 ms | 6.1 ms | 28,435 B / 10,972 B |

Restore improved 19.77%, and its 20.4-21.9 ms candidate range did not overlap the 25.7-27.3 ms baseline range. Append, filter, and reverse distributions overlap; no change is claimed. Build distributions overlap; no build improvement is claimed. The deterministic cost is 127 B raw / 35 B aggregate gzip in `kudzu-list.js`.

```text
baseline build: [261.7,265.9,263.0,263.9,259.4,265.5,261.5,263.4,260.4,261.8,264.7,263.4,260.7,262.7,263.6,264.4,261.5,264.0,261.7,263.5,262.3]
candidate build: [265.4,271.2,265.2,263.6,266.1,266.7,264.4,317.3,298.2,269.4,269.2,264.1,266.9,268.9,273.6,265.5,262.4,259.4,262.1,265.6,262.0]
baseline append: [2.8,2.5,2.5,3.0,2.5,2.6,2.8,2.7,2.7,2.8,2.8,2.5,2.6,2.9,2.7,2.6,2.5,2.4,2.7,2.4,2.4]
candidate append: [2.8,3.0,2.7,2.5,2.7,2.6,2.8,2.8,2.7,2.6,2.8,2.8,3.0,2.8,2.4,2.4,2.4,2.9,2.9,2.7,2.6]
baseline filter: [4.5,4.5,5.0,4.6,4.5,4.5,4.9,4.8,4.5,4.6,4.7,4.3,4.7,4.8,4.7,4.7,4.6,4.5,4.9,4.4,4.2]
candidate filter: [4.7,4.8,4.6,4.6,4.7,4.4,4.7,4.5,4.6,4.4,4.7,4.9,4.9,4.6,4.4,4.6,4.6,4.8,4.8,4.3,4.4]
baseline restore: [26.5,27.3,26.5,26.5,25.8,26.7,26.3,26.4,26.2,26.4,26.6,26.2,27.0,26.6,25.9,25.7,25.9,26.3,26.0,25.9,26.3]
candidate restore: [21.3,21.7,21.8,21.6,20.4,20.8,20.6,21.5,20.4,20.8,21.8,21.4,21.9,21.0,21.5,20.9,20.8,21.0,21.1,21.1,21.2]
baseline reverse: [6.2,6.3,6.0,6.4,6.6,7.1,6.4,6.0,6.8,6.3,5.8,5.8,6.4,5.8,6.2,7.1,5.7,6.1,5.8,6.0,5.5]
candidate reverse: [5.8,6.0,6.2,5.8,5.8,6.1,6.2,6.2,6.3,6.0,6.1,6.2,6.2,6.0,6.3,6.2,5.9,6.3,6.0,5.9,6.3]
```

#### External 1,000-Product Build

The public [`SimYunSup/kudzu-based-bench`](https://github.com/SimYunSup/kudzu-based-bench) commerce fixture at `f2d5be1` generated 1,000 deterministic products and 1,011 complete Kudzu pages. On the same Apple M3 / Node 25.6.1 machine, clean `0.8.23` and the Goal B candidate received one warm-up and 21 alternating clean builds. Output and `.kudzu` cleanup remained outside timing.

The paired runner generates the catalog once, alternates the two compiler roots, cleans `dist` and `.kudzu` outside timing, compares relative output manifests and hashes, permits only the explicitly configured historical `assets/kudzu-list.js` delta, and restores the external app's package symlink afterward:

```bash
git clone https://github.com/SimYunSup/kudzu-based-bench.git /tmp/kudzu-based-bench
git -C /tmp/kudzu-based-bench checkout --detach f2d5be1a516c539e30f7125f6870d42b1dd02ecd
pnpm --dir /tmp/kudzu-based-bench install --force
pnpm --dir /tmp/kudzu-based-bench run build:commerce
git worktree add --detach /tmp/kudzu-0.8.23 v0.8.23
ln -s "$PWD/node_modules" /tmp/kudzu-0.8.23/node_modules
APP_ROOT=/tmp/kudzu-based-bench/apps/shop-kudzu \
BASELINE_ROOT=/tmp/kudzu-0.8.23 \
CANDIDATE_ROOT="$PWD" RUNS=21 CATALOG_SIZE=1000 \
EXPECTED_CHANGES=assets/kudzu-list.js \
npm run benchmark:commerce
```

`applyNormalizationPasses()` previously called TypeScript's recursive parent-pointer repair after every pass, including validators and no-op passes returning the identical `SourceFile`. Every current pass was audited to use immutable factory updates for structural changes. Repairing only a changed root reduced the build median from 6,684.7 ms to 6,266.5 ms, a 6.26% improvement. Both builds emitted 3,056 files; only `assets/kudzu-list.js` differed because of the independently measured keyed restoration optimization. The normalization change itself adds no browser bytes.

```text
baseline: [6488.0,7095.6,6861.0,6647.7,6563.4,6613.3,6536.1,6529.2,6462.6,6655.9,6684.7,6623.2,6504.9,7618.5,8174.5,9309.1,7611.4,7942.3,8148.2,7191.0,7380.7]
candidate: [5898.6,5903.9,6108.5,6088.1,5966.4,5913.8,6266.5,6115.1,6014.6,6022.0,6223.1,6357.5,6429.5,6950.8,7887.1,8275.9,7208.9,7306.3,7861.9,6798.8,6859.3]
```

This external fixture is a candidate-finding and paired Kudzu regression benchmark, not a framework leaderboard result. It uses Kudzu-authored source; the catalog is generated once before timing and both revisions run the same complete Kudzu build. Its published cross-framework runs are sequential with only three build samples, and none of those framework numbers are used for this optimization claim. The paired command requires an existing symlink at `apps/shop-kudzu/node_modules/@kudzujs/core`. The external commit's pnpm 10.20 lock cannot install with `--frozen-lockfile`; `--force` accepts the unchanged lock and is a reproducibility limitation, although baseline and candidate use the same resulting dependency graph.

## 0.8.22 Versioned Compiler Foundation

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline tag `v0.8.21` at `ff38092` and the then-current `0.8.22` compiler candidate used the same local volume and identical installed dependencies.

The final `v0.8.21` to `v0.8.22` tagged implementation patch has reproducible SHA-256 `5fbdc3658b8c0d4d568c7ccdbf89c2c1c20c3a275ff9d0fd20e439b479d60530`, produced by:

```bash
git diff --binary v0.8.21 v0.8.22 -- framework/build.mjs framework/compiler/list-runtime-codegen.mjs framework/compiler/param-codegen.mjs framework/compiler/route-capability-planner.mjs framework/compiler/runtime-codegen.mjs framework/core.mjs framework/core.d.ts | shasum -a 256
```

The previously recorded candidate hash does not match this tagged patch, and no intermediate commit exists between the two release tags. The measured candidate is therefore not independently identifiable as the final `v0.8.22` tree from repository history.

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. Both medians were exactly 250.1 ms; the distributions overlap and establish no material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.21 baseline | 250.1 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.22 candidate | 250.1 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.21: [249.7,252.0,250.1,251.2,250.0,254.8,249.1]
0.8.22: [250.1,247.3,255.1,249.3,253.1,250.3,248.7]
```

Before release-content updates, the complete 135-page site and the `bindings`, `keyed-row-hooks`, `effect-dependencies`, `worker-effects`, `runtime-params`, and `navigation` deploy trees had identical file lists and bytes. Their build plans were equivalent after removing the intentional additive RouteIR `version` and state `slot` fields. Every measured Worker/window artifact name, raw byte count, and gzip byte count was identical. `build.mjs` decreased from 3,999 to 3,732 lines; this source-organization metric is not a runtime performance claim.

## 0.8.21 Explicit Effect Ownership

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline tag `v0.8.20` at `7fb6e37` and the then-current `0.8.21` compiler candidate used the same local volume and identical installed dependencies.

The final `v0.8.20` to `v0.8.21` tagged implementation patch has reproducible SHA-256 `c78159ccce1f88a5ed06445d5e0b113953576529a5845e7772ab386b8adf166a`, produced by:

```bash
git diff --binary v0.8.20 v0.8.21 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/effect-analysis.mjs framework/compiler/ir/module-ir.mjs framework/compiler/worker-compiler.mjs framework/core.d.ts | shasum -a 256
```

The previously recorded candidate hash does not match this tagged patch, and no intermediate commit exists between the two release tags. The measured candidate is therefore not independently identifiable as the final `v0.8.21` tree from repository history.

Both targets received one warm-up followed by seven clean `worker-effects` production builds in alternating round-robin order. Cleanup remained outside timing. The distributions overlap; the 1.02% lower candidate median does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.20 baseline | 255.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.21 candidate | 253.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.20: [253.2,263.4,276.5,255.6,251.3,252.1,266.1]
0.8.21: [253.7,249.7,260.4,253.0,251.1,250.1,265.7]
```

The complete site `dist` and the `effect-dependencies`, `keyed-effects`, and `worker-effects` fixture output trees had identical file lists and bytes before release-content updates. The Worker graph and every window graph file were byte-identical, including the content-hashed Worker name. This measurement covers compiler clean-build startup and generated artifact size; lifecycle behavior remains covered by the complete effect, Worker, conditional, keyed, and navigation integration tests.

## 0.8.20 Explicit Keyed Ownership

Measured UTC 2026-08-09 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.19` commit `c516173` and the current `0.8.20` compiler candidate used the same local volume and identical installed dependencies.

The candidate implementation patch over `c516173` had SHA-256 `137f68090f6024374077f46cb61767f48dff27a193d33c9e92409b8dd7bb7d21`, produced by:

```bash
git diff --binary c516173 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/ir/module-ir.mjs framework/core.d.ts | shasum -a 256
```

Both targets received one warm-up followed by 21 clean `keyed-row-hooks` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the candidate median was 0.52% lower and does not establish a material change.

| Target | Build median | List runtime raw / gzip |
|---|---:|---:|
| 0.8.19 baseline | 266.8 ms | 21,831 B / 6,930 B |
| 0.8.20 candidate | 265.4 ms | 21,831 B / 6,930 B |

```text
0.8.19: [272.5,269.7,262.6,267.3,262.9,265.2,268.0,264.7,262.0,268.3,267.1,262.5,263.7,266.8,263.2,267.5,263.3,268.8,266.7,266.9,271.4]
0.8.20: [262.5,267.4,266.2,261.7,265.1,262.9,269.9,264.1,275.0,268.2,263.4,263.7,265.4,268.7,263.8,266.1,265.4,265.3,267.2,270.1,263.2]
```

The recorded cleanup, warm-up, timing, median, and runtime-size measurement is reproducible with:

```bash
BASELINE_ROOT="/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0820-baseline" CANDIDATE_ROOT="/Users/songchibong/Documents/GitHub/kudzu" node --input-type=module -e 'import { spawnSync } from "node:child_process"; import { rmSync,readFileSync } from "node:fs"; import { gzipSync } from "node:zlib"; import { performance } from "node:perf_hooks"; import { resolve } from "node:path"; const roots={baseline:process.env.BASELINE_ROOT,candidate:process.env.CANDIDATE_ROOT}; const runs={baseline:[],candidate:[]}; const fixture="keyed-row-hooks"; const build=name=>{const root=roots[name],cwd=resolve(root,"test/fixtures",fixture); rmSync(resolve(cwd,"dist"),{recursive:true,force:true}); rmSync(resolve(cwd,".kudzu"),{recursive:true,force:true}); const start=performance.now(); const result=spawnSync(process.execPath,[resolve(root,"bin/kudzu.mjs"),"build"],{cwd,encoding:"utf8"}); if(result.status) throw new Error(result.stderr||result.stdout); return Number((performance.now()-start).toFixed(1));}; build("baseline"); build("candidate"); for(let index=0;index<21;index++) for(const name of index%2?["candidate","baseline"]:["baseline","candidate"]) runs[name].push(build(name)); const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]; const sizes={}; for(const [name,root] of Object.entries(roots)){const file=readFileSync(resolve(root,"test/fixtures",fixture,"dist/assets/kudzu-list.js")); sizes[name]=[file.length,gzipSync(file).length];} console.log(JSON.stringify({runs,medians:{baseline:median(runs.baseline),candidate:median(runs.candidate)},sizes}));'
```

Before release-content updates, the complete site `dist` was byte-identical. Seven representative keyed fixtures retained identical file lists and SHA-256 content; `.kudzu` comparison replaced only each worktree's absolute root in existing source-location strings. The complete compared lists were:

```text
lists: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
nested-lists: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
keyed-row-hooks: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/HookRow.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
svg-structures: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
calculated-collections: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/ordinary.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/native/ordinary/index.js, dist/index.html, dist/ordinary/index.html, dist/static/index.html, .kudzu/calculate.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/ordinary.mjs, .kudzu/pages/static.mjs
rendered-collections: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/selectVisible.mjs
keyed-effects: dist/assets/effects/index.js, dist/assets/effects/item-only/index.js, dist/assets/effects/state-only/index.js, dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/item-only.js, dist/assets/handlers/pages/state-only.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/item-only/index.html, dist/state-only/index.html, .kudzu/EffectRow.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/item-only.mjs, .kudzu/pages/state-only.mjs
```

This measurement covers compiler clean-build startup and generated list-runtime size, not browser reconciliation latency. Browser behavior remains covered by the existing insert/update/reorder/remove/nested/SVG/state/effect/ref integration checks.

## 0.8.19 Handler, Binding, And Derived IR

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.18` tag `3598be0` and the `0.8.19` compiler-only candidate used detached worktrees on the same temporary volume with identical installed dependencies.

The candidate compiler patch over `3598be0` had SHA-256 `7b2afc4c9a0d1963c8d3ccacfb1e95152136d77cc7afc250d17b1986ca329fb3`, produced by:

```bash
git diff --binary 3598be0 -- framework/build.mjs framework/compiler/descriptor-session.mjs framework/compiler/handler-codegen.mjs framework/compiler/handler-lowering.mjs framework/compiler/ir/module-ir.mjs | shasum -a 256
```

Both targets received one warm-up followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the candidate median was 0.32% lower and does not establish a material change.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.18 baseline | 253.4 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.19 candidate | 252.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.18: [252.3,254.5,251.0,254.8,254.3,253.8,253.4,251.6,255.4,252.4,249.6,254.2,251.0,253.7,256.0,250.4,251.0,255.4,253.3,253.6,250.5]
0.8.19: [252.3,251.7,252.9,251.9,251.5,253.0,252.3,251.3,253.0,252.1,254.3,258.4,249.8,251.6,256.2,253.7,253.5,252.6,252.9,252.5,255.9]
```

Before release-content updates, the complete site `dist` was byte-identical. Representative fixture builds retained identical file lists and SHA-256 content; `.kudzu` comparisons replaced only each detached worktree's absolute root in existing source-location strings. The complete fixture lists were:

```text
bindings: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
native: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/other/index.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/native/other/index.js, dist/index.html, dist/other/index.html, .kudzu/helpers.mjs, .kudzu/kudzu-plan.json, .kudzu/math.mjs, .kudzu/pages/index.mjs, .kudzu/pages/other/index.mjs
reducer: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/lazy.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/lazy/index.html, .kudzu/ImportedControls.mjs, .kudzu/ImportedInput.mjs, .kudzu/ImportedItem.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/lazy.mjs, .kudzu/todoReducer.mjs, .kudzu/todoSupport.mjs
context-actions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/notes.mjs, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs, .kudzu/useNotes.mjs
zustand-migration: dist/assets/handlers/Shell.js, dist/assets/handlers/pages/cart.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/cart/index.js, dist/assets/native/index.js, dist/cart/index.html, dist/index.html, .kudzu/Shell.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/cart.mjs, .kudzu/pages/index.mjs, .kudzu/store.mjs
event-package: dist/assets/handlers/pages/index.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
list-expressions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
effect-dependencies: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-collection-selector.js, dist/assets/kudzu-deps.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/command/index.html, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/command.mjs, .kudzu/pages/index.mjs
landing-page-migration: dist/assets/assets/badge.png, dist/assets/assets/hero.svg, dist/assets/assets/landing.woff2, dist/assets/assets/module-mark.svg, dist/assets/assets/preview.webp, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/assets/styles/Hero.module.css, dist/assets/styles/landing.css, dist/index.html, dist/static/index.html, .kudzu/LandingSections.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs
```

This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

The recorded cleanup, warm-up, and alternating 21-run loop is reproducible with:

```bash
BASELINE_ROOT="/private/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0819-baseline" CANDIDATE_ROOT="/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/kudzu-0.8.19-candidate" node --input-type=module -e 'import { spawnSync } from "node:child_process"; import { rmSync } from "node:fs"; import { performance } from "node:perf_hooks"; import { resolve } from "node:path"; const roots={baseline:process.env.BASELINE_ROOT,candidate:process.env.CANDIDATE_ROOT}; const runs={baseline:[],candidate:[]}; const build=name=>{const root=roots[name],fixture=resolve(root,"test/fixtures/worker-effects"); rmSync(resolve(fixture,"dist"),{recursive:true,force:true}); rmSync(resolve(fixture,".kudzu"),{recursive:true,force:true}); const start=performance.now(); const result=spawnSync(process.execPath,[resolve(root,"bin/kudzu.mjs"),"build"],{cwd:fixture,encoding:"utf8"}); if(result.status!==0) throw new Error(result.stderr||result.stdout); return Number((performance.now()-start).toFixed(1));}; build("baseline"); build("candidate"); for(let index=0;index<21;index++) for(const name of index%2?["candidate","baseline"]:["baseline","candidate"]) runs[name].push(build(name)); console.log(JSON.stringify(runs));'
```

The complete `worker-effects` benchmark list was: `dist/assets/effects/dashboard/index.js`, `dist/assets/handlers/pages/dashboard.js`, `dist/assets/kudzu-effect.js`, `dist/assets/kudzu-navigation.js`, `dist/assets/kudzu.js`, `dist/assets/workers/telemetry.worker-BVG2SA55.js`, `dist/dashboard/index.html`, `dist/plain/index.html`, `dist/static/index.html`, `.kudzu/Shell.mjs`, `.kudzu/chart.mjs`, `.kudzu/kudzu-plan.json`, `.kudzu/pages/dashboard.mjs`, `.kudzu/pages/plain.mjs`, `.kudzu/pages/static.mjs`, `.kudzu/telemetry/downsample.mjs`, and `.kudzu/telemetry/ring.mjs`.

## 0.8.18 Explicit Component Ownership

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.17` tag `d48f0cf` and the `0.8.18` compiler-only candidate used detached worktrees on the same temporary volume with identical installed dependencies.

Both targets received one warm-up followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the 2.43% candidate median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.17 baseline | 770.9 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.18 candidate | 789.6 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.17: [770.9,705.6,817.1,768.5,760.2,839.8,758.3,756.1,960.7,834.6,707.9,706.5,582.9,463.5,625.5,1004.2,846.9,821.3,837.5,876.9,810.8]
0.8.18: [753.9,726.4,879.3,851.5,942.8,949.3,758.4,761.3,794.3,782.2,620.6,622.9,610.8,726.8,732.3,833.0,789.6,816.3,845.2,811.3,825.0]
```

Before release-content updates, the complete `dist` and `.kudzu` trees were byte-identical. The Worker and window graphs remain byte-identical. This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

Representative fixture builds also retained identical file lists and SHA-256 content against `v0.8.17`. Deploy `dist` bytes matched exactly; `.kudzu` hashes matched after replacing only each detached worktree's absolute root in existing source-location strings. The complete compared lists were:

```text
bindings: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
conditionals: dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
nested-component-lists: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/ImportedItem.mjs, .kudzu/ImportedShell.mjs, .kudzu/kudzu-plan.json, .kudzu/label.mjs, .kudzu/pages/index.mjs
effects: dist/api/items.json, dist/assets/effects/index.js, dist/assets/effects/oak/index.js, dist/assets/effects/only/index.js, dist/assets/handlers/pages/[slug].js, dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/only.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/index.html, dist/oak/index.html, dist/only/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/pages/[slug].mjs, .kudzu/pages/index.mjs, .kudzu/pages/only.mjs, .kudzu/pages/static.mjs
worker-effects: dist/assets/effects/dashboard/index.js, dist/assets/handlers/pages/dashboard.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu.js, dist/assets/workers/telemetry.worker-BVG2SA55.js, dist/dashboard/index.html, dist/plain/index.html, dist/static/index.html, .kudzu/Shell.mjs, .kudzu/chart.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/dashboard.mjs, .kudzu/pages/plain.mjs, .kudzu/pages/static.mjs, .kudzu/telemetry/downsample.mjs, .kudzu/telemetry/ring.mjs
runtime-params: dist/assets/effects/orgs/[org]/items/[id]/index.js, dist/assets/handlers/pages/orgs/[org]/items/[id].js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/orgs/[org]/items/[id]/index.js, dist/assets/params/orgs/[org]/items/[id]/index.js, dist/orgs/[org]/items/[id]/index.html, dist/orgs/acme/items/new/index.html, dist/rewrites.json, .kudzu/kudzu-plan.json, .kudzu/pages/orgs/[org]/items/[id].mjs, .kudzu/pages/orgs/acme/items/new.mjs
navigation: dist/[section]/[id]/index.html, dist/assets/effects/[section]/[id]/index.js, dist/assets/effects/broken/index.js, dist/assets/effects/cart/index.js, dist/assets/effects/chart/index.js, dist/assets/effects/items/[id]/index.js, dist/assets/effects/items/new/index.js, dist/assets/effects/product/index.js, dist/assets/handlers/Shell.js, dist/assets/handlers/chunks/chunk-VIS4MAAV.js, dist/assets/handlers/pages/cart.js, dist/assets/handlers/pages/chart.js, dist/assets/handlers/pages/items/[id].js, dist/assets/handlers/pages/product.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-navigation.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/items/[id]/index.js, dist/assets/native/product/index.js, dist/assets/params/[section]/[id]/index.js, dist/assets/params/items/[id]/index.js, dist/broken/index.html, dist/browser-test.js, dist/cart/index.html, dist/chart/index.html, dist/items/[id]/index.html, dist/items/new/index.html, dist/outside/index.html, dist/product/index.html, .kudzu/Shell.mjs, .kudzu/chart.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/[section]/[id].mjs, .kudzu/pages/broken.mjs, .kudzu/pages/cart.mjs, .kudzu/pages/chart.mjs, .kudzu/pages/items/[id].mjs, .kudzu/pages/items/new.mjs, .kudzu/pages/outside.mjs, .kudzu/pages/product.mjs
callback-ref-ownership: dist/assets/effects/index.js, dist/assets/handlers/pages/index.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-effect.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, .kudzu/ImportedAgeInput.mjs, .kudzu/ImportedButton.mjs, .kudzu/ImportedSearch.mjs, .kudzu/ImportedTooltip.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs
context-actions: dist/assets/handlers/pages/index.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/static/index.html, .kudzu/kudzu-plan.json, .kudzu/notes.mjs, .kudzu/pages/index.mjs, .kudzu/pages/static.mjs, .kudzu/useNotes.mjs
reducer: dist/assets/handlers/pages/index.js, dist/assets/handlers/pages/lazy.js, dist/assets/kudzu-binding.js, dist/assets/kudzu-list.js, dist/assets/kudzu-native.js, dist/assets/kudzu-serialization.js, dist/assets/kudzu-style.js, dist/assets/kudzu.js, dist/assets/native/index.js, dist/index.html, dist/lazy/index.html, .kudzu/ImportedControls.mjs, .kudzu/ImportedInput.mjs, .kudzu/ImportedItem.mjs, .kudzu/kudzu-plan.json, .kudzu/pages/index.mjs, .kudzu/pages/lazy.mjs, .kudzu/todoReducer.mjs, .kudzu/todoSupport.mjs
```

## 0.8.17 Command ModuleIR

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.16` tag `98a4ad9` and the `0.8.17` release candidate used detached worktrees on the same temporary volume with identical installed dependencies.

Both targets received two warm-ups followed by 21 clean `worker-effects` production builds in round-robin alternating order. Cleanup remained outside timing. The distributions overlap; the 1.76% candidate median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.16 baseline | 782.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.17 candidate | 795.8 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.16: [775.9,787.9,846.8,702.3,782.0,712.5,665.1,702.9,835.0,743.2,780.6,931.7,894.1,1004.0,849.8,1031.1,829.7,768.8,718.5,842.9,763.0]
0.8.17: [696.0,721.9,778.8,850.4,846.1,835.2,710.4,711.6,836.1,766.9,822.6,945.0,838.2,991.5,858.6,803.4,706.3,760.8,773.8,764.3,795.8]
```

Before release-content updates, the unchanged source site, Counter build module, route plan, and command runtime were byte-identical. The final Worker and window graphs remain byte-identical. This measurement covers compiler clean-build startup and artifact size, not browser interaction latency or cross-framework performance.

## 0.8.16 Compiler Analysis Boundaries

Measured UTC 2026-08-08 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, and npm 11.18.0. Baseline `0.8.15` commit `8405d29` and the `0.8.16` release candidate used detached worktrees on the same temporary volume with identical installed dependencies.

The tracked `worker-effects` fixture received two warm-ups per target followed by 21 clean production builds in round-robin alternating order. Cleanup remained outside timing. The measured distributions overlap; the 3.75% median difference remains below the 5% architecture gate and does not establish a material regression.

| Target | Build median | Worker raw / gzip | Window raw / gzip |
|---|---:|---:|---:|
| 0.8.15 baseline | 787.0 ms | 907 B / 475 B | 12,148 B / 5,427 B |
| 0.8.16 candidate | 816.5 ms | 907 B / 475 B | 12,148 B / 5,427 B |

```text
0.8.15: [762.5,793.7,937.8,820.7,775.9,766.4,807.2,742.7,772.0,757.6,823.0,752.7,814.2,827.2,917.4,787.0,755.1,798.5,742.1,806.8,785.8]
0.8.16: [893.1,653.9,915.2,816.5,800.1,747.1,801.5,749.8,951.8,830.3,723.5,780.4,904.4,821.6,957.0,757.9,918.0,809.5,739.3,844.6,950.9]
```

The artifact comparison is exact for both graphs. It measures compiler clean-build startup plus the existing Worker fixture, not browser update latency or cross-framework performance.

## 0.7.12 Keyed Local State

Measured UTC 2026-08-02 on Apple M3, 8 logical CPUs, 8 GiB RAM, macOS 26.5.2 / Darwin 25.5.0, Node 25.6.1, npm 11.18.0, and Chrome 150.0.7871.187.

Targets were Kudzu 0.7.12 at commit `05e5cc248d425b0f30549cd0649df99291c5aa38`, React/React DOM 19.2.8, Vue 3.5.40, Svelte 5.56.8, and Vite 8.2.0. The Vite plugins were React 6.0.5, Vue 6.0.8, and Svelte 7.2.0.

### Fixture

- 1,000 keyed rows with matching visible content and controls.
- Each row owns local editing state and conditionally creates a read-only input.
- Operations run in order: edit row 500, reverse, remove row 500, re-add row 500.
- Edit and reverse retain row 500 DOM identity; reverse also retains its input and editing state.
- Removal disconnects the old row and input; re-add creates fresh non-editing DOM and state.
- All 28 measured browser profiles passed content, order, identity, and reset checks.

Kudzu emitted pre-rendered HTML plus capability ESM. React, Vue, and Svelte used Vite production CSR from an empty shell. Browser operation timing started only after each target had 1,000 rows, so it excludes initial rendering. Total output and JavaScript sizes are not architecture-equivalent comparisons.

### Method

- Builds: one clean warm-up per target, then seven clean measured builds in round-robin rotated order; cleanup remained outside timing.
- Browser: 31 round-robin rotated unthrottled runs per target, each in a fresh Chrome profile. A separate seven-profile run used 4x CDP CPU throttling.
- Timing: one in-page promise installs a <code>MutationObserver</code>, records <code>performance.now()</code>, dispatches the click, and resolves only after terminal DOM and identity predicates pass.
- Initial JavaScript: unique external module-script/static-import closure plus inline module bodies. Raw size is summed bytes; gzip is one deterministic compression over path-sorted concatenated bytes.
- Total output: sum of all regular production files.

### Medians

| Target | Initial rows | JS raw | JS gzip | Total output | Build | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Kudzu | Yes | 26,117 B | 8,610 B | 940,710 B | 238.051 ms | 0.5 ms | 4.2 ms | 1.3 ms | 1.9 ms |
| React CSR | No | 191,163 B | 59,564 B | 191,260 B | 185.665 ms | 2.1 ms | 7.5 ms | 2.4 ms | 1.9 ms |
| Vue CSR | No | 61,652 B | 24,018 B | 61,749 B | 198.550 ms | 0.9 ms | 3.8 ms | 1.3 ms | 0.9 ms |
| Svelte CSR | No | 35,208 B | 13,686 B | 35,305 B | 279.240 ms | 0.8 ms | 20.1 ms | 1.6 ms | 1.3 ms |

### Raw Build Times

```text
Kudzu: [235.435, 238.051, 237.118, 250.086, 254.562, 251.422, 237.609]
React: [187.010, 185.665, 186.299, 185.506, 183.472, 186.375, 184.815]
Vue:   [200.253, 198.494, 197.007, 203.240, 198.550, 197.475, 200.469]
Svelte:[281.211, 285.172, 278.421, 279.240, 277.810, 279.036, 281.426]
```

### Corrected Browser Distributions

The first seven-profile run used external CDP polling and was discarded: protocol roundtrips added roughly 42–49 ms to reverse and produced unstable 4–10 ms bands for short operations. The corrected run measures completion entirely in-page. Values below are min / median / max across 31 fresh profiles.

| Target | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|
| Kudzu | 0.3 / 0.5 / 0.6 | 3.7 / 4.2 / 4.8 | 0.9 / 1.3 / 1.8 | 1.7 / 1.9 / 3.0 |
| React CSR | 1.9 / 2.1 / 2.4 | 7.1 / 7.5 / 8.3 | 2.0 / 2.4 / 3.4 | 1.7 / 1.9 / 2.7 |
| Vue CSR | 0.7 / 0.9 / 1.0 | 3.5 / 3.8 / 4.1 | 1.1 / 1.3 / 1.6 | 0.8 / 0.9 / 1.2 |
| Svelte CSR | 0.6 / 0.8 / 1.2 | 19.2 / 20.1 / 21.6 | 1.4 / 1.6 / 1.8 | 1.2 / 1.3 / 1.5 |

### Corrected 4x CPU Medians

| Target | Edit | Reverse | Remove | Re-add |
|---|---:|---:|---:|---:|
| Kudzu | 2.3 ms | 17.3 ms | 5.9 ms | 8.6 ms |
| React CSR | 8.5 ms | 30.3 ms | 10.5 ms | 8.4 ms |
| Vue CSR | 3.2 ms | 14.8 ms | 5.4 ms | 4.1 ms |
| Svelte CSR | 3.5 ms | 78.6 ms | 6.3 ms | 6.1 ms |

The observer validates DOM mutation completion, not paint or compositor presentation. Synthetic clicks exclude hardware input latency, and 0.1 ms timer quantization matters for sub-millisecond edits. The fixture measures one keyed local-state workload, not general framework performance.

## 2026-08-03 Structural SVG And Link Lowering

Measured on Intel Core i5-9500 (6 cores), 32 GB RAM, Linux 6.17.0-19-generic, Node 24.14.0, npm 11.9.0, and Chrome 142.0.7444.175. The worktree was based on Kudzu 0.7.21 with the unreleased structural SVG and React Router `Link` changes.

The structural fixture rendered 1,000 keyed rows plus one reactive conditional. SVG and HTML targets used the same state and operation sequence: conditional toggle, row 500 update, reverse, row 500 removal, and one append. All 31 fresh profiles per target passed content, namespace, and retained reverse-identity checks. Builds received one clean warm-up followed by seven clean round-robin runs; cleanup was outside timing. Browser targets alternated order across 31 fresh profiles each, with completion measured in-page by `MutationObserver`.

### Medians

| Target | Build | JS raw | JS gzip | Total output | Conditional | Update | Reverse | Remove | Add |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SVG | 404.291 ms | 23,989 B | 8,079 B | 149,500 B | 0.8 ms | 1.9 ms | 8.3 ms | 2.4 ms | 3.5 ms |
| HTML control | 391.427 ms | 23,656 B | 8,000 B | 144,894 B | 0.7 ms | 1.8 ms | 8.3 ms | 2.5 ms | 3.6 ms |

SVG added 333 B raw / 79 B aggregate gzip JavaScript to this matched capability graph. Its build median was 3.29% higher. Browser medians differed by +0.1 ms conditional, +0.1 ms update, 0.0 ms reverse, -0.1 ms remove, and -0.1 ms add. The sub-millisecond differences are within timer quantization and overlapping fresh-profile ranges; no material SVG browser regression was established.

The static `Link` fixture and an already base-prefixed native-anchor control emitted byte-identical 248 B HTML, zero JavaScript, and no other files. Their clean build medians were 269.386 ms and 267.514 ms respectively, a 0.70% difference within the observed run variation.

### Raw Build Times

```text
SVG:   [379.646, 389.564, 435.431, 429.248, 423.114, 395.475, 404.291]
HTML:  [373.381, 379.176, 420.158, 431.850, 401.762, 391.427, 381.916]
Link:  [255.944, 276.585, 262.099, 322.057, 269.386, 259.338, 302.837]
Anchor:[262.150, 267.514, 262.529, 272.420, 270.237, 261.387, 279.634]
```

### Raw Browser Times

```text
SVG conditional: [0.8,0.8,0.7,0.8,0.7,1.5,1.0,0.8,0.9,0.8,0.8,0.7,0.8,1.1,0.6,0.6,0.7,0.9,0.7,0.8,0.9,1.5,0.9,0.8,0.8,0.8,0.7,1.0,0.7,0.6,0.9]
SVG update:      [1.9,1.7,1.8,1.5,1.7,2.2,2.2,2.8,2.0,1.9,1.7,2.9,1.7,1.9,1.7,1.6,1.9,1.9,1.9,1.8,3.8,3.3,2.1,3.3,1.8,1.7,1.7,1.8,1.9,1.7,1.9]
SVG reverse:     [9.1,7.9,8.3,7.4,7.9,12.7,12.5,10.2,12.8,8.0,7.9,10.0,7.9,8.4,7.7,7.5,7.3,9.1,8.6,9.0,9.8,9.1,9.2,9.9,8.0,8.2,7.7,7.9,7.8,8.4,7.6]
SVG remove:      [2.4,2.1,2.5,2.2,2.3,3.4,3.3,4.1,8.9,2.7,2.2,2.7,2.3,2.6,3.2,2.3,2.1,3.0,2.3,2.6,3.6,4.1,6.3,2.4,2.5,2.1,2.3,2.2,2.3,2.1,2.3]
SVG add:         [3.4,3.3,4.4,2.9,3.1,8.1,5.3,13.0,4.1,6.0,3.2,4.0,3.4,3.6,4.4,3.1,3.0,4.0,3.6,4.0,6.4,4.3,4.9,3.5,3.3,2.9,3.3,2.9,3.4,3.1,3.2]
HTML conditional:[0.6,0.6,0.6,0.5,0.8,0.8,2.0,4.1,0.8,0.7,2.6,0.7,0.6,0.6,0.7,0.6,0.6,0.6,1.0,0.7,0.7,0.7,1.1,0.8,0.9,0.9,0.7,0.7,0.7,1.5,0.7]
HTML update:     [1.9,1.7,1.8,1.7,2.2,2.8,2.2,1.8,1.8,2.0,1.9,1.8,1.7,1.8,1.7,1.6,1.5,1.4,1.9,2.2,2.6,5.1,2.0,2.8,2.1,1.9,1.7,1.8,1.7,1.8,1.9]
HTML reverse:    [7.4,6.4,6.9,7.3,10.6,10.3,15.3,27.8,8.4,11.6,7.2,8.8,7.1,6.9,6.6,6.5,6.2,6.2,10.3,11.6,8.2,10.6,14.2,11.3,8.5,8.4,7.0,8.6,8.3,6.7,7.0]
HTML remove:     [2.6,2.1,2.2,2.3,3.6,3.7,6.1,10.2,2.4,3.4,2.4,4.7,2.0,2.2,2.0,2.3,2.1,2.1,3.0,3.7,2.3,3.0,2.8,7.0,5.1,2.8,2.3,2.2,2.6,2.5,2.2]
HTML add:        [3.7,3.2,3.1,3.7,4.2,6.6,11.7,8.8,3.3,6.7,3.3,5.5,3.1,3.0,3.0,3.3,2.9,2.9,8.7,7.9,3.3,5.6,4.2,6.0,3.8,7.0,3.3,3.3,3.2,3.3,3.6]
```

The browser ranges were SVG conditional 0.6–1.5 ms, update 1.5–3.8 ms, reverse 7.3–12.8 ms, remove 2.1–8.9 ms, add 2.9–13.0 ms; HTML conditional 0.5–4.1 ms, update 1.4–5.1 ms, reverse 6.2–27.8 ms, remove 2.0–10.2 ms, add 2.9–11.7 ms. Measurements cover DOM mutation completion, not paint/compositing, and use unthrottled synthetic clicks. The SVG and HTML markup is behavior-matched but not byte-identical, so total HTML/output differences are not attributed solely to namespace support.

The maintained Worker benchmark also passed on this worktree: build runs `[874.5, 778.5, 757.3, 880.3, 713.7, 672.8, 515.3]` ms, median 757.3 ms; Worker graph 907 B raw / 477 B gzip; window graph 11,960 B raw / 5,353 B gzip. Its historical M3 build timings are not comparable to this Linux machine.

## 2026-08-04 Large React Migration

Measured on Intel Core i5-9500, Linux 6.17.0-19-generic, Node 24.14.0, npm 11.9.0, and Chrome 142.0.7444.175. The worktree was based on Kudzu 0.7.25 with unreleased React-compatible JSX typing, setter-adapter component specialization, and TypeScript-only collection-wrapper unwrapping.

The generated Trailboard fixture contains 2,000 imported records, 500 initially rendered keyed cards, one reactive search reducing the list to one card, one keyed row-local state update, and 53 routes including 50 report pages. React/Vite has 60 source files, 2,561 lines, and 279,966 bytes; Kudzu has 58 source files, 2,440 lines, and 273,752 bytes because file routes replace the React root/router entries.

Builds received one warm-up followed by seven alternating clean TypeScript-check plus production-build runs. Browser targets alternated across seven runs, each with a new Chrome profile and warm local server. An in-page async evaluation measured navigation start to the expected 500-card DOM, event dispatch to the one-card filtered DOM, and click dispatch to the row-local state attribute update.

### Medians

| Metric | React/Vite | Kudzu | Kudzu difference |
|---|---:|---:|---:|
| Clean typecheck + build | 3,188.27 ms | 2,759.69 ms | -13.44% |
| Initial 500-card DOM | 261.80 ms | 280.10 ms | +6.99% |
| Filter 500 cards to one | 13.90 ms | 28.30 ms | +103.60% |
| Toggle keyed row state | 5.80 ms | 5.30 ms | -8.62% |
| JavaScript gzip | 97,885 B | 12,191 B | -87.55% |

Kudzu's filter path is the clear loss in this fixture and is the next measured optimization candidate. Initial readiness and row-local state are in overlapping fresh-profile ranges, while the build and JavaScript-size wins are material.

### Selector Optimization Follow-up

The collection evaluator was changed to cache selector state reads for one execution and avoid recursive rest-array allocation, `slice()`, and `map()` in hot expression nodes. A second seven-run alternating fresh-profile measurement used the same fixture and method.

| Metric | Baseline | Optimized | Change |
|---|---:|---:|---:|
| Kudzu filter 500 cards to one | 28.30 ms | 22.00 ms | -22.26% |
| React filter control | 13.90 ms | 13.60 ms | -2.16% |
| Kudzu gap versus React | +103.60% | +61.76% | -41.84 points |
| Kudzu JavaScript gzip | 12,191 B | 12,310 B | +0.98% |

The allocation/state-cache change materially improves the path without changing list ownership or cleanup semantics. The remaining gap is concentrated in generic keyed reconciliation and per-row ownership cleanup when 499 mounted rows are removed at once. An attempted detached batch cleanup was discarded because it broke the remove-all/add-new-key transition; it is not part of the retained change.

```text
Optimized Kudzu filter: [22.8, 22.5, 20.8, 19.2, 22.0, 22.5, 20.7]
Optimized React filter: [14.9, 14.9, 15.6, 12.9, 13.6, 13.4, 12.9]
```

### Indexed Row Release Follow-up

Profiling separated selector evaluation, which took about 3 ms, from the remaining per-row lifecycle work. The compiler now marks keyed rows for direct state-indexed release only when they have row-local state but no row effects, nested lists, or shared text targets. Binding and condition registrations are released by state ID; all other row shapes retain the existing DOM-owned unmount path.

Because the seven-run ranges overlapped, the final isolated measurement used one warm-up and 21 alternating samples:

| Metric | React/Vite | Kudzu | Kudzu difference |
|---|---:|---:|---:|
| Clean typecheck + build | 3,024.33 ms | 2,664.58 ms | -11.90% |
| Initial 500-card DOM | 256.90 ms | 256.00 ms | -0.35% |
| Filter 500 cards to one | 13.90 ms | 13.50 ms | -2.88% |
| Toggle keyed row state | 5.70 ms | 5.30 ms | -7.02% |
| JavaScript gzip | 97,885 B | 12,442 B | -87.29% |

The final Kudzu filter median is 52.30% below the preserved 28.30 ms baseline and 2.88% faster than React on the matched operation. The fast path adds 132 B gzip over the selector-only follow-up. Raw 21-run arrays and generated reports are stored in the benchmark fixture.

### Artifacts

| Target | HTML raw / gzip | CSS raw / gzip | JS raw / gzip |
|---|---:|---:|---:|
| React/Vite | 168 / 143 B | 3,649 / 1,365 B | 465,830 / 97,885 B |
| Kudzu | 702,854 / 65,355 B | 4,225 / 1,442 B | 30,175 / 12,191 B |

React/Vite emits one CSR shell, while Kudzu's HTML total includes 53 complete documents. The initial-readiness comparison therefore measures the product delivery difference rather than equivalent markup. Gzip totals sum files independently; clients do not download all 53 Kudzu documents for one route.

### Raw Build Times

```text
React: [3156.83, 3190.33, 3155.66, 3188.27, 3115.12, 3201.29, 3268.69]
Kudzu: [2777.83, 2792.51, 2659.28, 2655.26, 2706.48, 2759.69, 2812.61]
```

### Raw Browser Times

```text
React initial: [293.3, 230.8, 272.6, 292.0, 261.8, 261.8, 235.7]
Kudzu initial: [277.3, 280.6, 287.9, 292.4, 276.1, 254.8, 280.1]
React filter:  [13.9, 15.5, 15.3, 14.4, 13.0, 13.5, 13.8]
Kudzu filter:  [28.3, 31.7, 29.1, 28.9, 26.4, 24.4, 24.1]
React toggle:  [5.7, 6.1, 5.8, 5.8, 5.6, 5.8, 5.7]
Kudzu toggle:  [5.2, 5.4, 5.3, 5.6, 5.3, 5.2, 5.3]
```

The original fixture and harness were stored in an excluded local workspace and are unavailable from this checkout. The arrays above remain historical provenance, not an independently reproducible current claim.
