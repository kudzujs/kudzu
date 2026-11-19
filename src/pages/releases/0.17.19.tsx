import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.19 - Dev config recovery and link handling",
  description: "Fix startup configuration without restarting the dev server, and keep route prefetch working when a page contains malformed links.",
  url: "https://kudzujs.cloud/releases/0.17.19"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.19" title="Dev config recovery and link handling">
    <h2>Fix configuration without restarting</h2>
    <p>If the dev server starts with invalid configuration, it now displays the error and watches for edits. Correct the config and save to serve the site at the configured path.</p>
    <h2>Keep valid links working</h2>
    <p>Enhanced navigation uses the browser’s parsed anchor properties. A malformed link is skipped without interrupting prefetch or navigation for other links.</p>
  </ReleaseNotes>
}
