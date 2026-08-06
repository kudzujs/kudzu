import { useState } from "@kudzujs/core"

export default function InvalidConditionalMapIndexPage() {
  const [items, setItems] = useState([{ id: "a", visible: true }])
  return <ul>{items.map((item, index) => item.visible && <li key={item.id}>{index}</li>)}</ul>
}
