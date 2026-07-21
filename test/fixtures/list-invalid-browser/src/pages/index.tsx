import { useState } from "@kudzujs/core"

export default function InvalidListBrowserPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{item.name + window.location.href}</li>)}</ul>
}
