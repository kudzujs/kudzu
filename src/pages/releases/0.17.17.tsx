import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.17 - Crash Recovery and BFCache Evidence",
  description: "Compiled renderer-crash recovery and bounded upstream BFCache restoration evidence, including cache eviction and persisted account readback.",
  url: "https://kudzujs.cloud/releases/0.17.17"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.17" title="Crash recovery and BFCache evidence">
    <h2>Compiled renderer-crash recovery</h2>
    <p>Completed and uncertain follower writes survive the proven renderer-crash journey through existing state, effects and native ports. Natural heartbeat promotion, no replay, database readback, surviving-owner cleanup and static exclusion pass. All 77 fixture deploy files remain byte-identical.</p>
    <h2>Native BFCache restoration</h2>
    <p>Unchanged pinned Actual restores leader and follower documents, rejoins the budget and persists post-return account creation. Other leader runs are evicted and use fresh-document fallback. Those failed cache-acceptance receipts are retained; cache restoration is not guaranteed.</p>
    <h2>Bounded evidence release</h2>
    <p>No compiler, CLI, browser runtime or dependency changes. Generator 0.1.173 retains core ^0.17.12. Compiled BFCache behavior remains the next gate. No whole-application migration, OS-crash durability, exactly-once behavior or performance improvement is claimed.</p>
  </ReleaseNotes>
}
