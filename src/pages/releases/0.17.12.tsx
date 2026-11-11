import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.12 - Native SharedWorker Effects",
  description: "Preserve native SharedWorker construction and feature detection in owned browser effects.",
  url: "https://kudzujs.cloud/releases/0.17.12"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.12" title="Native SharedWorker effects">
    <h2>Keep browser constructors in the browser</h2>
    <p>SharedWorker is now recognized as a native browser global. Inline effects can construct it and check availability without the compiler attempting to capture its value during build.</p>
    <h2>Existing port ownership</h2>
    <p>Ordinary effects own message listeners, port startup and cleanup. A real named SharedWorker regression verifies shared connections, leader handoff, conditional remount and unsupported-browser fallback. Public worker assets and coordination protocols remain application code.</p>
    <h2>Bounded compatibility</h2>
    <p>One global-list entry changes with no new runtime, pass or dependency. Relative TypeScript SharedWorker bundling and Vite sharedworker imports are outside this patch. The original Actual intake separately records a fresh-create coordination failure; whole-application multi-tab safety is not claimed. Generator 0.1.173 targets core ^0.17.12. No speed improvement is claimed.</p>
  </ReleaseNotes>
}
