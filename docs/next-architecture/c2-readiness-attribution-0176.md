# C2 0.17.6 Readiness Attribution

Offline analysis of the six diagnostic traces already recorded by hosted run
[40259544715](https://github.com/kudzujs/kudzu/actions/runs/40259544715).
No browser sample was rerun. Baseline is v0.17.6; candidate is the rejected
build-proven initial-ID trial `4c7173c`. Its failed 21-pair gate remains unchanged.

## Reproduction and accounting

```sh
node --test test/c2-readiness-attribution.test.mjs
node test/c2-readiness-attribution.mjs /path/to/traces /path/to/readiness.json
```

The input directory is `traces/` in `c2-initial-id-proof-40259544715.tar.gz`,
attached to v0.17.6. The analyzer records SHA256 for its report input and every
trace. It checks the renderer process/thread and navigation identity of every
readiness mark, then matches the **last** mark to the stored harness result.
All six profiles contain two readiness marks. They are retained, not deduplicated
into a more favorable first-ready result.

Duration events on that thread are clipped to start-mark → final-ready-mark.
A sweep partitions the interval: the innermost selected span owns overlapping
time; other recorded spans and uncovered intervals have separate buckets. Each
profile's microsecond totals exactly equal its interval. Nested GC/layout is
therefore not also counted as module/callback time. Tests cover nesting, crossing,
clipping, gaps, other threads, duplicate marks, navigation mismatches and invalid
durations. This is a documented wall-time attribution convention, not CPU self
time or a causal critical-path reconstruction.

## Per-profile results

Milliseconds below are disjoint within each row. Paint includes PrePaint, Paint
and Layerize. Other includes module compilation and unclassified recorded spans.
Rounded displayed cells may differ slightly from the exact JSON totals.

| Arm/profile | Interval | Parse | Module | GC | Style | Layout | Paint | Callbacks | Other | Uncovered |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Baseline 0 | 243.818 | 28.157 | 82.317 | 14.251 | 16.675 | 52.527 | 17.267 | 2.428 | 0.341 | 29.855 |
| Baseline 1 | 206.422 | 21.689 | 70.478 | 14.033 | 16.394 | 46.651 | 14.966 | 2.442 | 0.471 | 19.298 |
| Baseline 2 | 205.558 | 23.313 | 66.862 | 11.044 | 24.397 | 44.094 | 15.406 | 1.858 | 0.306 | 18.278 |
| Candidate 0 | 196.204 | 22.495 | 58.029 | 9.764 | 24.138 | 51.712 | 14.889 | 1.919 | 0.314 | 12.944 |
| Candidate 1 | 196.458 | 20.384 | 58.388 | 9.682 | 22.669 | 48.112 | 17.167 | 2.255 | 0.347 | 17.454 |
| Candidate 2 | 228.674 | 27.223 | 68.409 | 12.434 | 24.222 | 50.212 | 15.527 | 2.668 | 0.328 | 27.651 |

Navigation-to-start-mark time is outside this partition: baseline
29.8/31.4/37.0 ms, candidate 27.8/22.7/32.7 ms. Stored full readiness is baseline
273.7/237.8/242.5 ms and candidate 223.9/219.1/261.4 ms. These traced values
must not replace the 21 untraced readiness samples or establish a new speed claim.
Uncovered 12.944–29.855 ms is not proof of network waiting or idle time; the
recorded categories do not provide complete scheduler/resource attribution.

## Readiness ordering and forced layout

The predicate in `benchmarks/runtime-matrix/run.mjs` requires 1,000 owned rows,
2,000 records, 200 details, parent/child effect setup and row 500's mount effect.
It then disconnects its MutationObserver, reads `document.body.offsetHeight`,
and stores `performance.now()`. DOMContentLoaded also invokes the same predicate.

- Every profile's first successful mark precedes DOMContentLoaded; the final mark
  follows it. The duplicate-mark increment is only 0.303–0.440 ms.
- The empty-URL `ready` callbacks run 12–13 times, totaling 2.731–3.687 ms
  inclusively across each profile. This includes their nested layout/style work.
- Only 0.420–0.976 ms of Layout and 0.032–0.053 ms of UpdateLayoutTree lies
  inside those callbacks. The large 44–53 ms layout totals occur mostly earlier,
  not in the final forced layout. Removing the harness check would weaken the
  contract and does not address the observed earlier rendering cost.
- Module evaluations begin 92.449–130.816 ms after the start mark and continue
  until 203.971–242.448 ms on baseline, or 194.451–226.610 ms on candidate.
  The final evaluation ends just 1.113–2.064 ms before the final ready mark.
  These are ordering observations, not proof that one particular module caused
  the remaining delay.

## Conclusions and next bounded diagnostic

The initial-ID visitor is a proven removable CPU cost, but its removal alone
failed the frozen startup gate. Rendering, parsing, GC, module evaluation and
unattributed intervals remain material; no single-category median explains the
wall-clock result. Do not sum independently calculated category medians.

All recorded `v8.evaluateModule` events lack URLs. Compilation events have URLs,
but adjacent compile/evaluate order does not establish module identity because
ESM dependencies evaluate independently. The current traces cannot name a new
runtime function to optimize or establish the network/scheduling cause of gaps.

Next packet: diagnostic-only module-body start/end marks on scratch copies of
pinned v0.17.6 emitted ESM, correlated with the existing readiness/layout trace
and full C2 acceptance. Preserve native import/dependency order and every effect;
mark only each module's own synchronous evaluation, not its dependency closure
or later async callbacks. Use this to identify ownership of the remaining module
work. Instrumented timing cannot pass a speed gate. Do not restore the rejected
candidate, change authored DOM/CSS, weaken readiness, or select an optimization
until that ownership is known. A later candidate still needs a separate frozen,
uninstrumented comparison.

Product compiler/runtime, package versions and deploy output remain unchanged.
