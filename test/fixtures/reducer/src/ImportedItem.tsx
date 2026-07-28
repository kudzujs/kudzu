import type { Todo, TodoAction } from "./todoReducer"
import { removeType } from "./todoSupport"

export function ImportedItem({ todo, dispatch }: { todo: Todo; dispatch: (action: TodoAction) => void }) {
  const removeItem = () => dispatch({ type: removeType, id: todo.id })
  return <li data-id={todo.id}>
    <span>{todo.title}</span>
    <button className="remove" onClick={removeItem}>Remove</button>
  </li>
}
