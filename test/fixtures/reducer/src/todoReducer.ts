import { nextId } from "./todoSupport"

export type Todo = { id: number; title: string }
export type TodoAction = { type: "add"; title: string }

export default function todoReducer(todos: Todo[], action: TodoAction) {
  if (action.type === "add") return [...todos, { id: nextId(todos.length), title: action.title }]
  return todos
}
