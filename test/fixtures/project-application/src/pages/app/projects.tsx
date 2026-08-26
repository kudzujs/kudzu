/// <reference lib="es2023.array" />

import { useEffect, useState } from "@kudzujs/core"
import { useSearchParams } from "react-router-dom"
import { AppLayout, useWorkspace } from "../../AppLayout"
import { projectFilters } from "../../projectFilters"

export const layout = AppLayout
export const metadata = { title: "Projects" }

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

function IssueRow({ issue }: { issue: Issue }) {
  const [visits, setVisits] = useState(0)

  return <li data-issue={issue.id}>
    <span data-issue-title>{issue.title}</span>
    <output data-issue-visits>{visits}</output>
    <button data-visit-issue={issue.id} onClick={() => {
      document.body.dataset.selectedIssue = `${issue.id}:${issue.title}`
      setVisits(visits + 1)
    }}>Visit issue</button>
  </li>
}

function ProjectRow({ project, selected, onSelect, onSave, onDelete }: { project: Project; selected: boolean; onSelect: () => void; onSave: (name: string) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project)

  return <tr data-project={project.id} data-selected={selected} aria-selected={selected}>
    <th scope="row" data-project-name>{project.name}</th>
    <td>{project.status}</td>
    <td><output data-issue-count>{project.issues.length}</output></td>
    <td>
      <button data-select-project={project.id} onClick={onSelect}>Select</button>
      <button data-expand={project.id} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>Issues</button>
      <button data-edit-project={project.id} onClick={() => setEditing(true)}>Edit</button>
      <span data-project-editor={project.id} hidden={!editing}>
        <input data-project-name-draft={project.id} aria-label="Project name" value={draft.name} onInput={event => setDraft({ id: draft.id, name: event.currentTarget.value, status: draft.status, issues: draft.issues })} />
        <button data-save-project={project.id} onClick={() => {
          onSave(draft.name)
          setEditing(false)
        }}>Save</button>
      </span>
      <button data-delete-project={project.id} onClick={onDelete}>Delete</button>
      <ul data-issues={project.id}>
        {project.issues.map(issue => <IssueRow key={issue.id} issue={issue} />)}
      </ul>
    </td>
  </tr>
}

export default function ProjectsPage() {
  const { token, workspace, projectName, projectRevision } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const serverFilter = searchParams.get("filter") || projectFilters[0]
  const [summary, setSummary] = useState({ projectCount: 2, issueCount: 3 })
  const [projectData, setProjectData] = useState({ projects: [alpha, beta] })
  const [filter, setFilter] = useState<"all" | "active">("all")
  const [showSummary, setShowSummary] = useState(true)
  const [savedFilters, setSavedFilters] = useState([{ id: "all", label: "All" }])
  const [request, setRequest] = useState(0)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [polling, setPolling] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [sortDirection, setSortDirection] = useState<"source" | "ascending">("source")
  const filterLabel = filter === "all" ? "All projects" : "Active projects"
  const orderedProjects = projectData.projects.toSorted((left, right) => sortDirection === "ascending" ? left.name.localeCompare(right.name) : 0)

  useEffect(() => {
    if (!token) return
    const controller = new globalThis.AbortController()
    setStatus("loading")
    setError("")

    void fetch(`/api/projects?page=${page}&filter=${serverFilter}&request=${request}`, { signal: controller.signal, headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (response.status === 401) {
          localStorage.removeItem("kudzu-project-token")
          location.replace("/login")
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(async nextProjects => {
        if (request === 0) {
          document.body.dataset.projectFetchPending = "true"
          await new Promise(resolve => setTimeout(resolve, 250))
        }
        setProjectData({ projects: nextProjects })
        setSummary({ projectCount: 2, issueCount: 3 })
        setStatus("success")
      })
      .catch(cause => {
        if (controller.signal.aborted) return
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      })

    return () => {
      controller.abort()
      document.body.dataset.projectFetchCleanup = `${document.body.dataset.projectFetchCleanup ?? ""}|${request}`
    }
  }, [page, serverFilter, request, token])

  useEffect(() => {
    if (!polling) return
    const refresh = () => {
      if (document.visibilityState === "visible") setRequest(request + 1)
    }
    const timer = setInterval(refresh, 60000)
    document.addEventListener("visibilitychange", refresh)
    document.body.dataset.projectPolling = "active"
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
      document.body.dataset.projectPolling = "stopped"
    }
  }, [polling, request])

  return <main data-project-list-page>
    <h1>Projects</h1>
    <output data-route-workspace>{workspace}</output>
    <output data-shared-project-name>{projectName}</output>
    <output data-shared-project-revision>{projectRevision}</output>
    <output data-server-page>{page}</output>
    <output data-server-filter>{serverFilter}</output>
    <p id="unrelated-control">Workspace projects are the first greenfield application surface.</p>
    <a data-history-project href="/app/projects/alpha#project-history">Alpha project history</a>
    <button id="refetch-projects" onClick={() => setRequest(request + 1)}>Refetch projects</button>
    <button id="next-project-page" onClick={() => setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set("page", "2")
      next.set("filter", "all")
      return next
    })}>Next page</button>
    <button id="active-project-page" onClick={() => setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      next.set("page", "1")
      next.set("filter", "active")
      return next
    })}>Active projects from server</button>
    <button id="enable-project-polling" disabled={polling} onClick={() => setPolling(true)}>Enable polling</button>
    <button id="disable-project-polling" disabled={!polling} onClick={() => setPolling(false)}>Disable polling</button>
    <button id="show-active" onClick={() => setFilter("active")}>Show active</button>
    <button id="show-all" onClick={() => setFilter("all")}>Show all</button>
    <button id="insert-project" onClick={() => setProjectData({ projects: [...projectData.projects, { id: "delta", name: "Delta", status: "active", issues: [{ id: "d1", title: "Plan table" }] }] })}>Insert project</button>
    <button id="reverse-projects" onClick={() => setProjectData({ projects: [...projectData.projects].reverse() })}>Reverse projects</button>
    <button id="sort-projects" onClick={() => setSortDirection("ascending")}>Sort projects</button>
    <button id="update-alpha-issue" onClick={() => setProjectData({ projects: projectData.projects.map(project => project.id === "alpha" ? { ...project, issues: project.issues.map(issue => issue.id === "a1" ? { ...issue, title: "Design schema updated" } : issue) } : project) })}>Update Alpha issue</button>
    <button id="reorder-alpha-issues" onClick={() => setProjectData({ projects: projectData.projects.map(project => project.id === "alpha" ? { ...project, issues: [...project.issues].reverse() } : project) })}>Reorder Alpha issues</button>
    <button id="remove-alpha-issue" onClick={() => setProjectData({ projects: projectData.projects.map(project => project.id === "alpha" ? { ...project, issues: project.issues.filter(issue => issue.id !== "a1") } : project) })}>Remove Alpha issue</button>
    <button id="restore-alpha-issue" onClick={() => setProjectData({ projects: projectData.projects.map(project => project.id === "alpha" ? { ...project, issues: [...project.issues, { id: "a1", title: "Design schema restored" }] } : project) })}>Restore Alpha issue</button>
    <button id="toggle-summary" onClick={() => setShowSummary(!showSummary)}>Toggle summary</button>
    <button id="replace-workspace" onClick={() => {
      setSummary({ projectCount: 2, issueCount: 4 })
      setProjectData({ projects: [{ ...alpha, name: "Alpha updated", issues: [...alpha.issues, { id: "a3", title: "Verify release" }] }, beta] })
    }}>Replace workspace</button>
    <button id="remove-alpha" onClick={() => {
      setSummary({ projectCount: 1, issueCount: 1 })
      setProjectData({ projects: [beta] })
    }}>Remove Alpha</button>
    <button id="restore-alpha" onClick={() => {
      setSummary({ projectCount: 2, issueCount: 3 })
      setProjectData({ projects: [alpha, beta] })
    }}>Restore Alpha</button>
    <button id="save-active" onClick={() => setSavedFilters([...savedFilters, { id: "active", label: "Active" }])}>Save active</button>
    {status === "loading" && <p role="status">Loading projects</p>}
    {status === "success" && <p role="status">Projects loaded</p>}
    {status === "error" && <p role="alert">{error}</p>}
    <output id="project-filter" aria-live="polite">{filterLabel}</output>
    {showSummary && <section id="project-summary">
      <span id="project-count">{summary.projectCount}</span>
      <span id="total-issues">{summary.issueCount}</span>
    </section>}
    <ul id="saved-filters">{savedFilters.map(saved => <li key={saved.id} data-saved-filter={saved.id}>{saved.label}</li>)}</ul>
    <table id="project-list" data-project-table>
      <thead><tr><th>Project</th><th>Status</th><th>Issues</th><th>Actions</th></tr></thead>
      <tbody>{orderedProjects.map(project => (filter === "all" || project.status === "active") && <ProjectRow
        key={project.id}
        project={project}
        selected={selectedId === project.id}
        onSelect={() => setSelectedId(project.id)}
        onSave={name => setProjectData({ projects: projectData.projects.map(entry => entry.id === project.id ? { ...entry, name } : entry) })}
        onDelete={() => setProjectData({ projects: projectData.projects.filter(entry => entry.id !== project.id) })}
      />)}</tbody>
    </table>
  </main>
}
