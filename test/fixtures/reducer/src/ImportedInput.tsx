import { normalizeTitle } from "./todoSupport"

export function ImportedInput({ onSubmit, onBlur, editing = false, label = "new-todo", priority = -1, item = null, defaultValue = "" }: { onSubmit: (title: string) => void; onBlur?: (title: string) => void; editing?: boolean; label?: string; priority?: number; item?: null; defaultValue?: string }) {
  const blur = (event: FocusEvent) => {
    if (onBlur) onBlur(normalizeTitle((event.currentTarget as HTMLInputElement).value))
  }
  const submit = (event: KeyboardEvent) => {
    if (event.key === "Enter") onSubmit(normalizeTitle((event.currentTarget as HTMLInputElement).value))
  }
  return <input id="imported-input" className={editing ? "edit" : label} data-priority={priority} data-item={item} defaultValue={defaultValue} onBlur={blur} onKeyDown={submit} />
}
