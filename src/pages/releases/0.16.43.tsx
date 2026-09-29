import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.43 - Publication Browser Gate Separation",
  description: "Forward release of the measured source-graph and opt-in AI check changes with Chrome verified in exact-commit CI.",
  url: "https://kudzujs.cloud/releases/0.16.43"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.43" title="Publication browser gate separation">
    <h2>Carry the measured changes forward</h2>
    <p>The 0.16.42 compiler and generated AI check changes are unchanged. Source-graph traversal fell from 893.3 to 484.1 ms median in seven alternating synthetic runs; whole-build and model-token savings are not established.</p>
    <h2>Separate browser proof from npm upload</h2>
    <p>Two npm publication attempts for 0.16.42 stopped at distinct browser-test errors before either package was published. This forward release keeps required-Chrome tests in exact-commit CI while the protected npm job reruns non-browser tests and package smoke. The original tag and failures remain visible.</p>
    <h2>Keep the AI gate honest</h2>
    <p>The first publish of the updated generator is create-kudzu 0.1.158. The latest complete R8 AI-delivery comparison remains Kudzu 23/25 versus React + Vite 24/25, so the 1.0 gate is still blocked.</p>
  </ReleaseNotes>
}
