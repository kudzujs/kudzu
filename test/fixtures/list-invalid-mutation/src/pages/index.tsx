import { useState } from "@kudzujs/core"

export default function InvalidListMutationPage() {
  const [items, setItems] = useState([{ id: 1 }])
  return <ul>{items.map(item => <li key={item.id}>{item.id++}</li>)}</ul>
}
