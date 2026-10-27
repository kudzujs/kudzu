# C2 0.17.6 DOM Write Census

Both arms pin `487a1566d23c6226974f919beb943d088142763b` (v0.17.6).
`KUDZU_REQUIRE_CHROME=1 node test/c2-initial-mount.mjs --dom-writes` runs three
fresh profiles per arm with the unchanged complete C2 acceptance. The baseline
is unmodified; only scratch candidate ESM wraps write sites. Every original write
still runs, including same-value writes. HTML stays byte-identical and original
module hashes match. No product compiler, runtime, semantic or version changes.

## Method and limits

The TypeScript parser locates native `setAttribute`, `removeAttribute` and
`toggleAttribute` calls, plus assignments to `textContent`, `data`, `value`,
`checked`, `className` and `dataset`. Receivers/arguments evaluate once, setters
and method return values are preserved, and non-DOM objects pass through without
counting. Nested writes fail closed. Unit tests cover these properties, repeated
same-value writes, initial row owners, detached clones and outside-list nodes.
Initial DOM sibling ranges map to list IDs; clone markers supply detached owners.
Counts retain full module paths, owner, target, kind and connectedness.

The census records **invoked operations** and compares values before/after each
operation, not MutationRecords or time savings. Same visible values do not imply
equivalent semantics: text node replacement, focus, observers, custom elements
and resource attributes can have effects. Parser work, style subproperties,
text insertion/removal and structural DOM operations are outside this census.
The helper's reads and counters perturb timing. No timings are used for adoption.

Instrumentation covers 33 emitted sites. Scratch JS adds 2,687 raw / 362 level-9
gzip bytes, excluding the counter helper injected through CDP in the main and
resilience targets. Both HTML files stay 688,281 raw / 69,741 gzip bytes.
An initial diagnostic attempt omitted the helper in the separate delayed-script
target and timed out. Its partial report and log are preserved; installing the
same helper in that target fixes the harness without changing acceptance.

## Observations

All three instrumented profiles produce identical counts. Initial operations:

| Module / owner / target | Calls | Same value | Changed |
|---|---:|---:|---:|
| binding / l0 / `data-selected` | 1,000 | 1,000 | 0 |
| binding / l0 / `aria-pressed` | 1,000 | 1,000 | 0 |
| list / l0 / `data-row` | 1,000 | 1,000 | 0 |
| list / l0 / `data-row-toggle` | 1,000 | 1,000 | 0 |
| handler / l0 / dataset `mounted` | 1,000 | 0 | 1,000 |
| binding / outside / `aria-pressed` | 3 | 3 | 0 |
| binding / outside / `data-value`, `className`, `style` | 3 | 3 | 0 |
| handler / outside / `textContent` | 2 | 0 | 2 |
| **Total** | **5,008** | **4,006** | **1,002** |

The full journey records 16,039 operations: 6,008 same, 10,031 changed, in every
profile. These are cumulative, not an extra count to add to initial operations.
All six original/marked C2 journeys pass, including cleanup, identity, delayed and
missing scripts, and zero-JS static sibling. Full check and 384 tests plus the
project application journey pass. Host: i5-9500 (six logical CPUs), Linux
7.0.0-38-generic x64, Node 24.14.0, Chrome 152.0.7977.64.

## Next bounded candidate: initial list attribute comparison

The general binding equal-attribute shortcut was already rejected in October;
these counts do not reopen it. The distinct candidate changes only the generic
list's first fill: pass `previous !== undefined` instead of unconditional `true`
to its existing `patchBinding` helper. That helper already compares current DOM
attributes when its force-write flag is false. This reuses an existing path and
must still fill every differing arrival-time value. Later retained-item updates
keep their existing forced writes and prior-item comparisons. Special property,
class/style and removal behavior, all ID replacement/registration and every
ownership edge remain unchanged. No new cache or compiler proof is involved.

Scope: `framework/list-runtime.js`, existing pending-list/browser lifetime
coverage (delayed first and repeated values, state/ref/ID clones), an explicit
pre-load external attribute change, exact project artifact contract, and a pinned
comparison harness/workflow. Required checks: focused lifetime/browser tests,
full check/tests, package smoke, and one hosted uninstrumented 21-pair comparison
against v0.17.6. Freeze adoption at >=5% lower initial-DOM median, negative paired
median, >=16/21 faster pairs, and no operation >5% higher with >=16/21 slower
pairs. Keep complete acceptance and all raw results. Reject without favorable
reruns if the gate fails; counts alone cannot establish a speed improvement.

Candidate validation: one runtime-line substitution, no net source LOC, compiler
pass or semantic/runtime concept. The extended owned-row fixture changes a DOM
attribute externally before list loading while its logical field stays unchanged;
both released and candidate runtimes restore the current item value. Delayed
updates, repeated item/state/ref handlers and cloned ID/IDREF/state checks pass.
Full check/384 tests plus project journey and package smokes pass. Project output
cost is +16 raw / +7 local aggregate gzip bytes across the same 42 files; the
static route stays zero-JS. Adoption is still pending the frozen comparison.

Pinned candidate `44a87cc` passes six further C2 journeys with `--list-attrs-writes`.
Every marked profile now has 3,008 initial operations (2,006 equal, 1,002 changed)
and 14,039 full-journey operations (4,008 equal, 10,031 changed). Exactly 2,000
same-value initial list attribute calls disappear; changed writes are unchanged.
Other emitted modules and HTML match the released baseline. This validates the
removed work, not speed; the uninstrumented hosted gate still decides adoption.

## Hosted outcome: rejected

Run [40450942360](https://github.com/kudzujs/kudzu/actions/runs/40450942360),
harness `6e17b73`, candidate `44a87cc`: full checks, both delayed/lifetime arms,
42 uninstrumented and six traced complete C2 journeys pass. Initial-DOM medians
are 325.1/315.0 ms (−3.11%), paired median −8.1 ms, 14/21 faster. Both the >=5%
and >=16/21 gates fail: **reject** without reruns or relaxation. No operation
meets the regression gate. Script CPU 101.581/98.615 ms, paired −2.978 ms,
15/21 faster is secondary. Removing 2,000 calls is not sufficient adoption proof.

C2 JS costs +8 raw/+3 level-9 gzip bytes (43,267/16,343 → 43,275/16,346).
HTML is byte-identical. Build medians are 736.731/725.738 ms. Host: AMD EPYC
7763 (four logical CPUs), Linux 6.17.0-1022-azure x64, Node 24.21.0,
Chrome 155.0.8059.39. Compare arms within this run, not previous hosts.

Restore list runtime and exact project output contract byte-for-byte to v0.17.6.
The external pre-load DOM attribute recovery fixture stays. Restored full check,
384 tests plus project journey and both package smokes pass. Production semantic
primitives, compiler passes/LOC, runtime concepts and browser-byte deltas are zero.
No release/tag/publication/deployment follows this rejected trial.
