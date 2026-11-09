import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.9 - Event and Build Correctness",
  description: "Native event propagation, fresh repeated builds and reliable public asset watching.",
  url: "https://kudzujs.cloud/releases/0.17.9"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.9" title="Event and build correctness">
    <h2>Native event behavior</h2>
    <p>Optimized commands preserve bubbling, handler order and propagation cancellation. Existing conditional and keyed ownership attaches and removes element listeners without a new runtime concept.</p>
    <h2>Fresh builds and reliable assets</h2>
    <p>Repeated builds refresh transitive modules without changing relative import.meta.url resolution. Static route parameters retain the value index, and effect dependency types accept supported arrays. Public asset watches survive rapid directory replacement; directories overlapping output or scratch are rejected before copying.</p>
    <h2>Regression evidence</h2>
    <p>Chrome regressions cover event propagation and owner cleanup. Build and development regressions cover cache freshness, route parameters, array dependencies and public asset lifecycle. Static siblings retain zero JavaScript. Artifact deltas are recorded in PERFORMANCE.md; timing improvements are not claimed. Generator 0.1.170 targets core ^0.17.9.</p>
  </ReleaseNotes>
}
