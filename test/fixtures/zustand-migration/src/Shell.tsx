import { type ReactNode, useEffect } from "react"
import { useCart } from "./store"

export function Shell({ children }: { children?: ReactNode }) {
  const quantities = useCart(state => state.quantities)
  const oakQuantity = quantities.oak ?? 0
  useEffect(() => {
    document.body.dataset.quantityLog = `${document.body.dataset.quantityLog ?? ""}|${oakQuantity}`
  }, [oakQuantity])
  return <><header data-cart-header><a href="/">Product</a><a href="/cart">Cart</a><output data-cart-count>{quantities.oak ?? 0}</output></header>{children}</>
}
