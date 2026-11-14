# Actual Follower Account Mutation Handoff

## Result (2026-11-14)

The next gate from the [created-budget correction](./actual-created-budget-association.md)
passes in the original production application with the explicitly retained
coordinator candidate. A completed follower-originated account creation survives
graceful leader closure, follower promotion and reload. This is patched-upstream
evidence, not a Kudzu application migration or general multi-tab write guarantee.

## Reproduction

- Actual revision: `87e33e49eb4d666c33e0c0f172faf340d1b7aa0a`.
- Fresh checkout; `yarn install --immutable` and
  `yarn lage build:browser --to=@actual-app/web` pass. Tracked upstream stays clean.
- Node 24.14.0, macOS arm64, installed Chrome 157.0.8103.78, headless with its
  normal user agent and one fresh browser context. The upstream `playwright`
  user agent would bypass SharedWorker and is not used.
- The upstream static server supplies COOP/COEP. A loopback proxy substitutes
  only the retained `actual-coordinator-candidate.js` at the generated
  `/static/shared-browser-server-C7q_DhZs.js` URL. Requests are recorded.
  All other application and backend assets come from the new untouched build.
- The candidate archive's SHA256 matches the previous published receipt.
  `git apply --check` accepts its source patch at the pinned revision.
  The new manifest records build asset sizes/hashes and candidate SHA256.

The archived standalone probe expects a sibling `actual-handoff-upstream`
checkout with installed dependencies and browser build. Run
`node follower-handoff.mjs`; `CHROME_BIN` can select the local Chrome executable.
It uses local ports 3147/3148 and writes `follower-handoff.json`, including errors
and visible page text on failure.

## Browser acceptance

1. Create an empty budget in the leader and open it immediately in a second tab.
2. Require the second tab's FOLLOWER role and zero dedicated backend Workers;
   require exactly one backend Worker in the leader.
3. In the follower, use the original Add account form to create
   **Follower Checking**, starting balance **10.00**.
4. Require the follower's account title/balance and the leader's account link.
   The follower still has no dedicated backend Worker.
5. Close the leader with `runBeforeUnload: true`; require the follower's LEADER
   notification and one dedicated backend Worker, preserving the account display.
6. Reload the promoted tab. Require the same account URL/ID, name and **10.00**
   balance. Require no page errors and at least one candidate worker request.

The final run passes. Two initial harness failures are retained: an exact `Name`
label missed the authored `Name:` label, and the unscoped Add account button
matched both sidebar and empty-table actions. The final probe uses the upstream
non-exact label convention and scopes Add account to the empty table. Neither
failure reached account mutation; neither is classified as an application defect.

## Accounting and next gate

Kudzu semantic primitives, core passes/LOC, runtime concepts, adapter rules and
browser bytes: **+0**. One external browser probe is added; no framework fixture,
dependency, package version or timing comparison changes. No new npm release or
tag is warranted by this upstream-only evidence.

This proves an acknowledged creation before graceful shutdown. It does not prove
an in-flight write survives shutdown, crash/heartbeat recovery, concurrent writes,
cloud sync or whole-application migration. The next bounded investigation is the
pinned coordinator's pending-request ownership during leader loss: first inspect
request/reply and promotion paths, then retain a deterministic real account
mutation failure or explicitly bounded success before changing any framework
semantics. Do not infer retry/exactly-once guarantees from this completed-write run.

Evidence publication and repository checks are recorded in `PERFORMANCE.md`.
