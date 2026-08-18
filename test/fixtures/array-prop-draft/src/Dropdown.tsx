import { useState } from "react"

export type Item = { id: number; label: string }

export function Dropdown({ selectedItems, setSelectedItems }: { selectedItems: Item[]; setSelectedItems: (items: Item[]) => void }) {
  const [items, setItems] = useState(selectedItems)
  return <section id="dropdown">
    <button id="add-draft" onClick={() => setItems([{ id: 1, label: "Solar" }, { id: 2, label: "Wind" }])}>Add draft</button>
    <button id="apply-draft" onClick={() => setSelectedItems(items)}>Apply draft</button>
  </section>
}
