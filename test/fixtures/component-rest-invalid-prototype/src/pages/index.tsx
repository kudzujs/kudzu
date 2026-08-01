import { useState } from "@kudzujs/core"

type Item = { id: number; name: string }

function Row({ item, ...rest }: { item: Item; constructor?: string }) {
  return <li {...rest}>{item.name}</li>
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} constructor="unsafe" />)}</ul>
}
