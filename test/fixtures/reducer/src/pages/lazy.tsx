import { useReducer } from "react"
import todoReducer, { initializeTodos } from "../todoReducer"

export default function LazyReducerPage() {
  const [todos, dispatch] = useReducer(todoReducer, "Prepared", initializeTodos)
  return <main>{todos[0].title}</main>
}
