import { useState } from "react"
import { Dropdown, type Item } from "../Dropdown"

export default function Page() {
  const [selectedItems, setSelectedItems] = useState<Item[]>([{ id: 1, label: "Solar" }])
  return <main>
    <button id="reset" onClick={() => setSelectedItems([{ id: 3, label: "Hydro" }])}>Reset</button>
    <ul id="selected">{selectedItems.map(item => <li key={item.id}>{item.label}</li>)}</ul>
    <Dropdown selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
  </main>
}
