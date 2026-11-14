# Actual Coordination Through Kudzu Effects

## Result (2026-11-14)

The next gate after the [pending-request investigation](./actual-pending-request-handoff.md)
passes on registry-installed **Kudzu 0.17.14**. Ordinary TSX, existing state/ref
ownership, native SharedWorker ports and owned effects compile a bounded
two-tab budget journey against Actual's real backend. No compiler failure,
runtime change or new package release is needed.

Actual remains pinned to `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
Its coordinator explicitly includes both retained upstream corrections:
created-budget association and pending-request uncertainty. This is not an
unchanged-upstream result or a whole-Actual migration.

## Source reduction

The archived single-owner account fixture supplies the unchanged backend,
WASM, default database, migration assets and explicit IDB worker ownership.
Upstream `browser-preload/worker-bridge.ts` supplies the native port/leader
protocol: role messages, leader backend creation, request forwarding, budget
restore and heartbeat replies.

One application-owned mount effect retains only the required protocol. It owns
the SharedWorker port, its message listener, the leader's dedicated backend,
every spawned IDB worker and their listeners. A retained `useRef(null)` exposes
the port to the existing command dependency effect. All ownership is released
on conditional removal/pagehide. The original WorkerBridge class and its
uncancelled child-worker helper are not bundled.

The form uses native constraints and direct handlers. Requests use
`crypto.randomUUID()` IDs with operation suffixes, avoiding collisions between
tabs. On any reported operation error, the page conservatively locks writes and
asks for reload/readback. Reload restores the saved budget ID from localStorage,
reads real accounts and integer-cent balances, and only then enables writes.
No automatic mutation retry, queue, query cache or reconciliation runtime exists.

This intentionally bounded page creates budgets/accounts and reads balances;
the prior single-owner fixture's rename/delete/import/export UI is not included.
It does not claim to lower arbitrary WorkerBridge, RPC or query-library source.

## Browser acceptance

Normal headless Chrome 157.0.8103.78, Node 24.14.0, macOS arm64, fresh context per
case, local COOP/COEP server. Real backend messages and SQLite persistence are
used. The same deterministic request/reply barriers from the upstream packet
change only delivery timing.

| Follower operation | Terminal response | After leader closure and reload |
|---|---|---|
| Completed creation | One reply | Same account ID/name, 1,000 cents |
| Request held before backend delivery | One uncertainty error | No account |
| Real backend reply held after execution | One uncertainty error | Same returned account ID/name, 1,000 cents |

Each case requires a real FOLLOWER with no dedicated backend and exactly one
leader backend. The recorded request IDs are unique across both tabs.
Uncertain cases display the error and disable Create account; pressing Enter
does not send another mutation. Reload clears uncertainty only through fresh
application ownership and successful database readback.

Conditional removal closes every tracked port, terminates backend/IDB workers
and removes all application message listeners. Remount reads the same persisted
result. Pagehide also releases all tracked resources. The static sibling
requests only HTML and creates no ports or workers. All three cases pass with
no page errors or failed HTTP responses.

The first local-core build/browser run passes. A fresh exact registry install
also builds both routes and passes the complete journey, including the final
cross-tab ID assertion. The executable source, package lock, browser receipts,
public assets, output, licenses and accounting are archived for reproduction.

## Accounting

Kudzu semantic primitives/core passes/core LOC/runtime concepts/adapter rules:
**+0**. One external application fixture is added. The existing native
SharedWorker regression remains the repository's small framework-level control.
No framework dependency or runtime-family implementation changes.

| JavaScript | Raw bytes | Aggregate gzip bytes |
|---|---:|---:|
| Generated route capabilities/application handlers | 31,661 | 12,673 |
| Explicitly patched upstream coordinator | 11,187 | 3,455 |
| Total, including original public backend JS | 3,633,874 | 799,768 |

All 65 original public assets are byte-identical to the verified account archive;
the only added public asset is the explicitly patched coordinator. Its SHA256 is
`a33ef88680610bab688d7dbc7eec22bcf8ce75e9a9f35d3a74eed524e123994c`.
The static output contains no script/modulepreload markers and its browser
request census confirms HTML-only loading. These are absolute application costs,
not an equivalent-behavior speed/size comparison with the earlier CRUD fixture.
Compiler/browser-runtime source delta is zero; timing and benchmark deltas are
unmeasured. Publication and repository checks are recorded in `PERFORMANCE.md`.

## Next gate and limits

Before claiming crash recovery, reproduce abrupt leader loss and heartbeat
eviction in pinned upstream with its original protocol and retained patches.
Then reduce any proven behavior or failure into this fixture. Current evidence
uses graceful tab closure and explicit delivery barriers; it does not establish
process-crash durability, BFCache restoration, concurrent conflicting writes,
live query invalidation, automatic retries or exactly-once behavior.
