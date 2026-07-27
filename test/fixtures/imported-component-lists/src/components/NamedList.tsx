type Item = { id: number; name: string }

export function NamedList({ items }: { items: Item[] }) {
  return <ol data-named-list>{items.map(item => <li key={item.id} data-item={item.id}>{item.name}</li>)}</ol>
}
