import { normalizeTitle } from "./todoSupport"

export function ImportedInput({ onSubmit }: { onSubmit: (title: string) => void }) {
  const submit = (event: KeyboardEvent) => {
    if (event.key === "Enter") onSubmit(normalizeTitle((event.currentTarget as HTMLInputElement).value))
  }
  return <input id="imported-input" onKeyDown={submit} />
}
