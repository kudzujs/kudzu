import { createContext, useContext, useState } from "@kudzujs/core"

type Value = { count: number; increment: () => void }

export const CounterContext = createContext<Value>({} as Value)

export function CounterProvider({ children }: { children: unknown }) {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  return <><CounterContext.Provider value={{ count, increment }}>{children}</CounterContext.Provider><CounterContext.Provider value={{ count, increment }}>{children}</CounterContext.Provider></>
}

export function useCounter() {
  return useContext(CounterContext)
}
