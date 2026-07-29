import { useState } from "@kudzujs/core"
import type { Todo, TodoAction } from "./todoReducer"
import { removeType } from "./todoSupport"

export function ImportedItem({ todo, dispatch }: { todo: Todo; dispatch: (action: TodoAction) => void }) {
  const [editing, setEditing] = useState(false)
  const beginEditing = () => setEditing(true)
  const cancelEditing = (event: KeyboardEvent) => {
    if (event.key === "Escape") setEditing(false)
  }
  const removeItem = () => dispatch({ type: removeType, id: todo.id })
  return <li className={editing ? "editing" : ""} data-id={todo.id}>
    <span>{todo.title}</span>
    <button className="edit-toggle" onClick={beginEditing}>Edit</button>
    {editing ? <input className="edit" onKeyDown={cancelEditing} /> : null}
    <button className="remove" onClick={removeItem}>Remove</button>
  </li>
}
