import { useReducer } from "@kudzujs/core"
import { ImportedControls } from "../ImportedControls"
import todoReducer from "../todoReducer"
import type { TodoAction } from "../todoReducer"

function LocalControls({ send }: { send: (action: TodoAction) => void }) {
  const add = () => send({ type: "add", title: "Local" })
  return <button id="local-add" onClick={add}>Add local</button>
}

export default function ReducerPage() {
  const [todos, dispatch] = useReducer(todoReducer, [])

  function addTodos() {
    dispatch({ type: "add", title: "Read" })
    dispatch({ type: "add", title: "Ship" })
  }

  return <main>
    <button id="add" onClick={addTodos}>Add</button>
    <LocalControls send={dispatch} />
    <ImportedControls dispatch={dispatch} />
    <p id="count">{todos.length} todos</p>
    <ul>{todos.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>
  </main>
}
