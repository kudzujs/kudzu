import { useEffect, useRef, useState } from "@kudzujs/core"

type Item = { id: string; label: string; visible: boolean; featured: boolean }

function ItemStatus({ item }: { item: Item }) {
  return <span data-status>{item.featured ? <b data-featured>{item.label && <button data-latest onClick={() => { document.body.dataset.latest = item.label }}>{item.label}</button>}</b> : <i>Standard</i>}</span>
}

export default function ItemRow({ item }: { item: Item }) {
  const [count, setCount] = useState(0)
  const [meta, setMeta] = useState({ changes: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const entry = `${item.id}:${item.label}:${count}`
    document.body.dataset.effects = `${document.body.dataset.effects ?? ""}|mount:${entry}`
    inputRef.current?.setAttribute("data-effect-count", String(count))
    return () => {
      document.body.dataset.effects = `${document.body.dataset.effects ?? ""}|cleanup:${entry}`
    }
  }, [count, item.label])

  return <li data-item={item.id}>
    <span data-label>{item.label}</span>
    <span data-count>{count}</span>
    <span data-changes>{meta.changes}</span>
    <input ref={inputRef} data-input={item.id} />
    <button data-increment onClick={() => {
      setCount(count + 1)
      setMeta({ changes: meta.changes + 1 })
    }}>Increment</button>
    <button data-focus onClick={() => {
      inputRef.current?.focus()
      document.body.dataset.ref = inputRef.current?.dataset.input ?? "null"
    }}>Focus</button>
    {item.visible && <ItemStatus item={item} />}
  </li>
}
