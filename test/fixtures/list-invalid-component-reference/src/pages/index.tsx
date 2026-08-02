import { useState } from "@kudzujs/core"

type Item = { id: number; name: string }

function Row({ item }: { item: Item }) {
  return <li>{item.name}</li>
}

const DynamicRow = Row

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  return <main>
    <DynamicRow item={{ id: 0, name: "Static" }} />
    <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
  </main>
}
