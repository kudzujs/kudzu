import type { TodoAction } from "./todoReducer"
import { importedTitle } from "./todoSupport"
import { ImportedInput } from "./ImportedInput"

export function ImportedControls({ dispatch }: { dispatch: (action: TodoAction) => void }) {
  const add = (title: string) => dispatch({ type: "add", title })
  return <section>
    <button id="imported-add" onClick={() => add(importedTitle)}>Add imported</button>
    <ImportedInput onSubmit={add} />
  </section>
}
