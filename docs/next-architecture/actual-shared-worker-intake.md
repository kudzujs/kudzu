# Actual SharedWorker Intake and Native Constructor Fix

## Original evidence

Pinned Actual revision: `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
The complete workspace remains clean after this investigation. The unchanged
`packages/loot-core/src/platform/client/browser-server/coordinator.test.ts`
passes all 44 tests with the original Vitest configuration:

```sh
cd packages/loot-core
node ../../.yarn/releases/yarn-4.17.1.cjs vitest run src/platform/client/browser-server/coordinator.test.ts
```

The production bootstrap uses Vite's `?sharedworker` entry, a named
`actual-backend` worker and a native MessagePort. `browser-preload/start.ts`
passes initialization and tab-closing messages; WorkerBridge starts the port
after installing its listener, routes follower messages and owns the dedicated
backend only in leader tabs. Platform fallback and OIDC direct-worker bypass
remain application policy.

The standard upstream Playwright configuration sets userAgent to `playwright`,
which deliberately bypasses SharedWorker. A separate original-production-app
probe uses normal Chromium userAgent and two pages in one fresh browser context.
It creates an empty budget, reloads the first page to reopen it, then proves:

- second tab receives FOLLOWER for the same budget;
- first page owns one browser-server Worker, follower owns none;
- closing the leader promotes the follower and creates its backend Worker;
- balance remains 0.00 and the reopened budget survives another reload.

No original source is patched. Browser: bundled Chromium 149.0.7827.55,
Playwright 1.61.1, Node 24.14.0, original production server with COOP/COEP.
The probe and JSON receipts are retained with the release evidence.

## Preserved upstream failure

The first attempt joined immediately after budget creation without reloading.
The creator remained LEADER of `__lobby`; the joining tab became LEADER of the
new budget, rather than FOLLOWER. The expected follower assertion failed. Both
pages displayed All Accounts, but UI success is not proof of single DB ownership.
The passing reopened-budget journey is a different scenario, not a replacement
for that failure. Creation-to-group reassociation remains an upstream investigation
gate; this packet makes no safe whole-Actual multi-tab migration claim.

## Reproduced framework failure and smallest fix

`test/fixtures/shared-worker` reduces native feature detection, named construction,
port messaging and cleanup into an ordinary inline effect. Before the fix, build
fails at the effect source location with `SharedWorker is not defined`: capture
analysis mistakes the browser constructor for a value to read during rendering.

Adding `SharedWorker` to the existing binding index's known globals preserves
native JavaScript in effect ESM. Existing lexical binding resolution, effects,
conditional ownership and cleanup do the rest. No worker adapter, coordinator,
runtime primitive, dependency or public API is added. The worker is an
application-owned public JavaScript asset. Relative TypeScript SharedWorker graph
bundling and Vite `?sharedworker` syntax are not added by this change.

The compiled browser regression uses two same-origin iframe documents and a real
named SharedWorker. It proves leader/follower assignment, cleanup promotion,
fresh remount, surviving-port independence, last release/rejoin and explicit
unsupported-browser fallback. The first virtual-time harness attempt timed out
before the real worker responded; the existing real-time CDP helper now runs the
same assertions. The original app probe separately uses actual tabs and backend.

## Accounting

- Semantic primitives +0; core passes +0; net core LOC +0 (one line changed).
- Runtime concepts/source/browser-runtime byte delta +0.
- Fixture: 7 JavaScript files, 11,238 raw / 5,376 aggregate gzip B, including the
  application-owned coordinator's 438 raw / 256 gzip B. This is new fixture cost,
  not a matched baseline delta. Its static sibling includes no scripts.
- `npm run check` and all 402 tests pass without skips before release versioning.
- Cross-framework, timing, database mutation during handoff, crash/heartbeat
  recovery and fresh-create safe ownership are not established here.

Next intake: explain the original create-budget lobby reassociation failure before
extending the connected Actual database reduction to multi-tab writes.

## Release validation

Core 0.17.12 / generator 0.1.173 final check builds 263 pages; all 402 tests pass
without skips and both package smokes pass. The first versioned run retained two
failures: a public-asset dev-watch polling timeout and the documentation's missing
explicit no-speed-claim sentence. The sentence is restored; the final full run
passes without changing watcher code or relaxing its timeout.
