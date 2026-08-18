import { useEffect, useState } from "react"

export type Item = { id: number; label: string }

export function Dropdown({ selectedItems, setSelectedItems }: { selectedItems: Item[]; setSelectedItems: (items: Item[]) => void }) {
  const [items, setItems] = useState(selectedItems)
  useEffect(() => {
    setSelectedItems(items)
  }, [items, setSelectedItems])
  return <button id="add-draft" onClick={() => setItems([{ id: 1, label: "Solar" }, { id: 2, label: "Wind" }])}>Add draft</button>
}
