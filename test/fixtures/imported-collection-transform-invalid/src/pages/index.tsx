import { useState } from "@kudzujs/core"
import { selectVisible } from "../selectVisible"

export default function Page() {
  const [items, setItems] = useState([{ id: "a", visible: true }])
  const visible = selectVisible(items)

  return <main>
    <button onClick={() => setItems(items)}>Reset</button>
    <ul>{visible.map(item => <li key={item.id}>{item.id}</li>)}</ul>
  </main>
}
