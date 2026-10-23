import { useState } from "@kudzujs/core"

function Row({ item }: { item: { id: number; label: string } }) {
  const [count, setCount] = useState(0)
  return <li><span>{item.label}</span><button onClick={() => setCount(count + 1)}>{count}</button></li>
}

export default function PendingListSource() {
  const [data, setData] = useState({ items: [{ id: 1, label: "First" }] })
  const [visible, setVisible] = useState(true)
  return <main>
    <button data-toggle onClick={() => setVisible(!visible)}>Toggle rows</button>
    <button data-update onClick={() => setData({ items: [{ id: 1, label: "Updated" }] })}>Update rows</button>
    {visible && <ul>{data.items.map(item => <Row key={item.id} item={item} />)}</ul>}
  </main>
}
