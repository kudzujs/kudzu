import { useState } from "react"
import { useSession } from "../../session"
import { Shell } from "../../Shell"

export const layout = Shell

export default function AskQuestion() {
  const session = useSession(state => state.session)
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  return <main><h1>Ask a question</h1><form onSubmit={async event => {
    event.preventDefault()
    setError("")
    const response = await fetch("/answer/api/v1/question", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.token}` },
      body: new FormData(event.currentTarget),
    })
    if (!response.ok) {
      const result = await response.json()
      setError(result.message)
      return
    }
    await response.json()
    setStatus("created")
  }}>
    <label>Title <input name="title" required minLength={5} /></label>
    <label>Markdown <textarea name="body" required value={body} onInput={event => setBody(event.currentTarget.value)} /></label>
    <button>Publish</button>
    {error && <p role="alert">{error}</p>}
  </form><section aria-label="Preview"><pre>{body}</pre></section>{status && <a data-created href="/questions/2/connected-question">View question</a>}</main>
}
