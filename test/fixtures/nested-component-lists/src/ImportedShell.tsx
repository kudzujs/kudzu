import { useEffect, useRef, useState } from "@kudzujs/core"
import { statusLabel } from "./label"

type Item = { id: string; title: string; available: boolean; featured: boolean }

function ImportedStatus({ item, onStatus }: { item: Item; onStatus: (label: string) => void }) {
  const [count, setCount] = useState(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    buttonRef.current?.setAttribute("data-effect", `${statusLabel(item.title)}:${count}`)
  }, [count, item.title])
  return <button ref={buttonRef} data-status title={item.title} onClick={() => {
    setCount(count + 1)
    onStatus(statusLabel(item.title))
  }}><span data-branch>{item.title}</span><span data-count>{count}</span>{item.available ? "Available" : "Unavailable"}</button>
}

export default function ImportedShell({ item, onSelect, onStatus }: { item: Item; onSelect: () => void; onStatus: (label: string) => void }) {
  const label = item.title.toUpperCase()
  return <li data-imported-item={item.id} title={item.title}>
    <span data-direct>{item.title}</span>
    <p data-range>{item.id}: {item.title}</p>
    <span data-label>{label}</span>
    <ImportedStatus item={item} onStatus={onStatus} />
    <button data-select onClick={() => onSelect()}>Select</button>
  </li>
}
