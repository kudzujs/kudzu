import { useParams } from "react-router-dom"
import { AppLayout } from "../../../../../AppLayout"

export const layout = AppLayout
export const runtimeParams = true

export default function IssuePage() {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>()

  return <main data-runtime-issue data-project-id={projectId} data-issue-id={issueId}>
    <h1>Issue {issueId}</h1>
    <p>Project <strong>{projectId}</strong></p>
    <a data-project-return href={`/app/projects/${projectId}`}>Project</a>
  </main>
}
