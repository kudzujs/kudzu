import { useState } from "@kudzujs/core"

export default function Page() {
  const [items, setItems] = useState([{ id: "a", label: "Alpha" }])
  const sortedItems = items.sort((left, right) => left.label.localeCompare(right.label))

  return <main>
    <button onClick={() => setItems(items)}>Reset</button>
    <ul>{sortedItems.map(item => <li key={item.id}>{item.label}</li>)}</ul>
  </main>
}
