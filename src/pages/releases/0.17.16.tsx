import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.16 - Abrupt Leader-Loss Evidence",
  description: "Pinned Actual renderer-crash evidence and a separate spreadsheet correction preserve uncertainty, visible errors and database readback.",
  url: "https://kudzujs.cloud/releases/0.17.16"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.16" title="Abrupt leader-loss evidence">
    <h2>Prove real renderer-crash handoff</h2>
    <p>The pinned Actual application uses its original heartbeat interval and real SQLite backend. Crashing the leader renderer promotes the surviving follower. Request and reply barriers distinguish undelivered writes from committed writes with lost replies.</p>
    <h2>Handle pending read errors</h2>
    <p>A separate upstream spreadsheet patch catches discarded promises, preserves replacement cache entries and reports one visible reload/readback warning. Three unit regressions and both corrected browser cases pass with no uncaught errors or automatic mutation replay.</p>
    <h2>Bounded migration evidence</h2>
    <p>The patch is retained as evidence, not installed into Kudzu or submitted upstream. No compiler, browser runtime or dependency changes. Generator 0.1.173 retains core ^0.17.12. Full browser-process crashes, power loss, whole-application migration and exactly-once writes remain unproven.</p>
  </ReleaseNotes>
}
