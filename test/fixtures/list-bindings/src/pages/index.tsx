import { useState } from "@kudzujs/core"

export default function ListBindingsPage() {
  const [open, setOpen] = useState(true)
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])

  return <main>
    <button data-action="toggle" onClick={() => setOpen(!open)}>Toggle</button>
    <button data-action="add" onClick={() => setItems([...items, { id: 2, name: "Pine" }])}>Add</button>
    {open && <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>}
  </main>
}
