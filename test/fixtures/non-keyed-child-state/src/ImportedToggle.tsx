import { useState } from "react"

export function ImportedToggle({ id, label }: { id: string; label: string }) {
  const [on, setOn] = useState(() => false)
  return <button data-toggle={id} onClick={() => setOn(!on)}>{label}: {on ? "on" : "off"}</button>
}
