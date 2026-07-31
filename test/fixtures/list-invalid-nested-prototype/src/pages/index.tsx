import { useState } from "@kudzujs/core"

type Child = { id: number }
type Item = { id: number; constructor: Child[] }

export default function InvalidNestedPrototypePage() {
  const [items, setItems] = useState<Item[]>([{ id: 1, constructor: [] }])
  return <main>{items.map(item => <section key={item.id}>
    {item.constructor.map(child => <span key={child.id}>{child.id}</span>)}
  </section>)}</main>
}
