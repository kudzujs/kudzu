import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.10 - Safe Custom Hook Aliases",
  description: "Rename custom hook state, setter and callback results without changing their ownership or capturing local bindings.",
  url: "https://kudzujs.cloud/releases/0.17.10"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.10" title="Safe custom hook aliases">
    <h2>Keep hook internals unchanged</h2>
    <p>Supported zero-argument relative hooks now allow identifier aliases such as data: payees for state, setters and directly bound callbacks. Multiple calls retain independent state. State/setter pairs still need to be selected together.</p>
    <h2>Preserve local names</h2>
    <p>Compiler substitution avoids capturing callback-local variables, nested parameters, destructuring and loop/catch bindings. Object keys and assignment defaults preserve their authored meaning.</p>
    <h2>Existing capabilities, broader source support</h2>
    <p>The change reuses existing signals, binding analysis and handler specialization without adding a browser runtime. Chrome covers state isolation and name collisions; static siblings retain zero JavaScript. Context/private-timer aliases, defaults, rest, computed keys and parameterized query hooks remain unsupported. Generator 0.1.171 targets core ^0.17.10. Artifact comparisons are in PERFORMANCE.md; no speed improvement is claimed.</p>
  </ReleaseNotes>
}
