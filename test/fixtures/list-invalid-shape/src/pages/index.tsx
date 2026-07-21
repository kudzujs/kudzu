import { useState } from "@kudzujs/core"

export default function InvalidListPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{item.name.toUpperCase()}</li>)}</ul>
}
