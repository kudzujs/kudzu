import { useState } from "@kudzujs/core"
import { useCart } from "../store"

function Row({ item }: { item: { id: string } }) {
  const quantities = useCart(state => state.quantities)
  return <li>{item.id}: {quantities.oak ?? 0}</li>
}

export default function Page() {
  const [items, setItems] = useState([{ id: "oak" }])
  return <><button onClick={() => setItems([...items, { id: "pine" }])}>Add</button><ul>{items.map(item => <Row key={item.id} item={item} />)}</ul></>
}
