import { useEffect, useState } from "@kudzujs/core"

function Row({ item, version }: { item: { id: number; name: string }; version: number }) {
  useEffect(() => {
    document.body.dataset.stateOnly = `${item.name}:${version}`
  }, [version])
  return <li>{item.name}</li>
}

export default function Page() {
  const [version, setVersion] = useState(0)
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  return <ul>{items.map(item => <Row key={item.id} item={item} version={version} />)}</ul>
}
