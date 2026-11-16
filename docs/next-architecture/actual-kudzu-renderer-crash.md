# Compiled Actual Renderer-Crash Continuation

## Completed packet (2026-11-16)

This follows the accepted upstream
[abrupt leader-loss packet](./actual-abrupt-leader-loss.md) and extends the
existing [compiled coordination fixture](./actual-kudzu-coordination.md).

- Authorizing input: pinned Actual
  `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a` and the verified
  `actual-kudzu-coordination.tar.gz` release asset from v0.17.14.
- Archive SHA256:
  `22e00d4c82586796903c3c308865330920809cfd7a4bae1b07dc1f01aa7ea2ba`.
- Missing evidence: the compiled fixture previously tested graceful tab closure,
  not renderer crashes or natural heartbeat eviction.
- Reduction: native CDP `Page.crash` in the existing three-case browser journey;
  unchanged application-owned ports, request IDs, state, effects and cleanup.
- Existing producers/consumers: ordinary state and ref ownership, EffectIR,
  native handlers, keyed account output and the patched upstream coordinator.
- Owner boundary: mounted budget owns its port, backend and IDB children;
  conditional removal and pagehide release surviving resources.
- Expected capability delta: zero. First test archived output, then freshly
  compile the same TSX with current core. No compiler change is authorized
  without an actual failing semantic fixture.

## Acceptance

`test/actual-kudzu-crash.mjs` retains completed, pre-delivery-held and
post-execution-reply-held account creation. Each requires a real follower without
a dedicated backend, one terminal response, no replay, visible uncertainty and
disabled writes when the outcome is unknown, then reload/readback with the
original account ID and exact 1,000-cent balance or absence as appropriate.

Crash acceptance additionally requires a real renderer crash, no leader lifecycle
or `tab-closing` notification, a heartbeat ping and natural follower promotion
using the archived coordinator's unmodified timing. Surviving-owner cleanup,
remount, pagehide and the HTML-only static sibling remain required.

```sh
COORDINATION_ROOT=/path/to/extracted/actual-kudzu-coordination \
ACTUAL_ROOT=/path/to/installed/pinned/actual \
CHROME_BIN=/usr/bin/google-chrome \
node test/actual-kudzu-crash.mjs
```

Use `LOSS=close` for the graceful control and `RESULT_DIR` to retain independent
runs. This is external application correctness evidence, not a default unit test
or a timing benchmark. Full browser-process/OS crash durability, conflicting
writers, BFCache restoration and exactly-once execution remain outside the claim.

## Output and retained experiments

A fresh registry install of `@kudzujs/core@0.17.16` builds the original TSX
without source changes. All 77 deploy files are byte-identical to the archived
0.17.14 output. Generated JavaScript remains 31,661 raw / 12,673 aggregate gzip
bytes. `test-results/actual-kudzu-crash/accounting.json` records every output
path, size and SHA256. The static sibling has no script/modulepreload markers.

The initial browser assertion counted the initial `about:blank` document's
`beforeunload` as an application lifecycle event. Its failed receipt is retained;
the corrected probe filters lifecycle observations by their originating URL.
The first standalone build attempt lacked the fixture's installed core package;
the fresh exact registry install resolves that prerequisite.

Semantic primitives, core passes/LOC, normalization/adapter rules and browser
runtime concepts added: **0**. Browser byte delta: **0**. One external browser
probe extends the existing fixture; performance benchmark deltas are unmeasured.

## Acceptance results

Chrome 152.0.7977.64, Node 24.14.0, Linux x64, fresh browser context per case:
all three archived-output crash cases and all six current-build crash/graceful
control cases pass with zero page/HTTP errors. Current-build receipts record
exactly one sent mutation and one terminal response in every case.

| Boundary | Crash promotion observation | Reload account count / cents |
|---|---:|---|
| Completed mutation | 18,042 ms | 1 / 1,000 |
| Request held before delivery | 18,515 ms | 0 / absent |
| Reply held after execution | 18,510 ms | 1 / 1,000 |

These are single correctness-run observations, not timing benchmarks or a
promotion deadline guarantee. Both persisted cases retain the original account
ID. Unknown outcomes lock writes, including Enter submission; reload/readback
clears the lock. Conditional removal and pagehide close all tracked ports,
terminate workers and remove application listeners. Remount restores the same
data, and the static sibling fetches only HTML.

`npm run check` passes (267 pages). `npm test` passes all 404 tests with no skips.
No framework, CLI, dependency, package version or release changes are needed.

The subsequent [pinned-upstream BFCache intake](./actual-bfcache-intake.md) proves
the native restore/rejoin/write path and retains a real cache-eviction fallback.
Next extend this reduction with that bounded lifecycle journey.
This packet does not authorize a
cache, retry scheduler, coordination runtime or broader crash-durability claim.
