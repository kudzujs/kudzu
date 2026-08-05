import { items } from "../items"

export default function Page() {
  return <ul>{items.map(item => <li key={item.id}>{item.label}</li>)}</ul>
}
