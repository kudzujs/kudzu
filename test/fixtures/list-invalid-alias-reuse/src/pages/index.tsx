import { useState } from "@kudzujs/core"

export default function InvalidAliasReusePage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  const rows = items.map(item => <li key={item.id}>{item.name}</li>)
  return <main><ul>{rows}</ul><ol>{rows}</ol></main>
}
