# Actual Budget Export/Import Round-Trip

## Result (2026-11-02)

The connected local database reduction now exports newly written data through
Actual's original backend and restores it into an empty, independent browser
storage context. Original account name, edited transaction identity/content,
transaction count and backend balance survive import and subsequent reload.
Released Kudzu 0.17.8 already compiles the complete journey; no framework change.

## Source and ownership

Pinned Actual source remains `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`:

- `packages/desktop-client/src/components/settings/Export.tsx:23-45` calls
  `export-budget`, handles an error, retains warnings and saves returned data.
- `packages/loot-core/src/server/budgetfiles/app.ts:515-526` calls the real
  `cloudStorage.exportBuffer()` and returns data/warnings or `internal-error`.
- The previous native import path feeds the downloaded bytes back to the original
  `import-budget` handler, preserving archive validation and database migrations.

The reduction adds one ordinary export command. The existing mount-effect reply
listener creates a ZIP Blob from the returned binary data and publishes only its
URL string into state. A native download anchor saves the file. The effect owns
one URL, revokes it before replacement and on owner cleanup, and never stores
binary data in state. Missing data yields a visible error and no download link;
warning codes are preserved in a dedicated visible paragraph. Starting another
export clears prior displayed warnings/error/link; the owned URL remains bounded
to one until a replacement response or cleanup.

## Browser acceptance

Node 24.14.0; upstream Playwright 1.61.1 / Chromium 149.0.7827.55. The same
COOP/COEP static server serves the source and independent restore contexts.

1. Run the previous real account/transaction journey through persisted edited
   debit -250 cents, credit +105 cents and original +1,000-cent opening balance.
2. Inject an export error reply and verify visible failure, enabled retry and no
   download link. Inject missing data plus an original warning code and verify
   both warning preservation and missing-archive feedback. These two probes are
   **synthetic negative responses**, not claims of observed backend export failure
   or a real oversized archive.
3. Run a real `export-budget`; verify error/warnings clear and download the actual
   `budget-backup.zip` through the native anchor without a download failure.
4. Open a new browser context; prove its budget list is empty before importing
   that downloaded file. Verify `Persisted checking`, the original edited debit
   ID, notes `Edited debit`, amount -250, three transactions and balance `8.55`.
5. Close/reload/reopen in the restore context; the restored budget ID, edited
   transaction amount and balance persist.
6. Export again in the source context. The old URL is revoked and exactly one
   remains. Conditional removal revokes it and releases all tracked Workers and
   listeners; remount/reopen preserves the source data.
7. Finish the original delete/reload and demo-import acceptance. Create another
   real export URL and dispatch pagehide; the URL count returns to zero.
8. The existing late-file cancellation and independent zero-JS static sibling
   checks still pass. No browser exception or failed ordinary request occurs.

The first build and complete browser journey pass. The actual downloaded ZIP is
preserved with SHA256
`50c031aec9d85e33b173c4370a22540730699860cccc74983e29402c693dad76`.
It contains only the test-created synthetic budget data; its hash identifies this
run, not a deterministic export contract (IDs and timestamps may vary).

## Accounting and limits

Semantic primitives +0; core passes/LOC +0; runtime concepts +0;
normalization/adapter rules +0. One archived application fixture is extended.
Core/generator remain 0.17.8/0.1.169.

| JS | Transaction fixture | Export fixture | Delta |
|---|---:|---:|---:|
| Generated raw | 38,334 B | 39,257 B | +923 B |
| Generated aggregate gzip | 13,933 B | 14,206 B | +273 B |
| Total raw including original public backend | 3,629,360 B | 3,630,283 B | +923 B |
| Total aggregate gzip | 797,573 B | 797,846 B | +273 B |

Original backend/WASM/data assets are byte-identical. The export artifact is test
evidence, not a deploy asset. These costs describe added application behavior,
not a compiler performance comparison. No encryption, arbitrary archive size,
visual parity, multi-tab coordination or whole-app migration is established.
`npm run check` and the project journey plus all 390 tests pass. Evidence archive
receipts are recorded in `PERFORMANCE.md`.

## Next bounded investigation

The single-owner local database path is now connected through create, mutation,
import, export, isolated restore and cleanup. Inspect the original SharedWorker
coordinator and its unchanged upstream tests before choosing any multi-tab
reduction. First establish leader/follower and shutdown acceptance on the pinned
upstream app. Do not treat two independent direct Workers as proof of safe shared
database ownership, and do not introduce a generic coordinator runtime merely to
extend this fixture. Record a blocker if original behavior cannot be reproduced.
