import { createContext, useContext, useState } from "@kudzujs/core"

type Value = { setCount: (value: number) => void; increment: () => void }

export const CounterContext = createContext<Value>({ setCount: () => {}, increment: () => {} })

export function CounterProvider({ children }: { children: unknown }) {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  return <CounterContext.Provider value={{ setCount, increment }}>{children}</CounterContext.Provider>
}

export function useCounter() {
  return useContext(CounterContext)
}
