# Actual Budget Manual Transaction Evidence

## Result (2026-11-02)

The connected import/account reduction now supports a bounded manual transaction
journey on Kudzu 0.17.8. Native forms send integer minor units to the unchanged
Actual backend, then refetch transactions and backend-calculated account balance.
Addition, update, deletion and reload persistence pass without framework changes.

## Pinned source and reduction

Upstream remains `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`:

- `packages/desktop-client/src/components/transactions/TransactionList.tsx:67-87`
  sends a diff to `transactions-batch-update`. The upstream comments describe
  both optimistic updates and full refetch; this reduction uses explicit refetch.
- `packages/loot-core/src/server/transactions/app.ts:36-66` forwards added,
  updated and deleted records to the original transaction mutation pipeline.
- `packages/loot-core/src/server/api.ts:559-577` implements
  `api/transactions-get` with account filtering and grouped split semantics.
- Existing `account-properties` reads the authoritative account balance after
  the refreshed transaction response. No frontend balance arithmetic is used.

The UI accepts signed **integer cents**, a date and notes. `Number.isSafeInteger`
validates the amount before sending it; native required/type controls remain.
The test explicitly exercises a fractional-cent rejection. Creation uses a native
UUID, account ID, date, amount, notes, null payee/category and cleared=false.
Updates send only changed ID/amount/notes; deletions send the ID. The actual backend
owns database updates and balance effects. This packet does not reproduce the
full transaction editor, categorization or transfer/split workflows.

Responses drive a keyed transaction list. Budget replacement/closure, account
closure and standalone balance inspection clear stale selected-account and
transaction views through the existing command effect. Imported-budget failure
leaves no stale editable transactions. Existing Worker/file-read cleanup remains.

## Acceptance

Node 24.14.0; Playwright 1.61.1 / Chromium 149.0.7827.55; fresh isolated browser
context and COOP/COEP static server. The full previous account/import journey
runs around the new transaction steps.

1. Select the real account with a 1,000-cent starting balance: display `10.00`.
2. Submit `1.5` cents: explicit validation shows an error and balance stays `10.00`.
3. Add -125 cents: backend balance `8.75`.
4. Edit that transaction to -250 cents and changed notes: balance `7.50`, amount
   and notes refresh, and the exact keyed DOM row remains.
5. Add +105 cents: balance `8.55`.
6. Close/reload/reopen and refetch: same transaction ID, edited notes/amount and
   balance persist.
7. Delete the debit: balance `11.05`; delete the credit: balance `10.00`.
8. Close/reload/reopen again: only the original starting-balance transaction
   remains, the deleted ID stays absent and balance is `10.00`.
9. Continue original invalid-file recovery, real demo import/expected balances,
   file-transfer detachment, late-file cancellation and static zero-JS checks.
   Invalid import clears transaction rows and disables transaction creation.

The first browser attempt incorrectly expected native `validity.stepMismatch`
for a fractional value with an extreme safe-integer min bound. Chromium returned
false, but the app's explicit integer validation rejected the value. This harness
failure is retained; the assertion now checks the actual visible error and
unchanged balance. The completed journey and final stale-view assertions pass.
No compiler defect was reproduced.

## Accounting and limits

Semantic primitives +0; core passes/LOC +0; runtime concepts +0;
normalization/adapter rules +0. One archived application fixture is extended;
core/generator versions remain 0.17.8/0.1.169.

| JavaScript | Import fixture | Transaction fixture | Delta |
|---|---:|---:|---:|
| Generated raw | 35,786 B | 38,334 B | +2,548 B |
| Generated aggregate gzip | 13,480 B | 13,933 B | +453 B |
| Total raw including original public backend | 3,626,812 B | 3,629,360 B | +2,548 B |
| Total aggregate gzip | 797,120 B | 797,573 B | +453 B |

Public backend/WASM/data assets are byte-identical and distinct from Kudzu's
generated Worker graph. Per-file hashes and the assert-based accounting script
are retained. This is application behavior cost, not a speed comparison.
No whole-app migration, full editor, split/transfer/reconciliation, extreme-value
aggregate precision, multi-tab or cloud-sync claim is made.
`npm run check` and the project journey plus all 390 tests pass. Durable evidence
receipts are recorded in `PERFORMANCE.md`.

## Next bounded investigation

Completed in the [export/import round-trip](./actual-budget-export-roundtrip.md).

Follow the original local budget export path and prove export/import round-trip
of newly written data through the actual backend. Inspect binary reply ownership,
native download/Blob URL cleanup and warning/error reporting first. Preserve the
original archive validation rather than adding an archive runtime. Framework
changes still require a reproduced source or browser failure.
