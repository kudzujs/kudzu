import { useState } from "@kudzujs/core"

export default function InvalidListStylePage() {
  const [items, setItems] = useState([{ id: 1, color: "green" }])
  return <ul>{items.map(item => <li key={item.id} style={item.color.toUpperCase()}>Oak</li>)}</ul>
}
