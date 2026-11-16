# Actual Abrupt Leader Loss and Heartbeat Intake

## Scope (2026-11-16)

This follows the next gate in
[Actual coordination through Kudzu effects](./actual-kudzu-coordination.md).
The original Actual production application remains pinned to
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`; its tracked source is unchanged.

The same archived coordinator variants are substituted at the HTTP boundary:

- **Association baseline:** retained created-budget association correction.
- **Uncertainty candidate:** association correction plus the retained
  pending-request uncertainty correction.

Neither variant is untouched upstream. The archive SHA256 is
`be22efc1477d05d1e0d3c6e53fdc4ca3107a72df86c64372b6c4bb8eec80c6ad`
(`actual-pending-request-handoff.tar.gz`, release v0.17.14).

## Method

Normal headless Chrome 152.0.7977.64, Node 24.14.0, Linux x64, real SQLite backend,
fresh context per case, original production build behind a local COOP/COEP proxy.
The browser uses its normal user agent so Actual does not bypass SharedWorker.

The follower owns no dedicated backend before loss. One actual `account-create`
request is held before backend delivery, or its real reply is held after backend
execution. CDP `Page.crash` crashes the leader renderer. The probe observes the
crash event and verifies no leader `tab-closing`, `beforeunload`, `pagehide` or
`unload` notification was observed. It does not call graceful page close.

The coordinator's original 10-second heartbeat interval is unchanged. The live
follower answers real pings, becomes leader, starts one backend and restores the
budget. Reload/readback verifies actual account presence and balances. No fake
database response, timer acceleration or write replay is used.

## Findings

The association-only baseline reproduces missing terminal responses after
heartbeat-driven promotion in both delivery cases. Backend restoration does not
settle the old mutation promise.

The uncertainty candidate returns one matching error for the held mutation.
Before delivery, reload shows no account and 0.00. After execution, reload shows
one Follower Checking account and 10.00: the uncertainty error does not mean
rollback.

**The initial after-execution candidate did not pass clean browser acceptance.**
Additional pending requests reject with the same uncertainty message and produce
uncaught page errors. The probe preserves the error assertion rather than filtering
these messages out. Correct mutation settlement and persisted data therefore do
not establish whole-application crash recovery.

The intake four-case matrix records:

| Coordinator | Held boundary | Terminal mutation response | Reload balance/accounts | Page errors | Acceptance |
|---|---|---|---|---|---|
| Association baseline | Before delivery | None | 0.00 / 0 | 0 | Missing-response defect reproduced |
| Association baseline | After execution | None | 10.00 / 1 | 0 | Missing-response defect reproduced |
| Uncertainty candidate | Before delivery | One error | 0.00 / 0 | 0 | Pass |
| Uncertainty candidate | After execution | One error | 10.00 / 1 | 4 | Fail: uncaught errors |

Observed crash-to-restored-backend times are 16,884 / 17,027 / 17,927 / 16,894 ms
in the table's order. These single observations do not establish a latency bound.
The intake after-execution receipt records errors for the held mutation plus
`payees-get`, `query`, `create-query` and `get-cell` requests. It records 18 protocol
errors in total, but only four uncaught page errors; those are different counts.

The path is consistent with the retained patch rejecting every pending request
in `electLeader()`, followed by
`packages/loot-core/src/platform/client/connection/index.ts:41-50` rejecting the
corresponding client promise. The next packet must identify and handle the
affected read callers; changing the coordinator to silently drop promises or
replay writes would undo the proven uncertainty boundary.

One concrete consumer is
`packages/desktop-client/src/hooks/useSpreadsheet.tsx:88-121`: `bind()` discards
the `createQuery()` promise and the promises returned by `get().then()` without
rejection handlers. Lines 127-140 send the observed `get-cell` and `create-query`
requests. The final receipt contains two of each alongside four uncaught errors.
This supplies the next minimal source-level regression target; it does not prove
that every rejected query caller is safe.

The first exploratory after-execution run also exposed a probe defect: its log
predicate accessed `.includes()` on a page-error record without `text`. The
corrected predicate uses optional access. That initial failed receipt is retained;
the corrected probe reaches database readback and separately fails the uncaught
page-error assertion.

## Reproduction and evidence

Use `test/actual-abrupt-handoff.mjs` with `ACTUAL_ROOT` pointing to the installed
pinned production workspace and `ACTUAL_HANDOFF_EVIDENCE` pointing to the extracted
archive. `CHROME_BIN` defaults to `/usr/bin/google-chrome`.

```sh
HOLD=request node test/actual-abrupt-handoff.mjs
HOLD=reply node test/actual-abrupt-handoff.mjs
FIXED=1 HOLD=request node test/actual-abrupt-handoff.mjs
FIXED=1 HOLD=reply node test/actual-abrupt-handoff.mjs
```

Run sequentially with ports 3147/3148 available. Set `RESULT_DIR` for a separate
output directory. Receipts are retained in `test-results/actual-abrupt-handoff/`.
The baseline's `pass: true` means defect reproduction, not safe behavior.
The original candidate's uncaught-error case exits nonzero.

All 44 original coordinator tests pass using the pinned workspace's original
Vitest configuration. This is complementary unit evidence, not a substitute for
the actual renderer-crash cases.

Repository validation: `npm run check` passes (266 pages); the project journey
plus 403 repository tests pass with no skips. The external after-execution
candidate remains a recorded acceptance failure despite these passing checks.

## Separate spreadsheet correction

The retained [spreadsheet patch](./patches/actual-spreadsheet-errors.patch) applies
only to a separate checkout of the pinned upstream source. It handles the three
discarded promise paths in `bind()`, clears a rejected cache entry only when it
still owns that entry, and reports errors through the application's existing
notification system. One stable notification ID prevents duplicate visible
warnings and asks the user to reload/read back before making changes.

The patch does not replay queries or mutations, synthesize balances, alter the
coordinator protocol, or treat uncertain writes as rolled back. A fresh explicit
binding may issue a new read after a failed cache entry is cleared. A late old
rejection cannot delete a replacement read.

Three original-configuration Vitest regressions fail before the source fix and
pass afterward: shared query/read rejection without replay, fresh read after cache
failure, and replacement-cache preservation after an old rejection. The candidate
production build passes. With the same retained coordinator and real renderer
crashes, both candidate browser cases pass with zero uncaught page errors:

| Held boundary | Sent mutations | Terminal mutation response | Reload balance/accounts |
|---|---|---|---|
| Before delivery | 1 | One uncertainty error | 0.00 / 0 |
| After execution | 1 | One uncertainty error | 10.00 / 1, same committed account ID |

The after-execution case also requires exactly one visible spreadsheet warning.
The original failed receipts remain in the evidence directory; the correction
receipts have `-spreadsheet.json` suffixes. Run the same probe with the patched
production workspace as `ACTUAL_ROOT` and `SPREADSHEET_FIXED=1 FIXED=1`.

After a fresh immutable install, the original workspace `typecheck`, three unit
regressions and production build pass. An earlier isolated `tsc` invocation with
shared dependency links failed on upstream declaration resolution; it is not
counted as a pass.

The first freshly installed browser run found a timing gap in the probe:
spreadsheet reads sometimes finished before the crash, leaving no pending read
error to notify. That failed warning assertion is retained as
`initial-pending-read-race.json`. The final after-execution probe therefore also
holds real `create-query` and `get-cell` requests issued after account creation
begins. It requires both request kinds to be pending before the crash, then
compares the uncorrected and corrected UI under that same delivery barrier.
This changes message timing only; no replies or data are fabricated.

This is an external upstream correction candidate, not a fix shipped inside
Kudzu's compiler/runtime or a change submitted to Actual upstream.

The version-aligned 0.17.16 repository passes typecheck/build (267 pages), all
404 tests without skips, and both package smokes. Framework and CLI source trees
are unchanged from 0.17.15.

## Accounting and next gate

Kudzu semantic primitives/core passes/core LOC/runtime concepts/browser bytes:
**+0**. One external browser probe, an upstream source patch and three upstream
unit regressions are retained; no compiler fixture, dependency or runtime feature
is added. The user-requested release publishes this bounded evidence. Promotion durations are
observations, not a speed comparison or guarantee; benchmark deltas are unmeasured.

The external UI source changes by +48 net lines after upstream formatting; its
three unit regressions add 118 lines. The original and candidate browser build
inventories each contain 33 JavaScript files: 12,575,690 / 12,576,139 raw bytes
and 2,852,755 / 2,852,909 aggregate gzip bytes. These are artifact costs, not a
matched speed comparison. The coordinator bundle is the unchanged archived
uncertainty candidate in both correction comparisons.

Next: extend the existing Kudzu coordination fixture with the proven renderer
crash journey, retaining the real heartbeat, explicit uncertainty lockout,
reload/readback and exact owner cleanup. This upstream result does not itself
establish the compiled fixture's crash behavior.

Renderer crashes are narrower than killing the entire browser/OS or interrupting
disk writes. SharedWorker-process failure, power loss, simultaneous writers,
BFCache recovery and exactly-once execution remain unverified.
