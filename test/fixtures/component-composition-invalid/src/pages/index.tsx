import { useState } from "@kudzujs/core"

type Item = { id: number; name: string }

function ItemList({ items, heading }: { items: Item[]; heading: string }) {
  return <section><h1>{heading}</h1><ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul></section>
}

function getProps() {
  return { heading: "Dynamic" }
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "One" }])
  const props = getProps()
  return <><button onClick={() => setItems(items)}>Keep</button><ItemList items={items} {...props} /></>
}
