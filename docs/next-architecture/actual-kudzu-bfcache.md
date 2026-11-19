# Compiled Actual BFCache Continuation

## Completed packet (2026-11-17)

This follows the [unchanged upstream intake](./actual-bfcache-intake.md).
The existing external coordination fixture remains pinned to Actual
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a` with the disclosed coordinator
association/uncertainty patches. Registry-installed Kudzu 0.17.17 builds it.

The original TSX owns a port and backend/IDB workers through one mount effect.
Kudzu already retains that effect on persisted pagehide. The application does
not yet send the upstream `__resume-tab` protocol after BFCache return.
First exercise this source unchanged before adding application lifecycle code.

- Authorizing fixture: original native BFCache restore/rejoin/write evidence.
- Canonical reduction: native persisted `pageshow` plus the existing owned
  effect and port protocol; no compiler support expansion is pre-authorized.
- Existing consumers: EffectIR, native handlers, state bindings and keyed rows.
- Ownership: mounted budget owns its pageshow listener, port, backend and IDB
  children; conditional removal and non-persisted pagehide release ownership.
- Expected runtime concept/core-pass/core-LOC delta: zero.

## Browser acceptance

`test/actual-kudzu-bfcache.mjs` tests departing leaders and followers using a
different-origin away document and native Back. Three actual heartbeat rounds
elapse while away. No synthetic cache restoration, frozen clock, forced
eligibility or fabricated backend reply is used.

Native mode requires the same document token and real `pageshow.persisted` in
both cases. `CACHE=disabled` retains Playwright's default cache-disable argument
and separately requires fresh documents. Both paths must rejoin as followers,
own no dedicated backend while the survivor owns one, create exactly one real
account and retain its ID and 1,000-cent balance after reload. Conditional
removal/remount, final non-persisted pagehide cleanup and the HTML-only static
sibling remain required. Synthetic final pagehide tests disposal only.

```sh
COORDINATION_ROOT=/path/to/compiled/fixture \
ACTUAL_ROOT=/path/to/installed/pinned/actual \
node test/actual-kudzu-bfcache.mjs
```

Set `CACHE=disabled` for the fresh-document control and `RESULT_DIR` to preserve
independent runs. Native cache misses remain distinct failures of cache-coverage
acceptance even when the application successfully recovers through reload.
No cache-hit-rate, timing, OS-crash durability or whole-application claim is made.

## Reproduced boundary and application reduction

The unchanged fixture fails native cache-coverage acceptance for both roles:
Chrome evicts the cached document with `SharedWorkerMessage`. Both fresh-document
fallbacks still create/persist the correct account and release resources. The
receipt is retained rather than treating those reloads as cache restoration.

The [17-line application patch](./patches/actual-kudzu-bfcache.patch) adds two
native lifecycle listeners inside the existing mount effect. Persisted pagehide
marks the UI busy, resets its read handshake, stops the backend/IDB children and
posts `tab-closing` so the frozen port receives no ongoing heartbeat traffic.
Persisted pageshow posts `__resume-tab` with the effect's budget ID; the existing
connect/load/preferences/accounts/balance path checks saved data before enabling
writes. Cleanup removes both listeners and releases the original port.

The port and its effect remain owned across cache suspension; there is no
synthetic remount, runtime registry or coordinator change. Existing uncertainty
lockout is not cleared by cache restoration. In-flight writes during suspension,
conflicting writers and cross-browser cache eligibility remain outside this
packet's acceptance contract.

## Artifact accounting

The patched source builds with registry core 0.17.17. The same 77 deploy paths
remain; all 66 public assets (including the coordinator) and every generated
runtime file are byte-identical. Only the route effect entry and application
handler module change. Generated JavaScript grows from 31,661 / 12,673 raw/gzip
bytes to 32,082 / 12,778: **+421 raw / +105 aggregate gzip bytes**.

Semantic primitives, core passes/LOC, runtime concepts, normalization and adapter
rules: **+0**. Application TSX: **+17 lines**. One external browser probe extends
the existing fixture; the static sibling contains no script/modulepreload marker.
No performance benchmark delta is measured.

## Browser results

Chrome 152.0.7977.64, Node 24.14.0, Linux x64, fresh context per case:

| Departing role | Cache setting | Same cached document | Post-return mutation / saved balance |
|---|---|---|---|
| Leader | Native | Yes | 1 / 1,000 cents |
| Follower | Native | Yes | 1 / 1,000 cents |
| Leader | Disabled control | No, fresh document | 1 / 1,000 cents |
| Follower | Disabled control | No, fresh document | 1 / 1,000 cents |

All four cases pass with zero page/HTTP errors and the same persisted account ID
after reload. Restored documents retain one port and one pageshow listener,
rejoin the same budget as followers, and release every prior backend/IDB worker
and its application listener. The survivor owns exactly one backend. Conditional
removal and final non-persisted pagehide leave no owned port, worker or pageshow
listener; remount reads the same account. The static sibling fetches only HTML.

The failed baseline and both passing candidate receipts are retained in
`test-results/actual-kudzu-bfcache/`. This demonstrates native cache hits and
fresh-document recovery, not guaranteed cache eligibility. The subsequent
[pending-mutation intake](./actual-bfcache-pending.md) reproduces lost terminal
responses despite successful cached return and persisted writes. Correct that
boundary in a separate upstream candidate before extending this reduction's
settlement claim.

The patched fixture also passes all three existing renderer-crash regression
cases with one sent mutation, correct readback and zero errors. Repository
`npm run check` builds 268 pages; `npm test` passes all 404 tests without skips.
No compiler/runtime/package version or release changes are required.
