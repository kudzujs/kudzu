import { CounterProvider, useCounter } from "../context"

function Counter() {
  const { count, increment } = useCounter()
  return <button onClick={() => increment()}>{count}</button>
}

export default function Page() {
  return <CounterProvider><Counter /></CounterProvider>
}
