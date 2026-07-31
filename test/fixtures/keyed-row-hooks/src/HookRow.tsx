import { useEffect, useRef, useState } from "@kudzujs/core"

type Item = { id: string; owner: string; label: string }

export default function HookRow({ item, site }: { item: Item; site: string }) {
  const [count, setCount] = useState(0)
  const [meta, setMeta] = useState({ updates: 0 })
  const [labels, setLabels] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const entry = `${site}:${item.owner}:${item.id}:${item.label}:${count}`
    document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|mount:${entry}`
    inputRef.current?.setAttribute("data-effect-count", String(count))
    return () => {
      document.body.dataset.effectLog = `${document.body.dataset.effectLog ?? ""}|cleanup:${entry}`
    }
  }, [count, item.label])

  return <li data-row={`${site}:${item.owner}:${item.id}`}>
    <span data-label>{item.label}</span>
    <span data-count>{count}</span>
    <span data-meta>{meta.updates}</span>
    <span data-label-count>{labels.length}</span>
    <input ref={inputRef} data-input={`${site}:${item.owner}:${item.id}`} />
    <button data-increment onClick={() => {
      setCount(count + 1)
      setMeta({ updates: meta.updates + 1 })
      setLabels([...labels, item.label])
    }}>Increment</button>
    <button data-focus onClick={() => {
      inputRef.current?.focus()
      document.body.dataset.refRead = inputRef.current?.dataset.input ?? "null"
    }}>Focus</button>
  </li>
}
