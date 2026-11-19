# Actual Budget: an account write pending at cached navigation

This continuation of the [compiled cache-return fixture](actual-kudzu-bfcache.md)
uses the real coordinator and SQLite backend. The initiating tab is a follower.
The question is whether a user can tell that a write may have committed when
the tab returns without the backend's reply.

## Reproduce

Prepare the [archived fixture and pinned Playwright installation](../../test-results/actual-kudzu-bfcache/README.md).
Apply `actual-kudzu-bfcache.patch` first. From the fixture, install and build
`@kudzujs/core@0.17.18`. From the repository, with `COORDINATION_ROOT` and
`ACTUAL_ROOT` set as in those instructions:

```sh
PENDING=1 RESULT_DIR=/tmp/opencode/pending-before node test/actual-kudzu-bfcache.mjs
```

Then apply `docs/next-architecture/patches/actual-kudzu-bfcache-pending.patch`
in the fixture, rebuild, and rerun with a different `RESULT_DIR`. Both runs use
the same toolchain. The probe requires an actual cache hit, not a fresh page.

| Scenario | Boundary | Required outcome |
|---|---|---|
| Request held | Real leader forwards the request to the backend only after the follower leaves | Warn on return; prevent retry until reload |
| Reply held | Real backend completes the write; leader forwards its reply only after the follower leaves | Same warning and lockout |
| Completed control | Follower observes the account and balance before it leaves | No warning; writes remain enabled |

The probe compares the ID from the real backend reply with the single rendered
account before and after reload, checks its 1,000-cent balance, counts sent
mutations, and verifies owner cleanup and HTML-only static navigation.

In the [unmodified baseline](../../test-results/actual-kudzu-bfcache-pending/baseline.json),
both interrupted writes committed and the original follower document returned,
but the alert stayed empty. The already-completed control passed.

The [patched fixture](../../test-results/actual-kudzu-bfcache-pending/candidate.json)
passed all three scenarios in Chrome, with one mutation each, the original
account ID and balance after reload, released resources, and no page errors.
This is a separate contract from renderer-crash recovery. The
[first crash regression run](../../test-results/actual-kudzu-bfcache-pending/initial-crash-remount.json)
passed promotion and saved-account readback but failed to reopen the local
database on conditional remount (`Failed to fetch`).
The [diagnostic repeat](../../test-results/actual-kudzu-bfcache-pending/second-crash-reload.json)
also promoted the follower and observed one committed write, but failed at
the earlier full-page reload with the same page error. Neither run establishes
crash recovery for this candidate.

The [unmodified 0.17.17 comparison](../../test-results/actual-kudzu-bfcache-pending/prior-core-crash.json)
failed during database initialization, before the test even crashed a renderer.
Chrome reported [`net::ERR_NETWORK_CHANGED` for the local migration files](../../test-results/actual-kudzu-bfcache-pending/prior-core-network-errors.log);
Actual's `populateDefaultFilesystem` then threw `TypeError: Failed to fetch`.
This reproduces the visible startup failure without the patch, but only this
comparison captured the network error code. Crash recovery on the candidate
still requires a passing run on a stable network.

### Recovery from a failed database startup

With the preceding candidate as baseline, `LOSS=init-failure` in
`test/actual-kudzu-crash.mjs` creates and saves one account, deliberately
interrupts one migration asset during reload, then restores the asset for a
user-initiated reload. This tests interrupted initialization rather than
simulating a renderer crash or relying on a host network change.

The [baseline](../../test-results/actual-kudzu-init-failure/baseline.json)
stays at “Opening local database”. Apply the
[fixture patch](patches/actual-kudzu-init-failure.patch) and rebuild: the TSX
acknowledges Actual's existing failure message, disables writes, and presents a
terminal status with a reload instruction. The bundled application worker logs
and reports the failure instead of throwing it again after reporting it.
With the same `COORDINATION_ROOT`, `ACTUAL_ROOT` and a fresh `RESULT_DIR`, run
`LOSS=init-failure node test/actual-kudzu-crash.mjs`. The
[candidate](../../test-results/actual-kudzu-init-failure/candidate.json)
passes with the same single account ID and 1,000-cent balance, writes enabled
again, and no uncaught page errors. No writes are automatically retried.

The [separate renderer-crash run](../../test-results/actual-kudzu-init-failure/crash.json)
also passed all three boundaries on this candidate. After reload the completed
and reply-held writes each produced one account; the request held before
backend delivery produced none. Each case sent just one mutation, released
its resources, and recorded no page errors.

Compiler primitives, core passes/LOC, and runtime concepts: +0. The fixture's
deploy JavaScript (including the application worker) adds 118 raw / 33
aggregate gzip bytes. No performance benchmark was run.

### Account-name validation

Actual's pinned `packages/desktop-client/src/components/util/accountValidation.ts`
trims names and rejects blanks and exact duplicates in the loaded account
list. HTML `required` alone allowed a whitespace-only account with a real
starting balance in the [previous fixture](../../test-results/actual-kudzu-account-name/baseline.json).
On the startup-recovery fixture above, apply the
[account-name patch](patches/actual-kudzu-account-name.patch), rebuild, and run
`LOSS=account-name node test/actual-kudzu-crash.mjs` with the same environment.
The [browser receipt](../../test-results/actual-kudzu-account-name/candidate.json)
checks that blank and duplicate submissions keep focus on the field and send no
mutation, correction clears the alert, and the two valid case-distinct names
survive reload. This is local form validation, not cross-tab uniqueness.

One existing fixture; six additional application source lines. No new
compiler primitives, passes, core LOC or browser runtime concepts.
Generated JavaScript: +188 raw / +92 aggregate gzip bytes. No timing measured.

## Application change

The application has one outstanding account creation at a time. Record its
actual request ID on the effect-owned connection after posting it. A matching
terminal reply clears the ID; suspending while it is still set consumes it
once and locks writes until a fresh reload checks the database. Rejoining and
reading accounts does not clear this lock. Ignore late mutation replies and
guard the submit handler as well as the button.

The TSX grows from 188 to 200 lines. The build keeps all 77 output paths and
all 66 public assets. Only the interactive HTML, route effect and handler
module change. Generated JavaScript grows from 32,082 to 32,538 bytes
(+456 raw; 12,778 to 12,895 aggregate gzip, +117). New semantic primitives,
core passes/LOC and runtime concepts: zero. No timing benchmark was run.

This is an application change, not an automatic conversion of all Actual Budget
requests. Multiwriter conflicts, generic request queues, OS crashes, and
cross-browser cache eligibility are outside this fixture.
