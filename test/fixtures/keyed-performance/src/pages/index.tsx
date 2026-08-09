import { useState } from "@kudzujs/core"

type Item = { id: number; label: string }

const initialItems: Item[] = Array.from({ length: 2000 }, (_, index) => ({ id: index + 1, label: `Row ${index + 1}` }))

function Row({ item }: { item: Item }) {
  const [selected, setSelected] = useState(false)
  return <li data-row={item.id} data-selected={selected}>
    <span>{item.label}</span>
    <button data-select={item.id} onClick={() => setSelected(value => !value)}>Select</button>
  </li>
}

export default function Page() {
  const [items, setItems] = useState(initialItems)
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(2000)
  const visibleItems = items.slice(0, limit).filter(item => item.label.toLowerCase().includes(query.toLowerCase()))

  return <main>
    <button data-action="trim" onClick={() => setLimit(1967)}>Trim</button>
    <button data-action="append" onClick={() => setLimit(2000)}>Append 33</button>
    <button data-action="filter" onClick={() => setQuery("Row 1000")}>Filter</button>
    <button data-action="restore" onClick={() => setQuery("")}>Restore</button>
    <button data-action="reverse" onClick={() => setItems([...items].reverse())}>Reverse</button>
    <ul data-list>{visibleItems.map(item => <Row key={item.id} item={item} />)}</ul>
  </main>
}
