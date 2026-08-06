import { createContext, useContext, useState } from "@kudzujs/core"

type Value = { increment: () => void }

export const CounterContext = createContext<Value>({ increment: () => {} })

export function CounterProvider({ children }: { children: unknown }) {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  return <CounterContext.Provider value={{ increment }}>{children}</CounterContext.Provider>
}

export function useCounter() {
  return useContext(CounterContext)
}
