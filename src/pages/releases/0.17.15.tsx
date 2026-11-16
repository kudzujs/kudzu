import { ReleaseNotes } from "../../components/ReleaseNotes"

export const metadata = {
  title: "Kudzu 0.17.15 - Development Config Reload",
  description: "Reload development configuration while keeping serving paths and public asset watchers in sync.",
  url: "https://kudzujs.cloud/releases/0.17.15"
}

export default function ReleasePage() {
  return <ReleaseNotes version="0.17.15" title="Development config reload">
    <h2>Reload configuration during development</h2>
    <p>Creating, changing or deleting kudzu.config.mjs or kudzu.config.js now triggers a rebuild. Successful builds update the server base path and replace public-directory watchers so pages, CSS and public assets use the same configuration.</p>
    <h2>Recover from invalid configuration</h2>
    <p>A failed build preserves the previous serving paths. Correcting or deleting the configuration restores development without restarting the server.</p>
    <h2>Development-only correction</h2>
    <p>The regression covers config lifecycle, base-aware CSS, public asset updates and error recovery. No compiler syntax, browser runtime or dependency changes. Generator 0.1.173 retains its compatible core ^0.17.12 range. No performance improvement is claimed.</p>
  </ReleaseNotes>
}
