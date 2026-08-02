import { useState } from "react"
import { ImportedToggle } from "../ImportedToggle"

function Toggle({ id, label }: { id: string; label: string }) {
  const [on, setOn] = useState(false)
  return <button data-toggle={id} onClick={() => setOn(!on)}>{label}: {on ? "on" : "off"}</button>
}

function OwnedCounter() {
  const [count, setCount] = useState(0)
  return <button data-owned onClick={() => setCount(count + 1)}>Owned: {count}</button>
}

export default function Page() {
  const [shown, setShown] = useState(false)
  return <main>
    <button data-action="show" onClick={() => setShown(true)}>Show</button>
    <button data-action="hide" onClick={() => setShown(false)}>Hide</button>
    <Toggle id="local-a" label="Local A" />
    <Toggle id="local-b" label="Local B" />
    <ImportedToggle id="imported-a" label="Imported A" />
    <ImportedToggle id="imported-b" label="Imported B" />
    {shown && <OwnedCounter />}
  </main>
}
