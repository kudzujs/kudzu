import { useState } from "@kudzujs/core"

export default function InvalidTableListPage() {
  const [items, setItems] = useState([{ id: 1 }])
  const [open, setOpen] = useState(true)
  void setItems
  void setOpen
  return <table>{open && <>{items.map(item => <tr key={item.id}><td>{item.id}</td></tr>)}</>}</table>
}
