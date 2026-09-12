# AI authoring harness: cost research

Status: offline investigation, 2026-09-12. No model experiment or measured saving.
Base: `f1ef2b0aac3c8d714ae9f7965b2008bfed84e38d` (Kudzu 0.16.30).
Workspace: `kudzu-ai-tooling`, branch `feat/ai-authoring-support`.

Release follow-up: the user subsequently authorizes commit/push, PR/merge, tag and
release. The integrated candidate is core 0.16.34 / generator 0.1.156 on public
0.16.33 (`4c98059`), preserving the original investigation results below. Current
release verification is recorded in PERFORMANCE; no AI saving is asserted.

Follow-up: [historical R2 trace audit](ai-harness-r2-audit.md) recovers the public
older archive and validates a read-only analysis CLI against 49 recorded usage
streams, retaining one missing-usage stream. It does not replace the missing R16
evidence or establish a live harness optimization.

## Responsibility and boundary

Reduce the complete AI cost of delivering a working Kudzu application, including
failed attempts, without reducing behavior, accessibility, source maintainability,
or verification. The other session owns compiler/runtime correctness and framework
performance, including its seven-file 0.16.31 metadata/evidence patch.

This track owns developer-time context delivery, tool ergonomics, observations,
and avoidable discovery/repair loops. Coordinate edits to the generator, shared
CLI, diagnostics, browser helpers, and benchmark infrastructure before integration.
Run installations/builds in this worktree; source isolation does not isolate shared
ports, processes, global configuration, or provider quotas.

This is a maintainer research record, not app instructions or benchmark public
context. Do not expose historical failures, grader internals, or task solutions to
the measured agent. No compiler change, generator change, agent plugin, version
bump, historical protocol edit, or provider call was part of the initial research
packet. The subsequently requested opt-in generator prototype is recorded below.

## What the existing evidence says

These are recorded results, not newly recovered or independently replayed traces.
See [Performance Records](../PERFORMANCE.md) and the named sections in the
[application capability plan](next-architecture/application-capability-release-plan.md).

| Record | Observation | Consequence for this track |
|---|---|---|
| `0.20.5 Tooling Cost Validation` | Plain build and structured build/inspect/explain both passed 5/5. Tokens/success were 67,860 versus 84,793, about 24.95% higher with the tool bundle. | Do not make every task call inspect/explain; tool availability is not a saving. |
| `Focused 0.16.27 Content R9 Result` | All five Kudzu agents read verification guidance, but none followed the URL or performed an agent-owned browser journey. | More documentation alone does not establish adoption. |
| `CONTENT R13 Measurement And Map Removal` | Installed-package map exposure was 1/5, with no observed map-directed navigation; cost objective remained unmet. | Do not reintroduce the removed map as a proven fix. |
| `CONTENT R14 Symmetric Inventory Policy` | Kudzu 1/5 and React 2/5 within budgets, although all final acceptance checks passed. Extra reads outweighed smaller inventory output. | Reject mandatory full-project discovery and byte-only success criteria. |
| `Offline Non-Adjacent Observation Reuse` | Lossless expanded records reduced serialized output by 10.61% in the recorded projection. | Reuse the existing helper; response bytes are not measured end-to-end tokens. |
| `CONTENT R16: Explicit Role Selection` | Kudzu 5/5, React 4/5; Kudzu cost/success remained 14.15% higher. Optional unique-role targeting adoption was 0/10. | A capability must be discoverable and used before it can explain a saving. Do not silently weaken exact-name checks. |
| `Default AX Summary Deduplication` | Two offline replays reduced response bytes by about 51%, retaining documented observation/action checks. | Already implemented; no new compression layer is justified by this result alone. |
| `CONTENT R17 Three-Way Measurement` | Original scorer incorrectly counted hidden cards. Unchanged-artifact replay passed 15/15. | Preserve original scores; a replay is not a new model trial or fair three-way cost ranking. |

### Selected question: work before the first build

R16's recorded scheduled totals decompose as follows:

| Phase | Kudzu | React | Difference | Share of difference |
|---|---:|---:|---:|---:|
| Before first build | 669,707 | 421,909 | 247,798 | 51.90% |
| First-build message | 117,004 | 93,689 | 23,315 | 4.88% |
| After first build | 809,348 | 602,976 | 206,372 | 43.22% |
| Total | 1,596,059 | 1,118,574 | 477,485 | 100.00% |

The phase gap is not a success-normalized cost decomposition: there were five
Kudzu successes and four React successes. It also does not mean that 51.90% is
waste or recoverable. Pre-build work includes necessary reading, implementation,
model reasoning, and repeated context processing, not just source discovery.

Cache-read input is 1,320,448 of Kudzu's 1,596,059 recorded tokens (82.73%). Fewer
response bytes cannot predict cache usage, additional model steps, or dollar cost.
Shorter prompts can also change cache behavior; measure categories separately.

## Existing infrastructure to reuse

- `bin/kudzu.mjs`: build JSON diagnostics, inspect, and exact-route explain already
  exist. Inspect/explain rebuild; they are not free reads of an existing report.
- `test/browser-smoke.mjs` and `test/browser-smoke-public.md`: existing bounded
  browser observations, exact/unique-role selection, and observation reuse. The
  current utility explicitly requires Linux Chrome; this workstation is macOS.
- `test/ai-delivery-runner.mjs`: frozen inputs, isolated starters, independent
  acceptance, retained failures, and baseline/tool-assisted summaries. Reuse for
  a new protocol after reviewing current metric and lifecycle limitations.
- `test/ai-delivery-opencode-adapter.mjs`: captures raw OpenCode events and invokes
  `opencode run --pure --auto`. Do not assume the interactive session's Ponytail
  hooks or future generated AGENTS.md are used in this execution mode. Verify
  actual context delivery before measuring it.
- `test/fixtures/ai-tooling-cost/bootstrap/`: an existing same-framework tooling
  comparison, not a replacement for representative app-delivery tasks.

## Ranked hypotheses, not approved implementations

1. **Remove a proven redundant discovery round trip.** Recover the first-build
   traces and identify repeated unchanged paths/ranges or package-location probes.
   Only then choose the smallest existing-tool or context-delivery correction.
   Necessary import/config/asset exploration must remain possible. Do not impose
   a global inventory, dependency-read ban, forced first-build deadline, or hidden
   source restriction.
2. **Improve delivery of one needed instruction.** If traces show a specific
   public instruction was needed but not found, compare its existing delivery with
   one concise, version-matched entry point. Count instruction tokens and verify
   exposure, use, and resulting reads. Generated app AGENTS.md is a candidate,
   not the predetermined solution; do not copy compiler-maintainer rules into apps.
3. **Reuse equivalent verification observations.** Keep the existing compaction.
   Add behavior only if replay proves a remaining duplication with a trustworthy
   freshness boundary. Preserve every error, action, assertion, and recovery path;
   changed source or DOM cannot reuse stale evidence. Do not skip rechecks after edits.

Defer multi-agent orchestration, persistent cross-task memory, additional model
calls, and a new MCP/plugin service until a concrete task requires them. These add
cost and experimental variables before the present bottleneck is understood.

## Next offline packet and missing evidence

Required archive: `role-only-r16-20260911-audited.tar.gz`.
Recorded SHA-256:
`c8dbd8880124c9a64ca2b437a62300bd608ff08767778897eba7ad1cee1495ad`.

The archive was not found by exact-name searches under Documents, Downloads, or
the approved temporary workspace. Raw R16 files were not found in this worktree.
This is a scoped search, not proof that the archive does not exist elsewhere.

1. Obtain the archive location from its owner; verify the digest and extract into
   a separate evidence directory while retaining original bytes and manifests.
2. Review all ten attempts through the first model build. Keep source stream/line,
   command or read range, output completeness, changed-file state, and model-step
   association for each candidate redundancy. Report unknowns rather than guessing.
3. Separate useful discovery, repeated inventories/reads, implementation, tool
   failures, and first-build work. A repeated path with changed contents or a new
   range is not automatically redundant. Do not apportion a step's usage to its
   individual tool calls without attributable data.
4. Replay one demonstrated correction offline, retaining failure behavior and
   complete observations. Report bytes/operations separately from unmeasured tokens.
5. If nothing actionable is established, close the packet without a product change.

## Model experiment design, only after separate approval

First compare **Kudzu + baseline harness** with **the same Kudzu + one harness
change**. Hold package integrity, model/reasoning settings, starter, task, browser
environment, budgets, scorer, and all unrelated instructions/tools constant.
Do not compare a newly optimized Kudzu version with an old React run to attribute
a harness gain. Ponytail settings are either equal in both arms or the sole named
intervention, never silently added together with another change.

Use a separately named frozen protocol and a predeclared interleaved schedule.
Pilot proposal: one task, five attempts per arm, with no selective retries. This is
screening evidence, not a general superiority claim. After a promising pilot,
validate on held-out task classes before considering default generator integration.

If comparing frameworks later, use the same selected generic harness and equal
tool opportunities for Kudzu and React; provide each framework's ordinary public
documentation under the same policy. Keep this comparison separate from the
same-framework ablation and preserve all historical results.

Before provider calls, freeze actual context-delivery behavior and hashes, validate
the corrected visibility acceptance including negative controls, and run the
existing lifecycle/protocol/browser/copy-integrity gates in the supported environment.
Report expected usage and the spending/stop policy for approval; existing input
budgets are graded after execution and are not a hard provider billing cap.

## Acceptance and accounting

Primary metric: sum of all scheduled attempt tokens, including failures, divided
by independently accepted, within-budget successes. No successes means undefined
cost/success, not zero. Incomplete traces mean incomplete cost attribution. Retain
availability probes, interruptions, and auxiliary model calls as separate overhead
and report the complete experiment total as well as the scheduled metric.

Record uncached input, cache-read/write input, output, reasoning, model steps,
wall time, tool failures, builds, correction cycles, and framework artifact metrics.
Verify provider usage semantics before summing categories: reasoning may be included
in output for some APIs. Preserve the historical normalization, and explicitly
version any new accounting correction rather than rewriting old scores. The current
normalized trace folds cache-read input into input; detailed cache accounting needs
the raw events. Zero subscription-reported dollars do not establish free work.
Dollar claims require actual billing or an explicit dated rate model with cache
and reasoning semantics, not an undisclosed conversion from total tokens.

Require behavior, accessibility checks, source maintainability, and applicable
static-route/output contracts in both arms. Do not promote a lower-cost pilot with
lower observed success or weaker verification. Inspect ranges and every failure;
five pairs cannot establish statistical non-inferiority or universal savings.
Offline byte reductions and tool adoption are diagnostic metrics, not acceptance
of the AI-cost objective. A positive pilot requires a separately approved replication.

## User-requested opt-in context delivery prototype

The subsequent request explicitly asks how an app's coding agent can discover
Kudzu guidance, including installation through create-kudzu. The local generator
now accepts `--ai`, creating one app-root `AGENTS.md` and a README link. This is an
opt-in delivery mechanism, not a trace-proven fix, default policy, or full agent
runtime. R16 recovery and actual token-cost measurement remain outstanding.

The generated file is 1,638 UTF-8 bytes with a tested 2 KiB ceiling. It identifies
app conventions, local installed-version docs/types, and build/browser verification
requirements. It does not prescribe a full inventory or require inspect/explain.
No extra model, dependency, plugin, global configuration, or browser capability is
installed. The generator's existing nonempty-target check protects existing files.

The [OpenCode rules documentation](https://opencode.ai/docs/rules/) and
[Codex instructions documentation](https://developers.openai.com/codex/agent-configuration/agents-md)
describe root AGENTS.md discovery. Launch a new supporting agent session from the
generated app root. Merely placing instructions in compiler source or node_modules
does not make them auto-loaded. This session did not run a model to validate actual
prompt inclusion, adoption, or savings. Agent settings, overrides, context limits,
and benchmark execution modes must be checked in the eventual experiment.

Implementation: `packages/create-kudzu/index.mjs`, package README, and
`test/create-kudzu.test.mjs`. No core version or historical protocol changes.
Local usage and post-release npm syntax are in the
[generator README](../packages/create-kudzu/README.md#optional-ai-authoring-guidance).

Validation:

- New generator regression failed before implementation and passes afterward;
  generator tests 2/2. Default starter has no AGENTS.md; opt-in changes only that
  file and the README. App source, manifests, and configuration are byte-identical.
- Packed generator contains four files and successfully generates both variants.
  Both typecheck and build against the same local core/TypeScript via temporary
  symlinks. All four deploy files match byte-for-byte (9,758 bytes total);
  AGENTS.md/README are absent, and the static about route has no script/preload.
  This proves the default starter output boundary, not custom deployment rules.
  The local reproduction is `kudzu-ai-generator-smoke.mjs` in the approved temporary
  workspace; it uses no provider calls and removes its generated projects.
- `npm run check` passes: 230 pages, two interactive.
- Full macOS Chrome test run: standalone 1/1; main suite 326 passed, one existing
  Apache Answer route-shell Chrome spawn timeout, five Linux-only tests skipped.
  The unchanged failing test passes its isolated rerun (1/1). The first failure
  remains recorded; this is not a clean full-suite or Linux release-gate claim.
- Tracked diff whitespace validation passes. No model experiment, commit,
  publication, or assertion of lower AI cost follows the scaffold implementation.

## Executable developer-tool follow-up

The next user request authorizes connecting actual harness tools through the
generator. This supersedes the instruction-only delivery scope above. It remains
opt-in and does not require a new repository, published dependency, MCP setup, or
global host configuration. The generator copies `ai.mjs` to the app's
`kudzu-ai.mjs`, adds an `ai` npm script, and ignores `.kudzu-ai/` logs.

The generated tools provide:

- `npm run ai -- docs [heading]`: versioned, local README section lookup, ignoring
  headings inside fenced code. Index-only output by default; selected sections
  carry original line ranges and explicit truncation at 6,000 characters.
- `npm run ai -- check`: executes the existing npm check script, reports real
  exit/failure/timeout state, and preserves full stdout/stderr in a unique log.
  Output excerpts are bounded to the first/last 2,048 bytes when necessary. An
  error in the omitted middle remains in the original log; the JSON exposes its
  path and truncation. The tool never marks browser verification complete.
- Five-minute default timeout, configurable up to twenty minutes; Unix process
  group or Windows task-tree termination on timeout/interruption. Recursive check
  invocation is rejected. No caching or stale-result reuse is implemented.

The entry-point regression exposed macOS `/var` versus `/private/var` identity:
lexical path comparison silently skipped the copied CLI. Realpath comparison fixes
entry execution and recursive-check detection. Focused tests verify nonzero CLI
exits from an unrelated cwd, exact log preservation, missing document
sections, truncated responses, successful checks, timeout child termination, and
recursive-call rejection. No model or browser runs are needed for those tests.

Final validation on this 0.16.30-based worktree:

- Focused generator/tool tests: 4/4 passed.
- Packed generator: five files, including `ai.mjs`; no new dependency.
- Generated guidance: 1,828 UTF-8 bytes, within its 2 KiB ceiling.
- Packed-generator smoke: local Authoring lookup reports core 0.16.30; actual
  `npm run --silent ai -- check` typechecks and builds successfully. Baseline and
  guided starters still produce four byte-identical deployment files, 9,758 B.
  The generated helper, instructions, and logs are outside default deployment.
- `npm run check`: passed, 230 pages, two interactive.
- macOS Chrome `npm test`: standalone 1/1; main suite 329 passed, five Linux-only
  skips, zero failures. This does not replace the earlier recorded timeout or
  certify Windows behavior or a zero-skip Linux release gate.

The other worktree was left unchanged. Its observed HEAD advanced to release
0.16.33; that does not update this isolated prototype's tested baseline. Test and
benchmark process probes were empty before the sequential full verification;
worktrees still share machine resources and future timing runs need coordination.

This is a working developer-tool layer for an agent's existing shell tool, not a
replacement for OpenCode/Codex and not proof of token savings. Actual adoption and
same-framework cost ablation remain outstanding. Generated files are snapshots;
existing projects merge changes explicitly instead of overwriting their setup.
