import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.5 - Row Ownership Before Effects",
  description: "List-owned effects wait for row ownership initialization, preserving DOM refs when list loading is delayed.",
  url: "https://kudzujs.cloud/releases/0.17.5"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.5" title="Row ownership before effects">
    <h2>Existing refs are ready for setup</h2>
    <p>List-owned effect entries now depend on the existing list capability. Native ESM ordering initializes row state and ref paths before effect setup, including when the list module arrives late.</p>
    <h2>Browser-proven ownership</h2>
    <p>A compiled Chrome regression verifies delayed arrival, current row values, stable IDs and label associations, uncontrolled inputs, row state, cleanup and fresh cloned ownership. Ordinary effects and static siblings do not acquire list capabilities.</p>
    <h2>Measured correctness cost</h2>
    <p>C2 adds 50 raw JavaScript bytes and 7 level-9 gzip bytes. Project-app output is unchanged. All 48 hosted C2 journeys pass; initial-DOM medians are 318.0 and 319.3 ms with no gated operation regression. No speed improvement is claimed. Generator 0.1.166 targets core ^0.17.5.</p>
  </ReleaseNotes>
}
