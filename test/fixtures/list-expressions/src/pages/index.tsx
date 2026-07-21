import { useState } from "@kudzujs/core"

export default function ListExpressionsPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak", done: false }])
  return <ul>{items.map(item => <li key={item.id} className={item.done ? "done" : "active"}>{item.name[0] + item.name.slice(1).toUpperCase()}</li>)}</ul>
}
