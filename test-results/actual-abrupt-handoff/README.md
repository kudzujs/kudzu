# Actual abrupt leader-loss probe

This is an external application correctness probe, not a speed benchmark or a
default Kudzu test. It runs the pinned original Actual production application
with one of the previously archived coordinator bundles.

## Prerequisites

- Actual checkout `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`, with its
  lockfile-installed dependencies and completed desktop-client production build.
- Normal Chrome (the upstream `playwright` user agent disables SharedWorker).
- The extracted `actual-pending-request-handoff.tar.gz` asset from Kudzu
  [v0.17.14](https://github.com/kudzujs/kudzu/releases/tag/v0.17.14).
  SHA256: `be22efc1477d05d1e0d3c6e53fdc4ca3107a72df86c64372b6c4bb8eec80c6ad`.
- Local ports 3147 and 3148 available. Run cases sequentially.

```sh
export ACTUAL_ROOT=/absolute/path/to/actual
export ACTUAL_HANDOFF_EVIDENCE=/absolute/path/to/extracted/archive
export CHROME_BIN=/usr/bin/google-chrome
export RESULT_DIR=/tmp/opencode/actual-abrupt-results

HOLD=request node test/actual-abrupt-handoff.mjs
HOLD=reply node test/actual-abrupt-handoff.mjs
FIXED=1 HOLD=request node test/actual-abrupt-handoff.mjs
FIXED=1 HOLD=reply node test/actual-abrupt-handoff.mjs
```

The default coordinator includes only the retained created-budget association
correction. `FIXED=1` also includes the retained pending-request uncertainty
correction. Neither variant is untouched upstream.

## Contract

Use a fresh browser context and real SQLite backend per case. Hold one actual
follower `account-create` request before delivery, or its actual reply after
execution. Crash the leader renderer with CDP `Page.crash`; do not send graceful
closing messages, change heartbeat intervals, synthesize backend replies or
replay a write.

In the final after-execution probe, also hold real `create-query` and `get-cell`
requests issued after the mutation starts. Require both kinds to be pending at
crash time so a fast backend cannot accidentally skip the rejected-read case.
The same barrier applies to uncorrected and corrected application builds.

Require a surviving follower with no initial dedicated backend, natural heartbeat
traffic, leader promotion and backend restoration. The baseline must reproduce
the missing terminal response; the candidate must deliver exactly one visible
uncertainty error. Reload/readback must show no account and 0.00 before delivery,
or one account and 10.00 after execution. Uncaught page errors fail acceptance
even when the mutation response and persisted state checks pass.

Receipts retain protocol events, page errors, candidate hashes, database readback,
assertion failures and observed promotion time. Time is diagnostic, not a latency
guarantee. A baseline `pass: true` means the missing-response defect was reproduced.
This does not prove OS/browser-process crash durability, exactly-once execution,
conflicting writers, BFCache recovery or whole-application migration.

## Corrected upstream candidate

Apply `docs/next-architecture/patches/actual-spreadsheet-errors.patch` to a separate
pinned checkout, install its immutable lockfile and build its production browser
app. Set that checkout as `ACTUAL_ROOT` and run with
`SPREADSHEET_FIXED=1 FIXED=1` for each `HOLD` value. The candidate must also show
one visible spreadsheet read-error warning after execution, never replay the
mutation and read back the same committed account ID. Correction receipts use
the `-spreadsheet.json` suffix; failed intake receipts are preserved.

From the candidate workspace root, use its existing build prerequisites and
original commands:

```sh
git apply /path/to/kudzu/docs/next-architecture/patches/actual-spreadsheet-errors.patch
node .yarn/releases/yarn-4.17.1.cjs install --immutable
node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web typecheck
node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web exec vitest run src/hooks/useSpreadsheet.test.tsx
node .yarn/releases/yarn-4.17.1.cjs workspace @actual-app/web build:browser
```
