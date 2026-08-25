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
  const [fieldMeta, setFieldMeta] = useState({ titleTouched: false, bodyTouched: false })
  const [assignee, setAssignee] = useState({ enabled: false, name: "", touched: false })
  const [checklist, setChecklist] = useState([{ id: "check-1", text: "", touched: false }])
  const [nextChecklistId, setNextChecklistId] = useState(2)
  const [dirtySinceReset, setDirtySinceReset] = useState(false)
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
      <form data-issue-form onReset={() => {
        setFieldMeta({ titleTouched: false, bodyTouched: false })
        setAssignee({ enabled: false, name: "", touched: false })
        setChecklist([{ id: "check-1", text: "", touched: false }])
        setNextChecklistId(2)
        setDirtySinceReset(false)
        setFormStatus("idle")
        setTitleError("")
        setFormError("")
      }} onSubmit={async event => {
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
        <output data-form-dirty>{dirtySinceReset ? "dirty" : "clean"}</output>
        <output data-title-touched>{fieldMeta.titleTouched ? "touched" : "untouched"}</output>
        <input
          id="issue-title"
          name="title"
          ref={titleRef}
          required
          minLength={5}
          aria-invalid={titleError ? "true" : "false"}
          aria-describedby={titleError ? "issue-title-error" : undefined}
          onInput={() => setDirtySinceReset(true)}
          onBlur={() => setFieldMeta({ ...fieldMeta, titleTouched: true })}
        />
        {titleError && <p id="issue-title-error">{titleError}</p>}
        <label htmlFor="issue-body">Description</label>
        <output data-body-touched>{fieldMeta.bodyTouched ? "touched" : "untouched"}</output>
        <textarea id="issue-body" name="body" required minLength={20} onInput={() => setDirtySinceReset(true)} onBlur={() => setFieldMeta({ ...fieldMeta, bodyTouched: true })}></textarea>
        <label>
          <input data-assignee-enabled type="checkbox" checked={assignee.enabled} onChange={event => {
            setAssignee({ ...assignee, enabled: event.currentTarget.checked })
            setDirtySinceReset(true)
          }} />
          Assign this issue
        </label>
        {assignee.enabled && <div data-assignee-fields>
          <label htmlFor="issue-assignee">Assignee</label>
          <input id="issue-assignee" name="assignee" required value={assignee.name} onInput={event => {
            setAssignee({ ...assignee, name: event.currentTarget.value })
            setDirtySinceReset(true)
          }} onBlur={() => setAssignee({ ...assignee, touched: true })} />
          <output data-assignee-touched>{assignee.touched ? "touched" : "untouched"}</output>
        </div>}
        <fieldset data-checklist>
          <legend>Checklist</legend>
          {checklist.map(item => <div key={item.id} data-checklist-row={item.id}>
            <label htmlFor={`checklist-${item.id}`}>Checklist item</label>
            <input id={`checklist-${item.id}`} name="checklist" value={item.text} onInput={event => {
              setChecklist(checklist.map(entry => entry.id === item.id ? { ...entry, text: event.currentTarget.value } : entry))
              setDirtySinceReset(true)
            }} onBlur={() => setChecklist(checklist.map(entry => entry.id === item.id ? { ...entry, touched: true } : entry))} />
            <output data-checklist-touched>{item.touched ? "touched" : "untouched"}</output>
            <button type="button" data-remove-checklist={item.id} onClick={() => {
              setChecklist(checklist.filter(entry => entry.id !== item.id))
              setDirtySinceReset(true)
            }}>Remove item</button>
          </div>)}
          <button type="button" data-add-checklist onClick={() => {
            setChecklist([...checklist, { id: `check-${nextChecklistId}`, text: "", touched: false }])
            setNextChecklistId(nextChecklistId + 1)
            setDirtySinceReset(true)
          }}>Add item</button>
          <button type="button" data-reorder-checklist onClick={() => {
            setChecklist([...checklist].reverse())
            setDirtySinceReset(true)
          }}>Reverse items</button>
        </fieldset>
        <button data-reset-issue type="reset">Reset issue</button>
        <button id="issue-submit" type="submit" disabled={formStatus === "pending"}>{formStatus === "pending" ? "Creating issue" : "Create issue"}</button>
        {formError && <p id="issue-form-error" role="alert">{formError}</p>}
        {formStatus === "success" && <p id="issue-success" role="status">Issue created.</p>}
      </form>
    </section>
    <section id="project-history">Project history</section>
  </main>
}
