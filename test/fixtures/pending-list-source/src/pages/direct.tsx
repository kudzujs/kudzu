import { useState } from "@kudzujs/core"

export default function DelayedArrayList() {
  const [items, setItems] = useState([{ id: 1, label: "Initial" }])
  return <main>
    <button data-first onClick={() => setItems([{ id: 1, label: "First update" }])}>First update</button>
    <button data-second onClick={() => setItems([{ id: 1, label: "Second update" }])}>Second update</button>
    <ul>{items.map(item => <li key={item.id} title={item.label}>
      <span>{item.label}</span><input aria-label="Row note" />
    </li>)}</ul>
  </main>
}
