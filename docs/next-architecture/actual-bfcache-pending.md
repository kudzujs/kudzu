# Actual Pending Mutation Across BFCache Suspension

## Reproduced upstream failure (2026-11-17)

This follows the completed
[compiled BFCache lifecycle packet](./actual-kudzu-bfcache.md). The input is
unchanged original Actual `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
No candidate coordinator or spreadsheet patch is substituted.

`test/actual-bfcache.mjs` now accepts `HOLD=request|reply` for one departing
follower. The default completed-operation journey remains available without
`HOLD`.

1. Create and reopen a budget, then prove a follower with no backend.
2. Submit one real account creation, holding either its backend delivery or its
   actual backend reply at the leader.
3. Navigate the requesting follower to a separate origin. Observe its original
   `tab-closing` and two real heartbeat rounds.
4. Release the original held request or redeliver the unchanged real reply while
   the follower is away. Verify the backend returns an account ID and the leader
   forwards that reply to the original coordinator.
5. Return with native Back; retain same-document/persisted-pageshow evidence,
   role rejoin, request count, terminal responses and visible pending UI.
6. After an additional real heartbeat, reload/read back the committed account
   ID, single account count and 10.00 balance.
7. Require exactly one terminal outcome for the cached original request, no
   mutation replay and zero page/HTTP errors.

Both cases eventually execute the one original mutation: unlike the prior
renderer-crash request barrier, the held pre-delivery request is deliberately
released while its requesting document is away. Its correct eventual database
result is one account, not absence. The test never fabricates success or retries
the mutation.

```sh
ACTUAL_ROOT=/path/to/unchanged/installed/actual \
RESULT_DIR=/tmp/opencode/actual-bfcache-pending \
HOLD=request node test/actual-bfcache.mjs
# Run sequentially on ports 3157/3158:
ACTUAL_ROOT=/path/to/unchanged/installed/actual \
RESULT_DIR=/tmp/opencode/actual-bfcache-pending \
HOLD=reply node test/actual-bfcache.mjs
```

## Source boundary

The original bootstrap posts `tab-closing` from beforeunload.
`coordinator.ts:296-302` removes a departing follower's request target/name
records. The reply path at lines 593-628 forwards only replies whose request
target still exists. The `__resume-tab` path restores group membership rather
than reconstructing deleted request ownership. Browser evidence is required
before classifying the observable pending UI or proposing a correction.

Semantic primitives, core passes/LOC, normalization/adapter rules, runtime
concepts and deployed browser byte delta: **0**. One existing external probe
gains two delivery-barrier cases; no application/compiler code is changed.
Timing, cross-browser eligibility and performance deltas remain unmeasured.

## Observations

The after-execution/reply-held case restores the same cached follower and rejoins
as FOLLOWER, but the original mutation has zero terminal responses after another
heartbeat. Its Add account dialog remains visible. Exactly one mutation was sent,
the real reply contains an account ID, and two subsequent reload/readbacks find
that same single account with 10.00 balance. Page/HTTP errors are zero. The
one-terminal-outcome assertion fails and is retained as a real upstream defect,
not counted as a passing recovery journey.

The first pre-delivery attempt had a harness error: optional-ID equality matched
an unrelated push while both compared IDs were undefined. Its
`initial-unmatched-reply.json` receipt is retained and excluded from application
evidence. The probe now requires an observed backend reply before matching its ID.

The corrected pre-delivery case produces the same failure. Both cases really
restore the original follower document, rejoin the budget and send exactly one
mutation. The real backend reply is forwarded while the requester is away, but
neither original request receives a terminal response after return and another
heartbeat. Both Add account dialogs remain open; reload finds one account with
the exact committed ID and 10.00 balance. Neither case has page/HTTP errors.

| Held boundary | Real BFCache return | Sent / terminal responses | Reload readback |
|---|---|---|---|
| Before backend delivery, released while away | Yes | 1 / 0 | Same ID, one account, 10.00 |
| After execution, real reply released while away | Yes | 1 / 0 | Same ID, one account, 10.00 |

Both probe commands intentionally exit nonzero. Passing role restoration and
database durability do not satisfy pending-request settlement. The source path
above explains the observed loss: closing removes the request target, so later
reply forwarding has no recipient, and membership resume does not recover it.

Next: reduce and correct this pending-request ownership boundary in a separate
pinned-upstream candidate. Require one explicit outcome after return, no mutation
replay, unchanged account ID/balance and a preserved distinction between uncertain
writes and failures known not to have executed before extending the compiled
fixture. Do not add a general retry queue, query cache or coordination runtime.

The subsequent [separate candidate](./actual-bfcache-pending-candidate.md) now
passes both pending barriers and all three completed-operation controls. It
rejects suspended pending requests locally once, distinguishes unsent from
uncertain outcomes, and catches a previously discarded count-read rejection.
The original failures above remain valid; no original workspace was patched.
Next: compiled pending-settlement continuation.

Repository validation passes: `npm run check` builds 268 pages and `npm test`
passes all 404 tests without skips. These framework checks do not change the two
external acceptance failures into passes. No version or release is selected.
