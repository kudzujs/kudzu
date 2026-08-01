import { useState } from "@kudzujs/core"

function Row({ name, ...rest }: { name: string }) {
  return <li>{name}{Object.keys(rest).length}</li>
}

export default function InvalidListPage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} name={item.name} />)}</ul>
}
