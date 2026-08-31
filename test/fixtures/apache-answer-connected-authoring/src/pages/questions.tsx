import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { QUESTION_ORDER_KEYS, type QuestionOrder } from "../order"
import { useSession } from "../session"
import { Shell } from "../Shell"

type Question = { id: number; title: string; slug: string; tags: { slug: string; name: string }[] }

export const layout = Shell

export default function Questions() {
  const [params] = useSearchParams()
  const page = Number(params.get("page")) || 1
  const order = (params.get("order") || QUESTION_ORDER_KEYS[0]) as QuestionOrder
  const session = useSession(state => state.session)
  const [status, setStatus] = useState("loading")
  const [error, setError] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!session.token) return
    setStatus("loading")
    setError("")
    void fetch(`/answer/api/v1/question/page?page_size=20&page=${page}&order=${order}&refresh=${refresh}`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json()
      })
      .then(next => {
        setQuestions(next.data)
        setStatus("success")
      })
      .catch(cause => {
        setError(cause instanceof Error ? cause.message : String(cause))
        setStatus("error")
      })
  }, [session.token, page, order, refresh])

  return <main data-page={page} data-order={order}>
    <h1>Questions</h1>
    <button data-refresh onClick={() => setRefresh(refresh + 1)}>Refresh</button>
    {status === "loading" && <p role="status">Loading questions</p>}
    {status === "error" && <p role="alert">{error}</p>}
    {status === "success" && <ul id="questions">{questions.map(question => <li key={question.id} data-question={question.id}>
      <a href={`/questions/${question.id}/${question.slug}`}>{question.title}</a>
      <ul>{question.tags.map(tag => <li key={tag.slug}>{tag.name}</li>)}</ul>
    </li>)}</ul>}
  </main>
}
