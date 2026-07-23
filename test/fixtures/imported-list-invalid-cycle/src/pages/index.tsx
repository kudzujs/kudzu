import { useState } from "@kudzujs/core"
import { Row } from "../components/a"

export default function Page() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
}
