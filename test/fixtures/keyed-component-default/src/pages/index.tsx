import { useState } from "react"

type Item = { id: number; name: string }

type RowProps = {
  item: Item
  tone?: string
  suffix?: string | null
  style?: { color: string; opacity: number }
  tags?: string[]
  className?: string
  "data-kind"?: string
  "aria-label"?: string
  onClick?: () => void
}

function Row({ item, tone = "quiet", suffix = null, style = { color: "forestgreen", opacity: 0.8 }, tags = ["static", "typed"], ...rest }: RowProps) {
  return <li data-id={item.id} data-kind="root" {...rest} data-tone={tone} title="row" style={style}>{item.name}{suffix}<small>{tags.join(" / ")}</small></li>
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Oak" }])
  const rowProps = { className: "tree", "data-kind": "default", "aria-label": "Tree row", onClick: () => setItems(items) }
  return <ul>{items.map(item => <Row key={item.id} item={item} {...rowProps} />)}</ul>
}
