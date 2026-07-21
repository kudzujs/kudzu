import { useState } from "@kudzujs/core"

export default function DuplicateListPage() {
  const [items, setItems] = useState([{ id: "same", name: "Oak" }, { id: "same", name: "Pine" }])
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}
