import { createContext, useContext, useEffect, useState } from "@kudzujs/core"

type WorkspaceValue = {
  workspace: string
  setWorkspace: (workspace: string) => void
  projectName: string
  setProjectName: (name: string) => void
  projectRevision: number
  setProjectRevision: (revision: number) => void
}

const WorkspaceContext = createContext<WorkspaceValue>({} as WorkspaceValue)

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

export function AppLayout({ children }: { children?: unknown }) {
  const [workspace, setWorkspace] = useState("Primary")
  const [storageReady, setStorageReady] = useState(false)
  const [projectName, setProjectName] = useState("Alpha")
  const [projectRevision, setProjectRevision] = useState(-1)

  useEffect(() => {
    try {
      const raw = globalThis.localStorage.getItem("kudzu-project-workspace")
      if (raw !== null) {
        const stored = JSON.parse(raw)
        if (typeof stored === "object" && stored !== null && stored.version === 1 && (stored.workspace === "Primary" || stored.workspace === "Secondary")) setWorkspace(stored.workspace)
      }
    } catch {
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    try {
      globalThis.localStorage.setItem("kudzu-project-workspace", JSON.stringify({ version: 1, workspace }))
    } catch {}
  }, [storageReady, workspace])

  useEffect(() => {
    const controller = new globalThis.AbortController()
    void fetch("/api/project/alpha", { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(project => {
        setProjectName(project.name)
        setProjectRevision(project.revision)
      })
      .catch(cause => {
        if (!controller.signal.aborted) throw cause
      })
    return () => controller.abort()
  }, [])

  return <WorkspaceContext.Provider value={{ workspace, setWorkspace, projectName, setProjectName, projectRevision, setProjectRevision }}>
    <header data-app-layout>
      <output data-workspace>{workspace}</output>
      <button data-switch-workspace onClick={() => setWorkspace("Secondary")}>Switch workspace</button>
      <button data-logout onClick={() => {
        setStorageReady(false)
        try {
          globalThis.localStorage.removeItem("kudzu-project-workspace")
        } catch {}
        setWorkspace("Primary")
      }}>Log out</button>
      <nav>
        <a href="/app/projects">Projects</a>
        <a href="/app/projects/alpha">Alpha</a>
        <a href="/help">Help</a>
      </nav>
    </header>
    {children}
  </WorkspaceContext.Provider>
}
