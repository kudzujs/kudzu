import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.7 - Accurate Style Artifact Reports",
  description: "Route and runtime-family reports match specialized style-helper emission without changing deploy output.",
  url: "https://kudzujs.cloud/releases/0.17.7"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.7" title="Accurate style artifact reports">
    <h2>Report only the style helper that is emitted</h2>
    <p>Style-free bindings no longer leave a missing kudzu-style.js requirement in route and runtime-family reports. Both reporting paths now use the same existing style facts as runtime specialization.</p>
    <h2>Preserve required dependencies</h2>
    <p>A compiled ten-route regression covers plain and styled bindings, plain and styled lists, shared standalone families, navigation families, base paths and static pages. Styled consumers retain their helper requirements.</p>
    <h2>Identical application output</h2>
    <p>All 13 artifact-baseline fixtures pass, and their complete deploy trees remain byte-identical to 0.17.6. Only incorrect report edges change. No browser runtime, semantic primitive or speed improvement is added. Generator 0.1.168 targets core ^0.17.7; startup, restoration and AI-cost/1.0 gates remain unresolved.</p>
  </ReleaseNotes>
}
