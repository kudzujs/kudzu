# Actual Budget Local Account Mutation Evidence

## Result (2026-11-02)

The next connected reduction passes on released Kudzu **0.17.8** without a
compiler or runtime change. It extends the local-budget creation fixture with
native account forms and the original backend's account messages. This proves
one bounded local database journey, not an Actual Budget application migration.

## Source and reduction

Pinned upstream remains `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`:

- `packages/desktop-client/src/accounts/mutations.ts:64-176` sends
  `account-create`, `account-close` and `account-update`, then invalidates queries
  or reports errors.
- `packages/loot-core/src/server/accounts/app.ts:94-134` updates and reads accounts;
  `:550-587` creates accounts and an optional starting-balance transaction;
  `:589-699` handles closure. An account with no transactions is deleted. A
  nonzero balance without a transfer destination is rejected. The fixture does
  not force deletion or weaken this rule.
- The reduction replaces query invalidation with an explicit `accounts-get`
  response refresh, and error notifications with an accessible alert. Native
  forms send the original message names and payload fields through the already
  owned Worker. Parent busy state controls keyed-row buttons.

Original backend/WASM/data and the extracted unchanged absurd-sql IDB worker
remain public assets. They are not compiler-generated Worker graph entries.
The original source files and their manifest/license context accompany evidence;
complete upstream provenance remains in the previous intake archive.

## Browser acceptance

Node 24.14.0, upstream Playwright 1.61.1 / Chromium 149.0.7827.55; fresh isolated
context, local static server with COOP/COEP. No retries or simulated database.

1. Create a real local budget and verify no accounts.
2. Create Checking with starting balance 10 through `account-create`.
3. Attempt closure without a transfer account; observe the backend's nonzero
   balance error and retain the account.
4. Rename the account, clear the error, refresh data, and preserve the exact
   keyed DOM row.
5. Create a zero-balance account with no transactions, close it, and observe its
   deletion while retaining the original account's row.
6. Recover from the existing missing-budget error journey, close and reload the
   budget. The renamed account keeps its original ID; the deleted account stays
   absent. Nonzero-balance closure still fails after reload.
7. Rename again, remove the conditional owner and remount it. Reopen the database
   and verify the new name and same ID. All tracked Worker listeners are removed
   and Workers terminated on conditional release and pagehide.
8. An independent static sibling requests only HTML and starts no Workers.

Both the first journey and the extended final journey pass. No compiler failure
was reproduced, so no framework change or new package release is warranted.

## Accounting

Semantic primitives +0; core passes +0; core LOC +0; runtime concepts +0;
normalization/adapter rules +0. One archived application fixture is extended.

| JavaScript | Budget-only reduction | Account reduction | Delta |
|---|---:|---:|---:|
| Generated raw | 33,212 B | 34,759 B | +1,547 B |
| Generated aggregate gzip | 12,920 B | 13,221 B | +301 B |
| Total raw, including upstream public JS | 3,624,238 B | 3,625,785 B | +1,547 B |
| Total aggregate gzip | 796,560 B | 796,861 B | +301 B |

The accounting script verifies public assets are byte-identical and preserves
per-file hashes. These are added application behavior costs, not a compiler
regression comparison. No timing, visual parity, full transaction editor,
multi-tab coordination, locale, cloud sync or source-retention ratio is claimed.
`npm run check` and the project journey plus all 390 tests pass. Evidence
publication is recorded in `PERFORMANCE.md`.

## Next bounded investigation

Completed in the [archive-import continuation](./actual-budget-archive-import.md).

Follow the already reproduced upstream Actual archive-import onboarding journey
(`packages/desktop-client/e2e/onboarding.test.ts:94`) through native file input
and the real backend import protocol. Preserve the original checked-in archive
and expected Ally Savings 1,772.80 / Roth IRA 2,745.81 balances. Inspect binary
payload/transfer ownership before choosing a reduction. Stop on any need for a
generic archive/database/router runtime; compiler work still needs a real failing
fixture. This is a separate packet, not additional scope for this account result.
