import { useState } from "@kudzujs/core"

export default function InvalidAliasUsePage() {
  const [items, setItems] = useState([{ id: 1, name: "Oak" }])
  const rows = items.map(item => <li key={item.id}>{item.name}</li>)
  console.log(rows)
  return <ul />
}
