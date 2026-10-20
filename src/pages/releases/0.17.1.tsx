import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.1 - Smaller Binding Lifetime Tracking",
  description: "Less binding bookkeeping with preserved state release and DOM remount behavior.",
  url: "https://kudzujs.cloud/releases/0.17.1"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.1" title="Smaller binding lifetime tracking">
    <h2>One ownership record</h2>
    <p>Binding registration now tracks mounted membership in the existing WeakMap. Released bindings remain inactive until explicit DOM unmount and remount, with a regression test covering that lifetime.</p>
    <h2>Measured output savings</h2>
    <p>C2 ships 52 fewer raw JavaScript bytes, or 7 fewer gzip bytes. The project application deploy saves 114 raw bytes, while static help remains zero-JavaScript. All 42 comparison journeys pass; HTML and route plans are unchanged.</p>
    <h2>A focused patch release</h2>
    <p>Generator 0.1.162 targets core ^0.17.1. This change passes the predeclared size gate, not the separate speed gate. Restoration latency and AI-cost improvements remain unproven; no new API or runtime concept is introduced.</p>
  </ReleaseNotes>
}
