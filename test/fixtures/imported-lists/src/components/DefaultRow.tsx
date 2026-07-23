type Props = { item: { id: number; name: string }; onRemove: () => void }

export default function DefaultRow({ item, onRemove }: Props) {
  const label = item.name.toUpperCase()
  return <li data-default={item.id}>{label}<button onClick={onRemove}>Remove</button></li>
}
