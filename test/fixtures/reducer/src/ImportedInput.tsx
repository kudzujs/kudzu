import { normalizeTitle } from "./todoSupport"

export function ImportedInput({ onSubmit, editing = false, label = "new-todo", priority = -1, item = null }: { onSubmit: (title: string) => void; editing?: boolean; label?: string; priority?: number; item?: null }) {
  const submit = (event: KeyboardEvent) => {
    if (event.key === "Enter") onSubmit(normalizeTitle((event.currentTarget as HTMLInputElement).value))
  }
  return <input id="imported-input" className={editing ? "edit" : label} data-priority={priority} data-item={item} onKeyDown={submit} />
}
