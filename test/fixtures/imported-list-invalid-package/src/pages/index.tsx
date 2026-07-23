import { useState } from "@kudzujs/core"
// @ts-ignore unsupported package import fixture
import Row from "some-package"

export default function Page() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
}
