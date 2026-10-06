import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.46 - Managed AI Check Cleanup",
  description: "The opt-in AI check tolerates slow process inspection while preserving exact descendant cleanup and sibling isolation.",
  url: "https://kudzujs.cloud/releases/0.16.46"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.46" title="Managed AI check cleanup">
    <h2>Keep check cleanup reliable</h2>
    <p>Under parallel load, a managed check could time out while inspecting its process tree. The opt-in developer tool now allows five seconds instead of one for that inspection. A delayed-process-table regression proves a timed-out check still terminates its descendants without stopping sibling work. Inspection errors still fail the check.</p>
    <h2>Keep generated apps lean</h2>
    <p>Generator 0.1.159 retains its existing core compatibility range and unchanged default project. Kudzu compiler behavior, browser output, and static-route zero-JavaScript guarantees are unchanged.</p>
    <h2>Keep AI results separate</h2>
    <p>No model-token saving or improved task success has been measured for this correction. The historical R8 scores, incomplete R22 confirmation, and blocked 1.0 AI gate remain unchanged.</p>
  </ReleaseNotes>
}
