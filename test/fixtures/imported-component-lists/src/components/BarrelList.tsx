type Item = { id: number; name: string }

export function BarrelList({ items }: { items: Item[] }) {
  return <div data-barrel-list>{items.map(item => <p key={item.id} data-item={item.id}>{item.name}</p>)}</div>
}
