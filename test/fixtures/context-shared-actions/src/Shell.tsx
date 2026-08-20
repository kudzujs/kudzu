import { type ReactNode, useEffect } from "react"
import { CartProvider } from "./cart"
import { useCart } from "./useCart"

function CartHeader({ children }: { children?: ReactNode }) {
  const { quantities } = useCart()
  const oakQuantity = quantities.oak ?? 0
  useEffect(() => {
    document.body.dataset.quantityLog = `${document.body.dataset.quantityLog ?? ""}|${oakQuantity}`
    return () => {
      document.body.dataset.quantityCleanup = `${document.body.dataset.quantityCleanup ?? ""}|${oakQuantity}`
    }
  }, [oakQuantity])
  return <><header data-cart-header><a href="/">Product</a><a href="/cart">Cart</a><output data-cart-count>{quantities.oak ?? 0}</output></header>{children}</>
}

export function Shell({ children }: { children?: ReactNode }) {
  return <CartProvider><CartHeader>{children}</CartHeader></CartProvider>
}
