import { useState } from "@kudzujs/core"

export default function Page() {
  const [items, setItems] = useState([{ id: "a", label: "Alpha" }])
  return <main>
    <button onClick={() => setItems([...items, { id: "b", label: "Beta" }])}>Add</button>
    <ul>{items.map(item => <li key={item.id}>{item.label}</li>)}</ul>
  </main>
}
