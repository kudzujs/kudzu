# Separate Actual pending-settlement candidate

Pinned source: `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
See [the packet](../../docs/next-architecture/actual-bfcache-pending-candidate.md)
and its complete reproducible patch, including the disclosed earlier spreadsheet
read-rejection correction.

`unit-baseline.log` records two settlement timeouts and the passing completed
control before correction. `unit-candidate.log` records all three passing.
The initial build/typecheck logs retain a test-double typing error, subsequently
corrected; they are not application failures. `typecheck.log` and `build.log`
record the successful full-workspace typecheck and production build.

Browser receipts distinguish real backend port replies from the locally generated
uncertainty UI. Exact once-only promise rejection is covered by the unit test;
the browser must show one accessible uncertainty message, disable Create, send
one mutation and retain the original account ID/count/10.00 balance after reload.
No locally synthesized error is presented as a backend failure or proof that the
write did not execute. Original failing receipts remain in the sibling
`actual-bfcache-pending/` directory.

No release, upstream PR, cross-browser or performance claim is made here.

`initial-source.patch` matches all three initial browser receipts by SHA-256.
The two initial mutation cases pass; `initial-completed-unhandled.json` fails
because a detached count query rejects. `diagnostic/` and `diagnostic-stacks/`
preserve the request census and source-mappable stacks that identify
`PagedQuery.fetchCount()`. `paged-baseline.log` reproduces its unhandled rejection.
The final patch routes that rejection through the existing error callback.

`query-tests.log` passes 24 query/spreadsheet tests; `unit-final.log` passes three
connection tests. `typecheck-with-query.log` and `build-with-query.log` include
the count-query correction. `accounting.json` records the final deploy inventory;
`initial-accounting-with-typecheck-output.json` preserves an earlier inventory
containing concurrently emitted TypeScript declaration files. Final build ran
after typecheck and removes those files normally. The full JS delta includes a
newly generated English catalog and is not an isolated lifecycle cost measurement.

Final `pending-request.json`, `pending-reply.json` and `browser.json` all pass
with the final patch SHA-256: two pending-operation cases and three ordinary
controls, all real cached-document restorations with zero page/HTTP errors.
`repository-check-final.log` builds 268 pages and `repository-tests-final.log`
passes all 404 Kudzu tests without skips.
