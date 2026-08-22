import { useState } from "@kudzujs/core"
import { AppLayout, useWorkspace } from "../../AppLayout"

export const layout = AppLayout

type Issue = { id: string; title: string }
type Project = { id: string; name: string; status: "active" | "archived"; issues: Issue[] }

const alpha: Project = {
  id: "alpha",
  name: "Alpha",
  status: "active",
  issues: [{ id: "a1", title: "Design schema" }, { id: "a2", title: "Ship dashboard" }]
}
const beta: Project = {
  id: "beta",
  name: "Beta",
  status: "archived",
  issues: [{ id: "b1", title: "Archive notes" }]
}

function ProjectRow({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false)

  return <article data-project={project.id}>
    <h2 data-project-name>{project.name}</h2>
    <output data-issue-count>{project.issues.length}</output>
    <button data-expand={project.id} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Issues</button>
    <ul data-issues={project.id}>
      {project.issues.map(issue => <li key={issue.id} data-issue={issue.id}>{issue.title}</li>)}
    </ul>
  </article>
}

export default function ProjectsPage() {
  const { workspace } = useWorkspace()
  const [summary, setSummary] = useState({ projectCount: 2, issueCount: 3 })
  const [projects, setProjects] = useState([alpha, beta])
  const [filter, setFilter] = useState<"all" | "active">("all")
  const [showSummary, setShowSummary] = useState(true)
  const [savedFilters, setSavedFilters] = useState([{ id: "all", label: "All" }])
  const filterLabel = filter === "all" ? "All projects" : "Active projects"

  return <main data-project-list-page>
    <h1>Projects</h1>
    <output data-route-workspace>{workspace}</output>
    <p id="unrelated-control">Workspace projects are the first greenfield application surface.</p>
    <button id="show-active" onClick={() => setFilter("active")}>Show active</button>
    <button id="show-all" onClick={() => setFilter("all")}>Show all</button>
    <button id="toggle-summary" onClick={() => setShowSummary(!showSummary)}>Toggle summary</button>
    <button id="replace-workspace" onClick={() => {
      setSummary({ projectCount: 2, issueCount: 4 })
      setProjects([{ ...alpha, name: "Alpha updated", issues: [...alpha.issues, { id: "a3", title: "Verify release" }] }, beta])
    }}>Replace workspace</button>
    <button id="remove-alpha" onClick={() => {
      setSummary({ projectCount: 1, issueCount: 1 })
      setProjects([beta])
    }}>Remove Alpha</button>
    <button id="restore-alpha" onClick={() => {
      setSummary({ projectCount: 2, issueCount: 3 })
      setProjects([alpha, beta])
    }}>Restore Alpha</button>
    <button id="save-active" onClick={() => setSavedFilters([...savedFilters, { id: "active", label: "Active" }])}>Save active</button>
    <output id="project-filter" aria-live="polite">{filterLabel}</output>
    {showSummary && <section id="project-summary">
      <span id="project-count">{summary.projectCount}</span>
      <span id="total-issues">{summary.issueCount}</span>
    </section>}
    <ul id="saved-filters">{savedFilters.map(saved => <li key={saved.id} data-saved-filter={saved.id}>{saved.label}</li>)}</ul>
    <div id="project-list">{projects.map(project => (filter === "all" || project.status === "active") && <ProjectRow key={project.id} project={project} />)}</div>
  </main>
}
