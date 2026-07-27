import { useEffect, useState } from "@kudzujs/core"
import { Shell } from "../Shell"

export const layout = Shell
export const metadata = { title: "Product", description: "Product page" }

export default function Product() {
  const [routeCount, setRouteCount] = useState(0)
  const [items, setItems] = useState([{ id: "vine", label: "Vine" }])
  const [result, setResult] = useState("pending")

  useEffect(() => {
    const listener = () => {
      document.body.dataset.productEvents = String(Number(document.body.dataset.productEvents ?? 0) + 1)
    }
    globalThis.addEventListener("product-check", listener)
    document.body.dataset.effectLog += "|product setup"
    new Promise<string>(resolve => {
      const resolvers = (document.body as any).productResolvers ?? []
      resolvers.push(resolve)
      ;(document.body as any).productResolvers = resolvers
    }).then(setResult)
    return () => {
      globalThis.removeEventListener("product-check", listener)
      document.body.dataset.effectLog += "|product cleanup"
    }
  }, [])

  useEffect(() => {
    document.body.dataset.effectLog += `|product dependency setup ${routeCount}`
    return () => {
      document.body.dataset.effectLog += `|product dependency cleanup ${routeCount}`
    }
  }, [routeCount])

  return <main data-route="product" data-count={routeCount}>
    <h1 id="details">Product</h1>
    <button data-route-count onClick={() => setRouteCount(value => value + 1)}>Route {routeCount}</button>
    <button data-native onClick={() => setItems([...items, { id: "oak", label: "Oak" }])}>Add native</button>
    <p data-product-result>{result}</p>
    {routeCount > 0 && <p data-positive>Positive</p>}
    <ul>{items.map(item => <li key={item.id}>{item.label}</li>)}</ul>
    <a data-product-query href="/shop/cart?coupon=leaf#summary">Cart query</a>
    <a data-hash-only href="/shop/product?view=full#other">Hash only</a>
  </main>
}
