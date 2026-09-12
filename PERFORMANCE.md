# Performance Records

## 0.16.32 Release Transaction

The user separately authorizes committing and pushing this session's changes,
exact-commit CI, immutable `v0.16.32` tagging and the GitHub release. The existing
protected npm workflow publishes the matching core version after normal environment
approval. Generator 0.1.155 is already published and its compatible `^0.16.30` core
range needs no change. No AI-tooling worktree changes are included.

Earlier candidate/no-release statements retain their measurement-session meaning.
The 0.16.31 review is carried into 0.16.32 without a separate 0.16.31 publication.
Only measured byte reductions are claimed; the AI and 1.0 gates remain blocked.
The exact pushed commit must pass the Linux required-Chrome CI job before tagging;
local macOS skips do not satisfy it. CI and publication receipts remain attached
to the exact GitHub commit, tag and release rather than being predicted here.

Release-metadata verification reruns check (230 pages), fresh packed-package smoke
and whitespace validation successfully. The inspected core dry-run manifest has
60 files, 202,111 packed / 998,832 unpacked bytes and integrity
`sha512-KTTACCL1Z/GkrnmuRCWMI/8+0Mmz59+GEyYZm5L37B1aFSoOMSiIBFr5F7KZw0QeI1tM8r/hSD76MWQdwWWAuQ==`.
The source/test implementation is unchanged from the complete local suite below.

## 0.16.32 Conditional State Exclusion (2026-09-12, candidate)

The user-authorized next framework patch carries the unreleased 0.16.31 preparation
forward. Baseline production source is `f1ef2b0` (0.16.30); the 0.16.31 preparation
changes no compiler/runtime source. Before implementation, the existing imported
article search fails an added artifact assertion: its two conditions own no state,
yet binding ESM ships `structuredClone` and branch-owned state release machinery.

The planner projects existing validated `condition.owned` entries across every
record in a runtime family. `bindings.conditionState` is an internal exclusion
fact, not new state semantics. Literal codegen defines erase unused mount, update,
unmount and state-release calls; both truthy/falsy state owners and mixed navigation
families retain the existing implementation. Generic source retains behavior unless
the define is explicitly false. No authored source or framework comparison input
changes. Static siblings remain JavaScript-free.

Same-host before/after artifact measurements (macOS arm64, Node v25.6.1, npm
11.18.0, Chrome 152.0.7977.83; existing locked dependencies):

| Fixture JS graph | Before raw / gzip B | Candidate raw / gzip B | Delta raw / gzip B |
|---|---:|---:|---:|
| Imported article search | 30,383 / 11,467 | 30,049 / 11,348 | -334 / -119 |
| All-property bindings | 10,714 / 4,774 | 10,491 / 4,681 | -223 / -93 |
| Stateless conditionals | 13,636 / 5,855 | 13,300 / 5,735 | -336 / -120 |
| Non-keyed child state (positive control) | 17,547 / 8,226 | 17,547 / 8,227 | 0 / +1 |
| Project application | 126,006 / 46,620 | 125,004 / 46,261 | -1,002 / -359 |

Raw/gzip are sums over emitted JS files, not network transfer. Search's four
equivalent source forms pass browser identity, empty/restore and error checks,
each with eight JS files and runtime digest
`bf15727925cf17e6ff410d0b50b0111a9166fae2566e59484c8b4d8007bd4898`.
The positive control preserves raw bytes and browser state reset/remount behavior,
not byte-identical code: an attempted runtime-hash equality check failed, so that
claim is explicitly rejected. Family identifiers change with the new fact, and
minified runtime hashes change even for the stateful control; gzip grows by one byte.
Project retains 42 deploy files, drops from 191,855 to 190,853 raw deploy bytes,
and has deploy digest
`6f2e9c3ff93db0b207c337c1416a9cd99592d2e6694ecc10be5bb7499d7654a9`.
Its exact fixture output baseline is updated; historical reports are preserved.

Evidence scripts and before/after file-size/hash inventories are local under
`/var/folders/bt/3r_ntp5x65j81brs6_p93rl00000gn/T/opencode/condition-state-{measure,report}.mjs`
and `condition-state-{before,after}.json`. The focused eight checks pass, including
the previously failing exclusion and object-state remount browser control. New
semantic primitives/passes/runtime concepts/dependencies: zero; core planner/codegen
growth: three net physical lines; runtime source growth: zero. No latency, build
speed, memory, AI-cost or cross-framework superiority measurement is claimed.
Final local gates on the 0.16.32 versioned tree: `npm run check` passes (230 pages,
two interactive); macOS Chrome `npm test` passes standalone 1/1 plus 325 suite
tests, zero failures and five Linux-only smoke skips; `npm run test:package`
passes the fresh three-page packed consumer; `git diff --check` passes. The
Project connected ownership journey passes its updated exact output baseline.
No test runner, browser tool, diagnostic output, CLI, generator, AI protocol or
agent context changed. Required no-skip Linux Chrome verification and publication
remain pending. Subsequent edits only record these verification results.

## 0.16.31 Offline Cost Review (2026-09-12, candidate)

This user-authorized patch reconciles current delivery status and selects the next
trace investigation. It uses the tracked R16/R17 reports below, not newly inspected
raw attempts: `test-results/ai-delivery-production/` is absent in this checkout.
No model call, historical rescoring, command replay or new cost measurement ran.

R16 records the following scheduled-token decomposition, including failed attempts:

| Phase | Kudzu tokens | React tokens | Kudzu minus React | Share of total gap |
|---|---:|---:|---:|---:|
| Before first build | 669,707 | 421,909 | 247,798 | 51.90% |
| First build | 117,004 | 93,689 | 23,315 | 4.88% |
| After first build | 809,348 | 602,976 | 206,372 | 43.22% |
| Total | 1,596,059 | 1,118,574 | 477,485 | 100.00% |

Each column sums to the previously recorded total; gap shares divide each phase
difference by 477,485. These are scheduled-token differences, not success-normalized
phase costs: R16 has five Kudzu successes and four React successes. Its recorded
failure-inclusive tokens per success remain 319,211.8 versus 279,643.5 (+14.15%).

**Selected investigation: pre-first-build source discovery.** This phase contributes
the largest recorded gap (51.90%). Post-build work is still Kudzu's largest absolute
phase (50.71% of its tokens), but that does not make it the largest comparative gap.
The aggregates do not isolate useful reading, repeated inventory, implementation,
or cache effects; they cannot justify shortening context or changing a compiler.
R16 role-only adoption remains 0/10, and five exact-name failures remain recorded.
R17's scorer defect prevents a fair three-way success-cost ranking; the 15/15
unchanged-artifact replay does not replace its original scores or prove AI savings.

### Exact Continuation Contract

1. Recover `role-only-r16-20260911-audited.tar.gz` from the existing evidence archive
   and verify its recorded SHA-256
   `c8dbd8880124c9a64ca2b437a62300bd608ff08767778897eba7ad1cee1495ad` before extraction.
   Keep frozen protocols, traces and scores immutable.
2. Review all ten attempts through their first model build. Record command/stream
   references, repeated paths and retained usage accounting. Separate necessary
   source discovery from repeated inventory and implementation; do not assign
   model-step token totals to individual shell commands without attributable data.
3. Select one repeated avoidable operation only if traces establish it. Reuse the
   existing tools and replay real commands offline with unchanged assertions.
   Record response bytes and errors separately from unmeasured model-token savings.
   If evidence does not establish a correction, close the review without a tool change.
4. Before any new model schedule, separately authorize and freeze R18 with the
   corrected visibility scorer, equal public tools/docs, exact package/model/toolchain
   hashes and unchanged acceptance/budget requirements. Existing future R18 inputs
   are not a measured schedule and do not automatically include core 0.16.31.

Semantic primitives, core passes/LOC, runtime concepts, dependencies, source support
and browser capability changes: zero. No fixture behavior changes; deploy hashes,
browser-byte and timing deltas have not been remeasured for this documentation packet.
Local validation and publication status are recorded separately; 1.0 remains blocked.

### Session Ownership And Local Validation (2026-09-12)

The user assigns compiler/runtime correctness, React-shaped source preservation,
browser bytes, build/interaction performance, memory and lifecycle work to this
session. AI authoring support belongs to the separate `kudzu-ai-tooling` worktree,
branch `feat/ai-authoring-support`, including the pre-first-build investigation
above. That investigation is a handoff, not authorization for this session to
change agent instructions, supplied context or tool observations.

Generator, common CLI, diagnostic output, test-tool and AI benchmark protocol
changes require scope coordination before editing, even across different files.
Keep existing experiment inputs/results immutable and report framework-output
effects separately from model/harness effects. Matched behavior, accessibility,
source abstraction and environment are prerequisites for competitive claims.

Local verification on macOS with Node v25.6.1:

- Initial `npm run check` fails because existing fixture package dependencies are
  missing. `npm ci --no-audit --no-fund` restores the locked dependencies; check
  then passes with 230 pages and two interactive pages.
- `KUDZU_REQUIRE_CHROME=1 npm test` passes the standalone ownership test, then
  reports 323 passes and two failures: acceptance cannot discover the macOS Chrome
  path, and browser-smoke tests explicitly require Linux. These failures remain
  part of this packet; they are not compiler regressions or passed release gates.
- `CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test`
  passes standalone 1/1 and 324 suite tests, with zero failures and five explicit
  Linux-only skips. The required no-skip Linux Chrome gate remains pending.
- `npm run test:package` passes a fresh packed-core installation and three-page
  consumer build with one interactive route. `git diff --check` passes.
- The four existing imported-search source forms pass browser behavior, retained
  row identity, release/re-entry, negative source boundaries and static exclusion.
  Each emits eight JS files, 30,383 raw / 11,467 aggregate gzip bytes, runtime digest
  `057b868606188d72dd2bcd88cfabd9157d03d3fb43245345f00a338501816003`.
  This is a local baseline, not a paired optimization result. Historical 0.16.30
  records remain 30,383 / 11,466; no cross-environment gzip or latency win is claimed.

The next framework investigation starts with those existing search forms and the
binding/runtime-family output, preserving their ordinary declarative TSX. Owners
are `framework/binding-runtime.js`, `framework/compiler/runtime-codegen.mjs`, and
the capability/family planners. Source inspection alone establishes no new unused
capability or performance defect; first prove one with an executable fixture and
before/after artifacts before selecting a code change. Preserve generic helper
behavior, shared-family unions, keyed identity, cleanup and zero-JS static siblings.
Any affected test-tool change is coordinated first; do not silently add it to this
documentation packet. Publication of 0.16.31 remains pending.

## 0.16.30 Release Scope

Binding target specialization ships as core 0.16.30 and generator 0.1.155. The
following no-version/no-release measurement statements retain their session
meaning. This release claims the measured output reduction, not new AI-cost,
browser-latency or cross-framework superiority. Raw measurements remain outside
the package and the existing failed/unfinished delivery gates remain blocked.

The release tree passes check (230 pages), default-parallel required-Chrome tests
(standalone 1/1 plus 329/329, no skips), package smoke and both package dry runs.

## Binding Target Exclusion (2026-09-11, after 0.16.29)

The imported-search fixture uses only value and text bindings, but still shipped
class/disabled/checked patching, general-attribute decoding and selectors for
every property. Its new exclusion assertion fails before the change. Existing
RouteIR binding targets now determine a runtime family's property set and generic
attribute use. Codegen narrows selectors and erases unused handling; text-only
families skip element selector scans. Any shared owner retains its needed target,
including ARIA/data attributes and navigation. Uncompiled helper calls retain the
generic fallback unless a capability is explicitly false.

| JavaScript graph | 0.16.29 raw / gzip B | Candidate raw / gzip B |
|---|---:|---:|
| Imported article search, all four source forms | 30,988 / 11,705 | 30,383 / 11,466 |
| Every-property positive control | 10,714 / 4,765 | 10,714 / 4,765 |
| Conditional ownership fixture | 13,673 / 5,869 | 13,636 / 5,836 |

Search removes 605 raw / 239 aggregate gzip bytes and scans one native property
instead of five plus generic attributes. An intermediate literal full-selector
expansion grew the all-property control by 69 raw bytes; retaining the existing
generic selector in that case removes that regression. The initial new flags
also disabled direct uncompiled helper calls; the existing helper regression
caught it, and the final explicit-false guard preserves those calls. Neither
intermediate candidate is represented as the final result.

Project deploy output remains 42 files and drops 193,076 → 191,855 raw bytes.
The measured output baseline is updated, including the intentional family-ID
changes; `/help` remains zero JavaScript. Evidence, complete file digests and
commands are in `test-results/ai-delivery-production/binding-target-exclusion-20260911/`.
The interrupted first test run ends with one cancelled test file; the resumed
default-parallel required-Chrome suite and package smoke pass. No provider call,
version bump, release or actual AI-token/latency improvement is claimed. This
reuses existing passes and semantics; internal capability facts/codegen defines
are not new runtime concepts or public APIs.

Final validation: `npm run check` passes; resumed `KUDZU_REQUIRE_CHROME=1 npm test`
passes standalone 1/1 plus 329/329 with zero skips; package smoke passes. Core
compiler growth is 19 lines across existing planner/codegen files; runtime source
line count is unchanged. Generated family identifiers change intentionally with
the additional specialization facts. No timing or AI-cost delta was measured.

## 0.16.29 Release Scope

The accumulated unused-style and unused-conditional runtime exclusions ship as
core 0.16.29 with generator 0.1.154. Earlier no-release statements describe their
measurement sessions, not the later release transaction. Repository-only browser
observation/targeting work, Astro comparison readiness and future r18 visibility
acceptance are included in source/test history but not the core npm payload.
Historical raw attempts and scores remain unchanged; smaller deploy artifacts
do not establish AI-cost or latency superiority. All raw `test-results` stay
outside the release commit and npm package.

The exact 0.16.29 release tree passes default-parallel required-Chrome `npm test`
(standalone 1/1 plus 328/328, no skips), check (229 pages), package smoke and both
pack dry runs. Earlier parallel browser-tool failures remain in their original
records; the passing release run does not claim that their underlying readiness
race was fixed. Core tarball contents remain limited to the installed product.

## Unused Conditional Runtime Exclusion (2026-09-11)

The maintained `bindings` fixture has no RouteIR conditions but previously ships
conditional template scanning, branch cloning/state ownership and condition
registries. Its new absence assertion fails before the optimization. Existing
condition records now drive an internal runtime-family `bindings.conditions`
flag. Generated code removes unused registries, mount/unmount hooks and condition
commit/release work through the existing esbuild define specialization path.
Families containing any conditional owner retain the full behavior, including
navigation; no new primitive, pass, dependency or runtime concept is introduced.

| Same-source JavaScript | Before raw / gzip B | After raw / gzip B |
|---|---:|---:|
| Attribute/text bindings without structural branches | 12,113 / 5,180 | 10,714 / 4,765 |
| Search with empty-result branch | 30,988 / 11,704 | 30,988 / 11,705 |
| Conditional ownership positive fixture | 13,673 / 5,869 | 13,673 / 5,869 |

The first row removes 1,399 raw / 415 gzip B. The one-byte search gzip change is
from changed family identifiers/code encoding, not an added browser capability.
The Project app still requires conditions and retains its 42 files / 193,076 raw
bytes; its digest changes to
`4500c7e62447e94ddb51bf6badb0a033ed96b0d0b368fef6679f72507a24b9d6`
because the family capability record/hash changes. That intentional digest is
updated without weakening the exact output checks.

Focused planner and binding/conditional behavior tests pass, as does check.
Two default-parallel required-Chrome full runs pass the standalone ownership
test and all compiler cases but fail different browser-smoke tests: first an
empty initial text observation (0 instead of 4,000 characters), then an empty
CLI response parsed as JSON. These use plain HTML, not Kudzu-generated runtime.
The unchanged complete suite passes 328/328 with Chrome required and file-level
concurrency 1, followed by package smoke. Parallel-suite reliability is not
claimed fixed. Both failed logs and the serial success are retained under
`test-results/conditional-runtime-exclusion-20260911/`, with exact commands,
timestamps and before/after file manifests. No test behavior or browser checks
are skipped beyond the normal separately executed ownership-test split.

No provider call, AI-cost improvement, latency/build-speed claim or release is
made. These are measured production output savings and fewer unused runtime
operations, not proof of cross-framework performance superiority.

## Unused Binding Style Exclusion (2026-09-11)

Authorizing output: the imported article-search fixture and retained R17 Kudzu
Content source emit `kudzu-style.js` despite having no style bindings. The new
absence assertion fails before this patch. Existing RouteIR binding targets now
produce an internal `bindings.style` specialization flag; a runtime family with
no such target omits the style import/patch branch and serializer file. List
style usage independently retains the file. Mixed-family and navigation codegen
tests retain style whenever any owner requires it. No authored source rewrite,
semantic primitive, pass, runtime concept, dependency or new public API is added.
Production compiler/orchestration growth is six net lines across three files.

| Same-source JavaScript graph | Before raw / gzip B | After raw / gzip B | Files |
|---|---:|---:|---:|
| Imported article search | 32,190 / 12,324 | 30,988 / 11,704 | 9 → 8 |
| Retained full Content source | 34,908 / 13,677 | 33,706 / 13,058 | 9 → 8 |
| Dynamic-style positive control | 12,113 / 5,180 | 12,113 / 5,180 | 5 → 5 |

The omitted serializer is 1,063 raw / 586 gzip bytes; the omitted binding branch
accounts for additional savings. Search gzip falls 5.03%, full Content 4.53%.
The dynamic-style serializer contents remain byte-identical. Runtime family IDs
change because the capability record now includes the style flag; these URL/hash
changes are intentional, not a promise that every unaffected HTML byte is fixed.

The Project application drops three unneeded family serializer files: deploy
45 → 42 files, 196,678 → 193,076 raw bytes, 60,879 → 59,026 aggregate gzip bytes.
Its executable output baseline is updated only after reproducing the exact new
manifest; `/help` remains zero-JavaScript. The first full gate stops at that old
baseline, then passes after recording the intentional reduction. Required-Chrome
verification passes standalone 1/1 plus 327/327 with no skips, including dynamic
styles, keyed list styles, navigation and resource ownership. Check and package
smoke pass. Full retained Content acceptance also passes all ten static siblings,
search/count/empty/restore behavior and the existing accessibility/browser checks.

Evidence: `test-results/style-binding-exclusion-20260911/{before,after,project}.json`,
reproducible measurement scripts, full test logs and Content acceptance outputs.
The first full-source replay lacked an installed core under its own package
boundary and failed module resolution; the successful replay explicitly links
the current checkout before building. This is a no-model compiler replay, not an
AI-delivery attempt. No browser-latency/build-time/AI-token improvement is claimed
without new matched timing; no provider calls, version bump or release occurred.

## CONTENT R17 Three-Way Measurement (2026-09-11)

One fifteen-attempt schedule (five each Kudzu, React/Vite and Astro) completed
02:35:28.453Z–03:06:43.779Z, 31m 15.326s. All three root TypeScript versions are
6.0.3 and their starters install/typecheck/build before provider calls. Astro
7.0.2 also uses @astrojs/check 0.9.10. Kudzu uses the exact immutable R15 package;
all three receive identical current browser utilities and documentation. The
pinned model is `openai/gpt-5.6-sol`, OpenCode 1.18.27, and budgets are unchanged.
The initial input validation exposes the runner's remaining exact-two guard;
it is corrected with a failing regression before any model call, then inputs
are refrozen. Duplicate comparator IDs and unequal schedules still fail.

**R17 cannot establish a fair ranking:** the frozen Content scorer counts hidden
cards as results. All five Astro agents implement native hiding, and therefore
receive false behavior failures despite rendering the requested filtered rows.
Original scored outcomes remain 5/5, 5/5, 0/5. After a regression-led correction,
a separate no-model replay of unchanged artifacts passes 15/15, including ten
static siblings for each Kudzu/Astro attempt. Neither the replay nor this note
replaces the original protocol, attempt statuses, command logs or denominators.

| Recorded metric, all five attempts | Kudzu | React + Vite | Astro |
|---|---:|---:|---:|
| Uncached input | 246,422 | 153,944 | 162,957 |
| Cache-read input | 1,411,968 | 855,296 | 1,128,960 |
| Output / reasoning | 14,607 / 2,475 | 11,967 / 1,714 | 16,207 / 5,492 |
| Total tokens | 1,675,472 | 1,022,921 | 1,313,616 |
| Tokens per scheduled attempt | 335,094.4 | 204,584.2 | 262,723.2 |
| Median elapsed ms | 133,577 | 89,978 | 138,905 |
| Median normalized tools | 28 | 20 | 26 |
| Model builds / corrections | 7 / 2 | 9 / 4 | 10 / 5 |
| Clean smoke calls | 6/9 | 6/8 | 6/10 |
| Median deploy raw / aggregate gzip B | 68,461 / 26,417 | 206,365 / 66,405 | 55,510 / 22,453 |

All traces are complete, all budgets and final builds pass. Recorded scheduled
usage is 4,012,009 tokens, plus a separately recorded 6,727-token availability
probe. Cache writes and reported subscription dollars are zero, not free work.
Kudzu's scheduled tokens are 63.79% above React and 27.55% above Astro. These are
actual usage observations, not a causal optimization claim; do not substitute
per-attempt cost for the unavailable fair Astro success-cost comparison under
the flawed original scorer. Multiple changes, small samples and runtime/toolchain
differences limit historical comparisons. Astro's allowed native script and
React's client runtime are not penalized merely for differing from Kudzu.

The correction checks title visibility rather than DOM membership, preserving
hidden ancestor/CSS/restore behavior while still counting visually stale rows
hidden only via ARIA. It applies equally to every framework. Future-only r18
tracked protocols explicitly communicate this boundary and pin corrected hashes;
they retain their previous package inputs and do not represent another measured
three-way batch. Source labels, count wording, static exclusions, budgets and
other acceptance conditions are not relaxed. The initial hand-authored Astro
smoke detached rows, so it missed the hiding case; the regression now covers it.

Evidence: `test-results/ai-delivery-production/three-way-r17-20260911/` retains
frozen inputs, pre-provider validation failure/correction, package/version
checks, fifteen traces, ninety streams, 225 artifacts, ninety copied-context
integrity checks, `audit.json` and a separately labeled `revalidation.json`.
No additional model batch, compiler optimization, package release or superiority
claim follows this measurement. AI-cost and full-suite/1.0 goals remain unmet.

Final gates pass sequentially: `npm run check`, required-Chrome standalone 1/1
plus 326/326 tests without skips, and package smoke. Receipts and raw test logs
are preserved in the R17 evidence directory. Root runtime/compiler sources and
package version remain unchanged; only comparison infrastructure and future
acceptance inputs are corrected.

## Astro Comparison Readiness (2026-09-11, no model calls)

Added an ordinary Astro Content starter with the existing six-article data and
CSS byte-for-byte, eleven static routes, native navigation, components and slots.
Search is deliberately absent from the model starter. Astro 7.0.2 and its checker
0.9.10 are locked. Installation initially rejects TypeScript 7.0.2 because the
checker declares TypeScript 5/6 peers; the validated starter uses 6.0.3 without
force/legacy-peer flags. This differs from the current React/Kudzu starter's
typechecker and must be explicitly resolved or frozen before a fair new trial.

`node test/astro-content-smoke.mjs` validates static starter output and a separate
temporary native-script search implementation, using the unchanged common
behavior, accessibility and browser scorer plus all ten static-sibling checks.
An injected static-sibling script is rejected. This checks comparator readiness,
not AI delivery success, complete accessibility certification or timing parity.

Two real harness defects are reproduced before correction: the suite summary
silently omits a third comparator, and source retention includes Astro-generated
`.astro` scratch. The summary now derives comparator IDs from recorded runs and
marks missing cross-task coverage incomplete with unavailable aggregate costs.
Only root `.astro` scratch is excluded; authored `src/*.astro` remains retained.
Old protocol files and archived scores are not updated or reinterpreted. No new
framework dependency or compiler/runtime behavior is introduced; Astro's packages
are isolated comparison-fixture dependencies. No model calls or cost/speed win
is claimed. The fixed runner requires a new frozen hash for any future trial.

Validation passes: nine focused comparison/protocol/retention tests; the Astro
smoke with both positive and static-script negative controls; `npm run check`
(228 pages); required-Chrome standalone 1/1 plus 325/325 tests without skips;
package smoke and whitespace checks. The standalone Astro build has zero type
errors, warnings or hints. Its smoke is opt-in after installing the isolated
lockfile; normal repository tests validate input parity and aggregation without
installing Astro. No framework release/version or historical result changes.

## Default AX Summary Deduplication (2026-09-11, offline)

The existing browser smoke response repeated visible prose in both `text` and
named `StaticText`/`InlineTextBox` entries. The default observation now omits only
those text-node entries whose entire untruncated name already occurs in the
returned bounded body text, reporting `duplicateTextEntriesOmitted`. Control,
heading and landmark names remain; text outside the 4,000-character body bound
remains eligible for the AX summary. Live target lookup still uses the full AX
tree, and every action/assertion/error check runs unchanged. This is an explicitly
filtered summary, not a lossless complete accessibility-tree export.

Actual offline Chrome replay of unchanged successful R16 command sequences:

| Source | Prior response bytes | New response bytes | Reduction |
|---|---:|---:|---:|
| Kudzu ordinal 1 | 14,601 | 7,035 | 51.82% |
| React ordinal 1 | 18,968 | 9,323 | 50.85% |

Each sequence retains seven text checks plus its inputs. Expanded observation
references retain identical body text/truncation, command results and final error
report; previously observed non-text-node AX names are retained. A regression
fails before the implementation and passes afterward, covering 70 prose nodes,
controls, heading names, and text outside the body bound. Evidence and stream
hashes: `test-results/ai-delivery-production/ax-summary-20260911/replay.mjs` and
`results.json`. No provider/model calls or historical rescoring occurred. Output
bytes are not model tokens; actual failure-inclusive cost savings remain
unmeasured. No compiler, runtime, dependency, public framework API or deploy-byte
change is involved. The new summary needs newly frozen tool hashes in any future
experiment; old input copies remain untouched.

Validation: focused lifecycle/protocol/copy/browser tests pass 13/13; check passes
228 pages. The first full test run fails four legacy browser fixtures after
receiving nginx's HTTP-on-HTTPS error page instead of fixture content. With no
source change, the repeated required-Chrome run passes standalone 1/1 plus
322/322 without skips; package smoke and diff whitespace checks also pass.
This environment/port-ownership failure is recorded, not claimed fixed by AX
summary filtering. Imported-search runtime bytes and digest remain unchanged.

## CONTENT R16: Explicit Role Selection (2026-09-11)

One predeclared serial ten-attempt experiment completed in 22m 1.356s,
00:38:35.084Z–01:00:36.440Z. It reuses the exact immutable R15 application
tarball and starters, model `openai/gpt-5.6-sol`, OpenCode `1.18.27`, budgets,
adapter and scorer. Only the equally supplied browser utility and documentation
change for optional exact-name/unique-role selection and actionability checks.
Lifecycle, protocol, browser and copied-context tests and frozen input validation
passed before provider calls. No attempt was replaced or retried.

| Failure-inclusive metric | Kudzu | React + Vite |
|---|---:|---:|
| Successes | 5/5 | 4/5 |
| Final build and acceptance | 5/5 | 5/5 |
| Total tokens | 1,596,059 | 1,118,574 |
| Tokens per success | 319,211.8 | 279,643.5 |
| Uncached / cache-read input | 258,509 / 1,320,448 | 172,753 / 930,048 |
| Output / reasoning | 14,591 / 2,511 | 13,164 / 2,609 |
| Median elapsed ms | 131,719 | 106,333 |
| Median tools | 26 | 24 |
| Pre / first-build / post tokens | 669,707 / 117,004 / 809,348 | 421,909 / 93,689 / 602,976 |
| Model builds / corrections | 8 / 3 | 7 / 2 |
| Clean smoke invocations | 5/8 | 7/9 |

React ordinal 0 reads 24 paths against the unchanged 20-path budget. Its 229,894
tokens remain charged. All traces are complete; cache writes and reported
subscription dollars are zero, not zero economic cost. A separate availability
probe costs 6,727 tokens; total recorded usage is 2,721,360 tokens.

All agents execute native input (21 fills per framework, no clicks). No role-only
command is observed: **0/10 adoption** despite identical supplied documentation.
Five exact-name failures remain (K0/K2/K4 and R0/R3); final sources and builds are
corrected within those attempts. Thus offline role-only feasibility is not an
observed reduction in authored repair work. The utility does not silently relax
provided names. Browser smoke is not full keyboard/screen-reader certification.

Kudzu uses **14.15% more tokens per accepted task**, and 42.69% more total tokens
for the scheduled five attempts. Its total is 3.41% below historical R15, while
React is 19.24% below R15. Small samples and provider/cache/time variation do not
establish causal savings. The cost objective and the full-suite/1.0 gates remain
unmet. Do not add implicit fuzzy targeting or rescore failures to obtain a win.

Evidence: `test-results/ai-delivery-production/role-only-r16-20260911/`, with
`experiment.mjs`, `freeze.json`, `preregistration.json`, frozen utility/protocol
copies, `candidate.tgz`, all ten attempt sources/traces/artifacts, `audit.json`
and `review.json`. Audit checks 60 command streams, 170 artifacts, 165 source
files, 60 copied-context hashes and 86 backward observation references. This
measurement changes no compiler, runtime, package version, scorer or budget.

Final sequential gates pass: `npm run check`, `KUDZU_REQUIRE_CHROME=1 npm test`
(standalone 1/1 plus 321/321, no skips), and `npm run test:package`. The four
imported-search fixtures retain 32,190 raw / 12,324 gzip JavaScript bytes and
runtime digest `f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Receipts and stdout/stderr are retained beside the experiment. No release or
additional model batch follows this result.

R16 archive: `role-only-r16-20260911-audited.tar.gz`, 1,741,864 B, SHA-256
`c8dbd8880124c9a64ca2b437a62300bd608ff08767778897eba7ad1cee1495ad`.
All 498 extracted files match the source manifest/content. Initial `tar --diff`
reported intentionally normalized metadata differences; extracted SHA-256 and
byte comparisons subsequently pass. This checksum closure is external to the
archive to avoid self-referential hashing.

Latest focused evidence: R16 records 5/5 Kudzu versus 4/5 React with Kudzu tokens per accepted task 14.15% higher. R17 adds three-way Content observations but its original visibility scorer cannot support a fair ranking; corrected unchanged-artifact replay is separate evidence. The next offline review is recorded in the 0.16.31 packet above. Objective unmet; model calls stopped.

Reproducibility classes: `npm run benchmark`, `npm run benchmark:keyed`, `npm run benchmark:native`, `npm run benchmark:module-cache`, `npm run benchmark:project-navigation`, `npm run benchmark:project-state`, `npm run benchmark:source-scale`, `npm run benchmark:ai-delivery`, and `npm run benchmark:ai-delivery-production` are maintained in this repository; `npm run benchmark:commerce` is a maintained paired runner over the public external storefront; older excluded-workspace sections are historical provenance only and are not current framework rankings.

## Offline R15 Role-Only Targeting (2026-09-11)

No model/provider calls. R15's eight initial failures were exact-name selector
mismatches, not demonstrated accessibility or compiler defects: Chrome exposed
one `searchbox` named `SEARCH ARTICLES` while commands supplied `Search articles`.
The recorded fixes were CSS changes in K1/K3/R1/R2/R3/R4 and redundant `aria-label`
additions in K0/R0, followed by eight rebuilds. K2/K4 had no initial mismatch.
CSS uppercase labels remain legitimate in the reconstructed accepted applications.

The existing snapshot and bounded candidate hint already support exact-name
discovery. A conventional optional-name role locator removes the need to guess a
name when the caller explicitly wants the unique role. `test/browser-smoke.mjs`
now accepts `{"op":"fill","role":"searchbox","value":"example"}`. Supplied
names, including empty strings and uppercase, remain exact; null/non-string names
fail. No fuzzy matching, fallback, automatic retry or assertion rewriting occurs.
Uniqueness is over the existing non-ignored AX/backend-node candidates, **before**
the disabled check; disabled siblings are not discarded to force uniqueness.
Ambiguity stops before focus/input and retains five-name/160-character diagnostics.
Action checks require supported roles, writable text input/textarea for fill,
visibility, enabled state and focus; click hit testing rejects an obscuring element.
The public utility document applies only to future equal copied inputs; frozen
protocols, prompts, budgets, acceptance and historical scores are untouched.

Evidence: `test-results/ai-delivery-production/role-only-offline-20260911/`.
`replay.mjs` copies the eight final sources into disposable workspaces and reverses
only each trace's post-failure naming correction to reconstruct its original build.
It uses the archived Kudzu installation and offline-cached React dependencies.
Every original exact-name failure reproduces with one uppercase AX searchbox.
Changing only command targeting to omit `name` completes **8/8 sequences, 32 fills,
54 unchanged text assertions, zero failed calls** (Kudzu 3, React 5). Using exact
`SEARCH ARTICLES` also passes all eight sequences without an application edit.
The unchanged frozen acceptance executable independently passes **8/8 original
reconstructions**, including behavior, accessibility and output checks. Source
hashes stay identical throughout each replay. These are counterfactual replays,
not new scored attempts or evidence that an agent would choose this locator.

Measured implementation delta versus the preserved dirty R15 helper: **+6 net
physical lines** (158 to 164). Semantic primitives, core passes/LOC, runtime
concepts and production browser raw/gzip bytes: **0**. Four maintained search
fixtures still emit **32,190 raw / 12,324 gzip B**, runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
All **2,995 regular R15 files** hash-identical before/after replay, including frozen
inputs, traces, source, artifacts and historical integrity records. This is a live
tree count including installation files, not the historical 2,247-file archive count.

Validation, executed sequentially with 1,200,000-ms command limits:

- Required-Chrome browser/lifecycle/frozen-protocol/public-copy checks: **12/12**.
- `npm run check`: pass, 228 pages.
- Required-Chrome `npm test`: final standalone **1/1**, suite **321/321**, zero skips.
  Two earlier full runs each had 320/321: first a transient CDP startup `Invalid URL`
  before a selector assertion; second an unrelated landing-page Chrome dump received
  nginx's HTTP-to-HTTPS-port 400 page. The landing check passed alone, and the third
  full run passed without code changes. These failures remain recorded, not erased;
  the transport helper and framework tests were not changed for this packet.
- `npm run test:package`: pass (three pages, one interactive).

One added browser test covers unique uppercase/unnamed targets, exact wrong casing,
explicit empty names, invalid descriptors/values, unknown click roles, ambiguity
including disabled siblings, hidden/display-none/inert/template exclusion,
disabled/ARIA-disabled/readonly controls, wrong input types and obscured clicks.
Prior compaction, bounded diagnostics, lifecycle and copied-tool integrity tests stay.
Role-only targeting does not verify accessible naming or replace acceptance.
No measured token/cost/latency saving or causal claim: R15 remains 5/5 versus 5/5,
Kudzu **19.30% higher** cost in tokens per accepted task; the 1.0 gate remains blocked.

## CONTENT R15 Observation Reuse (2026-09-10)

Archive closure, recorded outside its own snapshot: **73,331,847 B**, **2,247
manifest files**, SHA-256 `3147eee8fee712ef74a386cef48d399c935d3971548ef1889c8b4014cab7abbc`.
Manifest SHA-256 `059c0be00ee20ec4d1b6bba14b7a051852421eab31c480c03a6aefbbd70ce77b`.
Two deterministic packs match; checksum and extracted/live file hashes pass.
Original R12/R13/R14/offline evidence inventories and prior archive hashes pass.

The separately authorized **single ten-attempt CONTENT schedule is complete**:
Kudzu **5/5**, React + Vite **5/5**, all final builds and unchanged acceptance
passing. No selective retry, interruption, substitution or second batch occurred.
Primary preregistered objective, lower failure-inclusive tokens per accepted task
than contemporaneous React without lower acceptance, is **unmet**. Model calls
have stopped. Full R8 remains 23/25 versus 24/25; this does not clear 1.0.

Evidence: `test-results/ai-delivery-production/observation-reuse-r15-20260910/`.
R15 starts from R13's neutral frozen task, public framework context, scorer,
runner/adapter, React 19.2.8 + Vite 8.2.2 starter, model `openai/gpt-5.6-sol`,
pricing and serial K0,R0,R1,K1,K2,R2,R3,K3,K4,R4 schedule. **R14's failed inventory
policy is excluded**, not adopted as baseline. Both variants receive identical
copies of current non-adjacent observation reuse, transport and public output
instructions. Explicit open/snapshot remains full; bounds/assertions stay intact.

The fresh immutable `0.16.28-observation-reuse.20260910.1` tarball uses current
source, with the unproven README map already removed. Against R13, only README
and isolated package identity differ in packed source; compiler/runtime/bin are
identical. Main stays 0.16.28. npm SHA-512 lock integrity and a separate installed
file-by-file comparison pass; no mutable package link is used. New protocol and
source hashes identify R15, never rewrite R13/R14. The default OpenCode is 1.18.30;
the preserved hash-verified **1.18.27** binary is explicitly used instead, with no
upgrade or configuration change.

Before calls, lifecycle, frozen-protocol, browser and copied-context tests pass
11/11 with zero skips; actual frozen-input validation passes before workspace
creation. The wrapper's TAP-only log-prefix check was corrected for Node's default
reporter before preflight; original script/freeze and correction receipt remain.
No measured input changed. One availability-only probe costs **6,727 tokens** and
6.769 s, separately counted. Serial executor: **05:13:48.967-05:42:51.336 UTC,
29m 2.369s**, with 18,000,000-ms outer timeout. Node 24.14.0, npm 11.9.0,
Chrome 152.0.7977.64 and the recorded Linux i5-9500 host remain unchanged.

Budgets per attempt stay 300,000 ms, 400,000 input tokens **including cache reads**,
20,000 output, 20,000 reasoning, 40 normalized tools, 20 read paths, eight modified
paths and five builds. All pass; K0 input headroom is only 5,369. Setup and agent
browser work are charged; independent final build/acceptance are outside agent time.

| Failure-inclusive metric | Kudzu | React + Vite |
|---|---:|---:|
| Accepted / scheduled | 5/5 | 5/5 |
| Uncached input | 207,914 | 210,153 |
| Cache-read input | 1,426,560 | 1,156,608 |
| Output / reasoning | 15,092 / 2,888 | 15,101 / 3,221 |
| Total tokens | 1,652,454 | 1,385,083 |
| Tokens per accepted task | 330,490.8 | 277,016.6 |
| Median tokens / model steps | 330,998 / 15 | 282,465 / 14 |
| Total model steps | 74 | 72 |
| Median elapsed ms (range) | 169,577 (150,499-202,432) | 177,782 (152,749-185,505) |
| Sum elapsed ms / normalized tools | 847,567 / 145 | 872,914 / 134 |
| Median tools / read paths | 28 / 12 | 26 / 13 |
| Sum read / modified paths | 61 / 10 | 65 / 10 |
| Model builds / corrections | 8 / 3 | 10 / 5 |
| Before / first-build-message / after tokens | 716,244 / 121,544 / 814,666 | 499,624 / 95,614 / 789,845 |
| Browser / native-input adopters | 5 / 5 | 5 / 5 |
| Browser calls / command records | 9 / 75 | 13 / 115 |
| Successful fills / clicks / text checks | 21 / 0 / 38 | 20 / 0 / 58 |
| Clean zero-exit smoke calls | 6/9 | 8/13 |
| All shell zero exits | 14/17 | 18/23 |
| Accepted deploy median raw / aggregate gzip B | 68,628 / 26,445 | 206,471 / 66,413 |

All **3,037,537 scheduled tokens**, or **3,044,264 including preflight**, reconcile
with provider step totals. Cache-write counts and subscription-reported dollars
are zero, not zero economic cost. No usage is missing. Whole first-build message
boundaries partition phases; `audit.json` retains every step and per-phase token
kind, while `attempt-metrics.md` records each attempt's cache/output/reasoning,
time/tools/builds and phase totals. Eight within-attempt corrections remain charged.

| Attempt | Uncached | Cache read | Output | Reasoning | Total tokens | Elapsed ms | Tools | Builds/corrections | Clean smoke |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| K0 | 36,359 | 358,272 | 3,303 | 595 | 398,529 | 171,666 | 33 | 2/1 | 1/2 |
| R0 | 49,873 | 205,568 | 2,791 | 572 | 258,804 | 152,749 | 26 | 2/1 | 1/2 |
| R1 | 48,547 | 207,872 | 2,997 | 605 | 260,021 | 185,505 | 26 | 2/1 | 1/2 |
| K1 | 33,981 | 293,120 | 3,194 | 703 | 330,998 | 169,577 | 28 | 2/1 | 1/2 |
| K2 | 34,572 | 251,904 | 2,640 | 546 | 289,662 | 150,499 | 26 | 1/0 | 1/1 |
| R2 | 29,443 | 250,880 | 2,950 | 632 | 283,905 | 174,723 | 29 | 2/1 | 2/3 |
| R3 | 45,156 | 233,472 | 3,042 | 795 | 282,465 | 182,155 | 27 | 2/1 | 2/3 |
| K3 | 46,358 | 317,568 | 3,273 | 555 | 367,754 | 202,432 | 31 | 2/1 | 1/2 |
| K4 | 56,644 | 205,696 | 2,682 | 489 | 265,511 | 153,393 | 27 | 1/0 | 2/2 |
| R4 | 37,134 | 258,816 | 3,321 | 617 | 299,888 | 177,782 | 26 | 2/1 | 2/3 |

K0/K1/K3 and every React attempt first fail exact AX targeting on `SEARCH ARTICLES`.
K0/R0 add an explicit exact `aria-label`; the other six remove the authored CSS
uppercase transformation, rebuild, and pass. No fuzzy matching or expected-name
relaxation is used. All 14 clean completions have empty exception, failed-request
and HTTP-error lists. There are eight nonzero local smoke calls, zero other failed
shells, and zero final acceptance failures. All agents fill title/topic, empty and
restored states; none clicks a link or independently proves keyboard navigation.
Direct sibling opens and smoke snapshots are not comprehensive accessibility,
screen-reader, mobile or JS-disabled proof. The unchanged scorer supplies only its
bounded behavior/label/heading/output acceptance. Lexical static scans likewise
are not a universal no-JavaScript proof, regardless of agents' broader final prose.

The audit verifies **60 command streams, 170 artifacts, 165 source files and all
60 copied-context checks**. Each attempt changes only article TSX/App and CSS;
ordinary components, hooks, declarative filters, keyed cards, links and live regions
remain. Manifests, locks and other authored files stay intact. Persistent context
tampering is detected; transient write-and-restore remains outside this trusted-local
check. Source diffs and complete command/final-answer records are retained.

Actual browser JSON contains 43/62 direct full-record references, including 10/10
references past a more recent different full observation. Expansion produces
260,775/378,929 B from actual 112,562/174,090 B. Re-encoding those same expanded
records with the preceding adjacent-only rule would produce 134,124/195,484 B:
the new rule removes **42,956 B (13.03%)** across both variants. This is output
serialization accounting, **not token savings**. Each reference has original line,
command, full-observation and expanded-record hashes; explicit snapshots remain
full. Structural expansion plus the pre-run deterministic regression and prior
live replay establish the bounded contract, not unrecorded DOM/focus/value equality.

Contemporary Kudzu cost is **1.1930x React**. Historical neutral R13 totals were
1,731,168/1,266,931: R15 changes -4.55%/+9.33%; against R12 it changes
+5.10%/+9.00%. The narrower contemporary gap is not sole-change causal evidence.
Kudzu's 4.62% lower median elapsed time has overlapping ranges and five pairs, not
statistical superiority. Prebuild excess remains 216,620 of 267,371 excess tokens;
cache reads account for +269,952 overall, offset by lower uncached/output/reasoning.
Source identity, README removal, tool/docs and time/cache/provider drift confound
historical comparisons. Fresh baseline A/B would need twenty attempts and was not
authorized. No new browser timing benchmark or full-suite advantage is claimed.

Protocol SHA-256: `6ae7cebf31da592a1a9e48c081ff2fee79c5e8092afcf87a06765564539d08d0`.
Candidate tarball: `399ac4fb05654bed5a232274536b823336649e8e1918167ead632ed37a5e128b`.
Candidate source inventory: `969db311496a7b34c1a015cdbd10a7b0eab6203c9f2c92db35f38223388975e2`.
Smoke: `9349ddfeb7bc00e4ba4afa4de61eca85a8831fb2ad1e707a68886d12ac60ebfc`.
OpenCode: `bddf894e5c2bc3d8cf452bd6e5ab2273bbe4a37eeeb9aec848d3d7d20db1f256`.
`freeze.json` contains full source, manifest, public context and executable hashes.
Semantic primitives, core passes/LOC, runtime concepts, compiler fixtures,
dependencies and production browser-byte deltas added this session: **0**.
Existing observation reuse stays; failed inventory policy stays unadopted. No
compiler patch, main version bump, configuration change, commit, push or release.

Sequential gates with individual 1,200,000-ms deadlines pass: `npm run check`
(228 pages, two interactive), required-Chrome `npm test` (standalone 1/1 plus
320/320, zero failures/skips), and `npm run test:package` (three pages, one
interactive). All three stderr logs are empty. Four maintained search fixtures
retain 32,190 raw / 12,324 aggregate gzip JS B and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Only audit/archive scripts and factual gate metadata follow these tests; measured
inputs, utility, compiler and scorer never change. The sibling audited tarball
includes R12/R13/R14 comparison traces, registry/candidate bytes, frozen contexts,
OpenCode executable, source diffs, script hashes and complete per-file manifest;
disposable install-check dependencies are excluded, not historical evidence.

## Offline Non-Adjacent Observation Reuse (2026-09-10)

No provider/model call. This extends the already-dirty observation compaction,
not the failed inventory policy. Exact historical output replay preceded the
implementation: clearing a search restores text/AX already emitted before the
intervening filters. The existing `observationFrom` can reference that earlier
full record without a new output field, decoder, tool command or assertion mode.

The repository-only utility now retains at most 20 serialized observations in
an invocation-local `Map` instead of only the last one: **+1 net implementation
line** relative to the preceding dirty utility (157 -> 158). All text/AX fields,
bounds, native actions, assertion evaluations and error checks remain intact.
References point directly to the most recent matching full record, never another
reference. Explicit `open`/`snapshot` remain full, including recovery after reuse.
Equality still says nothing about unreported DOM, values, focus or truncated
content. No target-scoped replacement or text/AX field deletion is adopted.

Evidence: `test-results/ai-delivery-production/observation-reuse-20260910/`.
`node <evidence>/replay.mjs` checks all 30 raw attempt streams and recovered spills,
replays both serialization rules and asserts exact expansion equality, including
failed calls. `projection.json` contains input SHA-256s, exact shell commands and
source line numbers, every new reference and expanded-record hashes. R12's
"before" applies the existing adjacent compaction; R13/R14 before records match
their actual compact output. Numbers include JSONL newlines, not shell framing,
spill notices, provider input or repeated model-context exposure.

| Historical output replay | Calls / commands, unchanged | Existing compact bytes | Candidate bytes | Reduction |
|---|---:|---:|---:|---:|
| R12 Kudzu | 10 / 81 | 162,993 | 141,607 | 13.12% |
| R12 React | 10 / 94 | 177,483 | 160,311 | 9.68% |
| R13 Kudzu | 7 / 75 | 132,367 | 110,803 | 16.29% |
| R13 React | 12 / 126 | 234,548 | 221,785 | 5.44% |
| R14 Kudzu | 8 / 99 | 181,054 | 159,495 | 11.91% |
| R14 React | 9 / 94 | 161,581 | 144,606 | 10.51% |

Total: **1,050,026 -> 938,607 B (-111,419 B, -10.61%)**, 26 new references,
56 shell calls and 569 observed commands unchanged. Shell failures with no
browser records remain counted as calls, not fabricated observations. This is
an exact output-context byte proxy, not tokenizer output or measured token savings.

`node <evidence>/replay.mjs before` uses the preserved adjacent-compaction source;
`node <evidence>/replay.mjs after` uses the current repository utility. Both replay
the exact 12-command R12 K1 and R14 React R0 sequences on frozen final artifacts.
Live output is **22,969 -> 18,743 B (-18.40%)** and **22,989 -> 18,765 B (-18.37%)**.
Each keeps one shell invocation, 12 commands, 74 CDP requests (16 full AX reads),
and respectively 12/4 browser network requests. Request paths/method counts match.
Expanded output is identical except elapsed times; both completions are clean.
`before.json`/`after.json` and four JSONL files retain commands, counts and hashes.
Tool SHA-256 changes from `13e8d1128047d67b464eb427808359b25d11110536f032716fcdc4406f05648a`
to `9349ddfeb7bc00e4ba4afa4de61eca85a8831fb2ad1e707a68886d12ac60ebfc`.

The extended existing regression first fails against the preserved baseline at
`returning to an earlier exact observation reuses its full record`; candidate
focused Chrome/browser/copy/lifecycle/protocol tests pass 11/11, zero skips.
The regression covers AX-only change/restoration, index zero, direct references,
full snapshot recovery and a failing assertion after reuse. Live replay also
covers changed rendered text. No production fixture or acceptance is weakened.

Semantic primitives, core passes/LOC, runtime concepts, public framework APIs,
dependencies and deploy browser-byte deltas: **0**. Frozen utility copies and
R12/R13/R14 scores remain untouched; inventory policy remains unadopted. Failure-
inclusive tokens per accepted task and actual AI cost are **UNMEASURED for this
change**. No cache-count discount, higher budget, cost-goal achievement, timing
improvement or causal framework advantage is claimed. This small lossless change
is worth future measurement only with separate authorization; no automatic run,
configuration change, commit, push, release or version bump is authorized here.

Sequential 1,200,000-ms gates pass: `npm run check` (228 pages, two interactive),
`KUDZU_REQUIRE_CHROME=1 npm test` (standalone 1/1 plus 320/320, zero failures/skips),
and `npm run test:package` (three pages, one interactive). `check.mjs` retains exact
commands, exit receipts and stdout/stderr; its baseline-regression mode replays
the current regression against the saved old utility. `verify.mjs` checks all
three historical file manifests, live request/expanded-output equality, gate
receipts, current source/evidence hashes and `git diff --check`. These tests do
not invoke a provider. Prior dirty reports/compaction and frozen copies remain.

## Offline Initial Inventory Comparison (2026-09-10)

User-authorized offline evidence only; the five prior dirty files and historical
evidence remain intact. Reproduce with
`node test-results/ai-delivery-production/inventory-policy-20260910/compare.mjs`.
The ignored directory retains immutable-content starter/dependency copies,
per-file hashes, exact R12/R13 trace outputs/lines, pattern simulations, coverage
ledgers, and an **uninstalled** generic `POLICY-DRAFT.md`.

Before is exact historical broad-glob output across five attempts per row. After
is a hypothetical complete source-focused inventory, not a measured tool/model
run. All broad calls truncate at 100 paths; unreturned totals and proprietary
matching/order are unknown. After bytes include a nonrecursive root directory
census and use observed path-list/directory formatting at the same absolute root.
Inputs, metadata, hidden context, existing source globs, file reads and later work
are outside this comparison; no token or timing saving is claimed.

| Input | Broad paths / bytes | Dependency paths | Focused paths / bytes including census | Authored coverage per attempt |
|---|---:|---:|---:|---:|
| R12 Kudzu | 600 / 69,798 | 559 | 70 / 6,025 | 14/14 |
| R12 React | 500 / 49,533 | 436 | 95 / 8,790 | 19/19 |
| R13 Kudzu | 500 / 56,810 | 469 | 70 / 6,025 | 14/14 |
| R13 React | 600 / 59,918 | 508 | 95 / 8,790 | 19/19 |

Strict `src` plus root files is **rejected**: it misses ten React HTML entrypoints,
including `about/index.html` and `topics/performance/index.html`. Adding all
authored HTML/configured roots covers every source, entrypoint, configuration,
data and stylesheet file without hardcoded application content. These starters
have no separate public binary assets. Authored bytes are Kudzu 40,307/40,780 B
(registry/candidate) and React 56,631 B. Observed root overlap is only 3-12/14,
5-11/14, 11-18/19 and 7-19/19 respectively; later reads can recover omitted paths.
R12 K2 repeats 48 prior paths, not an entirely redundant response. No observed
example-directory noise was found; dependency declarations are not examples.

Original temporary R12/R13 trees are gone. Frozen starters and existing Kudzu
install-check dependencies are copied without edits. React uses an older surviving
local installation, version-aligned against every installed lock-addressable
package and direct dependency, not authenticated as the original installation.
The full report records its exact path and content hashes. All 326 Kudzu and 463
React declaration files remain accessible, including transitive types and @types;
there is no blanket dependency ban. The 689 B candidate map remains only in its
historical snapshot. Eleven observed broad patterns applied symmetrically with
Node matching and ascending/descending 100-path caps produce 7,080-8,955 B Kudzu
and 5,558-5,999 B React versus complete focused 507/742 B at a common root prefix.
These are explicitly simulations, not proprietary-tool measurements. Exact
recorded read limits/notices are retained; the current 2,000-line Read default
cannot be inferred as historical fact from small complete reads.

GO for reviewing the generic scoped-discovery draft with root/config coverage and
explicit dependency access. NO-GO for strict src-only policy, installation into
configuration/prompts, or an automatic model run. A future run needs separately
reviewed symmetric authorization and pre-run gates; frozen protocols and scores
are unchanged. No compiler/CLI/model/configuration, runtime, version or release
change. Sequential `npm run check` (228 pages, two interactive) and `npm test`
(standalone 1/1 plus 320/320, zero failures/skips) pass with 1,200,000-ms command
timeouts. Logs/receipts are retained in this evidence folder; `git diff --check`
passes. Both historical manifests/archives, 19 prior follow-up evidence files and
all tracked source hashes are checked without rewriting prior evidence.

## Prebuild Package Discovery Follow-Up (2026-09-10)

This user-authorized continuation addresses prebuild discovery, not another
browser-output optimization. Release remains `0.16.28` at `04e14e3`; no model
call, benchmark rerun, configuration change, commit, push or release occurred.
The preceding dirty observation implementation and both historical reports remain
intact. Read-only research and source hashes are in
`test-results/ai-delivery-production/prebuild-discovery-20260910/{analyze.mjs,research.json}`.
Running that script also verifies all 1,039 frozen R12 manifest files, all 19 prior
follow-up evidence files listed in its verification record, and the three prior
browser utility/test/document source hashes without rewriting them.

### Trace Chain And Scope

Raw references are unchanged
`browser-tools-r12-20260909/content/attempts/content-<variant>-<ordinal>/adapter.stdout`
under `test-results/ai-delivery-production/`. All discovery calls below precede
the first edit as well as the first build; first edit/build line pairs are
K0 33/40, K1 34/41, K2 36/43, K3 34/41, K4 34/41 and
React 30/37, 38/45, 33/40, 30/37, 33/40.

| Observed prebuild discovery | Kudzu | React + Vite |
|---|---:|---:|
| Broad root glob calls | 6 | 5 |
| Trace-visible root glob output | 69,798 B | 49,533 B |
| Dependency paths / returned paths | 559 / 600 | 436 / 500 |
| Explicit package grep output | 42,499 B | 0 B |

All eleven broad inventories are truncated at 100 paths. Even root patterns such
as `*` return nested dependencies in this tool environment. These are observed
tool results, not npm package inventories or proof of an ignore-rule defect.
K2 lines 8-10 first list ten source files, then emit two root inventories of
12,124 and 12,112 B. The second root inventory repeats 48 paths from preceding
globs, totaling 5,610 B when each repeated path is counted with a newline. It also
contains new paths: removing the entire response is not a proven safe saving.
The analogous broad React inventories include 82-93 dependency paths each.
Changing OpenCode search/configuration behavior is outside this product edit.

K0 lines 21-26 and K1 lines 22-27 search hooks/hydration across the package and
discover/read the README afterward. K2 lines 21-29 discover the README, search the
package (13,112 B, including nested TypeScript results), probe nonexistent package
`dist/` (14 B, no files), then read the full README (11,795 B with tool framing)
and manifest (3,170 B). K3 lines 21-27 search, read the 8,121 B public declaration
response, then read the README. K4 lines 21-27 enumerate 100 declaration paths
(12,860 B, truncated), search `useState`, then read the README. Their authoring
questions already have an example, and all five first builds pass. Search bytes
are an investigation surface, not a measured redundant-byte or token saving.

### Minimal Remedy And Measurement

Unlike the prior rejected proposal for another authoring hint, this edit adds only
an installed-package location map to the existing README, before Quick Start.
It links the existing Authoring/Verify sections and public declarations/manifest,
states that the package ships `bin/` and `framework/` rather than `dist/` or internal
`docs/`, and names the existing local compiler invocation. Package files/exports
already establish these facts; no API export, command, compiler behavior, semantic
primitive, core pass/LOC, normalization/adapter rule, runtime concept or dependency
changes. No benchmark labels, solution, hidden instruction or stopping rule enters
the public text. Full verification remains required.

| Deterministic documentation measure | Before | After |
|---|---:|---:|
| README UTF-8 bytes | 10,612 | 11,301 |
| Installed-package map | absent | 689 B |
| Direct links in that map to authoring/verification/types/manifest | 0 | 4 |
| Existing Authoring section | 2,023 B | 2,023 B |

Concrete use: read `node_modules/@kudzujs/core/README.md` at Installed Package,
follow `#authoring` for native events/collections or `./framework/core.d.ts` for
signatures instead of discovering declaration paths recursively. For package
layout, the 689 B section answers the absent `dist/` question and points to
`./package.json`; it does not replace the full API reference. From the application
root, `./node_modules/.bin/kudzu build` invokes the existing compiler. An npm build
script may include TypeScript or other necessary checks; this is not permission
to bypass them. Package smoke actually executes that exact command through `sh`.

This is a bounded discoverability result, **not a context reduction measurement**:
the README grows by 689 B, including for whole-file readers. Agents that search
before opening it may gain nothing, and four historical readers chose later line
ranges. The root-glob duplication and intrinsic exploration/stopping behavior
remain unresolved. R12's 162,685 excess prebuild tokens, including +178,816 cached
input offset by lower uncached input, are unchanged; cache reads are not free and
provider totals cannot assign document-level causal savings. A future equal-
condition model freeze needs separate authorization; no projected AI saving or
full-suite advantage is claimed.

### Regression Gates

The existing package smoke now fails on the baseline README at `README has an
installed-package map`, checks a 1 KiB map ceiling, resolves all four links,
verifies the installed README exactly matches source, and checks absence of packed
`dist/` and `docs/`. Existing exact exports/bin/source, interactive/static example,
and zero-JavaScript assertions remain in place. No new test framework or fixture.
Sequential commands, each with a 1,200,000-ms timeout, passed on Node v24.14.0:

1. `KUDZU_REQUIRE_CHROME=1 node --test test/browser-smoke.test.mjs test/ai-delivery.test.mjs test/ai-delivery-lifecycle.test.mjs test/ai-delivery-production.test.mjs`: 11/11.
2. `npm run check`: 228 pages, two interactive.
3. `KUDZU_REQUIRE_CHROME=1 npm test`: standalone 1/1 plus 320/320, zero skips/failures.
4. `npm run test:package`: three pages, one interactive, documented shell command passes.

The four maintained search fixtures retain 32,190 raw / 12,324 aggregate gzip JS
bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Production browser-byte delta is zero; no timing benchmark was run. This record
is appended after those gates; `git diff --check` validates the final documents.

## R12 Observation Output Follow-Up (2026-09-10)

Resumed with the preceding R12 closure records and browser-output implementation
already dirty; those edits are preserved. This is a local utility fix and trace
audit, not another model experiment. Evidence is in the separate sibling
`test-results/ai-delivery-production/browser-observation-followup-20260910/`;
R12's frozen inputs, raw attempts, archives, scores and accounting are unchanged.

### Token Attribution

Whole first-build message boundaries match R12's audit, including any other work
in that message. Each cell below is Kudzu / React + Vite over five attempts.

| Metric | Before First Build | First-Build Message | After First Build |
|---|---:|---:|---:|
| Total tokens | 675,556 / 512,871 | 117,762 / 98,525 | 778,881 / 659,307 |
| Uncached input | 163,953 / 179,751 | 1,811 / 1,743 | 108,171 / 102,814 |
| Cache-read input | 501,888 / 323,072 | 115,456 / 96,256 | 664,960 / 551,040 |
| Output | 8,909 / 8,572 | 495 / 526 | 4,063 / 3,888 |
| Reasoning | 806 / 1,476 | 0 / 0 | 1,687 / 1,565 |
| Model steps | 40 / 35 | 5 / 5 | 23 / 23 |
| Raw tool events | 91 / 94 | 5 / 5 | 33 / 20 |
| Trace-visible tool output UTF-8 bytes | 234,979 / 164,027 | 1,730 / 6,405 | 306,165 / 303,616 |

The **301,496** total excess splits into **162,685 before**, **19,237 at** and
**119,574 after** the first build. Pre-build is 53.96% of the excess, not a
post-build compiler failure: all five Kudzu first builds passed with no correction.
Across all phases cache-read input is +311,936, uncached input -10,373, output
+481 and reasoning -548. Pre-build alone is +178,816 cache reads versus -15,798
uncached input. More accumulated/replayed context and five additional pre-build
model steps are observed, but the provider trace cannot assign individual cached
tokens to a particular document, search, tool output or decision. Raw tool counts
are 129 / 119, distinct from normalized path-expanded counts of 134 / 124.
Output byte totals exclude inputs and provider/system context and retain visible
spill notices; recovered spill bytes are not retroactively charged as input.

Concrete trace references below are `content/attempts/<id>/adapter.stdout` lines
under the unchanged R12 directory. `tool-inventory.txt` records every non-edit,
non-todo tool event with its phase, input, output bytes and original line.

- K0 lines 8-9: broad root glob 12,135 B, then source glob 735 B. Lines 21-26:
  package hook/hydration search 8,707 B, README discovery, then README read 4,368 B.
- K1 lines 22-27: README discovery, broad package search 18,588 B, then README
  read 4,517 B. K2 lines 9-10 repeat root inventory at 12,124 and 12,112 B;
  lines 22 and 28 add a 13,112 B package search and 11,795 B full README read.
- K3 line 24 reads 8,121 B of public `framework/core.d.ts`, then line 27 reads
  the README. K4 line 21 enumerates package declarations at 12,860 B before its
  README read. These are evidence of exploration, not missing supported syntax.
- K0 lines 47/52 repeat raw HTML marker searches at 2,105 B each after the build
  summary. K2 lines 52-53 and K3 lines 52-53 reread authored source after smoke.
- K1 line 44 emits 42,179 B for 12 browser commands: six unchanged text checks
  repeat the preceding bounded observation. K0 line 43 explicitly requests four
  duplicate snapshots; these remain full output by design. R4 line 53 spills its
  20-command browser output; its 49,626 trace-visible bytes are not the full stream.

The existing generic README authoring example and lexical build summary already
answer the observed questions. No new pre-build documentation hint, compiler
feature, package inventory CLI, hidden instruction or source-access restriction
is justified here. **The pre-build excess remains unresolved by this fix.**

### Minimal Output Fix

`test/browser-smoke.mjs:118-126` still samples text and AX after every action and
runs every caller assertion. Only identical bounded observations on actions/text
checks become `observationFrom: <last full command index>`. References never chain
and reset on each invocation. Changed text or AX emits a new full observation;
`open` and explicit `snapshot` always emit full output. The existing 4,000-character
text, 60-entry AX, 160-character name and truncation limits remain unchanged.
Equality does not certify unchanged DOM, focus, control values or omitted content.
Failures, command records, native input, settling, deadlines, network/exception
checks and exit status remain intact. The public utility document explains this
output contract; no task-specific selectors or expected values enter the tool.

Local replay of K1's exact 12 commands on its archived accepted artifacts emits
**42,179 -> 22,969 UTF-8 bytes (-45.54%)**, with six compact observations and clean
completion on both tools. Expanding references reproduces all baseline command,
text, AX, truncation and completion fields exactly, excluding elapsed times.
`before.jsonl`, `after.jsonl` and `replay.json` preserve actual output and commands.
For example command 2 still checks `6 articles`, but instead of repeating command
1's full text/AX it emits:

```json
{"index":2,"command":{"op":"expect-text","text":"6 articles"},"ok":true,"elapsedMs":154,"observationFrom":1}
```

Elapsed time above is illustrative; the raw replay files are authoritative.
Baseline smoke SHA-256 is
`ad2f1197ffc9e29bc26a769bde84e4ab01b8fa2703869ea275cad1dd2234c41e`;
candidate is `13e8d1128047d67b464eb427808359b25d11110536f032716fcdc4406f05648a`.
The current regression against the frozen old utility fails at the expected
`observationFrom` assertion (exit 1), retained in `baseline-regression.stdout`.
It also covers changed text, AX-only changes, non-chaining, explicit snapshot/open
output and a failing assertion after compact output.

A separate offline projection over all twenty historical invocations, including
failed calls and R4's recovered full spill, reduces serialized record bytes from
272,027 to 162,993 for Kudzu (35 compact records) and 307,487 to 177,483 for React
(42). Expansion exactly reconstructs every historical bounded observation and
failure. Ten/eight duplicate explicit open/snapshot observations remain full.
This is an output-format projection, not newly observed browser behavior, model
input, token savings, wall-time savings or a revised score. It may benefit React
more in absolute bytes and does not demonstrate a smaller framework token gap.
The live replay runs baseline then candidate, not a timing benchmark. Model-token
and end-to-end productivity savings remain **unmeasured**; no model was called.

Semantic primitives, compiler core passes/LOC, normalization/adapter rules,
runtime concepts, dependencies and production browser-byte deltas: **0**.
The utility implementation is +5 net lines; one existing regression is extended,
with no new compiler fixture. Tools stay repository-only. Future use requires a
new equal-condition freeze and lifecycle/protocol/browser/copy preflight; budgets,
cache accounting, scorer, runner, package version and frozen context are untouched.
No commit, push, release or version bump.

After tracked implementation/test/document edits, sequential 1,200,000-ms gates
pass: required-Chrome focused browser/copy/lifecycle/frozen-protocol tests 11/11,
`npm run check` (228 pages, two interactive), `KUDZU_REQUIRE_CHROME=1 npm test`
(standalone 1/1 plus 320/320, zero failures/skips), and `npm run test:package`
(three pages, one interactive). All four stderr logs are empty. Four imported
search fixtures retain 32,190 raw / 12,324 aggregate gzip JS bytes and runtime
digest `f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
`git diff --check` passes. Logs live beside the replay; this verification record
is appended afterward and does not claim a new application timing benchmark.

## Registry Content R12 (2026-09-09)

**Focused score: Kudzu 5/5 versus React + Vite 5/5; AI-cost advantage not proven.**
All ten final builds and unchanged scored Chrome journeys pass. This is one
CONTENT-only experiment, not a replacement full-50 result or a 1.0 release gate.
There is also a verification-order deviation: pre-run validation passed seven
browser/copy tests but omitted the separate lifecycle and frozen-protocol test
files. Those tests pass in the post-run full suite. That does not retrospectively
satisfy the requested pre-measurement gate; the scores retain this qualification.
No attempt was selectively retried to repair the protocol record.

### Freeze And Scope

Evidence: `test-results/ai-delivery-production/browser-tools-r12-20260909/`.
The worktree was clean at release commit `04e14e3` before setup. R12 installs exact
registry `@kudzujs/core@0.16.28` with npm's SHA-512 lock integrity, and archives the
downloaded tarball plus unpacked source. A separate fresh `npm ci` checks every
installed package file against that tarball. There is no local snapshot, mutable
symlink, generator execution, package change or release in this experiment.

R11's task/prompt, acceptance contract/scorer, serial alternating schedule,
React 19.2.8 / Vite 8.2.2 starter, framework public-context documents, runner,
adapter, model `openai/gpt-5.6-sol`, and OpenCode 1.18.27 binary/hash are unchanged.
The equally copied `.tools` files are the released favicon/AX diagnostic versions
of `browser-smoke.mjs`, unchanged `browser-cdp.mjs`, and updated task-neutral public
instructions. No private selectors, expected answers or grader source are exposed.
The tool source is equally readable; only public instructions enter both prompts.
Registry package README bytes can differ from the older prerelease snapshot, so
this is not a utility-only causal experiment. Historical frozen inputs stay intact.

Budgets per attempt remain 300,000 ms; 400,000 input tokens including cache reads;
20,000 output; 20,000 reasoning; 40 normalized tools; 20 unique read paths; eight
modified paths; five model builds. Browser calls count as ordinary shell tools;
their inner operations are reported separately, not extra model tools. Agent setup
and browser time are charged; independent final build/acceptance time is excluded.
Phases use whole first-build message boundaries, as in R11.

The single ten-entry run used an 18,000,000-ms outer timeout and completed
07:31:17.477-07:57:44.673 UTC (26m 27.196s). Node 24.14.0, npm 11.9.0, Chrome
152.0.7977.64, Linux x64, Intel i5-9500/six logical CPUs and 33,491,050,496 bytes
RAM match the recorded host. No interrupted attempt, replacement, model
substitution or extra measured call occurred. The availability-only preflight
costs 6,727 tokens separately; it does not count as one of the ten attempts.

### Failure-Inclusive Accounting

| Metric | Kudzu | React + Vite |
|---|---:|---:|
| Scheduled / scored successes | 5 / 5 | 5 / 5 |
| Final build / acceptance passes | 5 / 5 | 5 / 5 |
| Uncached input | 273,935 | 284,308 |
| Cache-read input | 1,282,304 | 970,368 |
| Output / reasoning | 13,467 / 2,493 | 12,986 / 3,041 |
| Total tokens | 1,572,199 | 1,270,703 |
| Tokens per success | 314,439.8 | 254,140.6 |
| Median total tokens / model steps | 302,343 / 14 | 248,732 / 12 |
| Median elapsed ms (range) | 150,351 (126,644-183,224) | 151,896 (135,221-176,766) |
| Sum elapsed ms / normalized tools | 771,434 / 134 | 785,338 / 124 |
| Median normalized tools / unique read paths | 28 / 10 | 24 / 13 |
| Sum read / modified paths across attempts | 50 / 10 | 58 / 10 |
| Median modified paths | 2 | 2 |
| Model builds / correction cycles, totals | 5 / 0 | 7 / 2 |
| Before / first-build / after-build tokens | 675,556 / 117,762 / 778,881 | 512,871 / 98,525 / 659,307 |
| Browser adopters / native-input adopters | 5 / 5 | 5 / 5 |
| Browser shell calls / full command records | 10 / 81 | 10 / 94 |
| Successful fills / clicks / text checks | 21 / 0 / 35 | 19 / 0 / 45 |
| Clean smoke completions and zero exits | 9/10 | 8/10 |
| All agent shell zero exits | 14/15 | 15/18 |

Scheduled cost is **2,842,902 tokens**, or **2,849,629** with preflight. Cache-write
tokens and provider-reported subscription dollars are zero, not zero economic
cost. Raw provider totals reconcile with input plus cache reads, output and
reasoning; no attempt usage is missing. Every budget passes; K4 has the smallest
input headroom, 27,994 tokens. Source retention excludes harness bytes and verifies
only two changed authored files per attempt: the article page/App and stylesheet.
Ordinary hooks, declarative filters, cards, labels, live regions, native links and
focus CSS are retained. Manifests, locks and other starter files remain unchanged.

Per-attempt rows follow the actual schedule. `B/C` is model builds/corrections;
`smoke` is clean zero-exit calls/total calls. All ten have passing final acceptance.

| Attempt | Total tokens | Elapsed ms | Tools | Reads | B/C | Smoke | R11 total tokens | Token delta |
|---|---:|---:|---:|---:|---|---|---:|---:|
| K0 | 299,213 | 163,719 | 25 | 9 | 1/0 | 2/2 | 414,186 | -114,973 |
| R0 | 231,558 | 135,221 | 21 | 10 | 1/0 | 2/2 | 209,079 | +22,479 |
| R1 | 280,489 | 171,256 | 31 | 14 | 2/1 | 1/2 | 265,217 | +15,272 |
| K1 | 249,207 | 126,644 | 22 | 10 | 1/0 | 1/1 | 310,399 | -61,192 |
| K2 | 345,718 | 150,351 | 28 | 10 | 1/0 | 1/1 | 361,298 | -15,580 |
| R2 | 234,596 | 151,896 | 24 | 13 | 1/0 | 2/2 | 233,650 | +946 |
| R3 | 248,732 | 150,199 | 22 | 7 | 1/0 | 2/2 | 299,294 | -50,562 |
| K3 | 302,343 | 147,496 | 28 | 11 | 1/0 | 2/2 | 320,479 | -18,136 |
| K4 | 375,718 | 183,224 | 31 | 10 | 1/0 | 3/4 | 384,928 | -9,210 |
| R4 | 275,328 | 176,766 | 26 | 14 | 2/1 | 1/2 | 329,535 | -54,207 |

`attempt-metrics.md` additionally gives every uncached/cache/output/reasoning and
pre/build/post token count. `audit.json` and `review.json` preserve exact commands,
exits, observations, final answers, source hashes and all comparison metrics.

### Actual Verification Quality

All agents fill the real search control and observe changed rendered output,
including empty results and restoration. K2/R0 do not independently smoke a title
query; R1 does not independently smoke a topic query. No agent clicks a link or
proves keyboard navigation. K4 and R0/R3/R4 open sibling URLs directly. Successful
smoke is not exhaustive accessibility, mobile, screen-reader or JS-disabled proof;
the unchanged independent scorer supplies the final scored acceptance.

R1/R4 first fail exact AX targeting and receive the bounded `SEARCH ARTICLES`
candidate. Both remove authored label `text-transform`, rebuild and pass without
relaxing the required target name. K4 instead fails a caller-supplied `Static
edition` text expectation, reruns with observed `STATIC EDITION`, and discloses
that correction in its final answer; it does not alter the static page. These
three nonzero calls remain charged. All seventeen completed smoke calls have
exit 0 and empty exception/request/HTTP-error lists. R3 also runs `git diff` in a
non-repository workspace: it compares TSX to CSS and exits 1, not a useful baseline
diff. A tool status of `completed` alone is not treated as command success.

Four of five Kudzu agents still repeat raw-HTML script/marker scans; K1 uses the
build summary without another scan. All five inspect installed public framework
documentation, with package-source/type searches still present. Broad final
script-free language exceeds a lexical scan's guarantee; no new static-proof or
public-context-isolation claim is made. R4's large browser output is truncated:
89 React command records are trace-visible, 94 recoverable from the original spill
file. Its bytes/provenance are archived without adding recovered text to token
accounting. R11's three earlier spill files are retained separately in provenance.

Kudzu total tokens fall **12.23%** from R11; React falls **4.94%**. R11 remains
4/5 versus 5/5 with all eighteen historical smoke invocations nonzero. Same-run
R12 Kudzu still costs **1.2373x** React in total tokens, despite a median elapsed
time 1.02% lower with overlapping ranges. Five samples, different run times,
cache/provider drift, the new registry version and changed tool/docs prohibit a
causal savings or statistical superiority claim. There is no fresh browser timing
matrix. Accepted deploy medians are 68,410 / 26,404 raw/gzip bytes versus
206,338 / 66,378; observed JS-transfer medians are 37,608 versus 199,174 bytes.

### Integrity And Next Gate

Protocol SHA-256: `663e86f02018a7d7d7cc0319d1351a0acc5cce15551d2c630ee163c7caeecc3a`.
Registry tarball SHA-256: `06acf44d6a7754dca48293ec522b1af6eaca5d6e9cfe6d1d774feba6755ea643`.
Smoke SHA-256: `ad2f1197ffc9e29bc26a769bde84e4ab01b8fa2703869ea275cad1dd2234c41e`.
Transport SHA-256: `3082f1df079fbad99bc9dc3b0fcc3c340bdf8a5c22f052e80aaa2a2f13718495`.
Public tool document SHA-256: `13023f22d569afce286e329dd80283f3ca1dbab94936e5c0ad52c18e48676b13`.
Runner/adapter remain R11's `a2ee11d3f61b254daee9bf90e013a6688fa140a10592bc7cde5d25cc474aa944`
and `b1036b3d3b205714a45fb35d2e9a8e25c3f54790936131aa84d92b9ec4639a1e`.
`freeze.json` records full registry metadata, integrity, binary and input hashes.
The independent audit verifies R11/R12's 20 result/trace pairs, 120 command streams,
340 artifacts, 330 source files and 120 context checks, including all 60 R12
post-agent/post-acceptance checks. Persistent harness tampering is detected;
transient write-and-restore remains outside this trusted-local mechanism.

Sequential 1,200,000-ms gates pass: `npm run check` (228 pages, two interactive),
required-Chrome `npm test` (standalone 1/1 plus **320/320**, no failures/skips),
and package smoke (three pages, one interactive). Full tests include the two
omitted pre-run lifecycle checks and frozen-protocol checks. Four search fixtures
retain 32,190 raw / 12,324 gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Only audit/archive scripts and factual records follow measurement; compiler,
runner, adapter, scorer, tools and measured frozen inputs never change mid-run.

The sibling `browser-tools-r12-20260909-audited.tar.gz` and external `.sha256`
archive frozen inputs, registry source/tarball, tool/docs, OpenCode executable,
all R12 and comparison R11 raw attempts, spill output, verification logs, source
diffs and a per-file evidence manifest. Prior archives, including interrupted
evidence, retain their freeze-time hashes and are not overwritten. Disposable
install-check dependencies are explicitly excluded.

Next evidence-ready work is protocol review of bounded browser observations and
remaining post-build inventory/stopping cost, not a compiler feature. A future
freeze must explicitly run lifecycle, frozen-protocol, utility and copy-integrity
tests before any provider call; no replacement R12 is authorized by this result.
Full R8 remains 23/25 versus 24/25, and the full-suite/1.0 gates stay blocked.
Semantic primitives, core passes/LOC, runtime concepts, dependencies and production
browser-byte deltas added by this session: **0**. No commit, push or version bump.

## 0.16.28 Release Scope (2026-09-09)

The separately authorized release packages the accumulated route HTML summary,
repository-only browser tools, runner copy/integrity checks and R9/R10/R11 reports
as core `0.16.28` and `create-kudzu@0.1.153`. Earlier no-release/version statements
remain historical session records, not restrictions on this release transaction.
Canonical experiment protocols, frozen tools, private archives and historical
scores stay unchanged; no model calls or new benchmark claims are part of release.

The sole production implementation delta is +30 net build-orchestration lines
(31 added, one removed against `e379998`; the earlier +31 report was off by one):
final route HTML reads in batches of 64, lexical classification and bounded sorted
console output. Semantic primitives, core passes/LOC, runtime concepts,
normalization rules, dependencies and deployed browser-byte deltas remain zero.
The R10 build measurements below apply to this implementation, not new release
timing: +4.80% at 111 pages and -0.23% at 1,011, with identical deploy bytes and
overlapping ranges. No established speedup or AI-token advantage is claimed.

Release review found that new Linux browser tests ignored the repository's
skip/required-Chrome contract. They now honor it without letting a required
browser silently skip. Another regression reproduced a false clean smoke exit
for a missing `srcset` image at `/favicon.ico`. The utility now also observes
CDP request type/initiator before suppressing an optional automatic icon probe;
authored CSS and `srcset` image failures remain nonzero. All three browser tests
pass with required Chrome; the explicit skip configuration skips all three.
The frozen R11 copies/hashes are not rewritten or retrospectively passed.

Package smoke now explicitly rejects `test/` and `test-results/` alongside prior
internal-document exclusions. Browser tools remain checkout-only, not npm files,
a public framework API, an acceptance oracle or a hostile-code sandbox.
Full R8 stays 23/25 versus 24/25, R9 stays 3/5 versus 5/5, and separate local R10
and R11 stay 4/5 versus 5/5. The AI-delivery and 1.0 gates remain blocked.

Release gates ran sequentially with 1,200,000-ms timeouts on Node 24.14.0,
npm 11.9.0 and Chrome 152.0.7977.64: `npm run check` passes (228 pages, two
interactive; 145 without markers, 83 with, zero unreadable);
`KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test` passes
standalone 1/1 plus 320/320, zero failures/cancellations/skips; standalone
`npm run test:package` passes a fresh packed install (three pages, one interactive).
All four imported-search fixtures retain 32,190 raw / 12,324 aggregate gzip JS
bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
The summary regression adds 133 stdout bytes with unchanged 4,985 raw / 2,591
gzip JS bytes. Both `npm pack --dry-run --ignore-scripts --json` gates pass:
core is 60 files, 201,516 packed / 994,227 unpacked bytes; generator is four
files, 5,499 packed / 13,937 unpacked bytes. No test tools or internal reports
ship. Only this verification metadata follows the local gates; exact-commit CI,
protected npm approval, registry integrity and fresh registry installation remain
release-transaction gates rather than assumed results.

## Exact Target Diagnostics Follow-Up (2026-09-09)

R11 K0 and R1/R3/R4 fail their initial exact-name lookup after CSS uppercases the
associated label. Their snapshots already expose `SEARCH ARTICLES`; the shared
fill/click error discards that same AX tree and says only
`Expected one accessible target; found 0`. The live utility now appends at most
five same-role AX candidates, or only matching candidates when ambiguous, with a
total count and 160-character names marked when truncated. This uses the failed
lookup's existing tree, with no extra CDP request, DOM scan, retry or fuzzy action.
Hidden/inert/template controls remain excluded by Chrome's ignored-node boundary.
Snapshots, exact matching, nonzero failure exits, favicon handling and cleanup
are unchanged. Duplicate names still require the caller to resolve ambiguity;
truncated names are observations, not guaranteed usable selectors.

One framework-neutral Chrome/CLI regression reproduces the uppercase mismatch,
checks actual label/ARIA names and hidden/inert/template exclusion, rejects two
identically named buttons, and verifies candidate count/name bounds. It fails on
the old diagnostic before the implementation change. No static-output inventory
is added: existing build facts already cover that separate concern.

Semantic primitives, core passes/LOC, normalization/adapter rules, dependencies,
runtime concepts and deployed browser raw/gzip byte deltas: **0**. This is local
tooling usability evidence, not measured token savings, fewer agent scans, timing
improvement or a model-cost claim. No ten-attempt/full-50 model run, scoring,
budget/protocol rewrite, release or version bump. R11's frozen tools, traces,
archive and **4/5 versus 5/5** scores remain historical; future measurements need
a separately frozen equal-tool protocol.

Verification: focused browser/copy/frozen-protocol checks pass **9/9**. Sequential
1,200,000-ms gates pass: `npm run check` (227 pages, two interactive),
`KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test` (standalone
**1/1** plus **320/320**, zero failures/skips), and `npm run test:package` (three
pages, one interactive). Four imported-search fixtures retain 32,190 raw / 12,324
aggregate gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
The read-only `experiment.mjs integrity` path verifies frozen inputs, package and
binary; `sha256sum --check browser-tools-r11-20260909-audited.tar.gz.sha256`
passes with archive hash `1528687e2e337f59cb081185f54596cc4c315c0aae71e93816d34bf1946ae951`.
`git diff --check` passes. This turn changes the utility by +7/-2 lines, adds 42
test lines and four net public-document lines; the two ledger additions are
separate from all pre-existing dirty work. Only verification docs follow the gates.

## Missing Favicon Smoke Follow-Up (2026-09-09)

Source-only correction after R11: the trusted local smoke server returns 204 for
an exact `/favicon.ico` image request only when no filesystem entry exists and
the current local document has no matching authored `href` or `src`. Existing
files still serve normally; broken/escaping symlinks, explicit icons (including
`/favicon.ico`), missing scripts/styles, document requests, JavaScript exceptions
and blocked network requests remain failures. CDP error collection is unchanged.
This is bounded smoke observation, not exhaustive resource validation; no SPA or
document fallback is added. CLI regressions exercise the formerly favicon-free
false alarm and the failure boundaries without adding a fixture favicon.

R11's frozen inputs, archived copies, hashes, all eighteen nonzero browser calls,
interaction observations, token costs and **4/5 versus 5/5** scores remain intact.
No model rerun, retrospective clean exits, rescoring or release occurred. The
existing frozen-input/package/binary integrity checks pass independently of the
live utility; a future measurement must freeze the changed tool in a new protocol.

Verification: focused browser/copy/frozen-protocol tests pass **8/8**. Final gates
ran sequentially with 1,200,000-ms timeouts: `npm run check` (227 pages, two
interactive), `KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test`
(standalone **1/1** plus **319/319**, no failures/skips), and `npm run test:package`
(three pages, one interactive). All four imported-search fixtures retain 32,190
raw / 12,324 aggregate gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Only this verification documentation follows the gates; existing dirty work stays
intact, with no archived evidence rewritten.

## Equal Browser Tools R11 (2026-09-09)

**Real browser adoption improved; an AI-cost advantage did not follow.** The
independent CONTENT-only schedule completes at Kudzu **4/5 versus React + Vite
5/5**. All ten final builds and unchanged scored Chrome journeys pass. Both
variants' five agents actually fill the rendered search control and observe
changed results, rather than only taking snapshots. All five Kudzu agents still
repeat raw-HTML script/marker inventory. No release or full-50 gate is claimed.

### Frozen Inputs

Evidence root: `test-results/ai-delivery-production/browser-tools-r11-20260909/`.
`experiment.mjs` freezes, validates, preflights, executes and verifies in separate
modes. `audit.mjs` independently reconciles R9/R10/R11 results, token traces,
command hashes, source retention and artifacts; historical files are not rescored.

R11 retains the exact task, acceptance contract/scorer, ten-entry serial alternating
schedule, React 19.2.8 / Vite 8.2.2 starter, model `openai/gpt-5.6-sol`, OpenCode
1.18.27 binary/hash and budgets from R10/R9. Budgets remain 300,000 ms, 400,000
input tokens including cache reads, 20,000 output and 20,000 reasoning tokens,
40 normalized tools, 20 unique read paths, eight modified paths and five builds.
The run spans 04:10:48.322-04:37:53.528 UTC, 27m 5.206s, on Node 24.14.0,
npm 11.9.0, Chrome 152.0.7977.64, Linux x64, Intel i5-9500 (six logical CPUs,
33,491,050,496 bytes RAM). No interrupted attempt, replacement, retry or model
switch occurred. Within-attempt agent corrections are retained, not new trials.

The package is an **unshipped working-tree snapshot**, including the already
batched summary, identified only in the isolated package as
`0.16.27-browsertools.20260909.1`. Main remains 0.16.27. Its read-only
content-addressed tarball installs through `npm ci` using an absolute `file:` pin
and SHA-512 lock integrity, never a mutable symlink. A separate install checks
the installed version and exact build source. `freeze.json` retains every packed
source hash, npm pack manifest, tarball integrity, environment and prior archive
hashes. Restore the recorded tarball path to reproduce the local pin.

The existing runner's `publicContext` now optionally copies one validated unique
`.tools/<filename>` before the agent starts. Both variants receive identical
`browser-smoke.mjs`, `browser-cdp.mjs` and `browser-smoke-public.md`. The document
is included in both prompts; utility source is equally readable in-workspace but
not injected into either prompt. It contains only native operations and limits,
no task labels, expected answers, acceptance selectors or grader imports. Example:

```sh
node .tools/browser-smoke.mjs dist '[{"op":"open","path":"/"},{"op":"snapshot"}]'
```

The new **frozen adapter copy only** replaces “build and stop” with permission for
optional browser shell work and source corrections under the same budget. The
tracked historical adapter, canonical protocols, scorer and archived byte copies
remain unchanged. The new runner/adapter hashes are part of R11, not silently
substituted into old results. Tool normalization remains exactly the historical
method: each browser shell call counts normally, and inner CDP observations/input
commands count separately, never as hidden builds or extra model tools. Compound
commands retain the old build regex classification; none of these browser calls
contains a build. Agent install/browser time and observed-output tokens are charged;
the independent runner's final build/scorer time stays outside agent metrics.

Copies are excluded honestly from both source-retention inventories via the
existing `.tools` exclusion, not credited as retained application source. After
the agent and after acceptance, missing, changed or symlink-replaced tools/docs
invalidate the attempt. All **60 checks pass**. This detects persistent changes,
not transient write-and-restore, and is not a hostile-agent sandbox. A deterministic
four-attempt fake-agent schedule repeated for each of the three files proves equal
copies, prompt exposure, ordinary shell counting, unchanged build accounting,
source exclusion, and invalidation even when acceptance passes. Traversing copy
destinations are rejected. The real Chrome fixture separately proves native
fill/click, hidden/template exclusion, failure exits and bounded timeout cleanup.

Pre-freeze utility review fixes one ownership issue: under the managed runner,
Chrome now inherits the outer deadline process group rather than detaching beyond
its SIGKILL. Standalone invocations retain their own group; port discovery also
recognizes signal termination. Normal cleanup removes profiles; SIGKILL cannot
run profile cleanup. Network containment remains a guard for trusted local files,
not sandboxing. No general browser API, dependency, runtime or compiler feature
was added.

### Failure-Inclusive Results

| Metric | Kudzu | React + Vite |
|---|---:|---:|
| Successes / scheduled | 4/5 | 5/5 |
| Final build / scored acceptance passes | 5/5 / 5/5 | 5/5 / 5/5 |
| Uncached input tokens | 245,185 | 242,793 |
| Cache-read input tokens | 1,527,936 | 1,076,992 |
| Output / reasoning tokens | 14,336 / 3,833 | 13,485 / 3,505 |
| Total tokens | 1,791,290 | 1,336,775 |
| Tokens per success, rounded | 447,823 | 267,355 |
| Median total tokens / steps | 361,298 / 14 | 265,217 / 13 |
| Median elapsed ms / normalized tools | 160,513 / 27 | 152,302 / 27 |
| Median unique read / modified paths | 10 / 2 | 12 / 2 |
| Median model builds / correction cycles | 1 / 0 | 2 / 1 |
| Before / first-build / after-build tokens | 675,184 / 128,693 / 987,413 | 515,727 / 102,335 / 718,713 |
| Browser adopters / agents with native input | 5/5 / 5/5 | 5/5 / 5/5 |
| Browser shell calls / emitted commands | 6 / 72 | 12 / 102 |
| Successful fills / clicks / text expectations | 19 / 0 / 30 | 19 / 0 / 46 |
| Clean browser utility exits | 0/6 | 0/12 |

K0 fails solely because 409,491 input tokens exceed 400,000. Its successful final
acceptance is not a budget waiver. Total scheduled cost is **3,128,065 tokens**;
the separately retained availability-only preflight costs 6,727, for **3,134,792**
recorded experiment tokens. Cache-write tokens and provider-reported subscription
dollars are zero; the latter is not zero economic/compute cost. There is no missing
attempt usage. Phase accounting uses whole first-build message boundaries as before.

| Attempt | Status | Total Tokens | Elapsed ms | Tools | Builds | Browser Calls / Fills |
|---|---|---:|---:|---:|---:|---|
| K0 | input-budget failure | 414,186 | 212,360 | 28 | 2 | 2 / 4 |
| R0 | success | 209,079 | 128,376 | 23 | 1 | 2 / 4 |
| R1 | success | 265,217 | 152,302 | 22 | 2 | 2 / 4 |
| K1 | success | 310,399 | 160,513 | 27 | 1 | 1 / 3 |
| K2 | success | 361,298 | 148,228 | 27 | 1 | 1 / 4 |
| R2 | success | 233,650 | 137,233 | 27 | 1 | 3 / 3 |
| R3 | success | 299,294 | 159,002 | 27 | 2 | 3 / 4 |
| K3 | success | 320,479 | 162,281 | 27 | 1 | 1 / 4 |
| K4 | success | 384,928 | 160,496 | 28 | 1 | 1 / 4 |
| R4 | success | 329,535 | 179,347 | 27 | 2 | 2 / 4 |

Relative to R10, Kudzu total tokens **increase 2.80%**, and React **increases
185.91%**. Relative to R9, they change -10.59% and +128.40%. The contemporary
aggregate ratio is 1.340x, versus R10 3.727x and R9 3.423x; this narrowed gap is
not demonstrated Kudzu savings or causal superiority. Tool exposure and instructions
changed, five attempts per variant are small, and separate schedules, host/service
and cache drift remain confounders. R9 remains 3/5 versus 5/5; R10 remains 4/5
versus 5/5. Neither historical score is replaced.

### Verification Quality

The real browser path catches four authoring mistakes: K0 and R1/R3/R4 initially
apply uppercase CSS to the label, changing Chrome's computed name to
`SEARCH ARTICLES`. Exact role/name targeting fails. All four agents remove the
transformation in authored CSS, rebuild and rerun interaction, rather than relaxing
the name. These are useful browser-discovered corrections even though the frozen
scorer's text-based label checks are not an exhaustive computed-name audit.

Every agent performs native fills followed by rendered-text checks for filtering,
empty results and restoration; this is not snapshot-only adoption. All actual
actions are fills, **no agent clicks links** or proves keyboard navigation. Some
React agents open sibling URLs directly. K1/R2 have narrower query coverage than
the other agents; broad final “all behavior” language still exceeds their own
smoke journey. Existing independent acceptance, not that confidence, supplies the
scored checks. All authored solutions retain ordinary hooks, declarative filters,
cards, associated labels, polite live regions and focus CSS, changing only the
article page/App and stylesheet.

Crucially, **all 18 browser invocations exit nonzero**. Four stop at the initial
name mismatch; the other fourteen finish their commands but report the starter's
missing `/favicon.ico` as a 404. All ten final answers disclose that error, though
several call it only a warning. Individual interaction assertions pass, not the
whole smoke tool. Its strict request checks were not weakened mid-experiment,
and frozen acceptance still passes independently. No phantom-template counting
or minified-handler assertion replaces these native checks, but all five Kudzu
agents still repeat script/marker scans and access public installed framework
documentation/source snippets. Browser access did not eliminate redundant static
inventory or establish full accessibility, mobile, screen-reader or JS-disabled
coverage. Raw HTML inventory is still not a script-freedom proof.

OpenCode truncates three large tool outputs (K0, K3, R4). The trace-visible stream
retains 69/100 complete command records; original generic tool-output spill files
are copied with provenance/hashes, yielding the full **72/102** records above.
`tool-output-manifest.json` distinguishes these archival bytes from text delivered
to the model; no token accounting is inflated using recovered bytes. Original
commands, stdout/stderr, failure records and final answers remain in the archive.

Acceptance-passing deploy medians, including K0, are **68,421 / 26,407 raw/gzip B**
versus **206,325 / 66,380 B**; observed JS transfer medians are **37,608 versus
199,160 B**. This remains a browser-byte advantage, not a model-cost win or fresh
browser performance matrix. This tooling follow-up adds zero semantic primitives,
core passes/LOC, normalization rules, runtime concepts, dependencies or deployed
browser bytes; the prior batched build-summary change is preserved, not recounted.

### Hashes And Next Gate

Protocol SHA-256: `68bc6175101cedc3a7e66fbf3aa20db5add2365142ae64ebce0ab6a71fbb709e`.
Candidate tarball SHA-256: `4a5c74cbb7adf9e5a70708f959a2b3c2f4f68351a67a7fed831770ca3e0c104b`.
Runner SHA-256: `a2ee11d3f61b254daee9bf90e013a6688fa140a10592bc7cde5d25cc474aa944`.
Frozen adapter SHA-256: `b1036b3d3b205714a45fb35d2e9a8e25c3f54790936131aa84d92b9ec4639a1e`.
Smoke / transport / public-document hashes and per-file package provenance are in
the frozen protocol and `freeze.json`. The audit verifies 30 result/trace pairs,
180 command-stream hashes, 510 artifact entries, 495 source files and 60 new
context checks, while rechecking the original historical archive hashes.

Next evidence-selected blockers are bounded observation output (three truncations),
explicit separation of environmental request failures from interaction assertions,
and the remaining post-build marker/source exploration cost. Any changed error
policy, output protocol, instructions or scorer must be independently frozen
before another measurement; do not ignore favicon errors, retrofit successful
smoke exits, selectively rerun K0, or add a general browser API to improve a score.
Full R8 remains 23/25 versus 24/25; the fifty-attempt and 1.0 gates remain blocked.

Final verification ran sequentially with 1,200,000-ms per-command timeouts:
`npm run check` passes (227 pages, two interactive; 144 unmarked, 83 marked,
zero unreadable); required-Chrome `npm test` passes standalone 1/1 plus **318/318**,
zero failures/cancellations/skips; `npm run test:package` passes a fresh install
(three pages, one interactive). The copy/integrity regression and browser smoke
pass in the full suite. All four imported-search fixtures retain 32,190 raw /
12,324 aggregate gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
`verify-execution.json` retains exact times/logs; `git diff --check` passes.
Only verification and archive metadata follow these gates, not runtime/tool edits.

The local archive is
`test-results/ai-delivery-production/browser-tools-r11-20260909-audited.tar.gz`;
its sibling `.sha256` stores the external checksum (not recursively embedded).
It retains frozen tools/docs/prompts/starters, the content-addressed candidate and
packed source, historical runner/adapter byte copies and package tarballs,
all 30 comparison attempts, the pinned OpenCode executable, raw spill files,
source/artifact audits, verification logs, final source snapshots/patch and an
evidence manifest. Disposable install-check node_modules are excluded explicitly.
Earlier interruption archives remain intact and checksummed, not merged into R11.
Existing dirty summary/docs changes are preserved; no commit, push, tag or release.

## Ordinary Browser Smoke Follow-Up (2026-09-09)

Historical implementation record; the separately frozen R11 experiment above
supersedes this section's then-unmeasured/future-experiment status.

R10's retained `verification-review.txt:322-356` reproduces the actual error:
an invented binding marker fails, raw markup counts an inert template as a seventh
card, and the agent weakens its assertions rather than opening a browser. All
five Kudzu agents still repeat marker checks; neither framework's agent runs a
browser. A lexical summary cannot establish rendered state or interaction.

Inspection found no browser tool in the current OpenCode session, no installed
Playwright/Puppeteer dependency, and an existing Node WebSocket CDP transport in
the production acceptance helper. `test/browser-cdp.mjs` copies only that generic
transport unchanged. Extraction initially failed the suite's frozen acceptance
hash; the acceptance file was restored byte-for-byte rather than repinning the
oracle. The small duplicate is intentional until a new protocol permits sharing. The new
repository-only `test/browser-smoke.mjs` imports only this generic transport and
Node built-ins, never acceptance tasks, assertions, selectors or expected answers.
No dependency, package export, CLI package command, compiler or browser runtime
is added. The historical adapter/protocol/budgets and archived raw evidence are
unchanged; a future protocol must pin both public utility files if it uses them.

### Public Shell Use

Run a production build separately. From this checkout, inspect any trusted local
Kudzu or React/Vite build directory using the same command:

```bash
CHROME_BIN=/usr/bin/google-chrome node test/browser-smoke.mjs /absolute/app/dist '[{"op":"open","path":"/"}]'
```

The caller may supply an ordinary UI journey using names learned from its own
page, not from an acceptance suite. For example, a page with a Message label and
Apply button can be exercised with:

```bash
node test/browser-smoke.mjs /absolute/app/dist '[{"op":"open","path":"/"},{"op":"fill","role":"textbox","name":"Message","value":"Hello"},{"op":"click","role":"button","name":"Apply"},{"op":"expect-text","text":"Hello"}]'
```

`open`, `snapshot`, `fill`, `click`, and caller-authored `expect-text` are the only
operations. Actions resolve one exact Chrome accessibility-tree role/name pair;
duplicate, absent, disabled or unfocusable targets fail. Native CDP keyboard/text
input and mouse clicks drive the page, not framework state mutation. Every command
emits a JSON line with its input, success/failure, elapsed milliseconds, rendered
`body.innerText` (4,000 characters maximum) and named accessibility entries (60,
160 characters per name). Truncation is explicit. `expect-text` checks the full
rendered body for the caller's substring, not raw HTML or inert template content.
The final record reports observed runtime/request/HTTP errors; these and failed
commands exit nonzero. Successful dispatch is not proof of the intended effect:
inspect the next snapshot or supply your own expected rendered text.

### Boundaries And Cost

Linux Chrome and Node's existing WebSocket support are required. Each invocation
owns one ephemeral loopback static server, fresh Chrome process group and profile;
no persistent daemon, external URL argument, API fixture, arbitrary evaluation
command, backend proxy, grader call, selector registry or build is provided.
The server serves GET/HEAD files beneath the real build root, rejects traversal
and escaping symlinks, and has no SPA fallback. Chrome's fixed proxy configuration
bypasses only that server; all proxy requests are rejected without forwarding,
including other loopback services. This is a network guard for trusted local
smoke work, **not isolation or a security sandbox**: Chrome uses the existing
`--no-sandbox` test convention, and local processes can access loopback CDP.
Do not run untrusted artifacts or use credentials. OS/container isolation remains
necessary for hostile applications; API/remote-resource journeys are unsupported.

At most 20 commands / 16,384 input characters run under a 30-second work deadline.
Each observation waits 150 ms, not network-idle or application readiness; slow
apps can require another snapshot or fail truthfully. Success, failure, deadline,
SIGINT and SIGTERM paths close server connections, kill the Chrome process group,
await its exit and remove the profile (up to five 100-ms removal retries). SIGKILL
of the parent cannot run cleanup; the outer runner must retain process-tree
cleanup. Startup port discovery is separately bounded at 10 seconds. Internal AX
tree retrieval is not size-limited, although returned observations are bounded.
No screenshots, iframe/shadow interaction guarantee, mobile matrix, full keyboard
journey, screen-reader result, JS-disabled proof or exhaustive accessibility audit
is claimed. Raw artifact/script/static checks remain separate and unchanged.

The generic DOM regression requires no framework-specific markup or runtime. It
covers comment-separated rendered text, inert/hidden exclusion, labeled input,
button-driven DOM replacement, false expectations, missing targets, external URLs,
escaping symlinks, another loopback service, output truncation, timeout cleanup and
nonzero CLI failure. Static source bytes remain unchanged. Initial test development
also caught an overly specific expected navigation error and Chrome background
proxy traffic; both were corrected without weakening page-error reporting.

No model rerun or paid benchmark was performed. AI tokens/dollars, success rates,
timing savings and cross-framework cost effects are **unmeasured**, not zero.
Semantic primitives, core passes/LOC, normalization/adapter rules, runtime concepts,
dependencies and deployed browser-byte deltas for this follow-up are all zero.
The test is functional smoke evidence, not a browser performance measurement.

A future explicitly named experiment may place only these two generic utility
files and the same command documentation inside both isolated model workspaces.
It must explicitly permit browser shell use after build, expose no test/grader
files or task-specific selectors, retain model-authored commands and stdout/stderr,
and count each shell call under ordinary tool/time/token budgets. Inner commands
are separately visible observation/action counts, not extra model tool calls.
Freeze the utility, Chrome version/flags, permissions, prompts and budgets equally
for both frameworks before running. The unchanged historical adapter currently
says to build and stop; silently injecting browser access would change protocol.
The next genuine step is that reviewed future-protocol freeze, not a selective
retry or a full-50 rerun. R8/R9/R10 scores remain historical and 1.0 remains blocked.

### Verification

Final gates ran sequentially with 1,200,000-ms command timeouts on Chrome
152.0.7977.64: `npm run check` passes (227 pages, 2 interactive),
`KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test` passes
standalone 1/1 plus 317/317 (zero failures/cancellations/skips), and
`npm run test:package` passes (fresh install, 3 pages, 1 interactive).
The final smoke regression takes 13.146 seconds inside the full test suite and
also kills an intentionally stalled renderer under its 2-second work deadline;
this duration is not a browser-operation or AI-cost benchmark. The earlier full
suite's sole failure was the frozen-oracle hash after extraction; restoring the
file exactly fixes that failure, and the original hash gate passes unchanged.
`git diff --check` passes. This follow-up adds 132 smoke-utility lines, 51 generic
transport lines and 55 regression lines (including blanks/comments); compiler and
deployed-runtime LOC are unchanged. All four imported-search fixtures retain
32,190 raw / 12,324 aggregate gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Only verification metadata was added after these gates. Existing dirty summary
and report edits remain intact; no commit, push, tag, version bump or release.

## Local Summary Candidate R10 (2026-09-09)

**The summary works as a bounded lexical inventory, but has not demonstrated an
AI-cost advantage.** The independent ten-attempt Content experiment finishes at
Kudzu **4/5 versus React + Vite 5/5**, with all ten first builds, final builds,
and frozen Chrome acceptance journeys passing. Failure-inclusive tokens are
**1,742,479 versus 467,550 (3.727x)**. Kudzu improves against historical r9 in
absolute tokens, but React improves more; every Kudzu agent still repeats the
marker scan. This does not clear the AI delivery or 1.0 gate. No additional
verification heuristic, browser sandbox, compiler semantic, or release was added.

### Build Review And Measurement

Review confirmed that the summary reads only current generated route paths after
public copying and the trusted executable `afterBuild` hook, prints after
successful promotion, JSON-quotes bounded path samples, and counts read failures
separately. It consumes no cached artifact-report paths. It is not a security
boundary: comments, inert templates, JSON-LD and arbitrary link attributes can
match, while inline event attributes and JavaScript URLs are not checked.
Trusted hooks can already execute arbitrary code and mutate output. No browser,
content, script-freedom, or accessibility certification follows from these counts.

The initial sequential scan measured +5.03% at 1,011 pages, motivating the only
production correction: reuse the existing **64-file batch size**, classify reads
concurrently, and accumulate results in sorted order. This retains at most 64
in-flight file reads rather than a promise per route. The existing regression
now crosses a batch boundary with 72 routes and asserts exact sorted samples,
71 marked files, one unreadable file, and the omitted count. Quiet/JSON behavior
and all existing byte-parity and failure-exit assertions remain unchanged.

Commands use the maintained `test/commerce-build-performance.mjs` with
`APP_ROOT=/tmp/opencode/summary-candidate-20260909/shop`,
`BASELINE_ROOT=/tmp/opencode/summary-candidate-20260909/baseline`,
`CANDIDATE_ROOT=/tmp/opencode/summary-candidate-20260909/candidate`,
`RUNS=21`, and `CATALOG_SIZE=100` or `1000`. Both implementations use the same
installed compiler dependencies. Baseline is the retained released 0.16.27
registry tarball; candidate is an isolated working-tree snapshot. The external
fixture is unchanged `f2d5be1a516c539e30f7125f6870d42b1dd02ecd`; generation and
manifest hashing are outside timing. Normal output is captured, not suppressed.
Each size/revision comparison discards one warm-up per target and runs 21
alternating fresh-process clean builds. The first preparation attempt failed
before sampling because commerce-data had not been built; its logs remain.
An isolated copy of that package was installed/built before both measured series.

| Scan | Pages | Baseline Median ms | Candidate Median ms | Change | Paired Median ms |
|---|---:|---:|---:|---:|---:|
| Initial sequential | 111 | 2,952.1 | 2,986.7 | +1.17% | +22.8 |
| Initial sequential | 1,011 | 7,127.6 | 7,486.2 | +5.03% | +313.6 |
| Final batched | 111 | 2,466.3 | 2,584.6 | +4.80% | +50.2 |
| Final batched | 1,011 | 6,137.8 | 6,123.7 | -0.23% | +102.2 |

Final ranges are 2,270.6-2,627.9 versus 2,303.5-2,697.7 ms at 111 pages,
and 5,536.5-6,476.3 versus 5,634.0-6,508.3 ms at 1,011 pages. Paired percentage
medians are +2.01% and +1.60%. There is no established repeatable >5% final
slowdown, but overlapping ranges, visible host-frequency/load drift, and no CPU
pinning preclude claiming a speedup or zero overhead. No 10,000-route, peak-RSS,
browser-timing, or cross-framework build claim is made.

All measured builds preserve every deploy path and byte: 153 files / 1,378,806 B
at 111 pages and 1,053 files / 10,140,618 B at 1,011 pages. The larger output
contains 55,657 raw / 24,378 aggregate gzip JavaScript bytes, unchanged from
baseline. Full manifests, artifact classes, raw timing arrays, paired differences,
environment, source hashes, preparation failure, and reproducible fixture inputs
are retained in `build-audit.json`, `build-*.stdout`, and `build-inputs/` below.
The batch correction adds six net lines over the initial implementation:
build orchestration is now +31 net lines versus release; semantic-core LOC,
primitives, passes, normalization/adapter rules, runtime concepts, dependencies,
and browser-byte deltas remain zero.

### Frozen AI Experiment

Evidence root:
`test-results/ai-delivery-production/summary-candidate-20260909/`.
The package snapshot alone is versioned `0.16.27-summary.20260909.1`; the workspace
remains 0.16.27. The packed files differ from release only in `framework/build.mjs`,
README, and the snapshot package version. A frozen absolute `file:` tarball pin
and SHA-512 lock integrity install through the unchanged adapter's `npm ci`.
A separate install verified the actual installed version and build source before
model execution. No mutable package symlink or framework-only hidden instruction
is supplied to agents. Restore the tarball at the exact `freeze.json` path to
reproduce the local pin; this is not a published-registry release comparison.

The schedule ran serially from 01:28:41.403 to 01:50:26.203 UTC (21m 44.800s).
The model remains `openai/gpt-5.6-sol`, OpenCode 1.18.27, Node 24.14.0,
npm 11.9.0, and Chrome 152.0.7977.64 on Linux x64, Intel i5-9500 (six logical
CPUs, 33,491,050,496 bytes RAM). Model, budgets, tool rules,
adapter, scorer, task, public context, React 19.2.8 / Vite 8.2.2 starter, authored
Kudzu starter, and schedule match r9. Only Kudzu package identity/pin/lock/digests
and experimental revision metadata change. Canonical protocols and historical
r9 archives remain untouched. No retry, omitted attempt, or model switch occurred.

| Failure-Inclusive Metric | Kudzu Candidate | React + Vite |
|---|---:|---:|
| Successes / scheduled | 4/5 | 5/5 |
| Final builds / acceptance passes | 5/5 / 5/5 | 5/5 / 5/5 |
| Uncached input tokens | 222,925 | 98,291 |
| Cache-read input tokens | 1,502,336 | 358,912 |
| Cache-write tokens | 0 | 0 |
| Output tokens | 14,610 | 8,369 |
| Reasoning tokens | 2,608 | 1,978 |
| Total tokens | 1,742,479 | 467,550 |
| Tokens per success, rounded | 435,620 | 93,510 |
| Median total tokens | 321,164 | 91,237 |
| Median steps / elapsed ms | 14 / 157,611 | 6 / 90,893 |
| Median tools / unique read paths | 33 / 11 | 18 / 12 |
| Median modified paths / model builds / correction cycles | 2 / 1 / 0 | 2 / 1 / 0 |
| Before-build steps / tokens | 40 / 688,742 | 20 / 262,974 |
| First-build steps / tokens | 5 / 125,861 | 5 / 91,226 |
| After-build steps / tokens | 32 / 927,876 | 6 / 113,350 |
| Before / after exploration calls | 69 / 50 | 70 / 5 |

K2 alone fails the input budget: 509,949 > 400,000, with 515,209 total tokens.
Its passing build/acceptance does not remove that failure from cost denominators.
All attempts change only the article page/App and CSS. Exact per-attempt token,
cache, timing, tools, phases, source changes and hashes are in `attempt-metrics.md`
and `audit.json`. Phase accounting matches r9: whole first-build message boundaries;
elapsed includes adapter installation/agent time but excludes runner acceptance.
Provider-reported subscription dollars are zero, not a claim of zero compute cost.
The ten attempts cost 2,210,029 recorded tokens; the availability-only preflight
adds 6,727, for **2,216,756** total experiment tokens.

Relative to r9, Kudzu total tokens fall 13.02%, post-build tokens 17.61%, and
median elapsed 9.23%; React total tokens fall 20.12%. The Kudzu/React aggregate
token ratio worsens from 3.423x to 3.727x. Five attempts per variant, service/cache
drift, the local pin, and separate schedules cannot establish causal savings.

### Verification Quality

All five Kudzu agents read README's verification section and receive the summary
and browser warning. **All five still scan emitted HTML for script/preload
markers.** K1/K2/K3/K4 also inspect generated JavaScript. K2 first asserts a
nonexistent binding marker, then counts an inert row template as a seventh card,
then relaxes to link presence and minified-code regexes. Its promised check of
rendered semantics never runs in a browser. K4 hits unavailable `rg` and does not
explicitly disclose that failed command in its final answer. The summary has not
eliminated the targeted redundant inventory or inaccurate verification claims.

No agent on either side runs a browser journey, follows the warning URL, or uses
inspect/explain. React R1-R4 stop after build; R0 reads five source/output files.
The unchanged runner independently executes all ten Chrome journeys, so lower
cost does not result from dropping required builds or scored acceptance. No
source edits follow any first build. All five Kudzu agents search installed
compiler/runtime source; none records an excluded-evidence read, out-of-workspace
file access, or webfetch. Public source remains available, not sandboxed.

Source review retains normal hooks, declarative filters/cards, associated native
labels, polite live counts, original content/metadata/links and focus CSS.
The frozen scorer covers search transitions/restoration, visible live summaries,
one h1/no positive tabindex, browser errors/requests, and ten script-free static
siblings. It still does not exhaustively verify keyboard focus, screen readers,
every route navigation, or responsive layout. Passing is not full accessibility
approval. Acceptance-passing deploy medians, including the budget failure, are
68,462 raw / 26,408 gzip B versus 206,284 / 66,369 B; observed JS transfer is
37,608 versus 199,165 B. This browser-byte advantage is not an AI-cost win.

The audit rechecks r9 and r10's 20 result/trace pairs, 120 command-stream hashes,
340 artifacts and 330 source entries. Candidate tarball SHA-256:
`b0506065f01c334688a63261e66d1bf220ff8a72ddabed3f74480dab72299634`.
Protocol SHA-256:
`a9f737ee3a051cc7ebe44d4e9dbede3fb2ed27a6932bf19bb4df8e170fbe85be`.
Exact packed-source digest, per-file hashes, lock integrity and binary digest
are in `freeze.json`. Packed-source SHA-256:
`87861fb74edb007a3a2ab330c14fbdde3dd361bce811da52bb9d738913a856f9`.

Final checks ran sequentially with 1,200,000 ms timeouts: `npm run check`
passes (227 pages, 2 interactive); `KUDZU_REQUIRE_CHROME=1
CHROME_BIN=/usr/bin/google-chrome npm test` passes standalone 1/1 plus 316/316,
zero failures/cancellations/skips; `npm run test:package` passes a fresh packed
install (3 pages, 1 interactive). Focused build-output tests pass 7/7.
All four imported-search browser fixtures retain 32,190 raw / 12,324 aggregate
gzip JS bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
The site scan reports 144 without markers, 83 with markers (including JSON-LD),
zero unreadable. Exact command times and logs are in `verify-execution.json`.
`git diff --check` passes. Only this verification metadata and evidence archival
follow those gates; production source and tests are unchanged afterward.

The self-contained local evidence archive is
`test-results/ai-delivery-production/summary-candidate-20260909-audited.tar.gz`,
with its SHA-256 in the sibling `.sha256` file, not recursively inside itself.
It retains both core tarballs, frozen inputs, all ten attempts, source/trace/output
audits, build samples and inputs, checks, patches, and evidence manifest.
Archive creation rechecks candidate hashes and both original r9 archive checksums.
No release, commit, push, tag, or main-version change occurred.

## Initial Unreleased Route HTML Build Summary (2026-09-09)

This is the initial implementation record. The batched correction and independent
r10 measurements above supersede its sequential-read and unmeasured-cost status;
its historical verification results and r9 evidence are not rescored.

The r9 evidence below remains historical and unrescored. Its retained
`verification-review.txt` shows every Kudzu attempt scanning emitted HTML after
the first passing build; K2 (`content-kudzu-1`) repeatedly greps scripts/preloads,
and K4 (`content-kudzu-3`) repeats the inventory with unavailable `rg`. Other
attempts additionally mistake inert templates for visible cards or search
minified JavaScript for behavior. The documentation-only hint did not eliminate
this work. This follow-up addresses only the repeated route-file marker inventory,
not visible content or browser acceptance.

`framework/build.mjs` now scans fresh generated route `index.html` files after
public copying and `afterBuild`, buffers the summary, and prints it only after
successful promotion. The existing build count and browser-verification hint stay
intact. No command, flag, dependency, cache, schema, build return contract, or
browser capability was added. `inspect` and `explain` still rebuild: reusing
`.kudzu/kudzu-artifacts.json` would require freshness and post-hook validation,
and its v2 compiler-owned dependency closure cannot certify final HTML. This
change never reads an arbitrary cached report or takes file paths from it.

Example from the runnable two-route regression:

```text
Built 2 page(s), 1 interactive page(s) into dist/
Route HTML scan: 1 without script/modulepreload text markers, 1 with markers, 0 unreadable.
  With markers: "dist/search/index.html"
Browser behavior and accessibility need verification: https://kudzujs.cloud/docs#build
```

The scan is explicitly lexical: case-insensitive `<script` followed by whitespace,
`/` or `>`, or a `<link` opening-tag text span containing the word `modulepreload`.
Escaped code examples and ordinary prose do not match. Comments and inert content may match;
inline event attributes, JavaScript URLs, browser requests, visible text, content
completeness, accessibility and behavior are not certified. Public HTML outside
the generated route inventory is excluded. Read errors are counted, never treated
as absence of markers, and do not change existing build exit semantics. Up to
five JSON-quoted paths per nonempty category are printed in sorted output-path
order, each limited to 240 characters plus an ellipsis, with omitted counts.
Paths refer to physical output files even under a configured URL base. Later
external output mutations are not covered.

One new CLI regression first failed because the build exposed none of these
facts. It now covers a wholly static output with no JS files, static/interactive
siblings, post-hook mixed-case script/preload injection despite static compiler
metadata, a removed route, base paths, and the five-path bound. Existing output
safety tests assert no summary on failed builds. Normal versus quiet/JSON builds
retain byte-identical deploy files and artifact JSON; existing inspect/explain
determinism tests also pass. Summary strings are absent from emitted JavaScript.

Measured fixture output: **133 additional stdout bytes**, **4,985 raw / 2,591
aggregate gzip JS bytes unchanged**, and **0 JS files** for the static-only
build. Production orchestration delta: **+25 net physical lines** in build.mjs;
semantic-core LOC, semantic primitives, core passes, normalization/adapter rules,
runtime concepts, and dependencies: **0 delta**. One regression added and one
existing output assertion updated. Normal builds perform one additional sequential
read per generated route, retaining one file at a time; quiet/JSON builds skip
the scan. No build-speed or scale benchmark improvement is claimed, no new model
benchmark was run, and **AI token savings remain unmeasured**.

Verification ran sequentially with 1,200,000 ms timeouts: focused
`node --test test/build-output.test.mjs` passes 7/7; `npm run check` passes
(227 pages, 2 compiler-interactive; 144 without markers, 83 with markers, zero
unreadable); `KUDZU_REQUIRE_CHROME=1 npm test` passes standalone 1/1 plus 316/316,
with no skips or failures; `npm run test:package` passes a fresh packed install
(3 pages, 1 interactive; 2 without markers, 1 with markers). Site marker counts
include JSON-LD scripts injected by its existing SEO hook, not just executable
JavaScript. The four maintained imported-search browser fixtures retain their
32,190 raw / 12,324 aggregate gzip JS bytes and runtime hash
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
These are regression observations, not a new cross-framework timing comparison.
The final edits after these gates only record verification evidence.
No commit, push, release, or version bump is part of this follow-up.

## 0.16.27 Focused Content R9 (2026-09-09)

**No, Kudzu does not use less of everything.** In the authorized contemporaneous
Content-only comparison, Kudzu succeeds **3/5 versus React + Vite 5/5**, consumes
**2,003,387 versus 585,279 tokens (3.423x)** including failures, and has a
**173,645 versus 110,585 ms** all-attempt elapsed median. Deploy outputs are
smaller, but AI delivery cost, elapsed time, and tools are not lower. This is
ten attempts, not a new full-suite score. Historical r8 remains 23/25 versus
24/25; the AI delivery gate and `1.0.0` remain blocked.

### Recovery And Protocol

The initial inspection found a clean worktree at
`e37999809d2252dfa6f7772b63b9ba61f38c66dd`, no live benchmark runner/adapter,
and an actually interrupted r9: eight completed results (four successes per
variant), a partial ninth `content-kudzu-4`, and an unstarted `content-react-vite-4`.
The original `run.json` still says `running`; it was not rewritten as complete.
All original files were archived intact before restarting. Termination time and
cause are unknown beyond the user-reported aborted task. No selective retries,
replacement of failures, or merging of the eight results into the restart.

The identical frozen ten-entry schedule ran serially from
2026-09-08 23:42:08.998 to 2026-09-09 00:06:50.655 UTC (24m 41.657s).
All ten traces are complete and attributable, with no provider errors. The
availability-only preflight used the authorized `openai/gpt-5.6-sol`; no model
switch occurred. OpenCode 1.18.27 was explicitly selected by its preserved binary,
with Node 24.14.0, npm 11.9.0, and Chrome 152.0.7977.64. All model, adapter,
scorer, task, budget, React, and schedule fields match r8. Only the frozen Kudzu
registry pin/lock/integrity, corresponding digests, and revision metadata differ.
Canonical full-suite protocols were not edited.

Evidence root:
`test-results/ai-delivery-production/0.21.4-content-only-r9-kudzu-0.16.27-restart-20260909-01/`.
It retains `freeze.json`, `interruption.json`, original-file manifest, preflight,
execution, `content/run.json`, all ten attempts, `audit.json`, `summary.json`,
`attempt-metrics.md`, full source diffs, and per-tool verification review.

### Failure-Inclusive Costs

Tokens below are sums over all five attempts per variant, not successful-only
subsets. Cache-read input counts toward the unchanged 400,000-input-token budget.
Cache write is zero throughout. Provider total equals uncached input + cache
read + output + reasoning. Reported subscription dollars are zero, not evidence
of zero compute cost or a cache-discount invoice.

| Metric | Kudzu | React + Vite |
|---|---:|---:|
| Successes / scheduled | 3/5 | 5/5 |
| Final builds / acceptance passes | 5/5 / 5/5 | 5/5 / 5/5 |
| Uncached input tokens | 207,327 | 159,982 |
| Cache-read input tokens | 1,773,568 | 414,336 |
| Cache-write tokens | 0 | 0 |
| Output tokens | 17,347 | 8,812 |
| Reasoning tokens | 5,145 | 2,149 |
| Total tokens | 2,003,387 | 585,279 |
| Failure-inclusive tokens per success, rounded | 667,796 | 117,056 |
| Median total tokens | 387,108 | 90,313 |
| Median uncached / cache-read tokens | 40,161 / 348,288 | 33,930 / 69,120 |
| Median output / reasoning tokens | 3,236 / 947 | 1,700 / 414 |
| Median model steps | 16 | 6 |
| Median elapsed ms | 173,645 | 110,585 |
| Median normalized tool calls | 34 | 19 |
| Median unique read-tool paths | 11 | 10 |
| Median modified paths | 2 | 2 |
| Median model builds / correction cycles | 1 / 0 | 1 / 0 |

Elapsed is frozen adapter time, including installation and agent activity but
excluding the runner's subsequent build/acceptance. Tool/read/write metrics use
the unchanged adapter normalization, not all filesystem I/O: shell reads are
not unique read-tool paths, and one patch touching two files counts twice.
Correction cycles mean additional model build calls, not verification-script
repairs. Every model first build succeeds; all attempts make exactly one build.

IDs use the protocol's zero-based ordinals. All rows modify two paths, make one
model build, and have zero correction cycles. All pass final build/acceptance.

| Attempt | Result | Total | Uncached | Cache read | Output | Reasoning | Elapsed ms | Tools | Reads | Pre / build / post tokens |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| K0 | pass | 387,108 | 34,793 | 348,288 | 3,236 | 791 | 173,645 | 31 | 11 | 143,514 / 26,863 / 216,731 |
| R0 | pass | 85,836 | 33,930 | 49,792 | 1,700 | 414 | 119,519 | 19 | 14 | 34,126 / 16,272 / 35,438 |
| R1 | pass | 80,888 | 20,794 | 58,112 | 1,512 | 470 | 79,296 | 11 | 6 | 40,711 / 19,788 / 20,389 |
| K1 | pass | 323,276 | 49,535 | 270,080 | 2,722 | 939 | 160,869 | 34 | 9 | 143,254 / 26,587 / 153,435 |
| K2 | budget fail | 503,066 | 44,128 | 453,376 | 4,191 | 1,371 | 226,222 | 43 | 16 | 165,794 / 32,145 / 305,127 |
| R2 | pass | 90,313 | 19,372 | 69,120 | 1,560 | 261 | 81,737 | 16 | 9 | 53,258 / 18,253 / 18,802 |
| R3 | pass | 151,190 | 36,627 | 112,256 | 1,946 | 361 | 110,585 | 20 | 10 | 95,109 / 18,243 / 37,838 |
| K3 | pass | 284,039 | 38,710 | 241,664 | 2,568 | 1,097 | 157,055 | 27 | 10 | 142,344 / 26,342 / 115,353 |
| K4 | budget fail | 505,898 | 40,161 | 460,160 | 4,630 | 947 | 234,731 | 39 | 12 | 143,688 / 26,680 / 335,530 |
| R4 | pass | 177,052 | 49,259 | 125,056 | 2,094 | 643 | 118,667 | 24 | 12 | 95,195 / 18,206 / 63,651 |

K2 exceeds input 497,504 > 400,000 and tools 43 > 40. K4 exceeds input
500,321 > 400,000. Both remain in all cost denominators; neither is a compiler,
source-acceptance, static-output, or scored-accessibility failure.

### R8 And Verification

Phase boundaries reuse r8 exactly: completed model steps before the first build
tool's message ID, that whole message, and all later steps. Exploration means
read/grep/glob/list/webfetch and non-build shell calls, not writes or todo tools.

| Five-attempt aggregate | R8 Kudzu | R9 Kudzu | R8 React | R9 React |
|---|---:|---:|---:|---:|
| Successes | 3 | 3 | 5 | 5 |
| Total tokens | 1,882,130 | 2,003,387 | 662,109 | 585,279 |
| Before-build steps / tokens | 40 / 701,385 | 40 / 738,594 | 27 / 382,269 | 24 / 318,399 |
| First-build steps / tokens | 5 / 128,693 | 5 / 138,617 | 5 / 95,199 | 5 / 90,762 |
| After-build steps / tokens | 33 / 1,052,052 | 34 / 1,126,176 | 9 / 184,641 | 9 / 176,118 |
| Before / after exploration calls | 73 / 55 | 76 / 63 | 63 / 2 | 56 / 11 |
| Total read-tool calls | 66 | 66 | 47 | 51 |
| All-attempt median elapsed ms | 167,942 | 173,645 | 110,107 | 110,585 |

Kudzu total tokens rise 6.44% and post-build tokens rise 7.05% from r8; React
total tokens fall 11.60%. The released guidance has no demonstrated cost win in
this sample. Five attempts per variant, service/cache/environment drift, the
interrupted predecessor, and different dates preclude a causal A/B claim or
isolating the README from the console hint.

All five Kudzu agents receive the new build hint and read README lines covering
Verify before their first build. None follows the URL with webfetch, uses
inspect/explain, or runs an agent-owned browser journey. K1 searches for installed
browser-test packages but does not execute one. All ten agents run the required
TypeScript/production build; the unchanged runner independently executes all ten
final builds and Chrome acceptance journeys. React R1/R2/R3 stop without further
tool calls after build; R0/R4 inspect source/output. Required build or scorer
checks were not dropped to produce React's lower cost, but agent-only browser
verification is absent on both sides and is not credited as completed.

K0 mistakes an inert row prototype for a seventh visible card, then relaxes to
link presence; its explanation about annotated classes is not the actual cause.
K2 repeats missing-`rg` commands (one pipeline prints a misleading zero), raw
card counts, text-marker matching, and an incorrect subtract-one adjustment.
K4 repeats literal `<p>6 articles</p>`, raw card counting, and minified-JS regex
assertions, then repairs a syntax error in its own check. These are verification
failures, not failing application builds. K3 ends after two missing-`rg` commands
without acknowledging them; prior grep evidence and independent acceptance do
not turn those failed commands into valid checks. No source edits follow the
first build in any attempt, so there is no missed rebuild of later source edits.

Four Kudzu agents (K0/K1/K3/K4) search installed compiler/runtime source and
receive source snippets. K2 reads public `core.d.ts` and `jsx-runtime.d.ts`.
No excluded evidence Markdown read, external workspace read, or webfetch appears
in the recorded tool inputs. The generic published README includes a relevant
search pattern. This is permitted public package context, not a blind test;
compiler source remains accessible and package cleanup is not a sandbox.

The frozen scorer covers the five search transitions/restoration, visible live
summary, one h1/no positive tabindex, browser exceptions/failed requests, and
static-file checks. It does not exhaustively verify the broader written contract:
all-route navigation, actual keyboard focus retention, screen-reader behavior,
responsive layout, or every accessible-name association. Source diffs retain
associated labels, native inputs/anchors, live regions, focus CSS, original data,
cards and metadata; no test/manifest/lock changes or imperative DOM replacement.
R0 uses default-locale `toLocaleLowerCase`, leaving non-default-locale behavior
unmeasured. Passing the frozen scorer is not full manual accessibility approval.

### Output And Evidence

All five Kudzu outputs preserve ten complete script-free static siblings.
Each variant emits eleven HTML documents. Source retention is 12/14 unchanged
files for Kudzu and 17/19 for React; only the article page/App and CSS differ.

| Acceptance-passing output median, including budget failures | Kudzu | React + Vite |
|---|---:|---:|
| Deploy raw bytes | 68,404 | 206,367 |
| Sum of per-file gzip bytes | 26,410 | 66,388 |
| Observed JS transfer bytes | 37,608 | 199,170 |

Kudzu is 66.85% smaller raw, 60.22% smaller gzip, and 81.12% lower observed JS
transfer. These are not CPU, heap, readiness, or a full performance-suite rerun.
This session changes no compiler/scorer/adapter: semantic primitives, core passes,
core LOC, runtime concepts, dependencies, and compiler fixtures all change by zero.

Audit verifies 28 completed result/run pairs (r8 Content 10, interrupted r9 8,
restart 10), 168 command-stream digests, 28 complete raw token/tool traces,
476 artifact entries including raw/gzip/digests, and 462 source-file entries.
The ninth original trace is separately verified as incomplete: 120,700 recorded
tokens (42,558 uncached, 76,160 cache read, 1,803 output, 179 reasoning), at least
107,187 ms and 18 normalized tools. Its final total and outcome remain unknown.
The eight completed original attempts used 2,076,425 tokens; they are excluded
from the restart comparison but not erased from expenditure. Each availability
preflight used 6,727 tokens. Total recorded focused-work expenditure including
both preflights and interrupted work is **at least 4,799,245 tokens**, not just
the 2,588,666-token fresh schedule. No further model calls were made.

Frozen protocol SHA-256:
`2b70e5b2209e1224c30d10eda7c951035324981324f5e9044fe046e40378cd13`.
Registry core tarball SHA-256:
`1d3dc2496585b2e78700ae3fef7b3890a87f046f83e0ce27ef0bb368095db175`.
Pinned OpenCode binary SHA-256:
`bddf894e5c2bc3d8cf452bd6e5ab2273bbe4a37eeeb9aec848d3d7d20db1f256`.
Original intact interrupted archive SHA-256:
`b446342df1db082708329a3644673f02715be0dc6a281203719546c3bb20b9f5`
(`0.21.4-content-only-r9-kudzu-0.16.27-20260908-01-interrupted-20260909-01.tar.gz`).
Exact per-attempt raw, trace, source, and artifact hashes are retained in
`audit.json` and the archive manifest. No commit, push, release, or version bump.

Required checks passed sequentially after the report/packet edits, each with a
1,200,000 ms command timeout: `npm run check` passed both TypeScript checks and
built 227 pages (2 interactive); `KUDZU_REQUIRE_CHROME=1
CHROME_BIN=/usr/bin/google-chrome npm test` passed standalone ownership 1/1 and
315/315 tests, no failures/cancellations/skips. The suite includes production
protocol/acceptance/lifecycle tests and packed-package smoke. All four imported
article-search variants retain 9 JS files, 32,190 raw / 12,324 aggregate gzip
bytes and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
`git diff --check` passes. Exact timestamps and logs are in `verify-execution.json`,
`check.stdout`, and `tests.stdout`. This paragraph is a subsequent verification
metadata-only update; no implementation changed after the checks. The final
local `-audited-20260909-01.tar.gz` and sibling `.sha256` hold the archive checksum
without a recursive checksum claim inside the archive. Historical r8 and original
interrupted inventories are checked again during archive creation.

## 0.16.27 Release Scope

The separately authorized release packages the completed r8 protocol/evidence
records and verification-guidance follow-up as core `0.16.27` and
`create-kudzu@0.1.152`. Earlier no-release statements below describe their
original sessions, not this transaction. Frozen r8 retains registry `0.16.26`,
23/25 versus 24/25, unchanged budgets, acceptance, and archived evidence.
No new benchmark or measured token benefit from this guidance is claimed.
Compiler semantics, runtime behavior, browser JavaScript, and prior internal-doc
package exclusions remain unchanged; framework changes are +3 net console LOC.
The new release page is static; current website version/content edits intentionally
change HTML. Publication-time CI, registry integrity, and fresh-install checks
remain required before this transaction is complete.

Release-tree verification ran sequentially with 1,200,000 ms command timeouts:
`npm run check` passed both TypeScript checks and built 227 pages (2 interactive);
`KUDZU_REQUIRE_CHROME=1 npm test` passed standalone ownership 1/1 plus 315/315,
without failures or skips; standalone `npm run test:package` passed. Both
`npm pack --dry-run --ignore-scripts --json` commands passed: core has 60 files,
992,116 unpacked / 200,814 gzip bytes; generator has 4 files, 13,937 unpacked /
5,499 gzip bytes. All four imported-search variants retain 9 JavaScript files,
32,190 raw / 12,324 aggregate gzip bytes and the digest recorded below. These are
regression/output checks, not a new performance benchmark or exhaustive manual
accessibility audit. This verification record is a subsequent documentation-only
update; registry integrity and fresh-install checks remain publication-time gates.

## Verification Guidance Patch (2026-09-08, Pre-Release Session)

User-approved follow-up to the completed r8 investigation, not a new model run.
All five Kudzu content first builds succeeded. The budget-failing ordinals 2/4
used literal `<p>6 articles</p>` or tag-stripping checks that confused binding
comments/inert templates with rendered text despite correct visible DOM.
Repeated minified artifact searches/reads added unnecessary context; ordinal 3's
missing `rg` in a pipeline produced misleading zeros. No compiler fix is justified.

The generic README Verify section and docs Build section distinguish compilation
from browser/accessibility verification, recommend bounded checks and affected
rechecks, and explain that optional `inspect --json` and exact-route
`explain --route /exact-path --json` both rebuild, with compiler/artifact-only
scope. The ordinary non-quiet success output links to that guidance without
certifying behavior or instructing agents to stop verification.

Patch footprint: four implementation/guidance/test files (`README.md`,
`src/components/docs/ReferenceSections.tsx`, `framework/build.mjs`,
`test/build-output.test.mjs`) plus this record and the application packet.
Framework source files changed: 1; core LOC: +3 net in build-console output only;
compiler passes/semantic primitives: +0; runtime concepts/API/dependencies: +0.
Existing tests extended, no new fixture. Browser JavaScript delta: 0 raw / 0 gzip B;
all four imported-search variants retain 9 files, 32,190 raw / 12,324 aggregate
gzip B and runtime digest
`f2f3df9f2dadbff0c9af957066bbd19bbf5fd9db63c93e8f75c3bdaf43b6705f`.
Output tests prove ordinary, quiet API, and JSON builds emit byte-identical fixture
artifacts; failed builds have no success hint and inspect/explain JSON stays clean.
The documentation page's HTML changes intentionally; no blanket website-byte
identity claim is made. Token savings and timing improvements are unmeasured.

Sequential verification, each with a 1,200,000 ms command timeout, passes:

- `node --test test/build-output.test.mjs`: 6/6, no skips.
- `KUDZU_REQUIRE_CHROME=1 node --test test/imported-article-search.test.mjs`: 6/6, no skips.
- `npm run test:package`: packed installation/imports/build and artifact assertions pass.
- `npm run check`: both TypeScript checks and 226-page build (2 interactive) pass.
- `KUDZU_REQUIRE_CHROME=1 npm test`: standalone ownership gate 1/1, then 315/315, no failures or skips.

These checks are not an exhaustive manual browser/accessibility audit. Existing
dirty r8 protocols, evidence, adapter/scorer/budgets, and historical scores are
preserved. No commit, push, release, version bump, or new model measurement.

## 0.16.26 R8 Measurement Authorization (2026-09-08)

The next authorized full production suite measures the combined released package
and README cleanup against r7, not speculative compiler changes. R8 changes only
the five Kudzu registry pins/locks, canonical hashes, and revision metadata;
model `openai/gpt-5.6-sol`, OpenCode 1.18.27, acceptance, budgets, prompts, public
contexts, React inputs, authored starter source, and all 50 scheduled attempts
remain fixed. Content first-build exploration/docs reads/model steps and actual
versus cached token accounting are predeclared audit targets. R7's 20/25 versus
25/25 and interrupted provenance remain unchanged; r5 acceptance differs.
Small samples and service/environment drift preclude causal proof. Compiler
source and public web remain accessible: package hygiene is not a sandbox.
Intention and raw evidence: `test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r8-kudzu-0.16.26-20260908-01/`.
The run completed as recorded below; no new compiler/release authorization follows.

### R8 Result

The unchanged 50-attempt suite completed continuously on September 8 from
04:44:22 to 06:28:51 UTC (104 minutes 29 seconds): **Kudzu 23/25 (92%) versus
React + Vite 24/25 (96%)**. All 50 traces are fully attributable; no attempt was
interrupted, selectively retried, or replaced. All final builds pass. Kudzu
passes 25/25 acceptance journeys, React 24/25. No provider errors are recorded.

| Task | Kudzu successes | React successes | Kudzu total tokens | React total tokens | Kudzu tokens/success | React tokens/success |
|---|---:|---:|---:|---:|---:|---:|
| Content | 3/5 | 5/5 | 1,882,130 | 662,109 | 627,377 | 132,422 |
| Forms | 5/5 | 5/5 | 511,606 | 452,066 | 102,321 | 90,413 |
| CRUD | 5/5 | 4/5 | 714,224 | 576,045 | 142,845 | 144,011 |
| Commerce | 5/5 | 5/5 | 299,598 | 293,274 | 59,920 | 58,655 |
| Realtime | 5/5 | 5/5 | 1,133,756 | 802,641 | 226,751 | 160,528 |
| Total | 23/25 | 24/25 | 4,541,314 | 2,786,135 | - | - |

Failure-inclusive median task cost is **142,845 versus 132,422 tokens**, Kudzu
7.9% higher. R7's Kudzu median remains unavailable because it had no content
success; do not replace that historical missing value. Successful-only elapsed
medians are 120,949 versus 114,211 ms. Both variants have median 15 tool calls,
5 files read, 2 modified, 1 build, and 0 correction cycles. These unequal success
subsets and small samples establish neither timing superiority nor a statistical
tie. The AI delivery cost/success gate and `1.0.0` remain blocked.

Kudzu content ordinals 2 and 4 fail only the 400,000-input-token budget at 482,891
and 495,436. They pass final acceptance and stay inside all other budgets.
React CRUD ordinal 4 completes its trace but asks what change is wanted despite
the supplied task, changes no files, and makes no model build call. The runner's
unchanged starter builds, then acceptance times out waiting for two memo rows.
Its 40,519 tokens and failed acceptance remain in the denominator; no retry or
scorer adjustment was made. A complete trace is not a completed implementation.

### Token Accounting

| Variant | Uncached input | Cache-read input | Cache-write | Output | Reasoning | Provider/adapter total | Reported subscription USD |
|---|---:|---:|---:|---:|---:|---:|---:|
| Kudzu | 779,436 | 3,687,296 | 0 | 53,373 | 21,209 | 4,541,314 | 0 |
| React + Vite | 662,525 | 2,062,208 | 0 | 43,181 | 18,221 | 2,786,135 | 0 |

The raw provider totals equal the frozen adapter sum of uncached input, cache
reads, output, and reasoning for this run: **7,327,449 scheduled tokens**. Cache
reads count as processed context under the unchanged budget, not new uncached
input. The provider reports subscription cost zero; no cache-discount dollar
invoice or market-price estimate is available, and zero dollars is not zero work.
The single no-tool availability preflight adds 6,735 recorded tokens outside the
schedule (6,730 input and 5 output, no cache/reasoning, reported $0). It is not a
delivery attempt. No other model calls were made. R7's separately interrupted
extra attempt remains partial with unknown total cost, not zero.

### Content Intervention Observations

Content token use falls from **2,832,760 to 1,882,130 (-33.6%)**, and success rises
from 0/5 to 3/5. Uncached input falls 307,060 to 187,672; cache reads fall
2,504,192 to 1,673,984. React content also falls 779,912 to 662,109 (-15.1%),
underscoring that the observed difference is not controlled causal attribution.

Phases use the first model build tool's message ID: completed steps before that
message, the build message itself, and all later steps. Exploration counts
read/grep/glob/list/webfetch and non-build shell calls; it excludes writes and
todo calls. It includes output inspection, not only documentation discovery.

| Kudzu content metric (five attempts) | R7 | R8 |
|---|---:|---:|
| Before-build model steps | 57 | 40 |
| Before-build exploration calls | 122 | 73 |
| Before-build tokens | 1,436,010 | 701,385 |
| First-build steps / tokens | 5 / 195,730 | 5 / 128,693 |
| After-build model steps | 28 | 33 |
| After-build exploration calls | 49 | 55 |
| After-build tokens | 1,201,020 | 1,052,052 |
| Total model steps | 90 | 78 |
| Total read-tool calls | 92 | 66 |
| Markdown read-tool calls | 22 | 5 |
| Excluded evidence Markdown read-tool calls | 18 | 0 |

All five r8 content agents read the generic README once, before their first
build; none directly reads the removed evidence documents. All five first builds
pass. Ordinal 4 makes a second successful build after source/CSS refinement, not
compiler-error recovery. Median total steps fall 18 to 14 and median pre-build
exploration calls 25 to 15, but aggregate post-build work remains substantial.
The next evidence-backed blocker is **content post-build context consumption
and stopping behavior under the existing budget**, not final content compiler
correctness. No speculative compiler feature is authorized.

This is a combined package/README intervention with five trials, model/service
variability, and an overnight interruption in r7. It cannot separate README
guidance from removed package material or prove causation. Four r8 content
attempts still search installed source; realtime ordinal 2 directly reads
`framework/core.mjs`, and other attempts read public type declarations. No
webfetch calls occur in r8, but public web and compiler access remain possible.
Package hygiene removes observed evidence reads, **not public-context isolation**.

### Output And Retention

All 25 Kudzu outputs pass static-sibling checks, including all ten content
siblings in each of five attempts. Declarative TSX, local/shared state, keyed
rendering, and effect ownership remain in authored source; no manifest or
lockfile changes occurred inside attempts. Byte-identical retained-file counts
per task are Kudzu 12/14, 6/7, 6/9, 9/11, 6/8; React 17/19, 8/9, 8/11, 9/11,
8/10, except failed CRUD retains all 11/11 unchanged. This file-level metric is
not a whole-application maintainability score. Full source diffs are in `audit.json`.

| Task | Kudzu deploy raw/gzip B | React deploy raw/gzip B | Kudzu observed JS B | React observed JS B |
|---|---:|---:|---:|---:|
| Content | 68,467 / 26,412 | 206,290 / 66,379 | 37,608 | 199,159 |
| Forms | 24,332 / 9,774 | 202,765 / 64,329 | 15,340 | 198,530 |
| CRUD | 53,462 / 16,810 | 203,388 / 64,474 | 35,542 | 198,492 |
| Commerce | 53,845 / 21,814 | 201,055 / 64,190 | 30,171 | 197,976 |
| Realtime | 46,254 / 16,129 | 202,523 / 64,239 | 35,863 | 199,072 |

These are acceptance-passing output medians, including budget-failed content but
excluding failed React CRUD. Gzip sums per-file Node gzip; JS is observed response
transfer size, not a CPU/heap/readiness or full 0.9 performance rerun. Four realtime
Kudzu attempts correct ref diagnostics, and one commerce attempt corrects an
arbitrary reactive call. These retained corrections do not authorize broader
ref/call semantics. Compiler primitives, core passes/LOC, runtime concepts,
normalization rules, and compiler fixtures all change by zero.

### R8 Evidence

`freeze.json` pins base `439d1fd9dba5ebeee6f02de79c0198fd25544782`, all five
canonical protocol/starter hashes, registry SHA-512, and the downloaded core
tarball SHA-256 `5643885aa41132990631fbca041d1a111060c97aa21d07285a8c6d04a4678247`.
Environment: Linux x64 7.0.0-30-generic, Intel i5-9500 (6 logical CPUs),
33,491,050,496 bytes RAM, Node 24.14.0, npm 11.9.0, Chrome 152.0.7977.64,
OpenCode 1.18.27 (preserved binary explicitly selected through `OPENCODE_BIN`;
default installed version is 1.18.29). No credentials or broad process dump
were inspected. The availability preflight succeeded before preparation.

`audit.json` verifies 50 result/run pairs and complete raw token traces, 300
command-stream hashes, 540 artifact entries with raw/gzip/digests, 545 archived
source files, unchanged authored starter inputs, and unchanged attempt manifests
and locks. `summary.json` retains phase token accounting, package/source access,
diagnostics, and source-retention details; `suite.json` retains official scores.
The run directory includes frozen r7/r8 inputs and preparation/execution/audit
scripts. All older raw and interrupted evidence remains untouched. No live
suite/runner/adapter remained after execution. Verification and archive metadata
are recorded after the final checks below.

Verification passes with 1,200,000 ms command timeouts: six focused integrity,
acceptance, and lifecycle tests; `npm run check` (226 pages, 2 interactive);
`KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test` (standalone
ownership gate plus 315/315 tests, no failures/skips); and `npm run test:package`
(3 pages, 1 interactive, two static controls). The earlier progress update's
count of nine focused checks was incorrect; the retained log records six.
All four imported-search variants retain 32,190 raw / 12,324 aggregate gzip JS
bytes. `git diff --check` passes. Logs and exact timestamps are retained in
`integrity.stdout`, `check.stdout`, `tests.stdout`, `package-smoke.stdout`, and
`*-execution.json`. No compiler, runner, adapter, scorer, package release version,
commit, push, or publication change occurred.

Full local raw archive:
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r8-kudzu-0.16.26-20260908-01-audited-20260908-01.tar.gz`
(4,271,388 bytes), SHA-256
`81bf1d782b68f66ea1891740e40c5bc09bd9b161c769a36b8178ca2604d2f7c6`.
Its 1,798-file SHA-256 manifest excludes only itself; a sibling `.sha256` file
records the archive digest. The r7 archive digest and all 1,707 historical
manifest entries verify unchanged, including interrupted provenance. Archives
remain local, not uploaded. This checksum paragraph is a subsequent metadata-only
update; the archived report and passing tests precede it, avoiding a recursive
archive-hash claim.

## 0.16.26 Release Scope

The separately approved release packages the r7 evidence records, generic README
authoring guidance, and npm allowlist/smoke assertions as core `0.16.26` and
`create-kudzu@0.1.151`. Compiler/runtime sources, dependencies, semantic primitives,
core passes/LOC, runtime concepts, and application browser capabilities are unchanged.
The 85-to-60-file and 536,166-to-200,431-gzip-byte comparison below is a historical
same-tree pre-release measurement, not the exact versioned release tarball size
or an AI-token savings claim. R7 remains frozen at released `0.16.25`, with 20/25
versus 25/25 and documented context-isolation limits. No model run, rescoring,
sandbox claim, or `1.0.0` authorization is part of this release. Earlier session
statements about no publication describe those sessions, not this transaction.

Release verification runs sequentially with a 1,200,000 ms command timeout:
`npm run check` builds 226 pages (2 interactive), `KUDZU_REQUIRE_CHROME=1 npm test`
passes the standalone ownership gate plus 315/315 tests without failures or skips,
and `npm run test:package` passes the actual packed consumer assertions. Both
`npm pack --dry-run --ignore-scripts --json` commands pass. The versioned core
dry-run reports 60 files, 991,259 unpacked bytes, and 200,431 gzip bytes; generator
reports 4 files, 13,937 unpacked bytes, and 5,499 gzip bytes. All four imported
search variants retain 32,190 raw / 12,324 aggregate gzip JavaScript bytes.
Registry integrity and fresh-install verification remain publication-time gates.

## 0.16.25 Release Scope

The following r5 compiler follow-up and future-only r6 acceptance alignment ship
as `@kudzujs/core@0.16.25` with `create-kudzu@0.1.150`. The session records below
retain their original pre-release scope and verification counts. Publication
does not rerun a model, rescore r5, upload its local raw archive, or establish a
timing/cost improvement. Frozen r6 starters remain pinned to released 0.16.24;
benchmarking the new compiler requires a separately frozen revision and full run.

## 0.21.4 Released 0.16.25 Rerun (2026-09-08)

The authorized r7 schedule is complete: Kudzu **20/25 (80%)** versus React + Vite
**25/25 (100%)**, with 50 fully attributable attempts. All 50 final builds and
acceptance journeys pass; Kudzu's five content attempts fail the unchanged
budgets. This does not authorize `1.0.0` or establish a causal improvement over
r5: r7 retains the revised r6 acceptance and prompt alignment, not r5's grader.
Historical r2, r3, and r5 evidence and scores remain unchanged.

### Frozen Inputs And Resume

R7 pins registry `@kudzujs/core@0.16.25`, React 19.2.8, Vite 8.2.2,
`openai/gpt-5.6-sol`, and OpenCode 1.18.27. The five canonical protocol/starter
hashes, registry integrity, original r6 input archive, install preflight, and
environment are in `freeze.json` and `install-preflight.json`. Model, adapter,
tools, budgets, React starters, and serial alternating schedules are unchanged
from the frozen r6 contract. No compiler or acceptance change occurred midrun.

Content completed on September 7 and was not rerun. On September 8, narrowly
scoped process inspection found no live runner/adapter/suite. Forms retained one
completed Kudzu success plus an interrupted React attempt. Its entire directory
was archived before moving to `forms-interrupted-20260908/`; the whole ten-attempt
forms schedule restarted, followed serially by CRUD, commerce, and realtime.
No interrupted attempt was merged into the 50-attempt score. Original suite logs
remain intact alongside new `resume-*.stdout`/`.stderr` logs and
`resume-provenance.json`. The restart is an operational interruption, not a
selective retry of a completed failure. Its extra work is outside the scheduled
denominator and is not free: the interrupted trace cannot establish total cost.

### Measured Results

Token cost per success includes all scheduled failures and cached input tokens,
plus output and reasoning as defined by the frozen adapter. Provider-reported
subscription dollars are zero, not a market-price or zero-work claim.

| Task | Kudzu success | React success | Kudzu recorded tokens | React recorded tokens | Kudzu tokens/success | React tokens/success |
|---|---:|---:|---:|---:|---:|---:|
| Content | 0/5 | 5/5 | 2,832,760 | 779,912 | unavailable | 155,982 |
| Forms | 5/5 | 5/5 | 504,651 | 469,925 | 100,930 | 93,985 |
| CRUD | 5/5 | 5/5 | 688,701 | 663,721 | 137,740 | 132,744 |
| Commerce | 5/5 | 5/5 | 398,400 | 305,981 | 79,680 | 61,196 |
| Realtime | 5/5 | 5/5 | 1,098,282 | 889,312 | 219,656 | 177,862 |

Kudzu's prescribed median across all five task costs is unavailable because
content has no success; it must not be replaced by a four-task median. React's
median is 132,744 tokens. Successful-only elapsed medians are 116,041 ms versus
112,935 ms; tool calls 14 versus 15; files read 5 versus 5; files modified 2 versus
2; build attempts 1 versus 1; correction cycles 0 versus 0. These are descriptive
medians over unequal successful subsets, not a timing superiority or tie claim.

Every content Kudzu attempt builds on its first recorded model build and passes
all ten static-sibling checks. Failures are exclusively budget overruns:

| Ordinal | Input tokens (limit 400,000) | Other exceeded limits |
|---:|---:|---|
| 0 | 579,172 | 48 tool calls (limit 40) |
| 1 | 524,765 | none |
| 2 | 422,456 | none |
| 3 | 563,417 | none |
| 4 | 721,442 | 47 tool calls; 24 files read (limit 20) |

The next measured blocker is content documentation/context consumption under
the existing budgets, not a failing final content compiler or browser result.
All five realtime Kudzu attempts recover from initial ref diagnostics with a
second build; one commerce attempt recovers from an arbitrary reactive-call
diagnostic. These corrections do not prove general persistent-ref support.
Source diffs in `audit.json` preserve declarative authored-source changes and
show no manifest/lockfile edits; source retention is byte-identical-file based,
not a whole-application maintainability score.

### Browser Output

These are medians over acceptance-passing outputs, including the five
budget-failed content outputs. Deploy gzip is the sum of per-file Node gzip,
while JS transfer is the acceptance browser's observed response transfer size.
Neither is a full CPU/heap/readiness or 0.9 cross-framework performance rerun.

| Task | Kudzu deploy raw/gzip B | React deploy raw/gzip B | Kudzu observed JS B | React observed JS B |
|---|---:|---:|---:|---:|
| Content | 68,530 / 26,426 | 206,313 / 66,366 | 37,609 | 199,174 |
| Forms | 24,284 / 9,769 | 202,763 / 64,310 | 15,292 | 198,528 |
| CRUD | 53,483 / 16,818 | 203,364 / 64,473 | 35,542 | 198,484 |
| Commerce | 53,763 / 21,803 | 201,054 / 64,187 | 30,152 | 197,975 |
| Realtime | 45,500 / 16,069 | 202,509 / 64,226 | 35,854 | 199,041 |

### Audit And Limitations

`integrity-audit.json` verifies all 50 result/run pairs, ordered schedules,
current/frozen protocols, manifests and locks, 50 raw token traces, 300 command
stream SHA-256 values, and 540 artifact entries with raw/gzip sizes and digests.
It also verifies the untouched completed content run and interrupted archive
against resume provenance. `audit.json` retains source diffs, diagnostic history,
provider errors (none), and package reads. No live benchmark process remains.

The raw tools expose a public-context limitation: content agents read shipped
`PERFORMANCE.md`, `RELEASES.md`, and architecture/packet documents containing
prior benchmark evidence; realtime Kudzu ordinal 2 reads the installed
`framework/compiler/effect-private-ref-pass.mjs`. These are inside the installed
public package, but the frozen tool policy does not isolate the supplied public
context from compiler knowledge or historical benchmark material. Keep the raw
scores, but do not call this a clean documentation-only comparison. Future input
isolation requires separate review and authorization, not midrun edits or
retroactive rescoring. The overnight interruption also prevents a continuous
same-session timing interpretation. There are no incomplete traces among the
50 scored attempts; the separately archived interrupted attempt remains partial
and cannot be reported as zero cost.

Raw output:
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r7-kudzu-0.16.25-20260907-01/`.
Reproduction/continuation and audit scripts are copied into that directory.
The continuation invokes the unchanged runner once per remaining whole task,
then `node test/ai-delivery-production-suite.mjs --summarize --out <output>`.
The unique local archive is
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r7-kudzu-0.16.25-20260907-01-audited-20260908-01.tar.gz`
(4,698,504 bytes), SHA-256
`aaa16c7881b6b8412e61d1eec88a508af1df5f46bf733270338c2557b5285427`.
Its 1,707-file evidence manifest excludes only itself. The separate interrupted
forms archive SHA-256 is
`d25357416820d266969251ce7e059a0ad93e48a9f4e02d2f033fbd8b2da6445b`.
Both full interrupted directory and archive are retained in the final archive.
The archive is local, not uploaded or published.

Verification after tracked edits: nine focused protocol/acceptance/lifecycle
tests pass; `npm run check` builds 225 pages with 2 interactive pages;
`KUDZU_REQUIRE_CHROME=1 CHROME_BIN=/usr/bin/google-chrome npm test` passes the
standalone ownership gate and 315/315 tests, with no failures or skips and a
1,200,000 ms command timeout. Logs and `verification.json` are archived.
`git diff --check` passes. This final archive/checksum paragraph is a subsequent
documentation-only metadata update; it does not alter the frozen evidence.
No commit, push, publication, package version bump, or main compiler change is
part of this measurement.

## Product Documentation And Package Cleanup (2026-09-08)

The approved r7 follow-up addresses unnecessary installed evidence/context, not
compiler correctness: all five content first patches/builds pass in the reviewed
traces. The public README now gives generic native `event.currentTarget`/state,
pure local/filter/count, keyed-child, and route-local static ownership guidance.
Its release introduction no longer supplies benchmark results or internal packet
links; release navigation uses public absolute URLs. No task-specific acceptance
labels or benchmark solution was added.

The package allowlist excludes `docs/next-architecture/`, `GOAL_A.md`, `GOAL_B.md`,
`MIGRATION_ROADMAP.md`, `PERFORMANCE.md`, `RELEASES.md`, and `framework/README.md`.
Repository evidence remains in place. All executable framework/CLI files, types,
exports, and assets remain included. Root `README.md`, `LICENSE`, and
`package.json` are verified in the actual tarball, not inferred from exclusions
or npm's automatic README inclusion.

### Measured Package Effect

Node 24.14.0, npm 11.9.0, Linux x64. The pre-edit
`npm pack --dry-run --ignore-scripts --json` and actual pre-edit pack agree.
Before and after archives were produced with
`npm pack --ignore-scripts --json --pack-destination <directory>` (the before
actual pack used `--silent` instead of `--json`). `gzip -l <archive>` measures
raw tar bytes including headers/padding; npm's unpacked size sums file contents.
These are whole-package gzip sizes, not per-file gzip or browser transfer.

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Tarball file count | 85 | 60 | -25 |
| Unpacked file bytes | 2,090,515 | 991,259 | -1,099,256 |
| Raw tar bytes | 2,154,496 | 1,036,800 | -1,117,696 |
| Gzip archive bytes | 536,166 | 200,431 | -335,735 (62.6%) |
| Public README bytes | 8,216 | 9,420 | +1,204 |

Local archives are under
`/tmp/opencode/kudzu-package-cleanup-before-20260908/` and
`/tmp/opencode/kudzu-package-cleanup-after-20260908/`, both named
`kudzujs-core-0.16.25.tgz`. The candidate is unpublished and keeps the version;
it must not be confused with the frozen registry artifact used in r7.

### Verification And Limits

`npm run test:package` compares the actual tar manifest to npm's file list,
rejects every excluded evidence path, checks all framework/CLI source files are
present and byte-identical after installation, and asserts unchanged exports/bin.
The existing fresh consumer now builds the README's generic imported collection
example with one interactive route and two script-free routes, including a
static filtered keyed child. It adds no dependency or compiler fixture. Package
smoke checks build/output; existing imported-search Chrome tests cover browser
search/count/identity/remount behavior rather than adding another browser runner.

Sequential verification with 1,200,000 ms command timeouts passes:

```bash
npm run test:package
KUDZU_REQUIRE_CHROME=1 node --test test/imported-article-search.test.mjs test/ai-delivery-production.test.mjs test/ai-delivery-production-acceptance.test.mjs test/ai-delivery-lifecycle.test.mjs
npm run check
KUDZU_REQUIRE_CHROME=1 npm test
```

The focused run passes 12 tests; check builds 225 pages, 2 interactive; Chrome
152.0.7977.64 passes the standalone ownership gate plus 315/315 tests without
failures or skips. Package smoke passes again after strengthening packed-source
byte assertions. All four search variants retain 32,190 raw / 12,324 aggregate
gzip JavaScript bytes. Semantic primitives, core passes/LOC, normalization rules,
runtime concepts/source, and compiler fixtures change by zero. No build/browser
timing comparison or model-token savings were measured.

**Full public-context isolation remains separately deferred.** Installed compiler
source remains readable, and web/repository references can still expose evidence.
This is package hygiene, not a sandbox or clean documentation-only benchmark.
Frozen r7 protocols, budgets, prompts, acceptance, starters, raw evidence, and
the 20/25 versus 25/25 score remain unchanged. No model rerun, version bump,
commit, push, publication, release, or `1.0.0` authorization is part of this work.

## r5 Compiler Follow-Up (2026-09-07)

This is compiler regression work and deterministic source replay against
`5ed0f9bc875691e4e86e2fab832491c78c2f0c69` (`0.16.24`), not a model rerun,
release, or replacement benchmark score. The dirty r5 results and separately
prepared r6 acceptance/protocol changes remain intact. Historical r5 stays
Kudzu 18/25 versus React + Vite 23/25, with two partial traces; `1.0.0` remains
blocked. No production prompt, protocol, contract, or acceptance script was
edited by this compiler follow-up.

### Evidence And Reduction

Authorizing batch:
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01/`.
The reduced checks were run red before their respective compiler edits.

| Evidence | Confirmed problem | Existing path used |
|---|---|---|
| `content-kudzu-1/adapter.stdout:35`, first patch; build failure at line 42 | `normalizedQuery = query.trim().toLowerCase()` survives in build scratch when `filteredArticles.length` is read directly in JSX rather than through a count local. It calls a string method on the signal object. | Collection-alias count validation now registers its substituted dependencies in the existing build-value declaration set. Existing binding/conditional/list consumers still subscribe to `query`; build scratch reads `query.value`. |
| Unchanged content starter `src/pages/topics/performance.tsx:13`, including historically accepted attempts 0/1/4 | A direct imported static `filter().map()` unnecessarily creates list state, prototypes, handler ESM, and a runtime family. | After existing collection/predicate/key analysis, direct imported pipelines with no selector states and no collection aliases remain ordinary build-time map execution. Local state and reactive selectors retain keyed ownership. |
| `realtime-kudzu-0` and `realtime-kudzu-3`, `src/pages/index.tsx:16` | Zero-initialized version refs have no cleanup reset and are intended to survive `[paused]` effect replacements. | Existing effect-private cleanup diagnostic is correct and remains unchanged. Making the ref invocation-private would reset the version and violate the authored lifetime. No persistent-ref support is added. |
| `realtime-kudzu-1`, `src/pages/index.tsx:16-17` | An unattached null ref is assigned `1` during render, then mutated by snapshot callbacks. Compilation previously accepted it as a DOM ref. `core.mjs` serializes ref captures by ID, not by numeric `.current`; this does not provide a retained version cell. | Existing ref normalization now rejects render-time writes at the authored source, recommending component state for retained values or cleanup-owned private refs for invocation-local values. This closes a diagnostic gap, not a resource-lifetime extension. |

The historical realtime timeout did not record an exact browser exception, so
none is asserted retroactively. The new negative reduction proves the null-ref
shape compiled before the guard and is diagnosed afterward. Replays of original
realtime sources 0/3 retain the cleanup diagnostic, source 1 receives the new
render-write diagnostic, and unchanged state-based sources 2/4 still build and
pass the realtime browser journey. Their authoring compromises remain explicit;
this is not a claim of persistent React ref compatibility.

### Output And Browser Proof

The new direct-alias-count case uses the existing imported article fixture and
Chrome journey. All four source variants emit byte-identical JavaScript:
9 files, 32,190 raw / 12,324 aggregate gzip B. Search by title/topic, whitespace
and case normalization, singular/plural status, empty branches, retained keys,
and fresh restored rows pass. The new static topic reduction emits matching
HTML, no excluded article seed, no state markers, and zero JavaScript files.
The six existing unsafe collection forms remain source-located diagnostics.

The original failing article source was recovered from the first patch event,
not reconstructed from the agent's final workaround. Recovered page SHA-256:
`915d825d15d1799b2a6fc891e12e1e84ca366df5a00a7721bd83d1b0f33db4d2`.
It and all five final content sources pass the separately prepared r6 acceptance
with all ten static siblings checked. The two combined polite-region sources
also pass its corrected semantic count check. These source-only results do not
erase historical budget failures or change model success/cost denominators.

| Output | Before raw / gzip B | After raw / gzip B | Delta raw / gzip B |
|---|---:|---:|---:|
| Complete content JavaScript, attempts 0/1/2/4 | 55,447 / 20,976 | 34,908 / 13,677 | -20,539 / -7,299 |
| Complete content JavaScript, attempt 3 | 55,440 / 20,987 | 34,901 / 13,688 | -20,539 / -7,299 |
| Content runtime files only, all five attempts | 51,357 / 19,100 | 30,895 / 11,896 | -20,462 / -7,204 |
| `/topics/performance/` JavaScript graph | 20,539 / 7,299 | 0 / 0 | -20,539 / -7,299 |
| Existing reduced search graph | 32,190 / 12,324 | 32,190 / 12,324 | 0 / 0 |

Each content build changes from 11 pages / 2 interactive / 13 JavaScript files
to 11 pages / 1 interactive / 9 JavaScript files. Removed paths are
`assets/handlers/pages/topics/performance.js` and the `kudzu.js`, `kudzu-list.js`,
and `kudzu-collection-selector.js` files in runtime family `432dc692688d09a1`.
Every retained JavaScript path and byte is identical to its archived r5 output.
The recovered source emits the same graph as final attempts 0/1/2/4, SHA-256
`34a34339db48a3da01f67b41fa5a5b0f50ea4d1854e3c30a1569e8e32b2c5270`
(sorted relative JavaScript paths followed by their bytes). Gzip is summed per
artifact with Node `gzipSync`, not a compressed archive or network measurement.

### Accounting And Verification

| Metric | Delta |
|---|---:|
| Semantic primitives / ModuleIR kinds / core passes | 0 / 0 / 0 |
| Core semantic LOC (`source-compiler.mjs`, including comment) | +5 |
| Focused normalization LOC (`effect-private-ref-pass.mjs`) | +2 |
| Production compiler LOC total | +7 |
| Ordered normalization entries / transform rules / adapters | 0 / 0 / 0 |
| Source diagnostic guards | +1 |
| Runtime concepts / runtime source LOC / dependencies / public APIs | 0 / 0 / 0 / 0 |
| Positive reduced cases / negative reduced cases | +2 / +2 |
| AI score, build-speed, interaction-timing, CPU, heap claims | None |

The positive cases extend the existing isolated fixture generator; the two
negative source fixtures live in `test/realtime-version-ref.test.mjs`. No new
runtime or generic compiler abstraction was introduced. Static collection
aliases and cross-invocation mutable refs are not broadened by this change.

```bash
KUDZU_REQUIRE_CHROME=1 node --test test/imported-article-search.test.mjs
node --test test/realtime-version-ref.test.mjs
node /tmp/opencode/r5-compiler-followup.mjs
node /tmp/opencode/verify-r5-compiler-output.mjs
npm run check
KUDZU_REQUIRE_CHROME=1 npm test
npm run test:package
```

All pass on the same Linux x64 / Node 24.14.0 / Chrome 152.0.7977.64 host as r5.
Check builds 224 pages, two interactive. The final full run passes the standalone
project ownership gate plus 315/315 tests, including the preserved r6 acceptance
tests; package smoke installs four packages and builds one zero-JavaScript page.
Full commands use a 1,200,000 ms timeout. Local replay sources, artifacts, full
acceptance JSON, errors, path lists, and raw/gzip totals are retained separately
at `/tmp/opencode/r5-compiler-followup-EQOrpR/report.json` and adjacent directories.
No model, commit, version bump, publication, or release was run. Build/browser
timings were not sampled under an interleaved performance protocol, so no timing
improvement is claimed.

## 0.21.4 Released 0.16.24 Rerun (2026-09-07)

All 50 scheduled attempts executed, without selective retries, from
`2026-09-07T04:18:00.678Z` through `2026-09-07T05:36:06.037Z` (78 minutes
5 seconds). The frozen scorer reports **Kudzu 18/25 (72%) versus React + Vite
23/25 (92%)**. Execution finished, but `suite.json` correctly says `incomplete`:
two Kudzu realtime attempts retain partial attribution after their deadlines.
This is a new local r5 observation, not a rewrite of the published r2 result,
proof of a statistically significant improvement, or authorization for `1.0.0`.
The acceptance/prompt and output-contract gaps below also prevent treating this
score as a clean production-framework ranking.

### Protocol And Execution

Base revision: `5ed0f9bc875691e4e86e2fab832491c78c2f0c69`, released
`@kudzujs/core@0.16.24`; no compiler changes during this packet. Although no r4
execution was found in the local evidence inventory, r4's `0.16.23` pins were
already release-documented. Revision 5 therefore explicitly changes all five
Kudzu manifests, lock root dependencies, resolved core versions/tarball URLs,
registry integrity values, and canonical starter digests. Historical r2/r3 raw
directories and release records remain untouched. The r4 lifecycle adapter is
unchanged, SHA-256
`91c0db691c2f7a7d5c40122e86b2ac7b928e3016a80a202f8c079c2013b3eb0e`.

Model remains `openai/gpt-5.6-sol`; exact OpenCode `1.18.27` is selected with
`OPENCODE_BIN` rather than the host default `1.18.29`. Node `24.14.0`, npm
`11.9.0`, Chrome `152.0.7977.64`, Linux x64 `7.0.0-30-generic`, Intel i5-9500
(6 logical CPUs), and 33,491,050,496 bytes RAM were recorded. OAuth presence was
checked without reading credentials. A separate tool-free model preflight
returned `READY`; its 6,755 tokens are excluded from task accounting.

The model, budgets, tools, prompts, public context, executable acceptance,
written contracts, all React starters, and alternating schedules are identical
to r4. Each adapter has a setup-inclusive 300,000 ms deadline and limits of
400,000 input, 20,000 output, 20,000 reasoning tokens, 40 tool calls, 20 files
read, 8 files modified, and 5 builds. Tasks execute serially in content, forms,
CRUD, commerce, realtime order; model processes never run in parallel.

```bash
OPENCODE_BIN=/home/kft/.npm/_npx/3fe6b69ccd55ed58/node_modules/.bin/opencode CHROME_BIN=/usr/bin/google-chrome npm run benchmark:ai-delivery-production -- --out test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01 > test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01/suite.stdout 2> test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01/suite.stderr
```

The command exits 0 after all schedules finish; that is not a passing benchmark
gate. The output directory contains `suite.json`, all five `run.json` and copied
protocols, 50 attempt results, raw adapter output/traces, build/acceptance logs,
retained source and deploy artifacts, preflight logs, test logs, and `audit.json`
(all source diffs, raw-trace review extracts, and artifact/token aggregates).
The complete local archive is
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r5-kudzu-0.16.24-20260907-01.tar.gz`,
SHA-256 `d0190c9c4d6da0bd9676365037cf1a1def72e808010e3b03a94a701138a31205`.
Gzip integrity passes; all 50 schedule entries, 50 pinned-model attribution
traces, and 300 recorded command-stream SHA-256 values were verified. The archive
is local evidence only and was not uploaded or released.

| Task | r5 protocol SHA-256 | Kudzu starter SHA-256 |
|---|---|---|
| Content | `f63c11e20e21659c25ef99498e13085054565382af9a500e7aa6e6520968b1ec` | `6b56448eb0b9179183aeb433bd3e52538749f1a2e609c37c5a8bdf8e479ccd92` |
| Forms | `967335af955b23c23e8ce81eed35b3a9426c08047b4286a5328e144f30b6e9aa` | `0a762afe93c77cec2137e956796f47a944b9222e3dcff1178462665cf995291b` |
| CRUD | `063625fd48442c639a059c240d1edaef63f54176f921dcd297c8daf97086430d` | `1e349e2deb163b8bc52fb8844a989e8f29f1ed12a2857da86119bf89ffa3e5c2` |
| Commerce | `c35cb1801f5a4b98a644f6f48f7c02b2168ebc9ce901b0b8e74fcf792c3d2e0b` | `d2b6e8d926b3e55d0e3e47c0647fdd75f01b46e3dc4ac705108974c7d3e186b3` |
| Realtime | `bda2526c95862b8d55045018da70370b9dd9a36d4e7ccfe56b3af56f06dbad10` | `f5adc4cf163a8e9cb838173d718fd21302a474fd70920167c12d64518890b218` |

The starter digest is SHA-256 over recursively locale-sorted file names, each
relative slash-normalized path followed by NUL and file bytes, matching the
integrity test. Every core lock entry uses registry integrity
`sha512-qLcVItXkI7vI5ktOC16+87uQ4BqQTQOVrFqR4AK7gz4eMN4imL7o+ocUBc7znuVsMML98ChKLRgMSsUot7GUhg==`.

### Scores And Attribution

| Task | Kudzu success | React success | Kudzu tokens / success | React tokens / success |
|---|---:|---:|---:|---:|
| Content | 3/5 | 5/5 | 591,903 | 77,522 |
| Forms | 5/5 | 5/5 | 92,087 | 81,111 |
| CRUD | 3/5 | 3/5 | 250,028 | 197,556 |
| Commerce | 5/5 | 5/5 | 68,746 | 57,756 |
| Realtime | 2/5 | 5/5 | unavailable | 142,071 |
| Overall | 18/25 | 23/25 | unavailable | task median 81,111 |

Tokens per success include failed attempts, cache-read input, output, and
reasoning, following the existing runner's accounting. Recorded totals are
4,279,911 Kudzu tokens (a lower bound because two traces are partial) and
2,384,962 React tokens. There are 48 complete and 2 incomplete traces; no raw
model error event was found. Both timed-out model sessions had already produced
source and a compiler diagnostic, so they are not model-unavailability failures.
Provider-reported subscription cost is zero, not a market-price cost comparison.
Kudzu's aggregate failure-inclusive task cost remains unavailable, not zero.
Successful-attempt elapsed medians are 69,363/65,918 ms, tool calls 12/10, files
read 5/4, files modified 2/2, builds 1/1, and correction cycles 0/0 for
Kudzu/React. These are descriptive scorer subsets, not speed or cost wins.

Final builds passed 23/25 Kudzu and 25/25 React; complete executable acceptance
passed 18/25 and 23/25. Against historical r2's 11/25 and 24/25, the observed
counts change by +7 and -1, with content and commerce now having scored Kudzu
successes. Different stochastic runs, compiler pins, lifecycle accounting, and
the limitations below prevent attributing that entire change to the compiler.

### Every Failure

| Attempts | Observed failure | Attribution / limitation |
|---|---|---|
| `content-kudzu-2`, `content-kudzu-3` | Empty-state live-region text is `0 articlesNo articles match your search.` rather than exactly `0 articles`; all filtering/count transitions otherwise match. Attempt 2 also uses 497,474 input tokens, over 400,000. | Both place separate count and empty-message paragraphs inside one polite region. The grader assumes the entire first live region is the count. Preserve failures, but do not call this broken filtering; the prompt does not explicitly require a count-only region. |
| `crud-kudzu-1`, `crud-kudzu-3`, `crud-react-vite-2`, `crud-react-vite-4` | Only `initial.group` fails; keyed retention, filters, create/edit/delete, counts, focus, and empty state pass. | All use `role="group" aria-label="Filter memos by status"`. The grader requires exact `Filter memos`. That name exists in the written contract and starter, but the supplied prompt asks only for a named group. The adapter does not supply the written contract. This is a prompt/acceptance alignment gap, not a compiler or missing-group failure. |
| `realtime-kudzu-0`, `realtime-kudzu-3` | Adapter SIGKILL at about 300,011 ms; final build rejects `src/pages/index.tsx:16:9`: effect-private refs require cleanup that resets or invalidates `.current`. No deploy output. | Version refs initialized with zero are intended to survive pause/resume; current effect-private ownership cannot provide that lifetime. Atomic partial traces retain 117,447 and 175,039 recorded tokens, respectively. No retry or synthetic completion. |
| `realtime-kudzu-1` | Build passes after changing `useRef(1)` to an unattached `useRef(null)` plus render-time initialization; acceptance times out waiting for the first four-row snapshot. | Generated handler still reads `scope("version").current`. The runtime-ref workaround is not proven safe by its successful build. The frozen timeout path does not serialize browser exception details; do not invent an exact exception or claim a diagnosed compiler fix. |

Raw content traces also retain a residual `query.trim is not a function`
build failure in attempts 1 and 3 when a normalized query alias feeds a filtered
array whose `.length` is consumed directly. Both agents inline the query
expression to recover. Attempts 0/2/4 retain the normalized query with a separate
count local and build. These exact sources, plus the realtime ref cases, are
future reduced-fixture inputs; this rerun makes no speculative compiler change.

### Output And Source

| Executable-accepted subset | Kudzu median artifact raw / gzip B | React median artifact raw / gzip B | Kudzu / React median transferred JS B |
|---|---:|---:|---:|
| Content (3 / 5 attempts) | 93,274 / 35,226 | 206,504 / 66,425 | 37,608 / 199,132 |
| Forms (5 / 5) | 23,832 / 9,771 | 202,704 / 64,305 | 15,147 / 198,469 |
| CRUD (3 / 3) | 48,490 / 16,727 | 203,383 / 64,471 | 35,542 / 198,476 |
| Commerce (5 / 5) | 53,886 / 21,871 | 201,055 / 64,188 | 30,214 / 197,976 |
| Realtime (2 / 5) | 45,555 / 16,150 | 202,524 / 64,244 | 36,012 / 199,043 |

Artifact totals include every deploy file; gzip is summed per file. Transferred
JS sums `.js` resource entries from the frozen journey, including protocol
overhead, not CPU time or a complete multi-route session. All 18 scored Kudzu
successes have the designated complete, script/marker-free static sibling.
Content emits 11 HTML pages but only nine are script/marker-free: besides the
search route, `/topics/performance/` loads a list capability. Its source was not
edited by the agents, but this violates the broader written content static-route
expectation and is not checked by executable acceptance. React's
`staticZeroJavaScript: true` is a bypass in the checker, not evidence of zero
React JavaScript. No complete 0.9 performance, memory, resilience, or all-route
accessibility parity claim follows from these artifact observations.

All 50 retained source inventories were compared with their starters. Only
authored TSX/CSS changed (one to three files); manifests, locks, seeded data,
fake transport, and test infrastructure remain unchanged. Search preserves
`ArticleCard`/`Shell` composition and imported data; CRUD preserves its shared
Provider and keyed declarative rows. No imperative list/DOM replacement was
found. Native form refs, focus, and validity calls are ordinary form behavior.
Maintainability is not uniformly equivalent: commerce Kudzu attempt 4 adds
derived display state after a formatting diagnostic; realtime Kudzu attempt 2
calls `setMemos` inside a version-state updater, while attempt 4 carries version
through state plus an effect-local copy instead of React's persistent ref.
These are explicit authoring compromises, not proof of abstraction parity.
The runner's byte-identical-file retention metric includes lockfile bytes and
is not a semantic source-retention percentage.

Next prerequisite is an acceptance/prompt alignment review, preserving this raw
batch and changing no scores retroactively. The retained direct-count query and
cross-invocation version-ref failures then provide concrete compiler intake;
the static topic output also needs a separately scoped check. `1.0.0` remains
blocked. This packet adds zero semantic primitives, compiler passes/LOC, runtime
concepts, or dependencies, and makes no release, speed, price, or superiority claim.

Verification: six protocol/runner/lifecycle tests pass; before execution and
again after the results documentation, `npm run check` builds 224 pages, two
interactive, and `npm test` passes the standalone project ownership test plus
308/308 tests. Final logs are `final-check.log` and `final-test.log` in the raw
directory. `git diff --check` passes. The final archive/checksum metadata update
does not change model inputs or any recorded artifact.

## 0.21.4 Corrected AI Delivery Proof

Measured 2026-09-03 on Linux x64 with Node 24.14.0, Chrome 152.0.7977.64,
OpenCode 1.18.27, and `openai/gpt-5.6-sol`. Each of five production-shaped task
classes ran five predeclared interleaved attempts per framework with identical
model, tools, public-context, 300-second, 400,000-input-token, and 40-tool-call
limits. Failed and incomplete attempts remain in success and cost denominators.
Provider-reported subscription cost was zero, so tokens are the cost comparator.

| Task | Kudzu success | React + Vite success | Kudzu tokens / success | React tokens / success |
|---|---:|---:|---:|---:|
| Content search | 0/5 | 5/5 | unavailable | 99,779 |
| Password confirmation | 5/5 | 5/5 | 85,821 | 116,307 |
| CRUD/shared filter | 1/5 | 5/5 | 2,088,870 | 119,430 |
| Commerce-derived shipping | 0/5 | 5/5 | unavailable | 57,979 |
| Realtime ownership | 5/5 | 4/5 | 261,327 | unavailable |
| **Overall** | **11/25 (44%)** | **24/25 (96%)** | **unavailable** | **unavailable** |

All final builds passed. Browser acceptance passed for 17/25 Kudzu attempts and
24/25 React attempts; six otherwise-correct Kudzu attempts lost only on frozen
budgets. The one remaining React attempt timed out in the adapter at 300 seconds,
produced no attribution trace, and is retained as incomplete rather than
selectively replaced. Therefore the failure-inclusive realtime and aggregate
React cost claims are unavailable. No successful retained source used imperative
DOM replacement, changed dependencies, or embedded acceptance-specific shortcuts.

| Task with accepted output | Kudzu median raw / gzip artifact | React median raw / gzip artifact | Kudzu / React median transferred JS |
|---|---:|---:|---:|
| Content | 91,681 / 34,905 B | 206,483 / 66,401 B | 36,114 / 199,137 B |
| Forms | 24,238 / 9,801 B | 202,702 / 64,305 B | 15,328 / 198,467 B |
| CRUD | 49,526 / 16,860 B | 203,412 / 64,483 B | 36,127 / 198,495 B |
| Realtime | 45,854 / 16,138 B | 202,520 / 64,245 B | 36,111 / 199,043 B |

Kudzu retained complete zero-JavaScript static siblings in every accepted output.
Commerce has no accepted Kudzu output and therefore no Kudzu byte comparison.
Lower browser output does not offset the failed success-rate and task-cost gate.

The corrected revision-2 protocol SHA-256 values are:

- content `773ac7cf998006bc54f66a6fa278d4f40a2905a558f7c309acf632f201d532a0`;
- forms `a004d6a65d6a255ba93965f208ca9afe834c8abeeb6ed0f8234a8b01435d55a1`;
- CRUD `371f491984c582802452f85d3c2c5cca147f74f34197495627369092e87535f5`;
- commerce `d1b670d72ebadbfc0b2a9a1f9060574fa10d742f99629aadc031c0133726197f`;
- realtime `c6ae3dfbac72ca07b5e7a95e0e55282aa8a8c2624c391395886376e2b210bf66`.

The first batch, Kudzu 8/25 versus React 16/25, is invalid for ranking. Its
acceptance SHA changed from
`78478ae8ae141d7c787b930ce345bf7d4cf62142c64a3b3a5e495149adc14c30`
to `c1320b8c87c1d3c2303ac20a5385fae9c3935d121ff31aab4bb9a899bd7e7a06`
after correcting React controlled-input dispatch, hidden live-region and form
field selectors, incomplete CRUD/realtime journeys, one broken Kudzu CRUD
starter behavior, and inconsistent React versions. Revision 2 also hashes the
written acceptance contracts. Both batches remain in the release archive
[`kudzu-ai-delivery-0.21.4-gpt-5.6-sol.tar.gz`](https://github.com/kudzujs/kudzu/releases/download/v0.16.19/kudzu-ai-delivery-0.21.4-gpt-5.6-sol.tar.gz),
SHA-256 `4e37d15b4c4b0cf88720a3a7743996794b2e0172dbc43d40514f944fb01bd0f8`.

The measured next blockers are ordinary reactive collection normalization and
count reuse, plus reactive text ownership inside selected conditional branches.
Kudzu does not have the highest or tied success rate or a valid lowest aggregate
cost, so this proof does not authorize `1.0.0`. This evidence packet changes no
compiler, runtime, public API, dependency, generated application, or browser
artifact.

The 2026-09-04 collection follow-up removes the first blocker for one ordinary
immutable filtered alias reused by keyed rendering, a top-level count, reactive
text, and a count-selected branch. It adds no primitive, pass, runtime concept,
API, dependency, or shared-runtime byte; net production compiler growth is 37
lines across two existing files. The maintained positive and negative fixtures
pass all 302 tests with Chrome required. Their exercised interactive route uses
the unchanged 36,219 B shared runtime closure and 37,870 B total JavaScript with
route handlers. Benchmark contract and budget deltas are zero; the production AI
comparison is not rerun until selected-branch reactive text is also addressed.
This follow-up ships as `@kudzujs/core@0.16.22`.

The 2026-09-04 selected-branch follow-up lowers a reactive scalar branch through
the existing text-binding compiler path. It adds no semantic primitive,
compiler pass, runtime concept, API, dependency, or shared-runtime source byte;
net production growth is 11 lines in one existing compiler file. The focused
fixture covers an update that remains in the selected branch and a later branch
replacement. Required Chrome, all 302 tests, `npm run check`, and package smoke
pass. Rebuilding the five retained commerce sources against this tree changes
their frozen `below` check from false to true, so all five pass build, behavior,
accessibility, browser, and output acceptance while retaining the zero-JavaScript
static sibling. The existing checkout handler grows by 147-154 transferred bytes
across those authored variants; no shared runtime module was added. Benchmark
contracts and budgets are unchanged. This is a same-source compiler follow-up,
not a new equal-condition model run, so the published 11/25 versus 24/25 result
and the `1.0.0` block remain unchanged pending the complete production rerun.
This follow-up ships as `@kudzujs/core@0.16.23`.

### Imported Search Source Replay (2026-09-07)

Compiler follow-up shipping as `0.16.24` to `f88279024e68c875ea35592a1ab363bde1cec9d0`
(`0.16.23`), on Linux x64, Node 24.14.0 and Chrome 152.0.7977.64. Authorizing
evidence is the initial aliased search patch at line 50 of
`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r3-kudzu-0.16.23-continuation-20260907/content/attempts/content-kudzu-0/adapter.stdout`.
The reduced fixture first reproduced both the source-located generic expression
diagnostic and the direct-filter-count `query.trim is not a function` build error.

Imported collection discovery now follows top-level const selector aliases from
map/count uses. Filter predicates encode proven pure query locals using the
existing expression language, and count dependencies use signal build values in
scratch rather than invoking string methods on signal objects. Existing binding,
selector, keyed, and conditional consumers remain authoritative.

| Metric | Result |
|---|---|
| Semantic primitives / IR kinds / runtime concepts / APIs | +0 / +0 / +0 / +0 |
| Core passes / ordered normalization entries / adapters | +0 / +0 / +0 |
| Existing normalization/proof boundaries extended | 3: import roots, pure filter locals, count build values |
| Core semantic LOC, unchanged 0.9 file set | +39, 5,466 -> 5,505; source compiler +26, collection analysis +13 |
| Regression evidence | 1 reduced fixture; 3 positive source variants, 6 negative forms, 4 tests |
| Reduced route JS | 9 files; 32,190 raw / 12,324 aggregate gzip B in every variant |
| Delta from fully inlined control | 0 raw / 0 gzip B; identical JS paths and contents |
| Reduced static sibling | Complete HTML, 0 B JavaScript |
| Full retained application replay | 11 pages, 2 interactive; build and existing content acceptance pass |
| Full application JS vs earlier retained inlined artifacts | 13 files; 55,447 raw / 20,976 aggregate gzip B; all paths/bytes identical |
| Build/browser timing and AI-cost delta | Not measured; no fresh model benchmark or ranking claim |

The full replay restores the initial page and stylesheet patch over the content
starter while preserving the retained application's other source. It uses the
current workspace compiler and the unchanged existing content acceptance runner,
not a new adapter invocation. It passes search/count/empty/restore, accessibility,
zero-JavaScript static output, and no browser exceptions or failed requests.
Raw build/acceptance output and `replay.json` are retained separately under
`test-results/ai-delivery-production/imported-article-search-source-replay-20260907/`. Its sorted
HTML/CSS/JS path-plus-NUL-plus-content SHA-256 is
`92d96f7cfdd4535de28ff9b7665aa241815ed2649e6db14fc22c5eadc8258904`.
The original attempt and earlier benchmark results are not rewritten.

Release verification: `npm run check` (224 pages, 2 interactive),
`KUDZU_REQUIRE_CHROME=1 npm test` (standalone project ownership gate, then
308/308 tests), `npm run test:package` (4 installed packages, one static page),
and both package dry-runs pass. The release gates ran sequentially with a
1,200-second tool limit, avoiding overlapping fixture tests.
Chrome regression checks also prove retained rows and fresh remounts; they are
correctness checks, not latency samples. Mutable aliases, impure calls, cycles,
collection escapes, mutating sort, and predicate-parameter state collisions remain
diagnosed. No general local/callback graph or effect cleanup claim is added.
The same release includes separate r4 benchmark lifecycle integrity changes:
atomic partial-usage checkpoints, bounded incremental stdout/stderr evidence,
setup-inclusive deadlines, owned process-tree termination, and incomplete timeout
attribution. Two Linux lifecycle regressions cover setup and model timeouts,
partial usage, descendant termination, and passing acceptance after adapter timeout.
The Windows `taskkill` path remains untested. Future r4 protocols pin published
`0.16.23` starters; historical raw evidence remains untouched. The published
11/25 versus 24/25 comparison and `1.0.0` block remain unchanged.

## 0.21.2 Browser Performance And Memory

Measured 2026-09-03 at revision
`fcb42ae388c733ff9098f8c4a059690a21a56ed3` on Linux x64 with Node 24.14.0,
Chrome 152.0.7977.64, an Intel i5-9500, six logical CPUs, and 31.2 GiB RAM.
These are same-revision application gates, not cross-framework or historical
regression claims. Each timing benchmark ran alone with seven fresh Chrome
profiles; the list decision rotates strategies. Median browser budgets are 100
ms for measured interactions and enhanced navigation, 1,000 ms for bounded-list
load, and 2,000 ms for the complete static 10,000-row document.

| Fixture | Metric | Raw samples | Median / budget |
|---|---|---|---:|
| 2,000 keyed rows | Append 33 | `[9.6, 13.9, 10.8, 12.3, 8.6, 8.8, 7.0]` ms | 9.6 / 100 ms |
| 2,000 keyed rows | Filter to one | `[16.0, 17.6, 20.4, 21.1, 17.6, 16.3, 16.9]` ms | 17.6 / 100 ms |
| 2,000 keyed rows | Restore 1,999 | `[66.9, 84.5, 95.3, 78.5, 94.6, 76.4, 98.1]` ms | 84.5 / 100 ms |
| 2,000 keyed rows | Reverse 2,000 | `[19.4, 18.8, 19.4, 18.7, 18.8, 27.3, 19.6]` ms | 19.4 / 100 ms |
| Project application | Table save | `[0.8, 0.9, 0.9, 0.9, 0.8, 2.8, 1.0]` ms | 0.9 / 100 ms |
| Project application | List-to-detail navigation | `[4.2, 9.5, 4.9, 4.2, 6.4, 11.7, 4.1]` ms | 4.9 / 100 ms |
| 10,000-row direct | Complete load | `[999.8, 1030.9, 982.2, 1070.1, 1047.2, 939.0, 994.3]` ms | 999.8 / 2,000 ms |
| 100-row pagination | Complete load | `[327.3, 133.9, 163.1, 145.1, 150.5, 417.1, 190.1]` ms | 163.1 / 1,000 ms |
| 100-row pagination | Next range | `[39.3, 13.3, 14.1, 22.1, 14.6, 18.1, 22.3]` ms | 18.1 / 100 ms |
| 100-row window | Complete load | `[185.1, 472.8, 247.9, 315.0, 251.7, 148.4, 260.6]` ms | 251.7 / 1,000 ms |
| 100-row window | Next range | `[23.7, 14.4, 14.0, 48.5, 19.5, 50.5, 26.7]` ms | 23.7 / 100 ms |

The keyed graph is nine JavaScript files totaling 30,048 raw / 11,748
aggregate gzip B. The project list/detail session owns 17 unique JavaScript
files totaling 81,200 raw / 27,885 aggregate gzip B; its initial list and
concrete detail route graphs are 69,178 / 24,183 and 67,702 / 23,556 raw/gzip B.
These are structural route/session artifact bytes from the exact ownership
report, not compressed network-transfer measurements from the local uncompressed
server.

The lazy editor initially owns 12,982 raw / 6,153 gzip B and defers one 250,086
raw / 80,890 gzip B CodeMirror chunk. Two route owners share that one deferred
chunk while owning 21,599 / 9,466 and 21,609 / 9,468 eager raw/gzip B; the static
sibling owns zero JavaScript. Focused required-Chrome tests pass 3/3, proving no
deferred request before activation, one native module request, reuse by later
owners, and exact conditional/document cleanup.

The 10,000-row static control retains 10,000 rows, 50,015 elements, 90,023 DOM
nodes, zero listeners, 534,292 forced-GC heap bytes, and zero JavaScript. Both
bounded strategies retain exactly 100 rows: pagination records 1,467 nodes, one
listener, and 1,423,560 median heap bytes; windowing records 1,468 nodes, two
listeners, and 1,528,288 median heap bytes. Off-range state is released and
recreated while retained-row identity remains correct.

The default endurance gate passes five warm-ups, ten stale-prefetch races, and
30 ownership cycles in one profile. Across 101 navigations, editor
mounts/disposals balance at 71/71, browser state remains zero, documents remain
six, listeners remain seven, nodes move 164 to 165, and forced-GC heap moves
1,969,344 to 2,049,332 bytes: a 79,988 B increase under the existing 2 MiB or
15% alarm. No browser exception or failed request occurs. The raw ignored
artifacts are under
`test-results/endurance/2026-09-02T23-54-34-324Z/`.

The packet adds median alarms to three existing browser benchmarks and permits
the existing artifact collector to name the active packet. It changes no
production source, semantic primitive, compiler pass, runtime concept, deploy
artifact, public API, or browser byte.

## 0.21.1 Compiler And Route Scale

Measured 2026-09-01 on Linux x64 with Node 24.14.0, an Intel i5-9500, six
logical CPUs, and 31.2 GiB RAM. The 100- and 1,000-route scales use one warm-up
and three measured fresh-process samples. The 10,000-route scale records one
complete full-contract run with no warm-up after two diagnostic runs completed
the measured stages but exposed cleanup and recovery-timeout harness defects.
The generated topology contains nine imported modules plus one page per route
and 1,011 lines per route. Fixture generation is excluded. These are absolute
candidate measurements, not cross-framework claims.

| Routes | Modules / lines | Graph median | TypeScript parse median | Normalize median | Compile/transform median | Render median | Write median | Clean median / RSS | Incremental median / retained-session peak RSS |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 1,000 / 101,100 | 1,184.4 ms | 1,796.7 ms | 37.9 ms | 2,428.1 ms | 456.5 ms | 70.4 ms | 7,444.3 ms / 672.3 MiB | 1,838.0 ms / 680.9 MiB |
| 1,000 | 10,000 / 1,011,000 | 12,152.6 ms | 18,717.6 ms | 302.9 ms | 23,681.5 ms | 4,919.4 ms | 521.7 ms | 77,515.9 ms / 3,182.3 MiB | 18,132.1 ms / 3,281.1 MiB |
| 10,000 | 100,000 / 10,110,000 | 103,200.9 ms | 232,840.3 ms | 2,350.3 ms | 244,578.3 ms | 44,885.7 ms | 6,690.1 ms | 1,117,753.0 ms / 5,461.0 MiB | 643,697.2 ms / 8,266.9 MiB |

The exact 100-route runs are source read `[30.5, 30.3, 24.7]`, graph
`[1273.8, 1138.8, 1184.4]`, parse `[1749.8, 1911.6, 1796.7]`, normalize
`[37.2, 37.9, 41.4]`, compile/transform `[2428.1, 2828.6, 2381.1]`, render
`[516.7, 416.9, 456.5]`, write `[95.3, 53.1, 70.4]`, clean build
`[7444.3, 7269.2, 8156.1]`, and incremental build
`[1631.9, 1907.7, 1838.0]` ms. Clean-build RSS is
`[672.3, 658.6, 675.1]` MiB and retained-session peak RSS is
`[707.1, 673.9, 680.9]` MiB.

The exact 1,000-route runs are source read `[296.7, 315.7, 271.2]`, graph
`[12152.6, 12308.1, 10011.3]`, parse `[19099.5, 18717.6, 16398.2]`,
normalize `[259.6, 302.9, 315.8]`, compile/transform
`[27200.6, 23681.5, 21608.7]`, render `[4919.4, 4454.6, 5238.7]`, write
`[748.6, 521.7, 487.8]`, clean build `[77515.9, 70196.9, 82980.2]`, and
incremental build `[22359.7, 18132.1, 17097.2]` ms. Clean-build RSS is
`[3181.5, 3182.3, 3188.5]` MiB and retained-session peak RSS is
`[3281.0, 3281.1, 3284.5]` MiB.

The complete 10,000-route run records source read `17077.4`, graph `103200.9`,
TypeScript parse `232840.3`, normalize `2350.3`, compile/transform `244578.3`,
render `44885.7`, write `6690.1`, clean build `1117753.0`, and incremental
build `643697.2` ms. Compile-only RSS is 5,561.4 MiB, clean-build RSS is
5,461.0 MiB, and retained-session peak RSS is 8,266.9 MiB under
`--max-old-space-size=10240`.

Graph time excludes measured TypeScript parsing. Compile/transform excludes
measured TypeScript parse and Kudzu normalization, but includes the indivisible
esbuild parse/transform call for proven import-free modules. Render includes
provisional page materialization; write includes artifact finalization and
staged-output promotion. Clean build is an end-to-end wall clock and is not the
sum of the reported phase boundaries.

Every incremental sample recompiles exactly 10 modules, renders one page,
matches a clean build of the changed source byte-for-byte, rejects invalid
source in the retained session without changing output, and recovers in that
same session after source restoration.
At 100 routes, clean output is 100 files / 21,980 B with digest
`61525962c70c5e69a975a656781e598cf6665137d648be82f1c3d5e73f0b1b48`;
the source change produces digest
`4c7e0f098f3f3236b6e04fa96e8057341c3aa8bdb35a72fe701e78be06160154`.
At 1,000 routes, clean output is 1,000 files / 221,780 B with digest
`ccdd2630bcaf9fac4a481b64c69982c341e4798205bb9fbb4cac67d528246635`;
the source change produces digest
`024811a5f4598d5025abc57320695503b2d63d0fd6aa54bcf79efde848c2a94e`.
At 10,000 routes, clean output is 10,000 files / 2,237,780 B with digest
`7a48bc40ff33c4faaef8a01ab90fcfe611a4bada5364a6fedca42f80ad5070d3`;
the source change emits 2,237,788 B with digest
`09a42f84b4ce16c994a8bd55b92e5b645c716168f9290d241cfe27903ccfe98f`.
Both clean and retained-session failure probes reject invalid source without
changing the prior deploy and recover to the expected digest.

The first full 10,000-route attempt exhausted a 10,240 MiB V8 heap while the
unbounded canonical module cache retained roughly 90,000 parent-linked
TypeScript ASTs. Bounding complete canonical records to 1,024 retains stable
position-based symbols while allowing old ASTs to be collected. The identical
100,000-module / 10,110,000-line topology then completed under the same heap cap.
This adds eight net production compiler lines, no semantic primitive, compiler
pass, runtime concept, public API, deploy file, or browser byte.

## 0.21.0 Functional Parity Matrix

Measured 2026-09-01 on Linux x64 with Node 24.14.0 and required Chrome. The
300-test suite passes the maintained content, authentication, forms, CRUD,
shared-data, large-list, overlay, editor, lazy-load, realtime, error,
accessibility, and navigation browser journeys. Greenfield `/help`, Apache
Answer and Memos `/public`, editor `/static`, and the direct 10,000-row route
remain the corresponding static exclusion controls.

The previously benchmark-only 10,000-item pagination decision now runs once as
ordinary browser acceptance. Enter advances the native control to rows 101-200,
focus remains on the control, returning to rows 1-100 releases the old row and
restores fresh input state, the DOM remains bounded to 100 rows, and no browser
exception occurs. Its deploy contains 19 files totaling 1,900,048 raw / 242,968
aggregate gzip B with digest
`1bbaf3479ac90f923deb469c73eb93c0dd7364e7fe906919b167f2f854deda70`.
The selected pagination route owns 30,143 raw / 11,193 gzip B JavaScript; the
complete direct 10,000-row HTML control owns 0 B JavaScript. This freezes
behavior rather than making a new timing claim.

No fixture source, compiler, IR, normalization pass, runtime concept, public API,
or browser artifact changed. One focused browser acceptance test and one
artifact-baseline entry were added. `npm run check`, required-Chrome 300/300,
package smoke, and the artifact inventory pass, so no release version is
consumed.

## 0.20.5 Tooling Cost Validation

Measured 2026-09-01 on Linux x64 with Node 24.14.0, OpenCode 1.18.25, and
`openai/gpt-5.6-sol`. Five interleaved attempts per condition repaired the same
Apache Answer-derived static React Bootstrap breakpoint under one prompt,
budget, public context, starter, and acceptance digest. Baseline exposed plain
`build`; tool-assisted exposed structured `build`, `inspect`, and `explain`.
Both conditions passed 5/5 with the same 234 raw / 181 gzip B HTML artifact,
98.94% byte-identical source retention, and zero browser JavaScript.

Baseline total-token samples were `[75485, 75459, 66141, 60644, 61570]`: a
66,141 median, 60,644/75,485 range, and 67,860 failure-inclusive tokens per
success. Tool-assisted samples were `[75983, 87615, 108588, 75828, 75950]`: a
75,983 median, 75,828/108,588 range, and 84,793 tokens per success. Structured
tools therefore cost 16,933 more tokens per success on this task. Monetary cost
was reported as zero by the subscription provider in every attempt.

Baseline versus tool-assisted medians and ranges were: file reads 2 (1/3)
versus 2 (1/3), tool calls 8 (5/9) versus 9 (8/12), builds 2 (2/2) versus 2
(2/3), correction cycles 1 (1/1) versus 1 (1/2), and completion time 45,811 ms
(43,194/46,390) versus 60,736 ms (52,313/76,963). There were no failed
attempts. This rejects an AI cost-reduction claim for the structured tool bundle
on this task; it does not remove the independently useful machine-readable
commands or claim results for other tasks.

## 0.16.14 Fair AI Delivery Evidence

Measured 2026-09-01 on Linux x64 with Node 24.14.0. The deterministic protocol
fixture records two interleaved attempts per variant, including one success and
one retained failure each. Both variants therefore report a 50% fixture success
rate, 50 nanos median successful cost, and 100 nanos total cost per success when
failed attempts remain in the numerator. Successful artifacts are one 63 raw /
66 gzip B HTML file with digest
`0d22f579d793d0034c967c7ffa08e0b2c377bc36c959c7b4bafab587fd5dda60`.
This validates evidence accounting only and is not a model-driven framework
comparison. Compiler passes, runtime concepts, representative deploy output, and
browser bytes are unchanged. Browser-disabled and required-Chrome suites pass
297/297 tests, package smoke passes, and the runner adds no dependency.

## 0.16.13 Route Artifact Explanations

Measured 2026-09-01 on Linux x64 with Node 24.14.0. Route explanation is a
build-time projection over existing route, source, compatibility, ownership,
capability, and artifact records. Representative deploy manifests and hashes
remain unchanged. The maintained Worker graph remains 907 raw / 477 gzip B and
the window graph remains 14,456 raw / 6,160 gzip B. Seven clean builds record a
605 ms median on this host without a timing comparison. Browser-disabled and
required-Chrome suites pass 296/296 tests, package smoke passes, and focused CLI
coverage includes an effect-owned Worker route, configured base, exact missing
route diagnostic, deterministic output, artifact hashes, and zero-JavaScript
static exclusion.

## 0.16.12 Bounded Application Inspection

Measured 2026-08-31 on Linux x64 with Node 24.14.0. Inspection is a build-time
projection over existing source, compatibility, ownership, capability, and
artifact records. Representative deploy manifests and hashes remain unchanged.
The maintained Worker graph remains 907 raw / 477 gzip B and the window graph
remains 14,456 raw / 6,160 gzip B. Seven clean builds record a 648.7 ms median
on this host without a timing comparison. Browser-disabled and required-Chrome
suites pass 295/295 tests, package smoke passes, and bounded deterministic CLI
coverage includes reachable-source filtering and structured blocker output.

## 0.16.11 Structured Compiler Diagnostics

Measured 2026-08-31 on Linux x64 with Node 24.14.0. Structured diagnostics are
compiler and CLI output only; all representative deploy manifests, route bytes,
and hashes remain unchanged. The maintained Worker graph remains 907 raw / 477
gzip B and the window graph remains 14,456 raw / 6,160 gzip B. Seven clean
release-candidate builds record a 1,034.4 ms median on this loaded host; timing is
not compared.
The complete browser-disabled and required-Chrome suites pass 293/293 tests,
focused JSON CLI and human diagnostic tests pass, and package smoke builds one
static page with zero interactive pages.

## 0.16.10 Apache Answer Authentication Journey

Measured 2026-08-31 on Linux x64 with Node 24.14.0 and required Chrome. The
existing authentication fixture remains 17 deploy files and 36,441 raw / 15,598
aggregate gzip B. The login route owns 25,684 raw / 11,372 gzip B, settings owns
26,818 raw / 11,319 gzip B, and the public sibling owns zero JavaScript. Required
Chrome verifies anonymous, invalid and valid login, token restore, shared
header/settings state, 401 clearing, and replacement navigation against a
deterministic server. No production source or deploy artifact changed. The
maintained Worker graph remains 907 raw / 477 gzip B and the window graph remains
14,456 raw / 6,160 gzip B. Seven clean builds record a 674.7 ms median on this
loaded host; timing is not compared.

## 0.16.9 Compatibility Boundary And Inventory

Measured 2026-08-31 on Linux x64 with Node 24.14.0 and required Chrome. The
compatibility inventory is compiler scratch generated from reachable original
source before normalization; it emits no deploy file or browser capability.
Existing project-output baselines and package-specific diagnostics pass without
change. The maintained Worker graph remains 907 raw / 477 gzip B and the window
graph remains 14,456 raw / 6,160 gzip B. Seven clean builds record a 532.6 ms
median on this loaded host; timing is not compared.

## 0.16.8 Shared Lazy Capability Graph

Measured 2026-08-31 on Linux x64 with Node 24.14.0 and Chrome. Two route owners
share one deferred CodeMirror chunk measuring 250,086 raw / 80,890 aggregate
gzip B. Their eager graphs are 21,599 raw / 9,466 gzip B and 21,609 raw / 9,468
gzip B. The static sibling remains complete HTML with zero JavaScript.

Required Chrome proves zero deferred requests before interaction, one request on
the first owner, no navigation-triggered prefetch, no duplicate request for the
second owner, and exact owner/document cleanup. Native ESM supplies the
document-lifetime cache; no loader, prefetch registry, cache, or runtime concept
was added. The maintained Worker benchmark remains 907 raw / 477 gzip B for the
Worker graph and 14,456 raw / 6,160 gzip B for the window graph. Seven clean
builds record a 696.6 ms median on this loaded host; timing is not compared.

## 0.16.7 Lazy Retained Editor Lifecycle

Measured 2026-08-30 on macOS arm64 with Node 24.14.0 and Chrome. The existing
eager real CodeMirror editor owns 214,968 raw / 71,607 aggregate gzip B. The
lazy retained journey initially owns 15,896 raw / 7,230 gzip B and defers
250,086 raw / 80,890 gzip B, reducing initial gzip by 64,377 B (89.9%). Its
static sibling remains complete HTML with zero JavaScript.

Required Chrome proves zero initial deferred requests, one activation request,
bidirectional updates, accessible update-error recovery, retained editor DOM,
conditional cleanup, cached fresh remount, and document disposal. The maintained
Worker benchmark remains 907 raw / 477 gzip B for the Worker graph and 14,456
raw / 6,160 gzip B for the window graph. Seven clean builds record a 230.5 ms
median. No browser runtime file or concept was added.

## 0.16.6 Owner-Triggered Capability Imports

Measured 2026-08-29 on macOS arm64 with Node 24.14.0 and Chrome. The existing
eager CodeMirror route owns 214,968 raw / 71,607 aggregate gzip B. Its guarded
lazy counterpart initially owns 12,982 raw / 6,153 gzip B and defers 250,086
raw / 80,890 gzip B, reducing initial gzip by 65,454 B (91.4%). Its static
sibling remains complete HTML with zero JavaScript.

Required Chrome proves zero initial deferred requests, one request on owner
activation, mount, exact cleanup, cached remount without another request, and
document disposal. The maintained Worker benchmark remains 907 raw / 477 gzip B
for the Worker graph and 14,456 raw / 6,160 gzip B for the window graph. Seven
clean builds record a 222.8 ms median. No browser runtime file or concept was
added.

## 0.16.5 Bounded Navigation Cache

Measured 2026-08-28 on Linux x64 with Node 24.14.0 and Chrome. Before the
production fix, five held-prefetch races increased retained CDP documents from 8
to 16 after a newer canonical navigation had pruned those URLs. Moving the
existing revision check before the cache write restores the exact bound without
adding an LRU, cancellation registry, runtime file, or cache abstraction.

The default endurance gate runs ten batched cache races and 30 ownership cycles
in one Chrome profile. Across 101 navigations, baseline/final documents remain
8, browser state entries 0, DOM nodes 174, listeners 7, and editor
mounts/disposals 71/71. Forced-GC heap moves from 1,826,244 to 2,022,160 bytes,
below the larger of the declared 2 MiB or 15% alarm.

The maintained Worker benchmark remains 907 raw / 477 gzip B for the Worker
graph and 14,456 raw / 6,160 gzip B for the window graph. Seven clean builds
record a 795.3 ms median on this host; timing is not compared because concurrent
host load differs. Production runtime LOC, concepts, and files remain unchanged.

## 0.16.4 Scoped GSAP Animation Lifecycle

Measured 2026-08-28 on Linux x64 with Node 24.14.0 and Chrome. The real GSAP
fixture emits 8 JavaScript files totaling 94,110 raw / 37,819 aggregate gzip
bytes, while its static sibling emits zero JavaScript. Required Chrome proves
scoped presentation, native reduced-motion fallback, dependency replacement,
conditional and enhanced-route disposal, retained structure, and fresh remount.

The maintained Worker benchmark remains byte-identical at 907 raw / 477 gzip B
for the Worker graph and 14,456 raw / 6,159 gzip B for the window graph. Seven
clean builds record a 625.9 ms median on this host. Timing is not compared with
the prior sweep. The change adds no runtime file or animation abstraction; one
existing package-reference ancestry helper shrinks by two lines.

## 0.16.3 State-Owned Drag And Drop

Measured 2026-08-28 on Linux x64 with Node 24.14.0 and Chrome. The real
SortableJS fixture emits 10 JavaScript files totaling 72,251 raw / 26,603
aggregate gzip bytes, while its static sibling emits zero JavaScript. Required
Chrome proves drag and keyboard reorder, retained row/input identity, invalid
package-index recovery, conditional and document disposal, and fresh remount.

The maintained Worker benchmark remains byte-identical at 907 raw / 477 gzip B
for the Worker graph and 14,456 raw / 6,159 gzip B for the window graph. Seven
clean builds record a 999.7 ms median on this host. Timing is not compared with
the prior macOS sweep. The change adds no runtime file or drag/drop abstraction;
it classifies `HTMLElement` with the existing browser globals used by bundled
effect callbacks.

## 0.16.1 Retained Editor Ownership

Measured 2026-08-28 on Linux x64 with Node 24.14.0 and Chrome. The new
CodeMirror fixture emits 7 JavaScript files totaling 214,968 raw / 71,607
aggregate gzip bytes, while its static sibling emits zero JavaScript. These
bytes belong to the real editor package and existing selected effect/runtime
capabilities; no retained-ref runtime file or shared widget runtime was added.

Required Chrome proves initial content, retained package DOM across application
updates, editor-to-state updates, accessible error recovery, conditional
disposal/remount, and document disposal. The maintained Worker benchmark remains
byte-identical to 0.15.1 at 907 raw / 477 gzip B for the Worker graph and 14,456
raw / 6,159 gzip B for the window graph. The generated 50-route, 500-module
source-scale fixture retains compiler digest
`7c366079a984b3d62fb19a26305326d3278f029d2193d39340ddd3a4be5adc6e` and
output digest `e107d78a7f55bc8a1af0ea6e53efeffa19b3d44d21c892484d103fa346e7ba7b`.
Timing from this Linux host is recorded only as a local check and is not compared
with the prior macOS release sweep.

## 0.15.1 Maintained Benchmark Sweep

Remeasured 2026-08-27 on macOS arm64 with Node 24.14.0, Apple M4 hardware,
16 GiB RAM, and Chrome 151.0.7922.174. Candidate comparisons use clean
`v0.14.3` except project-state scale, whose maintained contract compares the
published `0.10.0` baseline. Every paired compiler/native/commerce output digest
or manifest is identical unless the row below records route-specific `0.15.1`
output.

| Maintained runner | Current `0.15.1` result |
|---|---|
| `npm run benchmark` | Worker-effects clean-build median 220.1 ms; Worker graph 907 raw / 477 gzip B; window graph 14,456 / 6,159 B. |
| `npm run benchmark:keyed` | 2,000-row build 233.2 ms; append 2.2 ms, filter 3.9 ms, restore 15.6 ms, reverse 5.3 ms medians; 30,048 raw / 11,748 gzip B JavaScript. |
| `RUNS=7 npm run benchmark:native` | `v0.14.3` / `0.15.1` dispatch medians 3.5 / 3.4 ms for 5,000 clicks; identical 14,354 raw / 6,470 gzip B JavaScript and zero changed files. |
| `RUNS=7 WARMUPS=1 npm run benchmark:module-cache` | `v0.14.3` / `0.15.1` medians 248.338 / 249.692 ms and 296.9 / 296.8 MiB peak RSS; identical 454,007-byte result and digest. |
| `npm run benchmark:source-scale` | 50 routes, 500 modules, 50,550 lines: `v0.14.3` / `0.15.1` compile medians 499.3 / 498.9 ms and clean builds 851.5 / 853.8 ms; identical compiler and output digests. |
| `RUNS=7 npm run benchmark:commerce` | 1,011-page storefront: `v0.14.3` / `0.15.1` clean-build medians 1,854.6 / 1,822.1 ms; all 1,053 files and 10,140,618 output bytes match. |
| `npm run benchmark:project-navigation` | Seven-profile table update median 0.4 ms and navigation median 2.3 ms; 17 session JavaScript files total 77,779 raw / 27,050 gzip B. |
| `npm run benchmark:project-state` | One-, eight-, and 32-state commit medians 0.2, 0.3, and 0.4 ms; deploy digest `3f83712254d95f1cf59c5034f363ea906406efa1bd9539f3bb8b9a0d54a3fdc5`. |
| `npm run benchmark:project-list-decision` | Direct load 138.2 ms with 90,023 nodes; pagination load/range 39.6/5.8 ms with 2,867 nodes; window load/range 40.7/5.8 ms with 2,868 nodes. |

The paired timing ranges overlap at module-cache and source-scale granularity,
so no compiler regression or improvement is claimed. Native output is byte
identical. Pagination remains selected over the timing-tied authored window: it
uses one listener instead of two, has lower median heap (1,485,168 versus
1,586,528 B), and preserves native page, focus, keyboard, and variable-row-height
behavior without fixed-height range policy.

## 0.15.1 Public Cross-Framework Commerce Fixture

Measured 2026-08-27 from public fixture commit
`f2d5be1a516c539e30f7125f6870d42b1dd02ecd` with 1,000 products and Kudzu
linked to this `0.15.1` checkout. The matched variants use Astro 7.1.3 with
React 19.2.8, React Router 8.3.0, TanStack Start 1.168.32, and Next.js 16.2.11.
All five builds completed before the same asset and browser harnesses ran.

| Variant | Initial JavaScript across six routes, gzip | Total output | First reliable click after first paint | Degraded capabilities |
|---|---:|---:|---:|---:|
| Kudzu 0.15.1 | 4.2-9.9 KiB | 9.42 MiB | 300 ms | 15 / 18 |
| Astro 7.1.3 + React | 60.6-61.1 KiB | 13.95 MiB | 1,500 ms | 12 / 18 |
| React Router 8.3.0 | 103.8-104.6 KiB | 7.04 MiB | 2,000 ms | 8 / 18 |
| TanStack Start 1.168.32 | 103.5-104.1 KiB | 9.87 MiB | 2,000 ms | 9 / 18 |
| Next.js 16.2.11 | 144.2-146.2 KiB | 35.76 MiB | 3,000 ms | 8 / 18 |

The initial-JavaScript column records what Chrome actually received for home,
search, collection, product, policy, and checkout routes. Browser results are
medians from seven fresh sessions under 4x CPU slowdown and Chrome Slow 4G.
Reliable click is the first tested delay with zero lost add-to-cart attempts in
seven isolated sessions. The resilience score covers six matched capabilities
under blocked JavaScript, a two-second script delay, and one missing script.
Pre-rendered content and native links remain usable without JavaScript in every
variant; the score does not treat read-only fallback as full interactivity.

This is the current executable public commerce comparison, not a replacement
for the broader historical 0.9 C1/C2/C5 contracts. That ignored local workspace
is unavailable in current checkouts, so its React, Vue, Svelte, and Astro result
remains provenance rather than a current ranking. The public commerce fixture
does not contain Vue or Svelte variants.

## 0.15.1 Key-Scoped Native Popover Intake

Measured 2026-08-27 on macOS arm64 with Node 24.14.0 and Chrome
151.0.7922.174. The maintained project fixture uses native Popover with one
key-scoped `useId()` relationship per project row. Required Chrome verifies
Escape, light dismiss, trigger focus restoration, reorder identity, inserted
and remounted IDs, and enhanced-navigation cleanup.

The application emits 44 files totaling 171,202 raw / 53,629 aggregate gzip
bytes with deploy SHA-256
`46ba45b4a423b9627c6ede5f8dd3a667f593cb5401454ae42ecc66207b07b323`.
The maintained two-route session contains 17 JavaScript files totaling 77,779
raw / 27,050 aggregate gzip bytes. `/help` remains 0 B JavaScript.

Seven fresh Chrome profiles record table update samples of `[0.4, 0.4, 0.5,
0.4, 0.5, 0.5, 0.5]` ms, a 0.5 ms median and 0.4/0.5 ms range. Navigation
samples are `[4, 2.4, 2.6, 2.5, 2.5, 2.8, 2.4]` ms, a 2.5 ms median and 2.4/4
ms range. These ranges overlap prior retained-path evidence; no timing
improvement or regression is claimed.

## 0.14.3 10,000-Item Browser Decision Intake

Measured 2026-08-27 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175 using `RUNS=7 npm run benchmark:project-list-decision`.
The tracked fixture rotates three fresh-profile routes, forces garbage collection,
and records navigation completion, range replacement, DOM counters, JavaScript
heap, native edit identity, and bounded-row release.

| Strategy | Load median | Range median | Rows | DOM nodes median | JS heap median |
|---|---:|---:|---:|---:|---:|
| Direct DOM | 806.6 ms | n/a | 10,000 | 90,023 | 535,572 B |
| Pagination | 165.4 ms | 12.1 ms | 100 | 1,470 | 1,407,412 B |
| Scroll window | 161.2 ms | 16.5 ms | 100 | 1,471 | 1,507,712 B |

Direct load samples are `[767, 790.1, 882.8, 908.8, 753, 826.7, 806.6]`
ms. Pagination load/range samples are `[253.6, 138.6, 157, 133.7, 181.9,
202, 165.4]` / `[10.8, 22.1, 15.8, 13.7, 12.1, 10.5, 11]` ms. Scroll
window load/range samples are `[156.7, 154.6, 163.4, 161.2, 175.9, 203.5,
137.1]` / `[21.3, 16.4, 14.6, 17.1, 15.9, 16.5, 20.4]` ms.

The direct route is static and therefore has the lowest JavaScript heap; that
does not offset its 61.2x DOM-node count and 4.9x load median. Pagination and the
scroll window have overlapping load ranges, while pagination has the lower range
median, lower JavaScript heap, no scroll listener, native focus/page semantics,
and no fixed-row-height policy. Pagination is selected for 10,000-item project
tables. The window experiment adds no framework primitive and does not authorize
`0.14.4`; three independent failing fixtures remain required.

## 0.14.2 Infinite Loading Composition

Measured 2026-08-26 on macOS arm64 with Node 24.14.0 and Chrome
151.0.7922.174.

The project route adds one intrinsic sentinel, an owned `IntersectionObserver`,
cursor fetch, duplicate suppression, error/retry/end state, and immutable keyed
append. Required Chrome proves a three-request bound across two successful pages,
at most six retained projects, retained existing-row identity, observer cleanup,
and route-owned fetch abort. `/help` remains 0 B JavaScript.

The application emits 44 files totaling 168,037 raw / 52,955 aggregate gzip
bytes with deploy SHA-256
`230dea098442275e42a966ca595743a4da9c832327ba52d4d09de663c68f8f1a`.
The two-route session remains 17 JavaScript files and totals 76,889 raw / 26,750
aggregate gzip bytes. The authored application composition adds 3,732 raw / 770
gzip deploy bytes and 2,063 raw / 546 gzip session bytes over `0.14.1`; no
semantic primitive, IR kind, compiler pass, production compiler/runtime line,
runtime concept, or public API was added.

Table update samples are `[0.4, 0.5, 0.5, 0.3, 0.5, 0.4, 0.6]` ms, with a 0.5
ms median and 0.3/0.6 ms minimum/maximum. Navigation samples are
`[2.3, 2.3, 2.2, 2.6, 2.5, 2.5, 2.3]` ms, with a 2.3 ms median and 2.2/2.6 ms
minimum/maximum. The environment differs from the `0.14.1` release evidence, so
no improvement or regression claim is made.

## 0.14.1 Nested Object-State Collections

Measured 2026-08-26 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175.

The project route now roots its selected project table and nested issue rows in
one direct `projectData.projects` field. Required Chrome proves immutable
whole-object replacement, nested insert/update/reorder/remove/re-add, retained
identity, latest handlers, descendant state release, and fresh remount. `/help`
remains 0 B JavaScript.

The application emits 44 files totaling 164,305 raw / 52,185 aggregate gzip
bytes with deploy SHA-256
`0a3b7e10b3447a76a9c04ef34ad7c2bfa30400ea53c9d16fc85b1c7cbf2ea203`.
The two-route session remains 17 JavaScript files and totals 74,826 raw / 26,204
aggregate gzip bytes. The delta from `0.14.0` includes the authored nested issue
controls and handlers plus one build-time validation-line edit and one production
list-runtime line; no semantic primitive, IR kind, compiler pass, runtime concept,
or public API was added.

Table update samples are
`[0.8, 0.8, 0.7, 0.8, 0.9, 0.8, 0.8]` ms, with a 0.8 ms median and 0.7/0.9 ms
minimum/maximum. Navigation samples are
`[3.7, 4.1, 4.5, 3.9, 4.2, 3.9, 4.3]` ms, with a 4.1 ms median and 3.7/4.5 ms
minimum/maximum. The navigation ranges overlap the `0.14.0` release evidence;
no improvement or regression claim is made.

`npm run benchmark:source-scale` generates its fixture outside the repository so 50,000 lines of synthetic source are not tracked. The default topology is 50 pages plus 450 route-owned imported modules. Generation is excluded from timing; fresh-process samples separately report source reads, reachable-graph discovery, source compilation, clean production build, compiler-result and deploy digests, output files/bytes, cache counters, and peak RSS. `ROUTES`, `MODULES_PER_ROUTE`, `FILLER_LINES`, `WARMUPS`, and `RUNS` may reduce or expand the fixture without changing the default acceptance floor. `TARGET_ROOT` measures another checkout; `BASELINE_ROOT` alternates that checkout with the current tree and requires identical deploy output.

The maintained 2026-08-13 comparison used Node 24.14.0 and an Intel Core i5-9500 Linux x64 host, one warm-up, and seven alternating fresh-process samples against clean `v0.8.44`. A narrow fast path skips Kudzu semantic transformation for 450 plain `.ts` modules whose runtime edges are exclusively resolvable relative TypeScript imports or exports; all other modules retain the existing transformer. Compile median fell from 2,323.9 ms to 1,413.2 ms (39.2%) and clean-build median from 3,325.3 ms to 2,382.4 ms (28.4%); every paired sample improved. Compile peak-RSS median fell from 571.2 MiB to 552.6 MiB, while build peak RSS was 570.9 MiB versus 568.8 MiB. Compiler scratch fell from 7,328,390 to 1,971,061 bytes. Both targets emitted the same 50 static HTML files, 10,980 bytes, and deploy SHA-256 `e107d78a7f55bc8a1af0ea6e53efeffa19b3d44d21c892484d103fa346e7ba7b`. This is a source-scale compiler comparison, not a cross-framework result.

## 0.14.0 Project Table CRUD And Identity

Measured 2026-08-26 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome proves native table insert, update, delete,
reorder, sort, filter, selection, keyboard focus, row-local edit state, and
retained keyed DOM identity.

The application emits 44 files totaling 159,258 raw / 51,627 aggregate gzip
bytes with deploy SHA-256
`ebb3358e7a03612459e723ae765c39d105498db9d293415b924f1066cddf4793`.
The two-route session remains 17 JavaScript files and totals 73,304 raw / 25,930
aggregate gzip bytes, 2,273 raw / 626 gzip bytes above `0.13.3`. `/help`
remains 0 B JavaScript. The added bytes are route-specific authored table
handlers, bindings, selectors, and keyed row state; there is no data-grid
runtime.

Table update samples are `[0.7, 0.8, 1.0, 0.7, 1.1, 0.7, 0.8]` ms, with a 0.8
ms median and 0.7/1.1 ms minimum/maximum. Navigation samples are
`[3.9, 3.9, 5.5, 4.2, 6.1, 3.5, 3.4]` ms, with a 3.9 ms median and 3.4/6.1 ms
minimum/maximum. Table update is a new measurement, so no same-content latency
delta is claimed.

Core semantic LOC remains 5,682 with zero new semantic primitives, IR kinds,
compiler passes, production compiler/runtime lines, normalization rules,
adapters, runtime concepts, public APIs, or data-grid runtimes. Infinite loading,
windowing, and the 10,000-row strategy remain later measured decisions.

## 0.13.3 File Upload Boundary

Measured 2026-08-25 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome proves plain-text type and 1 KiB size
validation before any request, native file reading, `FormData`/fetch upload,
user cancellation, delayed failure and retry, route-departure abort, and
successful keyed attachment mutation.

The application emits 44 files totaling 150,023 raw / 50,240 aggregate gzip
bytes with deploy SHA-256
`a16fd5dbc08086aa6a7c0ec0aba3a38fbe2a63b96005a81e8747a7f4e45e214e`.
The two-route session remains 17 JavaScript files and totals 71,031 raw / 25,304
aggregate gzip bytes, 2,367 raw / 557 gzip bytes above `0.13.2`. `/help`
remains 0 B JavaScript. The added bytes are route-specific authored file
validation, multipart upload, effect cleanup, and keyed attachment behavior;
there is no upload runtime.

Navigation samples are `[3.7, 5.0, 3.5, 3.7, 3.8, 3.8, 4.0]` ms, with a 3.8
ms median and 3.5/5.0 ms minimum/maximum. This changes the destination, so no
same-content runtime regression or improvement claim is made.

Core semantic LOC remains 5,682 with zero new semantic primitives, IR kinds,
compiler passes, production compiler/runtime lines, normalization rules,
adapters, runtime concepts, public APIs, upload schedulers, or transfer
runtimes. Fetch does not expose upload progress, so the application states that
boundary instead of fabricating progress. Chunking, resume, background sync,
and files above the authored 1 KiB in-memory text limit remain unsupported.

## 0.13.2 Multistep Draft And Autosave

Measured 2026-08-25 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome proves native step validation, debounced save,
server rejection of an older in-flight version, ignored stale completion,
enhanced-navigation and reload restoration, retained input on conflict, and
reset with timer and storage cleanup.

The application emits 44 files totaling 144,633 raw / 49,217 aggregate gzip
bytes with deploy SHA-256
`06a35341c5e70bfec48c46ad767ac351326b39ba701f5c1f1d03992a65ec8b9e`.
The two-route session remains 17 JavaScript files and totals 68,664 raw / 24,747
aggregate gzip bytes, 3,260 raw / 848 gzip bytes above `0.13.1`. `/help`
remains 0 B JavaScript. The added bytes are route-specific authored state,
conditions, handlers, and effects; there is no wizard or autosave runtime.

Navigation samples are `[10.7, 7.4, 3.7, 7.9, 6.1, 4.0, 5.4]` ms, with a 6.1
ms median and 3.7/10.7 ms minimum/maximum. This changes the destination and the
range is noisy, so no same-content runtime regression or improvement claim is
made.

Core semantic LOC remains 5,682 with zero new semantic primitives, IR kinds,
compiler passes, production compiler/runtime lines, normalization rules,
adapters, runtime concepts, public APIs, wizard schedulers, or autosave
schedulers. One real application fixture closes the packet through existing
state, conditional ownership, dependency-effect cleanup, owned fetch, and
versioned storage semantics.

## 0.13.1 Nested Form Metadata

Measured 2026-08-25 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome proves conditional assignee fields, dynamic
checklist rows, explicit dirty/touched display, stable-key reorder, removal,
native reset, exact retained/released DOM identity, and the preserved keyboard
constraint and server retry journey.

The application emits 44 files totaling 138,064 raw / 47,964 aggregate gzip
bytes with deploy SHA-256
`f0d96cfd5dee2cf3fa67f4ebe25d8b32cbb1bf66e72ed5ca1c29bd06fdcc0a33`.
The two-route session remains 17 JavaScript files and totals 65,404 raw / 23,899
aggregate gzip bytes, 3,286 raw / 803 gzip bytes above `0.13.0`. `/help`
remains 0 B JavaScript. The added bytes are route-specific authored handlers,
bindings, conditionals, and keyed-list descriptors; there is no shared form
runtime.

Navigation samples are `[3.5, 3.3, 4.4, 3.3, 3.2, 4.7, 3.3]` ms, with a 3.3
ms median and 3.2/4.7 ms minimum/maximum. The range overlaps `0.13.0`, and the
destination now contains dynamic nested form behavior, so no same-content
runtime regression or improvement claim is made.

Core semantic LOC remains 5,682 with no semantic primitive, IR kind, compiler
pass, production compiler/runtime line, normalization rule, adapter, runtime
concept, public API, registration function, proxy metadata graph, schema
adapter, or form runtime.

## 0.13.0 Production Form And Server Validation

Measured 2026-08-24 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Required Chrome uses real Enter key input to prove native empty
and minimum-length constraints, then executes delayed field-error, form-error,
and successful issue-creation responses. Pending state, focused and ARIA-linked
field feedback, alert/status roles, exact requests, retry, and retained valid
input all pass.

The application emits 44 files totaling 127,343 raw / 46,261 aggregate gzip
bytes with deploy SHA-256
`183f5a7ca081f99ae38de6974e61fdcb32ca49de699359aac053d0154ae38036`.
The two-route session uses 17 JavaScript files totaling 62,118 raw / 23,096
aggregate gzip bytes. Compared with `0.12.4`, the authored form, three primitive
states, one ref, and one route-specific handler add 992 raw / 433 aggregate gzip
session bytes and one browser file. `/help` remains 0 B JavaScript.

Navigation samples are `[3.8, 5.6, 4.3, 2.6, 2.9, 3.6, 3.1]` ms, with a 3.6 ms
median and 2.6/5.6 ms minimum/maximum. The range does not overlap the `0.12.4`
1.5/2.4 ms range. This is a changed-content application measurement: the
destination now parses and mounts the complete issue form and route handler.
Production compiler/runtime source is unchanged, so no same-content runtime
regression or improvement claim is made.

Core semantic LOC remains 5,682 with no semantic primitive, IR kind, compiler
pass, production compiler/runtime line, runtime concept, public API, form
registry, metadata proxy, schema adapter, or form runtime.

## 0.12.4 Nested Layout Evidence Decision

Verified 2026-08-24 on Linux x64 with Node 24.14.0 and Chrome
142.0.7444.175. Six executable route sets fit the existing ownership model: one
retained layout owner around one replaceable route owner, followed by existing
conditional, keyed, effect, and DOM ownership. Zero routes prove an intermediate
retained layout lifetime, so the packet closes by its stop condition without an
owner chain.

Generated output is byte-identical to `0.12.3`: 43 deploy files totaling 123,835
raw / 45,379 aggregate gzip bytes with SHA-256
`fb9d24cc01791bf80b67b659738ba62beded6ff6ce14a86a278fa4b34d088acf`.
The two-route session remains 16 JavaScript files totaling 61,126 raw / 22,663
aggregate gzip bytes, and `/help` remains 0 B JavaScript.

Core semantic LOC remains 5,682 with zero semantic primitives, IR kinds,
compiler passes, production compiler/runtime lines, runtime concepts, layout
registries, disposal paths, public APIs, browser files, or browser bytes added.
No benchmark rerun or latency comparison applies because production and
generated code are unchanged; the published `0.12.3` 1.8 ms median and 1.5-2.4
ms range remain provenance rather than a new claim.

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
# CONTENT R13 Observation/Map Measurement (2026-09-10)

Archive closure: `browser-tools-r13-20260910-audited.tar.gz`, 68,962,181 B,
1,042 manifested evidence files; SHA-256
`83dc57ad33f9e3604f591b8c56b76c310da08490586dfb7474098c7de8a5fa4a`.
Manifest SHA-256: `137f67a9a9ac68d24489e885af92c6ef9f21b2d8d9cb8e060e4637e7eaad506c`.
Two deterministic tar invocations produce the identical archive hash; file hashes,
archive listing and external checksum verify. Freeze-to-archive elapsed is
**46m 47.248s**, 01:05:37.117Z to 01:52:24.365Z, including the actual batch and
final checks, excluding initial inspection. This external checksum paragraph and
the matching packet closure are added after packing to avoid a self-hash cycle;
the archive contains the full report immediately before these closure additions.

The separately authorized ten-attempt CONTENT batch is complete: **Kudzu 5/5,
React + Vite 5/5**, with all independent build, behavior, accessibility, browser,
and output acceptance gates passing. This does **not** establish AI-cost savings.
Kudzu uses 1,731,168 tokens versus React's 1,266,931 (+36.64%); historical R12 was
1,572,199 versus 1,270,703. R13 Kudzu is +10.11% versus historical R12, while React
is -0.30%. Two changes in one stochastic five-pair batch cannot isolate causality.

## Frozen Protocol

Evidence root: `test-results/ai-delivery-production/browser-tools-r13-20260910/`.
The existing R12 runner, adapter, task, scorer, budgets, source requirements and
serial schedule are unchanged. React 19.2.8 / Vite 8.2.2 and registry dependency
lock entries remain unchanged. Kudzu installs the immutable local prerelease
`0.16.28-observation-map.20260910.1`, packed from working-tree source with the
689 B README map; only the copied package manifest has a prerelease version.
The workspace remains `0.16.28`. No mutable package symlink, private grader hints,
asymmetric instructions, compiler changes, model substitution, retry, release,
commit or push occurs. Both variants receive identical updated browser utilities
and public documentation, with equal pre/post-agent context integrity checks.

- Protocol SHA-256: `d0e9fa058e09d6601c1bd04a33a35495e338d55f67fe501cd7854a82203e334c`.
- Tarball SHA-256: `577f11730a0f6bbb4d31176ddb587dabb8e8f9fdce2358e746792a605d67fad5`.
- Exact executable: archived OpenCode 1.18.27, verified against R12's binary hash
  and `--version`; every completed trace reports `openai/gpt-5.6-sol`.
- `preregistration.json` freezes cost/phase/discovery/adoption/reference/acceptance
  outcomes and interpretation before provider calls. The candidate's `npm ci`
  installation matches every packed file and retains all other lock entries.
- Before model calls, `KUDZU_REQUIRE_CHROME=1` and `KUDZU_AI_DELIVERY_GROUP=1`
  explicitly run `ai-delivery-lifecycle.test.mjs`, `ai-delivery-production.test.mjs`,
  `ai-delivery.test.mjs`, and `browser-smoke.test.mjs`: **11/11, zero skips**,
  01:05:44.244Z to 01:06:24.762Z. R12's sequencing omission is not repeated.
- A separate availability-only READY probe costs 6,727 tokens and 11.464 seconds.
  It does not replace any attempt. Total charged tokens including it: **3,004,826**.
  Reported subscription dollars are zero, not free compute.
- Actual serial batch: 01:06:54.244Z to 01:35:08.293Z, **28m 14.049s**.
  The freeze initially stopped on a disposable R12 `node_modules/.bin` symlink;
  inventory was restricted to evidence outside `node_modules` before freezing.
  No provider call or attempt occurred during that preparation failure.

## Attempt Costs

K/R abbreviate Kudzu/React + Vite; ordinals are unchanged, not ranked outcomes.
All rows succeed, so failure-inclusive and successful-attempt totals coincide.
Failed tool calls and their correction builds remain charged. Cache writes are
zero throughout. `audit.json` retains every step's cache/noncache/output/reasoning
usage, message ID, phase totals, tools, observations and final text.

| Attempt | R13 tokens | R12 tokens | Uncached | Cache read | Output | Reasoning | Elapsed ms | Tools | Builds | Pre / build-message / post tokens | Clean smoke / calls |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| K0 | 305502 | 299213 | 42899 | 259584 | 2671 | 348 | 156354 | 27 | 1 | 132748 / 25090 / 147664 | 1/1 |
| R0 | 295549 | 231558 | 34487 | 257408 | 3012 | 642 | 203324 | 26 | 2 | 99051 / 18905 / 177593 | 2/3 |
| R1 | 286051 | 280489 | 81515 | 201472 | 2472 | 592 | 156615 | 21 | 1 | 102180 / 23304 / 160567 | 2/2 |
| K1 | 374213 | 249207 | 74154 | 296576 | 2951 | 532 | 167425 | 31 | 1 | 192560 / 32564 / 149089 | 1/1 |
| K2 | 400732 | 345718 | 39380 | 357632 | 3019 | 701 | 189690 | 29 | 2 | 149081 / 27175 / 224476 | 1/2 |
| R2 | 214167 | 234596 | 29143 | 182400 | 2299 | 325 | 131002 | 23 | 1 | 114364 / 21877 / 77926 | 1/1 |
| R3 | 239550 | 248732 | 37389 | 198912 | 2718 | 531 | 157532 | 26 | 1 | 100915 / 19506 / 119129 | 3/3 |
| K3 | 311472 | 302343 | 43728 | 264320 | 2873 | 551 | 177271 | 28 | 1 | 146741 / 21733 / 142998 | 2/2 |
| K4 | 339249 | 375718 | 37750 | 298112 | 2838 | 549 | 164598 | 29 | 1 | 149599 / 27204 / 162446 | 1/1 |
| R4 | 231614 | 275328 | 45005 | 183424 | 2608 | 577 | 151879 | 25 | 1 | 100186 / 18984 / 112444 | 3/3 |

| Metric | R13 Kudzu | R13 React | R12 Kudzu | R12 React |
|---|---:|---:|---:|---:|
| Total tokens | 1731168 | 1266931 | 1572199 | 1270703 |
| Tokens per success | 346233.6 | 253386.2 | 314439.8 | 254140.6 |
| Uncached input | 237911 | 227539 | 273935 | 284308 |
| Cache-read input | 1476224 | 1023616 | 1282304 | 970368 |
| Output / reasoning | 14352 / 2681 | 13109 / 2667 | 13467 / 2493 | 12986 / 3041 |
| Model steps | 72 | 62 | 68 | 63 |
| Median elapsed ms | 167425 | 156615 | 150351 | 151896 |
| Median normalized tools | 29 | 25 | 28 | 24 |
| Model builds total | 6 | 6 | 5 | 7 |
| Prebuild tokens | 770729 | 516696 | 675556 | 512871 |
| First-build-message tokens | 133766 | 102576 | 117762 | 98525 |
| Postbuild tokens | 826673 | 647659 | 778881 | 659307 |

Phase boundaries use the entire first model message containing a build, not
wall-clock attribution of individual tokens to individual tool outputs. Kudzu's
464,237 excess tokens split into 254,033 prebuild, 31,190 build-message and 179,014
postbuild. Provider accounting cannot identify which read caused a cached token.
K2's 397,012 input tokens remain inside the unchanged 400,000 input budget;
400,732 total tokens are not an input-budget failure.

## Discovery And Adoption

`discovery.mjs` reads immutable raw traces and emits per-tool locations, output
bytes and definitions in `discovery.json`. Broad truncated root inventories are
R13 **5 / 56,810 B** Kudzu versus **6 / 59,918 B** React; R12 is 6 / 69,798 B versus
5 / 49,533 B. The broader all-root-glob ledger also counts six small untruncated
R12 React calls (11 / 51,094 B total); these are not silently conflated with the
earlier broad-inventory metric. All byte counts are tool output, not model tokens.

Kudzu package operations grow from 17 / 93,722 B to 23 / 159,379 B; actual package
reads grow from 7 / 37,758 B to 11 / 60,343 B. R13 prebuild steps/raw tools are
41/102 versus React 34/91; historical R12 is 40/91 versus 35/94.

Only K1 reads the map, in its final pre-edit full README read, **after** reading
the manifest and public declarations. K0/K2/K4 start their README reads at lines
75/65/70 and never see it; K3 reads declarations without the README. No agent
explicitly discusses the map or follows a map link after exposure. The evidence
supports **one exposure, zero observed map-directed uses**, not knowledge of
internal model understanding. Search-before-read and package inventories persist.

After preserving the immutable candidate, the 689 B map and its dedicated package
smoke assertions are removed from the working tree. README returns to 10,612 B;
the package smoke returns to its prior behavior. This is a minimal decision to
remove unproven overhead, **not** causal disproof or a measured claim about the
post-removal package. No second model batch is run.

## Browser Observations

All ten agents use real inputs and receive compact observations. Audit verifies
**95 references**, each pointing backward directly to a complete observation in
the same invocation; no chained/forward/out-of-invocation references or compact
open/snapshot records occur. The focused regression separately checks changed
AX observations, explicit snapshots, failed assertions and repeated full opens.
There are no spilled browser outputs in R13.

| JSON record bytes | Kudzu | React | Total |
|---|---:|---:|---:|
| Actual compact records | 132367 | 234548 | 366915 |
| Same records expanded through references | 256764 | 401681 | 658445 |
| Exact omitted observation bytes | 124397 | 167133 | 291530 |
| References | 39 | 56 | 95 |

Expansion retains the actual commands, elapsed values, errors and completion
records, adding only the referenced observation fields; newline bytes are counted.
It is a byte-exact reconstruction of this trace, not another measured legacy-tool
run or a prediction of model-token savings. Retain the +5-net-line compaction:
bounded output savings are proven and no utility correctness regression appears.
No agent explicitly explains reference resolution; successful continued testing
shows usable output, not proof of internal model understanding.

Actual clean smoke exits are **6/7 Kudzu, 11/12 React**. K2 and R0 first fail the
exact AX lookup because authored CSS uppercases `Search articles`; both use the
existing candidate-name diagnostic, remove the transformation, rebuild and pass.
Compaction preserves both failures; they are not retry-erased benchmark attempts.
All other shell calls exit zero. No new tool fix is authorized by these traces.

Successful fill counts K0..K4 are 4/4/5/6/4 (23 total); R0..R4 are 4/4/4/5/4
(21 total). Text assertions total 39/63, clicks zero. All agents cover no-match
and clearing/whitespace restore; K0/K2/K3/K4 and R0/R3/R4 explicitly test title
queries, while K1/R1/R2 use topics for their single-result smoke. Every agent tests
case and surrounding whitespace somewhere. Independent acceptance tests title
and topic behavior for every attempt, regardless of agent smoke coverage.

Four Kudzu agents repeat raw-output marker scans; K0 relies on the build summary.
K3's final wording about `/static/` without JavaScript exceeds its ordinary smoke
configuration; independent static artifact checks, not that final sentence,
establish zero-script output. Browser success does not certify source retention.

## Acceptance And Verification

Audit reconciles ten attempt records, 60 raw command streams, 170 artifacts,
165 retained source files and 60 copied-context checks. Each source changes only
its article page (`src/pages/articles/index.tsx` or React `src/App.tsx`) and
`src/styles.css`; data, cards, shell, routes, package manifests and locks remain
unchanged. The scorer independently checks initial/singular/topic/empty/restored
states, exact label/type, live counts, one h1, no positive tabindex, browser errors
and output. Every Kudzu attempt has ten zero-JavaScript siblings; React's existing
client runtime is permitted and is not mislabeled zero-JavaScript. These are the
maintained accessibility checks, not an exhaustive screen-reader/mobile audit.

After map removal, sequential 1,200,000-ms command budgets run:

1. `npm run check`: exit 0, 01:37:42.360Z to 01:37:59.268Z.
2. `KUDZU_REQUIRE_CHROME=1 npm test`: exit 0, standalone 1/1 plus 320/320,
   zero failures/skips, 01:37:59.270Z to 01:46:47.360Z.
3. `npm run test:package`: exit 0, 01:46:47.364Z to 01:46:51.894Z.

The archive retains raw R13 evidence, exact candidate/toolchain, R12 comparison
copies and hashes, final source diff, scripts and test logs. Frozen R12 and R13
integrity checks pass. No core semantic primitive, pass/LOC, runtime concept,
dependency or production browser-byte change occurs. Final working source differs
from the measured candidate only by removal of the map/package assertions and
these evidence records; measured R13 is never relabeled as the post-removal tree.

Five pairs, provider/cache/time drift, the local candidate identity and two bundled
interventions preclude causal/statistical superiority. Historical R12 retains its
pre-run lifecycle/protocol omission; raw scores are not recalculated. Full R8 stays
23/25 versus 24/25 and the 1.0 gate remains blocked. Next action is evidence-led
review of prebuild package discovery and repeated postbuild inventories, not new
compiler syntax, asymmetric hints or an automatic further model run.
# CONTENT R14 Symmetric Inventory Policy (2026-09-10)

Archive closure (external to its own snapshot):
`inventory-policy-r14-20260910-audited.tar.gz`, **69,954,597 B**, **1,077 files**,
SHA-256 `f92d4de5dfb437cdd5ad5f668a3c5ffb00b7faab388933cd281eee9b06418a05`.
Manifest SHA-256 `2df9514094626a14dc2e0236a5dfb3ba0f42b5cba6c7e9d009296de2d85844be`.
Two deterministic packs match, every manifest hash/archive member verifies, and
the sibling checksum passes at 04:41:44.176Z. This paragraph and the matching
packet closure are added after packing to avoid a self-hash cycle; the archive
contains the complete report immediately before these checksum additions.

The single authorized ten-attempt batch finished its schedule: **Kudzu 1/5,
React + Vite 2/5** under the unchanged scorer and budgets, versus historical
R13 **5/5 and 5/5**. All ten independent final builds and behavioral/accessibility/
output acceptances pass, but that does not override budget failures. React R3
times out and has incomplete attribution; `run.json` correctly says `incomplete`,
not a fully attributable completed benchmark. No retry or second batch occurred.
**The AI-cost objective was not achieved; do not install this policy as a default.**

Evidence: `test-results/ai-delivery-production/inventory-policy-r14-20260910/`.
This is an inventory-policy experiment, not a compiler improvement. Main remains
0.16.28. Existing dirty browser compaction and documentation history are preserved.
No compiler/runtime/CLI feature, dependency, OpenCode configuration, permission,
sandbox, release, version bump, commit or push was introduced.

## Frozen Inputs And Gates

- Protocol SHA-256: `451090eb5f0858a0d8b2da229c58e71b18a1c9d1e4d2536990fa7d0aa09de84c`.
- Immutable candidate tarball SHA-256: `419e87aebf5bc754d973dcd4b47290e41670abfaf9db6871d2c6ae13769d892a`.
- Policy SHA-256: `86e99f6ce31af14d92f01164c2fe579fbd7f9a0d86a83a20bef27d290c08f667`.
- Local candidate `0.16.28-inventory-policy.20260910.1` differs from R13 only in
  README removal of the 689 B map and copied package version. `source-differences.json`
  freezes both complete per-file source inventories/digests. Compiler, runtime and
  bin bytes are identical. The main package version is untouched.
- R13's runner, adapter, scorer, task, acceptance contract, registry dependency
  locks, React 19.2.8 / Vite 8.2.2 starter, browser tools and public browser docs
  are reused unchanged. Kudzu starter manifest/lock differences only identify
  the immutable tarball. `npm ci` verifies every installed packed file.
- OpenCode 1.18.27 is binary-hash pinned; model is `openai/gpt-5.6-sol` throughout.
  Schedule remains K0,R0,R1,K1,K2,R2,R3,K3,K4,R4, serial, no model substitution.
- Both variants receive exactly the same **920 B** plain generic discovery text
  through public context. It is included in model input and charged, not installed
  configuration. No preloaded repository map, hidden grader label, stopping rule,
  dependency-doc/type restriction, or content-specific hint is added.
- Budgets remain 300,000 ms, 400,000 input tokens including cache reads, 20,000
  output, 20,000 reasoning, 40 normalized tools, 20 read paths, 8 modified paths,
  and 5 builds. Subscription pricing remains zero reported dollars, not free compute.
- Offline `compare.mjs` passes before calls, with 14/14 and 19/19 coverage,
  including the ten nested React HTML entries outside `src` and root `index.html`.
  Arbitrary authored roots and explicit dependency access remain in the policy.
- Explicit lifecycle/protocol/browser/copied-context gates pass **11/11, no skips**,
  03:43:02.565Z to 03:43:27.448Z. The unchanged runner's actual frozen-input check
  caught an invalid `includeInPrompt:true` on uncopied context before any provider
  call. Original protocol/freeze/preregistration and failing log are retained;
  removing that unnecessary flag uses ordinary default prompt inclusion. The
  corrected check reaches the intentional existing-output-directory sentinel
  only after validating every input, before creating any workspace or model call.
  `input-validation.json` records this bounded preparation repair, not a task retry.
- One separate availability-only READY probe costs **6,727 tokens**, 6.428 s,
  03:44:22.261Z to 03:44:28.689Z. Actual serial batch lasts **33m 42.541s**,
  03:44:29.336Z to 04:18:11.877Z, with a 18,000,000-ms outer command timeout.

## Scores And Costs

All rows pass independent final acceptance. `I/T/R/M/E` denote exceeded input,
tools, read paths, modified paths and elapsed budgets. R3's recorded token usage
is a **lower bound** from checkpointed finished steps; unknown tail cost remains
unknown. It is not zero-filled or extrapolated. Cache writes are zero throughout.

| Attempt | Score / exceeded | Uncached | Cache read | Output | Reasoning | Total recorded | Elapsed ms | Tools / reads / modified / builds | Pre / build-message / post tokens |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| K0 | success | 60944 | 296192 | 3386 | 654 | 361176 | 176916 | 33 / 17 / 2 / 1 | 152262 / 33542 / 175372 |
| R0 | success | 42482 | 200832 | 3238 | 1042 | 247594 | 184527 | 37 / 19 / 2 / 1 | 110122 / 21545 / 115927 |
| R1 | failure I,T | 63384 | 487168 | 4078 | 967 | 555597 | 216531 | 47 / 20 / 2 / 2 | 183857 / 39896 / 331844 |
| K1 | failure I,T,R | 81641 | 554880 | 3636 | 950 | 641107 | 201702 | 44 / 21 / 2 / 1 | 315986 / 58376 / 266745 |
| K2 | failure I | 56424 | 487552 | 3684 | 1258 | 548918 | 202861 | 39 / 17 / 2 / 1 | 213734 / 40721 / 294463 |
| R2 | success | 64599 | 190080 | 3232 | 935 | 258846 | 174059 | 39 / 20 / 2 / 1 | 114864 / 22932 / 121050 |
| R3 | failure I,E,T,R,M; timeout | 56272 | 469504 | 6207 | 1627 | >=533610 | 300006 | 63 / 26 / 13 / 4 | 169963 / 41367 / >=322280 |
| K3 | failure I | 54463 | 371712 | 3658 | 959 | 430792 | 184993 | 37 / 20 / 2 / 1 | 135333 / 44704 / 250755 |
| K4 | failure I,T,R | 63186 | 393088 | 3619 | 542 | 460435 | 180279 | 44 / 24 / 2 / 1 | 190341 / 37734 / 232360 |
| R4 | failure T,R | 38421 | 198272 | 3529 | 776 | 240998 | 181586 | 41 / 21 / 2 / 1 | 117871 / 24080 / 99047 |

| Metric | R14 Kudzu | R14 React | Historical R13 Kudzu | Historical R13 React |
|---|---:|---:|---:|---:|
| Attributable successes | 1/5 | 2/5 | 5/5 | 5/5 |
| Failure-inclusive recorded tokens | 2442428 | >=1836645 | 1731168 | 1266931 |
| Tokens per success | 2442428 | unknown; >=918322.5 | 346233.6 | 253386.2 |
| Uncached input | 316658 | >=265158 | 237911 | 227539 |
| Cache-read input | 2103424 | >=1545856 | 1476224 | 1023616 |
| Output / reasoning | 17983 / 4363 | >=20284 / >=5347 | 14352 / 2681 | 13109 / 2667 |
| Median elapsed ms | 184993 | 184527 | 167425 | 156615 |
| Median normalized tools | 39 | 41 | 29 | 25 |
| Model builds | 5 | 9 | 6 | 6 |
| Prebuild tokens | 1007656 | 696677 | 770729 | 516696 |
| First-build-message tokens | 215077 | 149820 | 133766 | 102576 |
| Postbuild tokens | 1219695 | >=990148 | 826673 | 647659 |

Total recorded usage including preflight is **>=4,285,800 tokens**; provider
reported dollars are zero and actual React/full-batch cost is unknown. Kudzu
recorded tokens rise 41.09% from historical R13; React's lower bound rises 44.97%.
The recorded K/R token gap is 605,783, but cannot be treated as an exact cost
difference because R3's tail is unknown. Phase boundaries allocate whole model
messages, not individual tool-output causality. Historical timing, cache state,
model service drift and candidate source metadata are not controlled effects.

## Discovery Adoption

Actual-output census, path lists, read inputs/offsets/bytes, dependency paths,
shell calls, and original trace line numbers are retained in `discovery.json`,
`discovery-totals.json`, `discovery-review.txt`, and raw `adapter.stdout`.
All ten perform a non-recursive root read and achieve complete authored-path
coverage before the first build: 14/14 Kudzu and 19/19 React, all five each.
React explicitly expands `about`, `articles`, `topics`, and `static`; no unknown
authored subtree or static entry is missed. This distinguishes filename coverage
from reading contents. Historical R13 React R1/R3 expose only 11/19 and 14/19
authored paths under the same exact-output census; their final acceptance still
passes, so those omissions are discovery observations, not retroactive failures.

| Discovery metric | R14 Kudzu | R14 React | R13 Kudzu | R13 React |
|---|---:|---:|---:|---:|
| Root globs / returned bytes | 21 / 46963 | 29 / 51896 | 5 / 56810 | 6 / 59918 |
| Truncated root globs | 4 | 5 | 5 | 6 |
| Prebuild raw tools / model steps | 151 / 37 | 172 / 35 | 102 / 41 | 91 / 34 |
| File read calls / output bytes, all phases | 93 / 323832 | 100 / 215257 | 56 / 129494 | 57 / 88025 |
| Prebuild file-read output bytes | 307829 | 205634 | 121063 | 83693 |
| Prebuild dependency file reads / bytes | 15 / 93602 | 0 / 0 | 10 / 60136 | 0 / 0 |

Root-glob scope includes empty/scoped root patterns, not just truncated broad
inventories. Nine agents still issue a broad recursive root pattern such as
`*.{json,jsonc,js,mjs,cjs,ts,tsx,html,css,md,yaml,yml}` despite the explicit warning.
K0 instead gets 19 dependency paths from its long manifest/config brace pattern.
Thus coverage adoption succeeds, but avoiding dependency-heavy discovery does not.
All Kudzu agents read all 14 authored files at least partly; React reads 18/19
(R0) or 19/19. Four Kudzu full lockfile reads return 32,007 B each; K4 reads 120
lines/4,329 B. React R1/R3 read 46,786 B lockfiles, R2/R4 read 80/160 lines,
and R0 does not read its lockfile. R13 had no lockfile reads. Smaller glob output
is outweighed by more reads; these exact output bytes are **not token savings**.

The unchanged scorer counts unique `read` tool paths, including directory reads;
it does not pretend every grep match or shell `readFileSync` is a separate read
tool. The audit retains those operations and outputs separately, including
postbuild artifact scans, so they are not free unreported inspection. Public
context is charged through model usage; no speculative dependency inventory was
preloaded. Dependency directories remain accessible, not required to be fully read.

## Browser And Source Audit

All ten final builds and unchanged Chrome acceptance suites pass initial, title,
topic, singular/plural, empty, restored results, exact label/type, polite live
status, one h1, no positive tabindex, browser errors, route/content and output
checks. Audit reconciles **60 command streams, 170 artifacts, 165 source files,
60 copied-context checks**, with immutable manifest/lockfiles and no source deletion.
Every Kudzu result retains ten zero-JavaScript siblings. These are maintained
checks, not an exhaustive mobile or assistive-technology certification.

Nine attempts change only the article component/page and stylesheet, retaining
ordinary state, pure filtering, keyed `ArticleCard` composition and shared data.
React R3 additionally changes ten HTML entries and `vite.config.ts`, extracting
`Site({path})` and using `react-dom/server` during Vite build for static siblings.
This is source-based rendering, not generated-output tampering or a grader bypass,
but it expands the change to 13 files and exceeds the budget. It first corrects
an overly broad index-path test, then a TS5097 extension-import build failure,
and reaches timeout without an agent browser-smoke call or final completion.
The independent build/acceptance after timeout cannot make that attempt successful.
Its static work interprets the existing Kudzu-specific no-script requirement as
universal; the frozen prompt/scorer are not rewritten or selectively rescored.

Agent browser smoke exits: **8/8 Kudzu, 8/9 React**. All five Kudzu and four React
agents execute real search input; successful fills total 21/17 and text assertions
49/49. React R1's uppercase CSS accessible-name mismatch is preserved, diagnosed,
and repaired by the agent using an explicit matching `aria-label`, then rebuilt.
K3 has one failed shell-quoted artifact scan followed by a corrected scan; it is
charged. No browser-tool correctness failure or new compiler failure was found.

Compaction remains unchanged: **96 direct, backward full-observation references**
validate; no chained, forward or cross-invocation reference. Actual/expanded JSON
record bytes are 181,054/333,162 Kudzu and 161,581/306,529 React, omitting exactly
297,056 B, not model tokens. No browser output spills occur. No agent explicitly
explains reference resolution; successful use is not evidence of internal reasoning.

## Decision And Limits

Do not promote the inventory policy. Complete coverage alone is not the delivery
objective, and this batch loses success rate while increasing recorded work.
Preserve the result and stop provider runs. A next bounded **offline** review may
separate filename inventory from content inspection and clarify the existing
framework-specific static-output wording; it must preserve arbitrary authored
roots, config/assets, dependency access and full acceptance. No automatic prompt
retuning/model rerun or raised budget is authorized by this result.

Five pairs, a timed-out attempt with unknown tail cost, time/cache/provider drift,
README removal and candidate identity differences preclude causal/statistical
policy claims. No compiler win, full-suite win or 1.0 qualification is claimed.
Full R8 remains 23/25 versus 24/25; the full-suite and 1.0 gates remain blocked.
Semantic primitives, core passes/LOC, runtime concepts, production dependencies
and framework browser-byte deltas are all zero in this task.

## Final Verification

All commands use explicit 1,200,000-ms budgets and retain stdout/stderr and UTC
receipts in `verify-execution.json`. `npm run check` passes at 04:26:33.495Z to
04:26:45.033Z. The first required-Chrome `npm test` passes standalone 1/1 and
319/320, failing the component-list browser test because it receives an nginx
HTTP-on-HTTPS error page instead of the fixture. The unchanged legacy test picks
ports from `10000 + pid % 10000` and accepts any listening responder; `ss` records
occupied listeners in that range. This is consistent with a port collision, not
a demonstrated component/compiler defect; the exact failed port was not logged.

One full-suite verification repeat, with no source/environment/budget change,
passes standalone **1/1 plus 320/320, zero skips**, 04:33:43.101Z to 04:39:27.932Z.
This is a test verification repeat, not a model or benchmark retry, and the first
failure is preserved. The legacy port-ownership risk is not claimed fixed.
Package smoke passes 04:39:27.953Z to 04:39:30.973Z: four installed packages,
three pages, one interactive. No testing bypass or skipped acceptance was used.
The archived report, frozen source/toolchain, raw attempts, source diffs, original
preparation failure, full test logs and evidence manifest retain the complete
sequence, not merely the final green verification.
