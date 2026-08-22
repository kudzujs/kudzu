import { useState } from "@kudzujs/core"
import { AppLayout, useWorkspace } from "../../../AppLayout"

export const layout = AppLayout

export default function AlphaProjectPage() {
  const { workspace } = useWorkspace()
  const [draft, setDraft] = useState("Clean draft")

  return <main data-project-detail>
    <h1>Alpha project</h1>
    <output data-route-workspace>{workspace}</output>
    <output data-project-draft>{draft}</output>
    <button data-edit-draft onClick={() => setDraft("Dirty draft")}>Edit draft</button>
  </main>
}
