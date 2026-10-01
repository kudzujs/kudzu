import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.45 - Named Component Ref Diagnostics",
  description: "Unsupported non-null refs in named components now fail at authored source without changing accepted browser output.",
  url: "https://kudzujs.cloud/releases/0.16.45"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.45" title="Named component ref diagnostics">
    <h2>Point to the authored ref</h2>
    <p>Four archived Realtime first builds used non-null refs in named Feed components and received only a generic DOM-ref error. Kudzu now diagnoses an unsupported unattached ref at its source line, after proven effect-private refs have normalized.</p>
    <h2>Keep established boundaries</h2>
    <p>JSX-attached keyed-row and setter-child refs retain their more-specific diagnostics. The supported R8 WebSocket route still passes browser acceptance and emits eleven byte-identical files, including a JavaScript-free static sibling.</p>
    <h2>Account for cost honestly</h2>
    <p>This diagnostic correction has not been measured for model-token savings. The R22 independent cost confirmation retains four unknown timeout tails; the R8 success/cost gate and 1.0 remain blocked. Generator 0.1.158 is unchanged.</p>
  </ReleaseNotes>
}
