import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.14 - Native Interaction Event Inference",
  description: "Infer pointer, composition, clipboard, drag, scroll and hover events without manual annotations or added browser code.",
  url: "https://kudzujs.cloud/releases/0.17.14"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.14" title="Native interaction event inference">
    <h2>Write ordinary interaction handlers</h2>
    <p>Pointer down/move/up, composition start/end, paste, drop, scroll and mouse enter/leave handlers now infer their native event types. Existing game and windowing examples no longer require manual event annotations for these handlers.</p>
    <h2>Keep native target safety</h2>
    <p>HTML and SVG currentTarget types identify the handler element. The native target still needs narrowing. Strict TypeScript regressions reject keyboard fields on pointer events, clipboard fields on composition events and wheel fields on scroll events.</p>
    <h2>Type-only improvement</h2>
    <p>Ten declaration lines reuse the existing event helper. No compiler pass, runtime code, dependency or browser capability is added. Unlisted attributes remain open. Generator 0.1.173 retains its compatible core ^0.17.12 range.</p>
    <h2>Bounded application evidence</h2>
    <p>A separate patched-upstream Actual Budget probe preserves a completed follower account creation through graceful leader closure and reload. This does not establish in-flight write safety or a whole-application Kudzu migration.</p>
  </ReleaseNotes>
}
