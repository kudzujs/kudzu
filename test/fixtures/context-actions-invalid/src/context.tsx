import { createContext, useContext, useState } from "@kudzujs/core"

type Value = {
  count: number
  setCount: (value: number) => void
  increment: () => void
}

const incrementBy = 1
export const CounterContext = createContext<Value>({} as Value)

export function CounterProvider({ children }: { children: unknown }) {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + incrementBy)
  return <CounterContext.Provider value={{ count, setCount, increment }}>{children}</CounterContext.Provider>
}

export function useCounter() {
  return useContext(CounterContext)
}
