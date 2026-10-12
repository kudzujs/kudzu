import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.48 - Lean Binding Mounts",
  description: "Simpler property-binding setup reduces route JavaScript while preserving authored components, HTML and browser ownership.",
  url: "https://kudzujs.cloud/releases/0.16.48"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.48" title="Lean binding mounts">
    <h2>Read each property marker once</h2>
    <p>Binding setup uses a native attribute read and a loop instead of intermediate arrays and dataset-name conversion. Existing runtime-family selection, descriptor order and parsing stay intact.</p>
    <h2>Ship a little less JavaScript</h2>
    <p>C2 output loses 53 raw and 43 aggregate gzip bytes. The Project application loses 153 raw and 119 gzip bytes across three runtime families. Eight paired fixtures retain identical HTML, emitted paths and route plans.</p>
    <h2>Keep the performance evidence precise</h2>
    <p>Twenty-one fresh browser profiles per arm pass the original journey, identity, cleanup, accessibility and static-route checks. Row restore medians are 59.0 and 58.6 milliseconds, but paired results do not establish a speedup. This release reduces code and output; the measured restoration gap remains open.</p>
    <p>No semantic primitive, compiler pass, runtime concept or public API is added. Generator 0.1.160 remains unchanged. No AI-token saving or new React compatibility is claimed, and the independent 1.0 AI-delivery gate remains blocked.</p>
  </ReleaseNotes>
}
