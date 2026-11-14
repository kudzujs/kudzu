# Actual Pending Request Handoff

## Result (2026-11-14)

The next gate after [completed follower writes](./actual-follower-handoff.md)
reproduces lost request settlement in pinned Actual
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`, even with the earlier
created-budget association correction. A separate upstream coordinator candidate
now rejects pending requests on leadership replacement with an explicitly
uncertain-outcome error. This prevents silent pending promises; it does not
recover or replay a write.

The [new patch](./patches/actual-pending-request-handoff.patch) adds ten lines to
the external coordinator. Apply it alongside the
[previous association patch](./patches/actual-created-budget-association.patch)
only to the pinned migration evidence copy. Untouched upstream remains clean;
neither patch is installed into Kudzu or submitted upstream.

## Root cause and reduction

- `coordinator.ts:281-289` promotes a follower when the leader leaves.
- `electLeader():320-326` resets backend ownership and clears all three request
  maps without notifying their callers.
- `connection/index.ts:41-69,159-179` removes a pending promise only on a matching
  reply/error. A later connect does not settle that old request.
- WorkerBridge restores the database, but does not replay those lost requests.

There are two distinct real database outcomes with the same missing reply:
the leader may not have delivered the request, or it may have committed the
operation and lost its reply. Retrying `account-create` automatically would be
unsafe without a separate idempotency contract.

The candidate uses the existing `{ type: 'error', id, error }` protocol to send
one Error to each still-connected pending caller before clearing the maps.
Its message says the operation **may have completed** and asks the user to
reload and check data before trying again. No request payload is replayed.
The existing account notification displays the Error message. Its generic
notification heading still says “Please try again”; this candidate does not
claim a complete application-level uncertain-write UX.

## Deterministic browser evidence

The original production assets/backend and the previous association candidate
are retained from the handoff environment. Normal headless Chrome 157.0.8103.78,
Node 24.14.0, macOS arm64, fresh context per case, real SharedWorker and SQLite,
local COOP/COEP server. Only the coordinator bundle is substituted by the proxy.

The standalone probe observes the follower's actual SharedWorker port and places
one deliberate barrier in the leader's dedicated Worker boundary:

1. **Before delivery:** hold the real `account-create` request before forwarding
   it to the backend.
2. **After reply generation:** let the backend execute and return its real reply,
   but stop that message before WorkerBridge forwards it to the coordinator.

Both cases confirm the exact same request ID at follower and leader, then close
the leader with `runBeforeUnload: true`. After follower promotion and backend
restore, the association-only baseline has no terminal reply/error and retains
the Add account dialog. This is a bounded observation plus the source-level
missing settlement, not an infinite-duration measurement.

The candidate delivers exactly one matching error, with the uncertainty message
visible in the original application. Reload confirms:

| Barrier | Association-only baseline | New candidate | Persisted result |
|---|---|---|---|
| Before request delivery | No terminal response | One uncertain-outcome error | No account, 0.00 |
| After backend reply | No terminal response | One uncertain-outcome error | One Follower Checking account, 10.00 |

All four browser cases pass their respective assertions, with no page errors.
The baseline receipts deliberately assert the reproduced defect; `pass: true`
means reproduction succeeded, not that upstream handles the failure safely.
The candidate does not report rollback when the write actually persisted.

## Tests and reproduction

Two initial coordinator regressions fail before the pending-request patch:
expected one terminal response, received zero. The final matrix covers read and
write requests during tab closure and explicit `close-budget` transfer, two
waiting callers, cleared maps, no replay, no duplicate settlement from a late
old-leader reply, and exclusion of already completed requests.
All 44 original tests, seven retained creation regressions and four pending
regressions pass (55 total) under the original Vitest configuration.

The archive contains `pending-write.mjs`, four browser receipts, both worker
bundles, the full candidate source, regression sources, unit JSON, build script,
patches and license. The browser probe expects the existing sibling
`actual-handoff-upstream` production build and its installed dependencies.
Run `HOLD=request node pending-write.mjs` or `HOLD=reply node pending-write.mjs`
for the baseline; add `FIXED=1` for the candidate. `CHROME_BIN` can select Chrome.
Ports 3147/3148 are used locally. Barriers alter delivery timing, not backend
responses or database contents.

## Accounting and next gate

Kudzu semantic primitives/core passes/core LOC/runtime concepts/browser bytes:
**+0**. External coordinator +10 LOC; one archived browser probe and four
coordinator regressions added. No framework dependency, fixture or timing
benchmark changes. No new npm version or tag is warranted.

Next: reduce the proven completed-write and uncertain-write journeys into a
Kudzu application fixture using existing owned effects, native SharedWorker
ports and application-owned status. Preserve the explicitly patched upstream
boundary and require reload/readback before any user retry. A compiler change
still requires an actual failing reduced fixture. Abrupt process crashes,
heartbeat eviction, concurrent conflicting writes, automatic reconciliation
and exactly-once guarantees remain unverified.

The [Kudzu coordination reduction](./actual-kudzu-coordination.md) now closes
that next gate on released core 0.17.14, including explicit uncertainty lockout,
reload/readback, native port/Worker cleanup and an HTML-only static sibling.
