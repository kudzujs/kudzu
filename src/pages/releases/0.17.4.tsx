import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.4 - Current Rows After Delayed Runtime Loading",
  description: "Array updates made before the list runtime arrives reach retained row text and attributes on mounting.",
  url: "https://kudzujs.cloud/releases/0.17.4"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.4" title="Current rows after delayed runtime loading">
    <h2>Early updates reach the screen</h2>
    <p>When native handlers update an array before the list capability loads, initial mounting now updates row text and attributes even when keys have not changed. A compiled TSX Chrome journey verifies this with real buttons, retained row DOM and a user-entered uncontrolled input.</p>
    <h2>Reuse the existing row update path</h2>
    <p>The incorrect initial shortcut is removed. Existing pending evaluator and calculated-list ownership checks still pass, and static siblings remain JavaScript-free. No public API, source syntax or browser runtime concept is added.</p>
    <h2>Smaller output, explicit startup tradeoff</h2>
    <p>C2 saves 264 raw JavaScript bytes and 87 local gzip bytes. The project application deploy saves 528 raw bytes and 166 local gzip bytes. Initial mounting now performs necessary row writes; no speed improvement is claimed. Generator 0.1.165 targets core ^0.17.4.</p>
  </ReleaseNotes>
}
