import { useState } from "@kudzujs/core"

export function ObjectInput({ value, onValueChange }: { value: { text: string }; onValueChange: (value: { text: string }) => void }) {
  const [draft] = useState(value)
  return <button onClick={() => onValueChange(draft)}>Update</button>
}
