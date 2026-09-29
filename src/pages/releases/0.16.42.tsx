import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.16.42 - Source Graph And AI Check Output",
  description: "Measured source-graph indexing reduction and bounded AI check results without changes to browser output or AI gate scores.",
  url: "https://kudzujs.cloud/releases/0.16.42"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.16.42" title="Source graph and AI check output">
    <h2>Skip unused graph indexing</h2>
    <p>Ordinary source modules create a lexical binding index during graph traversal only when a dynamic import needs ownership proof. In seven alternating runs on 50 routes and 450 imported modules, graph traversal median fell from 893.3 to 484.1 ms. Compiled output is byte-identical; whole-build timing is inconclusive.</p>
    <h2>Keep checks concise and useful</h2>
    <p>The opt-in create-kudzu AI check keeps full logs on disk, returns only the last 512 bytes of long successful checks, and includes a bounded diagnostic from the middle of failing logs when found. Generated browser output and default starter code are unchanged.</p>
    <h2>Keep the AI gate honest</h2>
    <p>These local tool-output improvements do not establish model-token savings. The latest complete R8 AI-delivery comparison remains Kudzu 23/25 versus React + Vite 24/25, so the 1.0 gate remains blocked.</p>
  </ReleaseNotes>
}
