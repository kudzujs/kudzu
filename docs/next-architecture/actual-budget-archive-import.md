# Actual Budget Archive Import Evidence

## Result (2026-11-02)

The connected local-account reduction now imports the original Actual demo
archive on released Kudzu 0.17.8, using native file input, existing owned effects
and native Worker transfer. The original backend performs ZIP validation,
database installation, migrations and spreadsheet calculation. No compiler or
runtime change was needed.

## Source boundary

Upstream remains `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`:

- `packages/desktop-client/e2e/onboarding.test.ts:94-106` imports
  `e2e/data/actual-demo-budget.zip` and expects Ally Savings **1,772.80** and
  Roth IRA **2,745.81**.
- `src/components/modals/manager/ImportActualModal.tsx:53-68` owns importing/error
  state around file selection and `importBudget` dispatch. Browser preload uses
  a native file input and reads binary data.
- `packages/loot-core/src/server/budgetfiles/app.ts:468-512` supports either a
  filesystem path or direct `buffer: ArrayBuffer` plus filename for `import-budget`.
- `src/server/importers/actual.ts:8-49` closes the current budget before validating
  and importing the archive, loads the resulting database and waits on the sheet.
  Therefore the reduced UI clears the old current account view when import starts;
  an invalid archive does not leave the old budget falsely displayed as open.

The form dispatches a serializable import command. Its existing dependency effect
reads the selected File, then sends the ArrayBuffer directly with a transfer list.
The buffer never becomes component state or JSON/base64. An invocation-local
active flag, invalidated by cleanup, prevents a late read from posting after owner
release. The ordinary owned worker handles replies, errors and account refresh.
An account-properties command displays the backend balance in decimal units.

This reduces the original workflow; it does not retain the Redux, modal, routing,
query or translation layers. Original public backend/WASM/data assets remain
byte-identical and are distinct from compiler-generated Worker graph entries.

## Acceptance

Node 24.14.0; upstream Playwright 1.61.1 / Chromium 149.0.7827.55; fresh context
and COOP/COEP static server. The original archive is copied unchanged.

- All prior budget/account create, mutation, error recovery, persistence and
  keyed-row identity checks still pass in the connected journey.
- An invalid ZIP yields the original `not-zip-file` error, clears the stale
  current-budget view and re-enables import.
- An explicitly injected rejected File read produces visible failure and permits
  retry. This is a browser I/O failure test, not a simulated database.
- The unchanged demo archive imports successfully; original expected account
  balances are verified numerically as `1772.80` and `2745.81`.
- Both posted buffers detach from the sender, proving native transfer rather
  than merely accepting a successful backend response.
- Close/reload/reopen retains the imported budget ID and both expected balances.
- A deliberately delayed File read completes after conditional owner removal.
  No import message is sent; all tracked Workers are terminated and listeners
  removed. Fresh remount works and pagehide releases the new owner.
- The independent static sibling requests only HTML and creates no Worker.

First build/browser acceptance passes; the extended final journey adds File
failure and transfer-detachment assertions and also passes. There is no compiler
failure to fix and no new release is warranted.

## Accounting and limits

Semantic primitives +0; core passes/LOC +0; runtime concepts +0;
normalization/adapter rules +0. One archived application fixture is extended.

| JS | Account reduction | Import reduction | Delta |
|---|---:|---:|---:|
| Generated raw | 34,759 B | 35,786 B | +1,027 B |
| Generated aggregate gzip | 13,221 B | 13,480 B | +259 B |
| Total raw including original backend | 3,625,785 B | 3,626,812 B | +1,027 B |
| Total aggregate gzip | 796,861 B | 797,120 B | +259 B |

The accounting script checks identical public assets and stores per-file hashes.
These are application feature costs, not a compiler benchmark. No speed, visual
parity, full budget table, arbitrary ZIP compatibility, multi-tab coordination,
cloud sync, localization or whole-application retention claim follows.
`npm run check` and the project journey plus all 390 tests pass. Archive receipts
are recorded in `PERFORMANCE.md`.

## Next bounded investigation

Inspect the original manual transaction add/edit path and backend mutation
validation before extending this same local database journey. Preserve native
forms, integer monetary units and backend-authoritative balances; prove exact
amounts and reload persistence before any compatibility claim. A source-located
or browser-reproduced failure is still required before framework changes. Stop
if the reduction requires a generic spreadsheet, database, query or router runtime.
