import { useState } from "@kudzujs/core"
import { AppLayout, useWorkspace } from "../../../AppLayout"

export const layout = AppLayout
export const metadata = { title: "Alpha project" }

export default function AlphaProjectPage() {
  const { workspace, projectName, projectRevision } = useWorkspace()
  const [draft, setDraft] = useState("Clean draft")

  return <main data-project-detail>
    <h1>Alpha project</h1>
    <output data-route-workspace>{workspace}</output>
    <output data-shared-project-name>{projectName}</output>
    <output data-shared-project-revision>{projectRevision}</output>
    <output data-project-draft>{draft}</output>
    <button data-edit-draft onClick={() => setDraft("Dirty draft")}>Edit draft</button>
    <section id="project-history">Project history</section>
  </main>
}
