export function NamedRow({ item }: { item: { id: number; name: string } }) {
  return <li data-named={item.id}>{item.name}</li>
}
