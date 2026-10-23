import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.2 - Reliable Pending Evaluators and Keyed Conditions",
  description: "Preserved ownership across delayed modules, DOM remount and source-state release, plus reliable keyed conditions.",
  url: "https://kudzujs.cloud/releases/0.17.2"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.2" title="Reliable pending evaluators and keyed conditions">
    <h2>Late work keeps its original lifetime</h2>
    <p>Delayed attribute, text and conditional evaluators cannot regain authority after DOM or source-state release. Explicit remount creates fresh ownership, pending commits wait for module loading, and current state initializes the new binding. Fifteen native Chrome cases cover these boundaries.</p>
    <h2>Keyed details settle correctly</h2>
    <p>Changing row data and parent selection in one turn now renders the expected conditional detail. Selection-only updates preserve existing detail DOM. A compiled TSX browser journey checks show, hide and re-entry alongside a zero-JavaScript static sibling.</p>
    <h2>Measured correctness tradeoffs</h2>
    <p>Against 0.17.1, C2 raw JavaScript drops 108 bytes while local gzip grows 19 bytes. The project application deploy grows 10 raw bytes and 100 local gzip bytes. No speed improvement is claimed. Generator 0.1.163 targets core ^0.17.2; public APIs and supported source syntax are unchanged.</p>
  </ReleaseNotes>
}
