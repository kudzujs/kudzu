import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.8 - Parent State in New Rows",
  description: "Delayed keyed rows retain reactive parent-only text and attributes through existing list ownership.",
  url: "https://kudzujs.cloud/releases/0.17.8"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.8" title="Parent state in new rows">
    <h2>New rows follow parent state</h2>
    <p>A delayed keyed row could keep its button disabled after the parent busy state cleared. Parent-only text and attributes now use the same keyed expression ownership as expressions combining parent state with item values.</p>
    <h2>Real local database evidence</h2>
    <p>An Actual Budget reduction using its real Worker and SQLite backend verifies budget creation, opening, missing-budget recovery, reload persistence and conditional owner cleanup. This is a bounded reduction, not a whole-application migration claim.</p>
    <h2>Bounded correctness cost</h2>
    <p>A compiled Chrome regression covers delayed insertion, same-key refresh, parent updates and fresh remount. Runtime sources are unchanged and all 13 existing artifact fixtures retain byte-identical deploy output. The corrected Actual reduction adds 1,355 raw and 441 aggregate gzip JavaScript bytes. No speed improvement is claimed; startup, restoration and AI-cost/1.0 gates remain unresolved. Generator 0.1.169 targets core ^0.17.8.</p>
  </ReleaseNotes>
}
