import { useState } from "@kudzujs/core"

export default function Page() {
  const [items, setItems] = useState<{ id: string }[]>([])
  const [busy, setBusy] = useState(true)
  const [label, setLabel] = useState("Starting")
  return <main>
    <button data-load onClick={() => { setItems([{ id: "saved" }]); setBusy(false); setLabel("Ready") }}>Load budgets</button>
    <button data-busy onClick={() => { setBusy(true); setLabel("Working") }}>Start work</button>
    <button data-ready onClick={() => { setBusy(false); setLabel("Recovered") }}>Recover</button>
    <button data-refresh onClick={() => { setItems([{ id: "saved" }]); setBusy(true); setLabel("Refreshing") }}>Refresh</button>
    <button data-remove onClick={() => setItems([])}>Remove</button>
    <button data-outer disabled={busy}>Outside list</button>
    <ul>{items.map(item => <li key={item.id} data-row={item.id} className={busy ? "busy" : "ready"} aria-busy={busy ? "true" : "false"}>
      <button data-open disabled={busy}>Open budget</button><span data-label>{label}</span>
    </li>)}</ul>
  </main>
}
