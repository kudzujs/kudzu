import { useState } from "@kudzujs/core"

type Item = { id: string }

function First({ item }: { item: Item }) {
  return <Second item={item} />
}

function Second({ item }: { item: Item }) {
  return <First item={item} />
}

export default function InvalidComponentCyclePage() {
  const [items, setItems] = useState<Item[]>([{ id: "a" }])
  return <main>{items.map(item => <First key={item.id} item={item} />)}</main>
}
