# Goal B: Optimization Benchmarks

## Status

Deferred until Goal A is complete. Do not combine optimization with the compiler-boundary patches: structural movement would invalidate attribution and make output drift harder to review.

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

## Candidate Order

1. Profile the largest measured loss in a maintained fixture.
2. Separate analysis/build cost, transfer bytes, startup, selector evaluation, DOM mutation, and ownership cleanup.
3. Change the narrowest shared path responsible for the loss.
4. Keep the change only if repeated measurements clear the materiality rule and correctness gates.

Known historical pressure points include large keyed-list removal/reconciliation and broad runtime specialization, but neither is authorized without a reproduced current loss.

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

- [ ] Verify Goal A acceptance is complete.
- [ ] Freeze and record the post-Goal-A baseline revision.
- [ ] Select one measured loss, not a speculative hotspot.
- [ ] Add one minimal benchmark or reuse a maintained one.
- [ ] Record before/after raw arrays and artifacts.
- [ ] Revert experiments that do not clear correctness and materiality gates.
