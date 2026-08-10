# Goal B: Optimization Benchmarks

## Status

Active from the completed Goal A baseline at `0.8.23` commit `39a065b`. Maintained keyed restoration and external 1,000-product build measurements authorized the first two narrow optimizations.

## Purpose

Use matched fixtures to identify measured build, output, or browser losses after the new boundaries are stable. Goal B is evidence-led optimization, not an architecture rewrite or a framework leaderboard.

## Baseline

At Goal A completion, record one source revision and the current maintained fixtures for:

- clean build time;
- emitted file list and deterministic hashes where applicable;
- HTML, CSS, raw/gzip JavaScript, and Worker bytes;
- static zero-JavaScript routes;
- command update, reactive binding, keyed list update/reorder/removal, dependency effect, and enhanced navigation;
- repeated ownership cycles and heap trend.

Historical figures in [`PERFORMANCE.md`](../../PERFORMANCE.md) and the top-level Goal records are provenance, not an automatic current baseline. Reproduce a fixture before using it to approve work.

### First Baseline Pass

The maintained Worker benchmark measured a 289.9 ms clean-build median, 907 B raw / 477 B gzip Worker graph, and 12,148 B raw / 5,411 B gzip window graph on Node 22. Its Chrome throughput, cadence, stale-write, bounded-history, and repeated ownership gate passed.

The preserved external 1,000-row keyed fixture was used only to find a candidate, not as a maintained approval benchmark. Its operations were fast, so a repository-owned benchmark was added for 2,000 rows with local state and reactive search. It measures filtering to one retained row, restoring 1,999 fresh rows, and reversing all rows in fresh Chrome profiles while checking retained identity, released identity, reset state, and restored handlers.

The maintained benchmark measured a 26.3 ms restoration median. For top-level flat lists where more than 32 additions are a majority of both the next rows and their parent children, mounting the connected list parent once rather than invoking every mount hook for every new row reduced the median to 21.1 ms (19.77%). A retained-heavy 33-row append stayed on the per-root path and showed no material change at 2.7 ms versus 2.6 ms. The route added 127 B raw / 35 B aggregate gzip JavaScript.

[`SimYunSup/kudzu-based-bench`](https://github.com/SimYunSup/kudzu-based-bench) then supplied a 1,000-product, 1,011-page build fixture. Twenty-one alternating clean builds measured 6,684.7 ms for clean `0.8.23` and 6,266.5 ms after skipping parent-pointer repair for normalization passes that return the unchanged AST, a 6.26% improvement. The output retained 3,056 files and only the separately optimized `kudzu-list.js` changed. Full raw arrays and limitations are recorded in [`PERFORMANCE.md`](../../PERFORMANCE.md).

The `0.8.25` investigation isolated repeated esbuild work by comparing ordinary transformation with build-local reuse keyed by the complete generated route-entry source. Seven alternating 1,011-page builds measured 13,851.0 ms and 12,581.4 ms medians, a 9.17% improvement, with identical emitted paths and hashes. The retained implementation applies only to native, parameter, and effect route entries and keeps no data beyond one build.

## Candidate Order

1. Profile the largest measured loss in a maintained fixture.
2. Separate analysis/build cost, transfer bytes, startup, selector evaluation, DOM mutation, and ownership cleanup.
3. Change the narrowest shared path responsible for the loss.
4. Keep the change only if repeated measurements clear the materiality rule and correctness gates.

Known historical pressure points include large keyed-list removal/reconciliation and broad runtime specialization, but neither is authorized without a reproduced current loss.

Repeated esbuild transformation of byte-identical generated route entries cleared the materiality and output gates. Further optimization is not authorized until another current fixture isolates a measured loss; do not broaden the route-entry map into a generalized cache.

## Benchmark Contract

- Match visible content, behavior, errors, accessibility, and navigation semantics.
- Disclose static HTML versus CSR/SSR architecture differences.
- Use one warm-up and at least seven interleaved production builds.
- Use rotating fresh browser profiles and more runs when ranges overlap.
- Record environment, source revision, raw arrays, medians, min/max or distributions, artifacts, and limitations.
- A repeatable browser median change above 5% is material; deterministic byte growth is always reviewed.

## Rejection Rules

Reject an optimization that:

- removes complete initial HTML or zero-JavaScript exclusion;
- changes DOM identity, state lifetime, cleanup, stale-write, focus, history, or native fallback semantics;
- introduces a retained tree, scheduler, cache, generalized runtime, or public API;
- wins by omitting matched behavior or accessibility;
- cannot be reproduced outside profiler instrumentation.

## Continuation Checklist

- [x] Verify Goal A acceptance is complete.
- [x] Freeze and record the post-Goal-A baseline revision.
- [x] Select one measured loss, not a speculative hotspot.
- [x] Add one minimal benchmark or reuse a maintained one.
- [x] Record before/after raw arrays and artifacts.
- [ ] Revert experiments that do not clear correctness and materiality gates.
