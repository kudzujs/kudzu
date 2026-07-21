import { useState } from "@kudzujs/core"

export default function InvalidListCapturePage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  const suffix = " tree"
  return <ul>{items.map(item => <li key={item.id}>{[1].map(suffix => suffix)}{item.name + suffix}</li>)}</ul>
}
