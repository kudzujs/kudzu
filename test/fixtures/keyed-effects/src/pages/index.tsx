import { useState } from "@kudzujs/core"
import EffectRow from "../EffectRow"

type Item = { id: number; name: string; detail: string }

export default function Page() {
  const [open, setOpen] = useState(true)
  const [version, setVersion] = useState(0)
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak", detail: "old" }, { id: 2, name: "Pine", detail: "old" }])
  const [result, setResult] = useState("pending")

  return <main>
    <button data-action="add" onClick={() => setItems([...items, { id: 3, name: "Elm", detail: "old" }])}>Add</button>
    <button data-action="reorder" onClick={() => setItems([...items].reverse())}>Reorder</button>
    <button data-action="update" onClick={() => {
      setItems(items.map(item => item.id === 1 ? { ...item, name: "Red oak", detail: "latest" } : item))
    }}>Update</button>
    <button data-action="unrelated" onClick={() => setItems(items.map(item => item.id === 1 ? { ...item, detail: "unrelated" } : item))}>Unrelated</button>
    <button data-action="invalid" onClick={() => setItems(items.map(item => item.id === 1 ? { ...item, name: { invalid: true } as any } : item))}>Invalid</button>
    <button data-action="version" onClick={() => setVersion(version + 1)}>Version</button>
    <button data-action="mixed" onClick={() => {
      setItems(items.map(item => item.id === 2 ? { ...item, name: "White pine" } : item))
      setVersion(version + 1)
    }}>Mixed</button>
    <button data-action="remove-two" onClick={() => setItems(items.filter(item => item.id !== 2))}>Remove two</button>
    <button data-action="remove-three" onClick={() => setItems(items.filter(item => item.id !== 3))}>Remove three</button>
    <button data-action="close" onClick={() => setOpen(false)}>Close</button>
    <button data-action="open" onClick={() => setOpen(true)}>Open</button>
    <p data-result>{result}</p>
    {open && <ul>{items.map(item => <EffectRow key={item.id} item={item} version={version} setResult={setResult} />)}</ul>}
  </main>
}
