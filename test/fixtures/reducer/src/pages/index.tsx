import { useReducer } from "@kudzujs/core"
import { ImportedControls } from "../ImportedControls"
import { ImportedItem } from "../ImportedItem"
import todoReducer from "../todoReducer"
import type { TodoAction } from "../todoReducer"

function LocalControls({ send }: { send: (action: TodoAction) => void }) {
  const add = () => send({ type: "add", title: "Local" })
  return <button id="local-add" onClick={add}>Add local</button>
}

export default function ReducerPage() {
  const [todos, dispatch] = useReducer(todoReducer, [])
  const importedTitle = "Parent"

  function addTodos() {
    dispatch({ type: "add", title: "Read" })
    dispatch({ type: "add", title: "Ship" })
  }

  return <main>
    <button id="add" onClick={addTodos}>Add</button>
    <LocalControls send={dispatch} />
    <ImportedControls dispatch={dispatch} />
    <span id="parent-title">{importedTitle}</span>
    <p id="count">{todos.length} todos</p>
    <ul>{todos.map(todo => <ImportedItem key={todo.id} todo={todo} dispatch={dispatch} />)}</ul>
  </main>
}
