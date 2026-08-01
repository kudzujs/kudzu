import { useState } from "react"

type Item = { id: number; name: string }

function Row({ item, tone = "quiet", suffix = null }: { item: Item; tone?: string; suffix?: string | null }) {
  return <li data-id={item.id} data-tone={tone}>{item.name}{suffix}</li>
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} />)}</ul>
}
