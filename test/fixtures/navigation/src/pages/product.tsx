import { useEffect, useRef, useState } from "@kudzujs/core"
import { Shell } from "../Shell"

export const layout = Shell
export const metadata = { title: "Product", description: "Product page" }

function Item({ item }: { item: { id: string; label: string } }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement | null>(null)

  return <li data-item={item.id}>
    <span ref={ref} data-row-count>{count}</span>
    <button data-row-late onClick={async () => {
      await new Promise<void>(resolve => {
        const resolvers = (document.body as any).nativeRowResolvers ?? []
        resolvers.push(resolve)
        ;(document.body as any).nativeRowResolvers = resolvers
      })
      ref.current?.setAttribute("data-resolved", "true")
      setCount(count + 1)
    }}>{item.label}</button>
  </li>
}

export default function Product() {
  const [routeCount, setRouteCount] = useState(0)
  const [items, setItems] = useState([{ id: "vine", label: "Vine" }])
  const [result, setResult] = useState("pending")
  const routeRef = useRef<HTMLSpanElement | null>(null)

  async function updateRouteLate() {
    await new Promise<void>(resolve => {
      const resolvers = (document.body as any).nativeRouteResolvers ?? []
      resolvers.push(resolve)
      ;(document.body as any).nativeRouteResolvers = resolvers
    })
    routeRef.current?.setAttribute("data-resolved", "true")
    setRouteCount(value => value + 1)
  }

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
    <button data-route-late onClick={updateRouteLate}>Late route</button>
    <span ref={routeRef} data-route-ref />
    <button data-native onClick={() => setItems([...items, { id: "oak", label: "Oak" }])}>Add native</button>
    <button data-remove-native-row onClick={() => setItems(items.filter(item => item.id !== "vine"))}>Remove native row</button>
    <button data-restore-native-row onClick={() => setItems([{ id: "vine", label: "Vine" }, ...items])}>Restore native row</button>
    <p data-product-result>{result}</p>
    {routeCount > 0 && <p data-positive>Positive</p>}
    <ul>{items.map(item => <Item key={item.id} item={item} />)}</ul>
    <a data-product-query href="/shop/cart?coupon=leaf#summary">Cart query</a>
    <a data-hash-only href="/shop/product?view=full#other">Hash only</a>
  </main>
}
