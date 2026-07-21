import { useState } from "@kudzujs/core"

export default function InvalidNestedListPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{items.map(entry => <span key={entry.id}>{entry.name}</span>)}</li>)}</ul>
}
