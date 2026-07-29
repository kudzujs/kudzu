import { nextId } from "./todoSupport"

export type Todo = { id: number; title: string; edits: number }
export type TodoAction = { type: "add"; title: string } | { type: "remove"; id: number } | { type: "update"; id: number; title: string } | { type: "reverse" } | { type: "restore"; todo: Todo }

export default function todoReducer(todos: Todo[], action: TodoAction) {
  if (action.type === "add") return [...todos, { id: nextId(todos.length), title: action.title, edits: 0 }]
  if (action.type === "remove") return todos.filter(todo => todo.id !== action.id)
  if (action.type === "update") return todos.map(todo => todo.id === action.id ? { ...todo, title: action.title, edits: todo.edits + 1 } : todo)
  if (action.type === "reverse") return [...todos].reverse()
  if (action.type === "restore") return [...todos, action.todo]
  return todos
}
