import { useState } from "@kudzujs/core"
import { ImportedInput } from "./ImportedInput"
import type { Todo, TodoAction } from "./todoReducer"
import { removeType } from "./todoSupport"

export function ImportedItem({ todo, dispatch }: { todo: Todo; dispatch: (action: TodoAction) => void }) {
  const [editing, setEditing] = useState(false)
  const beginEditing = () => setEditing(true)
  const commitEdit = (title: string) => {
    if (!editing) return
    setEditing(false)
    if (title.length === 0) dispatch({ type: removeType, id: todo.id })
    else dispatch({ type: "update", id: todo.id, title })
  }
  const removeItem = () => dispatch({ type: removeType, id: todo.id })
  return <li className={editing ? "editing" : ""} data-id={todo.id} data-edits={todo.edits}>
    <span>{todo.title}</span>
    <button className="edit-toggle" onClick={beginEditing}>Edit</button>
    {editing ? <ImportedInput editing defaultValue={todo.title} onSubmit={commitEdit} onBlur={commitEdit} /> : null}
    <button className="remove" onClick={removeItem}>Remove</button>
  </li>
}
