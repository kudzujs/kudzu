import { useState } from "react"

function Nested({}: {}) {
  const [active, setActive] = useState(false)
  return <button onClick={() => setActive(!active)}>{active ? "active" : "idle"}</button>
}

export function Adapter({ show, onValueChange }: { show: boolean; onValueChange: (value: string) => void }) {
  return <div>{show && <Nested />}<button onClick={() => onValueChange("next")}>Next</button></div>
}
