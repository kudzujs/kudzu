import { useState } from "@kudzujs/core"
import DefaultList from "../components/DefaultList"
import { NamedList as AliasedList } from "../components/NamedList"
import { ReExportedList } from "../components"

export default function Page() {
  const [items, setItems] = useState([
    { id: 1, name: "Oak" },
    { id: 2, name: "Pine" },
  ])

  return <main>
    <button data-action="add" onClick={() => setItems([...items, { id: 3, name: "Elm" }])}>Add</button>
    <button data-action="rename" onClick={() => setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak" } : item))}>Rename</button>
    <button data-action="reorder" onClick={() => setItems([...items].reverse())}>Reorder</button>
    <button data-action="remove" onClick={() => setItems(items.filter(item => item.id !== 2))}>Remove</button>
    <DefaultList items={items} />
    <AliasedList items={items} />
    <ReExportedList items={items} />
  </main>
}
