# Actual BFCache Pending-Request Candidate

## Completed correction (2026-11-17)

The [unchanged upstream failures](./actual-bfcache-pending.md) authorize this
separate worktree at `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
The original workspace and earlier spreadsheet candidate remain intact.

The [candidate patch](./patches/actual-bfcache-pending.patch) reuses the browser
connection's existing `replyHandlers` map. Persisted pagehide marks its pending
handlers and removes unsent messages from the initial connection queue. Persisted
pageshow deletes and rejects only those marked handlers. Already completed
requests remain completed; late replies cannot settle deleted handlers twice.
New requests after return use the existing connection.

Sent requests receive `RequestOutcomeUnknownError`: a write may have committed.
Requests still queued before first connection receive `RequestNotSentError`.
No request is replayed. The account creation modal shows a translated uncertainty
message and disables resubmission until the user leaves that modal; it instructs
the user to reload and inspect saved accounts. Its mutation hook suppresses the
ordinary "please try again" notification only for this uncertain outcome.

The patch also includes the previously proven
[spreadsheet rejected-read handling](./patches/actual-spreadsheet-errors.patch),
unchanged, because suspended reads now reject through the same connection.
It adds no coordinator, WorkerBridge, compiler or runtime change.

## Verification contract

Three focused connection tests cover once-only uncertainty, ignored late replies,
fresh post-return reads, completed/non-persisted behavior, and unsent queue removal.
Before correction two hang at settlement while the completed-operation control
passes. The three earlier spreadsheet regressions also pass in the candidate.

`CANDIDATE=1` makes `test/actual-bfcache.mjs` require an exact source diff matching
the recorded patch (including intent-to-add test files). Without it the probe
continues to require unchanged upstream. Port responses remain recorded separately:
the candidate's locally rejected promise is evidenced in the browser by one
visible uncertainty message and a disabled Create button, and once-only promise
settlement is tested directly in the connection unit test.

Both held-request and held-reply cases must restore the original cached document,
send one mutation, show that explicit local outcome, and read back exactly one
account with the backend's committed ID and 10.00 balance after reload.
The completed-operation journey remains a separate regression.

```sh
git apply /path/to/kudzu/docs/next-architecture/patches/actual-bfcache-pending.patch
git add -N packages/loot-core/src/platform/client/connection/bfcache.test.ts \
  packages/desktop-client/src/hooks/useSpreadsheet.test.tsx
corepack yarn install --immutable
corepack yarn build:browser --skip-translations
# From Kudzu, run sequentially:
ACTUAL_ROOT=/path/to/candidate CANDIDATE=1 HOLD=request \
  RESULT_DIR=/tmp/opencode/candidate-request node test/actual-bfcache.mjs
ACTUAL_ROOT=/path/to/candidate CANDIDATE=1 HOLD=reply \
  RESULT_DIR=/tmp/opencode/candidate-reply node test/actual-bfcache.mjs
```

Semantic primitives, core passes/LOC, runtime concepts and Kudzu browser bytes:
**+0**. This is an upstream application correction, not a compiled continuation.
New upstream production code is **+45 net lines**, plus 128 lines of tests;
the separately disclosed spreadsheet patch is reused unchanged. Full workspace
typecheck and scoped type-aware lint pass. English catalog extraction was run.
Browser acceptance passes below. No timing benchmark or cross-browser eligibility
claim is made.

## First browser run

Both delivery barriers pass with real same-document restoration, one uncertainty
alert, disabled Create, one sent mutation and the backend's same committed
account ID/count/10.00 balance. Page/HTTP errors are zero.

The completed-operation regression passes the plain control and departing leader,
but the departing follower reports one unhandled suspended-request rejection.
Its return and post-return account persistence otherwise pass. The failure is
retained as `initial-completed-unhandled.json`; this candidate is not yet accepted.
The probe now records pending request names at lifecycle boundaries to identify
the discarded background promise rather than suppressing the browser error.

Source-mapped request stacks identify `PagedQuery.fetchCount()`: both `run()` and
`refetchUpToRow()` discard its returned promise. The shared function now catches
rejection through its existing `onError` callback. A focused test first reproduces
the unhandled count rejection, then requires one error callback, no replay and
preserved successful page data. Diagnostic receipts remain separate from the
final acceptance run. This is an additional upstream promise-handling fix, not
a query cache or retry mechanism.

## Final build and accounting

The corrected candidate passes all 27 focused tests: three connection tests and
24 spreadsheet/live-query/paged-query tests. Full workspace typecheck, scoped
format/type-aware lint, English catalog extraction and production build pass.
The build runs after typecheck so its declaration output does not contaminate
the final deploy inventory.

`accounting.json` retains every original and final build path/hash. The existing
original intake has 167 files and 12,575,690 raw / 2,881,047 aggregate gzip JS
bytes; the candidate has 168 files and 12,812,207 / 2,932,330 bytes:
**+236,517 raw / +51,283 gzip JS bytes**. The newly generated English catalog
accounts for 234,775 raw JS bytes. This is the full candidate delta including
the reused spreadsheet patch and catalog generation, not a claim that the
lifecycle fix alone costs that amount. The unchanged coordinator, backend worker
entry and IDB worker retain their original hashes. No timing benchmark is run.

## Final browser acceptance

Chrome 152.0.7977.64 / Node 24.14.0 on Linux. Both pending-mutation commands and
the unchanged completed-operation journey exit zero with the final patch hash.

| Case | Native cached document restored | Outcome |
|---|---|---|
| Held request, released while away | Yes | One uncertainty alert, no replay, same committed account |
| Held reply, released while away | Yes | One uncertainty alert, no replay, same committed account |
| Plain HTML control | Yes | Native Back succeeds |
| Completed-operation departing leader | Yes | Post-return creation and reload readback succeed |
| Completed-operation departing follower | Yes | Post-return creation and reload readback succeed |

All cases have zero page/HTTP errors. Both pending cases retain exactly one sent
mutation, zero backend terminal replies and one explicit local uncertainty
outcome; these are not fabricated backend errors or success replies. Create is
disabled in the uncertain modal. Reload reads exactly one account with the
backend's committed ID and 10.00 balance. The final regression uses the same
early navigation timing; it was not weakened to wait out pending background reads.

This closes the separate upstream candidate gate. Next extend the existing
compiled BFCache fixture's pending-operation settlement using its native effect
and protocol, with the same two delivery barriers, without compiler/runtime
expansion. The original upstream still has the recorded defect; no upstream PR,
package release or deployment is included.

Final Kudzu checks pass: `npm run check` builds 268 pages and `npm test` passes
all 404 tests without skips. Logs, original failures, intermediate failures,
final browser receipts and the reproducible upstream patch are retained under
`test-results/actual-bfcache-candidate/` and the linked patch path.
