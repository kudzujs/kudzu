import { createContext, useState } from "@kudzujs/core"

type CartValue = {
  quantities: Record<string, number>
  add: (id: string) => void
  remove: (id: string) => void
}

export const CartContext = createContext<CartValue>({} as CartValue)

export function CartProvider({ children }: { children: unknown }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const add = (id: string) => setQuantities({ ...quantities, [id]: (quantities[id] ?? 0) + 1 })
  const remove = (id: string) => {
    const next = { ...quantities }
    delete next[id]
    setQuantities(next)
  }

  return <CartContext.Provider value={{ quantities, add, remove }}>{children}</CartContext.Provider>
}
