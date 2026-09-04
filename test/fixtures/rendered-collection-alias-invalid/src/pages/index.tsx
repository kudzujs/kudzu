import { useState } from "@kudzujs/core"

export default function Page() {
  const [items, setItems] = useState([{ id: "a", visible: true }])
  const visible = items.filter(item => item.visible)

  return <main>
    <button onClick={() => setItems(items)}>Reset</button>
    <p>{visible.join(",")}</p>
    <ul>{visible.map(item => <li key={item.id}>{item.id}</li>)}</ul>
  </main>
}
