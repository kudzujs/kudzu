import { statusLabel } from "./label"

type Item = { id: string; title: string; available: boolean }

export default function ImportedItem({ item, onSelect, onStatus }: { item: Item; onSelect: () => void; onStatus: (label: string) => void }) {
  const label = item.title.toUpperCase()
  return <li data-imported-item={item.id}>
    <span data-label>{label}</span>
    {item.available ? <button data-status onClick={() => onStatus(statusLabel(item.title))}>Available</button> : <button data-status onClick={() => onStatus(statusLabel(item.title))}>Unavailable</button>}
    <button data-select onClick={() => onSelect()}>Select</button>
  </li>
}
