# Actual BFCache Suspend/Resume Intake

## Completed intake with mixed cache eligibility (2026-11-16)

This follows the completed
[compiled renderer-crash continuation](./actual-kudzu-renderer-crash.md).
The authorizing input is unchanged Actual revision
`87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`, its installed original production
build and native SharedWorker coordinator.

The first gate is actual browser eligibility and restoration, before changing
Kudzu semantics or the compiled reduction. `test/actual-bfcache.mjs` compares a
plain HTML control, a departing leader and a departing follower. It uses native
document navigation and Back, not synthetic `pageshow` or CDP lifecycle events.

Playwright's default `--disable-back-forward-cache` is removed. No browser feature
is forced on and no upstream asset is substituted. The original new-budget
association limitation is handled by reopening the budget before joining, as in
the original SharedWorker intake.

## Source and acceptance boundaries

- `browser-preload/start.ts:79` posts `tab-closing` from `beforeunload`.
- `browser-preload/worker-bridge.ts:49` tracks visibility and sends
  `__resume-tab` on return to visible.
- The coordinator's existing `resumePort()` restores membership and role;
  its original 10-second heartbeat interval remains unchanged.
- Instrumentation observes `pagehide`/`pageshow`, document identity, roles,
  native worker counts, heartbeat rounds and native not-restored diagnostics.
  It adds no unload listener or synthetic lifecycle dispatch.
- Both application cases leave for two observed heartbeat rounds, return to
  All Accounts, check the real zero balance and one leader/one follower, and
  require no page/HTTP errors.
- After return, create a real 10.00 account and reload. Require exactly one
  matching account, the same account URL/ID and the persisted balance. A cached
  follower must also issue `__resume-tab` with its budget ID.
- BFCache success requires the same document token and `pageshow.persisted`.
  A successful fresh document reload does not satisfy that assertion.

```sh
ACTUAL_ROOT=/absolute/path/to/unchanged/installed/actual \
CHROME_BIN=/usr/bin/google-chrome \
node test/actual-bfcache.mjs
```

Local ports 3157 and 3158 must be available. `RESULT_DIR` selects a separate
receipt directory. The script checks the pinned revision and unchanged relevant
source. This is an external intake probe, not a default Kudzu unit test.

## Retained harness correction

The initial same-origin away page was intercepted by Actual's service worker,
which served the application shell and entered `/budget`. Its receipt is retained
as `initial-same-origin-away.json`; it is not valid BFCache application evidence.
The corrected probe leaves for a dedicated ephemeral-port origin and verifies
the away heading and absence of a coordinator role. Lifecycle logging uses
passive console events instead of a Playwright binding that can execute callback
completion against a cached document. The initial plain HTML control did restore
its original document with `pageshow.persisted = true`.

## Eligibility observations

The corrected eligibility-only run passes the control and follower cases.
The follower retains its document token, observes `pageshow.persisted = true`,
posts `__resume-tab` with the saved budget ID and remains a follower without a
dedicated backend. The surviving leader retains exactly one backend.

In that eligibility-only run, the departing leader is not restored from BFCache. Chrome reports
`IgnoreEventAndEvict`; the navigation API reports a masked reason. Back creates a
fresh document which rejoins as follower and reads the correct zero balance.
This is fallback recovery, not BFCache success. The run deliberately exits
nonzero and retains the failed leader assertion. The reason does not yet identify
an upstream source defect or a Kudzu compiler limitation.

All 44 original coordinator unit tests pass, including the existing orphaned
leader/follower `__resume-tab` cases. Those simulated protocol tests do not prove
browser cache eligibility. `production-js.json` pins all 33 original production
JavaScript files; no candidate coordinator or spreadsheet correction is loaded.

The subsequent full write/readback run restores both departing roles from BFCache.
Both retain their document token, emit persisted pageshow, send budget-specific
`__resume-tab` and rejoin as followers with no dedicated backend while the
survivor owns one. Each returned page creates one `BFCache Checking` account and
retains the same account ID/URL and 10.00 balance after reload. Page/HTTP errors
are zero. The full three-case run passes; the earlier cache-eviction failure
remains part of the evidence rather than being overwritten or counted as a pass.

This proves the native restoration path can execute, not that Chrome must cache
every eligible document. It does not prove in-flight mutation settlement during
freezing, freshness of a cached view after another tab edits it, or cleanup of
every upstream IDB child worker. Those require their own acceptance evidence.

A second full write/readback run again restores the control and follower but
evicts the leader with `IgnoreEventAndEvict`. Both returned application pages
still create and persist the correct single account without errors. This repeat
runs alongside repository tests and is not a timing or cache-hit-rate sample.
`repeat.json` retains the nonzero strict cache-acceptance result. Across the two
full runs, leader restoration is observed once and fresh-document fallback once;
follower restoration and post-return mutation/readback pass in both.

Repository validation passes: `npm run check` builds 267 pages and `npm test`
passes all 404 tests without skips. The external strict BFCache failures remain
separate from that passing framework suite; no package version or release changes.

The subsequent [compiled continuation](./actual-kudzu-bfcache.md) now passes the
same bounded navigation/Back and post-return mutation journey for cache hits and
fresh-document controls through a 17-line application-effect patch. Its next gate
is original-upstream pending-mutation suspension intake.

Semantic primitives, core passes/LOC, runtime concepts, adapters and browser
capability byte deltas: **0**. One external probe is added. No compiler or
application implementation change is authorized before a real failing boundary
is identified. Performance and cross-browser results remain unmeasured.
