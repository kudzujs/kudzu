import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.18 - Dev reload and module serving",
  description: "Live reload works again, public JavaScript modules load in development, and the Kudzu site builds before deployment.",
  url: "https://kudzujs.cloud/releases/0.17.18"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.18" title="Dev reload and module serving">
    <h2>Development server</h2>
    <p>The injected dev client now preserves its runtime URL matcher so it can connect to live reload, display build errors and restore state. Public .mjs files are served as JavaScript so browsers can import them.</p>
    <h2>Site deployment</h2>
    <p>This repository’s npm run deploy builds the site first. If that build fails, deployment stops before uploading assets.</p>
  </ReleaseNotes>
}
