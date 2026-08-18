import { useState } from "react"

export function ImportedProfileInput({ value, onChange }: { value: { name: string }; onChange: (value: { name: string }) => void }) {
  const [draft, setDraft] = useState(value)
  return <section>
    <span id="profile-draft">{draft.name}</span>
    <button id="profile-edit" onClick={() => setDraft({ name: "Cedar" })}>Edit profile</button>
    <button id="profile-save" onClick={() => onChange(draft)}>Save profile</button>
  </section>
}
