import { create } from "zustand"

type CartState = {
  quantities: Record<string, number>
  add: (id: string) => void
  remove: (id: string) => void
}

export const useCart = create<CartState>(set => ({
  quantities: {},
  add: id => set(state => ({ quantities: { ...state.quantities, [id]: (state.quantities[id] ?? 0) + 1 } })),
  remove: id => set(state => {
    const quantities = { ...state.quantities }
    delete quantities[id]
    return { quantities }
  }),
}))
