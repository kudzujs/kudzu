import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.47 - Scoped AI Cleanup And Browser Verification",
  description: "AI checks inspect only their Linux process subtree, and browser verification reports disconnected commands instead of waiting indefinitely.",
  url: "https://kudzujs.cloud/releases/0.16.47"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.47" title="Scoped AI cleanup and browser verification">
    <h2>Inspect only the check's own processes</h2>
    <p>On Linux, the opt-in AI check reads its own process subtree instead of scanning the entire host. Timeout and interruption cleanup includes worker-thread children, preserves sibling work, and reports inspection errors. Other Unix hosts retain bounded process-table inspection.</p>
    <h2>Finish browser checks reliably</h2>
    <p>Repository browser tools now reject commands when their connection closes. The keyed benchmark shares that transport, waits for its browser process to exit, and prints measurements before reporting a budget failure. Explicit non-browser test runs no longer launch the article-search browser checks.</p>
    <h2>Preserve application output and evidence</h2>
    <p>Generator 0.1.160 retains its existing core compatibility range and default project. Compiler behavior and application browser output are unchanged. The required-Chrome suite and package checks pass; earlier failures and the unsuccessful performance experiment remain recorded.</p>
    <p>This release does not establish faster application interactions, broader React compatibility, or lower AI-token costs. The separate AI-delivery gate for 1.0 remains blocked.</p>
  </ReleaseNotes>
}
