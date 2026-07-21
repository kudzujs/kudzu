import { useState } from "@kudzujs/core"

export default function InvalidListSpreadPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id} {...item}>{item.name}</li>)}</ul>
}
