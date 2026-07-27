import { useState } from "@kudzujs/core"
import ItemRow from "../ItemRow"

type Item = { id: number; name: string }

function ItemList({ items }: { items: Item[] }) {
  return <ul data-component-list>
    {items.map(item => <ItemRow key={item.id} item={item} />)}
  </ul>
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: "Oak" },
    { id: 2, name: "Pine" },
  ])

  return <main>
    <button data-action="add" onClick={() => setItems([...items, { id: 3, name: "Elm" }])}>Add</button>
    <button data-action="rename" onClick={() => setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak" } : item))}>Rename</button>
    <button data-action="reorder" onClick={() => setItems([...items].reverse())}>Reorder</button>
    <button data-action="remove" onClick={() => setItems(items.filter(item => item.id !== 2))}>Remove</button>
    <ItemList items={items} />
  </main>
}
