import { useRef, useState } from "@kudzujs/core"

function Row({ item }: { item: { id: string } }) {
  const inputRef = useRef<HTMLInputElement>(item as unknown as null)
  return <input ref={inputRef} />
}

export default function Page() {
  const [items, setItems] = useState([{ id: "a" }])
  return <main>{items.map(item => <Row key={item.id} item={item} />)}</main>
}
