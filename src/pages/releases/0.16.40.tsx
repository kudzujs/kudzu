import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.40 - Same-Origin Navigation Requests",
  description: "Require same-origin enhanced-navigation requests and verify the navigation guard's behavior and output.",
  url: "https://kudzujs.cloud/releases/0.16.40"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.40" title="Same-origin navigation requests">
    <h2>Validate before fetching</h2>
    <p>Enhanced-navigation document requests now explicitly require the current origin before fetch. Foreign hosts, protocols and ports are rejected without issuing a request.</p>
    <h2>Preserve ordinary navigation</h2>
    <p>Same-origin requests retain their abort signal, HTML accept header and manual redirect handling. Existing native anchor eligibility, response validation, layout ownership and fallback behavior remain intact.</p>
    <h2>Measure the output change</h2>
    <p>The guard adds 88 raw bytes to the Project application's shared navigation output. Its exact fixture sizes and deployment hash are updated after verification; existing gzip tolerances remain unchanged, and the static Help page remains JavaScript-free.</p>
    <p>This release merges PR #5 and its CI baseline correction. It strengthens a browser request boundary without adding a router or a migration capability. create-kudzu 0.1.157 remains compatible.</p>
  </ReleaseNotes>
}
