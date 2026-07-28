import type { TodoAction } from "./todoReducer"
import { importedTitle } from "./todoSupport"

export function ImportedControls({ dispatch }: { dispatch: (action: TodoAction) => void }) {
  return <button id="imported-add" onClick={() => dispatch({ type: "add", title: importedTitle })}>Add imported</button>
}
