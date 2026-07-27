import { useEffect, useState } from "@kudzujs/core"
import { Shell } from "../Shell"

export const layout = Shell
export const metadata = { title: "Cart", description: "Cart page" }

export default function Cart() {
  const [routeCount, setRouteCount] = useState(0)
  const label = "Cart derived"

  useEffect(() => {
    document.body.dataset.effectLog += "|cart setup"
    return () => {
      document.body.dataset.effectLog += "|cart cleanup"
    }
  }, [])
  return <main data-route="cart">
    <h1 id="summary">Cart</h1>
    <button data-route-count onClick={() => setRouteCount(value => value + 1)}>Route {routeCount}</button>
    <p data-derived>{`${label} ${routeCount}`}</p>
    <a data-product-query href="/shop/product?view=full#details">Product query</a>
  </main>
}
