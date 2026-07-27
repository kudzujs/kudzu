import { useState } from "@kudzujs/core"

function ItemList({ items }: { items: { id: number; name: string }[] }) {
  return <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
}

export default function Page() {
  const [items, _setItems] = useState([{ id: 1, name: "Oak" }])
  return <main>
    <ItemList items={items} />
    <ItemList items={[{ id: 2, name: "Pine" }]} />
  </main>
}
