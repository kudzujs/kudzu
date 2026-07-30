import { statusLabel } from "./label"

type Item = { id: string; title: string; available: boolean }

export default function ImportedItem({ item, onSelect, onStatus }: { item: Item; onSelect: () => void; onStatus: (label: string) => void }) {
  const label = item.title.toUpperCase()
  return <li data-imported-item={item.id} title={item.title}>
    <span data-direct>{item.title}</span>
    <p data-range>{item.id}: {item.title}</p>
    <span data-label>{label}</span>
    {item.available ? <button data-status title={item.title} onClick={() => onStatus(statusLabel(item.title))}><span data-branch>{item.title}</span>Available</button> : <button data-status title={item.title} onClick={() => onStatus(statusLabel(item.title))}><span data-branch>{item.title}</span>Unavailable</button>}
    <button data-select onClick={() => onSelect()}>Select</button>
  </li>
}
