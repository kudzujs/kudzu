import { useMemo, useState } from "react"
import { products } from "../catalog"

export default function Page() {
  const [category] = useState("All")
  const visible = useMemo(() => products.filter(product => product.category === category), [])
  return <ul>{visible.map(product => <li key={product.id}>{product.id}</li>)}</ul>
}
