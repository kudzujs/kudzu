import { useEffect, useState } from "@kudzujs/core"
import { useSearchParams } from "react-router-dom"
import { AppLayout, useWorkspace } from "../../AppLayout"
import { projectFilters } from "../../projectFilters"

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
  const { workspace, projectName, projectRevision } = useWorkspace()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get("page")) || 1
  const serverFilter = searchParams.get("filter") || projectFilters[0]
  const [summary, setSummary] = useState({ projectCount: 2, issueCount: 3 })
  const [projects, setProjects] = useState([alpha, beta])
  const [filter, setFilter] = useState<"all" | "active">("all")
  const [showSummary, setShowSummary] = useState(true)
  const [savedFilters, setSavedFilters] = useState([{ id: "all", label: "All" }])
  const [request, setRequest] = useState(0)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [polling, setPolling] = useState(false)
  const filterLabel = filter === "all" ? "All projects" : "Active projects"

  useEffect(() => {
    const controller = new globalThis.AbortController()
    setStatus("loading")
    setError("")

    void fetch(`/api/projects?page=${page}&filter=${serverFilter}&request=${request}`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(async nextProjects => {
        if (request === 0) {
          document.body.dataset.projectFetchPending = "true"
          await new Promise(resolve => setTimeout(resolve, 250))
        }
        setProjects(nextProjects)
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
  }, [page, serverFilter, request])

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
    {status === "loading" && <p role="status">Loading projects</p>}
    {status === "success" && <p role="status">Projects loaded</p>}
    {status === "error" && <p role="alert">{error}</p>}
    <output id="project-filter" aria-live="polite">{filterLabel}</output>
    {showSummary && <section id="project-summary">
      <span id="project-count">{summary.projectCount}</span>
      <span id="total-issues">{summary.issueCount}</span>
    </section>}
    <ul id="saved-filters">{savedFilters.map(saved => <li key={saved.id} data-saved-filter={saved.id}>{saved.label}</li>)}</ul>
    <div id="project-list">{projects.map(project => (filter === "all" || project.status === "active") && <ProjectRow key={project.id} project={project} />)}</div>
  </main>
}
