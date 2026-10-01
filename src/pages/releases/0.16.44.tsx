import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.44 - Owned Ref Boundary And Browser Errors",
  description: "Fail-closed effect-owned ref diagnostics and accurate browser Error observations without changing supported browser output.",
  url: "https://kudzujs.cloud/releases/0.16.44"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.44" title="Owned ref boundary and browser errors">
    <h2>Reject a broken ref lifetime</h2>
    <p>A real Realtime attempt assigned callback refs inside an effect and invoked them from an intrinsic handler. Its build passed, but the browser could not connect because those refs were read-only. Kudzu now reports the authored source line and points to a state-driven effect with effect-local callbacks. The previously accepted WebSocket source retains eleven byte-identical deploy files and a JavaScript-free static sibling.</p>
    <h2>See caught browser failures</h2>
    <p>The optional repository browser smoke now reports caught Error objects logged to the console instead of marking that failed page as healthy. Plain string logs remain nonfatal. Chrome connection setup also waits for a complete DevTools port record; the exact cause of the older publication startup failure remains unproven.</p>
    <h2>Keep cost evidence honest</h2>
    <p>A Realtime diagnostic-only AI trial initially showed lower tokens at equal success, but its independent confirmation has four unknown timeout tails and a browser failure. No reliable model-token reduction or 1.0 acceptance is claimed. Generator 0.1.158 is unchanged.</p>
  </ReleaseNotes>
}
