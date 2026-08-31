import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useSession } from "../../../session"
import { Shell } from "../../../Shell"

export const layout = Shell
export const runtimeParams = true

export default function QuestionDetail() {
  const { qid, slugPermalink } = useParams<{ qid: string; slugPermalink: string }>()
  const session = useSession(state => state.session)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session.token) return
    void fetch(`/answer/api/v1/question/${qid}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(question => {
        setTitle(question.title)
        setBody(question.body)
        setStatus("ready")
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      })
  }, [qid, session.token])

  return <main data-question-id={qid} data-question-slug={slugPermalink}>
    <h1>{title || slugPermalink}</h1>
    {status === "loading" && <p role="status">Loading question</p>}
    {status === "error" && <p role="alert">{error}</p>}
    {status === "ready" && <form onSubmit={async event => {
      event.preventDefault()
      setError("")
      const response = await fetch(`/answer/api/v1/question/${qid}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.token}` },
        body: new FormData(event.currentTarget),
      })
      if (!response.ok) {
        const result = await response.json()
        setError(result.message)
        return
      }
      const question = await response.json()
      setTitle(question.title)
      setBody(question.body)
      setStatus("saved")
    }}>
      <label>Title <input name="title" required value={title} onInput={event => setTitle(event.currentTarget.value)} /></label>
      <label>Markdown <textarea name="body" required value={body} onInput={event => setBody(event.currentTarget.value)} /></label>
      <button>Save</button>
    </form>}
    {status === "saved" && <p role="status">Question saved</p>}
  </main>
}
