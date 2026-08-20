import { useMemo as memo, useState } from "react"
import { products } from "../catalog"

export default function Page() {
  const [category, setCategory] = useState("All")
  const visible = memo(() => products.filter(product => category === "All" || product.category === category), [category])

  return <main>
    <button data-category="all" onClick={() => setCategory("All")}>All</button>
    <button data-category="field" onClick={() => setCategory("Field")}>Field</button>
    <ul data-products>{visible.map(product => <li key={product.id} data-product={product.id}>{product.name}</li>)}</ul>
  </main>
}
