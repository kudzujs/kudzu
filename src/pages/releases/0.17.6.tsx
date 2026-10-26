import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.6 - Reliable Events After Row Updates",
  description: "Item-capturing row handlers preserve state and ref ownership after repeated same-key updates.",
  url: "https://kudzujs.cloud/releases/0.17.6"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.6" title="Reliable events after row updates">
    <h2>Handlers keep their row ownership</h2>
    <p>Repeated same-key item updates no longer restore unresolved state and ref IDs in native row handlers. Event templates resolve through the existing row path before receiving current item captures.</p>
    <h2>Delayed, repeated and cloned behavior</h2>
    <p>The compiled Chrome regression verifies delayed list loading, repeated item updates, row state and ref writes, stable IDs and uncontrolled input, removal cleanup and fresh cloned handlers. Existing nested ownership and effect initialization ordering are preserved.</p>
    <h2>Measured correctness cost</h2>
    <p>Project-app output adds 94 raw bytes and 37 local aggregate gzip bytes. C2 raw JavaScript is unchanged, with one additional level-9 gzip byte. All 48 hosted C2 journeys pass with no gated operation regression. No speed improvement is claimed; initial-ID traversal and independent 1.0 gates remain unresolved. Generator 0.1.167 targets core ^0.17.6.</p>
  </ReleaseNotes>
}
