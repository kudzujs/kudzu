import { useEffect, useState } from "react"
import { useSession } from "../../session"
import { Shell } from "../../Shell"

type Question = { id: number; title: string; slug: string }

export const layout = Shell

export default function AdminQuestions() {
  const session = useSession(state => state.session)
  const [questions, setQuestions] = useState<Question[]>([])
  const [refresh, setRefresh] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session.token) return
    void fetch(`/answer/api/v1/admin/questions?refresh=${refresh}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(next => setQuestions(next.data))
      .catch(cause => setError(cause instanceof Error ? cause.message : String(cause)))
  }, [session.token, refresh])

  return <main><h1>Admin questions</h1>{error && <p role="alert">{error}</p>}<table><thead><tr><th>Title</th><th>Action</th></tr></thead><tbody>{questions.map(question => <tr key={question.id} data-admin-question={question.id}><td><a href={`/questions/${question.id}/${question.slug}`}>{question.title}</a></td><td><button onClick={async () => {
    const response = await fetch(`/answer/api/v1/question/${question.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.token}` } })
    if (!response.ok) {
      setError(`HTTP ${response.status}`)
      return
    }
    setRefresh(refresh + 1)
  }}>Delete</button></td></tr>)}</tbody></table></main>
}
