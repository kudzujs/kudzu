import { useState } from "@kudzujs/core"

export function InvalidInput({ value, onValueChange }: { value: string; onValueChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  return <input value={draft} onInput={event => {
    setDraft(event.currentTarget.value)
    onValueChange(event.currentTarget.value)
  }} />
}
