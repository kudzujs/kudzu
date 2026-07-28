import { useReducer } from "@kudzujs/core"
import todoReducer from "../todoReducer"

export default function ReducerPage() {
  const [todos, dispatch] = useReducer(todoReducer, [])

  function addTodos() {
    dispatch({ type: "add", title: "Read" })
    dispatch({ type: "add", title: "Ship" })
  }

  return <main>
    <button id="add" onClick={addTodos}>Add</button>
    <p id="count">{todos.length} todos</p>
    <ul>{todos.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>
  </main>
}
