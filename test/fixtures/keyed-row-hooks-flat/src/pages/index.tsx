import { useState } from "@kudzujs/core"

type Item = { id: string; label: string }

function Row({ item }: { item: Item }) {
  const [saved, setSaved] = useState(false)
  return <li data-row={item.id}>
    <span>{item.label}</span>
    <button data-toggle aria-pressed={saved} onClick={() => setSaved(value => !value)}><span data-status>{saved ? "Saved" : "Save"}</span></button>
  </li>
}

export default function FlatRowHooksPage() {
  const [items, setItems] = useState<Item[]>([{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }])
  return <main>
    <button data-remove onClick={() => setItems([])}>Remove</button>
    <button data-readd onClick={() => setItems([{ id: "c", label: "Cedar" }])}>Readd</button>
    <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
  </main>
}
