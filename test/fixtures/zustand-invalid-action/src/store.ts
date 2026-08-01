import { create } from "zustand"

const increment = 1
type Store = { count: number, add: () => void }

export const useStore = create<Store>(set => ({
  count: 0,
  add: () => set(state => ({ count: state.count + increment })),
}))
