import { useState } from "@kudzujs/core"

export function ObjectInput({ value, onValueChange }: { value: { text: string }; onValueChange: (value: { text: string }) => void }) {
  const [draft, setDraft] = useState(value)
  return <section>
    <span id="draft">{draft.text}</span>
    <button id="edit" onClick={() => setDraft({ text: "draft" })}>Edit draft</button>
    <button id="update" onClick={() => onValueChange(draft)}>Update parent</button>
  </section>
}
