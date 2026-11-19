# Pending mutation BFCache intake

Run the existing `test/actual-bfcache.mjs` with `HOLD=request` or `HOLD=reply`
against unchanged installed Actual revision
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`. Set `RESULT_DIR` to a new directory
to retain independent attempts. Ports 3157/3158 must be free.

The requested operation belongs to a follower. Its original request or real
backend reply is held at the leader until the follower navigates away and two
heartbeat rounds pass, then released unchanged. Both cases must eventually
persist exactly one account with the backend's ID and 10.00 balance.

Real BFCache restoration requires the original document and persisted pageshow.
The probe records terminal responses after another heartbeat on return and then
reloads to read back the actual database. It never automatically retries a write.
A lost response is retained as a nonzero acceptance result even when the database
contains the correct account. No upstream asset is patched.

See [the packet](../../docs/next-architecture/actual-bfcache-pending.md) for the
source ownership boundary and the distinction from crash-before-delivery tests.

`initial-unmatched-reply.json` is an excluded harness failure: absent IDs matched
an unrelated push. The corrected probe requires the real backend reply before
matching its ID. `pending-reply.json` retains the actual lost terminal response
despite same-document restoration and successful persisted readback.

The corrected `pending-request.json` reproduces that same lost response. Both
cases retain one sent mutation, zero terminal responses, a still-open creation
dialog and one persisted account with the backend's ID and 10.00 balance.
Both exit nonzero; database success must not be presented as settlement success.
