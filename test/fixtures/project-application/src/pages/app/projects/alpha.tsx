import { useRef, useState } from "@kudzujs/core"
import { AppLayout, useWorkspace } from "../../../AppLayout"

export const layout = AppLayout
export const metadata = { title: "Alpha project" }

export default function AlphaProjectPage() {
  const { token, workspace, projectName, projectRevision } = useWorkspace()
  const [draft, setDraft] = useState("Clean draft")
  const [formStatus, setFormStatus] = useState("idle")
  const [titleError, setTitleError] = useState("")
  const [formError, setFormError] = useState("")
  const titleRef = useRef<HTMLInputElement>(null)

  return <main data-project-detail>
    <h1>Alpha project</h1>
    <output data-route-workspace>{workspace}</output>
    <output data-shared-project-name>{projectName}</output>
    <output data-shared-project-revision>{projectRevision}</output>
    <output data-project-draft>{draft}</output>
    <button data-edit-draft onClick={() => setDraft("Dirty draft")}>Edit draft</button>
    <section aria-labelledby="create-issue-title">
      <h2 id="create-issue-title">Create issue</h2>
      <form data-issue-form onSubmit={async event => {
        event.preventDefault()
        if (formStatus === "pending") return
        const fields = new FormData(event.currentTarget)
        setFormStatus("pending")
        setTitleError("")
        setFormError("")
        const response = await fetch("/api/projects/alpha/issues", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fields
        })
        const result = await response.json()
        if (response.status === 422) {
          setTitleError(result.errors.title)
          setFormStatus("idle")
          titleRef.current?.focus()
          return
        }
        if (!response.ok) {
          setFormError(result.error)
          setFormStatus("idle")
          return
        }
        setFormStatus("success")
      }}>
        <label htmlFor="issue-title">Title</label>
        <input
          id="issue-title"
          name="title"
          ref={titleRef}
          required
          minLength={5}
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? "issue-title-error" : undefined}
        />
        {titleError && <p id="issue-title-error">{titleError}</p>}
        <label htmlFor="issue-body">Description</label>
        <textarea id="issue-body" name="body" required minLength={20}></textarea>
        <button id="issue-submit" type="submit" disabled={formStatus === "pending"}>{formStatus === "pending" ? "Creating issue" : "Create issue"}</button>
        {formError && <p id="issue-form-error" role="alert">{formError}</p>}
        {formStatus === "success" && <p id="issue-success" role="status">Issue created.</p>}
      </form>
    </section>
    <section id="project-history">Project history</section>
  </main>
}
