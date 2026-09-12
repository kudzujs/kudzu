# Historical R2 trace audit

2026-09-12, offline. This verifies an investigation tool against available old
records; it is not a new AI trial, a current framework comparison, or R16 recovery.

## Provenance

GitHub Actions listed zero artifacts. The repository release assets exposed the
older [v0.16.19 evidence archive](https://github.com/kudzujs/kudzu/releases/download/v0.16.19/kudzu-ai-delivery-0.21.4-gpt-5.6-sol.tar.gz).
The downloaded 7,615,233-byte archive matches both GitHub's asset digest and the
recorded PERFORMANCE digest:

`4e37d15b4c4b0cf88720a3a7743996794b2e0172dbc43d40514f944fb01bd0f8`

It contains 100 `adapter.stdout` streams across the invalid original batch and
revision 2. Only the 50 streams below were audited:

`test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r2/*/attempts/*/adapter.stdout`

The original batch is retained and not combined with R2. These are older inputs
(the inspected Content starter pins core 0.16.18), not the 0.16.30 worktree or R16.
R16's named archive was not found in the previously searched Documents/Downloads/
temporary paths, additional OpenCode data/cache searches, or these GitHub assets.
Its original owner must still provide a location for the current investigation.

## Read-only analyzer

`test/ai-harness-audit.mjs` reads OpenCode JSON event streams without executing their
commands. It reports:

- Source SHA-256, stream lines, message IDs, errors, missing usage, and unfinished
  messages. Non-JSON installation preamble lines are identified separately.
- Uncached input, cache reads/writes, output, reasoning, and the existing adapter's
  historical normalized total. These are not a new billing interpretation.
- A first-build command candidate and whole-message phase totals. Detection is a
  limited shell-text heuristic, not execution tracing; review the command before
  interpreting phase totals. Aliases/wrappers and complex shell syntax may be missed.
- Recorded tool output bytes, truncation flags, and exact read/glob/grep/list
  request-plus-output repeats. Different ranges, changed outputs, failed reads,
  and explicitly truncated output are not counted as exact repeat candidates.
- An intervening-potential-mutation flag for repeats separated by shell commands,
  edits, or other potentially side-effecting tools. Even without that flag, an
  exact recorded repeat is not a safe live cache hit or permission to skip a read.

Metadata/preview duplication is excluded from response-byte counts; the transcript
alone does not establish every byte actually supplied to the model. Model-step
tokens are never allocated to individual calls. A terminal stop is not acceptance,
and an audited stream is not proof of complete provider billing.

```sh
node --test test/ai-harness-audit.test.mjs

# EVIDENCE is the extracted archive directory. Choose a new report path each time.
node test/ai-harness-audit.mjs --details --out /absolute/new-r2-audit.json \
  "$EVIDENCE"/test-results/ai-delivery-production/0.21.4-gpt-5.6-sol-r2/*/attempts/*/adapter.stdout
```

The R2 command intentionally exits 1 after writing a partial report: one stream
has no usage. It retains that file as `status: invalid`, not a zero-token success.
Malformed streams are also explicit invalid entries. Existing report files are
never overwritten (`wx`). Omit `--details` to exclude the complete tool/step ledger.
No model call, network request, or archived command execution occurs in the analyzer.

## Offline results

All 50 R2 paths remain in the report. The 49 usage-bearing streams match their
archived `adapter.trace.jsonl` exactly for normalized input, output, and reasoning.
`realtime-react-vite-3` has no recorded model usage; total cost attribution therefore
remains incomplete. No success status or historical denominator was changed.

| Task | Kudzu usage-bearing streams | React usage-bearing streams | Kudzu tokens before first build candidate | React tokens before first build candidate |
|---|---:|---:|---:|---:|
| Content | 5 | 5 | 613,623 | 270,192 |
| Forms | 5 | 5 | 239,066 | 349,434 |
| CRUD | 5 | 5 | 438,170 | 340,113 |
| Commerce | 5 | 5 | 229,542 | 159,038 |
| Realtime | 5 | 4 | 432,205 | 324,385 |

These are historical scheduled usage, not success-normalized costs. In particular,
the incomplete Realtime column is not a fair five-attempt comparison. Whole-message
phase boundaries can include several tools and must not be treated as precise
per-command cost attribution.

No exact request-plus-output repeat candidates were found across the 49 streams
under the analyzer's conservative non-truncated read-tool definition. This does
not exclude overlapping ranges, semantically repeated searches, shell-based reads,
or repeated information across different requests.

Kudzu Content has six pre-build package `read` calls returning 57,164 recorded
output bytes; React Content has none. Searches and shell reads are not in that
count. One inspected source, `content/attempts/content-kudzu-0/adapter.stdout`, shows:

- Lines 26–27: package enumeration and `useState` search exposing internal docs.
- Line 30: a range of the public README.
- Lines 33–34: event/collection searches returning internal framework/evidence text.

Internal documentation was subsequently excluded from the published package in
later work, as the existing R8 record explains. Do not implement that fix again
or extrapolate this old path to R16's current bottleneck.

**Decision:** no new live read cache, mandatory inventory policy, or automatic
generator instructions are justified by this audit. The concrete deliverable is
the reusable offline audit tool, ready for the missing R16 streams. It allows
candidate selection from recorded requests rather than from aggregate guesses.

## Validation and local outputs

- Focused analyzer checks: 2/2 passed. They cover usage categories, mixed/duplicate
  messages, malformed JSON, incomplete streams, mutation/range/truncation boundaries,
  UTF-8 byte counts, missing usage, input preservation, and report overwrite refusal.
- `npm run check`: passed; 230 pages, two interactive.
- `CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm test`:
  standalone 1/1 plus main suite 326 passed, five Linux-only browser-smoke tests
  skipped, zero failures. This is not a zero-skip Linux release gate.
- This change does not alter installed package files, compiler/runtime behavior,
  generator output, benchmark inputs, or the other session's seven modified files.

Local external evidence is under the approved temporary workspace:

- `kudzu-historical-ai-evidence/`: extracted original archive.
- `kudzu-r2-audit.json`: 50-path detailed report, explicitly incomplete.
- `summarize-kudzu-r2-audit.mjs`: one-off reconciliation against archived normalized
  traces and table aggregation. Raw archive remains unchanged.

Temporary paths are not durable published evidence. The release URL/digest and
the checked-in analyzer permit reconstruction; R16 recovery is still required
before selecting its first evidence-backed live harness intervention.
