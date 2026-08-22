import { createContext, useContext, useState } from "@kudzujs/core"

type WorkspaceValue = {
  workspace: string
  setWorkspace: (workspace: string) => void
}

const WorkspaceContext = createContext<WorkspaceValue>({} as WorkspaceValue)

export function useWorkspace() {
  return useContext(WorkspaceContext)
}

export function AppLayout({ children }: { children?: unknown }) {
  const [workspace, setWorkspace] = useState("Primary")

  return <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
    <header data-app-layout>
      <output data-workspace>{workspace}</output>
      <button data-switch-workspace onClick={() => setWorkspace("Secondary")}>Switch workspace</button>
      <nav>
        <a href="/app/projects">Projects</a>
        <a href="/app/projects/alpha">Alpha</a>
        <a href="/help">Help</a>
      </nav>
    </header>
    {children}
  </WorkspaceContext.Provider>
}
