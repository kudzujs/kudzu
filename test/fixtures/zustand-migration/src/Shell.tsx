import type { ReactNode } from "react"
import { useCart } from "./store"

export function Shell({ children }: { children?: ReactNode }) {
  const quantities = useCart(state => state.quantities)
  return <><header data-cart-header><a href="/">Product</a><a href="/cart">Cart</a><output data-cart-count>{quantities.oak ?? 0}</output></header>{children}</>
}
