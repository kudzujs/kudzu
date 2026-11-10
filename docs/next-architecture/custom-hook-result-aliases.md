# Custom Hook Result Aliases

## Scope

User-requested component/hook composition improvement, independently reduced
from Actual's pinned consumer alias sites listed in the fixture README. This
bounded compiler task does not replace the separately queued original
SharedWorker coordination intake or claim support for Actual's query packages.

The first failing fixture is `test/fixtures/custom-hook-alias`: the existing
compiler rejects `data: payees` before build evaluation. Native behavior cannot
express a source binding alias; existing SignalIR and handler specialization can.

## Implementation

Keep exported hook field identity separate from consumer-local names. Register
existing state/setter pairs under their local names and substitute callback
captures using the existing clone helper. Preserve callback-local declarations
and reconnect cloned AST parents before native capture analysis. No pass,
semantic primitive, browser runtime, public adapter or dependency is added.

Only ordinary zero-argument relative hooks with existing direct shorthand returns
are extended. State/setter pairs still must be selected together. Defaults, rest,
computed/string keys, duplicate field selections, and Context/private-timer
result aliases remain diagnosed. Returned callback wrappers and parameterized
query hooks are not included in this packet.

## Acceptance

- Two calls to one hook own independent state under different local names.
- Aliased setters and directly bound returned callbacks read latest values.
- Component and callback locals with the original field name stay independent.
- Static sibling emits no JavaScript.
- Alias and manually renamed canonical forms emit identical deploy files.
- Negative neighboring syntax retains source diagnostics.

The initial fixture mistakenly wrapped a returned callback in an inline call;
that independently unsupported shape failed with a nonserializable capture and
was reduced to the existing direct handler binding before alias acceptance.
The local-shadow probe then exposed malformed cloned callback capture output;
lexical substitution and parent restoration fix it without a new handler path.

## Validation and accounting (2026-11-09)

`npm run check` passes (260 pages), `npm test` passes the project journey and
398 other tests with zero skips, and both package smokes pass. One new fixture
has two routes; the prior alias-negative fixture now rejects alias defaults.
Six generated negative forms retain diagnostics, and the canonical-output test
requires exact file/hash equality rather than a size-only comparison.

Semantic primitives +0; core passes +0; source compiler net LOC +7 (15 added,
8 removed); browser runtime source and concepts +0. The connected two-call fixture
ships 5 JS files / 5,001 raw / 2,589 aggregate gzip bytes, with zero JS on its static
sibling. Equivalent alias/canonical deploy delta is zero bytes. No latency or
startup timing benchmark ran, and no performance improvement is claimed.
Core/generator versions remain 0.17.9/0.1.170; this work is not yet released.

## Capture-avoiding continuation (2026-11-10)

The next real failure occurs when a consumer aliases `data` to `payees` but a
returned callback already declares `const payees`. Plain substitution captures
the state reference under that local binding. The added browser assertion fails
before the fix, even though the earlier source-name-shadow assertion passed.

The shared clone helper now uses the existing binding index for function roots.
Only local bindings colliding with replacement identifier names receive fresh,
deterministic compiler names. Binding identity preserves separate nested scopes;
object shorthand keys and destructuring keys/default assignments retain their
authored meaning. Fresh names also avoid authored compiler-looking identifiers.
No new pass, runtime concept, semantic primitive or dependency is introduced.

The connected browser fixture covers destination-name locals, nested parameters,
object destructuring/shorthand, setter-name collisions, loop/catch bindings and
destructuring assignment defaults while preserving the independent second hook.
The original alias/canonical exact-output assertion remains. The additional
collision comparison initially failed byte equality because esbuild chose a
different one-letter function name. Both emitted handlers now execute against
state 3 and must produce 5; each is 69 raw / 80 gzip B. HTML, runtime and entry
files are byte-identical. No equivalence is inferred from size alone.

Source compiler net LOC is now +37 relative to 0.17.9 (+30 for this continuation).
The expanded fixture still uses 5 JS files, now 5,555 raw / 2,790 aggregate gzip B
(+554 / +201 for five additional exercised callbacks). These are added test
behaviors, not compiler overhead measurements. The static sibling remains zero JS.
Final check/build (260 pages), all 399 tests without skips and package smokes pass.
Timing remains unmeasured. The combined packet is accepted for core 0.17.10 and
generator 0.1.171. Final version-aligned check/build (261 pages), all 399 tests
without skips and package smokes pass; hosted exact-commit CI gates publication.
