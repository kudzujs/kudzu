import { useState } from "@kudzujs/core"
import { AppLayout, useWorkspace } from "../../../AppLayout"

export const layout = AppLayout

export default function AlphaProjectPage() {
  const { workspace, projectName, setProjectName, projectRevision, setProjectRevision } = useWorkspace()
  const [draft, setDraft] = useState("Clean draft")

  return <main data-project-detail>
    <h1>Alpha project</h1>
    <output data-route-workspace>{workspace}</output>
    <output data-shared-project-name>{projectName}</output>
    <output data-shared-project-revision>{projectRevision}</output>
    <output data-project-draft>{draft}</output>
    <button data-edit-draft onClick={() => setDraft("Dirty draft")}>Edit draft</button>
    <button data-rename-project onClick={async () => {
      const response = await fetch("/api/project/alpha", { method: "POST" })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const project = await response.json()
      setProjectName(project.name)
      setProjectRevision(project.revision)
    }}>Rename project</button>
  </main>
}
