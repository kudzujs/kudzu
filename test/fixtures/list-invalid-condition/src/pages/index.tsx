import { useState } from "@kudzujs/core"

export default function InvalidListConditionPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  const [open, setOpen] = useState(true)
  return <ul>{items.map(item => <li key={item.id}>{open && <span>Open</span>}</li>)}</ul>
}
