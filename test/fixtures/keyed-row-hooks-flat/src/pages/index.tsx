import { useState } from "@kudzujs/core"

type Item = { id: string; label: string }

function Row({ item }: { item: Item }) {
  const [count, setCount] = useState(0)
  return <li data-row={item.id}>
    <span data-count>{count}</span>
    <button data-increment onClick={() => setCount(count + 1)}>{item.label}</button>
  </li>
}

export default function FlatRowHooksPage() {
  const [items, setItems] = useState<Item[]>([{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
}
