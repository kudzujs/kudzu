import { useContext } from "@kudzujs/core"
import { CartContext } from "./cart"

export function useCart() {
  return useContext(CartContext)
}
