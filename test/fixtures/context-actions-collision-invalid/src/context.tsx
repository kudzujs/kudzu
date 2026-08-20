import { createContext, useContext, useState } from "@kudzujs/core"

type Value = { count: number; setCount: (value: number) => void; increment: () => void; toggle: () => void; ping: () => void }

export const CounterContext = createContext<Value>({} as Value)

export function CounterProvider({ children }: { children: unknown }) {
  const [count, setCount] = useState(0)
  const increment = () => setCount(count + 1)
  const toggle = () => setCount(count ? 0 : 1)
  const ping = () => console.log("ping")
  return <CounterContext.Provider value={{ count, setCount, increment, toggle, ping }}>{children}</CounterContext.Provider>
}

export function useCounter() {
  return useContext(CounterContext)
}
