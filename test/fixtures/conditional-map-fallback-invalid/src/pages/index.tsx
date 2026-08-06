import { useState } from "@kudzujs/core"

export default function InvalidConditionalMapFallbackPage() {
  const [items, setItems] = useState([{ id: "a", visible: true }])
  return <ul>{items.map(item => item.visible ? <li key={item.id}>{item.id}</li> : <li key={item.id}>Hidden</li>)}</ul>
}
