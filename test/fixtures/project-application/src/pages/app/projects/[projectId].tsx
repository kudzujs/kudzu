import { useParams } from "react-router-dom"
import { AppLayout } from "../../../AppLayout"

export const layout = AppLayout
export const runtimeParams = true

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return <main data-runtime-project data-project-id={projectId}>
    <h1>Project {projectId}</h1>
    <p>This project route is directly addressable.</p>
    <a data-first-issue href={`/app/projects/${projectId}/issues/first`}>First issue</a>
    <a href="/app/projects">All projects</a>
  </main>
}
