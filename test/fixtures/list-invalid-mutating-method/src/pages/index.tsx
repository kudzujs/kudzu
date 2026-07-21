import { useState } from "@kudzujs/core"

export default function InvalidListMutatingMethodPage() {
  const [items, setItems] = useState([{ id: 1, tags: ["oak", "tree"] }])
  return <ul>{items.map(item => <li key={item.id}>{item.tags.sort().join(",")}</li>)}</ul>
}
