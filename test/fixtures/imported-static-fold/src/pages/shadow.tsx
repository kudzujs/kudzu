import { items } from "../items"

function Shadowed({ items }: { items: Array<{ id: string; label: string }> }) {
  return <ul>{items.map(item => <li key={item.id}>{item.label}</li>)}</ul>
}

export default function Page() {
  return <Shadowed items={[{ id: "g", label: "Gamma" }]} />
}
