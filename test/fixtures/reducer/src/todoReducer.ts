import { nextId } from "./todoSupport"

export type Todo = { id: number; title: string }
export type TodoAction = { type: "add"; title: string } | { type: "remove"; id: number } | { type: "reverse" } | { type: "restore"; todo: Todo }

export default function todoReducer(todos: Todo[], action: TodoAction) {
  if (action.type === "add") return [...todos, { id: nextId(todos.length), title: action.title }]
  if (action.type === "remove") return todos.filter(todo => todo.id !== action.id)
  if (action.type === "reverse") return [...todos].reverse()
  if (action.type === "restore") return [...todos, action.todo]
  return todos
}
