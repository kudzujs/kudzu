import type { TodoAction } from "./todoReducer"

export function ImportedControls({ dispatch }: { dispatch: (action: TodoAction) => void }) {
  return <button id="imported-add" onClick={() => dispatch({ type: "add", title: "Imported" })}>Add imported</button>
}
