import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.13 - Native JSX Type Safety",
  description: "Correct native event target types and validate HTML boolean attributes without changing browser output.",
  url: "https://kudzujs.cloud/releases/0.17.13"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.13" title="Native JSX type safety">
    <h2>Distinguish event targets</h2>
    <p>The currentTarget type identifies the element with the handler. The target keeps its native event type because a child can originate the event. Use event.currentTarget.value for input handlers, or narrow the target before accessing element-specific properties.</p>
    <h2>Catch misleading boolean values</h2>
    <p>Known HTML boolean attributes, including disabled, checked, required and multiple, accept booleans or null rather than strings. This validation also applies to attribute spreads. ARIA/data values, SVG attributes and custom elements retain their existing flexibility.</p>
    <h2>Type-only correction</h2>
    <p>Strict TypeScript regressions cover valid controls and unsafe accesses. Unlisted attributes remain open for migration compatibility. No compiler pass, browser runtime, dependency or capability is added. Generator 0.1.173 retains its compatible core ^0.17.12 range; no performance improvement is claimed.</p>
  </ReleaseNotes>
}
