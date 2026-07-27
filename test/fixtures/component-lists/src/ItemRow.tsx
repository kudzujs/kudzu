export default function ItemRow({ item }: { item: { id: number; name: string } }) {
  return <li data-item={item.id}>{item.name}</li>
}
