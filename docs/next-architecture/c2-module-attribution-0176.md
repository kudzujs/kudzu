# C2 0.17.6 Module-Body Attribution

Diagnostic packet completed 2026-10-27 on pinned v0.17.6
(`487a1566d23c6226974f919beb943d088142763b`). Both arms use that exact compiler:
baseline output is unchanged; candidate is a scratch copy with module-body marks.
This is not another initial-ID trial or a speed comparison.

## Method and verification

```sh
node --test test/c2-module-marks.test.mjs
KUDZU_REQUIRE_CHROME=1 node test/c2-initial-mount.mjs --modules
```

The harness runs three fresh profiles per arm, interleaved, with the unchanged
complete C2 journey and initial readiness predicate. It records traces in both
arms. Only the instrumented arm adds `performance.mark` before/after each emitted
ESM body; native imports still evaluate dependencies before the importing body.
No function is wrapped and no dependency/effect is reordered. The marker helper
rejects top-level await and records original/marked byte counts and SHA256 hashes.
An async callback declared inside a module remains allowed and is not included
in its body's later execution time.

Tests demonstrate dependency-first evaluation, async-callback exclusion,
top-level-await rejection, paired marks and unobserved modules. The analyzer
checks mark pairs on the same renderer/navigation, non-overlapping synchronous
bodies, matching final readiness, and per-body trace partition conservation.
Missing or extra marks fail rather than being silently discarded. Original JS
hashes match the baseline files, and both HTML files match byte-for-byte.

All six C2 journeys pass, including interaction/DOM identity, cleanup, delayed
and missing script resilience and the zero-JavaScript static sibling. All eleven
module bodies have paired marks before readiness in every instrumented profile.
Local `npm run check` and 381 tests plus the project-app journey pass. No browser
sample was rerun; the final analyzer was checked offline against the same traces.

Host: Intel Core i5-9500, six logical CPUs, Linux 7.0.0-38-generic x64,
Node 24.14.0, Chrome 152.0.7977.64. These local diagnostic times are not comparable
with the previous hosted VM's results.

## Observed synchronous body wall time

Milliseconds, one column per instrumented fresh profile. The runtime path prefix
is `assets/runtime/f66e3bc98f0dce02/`.

| Body | Profile 0 | Profile 1 | Profile 2 |
|---|---:|---:|---:|
| `kudzu.js` | 2.316 | 2.275 | 2.426 |
| `kudzu-serialization.js` | 0.019 | 0.016 | 0.063 |
| `kudzu-style.js` | 0.012 | 0.012 | 0.018 |
| `kudzu-binding.js` | 18.650 | 18.375 | 13.475 |
| `kudzu-collection-selector.js` | 0.012 | 0.013 | 0.011 |
| `kudzu-list.js` | 43.022 | 42.630 | 41.815 |
| `kudzu-native.js` | 4.819 | 3.576 | 3.810 |
| `assets/handlers/pages/index.js` | 0.016 | 0.011 | 0.015 |
| `assets/native/index.js` | 0.074 | 0.065 | 0.092 |
| `kudzu-effect.js` | 0.026 | 0.014 | 0.017 |
| `assets/effects/index.js` | 9.625 | 10.624 | 10.492 |

The order above is identical in all three profiles. In particular, binding
initialization precedes list initialization, and the effect entry follows the
list body, retaining the released ordering fix. The tiny effect helper is not
the same work as the effect entry that executes setup.

Body times include synchronous callees and interruptions/GC, not only code
lexically in that file. List-body MinorGC accounts for 4.026/4.416/3.835 ms;
binding-body MinorGC is 5.322/2.648/1.830 ms. No Layout or UpdateLayoutTree span
falls inside these measured module bodies. This separates their script work from
the earlier rendering cost identified in the offline trace packet, without
claiming a causal explanation for all uncovered time.

Full readiness is 306.3/253.1/257.8 ms in the baseline and 300.1/266.3/265.4 ms
with markers. These are perturbed diagnostic observations, not a performance gate
or evidence of improvement. The marker-only output adds 2,002 raw / 839 level-9
gzip JS bytes (43,267 → 45,269 raw; 16,343 → 17,182 gzip). HTML stays
688,281 raw / 69,741 gzip. Product browser bytes, compiler passes/LOC, semantic
primitives, runtime concepts and package versions do not change.

## Next bounded packet

The largest named evaluation owners are now known: list and binding module
initialization. Module boundaries alone do not identify their expensive functions:
their top-level `mountDom(document)` calls also invoke already-registered hooks.
Do not equate a list body with only `mountLists`, or a binding body with only
`mountBindings`, without inspecting those callees.

Next collect diagnostic CPU samples during pinned 0.17.6 initial readiness and
correlate sampled sites with these module-body windows, retaining raw samples and
all C2 acceptance. Attribute binding/list mount callees and repeated hook work
before choosing a new candidate. Do not rerun or adopt the rejected initial-ID
exclusion, skip arrival-time fills or change the readiness predicate. Any future
optimization still needs a distinct frozen, uninstrumented adoption comparison.
