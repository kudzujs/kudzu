import { useState } from "@kudzujs/core"

export function ArrayInput({ value, onValueChange }: { value: string[]; onValueChange: (value: string[]) => void }) {
  const [draft] = useState(value)
  return <button onClick={() => onValueChange(draft)}>Update</button>
}
