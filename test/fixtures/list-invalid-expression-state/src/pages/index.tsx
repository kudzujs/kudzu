import { useState } from "@kudzujs/core"

export default function InvalidListExpressionStatePage() {
  const [items, setItems] = useState([{ id: "a" }])
  const [selected, setSelected] = useState(["a"])

  return <ul>{items.map(item => <li key={item.id} aria-current={selected.includes(item.id) ? "true" : "false"}>{item.id}</li>)}</ul>
}
