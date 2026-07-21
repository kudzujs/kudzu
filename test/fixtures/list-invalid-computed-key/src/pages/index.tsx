import { useState } from "@kudzujs/core"

type Item = { id: number; field: string; name: string; [key: string]: string | number }

export default function InvalidListComputedKeyPage() {
  const [items, setItems] = useState<Item[]>([{ id: 1, field: "name", name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{item[item.field]}</li>)}</ul>
}
