import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.3 - Reliable Calculated List Mounting",
  description: "Calculated lists release pending row state and render current source values when their evaluator loads.",
  url: "https://kudzujs.cloud/releases/0.17.3"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.3" title="Reliable calculated list mounting">
    <h2>Pending lists release row state</h2>
    <p>Calculated lists now register before their evaluator module loads. Unmount can immediately release row-owned state, and explicit same-node remount starts with fresh counters.</p>
    <h2>Initial evaluation uses current data</h2>
    <p>Matching row keys no longer cause calculated lists to skip their first content update. Data changed during module loading appears when evaluation completes. A compiled TSX Chrome regression verifies release, remount, latest text and final cleanup; its static sibling remains JavaScript-free.</p>
    <h2>Measured correctness cost</h2>
    <p>C2 adds 48 raw JavaScript bytes and 10 local gzip bytes. The project application deploy adds 96 raw bytes and 15 local gzip bytes. No speed improvement is claimed. Generator 0.1.164 targets core ^0.17.3; public APIs and supported source syntax are unchanged.</p>
  </ReleaseNotes>
}
