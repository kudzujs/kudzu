import { useState } from "@kudzujs/core"

const visible = (item: { visible: boolean }) => item.visible

export default function InvalidRenderedCollectionsPage() {
  const [items, setItems] = useState([{ id: "a", visible: true }])
  return <main>{items.filter(visible).map(item => <span key={item.id}>{item.id}</span>)}</main>
}
