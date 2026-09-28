import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.41 - Realtime Ownership Diagnostics",
  description: "Source-located ref diagnostics now explain the existing effect-local resource ownership alternative without browser output changes.",
  url: "https://kudzujs.cloud/releases/0.16.41"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.41" title="Realtime ownership diagnostics">
    <h2>Keep resource values in their effect</h2>
    <p>When a ref is mutated during rendering or lacks the required effect-private cleanup, Kudzu now points to an existing alternative: keep invocation-private values in effect-local variables and return the resource cleanup. State still owns values that must persist across effect replacements.</p>
    <h2>Preserve the compiled behavior</h2>
    <p>The supported ref forms and source-located rejection boundaries do not change. The WebSocket fixture emits eleven byte-identical files against the previous release, including a static sibling with no JavaScript. No runtime or resource API is added.</p>
    <h2>Keep release claims current</h2>
    <p>The packed README now matches the package version. R21's tested AX diagnostic was rejected, and the R8 authoring gap is not claimed as recovered token cost. The 1.0 AI-delivery gate remains blocked.</p>
  </ReleaseNotes>
}
