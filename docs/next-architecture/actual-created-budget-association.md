# Actual Created-Budget Association

## Scope and result

Follow-up to the [SharedWorker intake](./actual-shared-worker-intake.md), pinned
to Actual `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
This is an upstream coordinator correction candidate, not a Kudzu compiler fix.
The [patch](./patches/actual-created-budget-association.patch) is retained for
review/application to that exact upstream revision. It is not silently installed
into Kudzu or submitted to the upstream project.

## Root cause

`budgetfilesSlice.ts:145-172` creates a budget and then loads preferences; it does
not issue `load-budget` for the just-created database. In `coordinator.ts`, an
existing leader's create request keeps its current group (`__lobby` or a previous
budget). Only a creator that was not already leader receives `__creating-*`.

The preferences reply handler at lines 611-624 only rekeys `__creating-*` groups.
Consequently the successful leader's real database and coordinator group diverge.
A new tab's `load-budget(newId)` sees no matching group and elects another leader.
This independently reproduces for both initial lobby creation and creation while
already leading another budget.

A second omission matters for resumed tabs: `handleBudgetLoaded()` changes its
maps but sends no role-change notification. WorkerBridge's `_currentBudgetId`
only changes in `_applyRole()` and is sent back in `__resume-tab`; map-only rekeying
would leave the creator's browser-side association stale.

## Candidate

- Apply the successful `load-prefs` ID to any current leader group, requiring a
  nonempty string. The reply must still be tracked and come from the group leader;
  existing target-group conflict handling is preserved.
- Notify the leader and existing followers when the group ID changes, preserving
  their roles while synchronizing WorkerBridge's remembered budget ID.
- Reuse the existing map transfer and role protocol; no new registry or message.

The correction changes four source lines, net +2 LOC, in the external coordinator.
It does not claim to fix all creation/import/error/concurrent-operation cases.

## Verification

Two new deterministic coordinator tests fail against untouched upstream: the
creator remains in `__lobby` or `previous-budget` instead of `new-budget`.
Against a separate candidate copy, both pass and prove one group, follower
assignment without `__become-leader`, role notification and leader-close restore
using the new budget ID. Five additional cases reject missing/null/empty/numeric
preference IDs. All 44 existing coordinator assertions also pass against the
candidate (51 tests total). Original tracked source and tests remain unchanged.

The original production app browser probe now omits the previous reload workaround.
A local proxy serves only the candidate SharedWorker bundle at the original
worker URL; every other application/backend asset comes from the unchanged
original production build. The candidate request counter proves the substitution
was actually used. With a normal Chromium userAgent and fresh browser context:

1. Create an empty budget and reach All Accounts / 0.00.
2. Open a second tab immediately: FOLLOWER, no dedicated backend Worker.
3. Verify the creator owns exactly one dedicated backend Worker.
4. Close creator: follower becomes LEADER and creates its backend Worker.
5. Reload the promoted tab: same empty budget and 0.00 persist, no page errors.

This is a patched-upstream result, not an unchanged-upstream pass or Kudzu app
migration. The previous failing receipt is retained. Evidence archive includes
the regression source, original/candidate JSON, proxy probe and browser receipt.

## Accounting and next gate

Kudzu semantic primitives/core passes/LOC/runtime concepts/browser bytes: +0.
No package version, tag or npm release is justified by this upstream-only packet.
No timing comparison, crash/heartbeat recovery or writes during leadership handoff
has been verified. Next: apply the explicitly pinned upstream correction only in
the migration evidence environment, then prove a real account mutation from the
follower survives leader shutdown and reload before claiming multi-tab write safety.

That completed-write gate now passes in the
[follower account handoff continuation](./actual-follower-handoff.md).
In-flight writes and crash recovery remain unverified.

Repository checks: `npm run check` passes (263 pages). The first full test run
fails one existing managed-check descendant-termination assertion (`live check
descendant ...: R`); no corresponding product/test code changed. The full rerun
passes all 402 tests without skips. Both logs are retained rather than reporting
the initial run as clean. `git apply --check` accepts the patch on pinned upstream.
