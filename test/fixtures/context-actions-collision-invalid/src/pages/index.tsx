import { CounterProvider, useCounter } from "../context"

function Counter() {
  const { increment } = useCounter()
  const setCount = "consumer binding"
  return <button aria-label={setCount} onClick={increment}>Increment</button>
}

export default function Page() {
  return <CounterProvider><Counter /></CounterProvider>
}
