import { useState } from "@kudzujs/core"

export default function InvalidListPromisePage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <li key={item.id}>{Promise.resolve(item.name)}</li>)}</ul>
}
