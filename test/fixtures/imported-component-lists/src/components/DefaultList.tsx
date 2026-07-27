type Item = { id: number; name: string }

export default function DefaultList({ items }: { items: Item[] }) {
  return <ul data-default-list>{items.map(item => <li key={item.id} data-item={item.id} aria-label={item.name.toUpperCase()}>{item.name}</li>)}</ul>
}
