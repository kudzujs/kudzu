import { create } from "zustand"

type CartState = { quantities: Record<string, number>, add: (id: string) => void }

export const useCart = create<CartState>(set => ({
  quantities: {},
  add: (id: string) => set(state => ({ quantities: { ...state.quantities, [id]: 1 } })),
}))
