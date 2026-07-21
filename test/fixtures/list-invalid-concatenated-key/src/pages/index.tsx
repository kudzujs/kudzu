import { useState } from "@kudzujs/core"

type Item = { id: number; name: string; [key: string]: string | number }

export default function InvalidListConcatenatedKeyPage() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{item["na" + "me"]}</li>)}</ul>
}
