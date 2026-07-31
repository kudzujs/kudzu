import ImportedShell from "./ImportedShell"

type Item = { id: string; title: string; available: boolean; featured: boolean }

export default function ImportedItem({ item, onSelect, onStatus }: { item: Item; onSelect: () => void; onStatus: (label: string) => void }) {
  return <ImportedShell item={item} onSelect={onSelect} onStatus={onStatus} />
}
