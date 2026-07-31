import { useState } from "@kudzujs/core"

function Row({ item }: { item: { id: string } }) {
  const [count, setCount] = useState(() => 0)
  return <p>{count}</p>
}

export default function Page() {
  const [items, setItems] = useState([{ id: "a" }])
  return <main>{items.map(item => <Row key={item.id} item={item} />)}</main>
}
