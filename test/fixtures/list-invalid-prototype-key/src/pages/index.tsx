import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; [key: string]: unknown }

export default function InvalidListPrototypeKeyPage() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{item["__proto__"]}</li>)}</ul>
}
