import { useEffect, useState } from "@kudzujs/core"

function Row({ item }: { item: { id: number; name: string } }) {
  useEffect(() => {
    document.body.dataset.name = item.name
  }, [item.name])
  return <li>{item.name}</li>
}

export default function Page() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
}
