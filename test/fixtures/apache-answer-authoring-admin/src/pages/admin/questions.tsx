import { useEffect, useState } from "react"

type Question = { id: number; title: string; body: string }

export default function AdminQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  useEffect(() => {
    setQuestions(JSON.parse(localStorage.getItem("answer-questions") || "[]"))
  }, [])
  return <main><h1>Admin questions</h1><table><thead><tr><th>Title</th><th>Action</th></tr></thead><tbody>{questions.map(question => <tr key={question.id}><td>{question.title}</td><td><button onClick={() => {
    const next = questions.filter(entry => entry.id !== question.id)
    localStorage.setItem("answer-questions", JSON.stringify(next))
    setQuestions(next)
  }}>Delete</button></td></tr>)}</tbody></table></main>
}
