import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.0 - Static Calculation Configuration and Lean Effects",
  description: "Static primitive calculation arguments and smaller route-specific effect output, with existing state and cleanup ownership.",
  url: "https://kudzujs.cloud/releases/0.17.0"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.0" title="Static calculation configuration and lean effects">
    <h2>Keep ordinary calculation arguments</h2>
    <p>Selected calculation effect dependencies now accept static strings, finite numbers except negative zero, booleans, null and normalized const aliases alongside at least two direct state inputs. Existing normalization and evaluators preserve selected-value comparison and cleanup without additional signals.</p>
    <h2>Emit only the effect machinery in use</h2>
    <p>Proven read-only effect families omit state-write scheduling. Ordinary owned effects omit unused keyed-row maps and registration paths. Measured reductions range from 253 to 990 raw JavaScript bytes across the affected fixtures; stateful and keyed controls retain identical output.</p>
    <h2>A compatibility minor release</h2>
    <p>Generator 0.1.161 targets core ^0.17.0. Object and array configuration remain unsupported. No semantic primitive or runtime concept is added, and no restoration-latency or AI-token improvement is claimed. The independent 1.0 AI-delivery gate remains blocked.</p>
  </ReleaseNotes>
}
