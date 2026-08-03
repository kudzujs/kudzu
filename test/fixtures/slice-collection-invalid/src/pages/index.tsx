import { useState } from "@kudzujs/core"

function readOffset() {
  return 0
}

export default function Page() {
  const [items, setItems] = useState([{ id: "a" }])
  const pageItems = items.slice(readOffset(), 1)

  return <main>
    <button onClick={() => setItems(items)}>Reset</button>
    <ul>{pageItems.map(item => <li key={item.id}>{item.id}</li>)}</ul>
  </main>
}
